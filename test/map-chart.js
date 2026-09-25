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
check('no mountain or mesa spreads across a realm landmark',r.value.peaks.length>40&&r.value.peaks.every(p=>Object.values(CW.SITES).every(q=>!(p.x+p.w/2>q.x-q.r*1.2&&p.x-p.w/2<q.x+q.r*1.2&&p.y>q.y-q.r*1.2&&p.y-p.h<q.y+q.r*.6))));
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
// Realm landmarks (0.31-0.34): one per realm, beside it, visible on a phone, growing with its stage.
const CR=require('../public/chart-realms'),only=(f,st)=>Object.fromEntries(CW.ORDER.map(g=>[g,g===f?st:0]));
check('every realm but Double River has its own landmark site',CR.families.length===12&&!CR.families.includes(2)&&CW.ORDER.filter(f=>f!==2).every(f=>CW.SITES[f]));
// The harbor's piers start at the shore beside the realm and reach out into the lake, so measure their middle.
check('landmarks stand beside their realm, not under its button',CR.families.every(f=>{const n=CW.node(f),q=CW.SITES[f],c=f===5?[q.x+40,q.y-20]:[q.x,q.y];return Math.hypot(n.x-c[0],n.y-c[1])>72;}));
check('the heart of every landmark sits within the part of the map a phone shows',CR.families.every(f=>CW.SITES[f].x-48>=100&&CW.SITES[f].x+48<=764));
check('landmarks keep clear of one another',CR.families.every(a=>CR.families.every(b=>a===b||Math.hypot(CW.SITES[a].x-CW.SITES[b].x,CW.SITES[a].y-CW.SITES[b].y)>CW.SITES[a].r+CW.SITES[b].r)));
check('landmarks on land, except the causeway and the piers, which stand in water',CR.families.every(f=>f===0||f===5||world.waterAt(CW.SITES[f].x,CW.SITES[f].y)<0));
const grows=CR.families.every(f=>{const L=[0,1,3,4].map(st=>CR.markup(only(f,st)).length);return L[0]<L[1]&&L[1]<L[2]&&L[2]<L[3];});
check('each landmark grows at every stage: ruins, foundation, restored, celebrated',grows);
check('only restored landmarks light up at night',CR.families.every(f=>{CR.markup(only(f,1));const dark=CR.glows.length;CR.markup(only(f,3));return dark===0&&CR.glows.length>0;}));
const grp=(f,st)=>CR.markup(only(f,st)).split('<g class="cl-realm cl-r'+f)[1].split('<g class="cl-realm')[0];
check('the temple lights nine lanterns and leaves the tenth hook empty',(grp(9,3).match(/fill="#e8553a"/g)||[]).length===9&&(grp(9,3).match(/v1\.8"/g)||[]).length===10);
check('the harbor moors five boats',(grp(5,3).match(/cl-moor/g)||[]).length===5);
check('the oasis grows ten palms and two more',(grp(12,3).match(/stroke="#7a5a34"/g)||[]).length===12);
check('Stone Valley stands four by four',(grp(4,3).match(/fill="#c9c1ae"/g)||[]).length===16);
check('the power station orb carries a ten',grp(10,3).includes('>10</text>'));
check('the sun engine turns once restored',grp(6,3).includes('cl-spin-slow')&&!grp(6,1).includes('cl-spin-slow'));
check('the storm clears when the refuge is celebrated',grp(7,0).includes('cl-bolt"')&&!grp(7,4).includes('cl-bolt"'));
check('night lights sit above the darkened map',CL.glowMarkup({2:3}).includes('cgLamp')&&/host\.after\(glow\)/.test(fs.readFileSync(path.join(__dirname,'..','public','map-chart.js'),'utf8')));
check('the marsh mist thins as Zero Marsh is restored',/dataset\.marsh/.test(fs.readFileSync(path.join(__dirname,'..','public','map-chart.js'),'utf8'))&&/data-marsh="0"/.test(fs.readFileSync(path.join(__dirname,'..','public','map-chart.css'),'utf8')));

// 0.35: learning shown in the chart's own hand.
const LORE=require('../public/chart-lore'),Z=require('../public/map-zoom');
const lore=(over={})=>({realms:CW.ORDER.map((f,i)=>({family:f,unlocked:i<3,trail:i===0?13:i===1?5:0,stars:i===0?3:1})),explorer:'Ava',allRestored:false,summitDone:false,...over});
const L0=LORE.markup(lore());
check('unexplored realms are blank parchment, marked uncharted',(L0.match(/Uncharted/g)||[]).length===10&&L0.includes('url(#clParch)'));
check('every Fact Trail has thirteen milestones along its road',LORE.MILESTONES.length===13&&LORE.MILESTONES.every(m=>m.length===13));
check('milestones stand on land beside the road, not in the river or lake',LORE.MILESTONES.flat().every(([x,y])=>world.waterAt(x,y)<0));
check('checked facts are inked milestones; the rest wait in pencil',(L0.match(/fill="#d6cbb0"/g)||[]).length===18&&(L0.match(/stroke-dasharray=".8 .6"/g)||[]).length===21);
check('three stars earn a gold-leaf compass star',(L0.match(/cl-gilt/g)||[]).length===1);
check('the cartouche waits unsigned until the summit is conquered',L0.includes('cl-cartouche pending')&&!L0.includes('cl-cart-name'));
const done=LORE.markup(lore({allRestored:true,summitDone:true,explorer:'Zoë <b>'}));
check('a finished map is signed with the explorer\u2019s name, safely',done.includes('Zoë &lt;b&gt;')&&!done.includes('<b>')&&done.includes('cl-seal'));
check('Mount Twelve wears gold-leaf rays once every realm is restored',LORE.markup(lore({allRestored:true})).includes('cl-summit')&&!L0.includes('cl-summit'));
check('the painted map keeps its own details; the chart draws its own',/if\(data\.chart\)/.test(fs.readFileSync(path.join(__dirname,'..','public','map-backdrop.js'),'utf8'))&&html.includes("chart&&stars===3?'gilded':''"));
check('zoom stays between 1\u00d7 and 2.6\u00d7',Z.clamp(.5)===1&&Z.clamp(9)===2.6&&Z.clamp(1.7)===1.7);
const kf=Z.keepFocal({x:.5,y:.25},{left:-200,top:-100,width:1000,height:2000},{x:300,y:400});
check('zooming keeps the point under the fingers in place',kf.dx===0&&kf.dy===0);
check('zooming out glides the map back to the middle',Z.recentre(500,200,2,1.5)===350&&Z.recentre(500,200,2,1)===200&&Z.recentre(500,200,1.5,2)===500);
check('back at normal size no sideways scroll is left behind',/trail\.scrollLeft=0/.test(fs.readFileSync(path.join(__dirname,'..','public','map-zoom.js'),'utf8')));
check('zoom is offered only on the hand-drawn map, with buttons for mouse and keyboard',html.includes('MapZoom.setEnabled(chart)')&&/MapZoom\.step\(1\)/.test(fs.readFileSync(path.join(__dirname,'..','public','journey-ui.js'),'utf8')));
check('every chart file is cached for offline play, including 0.35',['chart-lore.js','map-zoom.js'].every(f=>fs.readFileSync(path.join(__dirname,'..','public','sw.js'),'utf8').includes(`./${f}`)));
// 0.36: a lived-in land.
check('the land is settled: a town, villages, farms, inns, mills and workings',['town','village','farm','inn','mill','mine','quarry','orchard','fold','woodcamp','copse'].every(k=>CW.SETTLEMENTS.some(q=>q.kind===k)));
check('every settlement stands on dry land, clear of the realm buttons and landmarks',CW.SETTLEMENTS.every(q=>world.waterAt(q.x,q.y)<-4&&CW.NODES.every(n=>Math.hypot(n.x-q.x,n.y-q.y)>70)&&Object.values(CW.SITES).every(t=>Math.hypot(t.x-q.x,t.y-q.y)>t.r+14)));
check('every town, village, farm and working has a lane to the road',CW.SETTLEMENTS.filter(q=>!['fold','orchard','copse'].includes(q.kind)).every(q=>world.LANES.some(l=>l.id===q.id)||[...CW.routePaths().flat(),...CW.SPURS.flatMap(t=>CW.spline(t,3))].some(([x,y])=>Math.hypot(x-q.x,y-q.y)<16)));
check('lanes stay dry, or cross a brook on a footbridge (never the river)',world.LANES.every(l=>CW.spline(l.path,3).every(([x,y])=>world.waterAt(x,y)<(l.footbridge?4.5:-1.5))));
check('roads run off the edge of the map toward a wider world',CW.SPURS.some(t=>t[t.length-1][0]<=0)&&CW.EDGE_SIGNS.length>=4);
const LM=CL.markup(null,{},{});
check('the map is named: towns in capitals, water in italics, regions spread wide',['Ashford','Millbrook','Twelve Oaks','Mill Beck','THE MIDLANDS'].every(t=>LM.includes(t))&&/cl-lab town/.test(LM)&&/cl-lab water/.test(LM)&&/cl-lab region/.test(LM));
check('signposts point the way at the crossroads',(LM.match(/cl-signpost/g)||[]).length>=4);
check('every settlement lights its windows at night',(CL.glowMarkup({}).match(/<polygon/g)||[]).length>60);
// 0.37: water and wild.
check('Sounding Lake has islands of dry land',CW.ISLANDS.length>=2&&CW.ISLANDS.every(i=>world.waterAt(i.x,i.y)<0&&world.waterAt(i.x+i.rx+8,i.y)>0));
check('springs rise where the streams begin',CW.SPRINGS.every(p=>world.waterAt(p.x,p.y)>-4));
const W1=CL.markup(null,{},{}),W2=CL.markup(null,{},{calm:true});
check('Sevenfold Falls cascades in seven drops',W1.includes('Sevenfold Falls')&&(W1.match(/class="cl-fall"/g)||[]).length===10);
check('travellers and a boat move on the roads and lake, and rest in Calm mode',(W1.match(/<animateMotion/g)||[]).length>=5&&!W2.includes('<animateMotion'));
check('herds graze in the pastures, clear of the water',CW.HERDS.every(h=>world.waterAt(h.x,h.y)<-20));
// 0.38: the map as an object.
check('seasons follow the calendar',CP.seasonFor(new Date(2026,0,5))==='winter'&&CP.seasonFor(new Date(2026,3,5))==='spring'&&CP.seasonFor(new Date(2026,6,5))==='summer'&&CP.seasonFor(new Date(2026,9,5))==='autumn');
{const r=s=>{const out=[];for(const v of CP.paint(ctx,world,{scale:1,makeCanvas:fakeCanvas,season:s}))out.push(v);return out[out.length-1];};check('every season paints to the end',['spring','summer','autumn','winter'].every(s=>r(s)==='done'));}
const mapChartJs=fs.readFileSync(path.join(__dirname,'..','public','map-chart.js'),'utf8'),workerJs=fs.readFileSync(path.join(__dirname,'..','public','chart-worker.js'),'utf8');
check('each season has its own cached chart, painted on or off the main thread',/chart-cache\/v\$\{CP\.VERSION\}\/\$\{season\(\)\}/.test(mapChartJs)&&/season:season\(\)/.test(mapChartJs)&&/renderAll\(ctx,world,\{scale,season/.test(workerJs));
check('the chart has a neatline border, a scale bar in leagues and pencilled notes',W1.includes('cl-border')&&W1.includes('cl-scale')&&W1.includes('leagues')&&(W1.match(/class="cl-note"/g)||[]).length>=4);
check('Willowbrook stands on dry ground in its own clearing, clear of the realms',world.waterAt(CW.CAMP.x,CW.CAMP.y)<-10&&CW.SETTLEMENTS.some(q=>q.kind==='camp'&&q.x===CW.CAMP.x)&&CW.NODES.every(n=>Math.hypot(n.x-CW.CAMP.x,n.y-CW.CAMP.y)>70)&&W1.includes('cl-camp'));
check('tapping Willowbrook on the chart opens the camp',/camp-pin[\s\S]{0,400}visitCamp\(\)/.test(html));
check('the map key explains the symbols, from the chart only',/showMapKey\(\)/.test(fs.readFileSync(path.join(__dirname,'..','public','journey-ui.js'),'utf8'))&&/function showMapKey/.test(fs.readFileSync(path.join(__dirname,'..','public','journey-ui.js'),'utf8')));
check('paint version is a positive integer',Number.isInteger(CP.VERSION)&&CP.VERSION>0);
const sw=fs.readFileSync(path.join(__dirname,'..','public','sw.js'),'utf8'),core=sw.match(/const CORE = \[([\s\S]*?)\];/)[1];
check('every chart file is cached for offline play',['chart-world.js','chart-paint.js','chart-landmarks.js','chart-worker.js','map-chart.js','map-chart.css'].every(f=>core.includes(`./${f}`)));
check('app updates keep the painted chart cache',/k !== 'tq-chart'/.test(sw));
check('the hand-drawn map starts switched off, behind a Parents switch',/chartMap:\s*false/.test(html)&&html.includes("toggleSetting('chartMap')"));
console.log(`${checks} map chart checks passed (world built in ${built} ms)`);
