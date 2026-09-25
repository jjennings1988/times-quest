/* The hand-drawn chart's world: where the water, hills and landscapes are.
   Everything is laid out around the realms' existing map positions, so the
   route, nodes and saves never move. Pure data and fields: no DOM, no canvas,
   so it runs in a worker, on the main thread or in tests. */
(function(root){
  'use strict';
  const W=864,H=1821,G=3,GW=Math.ceil(W/G)+1,GH=Math.ceil(H/G)+1,TAU=Math.PI*2;
  // The same percentages as MAP_POSITIONS in index.html, in REALM_ORDER order, then the summit.
  const POSITIONS=[[31,91.5],[70,84.3],[28,77.2],[69,70.1],[34,63.1],[25,48.9],[74,41.8],[50,34.7],[22,29.8],[69,27.7],[34,21.0],[70,15.0],[38,9.3],[57,3.8]];
  const ORDER=[0,1,10,2,5,11,3,4,9,6,12,8,7];
  const NODES=POSITIONS.map(([x,y],i)=>({x:x/100*W,y:y/100*H,family:i<13?ORDER[i]:'summit'}));
  const node=f=>NODES[ORDER.indexOf(f)];

  function rng(seed){let t=seed>>>0;return()=>{t=(t+0x6D2B79F5)>>>0;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return((r^(r>>>14))>>>0)/4294967296;};}
  function noise(seed){const R=rng(seed),p=new Uint8Array(512),v=new Float32Array(256);for(let i=0;i<256;i++){p[i]=i;v[i]=R();}for(let i=255;i>0;i--){const j=Math.floor(R()*(i+1));const t=p[i];p[i]=p[j];p[j]=t;}for(let i=0;i<256;i++)p[i+256]=p[i];const s=t=>t*t*(3-2*t),at=(x,y)=>v[p[(p[x&255]+y)&511]];return(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),u=s(x-xi),w=s(y-yi),a=at(xi,yi),b=at(xi+1,yi),c=at(xi,yi+1),d=at(xi+1,yi+1);return a+(b-a)*u+(c-a)*w+(a-b-c+d)*u*w;};}
  const N=[noise(11),noise(29),noise(53),noise(71),noise(97)];

  /* Catmull-Rom through control points, sampled every `step` units. */
  function spline(pts,step=3){const out=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)],n=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));for(let s=0;s<n;s++){const u=s/n,k=(a,b,c,d)=>.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);out.push([k(p0[0],p1[0],p2[0],p3[0]),k(p0[1],p1[1],p2[1],p3[1])]);}}out.push(pts[pts.length-1].slice());return out;}

  /* ---- Water ---- */
  const RIVERS=[
    // The great river, from the glacier snout to the harbor lake.
    {id:'upper',pts:[[636,338],[590,368],[522,404],[478,452],[470,522],[532,600],[556,690],[524,790],[462,868],[442,960],[438,1040],[430,1086]],w:[6,15]},
    // Out of the lake to the fork above Double River.
    {id:'outflow',pts:[[540,1172],[576,1188],[600,1204]],w:[16,16]},
    // The two channels of Double River, around the island.
    {id:'west',pts:[[600,1204],[548,1224],[504,1256],[494,1318],[508,1388],[548,1436],[592,1452]],w:[13,13]},
    {id:'east',pts:[[600,1204],[656,1222],[704,1256],[718,1320],[702,1392],[650,1438],[592,1452]],w:[13,13]},
    // Joined again, winding south into the fen.
    {id:'lower',pts:[[592,1452],[530,1478],[462,1520],[418,1580],[384,1640],[344,1690],[300,1740],[262,1790],[240,1830]],w:[17,24]},
    {id:'delta-e',pts:[[384,1640],[440,1700],[470,1760],[500,1830]],w:[7,10]},
    {id:'delta-w',pts:[[344,1690],[250,1716],[160,1760],[110,1830]],w:[6,9]},
    // Streams.
    {id:'jungle-brook',pts:[[830,640],[780,660],[730,680],[670,686],[610,684],[556,690]],w:[3,6]},
    {id:'tower-beck',pts:[[120,780],[196,826],[300,850],[400,860],[462,868]],w:[3,6]},
    {id:'woods-brook',pts:[[800,1470],[740,1520],[690,1560],[620,1590],[520,1600],[418,1582]],w:[3,5]},
    {id:'desert-wash',pts:[[120,250],[210,280],[300,300],[390,330],[478,452]],w:[2,4]},
  ].map(r=>({...r,path:spline(r.pts,3)}));
  const LAKE={x:452,y:1134,rx:120,ry:64,name:'Sounding Lake'};

  /* ---- The road between realms ----
     One segment per step of the adventure, in REALM_ORDER, ending at Mount Twelve.
     Each crosses water only where a bridge, ford or ferry is drawn. */
  const ROUTE=[
    {name:'Fen Road',pts:[[268,1666],[330,1626],[390,1575],[437,1548],[500,1528],[560,1526],[605,1535]]},
    {name:'Woodland Way',pts:[[605,1535],[560,1508],[505,1490],[440,1466],[370,1440],[300,1420],[242,1406]]},
    {name:'Crossing Road',pts:[[242,1406],[270,1380],[300,1340],[340,1300],[400,1290],[470,1278],[530,1276],[596,1277]]},
    {name:'Lakeshore Path',pts:[[596,1277],[590,1240],[566,1236],[528,1216],[480,1228],[420,1232],[360,1215],[318,1178],[294,1149]],ferry:true},
    {name:'Harbor Road',pts:[[294,1149],[276,1090],[262,1030],[240,970],[216,890]]},
    {name:'Canopy Road',pts:[[216,890],[300,915],[380,930],[446,930],[520,880],[590,810],[639,761]]},
    {name:'Jungle Steps',pts:[[639,761],[595,740],[545,728],[495,700],[460,660],[432,632]]},
    {name:'Temple Way',pts:[[432,632],[360,612],[290,585],[235,560],[190,543]]},
    {name:'Gear Road',pts:[[190,543],[270,535],[360,522],[420,510],[471,504],[530,500],[596,504]]},
    {name:'Dune Road',pts:[[596,504],[580,460],[556,420],[540,393],[500,372],[440,368],[370,372],[294,382]]},
    {name:'Frost Road',pts:[[294,382],[330,340],[380,310],[450,292],[520,280],[605,273]]},
    {name:'High Pass',pts:[[605,273],[550,250],[490,225],[430,205],[375,185],[328,169]],trail:true},
    {name:'Summit Stair',pts:[[328,169],[372,158],[352,138],[402,128],[386,108],[440,98],[430,80],[492,69]],trail:true},
  ];
  const ROUTE_PATHS=ROUTE.map(r=>spline(r.pts,3));
  const routePaths=()=>ROUTE_PATHS.map(p=>p.map(q=>q.slice()));
  // Side roads: the east bank at Double River, past the cottage to the mill.
  const SPURS=[[[640,1272],[680,1282],[744,1286],[800,1262],[866,1250]],[[744,1286],[748,1322],[748,1350]]];
  // Villages and waystations along the road (Double River's hamlet lives with its landmark).
  const VILLAGES=[
    {x:400,y:1458,w:15,h:10,d:8,wall:'timber',roof:'thatch',rc:'#c29a52',door:.2,shutter:'#4f7f86'},
    {x:364,y:1452,w:14,h:9,d:8,wall:'plaster',roof:'tile',rc:'#b35e40',door:-.2,shutter:'#9c4a34',fence:true},
    {x:404,y:960,w:15,h:10,d:8,wall:'stone',roof:'slate',rc:'#56707a',door:0,shutter:'#9c4a34'},
    {x:372,y:966,w:14,h:10,d:8,wall:'timber',roof:'tile',rc:'#a9543a',door:.25,shutter:'#6d8a4a',fence:true},
    {x:318,y:612,w:14,h:10,d:8,wall:'stone',roof:'slate',rc:'#56707a',door:-.2,shutter:'#9c4a34'},
    {x:486,y:352,w:15,h:10,d:8,wall:'plaster',roof:'tile',rc:'#c07a4a',door:.2,shutter:'#2f8f8a'},
    {x:456,y:350,w:13,h:9,d:7,wall:'plaster',roof:'tile',rc:'#b86a45',door:-.2,shutter:'#2f8f8a'},
    {x:522,y:262,w:14,h:10,d:8,wall:'stone',roof:'slate',rc:'#4e6470',door:0,shutter:'#9c4a34'},
  ];
  const POOLS=(()=>{const R=rng(401),out=[];for(let i=0;i<46;i++){const x=40+R()*784,y=1620+R()*190,r=8+R()*26;if(Math.hypot(x-node(0).x,y-node(0).y)<70)continue;if(ROUTE_PATHS.some(p=>p.some(([px,py])=>Math.hypot(px-x,(py-y)*1.5)<r*1.5+12)))continue;out.push({x,y,r,s:R()*9});}return out;})();

  /* ---- Landscapes ----  Each realm sits in its own country. */
  const BIOMES={
    meadow:{wash:[180,196,128]},pine:{wash:[132,158,112]},fields:{wash:[196,190,122]},marsh:{wash:[160,166,116]},
    jungle:{wash:[120,164,100]},highland:{wash:[190,190,138]},stone:{wash:[188,184,150]},hills:{wash:[152,168,118]},
    badlands:{wash:[208,172,120]},desert:{wash:[230,198,136]},ice:{wash:[214,230,236]},alpine:{wash:[176,170,166]},
  };
  const ANCHORS=[
    ['marsh',300,1720,300],['marsh',640,1740,220],['pine',650,1560,210],['fields',190,1420,190],['meadow',80,1560,150],
    ['meadow',610,1300,190],['meadow',790,1260,140],['meadow',250,1170,170],['meadow',520,990,170],['highland',200,900,210],
    ['jungle',680,800,250],['jungle',800,980,170],['stone',430,650,170],['hills',180,580,190],['hills',60,700,140],
    ['badlands',640,510,180],['badlands',790,560,130],['desert',270,380,240],['desert',120,470,130],['ice',650,250,210],
    ['ice',790,330,150],['alpine',330,170,230],['alpine',500,80,210],['alpine',120,120,170],['highland',800,420,120],
  ];
  const BIOME_KEYS=Object.keys(BIOMES);
  function biomeWeights(x,y){
    const wx=x+(N[1](x/120,y/120)-.5)*110,wy=y+(N[3](x/120+4,y/120)-.5)*110,w=new Float32Array(BIOME_KEYS.length);let sum=0;
    for(const[k,ax,ay,r]of ANCHORS){const d=Math.hypot(wx-ax,wy-ay)/r,v=Math.exp(-d*d*2.2);w[BIOME_KEYS.indexOf(k)]+=v;sum+=v;}
    if(sum<1e-4){w[BIOME_KEYS.indexOf('meadow')]=1;sum=1;}for(let i=0;i<w.length;i++)w[i]/=sum;return w;
  }

  /* ---- Relief ---- ridges are lines of high ground; everything else is gentle noise. */
  const RIDGES=[
    {pts:[[80,120],[200,150],[330,120],[430,90],[500,40],[570,90],[660,140],[780,110]],h:1,w:95},
    {pts:[[560,40],[640,170],[720,220],[820,260]],h:.85,w:70},
    {pts:[[40,560],[110,520],[180,480],[260,470]],h:.55,w:70},
    {pts:[[80,690],[150,640],[220,640]],h:.4,w:60},
    {pts:[[560,470],[640,440],[720,470],[820,520]],h:.45,w:60},
    {pts:[[120,860],[180,820],[260,840]],h:.35,w:55},
    {pts:[[140,300],[200,270],[260,280]],h:.3,w:40},{pts:[[360,300],[420,320]],h:.28,w:35},
    {pts:[[700,660],[780,640],[840,700]],h:.35,w:60},
  ].map(r=>({...r,path:spline(r.pts,6)}));
  function ridgeHeight(x,y){let h=0;for(const r of RIDGES){let best=1e9;for(const[px,py]of r.path){const d=(px-x)**2+(py-y)**2;if(d<best)best=d;}h=Math.max(h,r.h*Math.exp(-best/(r.w*r.w)));}return h;}

  /* The land fades into blank parchment at the far left and right. */
  const landEdge=(y,side)=>side<0?30+N[4](y/90,1)*46:W-30-N[4](y/90,7)*46;

  /* ---- Signed distance fields on a coarse grid ---- */
  function chamfer(mask){ // distance (grid cells) from each cell to the nearest cell where mask is 0
    const d=new Float32Array(GW*GH),INF=1e9,a=1,b=1.4142;
    for(let i=0;i<d.length;i++)d[i]=mask[i]?INF:0;
    for(let y=0;y<GH;y++)for(let x=0;x<GW;x++){const k=y*GW+x;if(!d[k])continue;let v=d[k];if(x>0)v=Math.min(v,d[k-1]+a);if(y>0){v=Math.min(v,d[k-GW]+a);if(x>0)v=Math.min(v,d[k-GW-1]+b);if(x<GW-1)v=Math.min(v,d[k-GW+1]+b);}d[k]=v;}
    for(let y=GH-1;y>=0;y--)for(let x=GW-1;x>=0;x--){const k=y*GW+x;if(!d[k])continue;let v=d[k];if(x<GW-1)v=Math.min(v,d[k+1]+a);if(y<GH-1){v=Math.min(v,d[k+GW]+a);if(x<GW-1)v=Math.min(v,d[k+GW+1]+b);if(x>0)v=Math.min(v,d[k+GW-1]+b);}d[k]=v;}
    return d;
  }
  function build(){
    const water=new Uint8Array(GW*GH),wide=new Float32Array(GW*GH);
    const stamp=(x,y,r)=>{const x0=Math.max(0,Math.floor((x-r)/G)),x1=Math.min(GW-1,Math.ceil((x+r)/G)),y0=Math.max(0,Math.floor((y-r)/G)),y1=Math.min(GH-1,Math.ceil((y+r)/G));for(let j=y0;j<=y1;j++)for(let i=x0;i<=x1;i++){if((i*G-x)**2+(j*G-y)**2<=r*r){water[j*GW+i]=1;}}};
    for(const r of RIVERS){const n=r.path.length;r.path.forEach(([x,y],i)=>{const t=i/(n-1),wd=r.w[0]+(r.w[1]-r.w[0])*t+(N[2](x/40,y/40)-.5)*4;stamp(x,y,Math.max(2,wd/2));});}
    for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*G,y=j*G,a=Math.atan2(y-LAKE.y,x-LAKE.x),rr=1+(N[0](Math.cos(a)*2+5,Math.sin(a)*2+5)-.5)*.36+(N[2](Math.cos(a)*6+9,Math.sin(a)*6)-.5)*.14;if(((x-LAKE.x)/(LAKE.rx*rr))**2+((y-LAKE.y)/(LAKE.ry*rr))**2<=1)water[j*GW+i]=1;
      for(const p of POOLS){if(Math.abs(x-p.x)>p.r*1.6||Math.abs(y-p.y)>p.r*1.6)continue;const a2=Math.atan2(y-p.y,x-p.x),r2=p.r*(1+(N[1](Math.cos(a2)*1.5+p.s,Math.sin(a2)*1.5)-.5)*.6);if((x-p.x)**2+((y-p.y)*1.5)**2<=r2*r2)water[j*GW+i]=1;}}
    const inside=chamfer(water),outside=chamfer(water.map(v=>v?0:1));
    const sdf=new Float32Array(GW*GH);for(let k=0;k<sdf.length;k++)sdf[k]=water[k]?inside[k]*G:-outside[k]*G;
    // Relief, the land edge and landscape colours.
    const height=new Float32Array(GW*GH),land=new Float32Array(GW*GH),wash=new Float32Array(GW*GH*3),kind=new Uint8Array(GW*GH);
    const RG=6,rw=Math.ceil(W/RG)+2,rh=Math.ceil(H/RG)+2,ridge=new Float32Array(rw*rh);for(let j=0;j<rh;j++)for(let i=0;i<rw;i++)ridge[j*rw+i]=ridgeHeight(i*RG,j*RG);
    const ridgeAt=(x,y)=>{const fx=x/RG,fy=y/RG,i=Math.min(rw-2,Math.floor(fx)),j=Math.min(rh-2,Math.floor(fy)),u=fx-i,v=fy-j,k=j*rw+i;return ridge[k]*(1-u)*(1-v)+ridge[k+1]*u*(1-v)+ridge[k+rw]*(1-u)*v+ridge[k+rw+1]*u*v;};
    for(let j=0;j<GH;j++)for(let i=0;i<GW;i++){const x=i*G,y=j*G,k=j*GW+i;
      const base=N[0](x/160,y/160)*.18+N[1](x/60,y/60)*.07+N[2](x/22,y/22)*.03,valley=Math.max(0,1-Math.max(0,-sdf[k])/90)*.12;
      height[k]=ridgeAt(x,y)+base-valley;
      const l=Math.min(x-landEdge(y,-1),landEdge(y,1)-x);land[k]=l;
      const w=biomeWeights(x,y);let best=0;for(let b=1;b<w.length;b++)if(w[b]>w[best])best=b;kind[k]=best;
      for(let c=0;c<3;c++){let v=0;for(let b=0;b<w.length;b++)v+=w[b]*BIOMES[BIOME_KEYS[b]].wash[c];wash[k*3+c]=v;}}
    const sample=(F,x,y)=>{x=Math.max(0,Math.min(W-.01,x))/G;y=Math.max(0,Math.min(H-.01,y))/G;const i=Math.min(GW-2,Math.floor(x)),j=Math.min(GH-2,Math.floor(y)),u=x-i,v=y-j,k=j*GW+i;return F[k]*(1-u)*(1-v)+F[k+1]*u*(1-v)+F[k+GW]*(1-u)*v+F[k+GW+1]*u*v;};
    // Where the road meets water: a bridge, a ford, a ferry, or one of Double River's own bridges.
    const crossings=[];ROUTE_PATHS.forEach((path,seg)=>{let run=null;const n=path.length;
      const finish=r=>{const a=path[Math.max(0,r.start-2)],b=path[Math.min(n-1,r.end+2)],x=(a[0]+b[0])/2,y=(a[1]+b[1])/2;
        let river=null,best=1e9;for(const rv of RIVERS)for(const[px,py]of rv.path){const d=(px-x)**2+(py-y)**2;if(d<best){best=d;river=rv.id;}}
        const stream=/brook|beck|wash/.test(river);
        const kind=LANDMARKS[2].bridges.some(br=>Math.hypot(br.x-x,br.y-y)<28)?'landmark':ROUTE[seg].ferry?'ferry':stream?(river==='desert-wash'?'ford':'plank'):r.depth>5.5?'stone':'plank';
        crossings.push({seg,a,b,x,y,kind,river,depth:r.depth,angle:Math.atan2(b[1]-a[1],b[0]-a[0]),len:Math.hypot(b[0]-a[0],b[1]-a[1])});};
      path.forEach(([x,y],i)=>{const w=sample(sdf,x,y);if(w>.3){if(!run)run={start:i,end:i,depth:0};run.depth=Math.max(run.depth,w);run.end=i;}else if(run){finish(run);run=null;}});if(run)finish(run);});
    const kindAt=(x,y)=>BIOME_KEYS[kind[Math.min(GH-1,Math.max(0,Math.round(y/G)))*GW+Math.min(GW-1,Math.max(0,Math.round(x/G)))]];
    return {W,H,G,GW,GH,sdf,height,land,wash,kind,NODES,RIVERS,LAKE,POOLS,BIOME_KEYS,
      waterAt:(x,y)=>sample(sdf,x,y),heightAt:(x,y)=>sample(height,x,y),landAt:(x,y)=>sample(land,x,y),kindAt,
      washAt:(x,y)=>{x=Math.max(0,Math.min(W-.01,x))/G;y=Math.max(0,Math.min(H-.01,y))/G;const i=Math.min(GW-2,Math.floor(x)),j=Math.min(GH-2,Math.floor(y)),u=x-i,v=y-j,out=[0,0,0];for(let c=0;c<3;c++){const k=(j*GW+i)*3+c;out[c]=wash[k]*(1-u)*(1-v)+wash[k+3]*u*(1-v)+wash[k+GW*3]*(1-u)*v+wash[k+GW*3+3]*u*v;}return out;},
      landmarks:LANDMARKS,ROUTE,ROUTE_PATHS,SPURS,VILLAGES,crossings};
  }

  /* ---- Landmarks drawn into the chart (static parts) and over it (living parts) ---- */
  const LANDMARKS={
    2:{
      // The twin crossing: one bridge over each channel, with the road across the island.
      bridges:[{x:500,y:1276,len:62},{x:712,y:1284,len:62}],
      // The ferry that carries the Lakeshore Path off the island.
      ferry:{a:[568,1238],b:[526,1214]},
      houses:[
        {x:404,y:1262,w:20,h:12,d:10,wall:'timber',roof:'tile',rc:'#b35e40',door:-.2,shutter:'#4f7f86',fence:true},
        {x:444,y:1254,w:16,h:11,d:9,wall:'plaster',roof:'thatch',rc:'#c9a45a',door:.2,shutter:'#9c4a34'},
        {x:382,y:1330,w:17,h:11,d:9,wall:'stone',roof:'slate',rc:'#56707a',door:0,shutter:'#9c4a34'},
        {x:424,y:1338,w:19,h:12,d:10,wall:'timber',roof:'tile',rc:'#a9543a',door:.25,shutter:'#6d8a4a',fence:true},
        {x:752,y:1250,w:15,h:10,d:8,wall:'plaster',roof:'tile',rc:'#b35e40',door:-.25,shutter:'#4f7f86'},
      ],
      mill:{x:748,y:1352},boat:{x:497,y:1346},
      clear:[[416,1296,58],[752,1250,20],[748,1352,24]],
    },
  };

  const api={W,H,G,POSITIONS,ORDER,NODES,RIVERS,LAKE,POOLS,BIOMES,ANCHORS,LANDMARKS,ROUTE,SPURS,VILLAGES,routePaths,build,rng,noise,spline,node};
  root.ChartWorld=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
