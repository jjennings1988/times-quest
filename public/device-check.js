/* A read-only device report for beta testing on real phones, tablets and Chromebooks.
   It reads the environment; it never changes saves or settings. */
(function(root){
  'use strict';
  function safeAreas(){
    try{
      const probe=document.createElement('div');
      probe.style.cssText='position:fixed;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
      document.body.append(probe);const cs=getComputedStyle(probe);
      const out={top:cs.paddingTop,right:cs.paddingRight,bottom:cs.paddingBottom,left:cs.paddingLeft};probe.remove();return out;
    }catch(e){return null;}
  }
  function webgl2(){try{return !!document.createElement('canvas').getContext('webgl2');}catch(e){return false;}}
  async function report(extra={}){
    let estimate=null;try{const e=await navigator.storage?.estimate?.();if(e)estimate={usedMB:Math.round(e.usage/1048576*10)/10,quotaMB:Math.round(e.quota/1048576)};}catch(e){}
    let persisted=null;try{persisted=await navigator.storage?.persisted?.()??null;}catch(e){}
    const vv=root.visualViewport;
    return {
      version:extra.version||null,
      when:new Date().toISOString(),
      userAgent:navigator.userAgent,
      viewport:{width:innerWidth,height:innerHeight,visualHeight:vv?Math.round(vv.height):null,dpr:root.devicePixelRatio||1,orientation:screen.orientation?.type||null},
      safeAreas:safeAreas(),
      installed:(()=>{try{return matchMedia('(display-mode: standalone)').matches||navigator.standalone===true;}catch(e){return false;}})(),
      reducedMotion:(()=>{try{return matchMedia('(prefers-reduced-motion: reduce)').matches;}catch(e){return null;}})(),
      storage:{persisted,estimate},
      hardware:{cores:navigator.hardwareConcurrency||null,memoryGB:navigator.deviceMemory||null,webgl2:webgl2(),touch:navigator.maxTouchPoints||0},
      serviceWorker:!!navigator.serviceWorker?.controller,
      camp:root.CampPerf||null,
      ...extra.details
    };
  }
  function summary(r){
    const rows=[
      ['Version',r.version],
      ['Screen',`${r.viewport.width}×${r.viewport.height} @${r.viewport.dpr}x${r.viewport.orientation?` · ${r.viewport.orientation}`:''}`],
      ['Safe areas',r.safeAreas?`top ${r.safeAreas.top}, bottom ${r.safeAreas.bottom}`:'unknown'],
      ['Installed app',r.installed?'yes':'no (browser tab)'],
      ['Saves kept by browser',r.storage.persisted===true?'yes':r.storage.persisted===false?'not guaranteed':'unknown'],
      ['Offline ready',r.serviceWorker?'yes':'not yet'],
      ['3D camp support',r.hardware.webgl2?'yes':'no — Backpack controls only'],
      ['Camp smoothness',r.camp?`${r.camp.median} ms per frame (median), ${r.camp.p95} ms slowest 5% · ${r.camp.quality}`:'open Willowbrook for 5 seconds to measure']
    ];
    return rows.map(([k,v])=>`<div><dt>${k}</dt><dd>${String(v??'unknown').replace(/[<>&]/g,'')}</dd></div>`).join('');
  }
  const api={report,summary,safeAreas};
  root.DeviceCheck=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
