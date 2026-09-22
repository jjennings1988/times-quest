/* Keep scenery still; replace only a decoded, registered landmark layer. */
(function(root){
  'use strict';
  const running=new WeakMap();
  function calm(figure){const win=figure.ownerDocument.defaultView;return figure.ownerDocument.body.matches('.calm,.reduce-motion')||!!win.matchMedia?.('(prefers-reduced-motion: reduce)').matches;}
  function update(figure,incoming){
    const host=figure.querySelector('[data-landmark]'),target=incoming.querySelector('[data-landmark] img');
    if(!host||!target)return false;
    const stage=incoming.dataset.stage,src=target.getAttribute('src');
    figure.className=incoming.className;
    figure.dataset.stage=stage;
    figure.setAttribute('aria-label',incoming.getAttribute('aria-label'));
    figure.querySelector('figcaption').innerHTML=incoming.querySelector('figcaption').innerHTML;
    let state=running.get(figure);
    if(state?.src===src&&!figure.dataset.artError)return true;
    // Finish an already visible blend before starting another. Pending decodes
    // are discarded instead, and their late callbacks cannot replace new work.
    if(state){state.cancelled=true;figure.ownerDocument.defaultView.clearTimeout(state.timer);if(state.started){state.next.style.transition='none';state.next.style.opacity='1';state.old?.remove();}else state.next.remove();}
    const old=host.querySelector('img');
    if(old?.getAttribute('src')===src&&!old.hidden){figure.dataset.displayedStage=stage;delete figure.dataset.artError;running.delete(figure);return true;}
    const win=figure.ownerDocument.defaultView,next=new win.Image();
    next.className=target.className;next.alt='';next.decoding='async';next.width=target.width;next.height=target.height;
    next.style.cssText=target.style.cssText;next.style.opacity='0';next.style.transition='none';
    state={src,old,next,cancelled:false,started:false,timer:null};running.set(figure,state);
    const current=()=>!state.cancelled&&running.get(figure)===state&&figure.isConnected;
    const finish=()=>{if(!current())return;next.style.transition='none';next.style.opacity='1';old?.remove();figure.dataset.displayedStage=stage;};
    next.onerror=()=>{if(!current())return;next.remove();figure.dataset.artError='true';state.cancelled=true;running.delete(figure);};
    next.onload=async()=>{
      try{if(next.decode)await next.decode();}catch{next.onerror();return;}
      if(!current())return;
      state.started=true;delete figure.dataset.artError;figure.dataset.displayedStage=stage;
      if(!old||old.hidden||calm(figure)){finish();return;}
      // Crossfade only the landmark; the fully opaque scenery never changes.
      next.getBoundingClientRect();
      next.style.transition='opacity 420ms ease-in-out';next.style.opacity='1';
      old.style.transition='opacity 420ms ease-in-out';old.style.opacity='0';
      state.timer=win.setTimeout(finish,460);
    };
    host.append(next);next.src=src;
    return true;
  }
  function same(a,b){return a&&b&&a.dataset.family===b.dataset.family&&a.dataset.context===b.dataset.context;}
  function render(host,html){
    const previous=host.querySelector('figure[data-scene]');
    host.innerHTML=html;
    const incoming=host.querySelector('figure[data-scene]');
    if(same(previous,incoming)){incoming.replaceWith(previous);update(previous,incoming);}
    return host.querySelector('figure[data-scene]');
  }
  const api={render,update};root.SceneTransitions=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
