const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const Model=require('../public/family-lessons'),Chapters=require('../public/guardian-chapters');
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};
const families=[1,2,3,4,5,6,7,8,10,11,12];
function build(f,s){if(f===5){for(const i of [0,2,4,6,8])if(!s.moved.includes(i))s=Model.change(f,s,'boat',i);}else while(!Model.complete(s))s=Model.change(f,s,'act');return s;}
async function main(){
  for(const f of families){
    let s=Model.fresh(f),snapshot=JSON.stringify(s);
    check(`${f}: no skip from discovery`,Model.change(f,s,'next').phase===0&&!Model.ready(f,s));
    s=build(f,s);check(`${f}: first model shows exact target`,Model.counts(s).total===f*4);
    s=Model.change(f,s,'reason',1-Model.plans[f].correct);check(`${f}: misconception does not advance`,Model.change(f,s,'next').phase===0);
    s=Model.change(f,s,'reason',Model.plans[f].correct);
    check(`${f}: an unspecified new amount varies within six to eight`,Model.PREDICT_AMOUNTS.includes(Model.change(f,s,'next').each));
    s=Model.change(f,s,'next',7);
    check(`${f}: new amount starts with prediction`,s.phase===1&&s.each===7&&!s.predicted);
    if(![1,5,10].includes(f))for(const n of Model.PREDICT_AMOUNTS)check(`${f} with ${n}: the prediction is not printed in its own question`,!new RegExp(`\b${Model.plans[f].prediction(n)}\b`).test(Model.plans[f].predict(n)));
    const start=JSON.stringify(s);Model.change(f,s,'act');check(`${f}: input model is immutable`,JSON.stringify(s)===start&&JSON.stringify(Model.fresh(f))===snapshot);
    check(`${f}: prediction waits for a plan`,!Model.change(f,s,'predict',Model.plans[f].prediction(7)).predicted);
    const wrongPlan=Model.change(f,s,'plan',(Model.planFor[f].correct+1)%Model.planFor[f].options.length);check(`${f}: a wrong plan gets coaching`,!wrongPlan.planned&&wrongPlan.feedback===Model.planFor[f].coach);
    s=Model.change(f,s,'plan',Model.planFor[f].correct);check(`${f}: the right plan opens prediction`,s.planned);
    s=Model.change(f,s,'predict',0);const blocked=Model.change(f,s,f===5?'boat':'act',0);
    check(`${f}: wrong prediction cannot skip modelling`,!blocked.predicted&&blocked.step===0&&blocked.moved.length===0);
    s=Model.change(f,s,'plan',Model.planFor[f].correct);s=Model.change(f,s,'predict',Model.plans[f].prediction(7));s=build(f,s);
    check(`${f}: seven-item result stays hidden`,Model.expression(s).endsWith('= ?'));
    s=Model.change(f,s,'total',f*7+1);check(`${f}: wrong total stays in coaching`,!s.solved&&Model.change(f,s,'next').phase===1);
    s=Model.change(f,s,'total',f*7);s=Model.change(f,s,'next');check(`${f}: solved prediction opens the child's own amount, not the check`,s.phase===2&&!s.chosen&&!Model.ready(f,s));
    check(`${f}: nothing builds before an amount is chosen`,JSON.stringify(Model.change(f,s,f===5?'boat':'act',0))===JSON.stringify(s));
    s=Model.change(f,s,'each',5);s=build(f,s);check(`${f}: own amount hides its total until found`,Model.expression(s).endsWith('= ?')&&!Model.ready(f,s));
    s=Model.change(f,s,'total',f*5);if(Model.anotherWay[f]){const alt=Model.change(f,s,'another',Model.anotherWay[f].correct);check(`${f}: another way is optional and explained`,alt.feedback===Model.anotherWay[f].yes&&Model.ready(f,alt));}check(`${f}: own build and total open the independent check`,Model.ready(f,s)&&[4,5,7].every(n=>Model.shown(f,s).includes(n)));
    for(let each=0;each<=12;each++){
      let e=Model.change(f,{...Model.fresh(f),phase:2,each:3},'each',each);const before=Model.counts(e);e=build(f,e);const after=Model.counts(e);
      check(`${f} × ${each}: correct quantity`,after.total===f*each);
      if([1,5,10].includes(f))check(`${f} × ${each}: objects conserved`,after.total+after.other===before.total);
      const undo=Model.change(f,e,'undo');check(`${f} × ${each}: manipulation reversible`,!Model.complete(undo)&&undo.each===each);
    }
    check(`${f}: cross-family and malformed state reset safely`,Model.normalize(f,{v:1,family:99,phase:2}).phase===0&&Model.normalize(f,{v:7,family:f,phase:2}).phase===0);
    check(`${f}: completed legacy comparison remains available`,Model.normalize(f,null,{step:Chapters.chapters[f].targets.length}).phase===2);
  }
  let boats=Model.fresh(5);for(const i of [0,1,2,3,4,5])boats=Model.change(5,boats,'boat',i);
  check('unbalanced docks remain a useful reversible experiment',!Model.complete(boats)&&Model.counts(boats).total===16&&Model.counts(boats).other===24);
  boats=Model.change(5,boats,'boat',5);check('returning a boat restores equal docks',Model.complete(boats));
  boats=Model.change(5,boats,'undo');check('undo restores the exact previous docks after a return trip',boats.moved.includes(5)&&boats.moved.length===6);
  boats=Model.change(5,boats,'undo');check('consecutive undo follows move history',!boats.moved.includes(5)&&boats.moved.length===5);
  let tens=Model.change(10,build(10,Model.change(10,{...Model.fresh(10),phase:2},'each',12)),'total',120);check('ten times twelve forms twelve tens, not a digit trick',Model.expression(tens)==='12 × 10 = 120');
  let eleven=Model.change(11,build(11,Model.change(11,{...Model.fresh(11),phase:2},'each',12)),'total',132);check('eleven times twelve uses 120 plus 12',Model.expression(eleven)==='120 + 12 = 132');

  const source=fs.readFileSync('public/index.html','utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,n)=>`<script>${fs.readFileSync('public/'+n,'utf8')}</script>`);
  const errors=[],dom=new JSDOM(source,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://strategies.test/',beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};w.addEventListener('error',e=>errors.push(e.message));}}),w=dom.window,ev=s=>w.eval(s),$=id=>w.document.getElementById(id);
  function finishModel(f){if(f===5){for(const i of [0,2,4,6,8])if(!ev('state.journey.current.strategy.moved').includes(i))w.strategyAction('boat',i);}else while(!ev('FamilyLessons.complete(state.journey.current.strategy)'))w.strategyAction('act');}
  try{
    await new Promise(r=>setTimeout(r,25));
    for(const f of families){
      ev(`quiz=null;state=defaultState();migrateState();state.journey.routes=[${f}];state.journey.onboardingDone=true;`);w.beginLesson(f);
      const facts=ev('JSON.stringify(state.facts)'),realms=ev('JSON.stringify(state.realms)');
      check(`${f}: authored workshop and painted realm both present`,!!$('journey-body').querySelector(`.strategy-world-${f}`)&&!!$('journey-body').querySelector(`.ss-lesson`));
      w.startGuardianTry();check(`${f}: the check cannot be reached without the lesson`,ev('quiz')===null&&ev('state.journey.current.strategy.phase')===0);
      finishModel(f);w.strategyAction('reason',Model.plans[f].correct);w.strategyAction('next',7);check(`${f}: the plan appears before the model`,$('journey-body').querySelector('.strategy-plan')?.compareDocumentPosition($('journey-body').querySelector('.strategy-workshop'))===4);w.strategyAction('plan',Model.planFor[f].correct);check(`${f}: the prediction appears before the model`,$('journey-body').querySelector('.strategy-first')?.compareDocumentPosition($('journey-body').querySelector('.strategy-workshop'))===4);w.strategyAction('predict',Model.plans[f].prediction(7));
      if(f===5)w.strategyAction('boat',0);else w.strategyAction('act');
      const saved=ev('JSON.stringify(state)'),step=ev('JSON.stringify(state.journey.current.strategy)');ev(`state=JSON.parse(${JSON.stringify(saved)});migrateState()`);w.resumeLesson();
      check(`${f}: reload preserves exact experiment and feedback`,ev('JSON.stringify(state.journey.current.strategy)')===step);
      finishModel(f);check(`${f}: seven-item model has exact countable objects`,$('journey-body').querySelectorAll('.strategy-workshop svg').length===(f===5?70:f*7));
      check(`${f}: challenge has no displayed final answer`,$('journey-body').querySelector('.strategy-equation').textContent.endsWith('= ?')&&!$('journey-body').textContent.includes('= '+f*7));
      $('strategy-total').value=String(f*7+1);w.strategyAnswer();check(`${f}: incorrect answer leaves input and coaching`,!!$('strategy-total')&&$('strategy-feedback').textContent.length>20);
      $('strategy-total').value=String(f*7);w.strategyAnswer();w.strategyAction('next');
      w.strategyAction('each',12);finishModel(f);check(`${f}: twelve objects per original group render faithfully`,$('journey-body').querySelectorAll('.strategy-workshop svg').length===(f===5?120:f*12));
      w.strategyAction('each',0);finishModel(f);check(`${f}: zero is shown without phantom objects`,$('journey-body').querySelectorAll('.strategy-workshop svg').length===0&&$('journey-body').querySelector('.strategy-equation').textContent.endsWith('= ?'));
      $('strategy-total').value='0';w.strategyAnswer();check(`${f}: finding the zero total opens the check`,$('journey-body').querySelector('.strategy-equation').textContent.endsWith('= 0')&&!!$('journey-body').querySelector('[onclick="startGuardianTry()"]'));
      check(`${f}: guided activity never changes fact or realm evidence`,ev('JSON.stringify(state.facts)')===facts&&ev('JSON.stringify(state.realms)')===realms);
      w.startGuardianTry();check(`${f}: transfer uses four fresh untimed amounts`,ev('quiz.mode')==='lesson'&&!ev('quiz.timed')&&ev('quiz.queue.length')===4&&ev('quiz.queue').every(q=>![4,7,12,0].includes(q.b)));
      const first=ev('quiz.queue.map(q=>q.b).join()');w.quitQuiz();w.retryGuardianTry(f);check(`${f}: a retry draws a different set`,ev('quiz.queue.map(q=>q.b).join()')!==first);ev('quiz=null');
    }
    ev('quiz=null;state=defaultState();migrateState();state.journey.routes=[4];state.journey.onboardingDone=true;');w.beginLesson(4);
    check('no quick path before a related strategy is known',!$('journey-body').querySelector('.strategy-quick'));
    ev('state.journey.lessons[2]={completed:true}');w.beginLesson(4);check('a known doubling strategy offers a quick path',!!$('journey-body').querySelector('.strategy-quick')&&$('journey-body').querySelector('.strategy-quick').textContent.includes('Double River'));
    w.strategyAction('quick',7);check('the quick path starts at planning with no evidence written',ev('state.journey.current.strategy.phase')===1&&!!$('journey-body').querySelector('.strategy-plan')&&ev('Object.keys(state.facts).length')===0);
    ev('quiz=null;state.journey.routes=[5]');w.beginLesson(5);w.strategyAction('boat',1);
    check('boat labels name the destination and its complete cargo',!!$('journey-body').querySelector('[aria-label="Move boat 2, 4 crates, to Slap’s dock"]'));
    check('no browser runtime exceptions',errors.length===0);
  }finally{w.close();}
  const sw=fs.readFileSync('public/sw.js','utf8');for(const name of ['family-lessons.js','family-lesson-ui.js','family-lessons.css','learning-items.js'])check(`${name}: cached for offline launch`,sw.includes(`'./${name}'`)&&fs.existsSync('public/'+name));
  console.log(`${checks} family strategy checks passed`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
