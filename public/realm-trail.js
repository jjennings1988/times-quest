/* A realm star is an exploration milestone, not a claim of retained mastery. */
(function(root){
  'use strict';
  const factors=Array.from({length:13},(_,b)=>b);
  function clean(value){return Array.isArray(value)?[...new Set(value.filter(b=>Number.isInteger(b)&&b>=0&&b<=12))].sort((a,b)=>a-b):[];}
  function progress(realm,isCaught,claimed=0){
    const saved=clean(realm?.trailFacts);
    const done=factors.filter(b=>claimed>=3||saved.includes(b)||isCaught(b));
    return {done,remaining:factors.filter(b=>!done.includes(b)),count:done.length};
  }
  function record(realm,b,{correct,independent}){
    if(!realm?.conquered||!correct||!independent||!factors.includes(b))return false;
    const saved=clean(realm.trailFacts);
    if(saved.includes(b))return false;
    realm.trailFacts=clean([...saved,b]);return true;
  }
  const api={clean,progress,record};
  root.RealmTrail=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
