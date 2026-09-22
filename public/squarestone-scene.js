/* Painted realm pilot. Visual state is derived from existing learning saves. */
(function(root){
  'use strict';
  const registration=typeof module!=='undefined'&&module.exports?require('./realm-scene-registration'):root.RealmSceneRegistration;
  function placement(f,stage){const p=registration[f][stage];return 'left:'+p.left+'%;top:'+p.top+'%;width:'+(100*p.scale)+'%;height:'+(100*p.scale)+'%';}
  const base='art/realm/squarestone/';
  const stages=['ruins','foundation','walls','restored','celebrated'];
  const titles=['A watchtower waiting for you','The workshop is ready','The walls stand strong','The valley beacon shines','A three-star celebration'];
  const descriptions=[
    'Boulder has found a broken watchtower. Discover how doubling twice can help rebuild it.',
    'The stones and scaffolding are ready. Help Boulder restore the watchtower in the guardian encounter.',
    'The stone walls are repaired. One last stage will bring light back to the valley.',
    'You helped Boulder bring the watchtower back to life. The Fact Trail adds its celebration banners.',
    'Your thirteen checked facts have earned the watchtower its gold-and-teal celebration banners.'
  ];
  const asset=stage=>base+stage+'-v1.webp';
  function view({trial=false,conquered=false,stars=0,context='realm',progress=0}={}){
    const p=Number.isFinite(progress)?Math.max(0,Math.min(1,progress)):0;
    let index=stars>=3?4:conquered||stars>=2?3:trial||stars>=1?1:0;
    if(context==='encounter')index=Math.min(3,Math.floor(p*3+1e-7));
    if(context==='lesson'&&index<3)index=Math.max(index,Math.min(2,Math.floor(p*2)));
    const stage=stages[index];
    return {index,stage,src:asset(stage),lit:index>=3,title:titles[index],description:descriptions[index],context,
      caption:context==='encounter'?['Find the fallen stones','Foundation repaired · 1 of 3','Walls rebuilt · 2 of 3','Beacon lit · 3 of 3'][index]:context==='lesson'&&index<3?'Workshop preview · practise doubling twice':titles[index]};
  }
  function markup(v){
    return `<figure class="squarestone-scene ss-${v.context} ss-${v.stage}" data-scene data-family="4" data-context="${v.context}" data-stage="${v.stage}" aria-label="Squarestone Valley: ${v.caption}">
      <div class="ss-world" aria-hidden="true">
        <img class="ss-landscape" src="${asset('landscape')}" width="1280" height="853" alt="" decoding="async" onerror="this.hidden=true">
        <div class="ss-waterlight"></div><div class="ss-atmosphere"></div>
        <div class="ss-tower" data-landmark><img class="ss-tower-art scene-layer" style="${placement(4,v.stage)}" src="${v.src}" width="768" height="768" alt="" decoding="async" onerror="this.hidden=true;this.closest('figure').dataset.artError='true'"><span class="ss-beacon-glow"></span></div>
        <img class="ss-boulder" src="art/realm/pet-4.png" width="512" height="512" alt="" decoding="async">
        <div class="ss-motes"><i></i><i></i><i></i></div>
        <div class="ss-vignette"></div>
      </div>
      <figcaption><span class="ss-location">BOULDER’S WATCHTOWER</span><strong>${v.caption}</strong><small class="scene-art-status">Artwork unavailable. Your progress is safe.</small></figcaption>
    </figure>`;
  }
  const api={view,markup,asset,stages,assets:[asset('landscape'),...stages.map(asset)]};
  root.SquarestoneScene=api;if(typeof module!=='undefined'&&module.exports)module.exports=api;
})(typeof window!=='undefined'?window:globalThis);

function squarestoneScene(context='realm',progress=0){
  warmSquarestoneScene();
  const realm=state?.realms[4]||{};
  const stars=state?realmStars(4).stars:0;
  const view=SquarestoneScene.view({...realm,stars,context,progress});
  return SquarestoneScene.markup(view);
}
let squarestoneWarmed=false;
function warmSquarestoneScene(){
  if(squarestoneWarmed)return;squarestoneWarmed=true;
  // Warm only this realm on entry. Future restoration frames are ready before
  // the answer that reveals them, and the service worker keeps them offline.
  SquarestoneScene.assets.forEach(src=>{const image=new Image();image.decoding='async';image.src=src;});
  if(navigator.serviceWorker)navigator.serviceWorker.ready.then(reg=>reg.active?.postMessage({type:'WARM_REALM',family:4})).catch(()=>{});
}
function squarestoneStory(){
  const view=SquarestoneScene.view({...state.realms[4],stars:realmStars(4).stars});
  const action=view.index===4?['Explore my next destination','doContinue()']:view.index===3?['Earn the celebration banners','startFactTrail(4)']:view.index>=1?['Help Boulder restore the tower','startBoss(4)']:['Discover with Boulder','startLearn(4)'];
  return `<div class="ss-story"><span>YOUR WORK CHANGES THIS PLACE</span><p>${view.description}</p><button class="btn gold ss-story-action" onclick="${action[1]}">${action[0]} <span aria-hidden="true">→</span></button></div>`;
}
