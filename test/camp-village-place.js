/* 0.45 "A village in its place": buildings where they make sense, boundaries and gardens,
   a woodland edge that opens into meadow, a landmark at the end of a view, and a village
   that keeps the time of day. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const K=C.content,W=C.world,root=path.join(__dirname,'../public'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const b=id=>K.town.find(t=>t.id===id);

// Buildings where they belong.
{const mill=b('mill'),inn=b('inn'),bridgeEnd=K.roadLines.find(r=>r.id==='high').pts[0];
  const riverGap=Math.min(...Array.from({length:mill.h},(_,i)=>mill.x-W.river(mill.y+i+.5)));
  check('the watermill stands on the river bank, dry but within a step of the water',riverGap>1.65&&riverGap<3.2&&Array.from({length:mill.w*mill.h},(_,i)=>!W.water(mill.x+i%mill.w+.5,mill.y+Math.floor(i/mill.w)+.5)).every(Boolean));
  check('the inn greets travellers at the bridge',Math.hypot(inn.x+inn.w/2-bridgeEnd[0],inn.y+inn.h/2-bridgeEnd[1])<5&&inn.face==='n');
  check('the mill and inn doors open onto roads',K.roadAt(mill.entrance.x,mill.entrance.y)&&K.roadAt(inn.entrance.x,inn.entrance.y));
  const s=C.syncProgress(C.fresh(),0);check('both can still be reached from camp',['mill','inn'].every(id=>C.route(s,s.explorer,K.locations.find(l=>l.id===id))));
  check('the villagers moved with their buildings',Math.hypot(K.villagers.find(v=>v.place==='mill').x-mill.entrance.x,K.villagers.find(v=>v.place==='mill').y-mill.entrance.y)<2&&Math.hypot(K.villagers.find(v=>v.place==='inn').x-inn.entrance.x,K.villagers.find(v=>v.place==='inn').y-inn.entrance.y)<2);}

// The woodland edge.
{const edge=W.forest.filter(t=>t.edge);
  check('the wood opens into meadow at the village edge',edge.length>20&&edge.every(t=>!W.treePresent(C.fresh(),t)));
  check('trees on the child’s build plots are never thinned (they are cleared by learning)',edge.every(t=>!K.zones.some(z=>z.need>0&&K.inZone(z,Math.floor(t.x),Math.floor(t.z)))));
  check('a save that cleared an edge tree before 0.45 is still valid',(()=>{const s=C.fresh();s.cleared=[W.treeKey(edge[0])];return C.validSave(s);})());}

// Drawn details and the time of day.
{const d=read('camp-world-details.js'),scene=read('camp-v2-scene.js');
  check('the mill wheel turns in the river beside the mill',/wheel\.position\.set\(19\.55,/.test(d));
  check('hedges frame the build plots with gaps to walk through, and the old inn plot is a walled kitchen garden',/function hedge\(/.test(d)&&/walled kitchen garden/.test(d));
  check('houses have back gardens, and a washing line hangs between two of them',/Back gardens behind the houses/.test(d)&&/washing line/.test(d));
  check('the Meeting Oak ends the view up the cut lane',/The Meeting Oak/.test(d)&&K.roadLines.find(r=>r.id==='cut'));
  check('market goods pack away at dusk; lamps glow in the evening',/goods\.visible=sky==='morning'\|\|sky==='day'/.test(d)&&/mat\('#f8d583',true\),lx/.test(d));
  check('villagers go indoors at night, and the strollers walk round the green',/villagers\.visible=!night/.test(scene)&&/40\.2\+Math\.sin\(t\)\*3\.4/.test(scene));
  check('reeds keep out of buildings on the bank',/if\(content\.town\.some\(b=>x>=b\.x-\.4/.test(d));}

console.log(`${count} village-in-its-place checks passed`);
