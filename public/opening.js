/* A complete first expedition. Existing routes and camps remain player-owned. */
function showTitle(){
  if(quiz){toast('Finish or leave your round first');return;}
  if(campV2Session){campV2Session.dispose();campV2Session=null;}
  document.body.classList.remove('camp-world-open');stopCampAmbience();
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('active'));
  $('profile-gate').classList.remove('on');$('nav').style.display='none';
  const host=$('screen-title');host.classList.add('active');
  const player=state&&profileById();
  host.innerHTML=`<div class="title-world"><div class="title-shade"></div><div class="title-copy"><span class="title-kicker">THE CLIMB TO MOUNT TWELVE</span><h1>Times<span>Quest</span></h1><p class="title-promise">Learn your facts.<br>Build your world.</p><p class="title-invitation">A world to explore. Friends to discover.<br>A camp that grows with you.</p><div class="title-actions">${player?`<button class="title-play" onclick="continueFromTitle()"><img src="${profileAvatar()}" alt="">Continue as ${escapeHtml(player.name)} <span aria-hidden="true">→</span></button><button class="title-secondary" onclick="openProfileChooser()">Choose another explorer</button>`:'<button class="title-play" onclick="openProfileChooser()">Play <span aria-hidden="true">→</span></button>'}<button class="title-parent" onclick="titleParents()">For grown-ups</button></div><div class="title-values"><span>13 realms</span><span>Your own camp</span><span>No race against time</span></div>${typeof titleStorageNote==='function'?titleStorageNote():''}</div><div class="title-fireflies" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div></div>`;
  host.querySelector('.title-play').focus({preventScroll:true});
}
function continueFromTitle(){showScreen('screen-map');if(state.journey.resume)resumeRound();else if(state.journey.current)resumeLesson();else if(!state.journey.onboardingDone)startWelcome();}
function titleParents(){openQuestCard('<section class="journey-card"><h2>An adventure worth growing into</h2><p>Children explore multiplication, practise familiar facts, help guardians and build a personal camp. Adventure has no countdown. Help is always available.</p><p>Each explorer has a separate save on this device. There are no real-money purchases. Export a family backup from Parents to protect your progress.</p><p>The app works offline after its files download. Visit Willowbrook online once to download its 3D world. Learning progress describes observed answers, not a diagnosis or a guarantee of mastery.</p><button class="btn gold" onclick="closeQuestCard()">Back to the adventure</button></section>');}
function illustratedGuardian(fam){return paintedRealmScene(fam);}
function zeroBaskets(groups,each,{inspect=false,locked=false}={}){
  return `<div class="zero-baskets" aria-label="${groups} baskets with ${each} supplies in each">${groups?Array.from({length:groups},(_,i)=>inspect?`<button class="zero-basket ${state.journey.current?.opened?.includes(i)?'inspected':''}" onclick="inspectZeroBasket(${i})" aria-label="Inspect basket ${i+1}" aria-pressed="${!!state.journey.current?.opened?.includes(i)}" ${locked?'disabled':''}><span class="basket-rim"></span><span class="basket-inside">${state.journey.current?.opened?.includes(i)?'Empty':'?'}</span></button>`:`<div class="zero-basket"><span class="basket-rim"></span><span class="basket-inside">${each?Array.from({length:each},()=>'<i class="supply-stone"></i>').join(''):'Empty'}</span></div>`).join(''):'<div class="absent-baskets"><span>0 baskets</span><small>There are no groups here.</small></div>'}</div>`;
}
function renderZeroLesson(){
  $('screen-journey').style.backgroundImage="url('art/battle/bg-battle-x0-portrait.webp')";
  const c=state.journey.current;if(!c||c.family!==0)return;
  const opened=c.opened||[],step=c.zeroStep||'inspect';
  let task='';
  // Each discovery starts with the child's own prediction; any guess is welcome and compared afterwards.
  const guess=(id,question,options,value)=>`<fieldset class="zero-predict"><legend><small>PREDICT</small>${question}</legend>${options.map(n=>`<button onclick="predictZero('${id}',${n})" aria-pressed="${value===n}">${n}</button>`).join('')}</fieldset>`;
  if(step==='inspect'){const g=c.zeroGuess;
    task=`<h2>What is inside Poof’s baskets?</h2><p>There are <b>3 baskets</b>. Each one feels very light.</p>${Number.isInteger(g)?'':guess('inspect','How many supplies do you think the three baskets hold altogether?',[0,3,9],g)}${zeroBaskets(3,0,{inspect:true,locked:!Number.isInteger(g)})}<p class="zero-equation">3 groups × ${opened.length===3?'0':'?'} in each = <strong>${opened.length===3?'0':'?'}</strong></p><p role="status">${!Number.isInteger(g)?'Make a prediction, then open the baskets.':opened.length===3?`All three baskets are empty. Three groups of nothing make zero. ${g===0?'Your prediction was right!':`You predicted ${g}. Now you know why it is 0.`}`:`You predicted ${g}. ${opened.length} of 3 baskets opened.`}</p><button class="btn gold" onclick="advanceZeroLesson()" ${opened.length<3?'disabled':''}>Now try a different arrangement</button>`;}
  else if(step==='remove'){const g=c.zeroGuess2;
    task=`<h2>Four in each basket—but how many baskets?</h2><p>Each basket holds <b>4 supplies</b>. You will send every basket to the store, one at a time.</p>${Number.isInteger(g)?'':guess('remove','When every basket has gone, how many supplies will be left here?',[0,4,12],g)}${zeroBaskets(c.groups,4)}<p class="zero-equation">${c.groups} groups × 4 in each = <strong>${c.groups===0||c.groups===3?c.groups*4:'?'}</strong></p><button class="btn secondary" onclick="removeZeroBasket()" ${c.groups===0||!Number.isInteger(g)?'disabled':''}>Send one basket to the store</button><p role="status">${!Number.isInteger(g)?'Make a prediction first.':c.groups===0?`No baskets remain. Zero groups of four make zero. ${g===0?'Just as you predicted!':`You predicted ${g}; with no groups, there is nothing to count.`}`:`${c.groups} basket${c.groups===1?'':'s'} left.`}</p><button class="btn gold" onclick="advanceZeroLesson()" ${c.groups>0?'disabled':''}>Compare the two discoveries</button>`;}
  else task=`<h2>Different arrangements. The same total.</h2><div class="zero-comparison"><div>${zeroBaskets(3,0)}<strong>3 × 0 = 0</strong><p>Three empty baskets.</p></div><div>${zeroBaskets(0,4)}<strong>0 × 4 = 0</strong><p>No baskets of four.</p></div></div><p>One factor tells us the number of groups. The other tells us how many are in each. If either is zero, there is nothing to count altogether.</p><button class="btn gold" onclick="startZeroTry()">Try three new problems</button>`;
  SceneTransitions.render($('journey-body'),`<div class="guardian-chapter"><div class="chapter-heading"><small>CHAPTER ONE · ×0</small><h1>Poof’s missing supplies</h1><p>Explore the marsh at your own pace.</p></div>${paintedRealmScene(0,'lesson',step==='compare'?1:step==='remove'?.5:0)}<section class="journey-card zero-task">${task}<button class="btn ghost" onclick="saveState();showScreen('screen-map')">Save and explore</button></section></div>`);
}
function predictZero(id,n){const c=state.journey.current;if(!c||c.family!==0||!Number.isInteger(n))return;if(id==='inspect'&&(c.zeroStep||'inspect')==='inspect')c.zeroGuess=n;else if(id==='remove'&&c.zeroStep==='remove')c.zeroGuess2=n;else return;saveState();renderZeroLesson();$('journey-body').querySelector(id==='inspect'?'[aria-label="Inspect basket 1"]':'[onclick="removeZeroBasket()"]')?.focus({preventScroll:true});}
function inspectZeroBasket(i){const c=state.journey.current;if(!c||c.family!==0||(c.zeroStep||'inspect')!=='inspect'||![0,1,2].includes(i)||!Number.isInteger(c.zeroGuess))return;c.opened=[...new Set([...(c.opened||[]),i])];saveState();renderZeroLesson();$('journey-body').querySelector(`[aria-label="Inspect basket ${i+1}"]`)?.focus({preventScroll:true});}
function advanceZeroLesson(){const c=state.journey.current;if(!c||c.family!==0)return;if((c.zeroStep||'inspect')==='inspect'){if((c.opened||[]).length!==3)return;c.zeroStep='remove';c.groups=3;}else if(c.zeroStep==='remove'){if(c.groups!==0)return;c.zeroStep='compare';state.journey.zeroUnderstood=true;}else return;saveState();renderZeroLesson();$('journey-body').querySelector('h2')?.scrollIntoView({block:'nearest'});}
function removeZeroBasket(){const c=state.journey.current;if(!c||c.zeroStep!=='remove'||c.groups<=0||!Number.isInteger(c.zeroGuess2))return;c.groups--;saveState();renderZeroLesson();$('journey-body').querySelector(c.groups?'[onclick="removeZeroBasket()"]':'[onclick="advanceZeroLesson()"]')?.focus({preventScroll:true});}
function startZeroTry(){
  if(!state.journey.zeroUnderstood){beginLesson(0);return;}
  state.journey.current=null;state.journey.zeroChapter=true;saveState();
  // Each attempt draws new situations; a retry never repeats the set just answered.
  const queue=LearningItems.zero(3,{previous:state.journey.lastItems?.[0]||[]});(state.journey.lastItems||={})[0]=queue.map(q=>q.b);
  lastConfig={fn:startZeroTry,args:[]};startQuiz({mode:'lesson',fams:[0],queue,timed:false,needCorrect:3,title:'Poof’s three discoveries'});
}
function startZeroEncounter(){
  if(!canStartBoss(0)){toast('Try Poof’s three discoveries first');return;}
  const queue=LearningItems.zero(4,{previous:state.journey.lastItems?.[0]||[]});
  lastConfig={fn:startZeroEncounter,args:[]};startQuiz({mode:'boss',fams:[0],queue,timed:false,hearts:0,needCorrect:3,battle:true,battleConfig:{...bossBattleConfig(0),name:'The Vanishing Fog',mechanic:'Three discoveries clear the way',intro:'Poof is beside you. Use what you discovered to clear the marsh.',phases:['Find the bank','Reveal the path','Welcome the light']},title:'Restore Zero Marsh'});
}
function zeroEncounterScenery(){
  // Poof now shares the painted restoration scene. Keep cleanup for a resumed
  // screen from the previous renderer without changing the zero lesson rules.
  $('battle-stage').classList.remove('zero-encounter');
  $('zero-fog-scene')?.remove();
}
function zeroRewardMarkup(){return '<section class="first-camp-reward"><small>A HOME FOR YOUR ADVENTURE</small><h3>Your first camp improvement</h3><p>Poof has sent a Cozy Pup Tent renovation kit: a timber doorstep, rolled bedding and a warm porch lantern. Upgrade your pup tent for free in Willowbrook. Your free meadow is already open.</p><button class="btn gold" onclick="showScreen(\'screen-camp-v2\')">Make my tent cozy →</button></section>';}
