const assert=require('node:assert/strict');
const Items=require('../public/learning-items'),Chapters=require('../public/guardian-chapters');
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};
const seen=new Set();let reversedEverywhere=true,repeatedRetry=0;
for(let seed=1;seed<=1000;seed++){
  const f=1+seed%12,shown=[4,6+seed%3,seed%13];
  const first=Chapters.questions(f,{shown,seed});
  check(`seed ${seed}: four items`,first.length===4);
  check(`seed ${seed}: arithmetic is exact`,first.every(q=>q.ans===q.a*q.b&&q.a===f));
  check(`seed ${seed}: no displayed amount is checked`,first.every(q=>!shown.includes(q.b)));
  check(`seed ${seed}: amounts are distinct and non-trivial`,new Set(first.map(q=>q.b)).size===4&&first.every(q=>q.b>=2));
  if(first.filter(q=>q.reversed).length!==1||first.find(q=>q.reversed).b===f)reversedEverywhere=false;
  const retry=Chapters.questions(f,{shown,previous:first.map(q=>q.b),seed:seed+7919});
  if(retry.map(q=>q.b).sort().join()===first.map(q=>q.b).sort().join())repeatedRetry++;
  seen.add(first.map(q=>q.b).join());
}
check('exactly one reversed item, never one whose order cannot change',reversedEverywhere);
check('a retry never repeats the same set',repeatedRetry===0);
check('item sets vary across children',seen.size>500);
check('reversed items are written as groups-of-family',Items.lessonCheck(3,{seed:4}).at(-1).text.endsWith('× 3'));
check('grammar is singular for one group',Items.lessonCheck(1,{seed:2,group:'seed tray',unit:'seeds',goal:'Wake the woodland garden'}).every(q=>!/\b1 (equal groups|seed trays|groups)\b/.test(q.prompt)));
for(let seed=1;seed<=200;seed++){
  const z=Items.zero(3,{seed}),again=Items.zero(3,{seed:seed+1,previous:z.map(q=>q.b)});
  check(`zero ${seed}: every answer is zero and the fact is a zero fact`,z.every(q=>q.ans===0&&q.a===0&&/0/.test(q.text)));
  check(`zero ${seed}: a retry uses new amounts`,again.every(q=>!z.map(x=>x.b).includes(q.b)));
  const r=Items.readiness(7,{seed});check(`readiness ${seed}: six distinct amounts`,r.length===6&&new Set(r.map(q=>q.b)).size===6);
}
check('fact trail keeps only unfinished facts',Items.trail([3,5,9],5,{seed:3}).sort().join()==='3,5,9');
check('pool exhaustion falls back safely',Items.pickAmounts(4,{exclude:[2,3,4,5,6,7,8,9,10,11,12],seed:1}).length===4);
console.log(`${checks} learning item checks passed`);
