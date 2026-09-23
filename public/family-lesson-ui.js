/* Small SVG teaching objects are countable; realm illustrations stay unchanged. */
function strategyTokens(family,amount){
  const shapes={
    1:'<path d="M10 20C-2 14 3 2 10 3C18 2 23 15 10 20" fill="#efcb76"/><path d="M10 18V6M10 12l5-4" stroke="#568153" fill="none"/>',
    2:'<path d="M2 4h16v15H2z" fill="#dba868" stroke="#704625"/><path d="M6 4v15M14 4v15M3 8h3M14 15h3" stroke="#8e5e36"/>',
    3:'<path d="M10 22V3" stroke="#e2cc88" stroke-width="2"/><path d="M10 12Q-1 12 3 4Q13 3 10 12M10 19Q21 19 18 10Q8 11 10 19" fill="#96c888" stroke="#477b58"/>',
    4:'<path d="M2 7l5-4 10 2 2 12-5 4-12-3Z" fill="#c5cbd0" stroke="#677782"/><path d="M2 7l10 2 5-4M12 9l2 12" fill="none" stroke="#edf1ed"/>',
    5:'<path d="M2 3h16v18H2z" fill="#ce945a" stroke="#593f2c"/><path d="M3 4l14 16M17 4L3 20M1 6h18M1 18h18" stroke="#f6d296" stroke-width="2"/>',
    6:'<rect x="5" y="2" width="10" height="20" rx="4" fill="#f7d16e" stroke="#fff0b8"/><path d="M11 5L7 12h5l-3 7" fill="none" stroke="#a06820" stroke-width="2"/>',
    7:'<rect x="2" y="4" width="16" height="17" rx="4" fill="#b9aad9" stroke="#696180"/><path d="M6 5V2h8v3M3 11h14M10 6v13" fill="none" stroke="#f0d7ae" stroke-width="2"/>',
    8:'<path d="M10 1l8 8-2 10-6 4-7-5L2 9Z" fill="#9ee5ec" stroke="#e7ffff"/><path d="M10 1L7 11l3 12 3-12Z" fill="#d9ffff"/>',
    10:'<rect x="3" y="2" width="14" height="20" rx="3" fill="var(--cell-color,#b4def4)" stroke="#edffff"/><path d="M10 4L6 12h6l-3 8" stroke="#487c9c" fill="none" stroke-width="2"/>',
    11:'<path d="M2 4h16v16H2z" fill="#d7b4d6" stroke="#6e5684"/><path d="M4 6h12v12H4z" fill="#f1d3e7"/><path d="M5 16L15 7" stroke="#c290ba"/>',
    12:'<path d="M3 7h12v13H3zM15 9h4v8h-4" fill="#e5ba83" stroke="#8f684b"/><ellipse cx="9" cy="7" rx="6" ry="3" fill="#8dcdd5" stroke="#daf5ed"/>'
  };
  return amount?Array.from({length:amount},()=>`<svg viewBox="0 0 20 24" aria-hidden="true">${shapes[family]}</svg>`).join(''):'<span class="strategy-empty">Empty</span>';
}
function strategyGroup(f,s,index,{amount=s.each,extra=false,boat=false,bundle=false}={}){
  const d=GuardianChapters.chapters[f],label=bundle?'Column':d.group;
  const inner=`<span class="strategy-tokens" aria-hidden="true">${strategyTokens(f,amount)}</span><small>${label} ${index+1}</small>`;
  if(boat){const moved=s.moved.includes(index);return `<button class="strategy-group strategy-boat ${moved?'extra':''}" data-strategy-focus="boat-${index}" onclick="strategyAction('boat',${index})" aria-label="Move boat ${index+1}, ${amount} crates, to ${moved?'Slap’s':'the other'} dock" ${(s.phase===1&&!s.predicted)||(s.phase===2&&!s.chosen)?'disabled':''}>${inner}</button>`;}
  return `<div ${bundle?`style="--cell-color:${['#ffd888','#a3dfdf','#d4b6eb','#b8d78c','#f0b49c','#a9c7f4'][index%6]}"`: ""} class="strategy-group ${extra?'extra':''}" role="group" aria-label="${label} ${index+1}: ${amount} ${d.unit}">${inner}</div>`;
}
function strategyBoard(f,s){
  const p=FamilyLessons.plans[f],c=FamilyLessons.counts(s);
  if(f===5){return [false,true].map(other=>{const ids=Array.from({length:10},(_,i)=>i).filter(i=>s.moved.includes(i)===other);return `<section class="strategy-dock"><h3>${other?'The other dock':'Slap’s dock'} · ${ids.length} boats</h3><div class="strategy-groups strategy-boats">${ids.length?ids.map(i=>strategyGroup(f,s,i,{boat:true})).join(''):'<p class="strategy-empty-dock">No boats here yet</p>'}</div></section>`;}).join('');}
  if(f===10&&!s.step)return `<div class="strategy-power" aria-label="Ten rows, ${s.each} cells in each">${Array.from({length:10},(_,i)=>`<div class="strategy-power-row"><small>Row ${i+1}</small><span style="--cells:${Math.max(1,s.each)}" aria-hidden="true">${strategyTokens(f,s.each)}</span></div>`).join('')}</div>`;
  if(f===10)return `<p class="strategy-board-note">One cell from each row makes a ten.</p><div class="strategy-groups">${Array.from({length:s.each},(_,i)=>strategyGroup(f,s,i,{amount:10,bundle:true,extra:true})).join('')||'<p class="strategy-empty-dock">Zero cells to bundle. The total is still zero.</p>'}</div>`;
  return (f===1?`<p class="strategy-board-note">${s.step?'Delivered to Echo':'Waiting at the nursery'}</p>`:'')+`<div class="strategy-groups">${Array.from({length:c.groups},(_,i)=>strategyGroup(f,s,i,{extra:i>=p.groups[0]||f===1&&s.step>0})).join('')}</div>`;
}
function strategyAnswerForm(f,s,d){
  return `<form class="strategy-answer" onsubmit="event.preventDefault();strategyAnswer()"><label for="strategy-total">${f===5?'How many crates stay at Slap’s dock?':`How many ${d.unit} altogether?`}</label><div><input id="strategy-total" type="text" inputmode="numeric" maxlength="3" pattern="[0-9]*" autocomplete="off"><button type="submit">Check my idea</button></div></form>`;
}
function renderFamilyLesson(){
  const current=state.journey.current,f=current.family,p=FamilyLessons.plans[f],d=GuardianChapters.chapters[f];
  const s=FamilyLessons.normalize(f,current.strategy,current.chapter);current.strategy=s;
  const done=FamilyLessons.complete(s),c=FamilyLessons.counts(s),revealed=s.phase===0||s.solved;
  const heading=['Discover the strategy','Predict, then test it','Your amount. Your model.'][s.phase];
  const locked=(s.phase===1&&!s.predicted)||(s.phase===2&&!s.chosen),plan=FamilyLessons.planFor[f],alt=FamilyLessons.anotherWay[f];
  // The decision the child must make comes before the model so it stays on small screens.
  let decision='',controls='';
  if(s.phase===1&&!s.planned)decision=`<fieldset class="strategy-choices strategy-first strategy-plan"><legend><small>PLAN</small>${plan.q}</legend>${plan.options.map((text,i)=>`<button data-strategy-focus="plan-${i}" onclick="strategyAction('plan',${i})">${text}</button>`).join('')}</fieldset>`;
  else if(s.phase===1&&!s.predicted)decision=`<fieldset class="strategy-choices strategy-first"><legend><small>PREDICT</small>${p.predict(s.each)}</legend>${FamilyLessons.options(f,s.each).map(n=>`<button data-strategy-focus="predict-${n}" onclick="strategyAction('predict',${n})">${n}</button>`).join('')}</fieldset>`;
  if(s.phase===2)decision=`<label class="strategy-amount strategy-first" for="strategy-each">${s.chosen?'Change the amount in each group':`Choose how many ${d.unit} go in each ${d.group}`} <select id="strategy-each" onchange="strategyAction('each',Number(this.value))">${s.chosen?'':'<option value="" selected disabled>Pick</option>'}${Array.from({length:13},(_,n)=>`<option value="${n}" ${s.chosen&&n===s.each?'selected':''}>${n}</option>`).join('')}</select></label>`;
  if(!locked){
    controls=`<div class="strategy-actions">${f===5?'<p>Tap any boat to change its dock. Keep its whole cargo together.</p>':`<button class="strategy-act" data-strategy-focus="act" onclick="strategyAction('act')" ${done?'disabled':''}>${done?'Groups ready':p.actions[s.step]}</button>`}<button data-strategy-focus="undo" onclick="strategyAction('undo')" ${(f===5?!(s.moved.length||s.history.length):!s.step)?'disabled':''}>Undo last change</button></div>`;
    if(s.phase===0&&done)controls+=`<fieldset class="strategy-choices"><legend>${p.reason}</legend>${p.choices.map((text,i)=>`<button data-strategy-focus="reason-${i}" onclick="strategyAction('reason',${i})">${text}</button>`).join('')}</fieldset><button class="btn gold" onclick="strategyAction('next')" ${s.explained?'':'disabled'}>Try a new amount →</button>`;
    if(s.phase===1&&done)controls+=s.solved?'<button class="btn gold" onclick="strategyAction(\'next\')">Choose my own amount →</button>':strategyAnswerForm(f,s,d);
    if(s.phase===2&&done)controls+=s.solved?`<p class="strategy-discovery">${d.discovery}${f===11?' Try 12 in each bundle: ten groups plus one works even when copying digits would not.':''}</p>${alt?`<fieldset class="strategy-choices strategy-another"><legend><small>OPTIONAL</small>${alt.q}</legend>${alt.options.map((text,i)=>`<button data-strategy-focus="another-${i}" aria-pressed="${s.another===i}" onclick="strategyAction('another',${i})">${text}</button>`).join('')}</fieldset>`:''}<button class="btn gold" onclick="startGuardianTry()">Try four new problems</button>`:strategyAnswerForm(f,s,d);
  }
  const intro=s.phase===0?p.prompt:s.phase===1?(s.predicted?`Now build it and test your prediction.`:s.planned?`Each ${d.group} now holds ${s.each} ${d.unit}. Predict first, then test your idea.`:`Each ${d.group} now holds ${s.each} ${d.unit}. First, plan how the strategy works.`):s.chosen?`Build ${f} ${d.group}${f===1?'':'s'} of ${s.each} with the same strategy. Then find the total.`:'Pick any amount. You will build it, then find the total yourself.';
  $('screen-journey').style.backgroundImage=`url('art/battle/bg-battle-x${f}-portrait.webp')`;
  $('journey-body').innerHTML=`<div class="guardian-chapter strategy-chapter" style="--strategy-color:${d.color}">
    <div class="strategy-nav"><button onclick="saveState();showScreen('screen-map')" aria-label="Save lesson and return to map">← Map</button><span>${s.phase+1} of 3 · No timer</span></div>
    <div class="strategy-scene-band" aria-hidden="true">${paintedRealmScene(f,'lesson',s.phase/2)}</div>
    <div class="strategy-heading"><img src="art/realm/pet-${f}.png" alt="${escapeHtml(REALMS[f].petName)}"><div><small>${d.title} · ×${f}</small><h1>${heading}</h1></div></div>
    <section class="journey-card strategy-card"><h2>${s.phase===0&&!s.explained?escapeHtml(d.goal):p.idea}</h2><p>${intro}</p>${decision}
    ${locked&&s.phase===2?'':`<div class="strategy-workshop strategy-world-${f}"><div class="strategy-equation" aria-live="polite">${FamilyLessons.expression(s)}</div>${strategyBoard(f,s)}<p class="strategy-count">${f===10&&s.step?`${s.each} bundles of ten`:c.groups+' equal group'+(c.groups===1?'':'s')+' of '+s.each}${f===5?' at Slap’s dock':''}${revealed?' · '+c.total+' '+d.unit:'. Find their total.'}</p>${p.groups.length>2?`<p class="strategy-trace">Groups: ${p.groups.slice(0,s.step+1).join(' → ')}</p>`:''}</div>`}
    <p id="strategy-feedback" class="strategy-feedback" role="status" tabindex="-1">${escapeHtml(s.feedback)}</p>${controls}
    ${s.phase===0&&!s.step&&!s.moved.length&&strategySiblingDone(f)?`<button class="btn secondary strategy-quick" onclick="strategyAction('quick')">I used a strategy like this in ${escapeHtml(strategySiblingDone(f))} · jump to planning</button>`:''}
    ${s.phase===0&&!s.step&&!s.moved.length?'<button class="btn ghost strategy-skip" onclick="startGuardianTry(true)">I already know this strategy · show me four problems</button>':''}
    <button class="btn ghost" onclick="saveState();showScreen('screen-map')">Save and explore</button></section></div>`;
}
/* A completed lesson from the same strategy group lets a child skip the discovery they have already made. */
function strategySiblingDone(f){const g=FamilyLessons.groupOf(f);const other=g&&FamilyLessons.GROUPS[g].find(x=>x!==f&&state.journey.lessons[x]?.completed);return other!==undefined&&other!==null&&g?REALMS[other].name:'';}
function strategyAction(action,value){
  const c=state.journey.current;if(c?.stage!=='see'||!FamilyLessons.supports(c.family))return;
  const focus=document.activeElement?.dataset.strategyFocus;
  c.strategy=FamilyLessons.change(c.family,c.strategy,action,value);saveState();renderFamilyLesson();
  if(action==='next'||action==='quick'){const h=$('journey-body').querySelector('h1');h.tabIndex=-1;h.focus({preventScroll:true});$('screen-journey').scrollTop=0;}
  else if(action==='each')$('strategy-each').focus({preventScroll:true});
  else{const target=[...$('journey-body').querySelectorAll('[data-strategy-focus]')].find(el=>el.dataset.strategyFocus===focus&&!el.disabled);(target||$('strategy-feedback')).focus({preventScroll:true});}
}
function strategyAnswer(){
  const input=$('strategy-total'),text=input?.value.trim();
  if(!/^\d{1,3}$/.test(text||'')){if($('strategy-feedback'))$('strategy-feedback').textContent='Enter your idea as a whole number.';input?.focus();return;}
  strategyAction('total',Number(text));$('strategy-total')?.focus({preventScroll:true});
}
