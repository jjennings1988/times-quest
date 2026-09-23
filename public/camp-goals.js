/* Read-only project planning. Purchases and placement stay in CampV2.command. */
(function(root){
  'use strict';
  function valid(catalog,id){return typeof id==='string'&&Object.hasOwn(catalog,id);}
  function normalize(catalog,id){return valid(catalog,id)?id:'gate';}
  function category(catalog,id){const d=catalog[id];return ['tent','trailtent','canvas','cabin','lodge','stonehome','keep'].includes(id)?'Homes':d.connect==='wall'||['tower','moat','drawbridge'].includes(id)?'Fences, gates & forts':d.layer==='surface'?'Paths & platforms':'Garden & camp life';}
  function groups(catalog){const result={};for(const id of Object.keys(catalog)){const key=category(catalog,id);(result[key]||=[]).push(id);}return Object.entries(result).map(([name,ids])=>({name,ids:ids.sort((a,b)=>(catalog[a].need||0)-(catalog[b].need||0))}));}
  function view(catalog,save,id,{mastered=save.mastered||0,pendingGems=0}={}){
    const type=normalize(catalog,id),item=catalog[type],placed=save.objects.find(o=>o.type===type),kit=(save.inventory[type]||0)>0;
    const predecessor=save.objects.find(o=>catalog[o.type]?.next===type);
    const resources=['gems','wood','stone'].map(key=>{const need=kit||placed?0:key==='gems'?item.price:item[key]||0,have=(save[key]||0)+(key==='gems'?pendingGems:0);return {key,need,have,missing:Math.max(0,need-have)};});
    const remaining=placed||kit?0:Math.max(0,(item.need||0)-mastered),ready=!remaining&&resources.every(r=>!r.missing),constructing=!!placed&&save.construction?.objectId===placed.id;
    return {type,item,placed,kit,predecessor,resources,remaining,ready,constructing,mastered,pendingGems};
  }
  /* One small, optional thing to do today for the pinned project. No streaks, nothing lost if skipped. */
  function todayIdea(g,{hasRod=false}={}){
    if(g.placed)return 'Choose a new project, or add a path or flowers around this one.';
    if(g.constructing)return 'Visit camp so your explorer can finish building.';
    if(g.kit||g.ready)return 'Open Build and choose a spot to place it.';
    if(g.remaining)return `Restore ${g.remaining} more realm${g.remaining===1?'':'s'} on the Adventure map.`;
    const miss=Object.fromEntries(g.resources.map(r=>[r.key,r.missing]));
    if(miss.stone)return g.mastered>=3?'Take a river trip to collect stones (+4 stone for two review facts).':hasRod?'Catch a fish and trade it for 4 stone at the store.':'Restore 3 realms to open the river stone bar.';
    if(miss.wood)return 'Clear a tree (+6 wood) or gather fallen branches (+3 wood).';
    if(miss.gems)return 'Finish one learning round to earn gems.';
    return 'Open Build and choose a spot.';
  }
  const api={valid,normalize,category,groups,view,todayIdea};root.CampGoals=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);
