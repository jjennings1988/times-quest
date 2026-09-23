/* Round outcomes: the pass rule, the single next step after a round, and the
   one-line summary. Pure functions; index.html supplies realm names and progress. */
(function(root){
  'use strict';
  function passed(qz,failed=false){
    if(failed||!qz)return false;
    if(qz.battle)return qz.battle.hp===0;
    return qz.needCorrect===0||qz.passCorrect>=qz.needCorrect;
  }
  function accuracy(qz){return qz&&qz.independentAttempts>0?qz.passCorrect/qz.independentAttempts:0;}
  /* ctx: {mode,passed,failed,outcome,fam,pet,upcoming:{name}|null,stars,trailCount,trailRemaining}
     Returns exactly one primary step and at most one alternative. */
  function nextSteps(ctx){
    const cont={action:'doContinue()',label:'Continue adventure'},fam=ctx.fam,pet=ctx.pet||'your guardian';
    if(ctx.outcome)return {primary:{action:ctx.outcome.action,label:ctx.outcome.label},secondary:ctx.outcome.secondary||null};
    if(ctx.mode==='boss'&&!ctx.passed)return {primary:{action:`startBoss(${fam})`,label:`Try again with ${pet} · new facts`},secondary:{action:`startLearn(${fam})`,label:'Explore the strategy again'}};
    if(ctx.mode==='boss')return {primary:ctx.upcoming?{action:'doContinue()',label:`Continue to ${ctx.upcoming.name}`}:cont,
      secondary:ctx.stars<3?{action:`startFactTrail(${fam})`,label:`Stay: ×${fam} Fact Trail · ${13-ctx.trailCount} left`}:null};
    if(ctx.mode==='trial'&&ctx.passed)return {primary:{action:`startBoss(${fam})`,label:`Help ${pet}`},secondary:null};
    if(ctx.mode==='trial')return {primary:{action:`startTrial(${fam})`,label:'Try a new Realm Challenge'},secondary:{action:`startPractice(${fam})`,label:'Practise first'}};
    if(ctx.mode==='fact-trail'&&fam!==null&&ctx.stars<3)return {primary:{action:`startFactTrail(${fam})`,label:`Continue my Fact Trail · ${Math.min(5,ctx.trailRemaining)} facts`},secondary:cont};
    if(ctx.mode==='review')return {primary:cont,secondary:null};
    if(ctx.failed&&fam!==null)return {primary:{action:`startLearn(${fam})`,label:`Explore with ${pet}`},secondary:cont};
    return {primary:cont,secondary:null};
  }
  function summary(qz,starGems=0){
    return [qz.gems?`💎 +${qz.gems} gems`:'',starGems?`⭐ +${starGems} star gems`:'',`✅ ${qz.passCorrect} on your own`,qz.recovered?`💡 ${qz.recovered} with help`:'',qz.reviewAdded?`↻ ${qz.reviewCompleted} later review${qz.reviewCompleted===1?'':'s'}`:''].filter(Boolean).join(' · ');
  }
  const api={passed,accuracy,nextSteps,summary};
  root.Rounds=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
