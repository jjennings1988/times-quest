/* 0.44 "Roads with a shape": roads drawn as curves that follow the land, a road hierarchy,
   buildings that face their streets, a village green, and saves that stay valid. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const K=C.content,root=path.join(__dirname,'../public'),read=f=>fs.readFileSync(path.join(root,f),'utf8');

// Curves, not corners.
const turn=r=>{let worst=0;for(let i=2;i<r.pts.length;i++){const a=Math.atan2(r.pts[i-1][1]-r.pts[i-2][1],r.pts[i-1][0]-r.pts[i-2][0]),b=Math.atan2(r.pts[i][1]-r.pts[i-1][1],r.pts[i][0]-r.pts[i-1][0]);let d=Math.abs(b-a);if(d>Math.PI)d=2*Math.PI-d;worst=Math.max(worst,d);}return worst*180/Math.PI;};
const main=K.roadLines.filter(r=>!r.id.startsWith('door-'));
check('every road is a smooth curve: no step turns more than 20°',main.every(r=>turn(r)<20));
check('a road hierarchy: a 3-wide high street, 2-wide lanes and trails, narrow footpaths',main.some(r=>r.kind==='high'&&r.w===3)&&main.filter(r=>r.kind==='lane').every(r=>r.w===2)&&main.some(r=>r.kind==='path'&&r.w<2)&&main.some(r=>r.id==='grove'&&r.kind==='trail'));
check('the high street runs from Willow Bridge to the green',(()=>{const h=main.find(r=>r.kind==='high');return h.pts[0][0]<21&&h.pts[h.pts.length-1][0]>43;})());
check('the road to the Guardian Grove winds instead of stepping, and enters by the gate',(()=>{const g=main.find(r=>r.id==='grove'),end=g.pts[g.pts.length-1];return turn(g)<20&&end[0]>=70&&end[0]<74&&end[1]<4;})());

// Walking: everything still connects.
{const s=C.syncProgress(C.fresh(),0);
  check('every destination is reachable from camp',K.locations.every(l=>C.route(s,s.explorer,{x:l.x,y:l.y})));
  check('every building faces a road: its door is a road cell',K.town.every(b=>K.roadAt(b.entrance.x,b.entrance.y)));
  check('the hall and houses turn to face their streets',K.town.find(b=>b.id==='hall').face==='n'&&['rosehouse','bluehouse'].every(id=>K.town.find(b=>b.id===id).face==='n'));
  check('roads never pave a build plot or a building',K.roads.every(p=>!K.zones.some(z=>K.inZone(z,p.x,p.y))&&!K.town.some(z=>K.inZone(z,p.x,p.y))));}

// Trees step aside for roads without breaking saves.
{const roadside=C.world.forest.filter(t=>t.roadside);
  check('trees along the roads step aside',roadside.length>0&&roadside.every(t=>!C.world.treePresent(C.fresh(),t)));
  check('a save that cleared one of those trees before 0.44 is still valid',(()=>{const s=C.fresh();s.cleared=[C.world.treeKey(roadside[0])];return C.validSave(s);})());
  check('a backpack holding an item from an earlier, parked build stays valid',(()=>{const s=C.fresh();s.inventory.fruittree=1;s.arrivals=[{kind:'kit',type:'fruittree',count:1}];return C.validSave(s);})());}

// The village green and the drawing.
{const details=read('camp-world-details.js'),scene=read('camp-v2-scene.js');
  check('the market has moved to a village green on the high street',K.locations.find(l=>l.id==='market').name==='Market Green'&&/The village green/.test(details)&&/const z=9\.2/.test(details));
  check('roads are drawn as ribbons along their curves with verges, kerbs and rounded ends',/function ribbon\(/.test(details)&&/vergeMat/.test(details)&&/kerbMat/.test(details)&&/function disc\(/.test(details)&&!/content\.roads\)\{const key/.test(details));
  check('the lawn is draped over the ground so it never sinks',/Draped over the ground ring by ring/.test(details));
  check('buildings turn to face their street, and their signs follow',/g\.rotation\.y=b\.rotation\|\|0/.test(scene)&&/Math\.sin\(rot\)\*reach/.test(scene));
  check('lamps follow the roads instead of fixed spots',/Lamps stand along the high street and the grove road/.test(details));}

console.log(`${count} road checks passed`);
