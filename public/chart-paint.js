/* Paints the hand-drawn chart: paper, watercolour washes with relief shading,
   engraved water lines, contours, and every tree, peak, dune and cottage.
   Canvas 2D only (no DOM), so it runs in a worker or on the main thread.
   paint() is a generator: the caller decides how much to draw per slice. */
(function(root){
  'use strict';
  const VERSION=7; // bump whenever the drawing changes, so cached charts are redrawn
  const TAU=Math.PI*2,INK='rgba(52,36,22,.95)',INK2='rgba(52,36,22,.5)';
  const CW=typeof module!=='undefined'&&module.exports?require('./chart-world'):root.ChartWorld;

  /* ---------- small drawing helpers ---------- */
  const lerp=(a,b,t)=>[a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t];
  function shade(hex,k){const n=parseInt(hex.slice(1),16),f=c=>Math.round(k<0?c*(1+k):c+(255-c)*k);return'#'+[f(n>>16),f(n>>8&255),f(n&255)].map(c=>Math.max(0,Math.min(255,c)).toString(16).padStart(2,'0')).join('');}
  function path(ctx,pts){ctx.beginPath();pts.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();}
  function poly(ctx,pts,fill,stroke,lw=.7){path(ctx,pts);if(fill){ctx.fillStyle=fill;ctx.fill();}if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=lw;ctx.lineJoin='round';ctx.stroke();}}
  function seg(ctx,a,b,w=.45,c=INK2){ctx.strokeStyle=c;ctx.lineWidth=w;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(a[0],a[1]);ctx.lineTo(b[0],b[1]);ctx.stroke();}
  function clip(ctx,pts,fn){ctx.save();path(ctx,pts);ctx.clip();fn();ctx.restore();}
  function shadowAt(ctx,x,y,rx,ry,a=.22){ctx.fillStyle=`rgba(58,46,26,${a})`;ctx.beginPath();ctx.ellipse(x,y,rx,ry,-.12,0,TAU);ctx.fill();}
  /* Strokes that share one style go into one path: thousands of lines, one draw call. */
  function batch(ctx,color,width,fn){ctx.strokeStyle=color;ctx.lineWidth=width;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();fn((x1,y1,x2,y2)=>{ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);});ctx.stroke();}

  /* Marching squares over a grid field: segments where the field crosses `level`. */
  function contour(F,GW,GH,G,level,test,emit){
    for(let j=0;j<GH-1;j++)for(let i=0;i<GW-1;i++){const k=j*GW+i,a=F[k],b=F[k+1],c=F[k+GW+1],d=F[k+GW];
      const code=(a>level?8:0)|(b>level?4:0)|(c>level?2:0)|(d>level?1:0);if(!code||code===15)continue;
      const x=i*G,y=j*G,l=(p,q)=>(level-p)/(q-p),T=[x+G*l(a,b),y],R=[x+G,y+G*l(b,c)],B=[x+G*l(d,c),y+G],L=[x,y+G*l(a,d)];
      const m={1:[L,B],2:[B,R],3:[L,R],4:[T,R],5:[L,T,B,R],6:[T,B],7:[L,T],8:[L,T],9:[T,B],10:[T,R,L,B],11:[T,R],12:[L,R],13:[B,R],14:[L,B]}[code];
      for(let s=0;s<m.length;s+=2)if(!test||test(m[s][0],m[s][1]))emit(m[s][0],m[s][1],m[s+1][0],m[s+1][1]);}
  }

  /* ---------- buildings (shared with the living layer through houseFeatures) ---------- */
  function masonry(ctx,x0,x1,y0,y1,R,base,course=2.6){for(let yy=y1,row=0;yy>y0-course;yy-=course,row++){let xx=x0-(row%2?2.2:0);while(xx<x1){const w=2.8+R()*2.4;ctx.fillStyle=shade(base,(R()-.5)*.12);ctx.fillRect(xx,yy-course,w,course);ctx.strokeStyle='rgba(52,36,22,.42)';ctx.lineWidth=.35;ctx.strokeRect(xx,yy-course,w,course);xx+=w;}}}
  function glazing(ctx,pts,out){poly(ctx,pts,'#33434b',INK,.55);const[a,b,c,d]=pts,m1=lerp(a,b,.5),m2=lerp(d,c,.5),m3=lerp(a,d,.45),m4=lerp(b,c,.45);seg(ctx,m1,m2,.45,'#efe3c4');seg(ctx,m3,m4,.45,'#efe3c4');seg(ctx,lerp(a,c,.18),lerp(a,c,.34),.4,'rgba(255,255,255,.55)');out.windows.push(pts);}
  function frontWindow(ctx,cx,cy,o,R,out,w=3.8,h=4.4){
    for(const s of[-1,1]){const sx=cx+s*(w/2+1)-.85;poly(ctx,[[sx,cy-h/2],[sx+1.7,cy-h/2],[sx+1.7,cy+h/2],[sx,cy+h/2]],o.shutter,INK,.4);seg(ctx,[sx+.85,cy-h/2+.4],[sx+.85,cy+h/2-.4],.3,'rgba(30,20,10,.45)');}
    glazing(ctx,[[cx-w/2,cy-h/2],[cx+w/2,cy-h/2],[cx+w/2,cy+h/2],[cx-w/2,cy+h/2]],out);
    poly(ctx,[[cx-w/2-.7,cy+h/2],[cx+w/2+.7,cy+h/2],[cx+w/2+.7,cy+h/2+.8],[cx-w/2-.7,cy+h/2+.8]],'#d8cba9',INK,.35);
    if(R()<.65){poly(ctx,[[cx-w/2,cy+h/2+.8],[cx+w/2,cy+h/2+.8],[cx+w/2-.3,cy+h/2+2],[cx-w/2+.3,cy+h/2+2]],'#7a5230',INK,.3);for(let i=0;i<6;i++){ctx.fillStyle=['#e7708a','#f2c24e','#fff4e0','#b894e0'][(i+Math.floor(R()*4))%4];ctx.beginPath();ctx.arc(cx-w/2+.5+i*(w-1)/5,cy+h/2+.6-R()*.5,.55,0,TAU);ctx.fill();}}}
  function door(ctx,dx0,y,dh){const w=3.9,r=w/2;ctx.beginPath();ctx.moveTo(dx0-r,y);ctx.lineTo(dx0-r,y-dh+r);ctx.arc(dx0,y-dh+r,r,Math.PI,0);ctx.lineTo(dx0+r,y);ctx.closePath();ctx.fillStyle='#6b4527';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=.6;ctx.stroke();
    for(const o of[-.65,.65])seg(ctx,[dx0+o,y-.2],[dx0+o,y-dh+.9],.3,'rgba(25,15,8,.6)');ctx.fillStyle='#e7c261';ctx.beginPath();ctx.arc(dx0+r-.8,y-dh*.45,.35,0,TAU);ctx.fill();
    poly(ctx,[[dx0-r-.9,y],[dx0+r+.9,y],[dx0+r+.5,y+1.2],[dx0-r-.5,y+1.2]],'#c8bb99',INK,.35);}
  function drawHouse(ctx,o,R,out){
    const k=1.15,W=o.w*k,H=o.h*k,d=o.d*k,dx=d*.78,dy=-d*.46,rh=W*.52,{x,y}=o,len=Math.hypot(dx,dy);
    const FL=[x-W/2,y],FR=[x+W/2,y],FLt=[x-W/2,y-H],FRt=[x+W/2,y-H],BR=[FR[0]+dx,FR[1]+dy],BRt=[BR[0],BR[1]-H];
    const A=[x,y-H-rh],B=[A[0]+dx,A[1]+dy],FLe=[FLt[0]-2.3,FLt[1]+1.3],FRe=[FRt[0]+2.3,FRt[1]+1.3],BRe=[BRt[0]+2.3,BRt[1]+1.3];
    const wall=o.wall==='stone'?'#d6c9aa':o.wall==='timber'?'#f1e6cc':'#eee1c3',side=shade(wall,-.2);
    shadowAt(ctx,x+W*.42,y+1.5,W*.8,3.4);
    poly(ctx,[FR,BR,BRt,FRt],side);
    clip(ctx,[FR,BR,BRt,FRt],()=>{if(o.wall==='stone')masonry(ctx,FR[0],BR[0]+1,BRt[1]-2,y+1,R,side);ctx.strokeStyle='rgba(52,36,22,.3)';ctx.lineWidth=.3;ctx.beginPath();for(let i=-24;i<30;i+=1.5){ctx.moveTo(FR[0]+i,y+3);ctx.lineTo(FR[0]+i+12,y-H-9);}ctx.stroke();});
    poly(ctx,[FR,BR,BRt,FRt],null,INK,.75);
    const u=[dx/len,dy/len];for(const hh of o.upper?[.32,.72]:[.45]){const P=[FR[0]+dx*.5,FR[1]+dy*.5-H*hh];glazing(ctx,[[P[0]-u[0]*1.6,P[1]-u[1]*1.6-2.1],[P[0]+u[0]*1.6,P[1]+u[1]*1.6-2.1],[P[0]+u[0]*1.6,P[1]+u[1]*1.6+2.1],[P[0]-u[0]*1.6,P[1]-u[1]*1.6+2.1]],out);}
    poly(ctx,[FL,FR,FRt,FLt],wall);
    clip(ctx,[FL,FR,FRt,FLt],()=>{
      if(o.wall==='stone')masonry(ctx,FL[0]-3,FR[0]+3,y-H,y,R,wall);
      else{masonry(ctx,FL[0]-3,FR[0]+3,y-2.6,y,R,'#c9bc9c');ctx.fillStyle='rgba(150,120,80,.1)';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x+(R()-.5)*W,y-R()*H,2+R()*3,1+R()*2,0,0,TAU);ctx.fill();}}
      if(o.wall==='timber'){ctx.fillStyle='#5b3f28';for(const[a,b,c,e]of[[FL[0],y-H,1.6,H],[FR[0]-1.6,y-H,1.6,H],[FL[0],y-H,W,1.3],[FL[0],y-H*.52,W,1.2],[x-.7,y-H,1.4,H*.48]])ctx.fillRect(a,b,c,e);seg(ctx,[FL[0]+1.6,y-H*.52],[x-.7,y-H+1.3],1.1,'#5b3f28');seg(ctx,[FR[0]-1.6,y-H*.52],[x+.7,y-H+1.3],1.1,'#5b3f28');}});
    poly(ctx,[FL,FR,FRt,FLt],null,INK,.85);
    const dxd=x+o.door*W;door(ctx,dxd,y,Math.min(7.6,H*.56));
    const low=o.upper?y-H*.3:y-H*.44;for(const p of[-.3,0,.3])if(Math.abs(p-o.door)>.2)frontWindow(ctx,x+p*W,low,o,R,out);
    if(o.upper)for(const p of[-.28,.28])frontWindow(ctx,x+p*W,y-H*.75,o,R,out,3.4,4);
    poly(ctx,[FLt,A,FRt],o.wall==='stone'?shade(wall,-.04):wall);
    clip(ctx,[FLt,A,FRt],()=>{if(o.wall==='stone')masonry(ctx,FL[0],FR[0],A[1],y-H,R,wall);if(o.wall==='timber'){seg(ctx,[x,y-H],A,1.2,'#5b3f28');seg(ctx,lerp(FLt,A,.5),lerp(FRt,A,.5),1.1,'#5b3f28');}});
    poly(ctx,[FLt,A,FRt],null,INK,.7);
    const gw=[x,y-H-rh*.36];if(o.wall!=='timber'){ctx.beginPath();ctx.arc(gw[0],gw[1],1.8,0,TAU);ctx.fillStyle='#cfc1a0';ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=.5;ctx.stroke();glazing(ctx,[[gw[0]-1.1,gw[1]-1.1],[gw[0]+1.1,gw[1]-1.1],[gw[0]+1.1,gw[1]+1.1],[gw[0]-1.1,gw[1]+1.1]],out);}
    else glazing(ctx,[[x+1.4,gw[1]-1.4],[x+4,gw[1]-.2],[x+4,gw[1]+2.2],[x+1.4,gw[1]+1.6]],out);
    const RP=[A,B,BRe,FRe],at=(uu,vv)=>lerp(lerp(A,B,uu),lerp(FRe,BRe,uu),vv);
    poly(ctx,RP,o.rc);
    clip(ctx,RP,()=>{
      const slope=Math.hypot(FRe[0]-A[0],FRe[1]-A[1]),rows=Math.round(slope/(o.roof==='thatch'?3:2.1)),cols=Math.round(len/2.3);
      if(o.roof==='thatch'){for(let i=0;i<=len*2.2;i++){const uu=i/(len*2.2)+(R()-.5)*.01;for(let s=0;s<3;s++){seg(ctx,at(uu,s/3+R()*.05),at(uu+(R()-.5)*.01,(s+1)/3),.4,R()<.5?'rgba(110,80,30,.55)':'rgba(240,215,150,.5)');}}for(let r=1;r<rows;r++){const v=r/rows;for(let c=0;c<cols;c++)seg(ctx,at(c/cols,v),at((c+1)/cols,v+.04),.5,'rgba(90,60,20,.35)');}}
      else for(let r=1;r<=rows;r++){const v=r/rows;for(let c=0;c<=cols;c++){const u0=(c+(r%2)*.5)/cols,u1=u0+1/cols,a=at(u0,v),b=at(u1,v),m=o.roof==='tile'?at((u0+u1)/2,v+.35/rows):at((u0+u1)/2,v);ctx.fillStyle=shade(o.rc,(R()-.5)*.14);ctx.beginPath();ctx.moveTo(...at(u0,v-1/rows));ctx.lineTo(...at(u1,v-1/rows));ctx.lineTo(...b);ctx.quadraticCurveTo(...m,...a);ctx.closePath();ctx.fill();ctx.strokeStyle=o.roof==='tile'?'rgba(70,24,14,.6)':'rgba(18,28,34,.55)';ctx.lineWidth=.4;ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(...m,...b);ctx.stroke();if(o.roof==='slate')seg(ctx,a,at(u0,v-1/rows),.3,'rgba(18,28,34,.4)');}}
      const g=ctx.createLinearGradient(A[0],A[1],FRe[0],FRe[1]);g.addColorStop(0,'rgba(255,245,215,.22)');g.addColorStop(1,'rgba(40,20,10,.2)');ctx.fillStyle=g;path(ctx,RP);ctx.fill();});
    poly(ctx,RP,null,INK,.85);
    if(o.roof==='thatch'){seg(ctx,A,B,2.4,shade(o.rc,-.28));for(let i=0;i<=8;i++){const p=lerp(A,B,i/8);seg(ctx,[p[0]-.8,p[1]+.3],[p[0]+.8,p[1]+1.4],.4,'rgba(40,25,10,.7)');}seg(ctx,FRe,BRe,1.4,shade(o.rc,-.2));}
    else{seg(ctx,A,B,1.2,shade(o.rc,-.35));for(let i=0;i<=6;i++){const p=lerp(A,B,i/6);ctx.fillStyle=shade(o.rc,-.2);ctx.beginPath();ctx.arc(p[0],p[1],.75,Math.PI,0);ctx.fill();}}
    for(const e of[FLe,FRe])seg(ctx,A,e,1.5,o.roof==='thatch'?shade(o.rc,-.3):'#4a3020');
    const P=at(.7,.32),cw=3.4,chH=7.5,brick=o.wall==='stone'?'#b9aa8c':'#a5553b';
    poly(ctx,[[P[0]+cw/2,P[1]-chH],[P[0]+cw/2+1.5,P[1]-chH-.9],[P[0]+cw/2+1.5,P[1]+.4],[P[0]+cw/2,P[1]+1.6]],shade(brick,-.25),INK,.45);
    poly(ctx,[[P[0]-cw/2,P[1]-chH],[P[0]+cw/2,P[1]-chH],[P[0]+cw/2,P[1]+1.6],[P[0]-cw/2,P[1]+1.6]],brick,INK,.55);
    for(let yy=P[1]-chH+1.3,r=0;yy<P[1]+1.4;yy+=1.3,r++){seg(ctx,[P[0]-cw/2,yy],[P[0]+cw/2,yy],.3,'rgba(40,20,10,.55)');seg(ctx,[P[0]-cw/2+(r%2?1.1:2.2),yy-1.3],[P[0]-cw/2+(r%2?1.1:2.2),yy],.3,'rgba(40,20,10,.5)');}
    poly(ctx,[[P[0]-cw/2-.6,P[1]-chH-1.1],[P[0]+cw/2+2,P[1]-chH-1.1],[P[0]+cw/2+2,P[1]-chH],[P[0]-cw/2-.6,P[1]-chH]],'#7c6d58',INK,.45);
    poly(ctx,[[P[0]-.8,P[1]-chH-2.4],[P[0]+.9,P[1]-chH-2.4],[P[0]+.7,P[1]-chH-1.1],[P[0]-.6,P[1]-chH-1.1]],'#b86a45',INK,.35);
    out.chimneys.push([P[0]+.05,P[1]-chH-2.6]);
    if(o.fence){const x0=x-W/2-3,x1=x+W/2+dx*.6;for(const yy of[y+4.2,y+5.8])seg(ctx,[x0,yy],[x1,yy],.45,'#6b4b2e');for(let px=x0;px<=x1;px+=1.5){if(Math.abs(px-dxd)<2.6)continue;poly(ctx,[[px-.35,y+6.8],[px-.35,y+3.4],[px,y+2.8],[px+.35,y+3.4],[px+.35,y+6.8]],'#efe3c4','#6b4b2e',.3);}for(const bx of[x0+2,x1-2]){ctx.fillStyle='#6f8f4a';ctx.beginPath();ctx.arc(bx,y+3,2.2,0,TAU);ctx.fill();ctx.strokeStyle='rgba(40,52,30,.8)';ctx.lineWidth=.4;ctx.stroke();}}
  }
  /* A context that draws nothing: used to learn where windows and chimneys are. */
  const NULL_CTX=typeof Proxy!=='undefined'?new Proxy({},{get:(t,k)=>k in t?t[k]:(k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):()=>{}),set:(t,k,v)=>{t[k]=v;return true;}}):null;
  function houseFeatures(o,seed=1){const out={windows:[],chimneys:[]};drawHouse(NULL_CTX,o,CW.rng(seed),out);return out;}

  /* ---------- trees, peaks and small things ---------- */
  const TREE={
    pine(ctx,x,y,s,R,snow){const h=15*s,b=5.6*s;shadowAt(ctx,x+4*s,y+1,6.5*s,2.3*s,.16);ctx.fillStyle=snow?'rgba(96,122,110,.9)':'rgba(84,116,82,.9)';ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x+b,y-2);ctx.lineTo(x-b,y-2);ctx.closePath();ctx.fill();
      ctx.fillStyle='rgba(40,60,40,.35)';ctx.beginPath();ctx.moveTo(x,y-h);ctx.lineTo(x+b,y-2);ctx.lineTo(x+b*.15,y-2);ctx.closePath();ctx.fill();
      ctx.strokeStyle='rgba(32,44,30,.95)';ctx.lineWidth=.75;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y+1);ctx.lineTo(x,y-h);for(let k=1;k<7;k++){const yy=y-h+k*h/7,wd=b*k/7;ctx.moveTo(x,yy-1);ctx.lineTo(x-wd,yy+1.4);ctx.moveTo(x,yy-1);ctx.lineTo(x+wd,yy+1.4);}ctx.stroke();
      if(snow){ctx.strokeStyle='#fbfaf4';ctx.lineWidth=.9;ctx.beginPath();for(let k=1;k<6;k++){const yy=y-h+k*h/7,wd=b*k/7;ctx.moveTo(x-wd*.8,yy+.9);ctx.lineTo(x-wd*.2,yy-.4);}ctx.stroke();}},
    oak(ctx,x,y,s,R){const r=6.2*s,bl=[[0,-r*1.05,r*.62]];for(let k=0;k<6;k++){const a=k/6*TAU+R()*.5;bl.push([Math.cos(a)*r*.5,-r*1.05+Math.sin(a)*r*.42,r*(.42+R()*.14)]);}
      shadowAt(ctx,x+3.5*s,y+.5,7*s,2.4*s,.16);ctx.beginPath();ctx.moveTo(x,y+.5);ctx.lineTo(x,y-r*.5);ctx.strokeStyle='rgba(60,44,28,.95)';ctx.lineWidth=1*s;ctx.stroke();
      // Ink every lobe, then fill over the inner half: only the cauliflower edge stays drawn.
      ctx.strokeStyle='rgba(40,52,30,.95)';ctx.lineWidth=1.4;for(const[dx,dy,rr]of bl){ctx.beginPath();ctx.arc(x+dx,y+dy,rr,0,TAU);ctx.stroke();}
      ctx.fillStyle='#8aa15e';for(const[dx,dy,rr]of bl){ctx.beginPath();ctx.arc(x+dx,y+dy,rr,0,TAU);ctx.fill();}
      ctx.fillStyle='rgba(58,84,42,.42)';for(const[dx,dy,rr]of bl){if(dx<-r*.1&&dy<-r*1.1)continue;ctx.beginPath();ctx.arc(x+dx+rr*.3,y+dy+rr*.3,rr*.72,0,TAU);ctx.fill();}
      ctx.fillStyle='rgba(214,226,160,.6)';ctx.beginPath();ctx.arc(x-r*.3,y-r*1.35,r*.24,0,TAU);ctx.fill();},
    jungle(ctx,x,y,s,R){const r=7*s,bl=[[-r*.45,-r*.9,r*.66],[r*.5,-r*.95,r*.64],[0,-r*1.35,r*.72],[-r*.1,-r*.75,r*.55]];shadowAt(ctx,x+3*s,y+1,8*s,2.6*s,.2);
      ctx.strokeStyle='rgba(26,46,28,.95)';ctx.lineWidth=1.4;for(const[dx,dy,rr]of bl){ctx.beginPath();ctx.arc(x+dx,y+dy,rr,0,TAU);ctx.stroke();}
      ctx.fillStyle='#5f9656';for(const[dx,dy,rr]of bl){ctx.beginPath();ctx.arc(x+dx,y+dy,rr,0,TAU);ctx.fill();}
      ctx.fillStyle='rgba(30,70,40,.45)';for(const[dx,dy,rr]of bl){ctx.beginPath();ctx.arc(x+dx+rr*.28,y+dy+rr*.3,rr*.7,0,TAU);ctx.fill();}
      ctx.strokeStyle='rgba(26,46,28,.55)';ctx.lineWidth=.4;ctx.beginPath();for(const[dx,dy,rr]of bl){ctx.moveTo(x+dx-rr*.4,y+dy+rr*.1);ctx.quadraticCurveTo(x+dx,y+dy-rr*.3,x+dx+rr*.4,y+dy+rr*.1);}ctx.stroke();
      ctx.fillStyle='rgba(200,228,150,.6)';for(let i=0;i<3;i++){ctx.beginPath();ctx.arc(x+(R()-.7)*r,y-r*(1.1+R()*.6),.7*s,0,TAU);ctx.fill();}},
    palm(ctx,x,y,s,R){const h=16*s,lean=(R()-.5)*6*s;shadowAt(ctx,x+4*s,y+1,6*s,2*s,.16);ctx.strokeStyle='rgba(96,70,40,.95)';ctx.lineWidth=1.3*s;ctx.beginPath();ctx.moveTo(x,y);ctx.quadraticCurveTo(x+lean*.2,y-h*.6,x+lean,y-h);ctx.stroke();
      ctx.strokeStyle='rgba(60,40,22,.6)';ctx.lineWidth=.35;ctx.beginPath();for(let k=1;k<7;k++){const t=k/7,px=x+lean*t*t,py=y-h*t;ctx.moveTo(px-.7*s,py);ctx.lineTo(px+.7*s,py-.5);}ctx.stroke();
      const tx=x+lean,ty=y-h;for(let k=0;k<7;k++){const a=-Math.PI/2+(k-3)*.55+(R()-.5)*.2,l=(7+R()*2)*s,ex=tx+Math.cos(a)*l,ey=ty+Math.sin(a)*l*.6+l*.35;ctx.fillStyle='rgba(84,134,70,.95)';ctx.beginPath();ctx.moveTo(tx,ty);ctx.quadraticCurveTo(tx+Math.cos(a)*l*.6,ty+Math.sin(a)*l*.6-2*s,ex,ey);ctx.quadraticCurveTo(tx+Math.cos(a)*l*.4,ty+Math.sin(a)*l*.4+.6*s,tx,ty);ctx.fill();ctx.strokeStyle='rgba(28,48,28,.85)';ctx.lineWidth=.45;ctx.stroke();}},
    dead(ctx,x,y,s,R){ctx.strokeStyle='rgba(78,66,52,.9)';ctx.lineCap='round';const br=(x0,y0,a,l,w,d)=>{const x1=x0+Math.cos(a)*l,y1=y0+Math.sin(a)*l;ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x0,y0);ctx.lineTo(x1,y1);ctx.stroke();if(d>0){br(x1,y1,a-.5-R()*.3,l*.66,w*.65,d-1);br(x1,y1,a+.45+R()*.3,l*.62,w*.65,d-1);}};shadowAt(ctx,x+3*s,y+.5,5*s,1.6*s,.14);br(x,y,-Math.PI/2+(R()-.5)*.3,6*s,1.2*s,3);
      ctx.fillStyle='rgba(120,140,90,.5)';for(let i=0;i<5;i++){ctx.beginPath();ctx.ellipse(x+(R()-.5)*9*s,y-9*s+R()*5*s,1.6*s,.8*s,0,0,TAU);ctx.fill();}},
    cactus(ctx,x,y,s){ctx.lineCap='round';shadowAt(ctx,x+2.5*s,y+.5,3.5*s,1.2*s,.16);ctx.strokeStyle='rgba(40,70,40,.95)';ctx.lineWidth=2.6*s;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-9*s);ctx.moveTo(x,y-4*s);ctx.lineTo(x-2.6*s,y-4*s);ctx.lineTo(x-2.6*s,y-7*s);ctx.moveTo(x,y-5.5*s);ctx.lineTo(x+2.4*s,y-5.5*s);ctx.lineTo(x+2.4*s,y-8*s);ctx.stroke();ctx.strokeStyle='rgba(126,170,100,.95)';ctx.lineWidth=1.5*s;ctx.stroke();},
    scrub(ctx,x,y,s,R){ctx.fillStyle='rgba(116,120,70,.85)';for(let i=0;i<4;i++){ctx.beginPath();ctx.arc(x+(R()-.5)*5*s,y-1.5*s-R()*2*s,1.6*s,0,TAU);ctx.fill();}ctx.strokeStyle='rgba(50,48,26,.7)';ctx.lineWidth=.4;ctx.stroke();},
    willow(ctx,x,y,s,R){const r=7*s;shadowAt(ctx,x+3*s,y+.5,7*s,2.2*s,.15);ctx.strokeStyle='rgba(80,60,40,.9)';ctx.lineWidth=1*s;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y-r*1.3);ctx.stroke();ctx.strokeStyle='rgba(110,140,80,.95)';ctx.lineWidth=.8;ctx.beginPath();for(let k=0;k<16;k++){const a=Math.PI+k/15*Math.PI,sx=x+Math.cos(a)*r,sy=y-r*1.3+Math.sin(a)*r*.6;ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx+Math.cos(a)*2,sy+3,sx+Math.cos(a)*1.4,sy+r*.9+R()*3);}ctx.stroke();},
  };
  /* A mountain is a ridge of one to three peaks: a profile, lit from the north-west,
     with engraved fall-lines down the shadowed faces and a ragged snow line. */
  const MPAL={rock:['#dcd3c2','rgba(74,62,52,.5)','#fbf9f2'],ice:['#eef6f8','rgba(70,122,152,.42)','#ffffff'],storm:['#c2bac2','rgba(46,38,62,.55)','#f5f3f8'],desert:['#e4c291','rgba(128,78,40,.48)',null]};
  function mountain(ctx,m,R){
    const{x,y,w,h,style}=m,pal=MPAL[style]||MPAL.rock,L=x-w/2,n=26;
    const peaks=m.peaks||(()=>{const main={t:.38+R()*.24,h:1,s:.5+R()*.12},out=[main],k=R();if(k<.8)out.push({t:main.t<.5?main.t+.22+R()*.14:main.t-.22-R()*.14,h:.5+R()*.28,s:.26+R()*.1});if(k<.35)out.push({t:R(),h:.35+R()*.2,s:.2});return out;})();
    const prof=[];for(let i=0;i<=n;i++){const t=i/n;let v=0;for(const p of peaks){const d=Math.abs(t-p.t)/p.s;if(d<1)v=Math.max(v,p.h*Math.pow(1-d,1.08));}const edge=Math.min(t,1-t)*6;v=Math.min(v,edge)*(1+(i%n?(R()-.5)*.08:0));prof.push([L+t*w,y-v*h]);}
    const sil=[[L,y],...prof,[L+w,y]];
    shadowAt(ctx,x+w*.18,y+1,w*.6,Math.max(2,h*.07),.2);
    poly(ctx,sil,pal[0]);
    ctx.save();path(ctx,sil);ctx.clip();
    // Snow above a ragged line, before the shade so shaded snow reads blue-grey.
    if(pal[2]&&h>30){const sl=y-h*(h>70?.5+R()*.08:.6+R()*.1);ctx.fillStyle=pal[2];ctx.beginPath();ctx.moveTo(L,sl-h);for(let i=0;i<=16;i++){const px=L+i/16*w;ctx.lineTo(px,sl+(i%2?h*.07:-h*.03)*(.6+R()*.8));}ctx.lineTo(L+w,sl-h);ctx.closePath();ctx.fill();}
    // Each peak's shadow face: from its summit down a crooked ridge to the right-hand valley.
    const faces=[];for(const p of peaks){const px=L+p.t*w,top=prof.reduce((b,q)=>Math.abs(q[0]-px)<Math.abs(b[0]-px)?q:b,prof[0]),ridge=[top];for(let i=1;i<=5;i++){const t=i/5;ridge.push([top[0]+w*.07*t+(R()-.5)*w*.035,top[1]+(y-top[1])*t]);}
      const right=prof.filter(q=>q[0]>top[0]&&q[0]<=L+Math.min(1,p.t+p.s)*w);faces.push({top,ridge,right});
      const face=[...ridge,[right.length?right[right.length-1][0]:top[0]+w*.2,y],...right.slice().reverse()];poly(ctx,face,pal[1]);}
    // Fall-lines: strokes from the skyline down the shadowed faces, converging on the ridge.
    ctx.strokeStyle='rgba(38,28,22,.5)';ctx.lineWidth=.42;ctx.beginPath();
    for(const f of faces)for(const q of f.right){const d=(q[0]-f.top[0]);for(let k=0;k<2;k++){const sx=q[0]-k*w/n*.5,sy=q[1]+k*1.2,len=(y-sy)*(.45+R()*.35);ctx.moveTo(sx,sy);ctx.quadraticCurveTo(sx-d*.12,sy+len*.5,sx-d*.28,sy+len);}}
    // A few on the lit side, near the foot.
    for(let i=0;i<Math.round(w/9);i++){const q=prof[Math.floor(R()*n)];if(!q)continue;const sy=q[1]+(y-q[1])*(.5+R()*.3);ctx.moveTo(q[0],sy);ctx.lineTo(q[0]-1.5,Math.min(y,sy+(y-sy)*.6));}
    ctx.stroke();ctx.restore();
    ctx.strokeStyle=INK;ctx.lineWidth=Math.min(1.35,.65+h/110);ctx.lineJoin='round';ctx.beginPath();prof.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();
    ctx.lineWidth=.5;ctx.beginPath();for(const f of faces)f.ridge.forEach(([px,py],i)=>i?ctx.lineTo(px,py):ctx.moveTo(px,py));ctx.stroke();
    ctx.strokeStyle='rgba(52,36,22,.45)';ctx.lineWidth=.4;ctx.beginPath();for(let i=0;i<Math.round(w/8);i++){const px=L+R()*w;ctx.moveTo(px,y+.8);ctx.lineTo(px+3,y+1.2);}ctx.stroke();
  }
  function hill(ctx,m,R){const{x,y,w,h,style}=m,col=style==='desert'?['#e0c28e','#b8925e']:style==='stone'?['#c9c4a2','#948e72']:['#b6c38e','#86976a'];
    ctx.fillStyle=col[0];ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.quadraticCurveTo(x,y-h*2,x+w/2,y);ctx.closePath();ctx.fill();
    ctx.save();ctx.clip();ctx.fillStyle=col[1];ctx.beginPath();ctx.moveTo(x+w*.05,y-h);ctx.quadraticCurveTo(x+w*.3,y-h*1.2,x+w/2,y);ctx.lineTo(x+w*.1,y);ctx.fill();ctx.strokeStyle='rgba(40,30,24,.4)';ctx.lineWidth=.4;ctx.beginPath();for(let i=0;i<6;i++){const px=x+w*(.06+i*.075);ctx.moveTo(px,y-h*(1-i*.14));ctx.lineTo(px+2,y);}ctx.stroke();ctx.restore();
    ctx.strokeStyle=INK;ctx.lineWidth=.75;ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.quadraticCurveTo(x,y-h*2,x+w/2,y);ctx.stroke();}
  function mesa(ctx,m,R){const{x,y,w,h}=m,t=w*.62,pts=[[x-w/2,y],[x-t/2,y-h],[x+t/2,y-h],[x+w/2,y]];shadowAt(ctx,x+w*.25,y+1,w*.6,2.4,.18);poly(ctx,pts,'#d7a878');poly(ctx,[[x+t*.1,y-h],[x+t/2,y-h],[x+w/2,y],[x+w*.12,y]],'#a8704a');
    clip(ctx,pts,()=>{ctx.strokeStyle='rgba(90,50,30,.5)';ctx.lineWidth=.45;ctx.beginPath();for(let k=1;k<5;k++){const yy=y-h+k*h/5;ctx.moveTo(x-w/2,yy+(R()-.5));ctx.lineTo(x+w/2,yy+(R()-.5));}ctx.stroke();});
    poly(ctx,[[x-t/2-1,y-h],[x+t/2+1,y-h],[x+t/2,y-h-2.4],[x-t/2,y-h-2.4]],'#e8c59a',INK,.5);poly(ctx,pts,null,INK,.8);}
  function dune(ctx,m){const{x,y,w,h}=m;ctx.fillStyle='rgba(236,208,150,.9)';ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.quadraticCurveTo(x-w*.1,y-h*1.6,x+w/2,y-h*.2);ctx.quadraticCurveTo(x+w*.1,y-h*.4,x-w/2,y);ctx.fill();
    ctx.fillStyle='rgba(190,146,90,.55)';ctx.beginPath();ctx.moveTo(x-w*.05,y-h*.78);ctx.quadraticCurveTo(x+w*.25,y-h*.6,x+w/2,y-h*.2);ctx.quadraticCurveTo(x+w*.1,y-h*.25,x-w*.05,y-h*.78);ctx.fill();
    ctx.strokeStyle='rgba(110,78,44,.8)';ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(x-w/2,y);ctx.quadraticCurveTo(x-w*.1,y-h*1.6,x+w/2,y-h*.2);ctx.stroke();}
  function rock(ctx,m,R){const{x,y,w}=m,pts=[[x-w/2,y],[x-w*.35,y-w*.45],[x+w*.05,y-w*.62],[x+w*.42,y-w*.3],[x+w/2,y]];shadowAt(ctx,x+w*.3,y+.5,w*.6,w*.16,.2);poly(ctx,pts,'#c3bba8');poly(ctx,[[x+w*.05,y-w*.62],[x+w*.42,y-w*.3],[x+w/2,y],[x+w*.1,y]],'#8f8778');poly(ctx,pts,null,INK,.55);}
  function stone(ctx,m){const{x,y,w}=m,h=w*2.2;shadowAt(ctx,x+w*.9,y+.6,w*1.2,w*.3,.22);poly(ctx,[[x-w/2,y],[x-w*.42,y-h],[x+w*.1,y-h*1.06],[x+w/2,y-h*.9],[x+w/2,y]],'#bfb7a4',INK,.55);poly(ctx,[[x+w*.1,y-h*1.06],[x+w/2,y-h*.9],[x+w/2,y],[x+w*.12,y]],'#8b8474');}
  function reeds(ctx,m,R){const{x,y,s}=m;ctx.strokeStyle='rgba(78,96,52,.9)';ctx.lineWidth=.5;ctx.beginPath();const tips=[];for(let i=0;i<5;i++){const bx=x+(i-2)*1.1*s,tx=bx+(R()-.5)*3*s,ty=y-(4+R()*4)*s;ctx.moveTo(bx,y);ctx.quadraticCurveTo(bx,y-2*s,tx,ty);if(i%2)tips.push([tx,ty]);}ctx.stroke();ctx.fillStyle='#6b4a2e';for(const[tx,ty]of tips){ctx.beginPath();ctx.ellipse(tx,ty+1,.55*s,1.3*s,0,0,TAU);ctx.fill();}}

  /* ---------- the painting ---------- */
  function* paint(ctx,world,opts){
    const{scale=1,makeCanvas}=opts,{W,H,G,GW,GH}=world,R=CW.rng(7),N=[CW.noise(11),CW.noise(29),CW.noise(53),CW.noise(71)];
    const stats={sprites:0};
    ctx.setTransform(scale,0,0,scale,0,0);
    // 1. Paper: warm stock, foxing and fibres.
    ctx.fillStyle='#efe3c4';ctx.fillRect(0,0,W,H);
    for(let i=0;i<240;i++){const x=R()*W,y=R()*H,r=40+R()*150,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${R()<.55?'170,128,66':'255,250,236'},.075)`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
    batch(ctx,'rgba(130,100,60,.07)',.5,line=>{for(let i=0;i<5200;i++){const x=R()*W,y=R()*H,a=R()*TAU;line(x,y,x+Math.cos(a)*6,y+Math.sin(a)*6);}});
    yield 'paper';
    // 2. Watercolour washes, at half resolution (watercolour is soft), with relief shading.
    const sw=Math.ceil(W/2),sh=Math.ceil(H/2),small=makeCanvas(sw,sh),sc=small.getContext('2d'),img=sc.createImageData(sw,sh),D=img.data;
    for(let j=0;j<sh;j++){for(let i=0;i<sw;i++){const x=i*2+1,y=j*2+1,k=(j*sw+i)*4,la=Math.max(0,Math.min(1,(world.landAt(x,y)+8)/34));if(la<=0)continue;
        const w=world.waterAt(x,y)+(N[2](x/9,y/9)-.5)*2.6,gran=N[2](x*.9,y*.9)-.5,low=N[0](x/70,y/70);let r,g,b,a;
        if(w>0){const depth=Math.min(1,w/26),edge=Math.max(0,1-w/3)*38;r=146-depth*72-edge;g=188-depth*60-edge;b=190-depth*28-edge*.6;a=.66+depth*.22;}
        else{const c=world.washAt(x,y),h0=world.heightAt(x-3,y-3),h1=world.heightAt(x+3,y+3),lit=Math.max(.64,Math.min(1.2,1-(h0-h1)*4.2)),hh=world.heightAt(x,y),kind=world.kindAt(x,y);
          r=c[0];g=c[1];b=c[2];
          if(w>-7&&kind!=='marsh'){const t=Math.max(0,(w+7)/7);r+=(228-r)*t;g+=(206-g)*t;b+=(156-b)*t;}
          if(hh>.62&&(kind==='alpine'||kind==='ice')){const t=Math.min(1,(hh-.62)*3.2);r+=(246-r)*t;g+=(246-g)*t;b+=(244-b)*t;}
          const tone=.92+low*.16;r*=lit*tone;g*=lit*tone;b*=lit*(tone*.96+.04);a=.6;}
        a=Math.max(0,Math.min(1,a*(1+gran*.7)))*la;D[k]=r;D[k+1]=g;D[k+2]=b;D[k+3]=a*255;}
      if(j%60===59)yield 'wash';}
    sc.putImageData(img,0,0);ctx.imageSmoothingEnabled=true;ctx.imageSmoothingQuality='high';ctx.drawImage(small,0,0,W,H);small.width=small.height=1;
    // Pigment granulation over everything, like cold-pressed paper.
    const tile=makeCanvas(96,96),tc=tile.getContext('2d'),TR=CW.rng(3);for(let i=0;i<900;i++){tc.fillStyle=`rgba(${TR()<.5?'90,70,40':'255,250,235'},${.05+TR()*.12})`;tc.fillRect(TR()*96,TR()*96,.6+TR()*1.4,.6+TR()*1.4);}
    ctx.save();ctx.fillStyle=ctx.createPattern(tile,'repeat');ctx.globalAlpha=.9;ctx.fillRect(0,0,W,H);ctx.restore();
    // Blooms: where the wet wash pooled and dried a little darker or lighter.
    for(let i=0;i<140;i++){const x=R()*W,y=R()*H;if(world.landAt(x,y)<10||world.waterAt(x,y)>0)continue;const r=50+R()*110,c=world.washAt(x,y),k=R()<.5?.84:1.1,g=ctx.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${c[0]*k|0},${c[1]*k|0},${c[2]*k|0},.1)`);g.addColorStop(.7,`rgba(${c[0]*k|0},${c[1]*k|0},${c[2]*k|0},.08)`);g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.beginPath();ctx.ellipse(x,y,r,r*(.5+R()*.4),R()*Math.PI,0,TAU);ctx.fill();}
    yield 'wash';
    const onLand=(x,y)=>world.landAt(x,y)>6&&world.waterAt(x,y)<-3;
    // 3. Patchwork fields around Ten City.
    {const cx=190,cy=1420,rot=-.32,cs=Math.cos(rot),sn=Math.sin(rot),vert=(i,j)=>{const u=i*30+(N[1](i*.7,j*.7)-.5)*14,v=j*22+(N[3](i*.7+3,j*.7)-.5)*10;return[cx+u*cs-v*sn,cy+u*sn+v*cs];};
      const cols=['rgba(222,198,118,.5)','rgba(168,188,104,.5)','rgba(196,160,108,.45)','rgba(206,202,138,.5)','rgba(150,176,98,.45)'];
      for(let j=-9;j<9;j++)for(let i=-7;i<7;i++){const q=[vert(i,j),vert(i+1,j),vert(i+1,j+1),vert(i,j+1)],m=[(q[0][0]+q[2][0])/2,(q[0][1]+q[2][1])/2];
        if(world.kindAt(m[0],m[1])!=='fields'||!q.every(([x,y])=>onLand(x,y)&&world.waterAt(x,y)<-10)||Math.hypot(m[0]-cx,m[1]-cy)<60)continue;
        const col=cols[Math.floor(R()*cols.length)];poly(ctx,q,col);
        clip(ctx,q,()=>{const a=R()<.5?rot:rot+Math.PI/2,ca=Math.cos(a),sa=Math.sin(a);ctx.strokeStyle='rgba(110,86,50,.28)';ctx.lineWidth=.45;ctx.beginPath();for(let t=-26;t<=26;t+=2.6){ctx.moveTo(m[0]-ca*30-sa*t,m[1]-sa*30+ca*t);ctx.lineTo(m[0]+ca*30-sa*t,m[1]+sa*30+ca*t);}ctx.stroke();});
        ctx.strokeStyle='rgba(70,90,48,.55)';ctx.lineWidth=.9;path(ctx,q);ctx.stroke();
        ctx.fillStyle='rgba(84,112,62,.85)';for(let e=0;e<4;e++){const a=q[e],b=q[(e+1)%4];for(let t=.15;t<1;t+=.3){if(R()<.5)continue;const p=lerp(a,b,t);ctx.beginPath();ctx.arc(p[0],p[1],1.3+R(),0,TAU);ctx.fill();}}}}
    yield 'fields';
    // 4. Contour lines over the land: a surveyor's topography, faint.
    for(let lv=.22,n=0;lv<1.1;lv+=.08,n++)batch(ctx,`rgba(120,86,52,${n%4===3?.3:.16})`,n%4===3?.6:.4,line=>contour(world.height,GW,GH,G,lv,(x,y)=>onLand(x,y),(a,b,c,d)=>line(a,b,c,d)));
    yield 'contours';
    // 5. Hachures on the slopes that are not mountains.
    for(const[dark,alpha]of[[0,.24],[1,.42]])batch(ctx,`rgba(70,52,32,${alpha})`,.5,line=>{for(let y=4;y<H;y+=5.5)for(let x=4;x<W;x+=5.5){const jx=x+(N[3](x*.3,y*.3)-.5)*4,jy=y+(N[1](x*.3,y*.3)-.5)*4;if(!onLand(jx,jy))continue;const kind=world.kindAt(jx,jy);if(kind==='desert'||kind==='marsh'||kind==='fields')continue;
      const h=world.heightAt(jx,jy);if(h>.56)continue;const gx=world.heightAt(jx+2,jy)-world.heightAt(jx-2,jy),gy=world.heightAt(jx,jy+2)-world.heightAt(jx,jy-2),m=Math.hypot(gx,gy);if(m<.01)continue;
      const shadeSide=(gx+gy)>0?1:0;if(shadeSide!==dark)continue;const len=Math.min(6.5,m*230),dx=-gx/m,dy=-gy/m;line(jx,jy,jx+dx*len,jy+dy*len);}});
    yield 'hachures';
    // 6. Water: engraved lines following every shore, then the shore in firm ink.
    for(const[lv,al,wd]of[[2.2,.55,.75],[4.8,.44,.65],[8,.34,.6],[12,.26,.55],[17,.18,.5],[23,.12,.45]])batch(ctx,`rgba(40,74,90,${al})`,wd,line=>contour(world.sdf,GW,GH,G,lv,null,line));
    const wob=(x,y)=>(N[3](x*.08,y*.08)-.5)*.9;
    batch(ctx,'rgba(52,36,22,.92)',1.2,line=>contour(world.sdf,GW,GH,G,0,(x,y)=>world.landAt(x,y)>-10,(a,b,c,d)=>line(a+wob(a,b),b-wob(a,b),c+wob(c,d),d-wob(c,d))));
    for(const r of world.RIVERS)for(let k=-1;k<=1;k++){if(r.w[1]<8&&k)continue;const pts=r.path,n=pts.length;batch(ctx,'rgba(40,70,86,.42)',.55,line=>{for(let i=2;i<n-3;i+=6+((k+2)%3)){if(R()<.3)continue;const[x,y]=pts[i],[x2,y2]=pts[i+2],a=Math.atan2(y2-y,x2-x)+Math.PI/2,o=k*(r.w[0]+(r.w[1]-r.w[0])*i/n)*.22;line(x+Math.cos(a)*o,y+Math.sin(a)*o,x2+Math.cos(a)*o,y2+Math.sin(a)*o);}});}
    // The glacier that feeds the great river, tumbling down from the ice fields.
    {const spine=CW.spline([[800,150],[764,206],[716,262],[670,306],[640,334]],4),n=spine.length,left=[],right=[];
      spine.forEach(([x,y],i)=>{const q=spine[Math.min(n-1,i+1)],p=spine[Math.max(0,i-1)],a=Math.atan2(q[1]-p[1],q[0]-p[0])+Math.PI/2,w=30-18*i/n+(N[1](x/20,y/20)-.5)*6;left.push([x+Math.cos(a)*w,y+Math.sin(a)*w]);right.push([x-Math.cos(a)*w,y-Math.sin(a)*w]);});
      const shape=[...left,...right.reverse()];poly(ctx,shape,'rgba(232,242,246,.96)');
      clip(ctx,shape,()=>{ctx.fillStyle='rgba(120,168,190,.28)';path(ctx,[...left.slice(0),...left.slice().reverse().map(([x,y])=>[x-10,y-4])]);ctx.fill();
        batch(ctx,'rgba(60,110,140,.6)',.5,line=>{for(let i=3;i<n-2;i+=2){const[x,y]=spine[i],q=spine[i+1],a=Math.atan2(q[1]-y,q[0]-x)+Math.PI/2,w=30-18*i/n;for(let k=-2;k<=2;k++){if(R()<.35)continue;const o=k*w*.32,cx=x+Math.cos(a)*o,cy=y+Math.sin(a)*o,l=2+R()*4;line(cx-Math.cos(a)*l,cy-Math.sin(a)*l+1.2,cx+Math.cos(a)*l,cy+Math.sin(a)*l+1.2);}}});
        ctx.fillStyle='rgba(120,110,96,.5)';for(let i=0;i<n;i+=1){const[x,y]=spine[i];for(let k=0;k<2;k++){ctx.beginPath();ctx.arc(x+(R()-.5)*8,y+(R()-.5)*8,.6+R()*.6,0,TAU);ctx.fill();}}});
      poly(ctx,shape,null,'rgba(52,70,84,.85)',.9);}
    yield 'water';
    // 7. The road between the realms: worn tracks with inked verges, bridges, fords and a ferry.
    const lm=world.landmarks[2],trailSegs=world.ROUTE.map((r,i)=>r.trail?i:-1).filter(i=>i>=0);
    const lowRoads=[...world.ROUTE_PATHS.filter((_,i)=>!trailSegs.includes(i)),...world.SPURS.map(s=>CW.spline(s,3))],trails=trailSegs.map(i=>world.ROUTE_PATHS[i]);
    // Distance to the nearest road, so nothing grows or stands on it.
    const distTo=paths=>{const m=new Uint8Array(GW*GH).fill(1);for(const p of paths)for(const[x,y]of p){const i=Math.round(x/G),j=Math.round(y/G);if(i>=0&&j>=0&&i<GW&&j<GH)m[j*GW+i]=0;}
      const d=new Float32Array(GW*GH);for(let k=0;k<d.length;k++)d[k]=m[k]?1e9:0;
      for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const k=y*GW+x;if(!d[k])continue;let v=d[k];if(x>0)v=Math.min(v,d[k-1]+1);if(y>0){v=Math.min(v,d[k-GW]+1);if(x>0)v=Math.min(v,d[k-GW-1]+1.414);if(x<GW-1)v=Math.min(v,d[k-GW+1]+1.414);}d[k]=v;}
      for(let y=GH-1;y>=0;y--)for(let x=GW-1;x>=0;x--){const k=y*GW+x;if(!d[k])continue;let v=d[k];if(x<GW-1)v=Math.min(v,d[k+1]+1);if(y<GH-1){v=Math.min(v,d[k+GW]+1);if(x<GW-1)v=Math.min(v,d[k+GW+1]+1.414);if(x>0)v=Math.min(v,d[k+GW-1]+1.414);}d[k]=v;}
      return(x,y)=>{const i=Math.min(GW-1,Math.max(0,Math.round(x/G))),j=Math.min(GH-1,Math.max(0,Math.round(y/G)));return d[j*GW+i]*G;};};
    const roadDist=distTo(lowRoads),trailDist=distTo(trails),nearRoad=(x,y,r=8)=>roadDist(x,y)<r||trailDist(x,y)<r*.7;
    const landRuns=pts=>{const runs=[];let cur=[];for(const p of pts){if(world.waterAt(p[0],p[1])>-1.2){if(cur.length>1)runs.push(cur);cur=[];}else cur.push(p);}if(cur.length>1)runs.push(cur);return runs;};
    const side=(pts,i,o)=>{const q=pts[Math.min(pts.length-1,i+1)],p=pts[Math.max(0,i-1)],an=Math.atan2(q[1]-p[1],q[0]-p[0])+Math.PI/2,w=o+(N[3](pts[i][0]*.09,pts[i][1]*.09)-.5)*.9;return[pts[i][0]+Math.cos(an)*w,pts[i][1]+Math.sin(an)*w];};
    for(const run of lowRoads.flatMap(landRuns)){ctx.strokeStyle='rgba(214,182,124,.96)';ctx.lineWidth=5.6;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();run.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();}
    for(const run of lowRoads.flatMap(landRuns)){for(const o of[-3.1,3.1])batch(ctx,'rgba(64,44,26,.88)',.72,line=>{for(let i=1;i<run.length;i++){if(N[1](run[i][0]*.05,run[i][1]*.05)<.16)continue;const a=side(run,i-1,o),b=side(run,i,o);line(a[0],a[1],b[0],b[1]);}});
      batch(ctx,'rgba(120,90,55,.4)',.45,line=>{for(let i=2;i<run.length-1;i+=3){const a=side(run,i,-1),b=side(run,i+1,-1),c=side(run,i,1.1),d=side(run,i+1,1.1);line(a[0],a[1],b[0],b[1]);if(i%2)line(c[0],c[1],d[0],d[1]);}});
      // Milestones on the verge.
      for(let i=20;i<run.length-10;i+=46){const[x,y]=side(run,i,5.2);poly(ctx,[[x-.9,y+.6],[x-.9,y-1.8],[x,y-2.6],[x+.9,y-1.8],[x+.9,y+.6]],'#cfc6b2',INK,.35);}}
    // Crossings, drawn from above so they read on the chart.
    for(const c of world.crossings){if(c.kind==='landmark')continue;const e=4,L=c.len;ctx.save();ctx.translate(c.a[0],c.a[1]);ctx.rotate(c.angle);
      if(c.kind==='stone'){ctx.fillStyle='rgba(20,40,50,.3)';ctx.fillRect(-e+2,5,L+2*e-4,3.2);ctx.fillStyle='#dccfae';ctx.fillRect(-e,-4.4,L+2*e,8.8);ctx.strokeStyle='rgba(52,36,22,.35)';ctx.lineWidth=.35;ctx.beginPath();for(let x=-e+2.5;x<L+e;x+=3.2){ctx.moveTo(x,-2.6);ctx.lineTo(x,2.6);}ctx.stroke();
        for(const y of[-5.4,3.6]){ctx.fillStyle='#c4b590';ctx.fillRect(-e,y,L+2*e,1.8);ctx.strokeStyle=INK;ctx.lineWidth=.45;ctx.strokeRect(-e,y,L+2*e,1.8);}
        for(const t of[.3,.7])for(const s2 of[-1,1]){const x=L*t;poly(ctx,[[x-2.4,s2*5.4],[x,s2*8.6],[x+2.4,s2*5.4]],'#bfb293',INK,.4);}
        ctx.strokeStyle=INK;ctx.lineWidth=.6;ctx.strokeRect(-e,-5.4,L+2*e,10.8);}
      else if(c.kind==='plank'){ctx.fillStyle='rgba(20,40,50,.28)';ctx.fillRect(-e+1,3.8,L+2*e-2,2.4);ctx.fillStyle='#b48a58';ctx.fillRect(-e,-3.2,L+2*e,6.4);ctx.strokeStyle='rgba(60,36,18,.55)';ctx.lineWidth=.35;ctx.beginPath();for(let x=-e+1.4;x<L+e;x+=1.6){ctx.moveTo(x,-3.2);ctx.lineTo(x,3.2);}ctx.stroke();
        ctx.strokeStyle=INK;ctx.lineWidth=.55;ctx.beginPath();ctx.moveTo(-e,-3.6);ctx.lineTo(L+e,-3.6);ctx.moveTo(-e,3.6);ctx.lineTo(L+e,3.6);ctx.stroke();ctx.fillStyle='#5b3f28';for(let x=-e;x<=L+e;x+=5){ctx.fillRect(x-.6,-4.2,1.2,1.2);ctx.fillRect(x-.6,3,1.2,1.2);}}
      else if(c.kind==='ford'){const n=Math.max(3,Math.round(L/3.6));for(let i=0;i<=n;i++){const x=L*i/n,y=(R()-.5)*1.6;ctx.fillStyle='#c3baa6';ctx.beginPath();ctx.ellipse(x,y,1.9,1.4,R(),0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=.4;ctx.stroke();ctx.strokeStyle='rgba(255,250,240,.85)';ctx.lineWidth=.45;ctx.beginPath();ctx.arc(x,y+2.4,1.8,.2,Math.PI-.2);ctx.stroke();}}
      else if(c.kind==='ferry'){for(const x0 of[-e,L-3]){ctx.fillStyle='#a9804f';ctx.fillRect(x0,-2.6,e+3,5.2);ctx.strokeStyle=INK;ctx.lineWidth=.45;ctx.strokeRect(x0,-2.6,e+3,5.2);ctx.fillStyle='#5b3f28';for(const y of[-2.8,2.2])ctx.fillRect(x0+(x0<0?0:e+2),y,1.2,1.2);}}
      ctx.restore();}
    yield 'roads';
    // 8. Everything that stands up, painted back to front.
    const sprites=[],nodes=world.NODES,CN=CW.noise(313),clear=(x,y,r)=>nodes.some((n,i)=>{if(i>=13)return false;const a=Math.atan2(y-n.y,x-n.x);return Math.hypot(x-n.x,(y-n.y)*1.15)<r*(.5+CN(Math.cos(a)*1.4+i*5,Math.sin(a)*1.4)*.85);})||lm.clear.some(([cx,cy,cr])=>Math.hypot(x-cx,y-cy)<cr)||world.VILLAGES.some(v=>Math.hypot(x-v.x-3,y-v.y+5)<19)||nearRoad(x,y);
    // Mount Twelve, the summit massif, stands over everything in the north.
    const top=nodes[13];sprites.push({y:top.y+160,draw:()=>mountain(ctx,{x:top.x,y:top.y+160,w:330,h:230,style:'storm',peaks:[{t:.5,h:1,s:.52},{t:.24,h:.62,s:.3},{t:.8,h:.7,s:.28},{t:.66,h:.48,s:.18}]},CW.rng(12))});
    // Peaks: random candidates, tallest first, each keeping its own ground.
    const peaks=[],cands=[];for(let i=0;i<5200;i++){const x=R()*W,y=R()*H;if(!onLand(x,y)||world.landAt(x,y)<20)continue;const h=world.heightAt(x,y),kind=world.kindAt(x,y);if(kind==='meadow'||kind==='fields'||kind==='marsh')continue;if(h>.46)cands.push({x,y,h,kind});}
    cands.sort((a,b)=>b.h-a.h);
    for(const c of cands){if(clear(c.x,c.y,66)||Math.abs(c.x-top.x)<165&&c.y<top.y+170)continue;const dry=c.kind==='badlands'||c.kind==='desert',size=Math.min(92,16+(c.h-.46)*150)*(.75+R()*.5),w=size*(dry?1.9+R()*.6:1.3+R()*.5),hh=size*(dry?.62:1);
      if(peaks.some(p=>Math.abs(p.x-c.x)<(p.w+w)*.3&&Math.abs(p.y-c.y)<(p.h+hh)*.22))continue;
      if([-.45,-.2,0,.2,.45].some(t=>roadDist(c.x+t*w,c.y-hh*.15)<10+Math.abs(t)*4||roadDist(c.x+t*w*.5,c.y-hh*.5)<8))continue;
      const m={x:c.x,y:c.y,w,h:hh,style:c.kind==='ice'?'ice':c.kind==='alpine'&&c.y<280?'storm':c.kind==='badlands'||c.kind==='desert'?'desert':'rock'};peaks.push(m);sprites.push({y:c.y,draw:()=>mountain(ctx,m,R)});}
    // Foothills and mesas, scattered rather than gridded.
    for(let i=0;i<4200;i++){const x=R()*W,y=R()*H;if(!onLand(x,y)||world.landAt(x,y)<20||clear(x,y,60))continue;const h=world.heightAt(x,y),kind=world.kindAt(x,y);
      if(h>.28&&h<=.5&&['hills','highland','stone','jungle','pine','badlands'].includes(kind)&&R()<.22&&roadDist(x,y)>18){if(peaks.some(p=>Math.abs(p.x-x)<p.w*.5&&Math.abs(p.y-y)<12))continue;const m={x,y,w:20+R()*16,h:5+(h-.28)*32,style:kind==='badlands'?'desert':kind==='stone'?'stone':'hills'};sprites.push({y,draw:()=>hill(ctx,m,R)});}
      else if((kind==='badlands'||kind==='desert')&&h>.2&&R()<.05){const m={x,y,w:22+R()*20,h:9+R()*10};if(peaks.some(p=>Math.abs(p.x-x)<(p.w+m.w)*.4&&Math.abs(p.y-y)<16))continue;peaks.push({x,y,w:m.w,h:m.h});sprites.push({y,draw:()=>mesa(ctx,m,R)});}}
    const density={pine:.8,jungle:.95,meadow:.1,fields:.03,highland:.1,stone:.06,hills:.42,badlands:.04,desert:.012,ice:.05,alpine:.05,marsh:.06};
    for(let y=4;y<H;y+=7)for(let x=4;x<W;x+=7){const jx=x+(N[2](x*.31,y*.31)-.5)*7,jy=y+(N[3](x*.31,y*.31)-.5)*7;if(!onLand(jx,jy)||world.landAt(jx,jy)<16)continue;const w=world.waterAt(jx,jy),kind=world.kindAt(jx,jy),h=world.heightAt(jx,jy);
      if(w>-6||h>.5||clear(jx,jy,58))continue;
      const clump=N[1](jx/55+9,jy/55+3);let d=density[kind]||0;if(kind==='meadow'||kind==='highland'||kind==='hills')d*=clump>.58?5:clump>.5?1.6:.4;else if(kind==='pine'||kind==='jungle')d*=clump>.35?1:.3;
      if(kind==='desert'&&w>-22)d=.22;
      if(R()>d)continue;const s=.72+R()*.45;let type='oak';
      if(kind==='pine'||kind==='hills'&&R()<.7)type='pine';else if(kind==='jungle')type=R()<.18?'palm':'jungle';else if(kind==='desert')type=w>-22?'palm':R()<.6?'cactus':'scrub';else if(kind==='badlands')type='scrub';else if(kind==='ice'||kind==='alpine')type='snowpine';else if(kind==='marsh')type=R()<.6?'willow':'dead';else if(kind==='stone'&&R()<.5)type='scrub';
      sprites.push({y:jy,draw:()=>type==='snowpine'?TREE.pine(ctx,jx,jy,s,R,true):TREE[type](ctx,jx,jy,s,R)});}
    for(let y=6;y<H;y+=15)for(let x=6;x<W;x+=15){const jx=x+(N[0](x*.4,y*.4)-.5)*12,jy=y+(N[2](x*.4,y*.4)-.5)*12;if(!onLand(jx,jy)||clear(jx,jy,58))continue;const kind=world.kindAt(jx,jy),h=world.heightAt(jx,jy);
      if(kind==='desert'&&h<.3&&R()<.55){const m={x:jx,y:jy,w:18+R()*20,h:5+R()*4};sprites.push({y:jy-3,draw:()=>dune(ctx,m)});}
      else if((kind==='stone'&&R()<.34)||(kind==='highland'||kind==='alpine')&&R()<.14){const m={x:jx,y:jy,w:3+R()*5};sprites.push({y:jy,draw:()=>rock(ctx,m,R)});}}
    // Standing stones hint at Stone Valley; a ring of them waits beside the realm.
    {const n=CW.node(4);for(let i=0;i<7;i++){const a=i/7*TAU,m={x:n.x+118+Math.cos(a)*22,y:n.y-40+Math.sin(a)*10,w:3.2};sprites.push({y:m.y,draw:()=>stone(ctx,m)});}}
    // Grass tufts across open country: three quick strokes each, all in one path.
    batch(ctx,'rgba(84,96,52,.55)',.45,line=>{for(let i=0;i<16000;i++){const x=R()*W,y=R()*H;if(!onLand(x,y)||world.landAt(x,y)<14||world.waterAt(x,y)>-8)continue;const kind=world.kindAt(x,y);if(!['meadow','highland','stone','fields','hills','badlands','desert','marsh'].includes(kind))continue;if((kind==='desert'||kind==='badlands')&&R()<.7)continue;if(clear(x,y,34))continue;const s=.8+R()*.5;line(x-1.6*s,y-2.2*s,x-.4*s,y);line(x,y-3*s,x,y);line(x+1.6*s,y-2.2*s,x+.4*s,y);}});
    // Reeds along the banks and through the fen.
    for(let i=0;i<9000;i++){const x=R()*W,y=R()*H,w=world.waterAt(x,y);if(w<-5||w>1.5||world.landAt(x,y)<10)continue;const kind=world.kindAt(x,y);if(kind!=='marsh'&&R()>.35||kind==='desert'||kind==='ice'||kind==='alpine')continue;if(clear(x,y,40))continue;const m={x,y,s:.8+R()*.4};sprites.push({y,draw:()=>reeds(ctx,m,R)});}
    // Double River's hamlet and the villages along the road.
    for(const o of world.VILLAGES)sprites.push({y:o.y,draw:()=>drawHouse(ctx,o,CW.rng(Math.round(o.x*3)),{windows:[],chimneys:[]})});
    for(const o of lm.houses)sprites.push({y:o.y,draw:()=>drawHouse(ctx,o,CW.rng(Math.round(o.x)),{windows:[],chimneys:[]})});
    sprites.sort((a,b)=>a.y-b.y);stats.sprites=sprites.length;
    for(let i=0;i<sprites.length;i++){sprites[i].draw();if(i%500===499)yield 'sprites';}
    // Mountain trails climb over the peaks: a pale track with a dashed inked line and cairns.
    for(const t of trails){ctx.strokeStyle='rgba(244,236,214,.9)';ctx.lineWidth=3;ctx.lineCap='round';ctx.lineJoin='round';ctx.beginPath();t.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.stroke();
      ctx.save();ctx.setLineDash([2.6,2.2]);ctx.strokeStyle='rgba(52,36,22,.85)';ctx.lineWidth=.9;ctx.stroke();ctx.restore();
      for(let i=18;i<t.length-8;i+=30){const[x,y]=t[i];for(let k=0;k<3;k++){ctx.fillStyle=k%2?'#bdb4a2':'#cfc6b2';ctx.beginPath();ctx.ellipse(x+4,y-1-k*1.5,1.6-k*.35,.9,0,0,TAU);ctx.fill();ctx.strokeStyle=INK;ctx.lineWidth=.3;ctx.stroke();}}}
    // 9. Lily pads on the fen pools.
    for(let i=0;i<1400;i++){const x=R()*W,y=1560+R()*(H-1560),w=world.waterAt(x,y);if(w<2||w>10)continue;ctx.fillStyle='rgba(104,140,74,.9)';ctx.beginPath();ctx.ellipse(x,y,2.2,1.3,0,.25,TAU-.25);ctx.lineTo(x,y);ctx.fill();ctx.strokeStyle='rgba(40,60,30,.7)';ctx.lineWidth=.35;ctx.stroke();if(R()<.12){ctx.fillStyle='#f4d6e0';ctx.beginPath();ctx.arc(x+.6,y-.5,.8,0,TAU);ctx.fill();}}
    yield 'done';
    return stats;
  }
  function renderAll(ctx,world,opts){const it=paint(ctx,world,opts);let r;do r=it.next();while(!r.done);return r.value;}

  /* The pencil sketch: the same drawing in warm graphite on bare paper. */
  function pencilize(src,dst){const s=src.data,d=dst.data;for(let i=0;i<s.length;i+=4){const L=(s[i]*.3+s[i+1]*.55+s[i+2]*.15)/255;let k=Math.max(0,Math.min(1,(.9-L)*1.35));k=Math.pow(k,1.15)*.82;d[i]=238+(78-238)*k;d[i+1]=229+(72-229)*k;d[i+2]=206+(66-206)*k;d[i+3]=255;}return dst;}

  /* Resolution buckets: fine enough for the screen, capped for phone memory. */
  function scaleFor(cssWidth,dpr){const want=Math.min(dpr||1,2)*cssWidth/864;return want<=1?1:want<=1.5?1.5:2;}

  const api={VERSION,paint,renderAll,pencilize,scaleFor,houseFeatures,drawHouse,contour,shade,NULL_CTX};
  root.ChartPaint=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
