/* 0.43 "A village with a heart": places with people, a daily line each, jobs that use
   the math (equal groups at the bakery, fair shares at the mill), and quick travel. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const run=(s,cmd)=>{const r=C.command(s,cmd);assert.ok(r.ok,cmd.kind+': '+r.message);return r.save;};
const root=path.join(__dirname,'../public'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const v2=read('camp-v2.js'),scene=read('camp-v2-scene.js'),html=read('index.html');
const at=id=>{const p=C.content.locations.find(l=>l.id===id);return {x:p.x,y:p.y};};

// Places and people.
{const s=C.syncProgress(C.fresh(),0);
  check('the bakery, library, inn and workshop are places you can walk to',['bakery','library','inn','workshop'].every(id=>C.route(s,s.explorer,at(id))));
  check('every village job has its person, each with lines for different days',['store','bakery','library','inn','workshop','mill'].every(p=>C.content.villagers.some(v=>v.place===p&&v.lines.length>=3)));
  check('villagers stand on open ground, not inside buildings',C.content.villagers.every(v=>!C.content.town.some(b=>v.x>=b.x&&v.x<b.x+b.w&&v.y>=b.y&&v.y<b.y+b.h)));}

// Bram's baking: equal groups.
{let s=C.syncProgress(C.fresh(),0);const qs=[{a:4,b:0},{a:4,b:9}];
  check('baking happens at the bakery',!C.command(s,{kind:'start-activity',activity:'bake',questions:qs}).ok);
  s.explorer=at('bakery');s=run(s,{kind:'start-activity',activity:'bake',questions:qs});
  check('a baking order is one fact with no empty trays',s.challenge.kind==='bake'&&s.challenge.questions.length===1&&s.challenge.questions[0].b===9&&C.validSave(s));
  const g=s.gems;s=run(s,{kind:'answer-activity',answer:36});check('36 buns pays 6 gems, once per learning adventure',s.gems===g+6&&s.bakes===0&&!C.command(s,{kind:'start-activity',activity:'bake',questions:qs}).ok);
  check('a learning adventure brings another baking order',C.awardLearning(s,0).bakes===1);}

// Millie's fair shares: division.
{let s=C.syncProgress(C.fresh(),0);s.explorer=at('mill');const qs=[{a:4,b:7}];
  s=run(s,{kind:'start-activity',activity:'mill',questions:qs});const w=s.wood;
  let r=C.command(s,{kind:'answer-activity',answer:28});check('at the mill the product is not the answer: 28 logs are being shared',r.ok&&r.save.challenge&&r.reviewEvent.correct===false);
  r=C.command(r.save,{kind:'answer-activity',answer:7});check('7 in each of 4 stacks is right and gives 5 wood, recorded as the fact 4 × 7',r.ok&&!r.save.challenge&&r.save.wood===w+5&&r.reviewEvent.correct&&r.reviewEvent.a===4&&r.reviewEvent.b===7);
  check('damaged job counts fail validation',!C.validSave({...s,bakes:3})&&!C.validSave({...s,mills:-1}));}

// The screens and the scene.
check('each place card has its villager’s line for today and its job',/function villagerSays/.test(v2)&&/data-job="bake"/.test(v2)&&/data-job="mill"/.test(v2)&&/The notice board/.test(v2)&&/See home upgrades/.test(v2));
check('the library keeps the fact garden album (of 66) and the newest postcards',/Your fact garden album · \$\{facts\.size\}\/66/.test(v2)&&/options\.savePostcard/.test(v2)&&/tq-postcards:/.test(html)&&/slice\(0,3\)/.test(html));
check('a signpost at the edge of camp hops you anywhere',/location='signpost'/.test(scene)&&/panel==='travel'/.test(v2)&&/Hop straight there/.test(v2));
check('buildings carry lettered signs and something of their trade, and villagers stand at their doors',/Honeycrust Bakery/.test(scene)&&/villageSigns\.add\(board/.test(scene)&&/for\(const v of content\.villagers/.test(scene)&&/\[objects,wood,markers,villagers,/.test(scene));
check('every material is compiled as the camp opens',/renderer\.compile\(scene,camera\)/.test(scene));

console.log(`${count} village checks passed`);
