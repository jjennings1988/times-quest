/* Run:  npm i jsdom  &&  node test/headless.js
   Dev-only. The game itself still has zero dependencies. */
/* Times Quest — headless verification harness (jsdom)
   Exercises logic, state migration and the quiz/camp flows. Not layout. */
const fs = require('fs');
const { JSDOM } = require('jsdom');

const HTML = require('path').join(__dirname,'..','public','index.html');
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
  ok('schema version stamped', S().v === 1);
  ok('bought initialised', typeof S().bought === 'object');
  ok('campSeen initialised', S().campSeen === null);

  // placed[] seeded from the four owned camp items at converted grid coords
  const placedIds = S().placed.map(p => p.t).sort();
  ok('placed seeded from owned camp gear only',
     JSON.stringify(placedIds) === JSON.stringify(['flag','lantern','tent']),
     JSON.stringify(placedIds));
  const at = id => S().placed.find(p => p.t === id);
  ok('flag  80%,16% → col 7 row 1', at('flag').x === 7 && at('flag').y === 1, JSON.stringify(at('flag')));
  ok('lantern 60%,50% → col 5 row 3', at('lantern').x === 5 && at('lantern').y === 3, JSON.stringify(at('lantern')));
  ok('tent  68%,62% → col 6 row 3', at('tent').x === 6 && at('tent').y === 3, JSON.stringify(at('tent')));
  ok('no two seeded pieces share a cell',
     new Set(S().placed.map(p => p.x+','+p.y)).size === S().placed.length);

  section('Migration — fresh save and a garbage save');
  const fresh = await boot(undefined);
  const fev = expr => fresh.win.eval(expr);
  ok('fresh boot has no errors', fresh.errs.length === 0, fresh.errs.join('; '));
  ok('fresh state has placed[]', Array.isArray(fev('state').placed) && fev('state').placed.length === 0);
  ok('fresh state gems 0', fev('state').gems === 0);

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
  ok('failure headline shown', $('results-body').innerHTML.includes('blocked you'));

  /* ---------------------------------------------------------------- */
  section('Camp — tap-tap placement');
  win.showScreen('screen-camp');
  const placedCount = () => ev('state').placed.length;
  const n0 = placedCount();
  ok('grid rendered', win.document.querySelectorAll('.camp-cell').length === 60,
     String(win.document.querySelectorAll('.camp-cell').length));
  ok('existing pieces rendered', win.document.querySelectorAll('.citem.placed').length === n0);

  win.holdPiece('rp0');                                   // ×0 conquered → owned
  ok('piece picked up', ev('heldPiece') === 'rp0');
  ok('scene enters placing mode', win.document.getElementById('camp-scene').className.includes('placing'));
  ok('held bar visible', win.document.querySelector('.held-bar').className.includes('on'));

  const emptyCell = [...win.document.querySelectorAll('.camp-cell')]
    .find(c => !ev('state').placed.some(p => p.x === +c.dataset.x && p.y === +c.dataset.y));
  emptyCell.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('piece placed', placedCount() === n0 + 1, `${n0} → ${placedCount()}`);
  ok('hand is empty again', ev('heldPiece') === null);
  ok('landed on the tapped cell',
     ev('state').placed.some(p => p.t === 'rp0' && p.x === +emptyCell.dataset.x && p.y === +emptyCell.dataset.y));

  const someItem = win.document.querySelector('.citem.placed');
  const tId = ev('state').placed[+someItem.dataset.idx].t;
  someItem.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('tapping a placed piece picks it up', ev('heldPiece') === tId, `held ${ev('heldPiece')}`);
  ok('it left the grid', placedCount() === n0, `${placedCount()}`);
  win.putAway();
  ok('put away clears the hand', ev('heldPiece') === null);
  ok('put-away piece is back in the tray as free', win.pieceFree(tId) >= 1);

  section('Camp — ownership and duplicates');
  ok('conquered realm grants its piece', win.pieceOwned('rp0') >= 1);
  ok('unconquered realm grants nothing', win.pieceOwned('rp7') === 0);
  ok('summit trophy locked', win.pieceOwned('rpS') === 0);
  ev('heldPiece = null');
  const gemsPre = ev('state').gems;
  ev('state').gems = 5;
  win.holdPiece('rp7');                                    // locked
  ok('locked piece cannot be held', ev('heldPiece') === null);
  ev('state').gems = 5;
  while (win.pieceFree('rp0') > 0) {                        // place all free copies
    const c = [...win.document.querySelectorAll('.camp-cell')]
      .find(c => !ev('state').placed.some(p => p.x === +c.dataset.x && p.y === +c.dataset.y));
    win.holdPiece('rp0'); c.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  }
  win.holdPiece('rp0');
  ok('duplicate refused without enough gems', ev('heldPiece') === null && !ev('state').bought['rp0']);
  ev('state').gems = 500;
  win.holdPiece('rp0');
  ok('duplicate bought with enough gems', ev('state').bought['rp0'] === 1 && ev('heldPiece') === 'rp0');
  ok('duplicate cost 20 gems', ev('state').gems === 480, `got ${ev('state').gems}`);
  win.putAway();
  ev('state').gems = gemsPre;

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
  win.goPlace('rp2');
  ok('goPlace routes to camp holding the piece',
     ev('heldPiece') === 'rp2' && $('screen-camp').classList.contains('active'));
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
