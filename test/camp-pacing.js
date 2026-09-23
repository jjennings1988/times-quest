const assert=require('node:assert/strict');
const C=require('../public/camp-v2'),Goals=require('../public/camp-goals');
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};
const two=[{a:3,b:4},{a:7,b:6}];
function run(s,cmd){const r=C.command(s,cmd);assert.ok(r.ok,r.message);assert.ok(C.validSave(r.save),JSON.stringify(cmd));return r.save;}
function complete(s){while(s.challenge){const q=s.challenge.questions[s.challenge.index];s=run(s,{kind:'answer-activity',answer:q.a*q.b});}return s;}
function atRiver(s){return {...s,explorer:{x:14,y:8}};}

check('the store sells tools and trades, not wood or stone',!('wood' in C.content.offers)&&!('stone' in C.content.offers)&&'rod' in C.content.offers);
let s=atRiver(C.syncProgress(C.fresh(),2));
check('river stones wait until three realms are restored',!C.command(s,{kind:'start-activity',activity:'stone',questions:two}).ok);
s=atRiver(C.syncProgress(C.fresh(),3));const before=s.stone,trips=s.casts;
s=complete(run(s,{kind:'start-activity',activity:'stone',questions:two}));
check('a river stone trip is two review facts for four stone',s.stone===before+4&&s.casts===trips-1&&!s.challenge);
check('a saved stone trip survives reload validation',C.validSave(JSON.parse(JSON.stringify({...s,challenge:{kind:'stone',target:null,questions:two,index:1,retry:false,feedback:false}}))));
for(let i=s.casts;i>0;i--)s=complete(run(s,{kind:'start-activity',activity:'stone',questions:two}));
check('river trips are shared and limited per learning adventure',!C.command(s,{kind:'start-activity',activity:'stone',questions:two}).ok);
const rewarded=C.awardLearning(s,10);
check('a learning adventure refreshes trips and adds stone from three realms',rewarded.casts===3&&rewarded.stone===s.stone+2);
check('before three realms a learning adventure adds no stone',C.awardLearning(C.syncProgress(C.fresh(),2),10).stone===C.syncProgress(C.fresh(),2).stone);

// Pacing from a fresh profile: stone for the cottage and keep through ordinary play, never purchases.
const need=C.catalog.stonehome.stone+C.catalog.keep.stone;
const perRoundNoFishing=2+3*4,perRoundLight=2+1*4;
const fastest=Math.ceil(need/perRoundNoFishing),light=Math.ceil(need/perRoundLight);
check(`stone homes take at least ${fastest} learning adventures, so they stay a long-term goal`,fastest>=5);
check(`one river trip per adventure reaches the keep within ${light} adventures, not months`,light<=16);

// Today's idea follows the pinned project.
const fresh=C.fresh();
const ideas=['tent','lodge','keep','stonewall','palisade','well'].map(type=>Goals.todayIdea(Goals.view(C.catalog,fresh,type),{hasRod:false}));
check('every project has a short, specific idea for today',ideas.every(t=>typeof t==='string'&&t.length>10&&t.length<90));
check('a locked project points to the adventure',Goals.todayIdea(Goals.view(C.catalog,fresh,'keep')).includes('Restore'));
const stoneShort={...C.syncProgress(C.fresh(),9),gems:999,wood:999,stone:0};
check('a project short of stone suggests the river',Goals.todayIdea(Goals.view(C.catalog,stoneShort,'stonehome')).includes('river'));
console.log(`${checks} camp pacing checks passed`);
