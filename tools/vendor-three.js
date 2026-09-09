// Reproduce the local offline runtime after an intentional dependency update.
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'..');
const source=path.join(root,'node_modules/three');
const pinned=require('../package.json').dependencies.three;
const installed=JSON.parse(fs.readFileSync(path.join(source,'package.json'),'utf8')).version;
if(pinned!==installed)throw Error(`Expected Three.js ${pinned}; found ${installed}`);
const dest=path.join(root,'public/vendor/three');fs.mkdirSync(dest,{recursive:true});
for(const file of ['three.module.min.js','three.core.min.js'])fs.copyFileSync(path.join(source,'build',file),path.join(dest,file));
fs.copyFileSync(path.join(source,'LICENSE'),path.join(dest,'LICENSE'));
console.log(`Vendored Three.js ${installed}, including its MIT license.`);
