/* The world around the adventure map.
   Day: "The Cartographer's Chart" — a parchment that keeps going past the map's edge.
   Dusk and night: "The Sky of Twelve" — thirteen constellations shaped like each realm's groups.
   Both, and the map itself, change as the child learns. Purely decorative (aria-hidden);
   every animation stops in Calm mode or with reduced motion. */
(function(root){
  'use strict';
  const NS='http://www.w3.org/2000/svg';
  const TAU=Math.PI*2;
  const CONSTELLATIONS={
    0:{title:'The Empty Basket',note:'zero in every group'},
    1:{title:'The Lone Lantern',note:'one group keeps its amount'},
    10:{title:'The Great Bundle',note:'ten rows, bundled in tens'},
    2:{title:'The Twins',note:'double it'},
    5:{title:'The Harbor',note:'half of ten groups'},
    11:{title:'The Twin Towers',note:'ten groups and one more'},
    3:{title:'The Vine Triangle',note:'a double and one more'},
    4:{title:'The Stone Square',note:'double, then double again'},
    9:{title:'The Lantern Rack',note:'ten groups, one taken away'},
    6:{title:'The Spare Cell',note:'five groups and one more'},
    12:{title:'The Dozen',note:'ten groups and two more'},
    8:{title:'The Crystal Stair',note:'double three times'},
    7:{title:'The Storm Shield',note:'five groups and two groups'}
  };
  /* Star layouts follow each strategy: ×7 is a group of five beside a group of two, ×9 is ten with one dimmed out. */
  function starLayout(f){
    const grid=(rows,cols,dx=0,dy=0,gap=16)=>{const out=[];for(let r=0;r<rows;r++)for(let c=0;c<cols;c++)out.push([dx+c*gap,dy+r*gap]);return out;};
    switch(f){
      case 0:return Array.from({length:7},(_,i)=>[Math.cos(i/7*TAU)*26,Math.sin(i/7*TAU)*20]);
      case 1:return [[0,0]];
      case 2:return [[-12,0],[12,0]];
      case 3:return [[0,-16],[-16,12],[16,12]];
      case 4:return grid(2,2,-8,-8);
      case 5:return grid(1,5,-32,0);
      case 6:return [...grid(1,5,-40,-6),[44,10]];
      case 7:return [...grid(1,5,-44,-8),[36,10],[52,10]];
      case 8:return grid(2,4,-24,-8);
      case 9:return grid(2,5,-32,-8);
      case 10:return grid(2,5,-32,-8);
      case 11:return [...grid(2,5,-40,-8),[52,0]];
      default:return [...grid(2,5,-44,-8),[50,-8],[50,8]];
    }
  }
  /* Lines join neighbours within a group only, so "five groups and two more" still looks like two groups. */
  function linksFor(f,pts){
    if(pts.length<2)return [];
    if(f===0)return pts.map((_,i)=>[i,(i+1)%pts.length]);
    if(f===3)return [[0,1],[1,2],[2,0]];
    const out=[];
    for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const dx=Math.abs(pts[i][0]-pts[j][0]),dy=Math.abs(pts[i][1]-pts[j][1]);if((dx<=24&&dy<1)||(dy<=17&&dx<1))out.push([i,j]);}
    return out;
  }
  function rng(seed){let t=seed>>>0;return ()=>{t=(t+0x6D2B79F5)>>>0;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return ((r^(r>>>14))>>>0)/4294967296;};}
  function valueNoise(seed){
    const R=rng(seed),size=256,perm=new Uint8Array(size*2),vals=new Float32Array(size);
    for(let i=0;i<size;i++){perm[i]=i;vals[i]=R();}
    for(let i=size-1;i>0;i--){const j=Math.floor(R()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]];}
    for(let i=0;i<size;i++)perm[i+size]=perm[i];
    const smooth=t=>t*t*(3-2*t),at=(x,y)=>vals[perm[(perm[x&255]+y)&511]];
    return (x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),xf=x-xi,yf=y-yi,u=smooth(xf),v=smooth(yf);
      const a=at(xi,yi),b=at(xi+1,yi),c=at(xi,yi+1),d=at(xi+1,yi+1);return a+(b-a)*u+(c-a)*v+(a-b-c+d)*u*v;};
  }
  const el=(tag,attrs={},parent)=>{const n=document.createElementNS(NS,tag);for(const[k,v]of Object.entries(attrs))n.setAttribute(k,v);if(parent)parent.appendChild(n);return n;};
  const html=(tag,cls,parent)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(parent)parent.appendChild(n);return n;};

  function skyNow(data){if(data.night)return 'night';const h=new Date().getHours();return h<6||h>=21?'night':h>=17?'dusk':'day';}

  /* ---------- Day: parchment, contours and ornaments ---------- */
  function paintParchment(canvas,w,h,sides,data){
    const dpr=Math.min(1.5,root.devicePixelRatio||1),ctx=canvas.getContext('2d');
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.scale(dpr,dpr);
    const R=rng(1213);ctx.fillStyle='#e8d5a9';ctx.fillRect(0,0,w,h);
    for(let i=0;i<260;i++){const x=R()*w,y=R()*h,r=20+R()*140,g=ctx.createRadialGradient(x,y,0,x,y,r),dark=R()<.55;g.addColorStop(0,dark?'rgba(150,110,60,.07)':'rgba(255,248,225,.10)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(x-r,y-r,r*2,r*2);}
    ctx.strokeStyle='rgba(120,90,50,.08)';ctx.lineWidth=.6;for(let i=0;i<1400;i++){const x=R()*w,y=R()*h,a=R()*TAU,l=3+R()*9;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);ctx.stroke();}
    // Topographic contours by marching squares on layered noise. Every fourth line is an index contour.
    const n1=valueNoise(77),n2=valueNoise(91),field=(x,y)=>n1(x/210,y/210)*.65+n2(x/80,y/80)*.35;
    const cell=11,cols=Math.ceil(w/cell)+1,rows=Math.ceil(h/cell)+1,vals=new Float32Array(cols*rows);
    for(let j=0;j<rows;j++)for(let i=0;i<cols;i++)vals[j*cols+i]=field(i*cell,j*cell);
    const inSide=x=>sides.some(s=>x>=s.x-cell&&x<=s.x+s.w+cell);
    const labels=[];
    for(let L=1;L<14;L++){
      const level=.22+L*.045,index=L%4===0;ctx.beginPath();
      for(let j=0;j<rows-1;j++)for(let i=0;i<cols-1;i++){
        const x=i*cell;if(!inSide(x))continue;
        const a=vals[j*cols+i],b=vals[j*cols+i+1],c=vals[(j+1)*cols+i+1],d=vals[(j+1)*cols+i];
        const code=(a>level?8:0)|(b>level?4:0)|(c>level?2:0)|(d>level?1:0);if(code===0||code===15)continue;
        const y=j*cell,lerp=(p,q)=>(level-p)/(q-p),T=[x+cell*lerp(a,b),y],Rt=[x+cell,y+cell*lerp(b,c)],B=[x+cell*lerp(d,c),y+cell],Lf=[x,y+cell*lerp(a,d)];
        const segs={1:[Lf,B],2:[B,Rt],3:[Lf,Rt],4:[T,Rt],5:[Lf,T,B,Rt],6:[T,B],7:[Lf,T],8:[Lf,T],9:[T,B],10:[T,Rt,Lf,B],11:[T,Rt],12:[Lf,Rt],13:[B,Rt],14:[Lf,B]}[code];
        for(let k=0;k<segs.length;k+=2){ctx.moveTo(segs[k][0],segs[k][1]);ctx.lineTo(segs[k+1][0],segs[k+1][1]);if(index&&R()<.004)labels.push({x:segs[k][0],y:segs[k][1],a:Math.atan2(segs[k+1][1]-segs[k][1],segs[k+1][0]-segs[k][0]),L});}
      }
      ctx.strokeStyle=index?'rgba(125,86,44,.42)':'rgba(140,100,55,.22)';ctx.lineWidth=index?1.15:.7;ctx.stroke();
    }
    ctx.fillStyle='rgba(110,74,36,.62)';ctx.font='italic 600 10px Georgia,serif';ctx.textAlign='center';
    for(const l of labels.slice(0,26)){ctx.save();ctx.translate(l.x,l.y);ctx.rotate(l.a>Math.PI/2||l.a<-Math.PI/2?l.a+Math.PI:l.a);ctx.fillStyle='#e8d5a9';ctx.fillRect(-12,-7,24,11);ctx.fillStyle='rgba(110,74,36,.7)';ctx.fillText('×'+l.L,0,2);ctx.restore();}
    // Graticule with realm "latitudes" along the outer margins.
    ctx.strokeStyle='rgba(120,86,48,.12)';ctx.lineWidth=.8;ctx.setLineDash([2,6]);
    for(const s of sides){for(let gx=s.x+s.w*.25;gx<s.x+s.w;gx+=s.w*.25){ctx.beginPath();ctx.moveTo(gx,0);ctx.lineTo(gx,h);ctx.stroke();}}
    for(let gy=0;gy<h;gy+=h/13){ctx.beginPath();for(const s of sides){ctx.moveTo(s.x,gy);ctx.lineTo(s.x+s.w,gy);}ctx.stroke();}
    ctx.setLineDash([]);ctx.fillStyle='rgba(104,70,36,.55)';ctx.font='600 10px Georgia,serif';
    for(let i=0;i<13;i++){const gy=i*h/13+14;if(sides[0])ctx.fillText('×'+i,sides[0].x+14,gy);if(sides[1])ctx.fillText('×'+i,sides[1].x+sides[1].w-14,gy);}
    // Burnt, curling outer edges and a soft shadow where the map sits on the chart.
    for(const s of sides){const outer=s.x<w/2?s.x:s.x+s.w,dir=s.x<w/2?1:-1,g=ctx.createLinearGradient(outer,0,outer+dir*70,0);g.addColorStop(0,'rgba(92,56,24,.55)');g.addColorStop(.35,'rgba(120,80,40,.18)');g.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g;ctx.fillRect(Math.min(outer,outer+dir*70),0,70,h);
      const inner=s.x<w/2?s.x+s.w:s.x,g2=ctx.createLinearGradient(inner,0,inner-dir*38,0);g2.addColorStop(0,'rgba(60,36,14,.38)');g2.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=g2;ctx.fillRect(Math.min(inner,inner-dir*38),0,38,h);}
    // Coffee ring and ink spatters: the chart has been used on real expeditions.
    const ring=(x,y,r)=>{ctx.strokeStyle='rgba(120,74,30,.16)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(x,y,r,.2,TAU-.4);ctx.stroke();ctx.lineWidth=1.2;ctx.strokeStyle='rgba(110,66,24,.22)';ctx.beginPath();ctx.arc(x+1,y+1,r+2,0,TAU-1);ctx.stroke();};
    if(sides[1])ring(sides[1].x+sides[1].w*.62,h*.83,Math.min(42,sides[1].w*.2));
    ctx.fillStyle='rgba(40,28,18,.35)';for(let i=0;i<14;i++){const s=sides[i%sides.length];ctx.beginPath();ctx.arc(s.x+s.w*(.2+R()*.6),h*(.1+R()*.8),.8+R()*2.2,0,TAU);ctx.fill();}
  }

  function compassRose(g,cx,cy,r,realms){
    const rose=el('g',{class:'mb-rose',transform:`translate(${cx} ${cy})`},g);
    el('circle',{r:r+10,class:'mb-ink-soft',fill:'none'},rose);el('circle',{r:r+4,class:'mb-ink',fill:'none'},rose);
    for(let i=0;i<72;i++){const a=i/72*TAU,l=i%6?4:8;el('line',{x1:Math.cos(a)*(r+4),y1:Math.sin(a)*(r+4),x2:Math.cos(a)*(r+4-l),y2:Math.sin(a)*(r+4-l),class:'mb-ink-thin'},rose);}
    // Thirteen rays, one per realm. A restored realm gilds its ray; a three-star realm adds a gem at its tip.
    realms.forEach((q,i)=>{
      const a=i/13*TAU-Math.PI/2,tip=[Math.cos(a)*r*.92,Math.sin(a)*r*.92],w=.1,left=[Math.cos(a-w)*r*.3,Math.sin(a-w)*r*.3],right=[Math.cos(a+w)*r*.3,Math.sin(a+w)*r*.3];
      el('path',{d:`M0 0 L${left} L${tip} L${right} Z`,class:q.restored?'mb-ray-gold':'mb-ray'},rose);
      el('path',{d:`M0 0 L${left} L${tip} Z`,class:q.restored?'mb-ray-gold-shade':'mb-ray-shade'},rose);
      const lx=Math.cos(a)*(r+22),ly=Math.sin(a)*(r+22);el('text',{x:lx,y:ly+3.5,'text-anchor':'middle',class:q.restored?'mb-rose-label gold':'mb-rose-label'},rose).textContent='×'+q.family;
      if(q.stars===3)el('circle',{cx:tip[0],cy:tip[1],r:3.2,class:'mb-gem'},rose);
    });
    el('circle',{r:r*.16,class:realms.every(q=>q.restored)?'mb-hub gold':'mb-hub'},rose);
    el('text',{y:r*.05+3,'text-anchor':'middle',class:'mb-hub-text'},rose).textContent='12';
    return rose;
  }
  function cartouche(g,x,y,w,data){
    const c=el('g',{class:'mb-cartouche',transform:`translate(${x} ${y})`},g),h=86;
    el('path',{d:`M10 0 H${w-10} Q${w} 0 ${w} 10 V${h-10} Q${w} ${h} ${w-10} ${h} H10 Q0 ${h} 0 ${h-10} V10 Q0 0 10 0 Z`,class:'mb-card'},c);
    el('path',{d:`M6 18 Q-8 43 6 68 M${w-6} 18 Q${w+8} 43 ${w-6} 68`,class:'mb-ink',fill:'none'},c);
    el('text',{x:w/2,y:30,'text-anchor':'middle',class:'mb-title'},c).textContent='Terra Multiplicata';
    el('text',{x:w/2,y:50,'text-anchor':'middle',class:'mb-subtitle'},c).textContent='The Climb to Mount Twelve';
    const done=data.realms.filter(q=>q.restored).length;
    el('text',{x:w/2,y:72,'text-anchor':'middle',class:'mb-hand'},c).textContent=done?`${done} of 13 realms restored by ${data.explorer||'our explorer'}`:'charted by a new explorer';
  }
  function scaleBar(g,x,y,w){
    const s=el('g',{transform:`translate(${x} ${y})`},g),seg=w/4;
    for(let i=0;i<4;i++)el('rect',{x:i*seg,y:0,width:seg,height:6,class:i%2?'mb-bar-light':'mb-bar-dark'},s);
    el('rect',{x:0,y:0,width:w,height:6,fill:'none',class:'mb-ink-thin'},s);
    for(let i=0;i<=4;i++)el('text',{x:i*seg,y:19,'text-anchor':'middle',class:'mb-small'},s).textContent=String(i*4);
    el('text',{x:w/2,y:33,'text-anchor':'middle',class:'mb-small italic'},s).textContent='leagues, counted in groups of four';
  }
  function guardianSketch(g,x,y,size,q){
    const s=el('g',{class:'mb-sketch'+(q.restored?' met':''),transform:`translate(${x} ${y})`},g);
    el('ellipse',{cx:0,cy:0,rx:size*.52,ry:size*.6,class:'mb-sketch-frame'},s);
    if(q.unlocked||q.restored){const img=el('image',{href:`art/realm/pet-${q.family}.png`,x:-size*.4,y:-size*.46,width:size*.8,height:size*.8,class:q.restored?'mb-sketch-img':'mb-sketch-img faint',preserveAspectRatio:'xMidYMid meet'},s);img.setAttribute('crossorigin','anonymous');}
    else el('text',{y:size*.08,'text-anchor':'middle',class:'mb-question'},s).textContent='?';
    el('text',{y:size*.6+14,'text-anchor':'middle',class:'mb-hand small'},s).textContent=q.restored?q.pet:q.unlocked?'not yet befriended':'uncharted';
    if(q.restored)el('circle',{cx:size*.36,cy:-size*.44,r:4,class:'mb-pin'},s);
    return s;
  }
  function marginNote(g,x,y,w,q){
    const n=el('g',{class:'mb-note'+(q.restored?' inked':''),transform:`translate(${x} ${y}) rotate(${(q.family%3-1)*2.2})`},g);
    el('text',{x:0,y:0,class:'mb-hand'},n).textContent=`×${q.family} · ${q.name}`;
    const t=el('text',{x:0,y:17,class:'mb-hand small'},n);t.textContent=q.restored?`${q.strategyNote}  ✓`:'…a strategy waits here';
    if(q.restored&&q.trail>0){const dots=el('g',{transform:'translate(0 28)'},n);for(let i=0;i<13;i++)el('circle',{cx:i*7,cy:0,r:2.2,class:i<q.trail?'mb-dot on':'mb-dot'},dots);}
    return n;
  }
  function waxSeal(g,x,y,done){const s=el('g',{class:'mb-seal'+(done?' earned':''),transform:`translate(${x} ${y})`},g);
    el('path',{d:'M0 -26 C14 -28 26 -14 25 0 C28 14 12 27 0 26 C-15 28 -27 12 -25 0 C-28 -15 -13 -27 0 -26 Z',class:'mb-seal-wax'},s);
    el('circle',{r:16,class:'mb-seal-ring'},s);el('text',{y:6,'text-anchor':'middle',class:'mb-seal-text'},s).textContent=done?'×12':'×';}
  function fractionsDoodle(g,x,y){const d=el('g',{class:'mb-doodle',transform:`translate(${x} ${y})`},g);
    el('path',{d:'M0 20 q15 -18 30 0 t30 0 t30 0',class:'mb-ink',fill:'none'},d);el('path',{d:'M62 8 q10 -14 22 -4 q-6 2 -8 8',class:'mb-ink',fill:'none'},d);el('circle',{cx:74,cy:2,r:1.6,class:'mb-ink-fill'},d);
    el('text',{x:0,y:44,class:'mb-hand small'},d).textContent='Here be fractions (a later journey)';}

  function buildDay(layer,geo,data){
    const {w,h,sides}=geo,canvas=html('canvas','mb-canvas',layer);paintParchment(canvas,w,h,sides,data);
    const svg=el('svg',{class:'mb-svg',viewBox:`0 0 ${w} ${h}`,width:w,height:h},layer),g=el('g',{},svg);
    const [L,Rs]=[sides[0],sides[1]],realms=data.realms,left=realms.filter((_,i)=>i%2===0),right=realms.filter((_,i)=>i%2===1);
    if(L&&L.w>=150){cartouche(g,L.x+L.w*.1,Math.max(84,h*.05),L.w*.8,data);compassRose(g,L.x+L.w/2,h*.34,Math.min(L.w*.3,92),realms);scaleBar(g,L.x+L.w*.16,h*.93,L.w*.68);}
    const sketchCol=(side,list,top,bottom)=>{if(!side||side.w<110)return;const size=Math.min(78,side.w*.34);list.forEach((q,i)=>{const t=top+(bottom-top)*(i+.5)/list.length;guardianSketch(g,side.x+side.w*(i%2?.7:.3),t,size,q);});};
    sketchCol(L,left,h*.52,h*.88);
    if(Rs&&Rs.w>=150){right.forEach((q,i)=>marginNote(g,Rs.x+Rs.w*.1,96+i*h*.066,Rs.w*.8,q));waxSeal(g,Rs.x+Rs.w*.8,h*.5,data.allRestored);fractionsDoodle(g,Rs.x+Rs.w*.14,h*.9);}
    sketchCol(Rs,right,h*.54,h*.86);
    // Dust drifting in a sunbeam.
    if(!data.calm)for(let i=0;i<14;i++){const s=sides[i%sides.length];if(!s)continue;const m=html('i','mb-mote',layer);m.style.left=(s.x+s.w*(.1+(i*37%80)/100))+'px';m.style.top=(10+(i*53%80))+'%';m.style.animationDelay=(-i*1.7)+'s';}
  }

  /* ---------- Dusk and night: the Sky of Twelve ---------- */
  function paintSky(canvas,w,h,sides,dusk){
    const dpr=Math.min(1.5,root.devicePixelRatio||1),ctx=canvas.getContext('2d');
    canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.scale(dpr,dpr);
    const g=ctx.createLinearGradient(0,0,0,h);if(dusk){g.addColorStop(0,'#1d2448');g.addColorStop(.55,'#3b3f6e');g.addColorStop(.82,'#8a5a78');g.addColorStop(1,'#e59a6c');}else{g.addColorStop(0,'#070b1f');g.addColorStop(.6,'#111a3d');g.addColorStop(1,'#1c2a55');}
    ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
    const R=rng(4242);
    // Nebula haze in violet and teal.
    for(let i=0;i<22;i++){const x=R()*w,y=R()*h*.8,r=80+R()*220,c=ctx.createRadialGradient(x,y,0,x,y,r),hue=R()<.5?'120,90,200':'60,160,170';c.addColorStop(0,`rgba(${hue},${dusk?.05:.09})`);c.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=c;ctx.fillRect(x-r,y-r,r*2,r*2);}
    // A Milky Way band across both sides of the map.
    const band=(x)=>h*.15+x/w*h*.55;
    for(let i=0;i<5200;i++){const x=R()*w,spread=(R()+R()+R()-1.5)*110,y=band(x)+spread,a=Math.max(0,.9-Math.abs(spread)/140)*(.25+R()*.75);ctx.fillStyle=`rgba(235,238,255,${a*(dusk?.35:.55)})`;const s=R()<.97?.6:1.2;ctx.fillRect(x,y,s,s);}
    for(let i=0;i<900;i++){const x=R()*w,y=R()*h*(dusk?.8:1),s=R()<.9?.8:1.6;ctx.fillStyle=`rgba(255,255,255,${.25+R()*.6})`;ctx.fillRect(x,y,s,s);}
    // Map edge: a soft dark fall-off so the map glows like a lantern-lit table.
    for(const s of sides){const inner=s.x<w/2?s.x+s.w:s.x,dir=s.x<w/2?1:-1,e=ctx.createLinearGradient(inner,0,inner-dir*60,0);e.addColorStop(0,'rgba(3,5,15,.55)');e.addColorStop(1,'rgba(0,0,0,0)');ctx.fillStyle=e;ctx.fillRect(Math.min(inner,inner-dir*60),0,60,h);}
  }
  function constellation(g,cx,cy,scale,q,index,calm){
    const c=el('g',{class:'mb-const'+(q.restored?' lit':'')+(q.stars===3?' gold':''),transform:`translate(${cx} ${cy}) scale(${scale})`},g);
    const pts=starLayout(q.family),links=q.restored?linksFor(q.family,pts):[];
    if(q.stars===3)el('circle',{r:48,class:'mb-const-halo'},c);
    links.forEach(([a,b],k)=>{const line=el('line',{x1:pts[a][0],y1:pts[a][1],x2:pts[b][0],y2:pts[b][1],class:'mb-const-line'},c);if(!calm)line.style.animationDelay=(index*.25+k*.08)+'s';});
    pts.forEach(([x,y],k)=>{const dim=q.family===9&&k===pts.length-1;el('circle',{cx:x,cy:y,r:q.restored?(dim?1.6:2.6):1.7,class:'mb-const-star'+(dim?' taken':'')},c);});
    if(q.family===9&&q.restored){const [x,y]=pts[pts.length-1];el('circle',{cx:x,cy:y,r:6,class:'mb-const-ring'},c);}
    const t=el('text',{y:42,'text-anchor':'middle',class:'mb-const-title'},c);t.textContent=CONSTELLATIONS[q.family].title;
    el('text',{y:56,'text-anchor':'middle',class:'mb-const-sub'},c).textContent=q.restored?`×${q.family} · ${q.pet}`:`×${q.family} · uncharted`;
    if(q.restored&&q.trail){const dots=el('g',{transform:'translate(-42 66)'},c);for(let i=0;i<13;i++)el('circle',{cx:i*7,cy:0,r:1.6,class:i<q.trail?'mb-dot-star on':'mb-dot-star'},dots);}
    return c;
  }
  function moon(g,x,y,r){const m=el('g',{class:'mb-moon',transform:`translate(${x} ${y})`},g);
    el('circle',{r:r*1.9,class:'mb-moon-glow'},m);el('circle',{r,class:'mb-moon-disc'},m);
    [[-.3,-.2,.18],[.25,.3,.14],[.1,-.45,.1],[-.1,.45,.08]].forEach(([a,b,c])=>el('circle',{cx:a*r,cy:b*r,r:c*r,class:'mb-crater'},m));
    el('circle',{cx:r*.45,cy:-r*.2,r:r*.96,class:'mb-moon-shadow'},m);}
  function horizon(g,w,h,sides){for(const s of sides){const base=h;let d=`M${s.x} ${base} L${s.x} ${base-70}`;const R=rng(Math.round(s.x)+7);for(let x=s.x;x<=s.x+s.w;x+=s.w/8)d+=` L${x} ${base-60-R()*90}`;d+=` L${s.x+s.w} ${base} Z`;el('path',{d,class:'mb-ridge far'},g);
    let d2=`M${s.x} ${base}`;for(let x=s.x;x<=s.x+s.w;x+=s.w/12)d2+=` L${x} ${base-25-R()*45}`;d2+=` L${s.x+s.w} ${base} Z`;el('path',{d:d2,class:'mb-ridge near'},g);
    for(let i=0;i<6;i++)el('rect',{x:s.x+s.w*(.15+R()*.7),y:base-18-R()*20,width:3,height:3,class:'mb-window'},g);}}

  function buildNight(layer,geo,data,dusk){
    const {w,h,sides,vh}=geo,canvas=html('canvas','mb-canvas',layer);paintSky(canvas,w,h,sides,dusk);
    // Twinkling stars in three phases (cheap: CSS opacity on small groups).
    const tw=el('svg',{class:'mb-svg mb-twinkles',viewBox:`0 0 ${w} ${h}`,width:w,height:h},layer),R=rng(99);
    for(let p=0;p<3;p++){const grp=el('g',{class:'mb-tw p'+p},tw);for(let i=0;i<28;i++){const s=sides[i%sides.length];if(!s)continue;const x=s.x+R()*s.w,y=R()*h,r=.9+R()*1.3;el('circle',{cx:x,cy:y,r,class:'mb-tw-star'},grp);if(R()<.25){el('line',{x1:x-r*3.2,y1:y,x2:x+r*3.2,y2:y,class:'mb-tw-spike'},grp);el('line',{x1:x,y1:y-r*3.2,x2:x,y2:y+r*3.2,class:'mb-tw-spike'},grp);}}}
    const svg=el('svg',{class:'mb-svg',viewBox:`0 0 ${w} ${h}`,width:w,height:h},layer),g=el('g',{},svg);
    const realms=data.realms,left=realms.filter((_,i)=>i%2===0),right=realms.filter((_,i)=>i%2===1);
    const placeCol=(side,list,top,bottom)=>{if(!side||side.w<96)return;const scale=Math.min(1.15,Math.max(.7,side.w/210));list.forEach((q,i)=>{const t=top+(bottom-top)*(i+.5)/list.length,x=side.x+side.w*(i%2?.64:.36);constellation(g,x,t,scale,q,realms.indexOf(q),data.calm);});};
    placeCol(sides[0],left,90,h*(dusk?.78:.96));placeCol(sides[1],right,150,h*(dusk?.78:.96));
    if(sides[1]&&sides[1].w>=120)moon(g,sides[1].x+sides[1].w*.72,112,Math.min(26,sides[1].w*.1));
    if(dusk)horizon(el('g',{},svg),w,h,sides);
    if(data.allRestored&&!dusk){const a=el('g',{class:'mb-aurora'},svg);for(const s of sides){for(let i=0;i<3;i++)el('path',{d:`M${s.x} ${h*(.25+i*.05)} C ${s.x+s.w*.3} ${h*(.15+i*.05)}, ${s.x+s.w*.7} ${h*(.35+i*.05)}, ${s.x+s.w} ${h*(.22+i*.05)}`,class:'mb-aurora-band b'+i},a);}}
    if(!data.calm){for(let i=0;i<2;i++){const s=sides[i%sides.length];if(!s)continue;const star=html('i','mb-shooting',layer);star.style.left=(s.x+s.w*.2)+'px';star.style.top=(8+i*22)+'%';star.style.animationDelay=(i*9+4)+'s';}}
  }

  /* ---------- On the map: fog, fact arcs, laurels, pennants, lantern light ---------- */
  function decorate(world,data){
    world.querySelector('.map-lore')?.remove();
    const W=864,H=1821,sky=skyNow(data),svg=el('svg',{class:'map-lore'+(sky==='day'?'':' '+sky),viewBox:`0 0 ${W} ${H}`,preserveAspectRatio:'none','aria-hidden':'true'});
    const defs=el('defs',{},svg);const blur=el('filter',{id:'loreBlur',x:'-50%',y:'-50%',width:'200%',height:'200%'},defs);el('feGaussianBlur',{stdDeviation:'9'},blur);
    const lg=el('radialGradient',{id:'loreLantern'},defs);el('stop',{offset:'0','stop-color':'#ffd98a','stop-opacity':'.75'},lg);el('stop',{offset:'1','stop-color':'#ffb347','stop-opacity':'0'},lg);
    const fog=el('g',{class:'lore-fog'},svg),below=el('g',{},svg);
    data.realms.forEach((q,i)=>{
      const p=data.positions[i];if(!p)return;const x=p.x/100*W,y=p.y/100*H;
      if(!q.unlocked){const f=el('g',{class:'lore-cloud',style:`animation-delay:${-i*2.3}s`},fog);[[-40,6,58,26],[18,-4,64,30],[-6,18,70,24],[44,16,40,18]].forEach(([dx,dy,rx,ry])=>el('ellipse',{cx:x+dx,cy:y+dy,rx,ry,class:'lore-cloud-puff',filter:'url(#loreBlur)'},f));return;}
      if(sky!=='day'&&q.restored)el('circle',{cx:x,cy:y,r:92,fill:'url(#loreLantern)',class:'lore-lantern'},below);
      if(q.stars===3){const s=el('g',{class:'lore-sparkle',transform:`translate(${x} ${y})`},below);for(let k=0;k<8;k++){const a=k/8*TAU,l=k%2?50:64;el('path',{d:`M0 0 L${Math.cos(a-.09)*18} ${Math.sin(a-.09)*18} L${Math.cos(a)*l} ${Math.sin(a)*l} L${Math.cos(a+.09)*18} ${Math.sin(a+.09)*18} Z`,class:'lore-ray'},s);}}
      if(q.restored){const lau=el('g',{class:'lore-laurel',transform:`translate(${x} ${y})`},below);for(const side of [-1,1])for(let k=0;k<7;k++){const a=Math.PI/2+side*(.55+k*.28),lx=Math.cos(a)*46,ly=Math.sin(a)*46;el('ellipse',{cx:lx,cy:ly,rx:7,ry:3.2,transform:`rotate(${a*180/Math.PI+side*55} ${lx} ${ly})`,class:'lore-leaf'},lau);}
        const pen=el('g',{class:'lore-pennant',transform:`translate(${x+38} ${y-44})`},below);el('line',{x1:0,y1:0,x2:0,y2:30,class:'lore-pole'},pen);el('path',{d:'M0 1 L22 7 L0 13 Z',fill:q.color,class:'lore-flag'},pen);}
      // Thirteen fact dots around the realm: each Fact Trail fact checked fills one with gold.
      const arc=el('g',{class:'lore-arc',transform:`translate(${x} ${y})`},below);for(let k=0;k<13;k++){const a=Math.PI*.18+k/12*Math.PI*.64,r=58;el('circle',{cx:Math.cos(a)*r*1.05,cy:Math.sin(a)*r*.7+8,r:3.1,class:k<q.trail?'lore-dot on':'lore-dot'},arc);}
    });
    const top=data.positions[13];
    if(top&&data.allRestored){const x=top.x/100*W,y=top.y/100*H,s=el('g',{class:'lore-summit',transform:`translate(${x} ${y})`},below);for(let k=0;k<16;k++){const a=k/16*TAU;el('line',{x1:Math.cos(a)*40,y1:Math.sin(a)*40,x2:Math.cos(a)*(k%2?80:110),y2:Math.sin(a)*(k%2?80:110),class:'lore-sunray'},s);}
      if(data.summitDone)for(let k=0;k<5;k++){const f=el('g',{class:'lore-firework',style:`animation-delay:${k*1.3}s`,transform:`translate(${x+(k-2)*55} ${y-90-(k%2)*40})`},svg);for(let j=0;j<10;j++){const a=j/10*TAU;el('line',{x1:0,y1:0,x2:Math.cos(a)*18,y2:Math.sin(a)*18,class:'lore-spark'},f);}}}
    const art=world.querySelector('.map-art');art?.after(svg);
    world.classList.toggle('map-dusk',sky==='dusk');world.classList.toggle('map-night',sky==='night');
  }

  /* ---------- Backdrop controller ---------- */
  let state=null;
  function geometry(screen,world){
    const vw=screen.clientWidth,vh=screen.clientHeight,mw=world.getBoundingClientRect().width,side=Math.max(0,(vw-mw)/2);
    const sides=side>=56?[{x:0,w:side},{x:vw-side,w:side}]:[];return {w:vw,h:Math.round(vh*1.35),vh,sides,side};
  }
  function render(screen,data){
    const world=screen.querySelector('.map-world');if(!world)return;
    decorate(world,data);
    let host=screen.querySelector('.map-backdrop');if(!host){host=html('div','map-backdrop');host.setAttribute('aria-hidden','true');screen.prepend(host);}
    const geo=geometry(screen,world),sky=skyNow(data),key=[sky,geo.w,geo.h,geo.side|0,data.calm,JSON.stringify(data.realms.map(q=>[q.unlocked,q.restored,q.stars,q.trail])),data.allRestored,data.summitDone,data.explorer].join('|');
    screen.classList.toggle('has-backdrop',geo.sides.length>0);
    if(state?.key===key&&host.childElementCount)return;
    const layer=html('div','mb-layer mb-'+sky+(data.calm?' calm':''));layer.style.height=geo.h+'px';
    if(geo.sides.length){if(sky==='day')buildDay(layer,geo,data);else buildNight(layer,geo,data,sky==='dusk');}
    // Crossfade from the previous sky.
    const old=[...host.children];host.appendChild(layer);requestAnimationFrame(()=>layer.classList.add('in'));old.forEach(o=>{o.classList.remove('in');setTimeout(()=>o.remove(),1300);});
    state={key,screen,host};parallax();
  }
  function parallax(){
    if(!state)return;const {screen,host}=state,layer=host.lastElementChild;if(!layer)return;
    const max=Math.max(1,screen.scrollHeight-screen.clientHeight),f=Math.min(1,Math.max(0,screen.scrollTop/max)),travel=layer.offsetHeight-screen.clientHeight;
    layer.style.transform=`translate3d(0,${-f*Math.max(0,travel)}px,0)`;
  }
  let raf=0;const onScroll=()=>{if(raf)return;raf=requestAnimationFrame(()=>{raf=0;parallax();});};
  function attach(screen,getData){
    screen.addEventListener('scroll',onScroll,{passive:true});
    let t=0;root.addEventListener('resize',()=>{clearTimeout(t);t=setTimeout(()=>{if(screen.classList.contains('active'))render(screen,getData());},220);});
    // The sky changes with the clock while the map is open.
    setInterval(()=>{if(screen.classList.contains('active')&&state&&!state.key.startsWith(skyNow(getData())+'|'))render(screen,getData());},60000);
  }
  const api={render,attach,decorate,skyNow,starLayout,linksFor,CONSTELLATIONS};
  root.MapBackdrop=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
