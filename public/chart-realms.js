/* Realm landmarks on the hand-drawn chart. Each realm's landmark is drawn at its
   stage: 0 ruins, 1 foundation, 2 walls (lessons), 3 restored, 4 celebrated.
   Restored places come alive (smoke, boats, birds, fireflies, flags) and light
   their windows and lanterns at night. Pure SVG markup; no app state. */
(function(root){
  'use strict';
  const f1=v=>+(+v).toFixed(1),TAU=Math.PI*2,INK='#3b2a1c';
  const CW=typeof module!=='undefined'&&module.exports?require('./chart-world'):root.ChartWorld,SITES=CW.SITES;

  /* ---------- the parts kit ---------- */
  // Lights of restored places, gathered for the night glow layer (see ChartLandmarks.glowMarkup).
  let COLLECT=null,UID=0;const quiet=fn=>{const c=COLLECT;COLLECT=null;const out=fn();COLLECT=c;return out;};
  const light=(x,y,r=8)=>{COLLECT&&COLLECT.push(['c',x,y,r]);return'';};
  const uid=p=>`${p}${++UID}`;
  const shade=(hex,k)=>{const n=parseInt(hex.slice(1),16),f=c=>Math.max(0,Math.min(255,Math.round(k<0?c*(1+k):c+(255-c)*k)));return'#'+[f(n>>16),f(n>>8&255),f(n&255)].map(c=>c.toString(16).padStart(2,'0')).join('');};
  const P=(d,fill='none',stroke=INK,w=.45,x='')=>`<path d="${d}" fill="${fill}" stroke="${stroke}" stroke-width="${w}"${x}/>`;
  const RC=(x,y,w,h,fill,stroke=INK,sw=.35,x2='')=>`<rect x="${f1(x)}" y="${f1(y)}" width="${f1(w)}" height="${f1(h)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${x2}/>`;
  const CI=(x,y,r,fill,stroke=INK,sw=.35,x2='')=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="${f1(r)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${x2}/>`;
  const EL=(x,y,rx,ry,fill,stroke='none',sw=.35,x2='')=>`<ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(rx)}" ry="${f1(ry)}" fill="${fill}" stroke="${stroke}" stroke-width="${sw}"${x2}/>`;
  const shadow=(x,y,rx,ry=rx*.28,a=.22)=>EL(x,y,rx,ry,`rgba(58,46,26,${a})`);
  const bit=(d,html)=>`<g class="cl-bit" style="--d:${d}s">${html}</g>`;
  /* Ground is watercolour, never a hard shape: a soft blob in three feathered layers. */
  const blob=(cx,cy,rx,ry,R,j=.14,n=14)=>{const pts=[...Array(n)].map((_,i)=>{const t=i/n*TAU,m=1+(R()-.5)*j*2;return[cx+Math.cos(t)*rx*m,cy+Math.sin(t)*ry*m];});const mid=(a,b)=>[(a[0]+b[0])/2,(a[1]+b[1])/2];let d=`M${mid(pts[n-1],pts[0]).map(f1).join(' ')}`;for(let i=0;i<n;i++){const m=mid(pts[i],pts[(i+1)%n]);d+=`Q${f1(pts[i][0])} ${f1(pts[i][1])} ${f1(m[0])} ${f1(m[1])}`;}return d+'Z';};
  const wash=(cx,cy,rx,ry,col,R,a=.5)=>[1,.82,.62].map((k,i)=>`<path d="${blob(cx,cy,rx*k,ry*k,R)}" fill="${col}" opacity="${f1(a*(.32+i*.12))}"/>`).join('');
  const tufts=(cx,cy,rx,ry,n,R,col='#6b7a42')=>{let d='';for(let i=0;i<n;i++){const a=R()*TAU,r=Math.sqrt(R()),x=cx+Math.cos(a)*rx*r,y=cy+Math.sin(a)*ry*r;d+=`M${f1(x-1.2)} ${f1(y-1.6)} L${f1(x-.3)} ${f1(y)} M${f1(x)} ${f1(y-2.2)} V${f1(y)} M${f1(x+1.2)} ${f1(y-1.6)} L${f1(x+.3)} ${f1(y)}`;}return`<path d="${d}" fill="none" stroke="${col}" stroke-width=".32" opacity=".7"/>`;};
  /* A hillside falling away beneath a landmark, hatched with fall-lines like the chart's own slopes:
     `edge` is the brow as [x,y] points; strokes run downhill and outward, darker on the shaded right. */
  const apron=(edge,depth,R,col='#b9a878')=>{const cx=edge.reduce((a,p)=>a+p[0],0)/edge.length,xs=edge.map(p=>p[0]),w=(Math.max(...xs)-Math.min(...xs))/2;
    const lo=edge.map(([x,y])=>{const t=(x-cx)/w;return[x+t*depth*.9,y+depth*(1-.35*t*t)];}).reverse();
    let o=`<path d="M${edge.map(p=>p.map(f1).join(' ')).join('L')}L${lo.map(p=>p.map(f1).join(' ')).join('L')}Z" fill="${col}" opacity=".4"/>`+wash(cx,edge[0][1]+depth*.7,w+depth,depth*.8,col,R,.3);
    let d='',dd='';for(let i=0;i<edge.length-1;i++){const[a,b]=[edge[i],edge[i+1]];for(let t=0;t<1;t+=.34){const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t,u=(x-cx)/w,len=depth*(.45+R()*.35)*(1-.3*u*u),str=`M${f1(x)} ${f1(y+.6)} q${f1(u*1.6)} ${f1(len*.5)} ${f1(u*depth*.35)} ${f1(len)}`;if(u>.1)dd+=str;else d+=str;}}
    return o+P(d,'none','rgba(70,52,32,.55)',.4)+P(dd,'none','rgba(56,38,22,.78)',.45);};
  /* Trees in the chart's own manner: every lobe inked, then painted over, so only the scalloped edge shows. */
  const canopy=(x,y,r,col,R,n=6,edge='#28402a',shadeCol='rgba(40,64,32,.38)')=>{const bl=[[0,0,r*.62]];for(let k=0;k<n;k++){const a=k/n*TAU+R()*.5;bl.push([Math.cos(a)*r*.5,Math.sin(a)*r*.42,r*(.4+R()*.16)]);}
    return bl.map(([dx,dy,rr])=>CI(x+dx,y+dy,rr,'none',edge,1.3)).join('')+bl.map(([dx,dy,rr])=>CI(x+dx,y+dy,rr,col,'none',0)).join('')+bl.map(([dx,dy,rr])=>dx<-r*.1&&dy<0?'':CI(x+dx+rr*.3,y+dy+rr*.3,rr*.7,shadeCol,'none',0)).join('')+CI(x-r*.3,y-r*.35,r*.26,'rgba(232,242,196,.5)','none',0);};
  const clip=(pts,html)=>{const id=uid('crc');return`<clipPath id="${id}"><path d="${pts}"/></clipPath><g clip-path="url(#${id})">${html}</g>`;};
  /* Coursed stone: rows of blocks in slightly different tones, joints drawn. */
  const masonry=(x,y,w,h,base,R,ch=2.2)=>{ch=Math.max(ch,2.6);let s='';for(let yy=y,row=0;yy<y+h-.05;yy+=ch,row++){const hh=Math.min(ch,y+h-yy);let xx=x-(row%2?1.8:0);while(xx<x+w-.05){const ww=3.4+R()*2.8,x0=Math.max(x,xx),w0=Math.min(xx+ww,x+w)-x0;if(w0>.25)s+=RC(x0,yy,w0,hh,shade(base,(R()-.5)*.16),'rgba(52,36,22,.42)',.22);xx+=ww;}}return s;};
  /* Scalloped shingles or tiles filling a roof outline. */
  const shingles=(outline,x0,y0,x1,y1,col,R,row=1.8,w=2)=>{row=Math.max(row,2.2);w=Math.max(w,2.6);let s='';for(let y=y0,r=0;y<y1;y+=row,r++)for(let x=x0-(r%2?w/2:0);x<x1;x+=w)s+=`<path d="M${f1(x)} ${f1(y)} q${f1(w/2)} ${f1(row*.9)} ${f1(w)} 0" fill="${shade(col,(R()-.5)*.18)}" stroke="rgba(30,20,12,.45)" stroke-width=".22"/>`;return clip(outline,RC(x0,y0-row,x1-x0,y1-y0+row,col,'none',0)+s);};
  const windowS=(x,y,w=2.4,h=3,shut='#4f7f86',arch=false)=>{COLLECT&&COLLECT.push(['r',x,y,w,h]);const top=arch?`M${f1(x)} ${f1(y+w/2)} a${f1(w/2)} ${f1(w/2)} 0 0 1 ${f1(w)} 0`:`M${f1(x)} ${f1(y)} h${w}`;
    return(shut?RC(x-1.1,y,1,h,shut,INK,.22)+RC(x+w+.1,y,1,h,shut,INK,.22):'')+P(arch?`${top} v${f1(h-w/2)} h${-w}z`:`M${f1(x)} ${f1(y)} h${w} v${h} h${-w}z`,'#33434b',INK,.3)+P(arch?`${top} v${f1(h-w/2)} h${-w}z`:`M${f1(x)} ${f1(y)} h${w} v${h} h${-w}z`,'#ffd36b','none',0,' class="cl-win"')+P(`M${f1(x+w/2)} ${f1(y+(arch?w/2:0))} v${f1(h-(arch?w/2:0))} M${f1(x)} ${f1(y+h*.55)} h${w}`,'none','#e8dcc0',.28)+RC(x-.3,y+h,w+.6,.6,'#cfc1a0',INK,.2);};
  const door=(x,y,w=2.6,h=4)=>P(`M${f1(x)} ${f1(y)} v${f1(-h+w/2)} a${f1(w/2)} ${f1(w/2)} 0 0 1 ${f1(w)} 0 v${f1(h-w/2)}z`,'#6b4527',INK,.35)+P(`M${f1(x+w/3)} ${f1(y)} v${f1(-h+1)} M${f1(x+w*2/3)} ${f1(y)} v${f1(-h+1)}`,'none','rgba(30,18,8,.55)',.2)+CI(x+w-.6,y-h*.45,.25,'#e0b24a','none',0);
  const smoke=(x,y,n=4,k=0)=>`<g class="cl-smoke">${[...Array(n)].map((_,i)=>`<circle cx="${f1(x)}" cy="${f1(y)}" r="1.3" class="cl-puff" style="animation-delay:${-(i*1.4+k*.6).toFixed(1)}s"/>`).join('')}</g>`;
  const chimney=(x,y,h=5,col='#a5553b',puff=false,k=0)=>RC(x-1.2,y-h,2.4,h,col,INK,.3)+P(`M${f1(x-1.2)} ${f1(y-h*.4)} h2.4 M${f1(x-1.2)} ${f1(y-h*.75)} h2.4`,'none','rgba(30,15,8,.5)',.2)+RC(x-1.6,y-h-.8,3.2,.8,'#6f5f4c',INK,.25)+(puff?smoke(x,y-h-1.4,4,k):'');
  /* Hanging lantern on an iron crook, as along a quay or causeway. */
  const lampPost=(x,y,h=11,dir=1)=>{const lx=x+dir*2.4,ly=y-h+2.2;light(lx,ly+1,9);return`<circle cx="${f1(lx)}" cy="${f1(ly+1)}" r="8" fill="url(#clLamp)" class="cl-glow"/>`+RC(x-.9,y-1,1.8,1,'#3b2f26','none',0)+P(`M${x} ${y} V${f1(y-h)} q0 -1.6 ${f1(dir*1.6)} -1.6 q${f1(dir*.8)} 0 ${f1(dir*.8)} 1.4`,'none','#2b1c10',.65)+P(`M${f1(lx-1.1)} ${f1(ly)} h2.2 l-.3 2.6 h-1.6z`,'#f7d26e',INK,.3,' class="cl-lamp"')+P(`M${f1(lx-1.4)} ${f1(ly)} L${f1(lx)} ${f1(ly-1.4)} L${f1(lx+1.4)} ${f1(ly)}Z`,'#2b1c10','none',0);};
  const lamp=(x,y,h=9)=>{light(x,y-h-1.5,9);return`<circle cx="${x}" cy="${f1(y-h-1.5)}" r="8" fill="url(#clLamp)" class="cl-glow"/>`+P(`M${x} ${y} V${f1(y-h)}`,'none','#2b1c10',.7)+P(`M${f1(x-1.4)} ${f1(y-h-3)} h2.8 l-.4 3 h-2z`,'#f7d26e',INK,.3,' class="cl-lamp"')+P(`M${f1(x-1.9)} ${f1(y-h-3)} L${x} ${f1(y-h-5.2)} L${f1(x+1.9)} ${f1(y-h-3)}Z`,'#2b1c10','none',0);};
  const lantern=(x,y,col='#e8553a')=>{light(x,y,6.5);return`<circle cx="${x}" cy="${y}" r="6" fill="url(#clLamp)" class="cl-glow"/>`+P(`M${x} ${f1(y-3.4)} V${f1(y-2.2)}`,'none','#2b1c10',.4)+EL(x,y,1.7,2.2,col,INK,.35)+P(`M${f1(x-1)} ${f1(y-2)} h2 M${f1(x-1)} ${f1(y+2)} h2`,'none','#2b1c10',.5)+P(`M${f1(x-.6)} ${f1(y-1.6)} v3.2`,'none','rgba(255,240,200,.6)',.3);};
  const flag=(x,y,col,h=10,d=0,col2)=>P(`M${x} ${y} V${y-h}`,'none','#2b1c10',.6)+CI(x,y-h-.5,.5,'#e0b24a','none',0)+`<path class="cl-banner" style="animation-delay:${-d}s" d="M${x} ${y-h} h7 l-1.6 2.4 l1.6 2.4 h-7z" fill="${col}" stroke="${INK}" stroke-width=".3"/>`+(col2?P(`M${x} ${f1(y-h+1.6)} h5.6`,'none',col2,.8):'');
  const bunting=(x1,y1,x2,y2,sag,cols)=>{const n=Math.max(4,Math.round(Math.hypot(x2-x1,y2-y1)/4));let s=P(`M${x1} ${y1} Q${(x1+x2)/2} ${(y1+y2)/2+sag*2} ${x2} ${y2}`,'none',INK,.28);for(let i=0;i<n;i++){const t=(i+.5)/n,x=(1-t)**2*x1+2*t*(1-t)*(x1+x2)/2+t*t*x2,y=(1-t)**2*y1+2*t*(1-t)*((y1+y2)/2+sag*2)+t*t*y2;s+=P(`M${f1(x-1.1)} ${f1(y)} h2.2 l-1.1 2.2z`,cols[i%cols.length],'none',0);}return s;};
  const person=(x,y,shirt,hat,s=1)=>shadow(x+.6*s,y+.2,1.8*s,.5*s,.18)+P(`M${f1(x-.6*s)} ${y} v${f1(-2.2*s)} M${f1(x+.6*s)} ${y} v${f1(-2.2*s)}`,'none','#3b2f26',.6*s)+P(`M${f1(x-1.4*s)} ${f1(y-2*s)} l.3 ${f1(-2.8*s)} q${f1(1.1*s)} ${f1(-.8*s)} ${f1(2.2*s)} 0 l.3 ${f1(2.8*s)}z`,shirt,INK,.3)+CI(x,y-6*s,1.1*s,'#f2cfa8',INK,.3)+(hat?P(`M${f1(x-1.8*s)} ${f1(y-6.4*s)} h${f1(3.6*s)} M${f1(x-1*s)} ${f1(y-6.4*s)} q${f1(1*s)} ${f1(-1.8*s)} ${f1(2*s)} 0`,hat,hat,.5):'');
  const barrel=(x,y,s=1)=>shadow(x+1,y+.3,2.2*s)+P(`M${f1(x-1.6*s)} ${y} q-.4 ${f1(-2*s)} 0 ${f1(-4*s)} h${f1(3.2*s)} q.4 ${f1(2*s)} 0 ${f1(4*s)}z`,'#9a6a3c',INK,.3)+P(`M${f1(x-1.8*s)} ${f1(y-1.2*s)} h${f1(3.6*s)} M${f1(x-1.8*s)} ${f1(y-2.8*s)} h${f1(3.6*s)}`,'none','#4a3a2a',.35);
  const crate=(x,y,s=1)=>shadow(x+1,y+.3,2.4*s)+RC(x-2*s,y-3.6*s,4*s,3.6*s,'#c09560',INK,.3)+P(`M${f1(x-2*s)} ${f1(y-3.6*s)} l${f1(4*s)} ${f1(3.6*s)} M${f1(x-2*s)} ${f1(y-1.8*s)} h${f1(4*s)}`,'none','#7a5230',.3);
  const reeds=(x,y,R,n=5)=>{let s='';for(let i=0;i<n;i++){const bx=x+(i-n/2)*.9,tx=bx+(R()-.5)*2.6,ty=y-3-R()*3.4;s+=`<path d="M${f1(bx)} ${y} Q${f1(bx)} ${f1(y-1.6)} ${f1(tx)} ${f1(ty)}" stroke="#5d6b3a" stroke-width=".42" fill="none"/>`;if(i%2)s+=EL(tx,ty+.9,.5,1.1,'#6b4a2e');}return s;};
  const lily=(x,y,r=1.8,bloom=false)=>P(`M${f1(x)} ${f1(y)} l${f1(r)} -.4 a${f1(r)} ${f1(r*.6)} 0 1 1 -.2 .8z`,'#6f9a4a','#3f5a2a',.25)+(bloom?CI(x+.4,y-.5,.7,'#f4c6d6','#a0607a',.2):'');
  const ripple=(x,y,r)=>P(`M${f1(x-r)} ${f1(y)} q${f1(r)} ${f1(r*.35)} ${f1(r*2)} 0`,'none','rgba(255,250,240,.7)',.35);
  const firefly=(x,y,d)=>`<circle cx="${f1(x)}" cy="${f1(y)}" r=".9" class="cl-fly" style="animation-delay:${-d}s"/>`;
  const bird=(x,y,d=0,col=INK)=>`<path class="cl-gull" style="animation-delay:${-d}s" d="M${x-3} ${y} q1.5 -1.8 3 0 q1.5 -1.8 3 0" fill="none" stroke="${col}" stroke-width=".55"/>`;
  const gullSitting=(x,y)=>EL(x,y-1,1.6,.9,'#f6f2ea',INK,.25)+CI(x+1.3,y-1.8,.6,'#f6f2ea',INK,.2)+P(`M${f1(x+1.9)} ${f1(y-1.8)} l.8 .2`,'none','#e0a030',.3)+P(`M${f1(x-1.5)} ${f1(y-1.2)} l-.9 -.3`,'none','#555',.4);
  const conifer=(x,y,h,col='#58765a')=>shadow(x+2,y+.3,3,.8)+P(`M${x} ${f1(y-h)} L${f1(x+h*.32)} ${y} H${f1(x-h*.32)}Z`,col,'#22321f',.4)+P(`M${x} ${y} v1.2`,'none','#5b3f28',.6);
  /* A cottage at three-quarters with tiled roof, shuttered windows and a chimney. */
  const cottage=(x,y,w,h,roof,R,opts={})=>{const wall=opts.wall||'#efe3c6',d=w*.42,rh=w*.5,dx=d*.8,dy=-d*.45;let s=shadow(x+w*.35,y+.6,w*.8,1.6);
    s+=P(`M${x+w/2} ${y} l${f1(dx)} ${f1(dy)} v${-h} l${f1(-dx)} ${f1(-dy)}z`,shade(wall,-.2),INK,.4);
    s+=RC(x-w/2,y-h,w,h,wall,INK,.45)+(opts.timber?P(`M${x-w/2} ${f1(y-h*.52)} h${w} M${x-w/2+1} ${y-h} l${f1(w/2-1)} ${f1(h*.48)} M${x+w/2-1} ${y-h} l${f1(-w/2+1)} ${f1(h*.48)}`,'none','#5b3f28',.7):'');
    const A=[x,y-h-rh],roofPts=`M${f1(A[0])} ${f1(A[1])} l${f1(dx)} ${f1(dy)} L${f1(x+w/2+dx+1.2)} ${f1(y-h+dy+.7)} L${f1(x+w/2+1.2)} ${f1(y-h+.7)}Z`;
    s+=P(`M${f1(x-w/2-1.2)} ${f1(y-h+.7)} L${A[0]} ${A[1]} L${f1(x+w/2+1.2)} ${f1(y-h+.7)}Z`,wall,INK,.4);
    s+=shingles(roofPts,x-1,A[1]-6,x+w/2+dx+3,y-h+2,roof,R,1.5,1.8)+P(roofPts,'none',INK,.5)+P(`M${f1(A[0])} ${f1(A[1])} l${f1(dx)} ${f1(dy)}`,'none',shade(roof,-.4),.8);
    s+=door(x-1.3+(opts.door||0),y,2.6,Math.min(4.4,h*.55))+windowS(x-w/2+1.4,y-h*.78,2,2.4,opts.shutter||'#4f7f86')+windowS(x+w/2-3.4,y-h*.78,2,2.4,opts.shutter||'#4f7f86');
    if(opts.chimney!==false)s+=chimney(x+w/2+dx*.35,y-h-rh*.42+dy*.4,5.5,'#a5553b',!!opts.smoke,opts.k||0);
    if(opts.box)s+=RC(x-w/2+1,y-h*.78+3.2,2.6,.9,'#7a5230',INK,.2)+CI(x-w/2+1.6,y-h*.78+3,.45,'#e7708a','none',0)+CI(x-w/2+2.6,y-h*.78+3,.45,'#f2c24e','none',0);
    return s;};
  const palm=(x,y,s,lean,R)=>{let o=shadow(x+2,y+.4,4*s,1*s,.18)+P(`M${f1(x)} ${f1(y)} q${f1(lean*.3)} ${f1(-7*s)} ${f1(lean)} ${f1(-13*s)}`,'none','#7a5a34',f1(1.2*s));
    for(let k=1;k<7;k++){const t=k/7,px=x+lean*t*t,py=y-13*s*t;o+=P(`M${f1(px-.6*s)} ${f1(py)} l${f1(1.2*s)} -.4`,'none','#5a4028',.3);}
    const tx=x+lean,ty=y-13*s;for(let k=0;k<7;k++){const a=-Math.PI/2+(k-3)*.55+(R()-.5)*.2,l=(6.5+R()*1.5)*s,ex=tx+Math.cos(a)*l,ey=ty+Math.sin(a)*l*.6+l*.4;
      o+=P(`M${f1(tx)} ${f1(ty)} Q${f1(tx+Math.cos(a)*l*.6)} ${f1(ty+Math.sin(a)*l*.6-2*s)} ${f1(ex)} ${f1(ey)} Q${f1(tx+Math.cos(a)*l*.45)} ${f1(ty+Math.sin(a)*l*.45+.8*s)} ${f1(tx)} ${f1(ty)}`,k%2?'#5f9a4f':'#4f8a45','#2a4a26',.3)+P(`M${f1(tx)} ${f1(ty)} Q${f1(tx+Math.cos(a)*l*.55)} ${f1(ty+Math.sin(a)*l*.55-1.2*s)} ${f1(ex)} ${f1(ey)}`,'none','rgba(30,50,26,.6)',.2);}
    return o+CI(tx-.6,ty+.8,.8*s,'#5b3f28','none',0)+CI(tx+.7,ty+1,.8*s,'#6b4527','none',0);};

  /* ---------- the landmarks ---------- */
  const LANDMARK={
    // Zero Marsh: the lantern causeway, plank by plank across the fen.
    0(st,R){const P0=[[-48,26],[-24,12],[0,20],[24,4],[46,-10]];let s='';
      s+=[[-40,34],[-12,30],[12,12],[38,-2],[-30,18],[30,16]].map(([x,y])=>reeds(x,y,R,4+Math.floor(R()*3))).join('');
      s+=[[-34,30,1.6],[-6,28,2],[18,14,1.4],[32,8,1.8],[-16,22,1.5]].map(([x,y,r],i)=>lily(x,y,r,i%2===0)).join('');
      const segs=P0.slice(1).map((b,i)=>[P0[i],b]);
      if(st===0){s+=[[-24,12,-18],[0,20,14],[24,4,-22],[46,-10,8]].map(([x,y,a])=>`<g transform="translate(${x} ${y}) rotate(${a})">${RC(-.7,-5,1.4,7,'#8a7c68',INK,.3)}</g>`).join('');
        s+=[[-34,22,20],[-8,24,-10],[12,14,35]].map(([x,y,a])=>`<g transform="translate(${x} ${y}) rotate(${a})">${RC(-3,-.8,6,1.6,'#9a8c74',INK,.3)}</g>`).join('')+ripple(-34,24,3)+ripple(12,16,3);
        return s+`<g transform="translate(6 24) rotate(70)">${quiet(()=>lantern(0,0,'#9a948a'))}</g>`;}
      // Posts, two to each plank run, with their reflections.
      let posts='';segs.forEach(([a,b],si)=>{for(let t=0;t<1;t+=.34){const x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;for(const o of[-2.8,2.8])posts+=P(`M${f1(x)} ${f1(y+o)} v3.4`,'none','#5b3f28',1.1)+P(`M${f1(x)} ${f1(y+o+3.8)} v2`,'none','rgba(90,70,50,.3)',.9)+ripple(x,y+o+3.6,1.2);}});
      s+=bit(.2,posts);
      if(st<3)return s+bit(.6,`<g transform="translate(-40 38)">${[0,1,2,3].map(i=>RC(-6+i*.6,-i*1.2,12,1.1,shade('#a57c4c',i*.05),INK,.25)).join('')}</g>`+CI(-28,38,1.6,'none','#8b6a44',.6)+CI(-28,38,.9,'none','#8b6a44',.5));
      // The deck: every plank laid across two stringers, then a rope rail.
      let deck='';segs.forEach(([a,b])=>{const L=Math.hypot(b[0]-a[0],b[1]-a[1]),an=Math.atan2(b[1]-a[1],b[0]-a[0]),nx=-Math.sin(an),ny=Math.cos(an);
        deck+=P(`M${f1(a[0]+nx*2.6)} ${f1(a[1]+ny*2.6)} L${f1(b[0]+nx*2.6)} ${f1(b[1]+ny*2.6)} M${f1(a[0]-nx*2.6)} ${f1(a[1]-ny*2.6)} L${f1(b[0]-nx*2.6)} ${f1(b[1]-ny*2.6)}`,'none','#4a3220',.9);
        for(let d=0;d<L;d+=2.1){const x=a[0]+Math.cos(an)*d,y=a[1]+Math.sin(an)*d;deck+=P(`M${f1(x+nx*3)} ${f1(y+ny*3)} L${f1(x-nx*3)} ${f1(y-ny*3)}`,'none',shade('#a57c4c',(R()-.5)*.2),1.6);}});
      s+=bit(.8,deck);
      let rail='';P0.forEach(([x,y],i)=>{rail+=P(`M${x} ${f1(y-2.6)} v-3.6`,'none','#4a3220',.6);if(i)rail+=P(`M${P0[i-1][0]} ${f1(P0[i-1][1]-5.6)} Q${f1((x+P0[i-1][0])/2)} ${f1((y+P0[i-1][1])/2-4)} ${x} ${f1(y-5.6)}`,'none','#8b6a44',.4);});
      s+=bit(1.1,rail)+P0.map(([x,y],i)=>bit(1.3+i*.15,lampPost(x,y-2.6,10,i%2?1:-1))).join('');
      // A heron fishing, a punt tied up, fireflies.
      s+=bit(1.8,`<g transform="translate(40 -6)">`+ripple(-36,36,3)+EL(-36,31,2.6,1.4,'#b8bcc2',INK,.3)+P('M-34 30.4 q1.6 -1 1 -3 q-.6 -1.6 .8 -2.2 l2.6 .5','none','#9aa0a8',.8)+P('M-29.6 25.4 l2.4 .6','none','#d8a030',.4)+P('M-37 32.2 v3.6 M-35.6 32.2 v3.6','none','#555',.35)+P('M-38.6 30.4 l-1.8 1','none','#555',.4)+'</g>');
      s+=bit(2,`<g class="cl-moor">${P('M-34 26 q6 2.6 12 0 l-1 -1.6 h-10z','#8b6a44',INK,.35)+P('M-32 25.6 h8','none','#5b3f28',.3)+P('M-22 24.4 L-16 14','none','#6b4527',.5)+ripple(-28,28.4,5)}</g>`+P('M-30 25 L-24 15','none','#6b4527',.25));
      s+=`<g class="cl-fireflies">${[...Array(14)].map(()=>firefly(-46+R()*96,-20+R()*50,R()*4)).join('')}</g>`;
      if(st>=4)s+=`<g class="cl-float">${[[-30,32],[-6,31],[14,16],[36,14],[-38,18],[6,8]].map(([x,y],i)=>`<g class="cl-bob" style="animation-delay:${-i*.9}s">${P(`M${x-2.4} ${y+1.4} h4.8 l-1 1.2 h-2.8z`,'#f6eedb',INK,.25)}${lantern(x,y,i%2?'#f2c24e':'#e8553a')}${ripple(x,y+3,2.4)}</g>`).join('')}</g>`+bunting(-48,19.8,-24,5.8,1.5,['#e8553a','#f2c24e','#2f8f8a']);
      return s;},

    // One Woods: Echo's woodland nursery, seen at three-quarters like everything else:
    // a walled garden in perspective, raised beds, a glasshouse and a potting shed.
    1(st,R){let s='';
      // The garden floor: the back is narrower and higher than the front.
      const at=(u,v)=>{const y=14-30*v,hw=40-8*v;return[-hw+2*hw*u,y];},pt=p=>p.map(f1).join(' ');
      s+=wash(0,0,56,27,'#a3b46e',R,.55)+tufts(0,2,58,28,36,R);
      s+=P(`M${pt(at(0,0))} L${pt(at(1,0))} L${pt(at(1,1))} L${pt(at(0,1))}Z`,'#b5c486','none',0,' opacity=".8"')+tufts(0,-1,34,13,22,R,'#5f7038');
      // Walls stone by stone along their run, with a pale coping.
      const wall=(a,b,h,ruin)=>{let o='';const L=Math.hypot(b[0]-a[0],b[1]-a[1]),rows=Math.max(2,Math.round(h/1.7)),p=(t,yy)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t+yy];
        for(let r=0;r<rows;r++){let d=(r%2)*1.5;while(d<L){const w=2.8+R()*1.8,t0=d/L,t1=Math.min(1,(d+w)/L),y0=-r*h/rows,y1=-(r+1)*h/rows;
          if(!(ruin&&(r>=rows-1-(Math.floor(d/9)%2)||R()<.15)))o+=P(`M${pt(p(t0,y0))} L${pt(p(t1,y0))} L${pt(p(t1,y1))} L${pt(p(t0,y1))}Z`,shade('#b9aa8c',(R()-.5)*.18),'rgba(52,36,22,.45)',.22);d+=w;}}
        if(!ruin)o+=P(`M${pt(p(0,-h))} L${pt(p(1,-h))}`,'none',INK,1.9)+P(`M${pt(p(0,-h))} L${pt(p(1,-h))}`,'none','#e3d8bd',1.2);
        return o+P(`M${pt(a)} L${pt(b)}`,'none',INK,.45);};
      const ruin=st===0;
      s+=wall(at(0,1),at(1,1),3,ruin)+wall(at(0,0),at(0,1),3.4,ruin)+wall(at(1,0),at(1,1),3.4,ruin);
      // A gravel path from the gate to the glasshouse door.
      const path=`M${pt(at(.45,0))} L${pt(at(.55,0))} L${pt(at(.53,.86))} L${pt(at(.47,.86))}Z`;
      if(!ruin)s+=P(path,'#e2d4ae','none',0)+clip(path,[...Array(40)].map(()=>{const v=R()*.86,u=.45+R()*.1,q=at(u,v);return CI(q[0],q[1],.35,'rgba(120,100,70,.5)','none',0);}).join(''));
      // Back of the garden: the glasshouse, the potting shed, two apple trees.
      const gx=-18,gy=-14.6,gw=18,gh=8.6,gd=5;
      const glass=(glazed)=>{let o=shadow(gx+gw*.6,gy+.6,gw*.7,1.4)+masonry(gx-gw/2,gy-2,gw,2,'#a5553b',R,1)+P(`M${gx+gw/2} ${gy} l${gd} ${-gd*.6} v-2 l${-gd} ${gd*.6}z`,'#8f4a32',INK,.3);
        if(glazed)o+=[...Array(6)].map((_,k)=>canopy(gx-gw/2+2+k*2.9,gy-4.4-R()*1.6,1.6,'#7aa35a',R,3,'#2e4a2a')).join('')+CI(gx+4,gy-6.6,.6,'#e8553a','none',0)+CI(gx-2,gy-6,.6,'#f2c24e','none',0);
        const front=`M${gx-gw/2} ${gy-2} v${-gh+2} L${gx} ${gy-gh-4.6} L${gx+gw/2} ${gy-gh} v${gh-2}z`,side=`M${gx+gw/2} ${gy-2} l${gd} ${-gd*.6} v${-gh+2} l${-gd} ${gd*.6}z`,roof=`M${gx} ${gy-gh-4.6} l${gd} ${-gd*.6} L${gx+gw/2+gd} ${gy-gh-gd*.6} L${gx+gw/2} ${gy-gh}Z`;
        o+=P(side,glazed?'rgba(150,196,204,.72)':'none','#6b6b6b',.35)+P(front,glazed?'rgba(196,228,234,.6)':'none','#6b6b6b',.4)+P(roof,glazed?'rgba(176,214,222,.75)':'none','#6b6b6b',.35);
        o+=P([...Array(5)].map((_,k)=>`M${f1(gx-gw/2+(k+1)*gw/6)} ${gy-2} V${f1(gy-gh-(k<2?(k+1)*gw/6*4.6/(gw/2):(5-k)*gw/6*4.6/(gw/2))+.2)}`).join(' ')+` M${gx-gw/2} ${gy-5.6} h${gw} M${gx+gw/2} ${gy-5.6} l${gd} ${-gd*.6}`,'none',glazed?'#f2f6f4':'#8a8274',glazed?.4:.55);
        o+=P(`M${gx+gw/2+gd*.33} ${f1(gy-gh-gd*.2)} l0 ${f1(-2.4)} M${gx+gw/2+gd*.66} ${f1(gy-gh-gd*.4)} l0 -2.4 M${gx} ${gy-gh-4.6} l${gd} ${-gd*.6}`,'none',glazed?'#f2f6f4':'#8a8274',.4);
        if(glazed){COLLECT&&COLLECT.push(['r',gx-gw/2,gy-gh,gw,gh-2]);o+=P(front,'#ffd36b','none',0,' class="cl-win"')+P(`M${gx-gw/2+1.4} ${gy-3.4} l3.4 -4 M${gx+2} ${gy-3.4} l2.4 -3`,'none','#fff',.5,' opacity=".75"')+door(gx-1.3,gy-2,2.6,4.4);}
        return o;};
      if(ruin)s+=`<g opacity=".85">${glass(false)}</g>`+P(`M${gx-4} ${gy-8} l6 5 M${gx+3} ${gy-3} l-3 -6`,'none','#8a8274',.6);
      else s+=bit(1.3,glass(st>=3));
      s+=ruin?RC(14,-22,12,8,'#9a8a74',INK,.4)+P('M14 -22 l3 -2 l2 1.4 l3 -2.6','none','#8a8274',.7):bit(1.5,`<g transform="translate(20 -13.6)">${cottage(0,0,11,7.4,'#56707a',R,{chimney:false,wall:'#a8845a',shutter:'#6d8a4a'})}</g>`+barrel(29,-12.6,.8)+P('M11.6 -13.4 l-1.2 -6 M10 -19.4 h1.6 M12.6 -13.4 l.6 -6.4','none','#6b4527',.4));
      const apple=(x,y,ok)=>shadow(x+3,y+.5,6,1.4)+P(`M${x} ${y} q-.4 -3 0 -6`,'none','#6b4527',1.1)+(ok?canopy(x,y-9,6.4,'#8aa15e',R,6)+[0,1,2,3,4].map(()=>CI(x-4+R()*8,y-12+R()*6,.65,'#d8452e','#7a2a1a',.18)).join(''):P(`M${x} ${y-6} l-3 -3 M${x} ${y-6} l2.6 -3.4 M${x-1.6} ${y-7.6} l-1 -2`,'none','#7d6e58',.6));
      s+=st>=3?bit(1.7,apple(-31,-13,true)+apple(31,-13,true)):apple(-31,-13,false);
      // Raised beds, three rows deep, planted by row.
      const bed=(u0,u1,v,kind)=>{const k=1-.25*v,a=at(u0,v+.08),b=at(u1,v+.08),c=at(u1,v-.02),d=at(u0,v-.02),fh=1.8*k;
        let o=P(`M${pt(a)} L${pt(b)} L${pt(c)} L${pt(d)}Z`,'#7a5a3c','#4a3220',.35)+P(`M${pt(d)} L${pt(c)} L${f1(c[0])} ${f1(c[1]+fh)} L${f1(d[0])} ${f1(d[1]+fh)}Z`,'#a57c4c',INK,.35)+P(`M${f1(d[0])} ${f1(d[1]+fh/2)} L${f1(c[0])} ${f1(c[1]+fh/2)}`,'none','rgba(60,36,18,.5)',.2);
        o+=[.3,.6].map(t=>P(`M${pt([a[0]+(d[0]-a[0])*t,a[1]+(d[1]-a[1])*t])} L${pt([b[0]+(c[0]-b[0])*t,b[1]+(c[1]-b[1])*t])}`,'none','rgba(40,24,12,.45)',.25)).join('');
        if(!kind)return o;const n=6,pts=[...Array(n)].map((_,i)=>{const t=(i+.5)/n;return[a[0]+(b[0]-a[0])*t,(a[1]+d[1])/2+(b[1]-a[1])*t];});
        const plant={seedling:([x,y])=>P(`M${f1(x)} ${f1(y)} v-1 M${f1(x)} ${f1(y-.8)} l-.7 -.5 M${f1(x)} ${f1(y-.8)} l.7 -.5`,'none','#5f8a3f',.35),
          cabbage:([x,y])=>CI(x,y-1,1.3*k,'#9dc278','#3f5a2a',.28)+P(`M${f1(x-.8*k)} ${f1(y-1)} q.8 -.9 1.6 0 M${f1(x)} ${f1(y-2.2*k)} v1.4`,'none','#3f5a2a',.2),
          carrot:([x,y])=>P(`M${f1(x-.4)} ${f1(y)} l.4 1 l.4 -1z`,'#e07a2e','none',0)+P(`M${f1(x)} ${f1(y)} l-.9 -1.8 M${f1(x)} ${f1(y)} l0 -2.2 M${f1(x)} ${f1(y)} l.9 -1.8`,'none','#5f9a3f',.35),
          flowers:([x,y],i)=>P(`M${f1(x)} ${f1(y)} v-2.4`,'none','#5f8a3f',.35)+CI(x,y-2.6,.9*k,['#e7708a','#f2c24e','#b894e0','#fff4e0'][i%4],INK,.18),
          lettuce:([x,y])=>EL(x,y-.8,1.3*k,.9*k,'#b8d48a','#4f7038',.25),
          sunflower:([x,y])=>P(`M${f1(x)} ${f1(y)} v-8`,'none','#5f8a3f',.5)+P(`M${f1(x)} ${f1(y-3)} l-1.4 -.8 M${f1(x)} ${f1(y-5)} l1.4 -.8`,'none','#5f8a3f',.45)+CI(x,y-8.6,1.5,'#f2c24e','#b8860b',.28)+CI(x,y-8.6,.6,'#6b4527','none',0),
          beans:([x,y],i)=>i%2?'':P(`M${f1(x-1.6)} ${f1(y)} L${f1(x)} ${f1(y-8)} L${f1(x+1.6)} ${f1(y)}`,'none','#8b6a44',.45)+[...Array(5)].map((_,j)=>CI(x+(j%2?.7:-.7)*(1-j/6),y-1.4-j*1.4,.7,'#6f9a4a','none',0)).join('')+CI(x+.6,y-5,.4,'#e8553a','none',0)};
        return o+pts.map((p,i)=>plant[kind](p,i)).join('');};
      const rows=[[.66,'beans','sunflower'],[.38,'flowers','lettuce'],[.1,'cabbage','carrot']];
      if(ruin)s+=[.66,.38,.1].map(v=>{const a=at(.2,v),b=at(.8,v);return P(`M${pt(a)} Q${f1((a[0]+b[0])/2)} ${f1(a[1]-3)} ${pt(b)}`,'none','#7d6e58',.5)+[...Array(6)].map(()=>{const x=a[0]+R()*(b[0]-a[0]);return P(`M${f1(x)} ${f1(a[1])} q${f1((R()-.5)*3)} -2 ${f1((R()-.5)*2)} -3.6`,'none','#8a8274',.4);}).join('');}).join('');
      else s+=rows.map(([v,l,r],i)=>bit(.5+i*.15,bed(.08,.43,v,st>=3?l:'seedling')+bed(.57,.92,v,st>=3?r:'seedling'))).join('');
      // Beehives on a bench in the corner.
      if(st>=3)s+=bit(1.9,RC(-35,4.4,9,.9,'#8b6a44',INK,.25)+P('M-34 5.3 v2 M-27 5.3 v2','none','#5b3f28',.5)+[-32.6,-28.4].map(x=>shadow(x+1,4.6,2.2,.5)+P(`M${x-2} 4.4 q0 -4 2 -4 q2 0 2 4z`,'#d8b060',INK,.35)+P(`M${x-1.8} 3.2 h3.6 M${x-1.4} 1.9 h2.8`,'none','#8b6a30',.3)+CI(x,3.8,.4,'#3b2a1c','none',0)).join('')+`<g class="cl-bees">${[0,1,2].map(i=>CI(-30+i*1.6,-1-i*1.6,.35,'#f2c24e',INK,.15,` class="cl-gull" style="animation-delay:${-i*.5}s"`)).join('')}</g>`);
      // The front wall and its gate, drawn last because it stands nearest.
      s+=wall(at(0,0),at(.45,0),4,ruin)+wall(at(.55,0),at(1,0),4,ruin);
      if(!ruin)s+=bit(.3,[-4,4].map(x=>RC(x-1.1,8.6,2.2,5.6,'#cfc2a4',INK,.35)+RC(x-1.5,7.8,3,1,'#e3d8bd',INK,.3)+CI(x,7.2,.7,'#e3d8bd',INK,.25)).join('')+P('M-3 13.6 l-6 2.2 v-4.4 l6 -2.2z','#a57c4c',INK,.35)+P('M-4.5 14.2 v-4.3 M-6 14.8 v-4.3 M-7.5 15.3 v-4.3','none','#6b4527',.3));
      if(st===1)s+=bit(1,crate(26,20)+crate(30.4,20.4)+P('M22 19 l2 -7','none','#6b4527',.6)+RC(23.2,11.4,2,1.4,'#8f8778',INK,.25)+person(-12,18,'#6d8a4a','#d8b060',.8));
      if(st>=3)s+=bit(2.1,person(2,1,'#6d8a4a','#d8b060',.85)+P('M3.4 -3 l2.4 1.2 l.6 1.6 h-1.6z','#8f8778',INK,.25)+`<g class="cl-rain" style="opacity:.8">${P('M6.6 -1.6 l.4 1.4 M7.4 -1.8 l.5 1.3','none','#8ec3c6',.3)}</g>`+P('M22 21 l5 -1 l2.4 1.8 h-6.6z','#9a6a3c',INK,.3)+CI(21.6,22.2,1.1,'#3b2f26','none',0)+P('M29 19.4 l3 -2','none','#6b4527',.4)+CI(24,19.4,.8,'#e7708a','none',0)+CI(25.8,19.2,.8,'#f2c24e','none',0));
      if(st>=3)s+=`<g class="cl-butterflies">${[0,1,2].map(i=>`<path class="cl-flutter" style="animation-delay:${-i*1.1}s" d="M${-12+i*12} ${-4-i*2} l-1.4 -1 v2z M${-12+i*12} ${-4-i*2} l1.4 -1 v2z" fill="${['#e7708a','#f2c24e','#b894e0'][i]}"/>`).join('')}</g>`;
      if(st>=4){s+=P('M-4 14 v-10 q4 -7 8 0 v10','none','#5f8a3f',1.8)+[...Array(9)].map((_,i)=>{const t=i/8;return CI(-4+8*t,4-Math.sin(t*Math.PI)*6.8,1,['#e7708a','#f7d7e0','#d8455e'][i%3],INK,.15);}).join('');
        s+=shadow(-19,11.4,3.4,.8)+EL(-19,10,3.2,2.4,'#e8883a',INK,.4)+P('M-21 8.4 q2 3.2 0 3.6 M-17 8.4 q-2 3.2 0 3.6 M-19 7.6 v-1.2','none','#b85a1a',.3)+CI(-15.4,8,1,'#3f6fb0',INK,.2)+P('M-15.4 9 l-.5 1.6 M-15.4 9 l.5 1.6','none','#3f6fb0',.4);
        s+=bunting(at(0,1)[0],at(0,1)[1]-3,at(1,1)[0],at(1,1)[1]-3,2.4,['#e7708a','#f2c24e','#6d8a4a'])+flag(at(0,0)[0],at(0,0)[1]-4,'#6d8a4a',10)+flag(at(1,0)[0],at(1,0)[1]-4,'#e0b24a',10,.6);}
      return s;},

    // Ten City: towered walls, a market, and the power station with its ten o'clock tower.
    10(st,R){let s='';
      s+=wash(0,8,58,24,'#cdbf98',R,.6)+tufts(0,10,60,24,26,R);
      const houses=[[-34,4,11,10,'#b35e40'],[-22,-2,10,11,'#56707a'],[-30,-10,9,8,'#c07a4a'],[18,-2,11,10,'#b35e40'],[31,4,10,9,'#c07a4a'],[26,-12,9,8,'#56707a'],[-12,6,9,8,'#a9543a'],[10,6,9,8,'#56707a']];
      const tower=(x,y,broken)=>{let o=shadow(x+3,y+.5,7,1.6)+masonry(x-5,y-18,10,18,'#cfc2a4',R,2.2)+RC(x-5,y-18,10,18,'url(#crCyl)','none',0)+P(`M${x-5} ${y} V${y-18} M${x+5} ${y} V${y-18}`,'none',INK,.5);
        if(broken)return o+P(`M${x-5} ${y-18} l2 -3 l2 2 l3 -4 l3 5`,'#cfc2a4',INK,.45);
        o+=[...Array(4)].map((_,k)=>RC(x-6+k*3.2,y-21,1.8,2.6,'#d6cbb0',INK,.3)).join('')+RC(x-6,y-18.6,12,1.4,'#bfb293',INK,.3);
        const roof=`M${x-6.4} ${y-21} L${x} ${y-32} L${x+6.4} ${y-21}Z`;o+=shingles(roof,x-7,y-33,x+7,y-21,'#56707a',R,1.4,1.8)+P(roof,'none',INK,.5)+windowS(x-1.1,y-12,2.2,3.4,null,true);return o;};
      const wall=(broken)=>{let o=masonry(-42,10,84,9,'#d6caad',R,2.2)+P('M-42 10 V19 H42 V10','none',INK,.5);for(let x=-42;x<42;x+=4)if(!broken||R()>.4)o+=RC(x,7.6,2.4,2.4,'#d6caad',INK,.3);
        if(broken)o+=P('M-18 10 l3 3 l3 -2 l2 4 M20 10 l2 5 l4 -3','#efe3c4',INK,.4)+[[-16,21],[22,22]].map(([x,y])=>[0,1,2].map(k=>RC(x+k*2.6,y-k*.4,2.4,1.6,'#c9bca0',INK,.25)).join('')).join('');
        return o;};
      const gate=()=>RC(-8,2,16,17,'#cbbf9f',INK,.5)+masonry(-8,2,16,17,'#cbbf9f',R,2.2)+P('M-4 19 v-7 a4 4 0 0 1 8 0 v7z','#3b2f26',INK,.45)+P('M-3.4 13 v6 M-1.7 12 v7 M0 11.6 v7.4 M1.7 12 v7 M3.4 13 v6 M-4 15 h8 M-4 17 h8','none','#8a8274',.35)+[...Array(4)].map((_,k)=>RC(-8.6+k*4.6,-.4,2.6,2.4,'#cbbf9f',INK,.3)).join('')+RC(-6,4,12,2,'#3f6fb0',INK,.3)+'';
      // The approach: a grassy bank falls from the wall to a moat, crossed by a drawbridge.
      const inner='M-52 4 Q-55 25 -36 29 Q0 37 36 29 Q55 25 52 4',outer='M58 4 Q62 29 38 34 Q0 43 -38 34 Q-62 29 -58 4',band=inner+' L'+outer.slice(1)+'Z';
      const brow=[...Array(13)].map((_,i)=>{const t=i/12,x=-60+120*t;return[x,4+Math.sin(t*Math.PI)*34.5-Math.abs(t-.5)*2];});
      const approach=(st)=>{let o=apron(brow,16,R,'#a8a06e')+P('M-47 19 H47 L52 4 Q55 25 36 29 Q0 37 -36 29 Q-55 25 -52 4Z','#a9b27c','none',0)+P([...Array(26)].map((_,i)=>{const x=-46+i*3.6;return`M${f1(x)} 19.4 l.3 ${f1(2+(1-(x/50)**2)*6)}`;}).join(' '),'none','rgba(70,80,40,.5)',.3);
        o+=st===0?P(band,'#b8a27a','#7d6e58',.4)+reeds(-30,33,R,4)+reeds(26,34,R,4):P(band,'#8ec3c6','none',0)+P('M-55 6 Q-58 27 -37 31.4 Q0 40 37 31.4 Q58 27 55 6','none','rgba(40,74,90,.5)',.3)+P('M-54 5 Q-56.6 26 -36.6 30.2','none','rgba(40,74,90,.35)',.3)+ripple(-24,34,2.4)+ripple(18,35,2)+lily(-40,31,1.2)+lily(34,31.4,1.1,true)+lily(-48,20,1,true);
        o+=P(inner,'none',INK,.45)+P(outer,'none',INK,.5);
        // The road winds down the hill from the drawbridge.
        const road='M0 39 Q3 46 14 48 Q30 51 44 54';o+=P(road,'none','rgba(214,182,124,.96)',4.6)+P(road,'none','rgba(64,44,26,.8)',.55,' transform="translate(0 -2.4)"')+P(road,'none','rgba(64,44,26,.8)',.55,' transform="translate(0 2.4)"');
        if(st>=3)o+=RC(-4,19,8,20.6,'#a57c4c',INK,.4)+[...Array(13)].map((_,k)=>P(`M-4 ${f1(20.4+k*1.5)} h8`,'none','rgba(60,36,18,.5)',.25)).join('')+P('M-4 19 L-6 12 M4 19 L6 12','none','#3b3b3b',.35)+P('M-4 39.6 h8','none',INK,.5);
        else if(st>0)o+=P('M-4 20 l8 14 M4 20 l-8 14','none','#8b6a44',.6);
        return o;};
      if(st===0)return s+houses.map(([x,y,w,h])=>cottage(x,y,w,h,'#9a948a',R,{wall:'#d8d2c6',chimney:false})).join('')+masonry(-7,-6,14,22,'#b9b2a4',R)+P('M-7 -6 l3 -4 l2 3 l4 -5 l5 6','#b9b2a4',INK,.5)+wall(true)+tower(-44,19,true)+tower(44,19,true)+approach(0);
      s+=houses.map(([x,y,w,h,r],i)=>bit(.3+i*.08,cottage(x,y,w,h,r,R,{chimney:i%2===0,smoke:st>=3&&i%2===0,k:i,timber:i%3===0,box:i%2===1}))).join('');
      // The power station: brick tower, clock at ten o'clock, balcony, glass cupola and orb.
      let pw=shadow(3,17,10,2)+masonry(-7,-24,14,40,'#b86a45',R,2)+RC(-7,-24,14,40,'url(#crCyl)','none',0)+P('M-7 16 V-24 H7 V16','none',INK,.6)+windowS(-4.2,6,2,3,null,true)+windowS(2.2,6,2,3,null,true)+windowS(-1,-3,2,3,null,true);
      pw+=CI(0,-14,4.2,'#f6f0de',INK,.5)+[...Array(12)].map((_,k)=>{const a=k/12*TAU;return P(`M${f1(Math.sin(a)*3.4)} ${f1(-14-Math.cos(a)*3.4)} L${f1(Math.sin(a)*3.9)} ${f1(-14-Math.cos(a)*3.9)}`,'none',INK,k%3?.2:.45);}).join('')+P(`M0 -14 L${f1(Math.sin(-TAU/6)*2.2)} ${f1(-14-Math.cos(-TAU/6)*2.2)} M0 -14 V-17.2`,'none',INK,.5)+CI(0,-14,.4,INK,'none',0);
      s+=bit(.9,pw);
      if(st<3)return s+wall(false)+bit(1.1,gate())+tower(-44,19,false)+tower(44,19,false)+approach(st)+P('M-11 -24 V-40 M11 -24 V-40 M-11 -28 H11 M-11 -34 H11 M-11 -40 H11 M-11 -28 L11 -34 M11 -28 L-11 -34','none','#8b5a32',.6)+P('M-11 -40 L-18 -44 M-18 -44 v8','none','#6b4527',.5);
      light(0,-33,15);
      s+=bit(1.2,RC(-9,-26.4,18,2.4,'#6b4527',INK,.4)+[...Array(8)].map((_,k)=>P(`M${-8+k*2.2} -26.4 v-2`,'none',INK,.3)).join('')+P('M-9 -28.4 H9','none',INK,.4)+P('M-6 -28.4 v-5 a6 6 0 0 1 12 0 v5z','rgba(190,225,235,.55)','#8b5a32',.6)+P('M-3 -28.4 v-7 M0 -28.4 v-8 M3 -28.4 v-7 M-6 -32 h12','none','#8b5a32',.35));
      s+=bit(1.4,`<circle cx="0" cy="-33" r="12" fill="url(#clOrb)" class="cl-orb"/>`+CI(0,-33,3.8,'#bfe8ff',INK,.45)+P('M-1.6 -34.6 q1.6 -1.6 3.2 0','none','#fff',.4)+`<text x="0" y="-31.7" text-anchor="middle" font-size="3.2" font-weight="800" fill="#2c4e5c" font-family="system-ui,sans-serif">10</text>`+`<g class="cl-arcs">${[-1,1].map(d=>P(`M${d*4} -33 l${d*2} -1.4 l${-d*.8} 1.6 l${d*2.4} -.6`,'none','#bfe8ff',.45)).join('')}</g>`+P('M0 -45 V-41 M-1 -44 h2','none','#8b5a32',.5));
      // Cables from the station to the lamps on the walls, and the market square.
      s+=bit(1.6,P('M-7 -22 Q-26 -10 -44 -2 M7 -22 Q26 -10 44 -2','none',INK,.3)+[-20,20].map(x=>RC(x-4,11,8,4,'#efe3c6',INK,.25)+P(`M${x-4.6} 11 h9.2 l-1 -2.6 h-7.2z`,x<0?'#c0503a':'#2f8f8a',INK,.25)+P(`M${x-3} 11 l.6 -2.6 M${x} 11 v-2.6 M${x+3} 11 l-.6 -2.6`,'none','#fff',.4)).join(''));
      s+=wall(false)+bit(1.1,gate())+tower(-44,19,false)+tower(44,19,false)+approach(st)+bit(1.8,lampPost(-24,7.6,7,1)+lampPost(24,7.6,7,-1)+lampPost(-44,-2,5,1)+lampPost(44,-2,5,-1))+flag(-44,-13,'#3f6fb0',6,0,'#e0b24a')+flag(44,-13,'#e0b24a',6,.6,'#3f6fb0');
      s+=person(-26,18,'#c0503a','#3b2f26',.8)+person(28,18.4,'#3f6fb0',null,.8)+bird(-10,-50,0)+bird(8,-56,1.6);
      if(st>=4)s+=`<g class="cl-beams"><path d="M0 -33 L-40 -84 L-28 -86Z" fill="#fff4c0" opacity=".32"/><path d="M0 -33 L30 -86 L42 -82Z" fill="#fff4c0" opacity=".32"/></g>`+[[-30,-60,'#f2c24e'],[26,-66,'#e7708a']].map(([x,y,c])=>`<g class="cl-burst" transform="translate(${x} ${y})">${[...Array(10)].map((_,k)=>{const a=k/10*TAU;return P(`M${f1(Math.cos(a)*2)} ${f1(Math.sin(a)*2)} L${f1(Math.cos(a)*6)} ${f1(Math.sin(a)*6)}`,'none',c,.6);}).join('')}</g>`).join('')+bunting(-40,8,40,8,2,['#3f6fb0','#e0b24a','#c0503a']);
      return s;},

    // High-Five Harbor: planked piers, five moored boats, a crane, nets and the lighthouse.
    5(st,R){let s='';const piles=[...Array(10)].map((_,i)=>[4+i*6.6,-3]).concat([...Array(10)].map((_,i)=>[4+i*6.6,3]),[...Array(5)].map((_,i)=>[31.6,-7-i*6]),[...Array(5)].map((_,i)=>[36.4,-7-i*6]),[...Array(5)].map((_,i)=>[45.6,7+i*6]),[...Array(5)].map((_,i)=>[50.4,7+i*6]));
      const pile=([x,y])=>CI(x,y,.9,'#6b4527',INK,.3)+CI(x,y,.4,'#8b6a44','none',0)+ripple(x,y+1.8,1.2);
      const house=`<g transform="translate(-22 -40)">${cottage(0,0,10,7,'#b35e40',R,{chimney:true,smoke:st>=3,shutter:'#2f8f8a'})}</g>`;
      const lighthouse=(broken)=>{let o=[[-14,-42,4],[-4,-42,3.4],[-9,-40,4.6]].map(([x,y,r])=>EL(x,y,r,r*.6,'#9a948a',INK,.35)).join('');const top=broken?-54:-66;
        o+=P(`M-12 -42 L-4 -42 L-5.2 ${top} L-10.8 ${top}Z`,'#f4eee0',INK,.5)+clip(`M-12 -42 L-4 -42 L-5.2 ${top} L-10.8 ${top}Z`,[-46,-52,-58,-64].map(y=>RC(-13,y,10,2.6,'#c0503a','none',0)).join(''))+P(`M-8 -42 L-5.2 ${top} L-4 -42Z`,'rgba(40,20,10,.18)');
        if(broken)return o+P('M-10.8 -54 l1.4 -2 l1.2 1.4 l1.6 -2.2 l1.4 2.8','#f4eee0',INK,.4);
        o+=windowS(-8.8,-50,1.6,2.2,null,true)+windowS(-8.6,-58,1.4,2,null,true)+RC(-12.4,-67.6,8.8,1.6,'#3b2f26',INK,.3)+[...Array(7)].map((_,k)=>P(`M${-12+k*1.35} -67.6 v-1.8`,'none',INK,.25)).join('')+P('M-12.4 -69.4 h8.8','none',INK,.35);
        light(-8,-72,14);o+=RC(-10.6,-73.8,5.2,4.4,'#ffe7a0',INK,.4,' class="cl-lamp"')+P('M-8 -73.8 v4.4 M-10.6 -71.6 h5.2','none','#8b5a32',.3)+P('M-11.4 -73.8 Q-8 -78.4 -4.6 -73.8Z','#c0503a',INK,.35)+P('M-8 -77 v-2.4 M-9.2 -79.2 h2.4','none',INK,.4);
        return o+`<g class="cl-beam" transform="translate(-8 -71.6)"><path d="M0 0 L62 -8 L62 8Z" fill="#fff4c0" opacity=".4"/></g>`;};
      if(st===0)return s+piles.filter((_,i)=>i%4===0).map(([x,y])=>P(`M${x} ${y+2} v-3`,'none','#6d6a66',1.2)).join('')+lighthouse(true)+`<g transform="translate(24 16) rotate(170)">${P('M-5 0 q5 3 10 0 l-1.2 -1.6 h-7.6z','#9a948a',INK,.4)}</g>`;
      s+=bit(.1,piles.map(pile).join(''));
      if(st<3)return s+bit(.6,P('M0 -3 H40 M0 3 H40','none','#5b3f28',.9)+P('M31.6 -3 V-20 M36.4 -3 V-20','none','#5b3f28',.9))+lighthouse(true)+P('M-14 -54 V-70 M-2 -54 V-70 M-14 -58 H-2 M-14 -64 H-2 M-14 -58 L-2 -64','none','#8b5a32',.6)+house;
      // Decks, plank by plank.
      let deck=RC(0,-2.6,66,5.2,'#b48a58',INK,.4)+RC(31.6,-32,4.8,29.4,'#b48a58',INK,.4)+RC(45.6,2.6,4.8,29.4,'#b48a58',INK,.4);
      for(let x=1.4;x<66;x+=1.4)deck+=P(`M${f1(x)} -2.6 v5.2`,'none',shade('#6b4527',(R()-.5)*.3),.25);
      for(let y=-30;y<-2.6;y+=1.4)deck+=P(`M31.6 ${f1(y)} h4.8`,'none','#6b4527',.25);
      for(let y=4;y<32;y+=1.4)deck+=P(`M45.6 ${f1(y)} h4.8`,'none','#6b4527',.25);
      s+=bit(.8,deck+[[20,-2.6],[40,-2.6],[60,2.6],[34,-30],[48,30]].map(([x,y])=>CI(x,y,.9,'#2b1c10','none',0)+CI(x,y-.4,.5,'#4a3a2a','none',0)).join(''));
      s+=bit(1,crate(8,-3)+crate(12.6,-3)+crate(10.3,-6.6,.9)+barrel(17,-2.6)+barrel(19.8,-2.2)+P('M2 3 l3 1 l-.4 1.2 l-3 -1z','#d8c8a0',INK,.25));
      // The jib crane at the pier head, lifting a net of fish.
      s+=bit(1.2,P('M62 -2.6 V-20 M60 -2.6 L62 -12 L64 -2.6','none','#5b3f28',.9)+P('M62 -19 L72 -23','none','#5b3f28',.8)+P('M72 -23 V-12','none',INK,.3)+P('M70 -12 q2 3 4 0 q-2 -1.4 -4 0z','#9aa88a',INK,.3)+P('M70.6 -11 l2.8 .6 M71 -12 l2 1.4','none',INK,.2));
      // Nets drying on the shore.
      s+=bit(1.3,P('M-10 12 V2 M2 14 V4','none','#6b4527',.7)+P('M-10 3 Q-4 8 2 5','none',INK,.3)+clip('M-10 3 Q-4 8 2 5 V14 H-10Z',[...Array(10)].map((_,k)=>P(`M${-10+k*1.4} 3 l3 10 M${-8+k*1.4} 3 l-3 10`,'none','#6b6b5b',.2)).join('')));
      // Five boats for five, each moored where it belongs.
      const rowboat=(x,y,c)=>P(`M${x-5} ${y} q5 3.4 10 0 l-1.2 -1.8 h-7.6z`,c,INK,.4)+P(`M${x-3.6} ${f1(y-1.2)} h7.2`,'none','rgba(255,255,255,.5)',.3)+P(`M${x-1.6} ${f1(y-1.6)} v1.6 M${x+1.6} ${f1(y-1.6)} v1.6`,'none','#5b3f28',.4)+P(`M${x-2} ${f1(y-.8)} l-4.4 2.4 M${x+2} ${f1(y-.8)} l4.4 2.4`,'none','#8b6a44',.35);
      const sailboat=(x,y,c,sc)=>P(`M${x-5.4} ${y} q5.4 3.6 10.8 0 l-1.4 -2 h-8z`,c,INK,.4)+P(`M${x} ${f1(y-2)} v-12`,'none','#4a2f19',.55)+P(`M${x-4} ${f1(y-3.2)} h8`,'none','#4a2f19',.4)+P(`M${x+.3} ${f1(y-13.6)} Q${x+5} ${f1(y-8)} ${x+4.2} ${f1(y-3.4)} L${x+.3} ${f1(y-3.4)}Z`,'#f6eedb',INK,.3)+P(`M${x-.3} ${f1(y-12)} L${x-3.8} ${f1(y-3.4)} L${x-.3} ${f1(y-3.4)}Z`,'#efe3c6',INK,.3)+P(`M${x+1.8} ${f1(y-11)} v7 M${x+3} ${f1(y-8)} v4.4`,'none','rgba(120,95,60,.4)',.2)+P(`M${x} ${f1(y-14)} l3 .8 l-3 .8`,sc,'none',0);
      const boats=[[24,-10,'#c0503a',0],[42,-18,'#3f6fb0',1],[40,12,'#e0b24a',0],[56,20,'#2f8f8a',1],[58,-8,'#8b5a32',0]];
      s+=boats.map(([x,y,c,sail],i)=>bit(1.4+i*.12,`<g class="cl-moor" style="animation-delay:${-i*.8}s">${sail?sailboat(x,y,c,'#e8553a'):rowboat(x,y,c)}${ripple(x,y+2.4,4)}</g>`)).join('');
      s+=bit(1.8,lighthouse(false))+house+bit(2,lampPost(0,-2.6,8,-1)+lampPost(66,-2.6,8,1));
      s+=bit(2.1,gullSitting(4,-3.6)+gullSitting(36.4,-32.4)+person(14,-1.8,'#3f6fb0','#3b2f26',.8)+person(52,2,'#c0503a',null,.8))+bird(18,-40,0)+bird(30,-50,1.5)+bird(8,-56,3);
      if(st>=4)s+=`<g class="cl-sail" style="--x:70px">${sailboat(64,44,'#c0503a','#f2c24e')}</g>`+bunting(0,-5,31.6,-32,2,['#c0503a','#e0b24a','#3f6fb0'])+bunting(36.4,-32,66,-5,2,['#2f8f8a','#f2c24e','#c0503a'])+flag(66,-2.6,'#c0503a',10);
      return s;},

    // Twin Towers: two identical towers, stone by stone, reunited by a bridge in the sky.
    11(st,R){let s='';
      const body=(x,top,broken,withRoof)=>{let o=shadow(x+4,.6,11,2.2)+masonry(x-8,top,16,-top,'#d6cbb0',R,2.4)+RC(x-8,top,16,-top,'url(#crCyl)','none',0)+P(`M${x-8} 0 V${top} M${x+8} 0 V${top}`,'none',INK,.6);
        o+=[...Array(3)].map((_,k)=>RC(x-10,-3-k*.9,20,.9,'#b9aa8c',INK,.2)).join('');
        if(broken)return o+P(`M${x-8} ${top} l3 -4 l3 3 l4 -5 l6 6`,'#d6cbb0',INK,.5);
        o+=door(x-1.6,0,3.2,5.4)+[...Array(5)].map((_,k)=>windowS(x-1.2,-13-k*10.4,2.4,3.4,k%2?'#3f6fb0':null,true)).join('')+P(`M${x-5.6} -9 v3 M${x+5.6} -30 v3`,'none','#2a1f16',.9);
        o+=P(`M${x-8} -46 h16 M${x-9.6} -44.6 h19.2`,'none',INK,.4)+RC(x-9.6,-46,19.2,1.4,'#b9aa8c',INK,.3)+[...Array(7)].map((_,k)=>P(`M${f1(x-9+k*3)} -46 v-2.4`,'none',INK,.3)).join('')+P(`M${x-9.6} -48.4 h19.2`,'none',INK,.3);
        o+=RC(x-9.6,top-1.6,19.2,2,'#bfb293',INK,.35)+[...Array(5)].map((_,k)=>RC(x-9.6+k*4.2,top-4.2,2.6,2.6,'#d6cbb0',INK,.3)).join('')+[...Array(6)].map((_,k)=>P(`M${f1(x-9+k*3.6)} ${top+.4} l.8 1.6 l.8 -1.6`,'none',INK,.25)).join('');
        o+=[...Array(24)].map(()=>CI(x-8+R()*3.2,-2-R()*26,.9,R()<.5?'#6f9a4a':'#5a8a3e','none',0)).join('');
        if(withRoof){const roof=`M${x-10.4} ${top-4} L${x} ${top-26} L${x+10.4} ${top-4}Z`;o+=shingles(roof,x-11,top-27,x+11,top-4,'#4e6a78',R,1.5,2)+P(roof,'none',INK,.55)+P(`M${x} ${top-26} L${x+10.4} ${top-4} H${x+3}Z`,'rgba(0,0,0,.2)')+P(`M${x-3.4} ${top-10} v-3 h2.4 v3z`,'#4e6a78',INK,.3)+windowS(x-2.8,top-12.4,1.4,1.8,null);}
        return o;};
      if(st===0)return s+body(-24,-42,true,false)+body(24,-34,true,false)+[[-12,4],[12,5],[34,6]].map(([x,y])=>[0,1,2].map(k=>RC(x+k*2.4-2,y-k*1.1,2.4,1.6,'#c9bca0',INK,.25)).join('')).join('')+`<g>${bird(-28,-58,0,'#2b2b2b')}${bird(30,-50,1.2,'#2b2b2b')}</g>`;
      const built=st>=3;
      s+=bit(.2,body(-24,-70,false,built))+bit(.4,body(24,-70,false,built));
      if(!built)return s+[-24,24].map(x=>P(`M${x-11} 0 V-78 M${x+11} 0 V-78 ${[...Array(7)].map((_,k)=>`M${x-11} ${-8-k*10} H${x+11}`).join(' ')} M${x-11} -8 L${x+11} -18 M${x+11} -28 L${x-11} -38 M${x-11} -48 L${x+11} -58`,'none','#8b5a32',.55)+P(`M${x+13} 0 V-30 M${x+15} 0 V-30 ${[...Array(10)].map((_,k)=>`M${x+13} ${-2-k*3} h2`).join(' ')}`,'none','#6b4527',.35)).join('')+P('M-13 -78 L0 -86 L13 -78 M0 -86 V-66','none','#6b4527',.5)+crate(-6,2)+crate(6,2);
      s+=[-24,24].map((x,i)=>bit(1+i*.2,flag(x,-96,i?'#e0b24a':'#3f6fb0',8,i*.6))).join('');
      // The sky bridge: arched stone, balustrade, lamps, and people crossing.
      s+=bit(1.5,P('M-16 -57 Q0 -64 16 -57 V-53 Q0 -60 -16 -53Z','#b9aa8c',INK,.5)+clip('M-16 -57 Q0 -64 16 -57 V-53 Q0 -60 -16 -53Z',[...Array(10)].map((_,k)=>P(`M${-15+k*3.2} -64 v12`,'none','rgba(52,36,22,.35)',.25)).join(''))+P('M-16 -53 Q0 -60 16 -53 Q0 -56 -16 -53Z','rgba(40,30,20,.3)')+P('M-16 -61 Q0 -68 16 -61','none',INK,.45)+[...Array(11)].map((_,k)=>{const x=-15+k*3,y=-60.6+Math.abs(x)*.22-4.3;return P(`M${f1(x)} ${f1(y+.4)} v3.2`,'none',INK,.3)+CI(x,y+2,.3,'#8f8778','none',0);}).join('')+`<g class="cl-walkers">${person(-6,-60.4,'#c0503a',null,.7)}${person(5,-60,'#2f8f8a','#3b2f26',.7)}</g>`);
      s+=bit(1.8,lampPost(-16,-60.4,5,1)+lampPost(16,-60.4,5,-1))+bit(2,[[-40,2],[40,2]].map(([x,y])=>P(`M${x-3} ${y} h6 l-1 -3 h-4z`,'#b86a45',INK,.3)+CI(x,y-4,2.4,'#6f9a4a',INK,.3)+CI(x-.8,y-4.6,.5,'#e7708a','none',0)).join('')+person(-30,3,'#6d8a4a','#3b2f26',.8))+bird(0,-100,0)+bird(12,-108,2);
      if(st>=4)s+=bunting(-24,-90,24,-90,5,['#3f6fb0','#e0b24a','#c0503a'])+bunting(-32,-46,32,-46,3,['#e0b24a','#3f6fb0']);
      return s;},

    // Triple Jungle: three giant trees, platforms, rope bridges plank by plank, a lookout hut.
    3(st,R){let s='';const trees=[[-42,0],[0,-8],[42,4]];
      const giant=([x,y],k)=>{let o=shadow(x+4,y+.8,14,3)+P(`M${x-8} ${y} q4 -2 5 -8 q1 -18 1 -38 h4 q0 20 1 38 q1 6 5 8 q-4 1 -6 -2 q-1 2 -4 2 q-3 0 -3 -2 q-2 3 -3 2z`,'#7a5a34',INK,.5);
        o+=[...Array(5)].map((_,i)=>P(`M${f1(x-1.4+i*.9)} ${f1(y-4)} q${f1((R()-.5)*1.4)} -14 0 -38`,'none','rgba(40,24,12,.45)',.3)).join('')+EL(x+.6,y-22,.8,1.2,'#4a3220');
        const cl=[[-12,-50,11],[11,-52,10],[0,-62,12],[-6,-44,8],[8,-43,8],[-16,-58,7],[16,-60,7],[4,-70,8],[-8,-68,7]];
        o+=cl.slice().sort((a,b)=>a[1]-b[1]).map(([dx,dy,r])=>canopy(x+dx,y+dy,r*1.05,'#5f9656',R,4,'#1f3a22','rgba(24,56,30,.42)')).join('');
        o+=[...Array(5)].map(()=>CI(x-14+R()*28,y-44-R()*26,.8,R()<.5?'#e8553a':'#f2c24e','none',0)).join('');
        o+=[-10,6,14].map(dx=>{const vx=x+dx,vy=y-42;return P(`M${vx} ${vy} q${f1((R()-.5)*3)} 8 ${f1((R()-.5)*2)} ${f1(14+R()*6)}`,'none','#4f7a3a',.45)+[0,1,2,3].map(j=>EL(vx+(j%2?.8:-.8),vy+3+j*3.4,.9,.5,'#5f9a4f')).join('');}).join('');
        return o;};
      s+=trees.map(giant).join('');
      const plat=([x,y])=>EL(x,y-26.4,9,2.8,'rgba(40,30,20,.25)')+EL(x,y-28,9,2.8,'#a9804f',INK,.5)+[...Array(8)].map((_,k)=>{const a=k/8*Math.PI;return P(`M${f1(x-Math.cos(a)*9)} ${f1(y-28+Math.sin(a)*.6)} L${x} ${y-28}`,'none','rgba(60,36,18,.35)',.2);}).join('')+[-9,-5,0,5,9].map(dx=>P(`M${x+dx} ${f1(y-28+Math.abs(dx)*-.05)} v-3.4`,'none',INK,.35)).join('')+P(`M${x-9} ${y-31.4} Q${x} ${y-29.4} ${x+9} ${y-31.4}`,'none','#8b6a44',.4);
      const ladder=([x,y])=>P(`M${x+3} ${y-1} V${y-26} M${x+5} ${y-1} V${y-26}`,'none','#6b4527',.4)+[...Array(8)].map((_,k)=>P(`M${x+3} ${y-3-k*3} h2`,'none','#6b4527',.35)).join('');
      const span=(a,b,broken)=>{const x1=a[0]+9,y1=a[1]-28,x2=b[0]-9,y2=b[1]-28,mx=(x1+x2)/2,my=Math.max(y1,y2)+7;let o='';
        if(broken)return P(`M${x1} ${y1} q2 6 1 12 M${x2} ${y2} q-2 5 -1 10`,'none','#8a7c68',.6);
        for(let t=.03;t<1;t+=.055){const x=(1-t)**2*x1+2*t*(1-t)*mx+t*t*x2,y=(1-t)**2*y1+2*t*(1-t)*my+t*t*y2;o+=P(`M${f1(x)} ${f1(y-1.1)} v2.2`,'none',shade('#a57c4c',(R()-.5)*.25),1.2);}
        o+=P(`M${x1} ${y1-3.6} Q${mx} ${my-3.6} ${x2} ${y2-3.6} M${x1} ${y1+1} Q${mx} ${my+1} ${x2} ${y2+1}`,'none','#8b6a44',.4);
        for(let t=.1;t<1;t+=.12){const x=(1-t)**2*x1+2*t*(1-t)*mx+t*t*x2,y=(1-t)**2*y1+2*t*(1-t)*my+t*t*y2;o+=P(`M${f1(x)} ${f1(y-3.4)} v3.4`,'none','#8b6a44',.25);}
        return o;};
      if(st===0)return s+span(trees[0],trees[1],true)+span(trees[1],trees[2],true);
      s+=trees.map((t,i)=>bit(.3+i*.15,plat(t)+ladder(t))).join('');
      if(st<3)return s+span(trees[0],trees[1],true)+bit(.9,P('M-30 -8 l6 2 M-26 -6 l-2 4','none','#8b6a44',.6)+CI(-20,-2,1.8,'none','#8b6a44',.6));
      s+=bit(1,span(trees[0],trees[1]))+bit(1.3,span(trees[1],trees[2]));
      // A lookout hut on the middle tree, thatched.
      s+=bit(1.5,RC(-5,-44,10,8,'#c9a36a',INK,.4)+[...Array(5)].map((_,k)=>P(`M${-4+k*2} -44 v8`,'none','#8b6a44',.3)).join('')+windowS(-1.2,-42,2.4,2.6,null)+P('M-8 -44 L0 -53 L8 -44Z','#c9a45a',INK,.45)+[...Array(9)].map((_,k)=>P(`M${f1(-7+k*1.7)} -44.4 L${f1(-.6+k*.15)} -52`,'none','rgba(110,80,30,.55)',.25)).join('')+flag(0,-53,'#2f8f8a',7));
      s+=trees.map(([x,y],i)=>bit(1.7+i*.1,lantern(x-7,y-33)+lantern(x+7,y-33,'#e0b24a'))).join('');
      s+=bit(2,EL(22,-50,1.4,1,'#c0503a',INK,.25)+CI(23.2,-50.8,.6,'#c0503a','none',0)+P('M20.8 -49.6 l-1.8 1.6','none','#3f6fb0',.6)+EL(-24,-56,1.4,1,'#3f6fb0',INK,.25)+CI(-22.8,-56.8,.6,'#3f6fb0','none',0)+P('M-25.2 -55.6 l-1.8 1.6','none','#e0b24a',.6));
      s+=bit(2.1,P('M30 -40 q-1 5 1 9','none','#4f7a3a',.45)+EL(31,-29,1.4,1.8,'#7a5230',INK,.25)+CI(31.4,-31.6,.9,'#7a5230',INK,.25)+P('M32 -28 q2 1 1 3','none','#7a5230',.4));
      s+=`<g class="cl-parrots">${bird(-20,-84,0,'#c0503a')}${bird(20,-90,2,'#3f6fb0')}</g>`;
      if(st>=4)s+=[-30,-16,14,30].map((x,i)=>P(`M${x} -40 v6`,'none',INK,.3)+lantern(x,-31,['#e8553a','#f2c24e','#b894e0','#2f8f8a'][i])).join('')+bunting(-33,-31,-9,-28,2,['#e8553a','#f2c24e','#2f8f8a']);
      return s;},

    // Stone Valley: four by four standing stones; lichen, carved squares, trilithons, sheep.
    4(st,R){let s='';
      // Four rows of four in perspective: the back row small and high, the front row large and low.
      const rows=[0,1,2,3].map(r=>({y:-20+r*10.5,k:.7+r*.12,dx:r*2})),stones=[];rows.forEach((row,r)=>{for(let c=0;c<4;c++)stones.push({x:(c-1.5)*15*row.k+row.dx,y:row.y,k:row.k,r,c});});
      const corner=(r,c)=>{const row=rows[r];return[(c-1.5)*15*row.k+row.dx,row.y];};
      const ground=`M${corner(0,0)[0]-9} ${rows[0].y-3}L${corner(0,3)[0]+9} ${rows[0].y-3}L${corner(3,3)[0]+13} ${rows[3].y+5}L${corner(3,0)[0]-13} ${rows[3].y+5}Z`;
      s+=wash(4,-4,54,28,'#b9bb8c',R,.6)+P(ground,'#cfc9a6','none',0,' opacity=".55"')+tufts(4,-2,56,28,30,R);
      // Paving: a four-by-four grid of squares between the stones.
      let pave='';for(let r=0;r<4;r++){const a=rows[r];pave+=P(`M${f1((-2)*15*a.k+a.dx)} ${f1(a.y+2)} H${f1(2*15*a.k+a.dx)}`,'none','rgba(110,100,70,.4)',.35);}
      for(let c=0;c<=4;c++)pave+=P(`M${f1((c-2)*15*rows[0].k+rows[0].dx)} ${f1(rows[0].y+2)} L${f1((c-2)*15*rows[3].k+rows[3].dx)} ${f1(rows[3].y+2)}`,'none','rgba(110,100,70,.4)',.35);
      s+=pave;
      const stone=(p,up)=>{const{x,y,k}=p;if(!up)return`<g transform="translate(${f1(x)} ${f1(y)}) scale(${k}) rotate(${(p.c*37+p.r*19)%30-15})">${RC(-4,-2.6,8,2.6,'#bdb5a2',INK,.4)+RC(-4,-3.4,8,.8,'#d6cfbd',INK,.25)}</g>`;
        let o=shadow(3,.4,4.6,1.1)+P('M-2.6 0 V-10.2 L-1.4 -11.4 H2.6 V0Z','#c9c1ae',INK,.5)+P('M.8 0 V-11.4 H2.6 V0Z','#8f8778','none',0)+P('M-1.4 -11.4 l1 -1 h2.6 l-1 1z','#dcd5c4',INK,.25);
        o+=P(`M${f1(-1.6+R()*1.2)} -7 l.6 1.6 l-.4 1.4`,'none','rgba(40,30,20,.5)',.22)+[0,1,2].map(()=>CI(-1.8+R()*2.8,-1-R()*6.4,.35+R()*.3,R()<.5?'#9aa85e':'#d8c46a','none',0)).join('')+RC(-1.4,-6,1.2,1.2,'none','#5a4f40',.28);
        return`<g transform="translate(${f1(x)} ${f1(y)}) scale(${k})">${o}</g>`;};
      const lintel=(r,c)=>{const a=stones[r*4+c],b=stones[r*4+c+1],k=a.k;return`<g transform="translate(${f1(a.x)} ${f1(a.y)}) scale(${k})">${RC(-3.4,-14,(b.x-a.x)/k+6.8,2.6,'#d6cfbd',INK,.5)+P(`M-3.4 -14 l1.2 -1.2 h${f1((b.x-a.x)/k+6.8)} l-1.2 1.2z`,'#e6dfcd',INK,.25)+P(`M-3.4 -11.4 h${f1((b.x-a.x)/k+6.8)}`,'none','rgba(52,36,22,.4)',.5)}</g>`;};
      if(st===0)return s+stones.map((p,i)=>stone(p,i%5===0)).join('')+[[-8,16],[20,-14]].map(([x,y])=>CI(x,y,1.2,'#9aa0a0',INK,.25)).join('');
      const withLintels=st>=3;let body='';
      for(let r=0;r<4;r++){body+=stones.slice(r*4,r*4+4).map((p,i)=>bit(.2+(r*4+i)*.06,stone(p,true))).join('');
        if(withLintels&&(r===0||r===3))body+=[0,2].map(c=>bit(1.3+r*.1+c*.05,lintel(r,c))).join('');
        // The altar sits in the middle of the square, between the second and third rows.
        if(r===1&&withLintels)body+=bit(1.9,shadow(7,2,6,1.4)+RC(1,-2,10,4,'#bdb5a2',INK,.45)+P('M1 -2 l2 -2 h10 l-2 2z','#d6cfbd',INK,.3)+[0,1].map(rr=>[0,1].map(cc=>RC(4+cc*2.2+rr*.6,-3.6-rr*.8,1.6,.5,'none','#f2c24e',.25)).join('')).join(''));}
      s+=body;
      if(st<3)return s+bit(1.2,P('M-34 22 l5 -9 M-32 20 h6','none','#6b4527',.7)+P('M-34 13 q2 -1 4 0','none',INK,.3)+RC(40,14,5,3,'#bdb5a2',INK,.35)+RC(41,11,3,3,'#bdb5a2',INK,.35)+P('M38 17 l-3 3 M46 17 l3 3','none','#8b6a44',.5)+person(-26,24,'#6d8a4a','#3b2f26',.8));
      if(COLLECT)for(const p of stones)COLLECT.push(['c',p.x-.8*p.k,p.y-5.4*p.k,4*p.k]);
      s+=stones.map((p,i)=>`<rect x="${f1(p.x-1.4*p.k)}" y="${f1(p.y-6*p.k)}" width="${f1(1.2*p.k)}" height="${f1(1.2*p.k)}" fill="#f2c24e" class="cl-rune" style="animation-delay:${-(i%4)*.5}s"/>`).join('');
      // Sheep grazing among the stones, and a cairn.
      s+=bit(2.1,[[-34,4],[40,14],[-24,24]].map(([x,y],i)=>shadow(x+1,y+.3,2.4)+EL(x,y-1.4,2.2,1.4,'#f6f2ea',INK,.3)+EL(x+(i%2?-2.2:2.2),y-1.8,.9,.7,'#3b2f26')+P(`M${x-1} ${y-.2} v1 M${x+1} ${y-.2} v1`,'none','#3b2f26',.35)).join('')+[0,1,2,3].map(k=>EL(-38,14-k*1.3,2.2-k*.4,.8,shade('#bdb5a2',k*.06),INK,.25)).join(''));
      if(st>=4){let g='';for(let r=0;r<4;r++){const a=stones[r*4],b=stones[r*4+3];g+=P(`M${f1(a.x)} ${f1(a.y-5*a.k)} H${f1(b.x)}`,'none','#f2c24e',.5,' opacity=".6"');}for(let c=0;c<4;c++){const a=stones[c],b=stones[12+c];g+=P(`M${f1(a.x)} ${f1(a.y-5*a.k)} L${f1(b.x)} ${f1(b.y-5*b.k)}`,'none','#f2c24e',.5,' opacity=".6"');}
        s+=`<g class="cl-beacon">${g}<circle cx="7" cy="-26" r="12" fill="url(#clLamp)" class="cl-orbglow"/>${P('M7 -20 l-3 -6 l3 -6 l3 6z','#bfe8ff',INK,.45)}</g>`;}
      return s;},

    // Nine Ninja Temple: a three-tier pagoda, courtyard, koi pond; ten hooks, nine lanterns lit.
    9(st,R){let s='';
      // The temple stands on a raised stone terrace: earth slopes to either side, a retaining wall in front.
      const ruin=st===0;
      s+=wash(0,14,62,20,'#cdb88c',R,.55)+apron([[-60,25],[-44,22.4],[0,22.4],[44,22.4],[60,25]],14,R,'#c4a878');
      s+=[[-1,[[-32,-6],[-44,16],[-44,22],[-58,26],[-46,-4]]],[1,[[32,-6],[44,16],[44,22],[58,26],[46,-4]]]].map(([d,pts])=>{const o=P('M'+pts.map(p=>p.join(' ')).join('L')+'Z',d<0?'#c9b286':'#b0976c','none',0);let h='';for(let i=0;i<9;i++){const t=i/8,x=d*(33+t*12),y=-5+t*21;h+=`M${f1(x)} ${f1(y)} l${f1(d*(5+t*6))} ${f1(3+t*3)}`;}return o+P(h,'none','rgba(90,60,30,.5)',.3)+P(`M${pts[0].join(' ')} L${pts[4].join(' ')}`,'none',INK,.35);}).join('');
      s+=masonry(-44,16,88,6,'#c4b391',R,2.2)+(ruin?P('M-30 16 l4 3 l3 -2 l4 4 M18 16 l3 4 l4 -2','#d9cfb2',INK,.35):'')+P('M-44 16 V22 H44 V16','none',INK,.5)+RC(-45,15.2,90,1.4,'#e3d8bd',INK,.3);
      s+=P('M-44 16 L-32 -6 L32 -6 L44 16Z','#d9cfb2',INK,.4)+clip('M-44 16 L-32 -6 L32 -6 L44 16Z',[...Array(9)].map((_,k)=>P(`M-50 ${-4+k*2.4} H50`,'none','rgba(90,70,50,.25)',.25)).join('')+[...Array(18)].map((_,k)=>P(`M${-44+k*5} 16 L${-34+k*3.8} -6`,'none','rgba(90,70,50,.2)',.25)).join(''));
      // The grand stair, widening as it descends, with stone lanterns at its foot.
      s+=[...Array(7)].map((_,i)=>{const w=10+i*1.1,y=16+i*2;return ruin&&i%3===1?'':RC(-w/2,y,w,2,shade('#d6cbb0',-i*.02),INK,.3)+P(`M${f1(-w/2)} ${f1(y+.5)} h${f1(w)}`,'none','rgba(255,255,255,.4)',.3);}).join('')+P('M-5 16 L-8.8 30 M5 16 L8.8 30','none',INK,.4);
      const tier=(hw,y,h,ok)=>{const col=ok?'#3f4a52':'#9a948a',roof=`M${-hw-3} ${y-3} Q${-hw} ${y} ${-hw*.55} ${y} H${hw*.55} Q${hw} ${y} ${hw+3} ${y-3} L${hw*.6} ${y-h} H${-hw*.6}Z`;
        return P(roof,col,INK,.5)+clip(roof,[...Array(Math.round(hw*1.6))].map((_,k)=>{const x=-hw+k*1.25;return P(`M${f1(x)} ${y+1} Q${f1(x*.85)} ${f1(y-h*.5)} ${f1(x*.6)} ${y-h}`,'none','rgba(255,255,255,.18)',.3);}).join(''))+P(`M${-hw*.6} ${y-h} H${hw*.6}`,'none','#2a3038',.9)+CI(-hw-3,y-3,.6,'#e0b24a','none',0)+CI(hw+3,y-3,.6,'#e0b24a','none',0);};
      const pagoda=ok=>{let o=RC(-13,-10,26,4,'#bfb293',INK,.4)+[0,1,2].map(k=>RC(-5+k*.8,-6+k*1.4,10-k*1.6,1.4,'#cfc6b2',INK,.25)).join('')+RC(-9,-22,18,12,'#c0503a',INK,.5)+[-8,-3,3,8].map(x=>RC(x-.7,-22,1.4,12,'#8a2a1e','none',0)).join('');
        o+=clip('M-6.6 -21 h13.2 v9 h-13.2z',RC(-6.6,-21,13.2,9,'#f3ead3','none',0)+[...Array(6)].map((_,k)=>P(`M${-6.6+k*2.6} -21 v9 M-6.6 ${-21+k*1.8} h13.2`,'none','#8a2a1e',.25)).join(''));
        if(ok){COLLECT&&COLLECT.push(['r',-6.6,-21,13.2,9]);o+=P('M-6.6 -21 h13.2 v9 h-13.2z','#ffd36b','none',0,' class="cl-win"');}
        o+=tier(20,-22,10,ok)+RC(-9,-40,18,8,'#c0503a',INK,.45)+RC(-10.6,-33.6,21.2,1.2,'#8a2a1e',INK,.25)+[...Array(8)].map((_,k)=>P(`M${-10+k*2.8} -33.6 v-2`,'none','#8a2a1e',.3)).join('')+windowS(-4.6,-38.6,2.2,3,null)+windowS(2.4,-38.6,2.2,3,null)+tier(16,-40,9,ok)+RC(-6,-54,12,6,'#c0503a',INK,.45)+tier(12,-54,8,ok);
        return o+P('M0 -62 V-72','none','#b8860b',.7)+[0,1,2,3].map(k=>EL(0,-64-k*1.8,1.6-k*.25,.5,'#e0b24a',INK,.2)).join('')+CI(0,-73,1,'#e0b24a',INK,.25);};
      if(st===0)return s+`<g opacity=".85">${pagoda(false)}</g>`+[...Array(4)].map((_,i)=>`<g transform="translate(${-30+i*16} 12) rotate(80)">${quiet(()=>lantern(0,0,'#9a948a'))}</g>`).join('')+[[-34,4],[30,2]].map(([x,y])=>reeds(x,y,R,6)).join('');
      s+=bit(.2,pagoda(true));
      // The torii gate, raked sand, stone lanterns, the koi pond and its bridge.
      s+=bit(.5,P('M-8 18 V4 M8 18 V4','none','#c0503a',1.8)+P('M-12 2.6 Q0 .6 12 2.6 L11 4.4 Q0 2.8 -11 4.4Z','#2a3038',INK,.4)+RC(-10,5.2,20,1.1,'#c0503a',INK,.3)+RC(-1.6,4.6,3.2,2.4,'#2a3038',INK,.25));
      s+=bit(.6,[...Array(6)].map((_,k)=>P(`M-40 ${2+k*1.6} q4 -1 8 0 t8 0`,'none','rgba(120,100,70,.5)',.3)).join('')+EL(-30,4,2.2,1.3,'#8f8778',INK,.3));
      const toro=(x,y)=>{light(x,y-5.4,6);return RC(x-1.6,y-1,3.2,1,'#bdb5a2',INK,.25)+RC(x-.6,y-4,1.2,3,'#bdb5a2',INK,.25)+RC(x-1.4,y-6.2,2.8,2.2,'#bdb5a2',INK,.3)+RC(x-.7,y-5.8,1.4,1.4,'#ffd36b','none',0,' class="cl-lamp"')+P(`M${x-2.4} ${y-6.2} L${x} ${y-8} L${x+2.4} ${y-6.2}Z`,'#8f8778',INK,.3);};
      s+=bit(.7,toro(-20,10)+toro(20,10)+toro(-13,31)+toro(13,31));
      s+=bit(.8,EL(28,10,9,3.6,'#8ec3c6','#2c4e5c',.5)+`<g class="cl-koi">${EL(25,10,1.2,.5,'#e8783a')}${EL(31,9,1.2,.5,'#f4f0e8')}${EL(29,11.4,1,.45,'#e8783a')}</g>`+P('M22 9 Q28 5 34 9','none','#c0503a',.9)+P('M22 9.8 Q28 5.8 34 9.8','none','#8a2a1e',.3)+lily(32,11.6,1.2,true));
      s+=bit(.9,shadow(-36,-4,4)+P('M-36 -4 q-1 -3 1 -6','none','#6b4527',.8)+[[-38,-10,2.4],[-33,-11,2],[-36,-13,2]].map(([x,y,r])=>EL(x,y,r,r*.55,'#3f6a3a',INK,.25)).join(''));
      const hooks=[...Array(10)].map((_,i)=>[-36+i*8,-6+((i%2)?2:0)]);
      s+=P('M-38 -12 Q0 -8 38 -12','none',INK,.35)+hooks.map(([x])=>`<path d="M${x} -10.6 v1.8" stroke="${INK}" stroke-width=".35"/>`).join('');
      if(st<3)return s+hooks.slice(0,9).map(([x])=>quiet(()=>lantern(x,-6.4,'#b8ad9c')).replace('cl-glow','cl-glow off')).join('')+bit(1,P('M-24 -30 V-56 M24 -30 V-56 M-24 -40 H24 M-24 -50 H24','none','#8b5a32',.5,' opacity=".7"'));
      // Nine lanterns lit; the tenth hook stays empty.
      s+=hooks.slice(0,9).map(([x],i)=>bit(1+i*.1,lantern(x,-6.4,'#e8553a'))).join('');
      s+=bit(2,shadow(32,-12,6)+P('M32 -12 q-1 -4 0 -8','none','#6b4527',1)+[[30,-20,4],[34,-22,4.4],[31,-25,3.4],[36,-18,3]].map(([x,y,r])=>CI(x,y,r,'#f2c6d2',INK,.3)).join('')+[...Array(8)].map(()=>CI(28+R()*10,-26+R()*10,.45,'#e7a0b4','none',0)).join('')+`<g class="cl-petals">${[0,1,2].map(i=>EL(30+i*3,-14,.5,.3,'#f2c6d2','none',0,` class="cl-petal" style="animation-delay:${-i*1.3}s"`)).join('')}</g>`);
      s+=bit(2.2,person(-14,14,'#2a3038',null,.8)+person(-2,-8,'#c0503a',null,.7));
      if(st>=4)s+=`<g class="cl-sky-lanterns">${[-20,-4,14].map((x,i)=>`<g class="cl-rise" style="animation-delay:${-i*2.2}s">${quiet(()=>lantern(x,-66,'#f2a24e'))}</g>`).join('')}</g>`+bunting(-20,-32,20,-32,3,['#c0503a','#f2c24e']);
      return s;},

    // Six Circuit: the sun engine; boiler, pistons, pipes and gauges, five gears and one great wheel.
    6(st,R){let s='';
      const gear=(x,y,r,teeth,cls='',col='#c9a36a')=>`<g transform="translate(${x} ${y})"><g class="${cls}">${[...Array(teeth)].map((_,i)=>RC(-1.1,-r-2,2.2,2.6,shade(col,-.15),INK,.3,` transform="rotate(${f1(i/teeth*360)})"`)).join('')}${CI(0,0,r,col,INK,.5)}${CI(0,0,r*.72,'none',shade(col,-.3),.4)}${[...Array(6)].map((_,k)=>P(`M0 0 L0 ${f1(-r*.8)}`,'none',shade(col,-.4),.8,` transform="rotate(${k*60})"`)).join('')}${CI(0,0,r*.28,shade(col,-.35),INK,.4)}${[...Array(8)].map((_,k)=>CI(Math.cos(k/8*TAU)*r*.86,Math.sin(k/8*TAU)*r*.86,.3,'#5a4028','none',0)).join('')}</g></g>`;
      s+=P('M-42 14 H42 L36 4 H-36Z','#b8925e',INK,.45)+[...Array(12)].map((_,k)=>CI(-36+k*6.4,9,.35,'#5a4028','none',0)).join('')+P('M-40 14 H40','none','rgba(40,25,10,.4)',.8);
      if(st===0)return s+`<g transform="translate(-6 10) rotate(80) scale(1 .45)" opacity=".85">${gear(0,0,14,16,'','#a8a098')}</g>`+[[16,8,4],[26,9,3.4],[-24,9,3]].map(([x,y,r])=>`<g opacity=".8">${gear(x,y,r,8,'','#a8a098')}</g>`).join('')+P('M18 6 v-12 l3 -2 M30 6 v-8','none','#8a8274',1.2);
      // Trusses carrying the great wheel.
      s+=bit(.2,P('M-8 6 L0 -18 L8 6 M-14 6 L0 -18 L14 6 M-11 -2 H11 M-6 -10 H6','none','#6b4527',1.1)+P('M-8 6 L3 -10 M8 6 L-3 -10','none','#6b4527',.4));
      // The boiler, riveted, with its firebox and stack.
      s+=bit(.4,shadow(-26,5,10,1.6)+RC(-36,-8,20,12,'#8a8274',INK,.5)+RC(-36,-8,20,12,'url(#crCyl)','none',0)+[-33,-28,-23,-18].map(x=>P(`M${x} -8 v12`,'none','#5a5048',.6)+[...Array(5)].map((_,k)=>CI(x,-7+k*2.6,.3,'#3b322a','none',0)).join('')).join('')+RC(-31,-1,6,4,'#3b2f26',INK,.3)+(st>=3?RC(-30.4,.2,4.8,2.2,'#f28a3a','none',0,' class="cl-flame"'):'')+RC(-34,-18,3.4,10,'#6f665e',INK,.4)+RC(-34.6,-19.2,4.6,1.4,'#4a4038',INK,.3));
      s+=bit(.5,P('M-16 -2 H-6 V-10 M-16 2 H-10 V8','none','#b86a45',1.4)+[[-11,-2],[-6,-6]].map(([x,y])=>RC(x-.6,y-1,1.2,2,'#8b4a30','none',0)).join('')+CI(-20,-11,2,'#f6f0de',INK,.4)+P('M-20 -11 l1.2 -1','none','#c0503a',.4)+CI(-13,-12,1.6,'#f6f0de',INK,.35)+P('M-13 -12 l-.8 -1','none','#c0503a',.35)+`<g transform="translate(-10 8)">${CI(0,0,1.8,'none','#c0503a',.5)}${P('M-1.8 0 h3.6 M0 -1.8 v3.6','none','#c0503a',.35)}</g>`);
      const small=[[-30,-14,4],[-24,-22,3.4],[20,-4,4.5],[28,4,5],[14,6,4]];
      s+=small.map(([x,y,r],i)=>bit(.6+i*.1,gear(x,y,r,8,st>=3?(i%2?'cl-spin-r':'cl-spin'):''))).join('');
      if(st<3)return s+bit(1,P('M-4 -30 L10 -34 M10 -34 V-18','none','#6b4527',.6)+RC(6,-18,8,4,'#c9a36a',INK,.35))+person(24,12,'#3f6fb0','#3b2f26',.8);
      s+=bit(1.1,gear(0,-18,14,18,'cl-spin-slow'));
      s+=bit(1.3,P('M-16 -6 L-6 -18','none','#6f665e',1.2)+CI(-6,-18,1,'#4a4038',INK,.3)+RC(-19,-8,4,4,'#6f665e',INK,.3));
      // The sun mirror: a segmented dish on its pivot, catching the light.
      s+=bit(1.5,P('M22 -30 Q32 -40 42 -24 Q32 -24 22 -30Z','#f2e3a8',INK,.5)+[...Array(5)].map((_,k)=>P(`M${f1(24+k*4)} ${f1(-31-k*.8+k*k*.2)} L${f1(32+k*.4)} -26`,'none','rgba(150,120,50,.5)',.25)).join('')+P('M32 -27 V-6 M28 -6 h8','none','#4a4038',.8)+P('M32 -27 L28 -36','none','#4a4038',.4)+CI(28,-36,1.2,'#fff4a8',INK,.3,' class="cl-glint"')+P('M26 -32 l5 -3','none','#fff',.6,' class="cl-glint"'));
      s+=bit(1.7,lampPost(-40,6,12,1)+lampPost(40,8,12,-1))+smoke(-32.3,-20,4,1)+smoke(-22,-10,3,2)+bit(1.9,person(8,12,'#8b4a30','#3b2f26',.8)+P('M9.4 7.6 l2 -1.6','none','#6b6b6b',.5));
      if(st>=4)s+=`<g class="cl-rays">${[...Array(10)].map((_,i)=>P(`M0 -18 L${f1(Math.cos(i/10*TAU)*32)} ${f1(-18+Math.sin(i/10*TAU)*32)}`,'none','#f2c24e',1,' opacity=".45"')).join('')}</g>`+flag(-34,-19,'#e0b24a',6)+bunting(-40,-6,40,-6,3,['#e0b24a','#c0503a','#3f6fb0']);
      return s;},

    // Dozen Desert: the oasis; a pool with reflections, ten palms and two more, tents, a camel, a well.
    12(st,R){let s='';
      const pool='M-26 4 Q-24 -6 -4 -5 Q20 -6 26 2 Q24 12 2 13 Q-22 13 -26 4Z';
      if(st===0)return s+P(pool,'#d9c49a','#8a7c68',.6)+[...Array(8)].map(()=>{const x=-18+R()*36,y=-1+R()*10;return P(`M${f1(x)} ${f1(y)} l${f1(2+R()*2)} ${f1(-1+R()*2)} l${f1(1+R()*2)} ${f1(R()*2)}`,'none','#9a8a70',.35);}).join('')+P('M22 0 q1 -6 3 -11','none','#8a7c68',1)+P('M25 -11 l-5 3 M25 -11 l4 4 M25 -11 l1 -5','none','#8a7c68',.7)+[[-36,14,20],[30,16,16]].map(([x,y,w])=>P(`M${x-w/2} ${y} Q${x} ${y-7} ${x+w/2} ${y-1}`,'#e8d2a0','#b8925e',.5)).join('');
      s+=bit(.2,P('M-48 -6 Q-36 -2 -24 2','none','#b58a56',2.4)+CI(-50,-8,3.2,'#cfc2a4',INK,.45)+CI(-50,-8,1.8,'#27363c','none',0)+P('M-53 -8 V-15 M-47 -8 V-15 M-54 -15 H-46','none','#6b4527',.7)+CI(-50,-15,.9,'#8b6a44',INK,.25)+P('M-50 -15 v4','none',INK,.25)+RC(-51,-11.4,2,1.6,'#8b6a44',INK,.25));
      if(st<3)return s+P(pool,'#d9c49a','#8a7c68',.6)+bit(.5,P('M14 2 l6 -9','none','#6b4527',.8)+P('M19 -8 l3 -1 l-1 3z','#8f8778',INK,.3)+P('M16 5 q3 -2 6 0','#c9a36a',INK,.35)+[[-22,-2],[-8,-6],[8,-6],[22,-2],[20,10],[-20,10]].map(([x,y])=>P(`M${x} ${y} v-4`,'none','#6b4527',.6)+P(`M${x} ${y-4} l2.4 .8 l-2.4 .8`,'#c0503a','none',0)).join(''))+person(-40,6,'#e0b24a','#f6eedb',.8);
      // Water: pale in the middle, palm reflections, ripples, lilies and reeds at the rim.
      s+=bit(.6,P(pool,'#e8d2a0','none',0,' transform="scale(1.08) translate(0 .6)"')+P(pool,'url(#crPool)','#2c4e5c',.7)+[...Array(6)].map(()=>{const x=-18+R()*36;return P(`M${f1(x)} 0 q.6 3 0 6 q-.6 3 0 5`,'none','rgba(40,90,70,.3)',.8);}).join('')+ripple(-6,4,4)+ripple(8,8,3)+ripple(-14,9,2.4)+lily(10,6,1.6,true)+lily(14,3,1.2)+lily(-12,6,1.4,true)+[[-25,6],[24,8],[-4,-5]].map(([x,y])=>reeds(x,y,R,4)).join('')+P('M-48 -6 Q-36 -2 -24 2','none','#8ec3c6',1.2));
      const palms=[...Array(12)].map((_,i)=>{const a=i/12*TAU+.3,rr=i<10?1:1.25;return[Math.cos(a)*32*rr,5+Math.sin(a)*13*rr];}).sort((a,b)=>a[1]-b[1]);
      s+=palms.map(([x,y],i)=>bit(1+i*.08,palm(x,y,.85,i%2?2:-2,R))).join('');
      // Tents with stripes and guy ropes, a rug, and a lantern.
      const tent=(x,y,c)=>{const o=`M${x-9} ${y} L${x} ${y-10} L${x+9} ${y}Z`;return shadow(x+3,y+.6,11,2)+P(o,'#efe3c6',INK,.5)+clip(o,[...Array(5)].map((_,k)=>RC(x-10+k*4.4,y-11,2,12,c,'none',0)).join(''))+P(o,'none',INK,.5)+P(`M${x} ${y-10} L${x+9} ${y} H${x+3}Z`,'rgba(60,30,10,.2)')+P(`M${x-2} ${y} L${x} ${y-5} L${x+2} ${y}Z`,'#3b2a1c')+P(`M${x-9} ${y} l-3 1.6 M${x+9} ${y} l3 1.6 M${x} ${y-10} l-2 -1.6`,'none','#8b6a44',.3);};
      s+=bit(1.9,tent(38,-18,'#c0503a')+tent(46,16,'#3f6fb0')+RC(30,-17,8,3,'#c0503a',INK,.3)+P('M31 -15.5 h6 M32 -16.6 l1 1 l1 -1 l1 1 l1 -1','none','#f2c24e',.3)+lamp(26,-17,7));
      // A camel resting in the palms' shade, and water jars.
      s+=bit(2.1,shadow(-40,-8,7,1.6)+P('M-46 -8 q0 -3 3 -3 q1 -3 3 -1 q2 -3 4 0 q2 0 2 3z','#c9a36a',INK,.4)+P('M-34 -9 q2 -4 1 -7 l2 -.6 q1 1 0 2 q-.4 3 -1.4 6z','#c9a36a',INK,.35)+RC(-42,-11.4,4,1.6,'#c0503a',INK,.25)+[[-26,18],[-23,18.6]].map(([x,y])=>P(`M${x-1.2} ${y} q-.8 -2 0 -3.4 h2.4 q.8 1.4 0 3.4z M${x-.6} ${y-3.4} v-.8 h1.2 v.8`,'#b86a45',INK,.3)).join('')+person(34,-10,'#f6eedb','#c0503a',.8));
      if(st>=4)s+=flag(38,-28,'#c0503a',9)+flag(-38,10,'#2f8f8a',9,.6)+[...Array(12)].map((_,i)=>CI(-22+i*4,15+(i%2)*1.6,1,['#e7708a','#f2c24e','#b894e0'][i%3],INK,.15)).join('')+bunting(-38,10,38,-28,4,['#c0503a','#f2c24e','#2f8f8a']);
      return s;},

    // Eight Ice Caves: a faceted ice cliff, icicles, a glowing passage; crystals doubling and doubling.
    8(st,R){let s='';
      const cliff=[[-42,16],[-36,-16],[-22,-30],[-4,-38],[16,-34],[32,-22],[40,-6],[44,16]];
      s+=P('M'+cliff.map(p=>p.join(' ')).join('L')+'Z','#e3eff4','#2c4e5c',.7);
      const facets=[['#d2e6ee',[-42,16],[-36,-16],[-20,4]],['#c3dce8',[-36,-16],[-22,-30],[-14,-6],[-20,4]],['#eaf4f8',[-22,-30],[-4,-38],[-2,-14],[-14,-6]],['#d8eaf1',[-4,-38],[16,-34],[12,-12],[-2,-14]],['#b8d2e0',[16,-34],[32,-22],[26,2],[12,-12]],['#a9c8d8',[32,-22],[40,-6],[44,16],[26,2]]];
      s+=facets.map(([c,...pts])=>P('M'+pts.map(p=>p.join(' ')).join('L')+'Z',c,'rgba(44,78,92,.45)',.3)).join('');
      s+=P('M-38 -14 Q-20 -36 -4 -40 Q16 -36 34 -20','none','#fff',1.6)+P('M-38 -14 Q-20 -36 -4 -40 Q16 -36 34 -20','none','#b8d2e0',.4,' transform="translate(0 1.2)"');
      s+=P('M-15 16 V2 Q0 -18 15 2 V16Z','#2a3e4a','#1d2a33',.7)+wash(0,18,54,6,'#ffffff',R,.9)+P('M-48 19 Q-34 13 -18 17 Q-8 19 0 17 Q10 15 18 17 Q34 13 48 19 Q30 22 0 21 Q-30 22 -48 19Z','#fbfdff','#9cc0d0',.35);
      const icicles=[...Array(9)].map((_,k)=>{const t=k/8,x=-14+28*t,y=2-Math.sin(t*Math.PI)*17;return P(`M${f1(x-.8)} ${f1(y)} l.8 ${f1(2+R()*2.4)} l.8 ${f1(-2-R()*2.4)}`,'#eaf6fa','#5f7f90',.25);}).join('');
      const snow=[[-40,16,12],[36,16,10],[-6,17,8]].map(([x,y,w])=>P(`M${x-w} ${y} Q${x} ${y-5} ${x+w} ${y}Z`,'#fbfdff','#9cc0d0',.35)).join('');
      if(st===0)return s+[[-8,12,6],[4,10,7],[10,14,5],[-2,6,5]].map(([x,y,r])=>CI(x,y,r,'#dce8ee','#5f7f90',.5)+P(`M${x-r*.5} ${y-r*.3} l${r*.6} ${r*.2}`,'none','#fff',.4)).join('')+snow;
      const crystal=(x,y,h,col)=>{const w=h*.28;return P(`M${f1(x)} ${f1(y)} L${f1(x-w)} ${f1(y-h*.6)} L${f1(x)} ${f1(y-h)} L${f1(x+w)} ${f1(y-h*.6)}Z`,col,'#2c4e5c',.35)+P(`M${f1(x)} ${f1(y)} L${f1(x)} ${f1(y-h)} L${f1(x+w)} ${f1(y-h*.6)}Z`,'rgba(255,255,255,.35)','none',0)+P(`M${f1(x-w*.5)} ${f1(y-h*.55)} l${f1(w*.3)} ${f1(-h*.25)}`,'none','#fff',.3);};
      const cluster=(x,y,h,n,col)=>[...Array(n)].map((_,k)=>crystal(x+(k-(n-1)/2)*h*.28,y,h*(1-Math.abs(k-(n-1)/2)*.22),col)).join('');
      s+=bit(.3,[[8,14,5],[12,12,4]].map(([x,y,r])=>CI(x,y,r,'#dce8ee','#5f7f90',.5)).join('')+P('M-24 14 l6 -8 M-22 12 l2 3','none','#6b4527',.8));
      if(st<3)return s+bit(.6,P('M18 18 h14 l2 -2','none','#6b4527',1)+RC(19,13,11,3,'#dce8ee','#5f7f90',.45)+P('M22 13 v3 M26 13 v3','none','#5f7f90',.35)+P('M32 16 l6 -3','none','#6b4527',.5))+lamp(-18,16,7)+snow+icicles;
      light(0,4,16);
      s+=bit(.9,P('M-15 16 V2 Q0 -18 15 2 V16Z','url(#clIce)','none',0,' class="cl-orbglow"')+[[-6,10,3],[4,6,2.4],[0,12,2]].map(([x,y,h])=>crystal(x,y,h,'#e6f7ff')).join(''))+icicles;
      // Eight clusters: one, then two, then four, then eight crystals growing around the mouth.
      const cr=[[-24,14,9,1],[22,14,9,2],[-32,8,7,3],[-18,6,6,4],[28,8,7,3],[34,12,6,2],[-8,17,5,2],[8,17,5,3]];
      s+=cr.map(([x,y,h,n],i)=>bit(1.2+i*.1,cluster(x,y,h,n,i%2?'#b8b0f0':'#a8d8f0'))).join('');
      s+=snow+bit(1.9,lampPost(-17,16,8,-1)+lampPost(17,16,8,1));
      // A sledge of supplies and footprints to the door; a snowy owl on the ice.
      s+=bit(2.1,P('M26 22 h12 q2 0 2 -2','none','#6b4527',.8)+crate(30,20.6,.8)+barrel(35,20.8,.7)+P('M26 20 l-10 -3','none','#8b6a44',.3)+[...Array(6)].map((_,k)=>EL(12-k*3,20+k*.4,.6,.35,'rgba(90,120,140,.5)')).join('')+EL(-30,-10,1.6,2,'#fbfdff',INK,.3)+CI(-30,-12.4,1.2,'#fbfdff',INK,.3)+CI(-30.4,-12.6,.25,'#e0b24a','none',0)+CI(-29.6,-12.6,.25,'#e0b24a','none',0));
      s+=`<g class="cl-sparkle">${[...Array(8)].map((_,i)=>`<path d="M${f1(-34+i*9.6)} ${f1(-22+(i%3)*8)} l.8 -2 l.8 2 l2 .8 l-2 .8 l-.8 2 l-.8 -2 l-2 -.8z" fill="#fff" style="animation-delay:${-i*.5}s" class="cl-twinkle"/>`).join('')}</g>`;
      if(st>=4)s+=`<g class="cl-aurora">${['#6ef2c1','#7fb8ff','#c69cff'].map((c,i)=>`<path d="M-54 ${-50-i*6} Q-20 ${-66-i*6} 0 ${-52-i*6} T54 ${-56-i*6}" stroke="${c}" stroke-width="6" fill="none" opacity=".3" style="animation-delay:${-i*2}s"/>`).join('')}</g>`+flag(0,-38,'#7fb8ff',8);
      return s;},

    // Seven Storm Peak: the stone refuge, snow on its roof, woodpile and bell, and the beacon.
    7(st,R){let s='';
      const sky=[[-52,20],[-44,10],[-36,6],[-30,-2],[-22,-10],[-16,-8],[-10,-12],[-4,-7],[4,-14],[10,-18],[16,-24],[21,-20],[26,-14],[33,-6],[40,2],[46,10],[54,20]];
      s+=wash(0,17,62,10,'#a8a0a6',R,.55);
      s+=P('M'+sky.map(p=>p.join(' ')).join('L')+'L50 22 Q0 26 -50 22Z','#b8b0b6','none',0);
      s+=[[-22,-10,-10,20,-2,20],[16,-24,30,20,44,20],[-4,-7,6,20,12,20],[40,2,50,20,54,20]].map(([x1,y1,x2,y2,x3,y3])=>P(`M${x1} ${y1} L${x2} ${y2} L${x3} ${y3} Z`,'rgba(46,38,62,.3)','none',0)).join('');
      s+=[...Array(14)].map(()=>{const x=-40+R()*80,y=-2+R()*18;return P(`M${f1(x)} ${f1(y)} l${f1(1.4+R()*2.6)} ${f1(2.4+R()*3)}`,'none','rgba(46,38,62,.42)',.3);}).join('');
      s+=P('M'+sky.map(p=>p.join(' ')).join('L'),'none',INK,.6)+P('M-30 -2 L-22 -10 L-16 -8 L-10 -12 L-4 -7 L4 -14 L10 -18 L16 -24 L21 -20 L26 -14','none','#fbfdff',1.5)+P('M-26 -5 l3 2 M8 -15 l2 3 M18 -21 l2 4','none','#fbfdff',.8);
      s+=[[-44,19,3],[46,19,2.6],[-26,20,2]].map(([x,y,r])=>P(`M${x-r} ${y} l${r*.4} ${-r*.9} l${r} ${-r*.3} l${r*.6} ${r*1.2}z`,'#a8a0a6',INK,.35)).join('')+tufts(0,19,48,4,16,R,'#7a7a58');
      const cloud=(bolt=true)=>`<g class="cl-storm">${P('M-32 -40 q-9 0 -9 -6.5 q0 -7.5 10 -7.5 q3 -8.5 14 -6.5 q7.5 -6.5 16 1 q10 -2 12 6.5 q7.5 1 6.5 7.5 q0 5.5 -8.5 5.5z','#6a6478','#3b3448',.6)+P('M-28 -44 q6 -3 12 0 M-6 -50 q6 -3 12 0','none','rgba(255,255,255,.25)',.6)+`<g class="cl-rain">${[...Array(12)].map((_,k)=>P(`M${-34+k*5.4} -34 l-2 6`,'none','#8aa0c0',.35)).join('')}</g>`+(bolt?`<path class="cl-bolt" d="M-6 -32 l-4 9 h4 l-3 9 l9 -12 h-4 l3 -6z" fill="#fff4a8" stroke="#8a6a18" stroke-width=".4"/>`:'')}</g>`;
      const lodgeWalls=(ok)=>shadow(4,13.4,20,2.4)+P('M14 12 l6 -3.6 v-13 l-6 3.6z','#aea48c',INK,.45)+masonry(-14,-2,28,14,'#cfc4ab',R,2.2)+P('M-14 12 V-2 H14 V12','none',INK,.55)+(ok?'':P('M-14 -2 l4 -3 l3 2 l4 -4','none','#8a8274',.8));
      if(st===0)return s+cloud()+lodgeWalls(false)+[[-24,16],[22,16]].map(([x,y])=>[0,1,2].map(k=>RC(x+k*2.4-2,y-k*1.1,2.4,1.6,'#c9bca0',INK,.25)).join('')).join('');
      s+=bit(.2,lodgeWalls(true));
      if(st<3)return s+`<g opacity=".6">${cloud()}</g>`+bit(.8,person(-22,16,'#3f6fb0','#c0503a',.8)+P('M18 12 V-8 M20.4 12 V-8','none','#6b4527',.4)+[...Array(6)].map((_,k)=>P(`M18 ${9-k*3.2} h2.4`,'none','#6b4527',.35)).join('')+crate(-30,16)+barrel(-34,16))+bit(.6,P('M-16 -2 L0 -14 L16 -2 M-8 -8 V-2 M8 -8 V-2 M0 -14 V-2','none','#8b5a32',.6)+[0,1,2].map(k=>RC(-24+k*.4,14-k*1.2,8,1.2,'#9a7448',INK,.25)).join(''));
      // Slate roof under snow, a dormer, icicles; windows, door lantern, woodpile, bell.
      const roof='M-17 -1 L0 -15 L17 -1Z',side='M0 -15 l6 -3.6 L23 -4.6 L17 -1Z';
      s+=bit(.8,P(side,'#3f5460',INK,.45)+shingles(roof,-18,-16,18,-1,'#4e6470',R,1.4,1.8)+P(roof,'none',INK,.55)+P('M-15 -2.6 L0 -14.4 L15 -2.6 L13 -1.6 Q6 -4 0 -9 Q-6 -4 -13 -1.6Z','#fbfdff','#9cc0d0',.35)+[...Array(8)].map((_,k)=>P(`M${f1(-14+k*4)} ${f1(-1.2)} l.5 1.6 l.5 -1.6`,'#eaf6fa','#5f7f90',.2)).join('')+windowS(-2,-9,2,2.4,null)+chimney(9,-6,6,'#8f8778',true,0));
      s+=bit(1,windowS(-11,2,3,3.4,'#6b4527')+windowS(8,2,3,3.4,'#6b4527')+door(-1.6,12,3.2,5.6)+lampPost(2.8,9,4,1));
      s+=bit(1.1,[...Array(9)].map((_,k)=>{const x=-24+(k%3)*2.4+(Math.floor(k/3)%2)*1.2,y=12-Math.floor(k/3)*2.2;return CI(x,y,1.1,'#9a7448',INK,.3)+CI(x,y,.45,'none','#6b4527',.2);}).join('')+P('M-28 12 V6 M-18 12 V6','none','#5b3f28',.6));
      s+=bit(1.2,P('M-34 12 V2 M-28 12 V2 M-35 2 H-27','none','#5b3f28',.7)+P('M-32.8 3 q-.6 3 -1 4 h3.6 q-.4 -1 -1 -4z','#b8860b',INK,.3)+CI(-31,7.4,.5,'#6b4527','none',0));
      // The beacon tower: stone drum, brazier fire, lightning rod.
      light(26,-26,15);
      s+=bit(1.4,shadow(28,14,6,1.4)+masonry(22,-18,8,32,'#cfc4ab',R,2.2)+RC(22,-18,8,32,'url(#crCyl)','none',0)+P('M22 14 V-18 M30 14 V-18','none',INK,.5)+windowS(24.8,-6,2.4,3.2,null,true)+RC(20.6,-20,10.8,2,'#8f8778',INK,.35)+P('M22 -20 l1 -4 h6 l1 4z','#4a4038',INK,.35)+`<g class="cl-flame">${P('M23.6 -24 q2.4 -6 2.4 -9 q1.6 3 2.4 9z','#f28a3a','#b8501a',.3)}${P('M25 -24 q1 -3 1 -5 q.8 2 1 5z','#ffd36b','none',0)}</g>`+`<circle cx="26" cy="-26" r="10" fill="url(#clLamp)" class="cl-orbglow"/>`+P('M31 -18 V-38 M31 -38 l-1.4 2 M31 -38 l1.4 2','none',INK,.45)+P('M31 -18 l1 6 l-1 6 l1 6','none','#8a6a18',.3));
      s+=bit(1.8,person(-6,16,'#3f6fb0','#c0503a',.8)+P('M-4 12 l2 -3','none','#6b4527',.4));
      if(st>=4)s+=['#e8553a','#f2c24e','#6ab04c','#3f6fb0'].map((c,i)=>P(`M${-46+i*4} -20 A${46-i*4} ${32-i*4} 0 0 1 ${46-i*4} -20`,'none',c,1.4,' opacity=".45"')).join('')+bunting(-17,-1,-40,-8,2,['#e8553a','#f2c24e','#6ab04c','#3f6fb0','#f6eedb'])+flag(-14,-2,'#3f6fb0',9)+bird(-24,-46,0)+bird(-12,-52,1.2)+bird(8,-48,2.4)+person(12,17,'#e8553a',null,.8)+P('M13.4 11.6 l1.6 -2.4','none','#f2cfa8',.5)+CI(26,-40,4,'#fff4c0','#f2c24e',.4);
      else s+=`<g opacity=".35" transform="translate(40 -10) scale(.7)">${cloud(false)}</g>`;
      return s;},
  };

  function markup(stages,fresh={}){
    api.glows=[];UID=0;
    const R=CW.rng(91);
    return `<defs><radialGradient id="clOrb"><stop offset="0" stop-color="#e4f6ff" stop-opacity=".95"/><stop offset="1" stop-color="#7fd3ff" stop-opacity="0"/></radialGradient><radialGradient id="clIce"><stop offset="0" stop-color="#e6f7ff"/><stop offset=".7" stop-color="#8fd0f0"/><stop offset="1" stop-color="#2a3e4a"/></radialGradient><linearGradient id="crCyl" x1="0" x2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#281a0a" stop-opacity=".38"/></linearGradient><radialGradient id="crPool"><stop offset="0" stop-color="#bfe2e0"/><stop offset=".7" stop-color="#7fb8bc"/><stop offset="1" stop-color="#5f9aa0"/></radialGradient></defs>`+
      Object.entries(SITES).map(([f,site])=>{const st=stages[f]|0;COLLECT=st>=3?[]:null;const html=LANDMARK[f](st,R),k=1.2;
        if(COLLECT)api.glows.push(...COLLECT.map(([t,x,y,a,b])=>t==='c'?['c',site.x+x*k,site.y+y*k,a*k]:['r',site.x+x*k,site.y+y*k,a*k,b*k]));COLLECT=null;
        return`<g class="cl-realm cl-r${f} s${st}${fresh[f]?' fresh':''}" transform="translate(${site.x} ${site.y}) scale(${k})">${html}</g>`;}).join('');
  }
  const api={SITES,markup,glows:[],families:Object.keys(SITES).map(Number)};
  root.ChartRealms=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
