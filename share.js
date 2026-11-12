/* Oak Street Auctions: "Share results" image, shared by the golf, March Madness and NFL sites.
   A site calls OSAShare.open({...}) with its colors, the event, the champion and the standings;
   this draws a phone-sized PNG and offers Share (phone share sheet) or Save image. */
(function(){
  const W=1080,PAD=64;
  const money=n=>{n=Math.round(n);return(n<0?"−":"")+"$"+Math.abs(n).toLocaleString()};
  const signed=n=>{n=Math.round(n);return(n>0?"+":n<0?"−":"")+"$"+Math.abs(n).toLocaleString()};
  function rr(x,c,y,w,h,r){c.beginPath();c.moveTo(x+r,y);c.arcTo(x+w,y,x+w,y+h,r);c.arcTo(x+w,y+h,x,y+h,r);c.arcTo(x,y+h,x,y,r);c.arcTo(x,y,x+w,y,r);c.closePath()}
  function fit(c,text,max,font){c.font=font;if(c.measureText(text).width<=max)return text;let t=text;while(t.length>1&&c.measureText(t+"…").width>max)t=t.slice(0,-1);return t+"…"}
  function chip(c,x,y,tag,size){const h=size||52;c.font=`700 ${Math.round(h*.46)}px ${tag.font||"Inter, system-ui, sans-serif"}`;const tw=c.measureText(tag.t).width,w=Math.max(h*1.5,tw+h*.6);
    c.fillStyle=tag.c;rr(x,c,y,w,h,h*.18);c.fill();c.fillStyle=tag.fg;c.textAlign="center";c.textBaseline="middle";c.fillText(tag.t,x+w/2,y+h/2+1);c.textAlign="left";c.textBaseline="alphabetic";return w}
  function draw(o){
    const th=o.theme,rows=o.rows||[],RH=88,HEAD=330,CH=o.champ?(o.champ.owners&&o.champ.owners.length?222:168):0,FOOT=120,H=HEAD+CH+44+rows.length*RH+FOOT;
    const cv=document.createElement("canvas");cv.width=W;cv.height=H;const c=cv.getContext("2d");
    c.fillStyle=th.page||"#f6f4ec";c.fillRect(0,0,W,H);
    // header band: accent edge + stripes, like the sites
    c.fillStyle=th.bg;c.fillRect(0,0,W,HEAD);c.fillStyle=th.accent;c.fillRect(0,0,14,HEAD);
    c.save();c.beginPath();c.rect(W-200,0,200,HEAD);c.clip();c.globalAlpha=.45;c.lineWidth=5;
    for(let x=W-260;x<W+260;x+=46){c.strokeStyle=th.accent;c.beginPath();c.moveTo(x,HEAD);c.lineTo(x+150,0);c.stroke();c.strokeStyle=th.fg;c.lineWidth=2;c.beginPath();c.moveTo(x+20,HEAD);c.lineTo(x+170,0);c.stroke();c.lineWidth=5}
    c.restore();
    c.fillStyle=th.fg;c.globalAlpha=.75;c.font="600 26px Inter, system-ui, sans-serif";c.letterSpacing="6px";c.fillText("OAK STREET AUCTIONS",PAD,92);c.letterSpacing="0px";c.globalAlpha=1;
    c.fillStyle=th.fg;const tf=`${th.titleWeight||400} ${th.titleSize||68}px ${th.font}`;c.font=tf;
    c.fillText(fit(c,th.upper?o.title.toUpperCase():o.title,W-PAD*2,tf),PAD,182);
    c.fillStyle=th.accent;c.fillRect(PAD,212,70,4);
    c.fillStyle=th.fg;c.globalAlpha=.85;c.font="500 30px Inter, system-ui, sans-serif";c.fillText(o.sub||"",PAD,268);c.globalAlpha=1;
    if(o.status){c.font="700 22px Inter, system-ui, sans-serif";c.letterSpacing="3px";const s=o.status.toUpperCase(),sw=c.measureText(s).width+40;c.fillStyle=o.live?"#d0021b":th.accent;rr(W-PAD-sw,c,62,sw,46,23);c.fill();c.fillStyle=o.live?"#fff":(th.statusFg||th.bg);c.fillText(s,W-PAD-sw+20,93);c.letterSpacing="0px"}
    let y=HEAD+28;
    if(o.champ){c.fillStyle="#fff";rr(PAD,c,y,W-PAD*2,CH-32,18);c.fill();c.strokeStyle="rgba(0,0,0,.08)";c.lineWidth=2;c.stroke();c.fillStyle=th.accent;rr(PAD,c,y,12,CH-32,6);c.fill();
      c.fillStyle="#6d7468";c.font="600 22px Inter, system-ui, sans-serif";c.letterSpacing="4px";c.fillText(o.champ.label.toUpperCase(),PAD+40,y+46);c.letterSpacing="0px";
      c.fillStyle="#1c2a21";const cf=`${th.titleWeight||400} 46px ${th.font}`;c.font=cf;c.fillText(fit(c,o.champ.text,W-PAD*2-80,cf),PAD+40,y+102);
      y+=CH}
    // standings
    c.fillStyle="#6d7468";c.font="600 22px Inter, system-ui, sans-serif";c.letterSpacing="4px";c.fillText((o.listLabel||"STANDINGS").toUpperCase(),PAD,y+20);c.textAlign="right";c.fillText("NET",W-PAD,y+20);c.textAlign="left";c.letterSpacing="0px";y+=44;
    rows.forEach((r,i)=>{if(i%2===0){c.fillStyle="rgba(0,0,0,.035)";c.fillRect(PAD-16,y,W-PAD*2+32,RH)}
      c.fillStyle="#8a9187";c.font="400 34px Georgia, serif";c.textAlign="center";c.fillText(String(i+1),PAD+18,y+RH/2+12);c.textAlign="left";
      const cw=chip(c,PAD+56,y+(RH-52)/2,{t:r.t,c:r.c,fg:r.fg,font:th.chipFont});
      c.fillStyle="#1c2a21";const nf="600 34px Inter, system-ui, sans-serif";c.font=nf;const nm=fit(c,r.name+(r.trophy?"  🏆":""),W-PAD*2-cw-260,nf);c.fillText(nm,PAD+56+cw+22,y+RH/2-2);
      c.fillStyle="#7a8177";c.font="400 22px Inter, system-ui, sans-serif";c.fillText(`paid ${money(r.paid)} · won ${money(r.won)}`,PAD+56+cw+22,y+RH/2+28);
      const n=Math.round(r.net);c.fillStyle=n>0?"#0d7a47":n<0?"#c8102e":"#1c2a21";c.font="700 38px Inter, system-ui, sans-serif";c.textAlign="right";c.fillText(signed(n),W-PAD,y+RH/2+13);c.textAlign="left";y+=RH});
    // footer
    y+=34;c.fillStyle="rgba(0,0,0,.1)";c.fillRect(PAD,y,W-PAD*2,2);c.fillStyle="#6d7468";c.font="500 24px Inter, system-ui, sans-serif";c.fillText(o.url||"oakstreetauctions.github.io",PAD,y+52);
    c.textAlign="right";c.fillText(o.stamp||new Date().toLocaleDateString(undefined,{month:"short",day:"numeric",year:"numeric"}),W-PAD,y+52);c.textAlign="left";
    // champion owner chips drawn last so they sit on the white card
    if(o.champ&&(o.champ.owners||[]).length){let cx=PAD+40;const cy=HEAD+28+124;
      o.champ.owners.forEach(w=>{const cw=chip(c,cx,cy+8,{t:w.t,c:w.c,fg:w.fg,font:th.chipFont},40);cx+=cw+12;c.fillStyle="#3b443d";c.font="600 26px Inter, system-ui, sans-serif";c.fillText(w.name,cx,cy+37);cx+=c.measureText(w.name).width+30});
      if(o.champ.note){c.fillStyle="#7a8177";c.font="400 24px Inter, system-ui, sans-serif";c.fillText(o.champ.note,cx,cy+37)}}
    return cv}
  function sheet(cv,o){const old=document.getElementById("osa-share");if(old)old.remove();
    const url=cv.toDataURL("image/png"),d=document.createElement("div");d.id="osa-share";
    d.innerHTML=`<style>#osa-share{position:fixed;inset:0;z-index:100;background:rgba(8,14,10,.72);display:flex;flex-direction:column;align-items:center;justify-content:center;padding:calc(env(safe-area-inset-top,0px) + 16px) 16px calc(env(safe-area-inset-bottom,0px) + 16px);font:600 15px Inter,system-ui,sans-serif}
      #osa-share img{max-width:min(420px,100%);max-height:calc(100% - 84px);border-radius:12px;box-shadow:0 10px 40px rgba(0,0,0,.4);background:#fff}
      #osa-share .b{display:flex;gap:10px;margin-top:14px}#osa-share button,#osa-share a{appearance:none;border:0;border-radius:999px;padding:12px 20px;font:inherit;cursor:pointer;text-decoration:none}
      #osa-share .p{background:#fff;color:#111}#osa-share .s{background:rgba(255,255,255,.14);color:#fff}</style>
      <img alt="Results image"><div class="b"><button class="p" id="osa-sh">Share</button><a class="s" id="osa-dl" download="${o.filename||"oak-street-results"}.png">Save image</a><button class="s" id="osa-x">Close</button></div>`;
    d.querySelector("img").src=url;d.querySelector("#osa-dl").href=url;document.body.appendChild(d);
    d.addEventListener("click",e=>{if(e.target===d)d.remove()});d.querySelector("#osa-x").onclick=()=>d.remove();
    const shb=d.querySelector("#osa-sh");
    cv.toBlob(b=>{const f=new File([b],(o.filename||"oak-street-results")+".png",{type:"image/png"});
      if(!(navigator.canShare&&navigator.canShare({files:[f]}))){shb.style.display="none";return}
      shb.onclick=()=>navigator.share({files:[f],title:o.title}).catch(()=>{})},"image/png")}
  window.OSAShare={draw,
    async open(o){try{await Promise.all([`400 40px ${o.theme.font}`,`700 40px ${o.theme.font}`,"600 30px Inter","700 30px Inter"].map(f=>document.fonts.load(f).catch(()=>{})))}catch(e){}
      sheet(draw(o),o)}};
})();
