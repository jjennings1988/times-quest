/* Authored lesson content and learning evidence. No browser or save side effects. */
(function(root){
  'use strict';
  const ideas={
    0:['Empty groups','A group with nothing in it adds zero. Zero groups also make zero.'],
    1:['One whole group','One group keeps the amount the same.'],
    2:['Double River Bridge','Two equal groups make a double.'],
    3:['The third vine','Make a double, then add one more equal group.'],
    4:['Double, then double','Double a group to make two. Double that total to make four.'],
    5:['Harbor supply boats','Five equal groups are half of ten equal groups.'],
    6:['The spare power cell','Start with five equal groups, then add one more.'],
    7:['The storm shield','Split seven equal groups into five groups and two groups.'],
    8:['Three icy doubles','Double once for two, again for four, and once more for eight.'],
    9:['One group less','Make ten equal groups, then remove one group.'],
    10:['Bundles of ten','Ten equal groups make ten times as many. The digits move one place to the left.'],
    11:['The extra tower','Make ten equal groups, then add one more.'],
    12:['A dozen supplies','Make ten equal groups, then add two more.']
  };
  function parts(a){return a===9?[10,-1]:a===3?[2,1]:a===4?[2,2]:a===6?[5,1]:a===7?[5,2]:a===8?[4,4]:a===11?[10,1]:a===12?[10,2]:null;}
  function explanation(a,b){
    if(a===0||b===0)return `${a} groups of ${b} have ${a*b} altogether. Anything multiplied by zero is zero.`;
    if(a===1)return `One group of ${b} is ${b}.`;
    if(a===2)return `Double ${b}: ${b} + ${b} = ${2*b}.`;
    if(a===5)return `Ten groups of ${b} make ${10*b}. Half as many groups make ${5*b}.`;
    if(a===10)return `Ten groups of ${b} make ${10*b}. For whole numbers, the digits move one place to the left.`;
    const p=parts(a);return p?`${p[0]} groups of ${b} make ${p[0]*b}. ${p[1]<0?'Remove':'Add'} ${Math.abs(p[1])} more group${Math.abs(p[1])===1?'':'s'}: ${p[0]*b} ${p[1]<0?'−':'+'} ${Math.abs(p[1])*b} = ${a*b}.`:`${a} equal groups of ${b} make ${a*b}.`;
  }
  function lesson(fam){return {family:fam,title:ideas[fam][0],idea:ideas[fam][1],each:4,groups:fam,explanation:explanation(fam,4),parts:parts(fam)};}
  function fresh(isNew=false){return {v:1,onboardingDone:!isNew,preferredCamp:isNew?'v2':'v1',activeFamily:null,routes:[],lessons:{},readiness:{},grants:{},pendingGems:0,current:null,resume:null,days:[],goal:'woodland-gate'};}
  function migrate(value){
    const j={...fresh(),...(value&&typeof value==='object'?value:{})};
    j.routes=Array.isArray(j.routes)?[...new Set(j.routes.filter(f=>Number.isInteger(f)&&f>=0&&f<=12))]:[];
    for(const k of ['lessons','readiness','grants'])if(!j[k]||typeof j[k]!=='object'||Array.isArray(j[k]))j[k]={};
    j.grants=Object.fromEntries(Object.entries(j.grants).filter(([id,g])=>id.length<100&&g&&Number.isFinite(g.gems)&&g.gems>=0).slice(-120));
    j.days=Array.isArray(j.days)?[...new Set(j.days.filter(x=>/^\d{4}-\d{2}-\d{2}$/.test(x)))].sort().slice(-35):[];
    j.pendingGems=Math.max(0,Math.floor(Number(j.pendingGems)||0));
    j.preferredCamp=j.preferredCamp==='v2'?'v2':'v1';
    if(!Number.isInteger(j.activeFamily)||j.activeFamily<0||j.activeFamily>12)j.activeFamily=null;
    if(j.current&&(!Number.isInteger(j.current.family)||j.current.family<0||j.current.family>12||!['see','build','choose'].includes(j.current.stage)))j.current=null;
    if(j.current?.family===0){j.current.opened=Array.isArray(j.current.opened)?[...new Set(j.current.opened.filter(i=>[0,1,2].includes(i)))]:[];if(!['inspect','remove','compare'].includes(j.current.zeroStep))j.current.zeroStep='inspect';}
    if(j.current)j.current.groups=Math.max(0,Math.min(12,Math.floor(Number(j.current.groups)||0)));
    if(j.current?.chapter){const c=j.current.chapter;j.current.chapter={v:1,step:Math.max(0,Math.min(3,Number.isInteger(c.step)?c.step:0)),groups:Math.max(0,Math.min(12,Number.isInteger(c.groups)?c.groups:0))};}
    if(j.current?.chapter){const c=j.current.chapter;j.current.chapter={v:1,step:Math.max(0,Math.min(3,Number.isInteger(c.step)?c.step:0)),groups:Math.max(0,Math.min(12,Number.isInteger(c.groups)?c.groups:0))};}
    if(j.resume&&!validResume(j.resume))j.resume=null;
    return j;
  }
  function record(f,{correct,assisted=false,elapsed=0,operation='multiply',day}){
    const previous=f.evidence&&f.evidence.v===1?f.evidence:{v:1,attempts:0,correct:0,supported:0,recent:[],lastDay:null};
    const e={...previous,recent:[...previous.recent]};
    if(assisted)e.supported++;
    else {e.attempts++;if(correct)e.correct++;e.recent.push({ok:!!correct,ms:Math.max(0,Math.round(elapsed)),operation,day});e.recent=e.recent.slice(-12);}
    e.lastDay=day;f.evidence=e;return e;
  }
  function evidence(f){const e=f?.evidence;if(!e||e.v!==1)return null;const recent=e.recent||[];return {attempts:e.attempts,correct:e.correct,supported:e.supported,recent,accuracy:e.attempts?Math.round(e.correct/e.attempts*100):null,recentAccuracy:recent.length?Math.round(recent.filter(x=>x.ok).length/recent.length*100):null};}
  function needsHelp(f){const e=evidence(f);return e?.recent.length?e.recent.slice(-3).some(x=>!x.ok):!!(f.w>0&&f.rating<4);}
  function validResume(r){return !!r&&['learn','lesson','readiness','practice','trial','boss','siege','summit','review'].includes(r.mode)&&Array.isArray(r.fams)&&r.fams.length>0&&r.fams.every(f=>Number.isInteger(f)&&f>=0&&f<=12)&&Array.isArray(r.queue)&&r.queue.length>0&&r.queue.length<=70&&r.queue.every(q=>Number.isInteger(q.a)&&q.a>=0&&q.a<=12&&Number.isInteger(q.b)&&q.b>=0&&q.b<=12&&Number.isInteger(q.ans)&&q.ans>=0&&q.ans<=144&&typeof q.text==='string')&&Number.isInteger(r.idx)&&r.idx>=0&&r.idx<=r.queue.length&&typeof r.grantId==='string'&&r.grantId.length<100&&['correct','passCorrect','wrong','gems','hearts','needCorrect','recovered','reviewAdded','reviewCompleted','baseTotal','independentAttempts'].every(k=>Number.isInteger(r[k])&&r[k]>=0);}
  function grant(j,id,gems){const previous=j.grants[id]?.gems||0,delta=Math.max(0,gems-previous);if(!delta)return false;j.grants[id]={gems,claimed:false};j.pendingGems+=delta;return true;}
  const api={lesson,parts,explanation,fresh,migrate,record,evidence,needsHelp,grant,validResume};
  root.LearningJourney=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
