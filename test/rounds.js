const assert=require('node:assert/strict'),R=require('../public/rounds');
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};
check('a failed round never passes',!R.passed({needCorrect:0,passCorrect:9},true));
check('an ungated round passes',R.passed({needCorrect:0,passCorrect:0}));
check('a gate needs its independent answers',!R.passed({needCorrect:5,passCorrect:4})&&R.passed({needCorrect:5,passCorrect:5}));
check('an encounter passes only when restoration is full',!R.passed({battle:{hp:1},needCorrect:0})&&R.passed({battle:{hp:0},needCorrect:9,passCorrect:0}));
check('accuracy ignores supported answers',R.accuracy({independentAttempts:4,passCorrect:3})===.75&&R.accuracy({independentAttempts:0,passCorrect:0})===0);
const base={fam:4,pet:'Boulder',passed:true,failed:false,outcome:null,upcoming:{name:'Nine Ninja Temple'},stars:2,trailCount:3,trailRemaining:10};
const modes=['boss','trial','fact-trail','review','practice','lesson','readiness'];
for(const mode of modes)for(const passed of [true,false])for(const stars of [2,3]){
  const n=R.nextSteps({...base,mode,passed,stars});
  check(`${mode}/${passed}/${stars}: exactly one primary step`,!!n.primary&&typeof n.primary.action==='string'&&n.primary.label.length>0);
  check(`${mode}/${passed}/${stars}: at most one alternative, never the same as the primary`,!n.secondary||n.secondary.action!==n.primary.action||n.secondary.label!==n.primary.label);
  check(`${mode}/${passed}/${stars}: no hostile wording`,!/boss|defeat|blocked|attack/i.test(n.primary.label+(n.secondary?.label||'')));
}
check('star 2 continues the adventure first',R.nextSteps({...base,mode:'boss'}).primary.label==='Continue to Nine Ninja Temple');
check('the Fact Trail is the alternative after star 2',R.nextSteps({...base,mode:'boss'}).secondary.action==='startFactTrail(4)');
check('a paused encounter retries with new facts first',R.nextSteps({...base,mode:'boss',passed:false}).primary.label.includes('new facts'));
check('a missed challenge offers a new challenge and practice',R.nextSteps({...base,mode:'trial',passed:false}).secondary.action==='startPractice(4)');
check('a journey outcome keeps its own step and alternative',R.nextSteps({...base,mode:'lesson',outcome:{action:'x()',label:'X',secondary:{action:'y()',label:'Y'}}}).secondary.action==='y()');
check('summary separates independent and supported answers',R.summary({gems:3,passCorrect:4,recovered:1,reviewAdded:0},40)==='💎 +3 gems · ⭐ +40 star gems · ✅ 4 on your own · 💡 1 with help');
console.log(`${checks} round outcome checks passed`);
