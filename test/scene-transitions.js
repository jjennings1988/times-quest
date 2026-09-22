const assert=require('node:assert/strict'),fs=require('node:fs');
const {JSDOM}=require('jsdom'),Scenes=require('../public/realm-scenes'),Squarestone=require('../public/squarestone-scene');
const registration=require('../public/realm-scene-registration'),manifest=require('../art-source/realm-scenes-v2/manifest.json');
let checks=0;function check(name,value){assert.ok(value,name);checks++;}
const dom=new JSDOM('<body><main></main>',{runScripts:'dangerously',pretendToBeVisual:true});
const w=dom.window,host=w.document.querySelector('main');
w.eval(fs.readFileSync(require.resolve('../public/scene-transitions'),'utf8'));
const render=(stage,f=2)=>{const api=f===4?Squarestone:Scenes,v=f===4?api.view():api.view(f);v.stage=stage;v.src=f===4?api.asset(stage):api.asset(f,stage);return w.SceneTransitions.render(host,api.markup(v));};
async function load(img){img.decode=()=>Promise.resolve();await img.onload();}
(async()=>{
  try{
    for(const m of manifest){const ref=manifest.find(r=>r.family===m.family&&r.stage==='restored'),p=registration[m.family][m.stage];
      check(`${m.family}/${m.stage}: true transparency`,m.transparentFraction>.1);
      check(`${m.family}/${m.stage}: ground and footprint registered`,Math.abs(m.baseline*p.scale+p.top/100-ref.baseline)<1e-9&&Math.abs(m.left*p.scale+p.left/100-ref.left)<1e-9&&Math.abs(m.right*p.scale+p.left/100-ref.right)<1e-9);
      check(`${m.family}/${m.stage}: conservative scale adjustment`,p.scale>.85&&p.scale<1.2);
    }
    let scene=render('ruins'),bg=scene.querySelector('.ss-landscape'),guardian=scene.querySelector('.ss-boulder'),old=scene.querySelector('[data-landmark] img');
    render('foundation');let next=scene.querySelector('[data-landmark] img:last-child');
    check('previous artwork remains while next image loads',old.isConnected&&next.style.opacity==='0');
    check('registration reaches incoming image',next.style.top!==''&&next.style.left!==''&&next.style.width!=='');
    check('background and guardian are retained',scene.querySelector('.ss-landscape')===bg&&scene.querySelector('.ss-boulder')===guardian);
    render('walls');let latest=scene.querySelector('[data-landmark] img:last-child');
    await load(next);check('stale decode cannot replace current stage',!next.isConnected&&latest.style.opacity==='0');
    latest.onerror();check('failed load keeps previous image and exposes status',old.isConnected&&scene.dataset.artError==='true'&&scene.querySelectorAll('[data-landmark] img').length===1);
    render('walls');latest=scene.querySelector('[data-landmark] img:last-child');await load(latest);
    check('retry succeeds and starts only a landmark crossfade',!scene.dataset.artError&&latest.style.opacity==='1'&&old.style.opacity==='0'&&latest.style.transition.includes('420ms'));
    render('restored');next=scene.querySelector('[data-landmark] img:last-child');
    check('interrupting a fade retains at most two image layers',scene.querySelectorAll('[data-landmark] img').length===2&&!old.isConnected&&latest.style.opacity==='1');
    w.document.body.className='calm';await load(next);
    check('calm mode replaces instantly after decode',scene.querySelectorAll('[data-landmark] img').length===1&&next.style.transition==='none');
    w.document.body.className='';w.matchMedia=()=>({matches:true});render('celebrated');next=scene.querySelector('[data-landmark] img:last-child');await load(next);
    check('system reduced motion replaces instantly',scene.querySelectorAll('[data-landmark] img').length===1&&next.style.transition==='none');
    render('celebrated');check('same stage retains decoded image',scene.querySelector('[data-landmark] img')===next);
    render('ruins');next=scene.querySelector('[data-landmark] img:last-child');const other=render('ruins',4);await load(next);
    check('changing realm cannot receive a stale decode',other!==scene&&other.dataset.family==='4'&&other.querySelectorAll('[data-landmark] img').length===1);
    for(let f=0;f<=12;f++){scene=render('ruins',f);bg=scene.querySelector('.ss-landscape');guardian=scene.querySelector('.ss-boulder');for(const stage of ['foundation','walls','restored','celebrated']){render(stage,f);await load(scene.querySelector('[data-landmark] img:last-child'));check(`${f}/${stage}: persistent scene and correct decoded stage`,host.firstElementChild===scene&&scene.querySelector('.ss-landscape')===bg&&scene.querySelector('.ss-boulder')===guardian&&scene.dataset.displayedStage===stage);}}
    console.log(`${checks} alignment and transition checks passed`);
  }finally{w.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
