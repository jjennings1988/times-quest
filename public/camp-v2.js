/* Camp 2: renderer-independent commands + a lazy-loaded 3D woodland.
   No V1 inventory, coordinates, or currency are mutated by this experiment. */
(function (root) {
  'use strict';
  const COLS=12, ROWS=10;
  const catalog={
    tent:{name:'Pup Tent',w:2,h:2,layer:'solid',price:30,wood:4,art:'camp-shelter-t2.png',next:'canvas',action:'Rest'},
    canvas:{name:'Canvas Tent',w:2,h:2,layer:'solid',price:45,wood:5,art:'camp-shelter-t3.png',next:'cabin',action:'Rest'},
    cabin:{name:'Cabin Tent',w:3,h:2,layer:'solid',price:70,wood:8,art:'camp-shelter-t4.png',action:'Rest'},
    fire:{name:'Campfire',w:1,h:1,layer:'solid',price:15,wood:2,art:'camp-fire-t2-strip3.png',frames:3,action:'Warm up'},
    bench:{name:'Log Bench',w:2,h:1,layer:'solid',price:12,wood:2,rotate:true,action:'Sit together'},
    lantern:{name:'Lantern',w:1,h:1,layer:'solid',price:8,wood:0,art:'camp-light-t1.png'},
    path:{name:'Stone Path',w:1,h:1,layer:'surface',price:3,wood:0},
    deck:{name:'Wooden Deck',w:1,h:1,layer:'surface',price:4,wood:1},
    pine:{name:'Great Pine',w:2,h:2,layer:'solid',price:15,wood:0,art:'camp-garden-t4.png'},
    feeder:{name:'Bird Feeder',w:1,h:1,layer:'solid',price:12,wood:2,art:'camp-life-bird-feeder.png',action:'Watch birds'},
    fence:{name:'Timber Fence',w:1,h:1,layer:'solid',price:2,wood:1,rotate:true},
    gate:{name:'Garden Gate',w:1,h:1,layer:'surface',price:5,wood:2,rotate:true,action:'Walk through'}
  };
  const sources=[{x:1,y:6},{x:10,y:6},{x:8,y:1}];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const footprint=(type,rotation=0)=>{const d=catalog[type];return rotation%2?{w:d.h,h:d.w}:{w:d.w,h:d.h};};
  const inside=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<COLS&&y<ROWS;
  const worldInside=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=-10&&y>=-9&&x<=25&&y<=20;
  const river=x=>17+Math.sin(x*.21)*1.4;
  const bridge=z=>z>=3&&z<6;
  const water=(x,z)=>Math.abs(x-river(z))<1.65&&!bridge(z);
  function groundHeight(x,z){
    const distance=Math.abs(x-river(z));
    if(distance<2.5)return -.72+Math.min(1,distance/2.5)*.8;
    const outside=Math.max(0,-x,x-12,-z,z-10);
    return .08+Math.min(1,outside/4)*(.15+Math.sin(x*.38)*Math.cos(z*.32)*.2)+Math.max(0,-z-5)*.17;
  }
  const walkHeight=(x,z)=>bridge(z)&&Math.abs(x-river(z))<3?.16:groundHeight(x,z);
  const discoveries=[
    {id:'bridge',name:'Willow Bridge',x:20,y:4,text:'A stream finds its way through the woods. So can you.'},
    {id:'stones',name:'Story Stones',x:-5,y:2,text:'Thirteen stones, thirteen realms. There is room for your story here.'},
    {id:'meadow',name:'Butterfly Meadow',x:7,y:16,text:'Small wings. Big journeys. Your buddy has found a quiet place.'}
  ];
  const forest=[];
  for(let z=-11;z<=22;z+=2)for(let x=-12;x<=27;x+=2){
    const n=Math.abs(Math.sin(x*127.1+z*311.7)*43758.5453)%1;
    if(n<.32||(x>-3&&x<15&&z>-3&&z<13)||Math.abs(x-river(z))<3.4||bridge(z)||discoveries.some(p=>Math.hypot(x-p.x,z-p.y)<3)||Math.abs(x-7)<2&&z>9)continue;
    forest.push({x:x+.2+n*.6,z:z+.25,scale:.72+n*.58,kind:n>.72?'oak':'pine'});
  }
  const worldBlocked=(x,z)=>!worldInside(x,z)||water(x+.5,z+.5)||forest.some(t=>Math.floor(t.x)===x&&Math.floor(t.z)===z);
  const world={river,bridge,water,groundHeight,walkHeight,discoveries,forest,inside:worldInside,blocked:worldBlocked};
  const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function fresh(){
    return {v:2,worldId:'willowbrook-1',discoveries:[],revision:0,nextId:8,gems:120,wood:10,inventory:{path:8,deck:4,fence:6,gate:1,lantern:1},
      objects:[{id:'o1',type:'tent',x:3,y:2,r:0},{id:'o2',type:'fire',x:7,y:5,r:0},
        {id:'o3',type:'bench',x:4,y:6,r:0},{id:'o4',type:'pine',x:9,y:2,r:0},
        {id:'o5',type:'feeder',x:8,y:7,r:0},{id:'o6',type:'path',x:5,y:4,r:0},{id:'o7',type:'path',x:5,y:5,r:0}],
      explorer:{x:6,y:7},camera:{x:0,y:0,zoom:1},harvested:[],projects:[],quality:'standard',calm:false,night:false,visits:0};
  }
  function validSave(s){
    if(!s||![1,2].includes(s.v)||!Number.isInteger(s.revision)||!Number.isInteger(s.nextId)||s.nextId<1||!Array.isArray(s.objects)||s.objects.length>240)return false;
    if(s.v===2&&s.worldId!=='willowbrook-1')return false;
    if(!Number.isFinite(s.gems)||s.gems<0||!Number.isFinite(s.wood)||s.wood<0||!s.inventory||typeof s.inventory!=='object')return false;
    if(!s.explorer||!worldInside(s.explorer.x,s.explorer.y)||!s.camera||!['x','y','zoom'].every(k=>Number.isFinite(s.camera[k]))||s.camera.zoom<.55||s.camera.zoom>1.8)return false;
    if(s.camera.angle!==undefined&&!Number.isFinite(s.camera.angle))return false;
    if(s.discoveries!==undefined&&(!Array.isArray(s.discoveries)||!s.discoveries.every(id=>discoveries.some(d=>d.id===id))))return false;
    if(!Object.entries(s.inventory).every(([k,v])=>catalog[k]&&Number.isInteger(v)&&v>=0&&v<=10000))return false;
    if(!Array.isArray(s.harvested)||!s.harvested.every(n=>Number.isInteger(n)&&n>=0&&n<sources.length)||!Array.isArray(s.projects))return false;
    const ids=new Set();
    for(const o of s.objects){if(!o||typeof o.id!=='string'||ids.has(o.id)||!catalog[o.type]||!inside(o.x,o.y)||!Number.isInteger(o.r)||o.r<0||o.r>3)return false;ids.add(o.id);}
    return s.objects.every(o=>!placementReason(s,o.type,o.x,o.y,o.r,o.id,false));
  }
  function migrateSave(save){
    if(!validSave(save))return null;
    if(save.v===2)return save;
    return {...clone(save),v:2,worldId:'willowbrook-1',discoveries:[],camera:{...save.camera,angle:0}};
  }
  function blocked(s,x,y,ignore){
    return worldBlocked(x,y)||sources.some(p=>p.x===x&&p.y===y)||s.objects.some(o=>o.id!==ignore&&catalog[o.type].layer==='solid'&&overlaps({x,y,w:1,h:1},{...o,...footprint(o.type,o.r)}));
  }
  function route(s,from,to){
    const start={x:Math.round(from.x),y:Math.round(from.y)};
    if(blocked(s,to.x,to.y))return null;
    const q=[start],seen=new Set([`${start.x},${start.y}`]),parents=new Map();
    for(let i=0;i<q.length;i++){
      const p=q[i];if(p.x===to.x&&p.y===to.y){const out=[];let k=`${p.x},${p.y}`;while(parents.has(k)){const [x,y]=k.split(',').map(Number);out.unshift({x,y});k=parents.get(k);}return out;}
      for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const x=p.x+dx,y=p.y+dy,k=`${x},${y}`;if(seen.has(k)||blocked(s,x,y))continue;seen.add(k);parents.set(k,`${p.x},${p.y}`);q.push({x,y});}
    }return null;
  }
  function entrances(o){const {w,h}=footprint(o.type,o.r);return [{x:o.x,y:o.y+h},{x:o.x+w,y:o.y},{x:o.x-1,y:o.y},{x:o.x,y:o.y-1}];}
  function placementReason(s,type,x,y,r=0,ignore=null,checkAccess=true){
    const d=catalog[type];if(!d)return 'Unknown item';
    const size=footprint(type,r),box={x,y,...size};
    if(!inside(x,y)||x+size.w>COLS||y+size.h>ROWS)return 'Keep the whole footprint inside the clearing';
    if(sources.some(p=>overlaps(box,{...p,w:1,h:1})))return 'Leave the wood piles reachable';
    if(s.objects.some(o=>o.id!==ignore&&catalog[o.type].layer===d.layer&&overlaps(box,{...o,...footprint(o.type,o.r)})))return d.layer==='surface'?'A ground tile is already here':'Another object is in the way';
    if(checkAccess&&d.layer==='solid'){
      const e=s.explorer||{x:6,y:7};if(overlaps(box,{x:Math.round(e.x),y:Math.round(e.y),w:1,h:1}))return 'Your explorer is standing here';
      const next={...s,objects:[...s.objects.filter(o=>o.id!==ignore),{id:'preview',type,x,y,r}]};
      for(const o of next.objects.filter(o=>catalog[o.type].action&&catalog[o.type].layer==='solid')){
        if(!entrances(o).some(p=>route(next,e,p)!==null))return 'Leave a walking route to each activity';
      }
    }return '';
  }
  const goals=[
    {id:'trail',name:'A little trail',text:'Place 5 stone paths or deck tiles.',target:5,progress:s=>s.objects.filter(o=>['path','deck'].includes(o.type)).length,reward:15},
    {id:'border',name:'A welcoming boundary',text:'Build 4 fences and leave a gate for visitors.',target:5,progress:s=>Math.min(4,s.objects.filter(o=>o.type==='fence').length)+Math.min(1,s.objects.filter(o=>o.type==='gate').length),reward:20},
    {id:'shelter',name:'Room to grow',text:'Upgrade your shelter to a Cabin Tent.',target:1,progress:s=>s.objects.some(o=>o.type==='cabin')?1:0,reward:25}
  ];
  function command(save,cmd){
    if(!validSave(save))return {ok:false,message:'This camp needs recovery. Camp 1 is still available.'};
    if(cmd.revision!==undefined&&cmd.revision!==save.revision)return {ok:false,message:'The camp changed. Please select the item again.'};
    const s=clone(save);let message='',o=s.objects.find(o=>o.id===cmd.id),d=catalog[cmd.type];
    if(['place','move','upgrade'].includes(cmd.kind)){
      const type=cmd.kind==='upgrade'&&o?catalog[o.type].next:cmd.kind==='move'&&o?o.type:cmd.type;
      d=catalog[type];if(!d||((cmd.kind==='move'||cmd.kind==='upgrade')&&!o))return {ok:false,message:'Select an available object'};
      const r=d.rotate?((Math.trunc(Number(cmd.r)||0)%4)+4)%4:0;
      const reason=placementReason(s,type,cmd.x,cmd.y,r,o&&o.id);if(reason)return {ok:false,message:reason};
      if(cmd.kind!=='move'){
        if(cmd.kind==='place'&&(s.inventory[type]||0)>0)s.inventory[type]--;
        else {if(s.gems<d.price||s.wood<d.wood)return {ok:false,message:`Needs ${d.price} gems and ${d.wood} wood. Practice earns gems; explore for wood.`};s.gems-=d.price;s.wood-=d.wood;}
      }
      if(o){o.type=type;o.x=cmd.x;o.y=cmd.y;o.r=r;}else {let id;do{id=`o${s.nextId++}`;}while(s.objects.some(o=>o.id===id));s.objects.push({id,type,x:cmd.x,y:cmd.y,r});}
      message=cmd.kind==='upgrade'?`${d.name} built!`:`${d.name} placed`;
    }else if(cmd.kind==='store'){
      if(!o)return {ok:false,message:'Select an object first'};
      s.objects=s.objects.filter(i=>i.id!==o.id);s.inventory[o.type]=(s.inventory[o.type]||0)+1;message=`${catalog[o.type].name} is in your backpack`;
    }else if(cmd.kind==='gather'){
      if(!sources[cmd.source]||s.harvested.includes(cmd.source))return {ok:false,message:'All gathered here. A learning round brings more fallen wood.'};
      s.harvested.push(cmd.source);s.wood+=3;message='+3 wood! Nothing was cut down.';
    }else return {ok:false,message:'Unknown camp action'};
    for(const g of goals)if(!s.projects.includes(g.id)&&g.progress(s)>=g.target){s.projects.push(g.id);s.gems+=g.reward;message+=` ${g.name} complete · +${g.reward} gems!`;}
    s.revision++;return {ok:true,save:s,message};
  }
  function awardLearning(save,gems){if(!validSave(save))return save;const s=clone(save);s.gems+=Math.max(0,Math.floor(Number(gems)||0));s.harvested=[];s.revision++;return s;}

  function mount(host,options){
    const {getSave,setSave,profileId,avatar,onExit,onPractice}=options;
    let s=getSave(),disposed=false,mode='explore',panel=null,selected=null,preview=null,undo=null;
    let explorer={...(s.explorer||{x:6,y:7})},pet={x:explorer.x+.6,y:explorer.y+.5},walking=[],onArrive=null,activity='',activityUntil=0,seated=null;
    let camera={x:0,y:0,zoom:1,...s.camera},width=0,height=0,raf=0,last=0,dirty=true,pointers=new Map(),gesture=null;
    const abort=new AbortController(),signal=abort.signal;let scene=null,petTrail=[],heading=0;const metrics={frames:0,total:0,worst:0};
    const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ico={explore:'⌖',build:'⚒',bag:'▣',journal:'☷',home:'⌂',back:'‹',rotate:'↻',undo:'↶'};
    host.innerHTML=`<div class="cv2-shell"><canvas class="cv2-world" role="img" aria-label="Your living camp. Use the camp object list for accessible building."></canvas><header class="cv2-header"><button data-action="adventure" aria-label="Back to Adventure">‹</button><div class="cv2-brand"><small>CAMP 2 · WOODLAND</small><h1>Willowbrook Camp</h1></div><div class="cv2-purse" aria-label="Camp 2 supplies"></div></header><div class="cv2-switch" aria-label="Compare camps"><button data-action="v1">Camp 1</button><button aria-current="page" data-action="v2">Camp 2 <span>NEW</span></button></div><div class="cv2-camera"><button data-action="zoom-in" aria-label="Zoom in">+</button><button data-action="zoom-out" aria-label="Zoom out">−</button><button data-action="home" aria-label="Center camp">⌂</button><button data-action="orbit-left" aria-label="Rotate camera left">↶</button><button data-action="orbit-right" aria-label="Rotate camera right">↷</button></div><div class="cv2-hint"></div><div class="cv2-overlay"></div><nav class="cv2-dock" aria-label="Camp 2 tools">${[['explore','Explore'],['build','Build'],['bag','Backpack'],['journal','Journal']].map(([k,n])=>`<button data-action="${k}"><span aria-hidden="true">${ico[k]}</span>${n}</button>`).join('')}</nav><div class="cv2-announcement" role="status" aria-live="polite"></div></div>`;
    const canvas=host.querySelector('canvas'),overlay=host.querySelector('.cv2-overlay');host.classList.add('cv2-three');canvas.setAttribute('aria-label','3D woodland camp. Tap to walk, drag to pan. Backpack offers accessible object controls.');
    const motionQuery=root.matchMedia?.('(prefers-reduced-motion: reduce)');
    const calm=()=>s.calm||options.reducedMotion()||motionQuery?.matches;
    function point(x,y,z=0){return scene?scene.project(x,y,z):{x:width/2,y:height*.45};}
    function cell(px,py){return scene?scene.cell(px,py):{x:-99,y:-99};}
    function tell(text){host.querySelector('.cv2-announcement').textContent=text;}
    function commit(next){if(disposed||options.currentProfileId()!==profileId)return false;s=next;setSave(next);dirty=true;return true;}
    function persistView(){if(disposed)return;commit({...s,camera:{...camera},explorer:{x:Math.round(explorer.x),y:Math.round(explorer.y)}});}
    function act(cmd){explorer={x:Math.round(explorer.x),y:Math.round(explorer.y)};persistView();const before=clone(s),r=command(s,{...cmd,revision:s.revision});if(!r.ok){tell(r.message);return false;}if(!commit(r.save))return false;undo={before,revision:s.revision};preview=null;selected=null;walking=[];onArrive=null;seated=null;activity='';tell(r.message);ui();return true;}
    function focusedPanel(){return panel==='build'||panel==='bag'||panel==='journal';}
    function thumb(type){const picture=scene?.thumbnail(type);if(picture)return '<img class="cv2-thumb model-preview" src="'+picture+'" alt="" aria-hidden="true">';const icons={tent:'⛺',canvas:'⛺',cabin:'⌂',fire:'♨',bench:'▰',lantern:'✧',path:'▱',deck:'▤',pine:'♠',feeder:'⌂',fence:'╫',gate:'⊓'};return '<span class="cv2-thumb modeled '+type+'" aria-hidden="true">'+icons[type]+'</span>';}
    function choose(type,id=null,upgrade=false){const o=s.objects.find(o=>o.id===id);mode='build';panel=null;selected=id;walking=[];onArrive=null;seated=null;explorer={x:Math.round(explorer.x),y:Math.round(explorer.y)};persistView();preview={type,id,upgrade,x:o?o.x:Math.min(COLS-3,Math.max(0,explorer.x-2)),y:o?o.y:Math.min(ROWS-3,Math.max(0,explorer.y-2)),r:o?o.r:0};scene?.focus(preview.x+1,preview.y+1,camera,true);ui();dirty=true;}
    function ui(){
      host.querySelector('.cv2-purse').innerHTML=`<strong>◆ ${s.gems}</strong><small>Wood ${s.wood}</small>`;
      host.querySelectorAll('.cv2-dock button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===(panel||mode))));
      host.querySelector('.cv2-hint').textContent=preview?'Tap ground to preview. Confirm when it fits.':mode==='explore'?'Tap to walk · drag to pan · ↶ ↷ turn the world':'Tap an object to edit, or choose something to build';
      let html='';
      if(preview){const d=catalog[preview.type],reason=placementReason(s,preview.type,preview.x,preview.y,preview.r,preview.id);
        html=`<section class="cv2-card cv2-placement" aria-label="Place ${esc(d.name)}"><div class="cv2-card-heading">${thumb(preview.type)}<div><small>${preview.upgrade?'UPGRADE':preview.id?'MOVE':'BUILD'}</small><h2>${esc(d.name)}</h2><p class="${reason?'invalid':'valid'}">${reason?'⊘ '+reason:'✓ Clear space'} · ${preview.x+1}, ${preview.y+1}</p><p>${preview.id&&!preview.upgrade?'Moving is free':!preview.upgrade&&(s.inventory[preview.type]||0)>0?'From your backpack':`◆ ${d.price} · ${d.wood} wood`}</p></div></div><div class="cv2-nudges" aria-label="Adjust placement">${[['nudge-n','↑','Move north'],['nudge-w','←','Move west'],['nudge-s','↓','Move south'],['nudge-e','→','Move east']].map(([a,t,l])=>`<button data-action="${a}" aria-label="${l}">${t}</button>`).join('')}<button data-action="rotate" ${d.rotate?'':'disabled'} aria-label="Rotate object">↻</button></div><div class="cv2-actions"><button data-action="cancel">Cancel</button><button class="primary" data-action="confirm" ${reason?'disabled':''}>${preview.upgrade?'Build upgrade':preview.id?'Move here':'Place here'}</button></div></section>`;
      }else if(focusedPanel()){
        html=`<section class="cv2-card cv2-tray" aria-label="${panel==='build'?'Build catalogue':panel==='bag'?'Backpack and objects':'Camp journal'}"><div class="cv2-tray-title"><div><small>${panel==='journal'?'YOUR NEXT LITTLE ADVENTURE':'MAKE IT YOURS'}</small><h2>${panel==='build'?'What will you build?':panel==='bag'?'Your camp backpack':'Camp journal'}</h2></div><button data-action="close" aria-label="Close camp panel">×</button></div>`;
        if(panel==='build'||panel==='bag'){
          html+=`<p class="cv2-sub">${panel==='build'?'Gems build. Fallen wood helps. Moving things is always free.':'Stored items are free to place. Select an object below to move or use it.'}</p><div class="cv2-catalogue">`;
          for(const [type,d] of Object.entries(catalog).filter(([type])=>panel==='bag'?(s.inventory[type]||0)>0:!['canvas','cabin'].includes(type)))html+=`<button data-type="${type}">${thumb(type)}<strong>${d.name}</strong><small>${s.inventory[type]>0?`${s.inventory[type]} in backpack`:`◆ ${d.price}${d.wood?' · '+d.wood+' wood':''}`}</small></button>`;
          html+='</div>';
          if(panel==='bag')html+=`<h3>In your clearing</h3><div class="cv2-object-list">${s.objects.map(o=>`<button data-select="${esc(o.id)}">${catalog[o.type].name}<small>Column ${o.x+1}, row ${o.y+1}</small></button>`).join('')}</div>`;
        }else{
          html+=`<h3>Beyond the clearing</h3><div class="cv2-object-list">${discoveries.map(d=>`<button data-discovery="${d.id}">${(s.discoveries||[]).includes(d.id)?'✓ ':'◇ '}${d.name}<small>Walk there with your buddy</small></button>`).join('')}</div>`;
          html+=goals.map(g=>`<div class="cv2-goal"><span>${s.projects.includes(g.id)?'✓':'◇'}</span><div><strong>${g.name}</strong><p>${g.text}</p><progress max="${g.target}" value="${Math.min(g.target,g.progress(s))}" aria-label="${g.name}"></progress><small>${s.projects.includes(g.id)?'Completed':`${Math.min(g.target,g.progress(s))}/${g.target} · reward ${g.reward} gems`}</small></div></div>`).join('');
          html+=`<h3>Fallen wood</h3><div class="cv2-object-list">${sources.map((p,i)=>`<button data-source="${i}" ${s.harvested.includes(i)?'disabled':''}>${s.harvested.includes(i)?'Gathered':'Gather 3 wood'}<small>Wood pile ${i+1} · column ${p.x+1}, row ${p.y+1}</small></button>`).join('')}</div><div class="cv2-note"><strong>A place to return to, at your pace.</strong><p>Camp 2 starts with 120 gems and a building kit. A finished learning round earns gems for both camps and brings more fallen wood. Camp 1 keeps its own savings and layout. Fences are for creative play; nothing attacks or damages this clearing.</p></div><button class="primary" data-action="practice">A short learning adventure →</button><div class="cv2-settings"><button data-action="calm" aria-pressed="${!!s.calm}">Gentle motion: ${s.calm?'on':'off'}</button><button data-action="quality" aria-pressed="${s.quality==='low'}">Low power: ${s.quality==='low'?'on':'off'}</button><button data-action="night" aria-pressed="${!!s.night}">${s.night?'Moonlit':'Morning'} scenery</button></div>`;
        }html+='</section>';
      }else if(selected){const o=s.objects.find(o=>o.id===selected);if(o){const d=catalog[o.type];html=`<section class="cv2-card cv2-selection" aria-label="Selected ${d.name}"><div class="cv2-card-heading">${thumb(o.type)}<div><small>YOUR CLEARING</small><h2>${d.name}</h2><p>Column ${o.x+1}, row ${o.y+1}</p></div><button data-action="close" aria-label="Close selection">×</button></div><div class="cv2-actions">${d.action?`<button class="primary" data-action="use">${d.action}</button>`:''}<button data-action="move">Move</button><button data-action="store">Store</button>${d.next?`<button data-action="upgrade">Upgrade · ◆ ${catalog[d.next].price} / ${catalog[d.next].wood} wood</button>`:''}</div></section>`;}}
      if(!html)html=`<div class="cv2-idle"><span>${activity||'Your next adventure starts here.'}</span><button data-action="undo" ${undo&&undo.revision===s.revision?'':'disabled'} aria-label="Undo last Camp 2 action">↶ Undo</button></div>`;
      overlay.innerHTML=html;dirty=true;
    }
    function travel(target,done,text){const path=route(s,explorer,target);if(path===null){tell('No clear walking route. Move an object or add an opening.');return;}mode='explore';seated=null;petTrail=[];walking=path;onArrive=done||null;activity=text||'Exploring with your buddy';activityUntil=0;if(calm()){explorer={...target};pet={x:target.x+.35,y:target.y+.3};walking=[];scene?.focus(target.x+.5,target.y+.5,camera);arrive();}else if(!path.length)arrive();panel=null;selected=null;ui();dirty=true;}
    function arrive(){const done=onArrive;onArrive=null;if(done)done();for(const d of discoveries)if(Math.hypot(explorer.x-d.x,explorer.y-d.y)<2&&!(s.discoveries||[]).includes(d.id)){commit({...s,discoveries:[...(s.discoveries||[]),d.id],revision:s.revision+1});activity=d.text;tell(`Discovered ${d.name}. ${d.text}`);}persistView();activityUntil=performance.now()+7000;ui();}
    function useObject(o){const targets=catalog[o.type].layer==='surface'?[{x:o.x,y:o.y}]:entrances(o);const to=targets.find(p=>route(s,explorer,p)!==null);if(!to){tell('Leave an open route beside this object.');return;}const d=catalog[o.type];travel(to,()=>{if(o.type==='bench')seated=o;activity=o.type==='bench'?'A good seat. A very good dog.':o.type==='feeder'?'A small bird stops by to say hello.':o.type==='fire'?'Warm paws, warm stories.':'A quiet moment at home.';tell(activity);},`Walking to ${d.name.toLowerCase()}`);}
    function dispatch(e){const b=e.target.closest('button');if(!b||b.disabled)return;
      if(b.dataset.discovery){const d=discoveries.find(d=>d.id===b.dataset.discovery);if(d)travel({x:d.x,y:d.y},null,`Exploring ${d.name}`);return;}
      if(b.dataset.source!==undefined){gather(Number(b.dataset.source));return;}
      if(b.dataset.type){choose(b.dataset.type);return;}
      if(b.dataset.select){selected=b.dataset.select;panel=null;ui();host.querySelector('[data-action="move"]')?.focus();return;}
      const a=b.dataset.action,o=s.objects.find(o=>o.id===selected);
      if(a==='v1'||a==='adventure'){persistView();onExit(a==='v1'?'screen-camp':'screen-map');return;}
      if(a==='practice'){persistView();onPractice();return;}
      if(a==='v2')return;
      if(a==='orbit-left'||a==='orbit-right'){camera.angle=(camera.angle||0)+(a==='orbit-left'?-1:1)*Math.PI/4;persistView();dirty=true;return;}
      if(a==='home'){camera={x:0,y:0,zoom:1,angle:0};persistView();dirty=true;return;}
      if(a==='zoom-in'||a==='zoom-out'){camera.zoom=Math.max(.55,Math.min(1.8,camera.zoom*(a==='zoom-in'?1.16:1/1.16)));persistView();dirty=true;return;}
      if(a==='calm'||a==='quality'||a==='night'){commit({...s,[a==='quality'?'quality':a]:a==='quality'?(s.quality==='low'?'standard':'low'):!s[a]});resize();ui();return;}
      if(a==='undo'){if(undo&&undo.revision===s.revision){const previous=undo.before;previous.revision=s.revision+1;previous.camera={...camera};walking=[];onArrive=null;seated=null;activity='';explorer={...previous.explorer};pet={x:explorer.x+.5,y:explorer.y+.3};commit(previous);undo=null;tell('Last action undone, including supplies and project rewards.');}ui();return;}
      if(a==='close'||a==='cancel'){preview=null;selected=null;panel=null;ui();host.querySelector(`[data-action="${mode}"]`)?.focus();return;}
      if(['explore','build','bag','journal'].includes(a)){preview=null;selected=null;if(a==='explore'){mode='explore';panel=null;}else{mode=a==='build'?'build':mode;panel=panel===a?null:a;}ui();return;}
      if(a==='move'&&o){choose(o.type,o.id);return;}
      if(a==='store'&&o){act({kind:'store',id:o.id});return;}
      if(a==='upgrade'&&o&&catalog[o.type].next){choose(catalog[o.type].next,o.id,true);return;}
      if(a==='use'&&o){useObject(o);return;}
      if(preview){if(a==='rotate'&&catalog[preview.type].rotate)preview.r=(preview.r+1)%4;
        if(a.startsWith('nudge-')){const [dx,dy]={'nudge-n':[0,-1],'nudge-s':[0,1],'nudge-w':[-1,0],'nudge-e':[1,0]}[a];preview.x=Math.max(0,Math.min(COLS-1,preview.x+dx));preview.y=Math.max(0,Math.min(ROWS-1,preview.y+dy));}
        if(a==='confirm'){act({kind:preview.upgrade?'upgrade':preview.id?'move':'place',...preview});host.querySelector('[data-action="build"]')?.focus();return;}ui();host.querySelector(`[data-action="${a}"]`)?.focus();}
    }
    host.addEventListener('click',dispatch,{signal});
    function gather(index){const source=sources[index];if(!source)return;const to=entrances({...source,type:'lantern',r:0}).find(p=>route(s,explorer,p)!==null);if(to)travel(to,()=>act({kind:'gather',source:index}),'Gathering fallen wood');else tell('Leave an opening so you can reach the wood.');}
    function tap(px,py){if(focusedPanel()){panel=null;ui();return;}const p=cell(px,py);if(preview){preview.x=p.x;preview.y=p.y;ui();return;}
      const hit=scene?.pick(px,py);
      if(hit?.discovery){const d=discoveries.find(d=>d.id===hit.discovery);if(d)travel({x:d.x,y:d.y},null,`Exploring ${d.name}`);return;}
      if(hit?.source!==undefined){gather(hit.source);return;}
      if(hit?.id){selected=hit.id;ui();return;}
      const ground=s.objects.find(o=>catalog[o.type].layer==='surface'&&o.x===p.x&&o.y===p.y);if(mode==='build'&&ground){selected=ground.id;ui();return;}
      if(mode==='explore'&&worldInside(p.x,p.y))travel(p);else{selected=null;ui();}
    }
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,moved:false};if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={pinch:Math.hypot(a.x-b.x,a.y-b.y),zoom:camera.zoom,moved:true};}},{signal});
    canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&gesture?.pinch){const [a,b]=[...pointers.values()];camera.zoom=Math.max(.55,Math.min(1.8,gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.pinch));}else if(pointers.size===1&&gesture&&!gesture.pinch){const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>8)gesture.moved=true;if(gesture.moved){camera.x=Math.max(-width*2,Math.min(width*2,gesture.cx+dx));camera.y=Math.max(-height*1.5,Math.min(height*1.5,gesture.cy+dy));}}dirty=true;},{signal});
    function endPointer(e,cancel=false){if(!pointers.has(e.pointerId))return;const wasTap=!cancel&&pointers.size===1&&gesture&&!gesture.moved;pointers.delete(e.pointerId);if(wasTap){const r=canvas.getBoundingClientRect();tap(e.clientX-r.left,e.clientY-r.top);}if(!pointers.size){gesture=null;persistView();}else gesture={moved:true,pinch:true};}
    canvas.addEventListener('pointerup',e=>endPointer(e),{signal});canvas.addEventListener('pointercancel',e=>endPointer(e,true),{signal});
    canvas.addEventListener('wheel',e=>{e.preventDefault();camera.zoom=Math.max(.55,Math.min(1.8,camera.zoom*(e.deltaY>0?.93:1.07)));persistView();dirty=true;},{passive:false,signal});
    host.addEventListener('keydown',e=>{if(e.key==='Escape'){preview=null;panel=null;selected=null;ui();return;}if(!preview)return;const keys={ArrowUp:'nudge-n',ArrowDown:'nudge-s',ArrowLeft:'nudge-w',ArrowRight:'nudge-e',r:'rotate'};if(keys[e.key]){e.preventDefault();host.querySelector(`[data-action="${keys[e.key]}"]`)?.click();}},{signal});
    function resize(){width=host.clientWidth||root.innerWidth;height=host.clientHeight||root.innerHeight;scene?.resize(width,height,s.quality);dirty=true;}
    function frame(t){if(disposed)return;raf=requestAnimationFrame(frame);if(document.hidden){last=t;return;}const gap=s.quality==='low'?33:16;if(t-last<gap)return;const dt=Math.min(.05,(t-last)/1000||.016);last=t;
      if(walking.length){const dest=walking[0],dx=dest.x-explorer.x,dy=dest.y-explorer.y,len=Math.hypot(dx,dy),step=dt*2.8;heading=Math.atan2(dx,dy);if(calm()||len<step){explorer={...dest};walking.shift();if(!walking.length)arrive();}else{explorer.x+=dx/len*step;explorer.y+=dy/len*step;}petTrail.push({...explorer});if(petTrail.length>10)pet=petTrail.shift();if(calm())pet={...explorer};scene?.follow(explorer,camera);dirty=true;}
      if(activityUntil&&t>activityUntil){activity='';activityUntil=0;seated=null;ui();}
      if(scene&&(dirty||!calm())){const started=performance.now();scene.render({save:s,camera,explorer,pet,heading,walking:walking.length>0,seated,preview,selected,mode,calm:calm(),activity},t);const elapsed=performance.now()-started;metrics.frames++;metrics.total+=elapsed;metrics.worst=Math.max(metrics.worst,elapsed);if(metrics.frames%60===0){canvas.dataset.submitMs=(metrics.total/metrics.frames).toFixed(1);canvas.dataset.drawCalls=String(scene.stats().calls);canvas.dataset.triangles=String(scene.stats().triangles);canvas.dataset.geometries=String(scene.stats().geometries);canvas.dataset.textures=String(scene.stats().textures);}dirty=false;}
    }
    root.addEventListener('resize',resize,{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)persistView();dirty=true;},{signal});
    tell('Opening the woodland…');
    import('./camp-v2-scene.js').then(module=>{if(disposed)return;scene=module.createScene(canvas,{catalog,footprint,sources,world,avatar,placementReason,onContextRestored:()=>{dirty=true;tell('Your woodland is ready again.');},onContextLost:()=>{tell('The 3D view paused. Your camp is saved. Use Camp 1 or reopen Camp 2.');}});resize();ui();if(navigator.serviceWorker)navigator.serviceWorker.ready.then(reg=>{if(!disposed)reg.active?.postMessage({type:'CACHE_CAMP_3D'});}).catch(()=>{});tell('Welcome to Willowbrook. Your clearing is part of a bigger world.');}).catch(error=>{if(disposed)return;host.classList.add('cv2-no-webgl');canvas.setAttribute('aria-label','3D view unavailable on this device. Use Backpack controls or Camp 1.');panel='bag';ui();tell('3D is unavailable here. Your camp is safe. Use Backpack controls or Camp 1.');});
    resize();ui();raf=requestAnimationFrame(frame);
    return {dispose(){if(disposed)return;persistView();disposed=true;abort.abort();cancelAnimationFrame(raf);scene?.dispose();scene=null;host.classList.remove('cv2-three','cv2-no-webgl');host.innerHTML='';}};
  }
  root.CampV2={world,catalog,COLS,ROWS,sources,fresh,validSave,migrateSave,footprint,placementReason,route,command,awardLearning,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CampV2;
})(typeof window!=='undefined'?window:globalThis);
