/* Independent check items. Pure: callers pass what the child has already seen.
   An item is never an amount displayed in the same lesson, retries draw a new
   set, and one item is written in reverse order so recall is not order-bound. */
(function(root){
  'use strict';
  const ALL=Array.from({length:13},(_,b)=>b);
  function rng(seed){
    if(!Number.isInteger(seed))return Math.random;
    let t=seed>>>0;
    return ()=>{t=(t+0x6D2B79F5)>>>0;let r=Math.imul(t^(t>>>15),1|t);r^=r+Math.imul(r^(r>>>7),61|r);return ((r^(r>>>14))>>>0)/4294967296;};
  }
  function shuffle(list,random=Math.random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
  const clean=v=>Array.isArray(v)?[...new Set(v.filter(b=>Number.isInteger(b)&&b>=0&&b<=12))]:[];
  // Prefer unseen, non-trivial amounts; fall back to seen ones only when the pool runs dry.
  function pickAmounts(count,{exclude=[],avoid=[],pool=ALL.filter(b=>b>=2),seed}={}){
    const random=rng(seed),ex=clean(exclude),av=clean(avoid);
    const tiers=[pool.filter(b=>!ex.includes(b)&&!av.includes(b)),pool.filter(b=>!ex.includes(b)&&av.includes(b)),pool.filter(b=>ex.includes(b))];
    const out=[];for(const tier of tiers){for(const b of shuffle(tier,random)){if(out.length>=count)break;out.push(b);}}
    return out.slice(0,count);
  }
  // The last item whose order visibly changes when flipped (never 2 × 2 style).
  function reverseIndex(family,amounts){for(let i=amounts.length-1;i>0;i--)if(amounts[i]!==family)return i;return -1;}
  const plural=(n,word)=>`${n} ${word}${n===1?'':'s'}`;
  function item(family,b,{reversed=false,prompt}={}){
    return {a:family,b,text:reversed?`${b} × ${family}`:`${family} × ${b}`,ans:family*b,prompt,...(reversed?{reversed:true}:{})};
  }
  /* A lesson check: `count` unseen amounts, the last written in reverse. */
  function lessonCheck(family,{count=4,shown=[],previous=[],seed,unit='items',group='group',goal}={}){
    const amounts=pickAmounts(count,{exclude:shown,avoid:previous,seed}),flip=reverseIndex(family,amounts);
    return amounts.map((b,i)=>{
      const reversed=i===flip;
      const prompt=i===0&&goal?`Your mission: ${goal.toLowerCase()}. Find the total for ${plural(family,'equal group')} of ${b}.`
        :reversed?`${plural(b,"group")} of ${family}. How many altogether?`
        :`${plural(family,group)}, with ${b} ${unit} in each. How many ${unit} altogether?`;
      return item(family,b,{reversed,prompt});
    });
  }
  function readiness(family,{count=6,previous=[],seed}={}){
    const amounts=pickAmounts(count,{avoid:previous,seed}),flip=reverseIndex(family,amounts);
    return amounts.map((b,i)=>item(family,b,{reversed:i===flip,prompt:'A calm starting check. Help is available.'}));
  }
  function zero(count=3,{previous=[],seed}={}){
    const scenes=[
      b=>({b,text:`${b} × 0`,prompt:`${plural(b,'nest')} each have zero eggs. How many eggs altogether?`}),
      b=>({b,text:`0 × ${b}`,prompt:`There are zero trays. A full tray would hold ${b} seeds. How many seeds are here?`}),
      b=>({b,text:`${b} × 0`,prompt:`${plural(b,'boat')} arrive with no passengers. How many passengers arrive?`}),
      b=>({b,text:`0 × ${b}`,prompt:`No baskets are left. Each would hold ${b} berries. How many berries remain?`}),
      b=>({b,text:`${b} × 0`,prompt:`${plural(b,'lantern')} hold no fireflies. How many fireflies are there?`})
    ];
    const random=rng(seed);
    return pickAmounts(count,{avoid:previous,seed}).map((b,i)=>({a:0,ans:0,...shuffle(scenes,random)[i%scenes.length](b)}));
  }
  /* Unfinished Fact Trail facts in a shuffled order. */
  function trail(remaining,count=5,{seed}={}){return shuffle(clean(remaining),rng(seed)).slice(0,count);}
  const api={reverseIndex,pickAmounts,lessonCheck,readiness,zero,trail,shuffle,rng};
  root.LearningItems=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
