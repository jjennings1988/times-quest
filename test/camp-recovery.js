const fs=require('fs'),assert=require('node:assert/strict'),{JSDOM}=require('jsdom');
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};
const delay=()=>new Promise(r=>setTimeout(r,25));
async function runtime(){
  const dom=new JSDOM('<div id="camp"></div>',{runScripts:'dangerously',pretendToBeVisual:true,url:'https://camp-recovery.test/'}),w=dom.window;
  for(const file of ['camp-content.js','camp-guide.js','camp-v2.js'])w.eval(fs.readFileSync('public/'+file,'utf8'));
  const host=w.document.getElementById('camp');let save=w.CampV2.fresh(),controller,callbacks,disposed=0,renderFails=false,restarted=0,diagnostics=[];
  const initial=JSON.stringify(save);const options={getSave:()=>save,setSave:s=>save=s,profileId:'a',currentProfileId:()=> 'a',avatar:'',reducedMotion:()=>true,onExit:()=>{},onPractice:()=>{},onReload:()=>{},onDiagnostic:d=>diagnostics.push(d),onRestart:low=>{restarted++;controller.dispose();if(low)save={...save,quality:'low'};controller=w.CampV2.mount(host,options);},loadScene:async()=>({createScene(canvas,args){callbacks=args;return {resize(){},render(){if(renderFails)throw Error('Injected draw failure');},thumbnail(){return null;},stats:()=>({}),dispose(){disposed++;}};}})};
  try{
    controller=w.CampV2.mount(host,options);await delay();
    check('camp has help with no legacy switch',host.querySelector('[data-action="help"]')&&!host.querySelector('[data-action="v1"]'));
    callbacks.onContextLost();check('context loss exposes persistent recovery',host.querySelector('.cv2-recovery-banner').textContent.includes('paused'));
    check('context loss does not spend or remove items',save.gems===JSON.parse(initial).gems&&save.objects.length===7);
    callbacks.onContextRestored();check('browser restoration clears failure state',!host.classList.contains('cv2-no-webgl')&&!host.querySelector('canvas').getAttribute('aria-label').includes('paused'));
    const sw=fs.readFileSync('public/sw.js','utf8'),sandbox={self:{addEventListener(){}}};const optional=require('node:vm').runInNewContext(sw+';OPTIONAL',sandbox);check('legacy artwork no longer eagerly downloads',!optional.some(p=>p.startsWith('./art/camp/')));
    renderFails=true;w.dispatchEvent(new w.Event('resize'));await delay();
    check('frame exception is caught and diagnosed once',diagnostics.filter(d=>d.code==='render').length===1&&host.querySelector('.cv2-recovery-banner').textContent.includes('unavailable'));
    renderFails=false;host.querySelector('[data-action="help"]').click();host.querySelector('[data-action="restart-low"]').click();await delay();
    check('low-power retry creates a new renderer',restarted===1&&callbacks.lowPower===true&&disposed>=1);
    check('restart preserves wallet and object identities',save.gems===JSON.parse(initial).gems&&JSON.stringify(save.objects)===JSON.stringify(JSON.parse(initial).objects));
    check('retry succeeds without leaving an error panel',!host.classList.contains('cv2-no-webgl'));
    controller.dispose();options.loadScene=()=>Promise.reject(Error('Download interrupted'));controller=w.CampV2.mount(host,options);await delay();
    check('module failure gives Backpack and restart controls',host.querySelector('[data-action="bag"]')&&host.querySelector('.cv2-recovery-banner').textContent.includes('unavailable'));
    host.querySelector('[data-action="help"]').click();check('reload remains available after module rejection',!!host.querySelector('[data-action="reload"]'));
    controller.dispose();options.loadScene=async()=>({createScene(){throw Error('Injected construction failure');}});controller=w.CampV2.mount(host,options);await delay();check('constructor failure reaches recovery',diagnostics.at(-1).code==='world-load');
    controller.dispose();const timer=w.setTimeout;let timeout,lateResolve,lateCreated=false;
    w.setTimeout=(fn,ms,...args)=>{if(ms===15000){timeout=fn;return 0;}return timer(fn,ms,...args);};
    options.loadScene=()=>new Promise(r=>lateResolve=r);controller=w.CampV2.mount(host,options);timeout();
    check('stalled download reaches a bounded recovery state',diagnostics.at(-1).code==='loading-timeout');
    lateResolve({createScene(){lateCreated=true;}});await delay();check('timed-out load cannot overwrite recovery',!lateCreated);w.setTimeout=timer;
    controller.dispose();let resolve;options.loadScene=()=>new Promise(r=>resolve=r);controller=w.CampV2.mount(host,options);controller.dispose();let created=false;resolve({createScene(){created=true;}});await delay();check('late load cannot resurrect an abandoned camp',!created);
  }finally{controller?.dispose();dom.window.close();}
}
async function migration(){
  const html=fs.readFileSync('public/index.html','utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,n)=>`<script>${fs.readFileSync('public/'+n,'utf8')}</script>`);
  const dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://migration.test/',beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};}}),w=dom.window,e=s=>w.eval(s);
  try{await delay();e("state=defaultState();migrateState();state.bought={'shelter-3':1,'light-1':2};state.placed=[{t:'shelter-3',x:5,y:3}];state.gems=250;state.campV2=CampV2.fresh();");
    const original=e('JSON.stringify(state.placed)'),objects=e('JSON.stringify(state.campV2.objects)');w.migrateToWillowbrook();
    check('wallet migration takes max, never sum',e('state.campV2.gems')===250&&e('state.legacyCampArchive.credit')===130);
    check('compatible earned items move into inventory',e('state.campV2.inventory.canvas')===1&&e('state.campV2.inventory.lantern')===3);
    check('original layout and existing world remain intact',e('JSON.stringify(state.placed)')===original&&e('JSON.stringify(state.campV2.objects)')===objects);
    const migrated=e('JSON.stringify(state.campV2)');w.migrateToWillowbrook();check('migration is idempotent',e('JSON.stringify(state.campV2)')===migrated);
    e('state=JSON.parse(JSON.stringify(state));migrateState()');w.migrateToWillowbrook();check('export/reload cannot duplicate migration',e('JSON.stringify(state.campV2)')===migrated);
    w.showScreen('screen-camp');check('old camp links open Willowbrook',w.document.getElementById('screen-camp-v2').classList.contains('active'));
    w.showScreen('screen-map');e('state.campV2.v=999');const invalid=e('JSON.stringify(state.campV2)');w.showScreen('screen-camp-v2');
    check('unknown save version is retained without a reset',e('JSON.stringify(state.campV2)')===invalid&&w.document.getElementById('screen-camp-v2').textContent.includes('Backups and diagnostics'));
    w.restartCamp(true);check('recovery cannot silently replace damaged save',e('JSON.stringify(state.campV2)')===invalid);
  }finally{dom.window.close();}
}
(async()=>{await runtime();await migration();console.log(`${checks} camp recovery and migration checks passed`);})().catch(e=>{console.error(e);process.exitCode=1;});
