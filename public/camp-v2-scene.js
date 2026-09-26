/* Original procedural woodland art. Three.js is pinned and served locally.
   This renderer owns GPU resources; camp commands and saves remain in CampV2. */
import * as THREE from './vendor/three/three.module.min.js';
import {createWorldDetails} from './camp-world-details.js';
import {createInk} from './camp-ink.js';

export function createScene(canvas, {catalog, footprint, sources, world, avatar, guardians=[], placementReason, lowPower=false, onContextLost, onContextRestored, ownerName='', visitor=null, goldRealms=[], season='summer', patterns=null, companions=[]}) {
  const renderer = new THREE.WebGLRenderer({canvas, antialias:!lowPower, alpha:false, powerPreference:'low-power'});
  try{
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
  /* Trees open a see-through window between the camera and the explorer or the selected building,
     so nothing the child cares about is ever hidden behind the forest. */
  const seeUniforms={seeFocus:{value:new THREE.Vector3()},seeCam:{value:new THREE.Vector3()},seeRadius:{value:1.7},seeOn:{value:0}};
  const treeMaterials=new Map();
  // The same season as the adventure map: blossom in spring, gold and russet in autumn, bare and snowy in winter.
  const SEASON_TINT={spring:{'#7f9c58':'#8db45e','#92aa64':'#e8bccb','#6d934e':'#7fae58'},autumn:{'#7f9c58':'#c98a3c','#92aa64':'#dcae4c','#6d934e':'#b0602f'},winter:{'#7f9c58':'#a3a192','#92aa64':'#c2bfb2','#6d934e':'#8f8e80','#6b9c6e':'#eef2ef'}}[season]||{};
  const GROUND_TINT={spring:['#a9cc80',.18],autumn:['#c9bf82',.22],winter:['#eef1ec',.72]}[season];
  function treeMat(color){color=SEASON_TINT[color]||color;if(treeMaterials.has(color))return treeMaterials.get(color);const m=new THREE.MeshLambertMaterial({color});m.customProgramCacheKey=()=>'see-through-tree';m.onBeforeCompile=shader=>{Object.assign(shader.uniforms,seeUniforms);shader.vertexShader=shader.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vSeeWorld;').replace('#include <project_vertex>','#include <project_vertex>\nvec4 seeW=vec4(transformed,1.0);\n#ifdef USE_INSTANCING\nseeW=instanceMatrix*seeW;\n#endif\nvSeeWorld=(modelMatrix*seeW).xyz;');shader.fragmentShader=shader.fragmentShader.replace('#include <common>','#include <common>\nvarying vec3 vSeeWorld;uniform vec3 seeFocus;uniform vec3 seeCam;uniform float seeRadius;uniform float seeOn;').replace('#include <clipping_planes_fragment>','#include <clipping_planes_fragment>\nif(seeOn>0.5){vec3 axis=seeFocus-seeCam;float t=clamp(dot(vSeeWorld-seeCam,axis)/dot(axis,axis),0.0,1.0);float seeD=length(vSeeWorld-(seeCam+axis*t));if(t<0.985&&(seeD<seeRadius-0.35||(seeD<seeRadius&&mod(floor(gl_FragCoord.x)+floor(gl_FragCoord.y),2.0)<1.0)))discard;}');};treeMaterials.set(color,m);return m;}
  function tree(p,x,y,z,scale=1,oak=false){const g=new THREE.Group();g.position.set(x,y,z);g.scale.setScalar(scale);p.add(g);groundShade(g,0,0,3.1,2.8);piece(g,cylinderG,treeMat('#76543c'),0,1.15,0,.16,2.3,.16);
    if(oak){for(let i=0;i<5;i++)piece(g,sphereG,treeMat(['#7f9c58','#92aa64','#6d934e'][i%3]),Math.sin(i*2.4)*.65,2.5+(i%2)*.4,Math.cos(i*2.4)*.6,.93,.92,.93);}
    else{piece(g,coneG,treeMat('#386e54'),0,1.45,0,1.04,1.7,1.04);piece(g,coneG,treeMat('#49835e'),0,2.12,0,.83,1.65,.83);piece(g,coneG,treeMat('#6b9c6e'),0,2.77,0,.56,1.4,.56);}
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
  const uvs=[],groundTint=GROUND_TINT?new THREE.Color(GROUND_TINT[0]):null;
  function terrainVertex(x,z,tint){const y=world.groundHeight(x,z),bank=Math.abs(x-world.river(z));positions.push(x,y,z);uvs.push(x/9,z/9);terrainColor.set(bank<2.8?'#c8bf99':content.civic(x,z)?'#a7b98b':z<-6?'#8fa67c':'#9eb878');if(groundTint&&bank>=2.2)terrainColor.lerp(groundTint,GROUND_TINT[1]);terrainColor.multiplyScalar(.97+Math.sin(x*.29)*Math.cos(z*.24)*.05+Math.sin(x*.07+z*.05)*.03);colors.push(terrainColor.r,terrainColor.g,terrainColor.b);}
  // A tile of painted paper for the ground: soft washes, blooms, and small pencil strokes of grass.
  const groundCanvas=document.createElement('canvas');groundCanvas.width=groundCanvas.height=256;{const g=groundCanvas.getContext('2d');g.fillStyle='#f4f1e8';g.fillRect(0,0,256,256);
    for(let i=0;i<60;i++){const x=random(i,1)*256,y=random(i,2)*256,r=18+random(i,3)*50,grd=g.createRadialGradient(x,y,0,x,y,r),dark=random(i,4)<.5;grd.addColorStop(0,dark?'rgba(150,140,110,.13)':'rgba(255,255,250,.2)');grd.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=grd;for(const ox of[-256,0,256])for(const oy of[-256,0,256])g.fillRect(x+ox-r,y+oy-r,r*2,r*2);}
    g.strokeStyle='rgba(90,96,62,.34)';g.lineWidth=1.1;g.lineCap='round';for(let i=0;i<150;i++){const x=random(i,5)*256,y=random(i,6)*256,k=2+Math.floor(random(i,7)*3);g.beginPath();for(let j=0;j<k;j++){const a=-1.9+j*.45+random(i,8+j)*.3,l=4+random(i,11+j)*4;g.moveTo(x+j*1.6,y);g.lineTo(x+j*1.6+Math.cos(a)*l*.4,y+Math.sin(a)*l);}g.stroke();}
    g.fillStyle='rgba(120,110,86,.25)';for(let i=0;i<500;i++){g.fillRect(random(i,21)*256,random(i,22)*256,1,1);}}
  const groundTexture=new THREE.CanvasTexture(groundCanvas);groundTexture.wrapS=groundTexture.wrapT=THREE.RepeatWrapping;groundTexture.colorSpace=THREE.SRGBColorSpace;groundTexture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());
  const terrainM=new THREE.MeshLambertMaterial({vertexColors:true,flatShading:false,map:groundTexture});extraMaterials.add(terrainM);
  // Cull terrain in the same local chunks as the forest, rather than draw the whole valley.
  for(let cz=minZ;cz<maxZ;cz+=16)for(let cx=minX;cx<maxX;cx+=16){positions.length=0;colors.length=0;uvs.length=0;
    for(let z=cz;z<Math.min(cz+16,maxZ);z++)for(let x=cx;x<Math.min(cx+16,maxX);x++)[[x,z],[x,z+1],[x+1,z],[x+1,z],[x,z+1],[x+1,z+1]].forEach(([a,b])=>terrainVertex(a,b,1));
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));g.computeVertexNormals();extraGeometries.add(g);const mesh=new THREE.Mesh(g,terrainM);mesh.receiveShadow=true;terrain.add(mesh);
  }
  const scenery=new THREE.Group();

  for(let i=0;i<145;i++){const x=minX+random(i,61)*(maxX-minX),z=minZ+random(i,78)*(maxZ-minZ);if((x>-1&&x<13&&z>-1&&z<11)||Math.abs(x-world.river(z))<2.8)continue;const y=world.groundHeight(x,z),r=.16+random(i,91)*.45;piece(scenery,rockG,i%3?'#839185':'#a6ae98',x,y+r*.25,z,r,r*.65,r*.8);}
  for(let i=0;i<220;i++){const x=-9+random(i,35)*34,z=-9+random(i,14)*31;if(world.water(x,z)||(x>0&&x<12&&z>0&&z<10)||Math.abs(z-4)<1)continue;const y=world.groundHeight(x,z);piece(scenery,coneG,season==='autumn'?(i%3?'#a58f4f':'#c7ad6a'):season==='winter'?(i%3?'#b9bba9':'#dfe3da'):(i%3?'#7e9b56':'#aac07b'),x,y+.14,z,.10,.3,.1);if(i%4===0){piece(scenery,rockG,i%8?'#f7e5aa':'#d4b0c1',x,y+.31,z,.10,.08,.10);}}
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
  // Ground-following open / future land stays readable while exploring.
  const gridG=new THREE.BufferGeometry(),futureGridG=new THREE.BufferGeometry();
  extraGeometries.add(gridG);extraGeometries.add(futureGridG);
  const gridM=new THREE.LineBasicMaterial({color:'#fff6d7',transparent:true,opacity:.19,depthWrite:false});
  const futureGridM=new THREE.LineDashedMaterial({color:'#ebc68e',transparent:true,opacity:.23,depthWrite:false,dashSize:.18,gapSize:.16});
  extraMaterials.add(gridM);extraMaterials.add(futureGridM);
  const grid=new THREE.LineSegments(gridG,gridM),futureGrid=new THREE.LineSegments(futureGridG,futureGridM);scene.add(grid,futureGrid);
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
  function syncLand(save){
    const key=JSON.stringify(save.land);if(key===lastLand)return;lastLand=key;
    const land=content.landGrid(save);
    for(const [kind,lines] of [['open',grid],['future',futureGrid]]){
      const points=[];
      // Unit edges coincide with the triangulated ground, unlike long parcel lines.
      for(const [x,y,u,v] of land[kind])points.push(x,world.groundHeight(x,y)+.055,y,u,world.groundHeight(u,v)+.055,v);
      lines.geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));lines.geometry.computeBoundingSphere();
    }
    futureGrid.computeLineDistances();landMarkers.clear();
    for(const z of content.zones){const g=new THREE.Group();g.position.set(z.x,world.groundHeight(z.x,z.y),z.y);g.userData.land=z.id;box(g,'#96764c',0,.55,0,.08,1.1,.08);box(g,z.need===0||save.land.includes(z.id)?'#c4d8ac':'#e5c68c',0,.97,0,.85,.38,.08);landMarkers.add(g);}
  }
  /* The child's home has its own silhouette at every tier, separate from village houses.
     Each tier keeps the Cozy Pup Tent's doorstep and porch lantern, and adds one clear new feature. */
  function keepsakes(g,x,z){for(let i=0;i<4;i++)box(g,i%2?'#b99865':'#ceb27b',x-.27+i*.18,.13,z,.17,.1,.3);box(g,'#6c583d',x+.5,.5,z-.05,.045,.85,.045);box(g,'#705739',x+.6,.92,z-.05,.24,.045,.045);piece(g,boxG,mat('#ffd98b',true),x+.68,.8,z-.05,.13,.19,.13);box(g,'#526b5b',x+.68,.92,z-.05,.18,.04,.18);}
  function windowAt(g,x,y,z,w=.42,h=.46,frame='#79583c'){box(g,frame,x,y,z,w+.08,h+.08,.04);piece(g,boxG,windowGlass(),x,y,z+.03,w,h,.04);box(g,frame,x,y,z+.06,.03,h,.03);box(g,frame,x,y,z+.06,w,.03,.03);}
  function chimney(g,x,z,top){for(let y=.3;y<top;y+=.24)box(g,y%.48<.24?'#9d9e8d':'#b3b3a1',x,y,z,.38,.24,.38);box(g,'#7d7f70',x,top+.06,z,.46,.12,.46);g.userData.chimney=[x,top+.25,z];}
  function nameSign(g,x,z){for(const dx of [-.42,.42])box(g,'#6c583d',x+dx,.5,z,.07,1,.07);const board=box(g,'#e3c792',x,.95,z+.04,1.02,.4,.05);board.userData.nameBoard=true;box(g,'#8b6a43',x,1.17,z+.04,1.1,.05,.08);box(g,'#8b6a43',x,.73,z+.04,1.1,.04,.08);}
  /* The child's name on their home's sign, drawn once into a small texture. */
  const nameLabelGeometry=new THREE.PlaneGeometry(.96,.34);let nameLabelMat=null;
  function nameLabelMaterial(){if(nameLabelMat)return nameLabelMat;const c=document.createElement('canvas');c.width=256;c.height=96;const x=c.getContext('2d');const text=String(ownerName).slice(0,14);let size=54;x.font=`800 ${size}px system-ui,sans-serif`;while(x.measureText(text).width>232&&size>22){size-=2;x.font=`800 ${size}px system-ui,sans-serif`;}x.fillStyle='#3b2610';x.textAlign='center';x.textBaseline='middle';x.fillText(text,128,50);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;nameLabelMat=new THREE.MeshBasicMaterial({map:t,transparent:true,polygonOffset:true,polygonOffsetFactor:-4,polygonOffsetUnits:-4});return nameLabelMat;}
  function addNameLabel(g,o){if(!ownerName||!['lodge','stonehome','keep'].includes(o.type))return;g.updateMatrixWorld(true);g.traverse(m=>{if(m.userData.nameBoard){const label=new THREE.Mesh(nameLabelGeometry,nameLabelMaterial());label.position.copy(m.localToWorld(new THREE.Vector3(0,0,1.8)));label.renderOrder=2;label.rotation.y=g.rotation.y;objects.add(label);}});}
  function homeModel(type,roofColor){
    const g=new THREE.Group();groundShade(g,0,.2,4.4,4.2);
    if(type==='lodge'){ // two storeys, wide porch, stone chimney
      const w=2.6,d=2.3;box(g,'#9d8a68',0,.1,0,w+.2,.2,d+.2);
      box(g,'#b28e5e',0,.8,0,w,1.2,d);for(let j=0;j<6;j++)box(g,'#d1ad74',0,.28+j*.19,d/2+.015,w,.024,.03);
      box(g,'#e8d9b6',0,1.86,-.08,w-.2,.92,d-.3);for(const x of [-1.1,-.36,.36,1.1])box(g,'#7a5a39',x,1.86,d/2-.13,.07,.92,.04);box(g,'#7a5a39',0,1.43,d/2-.13,w-.2,.07,.04);
      piece(g,roofGeometry(w+.5,1.05,d+.1),roofColor,0,2.32,-.08);box(g,'#e4d6b5',0,3.38,-.08,.13,.1,d+.16);
      windowAt(g,-.8,.95,d/2+.02);windowAt(g,.8,.95,d/2+.02);windowAt(g,-.55,1.95,d/2-.12,.34,.38);windowAt(g,.55,1.95,d/2-.12,.34,.38);box(g,'#4a6153',0,.7,d/2+.03,.5,1,.03);
      box(g,'#c7a574',0,.24,d/2+.55,w+.1,.08,.9);for(const x of [-w/2,w/2])box(g,'#7a5a39',x,.72,d/2+.95,.1,1,.1);const porch=piece(g,roofGeometry(w+.3,.28,.95),roofColor,0,1.22,d/2+.55);porch.rotation.y=0;
      for(let i=0;i<5;i++)box(g,'#8b6a43',-w/2+.25+i*(w-.5)/4,.52,d/2+.98,.05,.5,.05);box(g,'#8b6a43',0,.78,d/2+.98,w,.05,.05);
      chimney(g,w/2-.25,-.55,3.35);for(let i=0;i<6;i++)piece(g,rockG,i%2?'#e4a4a0':'#f0d27c',-w/2+.2+i*.2,.42,d/2+1.05,.07,.07,.07);
      keepsakes(g,-.9,d/2+1.35);nameSign(g,1.05,d/2+1.35);return g;
    }
    if(type==='stonehome'){ // stone ground floor, timbered upper floor, bay window, walled garden
      const w=2.5,d=2.1;box(g,'#9d9e8d',0,.1,-.2,w+.2,.2,d+.2);
      box(g,'#c5c7b6',0,.78,-.2,w,1.2,d);for(let j=0;j<5;j++)for(let i=0;i<6;i++)box(g,(i+j)%2?'#d6d4c2':'#b7b9a8',-w/2+.2+i*.42+(j%2)*.2,.3+j*.22,d/2-.19,.36,.18,.03);
      box(g,'#efe3c4',0,1.82,-.2,w,.9,d);for(const x of [-1.1,0,1.1])box(g,'#5b4430',x,1.82,d/2-.18,.07,.9,.04);beam(g,'#5b4430',[-1.1,1.4,d/2-.17],[0,2.22,d/2-.17],.03);beam(g,'#5b4430',[1.1,1.4,d/2-.17],[0,2.22,d/2-.17],.03);
      piece(g,roofGeometry(w+.45,1.4,d+.25),roofColor,0,2.27,-.2);box(g,'#e4d6b5',0,3.68,-.2,.13,.1,d+.3);
      box(g,'#c5c7b6',-.65,.7,d/2,.9,.95,.45);windowAt(g,-.65,.85,d/2+.23,.6,.46);const bay=piece(g,roofGeometry(1,.3,.5),roofColor,-.65,1.2,d/2);bay.rotation.y=0;
      windowAt(g,.7,1.85,d/2-.17,.36,.4);windowAt(g,-.7,1.85,d/2-.17,.36,.4);box(g,'#4a6153',.65,.62,d/2-.16,.5,.95,.04);piece(g,cylinderG,'#d5c8a7',.65,1.1,d/2-.14,.26,.04,.26).rotation.x=Math.PI/2;
      for(const side of [-1,1]){box(g,'#b7b9a8',side*(w/2+.1),.3,d/2+.8,.28,.4,1.9);box(g,'#d6d4c2',side*(w/2+.1),.52,d/2+.8,.34,.06,1.95);}box(g,'#b7b9a8',-w/2+.25,.3,d/2+1.7,.8,.4,.28);box(g,'#b7b9a8',w/2-.25,.3,d/2+1.7,.8,.4,.28);
      for(let i=0;i<8;i++)piece(g,rockG,['#e4a4a0','#f0d27c','#b6a9c3','#9ec28b'][i%4],-w/2+.35+(i%4)*.25+(i>3?1.4:0),.42,d/2+.35+(i%2)*.4,.09,.09,.09);
      chimney(g,-w/2+.35,-.9,3.7);keepsakes(g,.1,d/2+1.2);nameSign(g,1.35,d/2+1.95);return g;
    }
    // Stone keep: corner towers with cone roofs, a tall central tower with a flag, arched gate and wall walk.
    const w=3.3,d=2.3,h=1.7;box(g,'#9d9e8d',0,.12,0,w+.3,.24,d+.3);
    box(g,'#c5c7b6',0,h/2+.2,0,w,h,d);for(let j=0;j<6;j++)box(g,j%2?'#d6d4c2':'#b7b9a8',0,.35+j*.26,d/2+.015,w,.05,.03);
    for(let i=0;i<9;i++)for(const z of [-d/2,d/2])box(g,'#c5c7b6',-w/2+.2+i*.36,h+.35,z,.22,.3,.22);for(let i=0;i<6;i++)for(const x of [-w/2,w/2])box(g,'#c5c7b6',x,h+.35,-d/2+.2+i*.38,.22,.3,.22);
    for(const x of [-w/2,w/2])for(const z of [-d/2,d/2]){piece(g,cylinderG,'#bdbfae',x,1.35,z,.48,2.7,.48);piece(g,cylinderG,'#d6d4c2',x,2.72,z,.56,.12,.56);piece(g,coneG,roofColor,x,3.22,z,.62,.9,.62);windowAt(g,x,1.8,z+.46,.18,.28,'#6b6d61');}
    piece(g,boxG,'#bdbfae',0,2.2,-.25,1.25,2.9,1.25);for(let i=0;i<4;i++)for(const s of [-1,1]){box(g,'#c5c7b6',-.45+i*.3,3.72,-.25+s*.6,.18,.24,.18);box(g,'#c5c7b6',s*.6,3.72,-.7+i*.3,.18,.24,.18);}
    windowAt(g,0,2.9,.4,.3,.42,'#6b6d61');box(g,'#6c583d',0,4.25,-.25,.05,1.0,.05);box(g,roofColor,.24,4.55,-.25,.44,.3,.03);
    box(g,'#3f4a43',0,.72,d/2+.03,.8,1.05,.05);const arch=piece(g,cylinderG,'#3f4a43',0,1.24,d/2+.03,.4,.05,.4);arch.rotation.x=Math.PI/2;for(let i=0;i<7;i++){const a=i/6*Math.PI;box(g,'#d6d4c2',Math.cos(a)*.52,1.24+Math.sin(a)*.52,d/2+.06,.16,.16,.06);}
    for(const x of [-1.05,1.05]){box(g,roofColor,x,1.45,d/2+.04,.42,.8,.03);box(g,'#e7cf8a',x,1.62,d/2+.06,.16,.16,.02);}
    for(let i=0;i<14;i++)piece(g,rockG,i%3?'#739663':'#91aa74',-w/2+.1+(i%7)*.5,.3+Math.floor(i/7)*.35,d/2+.05,.14,.18,.1);
    keepsakes(g,-1.2,d/2+.55);nameSign(g,1.35,d/2+.6);return g;
  }
  /* A living valley: the sky follows the child's clock, homes smoke and glow at dusk,
     fireflies gather by campfires after dark and fish leap in the river. Calm mode keeps it still. */
  const SKIES={
    morning:{bg:'#d6e6da',amb:'#fff1dc',ai:2.05,sun:'#ffe7c4',si:2.3,glow:.35},
    day:{bg:'#c7ded5',amb:'#fff3d7',ai:2.1,sun:'#fff1cb',si:2.5,glow:.3},
    dusk:{bg:'#dcbca7',amb:'#f4cfae',ai:1.75,sun:'#ffb98a',si:1.55,glow:1.15},
    night:{bg:'#718e99',amb:'#a8c5dd',ai:1.5,sun:'#bdd7e9',si:.7,glow:1.4}
  };
  function skyNow(save){if(save.night)return 'night';const h=new Date().getHours();return h<6||h>=21?'night':h<11?'morning':h<17?'day':'dusk';}
  const windowGlass=()=>mat('#f8d583',true);
  const living=new THREE.Group();scene.add(living);
  const puffMat=new THREE.MeshLambertMaterial({color:'#eef0ea',transparent:true,opacity:.55,depthWrite:false});
  const flyMat=new THREE.MeshBasicMaterial({color:'#fff3a6',transparent:true,opacity:.9});
  let smoke=[],flies=[],fishes=[];
  function syncLiving(save,homes){
    living.clear();smoke=[];flies=[];
    for(const h of homes.slice(0,4))for(let i=0;i<5;i++){const m=new THREE.Mesh(sphereG,puffMat);m.userData={base:h.clone(),phase:i/5};living.add(m);smoke.push(m);}
    for(const f of save.objects.filter(o=>o.type==='fire').slice(0,2))for(let i=0;i<7;i++){const m=new THREE.Mesh(sphereG,flyMat);m.scale.setScalar(.035);m.userData={x:f.x+.5,z:f.y+.5,y:world.groundHeight(f.x+.5,f.y+.5),phase:i*1.7,r:.8+(i%3)*.45};living.add(m);flies.push(m);}
    fishes=[];for(const z of [3,-6,14]){const x=world.river(z);const m=new THREE.Group();piece(m,sphereG,'#e79a5a',0,0,0,.2,.09,.07);piece(m,coneG,'#d88748',-.22,0,0,.08,.14,.03).rotation.z=Math.PI/2;m.visible=false;m.userData={x,z,phase:z*.37};living.add(m);fishes.push(m);}
  }
  function animateLiving(time,calm,sky){
    const glow=sky==='dusk'||sky==='night';
    for(const m of smoke){if(calm){m.visible=false;continue;}m.visible=true;const t=((time*.00018)+m.userData.phase)%1,b=m.userData.base;m.position.set(b.x+Math.sin(t*6+b.z)*.25*t,b.y+t*1.7,b.z+t*.35);m.scale.setScalar(.12+t*.28);}
    puffMat.opacity=.5;
    for(const m of flies){m.visible=glow&&!calm;if(!m.visible)continue;const u=m.userData,t=time*.0006+u.phase;m.position.set(u.x+Math.cos(t)*u.r,u.y+.7+Math.sin(t*1.7)*.35,u.z+Math.sin(t*1.3)*u.r);}
    flyMat.opacity=.55+.4*Math.abs(Math.sin(time*.004));
    for(const f of fishes){if(calm){f.visible=false;continue;}const cycle=(time*.00013+f.userData.phase)%1;f.visible=cycle<.09;if(f.visible){const p=cycle/.09;f.position.set(f.userData.x-.5+p,world.groundHeight(f.userData.x,f.userData.z)+.1+Math.sin(p*Math.PI)*.75,f.userData.z);f.rotation.z=(.5-p)*1.6;}}
  }
  /* Realm keepsakes: one small, placeable landmark per restored realm. A completed Fact Trail turns its trim gold. */
  function keepsakeModel(family,gold){
    const g=new THREE.Group(),trim=gold?'#e8c15a':'#8b6a43',glowMat=c=>mat(c,true);groundShade(g,0,.2,1.3,1.3);
    box(g,trim,0,.05,0,.8,.1,.8);
    if(family===0){box(g,'#6c583d',0,.6,0,.06,1.1,.06);box(g,'#6c583d',.18,1.12,0,.36,.04,.04);piece(g,boxG,glowMat('#d9f6ee'),.34,.95,0,.16,.22,.16);for(let i=0;i<5;i++)box(g,'#7fa06d',-.25+i*.1,.3,.22,.03,.45+(i%2)*.15,.03);}
    else if(family===1){box(g,'#a6794c',0,.22,0,.6,.28,.4);for(let i=0;i<5;i++){box(g,'#6c9561',-.22+i*.11,.48,0,.03,.24,.03);piece(g,sphereG,'#8fbf6b',-.22+i*.11,.62,0,.06,.05,.06);}piece(g,sphereG,'#f0c6d8',.22,.7,0,.08,.08,.08);}
    else if(family===10){box(g,'#6a6f73',0,.7,0,.08,1.3,.08);for(let i=0;i<3;i++)piece(g,cylinderG,gold?trim:'#9fb7c4',0,.45+i*.3,0,.16,.04,.16);piece(g,sphereG,glowMat('#a7d1f2'),0,1.42,0,.16,.16,.16);}
    else if(family===2){for(const x of [-.25,.25]){box(g,'#6c583d',x,.5,0,.06,.9,.06);piece(g,boxG,glowMat('#ffd98b'),x,1.0,0,.14,.18,.14);box(g,'#526b5b',x,1.12,0,.18,.04,.18);}box(g,trim,0,.82,0,.62,.05,.05);}
    else if(family===5){box(g,'#b98a55',0,.3,0,.72,.18,.34);box(g,'#9c7043',0,.42,.16,.72,.1,.04);box(g,'#9c7043',0,.42,-.16,.72,.1,.04);box(g,'#9c7043',.36,.42,0,.04,.1,.3);box(g,'#9c7043',-.36,.42,0,.04,.1,.3);box(g,'#ce945a',.05,.5,0,.2,.16,.16);box(g,'#6c583d',-.15,.8,0,.03,.6,.03);box(g,'#f1d17e',-.05,.9,0,.18,.28,.02);}
    else if(family===11){for(const x of [-.18,.18]){piece(g,cylinderG,'#dfb4db',x,.5,0,.12,.9,.12);piece(g,coneG,gold?trim:'#b884b4',x,1.1,0,.16,.3,.16);}box(g,'#f1d3e7',0,.7,0,.36,.05,.06);}
    else if(family===3){for(const x of [-.3,.3])box(g,'#6c583d',x,.5,0,.06,.95,.06);for(let i=0;i<3;i++){const a=(i+1)/4*Math.PI;beam(g,'#6f9c58',[-.3,.95,0],[Math.cos(a)*.3*-1+0,1.0+Math.sin(a)*.25,0],.025);}box(g,'#6f9c58',0,.98,0,.66,.05,.05);for(let i=0;i<6;i++)piece(g,sphereG,'#96c888',-.3+i*.12,.98+(i%2)*.06,.02,.06,.05,.06);}
    else if(family===4){for(let i=0;i<4;i++)piece(g,rockG,i%2?'#c5cbd0':'#b3b9bd',0,.2+i*.2,0,.34-i*.06,.14,.3-i*.05);if(gold)piece(g,rockG,trim,0,1.02,0,.08,.06,.08);}
    else if(family===9){for(const x of [-.32,.32])box(g,'#6c583d',x,.55,0,.05,1,.05);for(const y of [.55,.8,1.05])box(g,'#6c583d',0,y+.12,0,.68,.03,.03);for(let r=0;r<3;r++)for(let c=0;c<3;c++)piece(g,boxG,glowMat('#f2b58b'),-.2+c*.2,.55+r*.25,0,.09,.12,.09);}
    else if(family===6){box(g,'#6c583d',0,.6,0,.06,1.1,.06);piece(g,sphereG,glowMat('#fff0a6'),0,1.22,0,.14,.14,.14);for(let i=0;i<6;i++){const a=i/6*Math.PI*2;box(g,'#f7d16e',Math.cos(a)*.24,1.22,Math.sin(a)*.24,.07,.14,.07);}}
    else if(family===12){piece(g,cylinderG,'#c9855a',0,.2,0,.24,.3,.24);beam(g,'#9a7250',[0,.35,0],[.08,1.15,0],.045);for(let i=0;i<5;i++){const a=i/5*Math.PI*2,leaf=box(g,'#6f9c58',.08+Math.cos(a)*.25,1.12,Math.sin(a)*.25,.42,.03,.12);leaf.rotation.y=-a;leaf.rotation.z=-.35;}}
    else if(family===8){for(let i=0;i<5;i++){const a=i/5*Math.PI*2;piece(g,coneG,glowMat(i%2?'#b2e7ef':'#d9ffff'),Math.cos(a)*.16,.35+(i%3)*.08,Math.sin(a)*.16,.1,.5+(i%2)*.2,.1);}piece(g,coneG,glowMat('#e7ffff'),0,.55,0,.12,.8,.12);}
    else {box(g,'#6c583d',0,.62,0,.06,1.15,.06);box(g,'#6c583d',.18,1.16,0,.4,.04,.04);for(let i=0;i<7;i++)piece(g,cylinderG,gold?trim:'#c6b5ed',.03+i*.05,.98,0,.012,.28+(i%3)*.06,.012);piece(g,sphereG,'#e3e1ef',.18,1.32,0,.22,.1,.14);}
    return g;
  }
  function model(type,mask=0,color=0){const g=new THREE.Group(),roofColor=['#52877e','#ac715e','#8e84a5','#bd9858','#53788b'][color%5];
    if(type==='trailtent'){
      const home=model('tent',mask,color);home.scale.set(.92,.92,.82);g.add(home);
      for(let i=0;i<5;i++)box(g,i%2?'#b99865':'#ceb27b',-.36+i*.18,.13,.82,.17,.13,.32);
      box(g,'#425f57',.51,.24,.63,.31,.14,.48);piece(g,cylinderG,'#d7c79d',.51,.34,.43,.13,.12,.13);
      box(g,'#6c583d',-.63,.55,.66,.045,.95,.045);box(g,'#705739',-.52,1.02,.66,.27,.05,.05);
      piece(g,boxG,mat('#ffd98b',true),-.42,.87,.66,.14,.21,.14);box(g,'#526b5b',-.42,1,.66,.2,.045,.2);
      for(const side of [-1,1])for(const end of [-1,1])box(g,'#dbca98',side*.71,.23,end*.61,.06,.12,.06);
      return g;
    }
    if(catalog[type]?.realm!==undefined)return keepsakeModel(catalog[type].realm,goldRealms.includes(catalog[type].realm));
    if(['lodge','stonehome','keep'].includes(type))return homeModel(type,roofColor);
    if(['palisade','stonewall','fortgate','stonegate','fence','gate'].includes(type))return wallModel(type,mask,color);
    if(['path','cobble','moat','drawbridge'].includes(type))return pathModel(type,mask,color);
    if(['lodge','stonehome','keep','well','stonewell','tower','flowerbed','store','townhouse','townhall'].includes(type))return newBuilding(type,roofColor);
    if(['tent','canvas','cabin'].includes(type)){
      const cabin=type==='cabin',w=cabin?2.7:1.75,d=1.8,h=type==='tent'?1.55:1.8;
      box(g,'#a78355',0,.11,0,w+.1,.17,d+.1);
      if(cabin){box(g,'#bb925e',0,.72,0,w,1.2,d);for(let j=0;j<6;j++){box(g,'#926b46',-w/2-.01,.22+j*.19,0,.025,.027,d);box(g,'#d1ad74',0,.22+j*.19,d/2+.015,w,.024,.03);}box(g,'#4a6153',0,.64,d/2+.028,.58,1,.03);for(const x of [-.88,.88]){box(g,'#79583c',x,.88,d/2+.04,.49,.53,.04);box(g,'#f8d583',x,.88,d/2+.07,.38,.4,.04);box(g,'#79583c',x,.88,d/2+.10,.025,.42,.03);}piece(g,roofGeometry(w+.36,1.1,d+.32),'#e6d7ae',0,1.36,0);box(g,roofColor,0,2.47,0,.16,.12,d+.42);box(g,'#6c583d',w/2-.1,2.55,0,.04,.6,.04);box(g,roofColor,w/2+.06,2.74,0,.3,.2,.03);keepsakes(g,-.7,d/2+.75);}
      else {piece(g,roofGeometry(w,h,d),type==='tent'?(color?roofColor:'#dba867'):roofColor,0,.18,0);const door=piece(g,roofGeometry(w*.45,h*.72,.025),'#4d6557',0,.18,d/2+.018);box(g,'#eee0b4',0,h+.2,0,.065,.065,d+.12);for(const x of [-w/2,w/2])for(const z of [-d/2,d/2])box(g,'#6e5639',x,.24,z,.07,.4,.07);}
      if(cabin)sideDetails(g,w,d,1.2,roofColor,false);
      else{piece(g,roofGeometry(w*.35,h*.53,.028),'#9d885e',0,.18,-d/2-.018);for(const side of [-1,1])for(const end of [-1,1]){beam(g,'#e5d6ae',[side*w*.31,h*.30,end*d*.39],[side*(w/2+.16),.11,end*(d/2+.03)],.015);box(g,'#8c7150',side*(w/2+.16),.13,end*(d/2+.03),.045,.24,.045);}for(const end of [-1,1])beam(g,'#eee0ba',[0,h+.2,end*d/2],[0,.22,end*(d/2+.06)],.018);}
      if(type!=='tent'){box(g,'#e0c28a',0,.2,1.1,.8,.14,.38);box(g,'#c4a16c',0,.12,1.35,.85,.12,.22);}
      if(type==='canvas'){
        for(const side of [-1,1]){box(g,'#71583b',side*.68,.62,.95,.06,1.15,.06);beam(g,'#e3d5ae',[side*.68,1.2,.95],[0,1.68,.48],.02);}
        box(g,'#d6ba87',0,1.24,.85,1.44,.05,.48);box(g,'#5a7465',-.53,.33,.5,.34,.25,.32);
        for(const z of [-.5,0,.5])for(const side of [-1,1])beam(g,'#d6c6a0',[0,1.98,z],[side*.87,.21,z],.015);
      }
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
    // A seed plot: tilled soil and four seedlings; once its bed has been counted, it blooms in the season's colour.
    else if(type==='plot'||type==='plot-bloom'){box(g,'#7a5a3a',0,.07,0,.92,.1,.92);box(g,'#5e4430',0,.125,0,.8,.02,.8);[[-.22,-.22],[.22,-.22],[-.22,.22],[.22,.22]].forEach(([x,z],i)=>{piece(g,coneG,season==='winter'?'#8b9a84':'#6f9a4f',x,.26,z,.07,.22,.07);if(type==='plot-bloom')piece(g,rockG,BLOOMS[i%BLOOMS.length],x,.4,z,.1,.08,.1);});}
    else if(type==='lantern'){box(g,'#756041',0,.51,0,.065,1.05,.065);box(g,'#756041',.15,1.03,0,.35,.055,.055);piece(g,boxG,windowGlass(),.27,.84,0,.18,.28,.18);box(g,'#647364',.27,1.01,0,.23,.07,.23);box(g,'#647364',.27,.67,0,.23,.05,.23);}
    else if(type==='feeder'){box(g,'#967449',0,.57,0,.11,1.13,.11);box(g,'#cbb07e',0,1.03,0,.55,.07,.5);for(const x of [-.21,.21])for(const z of [-.18,.18])box(g,'#af8d5e',x,1.18,z,.045,.3,.045);piece(g,roofGeometry(.68,.3,.58),'#638e83',0,1.32,0);piece(g,rockG,'#d4b578',0,1.11,0,.12,.06,.1);}
    return g;
  }
  const BLOOMS={spring:['#f2b6c6','#fff2f5','#e89ab0'],autumn:['#e08a3c','#f2c24e','#c8563a'],winter:['#e8eef0','#c9d6de','#f4f6f7']}[season]||['#f5d25a','#f2a0b4','#fff6e8'];
  // Signposts for counted beds: the fact the child built, lettered in ink.
  const signTextures=[];
  function board(text,x,z,{w=256,font=46,scale=1.5,height=1.25,keep=false}={}){const g=new THREE.Group(),c=document.createElement('canvas');c.width=w;c.height=96;const k=c.getContext('2d');k.fillStyle='#f3e6c4';k.fillRect(0,0,w,96);k.strokeStyle='#3b2a1c';k.lineWidth=6;k.strokeRect(3,3,w-6,90);k.fillStyle='#3b2a1c';k.font=`bold ${font}px Georgia, serif`;k.textAlign='center';k.textBaseline='middle';k.fillText(text,w/2,52,w-24);
    const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;const m=new THREE.SpriteMaterial({map:t});(keep?critterTextures:signTextures).push(t,m);const sp=new THREE.Sprite(m);sp.scale.set(scale*w/256,scale*.375,1);sp.position.set(0,height,0);g.add(sp);box(g,'#6b4a2e',0,height*.4,0,.07,height*.8,.07);
    g.position.set(x,world.groundHeight(x,z),z);return g;}
  const factSign=p=>board(`${p.rows} × ${p.cols} = ${p.count}`,p.x-.35,p.y-.35);
  /* ---------- a living camp (0.42) ---------- */
  const flutter=new THREE.Group(),critterGroup=new THREE.Group(),sparkles=[],critterTextures=[];scene.add(flutter,critterGroup);
  function butterfly(color){const g=new THREE.Group(),wing=geo('wing',()=>new THREE.PlaneGeometry(.26,.2)),m=mat(color);for(const side of[-1,1]){const w=new THREE.Mesh(wing,m);w.position.x=side*.13;w.rotation.x=-Math.PI/2;const pivot=new THREE.Group();pivot.add(w);pivot.userData.side=side;g.add(pivot);}return g;}
  // Companions from the expedition team walk the clearing: to the fire, the garden, the keepsakes, and back.
  const loader=new THREE.TextureLoader();
  const critters=(companions||[]).slice(0,3).map((c,i)=>{const tex=loader.load(c.art);tex.colorSpace=THREE.SRGBColorSpace;critterTextures.push(tex);const m=new THREE.SpriteMaterial({map:tex,alphaTest:.45});extraMaterials.add(m);const sp=new THREE.Sprite(m);sp.center.set(.5,.04);sp.scale.set(1.3,1.3,1);critterGroup.add(sp);const shade=groundShade(critterGroup,0,0,.7,.45);return {sp,shade,x:3+i*2,z:8,tx:3+i*2,tz:8,restUntil:0,hop:-1e9,name:c.name};});
  const SPOTS=['fire','bench','plot','deck','feeder','tent','trailtent','canvas','cabin','well','lantern','lodge','stonehome'];
  function interesting(save){const pts=[];for(const o of save.objects){if(SPOTS.includes(o.type)||o.type.startsWith('keepsake')){const f=footprint(o.type,o.r);pts.push([o.x+f.w/2+(Math.random()-.5)*1.4,o.y+f.h+.5+Math.random()*.6]);}}return pts.length?pts:[[6,7]];}
  // Building something makes the companions nearby hop over to look, with a burst of sparkles.
  function celebrate(x,z){const now=performance.now();for(const c of critters)if(Math.hypot(c.x-x,c.z-z)<9){c.hop=now;c.tx=x+(Math.random()-.5)*2;c.tz=z+1+Math.random();c.restUntil=0;}
    for(let i=0;i<14;i++){const m=piece(scene,rockG,mat(i%2?'#ffd46b':'#fff3c4',true),x,world.groundHeight(x,z)+.4,z,.06,.06,.06);m.castShadow=false;sparkles.push({m,vx:(Math.random()-.5)*.0035,vy:.003+Math.random()*.003,vz:(Math.random()-.5)*.0035,at:now});}}
  function animateLife(time,dt,calm,save,night){
    const fire=save.objects.find(o=>o.type==='fire');
    critters.forEach((c,i)=>{let moving=false;
      if(calm||(night&&fire)){const a=i*2.1+.6,fx=fire?fire.x+.5:6,fz=fire?fire.y+.5:7;c.x=fx+Math.cos(a)*1.35;c.z=fz+Math.sin(a)*1.35;}
      else{const dx=c.tx-c.x,dz=c.tz-c.z,d=Math.hypot(dx,dz);
        if(d<.08){if(!c.restUntil)c.restUntil=time+1800+Math.random()*4200;else if(time>c.restUntil){const pts=interesting(save),p=pts[(Math.random()*pts.length)|0];c.tx=p[0];c.tz=p[1];c.restUntil=0;}}
        else{const step=Math.min(d,dt*.0012);c.x+=dx/d*step;c.z+=dz/d*step;moving=true;}}
      const age=time-c.hop,jump=age>=0&&age<700?Math.sin(age/700*Math.PI)*.45:0,bob=moving&&!calm?Math.abs(Math.sin(time*.012+i))*.08:0,y=world.walkHeight(c.x,c.z);
      c.sp.position.set(c.x,y+bob+jump,c.z);c.shade.position.set(c.x,y+.02,c.z);});
    flutter.children.forEach(b=>{const u=b.userData,t=calm?u.ph:time*.0011+u.ph;b.position.set(u.cx+Math.cos(t)*u.r,world.groundHeight(u.cx,u.cz)+.85+Math.sin(time*.003+u.ph)*.14,u.cz+Math.sin(t)*u.r);b.rotation.y=-t;b.children.forEach(w=>w.rotation.z=calm?0:w.userData.side*Math.sin(time*.03+u.ph)*.9);});
    for(let i=sparkles.length-1;i>=0;i--){const k=sparkles[i],age=time-k.at;if(age>900||calm){scene.remove(k.m);sparkles.splice(i,1);continue;}k.m.position.x+=k.vx*dt;k.m.position.y+=k.vy*dt;k.m.position.z+=k.vz*dt;k.vy-=.000009*dt;k.m.scale.setScalar(.06*(1-age/900)+.01);}
  }
  function locate(g,o){const f=footprint(o.type,o.r);g.position.set(o.x+f.w/2,world.groundHeight(o.x+f.w/2,o.y+f.h/2),o.y+f.h/2);if(!g.userData.connected)g.rotation.y-= (o.r||0)*Math.PI/2;g.userData.id=o.id;return g;}
  const pickMaterial=new THREE.MeshBasicMaterial({visible:false});extraMaterials.add(pickMaterial);
  function sync(save){currentSave=save;syncForest(save);syncLand(save);const key=JSON.stringify([save.objects,save.construction,save.solved||[],save.campName||'']);if(key!==lastObjects){
    releaseBatch(objects);objects.clear();objectMap.clear();flames=[];gates=[];const staticPieces=new THREE.Group(),chimneys=[];
    signTextures.splice(0).forEach(t=>t.dispose());const counted=patterns?patterns(save).filter(p=>(save.solved||[]).includes(p.key)):[],bloom=new Set();for(const p of counted)for(let dx=0;dx<p.cols;dx++)for(let dy=0;dy<p.rows;dy++)bloom.add((p.x+dx)+','+(p.y+dy));
    for(const p of counted)objects.add(factSign(p));
    flutter.clear();counted.filter(p=>p.type==='plot').forEach((p,i)=>{for(let k=0;k<2;k++){const b=butterfly(BLOOMS[(i+k)%BLOOMS.length]);b.userData={cx:p.x+p.cols/2,cz:p.y+p.rows/2,r:Math.max(.8,Math.min(p.cols,p.rows)*.45),ph:i*2.3+k*3.1};flutter.add(b);}});
    objects.add(board(save.campName||'Willowbrook Camp',12.4,7.2,{w:384,font:40,scale:1.35,height:1.55}));
    for(const o of save.objects){let g=model(o.type==='plot'&&bloom.has(o.x+','+o.y)?'plot-bloom':o.type,content.mask(save.objects,o,catalog),o.color||0);const live=g.userData.gate||g.userData.flame||save.construction?.objectId===o.id;
      if(live){if(!g.userData.gate&&!g.userData.flame)g=instance(g,false);g=locate(g,o);addNameLabel(g,o);objects.add(g);objectMap.set(o.id,g);if(g.userData.flame)flames.push(g.userData.flame);if(g.userData.gate)gates.push(g);}
      else {g=locate(g,o);addNameLabel(g,o);if(g.userData.chimney){g.updateMatrixWorld(true);chimneys.push(g.localToWorld(new THREE.Vector3(...g.userData.chimney)));}staticPieces.add(g);const size=footprint(o.type,o.r),bounds=new THREE.Box3().setFromObject(g),height=Math.max(.22,bounds.max.y-world.groundHeight(o.x,o.y));const pick=new THREE.Mesh(boxG,pickMaterial);pick.position.set(o.x+size.w/2,world.groundHeight(o.x,o.y)+height/2,o.y+size.h/2);pick.scale.set(size.w,height,size.h);pick.userData.id=o.id;objects.add(pick);}
    }objects.add(instance(staticPieces,false,true));lastObjects=key;syncLiving(save,chimneys);renderer.shadowMap.needsUpdate=true;
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
  const village=new THREE.Group();for(const [i,b] of content.town.entries()){const g=newBuilding(b.type,['#638f87','#bb8166','#808ca2','#bd9b64','#829871'][i%5]);g.position.set(b.x+b.w/2,world.groundHeight(b.x+b.w/2,b.y+b.h/2),b.y+b.h/2);village.add(g);const proxy=new THREE.Mesh(boxG,mat('#ffffff'));proxy.position.set(b.x+b.w/2,1.8,b.y+b.h/2);proxy.scale.set(b.w,3.6,b.h+1);proxy.userData.location={store:'store',bakery:'bakery',library:'library',inn:'inn',workshop:'workshop',mill:'mill',hall:'inn'}[b.id]||'market';townPick.add(proxy);}townPick.updateMatrixWorld(true);
  for(const [x,z] of [[23,7],[27,9],[40,8]]){const flowers=newBuilding('flowerbed','#769a85');flowers.position.set(x,world.groundHeight(x,z),z);village.add(flowers);}
  // Each building shows what it is: a lettered sign over the door, and something of its trade outside.
  const SIGNS={store:'Mara’s Supply',bakery:'Honeycrust Bakery',library:'Library',inn:'The Willow Inn',workshop:'Tink’s Workshop',hall:'Town Hall',mill:'Watermill'};
  const villageSigns=new THREE.Group();scene.add(villageSigns);
  for(const b of content.town){const fx=b.x+b.w/2,fz=b.y+b.h+.35,d=new THREE.Group();d.position.set(fx,world.groundHeight(fx,fz),fz);
    if(b.id==='bakery'){piece(d,sphereG,'#b8745a',-1.15,.35,-.25,.5,.42,.5);piece(d,cylinderG,'#8e5a44',-1.15,.95,-.25,.12,.55,.12);box(d,'#8b6a44',1,.5,.1,.8,.06,.4);for(let i=0;i<3;i++)piece(d,sphereG,'#d9a55a',.78+i*.22,.58,.1,.1,.07,.16);}
    else if(b.id==='library'){for(let i=0;i<4;i++)box(d,['#7a4a3a','#3f6a78','#b88b3a','#5b7a4a'][i],.95,.06+i*.09,.05,.34,.08,.24);box(d,'#e8dcc0',-.95,.55,-.2,.1,.9,.55);}
    else if(b.id==='inn'){box(d,'#5b3f28',1.55,1.2,-.1,.06,2.4,.06);box(d,'#5b3f28',1.8,2.35,-.1,.55,.05,.05);box(d,'#e0b24a',1.95,2.05,-.1,.42,.36,.05);piece(d,boxG,windowGlass(),1.55,1.85,.06,.14,.2,.14);for(const x of[-1.45,-1.12])piece(d,cylinderG,'#8b6a44',x,.26,0,.2,.5,.2);}
    else if(b.id==='workshop'){box(d,'#4a4a52',-.95,.4,0,.44,.2,.24);box(d,'#6b6b72',-.95,.2,0,.2,.36,.16);box(d,'#8b6a44',1,.7,-.25,.9,1.2,.06);for(let i=0;i<3;i++)box(d,'#7c7c84',.72+i*.28,.95,-.2,.05,.4,.05);}
    else if(b.id==='mill'){for(let i=0;i<3;i++){const l=piece(d,cylinderG,'#8b6a44',-.9+i*.34,.16,.25,.14,.9,.14);l.rotation.z=Math.PI/2;}}
    else if(!SIGNS[b.id]){for(const x of[-.8,.8])box(d,'#8b6a44',x,.95,-.3,.6,.16,.18),piece(d,sphereG,['#e7708a','#f2c24e','#b894e0'][(b.x+x)&1?1:0],x,1.08,-.3,.26,.08,.1);}
    village.add(d);if(SIGNS[b.id])villageSigns.add(board(SIGNS[b.id],fx,fz+.55,{w:SIGNS[b.id].length>12?384:256,font:40,scale:1,height:1.95,keep:true}));}
  // The people of Willowbrook stand at their doors; tap one to visit.
  const villagers=new THREE.Group();scene.add(villagers);
  for(const v of content.villagers||[]){const g=new THREE.Group();box(g,v.coat,0,.71,0,.43,.54,.27);piece(g,sphereG,v.skin,0,1.15,0,.245,.27,.23);piece(g,cylinderG,v.hat,0,v.role==='baker'?1.5:1.36,0,.27,v.role==='baker'?.32:.09,.25);
    for(const x of[-.27,.27])box(g,v.coat,x,.72,0,.12,.34,.14);for(const x of[-.13,.13])box(g,'#53635c',x,.32,0,.16,.34,.17);for(const x of[-.082,.082])piece(g,rockG,'#37433b',x,1.16,.214,.024,.031,.026);
    if(v.role==='baker'||v.role==='innkeeper')box(g,'#fbf7ee',0,.6,.145,.36,.42,.02);if(v.role==='librarian')box(g,'#7a4a3a',.3,.62,.14,.2,.26,.06);if(v.role==='tinker')box(g,'#9aa0a6',.32,.55,.12,.06,.32,.06);if(v.role==='miller')piece(g,sphereG,'#efe6d0',-.38,.5,-.05,.2,.24,.18);if(v.role==='storekeeper')box(g,'#b35e40',0,.95,.1,.46,.1,.2);
    g.position.set(v.x,world.walkHeight(v.x,v.y),v.y);g.traverse(m=>{if(m.isMesh){m.castShadow=false;m.userData.location=v.place;}});g.userData.location=v.place;villagers.add(g);}
  // A signpost at the edge of camp: tap it to hop anywhere in Willowbrook.
  {const g=new THREE.Group(),x=13.4,z=6.3;g.position.set(x,world.groundHeight(x,z),z);box(g,'#6b4a2e',0,.9,0,.1,1.8,.1);[[1.55,.5,'#e4ce9e'],[1.25,-.6,'#d8b98a'],[.95,.9,'#e4ce9e']].forEach(([y,r,c],i)=>{const arm=box(g,c,.25*(i%2?-1:1),y,0,.8,.2,.06);arm.rotation.y=r;});const hit=new THREE.Mesh(boxG,pickMaterial);hit.position.set(0,1,0);hit.scale.set(1.4,2.2,1.4);g.add(hit);g.userData.location='signpost';markers.add(g);}
  const townWell=newBuilding('stonewell','#829baa');townWell.position.set(26.7,world.groundHeight(26.7,7.5),7.5);village.add(townWell);instance(village);
  const dock=new THREE.Group();for(let i=0;i<9;i++)box(dock,'#b89969',14.3+i*.25,world.groundHeight(14,8)+.11,8.5,.23,.14,1.6);instance(dock);const dockMarker=new THREE.Group();dockMarker.position.set(14,world.walkHeight(14,8),8);dockMarker.userData.location='fish';box(dockMarker,'#907347',0,.55,0,.07,1.1,.07);box(dockMarker,'#dcc496',0,1,0,.66,.3,.08);piece(dockMarker,rockG,'#63959d',0,1,.09,.2,.08,.04);markers.add(dockMarker);

  const worldDetails=createWorldDetails({THREE,scene,world,content,guardians,visitor,geo,mat,piece,box,instance,newBuilding,tree,pathModel,roadMaterials:{cobble:pavingMat,trail:mat('#c8b690')},groundShade,sphereG,rockG,cylinderG,coneG,boxG});
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
  function pick(px,py){cast(px,py);const hits=raycaster.intersectObjects([objects,wood,markers,villagers,treesToPick,townPick,landMarkers,worldDetails.picks],true);for(const hit of hits){let o=hit.object;while(o&&o!==scene){if(o.userData.guardian!==undefined||o.userData.id||o.userData.source!==undefined||o.userData.discovery||o.userData.tree||o.userData.location||o.userData.land)return o.userData;o=o.parent;}}return null;}
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
  let lastRender=null,warmed=false;
  function render(state,time){if(disposed||renderer.getContext().isContextLost())return;lastRender=[state,time];const {save,explorer,pet,heading,walking,seated,preview,selected,mode,calm,activity,building}=state;sync(save);
    // Compile every material once while the camp opens, so hopping to the village never stalls on a blank frame.
    if(!warmed){warmed=true;try{renderer.compile(scene,camera);}catch{}}updateCamera(state.camera);worldDetails.update(time,calm);
    const sky=skyNow(save);if(wasNight!==sky){wasNight=sky;const k=SKIES[sky];scene.background.set(k.bg);scene.fog.color.copy(scene.background);ambient.intensity=k.ai;ambient.color.set(k.amb);sun.intensity=k.si;sun.color.set(k.sun);windowGlass().emissiveIntensity=k.glow;renderer.shadowMap.needsUpdate=true;}
    animateLiving(time,calm,sky);animateLife(time,Math.min(80,Math.max(0,time-(lastTime||time))),calm,save,sky==='night');
    villagers.children.forEach((g,i)=>{g.rotation.y=calm?0:Math.sin(time*.0006+i*1.7)*.6;});
    townResidents.forEach((g,i)=>{const t=calm?0:time*.00018+i*2;g.position.set(25+Math.sin(t)*2,world.walkHeight(25,6),6+Math.cos(t)*.7);g.rotation.y=Math.cos(t)>0?Math.PI/2:-Math.PI/2;g.userData.limbs.forEach((l,j)=>l.rotation.x=calm?0:Math.sin(time*.008+j%2*Math.PI)*.25);});
    const fire=save.objects.find(o=>o.type==='fire');fireLight.visible=save.night&&!!fire;if(fire)fireLight.position.set(fire.x+.5,1,fire.y+.5);
    grid.visible=true;futureGrid.visible=true;gridM.opacity=(mode==='build'||!!preview)? .36:.19;futureGridM.opacity=mode==='build'? .30:.23;highlight.visible=!!preview||!!selected;
    const p=preview||save.objects.find(o=>o.id===selected);
    {const f=p?footprint(p.type,p.r):null,fx=p?p.x+f.w/2:explorer.x+.5,fz=p?p.y+f.h/2:explorer.y+.5;seeUniforms.seeFocus.value.set(fx,world.groundHeight(fx,fz)+(p?1.1:.8),fz);seeUniforms.seeCam.value.copy(camera.position);seeUniforms.seeRadius.value=p?Math.max(1.6,Math.max(f.w,f.h)*.75):1.5;seeUniforms.seeOn.value=1;}
    if(p){const f=footprint(p.type,p.r);highlight.position.set(p.x+f.w/2,world.groundHeight(p.x+f.w/2,p.y+f.h/2)+.065,p.y+f.h/2);highlight.scale.set(f.w,.025,f.h);}
    const previewKey=JSON.stringify([preview,lastObjects]);if(previewKey!==lastPreview){if(ghost)scene.remove(ghost);ghost=null;if(preview){ghost=locate(model(preview.type,content.mask(save.objects.filter(o=>o.id!==preview.id),preview,catalog),preview.color||0),preview);scene.add(ghost);}lastPreview=previewKey;}
    if(ghost){const reason=placementReason(save,preview.type,preview.x,preview.y,preview.r,preview.id);highlight.material.color.set(reason?'#f07865':'#fae7a0');ghost.traverse(m=>{if(m.isMesh){m.material=reason?ghostBad:ghostGood;m.castShadow=false;}});}else highlight.material.color.set('#ffdc84');
    explorerActor.position.set(explorer.x+.5,world.walkHeight(explorer.x+.5,explorer.y+.5),explorer.y+.5);explorerActor.rotation.y=heading;
    if(seated){const f=footprint(seated.type,seated.r);explorerActor.position.set(seated.x+f.w/2,.13,seated.y+(seated.type==='bench'?f.h/2:f.h+.12));explorerActor.rotation.y=-(seated.r||0)*Math.PI/2;}
    if(save.construction){const g=objectMap.get(save.construction.objectId);if(g)g.scale.y=building?.id===save.construction.objectId?Math.max(.08,building.progress):.08;}
    hammer.visible=!!building;
    fishingRig.visible=save.challenge?.kind==='fish';if(fishingRig.visible){fishingRig.position.copy(explorerActor.position).add(new THREE.Vector3(.15,.45,.2));fishingRig.rotation.y=-Math.PI/2;line.scale.y=calm?1:1+Math.sin(time*.003)*.025;}
    explorerActor.userData.limbs.forEach((limb,i)=>{limb.rotation.x=building&&i<2?-1+Math.sin(time*.025+i)*.45:seated&&i>1?-1.25:walking&&!calm?Math.sin(time*.013+(i%2)*Math.PI)*.5:0;});
    petActor.position.set(pet.x+.5,world.walkHeight(pet.x+.5,pet.y+.5),pet.y+.5);petActor.rotation.y=heading+.08;
    if(seated&&seated.type!=='bench'){petActor.position.copy(explorerActor.position).add(new THREE.Vector3(.6,-.05,.18));petActor.rotation.y=-.3;}
    petActor.userData.limbs.forEach((limb,i)=>{limb.rotation.x=walking&&!calm?Math.sin(time*.018+i%2*Math.PI)*.4:0;});petActor.userData.tail.rotation.z=calm?0:Math.sin(time*.009)*.35;
    for(const [shadow,a] of [[explorerShadow,explorerActor],[petShadow,petActor]]){shadow.position.set(a.position.x,world.walkHeight(a.position.x,a.position.z)+.02,a.position.z);shadow.castShadow=false;}
    flames.forEach((f,i)=>f.scale.setScalar(calm?1:1+Math.sin(time*.009+i)*.1));
    gates.forEach(g=>{g.userData.gate.rotation.y=Math.hypot(explorerActor.position.x-g.position.x,explorerActor.position.z-g.position.z)<1.6?-1.3:0;});
    const feeder=save.objects.find(o=>o.type==='feeder');bird.visible=!!feeder;if(feeder){const visiting=activity.includes('bird'),t=calm?0:time*.0004;bird.position.set(feeder.x+.5+(visiting?0:Math.sin(t)*2),visiting?1.6:2.2+Math.sin(t)*.15,feeder.y+.5+(visiting?0:Math.cos(t)*1.3));wings.forEach((wing,i)=>wing.rotation.z=calm||visiting?0:Math.sin(time*.025)*(i?1:-1)*.5);}
    const tm=calm?0:time*.0003;for(let i=0;i<65;i++){const z=minZ+(i*.73+tm)%(maxZ-minZ),x=world.river(z)+Math.sin(i*8.1)*1.1;matrix.compose(new THREE.Vector3(x,-.105,z),new THREE.Quaternion(),new THREE.Vector3(.14+random(i,3)*.25,.008,.025));ripples.setMatrixAt(i,matrix);}ripples.instanceMatrix.needsUpdate=true;
    if(quality==='low')renderer.render(scene,camera);else ink.render(scene,camera,{night:sky==='night'});lastTime=time;
  }
  const ink=createInk(THREE,renderer);
  // A postcard: draw one frame and hand back the picture.
  function snapshot(){if(!lastRender||disposed)return '';render(...lastRender);try{return canvas.toDataURL('image/jpeg',.9);}catch{return '';}}
  function lost(event){event.preventDefault();onContextLost?.();}
  function restored(){renderer.shadowMap.needsUpdate=true;onContextRestored?.();}
  canvas.addEventListener('webglcontextlost',lost);canvas.addEventListener('webglcontextrestored',restored);
  function dispose(){if(disposed)return;disposed=true;canvas.removeEventListener('webglcontextlost',lost);canvas.removeEventListener('webglcontextrestored',restored);geometries.forEach(g=>g.dispose());extraGeometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());extraMaterials.forEach(m=>m.dispose());worldDetails.dispose();shadeTexture.dispose();pavingTexture.dispose();groundTexture.dispose();ink.dispose();signTextures.forEach(t=>t.dispose());critterTextures.forEach(t=>t.dispose());scene.traverse(m=>m.isInstancedMesh&&m.dispose());scene.clear();renderer.dispose();renderer.forceContextLoss();}
  return {resize,render,project,cell,pick,focus,follow,thumbnail,celebrate,snapshot,stats:()=>({...renderer.info.render,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures}),dispose};
  }catch(error){renderer.dispose();renderer.forceContextLoss();throw error;}
}
