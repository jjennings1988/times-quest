/* Pinch-to-zoom for the hand-drawn map. The map itself grows (its width changes, so
   every layer stays crisp and the realm buttons keep their size) and the point under
   the fingers stays under the fingers. Two-finger pinch, Safari's gesture events,
   ctrl/⌘ + wheel (and trackpad pinch), and step buttons. */
(function(root){
  'use strict';
  const MIN=1,MAX=2.6,STEP=1.4;
  const clamp=z=>Math.max(MIN,Math.min(MAX,z));
  /* Scroll offsets that keep a point fixed on screen while the map resizes.
     frac: where the point sits in the map (0..1), before/after: the map's rect, focal: the point on screen. */
  function keepFocal(frac,after,focal){return{dx:(after.left+frac.x*after.width)-focal.x,dy:(after.top+frac.y*after.height)-focal.y};}
  let screen=null,trail=null,enabled=false,z=1,base=0,onEnd=null,endTimer=0,raf=0,pending=null;
  const world=()=>trail&&trail.querySelector('.map-world');
  function measureBase(){const w=world();if(!w)return 0;const had=trail.classList.contains('zoomed'),inline=w.style.width;trail.classList.remove('zoomed');w.style.width='';const b=w.getBoundingClientRect().width;if(had)trail.classList.add('zoomed');w.style.width=inline;return b;}
  function apply(){const w=world();if(!w)return;
    if(!enabled||z<=1.001){z=1;trail.classList.remove('zoomed');w.style.width='';return;}
    if(!base)base=measureBase();trail.classList.add('zoomed');w.style.width=f(base*z)+'px';}
  const f=v=>Math.round(v*10)/10;
  function setZoom(next,focal){const w=world();if(!w||!enabled)return;next=clamp(next);if(Math.abs(next-z)<.001)return;
    if(!base)base=measureBase();
    const before=w.getBoundingClientRect(),frac={x:(focal.x-before.left)/before.width,y:(focal.y-before.top)/before.height};
    z=next;apply();const d=keepFocal(frac,w.getBoundingClientRect(),focal);trail.scrollLeft+=d.dx;screen.scrollTop+=d.dy;
    clearTimeout(endTimer);endTimer=setTimeout(()=>{onEnd&&onEnd(z);},320);}
  // Apply at most once a frame while fingers move.
  function request(next,focal){pending={next,focal};if(!raf)raf=requestAnimationFrame(()=>{raf=0;const p=pending;pending=null;if(p)setZoom(p.next,p.focal);});}
  const centre=()=>{const r=trail.getBoundingClientRect(),v=screen.getBoundingClientRect();return{x:(Math.max(r.left,v.left)+Math.min(r.right,v.right))/2,y:(Math.max(r.top,v.top)+Math.min(r.bottom,v.bottom))/2};};
  function step(dir){setZoom(dir>0?z*STEP:z/STEP,centre());}
  function reset(){if(z===1)return;setZoom(1,centre());}

  function attach(scr,tr,opts={}){
    screen=scr;trail=tr;onEnd=opts.onEnd||null;
    // Two fingers: pointer events everywhere except Safari, which has its own gesture events.
    const gestures='ongesturestart' in root;const pts=new Map();let pinch=null;
    const mid=()=>{const a=[...pts.values()];return{x:(a[0][0]+a[1][0])/2,y:(a[0][1]+a[1][1])/2,d:Math.hypot(a[0][0]-a[1][0],a[0][1]-a[1][1])};};
    tr.addEventListener('pointerdown',e=>{if(!enabled||e.pointerType!=='touch'||gestures)return;pts.set(e.pointerId,[e.clientX,e.clientY]);if(pts.size===2){const m=mid();pinch={d:m.d,z};}},{passive:true});
    tr.addEventListener('pointermove',e=>{if(!pts.has(e.pointerId))return;pts.set(e.pointerId,[e.clientX,e.clientY]);if(pinch&&pts.size===2){const m=mid();if(pinch.d>10)request(pinch.z*m.d/pinch.d,m);}},{passive:true});
    const up=e=>{pts.delete(e.pointerId);if(pts.size<2)pinch=null;};tr.addEventListener('pointerup',up);tr.addEventListener('pointercancel',up);
    if(gestures){let g0=1;
      tr.addEventListener('gesturestart',e=>{if(!enabled)return;e.preventDefault();g0=z;});
      tr.addEventListener('gesturechange',e=>{if(!enabled)return;e.preventDefault();request(g0*e.scale,{x:e.clientX,y:e.clientY});});
      tr.addEventListener('gestureend',e=>{if(enabled)e.preventDefault();});}
    // Ctrl/⌘ + wheel, which is also how laptop trackpads report a pinch.
    tr.addEventListener('wheel',e=>{if(!enabled||!(e.ctrlKey||e.metaKey))return;e.preventDefault();request(z*Math.exp(-e.deltaY*.01),{x:e.clientX,y:e.clientY});},{passive:false});
    root.addEventListener('resize',()=>{base=0;apply();});
  }
  function setEnabled(on){enabled=!!on;if(trail)trail.classList.toggle('zoomable',enabled);if(!enabled){z=1;apply();}}
  const api={attach,setEnabled,apply,step,reset,keepFocal,clamp,MIN,MAX,get zoom(){return z;}};
  root.MapZoom=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
