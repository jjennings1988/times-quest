/* Camp progression content and topology. No rendering or profile side effects. */
(function(root){
  const order=[0,1,10,2,5,11,3,4,9,6,12,8,7];
  const milestones=[
    'Picket fencing · Woodland Grove','Fishing rod · coloured shelters','Canvas shelter · garden well','North Meadow · complete your campsite',
    'Timber palisade · town building plot','Fort gate · log lodge','Timber watchtower','South Orchard · timber fort complete',
    'Stone walls · stone cottage','Stone gateway · courtyard well','Stone keep · cobbled paths','Grand stone courtyard','Moat channels · drawbridges'
  ];
  // One catalog for the whole camp: starter camp pieces, homes and later fortifications.
  const catalog={
    // Realm keepsakes are earned, never bought: one arrives in the backpack when its realm is restored.
    keepsake0:{name:"Poof's Marsh Lantern",w:1,h:1,layer:'solid',price:0,wood:0,realm:0,kitOnly:true,action:'Admire'},
    keepsake1:{name:"Echo's Seedling Planter",w:1,h:1,layer:'solid',price:0,wood:0,realm:1,kitOnly:true,action:'Admire'},
    keepsake10:{name:"Deca's Power Lamp",w:1,h:1,layer:'solid',price:0,wood:0,realm:10,kitOnly:true,action:'Admire'},
    keepsake2:{name:"Twix's Twin Lamps",w:1,h:1,layer:'solid',price:0,wood:0,realm:2,kitOnly:true,action:'Admire'},
    keepsake5:{name:"Slap's Little Boat",w:1,h:1,layer:'solid',price:0,wood:0,realm:5,kitOnly:true,action:'Admire'},
    keepsake11:{name:"Copy's Twin Towers",w:1,h:1,layer:'solid',price:0,wood:0,realm:11,kitOnly:true,action:'Admire'},
    keepsake3:{name:"Trio's Vine Arch",w:1,h:1,layer:'solid',price:0,wood:0,realm:3,kitOnly:true,action:'Admire'},
    keepsake4:{name:"Boulder's Stone Cairn",w:1,h:1,layer:'solid',price:0,wood:0,realm:4,kitOnly:true,action:'Admire'},
    keepsake9:{name:"Sensei's Lantern Rack",w:1,h:1,layer:'solid',price:0,wood:0,realm:9,kitOnly:true,action:'Admire'},
    keepsake6:{name:"Buzz's Sun Beacon",w:1,h:1,layer:'solid',price:0,wood:0,realm:6,kitOnly:true,action:'Admire'},
    keepsake12:{name:"Tock's Palm Planter",w:1,h:1,layer:'solid',price:0,wood:0,realm:12,kitOnly:true,action:'Admire'},
    keepsake8:{name:"Glacier's Crystal Cluster",w:1,h:1,layer:'solid',price:0,wood:0,realm:8,kitOnly:true,action:'Admire'},
    keepsake7:{name:"Tempest's Storm Chime",w:1,h:1,layer:'solid',price:0,wood:0,realm:7,kitOnly:true,action:'Admire'},
    tent:{name:'Pup Tent',w:2,h:2,layer:'solid',price:30,wood:4,art:'camp-shelter-t2.png',next:'trailtent',action:'Rest'},
    trailtent:{name:'Cozy Pup Tent',w:2,h:2,layer:'solid',price:12,wood:2,need:1,next:'canvas',action:'Rest with buddy',benefit:'A timber doorstep, rolled bedding and a glowing porch lantern. Sit outside with your dog.'},
    canvas:{name:'Canvas Tent',w:2,h:2,layer:'solid',price:45,wood:5,need:3,art:'camp-shelter-t3.png',next:'cabin',action:'Rest'},
    cabin:{name:'Cabin Tent',w:3,h:2,layer:'solid',price:70,wood:8,need:4,art:'camp-shelter-t4.png',next:'lodge',action:'Rest'},
    fire:{name:'Campfire',w:1,h:1,layer:'solid',price:15,wood:2,art:'camp-fire-t2-strip3.png',frames:3,action:'Warm up'},
    bench:{name:'Log Bench',w:2,h:1,layer:'solid',price:12,wood:2,rotate:true,action:'Sit together'},
    lantern:{name:'Lantern',w:1,h:1,layer:'solid',price:8,wood:0,art:'camp-light-t1.png'},
    path:{name:'Stone Path',w:1,h:1,layer:'surface',price:3,wood:0,connect:'path'},
    deck:{name:'Wooden Deck',w:1,h:1,layer:'surface',price:2,wood:0,connect:'deck'},
    // Seed plots: lay them out in rows and columns and the garden becomes an array.
    plot:{name:'Seed Plot',w:1,h:1,layer:'surface',price:1,wood:0,connect:'plot'},
    // Things that give a little every day you visit (0.47). Nothing withers while you are away.
    fruittree:{name:'Apple Tree',w:1,h:1,layer:'solid',price:20,wood:2,need:2,action:'Pick apples',daily:3},
    beehive:{name:'Beehive',w:1,h:1,layer:'solid',price:24,wood:3,need:4,action:'Collect honey',daily:4},
    // A home for a companion from the expedition team: they move in and come back to it.
    critterhome:{name:'Creature Cottage',w:1,h:1,layer:'solid',price:18,wood:3,action:'Visit'},
    pine:{name:'Great Pine',w:2,h:2,layer:'solid',price:15,wood:0,art:'camp-garden-t4.png'},
    feeder:{name:'Bird Feeder',w:1,h:1,layer:'solid',price:12,wood:2,art:'camp-life-bird-feeder.png',action:'Watch birds'},
    fence:{name:'Picket Fence',w:1,h:1,layer:'solid',price:2,wood:1,rotate:true,next:'palisade',connect:'wall'},
    gate:{name:'Garden Gate',w:1,h:1,layer:'surface',price:5,wood:2,rotate:true,action:'Walk through',next:'fortgate',connect:'wall'},
    palisade:{name:'Timber Palisade',w:1,h:1,layer:'solid',price:7,wood:4,need:5,next:'stonewall',rotate:true,connect:'wall'},
    fortgate:{name:'Fort Gate',w:1,h:1,layer:'surface',price:16,wood:8,need:6,next:'stonegate',rotate:true,connect:'wall',action:'Walk through'},
    stonewall:{name:'Stone Wall',w:1,h:1,layer:'solid',price:8,wood:0,stone:3,need:9,rotate:true,connect:'wall'},
    stonegate:{name:'Stone Gateway',w:1,h:1,layer:'surface',price:20,wood:4,stone:8,need:10,rotate:true,connect:'wall',action:'Walk through'},
    lodge:{name:'Timber Lodge',w:3,h:3,layer:'solid',price:70,wood:16,stone:4,need:6,next:'stonehome',action:'Rest'},
    stonehome:{name:'Stone Cottage',w:3,h:3,layer:'solid',price:95,wood:12,stone:20,need:9,next:'keep',action:'Rest'},
    keep:{name:'Stone Keep',w:4,h:3,layer:'solid',price:140,wood:16,stone:34,need:11,action:'Rest'},
    well:{name:'Garden Well',w:1,h:1,layer:'solid',price:18,wood:5,stone:3,need:3,next:'stonewell',action:'Draw water'},
    stonewell:{name:'Courtyard Well',w:1,h:1,layer:'solid',price:25,wood:3,stone:8,need:10,action:'Draw water'},
    tower:{name:'Timber Watchtower',w:2,h:2,layer:'solid',price:45,wood:16,stone:3,need:7,action:'Look out'},
    cobble:{name:'Cobblestone Path',w:1,h:1,layer:'surface',price:4,wood:0,stone:1,need:11,connect:'path'},
    flowerbed:{name:'Flower Border',w:1,h:1,layer:'solid',price:5,wood:0,need:2},
    moat:{name:'Moat Channel',w:1,h:1,layer:'water',price:9,wood:0,stone:3,need:13,connect:'moat'},
    drawbridge:{name:'Drawbridge',w:1,h:1,layer:'surface',price:22,wood:10,stone:4,need:13,rotate:true,action:'Walk through'}
  };
  // Each restored family sends its signature build as a ready-to-place kit, once. Gems then buy extras.
  const kits={1:{fence:6,gate:1},2:{flowerbed:4,lantern:1},3:{canvas:1,well:1},4:{cabin:1,bench:1},5:{palisade:8},6:{fortgate:1,lodge:1},7:{tower:1},8:{palisade:8,pine:1},9:{stonewall:8,stonehome:1},10:{stonegate:1,stonewell:1},11:{keep:1,cobble:10},12:{stonewall:10},13:{moat:6,drawbridge:1}};
  // The trophy garden: realm keepsakes arrive around the Story Stones, one spot per realm (map order), with fallbacks.
  const trophySpots=[[-8,-2],[-6,-2],[-4,-2],[-2,-2],[-2,0],[-2,2],[-2,4],[-4,4],[-6,4],[-8,4],[-8,2],[-8,0],[-1,-3],[-3,-3],[-5,-3],[-7,-3],[-1,1],[-1,3]];
  // Items waiting for a later release: valid in a backpack, not yet placeable. (Empty for now.)
  const later={};
  const zones=[
    {id:'grove',name:'Woodland Grove',x:-4,y:5,w:4,h:5,need:1},
    {id:'north',name:'North Meadow',x:0,y:-4,w:12,h:4,need:4},
    {id:'town',name:'Town Green',x:25,y:10,w:7,h:5,need:5},
    {id:'south',name:'South Orchard',x:0,y:10,w:12,h:5,need:8},
    {id:'homestead',name:'Homestead Meadow',x:-8,y:-3,w:8,h:8,need:0},
    {id:'highfield',name:'Highfield Terrace',x:0,y:-12,w:12,h:8,need:4},
    {id:'westwood',name:'Westwood Acres',x:-16,y:-3,w:8,h:16,need:6},
    {id:'orchard',name:'Apple Orchard',x:0,y:15,w:12,h:10,need:8},
    {id:'townEast',name:'East Village Plot',x:36,y:10,w:10,h:8,need:5},
    {id:'westReach',name:'Westwood Reach',x:-32,y:-3,w:16,h:16,need:6},
    {id:'cedarRise',name:'Cedar Rise',x:-24,y:-15,w:24,h:12,need:4},
    {id:'fernHollow',name:'Fern Hollow',x:-14,y:13,w:14,h:8,need:8},
    // Willow Fields (0.48): the open meadow across the grove road, roomy enough for big garden beds, orchards and hives.
    {id:'fields',name:'Willow Fields',x:44,y:-10,w:14,h:12,need:0}
  ];
  const town=[{id:'store',type:'store',x:24,y:0,w:4,h:3},{id:'bakery',type:'townhouse',x:30,y:0,w:3,h:3},{id:'hall',type:'townhall',x:30,y:6,w:4,h:3,face:'n'},
    {id:'library',type:'townhouse',x:24,y:-7,w:3,h:3},{id:'workshop',type:'lodge',x:33,y:-7,w:3,h:3},
    {id:'inn',type:'townhall',x:20,y:6,w:4,h:3,face:'n'},{id:'mill',type:'lodge',x:20,y:12,w:3,h:3,face:'e'},
    {id:'rosehouse',type:'townhouse',x:39,y:22,w:3,h:3,face:'n',yaw:-4},{id:'bluehouse',type:'townhouse',x:45,y:22,w:3,h:3,face:'n',yaw:3},{id:'gardenhouse',type:'townhouse',x:51,y:22,w:3,h:3,face:'w',yaw:-2}];
  const locations=[{id:'store',name:'Willowbrook Supply Store',x:26,y:4},{id:'fish',name:'Fishing Dock',x:14,y:8},
    {id:'sanctuary',name:'Guardian Grove',x:71,y:3},{id:'bakery',name:'Honeycrust Bakery',x:31,y:4},{id:'fields',name:'Willow Fields',x:49,y:3},{id:'library',name:'Willow Library',x:25,y:-3},{id:'inn',name:'The Willow Inn',x:22,y:5},{id:'workshop',name:'Tink’s Workshop',x:34,y:-3},{id:'market',name:'Market Green',x:40,y:6},{id:'gardens',name:'Rosewater Gardens',x:49,y:19},{id:'mill',name:'Willow Watermill',x:23,y:13}];
  // The people of Willowbrook: where they work, how they look, and something new to say each day.
  const villagers=[
    {id:'mara',name:'Mara',role:'storekeeper',place:'store',x:26.6,y:3.4,coat:'#7fa59a',skin:'#c28d67',hat:'#b35e40',lines:['Fish from the river are worth their weight in stone, you know.','A fishing rod opens a whole river of trips.','Orders today! Crates never pack themselves.','Your camp is the talk of the market.']},
    {id:'bram',name:'Bram',role:'baker',place:'bakery',x:31.8,y:3.5,coat:'#f1e6cf',skin:'#dba575',hat:'#fbf7ee',lines:['Six trays of four makes twenty-four fine buns.','The oven is warm. Fancy a baking order?','Flour on my nose again, I expect.','Honeycrust rolls rise best in rows.']},
    {id:'wren',name:'Wren',role:'librarian',place:'library',x:25.8,y:-3.6,coat:'#6486a1',skin:'#a87654',hat:'#46586e',lines:['Every fact you build is written in the album.','Shh… the postcards are on the wall.','A garden of facts, one bed at a time.','Did you know 7 × 8 is 56? I write it everywhere.']},
    {id:'oak',name:'Old Oak',role:'innkeeper',place:'inn',x:23.3,y:5.6,coat:'#8a5a3a',skin:'#c28d67',hat:'#5b3f28',lines:['Check the notice board: a guardian has asked for you.','Travellers say your camp has the best fire in the valley.','The inn keeps a room for every explorer.','News from the realms arrives every evening.']},
    {id:'tink',name:'Tink',role:'tinker',place:'workshop',x:34.8,y:-3.6,coat:'#b35e40',skin:'#dba575',hat:'#e0b24a',lines:['Bring me any home and I will show you its next shape.','A lick of paint makes any tent your own.','Planks, pegs and patience. That is all it takes.','Gears and hinges: all neatly in rows.']},
    {id:'millie',name:'Millie',role:'miller',place:'mill',x:23.6,y:12.2,coat:'#9caf71',skin:'#a87654',hat:'#e8dcc0',lines:['The wheel shares the logs out fair and even.','Twenty logs in four stacks? Five each, of course.','The stream never stops turning.','Fair shares make good planks.']}];
  const guardianKinds=['ghost','bunny','fox','monkey','turtle','frog','bee','wolf','penguin','owl','robot','parrot','dragon'];
  // Rendering, tree clearing and navigation share one authored world layout.
  const bounds={minX:-36,maxX:86,minY:-24,maxY:44};
  const grove={x:62,y:-18,w:21,h:23,gateX:70,gateW:4};
  const guardianPads=order.map((family,i)=>{const a=.48+i*(Math.PI*2-.96)/12;return {family,kind:guardianKinds[family],x:Math.round(72+Math.sin(a)*7.5),y:Math.round(-7+Math.cos(a)*8),angle:a+Math.PI};});
  const groveFence=(x,y)=>((x===grove.x||x===grove.x+grove.w-1)&&y>=grove.y&&y<grove.y+grove.h)||((y===grove.y||y===grove.y+grove.h-1)&&x>=grove.x&&x<grove.x+grove.w&&!(y===4&&x>=grove.gateX&&x<grove.gateX+grove.gateW));
  const roadMap=new Map(),roadKey=(x,y)=>x+','+y;
  /* Roads (0.44) are drawn as curves that follow the land: a high street from Willow Bridge along the
     shopfronts to the village green, lanes that branch at an angle, footpaths, and a winding road to
     the Guardian Grove. Each curve is filled into the grid for walking; buildings and build plots are
     never paved. Every door gets a short step onto the nearest road. */
  const faces={s:0,n:Math.PI,e:Math.PI/2,w:-Math.PI/2};
  for(const b of town){const f=b.face||'s';b.entrance=f==='s'?{x:Math.floor(b.x+b.w/2),y:b.y+b.h}:f==='n'?{x:Math.floor(b.x+b.w/2),y:b.y-1}:f==='e'?{x:b.x+b.w,y:Math.floor(b.y+b.h/2)}:{x:b.x-1,y:Math.floor(b.y+b.h/2)};b.rotation=faces[f]+(b.yaw||0)*Math.PI/180;}
  function curve(pts,step=.25){const out=[];for(let i=0;i<pts.length-1;i++){const p0=pts[Math.max(0,i-1)],p1=pts[i],p2=pts[i+1],p3=pts[Math.min(pts.length-1,i+2)],n=Math.max(2,Math.ceil(Math.hypot(p2[0]-p1[0],p2[1]-p1[1])/step));
      for(let k=0;k<n;k++){const u=k/n,c=(a,b,c,d)=>.5*((2*b)+(-a+c)*u+(2*a-5*b+4*c-d)*u*u+(-a+3*b-3*c+d)*u*u*u);out.push([c(p0[0],p1[0],p2[0],p3[0]),c(p0[1],p1[1],p2[1],p3[1])]);}}
    out.push(pts[pts.length-1]);return out;}
  const ROUTES=[
    {id:'high',kind:'high',w:3,pts:[[20.3,4.5],[24,4.45],[28,4.25],[32,4.45],[36,4.85],[40,5.05],[44.5,5.1]]},
    {id:'grove',kind:'trail',w:2,pts:[[43.5,5.1],[47,5.6],[51,6.7],[55,7.9],[59,8.6],[63,8.3],[67,7.1],[70,5.9],[71.5,4.5],[71.6,2.6]]},
    {id:'crescent',kind:'lane',w:2,pts:[[21.3,4],[21.4,.6],[22.7,-2],[25,-3.3],[29,-3.5],[33,-3.45],[36.6,-2.9],[39.4,-1.6],[40.6,.6],[40.7,4.4]]},
    {id:'cut',kind:'lane',w:2,pts:[[29,4.2],[28.95,1.5],[29,-1],[29.05,-3.4]]},
    {id:'mill',kind:'path',w:1.6,pts:[[24.3,5.3],[24.45,7.5],[24.4,10],[24.1,11.9],[23.8,12.9],[23.4,13.4]]},
    // The sanctuary path loops past each guardian's home in the order the realms were travelled, with a spur to the heart tree.
    {id:'sanctuary',kind:'path',w:1.6,pts:[[71.6,2.8],[72,.4],...Array.from({length:15},(_,i)=>{const a=.42+i*(Math.PI*2-.84)/14;return [72+Math.sin(a)*5.2,-7+Math.cos(a)*5.6];}),[71.2,.3]]},
    {id:'heart',kind:'path',w:1.6,pts:[[72,-.6],[72,-2.6],[72,-4.4]]},
    {id:'rose',kind:'lane',w:2,pts:[[37.4,5],[36.4,8.4],[34.5,10.5],[34.25,13.5],[34.8,16.5],[36.5,19],[39.5,20.25],[43.5,20.45],[47.3,20.1]]}];
  const blockedCell=(x,y)=>zones.some(z=>x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h)||town.some(z=>x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h);
  const roadLines=[];
  function lay(r){const pts=curve(r.pts);roadLines.push({...r,pts});const half=r.w/2,xs=pts.map(p=>p[0]),ys=pts.map(p=>p[1]);
    for(let x=Math.floor(Math.min(...xs)-half);x<=Math.ceil(Math.max(...xs)+half);x++)for(let y=Math.floor(Math.min(...ys)-half);y<=Math.ceil(Math.max(...ys)+half);y++){if(blockedCell(x,y))continue;
      let d=1e9;for(const [px,py] of pts){const e=Math.hypot(x+.5-px,y+.5-py);if(e<d)d=e;}if(d<=half+.02&&!roadMap.has(roadKey(x,y)))roadMap.set(roadKey(x,y),{x,y,kind:r.kind});}}
  ROUTES.forEach(lay);
  // Doorsteps: a short footpath from each door to the nearest road.
  for(const b of town){const e=b.entrance;if(roadMap.has(roadKey(e.x,e.y)))continue;let best=null;for(const c of roadMap.values()){const d=Math.hypot(c.x-e.x,c.y-e.y);if(!best||d<best.d)best={d,c};}
    if(best)lay({id:'door-'+b.id,kind:'path',w:1.6,pts:[[e.x+.5,e.y+.5],[(e.x+best.c.x)/2+.5,(e.y+best.c.y)/2+.5],[best.c.x+.5,best.c.y+.5]]});}
  // How far a point is from the edge of any road (negative inside).
  function roadNear(x,y){let d=1e9;for(const r of roadLines)for(let i=0;i<r.pts.length;i+=2){const e=Math.hypot(x-r.pts[i][0],y-r.pts[i][1])-r.w/2;if(e<d)d=e;}return d;}
  const roads=[...roadMap.values()];
  const roadAt=(x,y)=>roadMap.get(roadKey(x,y));
  const civic=(x,y)=>(x>=20&&x<=56&&y>=-11&&y<=9)||(x>=18&&x<=24&&y>=9&&y<=16)||(x>=20&&x<=57&&y>=18&&y<=27)||(x>=47&&x<=57&&y>=9&&y<=18)||(x>=34&&x<=35&&y>=9&&y<=24)||(x>=grove.x&&x<grove.x+grove.w&&y>=grove.y&&y<grove.y+grove.h)||!!roadAt(x,y);
  // Wood and stone are earned in the world (clearing, gathering, fishing trades), not bought with gems.
  const offers={rod:{name:'Fishing rod',price:30,woodCost:4,need:2,tool:'rod'},trade:{name:'Trade 1 fish for 4 stone',fishCost:1,stone:4},sell:{name:'Trade 1 fish for 6 gems',fishCost:1,gems:6}};
  const inZone=(z,x,y)=>x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h;
  function mask(objects,o,defs){const family=defs[o.type]?.connect;if(!family)return 0;return [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]].reduce((m,[dx,dy,bit])=>m|(objects.some(n=>n.id!==o.id&&n.x===o.x+dx&&n.y===o.y+dy&&defs[n.type]?.connect===family)?bit:0),0);}
  const corner=m=>[3,6,9,12].includes(m);
  // Land ownership, not tree removal, determines the grid. Keep the Story Stones
  // outside both layers. Shared edges belong to open land to avoid double lines.
  function landGrid(save){
    const cells=new Map(),edges=new Map();
    for(const z of [{x:0,y:0,w:12,h:10,need:0},...zones]){
      const open=z.need===0||save.land.includes(z.id);
      for(let x=z.x;x<z.x+z.w;x++)for(let y=z.y;y<z.y+z.h;y++){
        if(x>=-7&&x<-3&&y>=0&&y<4)continue;
        const k=x+','+y;cells.set(k,{x,y,open:open||!!cells.get(k)?.open});
      }
    }
    for(const {x,y,open} of cells.values())for(const e of [[x,y,x+1,y],[x,y,x,y+1],[x,y+1,x+1,y+1],[x+1,y,x+1,y+1]]){
      const key=e.join(',');if(!edges.has(key)||open)edges.set(key,{e,open});
    }
    const result={open:[],future:[],openCells:0,futureCells:0};
    for(const {e,open} of edges.values())result[open?'open':'future'].push(e);
    for(const {open} of cells.values())result[open?'openCells':'futureCells']++;
    return result;
  }
  root.CampContent={order,milestones,catalog,later,kits,trophySpots,villagers,zones,town,locations,guardianPads,grove,groveFence,roadLines,roadNear,bounds,roads,roadAt,civic,offers,inZone,mask,corner,landGrid};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CampContent;
})(typeof window!=='undefined'?window:globalThis);
