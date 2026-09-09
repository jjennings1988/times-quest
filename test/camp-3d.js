const assert=require('node:assert/strict');
const C=require('../public/camp-v2');
let count=0;
function test(name,fn){fn();count++;console.log('  ok  '+name);}
test('the prior 2.5D save migrates without changing ownership or object coordinates',()=>{
  const old=C.fresh();old.v=1;delete old.worldId;delete old.discoveries;old.gems=73;old.wood=4;old.objects[0].type='canvas';old.camera={x:23,y:-18,zoom:1.3};const before=structuredClone(old);
  const next=C.migrateSave(old);assert.equal(next.v,2);assert(C.validSave(next));assert.equal(next.gems,73);assert.equal(next.wood,4);assert.deepEqual(next.objects,old.objects);assert.deepEqual(next.inventory,old.inventory);assert.deepEqual(next.projects,old.projects);assert.deepEqual(old,before);
});
test('migration is idempotent and refuses unsupported worlds intact',()=>{const s=C.fresh();assert.equal(C.migrateSave(s),s);s.worldId='unknown-future-world';const before=structuredClone(s);assert.equal(C.migrateSave(s),null);assert.deepEqual(s,before);});
test('all three discoveries have a walking route from a normal starter save',()=>{const s=C.fresh();for(const d of C.world.discoveries){const path=C.route(s,s.explorer,{x:d.x,y:d.y});assert(path&&path.length);assert(path.every(p=>!C.world.blocked(p.x,p.y)));}});
test('the river can only be crossed on the bridge',()=>{const s=C.fresh(),path=C.route(s,s.explorer,{x:20,y:4});const wet=path.filter(p=>Math.abs(p.x+.5-C.world.river(p.y+.5))<1.65);assert(wet.length>1);assert(wet.every(p=>C.world.bridge(p.y+.5)));assert.equal(C.route(s,s.explorer,{x:17,y:10}),null);});
test('the explorer can save and reload outside the old 12 by 10 grid',()=>{const s=C.fresh();s.explorer={x:-5,y:2};s.discoveries=['stones'];s.camera.angle=Math.PI/2;const loaded=JSON.parse(JSON.stringify(s));assert(C.validSave(loaded));assert(C.route(loaded,loaded.explorer,{x:6,y:7}));assert.equal(loaded.camera.angle,Math.PI/2);});
test('building remains inside the original plot even when exploring elsewhere',()=>{const s=C.fresh();s.explorer={x:20,y:4};const r=C.command(s,{kind:'place',type:'fence',x:20,y:5});assert(!r.ok);assert.equal(s.inventory.fence,6);});
test('forest trunks block walking and out-of-world destinations are refused',()=>{const t=C.world.forest.find(t=>C.world.inside(Math.floor(t.x),Math.floor(t.z)));assert(C.world.blocked(Math.floor(t.x),Math.floor(t.z)));assert.equal(C.route(C.fresh(),{x:6,y:7},{x:26,y:20}),null);});
test('new fields are validated instead of silently resetting damaged saves',()=>{for(const change of [s=>s.camera.angle=Infinity,s=>s.discoveries=['unknown'],s=>s.explorer={x:90,y:2}]){const s=C.fresh();change(s);assert(!C.validSave(s));assert.equal(C.migrateSave(s),null);}});
test('learning while away from the clearing retains exploration and supplies',()=>{const s=C.fresh();s.explorer={x:20,y:4};s.discoveries=['bridge'];s.harvested=[0,1,2];const next=C.awardLearning(s,12);assert.equal(next.gems,132);assert.deepEqual(next.explorer,s.explorer);assert.deepEqual(next.discoveries,['bridge']);assert.deepEqual(next.harvested,[]);});
test('bridge height stays above water along its traversable deck',()=>{for(let x=16;x<=20;x++)assert(C.world.walkHeight(x,4.5)>0);});
console.log(`3D woodland: ${count} passed`);
