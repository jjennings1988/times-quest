/* Behavioral regressions for the comparison camp and learning trust fixes. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const C=require('../public/camp-v2');
let count=0;
function test(name,fn){fn();count++;console.log('  ok  '+name);}
const copy=s=>JSON.parse(JSON.stringify(s));
test('starter clearing has valid, separate supplies',()=>{const a=C.fresh(),b=C.fresh();assert(C.validSave(a));a.gems=0;assert.equal(b.gems,120);});
test('solid objects can sit on a deck',()=>{const s=C.fresh();s.objects.push({id:'deck-test',type:'deck',x:1,y:1,r:0});assert.equal(C.placementReason(s,'lantern',1,1),'');});
test('duplicate surface tiles and overlapping solids are refused',()=>{const s=C.fresh();assert(C.placementReason(s,'path',5,4));assert(C.placementReason(s,'pine',3,2));});
test('rotation changes rectangular footprints',()=>{assert.deepEqual(C.footprint('bench',1),{w:1,h:2});assert.deepEqual(C.footprint('bench',0),{w:2,h:1});});
test('invalid placement has no financial or layout side effects',()=>{const s=C.fresh(),before=copy(s);const r=C.command(s,{kind:'place',type:'tent',x:11,y:9});assert(!r.ok);assert.deepEqual(s,before);});
test('backpack placement uses stock instead of charging gems',()=>{const s=C.fresh(),r=C.command(s,{kind:'place',type:'path',x:1,y:1});assert(r.ok);assert.equal(r.save.gems,s.gems);assert.equal(r.save.inventory.path,7);assert.equal(s.inventory.path,8);});
test('gathering is bounded and learning replenishes fallen wood',()=>{let s=C.fresh();const r=C.command(s,{kind:'gather',source:0});assert(r.ok);s=r.save;assert.equal(s.wood,13);assert(!C.command(s,{kind:'gather',source:0}).ok);s=C.awardLearning(s,8);assert.equal(s.gems,128);assert(C.command(s,{kind:'gather',source:0}).ok);});
test('insufficient supplies cannot create an upgrade',()=>{const s=C.fresh();s.gems=0;assert(!C.command(s,{kind:'upgrade',id:'o1',x:3,y:2}).ok);assert.equal(s.objects[0].type,'tent');});
test('three-stage shelter upgrades preserve instance identity and spend atomically',()=>{const s=C.syncProgress(C.fresh(),3);const r=C.command(s,{kind:'upgrade',id:'o1',x:3,y:2});assert(r.ok);assert.equal(r.save.objects[0].type,'canvas');assert.equal(r.save.gems,75);assert.equal(r.save.wood,5);assert.equal(s.objects[0].type,'tent');});
test('storing and re-placing retains ownership without buying another item',()=>{let s=C.fresh();s=C.command(s,{kind:'store',id:'o1'}).save;assert.equal(s.inventory.tent,1);let r=C.command(s,{kind:'place',type:'tent',x:3,y:2});assert(r.ok);assert.equal(r.save.inventory.tent,0);assert.equal(r.save.gems,120);});
test('stale commands are refused',()=>{const s=C.fresh();assert(!C.command(s,{kind:'gather',source:0,revision:99}).ok);});
test('routing avoids objects and returns no route into a solid',()=>{const s=C.fresh();assert.equal(C.route(s,s.explorer,{x:3,y:2}),null);const p=C.route(s,s.explorer,{x:2,y:1});assert(p&&p.length>0);assert(p.every(c=>!(c.x>=3&&c.x<5&&c.y>=2&&c.y<4)));});
test('builder protects the explorer and activity access',()=>{const s=C.fresh();assert(C.placementReason(s,'fence',6,7));s.objects=s.objects.filter(o=>o.type!=='tent'&&o.type!=='pine'&&o.type!=='feeder');s.objects.push({id:'f1',type:'fence',x:4,y:7,r:0},{id:'f2',type:'fence',x:6,y:6,r:0},{id:'f3',type:'fence',x:3,y:6,r:0});assert(C.placementReason(s,'fence',4,5).includes('route'));});
test('completed project rewards cannot be farmed by removing and rebuilding',()=>{let s=C.fresh();for(const p of [[1,1],[2,1],[3,1]])s=C.command(s,{kind:'place',type:'path',x:p[0],y:p[1]}).save;assert(s.projects.includes('trail'));const before=s.gems,o=s.objects.find(o=>o.type==='path');s=C.command(s,{kind:'store',id:o.id}).save;s=C.command(s,{kind:'place',type:'path',x:o.x,y:o.y}).save;assert.equal(s.gems,before);});
test('JSON reload preserves objects, projects, inventory and balance',()=>{const s=C.command(C.fresh(),{kind:'gather',source:1}).save;const reloaded=copy(s);assert(C.validSave(reloaded));assert.deepEqual(reloaded,s);});
test('future or damaged saves are refused without mutation',()=>{const s=C.fresh();s.v=999;const before=copy(s);assert(!C.command(s,{kind:'gather',source:0}).ok);assert.deepEqual(s,before);const bad=C.fresh();bad.objects[1].id=bad.objects[0].id;assert(!C.validSave(bad));});

(async()=>{
  const root=path.join(__dirname,'../public');
  const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,name)=>`<script>${fs.readFileSync(path.join(root,name),'utf8')}</script>`);
  const dom=new JSDOM(source,{url:'https://camp-test.invalid',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};}});
  const w=dom.window,e=code=>w.eval(code);await new Promise(r=>setTimeout(r,80));
  e("state=defaultState();state.settings.calm=true;state.settings.sound=false;state.campReturned=[];activeProfileId='test-a';profileBook={v:1,active:'test-a',profiles:[{id:'test-a',name:'A',avatar:0}]};");
  test('camp reviews use unlocked facts and preserve the main quiz session',()=>{const data=e("(()=>{quiz={mode:'practice',retry:true,idx:7};const before=JSON.stringify(quiz),qs=campReviewQuestions();recordCampReview({a:2,b:7,correct:false,firstTry:true});const missed=JSON.stringify(fact(2,7));recordCampReview({a:2,b:7,correct:true,firstTry:false});return {sameQuiz:before===JSON.stringify(quiz),sameFact:missed===JSON.stringify(fact(2,7)),valid:qs.length===3&&qs.every(q=>unlockedFamilies().includes(q.a)||unlockedFamilies().includes(q.b))};})()");assert(data.sameQuiz);assert(data.sameFact);assert(data.valid);});
  test('camp milestones count completed trials once without speed-star requirements',()=>{const n=e("(()=>{state.realms[0].trial=true;state.realmRewardStars[0]=3;state.realms[1].trial=true;return campMasteredCount();})()");assert.equal(n,2);e('state=defaultState();state.settings.calm=true;state.settings.sound=false;state.campReturned=[];');});
  test('five same-day retrievals remain a one-day schedule',()=>{const f=e("(()=>{quiz={mode:'practice',retry:false};const f=fact(2,3);for(let i=0;i<5;i++)scheduleRetrieval({a:2,b:3},f,true,true);return f;})()");assert.equal(f.intervalDays,1);assert.equal(f.reviewStreak,1);assert.equal(f.retentionSpanDays,0);});
  test('a due, slow, later-day success advances its interval',()=>{const f=e("(()=>{const f=fact(2,4);f.last=addDays(dateKey(),-1);f.dueOn=dateKey();f.intervalDays=1;scheduleRetrieval({a:2,b:4},f,true,false);return f;})()");assert.equal(f.intervalDays,2);assert.equal(f.retentionSpanDays,1);});
  test('correcting a lapse today cannot lengthen the interval again',()=>{const f=e("(()=>{const f=fact(2,5);scheduleRetrieval({a:2,b:5},f,false,false);scheduleRetrieval({a:2,b:5},f,true,true);return f;})()");assert.equal(f.intervalDays,1);assert.equal(f.lastRetrievalOk,false);});
  test('captured creatures and claimed third stars remain earned',()=>{e("fact(3,4).rating=4;migrateFactSchedule(fact(3,4));fact(3,4).rating=2;state.realmRewardStars[0]=3;");assert.equal(e('factRating(3,4)'),4);assert.equal(e('realmStars(0).stars'),3);});
  test('returning after a gap does not charge gems',()=>{e("state.lastPlayed=new Date(Date.now()-4*DAY_MS).toDateString();state.gems=100;checkDaily();");assert.equal(e('state.gems'),100);});
  test('V1 upgrade undo restores money, inventory, and old placed object together',()=>{e("state.gems=100;state.realms[0].conquered=true;state.bought={'fire-1':1};state.placed=[{t:'fire-1',x:12,y:4}];heldPiece=null;completeCampUpgrade(pieceById('fire-1'),pieceById('fire-2'),0,12,4);undoCampAction();");assert.equal(e('state.gems'),100);assert.equal(e("state.bought['fire-1']"),1);assert.equal(e("state.bought['fire-2']"),undefined);assert.equal(e('state.placed[0].t'),'fire-1');});
  test('V1 undo cannot apply to a different child',()=>{e("rememberCampUndo();activeProfileId='test-b';state=defaultState();state.campReturned=[];state.placed=[];undoCampAction();");assert.equal(e('state.placed.length'),0);assert.equal(e('campUndo'),null);});
  test('V2 rewards leave V1 inventory and gems untouched',()=>{e("state=defaultState();state.campV2=CampV2.fresh();state.gems=37;state.campV2=CampV2.awardLearning(state.campV2,16);");assert.equal(e('state.gems'),37);assert.equal(e('state.campV2.gems'),136);assert.equal(e('state.placed.length'),0);});
  test('timer-off, slow answers can catch creatures',()=>{e("state.settings.timer=false;state.settings.sound=false;state.settings.calm=true;fact(2,3).rating=3;startQuiz({mode:'practice',fams:[2],queue:[{a:2,b:3,text:'2 × 3',ans:6}],timed:true});qStart=performance.now()-15000;quiz.answer='6';checkAnswer();");assert.equal(e('quiz.timed'),false);assert.equal(e('factRating(2,3)'),4);});
  test('finishing the learning round credits Camp 2 and restores resource opportunities',()=>{e("state.campV2.harvested=[0,1];finishQuiz();");assert.equal(e('state.campV2.gems'),137);assert.equal(e('state.campV2.harvested.length'),0);});
  e("showScreen('screen-camp-v2')");
  await new Promise(resolve=>setTimeout(resolve,40));
  test('an unavailable 3D module retains the save and exposes accessible camp controls',()=>{assert(w.document.querySelector('#screen-camp-v2').textContent.includes('3D is unavailable'));assert(w.document.querySelector('[data-action="v1"]'));assert(w.document.querySelector('[data-action="bag"]'));assert.equal(e('state.campV2.gems'),137);});
  test('fence brush places repeatedly without reopening the catalogue and undo refunds one piece',()=>{
    const click=selector=>w.document.querySelector(selector).click();const before=e('state.campV2.objects.length'),stock=e('state.campV2.inventory.fence');
    click('[data-type="fence"]');assert(w.document.querySelector('.cv2-brush'));click('[data-action="confirm"]');assert.equal(e('state.campV2.objects.length'),before+1);assert(w.document.querySelector('.cv2-brush'));assert(w.document.querySelector('[data-action="confirm"]').disabled);
    click('[data-action="nudge-w"]');click('[data-action="confirm"]');assert.equal(e('state.campV2.objects.length'),before+2);assert.equal(e('state.campV2.inventory.fence'),stock-2);
    click('[data-action="undo"]');assert.equal(e('state.campV2.objects.length'),before+1);assert.equal(e('state.campV2.inventory.fence'),stock-1);click('[data-action="cancel"]');assert(!w.document.querySelector('.cv2-brush'));
  });
  test('guardian grove keeps unearned guardians locked and offers no practice shortcut',()=>{w.document.querySelector('[data-action="journal"]').click();w.document.querySelector('[data-location="sanctuary"]').click();assert.equal(w.document.querySelectorAll('[data-guardian]').length,13);assert(w.document.querySelector('[data-guardian="7"]').disabled);assert(!w.document.querySelector('[data-action="guardian-practice"]'));});
  e("showScreen('screen-map')");
  test('leaving the fallback disposes the camp scene and its controls',()=>{assert.equal(w.document.querySelectorAll('#screen-camp-v2 canvas').length,0);assert.equal(e('campV2Session'),null);});
  dom.window.close();console.log(`Camp 2 and learning trust: ${count} passed`);
})().catch(err=>{console.error(err);process.exitCode=1;});
