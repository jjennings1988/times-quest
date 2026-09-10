/* Original procedural woodland art. Three.js is pinned and served locally.
   This renderer owns GPU resources; camp commands and saves remain in CampV2. */
import * as THREE from './vendor/three/three.module.min.js';
import {createWorldDetails} from './camp-world-details.js';

export function createScene(canvas, {catalog, footprint, sources, world, avatar, guardians=[], placementReason, onContextLost, onContextRestored}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:false, powerPreference:'low-power'});
  renderer.outputColorSpace=THREE.SRGBColorSpace;
  renderer.shadowMap.enabled=true;
  renderer.shadowMap.type=THREE.PCFSoftShadowMap;
  renderer.shadowMap.autoUpdate=false;
  const scene=new THREE.Scene();
  scene.background=new THREE.Color('#c7ded5');
  scene.fog=new THREE.Fog('#c7ded5',48,100);
  const camera=new THREE.OrthographicCamera(-10,10,10,-10,.1,180);
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
  const objectMap=new Map();let ghost=null,flames=[],gates=[],forestScene=null,lastCleared='',lastLand='';const treesToPick=new THREE.Group(),townPick=new THREE.Group(),landMarkers=new THREE.Group();scene.add(landMarkers);const content=world.content;let currentSave=null;
  const thumbnails=new Map();
  const random=(x,z)=>Math.abs(Math.sin(x*127.1+z*311.7)*43758.5453)%1;
  function geo(key,make){if(!geometries.has(key))geometries.set(key,make());return geometries.get(key);}
  function mat(color,emissive=false){const key=color+emissive;if(!materials.has(key))materials.set(key,new THREE.MeshLambertMaterial({color,flatShading:false,emissive:emissive?color:0,emissiveIntensity:emissive?.8:0}));return materials.get(key);}
  function piece(parent,g,color,x,y,z,sx=1,sy=1,sz=1){const m=new THREE.Mesh(g,typeof color==='string'?mat(color):color);m.position.set(x,y,z);m.scale.set(sx,sy,sz);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const box=(p,c,x,y,z,w,h,d)=>piece(p,boxG,c,x,y,z,w,h,d);
  const bevelG=geo('soft-masonry',()=>{const shape=new THREE.Shape();shape.moveTo(-.44,-.44);shape.lineTo(.44,-.44);shape.lineTo(.44,.44);shape.lineTo(-.44,.44);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.88,bevelEnabled:true,bevelThickness:.06,bevelSize:.06,bevelSegments:1,steps:1});g.translate(0,0,-.44);return g;});
  const shadePixels=new Uint8Array(64*64*4);for(let y=0;y<64;y++)for(let x=0;x<64;x++){const i=(y*64+x)*4,r=Math.hypot((x-31.5)/31.5,(y-31.5)/31.5);shadePixels.set([35,57,48,Math.round(Math.max(0,1-r)**2*100)],i);}const shadeTexture=new THREE.DataTexture(shadePixels,64,64);shadeTexture.needsUpdate=true;const shadeMaterial=new THREE.MeshBasicMaterial({map:shadeTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});extraMaterials.add(shadeMaterial);
  function groundShade(parent,x,z,w,d){const m=piece(parent,geo('shade-plane',()=>new THREE.PlaneGeometry(1,1)),shadeMaterial,x,.012,z,w,d,1);m.rotation.x=-Math.PI/2;m.castShadow=false;return m;}
  function log(p,x,y,z,length=.7,radius=.09){const g=new THREE.Group();g.position.set(x,y,z);p.add(g);piece(g,cylinderG,'#795539',0,0,0,radius,length,radius).rotation.z=Math.PI/2;for(const sign of [-1,1]){piece(g,cylinderG,'#cfaa70',sign*(length/2+.003),0,0,radius*.86,.012,radius*.86).rotation.z=Math.PI/2;piece(g,cylinderG,'#b18b58',sign*(length/2+.010),0,0,radius*.42,.008,radius*.42).rotation.z=Math.PI/2;}return g;}
  function tree(p,x,y,z,scale=1,oak=false){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);groundShade(g,0,0,3.1,2.8);piece(g,cylinderG,'#76543c',0,1.15,0,.16,2.3,.16);
    if(oak){for(let i=0;i<5;i++)piece(g,sphereG,['#7f9c58','#92aa64','#6d934e'][i%3],Math.sin(i*2.4)*.65,2.5+(i%2)*.4,Math.cos(i*2.4)*.6,.93,.92,.93);}
    else{piece(g,coneG,'#386e54',0,1.45,0,1.04,1.7,1.04);piece(g,coneG,'#49835e',0,2.12,0,.83,1.65,.83);piece(g,coneG,'#6b9c6e',0,2.77,0,.56,1.4,.56);}
    return g;
  }
  // Repeated scenery is instanced by geometry/material, keeping the forest cheap.
  const architectureMat=new THREE.MeshLambertMaterial({vertexColors:true});extraMaterials.add(architectureMat);
  function instance(group,add=true,spatial=add){group.updateMatrixWorld(true);const buckets=new Map(),architecture=new Map(),point=new THREE.Vector3(),normal=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
    group.traverse(m=>{if(!m.isMesh)return;const chunk=spatial?Math.floor(m.matrixWorld.elements[12]/16)+','+Math.floor(m.matrixWorld.elements[14]/16):'';
      // Merge solid architectural faces by vertex colour; keep foliage instanced.
      const merge=spatial&&m.material.isMeshLambertMaterial&&!m.material.map&&!m.material.transparent&&!m.material.emissive?.getHex()&&![sphereG,rockG,coneG,cylinderG,circleG].includes(m.geometry);
      if(merge){const key=chunk+':'+m.castShadow;let b=architecture.get(key);if(!b)architecture.set(key,b={position:[],normal:[],color:[],castShadow:m.castShadow});const g=m.geometry,p=g.attributes.position,n=g.attributes.normal,indices=g.index;normalMatrix.getNormalMatrix(m.matrixWorld);for(let j=0;j<(indices?indices.count:p.count);j++){const i=indices?indices.getX(j):j;point.fromBufferAttribute(p,i).applyMatrix4(m.matrixWorld);normal.fromBufferAttribute(n,i).applyNormalMatrix(normalMatrix);b.position.push(point.x,point.y,point.z);b.normal.push(normal.x,normal.y,normal.z);b.color.push(m.material.color.r,m.material.color.g,m.material.color.b);}return;}
      const key=m.geometry.uuid+m.material.uuid+':'+chunk;let b=buckets.get(key);if(!b)buckets.set(key,b={geometry:m.geometry,material:m.material,castShadow:m.castShadow,matrices:[]});b.matrices.push(m.matrixWorld.clone());
    });
    const out=new THREE.Group();for(const b of buckets.values()){const m=new THREE.InstancedMesh(b.geometry,b.material,b.matrices.length);b.matrices.forEach((matrix,i)=>m.setMatrixAt(i,matrix));m.castShadow=b.castShadow;m.receiveShadow=true;out.add(m);}
    for(const b of architecture.values()){const g=new THREE.BufferGeometry();for(const name of ['position','normal','color'])g.setAttribute(name,new THREE.Float32BufferAttribute(b[name],3));extraGeometries.add(g);const m=new THREE.Mesh(g,architectureMat);m.castShadow=b.castShadow;m.receiveShadow=true;m.userData.ownedGeometry=true;out.add(m);}
    out.userData={...group.userData};if(add)scene.add(out);return out;
  }
  function releaseBatch(root){root.traverse(m=>{if(m.isInstancedMesh)m.dispose();if(m.userData.ownedGeometry){m.geometry.dispose();extraGeometries.delete(m.geometry);}});}
  // Triangulated terrain has real banks and hills; the original building grid stays level.
  const positions=[],colors=[],terrainColor=new THREE.Color(),terrain=new THREE.Group();scene.add(terrain);
  const minX=-64,maxX=113,minZ=-51,maxZ=72;
  function terrainVertex(x,z,tint){const y=world.groundHeight(x,z),bank=Math.abs(x-world.river(z));positions.push(x,y,z);terrainColor.set(bank<2.8?'#c8bf99':content.civic(x,z)?'#a7b98b':z<-6?'#8fa67c':'#9eb878');terrainColor.multiplyScalar(.98+Math.sin(x*.29)*Math.cos(z*.24)*.035);colors.push(terrainColor.r,terrainColor.g,terrainColor.b);}
  const terrainM=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:true});extraMaterials.add(terrainM);
  // Cull terrain in the same local chunks as the forest, rather than draw the whole valley.
  for(let cz=minZ;cz<maxZ;cz+=16)for(let cx=minX;cx<maxX;cx+=16){positions.length=0;colors.length=0;
    for(let z=cz;z<Math.min(cz+16,maxZ);z++)for(let x=cx;x<Math.min(cx+16,maxX);x++)[[x,z],[x,z+1],[x+1,z],[x+1,z],[x,z+1],[x+1,z+1]].forEach(([a,b])=>terrainVertex(a,b,1));
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.computeVertexNormals();extraGeometries.add(g);const mesh=new THREE.Mesh(g,terrainM);mesh.receiveShadow=true;terrain.add(mesh);
  }
  const scenery=new THREE.Group();

  for(let i=0;i<145;i++){const x=minX+random(i,61)*(maxX-minX),z=minZ+random(i,78)*(maxZ-minZ);if((x>-1&&x<13&&z>-1&&z<11)||Math.abs(x-world.river(z))<2.8)continue;const y=world.groundHeight(x,z),r=.16+random(i,91)*.45;piece(scenery,rockG,i%3?'#839185':'#a6ae98',x,y+r*.25,z,r,r*.65,r*.8);}
  for(let i=0;i<220;i++){const x=-9+random(i,35)*34,z=-9+random(i,14)*31;if(world.water(x,z)||(x>0&&x<12&&z>0&&z<10)||Math.abs(z-4)<1)continue;const y=world.groundHeight(x,z);piece(scenery,coneG,i%3?'#7e9b56':'#aac07b',x,y+.14,z,.10,.3,.1);if(i%4===0){piece(scenery,rockG,i%8?'#f7e5aa':'#d4b0c1',x,y+.31,z,.10,.08,.10);}}
  instance(scenery);
  // The stream is geometry, including animated surface glints. No texture downloads.
  const waterG=new THREE.BufferGeometry(),waterPoints=[],waterColors=[],waterTint=new THREE.Color();
  function waterVertex(z,offset){waterPoints.push(world.river(z)+offset,-.13,z);waterTint.set('#4e979f').lerp(new THREE.Color('#aacdb7'),Math.pow(Math.abs(offset)/1.65,2)*.85);waterTint.multiplyScalar(.98+Math.sin(z*.44)*.025);waterColors.push(waterTint.r,waterTint.g,waterTint.b);}
  const bands=[-1.65,-.85,0,.85,1.65];for(let z=minZ;z<maxZ;z+=.5)for(let i=0;i<4;i++){const l=bands[i],r=bands[i+1];[[z,l],[z,r],[z+.5,r],[z,l],[z+.5,r],[z+.5,l]].forEach(([z,o])=>waterVertex(z,o));}
  waterG.setAttribute('position',new THREE.Float32BufferAttribute(waterPoints,3));waterG.setAttribute('color',new THREE.Float32BufferAttribute(waterColors,3));waterG.computeVertexNormals();extraGeometries.add(waterG);
  const waterM=new THREE.MeshLambertMaterial({vertexColors:true,side:THREE.DoubleSide});extraMaterials.add(waterM);const waterMesh=new THREE.Mesh(waterG,waterM);scene.add(waterMesh);
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
  function roofGeometry(w,h,d){return geo('curved-roof'+w+':'+h+':'+d,()=>{const vertices=[],indices=[],n=12;for(const z of [-d/2,d/2])for(let i=0;i<=n;i++){const u=i/n*2-1;vertices.push(u*w/2,h*(1-Math.pow(Math.abs(u),.82)),z);}for(let i=0;i<n;i++){const j=i+n+1;indices.push(i,j,j+1,i,j+1,i+1);}const profile=Array.from({length:n+1},(_,i)=>new THREE.Vector2(vertices[i*3],vertices[i*3+1]));for(let [a,b,c] of THREE.ShapeUtils.triangulateShape(profile,[])){const u=profile[a],v=profile[b],w=profile[c];if((v.x-u.x)*(w.y-u.y)-(v.y-u.y)*(w.x-u.x)>0)[b,c]=[c,b];indices.push(a,b,c,a+n+1,c+n+1,b+n+1);}indices.push(0,n,n*2+1,0,n*2+1,n+1);const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return g.toNonIndexed();});}
  function wallModel(type,mask,color){
    const g=new THREE.Group(),stone=type.startsWith('stone'),fort=type==='palisade'||type==='fortgate',gate=type.includes('gate'),corner=content.corner(mask),h=stone?1.35:fort?1.2:.7;
    g.userData.connected=!!mask;
    const woodColor=['#c7a375','#b48c71','#bba6bd','#d5b981','#83a29b'][color%5],stoneColor=color?'#b8b5a5':'#b4b6a4';
    if(gate){const axis=mask&&(mask&5)&&!(mask&10)?Math.PI/2:0;g.rotation.y=axis;for(const x of [-.43,.43])box(g,stone?stoneColor:'#88694c',x,h*.58,0,stone?.22:.13,h*1.16,.22);if(stone)box(g,stoneColor,0,h*1.16,0,.99,.2,.24);const leaf=new THREE.Group();leaf.position.x=-.35;g.add(leaf);for(let i=0;i<5;i++)box(leaf,woodColor,.07+i*.14,h*.42,0,.10,h*.82,.08);box(leaf,'#70573e',.36,h*.65,0,.72,.09,.1);for(const sign of [-1,1]){beam(leaf,'#876b47',[.07,h*.18,sign*.07],[.65,h*.64,sign*.07],.035);piece(leaf,rockG,'#c3b579',.62,h*.49,sign*.095,.045,.055,.025);}g.userData.gate=leaf;return g;}
    if(!mask)mask=10;
    const ph=corner?h+.4:h+.1;
    if(stone){piece(g,cylinderG,stoneColor,0,ph/2,0,corner?.3:.2,ph,corner?.3:.2);for(let i=0;i<4;i++){const a=i*Math.PI/2;box(g,'#d0cdb8',Math.sin(a)*.2,ph+.08,Math.cos(a)*.2,.14,.18,.14);}}
    else {box(g,'#92724c',0,ph/2,0,corner?.21:.13,ph,corner?.21:.13);piece(g,coneG,'#d2b888',0,ph+.07,0,corner?.17:.105,.18,corner?.17:.105);}
    for(const [dx,dz,bit] of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(mask&bit){
      if(stone){box(g,'#8e9989',dx*.29,h/2,dz*.29,dx?.58:.24,h,dx?.24:.58);for(let row=0;row<4;row++)for(let col=0;col<2;col++){const p=.14+col*.29;piece(g,bevelG,row%2?stoneColor:'#c9c9b4',dx*p,.17+row*.31,dz*p,dx?.27:.29,.27,dx?.29:.27);}for(const p of [.2,.48])box(g,'#d0cdb8',dx*p,h+.07,dz*p,.15,.18,.15);}
      else if(fort){for(const p of [.16,.34,.5]){piece(g,cylinderG,woodColor,dx*p,h/2,dz*p,.085,h,.085);piece(g,coneG,'#e0c293',dx*p,h+.10,dz*p,.09,.2,.09);}}
      else{for(const y of [.24,.55])box(g,woodColor,dx*.27,y,dz*.27,dx?.56:.08,.075,dx?.08:.56);for(const p of [.16,.37]){box(g,woodColor,dx*p,.34,dz*p,.09,.67,.09);piece(g,coneG,'#e3cda4',dx*p,.7,dz*p,.064,.1,.064);}}
    }return g;
  }
  // Small, original procedural paving atlas: no downloaded textures or per-stone meshes.
  const pavingCanvas=document.createElement('canvas');pavingCanvas.width=pavingCanvas.height=256;
  const pavingCtx=pavingCanvas.getContext('2d');pavingCtx.fillStyle='#7e8877';pavingCtx.fillRect(0,0,256,256);
  for(let row=0;row<6;row++)for(let col=-1;col<5;col++){const x=col*64+(row%2)*32,y=row*256/6,n=random(col,row);pavingCtx.fillStyle=['#bcbba9','#c8c4ae','#aaaF9d','#d0c8b1'][Math.floor(n*4)];pavingCtx.beginPath();pavingCtx.roundRect(x+2,y+2,60,38,6);pavingCtx.fill();pavingCtx.strokeStyle='#d9d3bb';pavingCtx.lineWidth=1.5;pavingCtx.stroke();}
  for(let i=0;i<300;i++){pavingCtx.fillStyle=i%3?'#989e8d':'#e0d7bc';pavingCtx.globalAlpha=.25;pavingCtx.fillRect(random(i,11)*256,random(i,23)*256,1+random(i,17)*3,1.5);}pavingCtx.globalAlpha=1;
  const pavingTexture=new THREE.CanvasTexture(pavingCanvas);pavingTexture.colorSpace=THREE.SRGBColorSpace;pavingTexture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const pavingMat=new THREE.MeshLambertMaterial({map:pavingTexture,color:'#ffffff'});extraMaterials.add(pavingMat);
  function pathModel(type,mask,color,publicRoad=false){const g=new THREE.Group();
    if(type==='drawbridge'){for(let i=0;i<6;i++)box(g,'#b39260',0,.14,-.43+i*.17,.97,.16,.145);for(const x of [-.42,.42])box(g,'#816347',x,.36,0,.075,.50,.075);return g;}
    const moat=type==='moat',cobble=type==='cobble',base=moat?'#559fa9':cobble?pavingMat:'#c8b690',size=publicRoad?1.012:.79;
    box(g,base,0,.048,0,size,.05,size);
    if(!publicRoad)for(const [dx,dz,bit] of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(mask&bit)box(g,base,dx*.4,.048,dz*.4,dx?.22:.79,.05,dx?.79:.22);
    for(const [dx,dz,bit] of [[0,-1,1],[1,0,2],[0,1,4],[-1,0,8]])if(!(mask&bit)){const edge=publicRoad?.48:.41;box(g,moat?'#909b84':cobble?'#d7ceb5':'#a59773',dx*edge,moat?.11:.071,dz*edge,dx?.07:size,.08,dx?size:.07);}
    if(moat)box(g,'#b5e1d8',0,.083,.1,.37,.009,.025);
    else if(!cobble)for(let i=0;i<3;i++){const a=i*2.4;piece(g,rockG,'#ded0ac',Math.sin(a)*.23,.081,Math.cos(a)*.23,.055,.018,.065);}
    return g;
  }
  function beam(parent,color,a,b,r=.04){const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),delta=end.clone().sub(start),m=piece(parent,cylinderG,color,...start.clone().add(end).multiplyScalar(.5).toArray(),r,delta.length(),r);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),delta.normalize());return m;}
  function sideDetails(g,w,d,h,roofColor,stone){
    for(const angle of [Math.PI/2,Math.PI,-Math.PI/2]){const face=new THREE.Group(),span=angle===Math.PI?w:d,depth=angle===Math.PI?d/2:w/2;face.rotation.y=angle;if(h<1.5)face.scale.y=.77;g.add(face);
      box(face,stone?'#b0b5a2':'#806549',0,.31,depth+.03,span,.15,.075);box(face,'#927f5d',0,h+.12,depth+.035,span,.12,.10);
      for(const x of [-span*.25,span*.25]){box(face,'#786c52',x,1.14,depth+.035,.65,.77,.07);box(face,'#e8cf96',x,1.14,depth+.077,.51,.63,.025);box(face,'#7f8065',x,1.14,depth+.10,.045,.66,.03);box(face,'#7f8065',x,1.14,depth+.11,.54,.045,.03);
        for(const dx of [-.39,.39]){box(face,roofColor,x+dx,1.14,depth+.07,.15,.73,.06);for(let j=0;j<3;j++)box(face,'#637766',x+dx,.94+j*.19,depth+.11,.13,.026,.035);}
        box(face,'#b2956c',x,.72,depth+.16,.79,.16,.29);for(let i=0;i<4;i++)piece(face,sphereG,i%3?'#88a473':'#d8ae9c',x-.28+i*.18,.85,depth+.2,.105,.09,.09);
      }
      if(stone){for(let row=0;row<2;row++)for(let i=0;i<Math.floor(span/.4);i++)box(face,row%2?'#d4d0bb':'#b9bba7',-span/2+.22+i*.4,.42+row*.19,depth+.05,.36,.14,.045);}
      else{for(let row=0;row<6;row++)box(face,'#99794f',0,.43+row*.23,depth+.024,span,.026,.035);for(const x of [-span/2+.1,span/2-.1])box(face,'#8b6e4b',x,h/2+.25,depth+.05,.12,h,.11);}
      // Gutters and downpipes are visible on the return views, too.
      box(face,'#7b8270',span/2-.12,h/2+.24,depth+.10,.055,h,.07);
    }
  }
  function newBuilding(type,roofColor){const g=new THREE.Group();if(!['flowerbed','well','stonewell'].includes(type))groundShade(g,0,.2,4.4,4.2);
    if(type==='flowerbed'){box(g,'#ae8c65',0,.12,0,.85,.20,.85);box(g,'#645a41',0,.23,0,.75,.04,.75);for(let i=0;i<7;i++){const x=Math.sin(i*2.4)*.26,z=Math.cos(i*2.4)*.26;box(g,'#6c9561',x,.37,z,.035,.3,.035);piece(g,sphereG,['#e9b197','#ecce83','#b6a9c3'][i%3],x,.54,z,.10,.07,.1);}return g;}
    if(type==='well'||type==='stonewell'){const ring=geo('well-ring',()=>new THREE.TorusGeometry(.33,.10,5,12));for(let i=0;i<3;i++){const m=piece(g,ring,type==='stonewell'?'#bbc0af':'#adad93',0,.18+i*.17,0);m.rotation.x=Math.PI/2;}piece(g,cylinderG,'#6da5a6',0,.24,0,.26,.02,.26);for(const x of [-.39,.39])box(g,'#947349',x,.74,0,.08,1.18,.08);piece(g,roofGeometry(.98,.36,.8),roofColor,0,1.32,0);box(g,'#a5845f',0,1.08,0,.84,.075,.075);box(g,'#e1c28b',.09,.83,0,.02,.5,.02);piece(g,cylinderG,'#a98c60',.09,.54,0,.13,.22,.13);for(const z of [-.06,.06])beam(g,'#675f4c',[.0,.61,z],[.18,.61,z],.018);return g;}
    if(type==='tower'){for(const side of [-1,1]){beam(g,'#94734b',[-.62,.5,side*.65],[.62,1.85,side*.65],.055);beam(g,'#94734b',[side*.65,.5,-.62],[side*.65,1.85,.62],.055);}for(const x of [-.65,.65])for(const z of [-.65,.65])box(g,'#a17e52',x,1.1,z,.18,2.2,.18);box(g,'#c9a777',0,2.16,0,1.72,.16,1.72);for(const z of [-.77,.77])box(g,'#a17e52',0,2.55,z,1.7,.16,.1);for(const x of [-.77,.77])box(g,'#a17e52',x,2.55,0,.1,.16,1.7);piece(g,roofGeometry(2,.9,2),roofColor,0,2.92,0);for(let i=0;i<7;i++)box(g,'#bb955f',0,.25+i*.28,1,.65,.09,.12);for(const x of [-.35,.35])box(g,'#8c6c45',x,1.12,1,.08,2.2,.08);return g;}
    const town=['store','townhouse','townhall'].includes(type),keep=type==='keep',stone=type!=='lodge'&&type!=='store',w=keep||type==='store'||type==='townhall'?3.6:2.7,d=2.65,h=keep?2.5:town?2.1:1.8;
    const wallColor=type==='store'?'#d8bf91':type==='townhouse'?'#d3ae99':stone?'#c5c7b6':'#b28e5e';box(g,'#9d9e8d',0,.13,0,w+.16,.24,d+.15);box(g,wallColor,0,h/2+.2,0,w,h,d);
    for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])for(let j=0;j<5;j++)box(g,stone?'#dad7c2':'#896a45',x,.4+j*.35,z,.17,.19,.17);
    box(g,'#5b6559',0,.77,d/2+.025,.65,1.17,.04);piece(g,cylinderG,'#d5c8a7',0,1.4,d/2+.06,.38,.05,.38).rotation.x=Math.PI/2;
    for(const x of [-w*.30,w*.30]){box(g,'#f1d7a0',x,1.22,d/2+.04,.5,.62,.05);box(g,'#836c51',x,1.22,d/2+.08,.04,.68,.055);box(g,'#836c51',x,1.22,d/2+.09,.57,.04,.05);for(const dx of [-.33,.33])box(g,roofColor,x+dx,1.22,d/2+.05,.14,.7,.07);box(g,'#a2845e',x,.85,d/2+.16,.73,.12,.26);for(let i=0;i<3;i++)piece(g,sphereG,i%2?'#dfb493':'#819d69',x-.22+i*.22,.97,d/2+.17,.11,.10,.09);}
    if(keep){box(g,'#dbd6c2',0,h+.28,0,w+.15,.2,d+.15);for(let i=0;i<8;i++)for(const z of [-d/2,d/2])box(g,'#c5c7b6',-w/2+.18+i*.46,h+.58,z,.27,.48,.30);for(let i=0;i<5;i++)for(const x of [-w/2,w/2])box(g,'#c5c7b6',x,h+.58,-d/2+.25+i*.53,.3,.48,.28);}
    else{piece(g,roofGeometry(w+.4,1.18,d+.4),roofColor,0,h+.2,0);box(g,'#e4d6b5',0,h+1.41,0,.13,.10,d+.46);for(const side of [-1,1])for(let i=1;i<5;i++){const x=side*i*(w+.4)/10,y=h+.2+1.18*(1-Math.pow(i/5,.82));const strip=box(g,roofColor,x,y+.03,0,.065,.035,d+.39);strip.rotation.z=Math.atan(-side*1.18*.82*Math.pow(i/5,-.18)*2/(w+.4));}box(g,'#b0afa0',w*.30,h+.90,-.7,.38,1.1,.4);box(g,'#d5cfb5',w*.30,h+1.48,-.7,.48,.11,.48);}
    box(g,'#cfc6a8',0,.19,d/2+.23,.93,.14,.45);
    if(!keep){const dormer=new THREE.Group();dormer.position.set(-w*.30,h+.89,d*.18);dormer.rotation.y=-Math.PI/2;box(dormer,'#e8d8b8',0,.05,0,.68,.6,.65);piece(dormer,roofGeometry(.86,.42,.9),roofColor,0,.35,0);box(dormer,'#eec87b',0,.04,.34,.33,.36,.025);box(dormer,'#6b796c',0,.04,.36,.04,.4,.025);g.add(dormer);}
    for(let i=0;i<12;i++){const z=-d/2+.2+(i%4)*.27,y=.34+Math.floor(i/4)*.28;piece(g,rockG,i%3?'#739663':'#91aa74',-w/2-.04,y,z,.12,.17,.19);}
    const lampX=w/2-.25;box(g,'#78634a',lampX,1.15,d/2+.30,.05,.7,.05);box(g,'#eacb89',lampX,1.40,d/2+.33,.19,.26,.18);piece(g,coneG,'#687c70',lampX,1.60,d/2+.33,.17,.13,.17);
    if(type==='store'){for(let i=0;i<8;i++){const m=box(g,i%2?'#ede1b6':'#7fa59a',-1.58+i*.45,1.75,1.92,.44,.075,1.1);m.rotation.x=.14;}for(const x of [-1.76,1.76])box(g,'#907450',x,.85,2.38,.08,1.7,.08);box(g,'#94734a',0,.64,2,.97,.7,.45);for(const x of [-1.2,1.2]){box(g,'#b5915d',x,.37,2,.5,.7,.5);for(let i=0;i<3;i++)piece(g,sphereG,i%2?'#d3a15d':'#a4b86d',x+(i-1)*.13,.79,2,.11,.12,.11);}box(g,'#eee0b5',0,2.27,d/2+.08,1.3,.35,.1);piece(g,rockG,'#74a59c',0,2.28,d/2+.15,.18,.13,.08);}
    sideDetails(g,w,d,h,roofColor,stone);
    if(!keep){box(g,'#626b5d',w*.30,h+1.55,-.7,.29,.025,.29);const rear=new THREE.Group();rear.rotation.y=Math.PI/2;rear.position.set(w*.30,h+.89,-d*.22);box(rear,'#e0d2b0',0,0,0,.57,.5,.56);piece(rear,roofGeometry(.76,.38,.72),roofColor,0,.25,0);box(rear,'#e5c68a',0,0,.29,.3,.3,.035);g.add(rear);}
    return g;
  }
  function syncForest(save){const key=JSON.stringify(save.cleared||[]);if(key===lastCleared&&forestScene)return;lastCleared=key;if(forestScene){scene.remove(forestScene);forestScene.traverse(m=>m.isInstancedMesh&&m.dispose());}const chunks=new Map();treesToPick.clear();
    for(const t of world.forest){if(!world.treePresent(save,t))continue;const key=Math.floor(t.x/12)+','+Math.floor(t.z/12);if(!chunks.has(key))chunks.set(key,new THREE.Group());tree(chunks.get(key),t.x,world.groundHeight(t.x,t.z),t.z,t.scale,t.kind==='oak');const hit=new THREE.Mesh(cylinderG,mat('#ffffff'));hit.position.set(t.x,world.groundHeight(t.x,t.z)+1.3,t.z);hit.scale.set(.8*t.scale,3*t.scale,.8*t.scale);hit.userData.tree=world.treeKey(t);treesToPick.add(hit);}treesToPick.updateMatrixWorld(true);forestScene=new THREE.Group();for(const chunk of chunks.values())forestScene.add(instance(chunk,false));scene.add(forestScene);renderer.shadowMap.needsUpdate=true;
  }
  function syncLand(save){const key=JSON.stringify(save.land);if(key===lastLand)return;lastLand=key;const points=[];for(const z of [{x:0,y:0,w:12,h:10},...content.zones.filter(z=>save.land.includes(z.id))]){for(let x=z.x;x<=z.x+z.w;x++)points.push(x,world.groundHeight(x,z.y)+.04,z.y,x,world.groundHeight(x,z.y+z.h)+.04,z.y+z.h);for(let y=z.y;y<=z.y+z.h;y++)points.push(z.x,world.groundHeight(z.x,y)+.04,y,z.x+z.w,world.groundHeight(z.x+z.w,y)+.04,y);}gridG.setAttribute('position',new THREE.Float32BufferAttribute(points,3));gridG.computeBoundingSphere();landMarkers.clear();for(const z of content.zones){const g=new THREE.Group();g.position.set(z.x,world.groundHeight(z.x,z.y),z.y);g.userData.land=z.id;box(g,'#96764c',0,.55,0,.08,1.1,.08);box(g,save.land.includes(z.id)?'#c4d8ac':'#e5c68c',0,.97,0,.85,.38,.08);landMarkers.add(g);} }
  function model(type,mask=0,color=0){const g=new THREE.Group(),roofColor=['#52877e','#ac715e','#8e84a5','#bd9858','#53788b'][color%5];
    if(['palisade','stonewall','fortgate','stonegate','fence','gate'].includes(type))return wallModel(type,mask,color);
    if(['path','cobble','moat','drawbridge'].includes(type))return pathModel(type,mask,color);
    if(['lodge','stonehome','keep','well','stonewell','tower','flowerbed','store','townhouse','townhall'].includes(type))return newBuilding(type,roofColor);
    if(['tent','canvas','cabin'].includes(type)){
      const cabin=type==='cabin',w=cabin?2.7:1.75,d=1.8,h=type==='tent'?1.55:1.8;
      box(g,'#a78355',0,.11,0,w+.1,.17,d+.1);
      if(cabin){box(g,'#bb925e',0,.72,0,w,1.2,d);for(let j=0;j<6;j++){box(g,'#926b46',-w/2-.01,.22+j*.19,0,.025,.027,d);box(g,'#d1ad74',0,.22+j*.19,d/2+.015,w,.024,.03);}box(g,'#4a6153',0,.64,d/2+.028,.58,1,.03);for(const x of [-.88,.88]){box(g,'#79583c',x,.88,d/2+.04,.49,.53,.04);box(g,'#f8d583',x,.88,d/2+.07,.38,.4,.04);box(g,'#79583c',x,.88,d/2+.10,.025,.42,.03);}piece(g,roofGeometry(w+.36,1.1,d+.32),roofColor,0,1.36,0);box(g,'#ddd0aa',0,2.47,0,.13,.11,d+.4);}
      else {piece(g,roofGeometry(w,h,d),type==='tent'?(color?roofColor:'#dba867'):roofColor,0,.18,0);const door=piece(g,roofGeometry(w*.45,h*.72,.025),'#4d6557',0,.18,d/2+.018);box(g,'#eee0b4',0,h+.2,0,.065,.065,d+.12);for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])box(g,'#6e5639',x,.24,z,.07,.4,.07);}
      if(cabin)sideDetails(g,w,d,1.2,roofColor,false);
      else{piece(g,roofGeometry(w*.35,h*.53,.028),'#9d885e',0,.18,-d/2-.018);for(const side of [-1,1])for(const end of [-1,1]){beam(g,'#e5d6ae',[side*w*.31,h*.30,end*d*.39],[side*(w/2+.16),.11,end*(d/2+.03)],.015);box(g,'#8c7150',side*(w/2+.16),.13,end*(d/2+.03),.045,.24,.045);}for(const end of [-1,1])beam(g,'#eee0ba',[0,h+.2,end*d/2],[0,.22,end*(d/2+.06)],.018);}
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
      for(let j=0;j<2;j++){box(g,'#c8a771',0,.8+j*.18,-.32,1.85,.14,.11);for(const x of [-.73,.73])for(const z of [-.385,-.255])piece(g,rockG,'#806b4f',x,.8+j*.18,z,.024,.023,.011);}box(g,'#947144',0,.25,0,1.5,.09,.10);
    }else if(type==='fence'||type==='gate'){
      for(const x of [-.44,.44]){box(g,'#927047',x,.43,0,.13,.86,.13);piece(g,coneG,'#c0a16d',x,.89,0,.11,.12,.11);}
      const rails=new THREE.Group();g.add(rails);if(type==='gate'){rails.position.x=-.4;g.userData.gate=rails;for(let j=0;j<4;j++)box(rails,'#b59a66',.12+j*.18,.4,0,.09,.53,.07);}for(const y of [.29,.65])box(rails,'#c5a775',type==='gate'?.4:0,y,0,.88,.10,.09);
    }else if(type==='path'){for(const [x,z,w,d] of [[-.21,-.2,.4,.35],[.23,-.19,.38,.38],[-.2,.22,.36,.38],[.21,.23,.43,.35]]){const stone=piece(g,cylinderG,'#b2b4a0',x,.065,z,w,.075,d);stone.scale.x*=.6;stone.scale.z*=.6;}}
    else if(type==='deck'){for(let i=0;i<5;i++)box(g,i%2?'#bf9a63':'#cba674',-.39+i*.195,.11,0,.18,.13,.96);}
    else if(type==='lantern'){box(g,'#756041',0,.51,0,.065,1.05,.065);box(g,'#756041',.15,1.03,0,.35,.055,.055);box(g,'#f8d88b',.27,.84,0,.18,.28,.18);box(g,'#647364',.27,1.01,0,.23,.07,.23);box(g,'#647364',.27,.67,0,.23,.05,.23);}
    else if(type==='feeder'){box(g,'#967449',0,.57,0,.11,1.13,.11);box(g,'#cbb07e',0,1.03,0,.55,.07,.5);for(const x of [-.21,.21])for(const z of [-.18,.18])box(g,'#af8d5e',x,1.18,z,.045,.3,.045);piece(g,roofGeometry(.68,.3,.58),'#638e83',0,1.32,0);piece(g,rockG,'#d4b578',0,1.11,0,.12,.06,.1);}
    return g;
  }
  function locate(g,o){const f=footprint(o.type,o.r);g.position.set(o.x+f.w/2,world.groundHeight(o.x+f.w/2,o.y+f.h/2),o.y+f.h/2);if(!g.userData.connected)g.rotation.y-= (o.r||0)*Math.PI/2;g.userData.id=o.id;return g;}
  const pickMaterial=new THREE.MeshBasicMaterial({visible:false});extraMaterials.add(pickMaterial);
  function sync(save){currentSave=save;syncForest(save);syncLand(save);const key=JSON.stringify([save.objects,save.construction]);if(key!==lastObjects){
    releaseBatch(objects);objects.clear();objectMap.clear();flames=[];gates=[];const staticPieces=new THREE.Group();
    for(const o of save.objects){let g=model(o.type,content.mask(save.objects,o,catalog),o.color||0);const live=g.userData.gate||g.userData.flame||save.construction?.objectId===o.id;
      if(live){if(!g.userData.gate&&!g.userData.flame)g=instance(g,false);g=locate(g,o);objects.add(g);objectMap.set(o.id,g);if(g.userData.flame)flames.push(g.userData.flame);if(g.userData.gate)gates.push(g);}
      else {g=locate(g,o);staticPieces.add(g);const size=footprint(o.type,o.r),bounds=new THREE.Box3().setFromObject(g),height=Math.max(.22,bounds.max.y-world.groundHeight(o.x,o.y));const pick=new THREE.Mesh(boxG,pickMaterial);pick.position.set(o.x+size.w/2,world.groundHeight(o.x,o.y)+height/2,o.y+size.h/2);pick.scale.set(size.w,height,size.h);pick.userData.id=o.id;objects.add(pick);}
    }objects.add(instance(staticPieces,false,true));lastObjects=key;renderer.shadowMap.needsUpdate=true;
    }
    const h=JSON.stringify(save.harvested);if(h!==lastHarvest){wood.clear();sources.forEach((p,i)=>{const g=new THREE.Group();g.position.set(p.x+.5,.09,p.y+.5);g.userData.source=i;for(let j=0;j<(save.harvested.includes(i)?1:3);j++)log(g,0,.13+(j===2?.17:0),j===2?0:-.13+j*.26,.7,.10);if(!save.harvested.includes(i))piece(g,rockG,mat('#e3c770',true),0,.65,0,.085,.14,.085);wood.add(g);});lastHarvest=h;renderer.shadowMap.needsUpdate=true;}
  }
  function actor(dog=false){const g=new THREE.Group(),limbs=[];const hue=String(avatar||'').split('').reduce((n,c)=>n+c.charCodeAt(0),0)%3;
    if(dog){piece(g,sphereG,'#d3a269',0,.39,0,.21,.24,.35);piece(g,sphereG,'#ead5ae',0,.57,.27,.23,.24,.22);piece(g,sphereG,'#f4e9cf',0,.51,.43,.14,.10,.11);piece(g,rockG,'#35423a',0,.54,.52,.06,.045,.04);for(const x of [-.14,.14]){piece(g,coneG,'#b57a4f',x,.80,.21,.105,.27,.075);piece(g,rockG,'#2d3a33',x*.65,.64,.452,.023,.032,.024);}for(const x of [-.13,.13])for(const z of [-.20,.21]){const leg=box(g,'#e6c493',x,.18,z,.11,.3,.11);limbs.push(leg);}const tail=piece(g,coneG,'#e6c493',0,.5,-.4,.09,.3,.09);tail.rotation.x=-.9;g.userData.tail=tail;}
    else{const skin=['#dba575','#a87654','#c28d67'][hue],coat=['#ca8159','#58958b','#6486a1'][hue];box(g,coat,0,.71,0,.43,.54,.27);box(g,'#bf9f64',0,.77,-.19,.32,.38,.15);piece(g,sphereG,skin,0,1.15,0,.245,.27,.23);piece(g,sphereG,'#634e3b',0,1.31,-.025,.25,.15,.235);piece(g,cylinderG,'#648977',0,1.36,0,.29,.075,.26);box(g,'#648977',0,1.34,.2,.35,.06,.23);for(const x of [-.082,.082])piece(g,rockG,'#37433b',x,1.16,.214,.024,.031,.026);for(const x of [-.27,.27]){const arm=new THREE.Group();arm.position.set(x,.9,0);box(arm,coat,0,-.17,0,.12,.34,.14);piece(arm,sphereG,skin,0,-.37,0,.074,.08,.07);g.add(arm);limbs.push(arm);}for(const x of [-.13,.13]){const leg=new THREE.Group();leg.position.set(x,.49,0);box(leg,'#53635c',0,-.17,0,.16,.34,.17);box(leg,'#765741',0,-.38,.05,.18,.12,.25);g.add(leg);limbs.push(leg);}}
    g.userData.limbs=limbs;g.traverse(m=>{if(m.isMesh)m.castShadow=false;});scene.add(g);return g;
  }
  const explorerActor=actor(),petActor=actor(true);
  const hammer=new THREE.Group();box(hammer,'#9c794c',0,-.42,.12,.04,.28,.04);box(hammer,'#92998e',0,-.56,.12,.2,.09,.09);explorerActor.userData.limbs[1].add(hammer);hammer.visible=false;
  const fishingRig=new THREE.Group();const rod=box(fishingRig,'#b9955d',0,.75,0,.045,1.65,.045);rod.rotation.z=-.85;const line=box(fishingRig,'#f2e4bd',.62,.43,0,.012,1.7,.012);piece(fishingRig,sphereG,'#cb785e',.62,-.45,0,.055,.08,.055);scene.add(fishingRig);fishingRig.visible=false;
  const townResidents=[actor(),actor()];
  const village=new THREE.Group();for(const [i,b] of content.town.entries()){const g=newBuilding(b.type,['#638f87','#bb8166','#808ca2','#bd9b64','#829871'][i%5]);g.position.set(b.x+b.w/2,world.groundHeight(b.x+b.w/2,b.y+b.h/2),b.y+b.h/2);village.add(g);const proxy=new THREE.Mesh(boxG,mat('#ffffff'));proxy.position.set(b.x+b.w/2,1.8,b.y+b.h/2);proxy.scale.set(b.w,3.6,b.h+1);proxy.userData.location=b.id==='store'?'store':b.id==='mill'?'mill':'market';townPick.add(proxy);}townPick.updateMatrixWorld(true);
  for(const [x,z] of [[23,7],[27,9],[40,8]]){const flowers=newBuilding('flowerbed','#769a85');flowers.position.set(x,world.groundHeight(x,z),z);village.add(flowers);}
  const townWell=newBuilding('stonewell','#829baa');townWell.position.set(26.7,world.groundHeight(26.7,7.5),7.5);village.add(townWell);instance(village);
  const dock=new THREE.Group();for(let i=0;i<9;i++)box(dock,'#b89969',14.3+i*.25,world.groundHeight(14,8)+.11,8.5,.23,.14,1.6);instance(dock);const dockMarker=new THREE.Group();dockMarker.position.set(14,world.walkHeight(14,8),8);dockMarker.userData.location='fish';box(dockMarker,'#907347',0,.55,0,.07,1.1,.07);box(dockMarker,'#dcc496',0,1,0,.66,.3,.08);piece(dockMarker,rockG,'#63959d',0,1,.09,.2,.08,.04);markers.add(dockMarker);

  const worldDetails=createWorldDetails({THREE,scene,world,content,guardians,geo,mat,piece,box,instance,newBuilding,tree,pathModel,roadMaterials:{cobble:pavingMat,trail:mat('#c8b690')},groundShade,sphereG,rockG,cylinderG,coneG,boxG});
  const shadowM=new THREE.MeshBasicMaterial({color:'#354d3e',transparent:true,opacity:.2,depthWrite:false});extraMaterials.add(shadowM);
  const explorerShadow=piece(scene,circleG,shadowM,0,0,0,.31,.31,.31),petShadow=piece(scene,circleG,shadowM,0,0,0,.27,.27,.27);explorerShadow.rotation.x=petShadow.rotation.x=-Math.PI/2;
  const bird=new THREE.Group();piece(bird,sphereG,'#c6a35f',0,0,0,.12,.1,.19);const wings=[-1,1].map(sign=>box(bird,'#6c8791',sign*.16,0,0,.24,.045,.14));scene.add(bird);
  function updateCamera(view){const zoom=Math.max(.55,Math.min(1.8,view.zoom)),angle=Math.PI/4+(Number.isFinite(view.angle)?view.angle:0),scale=ppu*zoom;
    const right=new THREE.Vector3(Math.cos(angle),0,-Math.sin(angle)),up=new THREE.Vector3(-Math.sin(angle),0,-Math.cos(angle));
    const target=new THREE.Vector3(6,0,5).addScaledVector(right,-view.x/scale).addScaledVector(up,view.y/(scale*.7071));
    const bounded=target.clone();bounded.x=Math.max(content.bounds.minX+1,Math.min(content.bounds.maxX-1,bounded.x));bounded.z=Math.max(content.bounds.minY+1,Math.min(content.bounds.maxY-1,bounded.z));const delta=bounded.clone().sub(target);view.x-=delta.dot(right)*scale;view.y+=delta.dot(up)*scale*.7071;target.copy(bounded);if(sun.target.position.distanceTo(target)>7){sun.target.position.copy(target);sun.position.copy(target).add(new THREE.Vector3(-12,24,9));renderer.shadowMap.needsUpdate=true;}
    camera.left=-width/(2*scale);camera.right=width/(2*scale);camera.top=height/(2*scale);camera.bottom=-height/(2*scale);camera.position.copy(target).add(new THREE.Vector3(Math.sin(angle)*28,28,Math.cos(angle)*28));camera.lookAt(target);camera.updateProjectionMatrix();camera.updateMatrixWorld();
  }
  function project(x,z,y=0){vector.set(x,world.walkHeight(x,z)+y,z).project(camera);return {x:(vector.x+1)*width/2,y:(1-vector.y)*height/2};}
  function cast(px,py){ndc.set(px/width*2-1,1-py/height*2);raycaster.setFromCamera(ndc,camera);}
  function cell(px,py){cast(px,py);const hit=raycaster.intersectObject(terrain,true)[0];return hit?{x:Math.floor(hit.point.x),y:Math.floor(hit.point.z)}:{x:-99,y:-99};}
  function pick(px,py){cast(px,py);const hits=raycaster.intersectObjects([objects,wood,markers,treesToPick,townPick,landMarkers,worldDetails.picks],true);for(const hit of hits){let o=hit.object;while(o&&o!==scene){if(o.userData.guardian!==undefined||o.userData.id||o.userData.source!==undefined||o.userData.discovery||o.userData.tree||o.userData.location||o.userData.land)return o.userData;o=o.parent;}}return null;}
  function focus(x,z,view,placement=false){updateCamera(view);const p=project(x,z);view.x+=width*.5-p.x;view.y+=height*(placement?.36:.5)-p.y;}
  function follow(pos,view){updateCamera(view);const p=project(pos.x+.5,pos.y+.5);if(p.x<65||p.x>width-85||p.y<210||p.y>height-180)focus(pos.x+.5,pos.y+.5,view);}
  function resize(w,h,q){width=w;height=h;quality=q;ppu=Math.min(height/19,width/18);renderer.setPixelRatio(Math.min(devicePixelRatio||1,q==='low'?1:1.5));renderer.setSize(w,h,false);canvas.style.width=w+'px';canvas.style.height=h+'px';renderer.shadowMap.enabled=q!=='low';renderer.shadowMap.needsUpdate=true;}
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
  function render(state,time){if(disposed||renderer.getContext().isContextLost())return;const {save,explorer,pet,heading,walking,seated,preview,selected,mode,calm,activity,building}=state;sync(save);updateCamera(state.camera);worldDetails.update(time,calm);
    if(wasNight!==save.night){wasNight=save.night;scene.background.set(save.night?'#718e99':'#c7ded5');scene.fog.color.copy(scene.background);ambient.intensity=save.night?1.5:2.1;ambient.color.set(save.night?'#a8c5dd':'#fff3d7');sun.intensity=save.night?.7:2.5;sun.color.set(save.night?'#bdd7e9':'#fff1cb');renderer.shadowMap.needsUpdate=true;}
    townResidents.forEach((g,i)=>{const t=calm?0:time*.00018+i*2;g.position.set(25+Math.sin(t)*2,world.walkHeight(25,6),6+Math.cos(t)*.7);g.rotation.y=Math.cos(t)>0?Math.PI/2:-Math.PI/2;g.userData.limbs.forEach((l,j)=>l.rotation.x=calm?0:Math.sin(time*.008+j%2*Math.PI)*.25);});
    const fire=save.objects.find(o=>o.type==='fire');fireLight.visible=save.night&&!!fire;if(fire)fireLight.position.set(fire.x+.5,1,fire.y+.5);
    grid.visible=mode==='build'||!!preview;highlight.visible=!!preview||!!selected;
    const p=preview||save.objects.find(o=>o.id===selected);if(p){const f=footprint(p.type,p.r);highlight.position.set(p.x+f.w/2,world.groundHeight(p.x+f.w/2,p.y+f.h/2)+.065,p.y+f.h/2);highlight.scale.set(f.w,.025,f.h);}
    const previewKey=JSON.stringify([preview,lastObjects]);if(previewKey!==lastPreview){if(ghost)scene.remove(ghost);ghost=null;if(preview){ghost=locate(model(preview.type,content.mask(save.objects.filter(o=>o.id!==preview.id),preview,catalog),preview.color||0),preview);scene.add(ghost);}lastPreview=previewKey;}
    if(ghost){const reason=placementReason(save,preview.type,preview.x,preview.y,preview.r,preview.id);highlight.material.color.set(reason?'#f07865':'#fae7a0');ghost.traverse(m=>{if(m.isMesh){m.material=reason?ghostBad:ghostGood;m.castShadow=false;}});}else highlight.material.color.set('#ffdc84');
    explorerActor.position.set(explorer.x+.5,world.walkHeight(explorer.x+.5,explorer.y+.5),explorer.y+.5);explorerActor.rotation.y=heading;
    if(seated){const f=footprint(seated.type,seated.r);explorerActor.position.set(seated.x+f.w/2,.13,seated.y+f.h/2);explorerActor.rotation.y=-(seated.r||0)*Math.PI/2;}
    if(save.construction){const g=objectMap.get(save.construction.objectId);if(g)g.scale.y=building?.id===save.construction.objectId?Math.max(.08,building.progress):.08;}
    hammer.visible=!!building;
    fishingRig.visible=save.challenge?.kind==='fish';if(fishingRig.visible){fishingRig.position.copy(explorerActor.position).add(new THREE.Vector3(.15,.45,.2));fishingRig.rotation.y=-Math.PI/2;line.scale.y=calm?1:1+Math.sin(time*.003)*.025;}
    explorerActor.userData.limbs.forEach((limb,i)=>{limb.rotation.x=building&&i<2?-1+Math.sin(time*.025+i)*.45:seated&&i>1?-1.25:walking&&!calm?Math.sin(time*.013+(i%2)*Math.PI)*.5:0;});
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
  function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);geometries.forEach(g=>g.dispose());extraGeometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());extraMaterials.forEach(m=>m.dispose());worldDetails.dispose();shadeTexture.dispose();pavingTexture.dispose();scene.traverse(m=>m.isInstancedMesh&&m.dispose());scene.clear();renderer.dispose();renderer.forceContextLoss();}
  return {resize,render,project,cell,pick,focus,follow,thumbnail,stats:()=>({...renderer.info.render,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}),dispose};
}
