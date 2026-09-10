/* Journey UI adapter. Domain lesson/evidence rules live in learning-journey.js. */
function makeRoundGrantId(){return 'round-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,10);}
let profileEditing=false;
const explorerNames=['Ember','River','Aspen','Sky','Rowan','Wren','Sage','Scout','Fern','Robin','Brook','Cedar','Maple','Sunny','Ash','Juniper','Reed','Clover','Willow'];
function renderExplorerForm(){
  const p=profileById();
  return `<div class="profile-brand"><h1>${profileEditing?'Your explorer':'Choose your explorer'}</h1><p>You can change your name or explorer later.</p></div><div class="profile-card profile-form on"><label for="profile-name">Climber name</label><input class="profile-name" id="profile-name" maxlength="18" autocomplete="off" placeholder="Your name or nickname" aria-label="Climber name" value="${profileEditing?escapeHtml(p.name):''}"><div class="explorer-preview"><img id="explorer-preview-image" src="${PROFILE_AVATARS[profileDraftAvatar]}" alt="Selected explorer"><div><strong id="explorer-preview-name">${explorerNames[profileDraftAvatar]}</strong><p>Your companion on the map and in every encounter.</p></div></div><div class="avatar-pick" aria-label="Explorer choices">${PROFILE_AVATARS.map((src,i)=>`<button ${i>=8&&i!==profileDraftAvatar?'hidden':''} class="${i===profileDraftAvatar?'on':''}" onclick="chooseProfileAvatar(${i},this)" aria-label="Choose ${explorerNames[i]}" aria-pressed="${i===profileDraftAvatar}"><img src="${src}" alt=""></button>`).join('')}</div><button class="more-explorers" onclick="document.querySelectorAll('.avatar-pick button').forEach(b=>b.hidden=false);this.hidden=true">More explorers</button><div class="profile-actions"><button class="btn ghost" onclick="profileEditing=false;renderProfileGate('choose')">Back</button><button class="btn gold" onclick="${profileEditing?'saveExplorerIdentity()':'createProfile()'}">${profileEditing?'Save explorer':'Begin quest'}</button></div></div>`;
}
function editExplorer(){profileEditing=true;profileDraftAvatar=profileById().avatar;renderProfileGate('create');}
async function saveExplorerIdentity(){
  const name=safeProfileName($('profile-name').value);if(!name){toast('Add a climber name first');return;}
  const p=profileById();p.name=name;p.avatar=profileDraftAvatar;await persistProfileBook();profileEditing=false;closeProfileGate();showScreen('screen-map');
}
function challengeReady(fam){return !!state.realms[fam]&&(state.realms[fam].trial||realmStars(fam).caught>=10||!!state.journey.lessons[fam]?.completed||!!state.journey.readiness[fam]);}
function canStartBoss(fam){return !!state.realms[fam]?.trial&&unlockedFamilies().includes(fam);}
function creditLearningRound(qz,extra=0,deferDelivery=false){
  const amount=Math.max(0,(qz.gems||0)+extra);
  if(amount>0&&LearningJourney.grant(state.journey,qz.grantId,amount)){
    // Each answer is saved; a completed or deliberately left round records the visit.
  }
  if(!deferDelivery&&amount>0)state.journey.days=[...new Set([...state.journey.days,dateKey()])].sort().slice(-35);
  if(!deferDelivery&&state.campV2)deliverCampGrants();
}
function checkpointRound(nextIndex=quiz?.idx){if(!quiz)return;state.journey.resume=JSON.parse(JSON.stringify({...quiz,idx:nextIndex,answer:'',locked:false}));}
function resumeRound(){const saved=state.journey.resume;if(!LearningJourney.validResume(saved)){state.journey.resume=null;saveState();showScreen('screen-map');return;}lastConfig={fn:resumeRound,args:[]};startQuiz({resume:saved,mode:saved.mode,fams:saved.fams,queue:saved.queue});}
function deliverCampGrants(){
  if(!state.campV2||!CampV2.validSave(state.campV2))return;
  if(state.journey.pendingGems)state.campV2=CampV2.awardLearning(CampV2.syncProgress(state.campV2,campMasteredCount(),isCampTester()),state.journey.pendingGems);
  if(state.journey.riverKit&&!state.journey.riverKitDelivered){
    const next=JSON.parse(JSON.stringify(state.campV2));
    for(const [type,count] of [['path',6],['deck',2],['lantern',1]])next.inventory[type]=Math.min(10000,(next.inventory[type]||0)+count);
    next.revision++;state.campV2=next;state.journey.riverKitDelivered=true;
  }
  state.journey.pendingGems=0;
  // Compact acknowledged round IDs. Current round remains present for safe reentry.
  const entries=Object.entries(state.journey.grants);entries.forEach(([,g])=>g.claimed=true);
  if(entries.length>120)state.journey.grants=Object.fromEntries(entries.slice(-120));
}
function visitCamp(){showScreen(state.journey.preferredCamp==='v2'?'screen-camp-v2':'screen-camp');}
function finishToday(){
  flushProfileSave();
  $('results-body').innerHTML=`<div class="journey-rest">${avatarStr()}<h2>Your expedition is saved</h2><p>Your creatures and buildings will be here when you return. There is nothing to lose by taking a break.</p><button class="btn gold" onclick="visitCamp()">Visit my camp</button><button class="btn ghost" onclick="showScreen('screen-map')">Back to the adventure</button></div>`;
  showScreen('screen-results');
}
function startWelcome(){state.journey.current=null;showScreen('screen-journey');}
function beginLesson(fam){
  if(!Number.isInteger(fam)||!REALMS[fam])return;
  if(!unlockedFamilies().includes(fam)&&fam!==2){toast('Choose an open realm or try its starting challenge');return;}
  if(fam===2&&!state.journey.routes.includes(2))state.journey.routes.push(2);
  state.journey.onboardingDone=true;state.journey.activeFamily=fam;state.journey.resume=null;
  state.journey.current={family:fam,stage:'see',groups:0};
  lastConfig={fn:beginLesson,args:[fam]};saveState();showScreen('screen-journey');
}
function resumeLesson(){if(state.journey.current)showScreen('screen-journey');else beginLesson(currentFamily());}
function chooseStartingRoute(){state.journey.current={family:2,stage:'choose',groups:0};showScreen('screen-journey');}
function lessonLandscape(fam){
  return `<div class="journey-landscape" aria-hidden="true" style="--realm-color:${REALMS[fam].color}"><div class="journey-hills"></div><div class="journey-stream"></div><div class="journey-bridge"><i></i><i></i><i></i><i></i><i></i></div><img src="art/realm/pet-${fam}.png" alt=""><span class="journey-spark">✦</span></div>`;
}
function renderJourney(){
  const current=state.journey.current,host=$('journey-body');
  if(!current){
    host.innerHTML=`<div class="journey-heading"><small>YOUR EXPEDITION</small><h1>Make this world your own</h1><p>Help the guardians, discover creatures, and build a home for your adventures.</p></div>${lessonLandscape(2)}<section class="journey-card"><h2>A bridge needs your help</h2><p>Twix has found a crossing with a missing half. Discover how equal groups can rebuild it.</p><button class="btn gold" onclick="beginLesson(2)">Show me how</button><button class="btn secondary" onclick="chooseStartingRoute()">I have multiplied before</button><button class="btn ghost" onclick="state.journey.onboardingDone=true;saveState();showScreen('screen-map')">Explore the map first</button></section>`;
    return;
  }
  if(current.stage==='choose'){
    host.innerHTML=`<div class="journey-heading"><small>CHOOSE YOUR START</small><h1>What would you like to try?</h1><p>Six calm questions can open a route. This is a starting suggestion, not a mastery badge.</p></div><div class="journey-route-grid">${REALM_ORDER.map(f=>`<button onclick="startReadiness(${f})">${realmCharacter(f)}<strong>${REALMS[f].name}</strong><span>×${f}</span></button>`).join('')}</div><button class="btn gold" onclick="beginLesson(2)">Learn with Twix instead</button>`;return;
  }
  const l=LearningJourney.lesson(current.family),fam=current.family,r=REALMS[fam],build=current.stage==='build';
  host.innerHTML=`<div class="journey-heading"><small>${build?'2 · BUILD TOGETHER':'1 · DISCOVER'} · NO TIMER</small><h1>${l.title}</h1><p>${r.petName} is your ally. ${l.idea}</p></div>${lessonLandscape(fam)}<section class="journey-card"><h2>${build?`Make ${fam} equal groups`:'Watch the groups work'}</h2><p>${build?`Each group holds 4 supplies. ${fam===0?'Leave no groups on the clearing.':`Use the buttons to build ${fam} groups. Then we will try a few new facts.`}`:l.explanation}</p>${build?lessonBuildMarkup(current.groups):MathVisuals.render(fam,4)}<div id="journey-feedback" role="status"></div>${build?`<button class="btn gold" onclick="checkLessonBuild()">Check my groups</button>`:`<button class="btn gold" onclick="lessonBuildStage()">Let me build it</button>`}<button class="btn ghost" onclick="saveState();showScreen('screen-map')">Save and explore</button></section>`;
}
function lessonBuildMarkup(groups){return `<div class="lesson-groups" aria-label="${groups} groups of 4">${groups?Array.from({length:groups},()=>'<span class="supply-group" aria-hidden="true"><i></i><i></i><i></i><i></i></span>').join(''):'<span class="empty-clearing">No groups here yet</span>'}</div><div class="group-controls"><button aria-label="Remove one group" onclick="adjustLesson(-1)" ${groups===0?'disabled':''}>−</button><output aria-live="polite">${groups} group${groups===1?'':'s'} · ${groups*4} supplies</output><button aria-label="Add one group" onclick="adjustLesson(1)" ${groups===12?'disabled':''}>+</button></div>`;}
function lessonBuildStage(){state.journey.current.stage='build';state.journey.current.groups=0;saveState();renderJourney();$('journey-body').querySelector('.group-controls button:not(:disabled)')?.focus({preventScroll:true});}
function adjustLesson(delta){const c=state.journey.current;if(!c||c.stage!=='build')return;c.groups=Math.max(0,Math.min(12,c.groups+delta));saveState();renderJourney();$('journey-body').querySelector(delta>0?'[aria-label="Add one group"]':'[aria-label="Remove one group"]')?.focus({preventScroll:true});}
function checkLessonBuild(){
  const c=state.journey.current;if(!c||c.stage!=='build')return;
  if(c.groups!==c.family){$('journey-feedback').textContent=`You made ${c.groups} groups. We need ${c.family}. Each group stays equal.`;return;}
  const fam=c.family;state.journey.current=null;saveState();
  const queue=[2,3,6,5].map((b,i)=>({a:fam,b,text:`${fam} × ${b}`,ans:fam*b,prompt:i===3?`${fam} boats each carry ${b} supplies. How many supplies altogether?`:'Try this new fact. Take the time you need.'}));
  lastConfig={fn:beginLesson,args:[fam]};startQuiz({mode:'lesson',fams:[fam],queue,timed:false,title:'Try it yourself'});
}
function startReadiness(fam){
  if(!REALMS[fam])return;
  state.journey.onboardingDone=true;state.journey.current=null;
  const queue=[2,5,3,8,11,6].map((b,i)=>({a:fam,b,text:`${fam} × ${b}`,ans:fam*b,prompt:i===5?`${fam} baskets each hold ${b} apples. How many apples in all?`:'A calm starting check. Help is available.'}));
  lastConfig={fn:startReadiness,args:[fam]};startQuiz({mode:'readiness',fams:[fam],queue,timed:false,needCorrect:5,title:'Choose a starting route'});
}
function finishJourneyRound(qz,passed){
  const fam=qz.fams[0];
  if(qz.mode==='lesson'){
    const old=state.journey.lessons[fam];state.journey.lessons[fam]={completed:true,day:dateKey(),independent:qz.passCorrect,total:qz.baseTotal};
    if(!old?.completed){state.gems+=12;qz.gems+=12;}
    if(fam===2)state.journey.riverKit=true;
    state.journey.activeFamily=fam;state.journey.current=null;
    return {headline:'A new way to think!',sub:`${REALMS[fam].petName} helped you explore ${LearningJourney.lesson(fam).idea.toLowerCase()} Your Realm Challenge is open.`,action:`startTrial(${fam})`,label:'Try the Realm Challenge'};
  }
  if(qz.mode==='readiness'){
    if(passed){state.journey.readiness[fam]=true;if(!state.journey.routes.includes(fam))state.journey.routes.push(fam);state.journey.activeFamily=fam;}
    return {headline:passed?'Your route is open':'Let’s build this together',sub:passed?'You showed a useful starting point. Later visits will check what you remember.':'This check does not take anything away. A guardian can show you a useful strategy.',action:passed?`openRealm(${fam})`:`beginStartingLesson(${fam})`,label:passed?'Visit this realm':'Learn with a guardian'};
  }
  return null;
}
function beginStartingLesson(fam){if(!state.journey.routes.includes(fam))state.journey.routes.push(fam);beginLesson(fam);}
function showQuestionHelp(){
  if(!quiz||quiz.locked)return;
  const q=quiz.queue[quiz.idx];q.assisted=true;quiz.locked=true;cancelAnimationFrame(qTimerRAF);showHint(q);
}
function renderQuestionContext(q){
  const fam=quiz.fams.length===1?quiz.fams[0]:q.a;
  $('question-context').innerHTML=`${realmCharacter(fam)}<div><strong>${escapeHtml(quiz.title)}</strong><p>${escapeHtml(q.prompt||`Take your time. ${REALMS[fam].petName} can help you think.`)}</p></div>`;
  $('question-help').hidden=false;
  $('question-help').textContent=`Show me · ${REALMS[fam].petName}`;
  $('q-text').setAttribute('aria-label',q.text.replace('×','times').replace('÷','divided by').replace('?','what number'));
  $('q-text').focus({preventScroll:true});
  $('streak-flame').classList.remove('show');$('streak-flame').hidden=!quiz.timed;
  renderEncounter(q);
  const companion=state.campMonsterFavorites[0];
  if(companion){const [a,b]=companion.split('*').map(Number),friend=monsterIdentity(a,b);$('question-context').insertAdjacentHTML('beforeend',`<button class="lesson-companion" aria-label="Visit ${escapeHtml(friend.name)} in your Field Guide" onclick="openMonsterCard(${a},${b})">${monsterVisual(a,b)}</button>`);}
}
function encounterQuestions(fam,count){
  const values=[3,4,6,5,7,8,9,2,11,12,10,1];
  return Array.from({length:count},(_,i)=>{
    const b=values[i%values.length],kind=['build','split','missing'][i%3];
    if(kind==='missing'&&fam>0)return {a:fam,b,text:`${fam} × ? = ${fam*b}`,ans:b,encounter:kind,prompt:`Restore ${fam} equal sections using ${fam*b} supplies. How many belong in each section?`};
    return {a:fam,b,text:`${fam} × ${b}`,ans:fam*b,encounter:kind==='missing'?'build':kind,prompt:kind==='split'?'Choose how to split the groups. Then combine their totals.':`Supply ${fam} equal sections with ${b} stones each.`};
  });
}
function renderEncounter(q){
  const host=$('encounter-task');host.innerHTML='';if(!q.encounter)return;
  if(q.encounter==='split'&&q.a>1){
    const left=Math.floor(q.a/2),p=LearningJourney.parts(q.a),choice=p&&p[1]>0?p:[left,q.a-left];
    host.innerHTML=`<div class="encounter-title">Choose your strategy</div><div class="encounter-options"><button onclick="chooseEncounterSplit(${choice[0]},${choice[1]})">${q.a===2?'Double the amount':`${choice[0]} groups + ${choice[1]} groups`}</button><button onclick="chooseEncounterSplit(${q.a-1},1,true)">${q.a===2?'See two equal groups':`${q.a-1} groups + 1 group`}</button></div><div id="encounter-model" aria-live="polite">Both routes work. Which helps you?</div>`;
  }else{
    host.innerHTML=`<div class="encounter-title">${q.encounter==='missing'?'Find the missing supplies':'Restore the crossing'}</div><div class="encounter-sections" aria-label="${q.a} equal sections">${Array.from({length:q.a},()=>`<span>${q.encounter==='missing'?'?':q.b}</span>`).join('')||'<span>No sections · no supplies</span>'}</div><p>${q.encounter==='missing'?`${q.a*q.b} supplies altogether. Every section must have the same amount.`:'Each section needs the shown amount. Enter the total to restore it.'}</p>`;
  }
}
function chooseEncounterSplit(a,b,showGroups=false){
  if(!quiz||quiz.locked)return;const q=quiz.queue[quiz.idx];if(a+b!==q.a)return;
  // A chosen representation provides support, not a displayed final answer.
  q.strategyUsed=true;
  $('encounter-model').innerHTML=showGroups&&q.a===2?`<div class="encounter-sections"><span>${q.b} supplies</span><span>${q.b} supplies</span></div><p>Two matching amounts. How many altogether?</p>`:`<div class="encounter-parts"><span>${a} × ${q.b}</span><b>+</b><span>${b} × ${q.b}</span></div><p>Find each part, then add them together.</p>`;
}
function campGoalMarkup(){
  const choices=['gate','canvas','feeder'],type=choices.includes(state.journey.goal)?state.journey.goal:'gate',item=CampV2.catalog[type],camp=state.campV2;
  const owned=!!camp&&(camp.objects.some(o=>o.type===type)||(camp.inventory[type]||0)>0);
  return `<section class="camp-goal-preview"><h3>${owned?'Ready to build':'My next camp idea'} · ${item.name}</h3><p>${owned?'You own this piece. Find it in your Camp 2 backpack.':`${item.price} gems · ${item.wood||0} wood${item.need?' · '+item.need+' completed Realm Challenges':''}. Learning brings supplies; there is no speed requirement.`}</p><div class="goal-choices">${choices.map(id=>`<button onclick="pinCampGoal('${id}')" aria-pressed="${id===type}">${CampV2.catalog[id].name}</button>`).join('')}</div></section>`;
}
function pinCampGoal(id){if(!['gate','canvas','feeder'].includes(id))return;state.journey.goal=id;saveState();const host=$('result-camp-goal');if(host)host.innerHTML=campGoalMarkup();toast('Your camp idea is saved');}
function guardianLetter(){
  const fam=Object.keys(state.journey.lessons).map(Number).find(f=>state.journey.lessons[f].day<dateKey());
  if(fam===undefined)return '';
  return `<section class="journey-letter"><strong>A note from ${REALMS[fam].petName}</strong><p>“Our ${LearningJourney.lesson(fam).title.toLowerCase()} is part of your story now. Let’s see what you remember, whenever you are ready.”</p><button onclick="closeQuestCard();startShortReview()">Visit familiar facts</button></section>`;
}
function centerExplorer(){document.querySelector('#map-trail .here, #map-trail .summit-node')?.scrollIntoView({block:'center',behavior:state.settings.calm||prefersReducedMotion()?'auto':'smooth'});}
function showRealmList(){
  openQuestCard(`<section class="journey-card"><h2>Choose a destination</h2>${guardianLetter()}<div class="journey-route-grid">${REALM_ORDER.map(f=>`<button onclick="closeQuestCard();${unlockedFamilies().includes(f)?`openRealm(${f})`:`startReadiness(${f})`}"><strong>${REALMS[f].name} · ×${f}</strong><span>${unlockedFamilies().includes(f)?`${realmStars(f).stars} of 3 stars`:'Try a starting check'}</span></button>`).join('')}</div></section>`);
}
function improveMapNavigation(){
  document.querySelectorAll('#map-trail .realm-node').forEach((node,i)=>{
    const fam=REALM_ORDER[i],button=node.querySelector('.realm-bubble');button.setAttribute('role','button');button.tabIndex=0;
    button.setAttribute('aria-label',`${REALMS[fam].name}, times ${fam}, ${realmStars(fam).stars} of 3 stars${unlockedFamilies().includes(fam)?'':', route preview'}`);
    if(!unlockedFamilies().includes(fam))button.onclick=()=>openQuestCard(`<section class="journey-card"><h2>${REALMS[fam].name}</h2><p>Restore earlier realms, or show what you already know in six calm questions.</p><button class="btn gold" onclick="closeQuestCard();startReadiness(${fam})">Try a starting check</button></section>`);
    button.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();button.click();}};
  });
  const summit=document.querySelector('.summit-node .realm-bubble');summit.setAttribute('role','button');summit.tabIndex=allConquered()?0:-1;summit.setAttribute('aria-disabled',String(!allConquered()));summit.setAttribute('aria-label','Mount Twelve summit');summit.onkeydown=e=>{if(allConquered()&&(e.key==='Enter'||e.key===' ')){e.preventDefault();startSummit();}};
  let controls=$('journey-map-controls');if(!controls){controls=document.createElement('div');controls.id='journey-map-controls';$('screen-map').append(controls);}
  const due=dueFactEntries(3),resume=state.journey.current;
  controls.innerHTML=`<button onclick="centerExplorer()" aria-label="Find my explorer">⌖</button><button onclick="showRealmList()" aria-label="Choose a realm">Realms</button>${due.length?`<button onclick="startShortReview()">Revisit ${due.length} facts</button>`:''}${resume?'<button onclick="resumeLesson()">Resume lesson</button>':''}`;
}
function startShortReview(){const due=dueFactEntries(3);if(!due.length){toast('Your review is up to date');return;}lastConfig={fn:startShortReview,args:[]};startQuiz({mode:'review',fams:unlockedFamilies(),queue:due.map(([k])=>{const [a,b]=k.split('*').map(Number);return makeQ(a,b);}),timed:false,title:'A visit with familiar facts'});}
let parentOpenPanels=new Set();
function rememberParentPanels(){parentOpenPanels=new Set([...document.querySelectorAll('#parent-body details[data-parent-panel][open]')].map(e=>e.dataset.parentPanel));}
function organizeParentPanels(){
  const host=$('parent-body'),groups=[['tools','Create-a-Quiz'],['preferences','Preferences'],['backup','Protected family backup'],['advanced','Advanced single-climber backup'],['facts','Fact heatmap']];
  for(const [id,title] of groups){const card=[...host.children].find(e=>e.querySelector('h3')?.textContent.includes(title));if(!card)continue;const details=document.createElement('details');details.className='journey-detail';details.dataset.parentPanel=id;details.open=parentOpenPanels.has(id);const summary=document.createElement('summary');summary.textContent=title;card.before(details);details.append(summary,card);}
  const note=document.createElement('section');note.className='card';note.innerHTML='<h3>What the evidence means</h3><p><b>Companions:</b> permanent game rewards.<br><b>Independent:</b> a first attempt without an answer shown.<br><b>Remembered later:</b> recalled after a recorded gap. Historic saves keep their rewards; new evidence starts when this version is played.</p><button class="btn secondary small" onclick="downloadFullAdventure()">Download the full adventure for offline play</button><p id="offline-download-status" role="status">Optional: about 36 MB of art, plus the app. Your current realm downloads first.</p>';host.append(note);
}
async function downloadFullAdventure(){
  const status=$('offline-download-status');if(!('serviceWorker' in navigator)){if(status)status.textContent='This browser does not support offline downloads.';return;}
  if(status)status.textContent='Downloading the adventure. Keep this window open.';
  try{const ready=await navigator.serviceWorker.ready;ready.active?.postMessage({type:'WARM_OPTIONAL'});}catch(e){if(status)status.textContent='Download could not start. Try again when connected.';}
}
if('serviceWorker' in navigator)navigator.serviceWorker.addEventListener('message',event=>{
  if(event.data?.type==='OFFLINE_PROGRESS'){const status=$('offline-download-status');if(status)status.textContent=event.data.done?(event.data.failed?'Some art could not download. You can retry when connected.':'Adventure art downloaded. Camp 2 downloads when opened. Your browser may clear offline storage if the device is full.'):`Downloading art: ${event.data.count} of ${event.data.total}`;}
});
