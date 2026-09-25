/* The chart's living layer: what changes as a child learns. Landmarks rebuild
   stage by stage, water starts to flow where a realm is restored, lamps and
   windows light at night. Returns SVG markup and ink masks; no app state. */
(function(root){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports?require:null;
  const CW=node?node('./chart-world'):root.ChartWorld,CP=node?node('./chart-paint'):root.ChartPaint,CR=node?node('./chart-realms'):root.ChartRealms;
  const TAU=Math.PI*2,f1=v=>+(+v).toFixed(1);

  /* How far the ink has spread at each stage: ruins, foundation, walls, restored, celebrated. */
  const INK_RADIUS=[0,88,140,236,268];
  // The same rule as the painted realm scenes, so the map and the realm always agree.
  const stageFor=({trial=false,conquered=false,stars=0}={})=>stars>=3?4:conquered||stars>=2?3:trial||stars>=1?1:0;
  const CENTRES={2:{dx:-40,dy:10,extra:40}};
  function inkCircles(stages){const out=[];for(const f of CW.ORDER){const s=stages[f]|0;if(!s)continue;const n=CW.node(f),c=CENTRES[f]||{dx:0,dy:0,extra:0};out.push({family:f,x:n.x+c.dx,y:n.y+c.dy,r:INK_RADIUS[s]+(s>=3?c.extra:0),stage:s});}return out;}

  /* A soft, ragged ink mask at quarter resolution. `grow` animates one realm's spread. */
  function maskURL(stages,makeCanvas,{all=false,grow=null}={}){
    const q=4,w=Math.ceil(CW.W/q),h=Math.ceil(CW.H/q),c=makeCanvas(w,h),ctx=c.getContext('2d');
    if(all){ctx.fillStyle='#000';ctx.fillRect(0,0,w,h);return c.toDataURL();}
    const n=CW.noise(211);
    for(const k of inkCircles(stages)){let r=k.r;if(grow&&grow.family===k.family)r=grow.from+(k.r-grow.from)*grow.t;if(r<=1)continue;
      const cx=k.x/q,cy=k.y/q,rr=r/q,g=ctx.createRadialGradient(cx,cy,0,cx,cy,rr*1.12);g.addColorStop(0,'#000');g.addColorStop(.7,'#000');g.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=g;ctx.beginPath();for(let i=0;i<=48;i++){const a=i/48*TAU,m=1+(n(Math.cos(a)*1.6+k.family*3,Math.sin(a)*1.6)-.5)*.42;const px=cx+Math.cos(a)*rr*1.12*m,py=cy+Math.sin(a)*rr*1.12*m;i?ctx.lineTo(px,py):ctx.moveTo(px,py);}ctx.fill();}
    return c.toDataURL();
  }

  /* ---------- the twin crossing at Double River ---------- */
  function bridge(b,stage,fresh,R){
    const L=-b.len/2,Rt=b.len/2,top=-12,spring=4,water=6,arches=[[-14,11],[14,11]],delay=x=>((x-L)/(Rt-L)*1.5+.4).toFixed(2);
    const archD=(c,r)=>`M${c-r} ${water} V${spring} A${r} ${r} 0 0 1 ${c+r} ${spring} V${water} Z`;
    let body=`M${L} ${top} H${Rt} V${water} H${L} Z`;for(const[c,r]of arches)body+=archD(c,r);
    const id=`bclip${Math.round(b.x)}`;let s=`<g class="cl-bridge${fresh?' fresh':''}" transform="translate(${b.x} ${b.y})">`;
    if(stage===0){ // A ruin, sketched in graphite.
      for(const[x0,x1,hh]of[[L,L+6,-4],[-3,3,1],[Rt-6,Rt,-1]])for(let y=water;y>hh;y-=3)s+=`<rect x="${f1(x0+(R()-.5))}" y="${y-3}" width="${x1-x0}" height="3" class="cl-ruin"/>`;
      for(const[x,y,a]of[[-18,5,24],[10,6,-18],[-6,7,40]])s+=`<rect x="${x}" y="${y}" width="4" height="2.4" class="cl-ruin" transform="rotate(${a} ${x+2} ${y+1})"/>`;
      return s+`<rect x="${L+4}" y="-5" width="30" height="2" class="cl-plank" transform="rotate(-14 ${L+19} -4)"/></g>`;}
    s+=`<clipPath id="${id}"><path d="${body}" clip-rule="evenodd"/></clipPath>`;
    s+=`<g transform="matrix(1 0 0 -.6 0 9.6)" opacity=".22"><path d="${body}" fill="#8f8570" fill-rule="evenodd"/></g>`;
    s+=arches.map(([c,r])=>`<path d="${archD(c,r)}" fill="#26383d" opacity=".82"/><path d="M${c-r+2} 5.4 H${c+r-2}" stroke="#a9cbcc" stroke-width=".45" opacity=".7"/>`).join('');
    // Foundations: abutments and the pier; at stage 1 timber centring waits under the arches.
    let st='';const built=stage>=3;
    for(let y=top,row=0;y<water;y+=3.6,row++){let x=L-(row%2?2.6:0);while(x<Rt){const w=4+R()*3;const inPier=Math.abs(x+w/2)<4.5||x<L+6||x+w>Rt-6;if(built||inPier&&y>-2)st+=`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="3.6" fill="${CP.shade('#d6caad',(R()-.5)*.14)}" class="cl-stone" style="--d:${delay(x)}s"/>`;x+=w;}}
    s+=`<g clip-path="url(#${id})">${st}</g>`;
    if(built){for(const[c,r]of arches){const n=Math.round(Math.PI*(r+1.6)/2.8);for(let i=0;i<n;i++){const a0=Math.PI+i*Math.PI/n,a1=a0+Math.PI/n,key=i===Math.floor(n/2),ro=r+(key?4.4:3.2),p=(a,rr)=>`${f1(c+Math.cos(a)*rr)},${f1(spring+Math.sin(a)*rr)}`;s+=`<polygon points="${p(a0,r)} ${p(a0,ro)} ${p(a1,ro)} ${p(a1,r)}" fill="${key?'#e6dbbd':i%2?'#c5b692':'#d3c6a4'}" class="cl-stone" style="--d:${delay(c+Math.cos((a0+a1)/2)*r)}s"/>`;}}
      s+=`<path d="${body}" fill="none" stroke="#3b2a1c" stroke-width=".8" fill-rule="evenodd"/>`;
      // Walkers cross behind the parapet.
      s+=`<g class="cl-walkers">${[['#c0503a',0],['#3f6fb0',-4.2]].map(([c,d])=>`<g class="cl-walker" style="animation-delay:${d}s"><path d="M-1.8 -12 L-2.1 -17.4 Q0 -18.8 2.1 -17.4 L1.8 -12Z" fill="${c}" stroke="#3b2a1c" stroke-width=".4"/><circle cy="-19.8" r="1.7" fill="#f2cfa8" stroke="#3b2a1c" stroke-width=".4"/></g>`).join('')}</g>`;
      let pp='';for(let x=L;x<Rt;){const w=4.5+R()*2;pp+=`<rect x="${f1(x)}" y="-16.4" width="${f1(Math.min(w,Rt-x))}" height="4.4" fill="${CP.shade('#d9cdb0',(R()-.5)*.12)}" class="cl-stone" style="--d:${delay(x)}s"/>`;x+=w;}
      for(let x=L+5;x<Rt-3;x+=5)if(Math.abs(x)>3)pp+=`<path d="M${x-1} -12.6 V-14.6 A1 1 0 0 1 ${x+1} -14.6 V-12.6Z" fill="#33454a"/>`;
      pp+=`<rect x="${L-1.5}" y="-17.8" width="${Rt-L+3}" height="1.6" fill="#e6dcc2" stroke="#3b2a1c" stroke-width=".35"/>`;
      s+=pp;
      const posts=[L,0,Rt];s+=`<g class="cl-lamps">${posts.map(x=>`<circle cx="${x}" cy="-27" r="10" fill="url(#clLamp)" class="cl-glow"/><rect x="${x-1.6}" y="-20" width="3.2" height="8" fill="#cbbd9c" stroke="#3b2a1c" stroke-width=".35"/><path d="M${x} -20 V-24.4" stroke="#2b1c10" stroke-width=".8"/><path d="M${x-1.7} -28.2 H${x+1.7} L${x+1.3} -24.6 H${x-1.3}Z" class="cl-lamp"/><path d="M${x-2.3} -28.2 L${x} -30.8 L${x+2.3} -28.2Z" fill="#2b1c10"/>`).join('')}</g>`;
      if(stage>=4)s+=posts.map((x,i)=>`<g class="cl-banner" style="animation-delay:${-i*.7}s" transform="translate(${x} -30.8)"><path d="M0 0 V-9" stroke="#2b1c10" stroke-width=".6"/><path d="M0 -9 h7 l-1.6 2.6 l1.6 2.6 h-7z" fill="${i%2?'#e0b24a':'#2f8f8a'}" stroke="#3b2a1c" stroke-width=".35"/></g>`).join('')+`<path d="M${L} -30 Q${L/2} -24 0 -30 Q${Rt/2} -24 ${Rt} -30" fill="none" stroke="#3b2a1c" stroke-width=".35"/>${[...Array(8)].map((_,i)=>{const t=(i+.5)/8,x=L+(Rt-L)*t,y=-30+Math.sin(t*Math.PI*2)**2*5.4;return`<path d="M${f1(x-1.2)} ${f1(y)} h2.4 l-1.2 2.4z" fill="${i%2?'#e0b24a':'#2f8f8a'}"/>`;}).join('')}`;
    }else{ // Stage 1: the supports are ready; timber centring holds the arch shape.
      s+=arches.map(([c,r])=>`<path d="M${c-r} ${spring} A${r} ${r} 0 0 1 ${c+r} ${spring}" fill="none" stroke="#8b5a32" stroke-width="1.2"/>${[-.7,-.35,0,.35,.7].map(k=>`<path d="M${f1(c+k*r)} ${spring} L${f1(c+k*r*.9)} ${f1(spring-Math.sqrt(1-k*k)*r)}" stroke="#8b5a32" stroke-width=".6"/>`).join('')}`).join('');
      s+=`<path d="M${L} ${top+6} h8 M${Rt-8} ${top+6} h8" stroke="#3b2a1c" stroke-width=".5"/>`;}
    return s+'</g>';
  }
  function mill(m,stage){
    const planks=[...Array(10)].map((_,i)=>{const y=-3-i*2.6,hw=7-2.6*(-y/26);return`M${f1(-hw)} ${f1(y)} H${f1(hw)}`;}).join('');
    const blade=a=>`<g transform="rotate(${a})"><path d="M0 0 V-22" stroke="#5b3f28" stroke-width="1"/><path d="M.6 -4.5 H5 V-22 H.6Z" fill="rgba(248,240,222,.92)" stroke="#3b2a1c" stroke-width=".4"/><path d="M.6 -8 H5 M.6 -11.5 H5 M.6 -15 H5 M.6 -18.5 H5 M2.8 -4.5 V-22" stroke="rgba(59,42,28,.55)" stroke-width=".28"/></g>`;
    return`<g class="cl-mill${stage>=3?' turning':''}" transform="translate(${m.x} ${m.y})"><ellipse cx="6" cy="1" rx="13" ry="3.2" fill="rgba(58,46,26,.22)"/><path d="M-7 0 L7 0 L4.4 -26 L-4.4 -26Z" fill="url(#clMill)" stroke="#3b2a1c" stroke-width=".7"/><path d="${planks}" stroke="rgba(52,36,22,.35)" stroke-width=".3"/><path d="M-1.8 0 V-4.4 A1.8 1.8 0 0 1 1.8 -4.4 V0Z" fill="#6b4527" stroke="#3b2a1c" stroke-width=".45"/><rect x="-1.1" y="-16" width="2.2" height="2.8" fill="#33434b" stroke="#3b2a1c" stroke-width=".35"/><rect x="-1.1" y="-16" width="2.2" height="2.8" class="cl-win"/><path d="M-6 -26 Q0 -36 6 -26Z" fill="#8b5a32" stroke="#3b2a1c" stroke-width=".6"/><g transform="translate(0 -28.5)"><g class="cl-sails">${[0,90,180,270].map(blade).join('')}</g><circle r="1.5" fill="#5b3f28"/></g></g>`;
  }
  function boat(b){return`<g class="cl-boat" style="--x:${b.x}px;--y:${b.y}px"><path d="M-7 0 Q0 3.4 7 0 L5.4 -1.8 H-5.4Z" fill="#8b5a32" stroke="#3b2a1c" stroke-width=".5"/><path d="M-4.4 -1.6 Q0 -.4 4.4 -1.6" fill="none" stroke="#e0b24a" stroke-width=".4"/><circle cx="1" cy="-3.6" r="1.3" fill="#f2cfa8" stroke="#3b2a1c" stroke-width=".35"/><path d="M-.4 -2.4 h2.8 v1 h-2.8z" fill="#c0503a"/><path d="M-2 -2 L-8 3" stroke="#6b4527" stroke-width=".6"/><path d="M-9 2.4 q2 -1 4 0 M6 1.8 q2 -1 4 0" stroke="#fffaf0" stroke-width=".5" fill="none"/></g>`;}

  /* ---------- a lived-in land: names, signposts and the roads beyond (0.36) ---------- */
  // Names for the land itself. Mostly traditional, with a few number-themed treats to find.
  const FEATURES=[
    {x:250,y:840,t:'Mill Beck',c:'water',r:10},{x:706,y:676,t:'Parrot Brook',c:'water',r:-2},{x:545,y:1614,t:'Fern Brook',c:'water',r:3},
    {x:330,y:326,t:'The Dry Wash',c:'water',r:17},{x:130,y:700,t:'The Tally Hills',c:'feature',r:-8},{x:470,y:204,t:'Frostgate Pass',c:'feature',r:-14},
    {x:748,y:212,t:'The Long Glacier',c:'feature',r:-48},{x:178,y:292,t:'The Dozen Dunes',c:'feature',r:-5},{x:440,y:1560,t:'Fen Bridge',c:'small',r:0},
    {x:514,y:1476,t:'Old Stone Bridge',c:'small',r:-18},{x:458,y:944,t:'Canopy Bridge',c:'small',r:0},
    {x:660,y:1030,t:'THE MIDLANDS',c:'region',r:-4},{x:694,y:584,t:'THE HIGH COUNTRY',c:'region',r:-3},{x:140,y:1540,t:'THE LOWLANDS',c:'region',r:-6}];
  // Signposts where roads meet: each board points toward a destination.
  const SIGNPOSTS=[{x:256,y:1066,boards:[['Coast Kingdoms',-1],['Harbor',1],['Twin Towers',1]]},{x:168,y:522,boards:[['Salt Road',-1],['Stonecross',1]]},
    {x:648,y:1262,boards:[['Sunrise Road',1],['Double River',-1]]},{x:378,y:1470,boards:[['Ten City',-1],['One Woods',1]]}];
  function places(){let s='';
    const lab=(x,y,t,c,r=0)=>`<text class="cl-lab ${c}" x="${f1(x)}" y="${f1(y)}" text-anchor="middle"${r?` transform="rotate(${r} ${f1(x)} ${f1(y)})"`:''}>${t.replace(/&/g,'&amp;').replace(/</g,'&lt;')}</text>`;
    for(const q of CW.SETTLEMENTS){if(!q.name)continue;const R=CW.SETTLE_R[q.kind],c=q.kind==='town'?'town':q.kind==='village'||q.kind==='stilts'?'village':'hamlet';s+=lab(q.x,q.y+(q.labelDy!=null?q.labelDy:R*.62+(c==='town'?10:c==='village'?8:6)),q.name,c);}
    for(const f of FEATURES)s+=lab(f.x,f.y,f.t,f.c,f.r);
    for(const sp of SIGNPOSTS){s+=`<g class="cl-signpost" transform="translate(${sp.x} ${sp.y})"><ellipse cx="1" cy=".4" rx="2.4" ry=".7" fill="rgba(58,46,26,.25)"/><path d="M0 0 V-14" stroke="#5b3f28" stroke-width=".9"/>`;
      sp.boards.forEach(([t,d],i)=>{const y=-13+i*3.4,w=t.length*1.55+3;s+=`<path d="M0 ${y} h${f1(d*w)} l${f1(d*1.6)} 1.3 l${f1(-d*1.6)} 1.3 h${f1(-d*w)}z" fill="#c9a36a" stroke="#3b2a1c" stroke-width=".3"/><text x="${f1(d*(w/2+.4))}" y="${f1(y+1.95)}" text-anchor="middle" class="cl-board">${t}</text>`;});
      s+='</g>';}
    for(const e of CW.EDGE_SIGNS)s+=`<text class="cl-lab beyond" x="${e.x}" y="${e.y}" text-anchor="${e.dir<0?'start':'end'}">${e.dir<0?'← ':''}${e.t||e.text}${e.dir>0?' →':''}</text>`;
    // Chimney smoke from the settlements: one hearth each.
    let smoke='';CW.SETTLEMENTS.forEach((q,i)=>{const h=CW.buildingsFor(q).find(b=>b.type==='house');if(!h)return;const ch=CP.houseFeatures(h,Math.round(h.x)).chimneys[0];if(ch)smoke+=[0,1,2].map(k=>`<circle cx="${f1(ch[0])}" cy="${f1(ch[1])}" r="1.2" class="cl-puff" style="animation-delay:${-(k*1.8+i*.7).toFixed(1)}s"/>`).join('');});
    return s+`<g class="cl-smoke">${smoke}</g>`;}

  /* ---------- water and wild (0.37) ---------- */
  const nearestOn=(pts,tx,ty)=>{let bi=0,bd=1e9;pts.forEach(([x,y],i)=>{const d=Math.hypot(x-tx,y-ty);if(d<bd){bd=d;bi=i;}});return bi;};
  /* A cascade of `steps` drops down a river: curved lips spilling a pale sheet of water,
     foam at each foot, and a rocky gorge wall on either bank. Animated falling. */
  function falls(river,tx,ty,steps,w,name){const pts=river.path,i=nearestOn(pts,tx,ty),[x,y]=pts[i],[x2,y2]=pts[Math.min(pts.length-1,i+3)],ang=Math.atan2(y2-y,x2-x)*180/Math.PI-90,R=CW.rng(Math.round(tx*3+ty));
    const L=steps*5.6+3;let s=`<g class="cl-falls" transform="translate(${f1(x)} ${f1(y)}) rotate(${f1(ang)})">`;
    // The banks break into boulders and short cliff hatching, like the chart's other slopes.
    for(const d of[-1,1]){for(let k=0;k<steps+1;k++){const yy=k*5.6+(R()-.5)*2,bx=d*(w/2+1.4+R()*2.2),r=1.2+R()*1.4;s+=`<path d="M${f1(bx-r)} ${f1(yy+r*.5)} l${f1(r*.4)} ${f1(-r)} l${f1(r*1.1)} ${f1(-r*.3)} l${f1(r*.5)} ${f1(r*1.3)}z" fill="${d<0?'#b6aea4':'#9a9288'}" stroke="#3b2a1c" stroke-width=".3"/>`;}
      s+=`<path d="${[...Array(steps*2)].map((_,k)=>`M${f1(d*(w/2+.6))} ${f1(k*2.8+.6)} l${f1(d*2)} 1.4`).join(' ')}" stroke="rgba(40,30,24,.4)" stroke-width=".3"/>`;}
    for(let k=0;k<steps;k++){const yy=k*5.6,sx=(k%2?1:-1)*.5,a=-w/2+.5+sx,b=w/2-.5+sx;
      s+=`<path d="M${f1(a)} ${f1(yy)} Q${f1(sx)} ${f1(yy+2.2)} ${f1(b)} ${f1(yy)} L${f1(b+.2)} ${f1(yy+4.2)} Q${f1(sx)} ${f1(yy+6)} ${f1(a-.2)} ${f1(yy+4.2)}Z" fill="url(#clFallG)"/>`;
      s+=`<path class="cl-fall" d="${[...Array(Math.max(3,Math.round(w/2.2)))].map((_,j,arr)=>{const t=(j+.5)/arr.length,px=a+(b-a)*t;return`M${f1(px)} ${f1(yy+1.2+Math.sin(t*Math.PI)*1)} q.3 1.8 0 3.4`;}).join(' ')}" stroke="#8fbccb" stroke-width=".45" fill="none"/>`;
      s+=`<path d="M${f1(a-.4)} ${f1(yy)} Q${f1(sx)} ${f1(yy+2.2)} ${f1(b+.4)} ${f1(yy)}" fill="none" stroke="#5f5a54" stroke-width=".8" stroke-linecap="round"/>`;
      s+=[...Array(4)].map(()=>`<circle cx="${f1(a+(b-a)*R())}" cy="${f1(yy+4.6+R()*.8)}" r="${f1(.8+R()*.7)}" fill="#fffaf0" opacity=".92"/>`).join('');}
    s+=[0,1,2].map(k=>`<circle class="cl-spray" cx="${f1((k-1)*w*.3)}" cy="${f1(L+1)}" r="${f1(w*.3)}" fill="rgba(255,255,255,.55)" style="animation-delay:${-k*.9}s"/>`).join('')+'</g>';
    if(name)s+=`<text class="cl-lab water" x="${f1(x+w+8)}" y="${f1(y+steps*3)}" text-anchor="start">${name}</text>`;
    return s;}
  function wild(calm){let s='';
    s+=falls(CW.RIVERS[0],500,822,7,12,'Sevenfold Falls')+falls(CW.RIVERS[0],624,346,3,7,'');
    for(const sp of CW.SPRINGS)s+=`<g transform="translate(${sp.x} ${sp.y})"><circle r="2.6" fill="#8ec3c6" stroke="#2c4e5c" stroke-width=".45"/><circle r="1.2" fill="none" stroke="#fffaf0" stroke-width=".4"/><circle r="4.2" fill="none" stroke="#2c4e5c" stroke-width=".25" stroke-dasharray=".8 .8"/></g>`+(sp.name?`<text class="cl-lab small" x="${sp.x}" y="${sp.y+8}" text-anchor="middle">${sp.name}</text>`:'');
    s+=`<defs><linearGradient id="clFallG" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f2fafc"/><stop offset="1" stop-color="#a8d0dc"/></linearGradient></defs>`;
    // Heron Isle: two trees and its heron; Otter Rock stays bare stone.
    {const h=CW.ISLANDS[0];s+=[[-4,-1,3.4],[3,-2,2.8]].map(([dx,dy,r])=>`<path d="M${f1(h.x+dx)} ${f1(h.y+dy+1)} v${f1(-r*.6)}" stroke="#5b3f28" stroke-width=".7"/><circle cx="${f1(h.x+dx)}" cy="${f1(h.y+dy-r)}" r="${f1(r)}" fill="#8aa15e" stroke="#28402a" stroke-width=".7"/><circle cx="${f1(h.x+dx+r*.3)}" cy="${f1(h.y+dy-r*.7)}" r="${f1(r*.6)}" fill="rgba(40,64,32,.35)"/>`).join('')+`<g transform="translate(${h.x+8} ${h.y+1})"><ellipse cx="0" cy="-2" rx="1.6" ry=".9" fill="#b8bcc2" stroke="#3b2a1c" stroke-width=".25"/><path d="M1.2 -2.4 q1 -1 .6 -2.4 l1.6 .3 M-.4 -1.2 v1.4 M.4 -1.2 v1.4" fill="none" stroke="#6b6b6b" stroke-width=".35"/></g>`;
      const o=CW.ISLANDS[1];s+=`<path d="M${o.x-4} ${o.y+1} l2 -3 l3 -.6 l3 3.6z" fill="#a8a09a" stroke="#3b2a1c" stroke-width=".35"/>`;}
    for(const isl of CW.ISLANDS)s+=`<text class="cl-lab small" x="${isl.x}" y="${f1(isl.y+isl.ry+6)}" text-anchor="middle">${isl.name}</text>`;
    s+=`<text class="cl-lab small" x="${CW.RAPIDS.x+10}" y="${CW.RAPIDS.y+2}">${CW.RAPIDS.name}</text><text class="cl-lab small" x="${CW.WEIR.x+14}" y="${CW.WEIR.y-6}">${CW.WEIR.name}</text>`;
    // Fish leaping in the lake, and geese passing over.
    s+=[[470,1140,0],[540,1120,2.6],[420,1170,4.8]].map(([x,y,d])=>`<g transform="translate(${x} ${y})"><g class="cl-fish" style="animation-delay:${-d}s"><path d="M-1.6 0 q1.6 -1.4 3.2 0 q-1.6 1 -3.2 0z M1.6 0 l1 -.8 v1.6z" fill="#8ea6ae" stroke="#2c4e5c" stroke-width=".2"/></g></g><circle class="cl-splash" style="animation-delay:${-d}s" cx="${x}" cy="${y+1}" r="2" fill="none" stroke="#fffaf0" stroke-width=".4"/>`).join('');
    s+=`<g class="cl-geese">${[0,1,2,3,4,5,6].map(k=>{const o=k===0?0:Math.ceil(k/2)*(k%2?1:-1);return`<path d="M${f1(-Math.abs(o)*5)} ${f1(o*3.4)} q1.2 -1.4 2.4 0 q1.2 -1.4 2.4 0" fill="none" stroke="#3b2a1c" stroke-width=".5"/>`;}).join('')}</g>`;
    if(calm)return s;
    // Travellers on the roads, a pony and cart, and a boat crossing to Heron Isle.
    const legPath=(i,a=.12,b=.88)=>{const p=CW.routePaths()[i],n=p.length;return'M'+p.slice(Math.floor(n*a),Math.ceil(n*b)).map(q=>q.map(f1).join(' ')).join('L');};
    const walker=`<ellipse cx=".6" cy=".3" rx="1.8" ry=".5" fill="rgba(58,46,26,.25)"/><path d="M-.6 0 v-2 M.6 0 v-2" stroke="#3b2f26" stroke-width=".55"/><path d="M-1.3 -1.9 l.3 -2.6 q1 -.7 2 0 l.3 2.6z" fill="#3f6fb0" stroke="#3b2a1c" stroke-width=".25"/><rect x=".9" y="-4.6" width="1.4" height="2" fill="#8b5a32" stroke="#3b2a1c" stroke-width=".2"/><circle cy="-5.6" r="1" fill="#f2cfa8" stroke="#3b2a1c" stroke-width=".25"/><path d="M-1.8 -.2 l.6 -6" stroke="#6b4527" stroke-width=".35"/>`;
    const cart=`<ellipse cx="1" cy=".4" rx="5" ry=".8" fill="rgba(58,46,26,.25)"/><path d="M-5 -2.4 q0 -2.2 2 -2.2 h1 q.6 -1.2 1.6 -.6 l-.4 1.4 h.6 v1.4z" fill="#8b5a32" stroke="#3b2a1c" stroke-width=".25"/><path d="M-4.4 -1 v1 M-2 -1 v1" stroke="#5b3f28" stroke-width=".45"/><rect x="0" y="-4" width="5.6" height="2.6" fill="#b48a58" stroke="#3b2a1c" stroke-width=".3"/><path d="M.4 -4 l1.4 -1.6 h2.6 l1.2 1.6" fill="#e8dcc0" stroke="#3b2a1c" stroke-width=".25"/><circle cx="3" cy="-1" r="1.3" fill="none" stroke="#3b2a1c" stroke-width=".45"/>`;
    const mover=(fig,d,dur,delay)=>`<g class="cl-traveller">${fig}<animateMotion dur="${dur}s" begin="${-delay}s" repeatCount="indefinite" keyPoints="0;1;0" keyTimes="0;.5;1" calcMode="linear" path="${d}"/></g>`;
    s+=mover(walker,legPath(4),90,10)+mover(cart,legPath(1),120,40)+mover(walker,legPath(8),100,70)+mover(walker,legPath(10,.2,.8),110,25);
    s+=mover(`<path d="M-4 0 q4 2.4 8 0 l-.8 -1.2 h-6.4z" fill="#8b5a32" stroke="#3b2a1c" stroke-width=".35"/><circle cx="0" cy="-2.2" r=".9" fill="#f2cfa8" stroke="#3b2a1c" stroke-width=".2"/><path d="M-2 -.6 l-3 2 M2 -.6 l3 2" stroke="#6b4527" stroke-width=".35"/>`,'M427 1142 Q460 1128 490 1116',60,5);
    return s;}

  /* ---------- the map as an object (0.38) ---------- */
  const NOTES=[{x:452,y:414,t:'ford runs deep after spring rain',r:-4},{x:566,y:872,t:'see the Falls from here!',r:-6},{x:560,y:1718,t:'wolves? none seen',r:5},{x:446,y:246,t:'ask for lanterns at the mine',r:-3}];
  function object(){let s='';const W=CW.W,H=CW.H,b=5,t=10;
    // A neatline border with a graduated band, lettered every few leagues.
    s+=`<g class="cl-border"><rect x="${b}" y="${b}" width="${W-2*b}" height="${H-2*b}" fill="none" stroke="#3b2a1c" stroke-width=".9"/><rect x="${t}" y="${t}" width="${W-2*t}" height="${H-2*t}" fill="none" stroke="#3b2a1c" stroke-width=".4"/>`;
    let bars='';for(let y=t,i=0;y<H-t;y+=40,i++)if(i%2===0)bars+=`M${b} ${y}h${t-b}v${Math.min(40,H-t-y)}h${b-t}z M${W-t} ${y}h${t-b}v${Math.min(40,H-t-y)}h${b-t}z`;
    for(let x=t,i=0;x<W-t;x+=40,i++)if(i%2===0)bars+=`M${x} ${b}v${t-b}h${Math.min(40,W-t-x)}v${b-t}z M${x} ${H-t}v${t-b}h${Math.min(40,W-t-x)}v${b-t}z`;
    s+=`<path d="${bars}" fill="#3b2a1c" opacity=".75"/>`;
    for(let y=240;y<H-40;y+=240)s+=`<text class="cl-grat" x="${t+3}" y="${y+2}">${Math.round((H-y)/40)}</text><text class="cl-grat" x="${W-t-3}" y="${y+2}" text-anchor="end">${Math.round((H-y)/40)}</text>`;
    s+=[[t,t],[W-t,t],[t,H-t],[W-t,H-t]].map(([x,y])=>`<path d="M${x} ${y-4} l3 4 l-3 4 l-3 -4z" fill="#b8860b" stroke="#3b2a1c" stroke-width=".35"/>`).join('')+'</g>';
    // Scale bar in leagues (a league is forty chart units).
    const sx=664,sy=1806;s+=`<g class="cl-scale">${[0,1,2].map(i=>`<rect x="${sx+i*20}" y="${sy}" width="20" height="2.2" fill="${i%2?'#efe3c4':'#3b2a1c'}" stroke="#3b2a1c" stroke-width=".35"/>`).join('')}<rect x="${sx+60}" y="${sy}" width="20" height="2.2" fill="#3b2a1c" stroke="#3b2a1c" stroke-width=".35"/>${[0,1,2].map(i=>`<text class="cl-grat" x="${sx+i*40}" y="${sy-1.6}" text-anchor="middle">${i}</text>`).join('')}<text class="cl-grat" x="${sx+40}" y="${sy+8}" text-anchor="middle">leagues</text></g>`;
    // Notes pencilled by the cartographer.
    s+=NOTES.map(n=>`<text class="cl-note" x="${n.x}" y="${n.y}" text-anchor="middle" transform="rotate(${n.r} ${n.x} ${n.y})">${n.t}</text>`).join('');
    // Willowbrook: the explorer's own camp, beside two willows.
    const c=CW.CAMP;s+=`<g class="cl-camp" transform="translate(${c.x} ${c.y}) scale(1.7)">`+[[-16,-4],[14,-8]].map(([dx,dy])=>`<path d="M${dx} ${dy+6} v-8" stroke="#5b3f28" stroke-width=".8"/>`+[...Array(9)].map((_,k)=>{const a=Math.PI+k/8*Math.PI;return`<path d="M${f1(dx+Math.cos(a)*5)} ${f1(dy-2+Math.sin(a)*3)} q${f1(Math.cos(a)*1.6)} 3 ${f1(Math.cos(a)*1.2)} 7" fill="none" stroke="#7aa05a" stroke-width=".8"/>`;}).join('')).join('')+
      `<ellipse cx="2" cy="6" rx="16" ry="4" fill="rgba(180,196,128,.45)"/><path d="M-10 4 L-4 -6 L2 4Z" fill="#e8dcc0" stroke="#3b2a1c" stroke-width=".45"/><path d="M-4 -6 L2 4 H-1Z" fill="#cbbd9c"/><path d="M-5.4 4 L-4 0 L-2.6 4" fill="#6b4527"/><path d="M4 5 L9 -3 L14 5Z" fill="#c0503a" stroke="#3b2a1c" stroke-width=".45"/><path d="M9 -3 L14 5 H11.6Z" fill="#8f3a26"/>`+
      `<path d="M-1 8 l2 -2 l2 2 M-1.4 8.4 h4.8" stroke="#5b3f28" stroke-width=".5" fill="none"/><g class="cl-flame"><path d="M.2 7.4 q.8 -2.4 .8 -3.4 q.8 1.4 1 3.4z" fill="#f28a3a"/></g><path d="M9 -3 V-12" stroke="#3b2a1c" stroke-width=".5"/><path class="cl-pennant" d="M9 -12 h6 l-1.4 2 l1.4 2 h-6z" fill="#e0b24a" stroke="#3b2a1c" stroke-width=".3"/></g>`;
    return s;}

  /* ---------- whole layer ---------- */
  function markup(world,stages,opts={}){
    const R=CW.rng(23),lm=CW.LANDMARKS[2],s2=stages[2]|0,fresh=opts.fresh||{};
    let s=`<defs><radialGradient id="clLamp"><stop offset="0" stop-color="#ffdf8a" stop-opacity=".95"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient><linearGradient id="clMill" x1="0" x2="1"><stop offset="0" stop-color="#f1e6cc"/><stop offset=".6" stop-color="#dccfb1"/><stop offset="1" stop-color="#ab9c80"/></linearGradient><radialGradient id="clCloud"><stop offset="0" stop-color="#2a2a40" stop-opacity=".12"/><stop offset="1" stop-color="#2a2a40" stop-opacity="0"/></radialGradient></defs>`;
    // Water flows only where the ink has reached.
    const inked=inkCircles(stages),inInk=(x,y)=>opts.all||inked.some(k=>k.stage>=3&&Math.hypot(x-k.x,y-k.y)<k.r*.8);
    // Short separate pieces, so a phone repaints small areas rather than the whole river.
    for(const r of CW.RIVERS){if(r.w[1]<6)continue;const pts=r.path;for(let a=0;a<pts.length-8;a+=24){const chunk=pts.slice(a,a+26);const mid=chunk[chunk.length>>1];if(!inInk(mid[0],mid[1]))continue;let d='';for(const k of[-1,1]){const o=k*r.w[1]*.18;d+='M'+chunk.map(([x,y],i)=>{const q=chunk[Math.min(chunk.length-1,i+1)],p=chunk[Math.max(0,i-1)],an=Math.atan2(q[1]-p[1],q[0]-p[0])+Math.PI/2;return`${f1(x+Math.cos(an)*o)} ${f1(y+Math.sin(an)*o)}`;}).join('L');}s+=`<path class="cl-flow" d="${d}"/>`;}}
    // Labels in a cartographer's hand.
    // Lettered along the quiet stretch beside Stone Valley, clear of bridges and roads.
    const upper=CW.RIVERS[0].path.filter(([,y])=>y>548&&y<672);s+=`<path id="clRiverName" d="M${upper.map(([x,y])=>`${f1(x+16)} ${f1(y)}`).join('L')}" fill="none"/><text class="cl-lab river"><textPath href="#clRiverName" startOffset="4%">The Long River</textPath></text>`;
    s+=`<text class="cl-lab lake" x="${CW.LAKE.x+62}" y="${CW.LAKE.y+24}" text-anchor="middle">Sounding Lake</text>`;
    s+=`<text class="cl-lab region" x="440" y="1708" text-anchor="middle">Reedwater Fen</text><text class="cl-lab region" x="760" y="1080" text-anchor="middle" transform="rotate(-8 760 1080)">The Green Deep</text><text class="cl-lab region" x="292" y="252" text-anchor="middle" transform="rotate(-4 292 252)">Sunscorch Waste</text>`;
    s+=`<text class="cl-lab edge" transform="translate(22 1000) rotate(-90)" text-anchor="middle">terra incognita</text><text class="cl-lab edge" transform="translate(846 700) rotate(90)" text-anchor="middle">terra incognita</text>`;
    // A compass rose in the west, over the meadows.
    s+=`<g class="cl-compass" transform="translate(96 1060)"><circle r="21" fill="rgba(239,227,196,.55)" stroke="#3b2a1c" stroke-width=".6"/><circle r="17" fill="none" stroke="#3b2a1c" stroke-width=".35" stroke-dasharray="1 2"/>${[0,1,2,3].map(i=>`<g transform="rotate(${i*90})"><path d="M0 -26 L4 -4 L0 0Z" fill="#3b2a1c"/><path d="M0 -26 L-4 -4 L0 0Z" fill="#efe3c4" stroke="#3b2a1c" stroke-width=".5"/></g>`).join('')}${[0,1,2,3].map(i=>`<g transform="rotate(${45+i*90})"><path d="M0 -15 L2.4 -3 L0 0Z" fill="#8b5a32"/><path d="M0 -15 L-2.4 -3 L0 0Z" fill="#e0b24a"/></g>`).join('')}<circle r="2" fill="#e0b24a" stroke="#3b2a1c" stroke-width=".4"/><text y="-29" text-anchor="middle" class="cl-lab n">N</text></g>`;
    // The ferry on the Lakeshore Path: a rope across the channel and a raft that works it.
    {const{a:fa,b:fb}=lm.ferry,len=Math.hypot(fb[0]-fa[0],fb[1]-fa[1]),deg=Math.atan2(fb[1]-fa[1],fb[0]-fa[0])*180/Math.PI;
      s+=`<g class="cl-ferry" transform="translate(${fa[0]} ${fa[1]}) rotate(${f1(deg)})"><path d="M-2 -3.4 H${f1(len+2)}" stroke="#5b3f28" stroke-width=".45" stroke-dasharray="1.4 .6"/><circle cx="-2" cy="-3.4" r=".9" fill="#5b3f28"/><circle cx="${f1(len+2)}" cy="-3.4" r=".9" fill="#5b3f28"/><g class="cl-raft" style="--len:${f1(len-10)}px"><rect x="0" y="-2.6" width="9" height="5.2" rx=".6" fill="#b48a58" stroke="#3b2a1c" stroke-width=".45"/><path d="M1.8 -2.6 V2.6 M3.6 -2.6 V2.6 M5.4 -2.6 V2.6 M7.2 -2.6 V2.6" stroke="rgba(60,36,18,.5)" stroke-width=".3"/><circle cx="4.5" cy="-.6" r="1.3" fill="#f2cfa8" stroke="#3b2a1c" stroke-width=".35"/><path d="M3.4 .4 h2.2 v1.4 h-2.2z" fill="#2f8f8a"/><path d="M4.5 -1.6 V-3.4" stroke="#6b4527" stroke-width=".5"/></g></g>`;}
    // Double River: the twin crossing, the hamlet's life and the mill.
    s+=`<g class="cl-realm cl-r2 s${s2}">`+lm.bridges.map(b=>bridge(b,s2,!!fresh[2],R)).join('')+mill(lm.mill,s2);
    if(s2>=3){s+=boat(lm.boat);const feats=lm.houses.map((o,i)=>CP.houseFeatures(o,Math.round(o.x)));
      s+=`<g class="cl-smoke">${feats.flatMap((f,i)=>f.chimneys.map(([x,y])=>[0,1,2,3].map(k=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="1.3" class="cl-puff" style="animation-delay:${-(k*1.4+i*.6).toFixed(1)}s"/>`).join(''))).join('')}</g>`;
      s+=`<g class="cl-windows">${feats.flatMap(f=>f.windows.map(p=>`<polygon points="${p.map(q=>q.map(f1).join(',')).join(' ')}" class="cl-win"/>`)).join('')}</g>`;}
    s+='</g>';
    // Every other realm's landmark, at its own stage.
    if(CR)s+=CR.markup(stages,fresh);
    // The places between the realms, and the water and wildlife around them.
    s+=places()+wild(!!opts.calm)+object();
    // Life over the whole chart: cloud shadows and birds.
    s+=`<g class="cl-sky">${[0,1,2,3].map(i=>`<path class="cl-bird" style="animation-delay:${-i*1.3}s;--dy:${i*10}px" d="M-4 0 Q-2 -2.6 0 0 Q2 -2.6 4 0"/>`).join('')}</g>`;
    s+=`<circle class="cl-wet" cx="0" cy="0" r="0"/>`;
    return s;
  }
  /* Night lights, drawn above the darkened chart so windows and lanterns really shine. */
  function glowMarkup(stages){
    const out=[],lm=CW.LANDMARKS[2];
    if((stages[2]|0)>=3){for(const b of lm.bridges)for(const x of[-b.len/2,0,b.len/2])out.push(['c',b.x+x,b.y-27,10]);
      for(const o of lm.houses)for(const p of CP.houseFeatures(o,Math.round(o.x)).windows)out.push(['p',p]);out.push(['r',lm.mill.x-1.1,lm.mill.y-16,2.2,2.8]);}
    if(CR){CR.markup(stages,{});out.push(...CR.glows);}
    // Every settlement's windows light at night, whatever the realms around them.
    for(const q of CW.SETTLEMENTS)for(const b of CW.buildingsFor(q))if(b.type==='house')for(const p of CP.houseFeatures(b,Math.round(b.x)).windows)out.push(['p',p]);
    const halo=[],pane=[];
    for(const g of out){if(g[0]==='c')halo.push(`<circle cx="${f1(g[1])}" cy="${f1(g[2])}" r="${f1(g[3]*1.5)}" fill="url(#cgLamp)"/>`);
      else{const pts=g[0]==='p'?g[1]:[[g[1],g[2]],[g[1]+g[3],g[2]],[g[1]+g[3],g[2]+g[4]],[g[1],g[2]+g[4]]],cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;
        halo.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="6.5" fill="url(#cgWin)"/>`);pane.push(`<polygon points="${pts.map(p=>p.map(f1).join(',')).join(' ')}"/>`);}}
    return `<defs><radialGradient id="cgLamp"><stop offset="0" stop-color="#ffe7a0" stop-opacity=".95"/><stop offset=".3" stop-color="#ffc766" stop-opacity=".72"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient><radialGradient id="cgWin"><stop offset="0" stop-color="#ffd98a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><g class="cg-halo">${halo.join('')}</g><g class="cg-pane" fill="#ffdc7a">${pane.join('')}</g>`;
  }
  const api={INK_RADIUS,stageFor,inkCircles,maskURL,markup,glowMarkup};
  root.ChartLandmarks=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
