/* Oak Street Auctions: All-Time Standings page, shared by March Madness and NFL so it works exactly like the golf one.
   Standings table (tap a bidder for their profile), By Year grid, bidder picker and year filter.
   A site calls OSAAT.html(cfg) where cfg = {
     key, years:[{y,pot,champ,champOwn:[names]}], lots:[{y,own,team,tkey,bid,won,fin,champ,sub}], look:{name:{tag html via cfg.tag}},
     tag(n)->html, color(n)->hex, unit:"tournament", openTeam(tkey,own), openYear(y), rerender(), note }  */
(function(){
  const S={};const st=k=>S[k]||(S[k]={tab:"st",sel:"",yr:"all"});
  const fm=n=>"$"+Math.round(n).toLocaleString(),sg=n=>{n=Math.round(n);return(n<0?"−":n>0?"+":"")+fm(Math.abs(n))},cl=n=>Math.round(n)>0?"p":Math.round(n)<0?"n":"";
  const pct=x=>(x>=0?"+":"−")+Math.abs(Math.round(x*100))+"%",esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c])),q=s=>String(s).replace(/\\/g,"\\\\").replace(/'/g,"\\'");
  let CUR=null;
  function bidders(cfg,ys){const set=new Set(ys.map(y=>y.y)),B={};
    cfg.lots.filter(l=>set.has(l.y)).forEach(l=>{const b=B[l.own]||(B[l.own]={name:l.own,paid:0,won:0,yrs:{},lots:[]});b.paid+=l.bid;b.won+=l.won;b.lots.push(l);const v=b.yrs[l.y]||(b.yrs[l.y]={paid:0,won:0});v.paid+=l.bid;v.won+=l.won});
    return Object.values(B).map(b=>{const yrs=Object.keys(b.yrs).sort();const titles=ys.filter(y=>y.champOwn.includes(b.name)).length;
      return Object.assign(b,{net:Math.round(b.won)-Math.round(b.paid),roi:b.paid?b.won/b.paid-1:0,n:yrs.length,titles,ups:yrs.filter(y=>Math.round(b.yrs[y].won)-Math.round(b.yrs[y].paid)>0).length})}).sort((a,b)=>b.net-a.net||b.won-a.won)}
  function profile(cfg,ys,b){const s=st(cfg.key),chron=ys.map(y=>y.y).filter(y=>b.yrs[y]),max=Math.max(1,...chron.map(y=>Math.abs(b.yrs[y].won-b.yrs[y].paid)));
    const best=b.lots.filter(l=>l.bid>0&&l.won>l.bid).sort((x,z)=>(z.won-z.bid)-(x.won-x.bid))[0];
    const set=new Set(ys.map(y=>y.y)),T={};cfg.lots.filter(l=>set.has(l.y)&&l.tkey).forEach(l=>{const t=T[l.tkey]||(T[l.tkey]={k:l.tkey,name:l.tname||l.team,n:new Set(),c:new Set()});t.n.add(l.y);if(l.own===b.name)t.c.add(l.y)});
    const GT=Object.values(T).filter(t=>t.c.size>=2).sort((x,z)=>z.c.size-x.c.size||z.c.size/z.n.size-x.c.size/x.n.size).slice(0,6);
    return`<div class="atp-prof"><div class="ph">${cfg.tag(b.name)}<b>${esc(cfg.disp(b.name))}</b><button onclick="OSAAT.sel('')">Show all</button></div>
    <div class="tl"><div><small>Net</small><b class="${cl(b.net)}">${sg(b.net)}</b><i>${fm(b.paid)} paid · ${fm(b.won)} won</i></div>
      <div><small>ROI</small><b>${pct(b.roi)}</b><i>per dollar bid</i></div>
      <div><small>Winning ${cfg.unitP}</small><b>${b.ups} of ${b.n}</b><i>${b.titles} champion${b.titles===1?"":"s"} owned</i></div>
      <div><small>Best buy</small><b class="sm">${best?esc(best.team):"—"}</b><i>${best?`${fm(best.bid)} → ${fm(best.won)} · ’${String(best.y).slice(2)}`:"no profitable buy yet"}</i></div></div>
    ${GT.length?`<div class="sh"><span>Go-to teams</span><span>times bought</span></div>`+GT.map(t=>`<div class="hb" onclick="OSAAT.team('${q(t.k)}','${q(b.name)}')"><div class="top"><span>${esc(t.name)}</span><span>${t.c.size} of ${t.n.size} <small>· ${Math.round(t.c.size/t.n.size*100)}%</small></span></div><div class="trk"><i style="width:${t.c.size/t.n.size*100}%;background:${cfg.color(b.name)}"></i></div></div>`).join(""):""}
    <div class="sh"><span>Net by year</span><span>oldest → newest</span></div>
    <div class="nb">${chron.map(y=>{const v=b.yrs[y],n=v.won-v.paid,h=Math.abs(n)/max*50;return`<div class="col" title="${y}: ${sg(n)}"><div class="b ${n>=0?"p":"n"}" style="height:${Math.max(h,Math.round(n)?1.5:0)}%"></div><span>’${String(y).slice(2)}</span></div>`}).join("")}</div>
    <div class="er h"><span>${cfg.unitC}</span><span>Paid</span><span>Won</span><span>Net</span></div>
    ${chron.slice().reverse().map(y=>{const v=b.yrs[y],Y=ys.find(x=>x.y===y),mine=Y.champOwn.includes(b.name),n=Math.round(v.won)-Math.round(v.paid);
      return`<div class="er" onclick="OSAAT.year('${y}')"><span><span class="t1">${esc(cfg.yearLabel(y))}</span><span class="t2">${Y.champ?`Won by ${esc(Y.champ)}${mine?" — yours 🏆":""}`:""}</span></span><span>${fm(v.paid)}</span><span>${fm(v.won)}</span><span class="${cl(n)}" style="font-weight:700">${sg(n)}</span></div>`}).join("")}</div>`}
  function standings(cfg,ys,B){const s=st(cfg.key);
    return`<div class="atp-card"><table class="at"><thead><tr><th>Bidder</th><th>Paid</th><th>Won</th><th>Net</th></tr></thead><tbody>`+B.map((b,i)=>`<tr class="${s.sel===b.name?"me":""}" onclick="OSAAT.sel('${q(b.name)}')"><td><div class="who">${cfg.tag(b.name)}<span>${esc(cfg.disp(b.name))}<span class="sub">${i+1}. ${b.n} ${b.n===1?cfg.unitS:cfg.unitA} · ${pct(b.roi)}${b.titles?" · "+(b.titles>2?"🏆×"+b.titles:"🏆".repeat(b.titles)):""}</span></span></div></td><td>${fm(b.paid)}</td><td>${fm(b.won)}</td><td class="${cl(b.net)}" style="font-weight:700">${sg(b.net)}</td></tr>`).join("")+`</tbody></table></div>
    <div class="atp-note">Finished ${cfg.unitP} only, rounded to the dollar. Under each name: rank, ${cfg.unitP} played, return on money bid, and champions owned. Tap a bidder for their history.</div>`}
  function grid(cfg,ys,B){const s=st(cfg.key),cols=ys.slice().reverse();
    return`<div class="atp-card"><div class="gw"><table class="gr"><thead><tr><th class="sk">Bidder</th><th>Total</th>${cols.map(y=>`<th class="ev" onclick="OSAAT.year('${y.y}')">’${String(y.y).slice(2)}</th>`).join("")}</tr></thead><tbody>`+
      B.map(b=>`<tr class="${s.sel===b.name?"me":""}" onclick="OSAAT.sel('${q(b.name)}')"><td class="sk">${cfg.tag(b.name)}</td><td class="${cl(b.net)}" style="font-weight:700">${sg(b.net)}</td>${cols.map(y=>{const v=b.yrs[y.y];if(!v)return`<td class="na">·</td>`;const n=Math.round(v.won)-Math.round(v.paid);return`<td class="${cl(n)}">${sg(n)}${y.champOwn.includes(b.name)?" 🏆":""}</td>`}).join("")}</tr>`).join("")+
      `<tr class="tot"><td class="sk">Pot</td><td>${fm(cols.reduce((t,y)=>t+y.pot,0))}</td>${cols.map(y=>`<td>${fm(y.pot)}</td>`).join("")}</tr></tbody></table></div></div>
    <div class="atp-note">Net per year, newest first. Scroll sideways for older years. Tap a year to open it, or a bidder for their history.</div>`}
  window.OSAAT={
    tabs:cfg=>[["st","Standings"],["grid",cfg.byLabel||"By Year"]],tab:()=>CUR?st(CUR.key).tab:"st",
    html(cfg){CUR=cfg;const s=st(cfg.key),all=cfg.years,ys=s.yr==="all"?all:all.filter(y=>y.y===s.yr),B=bidders(cfg,ys);if(s.sel&&!B.find(b=>b.name===s.sel))s.sel="";
      const pot=ys.reduce((t,y)=>t+y.pot,0),names=B.map(b=>b.name).slice().sort((a,b)=>cfg.disp(a).localeCompare(cfg.disp(b))),me=B.find(b=>b.name===s.sel);
      let h=`<div class="atp"><div class="atp-k"><span>All-Time</span></div><div class="atp-s">${ys.length} ${ys.length===1?cfg.unitS:cfg.unitP} · ${fm(pot)} in pots</div>
      <label class="atp-pick"><small>Bidder</small>${me?`<i style="background:${cfg.color(me.name)}"></i>`:""}<b>${me?esc(cfg.disp(me.name)):"Everyone"}</b><span>▾</span><select onchange="OSAAT.sel(this.value)"><option value="">Everyone</option>${names.map(n=>`<option value="${esc(n)}"${n===s.sel?" selected":""}>${esc(cfg.disp(n))}</option>`).join("")}</select></label>
      <div class="atp-chips"><button class="${s.yr==="all"?"on":""}" onclick="OSAAT.yr('all')">All years</button>${all.slice().reverse().map(y=>`<button class="${s.yr===y.y?"on":""}" onclick="OSAAT.yr('${y.y}')">${y.y}</button>`).join("")}</div>`;
      if(me)h+=profile(cfg,ys,me);
      h+=s.tab==="grid"?grid(cfg,ys,B):standings(cfg,ys,B);
      return h+`</div>`},
    sel(n){const s=st(CUR.key);s.sel=s.sel===n?"":n;CUR.rerender();if(s.sel)window.scrollTo({top:0,behavior:"smooth"})},
    yr(y){st(CUR.key).yr=y;CUR.rerender()},setTab(t){st(CUR.key).tab=t;CUR.rerender()},pick(n){st(CUR?CUR.key:"_").sel=n},
    preset(key,n){st(key).sel=n||""},
    get(key){return Object.assign({},st(key))},set(key,o){Object.assign(st(key),{tab:o.tab||"st",sel:o.sel||"",yr:o.yr||"all"})},
    team(k,o){CUR.openTeam(k,o)},year(y){CUR.openYear(y)}};
})();
