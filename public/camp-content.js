/* Camp progression content and topology. No rendering or profile side effects. */
(function(root){
  const order=[0,1,10,2,5,11,3,4,9,6,12,8,7];
  const milestones=[
    'Picket fencing · Woodland Grove','Fishing rod · coloured shelters','Canvas shelter · garden well','North Meadow · complete your campsite',
    'Timber palisade · town building plot','Fort gate · log lodge','Timber watchtower','South Orchard · timber fort complete',
    'Stone walls · stone cottage','Stone gateway · courtyard well','Stone keep · cobbled paths','Grand stone courtyard','Moat channels · drawbridges'
  ];
  const catalog={
    palisade:{name:'Timber Palisade',w:1,h:1,layer:'solid',price:7,wood:4,need:5,next:'stonewall',rotate:true,connect:'wall'},
    fortgate:{name:'Fort Gate',w:1,h:1,layer:'surface',price:16,wood:8,need:6,next:'stonegate',rotate:true,connect:'wall',action:'Walk through'},
    stonewall:{name:'Stone Wall',w:1,h:1,layer:'solid',price:10,wood:0,stone:5,need:9,rotate:true,connect:'wall'},
    stonegate:{name:'Stone Gateway',w:1,h:1,layer:'surface',price:24,wood:4,stone:12,need:10,rotate:true,connect:'wall',action:'Walk through'},
    lodge:{name:'Timber Lodge',w:3,h:3,layer:'solid',price:90,wood:22,stone:4,need:6,next:'stonehome',action:'Rest'},
    stonehome:{name:'Stone Cottage',w:3,h:3,layer:'solid',price:120,wood:12,stone:30,need:9,next:'keep',action:'Rest'},
    keep:{name:'Stone Keep',w:4,h:3,layer:'solid',price:180,wood:16,stone:55,need:11,action:'Rest'},
    well:{name:'Garden Well',w:1,h:1,layer:'solid',price:18,wood:5,stone:4,need:3,next:'stonewell',action:'Draw water'},
    stonewell:{name:'Courtyard Well',w:1,h:1,layer:'solid',price:25,wood:3,stone:12,need:10,action:'Draw water'},
    tower:{name:'Timber Watchtower',w:2,h:2,layer:'solid',price:45,wood:16,stone:3,need:7,action:'Look out'},
    cobble:{name:'Cobblestone Path',w:1,h:1,layer:'surface',price:4,wood:0,stone:1,need:11,connect:'path'},
    flowerbed:{name:'Flower Border',w:1,h:1,layer:'solid',price:5,wood:0,need:2},
    moat:{name:'Moat Channel',w:1,h:1,layer:'water',price:9,wood:0,stone:4,need:13,connect:'moat'},
    drawbridge:{name:'Drawbridge',w:1,h:1,layer:'surface',price:22,wood:10,stone:4,need:13,rotate:true,action:'Walk through'}
  };
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
    {id:'fernHollow',name:'Fern Hollow',x:-14,y:13,w:14,h:8,need:8}
  ];
  const town=[{id:'store',type:'store',x:24,y:0,w:4,h:3},{id:'bakery',type:'townhouse',x:30,y:0,w:3,h:3},{id:'hall',type:'townhall',x:30,y:6,w:4,h:3},
    {id:'library',type:'townhouse',x:24,y:-7,w:3,h:3},{id:'workshop',type:'lodge',x:33,y:-7,w:3,h:3},
    {id:'inn',type:'townhall',x:36,y:0,w:4,h:3},{id:'mill',type:'lodge',x:21,y:13,w:3,h:3},
    {id:'rosehouse',type:'townhouse',x:39,y:22,w:3,h:3},{id:'bluehouse',type:'townhouse',x:45,y:22,w:3,h:3},{id:'gardenhouse',type:'townhouse',x:51,y:22,w:3,h:3}];
  const locations=[{id:'store',name:'Willowbrook Supply Store',x:26,y:4},{id:'fish',name:'Fishing Dock',x:14,y:8},
    {id:'sanctuary',name:'Guardian Grove',x:71,y:3},{id:'market',name:'Market Square',x:31,y:-9},{id:'gardens',name:'Rosewater Gardens',x:49,y:19},{id:'mill',name:'Willow Watermill',x:23,y:17}];
  const guardianKinds=['ghost','bunny','fox','monkey','turtle','frog','bee','wolf','penguin','owl','robot','parrot','dragon'];
  // Rendering, tree clearing and navigation share one authored world layout.
  const bounds={minX:-36,maxX:86,minY:-24,maxY:44};
  const grove={x:62,y:-18,w:21,h:23,gateX:70,gateW:4};
  const guardianPads=order.map((family,i)=>{const a=.48+i*(Math.PI*2-.96)/12;return {family,kind:guardianKinds[family],x:Math.round(72+Math.sin(a)*7.5),y:Math.round(-7+Math.cos(a)*8),angle:a+Math.PI};});
  const groveFence=(x,y)=>((x===grove.x||x===grove.x+grove.w-1)&&y>=grove.y&&y<grove.y+grove.h)||((y===grove.y||y===grove.y+grove.h-1)&&x>=grove.x&&x<grove.x+grove.w&&!(y===4&&x>=grove.gateX&&x<grove.gateX+grove.gateW));
  const roadMap=new Map(),roadKey=(x,y)=>x+','+y;
  function street(x1,y1,x2,y2,width=1,kind='cobble'){for(let x=Math.min(x1,x2);x<=Math.max(x1,x2);x++)for(let y=Math.min(y1,y2);y<=Math.max(y1,y2);y++)for(let dx=0;dx<width;dx++)for(let dy=0;dy<width;dy++){const a=x+dx,b=y+dy;if(zones.some(z=>a>=z.x&&a<z.x+z.w&&b>=z.y&&b<z.y+z.h)||town.some(z=>a>=z.x&&a<z.x+z.w&&b>=z.y&&b<z.y+z.h))continue;roadMap.set(roadKey(a,b),{x:a,y:b,kind});}}
  street(20,4,54,4,2);street(28,-9,28,9,2);street(34,-9,34,24,2);
  street(24,-4,37,-4,2);street(28,-8,38,-8,2);
  street(24,6,24,17);street(22,16,24,16);street(23,17,24,17);
  street(35,20,55,20,2);street(47,6,47,24,2);street(39,25,54,25,2);
  for(const b of town){b.entrance={x:Math.floor(b.x+b.w/2),y:b.y+b.h};const e=b.entrance;
    if(b.y===-7)street(e.x,e.y,e.x,-3);
    else if(b.y===0)street(e.x,e.y,e.x,5);
    else if(b.id==='hall')street(e.x,9,34,9);
    else if(b.id==='mill')street(e.x,e.y,23,16);
    else street(e.x,e.y,e.x,25);
  }
  const guardianTrail=[[54,5],[58,5],[58,12],[62,12],[62,8],[71,8],[71,3]];
  for(let i=1;i<guardianTrail.length;i++)street(...guardianTrail[i-1],...guardianTrail[i],2,'trail');
  street(71,-14,71,3,2,'trail');
  const roads=[...roadMap.values()];
  const roadAt=(x,y)=>roadMap.get(roadKey(x,y));
  const civic=(x,y)=>(x>=20&&x<=56&&y>=-11&&y<=9)||(x>=20&&x<=57&&y>=18&&y<=27)||(x>=47&&x<=57&&y>=9&&y<=18)||(x>=34&&x<=35&&y>=9&&y<=24)||(x>=grove.x&&x<grove.x+grove.w&&y>=grove.y&&y<grove.y+grove.h)||!!roadAt(x,y);
  const offers={wood:{name:'6 wood',price:8,wood:6},stone:{name:'4 stone',price:10,stone:4},rod:{name:'Fishing rod',price:30,woodCost:4,need:2,tool:'rod'},trade:{name:'Trade 1 fish for 4 stone',fishCost:1,stone:4},sell:{name:'Trade 1 fish for 6 gems',fishCost:1,gems:6}};
  const inZone=(z,x,y)=>x>=z.x&&x<z.x+z.w&&y>=z.y&&y<z.y+z.h;
  function mask(objects,o,defs){const family=defs[o.type]?.connect;if(!family)return 0;return [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]].reduce((m,[dx,dy,bit])=>m|(objects.some(n=>n.id!==o.id&&n.x===o.x+dx&&n.y===o.y+dy&&defs[n.type]?.connect===family)?bit:0),0);}
  const corner=m=>[3,6,9,12].includes(m);
  root.CampContent={order,milestones,catalog,zones,town,locations,guardianPads,grove,groveFence,guardianTrail,bounds,roads,roadAt,civic,offers,inZone,mask,corner};
  if(typeof module!=='undefined'&&module.exports)module.exports=root.CampContent;
})(typeof window!=='undefined'?window:globalThis);
