const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom');
const Camp=require('../public/camp-v2');
const Guide=require('../public/camp-guide');
let checks=0;
function check(name,value){assert.ok(value,name);checks++;}
async function main(){
  const source=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,name)=>`<script>${fs.readFileSync(path.join(__dirname,'../public',name),'utf8')}</script>`);
  const errors=[],dom=new JSDOM(source,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://opening.test/',beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.addEventListener('error',e=>errors.push(e.message));const original=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>original(fn,Math.min(ms,4),...args);}});
  const w=dom.window,ev=x=>w.eval(x),$=id=>w.document.getElementById(id),pause=()=>new Promise(r=>setTimeout(r,20));
  const answer=async n=>{w.pressKey('back');for(const d of String(n))w.pressKey(d);w.pressKey('enter');await pause();};
  try{
    await pause();check('first visit shows the illustrated title', $('screen-title').classList.contains('active')&&$('screen-title').textContent.includes('Build your world'));
    w.openProfileChooser();w.renderProfileGate('create');$('profile-name').value='Opening Test';await w.createProfile();
    check('new profile uses modest opening camp without creating it prematurely',ev('state.journey.openingEdition')&&!ev('state.campV2'));
    check('new invitation begins at zero', $('journey-body').innerHTML.includes('beginLesson(0)')&&!ev('unlockedFamilies().includes(2)'));
    w.beginLesson(0);check('zero lesson starts with three inspectable baskets',w.document.querySelectorAll('[aria-label^="Inspect basket"]').length===3);
    w.advanceZeroLesson();check('cannot skip basket inspection',!ev('state.journey.current.zeroStep'));
    w.inspectZeroBasket(0);w.inspectZeroBasket(0);check('repeated inspection counts once',ev('state.journey.current.opened.length')===1);
    w.inspectZeroBasket(1);w.inspectZeroBasket(2);w.advanceZeroLesson();check('second arrangement begins with nonempty groups',ev('state.journey.current.groups')===3&&$('journey-body').textContent.includes('12'));
    w.advanceZeroLesson();check('cannot skip removing nonempty groups',ev('state.journey.current.zeroStep')==='remove');w.removeZeroBasket();
    const saved=JSON.stringify(ev('state'));ev(`state=JSON.parse(${JSON.stringify(saved)});migrateState()`);w.resumeLesson();check('reloaded lesson preserves exact manipulation state',ev('state.journey.current.groups')===2&&ev('state.journey.current.zeroStep')==='remove');
    w.removeZeroBasket();w.removeZeroBasket();w.advanceZeroLesson();check('comparison distinguishes empty baskets and absent baskets', $('journey-body').textContent.includes('3 × 0')&&$('journey-body').textContent.includes('0 × 4'));
    w.startZeroTry();check('opening challenge has three untimed independent problems',ev('quiz.queue.length')===3&&ev('quiz.needCorrect')===3&&!ev('quiz.timed'));
    w.showQuestionHelp();w.dismissHint();await answer(0);await answer(0);await answer(0);
    check('supported completion does not grant the first challenge star',!ev('state.realms[0].trial')&&!ev('canStartBoss(0)'));
    w.startZeroTry();await answer(0);await answer(0);await answer(0);
    check('three independent discoveries grant challenge access',ev('state.realms[0].trial')&&ev('canStartBoss(0)'));
    w.startBoss(0);check('opening encounter uses three-success target',ev('quiz.battle.maxHP')===3&&!!$('zero-fog-scene'));
    await answer(0);check('independent answer lights a marsh lantern',w.document.querySelectorAll('.marsh-lights .lit').length===1);
    await answer(0);await answer(0);
    check('opening victory immediately opens One Woods',ev('quiz')===null&&ev('state.realms[0].conquered')&&ev('currentFamily()')===1);
    check('victory offers a useful camp renovation',ev('state.journey.zeroKit')&&$('results-body').textContent.includes('Make my tent cozy'));
    ev('state.campV2=CampV2.freshExpedition()');w.deliverCampGrants();check('first reward delivers one renovation kit',ev('state.campV2.inventory.trailtent')===1);
    const balance=ev('state.campV2.gems');w.deliverCampGrants();check('reward cannot be reclaimed',ev('state.campV2.inventory.trailtent')===1&&ev('state.campV2.gems')===balance);
    let camp=JSON.parse(JSON.stringify(ev('state.campV2')));camp=Camp.syncProgress(camp,1);const before=JSON.stringify(camp),tent=camp.objects.find(o=>o.type==='tent');
    let result=Camp.command(camp,{kind:'upgrade',id:tent.id,x:tent.x,y:tent.y});
    check('free renovation consumes its kit and preserves instance identity',result.ok&&result.save.inventory.trailtent===0&&result.save.objects.find(o=>o.id===tent.id).type==='trailtent'&&result.save.gems===camp.gems&&result.save.wood===camp.wood);
    check('renovation leaves the input save intact',JSON.stringify(camp)===before);check('renovation and construction survive reload',Camp.validSave(JSON.parse(JSON.stringify(result.save)))&&result.save.construction.objectId===tent.id);
    check('free meadow remains available without chopping',Camp.buildable(camp,-8,-3)&&Camp.placementReason(camp,'path',-8,-3)==='');
    check('protected garden remains protected',Camp.placementReason(camp,'path',-5,2).includes('Story Stones'));
    const land=Guide.land(camp,Camp.content);check('land guidance distinguishes clearing trees from unlocking land',land.includes('does not unlock locked land')&&land.includes('Homestead Meadow'));
    check('upgrade preview has distinct first three shelter stages',Guide.upgrades(camp,Camp.catalog,()=>'',Camp.unlockReason).includes('Cozy Pup Tent'));
    const legacy=Camp.fresh(),snapshot=JSON.stringify(legacy);Camp.syncProgress(legacy,1);check('existing starter camps retain their money and furnishings',JSON.stringify(legacy)===snapshot&&legacy.gems===120&&legacy.objects.length===7);
    const fresh=Camp.freshExpedition();check('new starter is modest and valid',fresh.gems===30&&fresh.objects.length===2&&Camp.validSave(fresh));
    w.showTitle();check('return title preserves child identity and progression', $('screen-title').textContent.includes('Opening Test')&&ev('state.realms[0].conquered'));
    check('no uncaught errors across the complete expedition',errors.length===0);
    console.log(`${checks} opening expedition checks passed`);
  }finally{dom.window.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
