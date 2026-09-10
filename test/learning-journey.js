const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const Journey=require('../public/learning-journey');
let checks=0;
function check(name,condition){assert.ok(condition,name);checks++;}
const pause=()=>new Promise(r=>setTimeout(r,18));
async function main(){
  for(let family=0;family<=12;family++){
    const lesson=Journey.lesson(family);check(`family ${family} has authored idea`,!!lesson.idea&&lesson.groups===family);
    for(let each=0;each<=12;each++)check(`explanation covers ${family}×${each}`,Journey.explanation(family,each).includes(String(family*each)));
  }
  const source=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').replace('</head>',`<style>${fs.readFileSync(path.join(__dirname,'../public/journey.css'),'utf8')}</style></head>`).replace(/<script src="([^"]+\.js)"><\/script>/g,(_,name)=>`<script>${fs.readFileSync(path.join(__dirname,'../public',name),'utf8')}</script>`);
  const errors=[];
  const dom=new JSDOM(source,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://journey.test/',beforeParse(w){
    w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.addEventListener('error',e=>errors.push(e.message));
    const original=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>original(fn,Math.min(ms,4),...args);
  }});
  const w=dom.window,ev=s=>w.eval(s),$=id=>w.document.getElementById(id);
  await pause();
  const fresh=()=>ev('quiz=null;state=defaultState();migrateState();state.journey.onboardingDone=true;');
  const answer=async (n)=>{w.pressKey('back');for(const digit of String(n))w.pressKey(digit);w.pressKey('enter');await pause();};
  try{
    check('boot has no runtime errors',errors.length===0);
    fresh();
    check('passive toast cannot intercept taps',/(?:^|\n)\.toast\{\s*pointer-events:none/.test(source));
    w.openRealm(0);const locked=$('realm-body').querySelector('[onclick="startBoss(0)"]');
    check('locked boss uses a native disabled button',locked.disabled);
    w.startBoss(0);check('dispatcher rejects a locked boss',ev('quiz')===null);
    w.startTrial(0);check('challenge rejects missing prerequisites',ev('quiz')===null);
    w.startSummit();check('summit rejects incomplete realms',ev('quiz')===null);
    w.renderMap();check('every map realm has a keyboard action',w.document.querySelectorAll('.realm-node [role="button"][tabindex="0"]').length===13);
    fresh();w.beginLesson(2);check('new child can start with meaningful doubles',ev('unlockedFamilies().includes(2)'));
    check('guided model appears before testing',!!$('journey-body').querySelector('.math-visual')&&ev('quiz')===null);
    w.lessonBuildStage();w.adjustLesson(1);w.checkLessonBuild();check('unequal group count prompts correction',ev('quiz')===null&&$('journey-feedback').textContent.includes('We need 2'));
    w.adjustLesson(1);w.checkLessonBuild();check('four independent questions follow the model',ev('quiz.queue.length')===4&&!ev('quiz.timed'));
    while(ev('quiz'))await answer(ev('quiz.queue[quiz.idx].ans'));
    check('lesson completion opens challenge without grinding ten catches',ev('challengeReady(2)')&&ev('realmStars(2).caught')<10);
    check('lesson gives a clear next step', $('results-body').textContent.includes('Try the Realm Challenge'));
    check('lesson, milestone, and daily expedition rewards remain pending before first camp visit',ev('state.journey.pendingGems')===23);
    check('lesson has not invented retention mastery',ev('reviewSummary().secure')===0);
    const pre=ev('state.gems');w.beginLesson(2);w.lessonBuildStage();w.adjustLesson(1);w.adjustLesson(1);w.checkLessonBuild();while(ev('quiz'))await answer(ev('quiz.queue[quiz.idx].ans'));
    check('repeating a lesson does not reaward its twelve-gem milestone',ev('state.gems')-pre===1);
    w.startTrial(2);check('challenge is six untimed questions',ev('quiz.baseTotal')===6&&ev('quiz.needCorrect')===5&&!ev('quiz.timed'));
    while(ev('quiz'))await answer(ev('quiz.queue[quiz.idx].ans'));
    check('independent challenge success enables encounter',ev('canStartBoss(2)'));
    w.startBoss(2);check('encounter has authored build split missing tasks',ev("quiz.queue.slice(0,3).map(q=>q.encounter).join(',')")==='build,split,missing');
    const needed=ev('quiz.battle.maxHP');let count=0;
    while(ev('quiz')&&count++<30)await answer(ev('quiz.queue[quiz.idx].ans'));
    check('encounter ends on the exact success that empties threat strength',count===needed&&ev('quiz')===null&&ev('state.realms[2].conquered'));
    check('victory counter reaches the same target as the battle', $('q-count').textContent===`${needed} / ${needed} restored`);
    w.showScreen('screen-map');check('inactive battle leaves the accessibility tree',w.getComputedStyle($('screen-quiz')).display==='none');
    check('Double River opens the next adventure route',ev('unlockedFamilies().includes(5)')&&ev('currentFamily()')===5);
    const pending=ev('state.journey.pendingGems');ev('state.campV2=CampV2.fresh()');const campBefore=ev('state.campV2.gems');w.deliverCampGrants();
    check('unclaimed earnings arrive at first camp opening',ev('state.campV2.gems')===campBefore+pending&&ev('state.journey.pendingGems')===0);
    const delivered=ev('state.campV2.gems');w.deliverCampGrants();check('delivery is idempotent',ev('state.campV2.gems')===delivered);
    check('Double River kit supplies usable camp objects',ev('state.campV2.inventory.path')===14&&ev('state.campV2.inventory.deck')===6&&ev('state.campV2.inventory.lantern')===2);
    const stateCopy=JSON.stringify(ev('state'));ev(`state=JSON.parse(${JSON.stringify(stateCopy)});migrateState()`);w.deliverCampGrants();check('save/reload does not redeliver rewards',ev('state.campV2.gems')===delivered);
    fresh();ev('state.realms[0].trial=true');w.startBoss(0);
    for(let i=0;i<3;i++){
      await answer(1);check(`miss ${i+1} offers mathematical feedback`,!!ev('quiz')&&$('hint-card').style.display==='block'&&$('hint-body').querySelector('.math-visual'));
      if(i<2){w.dismissHint();w.dismissHint();}else{check('last-heart correction waits for the learner',ev('quiz.failedPending'));w.dismissHint();}
    }
    check('last-heart recovery ends safely',ev('quiz')===null&&!ev('state.realms[0].conquered'));
    fresh();w.startPractice(0);ev("queueMissedFactForReview(quiz.queue[0]);queueMissedFactForReview(quiz.queue[1]);queueMissedFactForReview(quiz.queue[2]);queueMissedFactForReview(quiz.queue.at(-1))");
    check('review tail is capped at two and cannot extend itself',ev('quiz.reviewAdded')===2&&ev('quiz.queue.length')===ev('quiz.baseTotal')+2);
    w.quitQuiz();fresh();w.startQuiz({mode:'practice',fams:[7],queue:[{a:7,b:8,text:'7 × 8',ans:56}],timed:false,title:'Support check'});w.showQuestionHelp();w.dismissHint();await answer(56);
    check('helped answer does not count as independent evidence',ev("LearningJourney.evidence(state.facts['7*8']).attempts")===0);
    check('helped answer does not raise collection or retention',ev("state.facts['7*8'].rating")===0&&ev('state.reviewHistory.length')===0);
    fresh();w.startQuiz({mode:'practice',fams:[2],queue:[{a:2,b:3,text:'2 × 3',ans:6}],timed:false,title:'Calm check'});ev('qStart=performance.now()-20000');await answer(6);
    check('slow correct response is independent learning',ev("LearningJourney.evidence(state.facts['2*3']).correct")===1);
    check('slow correct response is not a weakness',ev('getWeakFacts().length')===0);
    check('calm mode does not display speed streak', $('streak-flame').hidden);
    const hint=w.MathVisuals.explain({a:12,b:3,text:'3 × ? = 36',ans:12});
    check('missing-factor help explains the actual unknown',hint.body.includes('missing amount is 12')&&hint.visual.includes('3 × <strong>12</strong> = 36'));
    const division=w.MathVisuals.explain({a:7,b:8,text:'56 ÷ 8',ans:7});check('division help retains the original operation',division.visual.includes('56 ÷ 8 = <strong>7</strong>'));
    check('nine-family copy has no false digit-sum rule',!ev('REALMS[9].strategy+REALM_LORE[9].intro').includes('digits'));
    fresh();ev("state.facts['2*3']={c:3,w:0,rating:3,slow:0,bt:700};state.facts['7*8']={c:10,w:4,rating:1,caught:true,shiny:true};");
    w.renderParent();check('parent does not diagnose slowness from collection rating',!$('parent-body').textContent.includes('Accurate but slow'));
    check('legacy collection is preserved without fabricated independent evidence',ev('factRating(7,8)')===5&&ev("LearningJourney.evidence(state.facts['7*8'])")===null);
    check('parent tools are grouped without losing controls',w.document.querySelectorAll('#parent-body details[data-parent-panel]').length===5&&!!$('family-backup-pass'));
    check('heatmap supports keyboard and named detail',w.document.querySelectorAll('button.heat-cell[aria-label]').length===169);
    fresh();w.startReadiness(8);while(ev('quiz'))await answer(ev('quiz.queue[quiz.idx].ans'));
    check('starting check opens a route without claiming a guardian victory',ev('unlockedFamilies().includes(8)')&&!ev('state.realms[8].conquered')&&ev('realmStars(8).stars')===0);
    check('starting check enables a short realm challenge',ev('challengeReady(8)'));
    fresh();w.startQuiz({mode:'practice',fams:[2],queue:[{a:2,b:3,text:'2 × 3',ans:6},{a:2,b:4,text:'2 × 4',ans:8}],timed:false,title:'Interruption check'});
    await answer(6);check('answered question and earned supply are checkpointed',ev('state.journey.resume.idx')===1&&ev('state.journey.pendingGems')===1);
    const savedRound=JSON.stringify(ev('state'));ev(`quiz=null;state=JSON.parse(${JSON.stringify(savedRound)});migrateState()`);w.resumeRound();
    check('resume starts at the next unanswered question',ev('quiz.idx')===1&&$('q-text').textContent==='2 × 4');await answer(8);
    check('resume does not duplicate earlier rewards or evidence',ev('state.gems')===2&&ev('state.journey.pendingGems')===2&&ev("LearningJourney.evidence(state.facts['2*3']).attempts")===1);
    fresh();w.startQuiz({mode:'practice',fams:[2],queue:[{a:2,b:3,text:'2 × 3',ans:6}],timed:false,title:'Interrupted correction'});await answer(7);
    const missedRound=JSON.stringify(ev('state'));ev(`quiz=null;state=JSON.parse(${JSON.stringify(missedRound)});migrateState()`);w.resumeRound();
    check('interrupted correction returns to the explanation', $('hint-card').style.display==='block'&&ev('quiz.wrong')===1);w.dismissHint();await answer(6);
    check('resumed correction remains supported',ev("LearningJourney.evidence(state.facts['2*3']).correct")===0&&ev("LearningJourney.evidence(state.facts['2*3']).supported")===1);
    w.quitQuiz();
    const legacy={v:7,gems:321,facts:{'6*7':{c:4,w:1,rating:4,caught:true}},realms:{0:{trial:true,conquered:true}},owned:['cat'],settings:{timer:true,roundLen:16}};
    ev(`state=${JSON.stringify(legacy)};migrateState()`);
    check('legacy save keeps gems, ownership and progression',ev('state.gems')===321&&ev("state.owned.includes('cat')")&&ev('state.realms[0].conquered')&&ev('state.settings.roundLen')===16);
    check('legacy camp choice and no retroactive currency windfall',ev('state.journey.preferredCamp')==='v1'&&ev('state.journey.pendingGems')===0);
    check('no uncaught runtime errors across journeys',errors.length===0);
    console.log(`${checks} learning journey checks passed`);
  }finally{dom.window.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
