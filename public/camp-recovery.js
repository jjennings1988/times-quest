/* Camp migration and recovery never clear profiles or silently reset layouts. */
function migrateToWillowbrook(){
  if(state.legacyCampArchive||!CampV2.validSave(state.campV2))return;
  const items=allPieces().filter(p=>p.kind!=='climber').map(p=>({id:p.id,name:p.name,art:p.art,count:pieceOwned(p.id)})).filter(p=>p.count>0);
  const next=JSON.parse(JSON.stringify(state.campV2));
  const equivalents={'shelter-2':'tent','shelter-3':'canvas','shelter-4':'cabin','shelter-5':'lodge','fire-1':'fire','fire-2':'fire','fire-3':'fire','fire-4':'fire','seating-1':'bench','seating-2':'bench','seating-3':'bench','light-1':'lantern','light-2':'lantern','light-3':'lantern','ground-stone-path':'path','ground-wood-deck':'deck','garden-1':'flowerbed','garden-2':'flowerbed','garden-3':'pine','garden-4':'pine','water-2':'well','life-bird-feeder':'feeder'};
  for(const item of items){const type=equivalents[item.id];if(type){const before=next.inventory[type]||0;next.inventory[type]=Math.min(10000,before+item.count);item.transferred={type,count:next.inventory[type]-before};}}
  // Both old wallets received learning rewards: take the larger balance once,
  // never add the two balances together. Existing placements remain untouched.
  const credit=items.length?Math.max(0,Math.floor(state.gems)-next.gems):0;
  next.gems+=credit;next.revision++;
  state.legacyCampArchive={v:1,date:new Date().toISOString(),items,placed:JSON.parse(JSON.stringify(state.placed)),balance:state.gems,background:state.campBackground,credit};
  state.campV2=next;state.journey.preferredCamp='v2';saveState();
}
function recordCampDiagnostic(detail){
  state.campDiagnostics=[...(state.campDiagnostics||[]),{...detail,time:detail.time||new Date().toISOString(),build:APP_VERSION,online:navigator.onLine}].slice(-5);
  saveState();
}
function restartCamp(lowPower=false){
  if(campV2Session){campV2Session.dispose();campV2Session=null;}
  if(lowPower&&window.CampV2&&CampV2.validSave(state.campV2)){state.campV2={...state.campV2,quality:'low'};saveState();}
  enterCampV2();
}
function reloadCampApp(){flushProfileSave();window.location.reload();}
function campRecoveryScreen(code,detail){
  recordCampDiagnostic({code,detail:detail||(code==='invalid-save'?'Camp save failed validation; original data retained.':'Camp command module is unavailable.')});
  $('screen-camp-v2').innerHTML=`<section class="card camp-recovery-screen"><h2>Your camp needs a hand</h2><p>${code==='invalid-save'?'Your saved camp could not be opened. We have kept the original data. Restarting will not erase or replace it.':code==='controller-error'?'The camp controls could not open. Your progress is kept. Try again or reload the app.':'Some camp files are missing. Go online and reload the app to download them.'}</p><button class="btn gold" onclick="restartCamp()">Try opening again</button><button class="btn" onclick="reloadCampApp()">Reload app</button><button class="btn" onclick="showScreen('screen-parent')">Backups and diagnostics</button><button class="btn" onclick="showScreen('screen-map')">Back to adventure</button></section>`;
}
function openCampArchive(){
  const archive=state.legacyCampArchive?{...state.legacyCampArchive,items:[...state.legacyCampArchive.items]}:null;
  if(archive){for(const p of allPieces().filter(p=>p.kind==='trophy'))if(pieceOwned(p.id)>0&&!archive.items.some(i=>i.id===p.id))archive.items.push({id:p.id,name:p.name,art:p.art,count:pieceOwned(p.id)});}
  openQuestCard(`<section class="journey-card"><h2>Your earlier camp collection</h2><p>Willowbrook is now your camp. These keepsakes and the original layout remain in your saved profile and backups. Compatible supplies were added to your Backpack once; existing Willowbrook buildings stayed in place.</p>${archive?`<p>Wallet migration: ${archive.credit} gems added. We kept the larger balance, rather than adding two wallets that both earned learning rewards.</p><div class="legacy-collection">${archive.items.map(p=>`<article>${p.art?`<img loading="lazy" src="${escapeHtml(p.art)}" alt="">`:''}<strong>${escapeHtml(p.name)} × ${p.count}</strong><small>${p.transferred?`${p.transferred.count} supplied in Willowbrook`:'Preserved keepsake'}</small></article>`).join('')}</div>`:'<p>Open Willowbrook once to prepare your collection archive.</p>'}<button class="btn gold" onclick="closeQuestCard();visitCamp()">Visit Willowbrook</button></section>`);
}
function openCampDiagnostics(){openQuestCard(`<section class="journey-card"><h2>Camp diagnostics</h2><p>These records stay on this device and contain no explorer name. Include the code and device/browser when reporting a problem.</p><pre style="white-space:pre-wrap;overflow-wrap:anywhere">${escapeHtml(JSON.stringify(state.campDiagnostics||[],null,2))}</pre><button class="btn gold" onclick="closeQuestCard()">Close</button></section>`);}
