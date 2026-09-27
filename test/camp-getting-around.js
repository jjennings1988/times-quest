/* 0.49 "Getting around" and 0.50 "Worn in": camps that open after the village is redrawn, arrivals that
   walk up to where you are going, guardians who greet you, a visitor on the road, a second footbridge,
   a beach by the landing, grass that wears into the child's own paths, and sound that follows place. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const K=C.content,W=C.world,root=path.join(__dirname,'../public'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const v2=read('camp-v2.js'),scene=read('camp-v2-scene.js'),details=read('camp-world-details.js'),html=read('index.html');

// A camp outlives a redrawn village.
{const s=C.syncProgress(C.fresh(),0),stray={...s,objects:[...s.objects,{id:'o99',type:'plot',x:47,y:11,r:0}],nextId:100},before=JSON.stringify(stray);
  check('a plot standing where no land is open makes a save invalid',!C.validSave(stray));
  const r=C.rehome(stray);
  check('it opens anyway: the plot goes back into the backpack and nothing else changes',r&&C.validSave(r.save)&&r.returned.join()==='plot'&&r.save.inventory.plot===(s.inventory.plot||0)+1&&r.save.objects.length===s.objects.length);
  check('the camp as it was is not altered',JSON.stringify(stray)===before);
  check('an explorer who wandered off the map comes home',(()=>{const x=C.rehome({...s,explorer:{x:500,y:500}});return x&&C.validSave(x.save)&&x.save.explorer.x===6;})());
  check('a camp view saved while the page had no size is reset instead of sending the child to recovery',(()=>{const x=C.rehome({...s,camera:{x:null,y:null,zoom:1,angle:0}});return x&&C.validSave(x.save)&&x.save.camera.x===0;})());
  check('the camera never takes a position from a canvas with no size, and a bad view is never saved',/if\(!\(width>0&&height>0\)\)return;/.test(scene)&&/if\(!\['x','y','zoom'\]\.every\(k=>Number\.isFinite\(camera\[k\]\)\)\)camera=\{\.\.\.s\.camera\}/.test(v2));
  check('a healthy camp needs no rescue, and a damaged one still goes to recovery',C.rehome(s)===null&&C.rehome({...stray,gems:-5})===null&&C.rehome(null)===null);
  check('the app keeps the camp as it was, and tells the child what went into the backpack',/state\.campRehomed=\{at:new Date\(\)\.toISOString\(\),items:fixed\.returned,original:state\.campV2\}/.test(html)&&/went back into your backpack/.test(html)&&/tell\(options\.notice\|\|/.test(v2));}

// Getting around.
{const s=C.syncProgress(C.fresh(),13);
  check('a footpath leads from Maple Hollow to Willow Bridge',K.roadAt(12,4)&&K.roadAt(14,4)&&K.roadAt(15,4));
  check('a bank path passes the fishing landing and runs down to a second footbridge',K.roadLines.some(r=>r.id==='bank')&&K.roadAt(13,8)&&K.roadAt(14,17));
  check('the footbridge crosses the river: its row is dry, just upstream is water',!W.water(W.river(17.5),17.5)&&W.water(W.river(16.4),16.4)&&W.walkHeight(W.river(17.5),17.5)>.1);
  check('you can walk from the landing over the footbridge to the mill',(()=>{const p=C.route(s,{x:14,y:9},{x:23,y:15});return p&&p.some(c=>c.y===17&&W.river(17.5)-1<c.x&&c.x<W.river(17.5)+1);})());
  check('every road still joins Willow Bridge, bridge decks included',(()=>{const seen=new Set(['20,4']),q=[{x:20,y:4}];for(let i=0;i<q.length;i++)for(const [dx,dy] of [[0,1],[0,-1],[1,0],[-1,0]]){const x=q[i].x+dx,y=q[i].y+dy,k=x+','+y;if(K.roadAt(x,y)&&!seen.has(k)){seen.add(k);q.push({x,y});}}return seen.size===K.roads.length;})());
  check('every place on the signpost can be reached',K.locations.every(l=>C.route(s,s.explorer,{x:l.x,y:l.y})));}
check('a hop lands a few steps short, so you walk up to the place and see it arrive (not in calm mode)',/short=!calm\(\)&&path\.length>6,land=short\?path\[path\.length-5\]:target/.test(v2)&&/walking=short\?path\.slice\(-4\):\[\]/.test(v2));
check('arriving at the Guardian Grove brings its guardians out to the arch to meet you, then home again',/if\(id==='sanctuary'\)scene\?\.greet\?\.\(\)/.test(v2)&&/greet:\(\)=>worldDetails\.greet\(\)/.test(scene)&&/greet\(\)\{greetPending=true;\}/.test(details)&&/a\.gather=\[72\+off\*\.9,2\.1-row\]/.test(details));
check('the day’s visitor walks from the grove, along the village roads and over the bridge, to the Story Stones',/walk:\{pts,lens,total/.test(details)&&/content\.roadLines\.find\(r=>r\.id==='grove'\)/.test(details)&&/is walking over from the Guardian Grove/.test(v2));
check('the river has a footbridge, a pebble beach and a bench by the landing, with reeds kept clear of them',/a footbridge downstream links the bank path and the mill lane/.test(details)&&/A pebble beach beside the fishing landing/.test(details)&&/world\.footbridge\(z-\.3\)/.test(details));

// Worn in.
{const s=C.fresh();
  check('a camp remembers which grass the child walks',C.validSave({...s,worn:{'5,5':3,'-4,12':30}}));
  check('damaged walking records fail validation',!C.validSave({...s,worn:{'x,5':1}})&&!C.validSave({...s,worn:{'5,5':0}})&&!C.validSave({...s,worn:{'5,5':31}})&&!C.validSave({...s,worn:[]})&&!C.validSave({...s,worn:Object.fromEntries(Array.from({length:401},(_,i)=>[i+',0',1]))}));}
check('each grass cell wears once a visit (never roads), and the record stays small',/if\(content\.roadAt\(p\.x,p\.y\)\|\|wornThisVisit\.has\(k\)/.test(v2)&&/keys\.length>400/.test(v2)&&/function arrive\(\)\{const done=onArrive;onArrive=null;wear\(trip\)/.test(v2));
check('a worn trail shows only after a few visits and deepens with more',/if\(n<3\)continue/.test(scene)&&/wornMats\[Math\.min\(4,Math\.floor\(\(n-3\)\/2\)\)\]/.test(scene)&&/syncWorn\(save\.worn\)/.test(scene));
check('sound follows place: river, village chatter, a hushed grove and bees over the fields',/function placeOf\(x,y\)/.test(v2)&&/options\.onPlace\?\.\(placeOf/.test(v2)&&/onPlace:setCampPlace/.test(html)&&/function setCampPlace\(place\)/.test(html)&&/p==='village'/.test(html)&&/p==='fields'/.test(html));
check('the soundscape still rests in calm mode',/state\.settings\.calm\|\|prefersReducedMotion\(\)/.test(html));

console.log(`${count} getting-around and worn-in checks passed`);
