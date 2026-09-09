/* Original procedural woodland art. Three.js is pinned and served locally.
   This renderer owns GPU resources; camp commands and saves remain in CampV2. */
import * as THREE from './vendor/three/three.module.min.js';

export function createScene(canvas, {catalog, footprint, sources, world, avatar, placementReason, onContextLost, onContextRestored}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'low-power'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#c4dac9');
  scene.fog=new THREE.Fog('#c4dac9',35,70);
  const camera=new THREE.OrthographicCamera(-10,10,10,-10,.1,130);
  const ambient=new THREE.HemisphereLight('#fff3d7','#66866e',2.1);scene.add(ambient);
  const sun=new THREE.DirectionalLight('#fff1cb',2.5);sun.position.set(-12,24,9);sun.target.position.set(6,0,5);
  sun.castShadow=true;sun.shadow.mapSize.set(1024,1024);Object.assign(sun.shadow.camera,{left:-25,right:25,top:24,bottom:-24,near:1,far:65});sun.shadow.bias=-.001;sun.shadow.normalBias=.04;scene.add(sun,sun.target);
  const fireLight=new THREE.PointLight('#ffb755',3,7,2);scene.add(fireLight);
  const geometries=new Map(),materials=new Map(),extraGeometries=new Set(),extraMaterials=new Set();
  const boxG=geo('box',()=>new THREE.BoxGeometry(1,1,1));
  const coneG=geo('cone',()=>new THREE.ConeGeometry(1,1,7));
  const sphereG=geo('sphere',()=>new THREE.IcosahedronGeometry(1,1));
  const rockG=geo('rock',()=>new THREE.IcosahedronGeometry(1,0));
  const cylinderG=geo('cylinder',()=>new THREE.CylinderGeometry(1,1,1,8));
  const circleG=geo('circle',()=>new THREE.CircleGeometry(1,16));
  let width=1,height=1,quality='standard',ppu=45,disposed=false,lastObjects='',lastHarvest='',lastPreview='',wasNight=null,lastTime=0;
  const objects=new THREE.Group(),wood=new THREE.Group(),markers=new THREE.Group();scene.add(objects,wood,markers);
  const raycaster=new THREE.Raycaster(),ndc=new THREE.Vector2(),vector=new THREE.Vector3();
  const objectMap=new Map();let ghost=null,flames=[],gates=[];
  const thumbnails=new Map();
  const random=(x,z)=>Math.abs(Math.sin(x*127.1+z*311.7)*43758.5453)%1;
  function geo(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function mat(color,emissive=false){const key=color+emissive;if(!materials.has(key))materials.set(key,new THREE.MeshLambertMaterial({color,flatShading:true,emissive:emissive?color:0,emissiveIntensity:emissive?.8:0}));return materials.get(key);}
  function piece(parent,g,color,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(g,typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const box=(p,c,x,y,z,w,h,d)=>piece(p,boxG,c,x,y,z,w,h,d);
  function log(p,x,y,z,length=.7,radius=.09){const m=piece(p,cylinderG,'#795539',x,y,z,radius,length,radius);m.rotation.z=Math.PI/2;const cap=piece(p,cylinderG,'#cfaa70',x+length/2+.002,y,z,radius*.83,.01,radius*.83);cap.rotation.z=Math.PI/2;return m;}
  function tree(p,x,y,z,scale=1,oak=false){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);piece(g,cylinderG,'#76543c',0,1.15,0,.16,2.3,.16);
    if(oak){for(let i=0;i<5;i++)piece(g,sphereG,['#7f9c58','#92aa64','#6d934e'][i%3],Math.sin(i*2.4)*.65,2.5+(i%2)*.4,Math.cos(i*2.4)*.6,.93,.92,.93);}
    else{piece(g,coneG,'#386e54',0,1.45,0,1.04,1.7,1.04);piece(g,coneG,'#49835e',0,2.12,0,.83,1.65,.83);piece(g,coneG,'#6b9c6e',0,2.77,0,.56,1.4,.56);}
    return g;
  }
  // Repeated scenery is instanced by geometry/material, keeping the forest cheap.
  function instance(group){group.updateMatrixWorld(true);const buckets=new Map();group.traverse(m=>{if(!m.isMesh)return;const key=m.geometry.uuid+m.material.uuid;let b=buckets.get(key);if(!b)buckets.set(key,b={geometry:m.geometry,material:m.material,matrices:[]});b.matrices.push(m.matrixWorld.clone());});const out=new THREE.Group();for(const b of buckets.values()){const m=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.castShadow=true;m.receiveShadow=true;out.add(m);}scene.add(out);return out;}
  // Triangulated terrain has real banks and hills; the original building grid stays level.
  const terrainG=new THREE.BufferGeometry(),positions=[],colors=[],terrainColor=new THREE.Color();
  const minX=-40,maxX=55,minZ=-40,maxZ=55;
  function terrainVertex(x,z,tint){const y=world.groundHeight(x,z),bank=Math.abs(x-world.river(z));positions.push(x,y,z);terrainColor.set(bank<2.8?'#b9b387':z<-6?'#82926b':'#93aa69');terrainColor.multiplyScalar(tint);colors.push(terrainColor.r,terrainColor.g,terrainColor.b);}
  for(let z=minZ;z<maxZ;z++)for(let x=minX;x<maxX;x++){const tint=.94+random(x,z)*.12;[[x,z],[x,z+1],[x+1,z],[x+1,z],[x,z+1],[x+1,z+1]].forEach(([a,b])=>terrainVertex(a,b,tint));}
  terrainG.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));terrainG.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));terrainG.computeVertexNormals();extraGeometries.add(terrainG);
  const terrainM=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});extraMaterials.add(terrainM);const terrain=new THREE.Mesh(terrainG,terrainM);terrain.receiveShadow=true;scene.add(terrain);
  const scenery=new THREE.Group();
  world.forest.forEach(t=>tree(scenery,t.x,world.groundHeight(t.x,t.z),t.z,t.scale,t.kind==='oak'));
  for(let i=0;i<145;i++){const x=minX+random(i,61)*(maxX-minX),z=minZ+random(i,78)*(maxZ-minZ);if((x>-1&&x<13&&z>-1&&z<11)||Math.abs(x-world.river(z))<2.8)continue;const y=world.groundHeight(x,z),r=.16+random(i,91)*.45;piece(scenery,rockG,i%3?'#839185':'#a6ae98',x,y+r*.25,z,r,r*.65,r*.8);}
  for(let i=0;i<220;i++){const x=-9+random(i,35)*34,z=-9+random(i,14)*31;if(world.water(x,z)||(x>0&&x<12&&z>0&&z<10)||Math.abs(z-4)<1)continue;const y=world.groundHeight(x,z);piece(scenery,coneG,i%3?'#7e9b56':'#aac07b',x,y+.14,z,.10,.3,.1);if(i%4===0){piece(scenery,rockG,i%8?'#f7e5aa':'#d4b0c1',x,y+.31,z,.10,.08,.10);}}
  instance(scenery);
  // The stream is geometry, including animated surface glints. No texture downloads.
  const waterG=new THREE.BufferGeometry(),waterPoints=[];
  for(let z=minZ;z<maxZ;z+=.5){const a=world.river(z),b=world.river(z+.5);waterPoints.push(a-1.65,-.13,z,a+1.65,-.13,z,b+1.65,-.13,z+.5,a-1.65,-.13,z,b+1.65,-.13,z+.5,b-1.65,-.13,z+.5);}
  waterG.setAttribute('position',new THREE.Float32BufferAttribute(waterPoints,3));waterG.computeVertexNormals();extraGeometries.add(waterG);
  const waterM=new THREE.MeshLambertMaterial({color:'#62aeb2',side:THREE.DoubleSide});extraMaterials.add(waterM);const waterMesh=new THREE.Mesh(waterG,waterM);scene.add(waterMesh);
  const rippleM=new THREE.MeshBasicMaterial({color:'#c7ede2',transparent:true,opacity:.48,depthWrite:false});extraMaterials.add(rippleM);
  const ripples=new THREE.InstancedMesh(boxG,rippleM,65),matrix=new THREE.Matrix4();scene.add(ripples);
  const bridgeGroup=new THREE.Group();const bridgeX=world.river(4.5);
  for(let i=0;i<20;i++)box(bridgeGroup,i%2?'#bd955e':'#c9a774',bridgeX-2.85+i*.3,.09,4.5,.28,.14,2.85);
  for(const z of [3.08,5.92]){box(bridgeGroup,'#89633e',bridgeX,.8,z,6.2,.12,.12);box(bridgeGroup,'#ab814e',bridgeX,.43,z,6.2,.09,.1);for(let i=0;i<5;i++)box(bridgeGroup,'#765337',bridgeX-3+i*1.5,.48,z,.15,1,.15);}
  instance(bridgeGroup);
  const story=new THREE.Group();for(let i=0;i<13;i++){const a=i/13*Math.PI*2;piece(story,rockG,i%3?'#8e9d8c':'#b4baa0',-5+Math.sin(a)*1.7,world.groundHeight(-5,2)+.4,2+Math.cos(a)*1.7,.27,.45,.24);}instance(story);
  world.discoveries.forEach(d=>{const g=new THREE.Group();g.position.set(d.x+.5,world.walkHeight(d.x+.5,d.y+.5),d.y+.5);g.userData.discovery=d.id;box(g,'#76573c',0,.52,0,.10,1.05,.1);box(g,'#d4b780',0,.97,0,.8,.42,.1);piece(g,rockG,'#70a6a0',0,.98,.09,.15,.15,.06);markers.add(g);});
  // Build lines appear only while editing, so the camp reads as a place in Explore.
  const gridPoints=[];for(let x=0;x<=12;x++)gridPoints.push(x,.115,0,x,.115,10);for(let z=0;z<=10;z++)gridPoints.push(0,.115,z,12,.115,z);
  const gridG=new THREE.BufferGeometry();gridG.setAttribute('position',new THREE.Float32BufferAttribute(gridPoints,3));extraGeometries.add(gridG);const gridM=new THREE.LineBasicMaterial({color:'#fff2b6',transparent:true,opacity:.32});extraMaterials.add(gridM);const grid=new THREE.LineSegments(gridG,gridM);scene.add(grid);
  const highlightM=new THREE.MeshBasicMaterial({color:'#ffdc84',transparent:true,opacity:.42,depthWrite:false});extraMaterials.add(highlightM);const highlight=piece(scene,boxG,highlightM,0,.14,0,1,.025,1);highlight.castShadow=false;
  const ghostGood=new THREE.MeshLambertMaterial({color:'#b5e6c4',transparent:true,opacity:.6,depthWrite:false});const ghostBad=new THREE.MeshLambertMaterial({color:'#ec7968',transparent:true,opacity:.65,depthWrite:false});extraMaterials.add(ghostGood);extraMaterials.add(ghostBad);
  function roofGeometry(w,h,d){return geo(`roof${w}:${h}:${d}`,()=>{const g=new THREE.BufferGeometry();const v=[-w/2,0,-d/2,w/2,0,-d/2,0,h,-d/2,-w/2,0,d/2,w/2,0,d/2,0,h,d/2];g.setAttribute('position',new THREE.Float32BufferAttribute(v,3));g.setIndex([0,2,1,3,4,5,0,3,5,0,5,2,1,2,5,1,5,4,0,1,4,0,4,3]);g.computeVertexNormals();return g.toNonIndexed();});}
  function model(type){const g=new THREE.Group();
    if(['tent','canvas','cabin'].includes(type)){
      const cabin=type==='cabin',w=cabin?2.7:1.75,d=1.8,h=type==='tent'?1.55:1.8;
      box(g,'#a78355',0,.11,0,w+.1,.17,d+.1);
      if(cabin){box(g,'#bb925e',0,.72,0,w,1.2,d);for(let j=0;j<6;j++){box(g,'#926b46',-w/2-.01,.22+j*.19,0,.025,.027,d);box(g,'#d1ad74',0,.22+j*.19,d/2+.015,w,.024,.03);}box(g,'#4a6153',0,.64,d/2+.028,.58,1,.03);for(const x of [-.88,.88]){box(g,'#79583c',x,.88,d/2+.04,.49,.53,.04);box(g,'#f8d583',x,.88,d/2+.07,.38,.4,.04);box(g,'#79583c',x,.88,d/2+.10,.025,.42,.03);}piece(g,roofGeometry(w+.36,1.1,d+.32),'#52877e',0,1.36,0);box(g,'#ddd0aa',0,2.47,0,.13,.11,d+.4);}
      else {piece(g,roofGeometry(w,h,d),type==='tent'?'#dba867':'#659c96',0,.18,0);const door=piece(g,roofGeometry(w*.45,h*.72,.025),'#4d6557',0,.18,d/2+.018);box(g,'#eee0b4',0,h+.2,0,.065,.065,d+.12);for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])box(g,'#6e5639',x,.24,z,.07,.4,.07);}
      if(type!=='tent'){box(g,'#e0c28a',0,.2,1.1,.8,.14,.38);box(g,'#c4a16c',0,.12,1.35,.85,.12,.22);}
    }else if(type==='pine')tree(g,0,0,0,1.02);
    else if(type==='fire'){
      for(let i=0;i<9;i++){const a=i/9*Math.PI*2;piece(g,rockG,i%2?'#93978a':'#a7a897',Math.sin(a)*.38,.13,Math.cos(a)*.38,.14,.13,.13);}
      log(g,0,.16,0,.6,.08);const l=log(g,0,.24,0,.65,.08);l.rotation.y=Math.PI/2;
      const flame=new THREE.Group();piece(flame,coneG,mat('#ee9144',true),0,.46,0,.18,.54,.18);piece(flame,coneG,mat('#ffdc81',true),.05,.4,.03,.1,.37,.1);g.add(flame);g.userData.flame=flame;
    }else if(type==='bench'){
      for(const x of [-.7,.7])for(const z of [-.24,.24])box(g,'#73583c',x,.25,z,.14,.5,.14);
      for(let i=0;i<3;i++)box(g,'#bd955b',0,.51,-.25+i*.24,1.78,.11,.2);
      for(const x of [-.73,.73])box(g,'#8b673f',x,.70,-.32,.12,.65,.12);
      for(let j=0;j<2;j++)box(g,'#c8a771',0,.8+j*.18,-.32,1.85,.14,.11);
    }else if(type==='fence'||type==='gate'){
      for(const x of [-.44,.44]){box(g,'#927047',x,.43,0,.13,.86,.13);piece(g,coneG,'#c0a16d',x,.89,0,.11,.12,.11);}
      const rails=new THREE.Group();g.add(rails);if(type==='gate'){rails.position.x=-.4;g.userData.gate=rails;for(let j=0;j<4;j++)box(rails,'#b59a66',.12+j*.18,.4,0,.09,.53,.07);}for(const y of [.29,.65])box(rails,'#c5a775',type==='gate'?.4:0,y,0,.88,.10,.09);
    }else if(type==='path'){for(const [x,z,w,d] of [[-.21,-.2,.4,.35],[.23,-.19,.38,.38],[-.2,.22,.36,.38],[.21,.23,.43,.35]]){const stone=piece(g,cylinderG,'#b2b4a0',x,.065,z,w,.075,d);stone.scale.x*=.6;stone.scale.z*=.6;}}
    else if(type==='deck'){for(let i=0;i<5;i++)box(g,i%2?'#bf9a63':'#cba674',-.39+i*.195,.11,0,.18,.13,.96);}
    else if(type==='lantern'){box(g,'#756041',0,.51,0,.065,1.05,.065);box(g,'#756041',.15,1.03,0,.35,.055,.055);box(g,'#f8d88b',.27,.84,0,.18,.28,.18);box(g,'#647364',.27,1.01,0,.23,.07,.23);box(g,'#647364',.27,.67,0,.23,.05,.23);}
    else if(type==='feeder'){box(g,'#967449',0,.57,0,.11,1.13,.11);box(g,'#cbb07e',0,1.03,0,.55,.07,.5);for(const x of [-.21,.21])box(g,'#af8d5e',x,1.18,0,.045,.3,.045);piece(g,roofGeometry(.68,.3,.58),'#638e83',0,1.32,0);piece(g,rockG,'#d4b578',0,1.11,0,.12,.06,.1);}
    return g;
  }
  function locate(g,o){const f=footprint(o.type,o.r);g.position.set(o.x+f.w/2,world.groundHeight(o.x+f.w/2,o.y+f.h/2),o.y+f.h/2);g.rotation.y=-(o.r||0)*Math.PI/2;g.userData.id=o.id;return g;}
  function sync(save){const key=JSON.stringify(save.objects);if(key!==lastObjects){objects.clear();objectMap.clear();flames=[];gates=[];for(const o of save.objects){const g=locate(model(o.type),o);objects.add(g);objectMap.set(o.id,g);if(g.userData.flame)flames.push(g.userData.flame);if(g.userData.gate)gates.push(g);}lastObjects=key;renderer.shadowMap.needsUpdate=true;}
    const h=JSON.stringify(save.harvested);if(h!==lastHarvest){wood.clear();sources.forEach((p,i)=>{const g=new THREE.Group();g.position.set(p.x+.5,.09,p.y+.5);g.userData.source=i;for(let j=0;j<(save.harvested.includes(i)?1:3);j++)log(g,0,.13+(j===2?.17:0),j===2?0:-.13+j*.26,.7,.10);if(!save.harvested.includes(i))piece(g,rockG,mat('#e3c770',true),0,.65,0,.085,.14,.085);wood.add(g);});lastHarvest=h;renderer.shadowMap.needsUpdate=true;}
  }
  function actor(dog=false){const g=new THREE.Group(),limbs=[];const hue=String(avatar||'').split('').reduce((n,c)=>n+c.charCodeAt(0),0)%3;
    if(dog){piece(g,sphereG,'#d3a269',0,.39,0,.21,.24,.35);piece(g,sphereG,'#ead5ae',0,.57,.27,.23,.24,.22);piece(g,sphereG,'#f4e9cf',0,.51,.43,.14,.10,.11);piece(g,rockG,'#35423a',0,.54,.52,.06,.045,.04);for(const x of [-.14,.14]){piece(g,coneG,'#b57a4f',x,.80,.21,.105,.27,.075);piece(g,rockG,'#2d3a33',x*.65,.64,.452,.023,.032,.024);}for(const x of [-.13,.13])for(const z of [-.20,.21]){const leg=box(g,'#e6c493',x,.18,z,.11,.3,.11);limbs.push(leg);}const tail=piece(g,coneG,'#e6c493',0,.5,-.4,.09,.3,.09);tail.rotation.x=-.9;g.userData.tail=tail;}
    else{const skin=['#dba575','#a87654','#c28d67'][hue],coat=['#ca8159','#58958b','#6486a1'][hue];box(g,coat,0,.71,0,.43,.54,.27);box(g,'#bf9f64',0,.77,-.19,.32,.38,.15);piece(g,sphereG,skin,0,1.15,0,.245,.27,.23);piece(g,sphereG,'#634e3b',0,1.31,-.025,.25,.15,.235);piece(g,cylinderG,'#648977',0,1.36,0,.29,.075,.26);box(g,'#648977',0,1.34,.2,.35,.06,.23);for(const x of [-.082,.082])piece(g,rockG,'#37433b',x,1.16,.214,.024,.031,.026);for(const x of [-.27,.27]){const arm=new THREE.Group();arm.position.set(x,.9,0);box(arm,coat,0,-.17,0,.12,.34,.14);piece(arm,sphereG,skin,0,-.37,0,.074,.08,.07);g.add(arm);limbs.push(arm);}for(const x of [-.13,.13]){const leg=new THREE.Group();leg.position.set(x,.49,0);box(leg,'#53635c',0,-.17,0,.16,.34,.17);box(leg,'#765741',0,-.38,.05,.18,.12,.25);g.add(leg);limbs.push(leg);}}
    g.userData.limbs=limbs;g.traverse(m=>{if(m.isMesh)m.castShadow=false;});scene.add(g);return g;
  }
  const explorerActor=actor(),petActor=actor(true);
  const shadowM=new THREE.MeshBasicMaterial({color:'#354d3e',transparent:true,opacity:.2,depthWrite:false});extraMaterials.add(shadowM);
  const explorerShadow=piece(scene,circleG,shadowM,0,0,0,.31,.31,.31),petShadow=piece(scene,circleG,shadowM,0,0,0,.27,.27,.27);explorerShadow.rotation.x=petShadow.rotation.x=-Math.PI/2;
  const bird=new THREE.Group();piece(bird,sphereG,'#c6a35f',0,0,0,.12,.1,.19);const wings=[-1,1].map(sign=>box(bird,'#6c8791',sign*.16,0,0,.24,.045,.14));scene.add(bird);
  function updateCamera(view){const zoom=Math.max(.55,Math.min(1.8,view.zoom)),angle=Math.PI/4+(Number.isFinite(view.angle)?view.angle:0),scale=ppu*zoom;
    const right=new THREE.Vector3(Math.cos(angle),0,-Math.sin(angle)),up=new THREE.Vector3(-Math.sin(angle),0,-Math.cos(angle));
    const target=new THREE.Vector3(6,0,5).addScaledVector(right,-view.x/scale).addScaledVector(up,view.y/(scale*.7071));
    const bounded=target.clone();bounded.x=Math.max(-7,Math.min(23,bounded.x));bounded.z=Math.max(-6,Math.min(19,bounded.z));const delta=bounded.clone().sub(target);view.x-=delta.dot(right)*scale;view.y+=delta.dot(up)*scale*.7071;target.copy(bounded);
    camera.left=-width/(2*scale);camera.right=width/(2*scale);camera.top=height/(2*scale);camera.bottom=-height/(2*scale);camera.position.copy(target).add(new THREE.Vector3(Math.sin(angle)*28,28,Math.cos(angle)*28));camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  function project(x,z,y=0){vector.set(x,world.walkHeight(x,z)+y,z).project(camera);return {x:(vector.x+1)*width/2,y:(1-vector.y)*height/2};}
  function cast(px,py){ndc.set(px/width*2-1,1-py/height*2);raycaster.setFromCamera(ndc,camera);}
  function cell(px,py){cast(px,py);const hit=raycaster.intersectObject(terrain,false)[0];return hit?{x:Math.floor(hit.point.x),y:Math.floor(hit.point.z)}:{x:-99,y:-99};}
  function pick(px,py){cast(px,py);const hits=raycaster.intersectObjects([objects,wood,markers],true);for(const hit of hits){let o=hit.object;while(o&&o!==scene){if(o.userData.id||o.userData.source!==undefined||o.userData.discovery)return o.userData;o=o.parent;}}return null;}
  function focus(x,z,view,placement=false){updateCamera(view);const p=project(x,z);view.x+=width*.5-p.x;view.y+=height*(placement?.36:.5)-p.y;}
  function follow(pos,view){updateCamera(view);const p=project(pos.x+.5,pos.y+.5);if(p.x<65||p.x>width-85||p.y<210||p.y>height-180)focus(pos.x+.5,pos.y+.5,view);}
  function resize(w,h,q){width=w;height=h;quality=q;ppu=Math.min(height/17,width/16);renderer.setPixelRatio(Math.min(devicePixelRatio||1,q==='low'?1:1.5));renderer.setSize(w,h,false);canvas.style.width=w+'px';canvas.style.height=h+'px';renderer.shadowMap.enabled=q!=='low';renderer.shadowMap.needsUpdate=true;}
  function thumbnail(type){
    if(thumbnails.has(type))return thumbnails.get(type);
    const target=new THREE.WebGLRenderTarget(112,112),previewScene=new THREE.Scene(),item=model(type);target.texture.colorSpace=THREE.SRGBColorSpace;
    previewScene.background=new THREE.Color('#e4ead6');previewScene.add(item,new THREE.HemisphereLight('#fff5de','#68816b',2.2));
    const light=new THREE.DirectionalLight('#ffefd0',2);light.position.set(-3,5,4);previewScene.add(light);
    const bounds=new THREE.Box3().setFromObject(item),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3()),r=Math.max(size.x,size.y,size.z)*.78;
    const thumbCamera=new THREE.OrthographicCamera(-r,r,r,-r,.1,30);thumbCamera.position.copy(center).add(new THREE.Vector3(4,3.2,5));thumbCamera.lookAt(center);
    const oldTarget=renderer.getRenderTarget(),shadows=renderer.shadowMap.enabled;renderer.shadowMap.enabled=false;
    let url='';try{renderer.setRenderTarget(target);renderer.render(previewScene,thumbCamera);const pixels=new Uint8Array(112*112*4);renderer.readRenderTargetPixels(target,0,0,112,112,pixels);const out=document.createElement('canvas');out.width=out.height=112;const c=out.getContext('2d'),data=c.createImageData(112,112);for(let y=0;y<112;y++)data.data.set(pixels.subarray((111-y)*448,(112-y)*448),y*448);c.putImageData(data,0,0);url=out.toDataURL();}finally{renderer.setRenderTarget(oldTarget);renderer.shadowMap.enabled=shadows;target.dispose();}
    thumbnails.set(type,url);return url;
  }
  function render(state,time){if(disposed||renderer.getContext().isContextLost())return;const {save,explorer,pet,heading,walking,seated,preview,selected,mode,calm,activity}=state;sync(save);updateCamera(state.camera);
    if(wasNight!==save.night){wasNight=save.night;scene.background.set(save.night?'#718e99':'#c4dac9');scene.fog.color.copy(scene.background);ambient.intensity=save.night?1.5:2.1;ambient.color.set(save.night?'#a8c5dd':'#fff3d7');sun.intensity=save.night?.7:2.5;sun.color.set(save.night?'#bdd7e9':'#fff1cb');renderer.shadowMap.needsUpdate=true;}
    const fire=save.objects.find(o=>o.type==='fire');fireLight.visible=save.night&&!!fire;if(fire)fireLight.position.set(fire.x+.5,1,fire.y+.5);
    grid.visible=mode==='build'||!!preview;highlight.visible=!!preview||!!selected;
    const p=preview||save.objects.find(o=>o.id===selected);if(p){const f=footprint(p.type,p.r);highlight.position.set(p.x+f.w/2,.14,p.y+f.h/2);highlight.scale.set(f.w,.025,f.h);}
    const previewKey=JSON.stringify(preview);if(previewKey!==lastPreview){if(ghost)scene.remove(ghost);ghost=null;if(preview){ghost=locate(model(preview.type),preview);scene.add(ghost);}lastPreview=previewKey;}
    if(ghost){const reason=placementReason(save,preview.type,preview.x,preview.y,preview.r,preview.id);highlight.material.color.set(reason?'#f07865':'#fae7a0');ghost.traverse(m=>{if(m.isMesh){m.material=reason?ghostBad:ghostGood;m.castShadow=false;}});}else highlight.material.color.set('#ffdc84');
    explorerActor.position.set(explorer.x+.5,world.walkHeight(explorer.x+.5,explorer.y+.5),explorer.y+.5);explorerActor.rotation.y=heading;
    if(seated){const f=footprint(seated.type,seated.r);explorerActor.position.set(seated.x+f.w/2,.13,seated.y+f.h/2);explorerActor.rotation.y=-(seated.r||0)*Math.PI/2;}
    explorerActor.userData.limbs.forEach((limb,i)=>{limb.rotation.x=seated&&i>1?-1.25:walking&&!calm?Math.sin(time*.013+(i%2)*Math.PI)*.5:0;});
    petActor.position.set(pet.x+.5,world.walkHeight(pet.x+.5,pet.y+.5),pet.y+.5);petActor.rotation.y=heading+.08;
    petActor.userData.limbs.forEach((limb,i)=>{limb.rotation.x=walking&&!calm?Math.sin(time*.018+i%2*Math.PI)*.4:0;});petActor.userData.tail.rotation.z=calm?0:Math.sin(time*.009)*.35;
    for(const [shadow,a] of [[explorerShadow,explorerActor],[petShadow,petActor]]){shadow.position.set(a.position.x,world.walkHeight(a.position.x,a.position.z)+.02,a.position.z);shadow.castShadow=false;}
    flames.forEach((f,i)=>f.scale.setScalar(calm?1:1+Math.sin(time*.009+i)*.1));
    gates.forEach(g=>{g.userData.gate.rotation.y=Math.hypot(explorerActor.position.x-g.position.x,explorerActor.position.z-g.position.z)<1.6?-1.3:0;});
    const feeder=save.objects.find(o=>o.type==='feeder');bird.visible=!!feeder;if(feeder){const visiting=activity.includes('bird'),t=calm?0:time*.0004;bird.position.set(feeder.x+.5+(visiting?0:Math.sin(t)*2),visiting?1.6:2.2+Math.sin(t)*.15,feeder.y+.5+(visiting?0:Math.cos(t)*1.3));wings.forEach((wing,i)=>wing.rotation.z=calm||visiting?0:Math.sin(time*.025)*(i?1:-1)*.5);}
    const tm=calm?0:time*.0003;for(let i=0;i<65;i++){const z=minZ+(i*.73+tm)%(maxZ-minZ),x=world.river(z)+Math.sin(i*8.1)*1.1;matrix.compose(new THREE.Vector3(x,-.105,z),new THREE.Quaternion(),new THREE.Vector3(.14+random(i,3)*.25,.008,.025));ripples.setMatrixAt(i,matrix);}ripples.instanceMatrix.needsUpdate=true;
    renderer.render(scene,camera);lastTime=time;
  }
  function lost(event){event.preventDefault();onContextLost?.();}
  function restored(){renderer.shadowMap.needsUpdate=true;onContextRestored?.();}
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
  function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);geometries.forEach(g=>g.dispose());extraGeometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());extraMaterials.forEach(m=>m.dispose());scene.clear();renderer.dispose();renderer.forceContextLoss();}
  return {resize,render,project,cell,pick,focus,follow,thumbnail,stats:()=>({...renderer.info.render,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}),dispose};
}
