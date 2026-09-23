const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const Trail=require('../public/realm-trail');
let checks=0;
function check(name,value){assert.ok(value,name);checks++;}
const pause=()=>new Promise(r=>setTimeout(r,20));
async function main(){
  check('invalid and duplicate trail entries cannot inflate progress',JSON.stringify(Trail.clean([0,0,12,13,-1,'2',null,2]))==='[0,2,12]');
  check('old three-star awards stay complete even without fact records',Trail.progress({},()=>false,3).count===13);
  for(let fam=0;fam<=12;fam++){
    const realm={conquered:true};
    for(let b=0;b<=12;b++)Trail.record(realm,b,{correct:true,independent:true});
    check(`all 13 facts are reachable for family ${fam}`,Trail.progress(realm,()=>false).count===13);
  }
  const source=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,name)=>`<script>${fs.readFileSync(path.join(__dirname,'../public',name),'utf8')}</script>`);
  const errors=[],dom=new JSDOM(source,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://trail.test/',beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};w.addEventListener('error',e=>errors.push(e.message));const original=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>original(fn,Math.min(ms,4),...args);}});
  const w=dom.window,ev=s=>w.eval(s),$=id=>w.document.getElementById(id);
  const fresh=()=>ev('quiz=null;state=defaultState();state.journey.onboardingDone=true;state.journey.routes=[2];state.journey.lessons[2]={completed:true};migrateState();');
  const twoStars=()=>{fresh();ev('state.realms[2]={trial:true,conquered:true};state.realmRewardStars[2]=2;');};
  const answer=async n=>{for(const d of String(n))w.pressKey(d);w.pressKey('enter');await pause();};
  const complete=async()=>{let guard=0;while(ev('quiz')&&guard++<40)await answer(ev('quiz.queue[quiz.idx].ans'));check('round finishes within its bounded queue',!ev('quiz'));};
  try{
    await pause();fresh();w.startFactTrail(2);check('star 3 activity cannot bypass the guardian',ev('quiz')===null);
    w.startTrial(2);check('star 1 is a six-question untimed challenge',ev('quiz.queue.length===6&&!quiz.timed&&quiz.needCorrect===5'));
    await complete();check('challenge earns exactly star 1',ev('realmStars(2).stars')===1);
    check('challenge result names the next star', $('results-body').textContent.includes('star 2'));
    w.startBoss(2);await complete();check('guardian earns exactly star 2 and opens the next realm',ev('realmStars(2).stars===2&&unlockedFamilies().includes(5)'));
    check('guardian result offers the third-star activity directly',!!$('results-body').querySelector('[onclick="startFactTrail(2)"]'));
    w.openRealm(2);check('restored realm recommends the trail rather than a rematch',$('realm-body').querySelector('.realm-next-card').textContent.includes('Earn my third star'));
    check('all 13 remaining facts are visible',$('realm-body').querySelectorAll('.fact-trail-grid li').length===13);

    fresh();w.startTrial(2);await answer(999);w.dismissHint();await answer(ev('quiz.queue[quiz.idx].ans'));await complete();
    check('five of six first attempts earn star 1 even with an earlier mistake',ev('realmStars(2).stars')===1);
    fresh();w.startTrial(2);
    for(let i=0;i<2;i++){w.showQuestionHelp();w.dismissHint();await answer(ev('quiz.queue[quiz.idx].ans'));}
    await complete();check('four independent answers plus two supported answers do not pass the five-answer challenge',ev('realmStars(2).stars')===0);

    twoStars();ev('fact(2,0).caught=true;fact(2,0).rating=1;');
    check('trail order is shuffled rather than always ascending',[1,2,3,4,5,6].some(seed=>ev(`LearningItems.trail([1,2,3,4,5,6,7,8,9,10,11,12],5,{seed:${seed}}).join()`)!=='1,2,3,4,5'));
    // An identity shuffle keeps the rest of this scenario readable.
    ev('Math.random=()=>0.9999');
    w.startFactTrail(2);check('permanent catches are credited; queue targets five different unfinished facts',ev('quiz.queue.length===5&&quiz.queue.map(q=>q.b).join() === "1,2,3,4,5"'));
    check('trail has no timer or lost lives',ev('!quiz.timed&&quiz.hearts===0'));
    await answer(2);check('one independent success checks exactly one fact',ev('factTrailProgress(2).count')===2);
    await answer(999);check('a miss cannot remove checked facts',ev('factTrailProgress(2).count')===2);
    check('help explains exactly how to finish this fact',$('hint-body').textContent.includes('another round'));
    w.dismissHint();await answer(4);check('typing the shown answer does not check the fact',ev('!state.realms[2].trailFacts.includes(2)'));
    w.showQuestionHelp();check('help state is saved before an answer',ev('state.journey.resume.queue[state.journey.resume.idx].assisted'));
    ev('state=JSON.parse(JSON.stringify(state));migrateState();quiz=null;');w.resumeRound();
    check('refresh resumes at the supported question with help still open',$('hint-card').style.display==='block'&&ev('quiz.queue[quiz.idx].b===3'));
    w.dismissHint();await answer(6);check('reloaded help cannot become independent credit',ev('!state.realms[2].trailFacts.includes(3)'));
    await complete();check('results state exact checked and remaining totals',$('results-body').textContent.includes('4/13 checked')&&$('results-body').textContent.includes('9 left'));
    w.startFactTrail(2);check('next round includes misses and excludes completed facts',ev('quiz.queue.map(q=>q.b).join()')==='2,3,6,7,8');
    await answer(4);w.quitQuiz();check('deliberate exit saves the successful check',ev('factTrailProgress(2).count')===5);
    ev('state=JSON.parse(JSON.stringify(state));migrateState();');w.startFactTrail(2);
    check('reload does not repeat an already checked fact',ev('quiz.queue[0].b')===3);
    await complete();w.startFactTrail(2);check('last round shrinks to the remaining three facts',ev('quiz.queue.length')===3);
    await complete();check('trail completion grants star 3 without requiring 13 caught monsters',ev('realmStars(2).stars===3&&realmStars(2).caught<13'));
    check('third star receives a clear celebration',$('results-body').textContent.includes('Third star earned!'));
    const balance=ev('state.gems'),pending=ev('state.journey.pendingGems');
    ev('claimRealmStarRewards(2);migrateState();');w.startFactTrail(2);
    check('reopening complete trail cannot repeat the reward',ev('state.gems')===balance&&ev('state.journey.pendingGems')===pending&&ev('quiz')===null);
    check('new star migration does not convert remaining monsters to caught',ev('realmStars(2).caught')<13);
    check('third-star UI and ledger agree after reload',ev('realmProgress(2).steps.every(s=>s.done)'));

    twoStars();ev('state.realms[2].trailFacts=Array.from({length:12},(_,i)=>i);state.campV2=CampV2.freshExpedition();');
    const campBefore=ev('state.campV2.gems'),reward=ev('REALM_GEM_REWARDS[2][2]');
    w.startFactTrail(2);check('last missing fact is always offered immediately',ev('quiz.queue.length===1&&quiz.queue[0].b===12'));
    w.pressKey('2');w.pressKey('4');w.pressKey('enter');w.quitQuiz();await pause();
    check('leaving during final feedback still saves and pays the star once',ev('state.realmRewardStars[2]===3&&state.journey.pendingGems===0')&&ev('state.campV2.gems')===campBefore+reward+1);
    const after=ev('state.campV2.gems');w.deliverCampGrants();check('camp cannot redeem the milestone twice',ev('state.campV2.gems')===after);

    twoStars();ev('state.realms[2].trailFacts=Array.from({length:12},(_,i)=>i);state.campV2=CampV2.freshExpedition();');
    w.startFactTrail(2);w.pressKey('2');w.pressKey('4');w.pressKey('enter');
    const completedSave=ev('JSON.stringify(state)');
    ev(`quiz=null;state=JSON.parse(${JSON.stringify(completedSave)});migrateState();`);w.resumeRound();await pause();
    check('reload during the final feedback restores the completed round and celebration',ev('quiz===null&&state.realmRewardStars[2]===3')&&$('results-body').textContent.includes('Third star earned!'));
    check('reloaded completion delivers the star and answer once without an unearned daily bonus',ev('state.campV2.gems')===campBefore+reward+1);

    twoStars();ev('state.v=7;state.realmRewardStars[2]=3;fact(2,5).rating=1;migrateState();');
    check('legacy three-star ownership and creatures are preserved',ev('state.v===8&&realmStars(2).stars===3&&fact(2,5).caught'));
    check('legacy saved stars display three completed steps',ev('realmProgress(2).steps.every(s=>s.done)'));
    fresh();check('a different profile cannot inherit trail checks',ev('factTrailProgress(2).count')===0);
    check('no uncaught errors through the star journey',errors.length===0);
    console.log(`${checks} realm trail checks passed`);
  }finally{dom.window.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
