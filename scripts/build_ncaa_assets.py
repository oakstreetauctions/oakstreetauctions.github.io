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
# Accept common NCAA/auction spelling variants: St., ST, and State.
for official_name in teams:
    variants = {
        re.sub(r"\\bSt\\.$", "State", official_name, flags=re.I),
        re.sub(r"\\bState$", "St.", official_name, flags=re.I),
        re.sub(r"\\bSt\\.$", "ST", official_name, flags=re.I),
        re.sub(r"\\bState$", "ST", official_name, flags=re.I),
    }
    for variant in variants:
        if variant and variant != official_name:
            aliases[variant] = official_name

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

# Create a visual audit sheet using each auction lot's actual primary team background.
try:
    from PIL import Image, ImageDraw, ImageFont
    import cairosvg
    html = (ROOT / "auction" / "index.html").read_text()
    marker = '"mm":{'
    pos = html.index(marker) + len('"mm":')
    depth = 0
    quoted = False
    escaped = False
    end = pos
    for end in range(pos, len(html)):
        ch = html[end]
        if quoted:
            if escaped: escaped = False
            elif ch == "\\\\": escaped = True
            elif ch == '"': quoted = False
        else:
            if ch == '"': quoted = True
            elif ch == '{': depth += 1
            elif ch == '}':
                depth -= 1
                if depth == 0:
                    end += 1
                    break
    mm = json.loads(html[pos:end])
    colors = mm.get("tc", {})
    lots = mm.get("lots", [])
    audit = []
    for lot in lots:
        name, teams, seed = lot
        if len(teams) != 1 or not str(seed).isdigit() or not 1 <= int(seed) <= 12:
            continue
        k = key(name)
        rel = manifest.get(k)
        if not rel:
            continue
        # Manifest paths are relative to /auction; resolve them from repository root.
        relpath = rel.replace("../", "", 1)
        pth = ROOT / relpath
        pair = colors.get(name, [["#333333", "#FFFFFF"]])[0]
        audit.append((name, pair[0], pth))
    cols, cell_w, cell_h = 8, 180, 142
    rows = (len(audit) + cols - 1) // cols
    sheet = Image.new("RGB", (cols * cell_w, rows * cell_h), "#20242b")
    draw = ImageDraw.Draw(sheet)
    try: font = ImageFont.truetype("DejaVuSans.ttf", 13)
    except OSError: font = ImageFont.load_default()
    for idx, (name, bg, pth) in enumerate(audit):
        x, y = (idx % cols) * cell_w, (idx // cols) * cell_h
        rgb = tuple(int(bg.lstrip("#")[i:i+2], 16) for i in (0, 2, 4))
        tile = Image.new("RGB", (cell_w, cell_h), rgb)
        # Mirror the TV view's darkened radial gradient approximately.
        import math
        px = tile.load()
        for yy in range(cell_h):
            for xx in range(cell_w):
                f = max(0.72, 1 - 0.22 * math.sqrt(((xx / cell_w) - .2)**2 + (yy / cell_h)**2))
                px[xx, yy] = tuple(int(c*f) for c in rgb)
        sheet.paste(tile, (x, y))
        try:
            if pth.suffix.lower() == ".svg":
                raw = cairosvg.svg2png(url=str(pth), output_width=100, output_height=100)
                import io
                logo = Image.open(io.BytesIO(raw)).convert("RGBA")
            else:
                logo = Image.open(pth).convert("RGBA")
            logo.thumbnail((92, 92), Image.Resampling.LANCZOS)
            sheet.paste(logo, (x + (cell_w-logo.width)//2, y + 7), logo)
        except Exception as exc:
            draw.text((x+8,y+35), "LOGO ERROR", fill="white", font=font)
        draw.text((x+6, y+108), name, fill="white", font=font, stroke_width=1, stroke_fill="#111111")
    sheet.save(ROOT / "assets" / "ncaa" / "logo-visibility-audit.jpg", quality=92)
except Exception as exc:
    (ROOT / "assets" / "ncaa" / "audit-error.txt").write_text(repr(exc))
