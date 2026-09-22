/* A guided model only: exploring never awards independent fact evidence. */
(function(root){
  'use strict';
  const fresh=()=>({v:1,stage:0,each:4,removed:null,reason:false,predicted:false,solved:false,feedback:''});
  function normalize(value,legacy){
    if(!value){const s=fresh();if(legacy?.step>=1){s.stage=2;s.each=3;}return s;}
    if(value.v!==1||![0,1,2].includes(value.stage))return fresh();
    const s={...fresh(),stage:value.stage,each:value.stage===0?4:value.stage===1?7:Number.isInteger(value.each)&&value.each>=0&&value.each<=12?value.each:3,removed:Number.isInteger(value.removed)&&value.removed>=0&&value.removed<10?value.removed:null,reason:value.reason===true,predicted:value.predicted===true,solved:value.solved===true};
    if(s.stage===1&&!s.predicted){s.removed=null;s.solved=false;}
    if(s.removed===null){s.reason=false;s.solved=false;}
    return s;
  }
  function change(value,action,arg){
    const s=normalize(value);
    if(action==='rack'&&Number.isInteger(arg)&&arg>=0&&arg<10){
      if(s.stage===1&&!s.predicted){s.feedback='First predict how many lanterns one whole rack will carry.';return s;}
      s.removed=s.removed===arg?null:arg;s.reason=false;s.solved=false;
      s.feedback=s.removed===null?'The rack is back. Ten equal groups again.':`One whole rack of ${s.each} moved to storage. Nine equal racks remain.`;
    }else if(action==='reason'&&s.stage===0&&s.removed!==null){s.reason=arg==='group';s.feedback=s.reason?`Exactly. Remove all ${s.each} lanterns in one group, not just one lantern.`:'We moved a whole rack. Count every lantern on that rack.';
    }else if(action==='predict'&&s.stage===1&&s.removed===null){s.predicted=arg===s.each;s.feedback=s.predicted?'Yes! Tap a rack to move all seven lanterns together.':'Each rack holds seven lanterns. How many move with one whole rack?';
    }else if(action==='total'&&s.stage===1&&s.removed!==null){s.solved=arg===9*s.each;s.feedback=s.solved?'Yes. 70 minus 7 is 63. Nine groups of seven make 63.':'Keep 70 in mind. Take away the seven lanterns in storage; the other nine racks stay full.';
    }else if(action==='each'&&s.stage===2&&Number.isInteger(arg)&&arg>=0&&arg<=12){s.each=arg;s.feedback='Try moving a rack. The whole group changes with your amount.';
    }else if(action==='next'&&s.stage===0&&s.removed!==null&&s.reason){return {...fresh(),stage:1,each:7};
    }else if(action==='next'&&s.stage===1&&s.solved){return {...fresh(),stage:2,each:3};}
    return s;
  }
  function counts(value){const s=normalize(value);return {before:10*s.each,moved:s.removed===null?0:s.each,groups:s.removed===null?10:9,left:(s.removed===null?10:9)*s.each};}
  const api={fresh,normalize,change,counts,ready:value=>normalize(value).stage===2};root.NineLesson=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
