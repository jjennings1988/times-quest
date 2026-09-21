const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),Scene=require('../public/squarestone-scene');
let checks=0;function check(name,value){assert.ok(value,name);checks++;}
const pause=()=>new Promise(r=>setTimeout(r,20));
async function main(){
  check('new visitor sees a solid ruined building',Scene.view().stage==='ruins');
  check('first star prepares the workshop',Scene.view({trial:true}).stage==='foundation');
  check('second star lights the beacon',Scene.view({conquered:true}).lit&&Scene.view({conquered:true}).stage==='restored');
  check('third star earns distinct painted decorations',Scene.view({stars:3}).stage==='celebrated');
  check('lesson preview cannot falsely complete restoration',Scene.view({context:'lesson',progress:1}).stage==='walls');
  check('revisiting a lesson preserves an earned celebration',Scene.view({context:'lesson',progress:0,stars:3}).stage==='celebrated');
  check('encounter stages are deterministic',JSON.stringify([0,1/3,2/3,1].map(progress=>Scene.view({context:'encounter',progress}).stage))==='["ruins","foundation","walls","restored"]');
  check('invalid progress is bounded',Scene.view({context:'encounter',progress:NaN}).stage==='ruins'&&Scene.view({context:'encounter',progress:9}).stage==='restored');
  check('all six production assets exist',Scene.assets.every(p=>fs.existsSync(path.join(__dirname,'../public',p))));
  const bytes=Scene.assets.reduce((n,p)=>n+fs.statSync(path.join(__dirname,'../public',p)).size,0);
  check('entire realm scene stays below 1.2 MB compressed',bytes<1200000);
  const css=fs.readFileSync(path.join(__dirname,'../public/squarestone-scene.css'),'utf8');
  check('reduced-motion, calm, and hidden screens stop the animations',css.includes('prefers-reduced-motion:reduce')&&css.includes('body.reduce-motion')&&css.includes('.screen:not(.active)'));
  const sw=fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8');
  check('targeted realm warming includes all the restoration stages',sw.includes('if(f===4)assets.push(...SQUARESTONE_ART)')&&sw.includes("'celebrated'"));
  const source=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,n)=>`<script>${fs.readFileSync(path.join(__dirname,'../public',n),'utf8')}</script>`);
  const errors=[],dom=new JSDOM(source,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://squarestone.test/',beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};w.addEventListener('error',e=>errors.push(e.message));const original=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>original(fn,Math.min(ms,4),...args);}});
  const w=dom.window,ev=s=>w.eval(s),$=id=>w.document.getElementById(id);
  try{
    await pause();ev('state=defaultState();migrateState();state.journey.routes=[4];state.journey.onboardingDone=true;');
    const before=ev('JSON.stringify(state)');w.openRealm(4);
    check('viewing the scene does not mutate a profile',ev('JSON.stringify(state)')===before);
    check('realm replaces the generic SVG with the painted scene',!!$('realm-body').querySelector('.ss-ruins')&&!$('realm-body').querySelector('.guardian-landmark'));
    check('realm scene has an accessible description', $('realm-body').querySelector('figure').getAttribute('aria-label').includes('watchtower waiting'));
    check('initial scene has a direct learning action',!!$('realm-body').querySelector('.ss-story-action[onclick="startLearn(4)"]'));
    ev('state.realms[4].trial=true;');w.openRealm(4);
    check('challenge success prepares construction and directs to the guardian',!!$('realm-body').querySelector('.ss-foundation')&&!!$('realm-body').querySelector('.ss-story-action[onclick="startBoss(4)"]'));
    w.startBoss(4);const layer=$('guardian-restoration-scene');
    check('encounter has a compact painted scene',!!layer.querySelector('.ss-encounter.ss-ruins'));
    const old=layer.firstElementChild;w.updateBossBattleUI();check('same stage does not replace decoded art or restart animation',old===layer.firstElementChild);
    for(const [p,stage]of [[1/3,'foundation'],[2/3,'walls'],[1,'restored']]){
      ev(`quiz.battle.hp=quiz.battle.maxHP*(1-${p});`);w.updateBossBattleUI();
      check(`encounter visibly progresses to ${stage}`,layer.querySelector('figure').dataset.stage===stage);
    }
    w.finishQuiz();check('real encounter victory stores restoration',ev('state.realms[4].conquered'));
    w.openRealm(4);check('restored scene offers the Fact Trail',!!$('realm-body').querySelector('.ss-restored')&&!!$('realm-body').querySelector('.ss-story-action[onclick="startFactTrail(4)"]'));
    ev('state.realms[4].trailFacts=Array.from({length:12},(_,i)=>i);');w.startFactTrail(4);
    w.pressKey('4');w.pressKey('8');w.pressKey('enter');await pause();w.openRealm(4);
    check('earning the actual third star reveals celebration artwork',!!$('realm-body').querySelector('.ss-celebrated'));
    ev('state=JSON.parse(JSON.stringify(state));migrateState();');w.openRealm(4);
    check('scene progress survives save migration without a separate art save',!!$('realm-body').querySelector('.ss-celebrated'));
    w.beginLesson(4);check('revisited lesson keeps the celebrated scene',!!$('journey-body').querySelector('.ss-celebrated'));
    w.openRealm(2);check('other realm art stays on its existing renderer',!$('realm-body').querySelector('.squarestone-scene')&&!!$('realm-body').querySelector('.guardian-landmark'));
    ev('quiz=null;');w.guardianEncounterScenery();check('leaving encounter removes its scene',!$('guardian-restoration-scene'));
    check('no uncaught errors across the illustrated learning flow',errors.length===0);
    console.log(`${checks} Squarestone scene checks passed; ${bytes} bytes of new art`);
  }finally{dom.window.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
