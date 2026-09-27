/* Original village and guardian-grove geometry. No external art or runtime assets. */
export function createWorldDetails(api) {
  const {THREE,scene,world,content,guardians,geo,mat,piece,box,instance,newBuilding,tree,pathModel,roadMaterials,groundShade,circleG,sphereG,rockG,cylinderG,coneG,boxG,visitor=null}=api;
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
  // Roads are laid along their curves as ribbons that follow the ground: a soft, uneven verge,
  // a stone kerb on the high street, then the surface. Ends and junctions are rounded.
  const roadMat={high:roadMaterials.cobble,lane:roadMaterials.lane,trail:roadMaterials.trail,path:roadMaterials.path},vergeMat=mat('#8f9d63'),kerbMat=mat('#cfc4a4');
  if(roadMaterials.cobble.map){roadMaterials.cobble.map.wrapS=roadMaterials.cobble.map.wrapT=THREE.RepeatWrapping;roadMaterials.cobble.map.needsUpdate=true;}
  function ribbon(pts,half,lift,material,jag=0,seed=0){const pos=[],uv=[],idx=[];let len=0;
    for(let i=0;i<pts.length;i++){const [x,z]=pts[i],p=pts[Math.max(0,i-1)],q=pts[Math.min(pts.length-1,i+1)],dx=q[0]-p[0],dz=q[1]-p[1],l=Math.hypot(dx,dz)||1,nx=-dz/l,nz=dx/l;if(i)len+=Math.hypot(x-pts[i-1][0],z-pts[i-1][1]);
      for(const side of [-1,1]){const h=half+(jag?(Math.sin(i*.9+seed+side*2.1)*.55+Math.sin(i*.37+seed*3+side)*.45)*jag:0),px=x+nx*h*side,pz=z+nz*h*side;pos.push(px,at(px,pz)+lift,pz);uv.push((side<0?0:h*2)/1.4,len/1.4);}
      if(i){const a=(i-1)*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(idx);g.computeVertexNormals();roadGeometry.push(g);const m=new THREE.Mesh(g,material);m.receiveShadow=true;scene.add(m);return m;}
  function disc(x,z,r,lift,material){const g=new THREE.CircleGeometry(r,20);g.rotateX(-Math.PI/2);roadGeometry.push(g);const m=new THREE.Mesh(g,material);m.position.set(x,at(x,z)+lift,z);m.receiveShadow=true;scene.add(m);}
  content.roadLines.forEach((r,i)=>{const lift=.07+i*.0015,half=r.w/2;
    ribbon(r.pts,half+.5,lift-.025,vergeMat,.22,i);
    if(r.kind==='high')ribbon(r.pts,half+.12,lift-.01,kerbMat,0,i);
    ribbon(r.pts,half,lift,roadMat[r.kind],r.kind==='high'?0:.1,i+7);
    for(const [x,z] of [r.pts[0],r.pts[r.pts.length-1]]){disc(x,z,half+.45,lift-.026,vergeMat);disc(x,z,half,lift-.002,roadMat[r.kind]);}
    // Footpaths and trails are scattered with worn stones.
    if(r.kind==='trail'||r.kind==='path')for(let k=3;k<r.pts.length;k+=9){const [x,z]=r.pts[k];piece(landscape,rockG,'#d6c6a2',x+Math.sin(k)*r.w*.3,at(x,z)+.09,z+Math.cos(k)*r.w*.3,.09,.025,.07);}
  });
  // Lamps stand along the high street and the grove road, set back from the edge and never on a plot.
  const onPlot=(x,z)=>content.zones.some(q=>content.inZone(q,Math.floor(x),Math.floor(z)))||content.town.some(b=>x>=b.x-.4&&x<b.x+b.w+.4&&z>=b.y-.4&&z<b.y+b.h+.4);
  for(const r of content.roadLines.filter(r=>r.kind==='high'||r.id==='grove')){let side=1;for(let k=10;k<r.pts.length-4;k+=r.kind==='high'?22:30){const [x,z]=r.pts[k],[qx,qz]=r.pts[k+1],l=Math.hypot(qx-x,qz-z)||1,off=r.w/2+.7,lx=x-(qz-z)/l*off*side,lz=z+(qx-x)/l*off*side;side=-side;if(onPlot(lx,lz)||content.roadAt(Math.floor(lx),Math.floor(lz)))continue;
    const y=at(lx,lz);box(landscape,'#697d71',lx,y+1,lz,.075,2,.075);piece(landscape,boxG,mat('#f8d583',true),lx,y+2,lz,.25,.35,.25);piece(landscape,coneG,'#697d71',lx,y+2.28,lz,.24,.24,.24);groundShade(landscape,lx,lz,1,1);}}
  // The village green: a soft oval of lawn with the well, market stalls along its edge and a shade tree.
  {const gx=40.2,gz=7.6,rings=8,segs=48,pos=[],idx=[];
    // Draped over the ground ring by ring, so the lawn never sinks under a rise.
    for(let r=0;r<=rings;r++)for(let k=0;k<segs;k++){const a=k/segs*Math.PI*2,f=r/rings*(1+Math.sin(a*3)*.04),x=gx+Math.cos(a)*4.4*f,z=gz+Math.sin(a)*2*f;pos.push(x,at(x,z)+.085,z);}
    for(let r=0;r<rings;r++)for(let k=0;k<segs;k++){const a=r*segs+k,b=r*segs+(k+1)%segs,c=a+segs,d=b+segs;idx.push(a,c,b,b,c,d);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));g.setIndex(idx);g.computeVertexNormals();roadGeometry.push(g);const lawn=new THREE.Mesh(g,new THREE.MeshLambertMaterial({color:'#a9c47a',side:THREE.DoubleSide}));lawn.receiveShadow=true;scene.add(lawn);
    for(let i=0;i<26;i++){const a=i/26*Math.PI*2,x=gx+Math.cos(a)*4.55,z=gz+Math.sin(a)*2.15;flower(landscape,x,at(x,z),z,i%3?'#e9d99c':'#dba2ab');}}
  // An enclosed valley: near forest silhouettes, distant faceted ridges, and river exits.
  const boundary=content.bounds;
  function edgeTree(x,z,index){if(Math.abs(x-world.river(z))<3.5)return;tree(landscape,x,at(x,z),z,1.15+(index%5)*.14,index%4===0);}
  let edgeIndex=0;for(let layer=0;layer<3;layer++){const pad=2+layer*2.4;for(let x=boundary.minX-pad;x<=boundary.maxX+pad;x+=3){edgeTree(x+Math.sin(x)*.35,boundary.minY-pad,edgeIndex++);edgeTree(x,boundary.maxY+pad,edgeIndex++);}for(let z=boundary.minY;z<=boundary.maxY;z+=3){edgeTree(boundary.minX-pad,z,edgeIndex++);edgeTree(boundary.maxX+pad,z+.5,edgeIndex++);}}
  const peakG=geo('valley-peak',()=>new THREE.ConeGeometry(1,1,6));
  function mountain(x,z,i){const h=9+(i%5)*2.1,y=at(x,z);const m=piece(landscape,peakG,['#82998c','#91a699','#768e87'][i%3],x,y+h/2-2,z,6.8,h,6.5);m.rotation.y=i*.71;piece(landscape,rockG,'#8d9e89',x+3,y+1,z+1,5.5,4.4,5);if(i%3===0)piece(landscape,peakG,'#c2cbbb',x,y+h-3,z,1.2,2.1,1.15);}
  for(let x=boundary.minX-8,i=0;x<=boundary.maxX+8;x+=10,i++){mountain(x,boundary.minY-14,i);mountain(x,boundary.maxY+14,i+2);}for(let z=boundary.minY-5,i=0;z<=boundary.maxY+5;z+=10,i++){mountain(boundary.minX-14,z,i+1);mountain(boundary.maxX+14,z,i+3);}
  // Guardian Grove is a separate woodland sanctuary with one welcoming entrance.
  const grove=content.grove;
  // A sanctuary, not an enclosure (0.46): its edge is a ring of old trees and mossy boulders, and the way in is an arch.
  {let k=0;for(let x=grove.x;x<grove.x+grove.w;x++)for(let z=grove.y;z<grove.y+grove.h;z++){if(!content.groveFence(x,z))continue;k++;const jx=x+.5+Math.sin(k*2.3)*.3,jz=z+.5+Math.cos(k*1.7)*.3,y=at(jx,jz);
      if(k%3===0)tree(landscape,jx,y,jz,1.2+(k%5)*.12,k%2===0);else if(k%3===1){piece(landscape,rockG,k%2?'#8f9a86':'#a2a894',jx,y+.3,jz,.62,.5,.55);piece(landscape,sphereG,'#6f8f58',jx+.1,y+.62,jz,.4,.14,.36);}else piece(landscape,sphereG,k%2?'#5f7f4f':'#6b8c57',jx,y+.4,jz,.55,.45,.55);}}
  for(const x of [69.6,74.4]){const y=at(x,4.6);piece(landscape,rockG,'#9aa08e',x,y+.35,4.6,.3,.7,.3);piece(landscape,boxG,mat('#f8d583',true),x,y+.85,4.6,.2,.26,.2);piece(landscape,coneG,'#6a7466',x,y+1.08,4.6,.2,.16,.2);}
  arch(landscape,72,4.5,3.9);

  // A quiet ring of inlaid stones marks the middle without obstructing the walkway.
  for(let i=0;i<13;i++){const a=i*Math.PI*2/13,x=72.5+Math.sin(a)*2.7,z=-6.5+Math.cos(a)*2.7;piece(landscape,cylinderG,i%2?'#d5ceaf':'#9eb8a5',x,at(x,z)+.045,z,.24,.055,.24);}
  // Reeds and washed stones soften the riverbank without blocking walking routes.
  for(let z=-16;z<33;z+=.8){if(world.bridge(z))continue;for(const sign of [-1,1]){const x=world.river(z)+sign*(2.3+Math.sin(z*3)*.15),y=at(x,z);if(content.town.some(b=>x>=b.x-.4&&x<b.x+b.w+.4&&z>=b.y-.4&&z<b.y+b.h+.4))continue;for(let i=0;i<3;i++)piece(landscape,coneG,i%2?'#7f9e78':'#9db08a',x+i*.07,y+.22,z+i*.06,.035,.46,.035);if(Math.floor(z*10)%4===0)piece(landscape,rockG,'#b8baa4',x+sign*.17,y+.06,z,.21,.11,.26);}}
  // Market canopies, produce crates and hanging lanterns.
  const goods=new THREE.Group();scene.add(goods);
  for(const [i,x] of [37.4,40.2,43].entries()){
    const z=9.2,y=at(x,z),g=new THREE.Group();g.position.set(x,y,z);g.rotation.y=Math.PI;
    for(const px of [-.8,.8])for(const pz of [-.5,.5])box(g,'#957449',px,.95,pz,.07,1.9,.07);
    for(let j=0;j<6;j++){const cover=box(g,j%2?'#f1e1b9':['#bb816b','#7c9c9a','#9891af'][i],-.72+j*.29,1.96,0,.28,.07,1.45);cover.rotation.x=.1;}
    box(g,'#b79563',0,.66,.15,1.7,.12,.8);
    const wares=new THREE.Group();wares.position.copy(g.position);wares.rotation.y=g.rotation.y;goods.add(wares);
    for(let j=0;j<4;j++){box(g,'#957449',-.6+j*.4,.83,.13,.32,.26,.55);for(let k=0;k<3;k++)piece(wares,roundG,['#d5a15c','#bf7f63','#9caf71'][i],-.6+j*.4,.99,-.04+k*.16,.105,.11,.1);}
    landscape.add(g);
  }
  /* A village in its place (0.45). */
  // Hedges line Rose Lane beside the build plots, with gaps to walk in.
  function hedge(x1,z1,x2,z2,gaps=[]){const n=Math.ceil(Math.hypot(x2-x1,z2-z1)/.45);for(let i=0;i<=n;i++){const t=i/n,x=x1+(x2-x1)*t,z=z1+(z2-z1)*t;if(gaps.some(([a,b])=>z>=a&&z<=b))continue;piece(landscape,sphereG,i%3?'#5f7f4f':'#6b8c57',x,at(x,z)+.32,z,.36,.34+(i%2)*.05,.36);}}
  hedge(32.35,10.2,32.35,17.6,[[12.2,13.4]]);hedge(35.65,10.2,35.65,17.6,[[13.4,14.6]]);
  // The inn has moved to the bridge; its old plot is a walled kitchen garden.
  {const x0=36.2,z0=.1,x1=39.8,z1=2.8;for(const [ax,az,bx,bz] of [[x0,z0,x1,z0],[x1,z0,x1,z1],[x0,z1,x1,z1],[x0,z0,x0,z1]]){const n=Math.ceil(Math.hypot(bx-ax,bz-az)/.4);for(let i=0;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,z=az+(bz-az)*t;if(az===z1&&bz===z1&&x>37.4&&x<38.6)continue;piece(landscape,rockG,i%2?'#b4ad98':'#a39d88',x,at(x,z)+.2,z,.24,.2,.22);}}
    for(let r=0;r<4;r++)for(let c=0;c<5;c++){const x=x0+.6+c*.66,z=z0+.6+r*.55;piece(landscape,roundG,r%2?'#7fa35a':'#9bb866',x,at(x,z)+.16,z,.16,.13,.16);if(r===1)piece(landscape,roundG,'#d9823a',x,at(x,z)+.24,z,.08,.07,.08);}}
  // Back gardens behind the houses, and a washing line between two of them.
  for(const b of content.town.filter(b=>/house$/.test(b.id)&&b.face==='n')){for(let r=0;r<3;r++)for(let c=0;c<4;c++){const x=b.x+.5+c*.7,z=b.y+b.h+.45+r*.45;piece(landscape,roundG,(r+c)%2?'#86a95c':'#6f9a4f',x,at(x,z)+.12,z,.13,.11,.13);}}
  {const y1=at(42.2,26),y2=at(44.8,26);box(landscape,'#6b4a2e',42.2,y1+.75,26,.06,1.5,.06);box(landscape,'#6b4a2e',44.8,y2+.75,26,.06,1.5,.06);box(landscape,'#e8e0cc',43.5,y1+1.45,26,2.6,.02,.02);[['#c0503a',42.8],['#f1e6cf',43.4],['#6486a1',44]].forEach(([c,x])=>box(landscape,c,x,y1+1.25,26,.34,.4,.03));}
  // The Meeting Oak ends the view up the cut lane, with a ring bench beneath it.
  {const x=29.6,z=-6.6,t=tree(landscape,x,at(x,z),z,1.55,true);for(let i=0;i<14;i++){const a=i/14*Math.PI*2;box(landscape,'#8b6a44',x+Math.cos(a)*1.25,at(x,z)+.28,z+Math.sin(a)*1.25,.5,.08,.22).rotation.y=-a;}}
  // Where the wood opens into meadow: wildflowers and the odd fallen log.
  world.forest.filter(t=>t.edge).forEach((t,i)=>{if(i%5===0){const l=piece(landscape,cylinderG,'#7a5a3c',t.x,at(t.x,t.z)+.12,t.z,.12,.9,.12);l.rotation.z=Math.PI/2;l.rotation.y=i;}else if(i%2===0)for(let k=0;k<3;k++)flower(landscape,t.x+Math.sin(i+k*2)*.4,at(t.x,t.z),t.z+Math.cos(i+k*2)*.4,['#e9d99c','#dba2ab','#b8a4d8'][k]);});
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
  for(const [x,z] of [[44.3,7.2],[36.3,7.8],[49,10],[55,20],[54,10],[20.6,19.5]]){const t=tree(landscape,x,at(x,z),z,.78,true);for(let i=0;i<5;i++)piece(t,roundG,'#d79989',Math.sin(i*2.4)*.65,2.55,Math.cos(i*2.4)*.6,.26,.23,.26);}
  // Chimneys, a roof clock and a turning mill wheel are recognizable landmarks.
  const clock=new THREE.Group();clock.position.set(32,at(32,7)+3.3,7.5);box(clock,'#c8c9b5',0,.5,0,1.1,1.7,1.1);piece(clock,coneG,'#738f98',0,1.62,0,1,1.1,1);
  for(let side=0;side<4;side++){const dial=new THREE.Group();dial.rotation.y=side*Math.PI/2;clock.add(dial);const face=piece(dial,cylinderG,'#f1e1b9',0,.68,.57,.39,.05,.39);face.rotation.x=Math.PI/2;box(dial,'#627668',0,.8,.62,.035,.26,.02);box(dial,'#627668',.12,.68,.63,.25,.035,.02);}landscape.add(clock);
  const wheel=new THREE.Group();const rim=piece(wheel,ringG,'#896943',0,0,0,1.08,1.08,1);for(let i=0;i<12;i++){const a=i*Math.PI/6,m=box(wheel,'#a28353',Math.cos(a)*.6,Math.sin(a)*.6,0,1.2,.09,.11);m.rotation.z=a;const paddle=box(wheel,'#b39564',Math.cos(a)*1.12,Math.sin(a)*1.12,0,.28,.3,.53);paddle.rotation.z=a;}wheel.position.set(19.55,at(19.55,13.5)+1.05,13.5);wheel.rotation.y=Math.PI/2;scene.add(wheel);

  const pennantFlags=new THREE.Group();scene.add(pennantFlags);
  // Realm pennants at the camp's north edge: each restored realm colours one flag, so learning visibly changes home.
  {const x0=1.5,x1=10.5,z=-.45,postY=Math.max(at(x0,z),at(x1,z));
    for(const x of [x0,x1])box(landscape,'#7d5f3e',x,at(x,z)+1.15,z,.14,2.3,.14);
    box(landscape,'#e1d2ad',(x0+x1)/2,postY+2.18,z,x1-x0,.035,.035);
    [0,1,10,2,5,11,3,4,9,6,12,8,7].forEach((family,i)=>{const g=guardians.find(g=>g.family===family),x=x0+.35+i*(x1-x0-.7)/12;
      // Each flag hangs from its own hinge so it can flutter in the breeze.
      const hinge=new THREE.Group();hinge.position.set(x,postY+2.13,z);box(hinge,g?.defeated?g.color:'#c9c3b2',0,-.18,0,.24,.36,.03);if(g?.defeated)box(hinge,'#fff6d6',0,-.25,.02,.08,.08,.01);hinge.userData.phase=i*.7;pennantFlags.add(hinge);});}
  // Each guardian lives somewhere that suits its realm; a spot not yet earned is only a quiet marker stone.
  function home(kind,x,y,z,out){const ox=x+Math.sin(out)*1.1,oz=z+Math.cos(out)*1.1,oy=at(ox,oz);
    if(kind==='ghost'){piece(landscape,rockG,'#9aa08e',ox,oy+.35,oz,.38,.7,.38);piece(landscape,boxG,mat('#f8d583',true),ox,oy+.9,oz,.22,.28,.22);for(let i=0;i<5;i++)piece(landscape,sphereG,'#eef0ea',x+Math.sin(i*1.3)*.9,y+.15,z+Math.cos(i*1.3)*.9,.32,.08,.32);}
    else if(kind==='bunny'){piece(landscape,sphereG,'#7f9f58',ox,oy,oz,1,.55,.9);piece(landscape,circleG,'#3a3024',ox+Math.sin(out+Math.PI)*.85,oy+.25,oz+Math.cos(out+Math.PI)*.85,.3,.3,1).rotation.y=out;for(let i=0;i<3;i++)piece(landscape,coneG,'#e07b39',x+.6+i*.18,y+.1,z-.5,.05,.2,.05);}
    else if(kind==='fox'){for(let i=0;i<4;i++)piece(landscape,rockG,'#8e8a7c',ox+Math.sin(i*1.6)*.45,oy+.3,oz+Math.cos(i*1.6)*.45,.5,.45,.45);const l=piece(landscape,cylinderG,'#6e5037',x-.6,y+.14,z+.5,.14,1.2,.14);l.rotation.z=Math.PI/2;}
    else if(kind==='monkey'||kind==='owl'||kind==='parrot'){const t=tree(landscape,ox,oy,oz,kind==='owl'?1.25:1.1,kind!=='parrot');piece(landscape,circleG,'#2f271d',ox+Math.sin(out+Math.PI)*.2,oy+(kind==='owl'?2.1:1.4),oz+Math.cos(out+Math.PI)*.2,.16,.2,1).rotation.y=out+Math.PI;if(kind==='monkey'){box(landscape,'#c9b28a',ox-.5,oy+1.4,oz,.02,1.2,.02);box(landscape,'#8b6a44',ox-.5,oy+.8,oz,.4,.06,.18);}if(kind==='parrot')box(landscape,'#8b6a44',ox,oy+2.2,oz,1.2,.08,.08);}
    else if(kind==='turtle'||kind==='frog'){piece(landscape,cylinderG,'#6aa3ad',ox,oy+.05,oz,1.05,.05,.9);piece(landscape,cylinderG,'#a2c7cc',ox,oy+.08,oz,.8,.02,.7);for(let i=0;i<4;i++)piece(landscape,kind==='frog'?cylinderG:rockG,kind==='frog'?'#7fae58':'#8f9a86',ox+Math.sin(i*1.8)*.55,oy+.12,oz+Math.cos(i*1.8)*.45,kind==='frog'?.22:.25,kind==='frog'?.02:.18,kind==='frog'?.22:.22);}
    else if(kind==='bee'){for(let i=0;i<10;i++)flower(landscape,x+Math.sin(i*.63)*1.2,y,z+Math.cos(i*.63)*1.2,['#e9d99c','#dba2ab','#b8a4d8'][i%3]);for(let i=0;i<3;i++)piece(landscape,cylinderG,i%2?'#4a3a22':'#e0b24a',ox,oy+.2+i*.18,oz,.3-i*.03,.18,.3-i*.03);}
    else if(kind==='wolf'||kind==='dragon'){for(const [dx,dz,h] of [[-.5,0,.9],[.5,0,.9],[0,-.35,.5]])piece(landscape,rockG,kind==='dragon'?'#8a7066':'#7f837a',ox+dx,oy+h/2,oz+dz,.6,h,.55);if(kind==='dragon')piece(landscape,sphereG,mat('#f28a3a',true),x+.5,y+.12,z+.4,.18,.1,.18);}
    else if(kind==='penguin'){for(let i=0;i<4;i++)piece(landscape,rockG,i%2?'#d9ecf2':'#bcd9e3',ox+Math.sin(i*1.5)*.4,oy+.35,oz+Math.cos(i*1.5)*.4,.45,.6,.45);piece(landscape,cylinderG,'#f4f6f5',x,y+.03,z,1.2,.03,1.2);}
    else if(kind==='robot'){box(landscape,'#9aa0a6',ox,oy+.45,oz,.7,.9,.5);for(const [dy,r] of [[.95,.35],[.55,.25]]){const gear=piece(landscape,ringG,'#b88b3a',ox,oy+dy,oz+.28,r,r,.6);gear.rotation.y=out;}}}
  // Thirteen small habitats. Unwon guardians have an empty, numbered welcome bed.
  const numberCanvas=document.createElement('canvas');numberCanvas.width=1024;numberCanvas.height=128;const ctx=numberCanvas.getContext('2d');ctx.font='bold 60px sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillStyle='#fff7dc';for(let i=0;i<13;i++)ctx.fillText('×'+i,i*78+39,64);const numberTexture=new THREE.CanvasTexture(numberCanvas);numberTexture.colorSpace=THREE.SRGBColorSpace;textures.push(numberTexture);
  const numberMat=new THREE.MeshBasicMaterial({map:numberTexture,transparent:true,side:THREE.DoubleSide});
  const numberMaterials=[numberMat];
  for(const pad of content.guardianPads){
    const g=guardians.find(g=>g.family===pad.family),x=pad.x+.5,z=pad.y+.5,y=at(x,z);
    const out=Math.atan2(x-72.5,z+6.5);
    if(g?.defeated)home(pad.kind,x,y,z,out);
    // The marker stone carries the family's number, set just off the path.
    const mx=x+Math.sin(out)*1.7,mz=z+Math.cos(out)*1.7,my=at(mx,mz);piece(landscape,rockG,'#9ba08f',mx,my+.3,mz,.42,.55,.18).rotation.y=out;
    const numberG=geo('guardian-number-'+pad.family,()=>{const pg=new THREE.PlaneGeometry(.8,.45),uv=pg.attributes.uv;for(let i=0;i<uv.count;i++)uv.setX(i,(pad.family*78+uv.getX(i)*78)/1024);return pg;});
    const sign=piece(landscape,numberG,numberMat,mx-Math.sin(out)*.2,my+.42,mz-Math.cos(out)*.2);sign.rotation.y=out+Math.PI;sign.scale.setScalar(.8);
    if(g?.defeated){const model=creature(pad.kind,g.color);const compact=instance(model,false);compact.position.set(x,y+.16,z);scene.add(compact);residents.push({root:compact,x,z,y:y+.16,hx:x,hz:z,kind:pad.kind,family:pad.family,angle:pad.angle,visit:[72.5+Math.sin(out)*2.6,-6.5+Math.cos(out)*2.6]});}
    const proxy=new THREE.Mesh(cylinderG,new THREE.MeshBasicMaterial({visible:false}));proxy.position.set(x,y+1,z);proxy.scale.set(1.3,2.7,1.3);proxy.userData.guardian=pad.family;picks.add(proxy);
  }
  // The heart of the grove: a great old tree and a little spring. When all thirteen guardians are home, it glows gold.
  {const hx=72.5,hz=-6.5,hy=at(hx,hz);tree(landscape,hx,hy,hz,2.1,true);piece(landscape,cylinderG,'#6aa3ad',hx+1.6,at(hx+1.6,hz+1.2)+.04,hz+1.2,.55,.04,.45);for(let i=0;i<5;i++)piece(landscape,rockG,'#9aa08e',hx+1.6+Math.sin(i*1.3)*.6,at(hx+1.6,hz+1.2)+.1,hz+1.2+Math.cos(i*1.3)*.5,.16,.12,.14);
    if(guardians.length&&guardians.every(g=>g.defeated))for(let i=0;i<24;i++){const a=i/24*Math.PI*2;piece(landscape,sphereG,mat('#ffd46b',true),hx+Math.cos(a)*1.9,hy+2.6+Math.sin(i*1.7)*.5,hz+Math.sin(a)*1.9,.07,.07,.07);}}
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
  // A guardian whose Fact Trail is complete visits the Story Stones for the day.
  {const pad=content.guardianPads.find(p=>p.family===visitor),g=guardians.find(g=>g.family===visitor);if(pad&&g){const x=-5,z=2.3,y=at(x,z);const compact=instance(creature(pad.kind,g.color),false);compact.position.set(x,y+.16,z);scene.add(compact);residents.push({root:compact,x,z,y:y+.16,kind:pad.kind,family:pad.family,angle:.6});}}
  return {picks,update(time,calm,sky='day'){goods.visible=sky==='morning'||sky==='day';pennantFlags.children.forEach(f=>{f.rotation.x=calm?0:Math.sin(time*.0035+f.userData.phase)*.28;f.rotation.z=calm?0:Math.sin(time*.0021+f.userData.phase)*.06;});wheel.rotation.z=calm?0:time*.00025;fountain.rotation.y=calm?0:time*.00015;residents.forEach((a,i)=>{const t=calm?0:time*.0006+i;
      if(a.visit){const u=calm?0:(time*.000018+i*.37)%1,k=u<.6?0:u<.7?(u-.6)/.1:u<.9?1:1-(u-.9)/.1,e=k*k*(3-2*k),x=a.hx+(a.visit[0]-a.hx)*e,z=a.hz+(a.visit[1]-a.hz)*e;a.root.position.x=x;a.root.position.z=z;a.y=at(x,z)+.16;}
      a.root.position.y=a.y+(calm?0:Math.sin(t)*(a.kind==='ghost'?.13:.025));a.root.rotation.y=a.angle+(calm?0:Math.sin(t*.6)*.16);});},dispose(){roadGeometry.forEach(g=>g.dispose());textures.forEach(t=>t.dispose());numberMaterials.forEach(m=>m.dispose());picks.traverse(m=>{if(m.isMesh&&m.material.visible===false)m.material.dispose();});}};
}
