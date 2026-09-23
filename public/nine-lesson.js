/* A guided model only: exploring never awards independent fact evidence.
   Stage 1 predicts ten racks (not printed) and stage 2 needs a chosen amount,
   a moved rack and a typed total before the independent check opens. */
(function(root){
  'use strict';
  const PREDICT_AMOUNTS=[6,7,8];
  const clean=v=>Array.isArray(v)?[...new Set(v.filter(n=>Number.isInteger(n)&&n>=0&&n<=12))].slice(-13):[];
  const PLAN={q:'Start from ten racks. What do you do next?',options:['Remove 1 whole rack','Remove 1 lantern','Add 1 rack'],correct:0,coach:'Nine is one less than ten, so one whole rack goes to storage.'};
  const fresh=()=>({v:2,stage:0,each:4,removed:null,reason:false,planned:false,predicted:false,chosen:false,solved:false,shown:[4],feedback:''});
  function normalize(value,legacy){
    if(!value){const s=fresh();if(legacy?.step>=1){s.stage=2;s.each=3;}return s;}
    if(![1,2].includes(value.v)||![0,1,2].includes(value.stage))return fresh();
    const each=value.stage===0?4:value.stage===1?(PREDICT_AMOUNTS.includes(value.each)?value.each:7):Number.isInteger(value.each)&&value.each>=0&&value.each<=12?value.each:3;
    const s={...fresh(),stage:value.stage,each,removed:Number.isInteger(value.removed)&&value.removed>=0&&value.removed<10?value.removed:null,reason:value.reason===true,planned:value.v===1?value.stage>=1:value.planned===true,predicted:value.predicted===true,chosen:value.v===1?value.stage===2:value.chosen===true,solved:value.solved===true,shown:clean([4,...clean(value.shown),...(value.stage>=1?[each]:[])])};
    if(s.stage===1&&!s.planned)s.predicted=false;
    if(s.stage===1&&!s.predicted){s.removed=null;s.solved=false;}
    if(s.stage===2&&!s.chosen){s.removed=null;s.solved=false;}
    if(s.removed===null){s.reason=false;s.solved=false;}
    return s;
  }
  function change(value,action,arg){
    const s=normalize(value);
    if(action==='rack'&&Number.isInteger(arg)&&arg>=0&&arg<10){
      if(s.stage===1&&!s.predicted){s.feedback='First predict how many lanterns all ten racks hold.';return s;}
      if(s.stage===2&&!s.chosen){s.feedback='First choose how many lanterns go on each rack.';return s;}
      s.removed=s.removed===arg?null:arg;s.reason=false;s.solved=false;
      s.feedback=s.removed===null?'The rack is back. Ten equal groups again.':`One whole rack of ${s.each} moved to storage. Nine equal racks remain.`;
    }else if(action==='reason'&&s.stage===0&&s.removed!==null){s.reason=arg==='group';s.feedback=s.reason?`Exactly. Remove all ${s.each} lanterns in one group, not just one lantern.`:'We moved a whole rack. Count every lantern on that rack.';
    }else if(action==='plan'&&s.stage===1&&!s.planned){s.planned=arg===PLAN.correct;s.feedback=s.planned?'Good plan. Now predict.':PLAN.coach;
    }else if(action==='quick'&&s.stage===0){const each=PREDICT_AMOUNTS.includes(arg)?arg:PREDICT_AMOUNTS[Math.floor(Math.random()*3)];return {...fresh(),stage:1,each,shown:clean([...s.shown,each]),feedback:'Welcome back to this kind of strategy. Plan, then predict.'};
    }else if(action==='predict'&&s.stage===1&&s.planned&&s.removed===null){s.predicted=arg===10*s.each;s.feedback=s.predicted?`Yes! Ten racks of ${s.each}. Now move one whole rack to storage.`:`Ten racks, with ${s.each} on each rack. Ten groups of ${s.each} make ${s.each} tens.`;
    }else if(action==='total'&&(s.stage===1||s.stage===2)&&s.removed!==null){s.solved=arg===9*s.each;s.feedback=s.solved?`Yes. ${10*s.each} minus ${s.each} is ${9*s.each}. Nine groups of ${s.each} make ${9*s.each}.`:`Start from all ten racks. Take away the ${s.each} lanterns in storage; the other nine racks stay full.`;
    }else if(action==='each'&&s.stage===2&&Number.isInteger(arg)&&arg>=0&&arg<=12){s.each=arg;s.chosen=true;s.removed=null;s.solved=false;s.shown=clean([...s.shown,arg]);s.feedback='Now move one whole rack to storage, then find the total.';
    }else if(action==='next'&&s.stage===0&&s.removed!==null&&s.reason){const each=PREDICT_AMOUNTS.includes(arg)?arg:PREDICT_AMOUNTS[Math.floor(Math.random()*3)];return {...fresh(),stage:1,each,shown:clean([...s.shown,each])};
    }else if(action==='next'&&s.stage===1&&s.solved){return {...fresh(),stage:2,each:s.each,shown:s.shown,feedback:'Choose your own amount for each rack.'};}
    return s;
  }
  function counts(value){const s=normalize(value);return {before:10*s.each,moved:s.removed===null?0:s.each,groups:s.removed===null?10:9,left:(s.removed===null?10:9)*s.each};}
  const api={PLAN,fresh,normalize,change,counts,PREDICT_AMOUNTS,shown:value=>normalize(value).shown,ready:value=>{const s=normalize(value);return s.stage===2&&s.chosen&&s.solved;}};root.NineLesson=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
