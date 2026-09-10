const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {JSDOM}=require('jsdom'),Chapters=require('../public/guardian-chapters'),Camp=require('../public/camp-v2');
let checks=0;function check(name,value){assert.ok(value,name);checks++;}
async function main(){
  const initial=Camp.fresh(),grid=Camp.content.landGrid(initial),before=JSON.stringify(initial);
  const has=(list,edge)=>list.some(e=>e.join(',')===edge.join(','));
  check('free meadow has solid edges even without a land grant',has(Camp.content.landGrid({...initial,land:[]}).open,[-8,-3,-7,-3]));
  check('future woodland is dashed before ownership',has(grid.future,[-32,-3,-31,-3]));
  const opened=Camp.content.landGrid({...initial,land:[...initial.land,'westReach']});
  check('claiming land moves its internal edges to the solid layer',has(opened.open,[-31,-2,-30,-2])&&!has(opened.future,[-31,-2,-30,-2]));
  check('tree removal does not misrepresent land ownership',JSON.stringify(Camp.content.landGrid({...initial,cleared:['anything']}))===JSON.stringify(grid));
  check('protected garden has no interior grid lines',[...grid.open,...grid.future].every(([x,y,u,v])=>!(x>-7&&u<-3&&y>0&&v<4)));
  const edges=[...grid.open,...grid.future].map(e=>e.join(','));check('shared parcel edges are drawn only once',new Set(edges).size===edges.length);
  check('grid calculations preserve player save',JSON.stringify(initial)===before);
  check('grid geometry is bounded for the full world',edges.length<4000);
  for(let f=1;f<=12;f++){
    const d=Chapters.chapters[f],start=Chapters.lessonState(f);check(`chapter ${f} cannot bypass manipulation`,Chapters.advance(f,start).step===0);
    check(`chapter ${f} has mathematically consistent questions`,Chapters.questions(f).every(q=>q.ans===q.a*q.b));
    check(`chapter ${f} malformed state is bounded`,Chapters.lessonState(f,{groups:99,step:99}).groups===12);
  }
  const html=fs.readFileSync(path.join(__dirname,'../public/index.html'),'utf8').replace(/<script src="([^"]+\.js)"><\/script>/g,(_,n)=>`<script>${fs.readFileSync(path.join(__dirname,'../public',n),'utf8')}</script>`);
  const errors=[],dom=new JSDOM(html,{runScripts:'dangerously',pretendToBeVisual:true,url:'https://chapters.test/',beforeParse(w){w.HTMLElement.prototype.scrollIntoView=()=>{};w.confirm=()=>true;w.addEventListener('error',e=>errors.push(e.message));}});
  const w=dom.window,ev=s=>w.eval(s),$=id=>w.document.getElementById(id);
  try{
    await new Promise(r=>setTimeout(r,20));
    for(let f=1;f<=12;f++){
      ev(`quiz=null;state=defaultState();migrateState();state.journey.routes=[${f}];`);w.beginLesson(f);
      check(`chapter ${f} renders its own scene and interactive groups`,$('journey-body').textContent.includes(Chapters.chapters[f].title)&&!!$('journey-body').querySelector('.guardian-landmark'));
      w.startGuardianTry();check(`chapter ${f} cannot skip directly to independent check`,ev('quiz')===null);
      for(const target of Chapters.chapters[f].targets){
        let guard=0;while(ev('state.journey.current.chapter.groups')!==target&&guard++<20)w.changeGuardianGroups(ev('state.journey.current.chapter.groups')<target?'add':'remove');
        w.advanceGuardianLesson();
      }
      const saved=JSON.stringify(ev('state'));ev(`state=JSON.parse(${JSON.stringify(saved)});migrateState()`);w.resumeLesson();
      check(`chapter ${f} reload keeps completed manipulation and comparison`,$('journey-body').textContent.includes('Same strategy. A new amount.')&&$('journey-body').querySelectorAll('.chapter-model').length===2);
      w.startGuardianTry();check(`chapter ${f} starts four untimed transfer questions`,ev('quiz.queue.length')===4&&!ev('quiz.timed'));
      check(`chapter ${f} teaching does not award a challenge star`,!ev(`state.realms[${f}].trial`));
      ev(`quiz=null;state.realms[${f}].trial=true;`);w.startBoss(f);
      check(`chapter ${f} encounter uses restoration scenery`,$('battle-stage').classList.contains('guardian-restoration')&&$('battle-name').textContent===Chapters.chapters[f].goal);
      ev('quiz.battle.hp=0');w.updateBossBattleUI();check(`chapter ${f} all three scene stages restore`,$('guardian-restoration-scene').querySelectorAll('.restored').length===3);
    }
    ev('quiz=null');w.guardianEncounterScenery();check('restoration scenery cleans up outside a realm battle',!$('guardian-restoration-scene'));
    check('no chapter runtime errors',errors.length===0);
    console.log(`${checks} guardian chapter and land grid checks passed`);
  }finally{dom.window.close();}
}
main().catch(e=>{console.error(e);process.exitCode=1;});
