/* Run:  npm i jsdom  &&  node test/headless.js
   Dev-only. The game itself still has zero dependencies. */
/* Times Quest — headless verification harness (jsdom)
   Exercises logic, state migration and the quiz/camp flows. Not layout. */
const fs = require('fs');
const { JSDOM } = require('jsdom');

const HTML = require('path').join(__dirname,'..','public','index.html');
const PUBLIC = require('path').join(__dirname,'..','public');
let pass = 0, fail = 0;
const ok = (name, cond, extra='') => {
  if (cond) { pass++; console.log(`  ok   ${name}`); }
  else { fail++; console.log(`  FAIL ${name}${extra?'  → '+extra:''}`); }
};
const section = t => console.log(`\n=== ${t} ===`);

/* A realistic pre-update save: mid-climb, several realms conquered,
   camp gear bought, hat equipped, real fact history. */
function legacySave() {
  const facts = {};
  const put = (a,b,o) => facts[`${Math.min(a,b)}*${Math.max(a,b)}`] = Object.assign({c:0,w:0,streak:0,rating:0,slow:0,last:null}, o);
  for (let b=0;b<=12;b++) { put(0,b,{c:4,rating:5}); put(1,b,{c:4,rating:5}); put(10,b,{c:3,rating:4}); }
  for (let b=0;b<=12;b++) put(2,b,{c:2,w:1,rating:3,slow:2});
  put(7,8,{c:1,w:3,rating:1,slow:3});
  put(6,7,{c:1,w:2,rating:2});
  return {
    gems: 137, streak: 6, lastPlayed: new Date().toDateString(),
    chest: true, chestFrom: new Date(Date.now()-864e5).toDateString(),
    questDate: new Date().toDateString(), questDone: false,
    settings: { timer: true, sound: true },
    facts,
    realms: Object.fromEntries([0,1,10,2,5,11,3,4,9,6,12,8,7].map(f =>
      [f, {trial:[0,1,10].includes(f), conquered:[0,1,10].includes(f)}])),
    summitDone: false,
    owned: ['cap','tophat','lantern','tent','flag','cat'],
    equipped: { hat:'tophat', buddy:'pet1' },
  };
}

async function boot(saveObj) {
  const dom = new JSDOM(fs.readFileSync(HTML,'utf8'), {
    runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/',
    beforeParse(win){
      win.localStorage.setItem('timesquest-save', JSON.stringify(saveObj));
      win.HTMLElement.prototype.scrollIntoView = () => {};
      win.confirm = () => true;
      win.alert = () => {};
      win.performance.now = () => Date.now();
    }
  });
  const errs = [];
  dom.window.addEventListener('error', e => errs.push(e.message || String(e.error)));
  await new Promise(r => setTimeout(r, 350));
  return { win: dom.window, errs, $: id => dom.window.document.getElementById(id) };
}

(async () => {
  /* ---------------------------------------------------------------- */
  section('Migration — legacy save must survive intact');
  const legacy = legacySave();
  const before = JSON.parse(JSON.stringify(legacy));
  let { win, errs, $ } = await boot(legacy);
  const ev = expr => win.eval(expr);
  let S = () => ev('state');

  ok('no uncaught errors on boot', errs.length === 0, errs.join('; '));
  ok('gems preserved', S().gems === 137, `got ${S().gems}`);
  ok('streak preserved', S().streak === 6);
  ok('equipped hat preserved', S().equipped.hat === 'tophat');
  ok('equipped buddy preserved', S().equipped.buddy === 'pet1');
  ok('owned list preserved', JSON.stringify(S().owned) === JSON.stringify(before.owned));
  ok('conquered realms preserved',
     [0,1,10].every(f => S().realms[f].conquered) && !S().realms[2].conquered);
  ok('every fact record preserved',
     Object.keys(before.facts).every(k =>
       S().facts[k] && S().facts[k].c === before.facts[k].c && S().facts[k].rating === before.facts[k].rating));
  ok('schema version stamped', S().v === 3);
  ok('bought initialised', typeof S().bought === 'object');
  ok('campSeen initialised', S().campSeen === null);

  // placed[] seeded from old camp gear, then migrated to locked v1.1 IDs
  const placedIds = S().placed.map(p => p.t).sort();
  ok('placed seeded from owned camp gear plus the climber',
     JSON.stringify(placedIds) === JSON.stringify(['banner-1','camp-climber','light-1','shelter-2']),
     JSON.stringify(placedIds));
  const at = id => S().placed.find(p => p.t === id);
  ok('flag → banner-1 projected onto the clearing', at('banner-1').x === 9 && at('banner-1').y === 1, JSON.stringify(at('banner-1')));
  ok('lantern → light-1 projected onto the clearing', at('light-1').x === 6 && at('light-1').y === 4, JSON.stringify(at('light-1')));
  ok('tent → shelter-2 projected onto the clearing', at('shelter-2').x === 7 && at('shelter-2').y === 4, JSON.stringify(at('shelter-2')));
  ok('migrated pieces are owned under their stable IDs',
     ['banner-1','light-1','shelter-2'].every(id => S().bought[id] === 1));
  ok('no two seeded pieces share a cell',
     new Set(S().placed.map(p => p.x+','+p.y)).size === S().placed.length);
  ok('every migrated footprint is buildable and collision-free',
     S().placed.every((p,i)=>win.canPlaceAt(p.t,p.x,p.y,i)));

  section('Migration — complete legacy ID map and duplicate preservation');
  const richLegacy=legacySave();
  richLegacy.owned.push('log','kite','canoe','telescope','bigtent');
  richLegacy.bought={rp0:2};
  const rich=await boot(richLegacy);
  const rev=expr=>rich.win.eval(expr);
  ok('all eight old camp IDs map to their stable v1.1 replacements',
     ['banner-1','seating-2','light-1','activity-kite','shelter-2','legacy-canoe','lookout-3','shelter-4']
       .every(id=>rev('state').bought[id]>=1));
  ok('placed lower chain tiers survive as legacy decorations',
     rev("state.placed.some(p=>p.t==='shelter-2'&&p.legacy===true)"));
  ok('older trophy duplicates remain placeable but are not remapped twice',
     rev("state.bought['trophy-x0']") === 2 && !rev("state.bought['rp0']"));

  section('Migration — fresh save and a garbage save');
  const fresh = await boot(undefined);
  const fev = expr => fresh.win.eval(expr);
  ok('fresh boot has no errors', fresh.errs.length === 0, fresh.errs.join('; '));
  ok('fresh state starts with one placeable climber',
     Array.isArray(fev('state').placed) && fev('state').placed.length === 1 && fev('state').placed[0].t === 'camp-climber');
  ok('fresh climber is only auto-introduced once', fev('state').climberIntroduced === true);
  ok('fresh state gems 0', fev('state').gems === 0);

  section('Camp v1.1 catalogue and first-visit setup');
  ok('catalogue has 41 buyable build entries', fev('CAMP_BUILD_PIECES.length') === 41);
  ok('catalogue has 14 unique trophies', fev('Object.keys(REALM_PIECES).length + 1') === 14);
  ok('only stone path and wooden deck are repeatable',
     JSON.stringify(fev('CAMP_STANDALONES.filter(p=>p.repeatable).map(p=>p.id)')) ===
       JSON.stringify(['ground-stone-path','ground-wood-deck']));
  ok('all chain tiers are unique upgrades', fev('CAMP_BUILD_PIECES.filter(p=>p.chain).every(p=>p.unique && !p.repeatable)'));
  const batch1={
    'bg-camp-dusk.png':[1180,640],
    'camp-shelter-t1.png':[384,192], 'camp-shelter-t2.png':[384,384],
    'camp-fire-t1.png':[192,192], 'camp-fire-t2-strip3.png':[576,192],
    'camp-light-t1.png':[192,192], 'camp-seating-t1.png':[192,192],
    'camp-garden-t1.png':[192,192], 'camp-lookout-t1.png':[192,192],
    'camp-ground-stone-path.png':[192,192], 'camp-trophy-x0.png':[192,192],
  };
  const batch2={
    'camp-shelter-t3.png':[384,384], 'camp-shelter-t4.png':[384,384],
    'camp-shelter-t5.png':[576,384],
    'camp-fire-t3-strip3.png':[1152,384], 'camp-fire-t4-strip3.png':[1728,384],
    'camp-light-t2.png':[192,192], 'camp-light-t3-strip3.png':[1152,192],
    'camp-lookout-t2.png':[384,384], 'camp-lookout-t3.png':[576,384],
    'camp-banner-t1-strip3.png':[576,192], 'camp-banner-t2-strip3.png':[576,192],
    'camp-banner-t3-strip3.png':[1152,192],
  };
  const batch3={
    'camp-seating-t2.png':[384,192], 'camp-seating-t3.png':[384,384],
    'camp-kitchen-t1.png':[192,192], 'camp-kitchen-t2.png':[384,192],
    'camp-kitchen-t3.png':[384,384],
    'camp-water-t1.png':[192,192], 'camp-water-t2.png':[384,384],
    'camp-water-t3-strip3.png':[1152,384],
    'camp-garden-t2.png':[192,192], 'camp-garden-t3.png':[384,384],
    'camp-garden-t4.png':[384,384],
  };
  const batch4={
    'camp-storage-t1.png':[192,192], 'camp-storage-t2.png':[384,192],
    'camp-storage-t3.png':[384,384],
    'camp-ground-wood-deck.png':[192,192],
    'camp-life-bird-feeder.png':[192,192], 'camp-life-beehive.png':[192,192],
    'camp-activity-kite-strip3.png':[1152,192],
    'camp-activity-rope-swing.png':[384,384], 'camp-activity-zipline.png':[384,192],
  };
  const batch5={
    'camp-trophy-x1.png':[192,192], 'camp-trophy-x10.png':[192,192],
    'camp-trophy-x2.png':[384,192], 'camp-trophy-x5.png':[192,192],
    'camp-trophy-x11.png':[384,192], 'camp-trophy-x3.png':[192,192],
    'camp-trophy-x4.png':[192,192], 'camp-trophy-x9.png':[384,192],
    'camp-trophy-x6.png':[192,192], 'camp-trophy-x12.png':[384,384],
    'camp-trophy-x8.png':[192,192], 'camp-trophy-x7.png':[384,384],
    'camp-trophy-summit.png':[192,192],
  };
  const realmCharacters=Object.fromEntries(Array.from({length:13},(_,f)=>[`pet-${f}.png`,[512,512]]));
  const bossCharacters=Object.fromEntries(Array.from({length:13},(_,f)=>[`boss-${f}.png`,[512,512]]));
  const avatarGear={
    'hat/cap.png':[256,256], 'hat/tophat.png':[256,256], 'hat/helmet.png':[256,256],
    'hat/cowboy.png':[256,256], 'hat/grad.png':[256,256], 'hat/crown.png':[256,256],
    'buddy/cat.png':[256,256], 'buddy/dog.png':[256,256], 'buddy/unicorn.png':[256,256],
  };
  const pngInfo=name=>{
    const buf=fs.readFileSync(require('path').join(PUBLIC,'art','camp',name));
    return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20),colorType:buf[25]};
  };
  ok('all Batch 1 art files exist at exact locked dimensions',
     Object.entries(batch1).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','camp',name);
       if(!fs.existsSync(p)) return false;
       const info=pngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all ten Batch 1 sprites are RGBA PNGs',
     Object.keys(batch1).filter(n=>n!=='bg-camp-dusk.png').every(n=>pngInfo(n).colorType===6));
  ok('all Batch 2 hero art files exist at exact locked dimensions',
     Object.entries(batch2).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','camp',name);
       if(!fs.existsSync(p)) return false;
       const info=pngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all twelve Batch 2 hero sprites are RGBA PNGs',
     Object.keys(batch2).every(n=>pngInfo(n).colorType===6));
  ok('all Batch 3 breadth art files exist at exact locked dimensions',
     Object.entries(batch3).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','camp',name);
       if(!fs.existsSync(p)) return false;
       const info=pngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all eleven Batch 3 breadth sprites are RGBA PNGs',
     Object.keys(batch3).every(n=>pngInfo(n).colorType===6));
  ok('all Batch 4 long-tail art files exist at exact locked dimensions',
     Object.entries(batch4).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','camp',name);
       if(!fs.existsSync(p)) return false;
       const info=pngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all nine Batch 4 long-tail sprites are RGBA PNGs',
     Object.keys(batch4).every(n=>pngInfo(n).colorType===6));
  ok('all Batch 5 trophy art files exist at exact locked dimensions',
     Object.entries(batch5).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','camp',name);
       if(!fs.existsSync(p)) return false;
       const info=pngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all thirteen Batch 5 trophy sprites are RGBA PNGs',
     Object.keys(batch5).every(n=>pngInfo(n).colorType===6));
  const realmPngInfo=name=>{
    const buf=fs.readFileSync(require('path').join(PUBLIC,'art','realm',name));
    return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20),colorType:buf[25]};
  };
  ok('all thirteen realm character files exist at the locked 512px square size',
     Object.entries(realmCharacters).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','realm',name);
       if(!fs.existsSync(p)) return false;
       const info=realmPngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all thirteen realm characters are transparent RGBA PNGs',
     Object.keys(realmCharacters).every(n=>realmPngInfo(n).colorType===6));
  const bossPngInfo=name=>{
    const buf=fs.readFileSync(require('path').join(PUBLIC,'art','boss',name));
    return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20),colorType:buf[25]};
  };
  ok('all thirteen boss portraits exist at the locked 512px square size',
     Object.entries(bossCharacters).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','boss',name);
       if(!fs.existsSync(p)) return false;
       const info=bossPngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all thirteen boss portraits are transparent RGBA PNGs',
     Object.keys(bossCharacters).every(n=>bossPngInfo(n).colorType===6));
  const climberInfo=(()=>{
    const buf=fs.readFileSync(require('path').join(PUBLIC,'art','climber.png'));
    return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20),colorType:buf[25]};
  })();
  ok('climber is a transparent three-frame 768×256 sprite strip',
     climberInfo.w===768 && climberInfo.h===256 && climberInfo.colorType===6);
  const avatarPngInfo=name=>{
    const buf=fs.readFileSync(require('path').join(PUBLIC,'art',name));
    return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20),colorType:buf[25]};
  };
  ok('all six hats and three shop buddies exist at 256×256',
     Object.entries(avatarGear).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art',name);
       if(!fs.existsSync(p)) return false;
       const info=avatarPngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all hats and shop buddies are transparent RGBA PNGs',
     Object.keys(avatarGear).every(n=>avatarPngInfo(n).colorType===6));
  const swSource=fs.readFileSync(require('path').join(PUBLIC,'sw.js'),'utf8');
  ok('offline shell pre-caches every Batch 1 asset', Object.keys(batch1).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every Batch 2 asset', Object.keys(batch2).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every Batch 3 asset', Object.keys(batch3).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every Batch 4 asset', Object.keys(batch4).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every Batch 5 asset', Object.keys(batch5).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every realm character', Object.keys(realmCharacters).every(n=>swSource.includes(`./art/realm/${n}`)));
  ok('offline shell pre-caches every boss portrait', Object.keys(bossCharacters).every(n=>swSource.includes(`./art/boss/${n}`)));
  ok('offline shell pre-caches the climber sprite', swSource.includes('./art/climber.png'));
  ok('offline shell pre-caches all avatar gear', Object.keys(avatarGear).every(n=>swSource.includes(`./art/${n}`)));
  ok('runtime cache never stores missing future-batch art', swSource.includes('if (res.ok)'));
  ok('offline shell pre-caches the scrolling adventure map', swSource.includes('./art/map/bg-adventure-map.png'));
  fresh.win.showScreen('screen-camp');
  ok('camp opens as a scene-first experience with collapsed menus',
     !!fresh.$('camp-experience') && !fresh.win.document.querySelector('.camp-sheet'));
  ok('camp dock exposes build, treasure, and climber tools',
     fresh.win.document.querySelectorAll('.camp-dock button').length === 3);
  fresh.win.setCampPanel('build');
  ok('build catalog opens as a collapsible sheet',
     fresh.win.document.querySelector('.camp-sheet') && fresh.$('camp-body').textContent.includes('Build your camp'));
  ok('first camp visit grants the free starter pair',
     fev("state.bought['shelter-1']") === 1 && fev("state.bought['fire-1']") === 1);
  ok('starter placement tutorial begins with the Bedroll',
     fev('heldPiece') === 'shelter-1' && JSON.stringify(fev('state.campTutorial')) === JSON.stringify(['shelter-1','fire-1']));
  ok('one-conquest items preview early', fresh.$('camp-body').textContent.includes('Cook Pot'));
  ok('two-conquest items remain hidden', !fresh.$('camp-body').textContent.includes('Pack Pile'));
  fresh.win.setCampPanel('build');
  fresh.win.document.querySelector('.camp-cell[data-x="0"][data-y="0"]')
    .dispatchEvent(new fresh.win.MouseEvent('click',{bubbles:true}));
  ok('placing Bedroll advances tutorial to Fire Ring', fev('heldPiece') === 'fire-1');
  fresh.win.document.querySelector('.camp-cell[data-x="3"][data-y="0"]')
    .dispatchEvent(new fresh.win.MouseEvent('click',{bubbles:true}));
  ok('placing Fire Ring completes the short tutorial', fev('state.campTutorial.length') === 0 && fev('heldPiece') === null);

  /* ---------------------------------------------------------------- */
  section('Every screen renders without throwing');
  for (const id of ['screen-map','screen-hall','screen-monsters','screen-camp','screen-parent']) {
    let threw = null;
    try { win.showScreen(id); } catch(e){ threw = e.message; }
    ok(`showScreen(${id})`, !threw, threw);
  }
  win.showScreen('screen-map');
  ok('continue button has a label', ($('continue-btn').textContent||'').length > 5, $('continue-btn').textContent);
  ok('continue points at the current realm (×2 practice or learn)',
     /×2|Double River/.test($('continue-btn').textContent), $('continue-btn').textContent);
  ok('adventure renders one map destination per realm plus the summit',
     win.document.querySelectorAll('#map-trail .realm-node').length === 13 && !!win.document.querySelector('#map-trail .summit-node'));
  ok('adventure route has one curved segment between every destination',
     win.document.querySelectorAll('#map-trail .map-route-segment').length === 13);
  ok('current map destination carries the climber marker',
     !!win.document.querySelector('#map-trail .realm-node.here .map-you'));
  win.toggleMapNotices(true);
  ok('quest notes open as a collapsible map overlay',
     $('map-notice-sheet').classList.contains('on') && $('map-quest-toggle').getAttribute('aria-expanded') === 'true');
  win.toggleMapNotices(false);

  section('Realm screen');
  win.openRealm(2);
  ok('realm opens', $('realm-title-top').textContent === 'Double River');
  ok('boss card locked before trial', $('realm-body').innerHTML.includes('Pass the Trial first'));

  /* ---------------------------------------------------------------- */
  section('Quiz — fast correct answer');
  win.startPractice(2);
  const answer = (val, instant=true) => {
    if (instant) ev('qStart = performance.now()');   // inside the bonus window
    else ev('qStart = performance.now() - 6000');    // outside it
    String(val).split('').forEach(d => win.pressKey(d));
    win.pressKey('enter');
  };
  let q = ev('quiz').queue[ev('quiz').idx];
  const k = `${Math.min(q.a,q.b)}*${Math.max(q.a,q.b)}`;
  const ratingBefore = ev('state').facts[k] ? ev('state').facts[k].rating : 0;
  const gemsBefore = ev('state').gems;
  answer(q.ans, true);
  ok('fast correct raises rating', ev('state').facts[k].rating > ratingBefore || ratingBefore === 5,
     `${ratingBefore} → ${ev('state').facts[k].rating}`);
  ok('fast correct records a best time', typeof ev('state').facts[k].bt === 'number', String(ev('state').facts[k].bt));
  ok('gems awarded', ev('state').gems > gemsBefore);
  ok('counted as first-try correct', ev('quiz').correct === 1);
  await new Promise(r => setTimeout(r, 700));

  section('Quiz — slow correct is capped at rating 3');
  let q2 = ev('quiz').queue[ev('quiz').idx];
  const k2 = `${Math.min(q2.a,q2.b)}*${Math.max(q2.a,q2.b)}`;
  ev('state').facts[k2] = {c:0,w:0,streak:0,rating:3,slow:0,last:null,bt:null};
  answer(q2.ans, false);
  ok('slow correct does not exceed rating 3', ev('state').facts[k2].rating === 3, `got ${ev('state').facts[k2].rating}`);
  ok('slow counter incremented', ev('state').facts[k2].slow === 1);
  await new Promise(r => setTimeout(r, 700));

  /* ---------------------------------------------------------------- */
  section('Quiz — the retry flow (the R1 headline fix)');
  const q3 = ev('quiz').queue[ev('quiz').idx];
  const k3 = `${Math.min(q3.a,q3.b)}*${Math.max(q3.a,q3.b)}`;
  const idxAtMiss = ev('quiz').idx;
  const totalAtMiss = ev('quiz').total;
  const r3before = ev('state').facts[k3] ? ev('state').facts[k3].rating : 0;
  answer(q3.ans + 1, true);                              // deliberate miss
  await new Promise(r => setTimeout(r, 600));
  ok('hint card shown', $('hint-card').style.display === 'block');
  ok('button offers a retry', $('hint-btn').textContent.includes('try again'), $('hint-btn').textContent);
  ok('title is the coaching one, not the answer', $('hint-title').textContent.includes('tricky'));
  ok('round did NOT get longer (requeue removed)', ev('quiz').total === totalAtMiss,
     `${totalAtMiss} → ${ev('quiz').total}`);
  ok('first miss costs a rating point', ev('state').facts[k3].rating < r3before || r3before <= 1);
  ok('first miss counted as wrong once', ev('quiz').wrong === 1);

  win.dismissHint();
  ok('same question is re-presented', ev('quiz').idx === idxAtMiss, `idx ${idxAtMiss} → ${ev('quiz').idx}`);
  ok('question text unchanged', $('q-text').textContent === q3.text);
  ok('retry flag set', ev('quiz').retry === true);
  ok('timer hidden on the retry', $('timer-track').style.visibility === 'hidden');
  ok('answer box cleared', ev('quiz').answer === '');

  const ratingAtRetry = ev('state').facts[k3].rating;
  answer(q3.ans, true);                                   // correct on second go
  ok('retry-correct counted as recovered', ev('quiz').recovered === 1);
  ok('retry-correct does NOT raise mastery', ev('state').facts[k3].rating === ratingAtRetry,
     `${ratingAtRetry} → ${ev('state').facts[k3].rating}`);
  ok('retry-correct does NOT count toward the pass threshold', ev('quiz').correct === 2);
  await new Promise(r => setTimeout(r, 700));

  section('Quiz — missing twice reveals and advances');
  const q4 = ev('quiz').queue[ev('quiz').idx];
  const idx4 = ev('quiz').idx;
  const wrongBefore = ev('quiz').wrong;
  answer(q4.ans + 1, true);
  await new Promise(r => setTimeout(r, 600));
  win.dismissHint();                                      // into retry
  answer(q4.ans + 2, true);                               // miss again
  await new Promise(r => setTimeout(r, 600));
  ok('second miss reveals the answer', $('hint-title').textContent.includes(String(q4.ans)), $('hint-title').textContent);
  ok('button now advances', $('hint-btn').textContent.includes('Next'), $('hint-btn').textContent);
  ok('second miss does not double-count as wrong', ev('quiz').wrong === wrongBefore + 1,
     `${wrongBefore} → ${ev('quiz').wrong}`);
  win.dismissHint();
  ok('advances past the question', ev('quiz').idx === idx4 + 1);

  section('Boss — hearts are the only gate');
  ev('state').realms[2].trial = true;
  win.startBoss(2);
  ok('boss has 3 hearts', ev('quiz').hearts === 3);
  ok('boss battle markup keeps its emoji fallback', $('boss-em').innerHTML.includes('🌊'));
  ok('boss battle markup points at the stable semantic PNG', $('boss-em').innerHTML.includes('art/boss/boss-2.png'));
  ok('needCorrect matches the hearts rule', ev('quiz').needCorrect === ev('quiz').queue.length - 3,
     `need ${ev('quiz').needCorrect} of ${ev('quiz').queue.length}`);
  for (let i = 0; i < 3; i++) {
    const bq = ev('quiz').queue[ev('quiz').idx];
    if (!ev('quiz')) break;
    answer(bq.ans + 1, true);
    await new Promise(r => setTimeout(r, 550));
    if (ev('quiz') && $('hint-card').style.display === 'block') { win.dismissHint(); win.dismissHint(); }
    await new Promise(r => setTimeout(r, 400));
  }
  await new Promise(r => setTimeout(r, 900));
  ok('three misses ends the fight', ev('quiz') === null, 'quiz still running');
  ok('boss result keeps the illustrated portrait', $('results-body').innerHTML.includes('art/boss/boss-2.png'));
  ok('failure headline shown', $('results-body').innerHTML.includes('blocked you'));

  /* ---------------------------------------------------------------- */
  section('Camp — tap-tap placement');
  win.showScreen('screen-camp');
  const placedCount = () => ev('state').placed.length;
  const n0 = placedCount();
  ok('90 buildable clearing locations rendered', win.document.querySelectorAll('.camp-cell').length === 90,
     String(win.document.querySelectorAll('.camp-cell').length));
  ok('placement plane starts below the sky',
     [...win.document.querySelectorAll('.camp-cell')].every(c=>parseFloat(c.style.top)>=40));
  ok('rows widen toward the camera',
     parseFloat(win.document.querySelector('.camp-cell[data-x="5"][data-y="7"]').style.width) >
     parseFloat(win.document.querySelector('.camp-cell[data-x="5"][data-y="0"]').style.width));
  ok('rocky foreground corners are not placement targets',
     !win.document.querySelector('.camp-cell[data-x="0"][data-y="7"]') && !ev('campCellBuildable(0,7)'));
  ok('climber is a movable camp piece, not scene decoration',
     ev("state.placed.some(p=>p.t==='camp-climber')") && ev("pieceVisual('camp-climber')").includes('art/climber.png'));
  ok('existing pieces rendered', win.document.querySelectorAll('.citem.placed').length === n0);
  win.toggleCampImmersive(true);
  ok('full-screen camp mode is available and hides app chrome',
     $('camp-experience').classList.contains('immersive') && win.document.body.classList.contains('camp-immersive-open'));
  ok('full-screen camp includes recenter and exit controls',
     !!win.document.querySelector('.camp-recenter') && !!win.document.querySelector('[aria-label="Close full-screen camp"]'));
  win.toggleCampImmersive(false);
  ok('full-screen camp returns to the embedded view',
     !$('camp-experience').classList.contains('immersive') && !win.document.body.classList.contains('camp-immersive-open'));

  win.holdPiece('trophy-x0');                             // ×0 conquered → owned
  ok('piece picked up', ev('heldPiece') === 'trophy-x0');
  ok('scene enters placing mode', win.document.getElementById('camp-scene').className.includes('placing'));
  ok('held bar visible', win.document.querySelector('.held-bar').className.includes('on'));

  const emptyCell = [...win.document.querySelectorAll('.camp-cell')]
    .find(c => !ev('state').placed.some(p => p.x === +c.dataset.x && p.y === +c.dataset.y));
  emptyCell.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('piece placed', placedCount() === n0 + 1, `${n0} → ${placedCount()}`);
  ok('hand is empty again', ev('heldPiece') === null);
  ok('landed on the tapped cell',
     ev('state').placed.some(p => p.t === 'trophy-x0' && p.x === +emptyCell.dataset.x && p.y === +emptyCell.dataset.y));

  const someItem = win.document.querySelector('.citem.placed');
  const tId = ev('state').placed[+someItem.dataset.idx].t;
  someItem.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('tapping a placed piece picks it up', ev('heldPiece') === tId, `held ${ev('heldPiece')}`);
  ok('it left the grid', placedCount() === n0, `${placedCount()}`);
  win.putAway();
  ok('put away clears the hand', ev('heldPiece') === null);
  ok('put-away piece is back in the tray as free', win.pieceFree(tId) >= 1);
  win.pickUpCampPiece('camp-climber');
  const climberCell=[...win.document.querySelectorAll('.camp-cell')]
    .find(c=>win.canPlaceAt('camp-climber',+c.dataset.x,+c.dataset.y));
  climberCell.dispatchEvent(new win.MouseEvent('click',{bubbles:true}));
  ok('climber can be picked up and placed on another clearing cell',
     ev('heldPiece') === null && ev("state.placed.some(p=>p.t==='camp-climber'&&p.x==="+climberCell.dataset.x+"&&p.y==="+climberCell.dataset.y+")"));

  section('Camp — ownership and duplicates');
  ok('conquered realm grants its piece', win.pieceOwned('trophy-x0') >= 1);
  ok('unconquered realm grants nothing', win.pieceOwned('trophy-x7') === 0);
  ok('summit trophy locked', win.pieceOwned('trophy-summit') === 0);
  ev('heldPiece = null');
  const gemsPre = ev('state').gems;
  ev('state').gems = 5;
  win.holdPiece('trophy-x7');                              // locked
  ok('locked piece cannot be held', ev('heldPiece') === null);
  ev('state').gems = 5;
  while (win.pieceFree('trophy-x0') > 0) {                 // place all free copies
    const c = [...win.document.querySelectorAll('.camp-cell')]
      .find(c => !ev('state').placed.some(p => p.x === +c.dataset.x && p.y === +c.dataset.y));
    win.holdPiece('trophy-x0'); c.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  }
  win.holdPiece('trophy-x0');
  ok('trophy duplicate is refused', ev('heldPiece') === null && !ev("state.bought['trophy-x0']"));
  ev('state').gems = 500;
  win.holdPiece('trophy-x0');
  ok('trophy still cannot be bought with ample gems', !ev("state.bought['trophy-x0']") && ev('heldPiece') === null);
  ok('refused trophy purchase charges nothing', ev('state').gems === 500, `got ${ev('state').gems}`);
  win.putAway();
  ev('state').gems = gemsPre;

  section('Camp — progression, footprints, and art fallback');
  const campBefore = JSON.stringify(ev('state'));
  ev("state.placed=[]; state.bought={}; state.campDiscovered={}; state.gems=500; state.campStarted=false; state.campTutorial=[]; heldPiece=null; pendingUpgrade=null; ensureCampStarted()");
  win.renderCamp();

  ok('starter grant costs no gems', ev('state').gems === 500);
  ok('first shelter tier is granted', ev("state.bought['shelter-1']") === 1);
  ok('bedroll is immediately held', ev('heldPiece') === 'shelter-1');
  ok('bedroll footprint is 2×1',
     ev("pieceSize('shelter-1').w") === 2 && ev("pieceSize('shelter-1').h") === 1);

  win.document.querySelector('.camp-cell[data-x="0"][data-y="0"]')
    .dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  win.document.querySelector('.camp-cell[data-x="3"][data-y="0"]')
    .dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('starter pieces place from their top-left cells',
     ev("state.placed.some(p=>p.t==='shelter-1'&&p.x===0&&p.y===0) && state.placed.some(p=>p.t==='fire-1'&&p.x===3&&p.y===0)"));
  const bedrollEl = [...win.document.querySelectorAll('.citem.placed')]
    .find(el => ev('state').placed[+el.dataset.idx].t === 'shelter-1');
  const farBedrollWidth=parseFloat(bedrollEl.style.width);
  const nearBedrollWidth=parseFloat(ev("campItemPresentation({t:'shelter-1',x:2,y:6}).style").match(/width:([\d.]+)/)[1]);
  ok('same piece scales wider near the camera', nearBedrollWidth > farBedrollWidth, `${farBedrollWidth}% → ${nearBedrollWidth}%`);

  ev("state.bought['ground-stone-path']=1; state.placed.push({t:'ground-stone-path',x:0,y:1,k:false,legacy:false})");
  const blockedGems = ev('state').gems;
  win.buyCampUpgrade('shelter');
  ok('blocked expansion enters relocate-to-upgrade mode',
     ev("pendingUpgrade && pendingUpgrade.nextId==='shelter-2'") && ev('heldPiece') === 'shelter-2');
  ok('relocate mode does not charge or consume before placement',
     ev("state.bought['shelter-1']") === 1 && !ev("state.bought['shelter-2']") && ev('state').gems === blockedGems);
  win.document.querySelector('.camp-cell[data-x="4"][data-y="0"]')
    .dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('valid relocation consumes the old tier and grants the new one',
     !ev("state.bought['shelter-1']") && ev("state.bought['shelter-2']") === 1);
  ok('relocated upgrade is charged only after placement', ev('state').gems === blockedGems - 60);
  ok('upgrade moves to the selected clear footprint',
     ev("state.placed.some(p => p.t === 'shelter-2' && p.x === 4 && p.y === 0)"));
  ok('upgraded tent occupies 2×2',
     ev("pieceSize('shelter-2').w") === 2 && ev("pieceSize('shelter-2').h") === 2);
  ok('relocation mode clears after completion', ev('pendingUpgrade') === null && ev('heldPiece') === null);

  win.buyCampUpgrade('fire');
  ok('same-footprint upgrade transforms in place',
     ev("state.placed.some(p=>p.t==='fire-2'&&p.x===3&&p.y===0)") && ev('state').gems === blockedGems - 100);

  win.holdPiece('ground-stone-path');
  const countBeforeCollision = ev('state').placed.length;
  win.document.querySelector('.camp-cell[data-x="4"][data-y="1"]')
    .dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('overlapping placement is rejected',
     ev('heldPiece') === 'ground-stone-path' && ev('state').placed.length === countBeforeCollision);
  win.document.querySelector('.camp-cell[data-x="2"][data-y="1"]')
    .dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('repeatable path can be bought and placed again',
     ev("state.bought['ground-stone-path']") === 2 && ev("state.placed.some(p => p.t === 'ground-stone-path' && p.x === 2 && p.y === 1)"));

  win.holdPiece('life-bird-feeder');
  win.document.querySelector('.camp-cell[data-x="7"][data-y="0"]')
    .dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  const uniqueGems = ev('state').gems;
  win.holdPiece('life-bird-feeder');
  ok('standalone unique item cannot be bought twice',
     ev("state.bought['life-bird-feeder']") === 1 && ev('state').gems === uniqueGems && ev('heldPiece') === null);

  const tentEl = [...win.document.querySelectorAll('.citem.placed')]
    .find(el => ev('state').placed[+el.dataset.idx].t === 'shelter-2');
  tentEl.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  win.document.querySelector('.camp-cell[data-x="10"][data-y="5"]')
    .dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('footprints crossing a blocked clearing edge are rejected', ev('heldPiece') === 'shelter-2');
  win.document.querySelector('.camp-cell[data-x="4"][data-y="0"]')
    .dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  const tentVisual = win.pieceVisual('shelter-2');
  ok('piece markup keeps an emoji fallback', tentVisual.includes('⛺'));
  ok('piece markup points at the stable semantic PNG', tentVisual.includes('art/camp/camp-shelter-t2.png'));
  const poofVisual = ev('realmCharacter(0)');
  ok('realm character markup keeps an emoji fallback', poofVisual.includes('👻'));
  ok('realm character markup points at the stable semantic PNG', poofVisual.includes('art/realm/pet-0.png'));
  ev("state.equipped.buddy='pet1'");
  ok('equipped realm buddy uses its PNG-backed character markup', ev('avatarStr()').includes('art/realm/pet-1.png'));
  ok('map and camp avatar markup use the illustrated climber', ev('avatarStr()').includes('art/climber.png'));
  ev("state.equipped.hat='cap'; state.equipped.buddy='cat'");
  ok('equipped hat and shop buddy use PNG-backed avatar layers',
     ev('avatarStr()').includes('art/hat/cap.png') && ev('avatarStr()').includes('art/buddy/cat.png'));
  ok('shop art keeps emoji fallback beneath each new PNG',
     ev("shopArt(SHOP.find(i=>i.id==='helmet'))").includes('🪖') && ev("shopArt(SHOP.find(i=>i.id==='helmet'))").includes('art/hat/helmet.png'));

  ev("state.placed=[{t:'shelter-2',x:0,y:0,k:false},{t:'ground-stone-path',x:5,y:4,k:false},{t:'fire-2',x:1,y:2,k:false},{t:'light-1',x:0,y:4,k:false}]");
  win.renderCamp();
  ok('scene depth sorts by y+h, then x',
     [...win.document.querySelectorAll('.citem.placed')].map(el=>+el.dataset.idx).join(',') === '0,2,3,1');

  ev(`state=${campBefore}; heldPiece=null; pendingUpgrade=null`);
  win.renderCamp();

  /* ---------------------------------------------------------------- */
  section('Boss victory reveals a build piece');
  ev('state').realms[2].trial = true;
  win.startBoss(2);
  let guard = 0;
  while (ev('quiz') && guard++ < 40) {
    const bq = ev('quiz').queue[ev('quiz').idx];
    answer(bq.ans, true);
    await new Promise(r => setTimeout(r, 620));
  }
  ok('realm conquered', ev('state').realms[2].conquered === true);
  ok('piece reveal shown on results', $('results-body').innerHTML.includes('River Bridge'),
     $('results-body').innerHTML.slice(0,160));
  ok('reveal has a place-it button', $('results-body').innerHTML.includes('goPlace('));
  ok('first boss defeat reveals newly unlocked blueprints',
     $('results-body').textContent.includes('New camp blueprints') && $('results-body').textContent.includes('Canvas Tent'));
  ok('first boss defeat includes the 50-gem bonus', $('results-body').textContent.includes('+50 boss bonus'));
  win.goPlace('trophy-x2');
  ok('goPlace routes to camp holding the piece',
     ev('heldPiece') === 'trophy-x2' && $('screen-camp').classList.contains('active'));
  win.putAway();

  /* ---------------------------------------------------------------- */
  section('Save export / import round trip');
  win.showScreen('screen-parent');
  win.exportSave();
  const dumped = $('save-json').value;
  ok('export produces JSON', dumped.length > 100);
  const snapshot = JSON.stringify(ev('state'));
  ev('state').gems = 1;
  ev('state').placed = [];
  $('save-json').value = dumped;
  win.importSave();
  ok('import restores gems', JSON.stringify(ev('state')) === snapshot, 'state differs after round trip');
  $('save-json').value = 'not json at all';
  win.importSave();
  ok('garbage import is rejected safely', ev('state').gems !== 1);
  $('save-json').value = '{"hello":"world"}';
  win.importSave();
  ok('wrong-shape import is rejected', ev('state').facts !== undefined);

  /* ================================================================ */
  section('Preferences — defaults reproduce the original behaviour');
  const P = () => ev('state').settings;
  ok('window defaults to 4000ms', P().window === 4000);
  ok('round length defaults to 12', P().roundLen === 12);
  ok('hearts default to 3', P().hearts === 3);
  ok('second chance on by default', P().retry === true);
  ok('calm off by default', P().calm === false);
  ok('clicks on by default (legacy save had no such key)', P().clicks === true);
  ok('legacy sound preference preserved', P().sound === true);

  section('Preferences — corrupt values are repaired, not trusted');
  const bad = legacySave();
  bad.settings = { timer:true, sound:false, window:99999, roundLen:1, hearts:47 };
  const b = await boot(bad);
  const bev = expr => b.win.eval(expr);
  ok('nonsense window repaired to default', bev('state').settings.window === 4000, String(bev('state').settings.window));
  ok('nonsense round length repaired', bev('state').settings.roundLen === 12);
  ok('nonsense hearts repaired', bev('state').settings.hearts === 3);
  ok('valid legacy value untouched', bev('state').settings.sound === false);

  section('Preference: bonus window actually moves the mastery boundary');
  win.showScreen('screen-parent');
  win.setPref('window', 8000);
  ok('window setting stored', P().window === 8000);
  win.startPractice(2);
  const wq = ev('quiz').queue[ev('quiz').idx];
  const wk = `${Math.min(wq.a,wq.b)}*${Math.max(wq.a,wq.b)}`;
  ev('state').facts[wk] = {c:0,w:0,streak:0,rating:4,slow:0,last:null,bt:null};
  ev('qStart = performance.now() - 6000');            // 6s: slow at 4s, fast at 8s
  String(wq.ans).split('').forEach(d => win.pressKey(d));
  win.pressKey('enter');
  ok('6s answer counts as fast in an 8s window', ev('state').facts[wk].rating === 5,
     `rating ${ev('state').facts[wk].rating}`);
  await new Promise(r => setTimeout(r, 700));
  win.quitQuiz();
  win.setPref('window', 3000);
  win.startPractice(2);
  const wq2 = ev('quiz').queue[ev('quiz').idx];
  const wk2 = `${Math.min(wq2.a,wq2.b)}*${Math.max(wq2.a,wq2.b)}`;
  ev('state').facts[wk2] = {c:0,w:0,streak:0,rating:4,slow:0,last:null,bt:null};
  ev('qStart = performance.now() - 5000');
  String(wq2.ans).split('').forEach(d => win.pressKey(d));
  win.pressKey('enter');
  ok('5s answer is slow in a 3s window (rating held)', ev('state').facts[wk2].rating === 4,
     `rating ${ev('state').facts[wk2].rating}`);
  ok('slow counter rose instead', ev('state').facts[wk2].slow === 1);
  await new Promise(r => setTimeout(r, 700));
  win.quitQuiz();
  win.setPref('window', 4000);

  section('Preference: round length drives every queue builder');
  for (const n of [8, 16]) {
    win.setPref('roundLen', n);
    win.startPractice(2);
    const withWarmup = ev('quiz').queue.length;
    ok(`practice at ${n} (plus warm-ups)`, withWarmup >= n && withWarmup <= n + 3, `got ${withWarmup}`);
    win.quitQuiz();
    win.startTrial(2);
    ok(`trial queue is ${n}`, ev('quiz').queue.length === n, `got ${ev('quiz').queue.length}`);
    ok(`trial needs ${n-1}`, ev('quiz').needCorrect === n - 1, `got ${ev('quiz').needCorrect}`);
    win.quitQuiz();
    win.startMixedMayhem();
    ok(`mixed mayhem is ${n}`, ev('quiz').queue.length === n, `got ${ev('quiz').queue.length}`);
    win.quitQuiz();
    ev('state').realms[2].trial = true;
    win.startBoss(2);
    ok(`boss is ${n}`, ev('quiz').queue.length === n, `got ${ev('quiz').queue.length}`);
    win.quitQuiz();
  }
  win.setPref('roundLen', 12);
  win.showScreen('screen-map');
  ok('trial copy on the map follows the setting',
     $('continue-btn').textContent.includes('11 of 12') || !/Mastery/.test($('continue-btn').textContent),
     $('continue-btn').textContent);

  section('Preference: boss hearts');
  for (const h of [2, 5]) {
    win.setPref('hearts', h);
    ev('state').realms[2].trial = true;
    win.startBoss(2);
    ok(`boss starts with ${h} hearts`, ev('quiz').hearts === h);
    ok(`hearts rendered`, $('hearts').textContent.length === h * 2, `"${$('hearts').textContent}"`);
    ok(`needCorrect tracks hearts`, ev('quiz').needCorrect === ev('quiz').queue.length - h);
    win.quitQuiz();
  }
  win.setPref('hearts', 3);

  section('Preference: second chance off reveals immediately');
  win.setPref('retry', false);
  win.startPractice(2);
  const rq = ev('quiz').queue[ev('quiz').idx];
  const rIdx = ev('quiz').idx;
  ev('qStart = performance.now()');
  String(rq.ans + 1).split('').forEach(d => win.pressKey(d));
  win.pressKey('enter');
  await new Promise(r => setTimeout(r, 600));
  ok('hint reveals the answer straight away', $('hint-title').textContent.includes(String(rq.ans)),
     $('hint-title').textContent);
  ok('button advances rather than retrying', $('hint-btn').textContent.includes('Next'));
  win.dismissHint();
  ok('moves to the next question', ev('quiz').idx === rIdx + 1);
  ok('no retry was entered', ev('quiz').retry === false);
  win.quitQuiz();
  win.setPref('retry', true);

  section('Preference: calm mode');
  win.setPref('calm', true);
  ok('body carries the calm class', win.document.body.classList.contains('calm'));
  const confettiBefore = win.document.querySelectorAll('.confetti').length;
  win.confetti(30);
  ok('confetti suppressed', win.document.querySelectorAll('.confetti').length === confettiBefore);
  win.startPractice(2);
  win.zap();
  ok('zap suppressed', win.document.querySelectorAll('.zap').length === 0);
  win.quitQuiz();
  win.setPref('calm', false);
  ok('body class removed on toggle off', !win.document.body.classList.contains('calm'));
  win.confetti(10);
  ok('confetti returns', win.document.querySelectorAll('.confetti').length > confettiBefore);

  section('Preference: sound channels are independent');
  win.setPref('sound', false);
  win.setPref('clicks', true);
  let sErr = null;
  try { win.beep(440); win.click(); ev('sfx').ok(); ev('sfx').win(); } catch(e) { sErr = e.message; }
  ok('muted rewards + live clicks does not throw', !sErr, sErr);
  win.setPref('sound', true); win.setPref('clicks', false);
  sErr = null;
  try { win.beep(440); win.click(); ev('sfx').ok(); ev('sfx').bad(); } catch(e) { sErr = e.message; }
  ok('live rewards + muted clicks does not throw', !sErr, sErr);
  win.setPref('clicks', true);

  section('Preferences persist');
  win.setPref('window', 6000); win.setPref('roundLen', 16); win.setPref('hearts', 5);
  win.toggleSetting('calm');
  win.saveState();
  await new Promise(r => setTimeout(r, 600));
  const savedPrefs = JSON.parse(win.localStorage.getItem('timesquest-save')).settings;
  ok('window persisted', savedPrefs.window === 6000);
  ok('round length persisted', savedPrefs.roundLen === 16);
  ok('hearts persisted', savedPrefs.hearts === 5);
  ok('calm persisted', savedPrefs.calm === true);
  win.setPref('window', 4000); win.setPref('roundLen', 12); win.setPref('hearts', 3);
  if (ev('state').settings.calm) win.toggleSetting('calm');

  section('Preferences panel renders every control');
  win.showScreen('screen-parent');
  const pb = $('parent-body').innerHTML;
  ok('panel titled Preferences', pb.includes('Preferences'));
  ok('window choices offered', ['3s','4s','6s','8s'].every(s => pb.includes('>'+s+'<')));
  ok('round choices offered', pb.includes('Short') && pb.includes('Normal') && pb.includes('Long'));
  ok('heart choices offered', pb.includes("setPref('hearts',2)") && pb.includes("setPref('hearts',5)"));
  ok('all six toggles present',
     ['timer','retry','calm','sound','clicks'].every(k => pb.includes(`toggleSetting('${k}')`)));
  ok('heatmap legend states the active window', pb.includes('under 4s'), 'legend missing window');

  section('Parent dashboard still computes');
  let pErr = null;
  try { win.showScreen('screen-parent'); } catch(e){ pErr = e.message; }
  ok('parent dashboard renders', !pErr, pErr);
  ok('heatmap has 169 cells + headers',
     win.document.querySelectorAll('.heat-cell').length === 169,
     String(win.document.querySelectorAll('.heat-cell').length));

  section('Persistence');
  win.saveState();
  await new Promise(r => setTimeout(r, 600));
  const raw = win.localStorage.getItem('timesquest-save');
  ok('save written to the original key', !!raw);
  const reparsed = JSON.parse(raw);
  ok('placed persisted', Array.isArray(reparsed.placed));
  ok('legacy fields still present', reparsed.owned && reparsed.equipped && reparsed.facts && reparsed.realms);

  console.log(`\n${'='.repeat(46)}\n  ${pass} passed, ${fail} failed\n${'='.repeat(46)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
