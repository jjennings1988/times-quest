/* 0.41 "Build with math": seed-plot arrays, deck areas, Mara's crate orders and guardian requests. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const copy=s=>JSON.parse(JSON.stringify(s));
const run=(s,cmd,ctx)=>{const r=C.command(s,cmd,ctx);assert.ok(r.ok,cmd.kind+': '+r.message);return r.save;};
// An open patch of land with plenty of plots and deck boards.
const land=()=>{const s=C.syncProgress(C.fresh(),0);s.objects=[];s.explorer={x:11,y:9};s.inventory.plot=60;s.inventory.deck=30;return s;};
const bed=(s,type,x,y,rows,cols,skip=null)=>{for(let dy=0;dy<rows;dy++)for(let dx=0;dx<cols;dx++){if(skip&&skip[0]===dx&&skip[1]===dy)continue;s=run(s,{kind:'place',type,x:x+dx,y:y+dy});}return s;};

// Rectangles become facts.
{let s=bed(land(),'plot',1,1,3,4);const [p]=C.patterns(s);
  check('a full rectangle of seed plots is an array of rows × columns',p&&p.type==='plot'&&p.rows===3&&p.cols===4&&p.count===12&&C.mathable(p));
  check('an unfinished bed is not an array yet',C.patterns(bed(land(),'plot',1,1,3,4,[3,2])).length===0);
  check('an L shape is not an array',C.patterns(bed(bed(land(),'plot',1,1,2,2),'plot',3,2,1,1)).length===0);
  s=bed(s,'deck',6,6,2,3);check('deck boards make their own area, separate from the garden',C.patterns(s).some(p=>p.type==='deck'&&p.rows===2&&p.cols===3));
  check('a single row counts for requests but is not a counting moment',(()=>{const r=C.patterns(bed(land(),'plot',1,1,1,4))[0];return r&&r.rows===1&&!C.mathable(r);})());}

// Counting what you built.
{let s=bed(land(),'plot',1,1,3,4);const key=C.patterns(s)[0].key,gems=s.gems;
  let r=C.command(s,{kind:'solve-pattern',key,answer:10});check('a miss keeps the bed and offers skip-counting, recorded as a first try',r.ok&&r.reviewEvent&&r.reviewEvent.correct===false&&r.reviewEvent.firstTry===true&&r.save.patternTry===key&&r.save.gems===gems);
  r=C.command(r.save,{kind:'solve-pattern',key,answer:12});check('the right count is a later try, solves the bed and pays 3 gems for a new fact',r.ok&&r.reviewEvent.correct&&r.reviewEvent.firstTry===false&&r.reviewEvent.a===3&&r.reviewEvent.b===4&&r.save.solved.includes(key)&&r.save.gems===gems+3&&r.save.factsBuilt.includes('plot:3x4'));
  let t=bed(r.save,'plot',5,5,4,3);const key2=C.patterns(t).find(p=>p.key!==key).key;const r2=C.command(t,{kind:'solve-pattern',key:key2,answer:12});
  check('the same fact the other way round is counted but pays nothing more',r2.ok&&r2.save.solved.includes(key2)&&r2.save.gems===t.gems);
  check('an empty answer is refused without changes',!C.command(s,{kind:'solve-pattern',key,answer:''}).ok);
  const moved=run(r.save,{kind:'store',id:r.save.objects.find(o=>o.type==='plot').id});check('changing a bed means it must be counted again',!C.patterns(moved).some(p=>p.key===key)&&!C.command(moved,{kind:'solve-pattern',key,answer:12}).ok);}

// Gardens and buildings keep apart.
{const s=land();const tent=run(s,{kind:'place',type:'bench',x:4,y:4});
  check('a seed plot cannot go under a building',!C.command(tent,{kind:'place',type:'plot',x:4,y:4}).ok);
  const g=bed(land(),'plot',2,2,2,2);check('a building cannot go on a garden bed',!C.command(g,{kind:'place',type:'bench',x:2,y:2}).ok);
  check('a deck can still carry furniture',C.command(bed(land(),'deck',2,2,1,2),{kind:'place',type:'bench',x:2,y:2}).ok);}

// Mara's orders: one fact as equal groups, two per learning adventure.
{let s=land();s.explorer={x:26,y:4};const qs=[{a:6,b:0},{a:3,b:5}];
  check('orders are packed at the store',!C.command({...land(),explorer:{x:2,y:2}},{kind:'start-activity',activity:'order',questions:qs}).ok);
  s=run(s,{kind:'start-activity',activity:'order',questions:qs});check('an order is one fact, preferring crates that are not empty',s.challenge.kind==='order'&&s.challenge.questions.length===1&&s.challenge.questions[0].a===3&&s.challenge.questions[0].b===5&&C.validSave(s));
  const before=s;s=run(s,{kind:'answer-activity',answer:15});check('a packed order pays 5 gems and 2 wood',s.gems===before.gems+5&&s.wood===before.wood+2&&s.orders===1&&!s.challenge);
  s=run(run(s,{kind:'start-activity',activity:'order',questions:qs}),{kind:'answer-activity',answer:15});
  check('two orders per learning adventure',s.orders===0&&!C.command(s,{kind:'start-activity',activity:'order',questions:qs}).ok);
  check('a learning adventure brings two more orders',C.awardLearning(s,0).orders===2);
  check('damaged order counts fail validation',!C.validSave({...copy(s),orders:5}));}

// Guardian requests, shaped by each family.
{check('each family asks for something of its own',C.request(0).text.includes('deck')&&C.request(1).text.includes('row')&&C.request(7).text.includes('7 rows'));
  const g7=bed(land(),'plot',2,0,7,2);check('seven rows answers the ×7 guardian (either way round)',C.requestMet(g7,7)&&C.requestMet(bed(land(),'plot',0,0,2,7),7)&&!C.requestMet(g7,6));
  check('×1 wants one long row; ×0 wants a deck for resting',C.requestMet(bed(land(),'plot',1,1,1,3),1)&&!C.requestMet(bed(land(),'plot',1,1,1,2),1)&&C.requestMet(bed(land(),'deck',1,1,2,2),0));
  let s=bed(land(),'plot',0,0,3,2);const gems=s.gems;check('an unmet request cannot be claimed',!C.command(s,{kind:'claim-request',family:5,day:'2026-09-26'}).ok);
  s=run(s,{kind:'claim-request',family:3,day:'2026-09-26'});check('a met request pays 10 gems once a day',s.gems===gems+10&&!C.command(s,{kind:'claim-request',family:3,day:'2026-09-26'}).ok&&C.command(s,{kind:'claim-request',family:3,day:'2026-09-27'}).ok);}

// A garden starter for everyone, once.
{const s=C.syncProgress(C.fresh(),0),again=C.syncProgress(s,0);check('every camp receives 12 seed plots and 6 deck boards once',s.inventory.plot===12&&again.inventory.plot===12&&s.arrivals.some(a=>a.type==='plot'));
  check('plots are cheap to add to',C.catalog.plot.price===1&&C.catalog.deck.price<=2);}

// The screens and the scene.
{const root=path.join(__dirname,'../public'),v2=fs.readFileSync(path.join(root,'camp-v2.js'),'utf8'),scene=fs.readFileSync(path.join(root,'camp-v2-scene.js'),'utf8'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  check('finishing a bed asks to count it, and a miss shows the rows to skip-count without giving the total',/function checkPatterns/.test(v2)&&/YOUR GARDEN IS AN ARRAY/.test(v2)&&/r===p\.rows-1\?'\?'/.test(v2));
  check('orders show the crates, and the Journal shows the guardian request',/cv2-crate/.test(v2)&&/TODAY’S GUARDIAN REQUEST/.test(v2)&&/request:\(\(\)=>\{const g=REALM_ORDER\.filter\(f=>state\.realms\[f\]\.conquered\)/.test(html));
  check('counted beds bloom and carry a signpost of their fact',/plot-bloom/.test(scene)&&/const factSign=p=>board/.test(scene)&&/save\.solved\|\|\[\]/.test(scene));
  check('the arrival card can be closed',/data-action="arrivals-ok" aria-label="Close"/.test(v2));}

console.log(`${count} build-with-math checks passed`);
