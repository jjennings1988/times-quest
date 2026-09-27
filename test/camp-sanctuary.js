/* 0.46 "The sanctuary": the Guardian Grove as a place guardians chose, not an enclosure. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const K=C.content,root=path.join(__dirname,'../public'),d=fs.readFileSync(path.join(root,'camp-world-details.js'),'utf8');

// Paths.
{const loop=K.roadLines.find(r=>r.id==='sanctuary'),spur=K.roadLines.find(r=>r.id==='heart'),s=C.fresh();
  check('a path loops through the grove from the gate',loop&&loop.pts[0][1]>2&&K.inZone(K.grove,Math.floor(loop.pts[40][0]),Math.floor(loop.pts[40][1])));
  check('a spur leads to the heart tree at the centre',spur&&Math.hypot(spur.pts[spur.pts.length-1][0]-72,spur.pts[spur.pts.length-1][1]+4.4)<.5);
  check('the path never runs through a guardian’s home',K.guardianPads.every(p=>!K.roadAt(p.x,p.y)));
  check('the path passes close to every home, so each is a short step away',K.guardianPads.every(p=>loop.pts.some(([x,y])=>Math.hypot(x-p.x-.5,y-p.y-.5)<3.2)));
  check('every home is reachable, and only through the gate',K.guardianPads.every(p=>{const r=C.route(s,{x:38,y:5},{x:p.x,y:p.y+1});return r&&r.some(c=>c.y===4&&c.x>=70&&c.x<74)&&r.every(c=>!K.groveFence(c.x,c.y));}));}

// The look.
check('no iron railings: the edge is a ring of old trees and mossy boulders',/a ring of old trees and mossy boulders/.test(d)&&!/'#637b69',x\+\.5,y\+h/.test(d));
check('lanterns glow either side of the arch',/for\(const x of \[69\.6,74\.4\]\)/.test(d));
check('each of the thirteen guardians has a home suited to its realm',['ghost','bunny','fox','monkey','turtle','frog','bee','wolf','penguin','owl','robot','parrot','dragon'].every(k=>d.includes(`kind==='${k}'`))&&/if\(g\?\.defeated\)home\(pad\.kind/.test(d));
check('a spot not yet earned is only a quiet marker stone, not an empty bed',/only a quiet marker stone/.test(d)&&!/Unwon guardians have an empty, numbered welcome bed\.\n\s*const numberCanvas[\s\S]*?piece\(landscape,cylinderG,g\?\.defeated\?'#b6c29b'/.test(d));
check('the heart tree glows gold once all thirteen guardians are home',/guardians\.every\(g=>g\.defeated\)\)for\(let i=0;i<24/.test(d));
check('guardians stroll to the heart tree and back, and stay home in calm mode',/a\.visit\)\{const u=calm\?0:/.test(d));

console.log(`${count} sanctuary checks passed`);
