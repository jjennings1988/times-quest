/* 0.40 "It's all one world": one gem wallet, milestone kits, keepsakes that find the
   Story Stones, retuned stone, and a camp drawn in the map's hand. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {JSDOM}=require('jsdom');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const copy=s=>JSON.parse(JSON.stringify(s));
const root=path.join(__dirname,'../public');

// Milestone kits: retroactive, once, and only up to the families restored.
{const s=C.syncProgress(C.fresh(),9),again=C.syncProgress(s,9);
  check('each restored family sends its kit once, including earlier milestones',JSON.stringify(s.kitsGranted)==='[1,2,3,4,5,6,7,8,9]'&&s.inventory.stonehome===1&&s.inventory.cabin===1&&again.inventory.stonehome===1);
  check('kits beyond the families restored stay locked',!s.inventory.keep&&!s.kitsGranted.includes(10));
  check('arrivals list what came, for the camp to announce',s.arrivals.some(a=>a.kind==='kit'&&a.type==='stonehome')&&C.validSave(s));
  const room={...copy(s),objects:[]},r=C.command(room,{kind:'place',type:'stonehome',x:1,y:1});check('a kit builds free: gems, wood and stone are untouched',r.ok&&r.save.gems===s.gems&&r.save.wood===s.wood&&r.save.stone===s.stone&&r.save.inventory.stonehome===0);
  check('every milestone from 1 to 13 has a kit of real catalogue items',Array.from({length:13},(_,i)=>C.content.kits[i+1]).every(k=>k&&Object.keys(k).every(t=>C.catalog[t])));
  check('damaged kit records fail validation',!C.validSave({...copy(s),kitsGranted:[0]})&&!C.validSave({...copy(s),arrivals:[{kind:'kit',type:'nope'}]}));}

// Keepsakes find a place in the trophy garden, in map order, or wait in the backpack.
{let s=C.fresh();s.inventory.keepsake0=1;s.inventory.keepsake1=1;
  let r=C.autoPlace(s,'keepsake0',0);const [x0,y0]=C.content.trophySpots[0];
  check('a keepsake stands at its own spot by the Story Stones',r.placed&&r.placed.x===x0&&r.placed.y===y0&&r.save.objects.some(o=>o.type==='keepsake0'&&o.x===x0)&&!r.save.inventory.keepsake0);
  r=C.autoPlace(r.save,'keepsake1',0);check('the next keepsake takes the next free spot, never overlapping',r.placed&&!(r.placed.x===x0&&r.placed.y===y0));
  check('autoplacing costs nothing',r.save.gems===s.gems);
  const blocked=C.fresh();blocked.inventory.keepsake4=1;blocked.construction={objectId:blocked.objects[0].id};
  const w=C.autoPlace(blocked,'keepsake4',7);check('with no free spot the keepsake waits in the backpack and is still announced',!w.placed&&w.save.inventory.keepsake4===1&&w.save.arrivals.some(a=>a.type==='keepsake4'));
  check('all trophy spots are open land by the Story Stones',C.content.trophySpots.every(([x,y])=>C.buildable(C.fresh(),x,y)&&Math.hypot(x+5,y-2)<7));}

// Stone arrives fast enough for a second stone home in about a week.
{const s=C.syncProgress(C.fresh(),3),r=C.awardLearning(s,0);check('a learning adventure brings 4 stone once three realms are restored',r.stone===s.stone+4&&r.gems===s.gems);
  check('stone prices were eased',C.catalog.stonehome.stone<=20&&C.catalog.keep.stone<=34&&C.catalog.stonewall.stone<=3);}

// The camp is drawn like the map: ink pass, painted ground, shared season.
{const scene=fs.readFileSync(path.join(root,'camp-v2-scene.js'),'utf8'),ink=fs.readFileSync(path.join(root,'camp-ink.js'),'utf8'),sw=fs.readFileSync(path.join(root,'sw.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8'),v2=fs.readFileSync(path.join(root,'camp-v2.js'),'utf8');
  check('the camp is drawn through the ink pass, and low power skips it',/createInk/.test(scene)&&/quality==='low'\)renderer\.render\(scene,camera\);else ink\.render/.test(scene)&&/DepthTexture/.test(ink)&&/toSRGB/.test(ink));
  check('the ground is painted paper, not faceted tiles',/flatShading:false,map:groundTexture/.test(scene)&&/setAttribute\('uv'/.test(scene));
  check('the camp shares the map season',/season:window\.ChartPaint\?ChartPaint\.seasonFor/.test(html)&&/SEASON_TINT/.test(scene)&&/season:options\.season/.test(v2));
  check('the ink pass is cached for offline play',sw.includes("'./camp-ink.js'"));
  check('one gem symbol: the camp uses the same 💎 as the map',!/◆/.test(v2)&&/💎 \$\{s\.gems\}/.test(v2));
  check('a calmer screen: turning is a building tool and touch screens pinch to zoom',/cv2-mode-build .cv2-camera \[data-action\^=orbit\]\{display:block\}/.test(fs.readFileSync(path.join(root,'camp-v2.css'),'utf8'))&&!/data-action="night" class="cv2-sky"/.test(v2));}

// One wallet across the app.
(async()=>{
  const source=fs.readFileSync(path.join(root,'index.html'),'utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,name)=>`<script>${fs.readFileSync(path.join(root,name),'utf8')}</script>`);
  const dom=new JSDOM(source,{url:'https://camp-one-world.invalid',runScripts:'dangerously',pretendToBeVisual:true,beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};}});
  const w=dom.window,e=code=>w.eval(code);await new Promise(r=>setTimeout(r,80));
  try{
    e("state=defaultState();migrateState();state.settings.calm=true;state.settings.sound=false;activeProfileId='wallet';profileBook={v:1,active:'wallet',profiles:[{id:'wallet',name:'W',avatar:0}]};");
    e("state.gems=250;state.campV2=CampV2.fresh();state.campV2.gems=90;state.journey.pendingGems=0;deliverCampGrants();");
    check('the first merge takes the larger balance once, never the sum',e('state.gems')===250&&e('state.campV2.gems')===250&&e('state.walletUnified')===1);
    e("state.gems+=10;deliverCampGrants();");check('gems earned anywhere (like a daily quest) are spendable at camp',e('state.campV2.gems')===260);
    e("state.journey.pendingGems=12;state.gems+=12;deliverCampGrants();");check('a finished round is not counted twice',e('state.gems')===272&&e('state.campV2.gems')===272&&e('state.journey.pendingGems')===0);
    e("state=defaultState();migrateState();state.gems=5;state.campV2=null;");const camp=e("JSON.stringify(createCamp())");
    check('a first camp starts from the wallet with a one-time welcome gift',JSON.parse(camp).gems===35&&e('state.gems')===35&&JSON.parse(e("JSON.stringify(createCamp())")).gems===35);
    e("state=defaultState();migrateState();state.gems=40;state.campV2=CampV2.fresh();state.campV2.gems=40;state.walletUnified=1;state.realms[0].conquered=true;state.realms[1].conquered=true;state.journey.keepsakesDelivered=[];deliverCampGrants();");
    check('restored realms send keepsakes straight to the Story Stones',e("state.campV2.objects.filter(o=>o.type.startsWith('keepsake')).length")===2);
    e("state=defaultState();migrateState();state.gems=40;state.campV2=CampV2.fresh();state.campV2.gems=40;state.walletUnified=1;state.campV2.inventory.keepsake5=1;state.journey.keepsakesDelivered=[5];state.realms[5].conquered=true;deliverCampGrants();");
    check('keepsakes delivered before 0.40 walk out of the backpack once',e("state.campV2.objects.some(o=>o.type==='keepsake5')")&&!e("state.campV2.inventory.keepsake5")&&e('state.journey.keepsakeGarden')===1);
    e("state.campV2=CampV2.command(state.campV2,{kind:'store',id:state.campV2.objects.find(o=>o.type==='keepsake5').id}).save;deliverCampGrants();");
    check('a keepsake the child chose to store stays stored',e("state.campV2.inventory.keepsake5")===1);
    console.log(`${count} one-world camp checks passed`);
  }finally{dom.window.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
