#!/usr/bin/env python3
"""Build a local men's Division I basketball logo library from ESPN's public logo CDN."""
import json, pathlib, re, sys, time
from concurrent.futures import ThreadPoolExecutor, as_completed
from urllib.request import Request, urlopen
from urllib.error import HTTPError, URLError

ROOT = pathlib.Path(__file__).resolve().parents[1]
ASSET_DIR = ROOT / "assets" / "ncaa"
LOGO_DIR = ASSET_DIR / "logos"
IDS_FILE = ASSET_DIR / "espn_ids.json"
LOGO_DIR.mkdir(parents=True, exist_ok=True)
FALLBACK_SLUGS = {"Fairleigh Dickinson": "fairleigh-dickinson"}

def key(value):
    return re.sub(r"[^a-z0-9]", "", value.lower())

aliases = {
    "Miami": "Miami FL", "Miami Hurricanes": "Miami FL",
    "Miami OH": "Miami OH", "Miami RedHawks": "Miami OH",
    "Michigan St": "Michigan St.", "Michigan State": "Michigan St.",
    "St John's": "St. John's", "Saint John's": "St. John's",
    "NC State": "N.C. State", "North Carolina State": "N.C. State",
    "N Dakota St": "North Dakota St.", "North Dakota State": "North Dakota St.",
    "CA Baptist": "Cal Baptist", "California Baptist": "Cal Baptist",
    "Kennesaw St": "Kennesaw St.", "Wright St": "Wright St.",
    "Tennessee St": "Tennessee St.", "Tennessee State": "Tennessee St.",
    "Hawai'i": "Hawaii", "Hawaii Rainbow Warriors": "Hawaii",
    "Prairie View": "Prairie View A&M", "Long Island": "LIU",
    "Long Island University": "LIU", "UMBC Retrievers": "UMBC",
    "UConn": "Connecticut", "Connecticut Huskies": "Connecticut",
    "Ole Miss": "Mississippi", "Mississippi Rebels": "Mississippi",
    "UIC": "Illinois Chicago", "IU Indianapolis": "IU Indy",
    "Kansas City": "UMKC", "Nebraska Omaha": "Nebraska Omaha",
    "App State": "Appalachian St.", "Appalachian State": "Appalachian St.",
    "McNeese": "McNeese St.", "SIU Edwardsville": "SIU Edwardsville",
    "Grand Canyon Antelopes": "Grand Canyon", "Lopes": "Grand Canyon",
}
with IDS_FILE.open() as f:
    teams = json.load(f)

def download(item):
    name, team_id = item
    path = LOGO_DIR / f"{team_id}.png"
    if path.exists() and path.stat().st_size > 1000:
        return name, team_id, "cached", None
    url = f"https://a.espncdn.com/i/teamlogos/ncaa/500/{team_id}.png"
    last_error = None
    for attempt in range(3):
        try:
            req = Request(url, headers={"User-Agent": "OakStreetAuctions-NCAA-assets/1.0"})
            with urlopen(req, timeout=25) as response:
                data = response.read()
            if not data.startswith(b"\x89PNG\r\n\x1a\n"):
                raise ValueError("ESPN response was not PNG")
            path.write_bytes(data)
            return name, team_id, "downloaded", None
        except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
            last_error = str(exc)
            if attempt < 2:
                time.sleep(1.5 * (attempt + 1))
    slug = FALLBACK_SLUGS.get(name)
    if slug:
        try:
            req = Request("https://ncaa-api.henrygd.me/logo/" + slug + ".svg", headers={"User-Agent": "OakStreetAuctions-NCAA-assets/1.0"})
            with urlopen(req, timeout=25) as response:
                svg = response.read()
            if b"<svg" not in svg[:1000]:
                raise ValueError("NCAA fallback response was not SVG")
            (LOGO_DIR / (str(team_id) + ".svg")).write_bytes(svg)
            return name, team_id, "downloaded-svg", None
        except (HTTPError, URLError, TimeoutError, OSError, ValueError) as exc:
            last_error += "; NCAA fallback: " + str(exc)
    return name, team_id, "missing", last_error

results = []
with ThreadPoolExecutor(max_workers=12) as pool:
    futures = [pool.submit(download, item) for item in teams.items()]
    for future in as_completed(futures):
        results.append(future.result())

manifest = {}
for name, team_id in teams.items():
    suffix = "svg" if (LOGO_DIR / (str(team_id) + ".svg")).exists() else "png"
    manifest[key(name)] = "../assets/ncaa/logos/" + str(team_id) + "." + suffix
for alias, canonical in aliases.items():
    if canonical in teams:
        team_id = teams[canonical]
        suffix = "svg" if (LOGO_DIR / (str(team_id) + ".svg")).exists() else "png"
        manifest[key(alias)] = "../assets/ncaa/logos/" + str(team_id) + "." + suffix

(ASSET_DIR / "teams.json").write_text(json.dumps(manifest, indent=2, sort_keys=True) + "\n")
report = {
    "expected_teams": len(teams),
    "downloaded_or_cached": sum(r[2] in ("downloaded", "cached", "downloaded-svg") for r in results),
    "missing": [{"school": n, "espn_id": i, "reason": e} for n, i, status, e in results if status not in ("downloaded", "cached", "downloaded-svg")],
    "logo_files": len(list(LOGO_DIR.glob("*.png"))),
}
(ASSET_DIR / "build-report.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
