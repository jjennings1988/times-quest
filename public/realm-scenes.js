/* Painted places respond to the same earned progress as their learning activities. */
(function(root){
  'use strict';
  const registration=typeof module!=='undefined'&&module.exports?require('./realm-scene-registration'):root.RealmSceneRegistration;
  function placement(f,stage){const p=registration[f][stage];return 'left:'+p.left+'%;top:'+p.top+'%;width:'+(100*p.scale)+'%;height:'+(100*p.scale)+'%';}
  const definitions={
    0:{name:'Zero Marsh',guardian:'Poof',landmark:'The lantern causeway',strategy:'discover what zero means',intro:'The fog has hidden the way through the marsh. Explore empty groups with Poof to find the path.',titles:['A path hidden in the mist','The riverbank is clear','The lantern path is ready','The marsh lights welcome you','A celebration in the marsh'],phases:['Find the hidden bank','Bank revealed','Path revealed','Lanterns lit'],reward:'gold-and-teal ribbons'},
    1:{name:'One Woods',guardian:'Echo',landmark:'The woodland nursery',strategy:'explore one equal group',intro:'Echo’s woodland nursery needs care. Discover how one group keeps its amount, then help the garden bloom.',titles:['A garden waiting for care','The planting beds are ready','Fresh shoots reach the trellis','The woodland garden blooms','A woodland flower festival'],phases:['Find the neglected garden','Soil prepared','Shoots growing','Flowers open'],reward:'flower garlands and green-and-gold pennants'},
    2:{name:'Double River',guardian:'Twix',landmark:'The twin crossing',strategy:'discover doubles',intro:'The river crossing is broken. Explore doubles with Twix, then help join the two banks again.',titles:['A crossing waiting for you','The bridge supports are ready','The new deck spans the river','The crossing is open','A riverside celebration'],phases:['Find the broken crossing','Supports repaired','Deck rebuilt','Crossing open'],reward:'teal-and-gold bridge banners'},
    3:{name:'Triple Jungle',guardian:'Trio',landmark:'The canopy walkway',strategy:'combine a double and one more group',intro:'Trio’s canopy trail has fallen apart. Discover a double plus one more group, then weave the trail together.',titles:['A gap in the canopy trail','The vines are anchored','The walkway takes shape','The canopy trail is open','A festival among the leaves'],phases:['Find the broken trail','Vines anchored','Walkway woven','Trail open'],reward:'flower garlands and jungle pennants'},
    5:{name:'High-Five Harbor',guardian:'Slap',landmark:'The welcoming harbor',strategy:'find half of ten equal groups',intro:'Slap’s dock needs rebuilding. Explore half of ten groups, then bring the boats safely home.',titles:['A harbor waiting for help','The dock supports stand firm','The boat shelter takes shape','The boats have come home','A harbor homecoming festival'],phases:['Find the damaged dock','Supports repaired','Shelter rebuilt','Harbor lit'],reward:'nautical banners and flower baskets'},
    6:{name:'Six Circuit',guardian:'Buzz',landmark:'The sun engine',strategy:'add one group to five',intro:'Buzz’s sun engine has fallen silent. Discover five groups plus one more, then wake the valley beacons.',titles:['The sun engine is quiet','The pipes are connected','The engine is ready to charge','The meadow beacons shine','A golden engine celebration'],phases:['Find the quiet engine','Cells connected','Engine repaired','Beacons awake'],reward:'sun banners and bright flower planters'},
    7:{name:'Seven Storm Peak',guardian:'Tempest',landmark:'The storm refuge',strategy:'combine five groups and two groups',intro:'The mountain refuge needs shelter and light. Explore five groups plus two with Tempest, then welcome travellers inside.',titles:['A refuge waiting for repair','The shelter walls are secure','The new roof keeps out the rain','The refuge lights shine','A mountain homecoming'],phases:['Find the damaged refuge','Walls secured','Roof restored','Refuge lit'],reward:'purple-and-gold shelter banners'},
    8:{name:'Eight Ice Caves',guardian:'Glacier',landmark:'The crystal passage',strategy:'double three times',intro:'Fallen ice blocks Glacier’s crystal passage. Discover three doubles, then reveal the sparkling way through.',titles:['A passage hidden by ice','The crystal steps are clear','The crystal arch rises','The crystal passage glows','A festival of crystal stars'],phases:['Find the blocked passage','Ice cleared','Crystals raised','Passage open'],reward:'gold ribbons and hanging crystal stars'},
    9:{name:'Nine Ninja Temple',guardian:'Sensei',landmark:'The lantern courtyard',strategy:'remove one group from ten',intro:'The temple courtyard has lost its glow. Explore ten groups minus one with Sensei, then relight its lanterns.',titles:['A courtyard waiting for care','The temple pillars are repaired','The lanterns are ready','The temple glow returns','A lantern festival'],phases:['Find the quiet courtyard','Courtyard cleared','Lanterns hung','Temple glowing'],reward:'gold tassels and festival bunting'},
    10:{name:'Ten City',guardian:'Deca',landmark:'The city power station',strategy:'build ten equal groups',intro:'Ten City’s power station needs your ideas. Explore ten equal groups with Deca, then bring light back to the streets.',titles:['The city station is quiet','The power lines are connected','The blue dome is repaired','The city lights shine','A skyline celebration'],phases:['Find the silent station','Station connected','Dome repaired','City powered'],reward:'blue-and-gold banners and star finials'},
    11:{name:'Twin Towers',guardian:'Copy',landmark:'The twin sky towers',strategy:'add one group to ten',intro:'Copy’s sky towers have lost their bridge. Discover ten groups plus one, then reunite the towers above the valley.',titles:['Two towers waiting for help','Both foundations are secure','The towers meet in the sky','The sky windows shine','A twin-tower celebration'],phases:['Find the broken towers','Foundations repaired','Towers raised','Windows lit'],reward:'matching tower banners and sky-bridge bunting'},
    12:{name:'Dozen Desert',guardian:'Tock',landmark:'The oasis garden',strategy:'combine ten groups and two groups',intro:'Tock’s oasis has run dry. Discover ten groups plus two, then bring water and life back to the desert.',titles:['An oasis waiting for water','The watercourse is clear','Water reaches the young palms','The oasis is alive','An oasis celebration'],phases:['Find the dry oasis','Watercourse opened','Palms watered','Oasis alive'],reward:'turquoise canopies and golden ribbons'}
  };
  const stages=['ruins','foundation','walls','restored','celebrated'];
  const asset=(family,stage)=>`art/realm/scenes/x${family}/${stage}-${stage==='landscape'?'v1':'v2'}.webp`;
  function view(family,{trial=false,conquered=false,stars=0,context='realm',progress=0}={}){
    const d=definitions[family];if(!Number.isInteger(family)||!d)return null;
    if(!['realm','lesson','encounter'].includes(context))context='realm';
    const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
    let index=stars>=3?4:conquered||stars>=2?3:trial||stars>=1?1:0;
    if(context==='encounter')index=Math.min(3,Math.floor(p*3+1e-7));
    if(context==='lesson'&&index<3)index=Math.max(index,Math.min(2,Math.floor(p*2)));
    const stage=stages[index];
    const description=index===0?d.intro:index<3?`The preparations are ready. Help ${d.guardian} finish this place in the guardian encounter.`:index===3?`You helped ${d.guardian} restore this place. Complete its Fact Trail to add ${d.reward}.`:`Your thirteen checked facts have earned this place its ${d.reward}.`;
    const caption=context==='encounter'?`${d.phases[index]} · ${index} of 3`:context==='lesson'&&index<3?`Discovery preview · ${d.strategy}`:d.titles[index];
    return {family,index,stage,context,caption,description,src:asset(family,stage),...d};
  }
  function markup(v){
    if(!v)return '';
    return `<figure class="squarestone-scene painted-realm-scene rs-composed ss-${v.context} ss-${v.stage} rs-family-${v.family}" data-scene data-family="${v.family}" data-context="${v.context}" data-stage="${v.stage}" style="--realm-fallback:url('art/battle/bg-battle-x${v.family}-portrait.webp');--realm-empty:url('${asset(v.family,'landscape')}')" aria-label="${v.name}: ${v.caption}">
      <div class="ss-world" aria-hidden="true"><img class="ss-landscape" src="${asset(v.family,'landscape')}" width="627" height="418" alt="" decoding="async" onerror="this.hidden=true"><div class="rs-landmark" data-landmark><img class="rs-stage-art scene-layer" style="${placement(v.family,v.stage)}" src="${v.src}" width="627" height="418" alt="" decoding="async" onerror="this.hidden=true;this.closest('figure').dataset.artError='true'"></div><div class="ss-atmosphere"></div><img class="ss-boulder rs-guardian" src="art/realm/pet-${v.family}.png" width="512" height="512" alt="" decoding="async" onerror="this.hidden=true"><div class="ss-motes"><i></i><i></i><i></i></div><div class="ss-vignette"></div></div>
      <figcaption><span class="ss-location">${v.landmark.toUpperCase()}</span><strong>${v.caption}</strong><small class="scene-art-status">Artwork unavailable. Your progress is safe.</small></figcaption></figure>`;
  }
  const api={definitions,stages,asset,assets:family=>[...stages,'landscape'].map(stage=>asset(family,stage)),view,markup};
  root.RealmScenes=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

function paintedRealmScene(family,context='realm',progress=0){
  if(family===4)return squarestoneScene(context,progress);
  const v=RealmScenes.view(family,{...state?.realms[family],stars:state?realmStars(family).stars:0,context,progress});
  if(!v)return '';
  warmPaintedRealm(family);
  return RealmScenes.markup(v);
}
const paintedRealmWarmed=new Set();
function warmPaintedRealm(family){
  if(paintedRealmWarmed.has(family)||!RealmScenes.definitions[family])return;
  paintedRealmWarmed.add(family);
  // Only decode this realm's stages. The full art library stays out of the app shell.
  RealmScenes.assets(family).forEach(src=>{const img=new Image();img.decoding='async';img.src=src;});
  if(navigator.serviceWorker)navigator.serviceWorker.ready.then(reg=>reg.active?.postMessage({type:'WARM_REALM',family})).catch(()=>{});
}
function paintedRealmStory(family){
  if(family===4)return squarestoneStory();
  const v=RealmScenes.view(family,{...state.realms[family],stars:realmStars(family).stars});
  if(!v)return '';
  const action=v.index===4?['Explore my next destination','doContinue()']:v.index===3?['Earn the celebration decorations',`startFactTrail(${family})`]:v.index>=1?[`Help ${v.guardian} restore this place`,`startBoss(${family})`]:[`Discover with ${v.guardian}`,`startLearn(${family})`];
  return `<div class="ss-story"><span>YOUR WORK CHANGES THIS PLACE</span><p>${v.description}</p><button class="btn gold ss-story-action" onclick="${action[1]}">${action[0]} <span aria-hidden="true">→</span></button></div>`;
}
