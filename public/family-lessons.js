/* Guided strategy models. These actions never write fact evidence or rewards.
   Every phase asks for one decision the screen has not already answered:
   discover (explain the change), predict (a partial or total that is not printed),
   and explore (choose an amount, build it, then find its total). */
(function(root){
  'use strict';
  const chapters=root.GuardianChapters||(typeof require==='function'?require('./guardian-chapters'):null);
  const PREDICT_AMOUNTS=[6,7,8];
  const plans={
    1:{groups:[1,1],actions:['Deliver this tray'],equations:n=>[`1 + ${n} = ${n+1}`,`1 × ${n} = ${n}`,`${n} × ${n} = ${n*n}`],equationCorrect:1,idea:'One group keeps its amount',prompt:'Carry the whole tray to Echo. Does moving it change how many seeds it holds?',reason:'What happened to the seeds?',choices:['The amount stayed the same','One extra seed appeared'],correct:0,
      predict:n=>`This tray holds ${n} seeds. How many seeds will Echo receive when the whole tray arrives?`,prediction:n=>n,options:n=>[1,n,n+1],coach:n=>`One tray is one group. Every one of its ${n} seeds travels with it.`},
    2:{groups:[1,2],actions:['Make a matching raft'],idea:'Double the amount',prompt:'Make a second raft that carries exactly the same number of planks as the first.',reason:'What makes this a double?',choices:['Add just two planks','Make two equal groups'],correct:1,
      predict:n=>`Each raft holds ${n} planks. How many planks will two matching rafts carry?`,prediction:n=>2*n,options:n=>[n+2,2*n,n],coach:n=>`A matching raft carries another ${n} planks, not just two more. Think ${n} plus ${n}.`},
    3:{groups:[1,2,3],actions:['Double the vine bundle','Add one matching bundle'],idea:'A double and one more group',prompt:'Start with one bundle. Make its double, then bring one more matching bundle.',reason:'How did you make three groups?',choices:['Two groups plus one equal group','Two groups plus one vine'],correct:0,
      predict:n=>`Each bundle holds ${n} vines. How many vines will the double — two bundles — hold?`,prediction:n=>2*n,options:n=>[n+2,2*n,3*n],coach:n=>`A double is two full bundles: ${n} plus ${n}.`},
    4:{groups:[1,2,4],actions:['Double the stone tray','Double both trays'],idea:'Double, then double again',prompt:'Copy the stone tray. Then copy both trays together. Keep every tray equal.',reason:'What did the second double copy?',choices:['One extra stone','Both full trays'],correct:1,
      predict:n=>`Each tray holds ${n} stones. How many stones will two trays hold after the first double?`,prediction:n=>2*n,options:n=>[n+2,2*n,4*n],coach:n=>`The first double makes two full trays: ${n} plus ${n}.`},
    5:{groups:[10],actions:[],idea:'Half of ten equal groups',prompt:'Tap boats to send them to the other dock. Make two docks with the same number of full boats.',reason:'What does each dock have now?',choices:['Five crates','Five full boats'],correct:1,
      predict:()=>'Share ten full boats equally between two docks. How many boats belong at each dock?',prediction:()=>5,options:n=>[5,n,10],coach:()=>'Share the boats, not the crates inside a boat. Both docks need the same number of boats.'},
    6:{groups:[5,6],actions:['Add one matching cell rack'],idea:'Five groups and one more',prompt:'Five cell racks are ready. Connect one more rack with the same number of cells.',reason:'What must the new rack contain?',choices:['The same number of cells as every rack','Just one extra cell'],correct:0,
      predict:n=>`Each rack holds ${n} cells. How many cells do the first five racks hold?`,prediction:n=>5*n,options:n=>[5+n,5*n,6*n],coach:n=>`Five racks of ${n}: use your fives. Count ${n} five times, or halve ten racks.`},
    7:{groups:[5,6,7],actions:['Bring the first extra pack','Bring the second extra pack'],idea:'Five groups plus two groups',prompt:'Five packs are ready. Bring two more matching packs, one at a time.',reason:'What did you add to the five packs?',choices:['Two supplies','Two whole packs'],correct:1,
      predict:n=>`Each pack holds ${n} supplies. How many supplies will the two extra packs bring together?`,prediction:n=>2*n,options:n=>[2,n,2*n],coach:n=>`There are two extra packs, with ${n} supplies in each. Think ${n} plus ${n}.`},
    8:{groups:[1,2,4,8],actions:['Double the crystal cluster','Double both clusters','Double all four clusters'],idea:'Double three times',prompt:'Double one cluster, then two, then four. Every new cluster must match the others.',reason:'How do four clusters become eight?',choices:['Copy all four full clusters','Add four single crystals'],correct:0,
      predict:n=>`Each cluster holds ${n} crystals. How many crystals will four clusters hold?`,prediction:n=>4*n,options:n=>[4+n,4*n,8*n],coach:n=>`Double ${n}, then double again: ${n}, ${2*n}, then four clusters.`},
    10:{groups:[10,10],actions:['Bundle the columns into tens'],idea:'Ten groups become bundles of ten',prompt:'There are ten equal power rows. Collect the first cell from every row into one ten, then do the same for each column.',reason:'What changed when you bundled the cells?',choices:['Only the arrangement changed','More cells appeared'],correct:0,
      predict:n=>`Ten rows each hold ${n} cells. How many columns can become bundles of ten?`,prediction:n=>n,options:n=>[10,n,10*n],coach:n=>`Each row has ${n} columns. One cell from each of the ten rows makes one bundle of ten.`},
    11:{groups:[10,11],actions:['Add one matching tile bundle'],idea:'Ten groups and one more',prompt:'Ten bundles are ready. Add one full matching bundle to make eleven.',reason:'What belongs beside the ten groups?',choices:['One more tile','One more whole group'],correct:1,
      predict:n=>`Each bundle holds ${n} tiles. How many tiles do the first ten bundles hold?`,prediction:n=>10*n,options:n=>[n+10,10*n,11*n],coach:n=>`Ten bundles of ${n} make ${n} tens.`},
    12:{groups:[10,11,12],actions:['Bring the first extra water tray','Bring the second extra water tray'],idea:'Ten groups plus two groups',prompt:'Ten trays are ready. Bring two more full water trays to make a dozen.',reason:'What did you add to the ten trays?',choices:['Two whole trays','Just two cups'],correct:0,
      predict:n=>`Each tray holds ${n} cups. How many cups will the two extra trays bring together?`,prediction:n=>2*n,options:n=>[2,2*n,12],coach:n=>`Each extra tray holds ${n} cups. Combine both trays: ${n} plus ${n}.`}
  };
  /* Strategy families share a planning decision, so each group feels different while the lesson shell stays familiar. */
  const GROUPS={doubling:[2,3,4,8],five:[5,6,7],ten:[9,10,11,12],identity:[0,1]};
  const groupOf=f=>Object.keys(GROUPS).find(k=>GROUPS[k].includes(f))||null;
  const planFor={
    1:{q:'One group of any amount has that same amount. Is that always true or only sometimes?',options:['Always true','Only sometimes'],correct:0,coach:'Try any amount on one tray. Moving one whole group never changes it.'},
    2:{q:'How many doubles turn one raft into two rafts?',options:['1 double','2 doubles','3 doubles'],correct:0,coach:'One double copies the raft once: one raft becomes two.'},
    3:{q:'Make a double first. How many more matching bundles reach three?',options:['1 more bundle','2 more bundles','3 more bundles'],correct:0,coach:'A double is two bundles. Three bundles need one more.'},
    4:{q:'How many doubles turn one tray into four trays?',options:['1 double','2 doubles','4 doubles'],correct:1,coach:'Count the doubles: one tray → two trays → four trays.'},
    8:{q:'How many doubles turn one cluster into eight clusters?',options:['2 doubles','3 doubles','8 doubles'],correct:1,coach:'One → two → four → eight. Count the arrows.'},
    5:{q:'Five groups are half of how many groups?',options:['Half of 10 groups','Half of 5 groups','Half of 2 groups'],correct:0,coach:'Two docks share ten boats equally, five at each.'},
    6:{q:'Split six groups into five groups and how many more?',options:['5 groups + 1 group','5 groups + 6 items','5 groups + 2 groups'],correct:0,coach:'Six groups: five groups you know, plus one more whole group.'},
    7:{q:'Split seven groups into five groups and how many more?',options:['5 groups + 1 group','5 groups + 2 groups','5 groups + 7 items'],correct:1,coach:'Seven groups: five groups, plus two more whole groups.'},
    10:{q:'After bundling, what does each column of ten cells make?',options:['One ten','One cell','Ten tens'],correct:0,coach:'Ten rows give each column ten cells: one bundle of ten.'},
    11:{q:'Start from ten groups. What do you do next?',options:['Add 1 group','Remove 1 group','Add 2 groups'],correct:0,coach:'Eleven is one more than ten, so add one whole group.'},
    12:{q:'Start from ten groups. What do you do next?',options:['Add 1 group','Add 2 groups','Remove 2 groups'],correct:1,coach:'A dozen is two more than ten, so add two whole groups.'}
  };
  /* An optional second way to see the same product, linking strategy families together. */
  const anotherWay={
    4:{q:'Another way: which also finds 4 groups?',options:['Double 2 groups','Add 4 single items'],correct:0,yes:'Yes. Four groups are double two groups — the ×2 strategy twice.'},
    6:{q:'Another way: which also finds 6 groups?',options:['Double 3 groups','Add 6 single items'],correct:0,yes:'Yes. Six groups are double three groups.'},
    8:{q:'Another way: which also finds 8 groups?',options:['Double 4 groups','Add 8 single items'],correct:0,yes:'Yes. Eight groups are double four groups.'},
    12:{q:'Another way: which also finds 12 groups?',options:['Double 6 groups','Add 12 single items'],correct:0,yes:'Yes. Twelve groups are double six groups.'},
    3:{q:'Another way: which also finds 3 groups?',options:['2 groups + 1 group','3 single items'],correct:0,yes:'Yes. Three groups are two groups and one more group.'},
    7:{q:'Another way: which also finds 7 groups?',options:['Double 3 groups, then 1 more group','Add 7 single items'],correct:0,yes:'Yes. Double three groups makes six; one more group makes seven.'},
    11:{q:'Another way: which also finds 11 groups?',options:['10 groups + 1 group','1 group + 1 item'],correct:0,yes:'Yes. Ten groups and one more.'}
  };
  const supports=f=>Number.isInteger(f)&&Object.hasOwn(plans,f);
  const options=(f,n)=>[...new Set(plans[f].options(n))].sort((a,b)=>a-b);
  const clean=v=>Array.isArray(v)?[...new Set(v.filter(n=>Number.isInteger(n)&&n>=0&&n<=12))].slice(-13):[];
  const fresh=f=>({v:2,family:f,phase:0,each:4,step:0,moved:[],history:[],planned:false,predicted:false,explained:false,chosen:false,solved:false,another:null,shown:[4],feedback:''});
  function normalize(f,value,legacy){
    if(!supports(f))return null;
    if(!value){const s=fresh(f);if(legacy?.step>=chapters.chapters[f].targets.length){s.phase=2;s.each=3;}return s;}
    if(![1,2].includes(value.v)||value.family!==f||![0,1,2].includes(value.phase))return fresh(f);
    const each=value.phase===0?4:value.phase===1?(PREDICT_AMOUNTS.includes(value.each)?value.each:7):Number.isInteger(value.each)&&value.each>=0&&value.each<=12?value.each:3;
    const s={...fresh(f),phase:value.phase,each,
      step:Number.isInteger(value.step)?Math.max(0,Math.min(plans[f].actions.length,value.step)):0,
      moved:f===5&&Array.isArray(value.moved)?[...new Set(value.moved.filter(n=>Number.isInteger(n)&&n>=0&&n<10))]:[],
      history:f===5&&Array.isArray(value.history)?value.history.filter(Array.isArray).slice(-20).map(a=>[...new Set(a.filter(n=>Number.isInteger(n)&&n>=0&&n<10))]):[],
      planned:value.v===1?value.phase>=1:value.planned===true,predicted:value.predicted===true,another:[0,1,2].includes(value.another)?value.another:null,explained:value.explained===true,chosen:value.v===1?value.phase===2:value.chosen===true,solved:value.solved===true,
      shown:clean([4,...clean(value.shown),...(value.phase>=1?[each]:[])]),
      feedback:typeof value.feedback==='string'?value.feedback.slice(0,250):''};
    if(s.phase===1&&!s.planned)s.predicted=false;
    if(s.phase===1&&!s.predicted){s.step=0;s.moved=[];s.history=[];s.solved=false;}
    if(s.phase===2&&!s.chosen){s.step=0;s.moved=[];s.history=[];}
    if(!complete(s)){s.explained=false;s.solved=false;}
    return s;
  }
  const complete=s=>s.family===5?s.moved.length===5:s.step===plans[s.family].actions.length;
  function counts(s){const groups=s.family===5?10-s.moved.length:plans[s.family].groups[s.step];return {groups,each:s.each,total:groups*s.each,other:s.family===5?s.moved.length*s.each:0,target:s.family*s.each};}
  function totalHelp(f,b){return {
    1:`There is just one tray, with ${b} seeds. Moving the tray does not add or remove seeds.`,
    2:`Each raft holds ${b} planks. Combine ${b} plus ${b}; doubling makes a second full group.`,
    3:`You found the double. Add a whole bundle of ${b}, not one vine.`,
    4:`The second double copies both trays. Combine the two trays you found, twice.`,
    5:'Count the crates at just one dock. Five full boats stay there.',
    6:`You found five racks. The extra full rack holds ${b}. Combine both amounts.`,
    7:`Find five packs, then add the two extra packs you predicted.`,
    8:`Double the four clusters you found: combine them twice.`,
    10:'Each bundle has ten cells. Count the bundles in tens.',
    11:`You found ten bundles. One extra bundle holds ${b}. Add a whole bundle, not one tile.`,
    12:`Ten trays make ${b} tens. The two extra trays bring the amount you predicted. Add the two parts.`
  }[f];}
  const reset=s=>{s.step=0;s.moved=[];s.history=[];s.explained=false;s.solved=false;};
  function change(f,value,action,arg){
    const s=normalize(f,value);if(!s)return null;
    const building=s.phase===0||(s.phase===1&&s.predicted)||(s.phase===2&&s.chosen);
    if(action==='plan'&&s.phase===1&&!s.planned){s.planned=arg===planFor[f].correct;s.feedback=s.planned?'Good plan. Now predict.':planFor[f].coach;}
    else if(action==='another'&&s.phase===2&&s.solved&&anotherWay[f]&&[0,1].includes(arg)){s.another=arg;s.feedback=arg===anotherWay[f].correct?anotherWay[f].yes:'Single items do not make a new group. Look for whole groups.';}
    else if(action==='quick'&&s.phase===0){const each=PREDICT_AMOUNTS.includes(arg)?arg:PREDICT_AMOUNTS[Math.floor(Math.random()*PREDICT_AMOUNTS.length)];return {...fresh(f),phase:1,each,shown:clean([...s.shown,each]),feedback:'Welcome back to this kind of strategy. Plan, then predict.'};}
    else if(action==='predict'&&s.phase===1&&s.planned&&!s.predicted){s.predicted=arg===plans[f].prediction(s.each);s.feedback=s.predicted?'Your prediction is ready. Now use the model to test it.':plans[f].coach(s.each);}
    else if((action==='act'||action==='boat')&&building){
      if(f===5&&action==='boat'&&Number.isInteger(arg)&&arg>=0&&arg<10){s.history=[...s.history,s.moved.slice()].slice(-20);s.moved=s.moved.includes(arg)?s.moved.filter(i=>i!==arg):[...s.moved,arg];s.feedback=s.moved.length===5?'Five full boats at each dock. Every crate stayed on its boat.':`${10-s.moved.length} boats here and ${s.moved.length} there. Make both docks equal.`;}
      else if(f===1&&action==='act'&&s.step<1&&arg!==plans[1].equationCorrect){s.feedback=`That equation changes the amount. One tray of ${s.each} is one group of ${s.each}.`;return s;}
      else if(f!==5&&action==='act'&&s.step<plans[f].actions.length){s.step++;s.feedback=f===1?(s.phase===0?`Yes: 1 × ${s.each} = ${s.each}. The tray arrived with nothing added or lost.`:'Yes, that equation matches. The tray arrived with nothing added or lost.'):f===10?'The same cells are now bundled by column. Nothing was added or lost.':`${counts(s).groups} equal groups now. Each still holds ${s.each}.`;}
      else return s;
      s.explained=false;s.solved=false;
    }else if(action==='undo'){
      if(f===5)s.moved=s.history.length?s.history.pop():s.moved.slice(0,-1);else s.step=Math.max(0,s.step-1);
      s.explained=false;s.solved=false;s.feedback='Back one step. Try it another way.';
    }else if(action==='reason'&&s.phase===0&&complete(s)){
      s.explained=arg===plans[f].correct;s.feedback=s.explained?chapters.chapters[f].discovery:'Look at the full groups and the items inside them. Which description matches what you moved?';
    }else if(action==='total'&&((s.phase===1&&s.predicted)||(s.phase===2&&s.chosen))&&complete(s)){
      s.solved=arg===f*s.each;s.feedback=s.solved?`Yes. ${f} group${f===1?'':'s'} of ${s.each} make${f===1?'s':''} ${f*s.each}.`:totalHelp(f,s.each);
    }else if(action==='next'&&s.phase===0&&s.explained&&complete(s)){
      const each=PREDICT_AMOUNTS.includes(arg)?arg:PREDICT_AMOUNTS[Math.floor(Math.random()*PREDICT_AMOUNTS.length)];
      return {...fresh(f),phase:1,each,shown:clean([...s.shown,each])};
    }
    else if(action==='next'&&s.phase===1&&s.solved)return {...fresh(f),phase:2,each:s.each,chosen:false,shown:s.shown,feedback:'Choose your own amount for each group.'};
    else if(action==='each'&&s.phase===2&&Number.isInteger(arg)&&arg>=0&&arg<=12){s.each=arg;s.chosen=true;s.shown=clean([...s.shown,arg]);reset(s);s.feedback='Now build it with the same strategy, then find the total.';}
    return s;
  }
  function expression(s){
    const f=s.family,b=s.each,c=counts(s),answer=s.phase>0&&!s.solved?'?':c.total;
    if(!complete(s))return f===1?`1 tray of ${b} = ?`:`${c.groups} × ${b} = ${answer}`;
    const terms={1:`1 × ${b}`,2:`${b} + ${b}`,3:`${2*b} + ${b}`,4:`${2*b} + ${2*b}`,5:`${10*b} ÷ 2`,6:`${5*b} + ${b}`,7:`${5*b} + ${2*b}`,8:`${4*b} + ${4*b}`,10:`${b} × 10`,11:`${10*b} + ${b}`,12:`${10*b} + ${2*b}`};
    const hidden={3:`double + ${b}`,4:'double + double',6:`five racks + ${b}`,7:'five packs + two packs',8:'four clusters + four clusters',11:`ten bundles + ${b}`,12:'ten trays + two trays'};
    // Before the child answers, show the strategy's shape without printing the partial they are asked to find.
    const shape=s.phase>0&&!s.solved&&hidden[f]?hidden[f]:f===5?`half of ${10*b}`:terms[f];
    return `${shape} = ${answer}`;
  }
  const api={plans,planFor,anotherWay,GROUPS,groupOf,supports,options,fresh,normalize,complete,counts,change,expression,PREDICT_AMOUNTS,
    shown:(f,s)=>normalize(f,s)?.shown||[],
    ready:(f,s)=>{const n=normalize(f,s);return n?.phase===2&&n.chosen&&n.solved;}};
  root.FamilyLessons=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
