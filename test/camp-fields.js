/* 0.48: guardians move into Creature Cottages as 3D companions (no flat sprites), and
   Willow Fields gives gardens, orchards and hives room beside the village. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const K=C.content,root=path.join(__dirname,'../public'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const scene=read('camp-v2-scene.js'),details=read('camp-world-details.js'),v2=read('camp-v2.js'),html=read('index.html');
const fields=K.zones.find(z=>z.id==='fields');

// 3D companions.
check('no flat creature sprites remain in the camp scene',!/TextureLoader/.test(scene)&&!/new THREE\.Sprite\(m\);sp\.center/.test(scene));
check('guardians of restored realms (newest first) are the camp’s friends',/friends:REALM_ORDER\.filter\(f=>state\.realms\[f\]\.conquered\)\.reverse\(\)/.test(html));
check('a guardian moves in only when there is a cottage for them, drawn with the grove’s own 3D model',/function moveIn\(homes\)/.test(scene)&&/worldDetails\.creature\(pad\.kind,g\.color\)/.test(scene)&&/return \{picks,creature,/.test(details));
check('while a guardian lives at camp, their grove home stands empty (never in two places)',/setAway\(families\)\{residents\.forEach\(r=>\{r\.root\.visible=!families\.has\(r\.family\)/.test(details)&&/worldDetails\.setAway\(/.test(scene));
check('the cottage names its guardian; an empty one explains how to welcome one',/friends\[i\]\.name/.test(scene)&&/Restore a realm and its guardian can move in/.test(v2));

// Willow Fields.
{const s=C.syncProgress(C.fresh(),0);
  check('Willow Fields is open to every camp from the start',fields&&fields.need===0&&s.land.includes('fields'));
  check('it is roomy: at least 80 build cells, all free of trees',fields.w*fields.h>=80&&Array.from({length:fields.w*fields.h},(_,i)=>[fields.x+i%fields.w,fields.y+Math.floor(i/fields.w)]).every(([x,y])=>C.buildable(s,x,y)&&!C.world.forest.some(t=>Math.floor(t.x)===x&&Math.floor(t.z)===y&&C.world.treePresent(s,t))));
  check('it never overlaps a road, a building or another plot',K.roads.every(r=>!K.inZone(fields,r.x,r.y))&&K.town.every(b=>!(b.x<fields.x+fields.w&&b.x+b.w>fields.x&&b.y<fields.y+fields.h&&b.y+b.h>fields.y))&&K.zones.every(z=>z===fields||!(z.x<fields.x+fields.w&&z.x+z.w>fields.x&&z.y<fields.y+fields.h&&z.y+z.h>fields.y)));
  check('it fills the big meadow across the grove road, with a grass border before any road',fields.y+fields.h<=3&&fields.w*fields.h>=160&&Array.from({length:(fields.w+2)*(fields.h+2)},(_,i)=>[fields.x-1+i%(fields.w+2),fields.y-1+Math.floor(i/(fields.w+2))]).every(([x,y])=>!K.roadAt(x,y)));
  check('the old strip by the fountain is meadow again: no plot there, its flowering trees back',!K.zones.some(z=>K.inZone(z,50,12))&&/\[49,10\],\[55,20\],\[54,10\]/.test(details));
  check('Willow Fields is a stop on the signpost and in the Journal, reachable from camp',K.locations.some(l=>l.id==='fields')&&C.route(s,s.explorer,K.locations.find(l=>l.id==='fields')));
  const room={...s,objects:[],explorer:{x:52,y:9},inventory:{...s.inventory,plot:40,fruittree:2}};let t=room;for(let dy=0;dy<4;dy++)for(let dx=0;dx<6;dx++){const r=C.command(t,{kind:'place',type:'plot',x:fields.x+1+dx,y:fields.y+dy});assert.ok(r.ok,r.message);t=r.save;}
  check('a big 4 × 6 garden bed fits in the fields, and counts as an array',C.patterns(t).some(p=>p.rows===4&&p.cols===6));
  check('apple trees can be planted there too',C.command(t,{kind:'place',type:'fruittree',x:fields.x+10,y:fields.y+2}).ok);
  check('garden things can still be planted anywhere: the fields are the roomy option',C.command({...s,inventory:{...s.inventory,plot:1}},{kind:'place',type:'plot',x:2,y:8}).ok);}

// The look and the shortcut.
check('the fields look like farmland: furrows, a hedge with a gate, a scarecrow and a tool shed',/Willow Fields: furrowed earth, a hedge with a field gate, a scarecrow and a little tool shed/.test(details));
check('scenery keeps off the fields',/q\.id==='fields'&&content\.inZone/.test(scene)&&/t\.edge&&!content\.zones\.some/.test(details));
check('planting a garden thing offers "Plant in Willow Fields", which hops there with the seedling',/data-action="to-fields"/.test(v2)&&/if\(a==='to-fields'&&preview\)/.test(v2));

console.log(`${count} fields and friends checks passed`);
