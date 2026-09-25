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

  /* ---------- whole layer ---------- */
  function markup(world,stages,opts={}){
    const R=CW.rng(23),lm=CW.LANDMARKS[2],s2=stages[2]|0,fresh=opts.fresh||{};
    let s=`<defs><radialGradient id="clLamp"><stop offset="0" stop-color="#ffdf8a" stop-opacity=".95"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient><linearGradient id="clMill" x1="0" x2="1"><stop offset="0" stop-color="#f1e6cc"/><stop offset=".6" stop-color="#dccfb1"/><stop offset="1" stop-color="#ab9c80"/></linearGradient><radialGradient id="clCloud"><stop offset="0" stop-color="#2a2a40" stop-opacity=".12"/><stop offset="1" stop-color="#2a2a40" stop-opacity="0"/></radialGradient></defs>`;
    // Water flows only where the ink has reached.
    const inked=inkCircles(stages),inInk=(x,y)=>opts.all||inked.some(k=>k.stage>=3&&Math.hypot(x-k.x,y-k.y)<k.r*.8);
    // Short separate pieces, so a phone repaints small areas rather than the whole river.
    for(const r of CW.RIVERS){if(r.w[1]<6)continue;const pts=r.path;for(let a=0;a<pts.length-8;a+=24){const chunk=pts.slice(a,a+26);const mid=chunk[chunk.length>>1];if(!inInk(mid[0],mid[1]))continue;let d='';for(const k of[-1,1]){const o=k*r.w[1]*.18;d+='M'+chunk.map(([x,y],i)=>{const q=chunk[Math.min(chunk.length-1,i+1)],p=chunk[Math.max(0,i-1)],an=Math.atan2(q[1]-p[1],q[0]-p[0])+Math.PI/2;return`${f1(x+Math.cos(an)*o)} ${f1(y+Math.sin(an)*o)}`;}).join('L');}s+=`<path class="cl-flow" d="${d}"/>`;}}
    // Labels in a cartographer's hand.
    const upper=CW.RIVERS[0].path.slice(165,215);s+=`<path id="clRiverName" d="M${upper.map(([x,y])=>`${f1(x+14)} ${f1(y)}`).join('L')}" fill="none"/><text class="cl-lab river"><textPath href="#clRiverName" startOffset="6%">The Long River</textPath></text>`;
    s+=`<text class="cl-lab lake" x="${CW.LAKE.x+62}" y="${CW.LAKE.y+24}" text-anchor="middle">Sounding Lake</text>`;
    s+=`<text class="cl-lab region" x="620" y="1800" text-anchor="middle">Reedwater Fen</text><text class="cl-lab region" x="760" y="1080" text-anchor="middle" transform="rotate(-8 760 1080)">The Green Deep</text><text class="cl-lab region" x="236" y="298" text-anchor="middle" transform="rotate(-6 236 298)">Sunscorch Waste</text>`;
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
    const halo=[],pane=[];
    for(const g of out){if(g[0]==='c')halo.push(`<circle cx="${f1(g[1])}" cy="${f1(g[2])}" r="${f1(g[3]*1.5)}" fill="url(#cgLamp)"/>`);
      else{const pts=g[0]==='p'?g[1]:[[g[1],g[2]],[g[1]+g[3],g[2]],[g[1]+g[3],g[2]+g[4]],[g[1],g[2]+g[4]]],cx=pts.reduce((a,p)=>a+p[0],0)/pts.length,cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;
        halo.push(`<circle cx="${f1(cx)}" cy="${f1(cy)}" r="6.5" fill="url(#cgWin)"/>`);pane.push(`<polygon points="${pts.map(p=>p.map(f1).join(',')).join(' ')}"/>`);}}
    return `<defs><radialGradient id="cgLamp"><stop offset="0" stop-color="#ffe7a0" stop-opacity=".95"/><stop offset=".3" stop-color="#ffc766" stop-opacity=".72"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient><radialGradient id="cgWin"><stop offset="0" stop-color="#ffd98a" stop-opacity=".85"/><stop offset="1" stop-color="#ffb347" stop-opacity="0"/></radialGradient></defs><g class="cg-halo">${halo.join('')}</g><g class="cg-pane" fill="#ffdc7a">${pane.join('')}</g>`;
  }
  const api={INK_RADIUS,stageFor,inkCircles,maskURL,markup,glowMarkup};
  root.ChartLandmarks=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
