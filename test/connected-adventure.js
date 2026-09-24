const fs=require('node:fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
const Nine=require('../public/nine-lesson'),Goals=require('../public/camp-goals'),Camp=require('../public/camp-v2');
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};
const pause=()=>new Promise(r=>setTimeout(r,25));
async function main(){
  let n=Nine.fresh();check('cannot skip the first model',Nine.change(n,'next').stage===0);
  n=Nine.change(n,'rack',6);check('a full group moves and nine stay equal',Nine.counts(n).left===36&&Nine.counts(n).moved===4);
  n=Nine.change(n,'reason','one');check('one lantern misconception cannot unlock next step',!n.reason&&Nine.change(n,'next').stage===0);
  n=Nine.change(n,'reason','group');n=Nine.change(n,'next',7);check('new amount requires a prediction',n.stage===1&&Nine.change(n,'rack',2).removed===null);
  check('prediction waits for the ten-group plan',!Nine.change(n,'predict',70).predicted);check('adding a rack is coached as a plan',!Nine.change(n,'plan',2).planned);n=Nine.change(n,'plan',0);
  n=Nine.change(n,'predict',7);check('predicting one rack instead of ten stays in coaching',!n.predicted);
  n=Nine.change(n,'predict',70);n=Nine.change(n,'rack',2);n=Nine.change(n,'total',69);check('subtracting one lantern cannot finish',!n.solved&&Nine.change(n,'next').stage===1);
  n=Nine.change(n,'total',63);n=Nine.change(n,'next');check('successful explanation opens the own-amount stage',n.stage===2&&!Nine.ready(n));
  n=Nine.change(n,'rack',1);check('exploration waits for a chosen amount',n.removed===null);
  for(let each=0;each<=12;each++){n=Nine.change(n,'each',each);check(`nine × ${each}: chosen amount is recorded as shown`,Nine.shown(n).includes(each));n=Nine.change(n,'rack',5);let c=Nine.counts(n);check(`nine × ${each}: all lanterns conserved`,c.before===c.left+c.moved&&c.left===9*each&&c.moved===each);n=Nine.change(n,'rack',5);c=Nine.counts(n);check(`nine × ${each}: undo restores ten groups`,c.left===10*each&&c.moved===0);}
  check('malformed lesson state cannot advance',Nine.normalize({v:99,stage:2}).stage===0);
  check('legacy completed manipulation keeps access to transfer',Nine.normalize(null,{step:1}).stage===2);
  {let t=Nine.change(Nine.change(Nine.change({...Nine.fresh(),stage:2,each:3},'each',6),'rack',4),'total',54);check('own amount, moved rack and total make the check ready',Nine.ready(t));}
  const save=Camp.fresh(),before=JSON.stringify(save),all=Goals.groups(Camp.catalog).flatMap(g=>g.ids);
  const buildable=Object.keys(Camp.catalog).filter(id=>!Camp.catalog[id].kitOnly);
  check('every buildable blueprint appears once; earned keepsakes stay out of the goal picker',new Set(all).size===buildable.length&&all.length===new Set(all).size&&all.every(id=>!Camp.catalog[id].kitOnly));
  check('thirteen realm keepsakes exist, one per family, and cannot be bought',Object.values(Camp.catalog).filter(d=>d.kitOnly).map(d=>d.realm).sort((a,b)=>a-b).join()===[0,1,2,3,4,5,6,7,8,9,10,11,12].join()&&Camp.unlockReason(Camp.fresh(),'keepsake4').includes('Restore'));
  check('legacy goal has a safe default',Goals.normalize(Camp.catalog,'woodland-gate')==='gate'&&!Goals.valid(Camp.catalog,'__proto__'));
  for(const type of Object.keys(Camp.catalog)){const g=Goals.view(Camp.catalog,save,type);check(`${type}: exact missing resources`,g.resources.every(r=>r.missing===Math.max(0,r.need-r.have)));}
  let g=Goals.view(Camp.catalog,save,'tent');check('placed home is not described as backpack stock',!!g.placed&&!g.kit);
  g=Goals.view(Camp.catalog,{...save,inventory:{keep:1}},'keep');check('an earned kit bypasses costs and future blueprint lock',g.kit&&g.ready&&g.remaining===0&&g.resources.every(r=>r.need===0));
  g=Goals.view(Camp.catalog,save,'keep');check('locked stone keep reports its missing challenges and stone',g.remaining===11&&g.resources.find(r=>r.key==='stone').missing===55&&!g.ready);
  g=Goals.view(Camp.catalog,{...save,gems:0,wood:20,mastered:1},'trailtent',{mastered:1,pendingGems:12});check('pending learning reward counted once',g.ready&&g.resources[0].have===12&&g.predecessor.type==='tent');
  check('planning never spends or changes save',JSON.stringify(save)===before);
  const source=fs.readFileSync('public/index.html','utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,name)=>`<script>${fs.readFileSync('public/'+name,'utf8')}</script>`);
  const errors=[],dom=new JSDOM(source,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://connected.test/',beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};w.addEventListener('error',e=>errors.push(e.message));}}),w=dom.window,ev=s=>w.eval(s),$=id=>w.document.getElementById(id);
  try{
    await pause();ev('state=defaultState();migrateState();state.journey.routes=[9];state.journey.onboardingDone=true;state.realms[9].trial=true');
    w.startBoss(9);const max=ev('quiz.battle.maxHP');
    for(const [fraction,count] of [[0,0],[1/3,1],[2/3,2],[1,3]]){ev(`quiz.battle.hp=quiz.battle.maxHP*(1-${fraction})`);w.updateBossBattleUI();check(`restoration ${count}: single forward progress agrees with art`,$('battle-health-title').textContent===`${count} of 3 stages restored`&&Math.abs(parseFloat($('battle-hp').style.width)-fraction*100)<1e-6&&Math.abs(Number($('battle-hp').parentElement.getAttribute('aria-valuenow'))-max*fraction)<1e-6);}
    ev('quiz.battle.hp=quiz.battle.maxHP;quiz.idx=2');w.nextQ();check('missing task has one prompt and an optional group model',$('encounter-task').querySelectorAll('.encounter-prompt').length===1&&!!$('encounter-task').querySelector('details')&&$('q-count').textContent.includes('Sensei'));
    ev('quiz.idx=1');w.nextQ();w.chooseEncounterSplit(5,4);check('strategy support does not reveal final answer or earn evidence',ev('quiz.queue[1].strategyUsed')&&!ev('quiz.queue[1].assisted')&&$('encounter-model').textContent.includes(`5 × ${ev('quiz.queue[1].b')}`));
    w.startPractice(9);check('ordinary practice restores its own layout',!$('screen-quiz').classList.contains('guardian-active'));
    ev('quiz=null;state.realms[9].trial=false');w.beginLesson(9);const learningBefore=ev('JSON.stringify(state.facts)');
    w.startGuardianTry();check('pilot cannot skip into independent questions',ev('quiz')===null);
    w.nineAction('rack',4);w.nineAction('reason','group');w.nineAction('next',7);w.nineAction('plan',0);w.nineAction('predict',70);w.nineAction('rack',8);
    const saved=ev('JSON.stringify(state)');ev(`state=JSON.parse(${JSON.stringify(saved)});migrateState()`);w.resumeLesson();
    check('resume retains the rack and unsolved seven-groups task',ev('state.journey.current.nine.removed')===8&&!!$('nine-total')&&!$('journey-body').textContent.includes('= 63'));
    check('storage contains exactly one full group and total object count is conserved',$('journey-body').querySelectorAll('.nine-storage svg').length===7&&$('journey-body').querySelectorAll('.nine-lanterns svg').length===70);
    w.nineAction('total',69);check('wrong answer retains coaching',!!$('nine-total')&&$('nine-feedback').textContent.includes('storage'));
    w.nineAction('total',63);w.nineAction('next');w.nineAction('each',0);w.nineAction('rack',1);
    check('own-amount total stays hidden until the child finds it',$('journey-body').textContent.includes('Find their total'));w.nineAction('total',0);
    check('zero explorer distinguishes nine empty groups',$('journey-body').querySelectorAll('.nine-racks button').length===10&&$('journey-body').querySelectorAll('.nine-lanterns svg').length===0&&$('journey-body').textContent.includes('9 equal groups × 0 = 0'));
    check('guided pilot neither earns a star nor changes fact evidence',!ev('state.realms[9].trial')&&ev('JSON.stringify(state.facts)')===learningBefore);
    w.startGuardianTry();check('four fresh questions are untimed and not marked assisted',ev('quiz.queue.length')===4&&!ev('quiz.timed')&&ev('quiz.queue.every(q=>!q.assisted)'));
    ev('quiz=null;state.campV2=CampV2.fresh()');w.showCampGoalPicker();check('picker offers every blueprint, including locked goals',$('card-modal-body').querySelectorAll('[data-goal]').length===Object.keys(Camp.catalog).filter(id=>!Camp.catalog[id].kitOnly).length&&!$('card-modal-body').querySelector('[data-goal="keep"]').disabled);
    w.pinCampGoal('keep');w.openGoalRealm();check('a locked project opens an available realm to work toward',ev('unlockedFamilies().includes(activeRealm)')&&!ev('state.realms[activeRealm].trial'));
    const campBefore=ev('JSON.stringify(state.campV2)');w.pinCampGoal('keep');check('pinning changes only the goal',ev('state.journey.goal')==='keep'&&ev('JSON.stringify(state.campV2)')===campBefore);
    w.pinCampGoal('__proto__');check('unknown blueprint cannot become a goal',ev('state.journey.goal')==='keep');
    ev('state=JSON.parse(JSON.stringify(state));migrateState()');check('goal persists through reload',ev('state.journey.goal')==='keep');
    ev('state.campV2=CampV2.fresh();state.campV2.wood=0;state.journey.pendingGems=12;state.journey.zeroKit=true;state.journey.zeroKitDelivered=false');
    const projectedBefore=ev('JSON.stringify(state)'),projected=w.campGoalView('trailtent');
    check('undelivered renovation kit is already shown as owned',projected.kit&&projected.ready);
    check('goal projection does not claim kit or supplies',ev('JSON.stringify(state)')===projectedBefore);
    const supplyProjection=w.campGoalView('stonehome');w.deliverCampGrants();
    check('projected supplies exactly match delivered wood, stone and gems',supplyProjection.resources.every(r=>r.have===ev('state.campV2')[r.key]));
    ev('state.campV2={v:999}');const damaged=ev('JSON.stringify(state.campV2)');
    check('damaged camp cannot block a learning result goal card',w.campGoalMarkup().includes('Open camp recovery')&&ev('JSON.stringify(state.campV2)')===damaged);
    const host=w.document.createElement('div');w.document.body.append(host);
    let camp=w.CampV2.syncProgress(w.CampV2.fresh(),1),focusCalls=0;
    const options={getSave:()=>camp,setSave:s=>camp=s,profileId:'test',currentProfileId:()=> 'test',avatar:'',reducedMotion:()=>true,onExit(){},onPractice(){},loadScene:async()=>({createScene(){return {resize(){},render(){},thumbnail(){return null;},focus(){focusCalls++;},cell(){return {x:0,y:0};},project(){return {x:0,y:0};},stats:()=>({}),dispose(){}};}})};
    const controller=w.CampV2.mount(host,options);
    try{
      await pause();const wallet=[camp.gems,camp.wood,camp.stone].join(','),objects=JSON.stringify(camp.objects);
      controller.openGoal('trailtent');
      check('ready goal previews renovation with its stable object identity',host.querySelector('.cv2-placement').textContent.includes('UPGRADE')&&!host.querySelector('.cv2-placement').textContent.includes('4, 3'));
      check('preview changes neither supplies nor placed objects',[camp.gems,camp.wood,camp.stone].join(',')===wallet&&JSON.stringify(camp.objects)===objects);
      host.querySelector('[data-action="cancel"]').click();
      check('cancelling goal preview is free',[camp.gems,camp.wood,camp.stone].join(',')===wallet&&!camp.construction);
      controller.openGoal('keep');check('locked goal gives guidance instead of an actionable preview',!host.querySelector('.cv2-placement')&&host.querySelector('.cv2-announcement').textContent.includes('10 more Realm Challenges'));
      controller.openGoal('trailtent');host.querySelector('[data-action="confirm"]').click();
      check('confirm charges the displayed renovation once',camp.gems===108&&camp.wood===8&&camp.objects.find(o=>o.id==='o1').type==='trailtent'&&camp.objects.length===7);
      controller.openGoal('trailtent');check('built goal focuses the existing object',focusCalls>0&&!host.querySelector('.cv2-placement')&&camp.gems===108);
      controller.dispose();camp={...camp,construction:null,mastered:13,gems:0};
      const gathering=w.CampV2.mount(host,options);
      try{gathering.openGoal('stonehome');check('missing supplies give direct gathering and store actions',!!host.querySelector('[aria-label="Supplies for my project"] [data-source]')&&!!host.querySelector('[aria-label="Supplies for my project"] [data-location="store"]'));}finally{gathering.dispose();}
    }finally{controller.dispose();host.remove();}
    check('no runtime errors',errors.length===0);
  }finally{w.close();}
  console.log(`${checks} connected adventure checks passed`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
