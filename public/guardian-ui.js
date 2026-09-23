/* Accessible chapter controls; the illustrated world responds to learning progress. */
/* Guardian lessons render through the strategy models; the encounter scene responds to learning progress. */
function renderGuardianLesson(){
  const current=state.journey.current,fam=current.family;if(!GuardianChapters.chapters[fam])return;
  if(fam===9){renderNineLesson();return;}
  renderFamilyLesson();
}
/* The four checks use amounts the lesson never displayed. `skip` lets a child who
   already knows the strategy show it directly; the result still records honestly. */
function startGuardianTry(skip=false){
  const c=state.journey.current;if(!c||!GuardianChapters.chapters[c.family])return;
  const fam=c.family,nine=fam===9;
  const ready=nine?NineLesson.ready(c.nine):FamilyLessons.ready(fam,c.strategy);
  if(!ready&&!skip)return;
  const shown=skip?[]:nine?NineLesson.shown(c.nine):FamilyLessons.shown(fam,c.strategy);
  const previous=(state.journey.lastItems?.[fam]||[]);
  const queue=GuardianChapters.questions(fam,{shown,previous});
  (state.journey.lastItems||={})[fam]=queue.map(q=>q.b);
  if(!skip)state.journey.current=null;saveState();
  lastConfig={fn:retryGuardianTry,args:[fam]};
  startQuiz({mode:'lesson',fams:[fam],queue,timed:false,lessonSkip:skip,title:GuardianChapters.chapters[fam].goal});
}
/* A retry after the lesson draws four new amounts, never the set just answered. */
function retryGuardianTry(fam){
  if(!GuardianChapters.chapters[fam])return;
  const previous=state.journey.lastItems?.[fam]||[],queue=GuardianChapters.questions(fam,{previous});
  (state.journey.lastItems||={})[fam]=queue.map(q=>q.b);saveState();
  lastConfig={fn:retryGuardianTry,args:[fam]};
  startQuiz({mode:'lesson',fams:[fam],queue,timed:false,title:GuardianChapters.chapters[fam].goal});
}
function guardianEncounterScenery(){
  const stage=$('battle-stage'),fam=quiz?.fams[0],active=!!quiz?.battle&&quiz.mode==='boss'&&Number.isInteger(fam)&&fam>=0&&fam<=12;
  $('screen-quiz').classList.toggle('guardian-active',active);
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

function updateGuardianEncounterProgress(){
  if(quiz?.mode!=='boss'||!quiz.battle)return;
  const b=quiz.battle,fam=quiz.fams[0],done=Math.max(0,Math.min(b.maxHP,b.maxHP-b.hp)),progress=done/b.maxHP,stages=Math.min(3,Math.floor(progress*3+1e-7));
  $('q-count').textContent=`×${fam} · ${REALMS[fam].petName}`;
  $('battle-health-title').textContent=`${stages} of 3 stages restored`;
  $('battle-hp').style.width=`${progress*100}%`;
  const track=$('battle-hp').parentElement;
  track.setAttribute('role','progressbar');track.setAttribute('aria-label','Realm restoration');
  track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(b.maxHP));track.setAttribute('aria-valuenow',String(done));
  track.setAttribute('aria-valuetext',`${stages} of 3 stages restored. ${done} of ${b.maxHP} discoveries complete.`);
}
