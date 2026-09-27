/* 0.47 "Come back tomorrow": gardens that grow, trees and hives that give once a day,
   a "Today at camp" card, and cottages for companions. Nothing withers while you are away. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const run=(s,cmd)=>{const r=C.command(s,cmd);assert.ok(r.ok,cmd.kind+': '+r.message);return r;};
const root=path.join(__dirname,'../public'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const land=()=>{const s=C.syncProgress(C.fresh(),4);s.objects=[];s.explorer={x:11,y:9};s.inventory.plot=40;return s;};
const DAY=20720;

// Gardens grow over days.
{let s=land();for(let dy=0;dy<2;dy++)for(let dx=0;dx<3;dx++)s=run(s,{kind:'place',type:'plot',x:1+dx,y:1+dy}).save;const key=C.patterns(s)[0].key;
  s=run(s,{kind:'solve-pattern',key,answer:6,day:DAY}).save;
  check('a counted bed is planted the day it is counted and blooms that day',s.beds[key]===DAY&&C.ready(s,DAY).beds.length===0);
  check('from the next day it is ready to harvest',C.ready(s,DAY+1).beds.length===1);
  check('a long break never withers it: it is still ready weeks later',C.ready(s,DAY+40).beds.length===1);
  const g=s.gems,r=run(s,{kind:'harvest',day:DAY+1});check('harvest pays about a quarter of the bed (at least 2) and replants it',r.save.gems===g+C.bedYield(C.patterns(s)[0])&&r.save.beds[key]===DAY+1&&C.bedYield({count:6})===2&&C.bedYield({count:12})===3);
  check('the same bed cannot be harvested twice in a day',!C.command(r.save,{kind:'harvest',day:DAY+1}).ok);
  check('uncounted beds do not grow',C.ready({...land(),objects:s.objects},DAY+5).beds.length===0);}

// Apple trees and hives give once a day.
{let s=land();s.inventory.fruittree=1;s.inventory.beehive=1;s=run(s,{kind:'place',type:'fruittree',x:6,y:3}).save;s=run(s,{kind:'place',type:'beehive',x:8,y:3}).save;
  check('a newly planted tree and hive give on their first day',C.ready(s,DAY).daily.length===2);
  const tree=s.objects.find(o=>o.type==='fruittree'),g=s.gems,r=run(s,{kind:'harvest',key:tree.id,day:DAY});
  check('picking apples pays 3 gems and waits until tomorrow; the hive is still ready',r.save.gems===g+3&&C.ready(r.save,DAY).daily.length===1&&!C.command(r.save,{kind:'harvest',key:tree.id,day:DAY}).ok&&C.ready(r.save,DAY+1).daily.length===2);
  check('harvesting everything gathers the hive too',run(r.save,{kind:'harvest',day:DAY}).save.gems===g+3+4);
  check('a harvest needs today’s date',!C.command(s,{kind:'harvest'}).ok);
  check('damaged day records fail validation',!C.validSave({...s,beds:{x:-1}})&&!C.validSave({...s,collected:[]})&&!C.validSave({...s,todaySeen:1.5}));}

// The gifts and the catalogue.
{const s=C.syncProgress(C.fresh(),0);
  check('every camp is given one apple tree and one Creature Cottage, once',s.inventory.fruittree===1&&s.inventory.critterhome===1&&C.syncProgress(s,0).inventory.fruittree===1);
  check('apple trees, beehives and cottages are back in the catalogue, with daily yields',C.catalog.fruittree.daily===3&&C.catalog.beehive.daily===4&&C.catalog.critterhome&&Object.keys(C.content.later).length===0);}

// Screens and scene.
{const v2=read('camp-v2.js'),scene=read('camp-v2-scene.js');
  check('the first visit each day opens "Today at camp", with harvest, visitor, request, jobs and an idea',/s\.todaySeen!==today&&validSave\(s\)\)panel='today'/.test(v2)&&/Today at camp/.test(v2)&&/data-action="harvest-all"/.test(v2)&&/💡/.test(v2));
  check('a ripe bed can be harvested from its card; trees and hives by walking to them',/data-action="harvest-bed"/.test(v2)&&/act\(\{kind:'harvest',key:o\.id,day:today\}\)/.test(v2));
  check('a cottage names the friend who lives there',/function cottageLine/.test(v2)&&/companions\[i\]\.name/.test(scene));
  check('ripe beds, apples and bees show in the scene',/type==='plot-ripe'/.test(scene)&&/fruittree-ready/.test(scene)&&/beehive-ready/.test(scene));
  check('companions rest at their own cottage at night and visit it often',/if\(home&&\(calm\|\|night\)\)/.test(scene)&&/home&&Math\.random\(\)<\.35/.test(scene));}

console.log(`${count} come-back-tomorrow checks passed`);
