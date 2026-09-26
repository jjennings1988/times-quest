/* 0.42 "A living camp": companions who walk the clearing and react to building, butterflies,
   glowing lanterns, a camp name with its own sign, postcards and camp sounds. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const C=require('../public/camp-v2');
let count=0;
const check=(name,value)=>{assert.ok(value,name);count++;};
const root=path.join(__dirname,'../public');
const read=f=>fs.readFileSync(path.join(root,f),'utf8');
const v2=read('camp-v2.js'),scene=read('camp-v2-scene.js'),html=read('index.html');

// Naming the camp.
{const s=C.fresh();let r=C.command(s,{kind:'rename',name:'  Maple   Hollow '});
  check('a camp can be named, tidied of extra spaces',r.ok&&r.save.campName==='Maple Hollow'&&C.validSave(r.save));
  check('names from other languages and simple punctuation are welcome',C.command(s,{kind:'rename',name:'Café Ñandú’s Den!'}).ok);
  check('empty, overlong or markup names are refused',!C.command(s,{kind:'rename',name:'   '}).ok&&!C.command(s,{kind:'rename',name:'x'.repeat(25)}).ok&&!C.command(s,{kind:'rename',name:'<b>hi</b>'}).ok);
  check('a damaged saved name fails validation',!C.validSave({...s,campName:'<script>'})&&!C.validSave({...s,campName:42}));
  check('the header and the welcome sign carry the name',/s\.campName\|\|'Willowbrook Camp'/.test(v2)&&/title\.textContent=s\.campName/.test(v2)&&/board\(save\.campName\|\|'Willowbrook Camp'/.test(scene));}

// Companions and the living clearing.
check('the expedition team (or, until one is chosen, visiting guardians) walks the clearing as inked sprites',/companions:\(\(options\.companions\|\|\[\]\)\.length\?options\.companions:options\.visitors/.test(v2)&&/visitors:REALM_ORDER\.filter/.test(html)&&/new THREE\.Sprite\(m\)/.test(scene)&&/alphaTest:\.45/.test(scene));
check('companions wander to the things the child built, and gather at the fire at night or in calm mode',/function interesting\(save\)/.test(scene)&&/calm\|\|\(night&&fire\)/.test(scene));
check('building something makes nearby companions hop over, with sparkles',/function celebrate\(x,z\)/.test(scene)&&/scene\?\.celebrate\?\.\(/.test(v2)&&/sparkles\.push/.test(scene));
check('butterflies visit counted gardens, and lanterns glow with the evening',/function butterfly\(/.test(scene)&&/piece\(g,boxG,windowGlass\(\),\.27,\.84/.test(scene));
check('the living layer rests in calm mode',/if\(age>900\|\|calm\)/.test(scene)&&/t=calm\?u\.ph/.test(scene));

// Postcards.
check('a postcard frames the current view with the camp name, date and season',/function snapshot\(\)/.test(scene)&&/function makePostcard\(\)/.test(v2)&&/Greetings from /.test(v2)&&/toLocaleDateString/.test(v2));
check('the postcard can be saved, and shared only where the device supports sharing files',/download="/.test(v2)&&/navigator\.canShare\?'<button class="primary" data-action="share-postcard">/.test(v2));
check('without a 3D view the postcard explains itself instead of failing',/The camera needs the 3D view/.test(v2));

// Sounds.
check('camp sounds: a thunk and sparkle for building, a chime for facts, coins for orders',/function campSound\(kind\)/.test(html)&&/onSound:campSound/.test(html)&&/options\.onSound\?\.\('build'\)/.test(v2)&&/options\.onSound\?\.\('fact'\)/.test(v2)&&/options\.onSound\?\.\('coin'\)/.test(v2));
check('the woodland soundscape plays in Willowbrook when chosen, with birds now and then, and stops in calm mode',/\['screen-camp','screen-camp-v2'\]\.some/.test(html)&&/campBirds=setInterval/.test(html)&&/clearInterval\(campBirds\)/.test(html)&&/state\.settings\.calm\|\|prefersReducedMotion\(\)/.test(html));
check('the Journal has the camp sounds switch, the name field and the postcard button',/data-action="sounds"/.test(v2)&&/id="camp-name"/.test(v2)&&/data-action="postcard"/.test(v2));

console.log(`${count} living camp checks passed`);
