/* Run:  npm i jsdom  &&  node test/headless.js
   Dev-only. The game itself still has zero dependencies. */
/* Times Quest — headless verification harness (jsdom)
   Exercises logic, state migration and the quiz/camp flows. Not layout. */
const fs = require('fs');
const { webcrypto } = require('crypto');
const { TextEncoder, TextDecoder } = require('util');
const { JSDOM } = require('jsdom');

const HTML = require('path').join(__dirname,'..','public','index.html');
const PUBLIC = require('path').join(__dirname,'..','public');
const ROOT = require('path').join(__dirname,'..');
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

async function boot(saveObj, seededStorage={}) {
  const source=fs.readFileSync(HTML,'utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,name)=>`<script>${fs.readFileSync(require('path').join(PUBLIC,name),'utf8')}</script>`);
  const dom = new JSDOM(source, {
    runScripts:'dangerously', pretendToBeVisual:true, url:'https://example.test/',
    beforeParse(win){
      Object.defineProperty(win,'crypto',{value:webcrypto,configurable:true});
      win.TextEncoder=TextEncoder;
      win.TextDecoder=TextDecoder;
      if(saveObj!==undefined) win.localStorage.setItem('timesquest-save', JSON.stringify(saveObj));
      Object.entries(seededStorage).forEach(([key,value])=>win.localStorage.setItem(key,typeof value==='string'?value:JSON.stringify(value)));
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
  ok('schema version stamped', S().v === 7);
  ok('legacy fact history receives additive spaced-review scheduling',
     Object.values(S().facts).filter(f=>f.rating>0).every(f=>f.intervalDays>=1 && /^\d{4}-\d{2}-\d{2}$/.test(f.dueOn)));
  ok('existing stars are marked claimed without changing the saved gem balance',
     ev('REALM_ORDER').every(f=>S().realmRewardStars[f]===ev(`realmStars(${f}).stars`)) && S().gems===137,
     JSON.stringify(S().realmRewardStars));
  ok('bought initialised', typeof S().bought === 'object');
  ok('campSeen initialised', S().campSeen === null);

  // placed[] seeded from old camp gear, then migrated to locked v1.1 IDs
  const placedIds = S().placed.map(p => p.t).sort();
  ok('placed seeded from owned camp gear plus the climber',
     JSON.stringify(placedIds) === JSON.stringify(['banner-1','camp-climber','light-1','shelter-2']),
     JSON.stringify(placedIds));
  const at = id => S().placed.find(p => p.t === id);
  ok('flag → banner-1 projected into the panoramic clearing', at('banner-1').x === 15 && at('banner-1').y === 1, JSON.stringify(at('banner-1')));
  ok('lantern → light-1 projected into the panoramic clearing', at('light-1').x === 12 && at('light-1').y === 4, JSON.stringify(at('light-1')));
  ok('tent → shelter-2 projected into the panoramic clearing', at('shelter-2').x === 13 && at('shelter-2').y === 4, JSON.stringify(at('shelter-2')));
  ok('migrated pieces are owned under their stable IDs',
     ['banner-1','light-1','shelter-2'].every(id => S().bought[id] === 1));
  ok('no two seeded pieces share a cell',
     new Set(S().placed.map(p => p.x+','+p.y)).size === S().placed.length);
  ok('every migrated footprint is buildable and collision-free',
     S().placed.every((p,i)=>win.canPlaceAt(p.t,p.x,p.y,i)));
  ok('v4 camps shift into the middle of the 24-column panorama without changing depth',
     at('banner-1').x===15 && at('banner-1').y===1 && at('light-1').x===12 && at('light-1').y===4);

  section('Migration — complete legacy ID map and duplicate preservation');
  const richLegacy=legacySave();
  richLegacy.owned.push('log','kite','canoe','telescope','bigtent');
  richLegacy.bought={rp0:2};
  const rich=await boot(richLegacy);
  const rev=expr=>rich.win.eval(expr);
  ok('all eight old camp IDs map to their stable v1.1 replacements',
     ['banner-1','seating-2','light-1','activity-kite','shelter-2','legacy-canoe','lookout-3','shelter-4']
       .every(id=>rev('state').bought[id]>=1));
  ok('star gates never re-lock a late upgrade an existing save already owns',
     rev("pieceUnlocked(pieceById('lookout-3'))"));
  ok('placed lower chain tiers survive as legacy decorations',
     rev("state.placed.some(p=>p.t==='shelter-2'&&p.legacy===true)"));
  ok('older trophy duplicates remain placeable but are not remapped twice',
     rev("state.bought['trophy-x0']") === 2 && !rev("state.bought['rp0']"));

  section('Migration — fresh save and a garbage save');
  const fresh = await boot(undefined);
  const fev = expr => fresh.win.eval(expr);
  ok('fresh boot has no errors', fresh.errs.length === 0, fresh.errs.join('; '));
  ok('a new device opens the welcome profile screen',
     fev('state') === null && fresh.$('profile-gate').classList.contains('on') && fresh.$('profile-gate-body').textContent.includes('Welcome, climber'));
  fresh.win.renderProfileGate('create');
  fresh.$('profile-name').value='Avery';
  await fresh.win.createProfile();
  ok('fresh state starts with one placeable climber',
     Array.isArray(fev('state').placed) && fev('state').placed.length === 1 && fev('state').placed[0].t === 'camp-climber');
  ok('fresh climber is only auto-introduced once', fev('state').climberIntroduced === true);
  ok('fresh state gems 0', fev('state').gems === 0);
  ok('first profile stores a separate name, avatar, and save slot',
     fev("profileBook.profiles.length===1 && profileById().name==='Avery' && !!localStorage.getItem(profileSaveKey(activeProfileId))"));

  section('Profiles — migration and separate child progress');
  const profiles = await boot(legacySave());
  const pev = expr => profiles.win.eval(expr);
  ok('legacy progress migrates into the first profile without resetting',
     pev("profileBook.profiles.length===1 && profileById().name==='Climber' && state.gems===137"));
  const migratedProfileId=pev('activeProfileId');
  profiles.win.renderProfileGate('create');
  ok('profile creator offers nineteen inclusive explorer choices',
     profiles.win.document.querySelectorAll('.avatar-pick button').length===19 && pev('PROFILE_AVATARS.length')===19);
  profiles.win.chooseProfileAvatar(4,profiles.win.document.querySelectorAll('.avatar-pick button')[4]);
  profiles.$('profile-name').value='Jordan';
  await profiles.win.createProfile();
  pev('state.gems=77'); profiles.win.saveState(); await new Promise(r=>setTimeout(r,500));
  await profiles.win.switchProfile(migratedProfileId);
  ok('switching children restores the original progress', pev('state.gems')===137);
  await profiles.win.switchProfile(pev("profileBook.profiles.find(p=>p.name==='Jordan').id"));
  ok('switching back restores the second child progress', pev('state.gems')===77);
  ok('chosen inclusive explorer appears in map and camp avatar markup', profiles.win.avatarStr().includes('art/avatar/profile-5.png'), profiles.win.avatarStr());

  profiles.win.renderProfileGate('create');
  profiles.$('profile-name').value='Summit Tester';
  await profiles.win.createProfile();
  ok('secret Summit Tester profile is isolated and clearly marked',
     pev("profileById().qa===true && profileById().name==='Summit Tester'"));
  ok('secret Summit Tester profile unlocks all realms, stars, and a testing gem balance',
     pev('allConquered() && state.summitDone===true && mapStarCount()===39 && state.gems===99999'));
  ok('secret Summit Tester profile exposes every camp blueprint and repeatable inventory',
     pev('CAMP_BUILD_PIECES.every(p=>pieceUnlocked(p))') && pev("state.bought['ground-stone-path']===40"));

  section('Profile recovery and compact metadata');
  const alice=legacySave(),bruno=legacySave(); alice.gems=111;bruno.gems=222;
  alice.realms[2].conquered=true; bruno.realms[5].conquered=true;
  const recovered=await boot(undefined,{
    'timesquest-profiles':'{oops not json',
    'timesquest-save-pa':alice,
    'timesquest-save-pb':bruno,
  });
  const rpev=expr=>recovered.win.eval(expr);
  ok('a corrupted profile book recovers every intact child save',
     rpev('profileBook.profiles.length')===2 && rpev("profileBook.profiles.every(p=>p.name.startsWith('Recovered Climber'))"));
  await recovered.win.switchProfile('pa'); const aliceGems=rpev('state.gems');
  await recovered.win.switchProfile('pb'); const brunoGems=rpev('state.gems');
  ok('recovered children retain separate balances and realm progress',
     aliceGems===111 && brunoGems===222 && rpev('state.realms[5].conquered===true'));
  const reachable=rpev("profileBook.profiles.every(p=>!!localStorage.getItem(profileSaveKey(p.id)))");
  ok('no recovered profile save is unreachable from the rebuilt book',reachable);
  const missingBook=await boot(undefined,{'timesquest-save-pc':alice,'timesquest-save-pd':bruno});
  ok('a missing profile book also recovers all profile save slots',missingBook.win.eval('profileBook.profiles.length')===2);
  const compactSeed={};
  for(let i=0;i<4;i++){ const save=legacySave();save.gems=300+i;compactSeed[`timesquest-save-p${i}`]=save; }
  const compact=await boot(undefined,compactSeed);
  ok('four-profile metadata stays compact without embedded state snapshots',
     compact.win.localStorage.getItem('timesquest-profiles').length<1024 && compact.win.eval('profileBook.profiles.every(p=>p.snapshot===undefined)'));
  const compactGems=[];
  for(let i=0;i<4;i++){ await compact.win.switchProfile(`p${i}`);compactGems.push(compact.win.eval('state.gems')); }
  ok('compact profile metadata still switches among exact authoritative saves',JSON.stringify(compactGems)===JSON.stringify([300,301,302,303]));

  section('Camp migration returns pieces that cannot fit');
  const crowded=legacySave();
  crowded.v=4; crowded.climberIntroduced=true; crowded.placed=[]; crowded.bought={'shelter-5':40};
  for(let i=0;i<40;i++) crowded.placed.push({t:'shelter-5',x:i%12,y:Math.floor(i/12),k:false});
  const crowdedBoot=await boot(crowded);
  const cev=expr=>crowdedBoot.win.eval(expr);
  ok('dense migrated camps account for every placed or returned piece',
     cev('state.placed.length+state.campReturned.length')===40 && cev('state.campReturned.length')>0);
  ok('returned camp pieces remain owned and available to place again',
     cev("state.bought['shelter-5']")>=40 && cev("pieceFree('shelter-5')")===cev('state.campReturned.length'));
  crowdedBoot.win.enterCamp();
  ok('the camp explains exactly how many pieces were returned',
     crowdedBoot.$('camp-body').textContent.includes(`${cev('state.campReturned.length')} pieces were returned to your backpack`));

  section('Camp v1.1 catalogue and first-visit setup');
  ok('catalogue has 41 buyable build entries', fev('CAMP_BUILD_PIECES.length') === 41);
  ok('catalogue has 14 unique trophies', fev('Object.keys(REALM_PIECES).length + 1') === 14);
  ok('only stone path and wooden deck are repeatable',
     JSON.stringify(fev('CAMP_STANDALONES.filter(p=>p.repeatable).map(p=>p.id)')) ===
       JSON.stringify(['ground-stone-path','ground-wood-deck']));
  ok('all chain tiers are unique upgrades', fev('CAMP_BUILD_PIECES.filter(p=>p.chain).every(p=>p.unique && !p.repeatable)'));
  ok('realm mastery rewards total 2639 gems across all 39 stars',
     fev('Object.values(REALM_GEM_REWARDS).flat().reduce((sum,n)=>sum+n,0)') === 2639);
  ok('the final lodge requires every realm to reach three stars',
     fev("pieceById('shelter-5').unlockAfterStars") === 39);
  const progressBefore=fev('JSON.stringify(state)');
  fev("state.realms[2]={trial:false,conquered:false}; for(let b=0;b<=12;b++) fact(2,b).rating=b<10?4:0");
  ok('catching ten unlocks the Trial but does not award a star', fev('realmProgress(2).stars')===0 && fev('realmProgress(2).trialReady'));
  fev('state.realms[2].trial=true');
  ok('passing the Mastery Trial awards star one', fev('realmProgress(2).stars')===1);
  fev('state.realms[2].conquered=true');
  ok('defeating the guardian awards star two', fev('realmProgress(2).stars')===2);
  fev('for(let b=0;b<=12;b++) fact(2,b).rating=4');
  ok('catching all thirteen after victory awards star three', fev('realmProgress(2).stars')===3);
  fev(`state=${progressBefore}`);
  const economyBefore=fev('JSON.stringify(state)');
  fev("state.realms[0].trial=true; state.realms[0].conquered=true; for(let b=0;b<=12;b++) fact(0,b).rating=4");
  const firstStarClaim=fev('claimRealmStarRewards(0)');
  const repeatedStarClaim=fev('claimRealmStarRewards(0)');
  ok('a three-star realm pays its three incremental rewards once',
     firstStarClaim.gems===125 && JSON.stringify(firstStarClaim.stars)===JSON.stringify([1,2,3]));
  ok('realm star rewards cannot be farmed repeatedly', repeatedStarClaim.gems===0);
  fev(`state=${economyBefore}`);
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
  const archivedHats={
    'archive/hat-upgrades/cap.png':[256,256], 'archive/hat-upgrades/tophat.png':[256,256],
    'archive/hat-upgrades/helmet.png':[256,256], 'archive/hat-upgrades/cowboy.png':[256,256],
    'archive/hat-upgrades/grad.png':[256,256], 'archive/hat-upgrades/crown.png':[256,256],
  };
  const avatarGear={
    'buddy/cat.png':[256,256], 'buddy/dog.png':[256,256], 'buddy/unicorn.png':[256,256],
  };
  const profileAvatars=Object.fromEntries(Array.from({length:19},(_,i)=>[`avatar/profile-${i+1}.png`,[512,512]]));
  const campBackgrounds={
    'bg-camp-dusk.png':[1180,640], 'bg-camp-morning.png':[1180,640],
    'bg-camp-autumn.png':[1180,640], 'bg-camp-moonlit.png':[1180,640],
  };
  const factMonsters=Object.fromEntries(Array.from({length:78},(_,i)=>[`mon-${String(i+1).padStart(2,'0')}.png`,[256,256]]));
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
  const animatedCampPieces=fev("CAMP_BUILD_PIECES.filter(p=>p.motion).map(p=>[p.id,p.motion])");
  ok('only true frame strips animate in the camp catalogue',
     animatedCampPieces.every(([,motion])=>motion==='sprite3') && animatedCampPieces.length===9,
     JSON.stringify(animatedCampPieces));
  ok('static structures never rotate, skew, or stretch as a whole',
     !['sway','swing','breathe'].some(motion=>fev(`CAMP_BUILD_PIECES.some(p=>p.motion==='${motion}')`)));
  const anchorTool=fs.readFileSync(require('path').join(ROOT,'tools','lock_camp_animation_anchors.py'),'utf8');
  const lockedAnimationAssets=[...Object.keys(batch1),...Object.keys(batch2),...Object.keys(batch3),...Object.keys(batch4)]
    .filter(name=>name.includes('-strip3'));
  ok('the reproducible anchor-lock tool covers every animated camp strip plus the climber',
     lockedAnimationAssets.every(name=>anchorTool.includes(name)) && anchorTool.includes('art/climber.png'));
  ok('immutable source frames are preserved for every corrected animation',
     [...lockedAnimationAssets,'climber.png'].every(name=>fs.existsSync(require('path').join(ROOT,'art-raw','camp-animation-originals',name))));
  const avatarPngInfo=name=>{
    const buf=fs.readFileSync(require('path').join(PUBLIC,'art',name));
    return {w:buf.readUInt32BE(16),h:buf.readUInt32BE(20),colorType:buf[25]};
  };
  ok('all three shop buddies exist at 256×256',
     Object.entries(avatarGear).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art',name);
       if(!fs.existsSync(p)) return false;
       const info=avatarPngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all shop buddies are transparent RGBA PNGs',
     Object.keys(avatarGear).every(n=>avatarPngInfo(n).colorType===6));
  ok('all nineteen profile explorers exist as transparent 512×512 PNGs',
     Object.entries(profileAvatars).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art',name);
       if(!fs.existsSync(p)) return false;
       const info=avatarPngInfo(name); return info.w===size[0] && info.h===size[1] && info.colorType===6;
     }));
  ok('all four selectable camp backgrounds share the locked 1180×640 build-plane contract',
     Object.entries(campBackgrounds).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','camp',name);
       if(!fs.existsSync(p)) return false;
       const info=pngInfo(name); return info.w===size[0] && info.h===size[1];
     }));
  ok('all 78 non-square Fact Monsters exist as transparent 256×256 PNGs',
     Object.entries(factMonsters).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art','mon',name);
       if(!fs.existsSync(p)) return false;
       const info=avatarPngInfo(`mon/${name}`); return info.w===size[0] && info.h===size[1] && info.colorType===6;
     }));
  ok('retired hat art is preserved in the archive',
     Object.entries(archivedHats).every(([name,size])=>{
       const p=require('path').join(PUBLIC,'art',name);
       if(!fs.existsSync(p)) return false;
       const info=avatarPngInfo(name); return info.w===size[0] && info.h===size[1] && info.colorType===6;
     }));
  const swSource=fs.readFileSync(require('path').join(PUBLIC,'sw.js'),'utf8');
  const coreMatch=swSource.match(/const CORE = \[([\s\S]*?)\];/);
  const corePaths=coreMatch?[...coreMatch[1].matchAll(/'([^']+)'/g)].map(m=>m[1]):[];
  const coreBytes=corePaths.reduce((sum,entry)=>{
    const relative=entry==='./'?'index.html':entry.replace(/^\.\//,'');
    const file=require('path').join(PUBLIC,relative);
    return sum+(fs.existsSync(file)?fs.statSync(file).size:0);
  },0);
  ok('offline core lists only real files and stays under 6 MB',
     corePaths.length>0 && corePaths.every(entry=>fs.existsSync(require('path').join(PUBLIC,entry==='./'?'index.html':entry.replace(/^\.\//,'')))) && coreBytes<6*1024*1024,
     `${coreBytes} bytes across ${corePaths.length} entries`);
  ok('optional art warms after the compact service-worker installation in failure-safe batches',
     swSource.includes('warmOptionalCache') && swSource.includes('Promise.allSettled(batch.map') && swSource.includes("type === 'WARM_OPTIONAL'"));
  const swInstallBlock=swSource.slice(swSource.indexOf("addEventListener('install'"),swSource.indexOf('async function warmOptionalCache'));
  ok('large optional artwork no longer blocks first service-worker install',
     swInstallBlock.includes('c.addAll(CORE)') && !swInstallBlock.includes('OPTIONAL'));
  ok('offline shell pre-caches every Batch 1 asset', Object.keys(batch1).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every Batch 2 asset', Object.keys(batch2).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every Batch 3 asset', Object.keys(batch3).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every Batch 4 asset', Object.keys(batch4).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every Batch 5 asset', Object.keys(batch5).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches every realm character', Object.keys(realmCharacters).every(n=>swSource.includes(`./art/realm/${n}`)));
  ok('offline shell pre-caches every boss portrait', Object.keys(bossCharacters).every(n=>swSource.includes(`./art/boss/${n}`)));
  ok('offline shell pre-caches the climber sprite', swSource.includes('./art/climber.png'));
  ok('offline shell pre-caches all avatar gear', Object.keys(avatarGear).every(n=>swSource.includes(`./art/${n}`)));
  ok('offline shell pre-caches all nineteen profile explorers', Object.keys(profileAvatars).every(n=>swSource.includes(`./art/${n}`)));
  ok('offline shell pre-caches every selectable camp background', Object.keys(campBackgrounds).every(n=>swSource.includes(`./art/camp/${n}`)));
  ok('offline shell pre-caches all 78 non-square Fact Monsters', Object.keys(factMonsters).every(n=>swSource.includes(`./art/mon/${n}`)));
  ok('retired hats are not loaded into the live offline shell', !swSource.includes('./art/hat/') && !swSource.includes('./art/archive/hat-upgrades/'));
  ok('runtime cache never stores missing future-batch art', swSource.includes('if (res.ok)'));
  ok('offline misses return a valid error response',swSource.includes('Response.error()'));
  ok('offline shell pre-caches the scrolling adventure map', swSource.includes('./art/map/bg-adventure-map.png'));
  fresh.win.showScreen('screen-camp');
  ok('camp opens as a scene-first experience with collapsed menus',
     !!fresh.$('camp-experience') && !fresh.win.document.querySelector('.camp-sheet'));
  ok('camp dock exposes six focused tools including Siege',
     fresh.win.document.querySelectorAll('.camp-dock button').length === 6 && fresh.$('camp-body').textContent.includes('Siege'));
  ok('scene-first camp uses a 24 × 8 placement plane', fev('CAMP_COLS')===24 && fev('CAMP_ROWS')===8);
  fresh.win.setCampPanel('build');
  ok('build catalog opens as a collapsible sheet',
     fresh.win.document.querySelector('.camp-sheet') && fresh.$('camp-body').textContent.includes('Build your camp'));
  fresh.win.setCampPanel('scenery');
  ok('scenery tray offers four compatible camp environments',
     fresh.win.document.querySelectorAll('.camp-background-option').length===4);
  fresh.win.setCampBackground('autumn');
  ok('camp environment choice persists without changing the placement plane',
     fev("state.campBackground==='autumn' && CAMP_BACKGROUNDS.length===4 && CAMP_PLANE.top===.405"));
  fresh.win.setCampPanel('paths');
  ok('paths tray separates groundwork, camp life, and activities',
     ['Paths','Camp life','Activities'].every(label=>fresh.$('camp-body').textContent.includes(label)));
  fresh.win.setCampPanel('paths');
  fresh.win.setCampPanel(null);
  ok('first camp visit grants the free starter pair',
     fev("state.bought['shelter-1']") === 1 && fev("state.bought['fire-1']") === 1);
  ok('starter placement tutorial begins with the Bedroll',
     fev('heldPiece') === 'shelter-1' && JSON.stringify(fev('state.campTutorial')) === JSON.stringify(['shelter-1','fire-1']));
  fresh.win.setCampPanel('build');
  ok('one-conquest items preview early', fresh.$('camp-body').textContent.includes('Cook Pot'));
  ok('future upgrade chains remain visible as locked previews', fresh.$('camp-body').textContent.includes('Pack Pile'));
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
  ok('continue preserves adventure while due review remains available',
     !/Daily Review/.test($('continue-btn').textContent) && $('journey-map-controls').textContent.includes('Revisit'), $('continue-btn').textContent);
  ok('adventure renders one map destination per realm plus the summit',
     win.document.querySelectorAll('#map-trail .realm-node').length === 13 && !!win.document.querySelector('#map-trail .summit-node'));
  ok('adventure route has one curved segment between every destination',
     win.document.querySelectorAll('#map-trail .map-route-segment').length === 13);
  ok('map artwork, route, and destinations share one responsive coordinate world',
     !!win.document.querySelector('#map-trail .map-world>.map-art') &&
     !!win.document.querySelector('#map-trail .map-world>.map-route') &&
     win.document.querySelectorAll('#map-trail .map-world>.realm-node').length===13 &&
     ev("mapRouteSvg(0).includes('viewBox=\"0 0 864 1821\"')"));
  const landmarkStops = ev('MAP_POSITIONS').slice(5,10);
  ok('middle adventure realms align with their illustrated landmarks',
     JSON.stringify(landmarkStops) === JSON.stringify([
       {x:25,y:48.9}, {x:74,y:41.8}, {x:50,y:34.7}, {x:22,y:29.8}, {x:69,y:27.7},
     ]), JSON.stringify(landmarkStops));
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
  ok('realm progress explains all three star goals and the current catch gate',
     ['Pass the Realm Challenge','Restore the realm','Catch all 13','Learn with your guardian to open the challenge'].every(text=>$('realm-body').textContent.includes(text)),
     $('realm-body').textContent);
  ok('realm progress exposes three visible milestone steps and an x/3 total',
     win.document.querySelectorAll('#realm-body .realm-star-step').length===3 && $('realm-body').textContent.includes('/3'));
  win.startTrial(2);
  ok('Mastery Trial cannot be bypassed before ten monsters are caught', ev('quiz')===null);
  ok('all 13 guardians have introductions and signature abilities',
     ev('REALM_ORDER.every(f => REALM_LORE[f] && REALM_LORE[f].intro && REALM_LORE[f].ability && REALM_LORE[f].example)'));
  ok('realm introduces its guardian before the activity choices',
     $('realm-body').textContent.includes('Meet Twix the Fox') && $('realm-body').textContent.includes('View guardian Quest Card'));
  ok('realm mode cards keep titles and supporting text separate',
     win.document.querySelectorAll('#realm-body .mode-card .nm').length === 4 &&
     win.document.querySelectorAll('#realm-body .mode-card .sub').length === 4);
  win.openGuardianCard(2);
  ok('guardian Quest Card opens with lore, ability, and live stats',
     $('card-modal').classList.contains('on') && $('card-modal-body').textContent.includes('River Double') &&
     $('card-modal-body').textContent.includes('Map stars') && $('card-modal-body').textContent.includes('Caught'));
  ok('Quest Card modal exposes accessible dialog semantics',
     $('card-modal').getAttribute('role')==='dialog' && $('card-modal').getAttribute('aria-modal')==='true');
  win.closeQuestCard();
  ok('viewport permits child and parent accessibility zoom',
     !win.document.querySelector('meta[name="viewport"]').content.includes('user-scalable=no'));

  section('Training and collectible field guide');
  win.showScreen('screen-hall');
  ok('training leads with one recommended workout',
     $('hall-body').textContent.includes('Recommended workout') && !!win.document.querySelector('#hall-body .training-hero'));
  ok('training library offers six distinct workout paths including Daily Review',
     win.document.querySelectorAll('#hall-body .training-workout').length === 6 && $('hall-body').textContent.includes('Daily Review'));
  ok('due-fact selection ranks overdue, weak, slow, and lapsed facts without duplicates',
     ev('dueFactEntries(12).every(([k],i,list)=>list.findIndex(([other])=>other===k)===i)') && ev('dueFactEntries(12).length')>0);
  win.showScreen('screen-monsters');
  ok('monster guide groups facts beneath realm guardians',
     win.document.querySelectorAll('#monster-grid .monster-realm-section').length === ev('unlockedFamilies().length'));
  const visibleUniqueFacts=ev("new Set(unlockedFamilies().flatMap(f=>Array.from({length:13},(_,b)=>fkey(f,b)))).size");
  ok('collection header counts canonical creatures rather than reversed card duplicates',
     $('monster-count').textContent.includes('91 in the world') && $('monster-count').textContent.includes(`${visibleUniqueFacts} discoverable here`));
  ok('each unlocked realm exposes all 13 collectible fact cards',
     Array.from(win.document.querySelectorAll('#monster-grid .monster-realm-section .monster-grid')).every(g => g.querySelectorAll('.monster-cell').length === 13));
  ok('zero-based monster identities map to one-based art filenames without drift',
     ev("monsterIdentity(0,1).name==='Rune Caterpillar' && monsterIdentity(0,1).art.endsWith('mon-01.png')"));
  const canonicalFactMonsters=ev(`(()=>{const out=[];for(let lo=0;lo<13;lo++)for(let hi=lo+1;hi<13;hi++)out.push(monsterIdentity(lo,hi));return out})()`);
  ok('all 78 canonical non-square facts receive unique monster art and names',
     canonicalFactMonsters.length===78 && new Set(canonicalFactMonsters.map(m=>m.art)).size===78 && new Set(canonicalFactMonsters.map(m=>m.name)).size===78);
  ok('reversed multiplication facts share the same canonical monster',
     ev("monsterIdentity(1,3).art===monsterIdentity(3,1).art && monsterIdentity(6,9).name===monsterIdentity(9,6).name"));
  ok('previously colliding facts now receive different monsters',
     ev(`[
       [monsterIdentity(6,9),monsterIdentity(9,10)],
       [monsterIdentity(1,4),monsterIdentity(4,5)],
       [monsterIdentity(3,6),monsterIdentity(0,5)],
       [monsterIdentity(2,5),monsterIdentity(5,6)]
     ].every(([left,right])=>left.art!==right.art&&left.name!==right.name)`));
  ok('the 13 square facts continue to use their unique realm guardians',
     ev("Array.from({length:13},(_,f)=>monsterIdentity(f,f).art).every((art,f)=>art.endsWith(`pet-${f}.png`))"));
  const firstMonsterCard = win.document.querySelector('#monster-grid .monster-cell');
  firstMonsterCard.click();
  ok('fact monster card opens with fact, strategy, and performance stats',
     $('card-modal').classList.contains('on') && $('card-modal-body').textContent.includes('Independent accuracy') &&
     $('card-modal-body').textContent.includes('Recorded first attempts') && $('card-modal-body').textContent.includes('Status'));
  ok('Fact Monster cards use stable named PNG artwork',
     $('card-modal-body').querySelector('.fact-monster-image') && $('card-modal-body').textContent.includes('expedition team'));
  const favoriteBefore=ev('state.campMonsterFavorites.length');
  const favoriteButton=$('card-modal-body').querySelector('.monster-favorite-btn');
  if(favoriteButton) favoriteButton.click();
  ok('a caught Fact Monster can be invited to Base Camp', ev('state.campMonsterFavorites.length')===favoriteBefore+1);
  win.closeQuestCard();
  ok('main navigation uses the shared five-icon system',
     win.document.querySelectorAll('#nav button .ui-icon').length === 5);

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
  ok('a normal fast correct answer awards one gem', ev('state').gems === gemsBefore+1);
  ok('counted as first-try correct', ev('quiz').correct === 1);
  ok('first-try retrieval schedules the fact on a future day',
     ev('state').facts[k].intervalDays>=1 && ev('state').facts[k].dueOn>ev('dateKey()'), JSON.stringify(ev('state').facts[k]));
  ok('first-try retrieval is recorded for parent trends',
     ev('state').reviewHistory.at(-1).key===k && ev('state').reviewHistory.at(-1).ok===true);
  await new Promise(r => setTimeout(r, 700));

  section('Quiz — accurate answers progress at any speed');
  let q2 = ev('quiz').queue[ev('quiz').idx];
  const k2 = `${Math.min(q2.a,q2.b)}*${Math.max(q2.a,q2.b)}`;
  ev('state').facts[k2] = {c:0,w:0,streak:0,rating:3,slow:0,last:null,bt:null};
  answer(q2.ans, false);
  ok('slow correct reaches caught status', ev('state').facts[k2].rating === 4 && ev('state').facts[k2].caught===true, `got ${ev('state').facts[k2].rating}`);
  ok('slow accurate answers do not gain a weakness penalty', ev('state').facts[k2].slow === 0);
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
  ok('every miss includes a named realm strategy', !!$('hint-body').querySelector('.hint-strategy-label') && $('hint-body').textContent.includes('strategy'));
  ok('strategy coach explains how to build the answer', $('hint-body').querySelectorAll('.mv-equation strong').length > 0, $('hint-body').textContent);
  ok('worked hint pairs words with an accessible visual group model',
     !!$('hint-body').querySelector('.math-visual svg[role="img"]') &&
     (!!$('hint-body').querySelector('.mv-row') || $('hint-body').textContent.includes('Nothing to count')));
  ok('button offers a retry', $('hint-btn').textContent.includes('try again'), $('hint-btn').textContent);
  ok('title is the coaching one, not the answer', $('hint-title').textContent.includes('tricky'));
  ok('missed fact is added to the end of the round', ev('quiz').total === totalAtMiss + 1 &&
     ev('quiz').queue.at(-1).a === q3.a && ev('quiz').queue.at(-1).b === q3.b,
     `${totalAtMiss} → ${ev('quiz').total}`);
  ok('hint explains that the fact will return', $('hint-body').textContent.includes('revisit this fact once'));
  ok('learn, practice, and mastery trials use the review queue',
     ev("['learn','practice','trial'].every(mode=>REVIEW_QUEUE_MODES.has(mode))") &&
     ev("!['boss','siege','summit'].some(mode=>REVIEW_QUEUE_MODES.has(mode))"));
  ok('first miss costs a rating point', ev('state').facts[k3].rating < r3before || r3before <= 1);
  ok('first miss counted as wrong once', ev('quiz').wrong === 1);
  ok('a lapse returns tomorrow and resets the spacing streak',
     ev('state').facts[k3].dueOn===ev('addDays(dateKey(),1)') && ev('state').facts[k3].reviewStreak===0 && ev('state').facts[k3].lapses>=1);

  win.dismissHint();
  ok('same question is re-presented', ev('quiz').idx === idxAtMiss, `idx ${idxAtMiss} → ${ev('quiz').idx}`);
  ok('question text unchanged', $('q-text').textContent === q3.text);
  ok('retry flag set', ev('quiz').retry === true);
  ok('timer hidden on the retry', $('timer-track').style.visibility === 'hidden');
  ok('answer box cleared', ev('quiz').answer === '');

  const ratingAtRetry = ev('state').facts[k3].rating;
  answer(q3.ans, true);                                   // correct on second go
  ok('retry-correct counted as recovered', ev('quiz').recovered === 1);
  ok('retry-correct still leaves the later review in the queue', ev('quiz').total === totalAtMiss + 1);
  ok('retry-correct does NOT raise mastery', ev('state').facts[k3].rating === ratingAtRetry,
     `${ratingAtRetry} → ${ev('state').facts[k3].rating}`);
  ok('retry-correct does NOT count toward the pass threshold', ev('quiz').passCorrect === 2);
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
  ok('realm showdown replaces the compact boss strip', $('screen-quiz').classList.contains('boss-active') && $('battle-stage').classList.contains('on'));
  ok('boss battle markup keeps its emoji fallback', $('battle-boss').innerHTML.includes('🌊'));
  ok('boss battle markup points at the stable semantic PNG', $('battle-boss').innerHTML.includes('art/boss/boss-2.png'));
  ok('selected profile climber enters the battle', $('battle-climber').innerHTML.includes('art/avatar/profile-1.png'));
  ok('River Serpent uses the stepping-stone prototype', $('battle-stage').classList.contains('effect-river') && $('battle-mechanic-name').textContent.includes('Stepping-stone'));
  ok('River Serpent loads its dedicated portrait battlefield', $('battle-stage').style.getPropertyValue('--battle-bg').includes('art/battle/bg-battle-x2-portrait.webp'));
  ok('River Serpent has a distinct counterattack pose', $('battle-stage').style.getPropertyValue('--boss-attack-art').includes('art/boss/boss-2-attack.webp'));
  ok('showdown renders a five-position battle lane', $('battle-lane').children.length === 5);
  ok('all thirteen guardians have configurable battle mechanics', ev('REALM_ORDER').every(f=>ev(`BOSS_BATTLE_CONFIGS[${f}]`) && ev(`BOSS_BATTLE_CONFIGS[${f}].phases.length`)===3));
  ok('all thirteen guardians use dedicated portrait battlefield art', ev('REALM_ORDER').every(f=>ev(`BOSS_BATTLE_CONFIGS[${f}].art`).includes(`bg-battle-x${f}-portrait.webp`) && fs.existsSync(require('path').join(PUBLIC,ev(`BOSS_BATTLE_CONFIGS[${f}].art`)))));
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

  section('Camp Siege — replayable mixed-fact bonus round');
  const siegeWinsBefore=ev('state').siegeWins;
  win.startCampSiege();
  ok('Camp Siege launches through the cinematic battle engine', ev('quiz').mode==='siege' && $('screen-quiz').classList.contains('boss-active'));
  ok('Camp Siege uses its dedicated portrait battlefield', $('battle-stage').style.getPropertyValue('--battle-bg').includes('bg-battle-camp-siege-portrait.webp'));
  ok('Camp Siege mixes conquered families', ev('quiz').fams.length>1 && new Set(ev('quiz').queue.map(q=>q.a)).size>1);
  ok('Camp Siege is a bonus and does not increment wins merely by launching', ev('state').siegeWins===siegeWinsBefore);
  win.quitQuiz();
  ok('quitting Camp Siege returns to camp', $('screen-camp').classList.contains('active'));

  /* ---------------------------------------------------------------- */
  section('Camp — tap-tap placement');
  win.showScreen('screen-camp');
  const placedCount = () => ev('state').placed.length;
  const n0 = placedCount();
  ok('186 buildable panoramic clearing locations rendered', win.document.querySelectorAll('.camp-cell').length === 186,
     String(win.document.querySelectorAll('.camp-cell').length));
  ok('placement plane starts below the sky',
     [...win.document.querySelectorAll('.camp-cell')].every(c=>parseFloat(c.style.top)>=40));
  ok('rows widen toward the camera',
     parseFloat(win.document.querySelector('.camp-cell[data-x="5"][data-y="7"]').style.width) >
     parseFloat(win.document.querySelector('.camp-cell[data-x="5"][data-y="0"]').style.width));
  ok('rocky foreground corners are not placement targets',
     !win.document.querySelector('.camp-cell[data-x="0"][data-y="7"]') && !ev('campCellBuildable(0,7)') && !ev('campCellBuildable(23,7)'));
  ok('climber is a movable camp piece, not scene decoration',
     ev("state.placed.some(p=>p.t==='camp-climber')") && ev("pieceVisual('camp-climber')").includes('art/climber.png'));
  ok('existing pieces rendered', win.document.querySelectorAll('.citem.placed').length === n0);
  ok('camp is scene-first by default and hides global app chrome',
     win.document.body.classList.contains('camp-world-open'));
  ok('scene-first camp includes recenter, undo, and Adventure exit controls',
     !!win.document.querySelector('.camp-recenter') && !!win.document.querySelector('[aria-label="Undo last camp move"]') && !!win.document.querySelector('[aria-label="Back to Adventure"]'));
  ok('new camp camera storage starts per environment', typeof ev('state').campCameras === 'object');

  win.holdPiece('trophy-x0');                             // ×0 conquered → owned
  ok('piece picked up', ev('heldPiece') === 'trophy-x0');
  ok('scene enters placing mode', win.document.getElementById('camp-scene').className.includes('placing'));
  ok('held bar visible', win.document.querySelector('.held-bar').className.includes('on'));
  await new Promise(r=>setTimeout(r,30));
  ok('placement mode shows a correctly scaled live ghost',
     !!win.document.querySelector('.camp-placement-preview') && ev('campPreviewCell')!==null);
  ok('placement mode exposes edge and compact-bar camera controls',
     win.document.querySelectorAll('.camp-edge-pan').length===2 && win.document.querySelectorAll('.held-pan button').length===2);
  ok('placement guidance highlights only a local cluster',
     win.document.querySelectorAll('.camp-cell.nearby').length>0 && win.document.querySelectorAll('.camp-cell.nearby').length<90);

  const emptyCell = [...win.document.querySelectorAll('.camp-cell')]
    .find(c => !ev('state').placed.some(p => p.x === +c.dataset.x && p.y === +c.dataset.y));
  emptyCell.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));
  ok('piece placed', placedCount() === n0 + 1, `${n0} → ${placedCount()}`);
  ok('hand is empty again', ev('heldPiece') === null);
  ok('landed on the tapped cell',
     ev('state').placed.some(p => p.t === 'trophy-x0' && p.x === +emptyCell.dataset.x && p.y === +emptyCell.dataset.y));
  win.undoCampAction();
  ok('one-step undo restores the pre-placement camp', placedCount() === n0 && ev('heldPiece') === 'trophy-x0');
  emptyCell.dispatchEvent(new win.MouseEvent('click', {bubbles:true}));

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
  ok('late shelter upgrades require meaningfully larger camp plots',
     ev("pieceSize('shelter-4').w") === 3 && ev("pieceSize('shelter-4').h") === 2 &&
     ev("pieceSize('shelter-5').w") === 3 && ev("pieceSize('shelter-5').h") === 3);
  ok('a lodge cannot fit where its full 3×3 footprint crosses the clearing edge',
     !win.canPlaceAt('shelter-5',22,5));

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
  const farScale=parseFloat(ev("campItemPresentation({t:'shelter-2',x:2,y:0}).style").match(/--depth-scale:([\d.]+)/)[1]);
  const nearScale=parseFloat(ev("campItemPresentation({t:'shelter-2',x:2,y:6}).style").match(/--depth-scale:([\d.]+)/)[1]);
  ok('camera perspective is dramatically stronger near the foreground', nearScale > farScale*2, `${farScale} → ${nearScale}`);
  const nearLanternWidth=parseFloat(ev("campItemPresentation({t:'light-1',x:2,y:6}).style").match(/width:([\d.]+)/)[1]);
  const nearTentWidth=parseFloat(ev("campItemPresentation({t:'shelter-2',x:2,y:6}).style").match(/width:([\d.]+)/)[1]);
  const nearClimberWidth=parseFloat(ev("campItemPresentation({t:'camp-climber',x:2,y:6}).style").match(/width:([\d.]+)/)[1]);
  ok('lantern renders at handheld scale beside a climber', nearLanternWidth < nearClimberWidth*.25, `${nearLanternWidth}% vs ${nearClimberWidth}%`);
  ok('bedroll renders near a child body width rather than its two-cell footprint', nearBedrollWidth < nearClimberWidth*1.15, `${nearBedrollWidth}% vs ${nearClimberWidth}%`);
  ok('physical sizing keeps a lantern much smaller than a tent at equal depth', nearLanternWidth < nearTentWidth*.15, `${nearLanternWidth}% vs ${nearTentWidth}%`);
  ok('expanded shelter footprints do not stretch their square or 3:2 artwork',
     ev("pieceArtAspect('shelter-4',3,2)")===1 && ev("pieceArtAspect('shelter-5',3,3)")===1.5);
  ok('every non-ground camp item has an explicit audited physical width',
     ev("CAMP_BUILD_PIECES.filter(p=>p.category!=='groundwork').every(p=>Number.isFinite(CAMP_PHYSICAL_WIDTH[p.id])&&CAMP_PHYSICAL_WIDTH[p.id]>0)"));
  ok('full clearing plane reaches farther to both foreground edges',
     ev('CAMP_PLANE.leftBottom') <= .06 && ev('CAMP_PLANE.rightBottom') >= .94);

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
  win.document.querySelector('.camp-cell[data-x="22"][data-y="5"]')
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
  ok('map and camp avatar markup use the selected illustrated profile', ev('avatarStr()').includes('art/avatar/profile-1.png'));
  ev("state.equipped.hat='cap'; state.equipped.buddy='cat'");
  ok('legacy hat preference is ignored while the selected explorer and buddy still render',
     !ev('avatarStr()').includes('art/hat/') && ev('avatarStr()').includes('art/avatar/profile-1.png') && ev('avatarStr()').includes('art/buddy/cat.png'));
  ok('hat upgrades are retired from the live shop', !ev("SHOP.some(i=>i.type==='hat')"));
  ok('shop art keeps an emoji fallback beneath each live PNG',
     ev("shopArt(SHOP.find(i=>i.id==='cat'))").includes('🐱') && ev("shopArt(SHOP.find(i=>i.id==='cat'))").includes('art/buddy/cat.png'));

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
  ok('first boss defeat pays an incremental realm-star reward instead of a flat 50-gem bonus',
     $('results-body').textContent.includes('realm milestone gems') && !$('results-body').textContent.includes('+50 boss bonus'));
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

  section('Protected whole-family backup');
  const backup=await boot(legacySave());
  const bkev=expr=>backup.win.eval(expr);
  backup.win.renderProfileGate('create');
  backup.$('profile-name').value='Rowan';
  await backup.win.createProfile();
  bkev('state').gems=42;
  await backup.win.storageSet(bkev('profileSaveKey(activeProfileId)'),JSON.stringify(bkev('state')));
  const familyBundle=await backup.win.buildFamilyBackupBundle();
  ok('family bundle includes every local climber and authoritative save',
     familyBundle.profileBook.profiles.length===2&&Object.keys(familyBundle.saves).length===2);
  const familyPass='long family trail phrase';
  const protectedText=await backup.win.encryptFamilyBackup(familyBundle,familyPass);
  ok('protected envelope exposes no child profile names or save fields',
     !protectedText.includes('Rowan')&&!protectedText.includes('Climber')&&!protectedText.includes('facts'));
  const unlocked=await backup.win.decryptFamilyBackup(protectedText,familyPass);
  ok('correct parent passphrase restores the exact bundle',
     JSON.stringify(unlocked)===JSON.stringify(familyBundle));
  let wrongPassRejected=false;
  try{ await backup.win.decryptFamilyBackup(protectedText,'this is the wrong passphrase'); }catch(e){ wrongPassRejected=/unlock|passphrase/i.test(e.message); }
  ok('wrong passphrase is rejected before local progress changes',wrongPassRejected&&bkev('state').gems===42);
  const damaged=JSON.parse(JSON.stringify(familyBundle));
  delete damaged.saves[damaged.profileBook.active].facts;
  let damageRejected=false;
  try{ backup.win.validateFamilyBackupBundle(damaged); }catch(e){ damageRejected=true; }
  ok('damaged or incomplete family bundles fail validation',damageRejected);
  bkev('state').gems=999;
  const restored=await backup.win.restoreFamilyBackupBundle(unlocked);
  ok('confirmed whole-family restore replaces the changed active save',restored&&bkev('state').gems===42);
  const restoredBalances=[];
  for(const profile of bkev('profileBook').profiles){
    const raw=await backup.win.storageGet(backup.win.profileSaveKey(profile.id));
    restoredBalances.push(JSON.parse(raw).gems);
  }
  ok('whole-family restore preserves separate progress for both climbers',
     JSON.stringify(restoredBalances.sort((a,b)=>a-b))===JSON.stringify([42,137]));
  backup.win.showScreen('screen-parent');
  ok('Parents UI explains local encryption and offers protected create/restore controls',
     !!backup.$('family-backup-pass')&&!!backup.$('family-backup-file')&&backup.$('screen-parent').textContent.includes('Times Quest does not receive'));

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
  ok('5s answer progresses even outside a 3s bonus window', ev('state').facts[wk2].rating === 5,
     `rating ${ev('state').facts[wk2].rating}`);
  ok('thinking time does not raise a weakness counter', ev('state').facts[wk2].slow === 0);
  await new Promise(r => setTimeout(r, 700));
  win.quitQuiz();
  win.setPref('window', 4000);

  section('Preference: round length drives every queue builder');
  ev('for(let b=0;b<10;b++) fact(2,b).rating=Math.max(4,factRating(2,b))');
  for (const n of [8, 16]) {
    win.setPref('roundLen', n);
    win.startPractice(2);
    const withWarmup = ev('quiz').queue.length;
    ok(`practice at ${n} (plus warm-ups)`, withWarmup >= n && withWarmup <= n + 3, `got ${withWarmup}`);
    win.quitQuiz();
    win.startTrial(2);
    ok(`challenge stays six questions with round setting ${n}`, ev('quiz').queue.length === 6, `got ${ev('quiz').queue.length}`);
    ok(`challenge needs five independent successes with round setting ${n}`, ev('quiz').needCorrect === 5, `got ${ev('quiz').needCorrect}`);
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
  const activeSaveKey=ev('profileSaveKey(activeProfileId)');
  const savedPrefs = JSON.parse(win.localStorage.getItem(activeSaveKey)).settings;
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
  ok('all sensory and round toggles present',
     ['timer','retry','calm','sound','clicks','ambience'].every(k => pb.includes(`toggleSetting('${k}')`)));
  ok('preference toggles expose switch state to assistive technology',
     Array.from(win.document.querySelectorAll('#parent-body .tg')).every(button=>button.getAttribute('role')==='switch'&&button.hasAttribute('aria-checked')));
  ok('heatmap separates collection from the optional speed bonus', pb.includes('optional 4s window') && pb.includes('Accurate answers count at any speed'), 'legend missing distinction');

  section('Parent dashboard still computes');
  let pErr = null;
  try { win.showScreen('screen-parent'); } catch(e){ pErr = e.message; }
  ok('parent dashboard renders', !pErr, pErr);
  ok('parent dashboard explains due, upcoming, secure, and recent retrieval performance',
     ['Due today','Due next 7 days','Recalled after 14+ days','Recent independent retrieval'].every(label=>$('parent-body').textContent.includes(label)));
  ok('heatmap has 169 cells + headers',
     win.document.querySelectorAll('.heat-cell').length === 169,
     String(win.document.querySelectorAll('.heat-cell').length));

  section('Persistence');
  win.saveState();
  await new Promise(r => setTimeout(r, 600));
  const raw = win.localStorage.getItem(ev('profileSaveKey(activeProfileId)'));
  ok('save written to the active child profile key', !!raw);
  const reparsed = JSON.parse(raw);
  ok('placed persisted', Array.isArray(reparsed.placed));
  ok('legacy fields still present', reparsed.owned && reparsed.equipped && reparsed.facts && reparsed.realms);
  ok('profile saves no longer overwrite the ambiguous legacy mirror',
     JSON.parse(win.localStorage.getItem('timesquest-save')).gems===137);

  section('PWA, viewport, and reduced-motion contract');
  const source=fs.readFileSync(HTML,'utf8'),sw=fs.readFileSync(require('path').join(PUBLIC,'sw.js'),'utf8');
  ok('standalone viewport synchronization can use the full device height',
     source.includes('syncAppViewportHeight') && source.includes('--app-height') && source.includes('display-mode: standalone'));
  ok('camp dock and sheet share the corrected bottom safe-area anchor',
     source.includes('bottom:max(4px,env(safe-area-inset-bottom))') && source.includes('bottom:calc(max(4px,env(safe-area-inset-bottom)) + 70px)'));
  ok('service-worker updates wait for the explicit in-app update action',
     sw.includes("type === 'SKIP_WAITING'") && sw.indexOf('self.skipWaiting()')>sw.indexOf("addEventListener('message'") && source.includes('applyAppUpdate'));
  ok('system reduced motion controls JS motion as well as CSS animation',
     source.includes('prefersReducedMotion()') && source.includes('@media (prefers-reduced-motion: reduce)'));

  console.log(`\n${'='.repeat(46)}\n  ${pass} passed, ${fail} failed\n${'='.repeat(46)}`);
  process.exit(fail ? 1 : 0);
})().catch(e => { console.error('HARNESS ERROR:', e); process.exit(2); });
