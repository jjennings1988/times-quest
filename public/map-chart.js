/* The hand-drawn chart on the adventure map. The chart is painted once per
   device and version (in a worker where possible), cached, and then only its
   ink mask and living layer change as a child restores realms.
   Decorative: the realm nodes and route stay exactly where they were. */
(function(root){
  'use strict';
  const CP=root.ChartPaint,CL=root.ChartLandmarks,CLO=root.ChartLore,CB=root.ChartBake,CW=root.ChartWorld,CACHE='tq-chart';
  const season=()=>CP.seasonFor(new Date());
  const keyFor=scale=>`./chart-cache/v${CP.VERSION}/${season()}/${scale}/`;
  let el=null,glow=null,base={scale:0,loading:null},layerKey='',pending=null,raf=0,current=null;
  // Baking: the plain sheet's blobs, the landmarks the canvases now carry, and the landmarks wanted.
  let plain=null,bakedKey='',bakeWant=null,bakeRun=0,cssText=null;

  function supported(){try{const c=document.createElement('canvas');return !!(c.getContext&&c.getContext('2d'))&&typeof createImageBitmap==='function';}catch(e){return false;}}
  const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c;};
  function ensureRoot(){
    if(el)return el;
    el=document.createElement('div');el.className='chart-root';
    // The sheet reaches up past the land into the blank margin above it; clouds and mist stay over the land.
    el.style.top=`${-CW.TOP/CW.H*100}%`;
    el.innerHTML=`<canvas class="chart-pencil"></canvas><canvas class="chart-ink"></canvas><svg class="chart-live" viewBox="0 ${-CW.TOP} ${CW.W} ${CW.H+CW.TOP}" preserveAspectRatio="none" aria-hidden="true"></svg><div class="chart-area" style="top:${CW.TOP/(CW.H+CW.TOP)*100}%"><i class="chart-cloud c0"></i><i class="chart-cloud c1"></i><i class="chart-cloud c2"></i><i class="chart-mist m0"></i><i class="chart-mist m1"></i><i class="chart-mist m2"></i></div>`;
    return el;
  }

  /* ---------- the painted base, from cache or freshly drawn ---------- */
  async function fromCache(key){try{if(!root.caches)return null;const c=await caches.open(CACHE),[a,b]=await Promise.all([c.match(key+'ink.jpg'),c.match(key+'pencil.jpg')]);return a&&b?{ink:await a.blob(),pencil:await b.blob()}:null;}catch(e){return null;}}
  async function toCache(key,blobs){try{if(!root.caches)return;const c=await caches.open(CACHE);for(const req of await c.keys())if(!new URL(req.url).pathname.includes(`/chart-cache/v${CP.VERSION}/`))await c.delete(req);await c.put(key+'ink.jpg',new Response(blobs.ink,{headers:{'content-type':'image/jpeg'}}));await c.put(key+'pencil.jpg',new Response(blobs.pencil,{headers:{'content-type':'image/jpeg'}}));}catch(e){}}
  function inWorker(scale){return new Promise((resolve,reject)=>{
    if(typeof Worker==='undefined'||typeof OffscreenCanvas==='undefined'||!('convertToBlob' in OffscreenCanvas.prototype))return reject(new Error('no worker canvas'));
    let w;try{w=new Worker('chart-worker.js');}catch(e){return reject(e);}
    const done=fn=>v=>{w.terminate();fn(v);};
    w.onmessage=e=>e.data.ok?done(resolve)(e.data):done(reject)(new Error(e.data.error));
    w.onerror=e=>{e.preventDefault&&e.preventDefault();done(reject)(new Error(e.message||'worker failed'));};
    w.postMessage({id:1,scale,season:season()});
  });}
  async function onMainThread(scale){
    const world=root.ChartWorld.build(),{w:W,h:H}=CP.sheet(scale),ink=makeCanvas(W,H),ctx=ink.getContext('2d'),it=CP.paint(ctx,world,{scale,makeCanvas,season:season()});
    // Paint in short slices so taps and scrolling stay smooth.
    for(;;){const t=performance.now();let r;do r=it.next();while(!r.done&&performance.now()-t<12);if(r.done)break;await new Promise(res=>setTimeout(res,0));}
    const pencil=makeCanvas(W,H),pctx=pencil.getContext('2d'),dst=pctx.createImageData(W,H);CP.pencilize(ctx.getImageData(0,0,W,H),dst);pctx.putImageData(dst,0,0);
    const blob=(c,q)=>new Promise(res=>c.toBlob(res,'image/jpeg',q));
    const out={ink:await blob(ink,.9),pencil:await blob(pencil,.88)};ink.width=ink.height=pencil.width=pencil.height=1;return out;
  }
  function loadingChip(on){
    let chip=document.querySelector('.chart-loading');
    if(on&&!chip){chip=document.createElement('div');chip.className='chart-loading';chip.setAttribute('role','status');chip.innerHTML='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 3c-6 1-11 6-13 13l-2 5 5-2c7-2 12-7 13-13l-3 3" fill="none" stroke="#3b2a1c" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg><span>The cartographer is drawing your map…</span>';(document.getElementById('screen-map')||document.body).appendChild(chip);}
    if(!on&&chip){chip.classList.add('done');setTimeout(()=>chip.remove(),600);}
  }
  async function loadBase(scale){
    const key=keyFor(scale);let blobs=await fromCache(key),painted=false;
    if(!blobs){loadingChip(true);painted=true;try{blobs=await inWorker(scale);}catch(e){blobs=await onMainThread(scale);}toCache(key,blobs);}
    plain={ink:blobs.ink,pencil:blobs.pencil,scale};bakeRun++;
    const want=bakeWant,done=want&&CB?await fromCache(bakedKeyFor(scale,want.key)):null;
    await drawBlobs(done||blobs);bakedKey=done?want.key:'';setBaked(!!done);
    el.classList.add('ready');if(painted)loadingChip(false);
    return scale;
  }
  function ensureBase(host){
    const w=host.getBoundingClientRect().width||864,scale=CP.scaleFor(w,root.devicePixelRatio||1);
    if(base.scale>=scale||base.loading)return base.loading||Promise.resolve();
    base.loading=loadBase(scale).then(s=>{base.scale=s;base.loading=null;if(pending)startGrow();bakeNow();}).catch(e=>{base.loading=null;loadingChip(false);console.warn('Chart',e);});
    return base.loading;
  }

  async function drawBlobs(blobs){
    const[ink,pencil]=await Promise.all([createImageBitmap(blobs.ink),createImageBitmap(blobs.pencil)]);
    for(const[c,b]of[[el.querySelector('.chart-ink'),ink],[el.querySelector('.chart-pencil'),pencil]]){c.width=b.width;c.height=b.height;c.getContext('2d').drawImage(b,0,0);b.close&&b.close();}
  }

  /* ---------- baking the drawn landmarks into the paper ---------- */
  const hash=s=>{let h=5381;for(let i=0;i<s.length;i++)h=(Math.imul(h,33)^s.charCodeAt(i))>>>0;return h.toString(36);};
  const bakedKeyFor=(scale,key)=>`${keyFor(scale)}baked-${CB?CB.VERSION:0}-${key}/`;
  // Once the paper carries the drawing, the live layer shows only what moves and the lettering.
  function setBaked(on){const live=el&&el.querySelector('.chart-live');if(live)live.classList.toggle('baked',on);}
  function chartCSS(){if(cssText)return cssText;try{for(const sh of document.styleSheets)if(sh.href&&/map-chart\.css/.test(sh.href)){cssText=[...sh.cssRules].map(r=>r.cssText).join('\n');return cssText;}}catch(e){}return '';}
  async function keepBaked(key,scale,blobs){try{if(!root.caches)return;const c=await caches.open(CACHE),dir=new URL(keyFor(scale),location.href).pathname+'baked-';
    await c.put(key+'ink.jpg',new Response(blobs.ink,{headers:{'content-type':'image/jpeg'}}));await c.put(key+'pencil.jpg',new Response(blobs.pencil,{headers:{'content-type':'image/jpeg'}}));
    const mine=new URL(key,location.href).pathname;for(const req of await c.keys()){const p=new URL(req.url).pathname;if(p.startsWith(dir)&&!p.startsWith(mine))await c.delete(req);}}catch(e){}}
  async function bakeNow(){
    const want=bakeWant;if(!CB||!el||!want||!el.classList.contains('ready')||base.loading)return;
    const scale=base.scale;if(bakedKey===want.key){setBaked(true);return;}
    const run=++bakeRun,key=bakedKeyFor(scale,want.key),stale=()=>run!==bakeRun||!el;
    try{
      const hit=await fromCache(key);if(stale())return;
      if(hit){await drawBlobs(hit);if(stale())return;bakedKey=want.key;setBaked(true);return;}
      const css=chartCSS()||await fetch('map-chart.css').then(r=>r.text());if(stale())return;
      // Canvases that carry an older bake get their plain paper back first.
      if(bakedKey){const p=plain&&plain.scale===scale?plain:await fromCache(keyFor(scale));if(!p||stale())return;await drawBlobs(p);bakedKey='';if(stale())return;}
      const ink=el.querySelector('.chart-ink'),pencil=el.querySelector('.chart-pencil');
      if(!await CB.bake({ink,pencil,markup:want.markup,css,W:CW.W,H:CW.H,top:CW.TOP,scale,makeCanvas,cancelled:stale})||stale())return;
      bakedKey=want.key;setBaked(true);
      const blob=(c,q)=>new Promise(res=>c.toBlob(res,'image/jpeg',q)),out={ink:await blob(ink,.9),pencil:await blob(pencil,.88)};
      if(out.ink&&out.pencil)keepBaked(key,scale,out);
    }catch(e){if(!stale())setBaked(false);console.warn('Chart bake',e);}
  }

  /* ---------- ink and the living layer ---------- */
  function readSeen(profile){try{return JSON.parse(localStorage.getItem('tq-chart-seen:'+profile)||'null');}catch(e){return null;}}
  function writeSeen(profile,stages){try{localStorage.setItem('tq-chart-seen:'+profile,JSON.stringify(stages));}catch(e){}}
  function setMask(url){const ink=el.querySelector('.chart-ink'),v=url?`url(${url})`:'none';ink.style.webkitMaskImage=v;ink.style.maskImage=v;}
  function applyMask(stages,all,grow){setMask(all?null:CL.maskURL(stages,makeCanvas,{grow}));}
  function startGrow(){
    const p=pending;if(!p||!el.classList.contains('ready'))return;pending=null;cancelAnimationFrame(raf);
    const wet=el.querySelector('.cl-wet'),k=CL.inkCircles(p.stages).find(c=>c.family===p.family);if(!k){applyMask(p.stages,p.all);return;}
    const t0=performance.now()+700,dur=2600;
    const frame=now=>{const t=Math.max(0,Math.min(1,(now-t0)/dur)),e=1-Math.pow(1-t,3),r=p.from+(k.r-p.from)*e;
      applyMask(p.stages,false,{family:p.family,from:p.from,t:e});
      if(wet){wet.setAttribute('cx',k.x);wet.setAttribute('cy',k.y);wet.setAttribute('r',t>0&&t<1?r*1.05:0);wet.style.opacity=String(1-t);}
      if(t<1)raf=requestAnimationFrame(frame);else applyMask(p.stages,p.all);};
    raf=requestAnimationFrame(frame);
  }
  function render(host,data){
    const r=ensureRoot();if(r.parentNode!==host)host.appendChild(r);current=data;
    // The night glow sits beside the chart, above the map's night darkening.
    if(!glow){glow=document.createElementNS('http://www.w3.org/2000/svg','svg');glow.setAttribute('class','chart-glow');glow.setAttribute('viewBox','0 0 864 1821');glow.setAttribute('preserveAspectRatio','none');glow.setAttribute('aria-hidden','true');}
    if(glow.previousSibling!==host)host.after(glow);glow.classList.toggle('on',data.sky!=='day');glow.classList.toggle('calm',!!data.calm);
    r.classList.toggle('night',data.sky!=='day');r.classList.toggle('calm',!!data.calm);r.dataset.marsh=String((data.stages||{})[0]|0);r.classList.toggle('pencil',!!data.pencil);
    const stages=data.stages||{},all=!!data.all,key=JSON.stringify([stages,all,data.profile,data.lore,!!data.calm]);
    if(key!==layerKey){
      layerKey=key;const seen=readSeen(data.profile),fresh={};let grow=null;
      if(seen&&!data.calm)for(const f of Object.keys(stages)){const was=seen[f]|0,now=stages[f]|0;if(now>was){fresh[f]=true;if(!grow||now>=3)grow={family:+f,from:CL.INK_RADIUS[was]||0};}}
      const land=CL.markup(null,stages,{fresh,all,calm:!!data.calm});
      r.querySelector('.chart-live').innerHTML=`<style>${CB?CB.LIVE_CSS:''}</style><g class="cl-world">${land}</g>`+(CLO?CLO.markup(data.lore):'');
      bakeWant={key:hash(land),markup:land};setBaked(!!bakedKey);bakeNow();
      glow.innerHTML=CL.glowMarkup(stages);
      if(grow){applyMask(Object.assign({},stages,{[grow.family]:seen[grow.family]|0}),false);pending={...grow,stages,all};}
      else{pending=null;applyMask(stages,all);}
      writeSeen(data.profile,stages);
    }
    ensureBase(host);if(pending)startGrow();
  }
  // After zooming, draw the chart at a finer resolution if the map is now much larger.
  function refresh(){if(el&&el.parentNode)ensureBase(el.parentNode);}
  function release(){if(!el)return;cancelAnimationFrame(raf);el.remove();el=null;if(glow){glow.remove();glow=null;}base={scale:0,loading:null};layerKey='';pending=null;plain=null;bakedKey='';bakeWant=null;bakeRun++;}

  const api={render,release,refresh,supported,keyFor,bakedKeyFor};
  root.MapChart=api;
})(typeof window!=='undefined'?window:globalThis);
