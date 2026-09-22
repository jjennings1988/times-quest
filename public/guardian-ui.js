/* Accessible chapter controls; the illustrated world responds to learning progress. */
function guardianGroupModel(fam,groups,each=4){
  const d=GuardianChapters.chapters[fam];
  return `<figure class="math-visual chapter-model" aria-label="${groups} equal group${groups===1?'':'s'} of ${each} ${d.unit}: ${groups*each} altogether"><div class="chapter-groups">${Array.from({length:groups},(_,i)=>`<div class="chapter-group" aria-hidden="true"><span class="chapter-dots">${Array.from({length:each},()=>'<i></i>').join('')}</span><small>${d.group} ${i+1}</small></div>`).join('')||'<p class="empty-clearing">No groups here yet.</p>'}</div><figcaption>${groups} group${groups===1?'':'s'} × ${each} in each = <strong>${groups*each}</strong></figcaption></figure>`;
}
function renderGuardianLesson(){
  const current=state.journey.current,fam=current.family,d=GuardianChapters.chapters[fam];if(!d)return;
  const c=GuardianChapters.lessonState(fam,current.chapter);current.chapter=c;
  const done=c.step===d.targets.length,target=d.targets[c.step];
  $('screen-journey').style.backgroundImage=`url('art/battle/bg-battle-x${fam}-portrait.webp')`;
  let task=done?`<h2>Same strategy. A new amount.</h2><p>${d.discovery}</p><div class="chapter-comparison">${guardianGroupModel(fam,fam,4)}${guardianGroupModel(fam,fam,3)}</div><p>${LearningJourney.explanation(fam,3)}</p><button class="btn gold" onclick="startGuardianTry()">Try four new problems</button>`:
    `<small class="chapter-step">DISCOVER · ${c.step+1} OF ${d.targets.length}</small><h2>Make ${target} equal group${target===1?'':'s'}</h2><p>${d.steps[c.step]}</p><p>Each ${d.group} holds <b>4 ${d.unit}</b>. Aim for <b>${target} equal groups</b>.</p>${guardianGroupModel(fam,c.groups)}<div class="chapter-tools" aria-label="Change the equal groups"><button onclick="changeGuardianGroups('add')" ${c.groups>=12?'disabled':''}>Add one group</button><button onclick="changeGuardianGroups('double')" ${c.groups===0||c.groups>6?'disabled':''}>Double the groups</button><button onclick="changeGuardianGroups('remove')" ${c.groups===0?'disabled':''}>Remove one group</button><button onclick="changeGuardianGroups('half')" ${c.groups===0||c.groups%2?'disabled':''}>Keep half</button></div><p id="guardian-feedback" role="status" tabindex="-1">${c.groups===target?`Ready: ${target} equal groups, with ${target*4} ${d.unit} altogether.`:`You have ${c.groups} group${c.groups===1?'':'s'}. The goal is ${target}.`}</p><button class="btn gold" onclick="advanceGuardianLesson()" ${c.groups!==target?'disabled':''}>${c.step===d.targets.length-1?'Compare a new amount':'See what happens next'}</button>`;
  const scenery=paintedRealmScene(fam,'lesson',done?1:c.step/d.targets.length);
  SceneTransitions.render($('journey-body'),`<div class="guardian-chapter" style="--chapter-color:${d.color}"><div class="chapter-heading"><small>GUARDIAN DISCOVERY · ×${fam}</small><h1>${d.title}</h1><p>${REALMS[fam].petName} needs your ideas. Take all the time you need.</p></div>${scenery}<section class="journey-card zero-task">${task}<button class="btn ghost" onclick="saveState();showScreen('screen-map')">Save and explore</button></section></div>`);
}
function changeGuardianGroups(action){const c=state.journey.current;if(!c||c.stage!=='see'||!GuardianChapters.chapters[c.family])return;c.chapter=GuardianChapters.manipulate(c.family,c.chapter,action);saveState();renderGuardianLesson();const button=$('journey-body').querySelector(`[onclick="changeGuardianGroups('${action}')"]`);(button&&!button.disabled?button:$('guardian-feedback'))?.focus({preventScroll:true});}
function advanceGuardianLesson(){const c=state.journey.current;if(!c||c.stage!=='see'||!GuardianChapters.chapters[c.family])return;c.chapter=GuardianChapters.advance(c.family,c.chapter);saveState();renderGuardianLesson();const title=$('journey-body').querySelector('h2');title?.setAttribute('tabindex','-1');title?.focus({preventScroll:true});title?.scrollIntoView({block:'nearest'});}
function startGuardianTry(){const c=state.journey.current;if(!c||!GuardianChapters.chapters[c.family]||GuardianChapters.lessonState(c.family,c.chapter).step!==GuardianChapters.chapters[c.family].targets.length)return;const fam=c.family;state.journey.current=null;saveState();lastConfig={fn:beginLesson,args:[fam]};startQuiz({mode:'lesson',fams:[fam],queue:GuardianChapters.questions(fam),timed:false,title:GuardianChapters.chapters[fam].goal});}
function guardianEncounterScenery(){
  const stage=$('battle-stage'),fam=quiz?.fams[0],active=!!quiz?.battle&&quiz.mode==='boss'&&Number.isInteger(fam)&&fam>=0&&fam<=12;
  stage.classList.toggle('guardian-restoration',active);
  stage.classList.toggle('squarestone-battle',active);
  stage.classList.toggle('painted-battle',active&&fam!==4);
  let layer=$('guardian-restoration-scene');if(!active){layer?.remove();return;}
  if(!layer){layer=document.createElement('div');layer.id='guardian-restoration-scene';stage.append(layer);}
  const p=(quiz.battle.maxHP-quiz.battle.hp)/quiz.battle.maxHP;
  layer.classList.add('ss-encounter-host');
  const visual=fam===4?SquarestoneScene.view({context:'encounter',progress:p}):RealmScenes.view(fam,{context:'encounter',progress:p});
  const key=`${fam}:${visual.stage}`;
  // Include family in the key so switching realms cannot retain another scene.
  if(layer.dataset.sceneKey!==key){SceneTransitions.render(layer,paintedRealmScene(fam,'encounter',p));layer.dataset.sceneKey=key;}
}
