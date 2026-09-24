const assert=require('node:assert/strict'),M=require('../public/map-backdrop');
let checks=0;const check=(name,value)=>{assert.ok(value,name);checks++;};
for(let f=1;f<=12;f++){const pts=M.starLayout(f),lit=f===9?pts.length-1:pts.length;check(`×${f} constellation lights exactly ${f} stars`,lit===f);}
check('×9 shows ten stars with one taken away',M.starLayout(9).length===10);
check('×0 is an empty ring: stars around nothing',M.starLayout(0).every(([x,y])=>Math.hypot(x,y)>15));
const groups=(f)=>{const pts=M.starLayout(f),links=M.linksFor(f,pts),parent=pts.map((_,i)=>i),find=i=>parent[i]===i?i:(parent[i]=find(parent[i]));for(const[a,b]of links)parent[find(a)]=find(b);return new Set(pts.map((_,i)=>find(i))).size;};
check('×6 draws five joined stars and one separate group',groups(6)===2);
check('×7 draws a group of five and a separate group of two',groups(7)===2&&M.linksFor(7,M.starLayout(7)).some(([a,b])=>a===5&&b===6));
check('×11 draws ten joined and one more',groups(11)===2);
check('×12 draws ten joined and two more',groups(12)===2);
check('every realm has a constellation name',[0,1,2,3,4,5,6,7,8,9,10,11,12].every(f=>M.CONSTELLATIONS[f]?.title));
check('the sky follows the moonlit override',M.skyNow({night:true})==='night');
console.log(`${checks} map backdrop checks passed`);
