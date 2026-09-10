/* Original village and guardian-grove geometry. No external art or runtime assets. */
export function createWorldDetails(api) {
  const {THREE,scene,world,content,guardians,geo,mat,piece,box,instance,newBuilding,tree,pathModel,roadMaterials,groundShade,sphereG,rockG,cylinderG,coneG,boxG}=api;
  const picks=new THREE.Group(),landscape=new THREE.Group(),residents=[],textures=[],roadGeometry=[];
  scene.add(picks);
  const ringG=geo('garden-ring',()=>new THREE.TorusGeometry(1,.075,5,32));
  const roundG=geo('round-creature',()=>new THREE.SphereGeometry(1,12,8));
  const at=(x,z)=>world.groundHeight(x,z);
  function flower(parent,x,y,z,color='#e3b2aa'){
    box(parent,'#71916b',x,y+.18,z,.025,.36,.025);
    for(let i=0;i<4;i++){const a=i*Math.PI/2;piece(parent,rockG,color,x+Math.sin(a)*.07,y+.37,z+Math.cos(a)*.07,.085,.05,.085);}
    piece(parent,roundG,'#f4d991',x,y+.39,z,.045,.04,.045);
  }
  function arch(parent,x,z,width=2.8){const y=at(x,z);
    for(const sign of [-1,1]){box(parent,'#c9c5ad',x+sign*width/2,y+1,z,.33,2,.42);for(let j=0;j<4;j++)box(parent,'#dfd8bc',x+sign*width/2,y+.23+j*.5,z,.41,.12,.49);}
    const shape=geo('garden-arch'+width,()=>new THREE.TorusGeometry(width/2,.19,5,16,Math.PI));piece(parent,shape,'#d8d2b7',x,y+2,z);
    for(let i=0;i<12;i++){const a=i/11*Math.PI;piece(parent,rockG,i%3?'#789970':'#9bb786',x+Math.cos(a)*width/2,y+2+Math.sin(a)*width/2,z+.19,.23,.18,.18);if(i%3===0)flower(parent,x+Math.cos(a)*width/2,y+1.85+Math.sin(a)*width/2,z+.25,'#dba6ad');}
  }
  // Continuous ground-following surfaces avoid square steps or seams on slopes.
  const roadChunks=new Map();
  for(const road of content.roads){const key=Math.floor(road.x/16)+','+Math.floor(road.y/16)+road.kind;let chunk=roadChunks.get(key);if(!chunk)roadChunks.set(key,chunk={kind:road.kind,vertices:[],uv:[]});
    for(const [dx,dz] of [[0,0],[0,1],[1,0],[1,0],[0,1],[1,1]]){const x=road.x+dx,z=road.y+dz;chunk.vertices.push(x,at(x,z)+.075,z);chunk.uv.push(dx,dz);}
    for(const [dx,dz] of [[0,-1],[1,0],[0,1],[-1,0]])if(!content.roadAt(road.x+dx,road.y+dz)){const x=road.x+.5+dx*.48,z=road.y+.5+dz*.48,y=at(x,z),curb=box(landscape,road.kind==='trail'?'#a99e7e':'#d3c9ad',x,y+.08,z,dx?.065:1,.065,dx?1:.065);if(dx)curb.rotation.x=-Math.atan(at(x,z+.5)-at(x,z-.5));else curb.rotation.z=Math.atan(at(x+.5,z)-at(x-.5,z));curb.castShadow=false;}
    if(road.kind==='trail'&&(road.x+road.y)%3===0)piece(landscape,rockG,'#d6c6a2',road.x+.3,at(road.x+.3,road.y+.4)+.09,road.y+.4,.08,.02,.065);
  }
  for(const chunk of roadChunks.values()){const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(chunk.vertices,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(chunk.uv,2));g.computeVertexNormals();roadGeometry.push(g);const mesh=new THREE.Mesh(g,roadMaterials[chunk.kind]);mesh.receiveShadow=true;scene.add(mesh);}
  // An enclosed valley: near forest silhouettes, distant faceted ridges, and river exits.
  const boundary=content.bounds;
  function edgeTree(x,z,index){if(Math.abs(x-world.river(z))<3.5)return;tree(landscape,x,at(x,z),z,1.15+(index%5)*.14,index%4===0);}
  let edgeIndex=0;for(let layer=0;layer<3;layer++){const pad=2+layer*2.4;for(let x=boundary.minX-pad;x<=boundary.maxX+pad;x+=3){edgeTree(x+Math.sin(x)*.35,boundary.minY-pad,edgeIndex++);edgeTree(x,boundary.maxY+pad,edgeIndex++);}for(let z=boundary.minY;z<=boundary.maxY;z+=3){edgeTree(boundary.minX-pad,z,edgeIndex++);edgeTree(boundary.maxX+pad,z+.5,edgeIndex++);}}
  const peakG=geo('valley-peak',()=>new THREE.ConeGeometry(1,1,6));
  function mountain(x,z,i){const h=9+(i%5)*2.1,y=at(x,z);const m=piece(landscape,peakG,['#82998c','#91a699','#768e87'][i%3],x,y+h/2-2,z,6.8,h,6.5);m.rotation.y=i*.71;piece(landscape,rockG,'#8d9e89',x+3,y+1,z+1,5.5,4.4,5);if(i%3===0)piece(landscape,peakG,'#c2cbbb',x,y+h-3,z,1.2,2.1,1.15);}
  for(let x=boundary.minX-8,i=0;x<=boundary.maxX+8;x+=10,i++){mountain(x,boundary.minY-14,i);mountain(x,boundary.maxY+14,i+2);}for(let z=boundary.minY-5,i=0;z<=boundary.maxY+5;z+=10,i++){mountain(boundary.minX-14,z,i+1);mountain(boundary.maxX+14,z,i+3);}
  // Guardian Grove is a separate woodland sanctuary with one welcoming entrance.
  const grove=content.grove;
  for(let x=grove.x;x<grove.x+grove.w;x++)for(let z=grove.y;z<grove.y+grove.h;z++){if(!content.groveFence(x,z))continue;const y=at(x+.5,z+.5),alongX=z===grove.y||z===grove.y+grove.h-1;
    box(landscape,'#b9bca8',x+.5,y+.20,z+.5,alongX?1:.34,.4,alongX?.34:1);
    for(const h of [.61,1.15])box(landscape,'#637b69',x+.5,y+h,z+.5,alongX?1:.065,.065,alongX?.065:1);
    for(let j=0;j<3;j++){const offset=(j-1)*.31;box(landscape,'#637b69',x+.5+(alongX?offset:0),y+.85,z+.5+(alongX?0:offset),.045,1.04,.045);piece(landscape,rockG,'#d4bd81',x+.5+(alongX?offset:0),y+1.40,z+.5+(alongX?0:offset),.07,.13,.07);}
    if((alongX?x:z)%3===0){box(landscape,'#d1cfb7',x+.5,y+.79,z+.5,.44,1.57,.44);piece(landscape,coneG,'#71917c',x+.5,y+1.72,z+.5,.37,.29,.37);}
  }
  arch(landscape,72,4.5,3.9);
  for(const [i,p] of content.guardianTrail.entries()){if(i===0)continue;const x=p[0]-.65,z=p[1]+.4,y=at(x,z);piece(landscape,rockG,'#aab29a',x,y+.16,z,.45,.3,.38);box(landscape,'#877250',x,y+.65,z,.07,.95,.07);box(landscape,'#e1c487',x,y+1.13,z,.22,.28,.22);piece(landscape,coneG,'#698776',x,y+1.34,z,.22,.17,.22);}
  // A quiet ring of inlaid stones marks the middle without obstructing the walkway.
  for(let i=0;i<13;i++){const a=i*Math.PI*2/13,x=72.5+Math.sin(a)*2.7,z=-6.5+Math.cos(a)*2.7;piece(landscape,cylinderG,i%2?'#d5ceaf':'#9eb8a5',x,at(x,z)+.045,z,.24,.055,.24);}
  // Reeds and washed stones soften the riverbank without blocking walking routes.
  for(let z=-16;z<33;z+=.8){if(world.bridge(z))continue;for(const sign of [-1,1]){const x=world.river(z)+sign*(2.3+Math.sin(z*3)*.15),y=at(x,z);for(let i=0;i<3;i++)piece(landscape,coneG,i%2?'#7f9e78':'#9db08a',x+i*.07,y+.22,z+i*.06,.035,.46,.035);if(Math.floor(z*10)%4===0)piece(landscape,rockG,'#b8baa4',x+sign*.17,y+.06,z,.21,.11,.26);}}
  // Market canopies, produce crates and hanging lanterns.
  for(const [i,x] of [29,33,37].entries()){
    const z=-10,y=at(x,z),g=new THREE.Group();g.position.set(x,y,z);
    for(const px of [-.8,.8])for(const pz of [-.5,.5])box(g,'#957449',px,.95,pz,.07,1.9,.07);
    for(let j=0;j<6;j++){const cover=box(g,j%2?'#f1e1b9':['#bb816b','#7c9c9a','#9891af'][i],-.72+j*.29,1.96,0,.28,.07,1.45);cover.rotation.x=.1;}
    box(g,'#b79563',0,.66,.15,1.7,.12,.8);
    for(let j=0;j<4;j++){box(g,'#957449',-.6+j*.4,.83,.13,.32,.26,.55);for(let k=0;k<3;k++)piece(g,roundG,['#d5a15c','#bf7f63','#9caf71'][i],-.6+j*.4,.99,-.04+k*.16,.105,.11,.1);}
    landscape.add(g);
  }
  for(const [x,z] of [[22,3],[27,-5],[36,6],[36,19],[46,8],[48,19],[54,3]]){
    const y=at(x,z);box(landscape,'#697d71',x,y+1,z,.075,2,.075);box(landscape,'#eacb89',x,y+2,z,.25,.35,.25);piece(landscape,coneG,'#697d71',x,y+2.28,z,.24,.24,.24);groundShade(landscape,x,z,1,1);
  }
  // Fountain courtyard, flowering borders and two pergolas give the town a destination.
  const gx=51,gz=17,gy=at(gx,gz);
  piece(landscape,cylinderG,'#c9c5ad',gx,gy+.12,gz,2.3,.22,2.3);
  piece(landscape,cylinderG,'#619da0',gx,gy+.25,gz,1.85,.04,1.85);
  for(let i=0;i<20;i++){const a=i*Math.PI/10;box(landscape,'#dcd5bc',gx+Math.sin(a)*2.02,gy+.36,gz+Math.cos(a)*2.02,.41,.45,.41);}
  piece(landscape,cylinderG,'#b6b6a0',gx,gy+.75,gz,.27,1.1,.27);
  piece(landscape,cylinderG,'#dfd7b8',gx,gy+1.27,gz,.79,.14,.79);
  piece(landscape,cylinderG,'#72b9b7',gx,gy+1.37,gz,.63,.03,.63);
  piece(landscape,roundG,'#a7d8ca',gx,gy+1.56,gz,.13,.29,.13);
  const fountain=new THREE.Group();for(let i=0;i<12;i++){const a=i*Math.PI/6;piece(fountain,roundG,'#a6d6ca',Math.sin(a)*.85,.65+(i%3)*.16,Math.cos(a)*.85,.035,.19,.035);}fountain.position.set(gx,gy,gz);scene.add(fountain);
  for(let i=0;i<90;i++){const a=i*.618*Math.PI*2,r=3.3+(i%5)*.21,x=gx+Math.sin(a)*r,z=gz+Math.cos(a)*r;flower(landscape,x,at(x,z),z,i%3?'#dba2ab':'#e9d99c');}
  arch(landscape,48,20,2.5);
  for(const [x,z] of [[24,-4],[34,-4],[49,10],[55,20],[54,10],[22,20]]){const t=tree(landscape,x,at(x,z),z,.78,true);for(let i=0;i<5;i++)piece(t,roundG,'#d79989',Math.sin(i*2.4)*.65,2.55,Math.cos(i*2.4)*.6,.26,.23,.26);}
  // Chimneys, a roof clock and a turning mill wheel are recognizable landmarks.
  const clock=new THREE.Group();clock.position.set(32,at(32,7)+3.3,7.5);box(clock,'#c8c9b5',0,.5,0,1.1,1.7,1.1);piece(clock,coneG,'#738f98',0,1.62,0,1,1.1,1);
  for(let side=0;side<4;side++){const dial=new THREE.Group();dial.rotation.y=side*Math.PI/2;clock.add(dial);const face=piece(dial,cylinderG,'#f1e1b9',0,.68,.57,.39,.05,.39);face.rotation.x=Math.PI/2;box(dial,'#627668',0,.8,.62,.035,.26,.02);box(dial,'#627668',.12,.68,.63,.25,.035,.02);}landscape.add(clock);
  const wheel=new THREE.Group();const rim=piece(wheel,ringG,'#896943',0,0,0,1.08,1.08,1);for(let i=0;i<12;i++){const a=i*Math.PI/6,m=box(wheel,'#a28353',Math.cos(a)*.6,Math.sin(a)*.6,0,1.2,.09,.11);m.rotation.z=a;const paddle=box(wheel,'#b39564',Math.cos(a)*1.12,Math.sin(a)*1.12,0,.28,.3,.53);paddle.rotation.z=a;}wheel.position.set(20.75,at(21,14)+1.1,14.5);wheel.rotation.y=Math.PI/2;scene.add(wheel);

  // Thirteen small habitats. Unwon guardians have an empty, numbered welcome bed.
  const numberCanvas=document.createElement('canvas');numberCanvas.width=1024;numberCanvas.height=128;const ctx=numberCanvas.getContext('2d');ctx.font='bold 60px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff7dc';for(let i=0;i<13;i++)ctx.fillText('×'+i,i*78+39,64);const numberTexture=new THREE.CanvasTexture(numberCanvas);numberTexture.colorSpace=THREE.SRGBColorSpace;textures.push(numberTexture);
  const numberMat=new THREE.MeshBasicMaterial({map:numberTexture,transparent:true,side:THREE.DoubleSide});
  const numberMaterials=[numberMat];
  for(const pad of content.guardianPads){
    const g=guardians.find(g=>g.family===pad.family),x=pad.x+.5,z=pad.y+.5,y=at(x,z);
    piece(landscape,cylinderG,g?.defeated?'#b6c29b':'#a8b396',x,y+.075,z,1.43,.14,1.43);
    const ring=piece(landscape,ringG,'#d8d0af',x,y+.18,z,1.43,1.43,1);ring.rotation.x=-Math.PI/2;
    for(let i=0;i<8;i++){const a=i*Math.PI/4;flower(landscape,x+Math.sin(a)*1.52,y,z+Math.cos(a)*1.52,g?.defeated?'#e9c282':'#a9b997');}
    box(landscape,'#947b55',x,y+.37,z+1.55,.82,.56,.10);
    const numberG=geo('guardian-number-'+pad.family,()=>{const pg=new THREE.PlaneGeometry(.8,.45),uv=pg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,(pad.family*78+uv.getX(i)*78)/1024);return pg;});
    piece(landscape,numberG,numberMat,x,y+.4,z+1.61);piece(landscape,numberG,numberMat,x,y+.4,z+1.49).rotation.y=Math.PI;
    if(g?.defeated){const model=creature(pad.kind,g.color);const compact=instance(model,false);compact.position.set(x,y+.16,z);scene.add(compact);residents.push({root:compact,x,z,y:y+.16,kind:pad.kind,family:pad.family,angle:pad.angle});}
    const proxy=new THREE.Mesh(cylinderG,new THREE.MeshBasicMaterial({visible:false}));proxy.position.set(x,y+1,z);proxy.scale.set(1.3,2.7,1.3);proxy.userData.guardian=pad.family;picks.add(proxy);
  }
  // Destinations have visible signs as well as Journal navigation.
  for(const place of content.locations.filter(p=>!['store','fish'].includes(p.id))){const g=new THREE.Group();g.position.set(place.x+.5,at(place.x+.5,place.y+.5),place.y+.5);box(g,'#927a55',0,.6,0,.08,1.2,.08);box(g,'#e4ce9e',0,1.02,0,.92,.42,.1);piece(g,rockG,place.id==='sanctuary'?'#aa91b2':'#6d9b98',0,1.02,.09,.16,.14,.06);g.userData.location=place.id;picks.add(g);}
  instance(landscape);picks.updateMatrixWorld(true);

  function creature(kind,color){const g=new THREE.Group(),tint='#'+new THREE.Color(color).lerp(new THREE.Color('#f4e8ca'),.30).getHexString(),cream='#f3dfba',dark='#334b49';
    let bodyY=.7,headY=1.27;
    if(kind==='turtle'){bodyY=.43;headY=.63;piece(g,roundG,'#73926b',0,.50,-.12,.65,.43,.66);for(let i=0;i<7;i++){const a=i*2.4;piece(g,rockG,'#a7b98a',Math.sin(a)*.38,.78,Math.cos(a)*.4-.12,.2,.095,.22);}}
    else if(kind==='robot'){box(g,tint,0,.72,0,.7,.75,.47);box(g,'#d4c9aa',0,1.32,0,.8,.57,.52);box(g,'#576e70',0,1.36,.28,.64,.25,.04);box(g,'#bea66d',0,1.79,0,.045,.34,.045);piece(g,roundG,'#e9c87c',0,1.97,0,.10,.10,.10);}
    else if(kind==='ghost'){piece(g,roundG,'#e8e8d7',0,.95,0,.55,.76,.47);for(let i=0;i<5;i++)piece(g,roundG,'#e8e8d7',-.38+i*.19,.36,0,.15,.2,.38);}
    else {piece(g,roundG,tint,0,bodyY,0,.48,kind==='penguin'?.68:.55,.41);piece(g,roundG,cream,0,bodyY,.32,.31,.4,.11);}
    if(!['robot','ghost'].includes(kind))piece(g,roundG,tint,0,headY,kind==='turtle'?.52:.13,.45,.43,.38);
    const eyeY=kind==='ghost'?1.15:kind==='robot'?1.37:headY+.10,eyeZ=kind==='turtle'?.85:kind==='ghost'?.40:kind==='robot'?.32:.46;
    for(const sign of [-1,1]){if(kind==='frog')piece(g,roundG,tint,sign*.30,headY+.29,.16,.22,.23,.23);piece(g,roundG,cream,sign*.16,eyeY,eyeZ,.11,.14,.055);piece(g,roundG,dark,sign*.16,eyeY,eyeZ+.045,.057,.08,.035);piece(g,roundG,'#ffffff',sign*.16-.015,eyeY+.026,eyeZ+.071,.016,.024,.008);}
    if(['bunny','fox','wolf'].includes(kind)){for(const sign of [-1,1]){const e=piece(g,kind==='bunny'?roundG:coneG,tint,sign*.27,kind==='bunny'?1.94:1.76,.05,kind==='bunny'?.13:.19,kind==='bunny'?.54:.48,.13);e.rotation.z=-sign*.15;piece(g,roundG,'#d9aaa1',sign*.27,kind==='bunny'?1.96:1.75,.14,.06,kind==='bunny'?.33:.15,.02);}piece(g,roundG,cream,0,1.13,.49,.25,.16,.12);piece(g,roundG,dark,0,1.19,.6,.07,.055,.05);const tail=piece(g,roundG,tint,.41,.49,-.35,.18,.21,.51);tail.rotation.y=-.8;}
    if(['owl','parrot','penguin','bee','dragon'].includes(kind)){for(const sign of [-1,1]){const wing=piece(g,roundG,kind==='bee'?'#dce5df':kind==='dragon'?'#d1a277':tint,sign*.51,.98,-.03,kind==='bee'?.42:.23,.37,.12);wing.rotation.z=sign*.45;}if(kind!=='bee')piece(g,coneG,kind==='parrot'?'#d6ad65':'#d5b379',0,headY-.04,.54,.13,.24,.18).rotation.x=Math.PI/2;}
    if(kind==='bee'){for(let i=0;i<3;i++){const band=piece(g,geo('bee-band',()=>new THREE.TorusGeometry(.4,.055,5,16)),dark,0,.45+i*.23,0);band.rotation.x=Math.PI/2;}for(const x of [-.20,.20]){box(g,dark,x,1.77,.03,.03,.28,.03);piece(g,roundG,dark,x,1.93,.03,.065,.07,.065);}}
    if(kind==='monkey'){for(const sign of [-1,1]){piece(g,roundG,tint,sign*.47,1.29,.05,.20,.22,.12);piece(g,roundG,cream,sign*.49,1.29,.13,.10,.13,.03);}piece(g,roundG,cream,0,1.15,.45,.31,.21,.09);const tail=piece(g,geo('monkey-tail',()=>new THREE.TorusGeometry(.31,.065,5,16,Math.PI*1.7)),tint,.48,.5,-.30);tail.rotation.y=.7;}
    if(kind==='dragon'){for(const x of [-.23,.23])piece(g,coneG,'#e5c990',x,1.80,.02,.10,.36,.10);for(let i=0;i<4;i++)piece(g,coneG,'#d8a967',0,.76-i*.13,-.4-i*.15,.12,.25,.12);}
    if(kind==='parrot')for(let i=0;i<3;i++)piece(g,coneG,['#dfa378','#c597b6','#9bb985'][i],(i-1)*.12,1.83,.08,.085,.35,.09);
    if(kind==='owl'){for(const sign of [-1,1])piece(g,coneG,tint,sign*.29,1.72,.08,.15,.26,.14);}
    if(['owl','parrot','penguin'].includes(kind))for(let i=0;i<3;i++)piece(g,roundG,i%2?cream:tint,(i-1)*.16,.63,-.37,.09,.28,.07);
    if(kind==='robot'){box(g,'#758d86',0,.79,-.255,.46,.36,.07);for(let i=0;i<3;i++)box(g,'#d0bc87',-.13+i*.13,.8,-.30,.035,.19,.025);}
    if(kind==='ghost')for(let i=0;i<3;i++)piece(g,roundG,'#cdd8c7',(i-1)*.19,.83,-.43,.07,.055,.035);
    if(kind!=='ghost')for(const sign of [-1,1])piece(g,roundG,kind==='robot'?'#6d888a':cream,sign*.24,.16,.13,.17,.14,.25);
    groundShade(g,0,0,1.7,1.4);return g;
  }
  return {picks,update(time,calm){wheel.rotation.z=calm?0:time*.00025;fountain.rotation.y=calm?0:time*.00015;residents.forEach((a,i)=>{const t=calm?0:time*.0006+i;a.root.position.y=a.y+(calm?0:Math.sin(t)*(a.kind==='ghost'?.13:.025));a.root.rotation.y=a.angle+(calm?0:Math.sin(t*.6)*.16);});},dispose(){roadGeometry.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());numberMaterials.forEach(m=>m.dispose());picks.traverse(m=>{if(m.isMesh&&m.material.visible===false)m.material.dispose();});}};
}
