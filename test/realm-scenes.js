const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),vm=require('node:vm');
const {JSDOM}=require('jsdom'),Scenes=require('../public/realm-scenes');
const manifest=require('../art-source/realm-scenes-v2/manifest.json');
let checks=0;function check(name,value){assert.ok(value,name);checks++;}
const families=Object.keys(Scenes.definitions).map(Number),pause=()=>new Promise(r=>setTimeout(r,25));
async function main(){
  check('twelve scenes accompany the preserved Squarestone pilot',families.length===12&&!families.includes(4));
  check('unsupported family has no fabricated scene',Scenes.view(99)===null);
  for(const f of families){
    const before=JSON.stringify(Scenes.definitions[f]);
    check(`${f}: five earned states use distinct art`,new Set([{}, {trial:true},{context:'encounter',progress:2/3},{conquered:true},{stars:3}].map(p=>Scenes.view(f,p).src)).size===5);
    check(`${f}: existing stars preserve celebration`,Scenes.view(f,{stars:3}).stage==='celebrated');
    check(`${f}: lesson cannot award restoration`,Scenes.view(f,{context:'lesson',progress:1}).stage==='walls');
    check(`${f}: revisiting lessons keeps earned restoration`,Scenes.view(f,{context:'lesson',stars:3}).stage==='celebrated');
    check(`${f}: malformed progress bounded`,Scenes.view(f,{context:'encounter',progress:NaN}).stage==='ruins'&&Scenes.view(f,{context:'encounter',progress:9}).stage==='restored');
    check(`${f}: every asset shipped`,Scenes.assets(f).every(p=>fs.existsSync(path.join(__dirname,'../public',p))));
    check(`${f}: compressed art budget under 750 KB`,Scenes.assets(f).reduce((n,p)=>n+fs.statSync(path.join(__dirname,'../public',p)).size,0)<750000);
    const markup=Scenes.markup(Scenes.view(f));
    check(`${f}: accessible caption and retained fallback`,markup.includes('aria-label="'+Scenes.definitions[f].name)&&markup.includes(`bg-battle-x${f}-portrait.webp`)&&markup.includes('onerror="this.hidden=true"'));
    check(`${f}: view leaves content unchanged`,before===JSON.stringify(Scenes.definitions[f]));
  }
  // Execute the real service worker's targeted warming contract.
  const events={},cached=new Set(),cache={match:async p=>cached.has(p),add:async p=>cached.add(p),addAll:async paths=>paths.forEach(p=>cached.add(p))};
  const sandbox={self:{addEventListener:(name,fn)=>events[name]=fn},caches:{open:async()=>cache},URL,Promise,location:{origin:'https://scenes.test'}};
  const sw=fs.readFileSync(path.join(__dirname,'../public/sw.js'),'utf8');vm.runInNewContext(sw,sandbox);
  let work;events.install({waitUntil:p=>work=p});await work;
  check('painted frame downloads do not block shell installation',![...cached].some(p=>p.includes('/scenes/')));
  for(const f of families){cached.clear();events.message({data:{type:'WARM_REALM',family:f},waitUntil:p=>work=p});await work;
    check(`${f}: targeted offline warm includes every frame`,Scenes.assets(f).every(p=>cached.has('./'+p)));
    check(`${f}: targeted warm excludes other painted realms`,[...cached].filter(p=>p.includes('/scenes/')).length===6);
  }
  const source=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,n)=>`<script>${fs.readFileSync(path.join(__dirname,'../public',n),'utf8')}</script>`);
  const errors=[],dom=new JSDOM(source,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://realms.test/',beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};w.addEventListener('error',e=>errors.push(e.message));const original=w.setTimeout.bind(w);w.setTimeout=(fn,ms,...args)=>original(fn,Math.min(ms,4),...args);}});
  const w=dom.window,ev=s=>w.eval(s),$=id=>w.document.getElementById(id);
  try{
    await pause();
    for(const f of families){
      ev(`quiz=null;state=defaultState();migrateState();state.journey.routes=[${f}];state.journey.onboardingDone=true;`);
      const save=ev('JSON.stringify(state)');w.openRealm(f);
      check(`${f}: opening realm does not change save`,ev('JSON.stringify(state)')===save);
      check(`${f}: painted hero replaces primitive landmark`,!!$('realm-body').querySelector(`.painted-realm-scene[data-family="${f}"].ss-ruins`)&&!$('realm-body').querySelector('svg.guardian-landmark'));
      check(`${f}: next action starts own lesson`,!!$('realm-body').querySelector(`[onclick="startLearn(${f})"]`));
      w.beginLesson(f);check(`${f}: own painted lesson`,!!$('journey-body').querySelector(`.ss-lesson[data-family="${f}"]`));
      ev(`state.realms[${f}].trial=true;state.journey.zeroChapter=true;`);w.openRealm(f);
      check(`${f}: first star directs to own guardian`,!!$('realm-body').querySelector('.ss-foundation')&&!!$('realm-body').querySelector(`.ss-story-action[onclick="startBoss(${f})"]`));
      w.startBoss(f);const layer=$('guardian-restoration-scene'),fixed=layer.querySelector('figure'),background=fixed.querySelector('.ss-landscape'),guardian=fixed.querySelector('.ss-boulder');
      for(const [p,stage]of [[0,'ruins'],[1/3,'foundation'],[2/3,'walls'],[1,'restored']]){
        ev(`quiz.battle.hp=quiz.battle.maxHP*(1-${p});`);w.updateBossBattleUI();
        check(`${f}: encounter ${stage}`,layer.querySelector('figure').dataset.stage===stage&&layer.querySelector('figure').dataset.family===String(f));
        check(`${f}: ${stage} keeps background and guardian mounted`,layer.querySelector('figure')===fixed&&fixed.querySelector('.ss-landscape')===background&&fixed.querySelector('.ss-boulder')===guardian);
        const existing=layer.firstElementChild;w.updateBossBattleUI();check(`${f}: stable ${stage} DOM`,existing===layer.firstElementChild);
      }
      w.finishQuiz();w.openRealm(f);
      check(`${f}: real victory restores and offers Fact Trail`,ev(`state.realms[${f}].conquered`)&&!!$('realm-body').querySelector('.ss-restored')&&!!$('realm-body').querySelector(`.ss-story-action[onclick="startFactTrail(${f})"]`));
      ev(`state.realms[${f}].trailFacts=Array.from({length:12},(_,i)=>i)`);w.startFactTrail(f);
      for(const d of String(f*12))w.pressKey(d);w.pressKey('enter');await pause();w.openRealm(f);
      check(`${f}: actual third star unlocks celebration`,!!$('realm-body').querySelector('.ss-celebrated'));
      ev('state=JSON.parse(JSON.stringify(state));migrateState()');w.openRealm(f);
      check(`${f}: existing save reload restores correct scene`,!!$('realm-body').querySelector('.ss-celebrated'));
      w.beginLesson(f);check(`${f}: completed scene survives lesson replay`,!!$('journey-body').querySelector('.ss-celebrated'));
    }
    ev('quiz=null');w.guardianEncounterScenery();check('scene and encounter framing clean up',!$('guardian-restoration-scene')&&!$('battle-stage').classList.contains('squarestone-battle'));
    check('no runtime errors across all twelve learning flows',errors.length===0);
  }finally{dom.window.close();}
  console.log(`${checks} painted realm checks passed; ${manifest.reduce((n,m)=>n+m.bytes,0)} bytes of new art`);
}
main().catch(e=>{console.error(e);process.exitCode=1;});
