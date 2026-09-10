/* Camp 2: renderer-independent commands + a lazy-loaded 3D woodland.
   No V1 inventory, coordinates, or currency are mutated by this experiment. */
(function (root) {
  'use strict';
  const COLS=12, ROWS=10;
  const guide=root.CampGuide||(typeof require==='function'?require('./camp-guide'):null);
  const content=root.CampContent||(typeof require==='function'?require('./camp-content'):null);
  const catalog={
    tent:{name:'Pup Tent',w:2,h:2,layer:'solid',price:30,wood:4,art:'camp-shelter-t2.png',next:'trailtent',action:'Rest'},
    trailtent:{name:'Cozy Pup Tent',w:2,h:2,layer:'solid',price:12,wood:2,need:1,next:'canvas',action:'Rest with buddy',benefit:'A timber doorstep, rolled bedding and a glowing porch lantern. Sit outside with your dog.'},
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
  Object.assign(catalog,content.catalog);
  Object.assign(catalog.fence,{name:'Picket Fence',next:'palisade',connect:'wall'});Object.assign(catalog.gate,{next:'fortgate',connect:'wall'});Object.assign(catalog.path,{connect:'path'});
  Object.assign(catalog.canvas,{need:3});Object.assign(catalog.cabin,{need:4,next:'lodge'});
  const sources=[{x:1,y:6},{x:10,y:6},{x:8,y:1}];
  const clone=value=>JSON.parse(JSON.stringify(value));
  const footprint=(type,rotation=0)=>{const d=catalog[type];return rotation%2?{w:d.h,h:d.w}:{w:d.w,h:d.h};};
  const inside=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=0&&y>=0&&x<COLS&&y<ROWS;
  // Keep the same world target when orbiting or zooming a panned camera.
  function reframeCamera(view,changes){const angle=changes.angle??view.angle??0,zoom=Math.max(.55,Math.min(1.8,changes.zoom??view.zoom)),delta=angle-(view.angle||0),ratio=zoom/view.zoom,c=Math.cos(delta),n=Math.sin(delta);return {...view,x:ratio*(view.x*c-view.y/.7071*n),y:ratio*(view.x*.7071*n+view.y*c),angle,zoom};}
  const worldInside=(x,y)=>Number.isInteger(x)&&Number.isInteger(y)&&x>=content.bounds.minX&&y>=content.bounds.minY&&x<=content.bounds.maxX&&y<=content.bounds.maxY;
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
  for(let z=-25;z<=44;z+=2)for(let x=-38;x<=85;x+=2){
    const n=Math.abs(Math.sin(x*127.1+z*311.7)*43758.5453)%1;
    if((x>=22&&x<=37&&z>=-2&&z<=9)||n<.32||(x>-3&&x<15&&z>-3&&z<13)||Math.abs(x-river(z))<3.4||bridge(z)||discoveries.some(p=>Math.hypot(x-p.x,z-p.y)<3)||Math.abs(x-7)<2&&z>9)continue;
    forest.push({x:x+.2+n*.6,z:z+.25,scale:.72+n*.58,kind:n>.72?'oak':'pine'});
  }
  const treeKey=t=>`${Math.floor(t.x)},${Math.floor(t.z)}`;
  const openGround=(x,y)=>content.civic(x,y)||content.zones.some(z=>z.need===0&&content.inZone(z,x,y));
  const treePresent=(save,t)=>!openGround(Math.floor(t.x),Math.floor(t.z))&&!(save.cleared||[]).includes(treeKey(t));
  const fixedBlocked=(x,z)=>content.groveFence(x,z)||content.town.some(o=>x>=o.x&&x<o.x+o.w&&z>=o.y&&z<o.y+o.h);
  const worldBlocked=(x,z)=>!worldInside(x,z)||water(x+.5,z+.5)||(!openGround(x,z)&&forest.some(t=>Math.floor(t.x)===x&&Math.floor(t.z)===z))||fixedBlocked(x,z);
  const world={river,bridge,water,groundHeight,walkHeight,discoveries,forest,inside:worldInside,blocked:worldBlocked,content,treeKey,treePresent};
  const overlaps=(a,b)=>a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;
  function fresh(){
    return {v:3,mastered:0,stone:0,fish:0,casts:3,tools:[],land:['homestead'],cleared:[],challenge:null,construction:null,qaProvision:0,worldId:'willowbrook-1',discoveries:[],revision:0,nextId:8,gems:120,wood:10,inventory:{path:8,deck:4,fence:6,gate:1,lantern:1},
      objects:[{id:'o1',type:'tent',x:3,y:2,r:0},{id:'o2',type:'fire',x:7,y:5,r:0},
        {id:'o3',type:'bench',x:4,y:6,r:0},{id:'o4',type:'pine',x:9,y:2,r:0},
        {id:'o5',type:'feeder',x:8,y:7,r:0},{id:'o6',type:'path',x:5,y:4,r:0},{id:'o7',type:'path',x:5,y:5,r:0}],
      explorer:{x:6,y:7},camera:{x:0,y:0,zoom:1},harvested:[],projects:[],quality:'standard',calm:false,night:false,visits:0};
  }
  function freshExpedition(){const s=fresh();s.gems=30;s.wood=6;s.objects=s.objects.filter(o=>['tent','fire'].includes(o.type));s.inventory={path:4,fence:4,gate:1};s.openingIntro=true;return s;}
  function validSave(s){
    if(!s||![1,2,3].includes(s.v)||!Number.isInteger(s.revision)||!Number.isInteger(s.nextId)||s.nextId<1||!Array.isArray(s.objects)||s.objects.length>240)return false;
    if(s.v>=2&&s.worldId!=='willowbrook-1')return false;
    if(!Number.isFinite(s.gems)||s.gems<0||!Number.isFinite(s.wood)||s.wood<0||!s.inventory||typeof s.inventory!=='object')return false;
    if(!s.explorer||!worldInside(s.explorer.x,s.explorer.y)||!s.camera||!['x','y','zoom'].every(k=>Number.isFinite(s.camera[k]))||s.camera.zoom<.55||s.camera.zoom>1.8)return false;
    if(s.camera.angle!==undefined&&!Number.isFinite(s.camera.angle))return false;
    if(s.discoveries!==undefined&&(!Array.isArray(s.discoveries)||!s.discoveries.every(id=>discoveries.some(d=>d.id===id))))return false;
    if(s.v===3){
      if(!['stone','fish','casts','mastered'].every(k=>Number.isInteger(s[k])&&s[k]>=0)||s.mastered>13||s.casts>3)return false;
      if(!Array.isArray(s.tools)||s.tools.some(t=>t!=='rod')||!Array.isArray(s.land)||s.land.some(id=>!content.zones.some(z=>z.id===id)))return false;
      if(!Array.isArray(s.cleared)||s.cleared.some(id=>!forest.some(t=>treeKey(t)===id)))return false;
      if(s.construction&&!s.objects.some(o=>o.id===s.construction.objectId))return false;
      if(s.challenge&&((s.challenge.kind==='land'&&!content.zones.some(z=>z.id===s.challenge.target))||(s.challenge.kind==='tree'&&!forest.some(t=>treeKey(t)===s.challenge.target))))return false;
      if(s.challenge&&(!['fish','tree','land'].includes(s.challenge.kind)||!Array.isArray(s.challenge.questions)||s.challenge.questions.length!==3||!Number.isInteger(s.challenge.index)||s.challenge.index<0||s.challenge.index>2||s.challenge.questions.some(q=>!Number.isInteger(q.a)||!Number.isInteger(q.b)||q.a<0||q.a>12||q.b<0||q.b>12)))return false;
    }
    if(!Object.entries(s.inventory).every(([k,v])=>catalog[k]&&Number.isInteger(v)&&v>=0&&v<=10000))return false;
    if(!Array.isArray(s.harvested)||!s.harvested.every(n=>Number.isInteger(n)&&n>=0&&n<sources.length)||!Array.isArray(s.projects))return false;
    const ids=new Set();
    for(const o of s.objects){if(!o||typeof o.id!=='string'||ids.has(o.id)||!catalog[o.type]||!worldInside(o.x,o.y)||!Number.isInteger(o.r)||o.r<0||o.r>3)return false;ids.add(o.id);}
    return s.objects.every(o=>!placementReason(s,o.type,o.x,o.y,o.r,o.id,false));
  }
  function migrateSave(save){
    if(!validSave(save))return null;
    if(save.v===3)return save;
    return {...clone(save),v:3,worldId:'willowbrook-1',mastered:0,stone:0,fish:0,casts:3,tools:[],land:[],cleared:[],challenge:null,construction:null,qaProvision:0,discoveries:save.discoveries||[],camera:{...save.camera,angle:save.camera.angle||0}};
  }
  function route(s,from,to){
    const occupied=new Set(),mark=(x,y)=>occupied.add(x+','+y);
    for(const t of forest)if(treePresent(s,t))mark(Math.floor(t.x),Math.floor(t.z));
    for(const p of sources)mark(p.x,p.y);
    const gb=content.grove;for(let x=gb.x;x<gb.x+gb.w;x++)for(let y=gb.y;y<gb.y+gb.h;y++)if(content.groveFence(x,y))mark(x,y);
    for(const o of [...content.town,...s.objects.filter(o=>catalog[o.type].layer==='solid'||o.type==='moat'&&!s.objects.some(b=>b.type==='drawbridge'&&b.x===o.x&&b.y===o.y))]){const size=o.w?o:footprint(o.type,o.r);for(let dx=0;dx<size.w;dx++)for(let dy=0;dy<size.h;dy++)mark(o.x+dx,o.y+dy);}
    const isBlocked=(x,y)=>!worldInside(x,y)||water(x+.5,y+.5)||occupied.has(x+','+y);
    const start={x:Math.round(from.x),y:Math.round(from.y)};
    if(isBlocked(to.x,to.y))return null;
    // Prefer the authored streets and woodland trail without preventing free exploration.
    const heap=[],distance=new Map([[start.x+','+start.y,0]]),parents=new Map();
    function push(p){heap.push(p);let i=heap.length-1;while(i){const j=(i-1)>>1;if(heap[j].cost<=p.cost)break;heap[i]=heap[j];i=j;}heap[i]=p;}
    function pop(){const first=heap[0],last=heap.pop();if(heap.length){let i=0;while(i*2+1<heap.length){let j=i*2+1;if(j+1<heap.length&&heap[j+1].cost<heap[j].cost)j++;if(heap[j].cost>=last.cost)break;heap[i]=heap[j];i=j;}heap[i]=last;}return first;}
    push({...start,cost:0});
    while(heap.length){const p=pop(),pk=p.x+','+p.y;if(p.cost!==distance.get(pk))continue;
      if(p.x===to.x&&p.y===to.y){const out=[];let k=pk;while(parents.has(k)){const [x,y]=k.split(',').map(Number);out.unshift({x,y});k=parents.get(k);}return out;}
      for(const [dx,dy] of [[0,1],[1,0],[0,-1],[-1,0]]){const x=p.x+dx,y=p.y+dy,k=x+','+y;if(isBlocked(x,y))continue;const cost=p.cost+(content.roadAt(x,y)?1:x>=57&&x<62?16:4);if(cost>=(distance.get(k)??Infinity))continue;distance.set(k,cost);parents.set(k,pk);push({x,y,cost});}
    }return null;
  }
  function entrances(o){const {w,h}=footprint(o.type,o.r);return [{x:o.x,y:o.y+h},{x:o.x+w,y:o.y},{x:o.x-1,y:o.y},{x:o.x,y:o.y-1}];}
  function placementReason(s,type,x,y,r=0,ignore=null,checkAccess=true){
    const d=catalog[type];if(!d)return 'Unknown item';
    const size=footprint(type,r),box={x,y,...size};
    if(overlaps(box,{x:-7,y:0,w:4,h:4}))return 'Leave the Story Stones as a shared garden';
    for(let dx=0;dx<size.w;dx++)for(let dy=0;dy<size.h;dy++)if(!buildable(s,x+dx,y+dy))return 'Keep the footprint on unlocked land; clear a parcel from the Journal';
    if(forest.some(t=>treePresent(s,t)&&overlaps(box,{x:Math.floor(t.x),y:Math.floor(t.z),w:1,h:1})))return 'Review to clear this tree first';
    if(s.objects.some(o=>o.id!==ignore&&((o.type==='moat'&&type!=='drawbridge'&&type!=='moat')||(type==='moat'&&o.type!=='drawbridge'&&o.type!=='moat'))&&overlaps(box,{...o,...footprint(o.type,o.r)})))return 'Use a drawbridge to cross a moat';
    if(sources.some(p=>overlaps(box,{...p,w:1,h:1})))return 'Leave the wood piles reachable';
    if(s.objects.some(o=>o.id!==ignore&&catalog[o.type].layer===d.layer&&overlaps(box,{...o,...footprint(o.type,o.r)})))return d.layer==='surface'?'A ground tile is already here':'Another object is in the way';
    if(checkAccess&&(d.layer==='solid'||d.layer==='water')){
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
  function buildable(s,x,y){return inside(x,y)||content.zones.some(z=>z.need===0&&content.inZone(z,x,y))||(s.land||[]).some(id=>{const z=content.zones.find(z=>z.id===id);return z&&content.inZone(z,x,y);});}
  function unlockReason(s,type){const d=catalog[type];return (s.mastered||0)<(d?.need||0)?'Complete '+d.need+' Realm Challenges to unlock this blueprint':'';}
  function syncProgress(save,mastered,tester=false){let s=migrateSave(save);if(!s)return save;s=clone(s);s.mastered=Math.max(s.mastered,Math.min(13,Math.max(0,Math.floor(mastered||0))));for(const z of content.zones)if(z.need===0&&!s.land.includes(z.id))s.land.push(z.id);if(tester&&s.qaProvision!==2){s=provision(s);s.qaProvision=2;}if(tester)for(const z of content.zones)if(!s.land.includes(z.id))s.land.push(z.id);return s;}
  function provision(save){const s=clone(save);s.mastered=13;s.gems=Math.max(s.gems,99999);s.wood=Math.max(s.wood,9999);s.stone=Math.max(s.stone,9999);s.fish=Math.max(s.fish,99);s.casts=3;s.tools=['rod'];s.land=content.zones.map(z=>z.id);for(const [k,d] of Object.entries(catalog))s.inventory[k]=Math.max(s.inventory[k]||0,d.w*d.h===1?200:5);return s;}
  function command(save,cmd,context={}){
    if(!validSave(save))return {ok:false,message:'This camp needs recovery. Camp 1 is still available.'};
    if(cmd.revision!==undefined&&cmd.revision!==save.revision)return {ok:false,message:'The camp changed. Please select the item again.'};
    const s=clone(migrateSave(save));let message='',reviewEvent=null,o=s.objects.find(o=>o.id===cmd.id),d=catalog[cmd.type];
    if(['place','move','upgrade'].includes(cmd.kind)){
      const type=cmd.kind==='upgrade'&&o?catalog[o.type].next:cmd.kind==='move'&&o?o.type:cmd.type;
      d=catalog[type];if(!d||((cmd.kind==='move'||cmd.kind==='upgrade')&&!o))return {ok:false,message:'Select an available object'};
      if(cmd.kind!=='move'&&!((s.inventory[type]||0)>0)&&unlockReason(s,type))return {ok:false,message:unlockReason(s,type)};
      if(cmd.kind!=='move'&&s.construction)return {ok:false,message:'Finish the current building first'};
      const r=d.rotate?((Math.trunc(Number(cmd.r)||0)%4)+4)%4:0;
      const reason=placementReason(s,type,cmd.x,cmd.y,r,o&&o.id);if(reason)return {ok:false,message:reason};
      if(cmd.kind!=='move'){
        if((s.inventory[type]||0)>0)s.inventory[type]--;
        else {if(s.gems<d.price||s.wood<d.wood||s.stone<(d.stone||0))return {ok:false,message:`Needs ${d.price} gems and ${d.wood} wood and ${d.stone||0} stone. Practice earns gems; explore for wood.`};s.gems-=d.price;s.wood-=d.wood;s.stone-=d.stone||0;}
      }
      if(o){o.type=type;o.x=cmd.x;o.y=cmd.y;o.r=r;}else {let id;do{id=`o${s.nextId++}`;}while(s.objects.some(o=>o.id===id));s.objects.push({id,type,x:cmd.x,y:cmd.y,r});}
      if(cmd.kind!=='move'&&d.w*d.h>=4){const built=o||s.objects[s.objects.length-1];s.construction={objectId:built.id};}
      message=cmd.kind==='upgrade'?`${d.name} built!`:`${d.name} placed`;
    }else if(cmd.kind==='store'){
      if(!o)return {ok:false,message:'Select an object first'};
      if(s.construction?.objectId===o.id)s.construction=null;
      s.objects=s.objects.filter(i=>i.id!==o.id);s.inventory[o.type]=(s.inventory[o.type]||0)+1;message=`${catalog[o.type].name} is in your backpack`;
    }else if(cmd.kind==='gather'){
      if(!sources[cmd.source]||s.harvested.includes(cmd.source))return {ok:false,message:'All gathered here. A learning round brings more fallen wood.'};
      s.harvested.push(cmd.source);s.wood+=3;message='+3 wood! Nothing was cut down.';
    }else if(cmd.kind==='finish-build'){
      if(!s.construction)return {ok:false,message:'Nothing to assemble'};s.construction=null;message='Built together. Make yourself at home!';
    }else if(cmd.kind==='paint'){
      if(!o)return {ok:false,message:'Select an object'};o.color=((o.color||0)+1)%5;message='A new colour, just for your camp.';
    }else if(cmd.kind==='refill'){
      if(!context.tester)return {ok:false,message:'Tester supplies are only for Summit Tester'};Object.assign(s,provision(s));message='Tester supplies refilled: gems, wood, stone, fish, rod, and building kit.';
    }else if(cmd.kind==='buy'){
      const offer=content.offers[cmd.offer];if(!offer)return {ok:false,message:'Choose a store item'};
      if(Math.hypot(s.explorer.x-26,s.explorer.y-4)>2)return {ok:false,message:'Visit the supply store across the bridge'};
      if(s.mastered<(offer.need||0))return {ok:false,message:'Complete '+offer.need+' Realm Challenges first'};
      if(offer.tool&&s.tools.includes(offer.tool))return {ok:false,message:'You already own a fishing rod'};
      if(s.gems<(offer.price||0)||s.wood<(offer.woodCost||0)||s.fish<(offer.fishCost||0))return {ok:false,message:'Not enough supplies for that trade'};
      s.gems+=(offer.gems||0)-(offer.price||0);s.wood+=(offer.wood||0)-(offer.woodCost||0);s.stone+=offer.stone||0;s.fish-=offer.fishCost||0;if(offer.tool)s.tools.push(offer.tool);message=offer.name+' added to your supplies.';
    }else if(cmd.kind==='start-activity'){
      if(s.challenge)return {ok:false,message:'Finish or leave your current review first'};
      const kind=cmd.activity,target=cmd.target;
      if(kind==='fish'){if(!s.tools.includes('rod'))return {ok:false,message:'Buy a fishing rod at the supply store'};if(s.casts<1)return {ok:false,message:'A learning adventure brings three more fishing trips'};if(Math.hypot(s.explorer.x-14,s.explorer.y-8)>2)return {ok:false,message:'Walk to the fishing dock first'};}
      else if(kind==='tree'){const t=forest.find(t=>treeKey(t)===target);if(!t||!treePresent(s,t))return {ok:false,message:'That tree is already cleared'};if(Math.hypot(s.explorer.x-Math.floor(t.x),s.explorer.y-Math.floor(t.z))>2)return {ok:false,message:'Walk beside the tree first'};}
      else if(kind==='land'){const z=content.zones.find(z=>z.id===target);if(!z||s.land.includes(target))return {ok:false,message:'This parcel is already open'};if(s.mastered<z.need)return {ok:false,message:'Complete '+z.need+' Realm Challenges to open '+z.name};if(Math.hypot(s.explorer.x-z.x,s.explorer.y-z.y)>3)return {ok:false,message:'Walk to the parcel marker first'};}
      else return {ok:false,message:'Choose a woodland activity'};
      if(!Array.isArray(cmd.questions)||cmd.questions.length!==3||cmd.questions.some(q=>!Number.isInteger(q.a)||!Number.isInteger(q.b)||q.a<0||q.a>12||q.b<0||q.b>12))return {ok:false,message:'Review questions are unavailable'};
      s.challenge={kind,target:target||null,questions:cmd.questions.map(q=>({a:q.a,b:q.b})),index:0,retry:false,feedback:false};message='Three facts, at your pace. Mistakes are for learning.';
    }else if(cmd.kind==='cancel-activity'){s.challenge=null;message='You can come back to this activity.';
    }else if(cmd.kind==='answer-activity'){
      const c=s.challenge;if(!c)return {ok:false,message:'Start a review activity first'};const q=c.questions[c.index],correct=Number(cmd.answer)===q.a*q.b;
      if(String(cmd.answer).trim()===''||!Number.isFinite(Number(cmd.answer)))return {ok:false,message:'Enter an answer'};
      reviewEvent={...q,correct,firstTry:!c.retry};if(!correct){c.retry=true;c.feedback=true;message='Let’s build the groups together. Try this one again.';}
      else{c.index++;c.retry=false;c.feedback=false;message='That’s it!';if(c.index===3){if(c.kind==='fish'){s.fish++;s.casts--;message='Fish caught! Trade it for gems or stone in town.';}else if(c.kind==='tree'){s.cleared.push(c.target);s.wood+=6;message='+6 wood. This tree is cleared.';}else{const z=content.zones.find(z=>z.id===c.target);s.land.push(c.target);const t=forest.find(t=>content.inZone(z,Math.floor(t.x),Math.floor(t.z))&&treePresent(s,t));if(t)s.cleared.push(treeKey(t));s.wood+=6;message=z.name+' is now buildable! +6 wood. Keep or clear its remaining trees.';}s.challenge=null;}}
    }else return {ok:false,message:'Unknown camp action'};
    if(s.objects.length>240)return {ok:false,message:'Store an object before adding more to this camp'};
    for(const g of goals)if(!s.projects.includes(g.id)&&g.progress(s)>=g.target){s.projects.push(g.id);s.gems+=g.reward;message+=` ${g.name} complete · +${g.reward} gems!`;}
    s.revision++;return {ok:true,save:s,message,reviewEvent};
  }
  function awardLearning(save,gems){if(!validSave(save))return save;const s=clone(migrateSave(save));s.gems+=Math.max(0,Math.floor(Number(gems)||0));s.harvested=[];s.casts=3;s.wood+=2;if(s.mastered>=5)s.stone+=2;s.revision++;return s;}

  function mount(host,options){
    const {getSave,setSave,profileId,avatar,onExit,onPractice}=options;
    let s=getSave(),disposed=false,mode='explore',panel=s.openingIntro?'welcome':null,selected=null,preview=null,undo=null;
    let explorer={...(s.explorer||{x:6,y:7})},pet={x:explorer.x+.6,y:explorer.y+.5},walking=[],onArrive=null,activity='',activityUntil=0,seated=null;
    let camera={x:0,y:0,zoom:1,...s.camera},width=0,height=0,raf=0,last=0,dirty=true,pointers=new Map(),gesture=null;
    const abort=new AbortController(),signal=abort.signal;let scene=null,petTrail=[],heading=0,building=null,category='all',selectedGuardian=null;const guardians=options.guardians||[];const metrics={frames:0,total:0,worst:0};
    const esc=v=>String(v).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
    const ico={explore:'⌖',build:'⚒',bag:'▣',journal:'☷',home:'⌂',back:'‹',rotate:'↻',undo:'↶'};
    host.innerHTML=`<div class="cv2-shell"><canvas class="cv2-world" role="img" aria-label="Your living camp. Use the camp object list for accessible building."></canvas><header class="cv2-header"><button data-action="adventure" aria-label="Back to Adventure">‹</button><img class="cv2-profile-portrait" src="${esc(avatar)}" alt="Your selected explorer"><div class="cv2-brand"><small>CAMP 2 · WOODLAND</small><h1>Willowbrook Camp</h1></div><div class="cv2-purse" aria-label="Camp 2 supplies"></div></header><div class="cv2-switch" aria-label="Compare camps"><button data-action="v1">Camp 1</button><button aria-current="page" data-action="v2">Camp 2 <span>NEW</span></button></div><div class="cv2-land-shortcut"><button data-action="land">My land</button><button data-action="upgrades">Upgrades</button></div><div class="cv2-camera"><button data-action="zoom-in" aria-label="Zoom in">+</button><button data-action="zoom-out" aria-label="Zoom out">−</button><button data-action="home" aria-label="Center camp">⌂</button><button data-action="orbit-left" aria-label="Rotate camera left">↶</button><button data-action="orbit-right" aria-label="Rotate camera right">↷</button></div><div class="cv2-land-legend" aria-label="Land grid key"><span>Open land</span><span>Future land</span></div><div class="cv2-hint"></div><div class="cv2-overlay"></div><nav class="cv2-dock" aria-label="Camp 2 tools">${[['explore','Explore'],['build','Build'],['bag','Backpack'],['journal','Journal']].map(([k,n])=>`<button data-action="${k}"><span aria-hidden="true">${ico[k]}</span>${n}</button>`).join('')}</nav><div class="cv2-announcement" role="status" aria-live="polite"></div></div>`;
    const canvas=host.querySelector('canvas'),overlay=host.querySelector('.cv2-overlay');host.classList.add('cv2-three');canvas.setAttribute('aria-label','3D woodland camp. Tap to walk, drag to pan. Backpack offers accessible object controls.');
    const motionQuery=root.matchMedia?.('(prefers-reduced-motion: reduce)');
    const calm=()=>s.calm||options.reducedMotion()||motionQuery?.matches;
    function point(x,y,z=0){return scene?scene.project(x,y,z):{x:width/2,y:height*.45};}
    function cell(px,py){return scene?scene.cell(px,py):{x:-99,y:-99};}
    function tell(text){host.querySelector('.cv2-announcement').textContent=text;}
    function commit(next){if(disposed||options.currentProfileId()!==profileId)return false;s=next;setSave(next);dirty=true;return true;}
    function persistView(){if(disposed)return;commit({...s,camera:{...camera},explorer:{x:Math.round(explorer.x),y:Math.round(explorer.y)}});}
    function act(cmd){explorer={x:Math.round(explorer.x),y:Math.round(explorer.y)};persistView();const before=clone(s),r=command(s,{...cmd,revision:s.revision},{tester:options.tester});if(!r.ok){tell(r.message);return false;}if(!commit(r.save))return false;if(cmd.kind==='finish-build'){if(undo)undo.revision=s.revision;}else undo=['place','move','upgrade','store','paint'].includes(cmd.kind)?{before,revision:s.revision}:null;preview=null;selected=null;walking=[];onArrive=null;seated=null;building=null;activity='';if(r.reviewEvent)options.onReview?.(r.reviewEvent);tell(r.message);ui();return true;}
    function focusedPanel(){return !!panel;}
    function thumb(type){const picture=scene?.thumbnail(type);if(picture)return '<img class="cv2-thumb model-preview" src="'+picture+'" alt="" aria-hidden="true">';const icons={tent:'⛺',canvas:'⛺',cabin:'⌂',fire:'♨',bench:'▰',lantern:'✧',path:'▱',deck:'▤',pine:'♠',feeder:'⌂',fence:'╫',gate:'⊓'};return '<span class="cv2-thumb modeled '+type+'" aria-hidden="true">'+(icons[type]||'⌂')+'</span>';}
    function choose(type,id=null,upgrade=false){if(width<600)camera.zoom=Math.max(1.4,camera.zoom);const o=s.objects.find(o=>o.id===id);mode='build';panel=null;selected=id;walking=[];onArrive=null;seated=null;explorer={x:Math.round(explorer.x),y:Math.round(explorer.y)};persistView();const center=scene?.cell(width*.5,height*.36),near={x:explorer.x-2,y:explorer.y-2},start=center&&buildable(s,center.x,center.y)?center:buildable(s,near.x,near.y)?near:{x:Math.min(COLS-3,Math.max(0,near.x)),y:Math.min(ROWS-3,Math.max(0,near.y))};preview={type,id,upgrade,x:o?o.x:start.x,y:o?o.y:start.y,r:o?o.r:0,brush:!id&&!!catalog[type].connect};scene?.focus(preview.x+1,preview.y+1,camera,true);ui();dirty=true;}
    function ui(){
      host.classList.toggle('cv2-calm',calm());
      host.querySelector('.cv2-purse').innerHTML=`<strong>◆ ${s.gems}</strong><small>Wood ${s.wood} · Stone ${s.stone}</small><small>Fish ${s.fish} · ${s.mastered}/13 families</small>`;
      host.querySelectorAll('.cv2-dock button').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===(panel||mode))));
      host.querySelector('.cv2-hint').textContent=preview?(preview.brush?'Build brush · tap squares to place · drag to pan':'Tap ground to preview. Confirm when it fits.'):mode==='explore'?'Tap to walk · drag to pan · ↶ ↷ turn the world':'Tap an object to edit, or choose something to build';
      let html='';
      if(s.challenge){const c=s.challenge,q=c.questions[c.index];html='<section class="cv2-card cv2-review" aria-label="Woodland review"><small>'+({fish:'FISHING',tree:'TREE CLEARING',land:'NEW LAND'}[c.kind])+' · '+c.index+'/3 complete · No timer</small><h2>'+q.a+' × '+q.b+' = ?</h2><label for="camp-review-answer">Your answer</label><div class="cv2-review-entry"><input id="camp-review-answer" inputmode="numeric" autocomplete="off" maxlength="3" aria-label="Review answer"><button class="primary" data-action="answer-review">Check answer</button></div>'+ (c.feedback?'<p>Let’s see the groups. Your completed steps are safe.</p>'+root.MathVisuals.render(q.a,q.b):'<p>Three facts earn useful supplies. Take the time you need.</p>')+'<button data-action="leave-review">Leave activity</button></section>';}
      else if(panel==='land')html=guide.land(s,content);
      else if(panel==='upgrades')html=guide.upgrades(s,catalog,thumb,unlockReason);
      else if(panel==='welcome')html=guide.welcome(s);
      else if(preview?.brush){const d=catalog[preview.type],reason=placementReason(s,preview.type,preview.x,preview.y,preview.r);html=`<section class="cv2-card cv2-brush" aria-label="Continuous ${esc(d.name)} building"><div class="cv2-tray-title"><div><small>BUILD BRUSH · TAP TO PLACE</small><h2>${d.name}</h2></div><button data-action="cancel">Done</button></div><p>${s.inventory[preview.type]>0?s.inventory[preview.type]+' in backpack':`◆ ${d.price} · ${d.wood} wood${d.stone?' · '+d.stone+' stone':''}`} · each square</p><p class="${!preview.lastPlaced&&reason?'invalid':'valid'}">${preview.lastPlaced?'Placed! Tap another square.':reason||'Ready to place.'}</p><div class="cv2-nudges">${[['nudge-n','↑','Move north'],['nudge-w','←','Move west'],['nudge-s','↓','Move south'],['nudge-e','→','Move east']].map(([a,t,l])=>`<button data-action="${a}" aria-label="${l}">${t}</button>`).join('')}<button data-action="rotate" aria-label="Rotate object" ${d.rotate?'':'disabled'}>↻</button></div><div class="cv2-actions"><button data-action="undo" ${undo&&undo.revision===s.revision?'':'disabled'}>Undo last piece</button><button data-action="confirm" class="primary" ${reason?'disabled':''}>Place here</button></div></section>`;}
      else if(preview){const d=catalog[preview.type],reason=placementReason(s,preview.type,preview.x,preview.y,preview.r,preview.id)||((preview.upgrade||!preview.id)&&!(s.inventory[preview.type]>0)?unlockReason(s,preview.type):'');
        html=`<section class="cv2-card cv2-placement" aria-label="Place ${esc(d.name)}"><div class="cv2-card-heading">${thumb(preview.type)}<div><small>${preview.upgrade?'UPGRADE':preview.id?'MOVE':'BUILD'}</small><h2>${esc(d.name)}</h2><p class="${reason?'invalid':'valid'}">${reason?'⊘ '+reason:'✓ Clear space'} · ${preview.x+1}, ${preview.y+1}</p><p>${preview.id&&!preview.upgrade?'Moving is free':(s.inventory[preview.type]||0)>0?'From your backpack · no cost':`◆ ${d.price} · ${d.wood} wood${d.stone?' · '+d.stone+' stone':''}`}</p></div></div><div class="cv2-nudges" aria-label="Adjust placement">${[['nudge-n','↑','Move north'],['nudge-w','←','Move west'],['nudge-s','↓','Move south'],['nudge-e','→','Move east']].map(([a,t,l])=>`<button data-action="${a}" aria-label="${l}">${t}</button>`).join('')}<button data-action="rotate" ${d.rotate?'':'disabled'} aria-label="Rotate object">↻</button></div><div class="cv2-actions"><button data-action="cancel">Cancel</button><button class="primary" data-action="confirm" ${reason?'disabled':''}>${preview.upgrade?'Build upgrade':preview.id?'Move here':'Place here'}</button></div></section>`;
      }else if(panel==='sanctuary'||panel==='guardian'){
        const resident=guardians.find(g=>g.family===selectedGuardian);
        html='<section class="cv2-card cv2-tray" aria-label="Guardian Grove"><div class="cv2-tray-title"><div><small>FRIENDS FROM YOUR ADVENTURES</small><h2>'+ (panel==='guardian'&&resident?esc(resident.name):'Guardian Grove')+'</h2></div><button data-action="close" aria-label="Close camp panel">×</button></div>';
        if(panel==='guardian'&&resident){html+='<p>The ×'+resident.family+' guardian has a home here because you won their realm battle. Stop by to celebrate or practise together.</p><div class="cv2-actions"><button data-action="guardian-practice" class="primary">Practise ×'+resident.family+' together</button><button data-location="sanctuary">All guardians</button></div>';}
        else html+='<p>'+guardians.filter(g=>g.defeated).length+'/13 guardians welcomed. Win a realm battle to bring its guardian home. No cages, and no rewards lost when you are away.</p><div class="cv2-guardian-list">'+guardians.map(g=>'<button data-guardian="'+g.family+'" '+(g.defeated?'':'disabled')+'><span class="cv2-family-medal" style="background:'+esc(g.color)+'">×'+g.family+'</span><span>'+esc(g.name)+'<small>'+(g.defeated?'Visit in the grove':'Win this realm battle')+'</small></span></button>').join('')+'</div>';
        html+='</section>';
      }else if(panel==='place-info'){
        const place=content.locations.find(p=>p.id===selectedGuardian);html='<section class="cv2-card" aria-label="World destination"><div class="cv2-tray-title"><div><small>EXPLORE WILLOWBROOK</small><h2>'+esc(place?.name||'Willowbrook')+'</h2></div><button data-action="close" aria-label="Close camp panel">×</button></div><p>'+({market:'A market of striped awnings, handmade supplies and neighbours. Mara trades your earned supplies just across the square.',gardens:'A quiet garden for every explorer. Follow the rose walk, find the fountain, and plan what you will build next.',mill:'The stream turns the wheel while the village rests. Every big world starts with small steps.'}[selectedGuardian]||'There is more to discover here.')+'</p><button data-location="store">Visit Mara’s store</button></section>';
      }else if(panel==='store'){
        html='<section class="cv2-card cv2-tray" aria-label="Camp supply store"><div class="cv2-tray-title"><div><small>WILLOWBROOK VILLAGE</small><h2>Mara’s Supply Store</h2></div><button data-action="close" aria-label="Close camp panel">×</button></div><p>Everything is bought with supplies earned through learning. Fish can be traded here.</p><div class="cv2-object-list">'+Object.entries(content.offers).map(([id,o])=>'<button data-buy="'+id+'" '+(o.tool&&s.tools.includes(o.tool)?'disabled':'')+'>'+o.name+'<small>'+(o.tool&&s.tools.includes(o.tool)?'Owned':o.fishCost?'1 fish':o.price+' gems'+(o.woodCost?' + '+o.woodCost+' wood':'')+(o.need?' · '+o.need+' families':''))+'</small></button>').join('')+'</div></section>';
      }else if(focusedPanel()){
        html=`<section class="cv2-card cv2-tray" aria-label="${panel==='build'?'Build catalogue':panel==='bag'?'Backpack and objects':'Camp journal'}"><div class="cv2-tray-title"><div><small>${panel==='journal'?'YOUR NEXT LITTLE ADVENTURE':'MAKE IT YOURS'}</small><h2>${panel==='build'?'What will you build?':panel==='bag'?'Your camp backpack':'Camp journal'}</h2></div><button data-action="close" aria-label="Close camp panel">×</button></div>`;
        if(panel==='build'||panel==='bag'){
          if(panel==='build')html+='<div class="cv2-categories">'+[['all','All'],['home','Homes'],['wall','Defenses'],['path','Paths'],['nature','Nature']].map(([id,label])=>'<button data-category="'+id+'" aria-pressed="'+(category===id)+'">'+label+'</button>').join('')+'</div>';
          html+=`<p class="cv2-sub">${panel==='build'?'Gems build. Fallen wood helps. Moving things is always free.':'Stored items are free to place. Select an object below to move or use it.'}</p><div class="cv2-catalogue">`;
          for(const [type,d] of Object.entries(catalog).filter(([type,d])=>panel==='bag'?(s.inventory[type]||0)>0:category==='all'||category==='wall'&&(d.connect==='wall'||['tower','moat','drawbridge'].includes(type))||category==='path'&&(d.connect==='path'||type==='deck')||category==='home'&&(d.w*d.h>=4&&type!=='pine')||category==='nature'&&['pine','feeder','flowerbed','well','stonewell','fire','bench','lantern'].includes(type))){const locked=unlockReason(s,type)&&!(s.inventory[type]>0);html+=`<button data-type="${type}" ${locked?'disabled':''}>${thumb(type)}<strong>${d.name}</strong><small>${locked?'🔒 '+d.need+' families':s.inventory[type]>0?`${s.inventory[type]} in backpack`:`◆ ${d.price}${d.wood?' · '+d.wood+' wood':''}${d.stone?' · '+d.stone+' stone':''}`}</small></button>`;}
          html+='</div>';
          if(panel==='bag')html+=`<h3>In your clearing</h3><div class="cv2-object-list">${s.objects.map(o=>`<button data-select="${esc(o.id)}">${catalog[o.type].name}<small>Column ${o.x+1}, row ${o.y+1}</small></button>`).join('')}</div>`;
        }else{
          html+='<div class="cv2-destinations">'+content.locations.filter(p=>!['store','fish'].includes(p.id)).map(p=>'<button data-location="'+p.id+'">'+p.name+'<small>'+ (p.id==='sanctuary'?guardians.filter(g=>g.defeated).length+'/13 guardians welcomed':'Walk there with your buddy')+'</small></button>').join('')+'</div><div class="cv2-object-list"><button data-location="store">Visit the supply store<small>Across Willow Bridge</small></button><button data-location="fish">Go fishing<small>'+(s.tools.includes('rod')?s.casts+' catches before your next learning adventure':'Buy a rod in town · 2 families')+'</small></button></div><h3>Your camp journey · '+s.mastered+'/13 families</h3><p>'+ (content.milestones[s.mastered]?'Next: '+content.milestones[s.mastered]:'Your fortress toolkit is complete. Build your own way.')+'</p><h3>More room to build</h3><div class="cv2-object-list">'+content.zones.map(z=>'<button data-land="'+z.id+'" '+(s.mastered<z.need?'disabled':'')+'>'+z.name+'<small>'+(s.land.includes(z.id)?'Open · '+z.w+' × '+z.h:s.mastered<z.need?'Unlock: '+z.need+' families':'Review 3 facts to open '+z.w+' × '+z.h)+'</small></button>').join('')+'</div><h3>Forest trees</h3><div class="cv2-object-list">'+forest.filter(t=>treePresent(s,t)&&worldInside(Math.floor(t.x),Math.floor(t.z))).sort((a,b)=>Math.hypot(a.x-explorer.x,a.z-explorer.y)-Math.hypot(b.x-explorer.x,b.z-explorer.y)).slice(0,6).map(t=>'<button data-tree="'+treeKey(t)+'">Clear a tree · +6 wood<small>'+Math.floor(t.x)+', '+Math.floor(t.z)+' · three review facts'+(buildable(s,Math.floor(t.x),Math.floor(t.z))?'':' · land stays locked')+'</small></button>').join('')+'</div>'+(options.tester?'<button data-action="refill">Refill Summit Tester supplies</button>':'');
          html+='<h3>Your expedition team</h3><p>Your friendships are permanent. These companions also join your learning adventures.</p><div class="cv2-team">'+(options.companions||[]).map(friend=>'<button data-companion="'+esc(friend.key)+'"><img src="'+esc(friend.art)+'" alt=""><span>'+esc(friend.name)+'</span></button>').join('')+'</div>'+(!(options.companions||[]).length?'<p>Add a caught creature from the Field Guide to your team.</p>':'');
          html+=`<h3>Beyond the clearing</h3><div class="cv2-object-list">${discoveries.map(d=>`<button data-discovery="${d.id}">${(s.discoveries||[]).includes(d.id)?'✓ ':'◇ '}${d.name}<small>Walk there with your buddy</small></button>`).join('')}</div>`;
          html+=goals.map(g=>`<div class="cv2-goal"><span>${s.projects.includes(g.id)?'✓':'◇'}</span><div><strong>${g.name}</strong><p>${g.text}</p><progress max="${g.target}" value="${Math.min(g.target,g.progress(s))}" aria-label="${g.name}"></progress><small>${s.projects.includes(g.id)?'Completed':`${Math.min(g.target,g.progress(s))}/${g.target} · reward ${g.reward} gems`}</small></div></div>`).join('');
          html+=`<h3>Fallen wood</h3><div class="cv2-object-list">${sources.map((p,i)=>`<button data-source="${i}" ${s.harvested.includes(i)?'disabled':''}>${s.harvested.includes(i)?'Gathered':'Gather 3 wood'}<small>Wood pile ${i+1} · column ${p.x+1}, row ${p.y+1}</small></button>`).join('')}</div><div class="cv2-note"><strong>A place to return to, at your pace.</strong><p>Your starting kit is yours to keep. Open Upgrades to see how your home can grow. A finished learning round earns gems for both camps and brings more fallen wood. Camp 1 keeps its own savings and layout. Fences are for creative play; nothing attacks or damages this clearing.</p></div><button class="primary" data-action="practice">A short learning adventure →</button><div class="cv2-settings"><button data-action="calm" aria-pressed="${!!s.calm}">Gentle motion: ${s.calm?'on':'off'}</button><button data-action="quality" aria-pressed="${s.quality==='low'}">Low power: ${s.quality==='low'?'on':'off'}</button><button data-action="night" aria-pressed="${!!s.night}">${s.night?'Moonlit':'Morning'} scenery</button></div>`;
        }html+='</section>';
      }else if(selected){const o=s.objects.find(o=>o.id===selected);if(o){const d=catalog[o.type];html=`<section class="cv2-card cv2-selection" aria-label="Selected ${d.name}"><div class="cv2-card-heading">${thumb(o.type)}<div><small>YOUR CLEARING</small><h2>${d.name}</h2><p>Column ${o.x+1}, row ${o.y+1}</p></div><button data-action="close" aria-label="Close selection">×</button></div><div class="cv2-actions">${d.action?`<button class="primary" data-action="use">${d.action}</button>`:''}<button data-action="move">Move</button>${d.connect?'<button data-action="build-more">Build more</button>':''}<button data-action="store">Store</button><button data-action="paint">Change colour</button>${d.benefit?`<p>${d.benefit}</p>`:''}${d.next?`<button data-action="upgrade" ${unlockReason(s,d.next)&&!(s.inventory[d.next]>0)?'disabled':''}>${s.inventory[d.next]>0?'Use renovation kit · free':unlockReason(s,d.next)?'Unlock at '+catalog[d.next].need+' families':'Upgrade · ◆ '+catalog[d.next].price+' / '+catalog[d.next].wood+' wood'+(catalog[d.next].stone?' / '+catalog[d.next].stone+' stone':'')}</button>`:''}</div></section>`;}}
      if(!html)html=`<div class="cv2-idle"><span>${activity||'Your next adventure starts here.'}</span><button data-action="undo" ${undo&&undo.revision===s.revision?'':'disabled'} aria-label="Undo last Camp 2 action">↶ Undo</button></div>`;
      if(s.construction)html+='<div class="cv2-build-status">'+(building?'Assembling your new building…':'Your explorer will assemble this building.')+' <button data-action="finish-build">Finish now</button></div>';
      overlay.innerHTML=html;dirty=true;
    }
    function travel(target,done,text){const path=route(s,explorer,target);if(path===null){tell('No clear walking route. Move an object or add an opening.');return;}mode='explore';seated=null;petTrail=[];walking=path;onArrive=done||null;activity=text||'Exploring with your buddy';tell(activity);activityUntil=0;panel=null;selected=null;if(calm()){explorer={...target};pet={x:target.x+.35,y:target.y+.3};walking=[];scene?.focus(target.x+.5,target.y+.5,camera);arrive();}else if(!path.length)arrive();ui();dirty=true;}
    function arrive(){const done=onArrive;onArrive=null;if(done)done();for(const d of discoveries)if(Math.hypot(explorer.x-d.x,explorer.y-d.y)<2&&!(s.discoveries||[]).includes(d.id)){commit({...s,discoveries:[...(s.discoveries||[]),d.id],revision:s.revision+1});activity=d.text;tell(`Discovered ${d.name}. ${d.text}`);}persistView();activityUntil=performance.now()+7000;ui();}
    function useObject(o){const targets=catalog[o.type].layer==='surface'?[{x:o.x,y:o.y}]:entrances(o);const to=targets.find(p=>route(s,explorer,p)!==null);if(!to){tell('Leave an open route beside this object.');return;}const d=catalog[o.type];travel(to,()=>{scene?.focus(o.x+d.w/2,o.y+d.h/2,camera,true);if(['bench','trailtent','canvas','cabin'].includes(o.type))seated=o;activity=['trailtent','canvas','cabin'].includes(o.type)?'Your buddy settles beside you. A little home, made by you.':o.type==='bench'?'A good seat. A very good dog.':o.type==='feeder'?'A small bird stops by to say hello.':o.type==='fire'?'Warm paws, warm stories.':'A quiet moment at home.';tell(activity);},`Walking to ${d.name.toLowerCase()}`);}
    function dispatch(e){const b=e.target.closest('button');if(!b||b.disabled)return;
      if(b.dataset.companion){const friend=(options.companions||[]).find(f=>f.key===b.dataset.companion);if(friend){persistView();options.onCompanion?.(friend.a,friend.b);}return;}
      if(b.dataset.guardian!==undefined){visitGuardian(Number(b.dataset.guardian));return;}
      if(b.dataset.category){category=b.dataset.category;ui();return;}
      if(b.dataset.buy){act({kind:'buy',offer:b.dataset.buy});panel='store';ui();return;}
      if(b.dataset.location){visitLocation(b.dataset.location);return;}
      if(b.dataset.tree){startWoodland('tree',b.dataset.tree);return;}
      if(b.dataset.land){startWoodland('land',b.dataset.land);return;}
      if(b.dataset.discovery){const d=discoveries.find(d=>d.id===b.dataset.discovery);if(d)travel({x:d.x,y:d.y},null,`Exploring ${d.name}`);return;}
      if(b.dataset.source!==undefined){gather(Number(b.dataset.source));return;}
      if(b.dataset.type){choose(b.dataset.type);return;}
      if(b.dataset.select){selected=b.dataset.select;panel=null;const item=s.objects.find(o=>o.id===selected);if(item)scene?.focus(item.x+1,item.y+1,camera,true);ui();host.querySelector('[data-action="move"]')?.focus();return;}
      const a=b.dataset.action,o=s.objects.find(o=>o.id===selected);
      if(a==='v1'||a==='adventure'){persistView();onExit(a==='v1'?'screen-camp':'screen-map');return;}
      if(a==='practice'){persistView();onPractice();return;}
      if(a==='answer-review'){const answer=host.querySelector('#camp-review-answer')?.value;act({kind:'answer-activity',answer});host.querySelector('#camp-review-answer')?.focus();return;}
      if(a==='leave-review'){act({kind:'cancel-activity'});return;}
      if(a==='finish-build'){act({kind:'finish-build'});return;}
      if(a==='paint'&&o){act({kind:'paint',id:o.id});return;}
      if(a==='refill'){act({kind:'refill'});return;}
      if(a==='guardian-practice'){const g=guardians.find(g=>g.family===selectedGuardian);if(g?.defeated){persistView();onPractice(g.family);}return;}
      if(a==='cozy'){const tent=s.objects.find(o=>o.type==='tent');commit({...s,openingIntro:false});if(tent)choose('trailtent',tent.id,true);else choose('trailtent');return;}
      if(a==='v2')return;
      if(a==='orbit-left'||a==='orbit-right'){camera=reframeCamera(camera,{angle:(camera.angle||0)+(a==='orbit-left'?-1:1)*Math.PI/4});persistView();dirty=true;return;}
      if(a==='home'){camera={x:0,y:0,zoom:1,angle:0};persistView();dirty=true;return;}
      if(a==='zoom-in'||a==='zoom-out'){camera=reframeCamera(camera,{zoom:camera.zoom*(a==='zoom-in'?1.16:1/1.16)});persistView();dirty=true;return;}
      if(a==='calm'||a==='quality'||a==='night'){commit({...s,[a==='quality'?'quality':a]:a==='quality'?(s.quality==='low'?'standard':'low'):!s[a]});resize();ui();return;}
      if(a==='undo'){if(undo&&undo.revision===s.revision){const previous=undo.before;previous.revision=s.revision+1;previous.camera={...camera};walking=[];onArrive=null;seated=null;building=null;activity='';explorer={...previous.explorer};pet={x:explorer.x+.5,y:explorer.y+.3};commit(previous);undo=null;if(preview)preview.lastPlaced=false;tell('Last action undone, including supplies and project rewards.');}ui();return;}
      if(a==='close'||a==='cancel'){if(panel==='welcome')commit({...s,openingIntro:false});if(preview?.brush)mode='explore';preview=null;selected=null;panel=null;ui();host.querySelector(`[data-action="${mode}"]`)?.focus();return;}
      if(['explore','build','bag','journal','land','upgrades'].includes(a)){preview=null;selected=null;if(a==='explore'){mode='explore';panel=null;}else{mode=a==='build'?'build':mode;panel=panel===a?null:a;}ui();return;}
      if(a==='build-more'&&o){choose(o.type);preview.x=o.x;preview.y=o.y;preview.lastPlaced=true;scene?.focus(o.x+.5,o.y+.5,camera,true);ui();return;}
      if(a==='move'&&o){choose(o.type,o.id);return;}
      if(a==='store'&&o){act({kind:'store',id:o.id});return;}
      if(a==='upgrade'&&o&&catalog[o.type].next){choose(catalog[o.type].next,o.id,true);return;}
      if(a==='use'&&o){useObject(o);return;}
      if(preview){if(a==='rotate'&&catalog[preview.type].rotate)preview.r=(preview.r+1)%4;
        if(a?.startsWith('nudge-')){preview.lastPlaced=false;const [dx,dy]={'nudge-n':[0,-1],'nudge-s':[0,1],'nudge-w':[-1,0],'nudge-e':[1,0]}[a];preview.x=Math.max(content.bounds.minX,Math.min(content.bounds.maxX,preview.x+dx));preview.y=Math.max(content.bounds.minY,Math.min(content.bounds.maxY,preview.y+dy));}
        if(a==='confirm'){placePreview();return;}ui();host.querySelector(`[data-action="${a}"]`)?.focus();}
    }
    host.addEventListener('click',dispatch,{signal});
    function visitLocation(id){const place=content.locations.find(p=>p.id===id);if(!place)return;travel({x:place.x,y:place.y},()=>{scene?.focus(place.x+.5,place.y+.5,camera,true);if(id==='store'){panel='store';ui();}else if(id==='fish')startWoodland('fish');else{panel=id==='sanctuary'?'sanctuary':'place-info';selectedGuardian=id;ui();}},'Walking to '+place.name);}
    function visitGuardian(family){const g=guardians.find(g=>g.family===family),pad=content.guardianPads.find(p=>p.family===family);if(!g?.defeated||!pad){tell('Win this realm battle to welcome its guardian.');return;}travel({x:pad.x,y:pad.y+1},()=>{selectedGuardian=family;panel='guardian';if(width<600)camera.zoom=Math.max(1.6,camera.zoom);scene?.focus(pad.x+.5,pad.y+.5,camera,true);ui();},'Visiting '+g.name);}
    function startWoodland(kind,target){if(kind==='land'&&s.land.includes(target)){const z=content.zones.find(z=>z.id===target),spots=[];for(let x=z.x;x<z.x+z.w;x++)for(let y=z.y;y<z.y+z.h;y++)spots.push({x,y});const point=spots.sort((a,b)=>Math.hypot(a.x-z.x-z.w/2,a.y-z.y-z.h/2)-Math.hypot(b.x-z.x-z.w/2,b.y-z.y-z.h/2)).find(p=>route(s,explorer,p)!==null);if(point)travel(point,()=>{mode='build';scene?.focus(z.x+z.w/2,z.y+z.h/2,camera,true);ui();},'Exploring '+z.name);else tell('Leave a route into this parcel.');return;}if(s.challenge){ui();return;}const begin=()=>{act({kind:'start-activity',activity:kind,target,questions:options.reviewQuestions?.()||[]});host.querySelector('#camp-review-answer')?.focus();};if(kind==='fish'){begin();return;}const z=content.zones.find(z=>z.id===target),t=forest.find(t=>treeKey(t)===target);const point=kind==='land'?z:t?{x:Math.floor(t.x),y:Math.floor(t.z)}:null;if(!point)return;const spots=[];for(let dx=-2;dx<=2;dx++)for(let dy=-2;dy<=2;dy++)if(Math.hypot(dx,dy)<=2)spots.push({x:point.x+dx,y:point.y+dy});const near=spots.sort((a,b)=>Math.hypot(a.x-explorer.x,a.y-explorer.y)-Math.hypot(b.x-explorer.x,b.y-explorer.y)).find(p=>route(s,explorer,p)!==null);if(near)travel(near,begin,kind==='land'?'Opening '+z.name:'Walking to a forest tree');else tell('Leave a route to this part of the woods.');}
    function resumeBuild(){if(!s.construction||building||walking.length||s.challenge)return;const o=s.objects.find(o=>o.id===s.construction.objectId);if(!o)return;const near=entrances(o).find(p=>route(s,explorer,p)!==null);if(!near){tell('Leave a route to your building, or choose Finish now.');return;}if(calm()){act({kind:'finish-build'});return;}travel(near,()=>{building={id:o.id,started:performance.now()};heading=Math.atan2(o.x-explorer.x,o.y-explorer.y);activity='Building '+catalog[o.type].name;ui();},'Carrying supplies to '+catalog[o.type].name);}
    function gather(index){const source=sources[index];if(!source)return;const to=entrances({...source,type:'lantern',r:0}).find(p=>route(s,explorer,p)!==null);if(to)travel(to,()=>act({kind:'gather',source:index}),'Gathering fallen wood');else tell('Leave an opening so you can reach the wood.');}
    function placePreview(){const p={...preview};if(act({kind:p.upgrade?'upgrade':p.id?'move':'place',...p})&&p.brush)preview={...p,lastPlaced:true};ui();return;}
    function tap(px,py){if(s.challenge)return;if(focusedPanel()){panel=null;ui();return;}const p=cell(px,py);if(preview){preview.x=p.x;preview.y=p.y;preview.lastPlaced=false;if(preview.brush)placePreview();else ui();return;}
      const hit=scene?.pick(px,py);
      if(hit?.guardian!==undefined){visitGuardian(hit.guardian);return;}
      if(hit?.location){visitLocation(hit.location);return;}
      if(hit?.tree){startWoodland('tree',hit.tree);return;}
      if(hit?.land){startWoodland('land',hit.land);return;}
      if(hit?.discovery){const d=discoveries.find(d=>d.id===hit.discovery);if(d)travel({x:d.x,y:d.y},null,`Exploring ${d.name}`);return;}
      if(hit?.source!==undefined){gather(hit.source);return;}
      if(hit?.id){selected=hit.id;ui();return;}
      const ground=s.objects.find(o=>catalog[o.type].layer==='surface'&&o.x===p.x&&o.y===p.y);if(mode==='build'&&ground){selected=ground.id;ui();return;}
      if(mode==='explore'&&worldInside(p.x,p.y))travel(p);else{selected=null;ui();}
    }
    canvas.addEventListener('pointerdown',e=>{canvas.setPointerCapture(e.pointerId);pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===1)gesture={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,moved:false};if(pointers.size===2){const [a,b]=[...pointers.values()];gesture={pinch:Math.hypot(a.x-b.x,a.y-b.y),zoom:camera.zoom,moved:true};}},{signal});
    canvas.addEventListener('pointermove',e=>{if(!pointers.has(e.pointerId))return;pointers.set(e.pointerId,{x:e.clientX,y:e.clientY});if(pointers.size===2&&gesture?.pinch){const [a,b]=[...pointers.values()];camera=reframeCamera(camera,{zoom:gesture.zoom*Math.hypot(a.x-b.x,a.y-b.y)/gesture.pinch});}else if(pointers.size===1&&gesture&&!gesture.pinch){const dx=e.clientX-gesture.x,dy=e.clientY-gesture.y;if(Math.hypot(dx,dy)>8)gesture.moved=true;if(gesture.moved){camera.x=gesture.cx+dx;camera.y=gesture.cy+dy;}}dirty=true;},{signal});
    function endPointer(e,cancel=false){if(!pointers.has(e.pointerId))return;const wasTap=!cancel&&pointers.size===1&&gesture&&!gesture.moved;pointers.delete(e.pointerId);if(wasTap){const r=canvas.getBoundingClientRect();tap(e.clientX-r.left,e.clientY-r.top);}if(!pointers.size){gesture=null;persistView();}else gesture={moved:true,pinch:true};}
    canvas.addEventListener('pointerup',e=>endPointer(e),{signal});canvas.addEventListener('pointercancel',e=>endPointer(e,true),{signal});
    canvas.addEventListener('wheel',e=>{e.preventDefault();camera=reframeCamera(camera,{zoom:camera.zoom*(e.deltaY>0?.93:1.07)});persistView();dirty=true;},{passive:false,signal});
    host.addEventListener('keydown',e=>{if(s.challenge&&e.key==='Enter'&&e.target.id==='camp-review-answer'){e.preventDefault();host.querySelector('[data-action="answer-review"]')?.click();return;}if(e.key==='Escape'){preview=null;panel=null;selected=null;ui();return;}if(!preview)return;const keys={ArrowUp:'nudge-n',ArrowDown:'nudge-s',ArrowLeft:'nudge-w',ArrowRight:'nudge-e',r:'rotate'};if(keys[e.key]){e.preventDefault();host.querySelector(`[data-action="${keys[e.key]}"]`)?.click();}},{signal});
    function resize(){const oldScale=width&&height?Math.min(height/19,width/18):0;width=host.clientWidth||root.innerWidth;height=host.clientHeight||root.innerHeight;if(oldScale){const ratio=Math.min(height/19,width/18)/oldScale;camera.x*=ratio;camera.y*=ratio;}scene?.resize(width,height,s.quality);dirty=true;}
    function frame(t){if(disposed)return;raf=requestAnimationFrame(frame);if(document.hidden){last=t;return;}const gap=s.quality==='low'?33:16;if(t-last<gap)return;const dt=Math.min(.05,(t-last)/1000||.016);last=t;
      if(s.construction&&!s.challenge&&!panel)resumeBuild();if(building&&performance.now()-building.started>3500)act({kind:'finish-build'});
      if(walking.length){const dest=walking[0],dx=dest.x-explorer.x,dy=dest.y-explorer.y,len=Math.hypot(dx,dy),step=dt*2.8;heading=Math.atan2(dx,dy);if(calm()||len<step){explorer={...dest};walking.shift();if(!walking.length)arrive();}else{explorer.x+=dx/len*step;explorer.y+=dy/len*step;}petTrail.push({...explorer});if(petTrail.length>10)pet=petTrail.shift();if(calm())pet={...explorer};scene?.follow(explorer,camera);dirty=true;}
      if(activityUntil&&t>activityUntil){activity='';activityUntil=0;seated=null;ui();}
      if(scene&&(dirty||!calm())){const started=performance.now();scene.render({save:s,camera,explorer,pet,heading,walking:walking.length>0,seated,preview:preview?.lastPlaced?null:preview,selected,mode,calm:calm(),activity,building:building?{id:building.id,progress:Math.min(1,(t-building.started)/3500)}:null},t);const elapsed=performance.now()-started;metrics.frames++;metrics.total+=elapsed;metrics.worst=Math.max(metrics.worst,elapsed);if(metrics.frames%60===0){canvas.dataset.submitMs=(metrics.total/metrics.frames).toFixed(1);canvas.dataset.drawCalls=String(scene.stats().calls);canvas.dataset.triangles=String(scene.stats().triangles);canvas.dataset.geometries=String(scene.stats().geometries);canvas.dataset.textures=String(scene.stats().textures);}dirty=false;}
    }
    root.addEventListener('resize',resize,{signal});document.addEventListener('visibilitychange',()=>{if(document.hidden)persistView();dirty=true;},{signal});
    tell('Opening the woodland…');
    import('./camp-v2-scene.js').then(module=>{if(disposed)return;scene=module.createScene(canvas,{catalog,footprint,sources,world,avatar,guardians,placementReason,onContextRestored:()=>{dirty=true;tell('Your woodland is ready again.');},onContextLost:()=>{tell('The 3D view paused. Your camp is saved. Use Camp 1 or reopen Camp 2.');}});resize();ui();if(navigator.serviceWorker)navigator.serviceWorker.ready.then(reg=>{if(!disposed)reg.active?.postMessage({type:'CACHE_CAMP_3D'});}).catch(()=>{});tell('Welcome to Willowbrook. Your clearing is part of a bigger world.');}).catch(error=>{if(disposed)return;host.classList.add('cv2-no-webgl');canvas.setAttribute('aria-label','3D view unavailable on this device. Use Backpack controls or Camp 1.');panel='bag';ui();tell('3D is unavailable here. Your camp is safe. Use Backpack controls or Camp 1.');});
    resize();ui();raf=requestAnimationFrame(frame);
    return {dispose(){if(disposed)return;persistView();disposed=true;abort.abort();cancelAnimationFrame(raf);scene?.dispose();scene=null;host.classList.remove('cv2-three','cv2-no-webgl');host.innerHTML='';}};
  }
  root.CampV2={reframeCamera,content,buildable,unlockReason,syncProgress,world,catalog,COLS,ROWS,sources,fresh,freshExpedition,validSave,migrateSave,footprint,placementReason,route,command,awardLearning,mount};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CampV2;
})(typeof window!=='undefined'?window:globalThis);
