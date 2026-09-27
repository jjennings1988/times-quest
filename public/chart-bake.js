/* Bakes the chart's drawn landmarks into the painted paper, so bridges, towers,
   harbours and ships share the hand of the trees and rivers instead of sitting on
   top as crisp vectors. The living layer is rasterised once, then redrawn pixel by
   pixel as a draughtsman would: lines that wander a little, pigment that catches
   the paper's tooth, and mid-tones laid in with hatching. Anything that moves
   (smoke, flags, water, lights, travellers) stays live above the paper. */
(function(root){
  'use strict';
  // What stays live: motion, night lights, and a landmark still being revealed.
  const LIVE=['cl-flow','cl-walker','cl-banner','cl-pennant','cl-sails','cl-spin','cl-spin-r','cl-spin-slow','cl-puff','cl-raft','cl-boat','cl-bird','cl-fly','cl-gull','cl-flutter','cl-orb','cl-orbglow','cl-beam','cl-glint','cl-rune','cl-rise','cl-twinkle','cl-sparkle','cl-aurora','cl-bolt','cl-storm','cl-rain','cl-beams','cl-flame','cl-petal','cl-koi','cl-arcs','cl-burst','cl-fall','cl-spray','cl-fish','cl-splash','cl-geese','cl-glow','cl-win','cl-sky','cl-traveller','cl-wet','fresh'];
  const liveSel=LIVE.map(c=>'.'+c).join(',');

  /* CSS for the rasterised copy: the chart's own rules, minus everything live, frozen still. */
  function rasterCSS(css){return css+`\n*{animation:none!important;transition:none!important}\n${liveSel},text{display:none!important}`;}
  /* CSS for the live layer once the paper carries the drawing: show only what moves, and the lettering. */
  const LIVE_CSS=`.chart-live.baked .cl-world *{visibility:hidden}.chart-live.baked .cl-world :is(${liveSel},text),.chart-live.baked .cl-world :is(${liveSel},text) *{visibility:visible}`;

  function svgFor(markup,css,{W,H,top=0,scale=1}){
    return `<svg xmlns="http://www.w3.org/2000/svg" width="${Math.round(W*scale)}" height="${Math.round((H+top)*scale)}" viewBox="0 ${-top} ${W} ${H+top}" preserveAspectRatio="none"><style><![CDATA[${rasterCSS(css).replace(/\]\]>/g,'')}]]></style><g class="chart-root"><g class="cl-world">${markup}</g></g></svg>`;
  }
  function rasterize(svg,w,h,makeCanvas){return new Promise((resolve,reject)=>{
    const url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'})),img=new Image();
    img.onload=()=>{try{const c=makeCanvas(w,h),x=c.getContext('2d');x.drawImage(img,0,0,w,h);URL.revokeObjectURL(url);resolve(c);}catch(e){URL.revokeObjectURL(url);reject(e);}};
    img.onerror=()=>{URL.revokeObjectURL(url);reject(new Error('landmark raster failed'));};img.src=url;});}

  /* ---------- the draughtsman's hand, as a pixel pass ---------- */
  function rng(seed){let t=seed>>>0;return()=>{t=(t+0x6D2B79F5)>>>0;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296;};}
  const smooth=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
  /* src: the landmark raster; ink and pencil: the painted paper, changed in place.
     Works tile by tile over only the tiles the drawing touches; yields between rows of tiles. */
  function* hand(src,ink,pencil,w,h,scale,opts={}){
    const S=src.data,I=ink.data,P=pencil.data,R=rng(opts.seed||41),TS=32;
    // Wander: a coarse field of offsets, so a straight wall bends a little along its length.
    const cell=5*scale,amp=(opts.wander==null?.75:opts.wander)*scale,gw=Math.ceil(w/cell)+2,gh=Math.ceil(h/cell)+2,DX=new Float32Array(gw*gh),DY=new Float32Array(gw*gh);
    for(let i=0;i<DX.length;i++){DX[i]=(R()-.5)*2*amp;DY[i]=(R()-.5)*2*amp;}
    // Tooth: two tiles of paper grain, one soft and one fine.
    const T1=new Float32Array(128*128),T2=new Float32Array(64*64);for(let i=0;i<T1.length;i++)T1[i]=R();for(let i=0;i<T2.length;i++)T2[i]=R();
    const period=2.8*scale,hk=2*Math.PI/period;
    // Which tiles hold any drawing (with a margin for the wander).
    const tw=Math.ceil(w/TS),th=Math.ceil(h/TS),busy=new Uint8Array(tw*th);
    for(let y=0;y<h;y+=2){const row=y*w;for(let x=0;x<w;x+=2)if(S[(row+x)*4+3]>8){const tx=x/TS|0,ty=y/TS|0;for(let j=-1;j<=1;j++)for(let i=-1;i<=1;i++){const a=tx+i,b=ty+j;if(a>=0&&b>=0&&a<tw&&b<th)busy[b*tw+a]=1;}}}
    const PAPER=[238,229,206],INK=[58,42,28];
    for(let ty=0;ty<th;ty++){
      for(let tx=0;tx<tw;tx++){if(!busy[ty*tw+tx])continue;
        const x0=tx*TS,y0=ty*TS,x1=Math.min(w,x0+TS),y1=Math.min(h,y0+TS);
        for(let y=y0;y<y1;y++){const gy=y/cell,iy=gy|0,fy=gy-iy;
          for(let x=x0;x<x1;x++){const gx=x/cell,ix=gx|0,fx=gx-ix,k0=iy*gw+ix,k1=k0+gw;
            const dx=(DX[k0]*(1-fx)+DX[k0+1]*fx)*(1-fy)+(DX[k1]*(1-fx)+DX[k1+1]*fx)*fy,dy=(DY[k0]*(1-fx)+DY[k0+1]*fx)*(1-fy)+(DY[k1]*(1-fx)+DY[k1+1]*fx)*fy;
            const sx=Math.round(x+dx),sy=Math.round(y+dy);if(sx<0||sy<0||sx>=w||sy>=h)continue;
            const si=(sy*w+sx)*4,a0=S[si+3];if(a0<4)continue;
            const o=(y*w+x)*4,g=T1[((y>>1)&127)*128+((x>>1)&127)]*.6+T2[(y&63)*64+(x&63)]*.4;
            const r=S[si],gg=S[si+1],b=S[si+2],L=(r*.3+gg*.55+b*.15)/255,k=Math.max(0,Math.min(1,(.92-L)*1.25));
            // Hatching lays in the mid-tones; the darkest lines and the lightest washes are left whole.
            const hatch=.5+.5*Math.cos((x+y*.55)*hk),ha=.4*smooth(.2,.5,k)*(1-smooth(.74,.92,k))*(.55+.45*T1[((y>>4)&127)*128+((x>>4)&127)]),lift=ha*(1-hatch);
            const a=Math.min(1,a0/255*1.3)*(.84+.16*g)*(1-lift*.2);
            // Pencil: graphite tone, pressed harder where the grain is high.
            const kp=Math.min(.9,Math.pow(Math.max(0,k*(1-lift*.7))*(.9+.2*g),1.05)*.95),pr=238+(78-238)*kp,pg=229+(72-229)*kp,pb=206+(66-206)*kp;
            P[o]+=(pr-P[o])*a;P[o+1]+=(pg-P[o+1])*a;P[o+2]+=(pb-P[o+2])*a;
            // Ink: the same colours, a little quieter, soaked into the paper and hatched.
            // Mapped into the chart's own range: its darkest is sepia ink, its lightest is the paper.
            const l=(r+gg+b)/3;let cr=r+(l-r)*.14,cg=gg+(l-gg)*.14,cb=b+(l-b)*.14;
            cr=INK[0]+cr*(PAPER[0]+6-INK[0])/255;cg=INK[1]+cg*(PAPER[1]+8-INK[1])/255;cb=INK[2]+cb*(PAPER[2]+8-INK[2])/255;
            cr+=(PAPER[0]-cr)*lift*.55;cg+=(PAPER[1]-cg)*lift*.55;cb+=(PAPER[2]-cb)*lift*.55;
            cr=cr*.72+cr*I[o]/255*.28;cg=cg*.72+cg*I[o+1]/255*.28;cb=cb*.72+cb*I[o+2]/255*.28;
            I[o]+=(cr-I[o])*a;I[o+1]+=(cg-I[o+1])*a;I[o+2]+=(cb-I[o+2])*a;}}}
      yield ty/th;}
  }

  /* Draw the markup into the ink and pencil canvases (which must already hold the plain paper). */
  async function bake({ink,pencil,markup,css,W,H,top=0,scale,makeCanvas,slice=12,cancelled=()=>false}){
    const w=ink.width,h=ink.height,layer=await rasterize(svgFor(markup,css,{W,H,top,scale}),w,h,makeCanvas);
    const src=layer.getContext('2d').getImageData(0,0,w,h);layer.width=layer.height=1;
    const ic=ink.getContext('2d'),pc=pencil.getContext('2d'),id=ic.getImageData(0,0,w,h),pd=pc.getImageData(0,0,w,h);
    const it=hand(src,id,pd,w,h,scale);
    for(;;){const t=performance.now();let r;do r=it.next();while(!r.done&&performance.now()-t<slice);if(r.done)break;await new Promise(res=>setTimeout(res,0));if(cancelled())return false;}
    if(cancelled())return false;
    ic.putImageData(id,0,0);pc.putImageData(pd,0,0);return true;
  }

  // Bumped whenever the hand changes, so sheets baked by an older hand are redrawn.
  const VERSION=1;
  const api={VERSION,LIVE,LIVE_CSS,rasterCSS,svgFor,rasterize,hand,bake};
  root.ChartBake=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
