/* The hand-drawn chart: its world fits the realms, it paints without errors,
   and its living layer and ink follow each realm's stage. */
const assert=require('node:assert/strict'),fs=require('fs'),path=require('path');
const CW=require('../public/chart-world'),CP=require('../public/chart-paint'),CL=require('../public/chart-landmarks');
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};

// The chart uses exactly the app's realm positions and order.
const html=fs.readFileSync(path.join(__dirname,'..','public','index.html'),'utf8');
const block=html.match(/const MAP_POSITIONS=\[([\s\S]*?)\];/)[1],pos=[...block.matchAll(/\{x:([\d.]+),y:([\d.]+)\}/g)].map(m=>[+m[1],+m[2]]);
check('chart positions match MAP_POSITIONS',JSON.stringify(pos)===JSON.stringify(CW.POSITIONS));
const order=html.match(/const REALM_ORDER\s*=\s*\[([^\]]*)\]/);check('chart order matches REALM_ORDER',!order||order[1].split(',').map(Number).join()===CW.ORDER.join());

const t0=Date.now(),world=CW.build();const built=Date.now()-t0;
check('every realm and the summit stand on dry land',CW.NODES.every(n=>world.waterAt(n.x,n.y)<-4));
check('the river reaches Sounding Lake',world.waterAt(CW.LAKE.x,CW.LAKE.y)>10);
const [west,east]=CW.LANDMARKS[2].bridges;
check('each bridge of the twin crossing spans water',world.waterAt(west.x,west.y+2)>0&&world.waterAt(east.x,east.y+2)>0);
check('Double River sits on an island between its two channels',world.waterAt(CW.node(2).x,CW.node(2).y)<0&&world.waterAt(west.x,CW.node(2).y)>0&&world.waterAt(east.x,CW.node(2).y)>0);
check('the fen at the bottom holds pools',CW.POOLS.length>20&&CW.POOLS.some(p=>world.waterAt(p.x,p.y)>0));
check('landscapes differ by realm',new Set(CW.ORDER.map(f=>world.kindAt(CW.node(f).x,CW.node(f).y))).size>=7);
check('the north is mountains and the far south is fen',world.kindAt(430,120)==='alpine'&&world.kindAt(300,1740)==='marsh');
check('the Double River hamlet is on land',CW.LANDMARKS[2].houses.every(h=>world.waterAt(h.x,h.y)<-2));

// The road: one segment per step of the adventure, crossing water only where something carries it.
const roads=CW.routePaths(),near=(p,n)=>Math.hypot(p[0]-n.x,p[1]-n.y)<1;
check('the road has one leg per realm step, ending at Mount Twelve',roads.length===13&&roads.every((r,i)=>near(r[0],CW.NODES[i])&&near(r[r.length-1],CW.NODES[i+1])));
const wetRuns=roads.map(r=>{let n=0,wet=false;for(const[x,y]of r){const w=world.waterAt(x,y)>.3;if(w&&!wet)n++;wet=w;}return n;});
check('every time the road meets water there is a bridge, ford or ferry',wetRuns.every((n,i)=>world.crossings.filter(c=>c.seg===i).length===n));
check('the great river is never forded',world.crossings.every(c=>c.kind!=='ford'||/wash|brook|beck/.test(c.river)));
check('the road to Double River crosses its own restored bridge',world.crossings.some(c=>c.seg===2&&c.kind==='landmark'));
check('the Lakeshore Path leaves the island by ferry',world.crossings.some(c=>c.seg===3&&c.kind==='ferry'));
const fy=CW.LANDMARKS[2].ferry;check('the ferry lands on dry ground at both ends',world.waterAt(...fy.a)<0&&world.waterAt(...fy.b)<0&&world.waterAt((fy.a[0]+fy.b[0])/2,(fy.a[1]+fy.b[1])/2)>0);
check('the road never runs through Sounding Lake',roads.every(r=>r.every(([x,y])=>((x-CW.LAKE.x)/CW.LAKE.rx)**2+((y-CW.LAKE.y)/CW.LAKE.ry)**2>1.15)));
check('villages along the road stand on dry land',CW.VILLAGES.every(v=>world.waterAt(v.x,v.y)<-6));
check('the route leaves the fen pools alone',CW.POOLS.every(p=>roads.every(r=>r.every(([x,y])=>Math.hypot(x-p.x,(y-p.y)*1.5)>p.r))));
check('the dotted route follows the drawn road on the hand-drawn map',/ChartWorld\.routePaths\(\)/.test(html));
check('the ferry works across the channel',CL.markup(null,{},{}).includes('cl-raft'));

// Painting runs start to finish against a context that records nothing.
const ctx=new Proxy({},{get:(t,k)=>k in t?t[k]:k==='createImageData'||k==='getImageData'?(w,h)=>({width:w,height:h,data:new Uint8ClampedArray(w*h*4)}):k==='createLinearGradient'||k==='createRadialGradient'?()=>({addColorStop(){}}):k==='createPattern'?()=>({}):()=>{},set:(t,k,v)=>{t[k]=v;return true;}});
const fakeCanvas=(w,h)=>({width:w,height:h,getContext:()=>ctx});
const steps=[];const it=CP.paint(ctx,world,{scale:1,makeCanvas:fakeCanvas});let r;do{r=it.next();if(!r.done)steps.push(r.value);}while(!r.done);
check('painting passes through every stage',['paper','wash','fields','contours','hachures','water','roads','sprites','done'].every(s=>steps.includes(s)));
check('the chart is full of drawn things',r.value.sprites>3000);
const src={data:new Uint8ClampedArray([20,120,200,255,250,250,250,255])},dst={data:new Uint8ClampedArray(8)};CP.pencilize(src,dst);
check('pencil turns colour into warm graphite on paper',dst.data[0]<dst.data[4]&&dst.data[4]>225&&dst.data[3]===255);
check('resolution buckets stay within phone memory',CP.scaleFor(500,3)===1.5&&CP.scaleFor(1044,2)===2&&CP.scaleFor(300,1)===1);
const house=CP.houseFeatures(CW.LANDMARKS[2].houses[0]);
check('a house knows where its windows and chimney are',house.windows.length>=3&&house.chimneys.length===1);

// Ink spreads with each stage; the living layer follows.
check('ink grows with every stage',CL.INK_RADIUS.every((v,i)=>!i||v>CL.INK_RADIUS[i-1]));
check('no ink before a realm is begun',CL.inkCircles({}).length===0);
check('restored realms ink wider than begun ones',CL.inkCircles({0:3,1:1}).find(c=>c.family===0).r>CL.inkCircles({0:3,1:1}).find(c=>c.family===1).r);
const at=s=>CL.markup(null,{2:s},{});
check('a ruined crossing shows ruins and no lamps',at(0).includes('cl-ruin')&&!at(0).includes('cl-lamps'));
check('foundations show timber centring but no parapet',at(1).includes('#8b5a32')&&!at(1).includes('cl-walkers'));
check('a restored crossing has stones, lamps, walkers, smoke and a turning mill',['cl-stone','cl-lamps','cl-walkers','cl-puff','cl-mill turning'].every(k=>at(3).includes(k)));
check('a celebrated crossing flies teal-and-gold banners',at(4).includes('cl-banner')&&at(4).includes('#2f8f8a')&&!at(3).includes('cl-banner'));
check('water flows only where ink has reached',!/cl-flow" d="M/.test(at(0))&&/cl-flow" d="M/.test(at(3)));
check('freshly restored stones animate in',CL.markup(null,{2:3},{fresh:{2:true}}).includes('cl-bridge fresh'));
const RS=require('../public/realm-scenes');
check('map stages match the realm scenes for every painted realm',[0,1,2,3,5,6,7,8,9,10,11,12].every(f=>[[0,0,0],[1,0,1],[1,1,2],[1,1,3],[0,0,1]].every(([t,c,st])=>RS.view(f,{trial:!!t,conquered:!!c,stars:st}).index===CL.stageFor({trial:!!t,conquered:!!c,stars:st}))));
check('Stone Valley, which has its own scene, still gets a stage',CL.stageFor({trial:true})===1&&CL.stageFor({conquered:true,stars:2})===3);
check('paint version is a positive integer',Number.isInteger(CP.VERSION)&&CP.VERSION>0);
const sw=fs.readFileSync(path.join(__dirname,'..','public','sw.js'),'utf8'),core=sw.match(/const CORE = \[([\s\S]*?)\];/)[1];
check('every chart file is cached for offline play',['chart-world.js','chart-paint.js','chart-landmarks.js','chart-worker.js','map-chart.js','map-chart.css'].every(f=>core.includes(`./${f}`)));
check('app updates keep the painted chart cache',/k !== 'tq-chart'/.test(sw));
check('the hand-drawn map starts switched off, behind a Parents switch',/chartMap:\s*false/.test(html)&&html.includes("toggleSetting('chartMap')"));
console.log(`${checks} map chart checks passed (world built in ${built} ms)`);
