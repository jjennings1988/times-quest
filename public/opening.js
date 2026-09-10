/* A complete first expedition. Existing routes and camps remain player-owned. */
function showTitle(){
  if(quiz){toast('Finish or leave your round first');return;}
  if(campV2Session){campV2Session.dispose();campV2Session=null;}
  document.body.classList.remove('camp-world-open');stopCampAmbience();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $('profile-gate').classList.remove('on');$('nav').style.display='none';
  const host=$('screen-title');host.classList.add('active');
  const player=state&&profileById();
  host.innerHTML=`<div class="title-world"><div class="title-shade"></div><div class="title-copy"><span class="title-kicker">THE CLIMB TO MOUNT TWELVE</span><h1>Times<span>Quest</span></h1><p class="title-promise">Learn your facts.<br>Build your world.</p><p class="title-invitation">A world to explore. Friends to discover.<br>A camp that grows with you.</p><div class="title-actions">${player?`<button class="title-play" onclick="continueFromTitle()"><img src="${profileAvatar()}" alt="">Continue as ${escapeHtml(player.name)} <span aria-hidden="true">→</span></button><button class="title-secondary" onclick="openProfileChooser()">Choose another explorer</button>`:'<button class="title-play" onclick="openProfileChooser()">Play <span aria-hidden="true">→</span></button>'}<button class="title-parent" onclick="titleParents()">For grown-ups</button></div><div class="title-values"><span>13 realms</span><span>Your own camp</span><span>No race against time</span></div></div><div class="title-fireflies" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div>`;
  host.querySelector('.title-play').focus({preventScroll:true});
}
function continueFromTitle(){showScreen('screen-map');if(state.journey.resume)resumeRound();else if(state.journey.current)resumeLesson();else if(!state.journey.onboardingDone)startWelcome();}
function titleParents(){openQuestCard('<section class="journey-card"><h2>An adventure worth growing into</h2><p>Children explore multiplication, practise familiar facts, help guardians and build a personal camp. Adventure has no countdown. Help is always available.</p><p>Each explorer has a separate save on this device. There are no real-money purchases. Export a family backup from Parents to protect your progress.</p><p>The app works offline after its files download. Visit Camp 2 online once to download its 3D world. Learning progress describes observed answers, not a diagnosis or a guarantee of mastery.</p><button class="btn gold" onclick="closeQuestCard()">Back to the adventure</button></section>');}
function illustratedGuardian(fam,props=''){
  if(!props&&fam>0&&typeof GuardianChapters!=='undefined')props=guardianLandmark(fam,state?.realms[fam]?.conquered?1:0);
  return `<div class="guardian-scene realm-scene-${fam}" style="--scene-art:url('art/battle/bg-battle-x${fam}-portrait.webp')"><div class="guardian-mist" aria-hidden="true"></div><img class="guardian-resident" src="art/realm/pet-${fam}.png" alt="${escapeHtml(REALMS[fam].petName)}"><span class="guardian-location">${REALMS[fam].name}</span>${props}</div>`;
}
function zeroBaskets(groups,each,{inspect=false}={}){
  return `<div class="zero-baskets" aria-label="${groups} baskets with ${each} supplies in each">${groups?Array.from({length:groups},(_,i)=>inspect?`<button class="zero-basket ${state.journey.current?.opened?.includes(i)?'inspected':''}" onclick="inspectZeroBasket(${i})" aria-label="Inspect basket ${i+1}" aria-pressed="${!!state.journey.current?.opened?.includes(i)}"><span class="basket-rim"></span><span class="basket-inside">${state.journey.current?.opened?.includes(i)?'Empty':'?'}</span></button>`:`<div class="zero-basket"><span class="basket-rim"></span><span class="basket-inside">${each?Array.from({length:each},()=>'<i class="supply-stone"></i>').join(''):'Empty'}</span></div>`).join(''):'<div class="absent-baskets"><span>0 baskets</span><small>There are no groups here.</small></div>'}</div>`;
}
function renderZeroLesson(){
  $('screen-journey').style.backgroundImage="url('art/battle/bg-battle-x0-portrait.webp')";
  const c=state.journey.current;if(!c||c.family!==0)return;
  const opened=c.opened||[],step=c.zeroStep||'inspect';
  let task='';
  if(step==='inspect')task=`<h2>What is inside Poof’s baskets?</h2><p>There are <b>3 baskets</b>. Open each one to find how many supplies it holds.</p>${zeroBaskets(3,0,{inspect:true})}<p class="zero-equation">3 groups × 0 in each = <strong>0</strong></p><p role="status">${opened.length===3?'All three baskets are empty. Three groups of nothing still make zero.':`${opened.length} of 3 baskets inspected`}</p><button class="btn gold" onclick="advanceZeroLesson()" ${opened.length<3?'disabled':''}>Now try a different arrangement</button>`;
  else if(step==='remove')task=`<h2>Four in each basket—but how many baskets?</h2><p>Each basket holds <b>4 supplies</b>. Send the baskets to the store, one at a time. Watch how the total changes.</p>${zeroBaskets(c.groups,4)}<p class="zero-equation">${c.groups} groups × 4 in each = <strong>${c.groups*4}</strong></p><button class="btn secondary" onclick="removeZeroBasket()" ${c.groups===0?'disabled':''}>Send one basket to the store</button><p role="status">${c.groups===0?'No baskets remain. Zero groups of four also make zero.':`${c.groups} baskets remain with ${c.groups*4} supplies.`}</p><button class="btn gold" onclick="advanceZeroLesson()" ${c.groups>0?'disabled':''}>Compare the two discoveries</button>`;
  else task=`<h2>Different arrangements. The same total.</h2><div class="zero-comparison"><div>${zeroBaskets(3,0)}<strong>3 × 0 = 0</strong><p>Three empty baskets.</p></div><div>${zeroBaskets(0,4)}<strong>0 × 4 = 0</strong><p>No baskets of four.</p></div></div><p>One factor tells us the number of groups. The other tells us how many are in each. If either is zero, there is nothing to count altogether.</p><button class="btn gold" onclick="startZeroTry()">Try three new problems</button>`;
  $('journey-body').innerHTML=`<div class="guardian-chapter"><div class="chapter-heading"><small>CHAPTER ONE · ×0</small><h1>Poof’s missing supplies</h1><p>Explore the marsh at your own pace.</p></div>${illustratedGuardian(0)}<section class="journey-card zero-task">${task}<button class="btn ghost" onclick="saveState();showScreen('screen-map')">Save and explore</button></section></div>`;
}
function inspectZeroBasket(i){const c=state.journey.current;if(!c||c.family!==0||(c.zeroStep||'inspect')!=='inspect'||![0,1,2].includes(i))return;c.opened=[...new Set([...(c.opened||[]),i])];saveState();renderZeroLesson();$('journey-body').querySelector(`[aria-label="Inspect basket ${i+1}"]`)?.focus({preventScroll:true});}
function advanceZeroLesson(){const c=state.journey.current;if(!c||c.family!==0)return;if((c.zeroStep||'inspect')==='inspect'){if((c.opened||[]).length!==3)return;c.zeroStep='remove';c.groups=3;}else if(c.zeroStep==='remove'){if(c.groups!==0)return;c.zeroStep='compare';state.journey.zeroUnderstood=true;}else return;saveState();renderZeroLesson();$('journey-body').querySelector('h2')?.scrollIntoView({block:'nearest'});}
function removeZeroBasket(){const c=state.journey.current;if(!c||c.zeroStep!=='remove'||c.groups<=0)return;c.groups--;saveState();renderZeroLesson();$('journey-body').querySelector(c.groups?'[onclick="removeZeroBasket()"]':'[onclick="advanceZeroLesson()"]')?.focus({preventScroll:true});}
function startZeroTry(){
  if(!state.journey.zeroUnderstood){beginLesson(0);return;}
  state.journey.current=null;state.journey.zeroChapter=true;saveState();
  const queue=[{a:0,b:5,text:'5 × 0',ans:0,prompt:'Five nests each have zero eggs. How many eggs altogether?'},{a:0,b:7,text:'0 × 7',ans:0,prompt:'There are zero trays. A full tray holds seven seeds. How many seeds are on these trays?'},{a:0,b:2,text:'2 × 0',ans:0,prompt:'Two boats arrive with no passengers. How many passengers arrive?'}];
  lastConfig={fn:startZeroTry,args:[]};startQuiz({mode:'lesson',fams:[0],queue,timed:false,needCorrect:3,title:'Poof’s three discoveries'});
}
function startZeroEncounter(){
  if(!canStartBoss(0)){toast('Try Poof’s three discoveries first');return;}
  const queue=[{a:0,b:3,text:'3 × 0',ans:0,prompt:'Three empty baskets float through the mist. How many supplies do they carry?'},{a:0,b:6,text:'0 × 6',ans:0,prompt:'No supply boats remain. Each would hold six crates. How many crates remain?'},{a:0,b:4,text:'4 × 0',ans:0,prompt:'Four empty lantern baskets wait on the bank. How many fireflies are inside?'},{a:0,b:8,text:'0 × 8',ans:0},{a:0,b:2,text:'2 × 0',ans:0},{a:0,b:9,text:'0 × 9',ans:0}];
  lastConfig={fn:startZeroEncounter,args:[]};startQuiz({mode:'boss',fams:[0],queue,timed:false,hearts:heartCt(),needCorrect:3,battle:true,battleConfig:{...bossBattleConfig(0),name:'The Vanishing Fog',mechanic:'Three discoveries clear the way',intro:'Poof is beside you. Use what you discovered to clear the marsh.',phases:['Find the bank','Reveal the path','Welcome the light']},title:'Restore Zero Marsh'});
}
function zeroEncounterScenery(){
  const stage=$('battle-stage'),active=!!quiz?.battle&&quiz.fams[0]===0&&state.journey.zeroChapter;
  stage.classList.toggle('zero-encounter',active);
  let layer=$('zero-fog-scene');if(!active){layer?.remove();return;}
  if(!layer){layer=document.createElement('div');layer.id='zero-fog-scene';layer.setAttribute('aria-hidden','true');stage.append(layer);}
  const restored=quiz.battle.maxHP-quiz.battle.hp;
  layer.innerHTML=`<img src="art/realm/pet-0.png" alt=""><div class="fog-bank" style="opacity:${Math.max(0,1-restored/3)}"></div><div class="marsh-lights">${[0,1,2].map(i=>`<i class="${i<restored?'lit':''}"></i>`).join('')}</div>`;
}
function zeroRewardMarkup(){return '<section class="first-camp-reward"><small>A HOME FOR YOUR ADVENTURE</small><h3>Your first camp improvement</h3><p>Poof has sent a Cozy Pup Tent renovation kit: a timber doorstep, rolled bedding and a warm porch lantern. Upgrade your pup tent for free in Camp 2. Your free meadow is already open.</p><button class="btn gold" onclick="showScreen(\'screen-camp-v2\')">Make my tent cozy →</button></section>';}
