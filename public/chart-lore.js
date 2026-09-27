/* What the hand-drawn chart shows about a child's learning, in the chart's own hand:
   unexplored country is blank parchment, each Fact Trail is thirteen milestones along
   the road out of its realm, three stars earn a gold-leaf compass star, and a finished
   map is signed in its cartouche. Pure SVG markup; no app state. */
(function(root){
  'use strict';
  const CW=typeof module!=='undefined'&&module.exports?require('./chart-world'):root.ChartWorld;
  const f1=v=>+(+v).toFixed(1),TAU=Math.PI*2,INK='#3b2a1c';
  const esc=s=>String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

  /* Thirteen milestones spaced evenly along the middle of a road, off its verge and out of the water. */
  const WATER=CW.RIVERS.flatMap(r=>r.path.filter((_,i)=>i%2===0).map(p=>[p[0],p[1],(r.w[1]+6)/2+9]));
  const wet=(x,y)=>((x-CW.LAKE.x)/(CW.LAKE.rx*1.2))**2+((y-CW.LAKE.y)/(CW.LAKE.ry*1.25))**2<1||WATER.some(([wx,wy,r])=>Math.abs(wx-x)<r&&Math.abs(wy-y)<r&&Math.hypot(wx-x,wy-y)<r);
  const MILESTONES=CW.routePaths().map(path=>{
    const len=[0];for(let i=1;i<path.length;i++)len.push(len[i-1]+Math.hypot(path[i][0]-path[i-1][0],path[i][1]-path[i-1][1]));
    const total=len[len.length-1],at=d=>{let i=len.findIndex(v=>v>=d);if(i<1)i=1;const t=(d-len[i-1])/(len[i]-len[i-1]||1),a=path[i-1],b=path[i];return{x:a[0]+(b[0]-a[0])*t,y:a[1]+(b[1]-a[1])*t,an:Math.atan2(b[1]-a[1],b[0]-a[0])};};
    // Where a milestone would stand in water (at a bridge or ford), walk it along the road to dry ground.
    const out=[];for(let k=0;k<13;k++){const d0=total*(.16+.72*k/12);let spot=null;
      for(const shift of[0,8,-8,16,-16,24,-24,32,-32,40]){const p=at(Math.max(total*.08,Math.min(total*.94,d0+shift))),nx=-Math.sin(p.an),ny=Math.cos(p.an);
        for(const side of[ny<0?-1:1,ny<0?1:-1]){const x=p.x+nx*6*side,y=p.y+ny*6*side;if(!wet(x,y)){spot=[x,y];break;}}if(spot)break;}
      if(!spot){const p=at(d0);spot=[p.x,p.y];}out.push([f1(spot[0]),f1(spot[1])]);}
    return out;});

  const milestone=([x,y],inked,n)=>inked
    ?`<ellipse cx="${f1(x+1)}" cy="${f1(y+.3)}" rx="2" ry=".6" fill="rgba(58,46,26,.25)"/><path d="M${f1(x-1.4)} ${y} v-2.4 a1.4 1.4 0 0 1 2.8 0 v2.4z" fill="#d6cbb0" stroke="${INK}" stroke-width=".4"/><path d="M${f1(x+.5)} ${y} v-3.4 a1.4 1.4 0 0 1 .9 1 v2.4z" fill="rgba(60,40,20,.25)"/><circle cx="${x}" cy="${f1(y-2.4)}" r=".45" fill="#d4a017"/>`
    :`<path d="M${f1(x-1.4)} ${y} v-2.4 a1.4 1.4 0 0 1 2.8 0 v2.4z" fill="none" stroke="rgba(90,86,80,.6)" stroke-width=".35" stroke-dasharray=".8 .6"/>`;
  const goldStar=(x,y,r=6)=>{let d='';for(let k=0;k<16;k++){const a=k/16*TAU-Math.PI/2,rr=k%2?r*.38:(k%4?r*.72:r);d+=(k?'L':'M')+f1(x+Math.cos(a)*rr)+' '+f1(y+Math.sin(a)*rr);}
    return`<g class="cl-gilt"><path d="${d}Z" fill="url(#clGold)" stroke="#7a5518" stroke-width=".45"/><path d="M${x} ${f1(y-r)} V${f1(y+r)} M${f1(x-r)} ${y} H${f1(x+r)}" stroke="rgba(122,85,24,.5)" stroke-width=".3"/><circle cx="${x}" cy="${y}" r="${f1(r*.18)}" fill="#fff3c8" stroke="#7a5518" stroke-width=".3"/></g>`;};

  /* The cartouche: waiting in pencil, then inked, signed and sealed when the summit is conquered. */
  const CART={x:560,y:1766,w:204,h:58};
  function cartouche(done,name){const{x,y,w,h}=CART,L=x-w/2,T=y-h/2;
    const scroll=`M${L+10} ${T} H${L+w-10} q8 0 8 8 v${h-16} q0 8 -8 8 H${L+10} q-8 0 -8 -8 v${-h+16} q0 -8 8 -8Z`;
    const curls=`M${L+2} ${T+8} q-8 -2 -6 -10 q3 -5 9 -1 M${L+w-2} ${T+h-8} q8 2 6 10 q-3 5 -9 1 M${L+w-2} ${T+8} q8 -2 6 -10 q-3 -5 -9 -1 M${L+2} ${T+h-8} q-8 2 -6 10 q3 5 9 1`;
    if(!done)return`<g class="cl-cartouche pending"><path d="${scroll}" fill="rgba(238,229,206,.6)" stroke="rgba(90,86,80,.7)" stroke-width=".6" stroke-dasharray="2 1.4"/><path d="${curls}" fill="none" stroke="rgba(90,86,80,.6)" stroke-width=".5"/><text x="${x}" y="${f1(T+19)}" text-anchor="middle" class="cl-cart-title pencil">A Chart of the Twelve Realms</text><text x="${x}" y="${f1(T+36)}" text-anchor="middle" class="cl-cart-by pencil">surveyed by</text><path d="M${x-44} ${f1(T+47)} H${x+44}" stroke="rgba(90,86,80,.55)" stroke-width=".4" stroke-dasharray="1 1.2"/></g>`;
    return`<g class="cl-cartouche"><path d="${scroll}" fill="#f1e5c4" stroke="${INK}" stroke-width=".8"/><path d="${scroll}" fill="none" stroke="#b8860b" stroke-width=".5" transform="translate(${x} ${y}) scale(.94) translate(${-x} ${-y})"/><path d="${curls}" fill="none" stroke="${INK}" stroke-width=".7"/>`+
      `<text x="${x}" y="${f1(T+19)}" text-anchor="middle" class="cl-cart-title">A Chart of the Twelve Realms</text><path d="M${x-60} ${f1(T+24)} H${x-10} M${x+10} ${f1(T+24)} H${x+60}" stroke="#b8860b" stroke-width=".5"/><path d="M${x} ${f1(T+21.4)} l2.6 2.6 l-2.6 2.6 l-2.6 -2.6z" fill="#d4a017" stroke="#7a5518" stroke-width=".3"/>`+
      `<text x="${x}" y="${f1(T+34)}" text-anchor="middle" class="cl-cart-by">surveyed by</text><text x="${x}" y="${f1(T+48)}" text-anchor="middle" class="cl-cart-name">${esc(name||'a brave explorer')}</text>`+
      `<g transform="translate(${L+w-18} ${T+h-8})"><circle r="8" fill="#a8321f" stroke="#6e1e12" stroke-width=".6"/><circle r="5.6" fill="none" stroke="#f3c8b8" stroke-width=".4" opacity=".7"/><text y="2.4" text-anchor="middle" class="cl-seal">12</text><path d="M-6 6 l-2 5 l3 -2 M5 6 l2 5 l-3 -2" fill="#a8321f"/></g></g>`;}

  /* The summit: gold-leaf rays once every realm is restored, a flag and fireworks when it is conquered. */
  function summit(all,done){if(!all)return'';const n=CW.NODES[13];let s=`<g class="cl-summit" transform="translate(${f1(n.x)} ${f1(n.y)})">`;
    for(let k=0;k<24;k++){const a=k/24*TAU,r1=58,r2=k%2?78:98;s+=`<path d="M${f1(Math.cos(a-.04)*r1)} ${f1(Math.sin(a-.04)*r1)} L${f1(Math.cos(a)*r2)} ${f1(Math.sin(a)*r2)} L${f1(Math.cos(a+.04)*r1)} ${f1(Math.sin(a+.04)*r1)}Z" fill="url(#clGold)" stroke="#7a5518" stroke-width=".3" opacity=".75"/>`;}
    s+='</g>';
    if(done){s+=`<g transform="translate(${f1(n.x+34)} ${f1(n.y-40)})"><path d="M0 0 V-22" stroke="${INK}" stroke-width=".9"/><path class="cl-banner" d="M0 -22 h13 l-3 4 l3 4 h-13z" fill="#a8321f" stroke="${INK}" stroke-width=".4"/><text x="6" y="-15.4" text-anchor="middle" font-size="4.4" font-weight="800" fill="#ffe17a" font-family="system-ui,sans-serif">12</text></g>`;
      s+=[[-70,-70,'#f2c24e'],[70,-86,'#e7708a'],[-20,-110,'#7fb8ff'],[40,-120,'#f2c24e'],[-80,-120,'#b894e0']].map(([dx,dy,c],i)=>`<g class="cl-burst" style="animation-delay:${i*1.1}s" transform="translate(${f1(n.x+dx)} ${f1(n.y+dy)})">${[...Array(12)].map((_,k)=>{const a=k/12*TAU;return`<path d="M${f1(Math.cos(a)*3)} ${f1(Math.sin(a)*3)} L${f1(Math.cos(a)*11)} ${f1(Math.sin(a)*11)}" stroke="${c}" stroke-width="1" stroke-linecap="round"/>`;}).join('')}</g>`).join('');}
    return s;}

  function markup(lore){
    if(!lore||!lore.realms)return'';
    let s=`<defs><radialGradient id="clParch"><stop offset="0" stop-color="#eee5ce"/><stop offset=".62" stop-color="#eee5ce" stop-opacity=".97"/><stop offset="1" stop-color="#eee5ce" stop-opacity="0"/></radialGradient><linearGradient id="clGold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff0b8"/><stop offset=".45" stop-color="#e3b33a"/><stop offset=".7" stop-color="#fbe7a0"/><stop offset="1" stop-color="#b8860b"/></linearGradient></defs>`;
    const byFamily=Object.fromEntries(lore.realms.map(q=>[q.family,q]));
    // Unexplored country: blank parchment over the realm and its landmark, with a surveyor's faint marks.
    let parch='';CW.ORDER.forEach((f,i)=>{const q=byFamily[f];if(!q||q.unlocked)return;const n=CW.NODES[i],site=CW.SITES[f]||CW.LANDMARKS[f]&&{x:n.x-40,y:n.y,r:80};
      const cx=site?(n.x+site.x)/2:n.x,cy=site?(n.y+site.y)/2:n.y,rx=site?Math.abs(n.x-site.x)/2+110:120,ry=site?Math.abs(n.y-site.y)/2+100:110;
      parch+=`<ellipse cx="${f1(cx)}" cy="${f1(cy)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="url(#clParch)"/>`;
      parch+=`<g class="cl-survey" opacity=".55"><path d="M${f1(cx-rx*.45)} ${f1(cy)} H${f1(cx+rx*.45)} M${f1(cx)} ${f1(cy-ry*.45)} V${f1(cy+ry*.45)}" stroke="rgba(90,86,80,.5)" stroke-width=".5" stroke-dasharray="2 3"/><circle cx="${f1(cx)}" cy="${f1(cy)}" r="${f1(Math.min(rx,ry)*.3)}" fill="none" stroke="rgba(90,86,80,.4)" stroke-width=".5" stroke-dasharray="1 2.4"/><text x="${f1(site?site.x:cx)}" y="${f1((site?site.y:cy)+4)}" text-anchor="middle" class="cl-uncharted">Uncharted</text></g>`;});
    s+=`<g class="cl-parchment">${parch}</g>`;
    // Fact Trails: thirteen milestones along the road out of each open realm; each checked fact is inked.
    let ms='';CW.ORDER.forEach((f,i)=>{const q=byFamily[f];if(!q||!q.unlocked)return;MILESTONES[i].forEach((p,k)=>{ms+=milestone(p,k<(q.trail|0),k);});});
    s+=`<g class="cl-milestones">${ms}</g>`;
    // Three stars: a gold-leaf compass star beside the landmark.
    s+=CW.ORDER.map((f,i)=>{const q=byFamily[f];if(!q||q.stars<3)return'';const site=CW.SITES[f]||{x:CW.NODES[i].x-70,y:CW.NODES[i].y-20,r:40};return goldStar(f1(site.x+site.r*.75),f1(site.y-site.r*.85),7);}).join('');
    s+=summit(!!lore.allRestored,!!lore.summitDone)+cartouche(!!lore.summitDone,lore.explorer);
    return s;
  }
  const api={markup,MILESTONES,CART,esc};
  root.ChartLore=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
