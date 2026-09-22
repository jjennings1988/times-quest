// Packaging only: extract generated atlas cells and encode WebP, no painted edits.
// SHARP_MODULE can point to a locally available sharp installation.
const fs=require('node:fs'),path=require('node:path');
const sharp=require(process.env.SHARP_MODULE||'sharp');
const root=path.resolve(__dirname,'..');
const sources=require('../art-source/realm-scenes-v1/sources.json');
const stages=['ruins','foundation','walls','restored','celebrated','landscape'];
(async()=>{
  const manifest=[];
  for(const {family,source} of sources){
    const master=path.join(root,`art-source/realm-scenes-v1/x${family}-atlas.png`);
    if(!fs.existsSync(master))fs.copyFileSync(source,master);
    const {width,height}=await sharp(master).metadata();
    const out=path.join(root,`public/art/realm/scenes/x${family}`);fs.mkdirSync(out,{recursive:true});
    for(let i=0;i<6;i++){
      const left=Math.round((i%2)*width/2),top=Math.round(Math.floor(i/2)*height/3);
      const cellWidth=Math.round((i%2+1)*width/2)-left,cellHeight=Math.round((Math.floor(i/2)+1)*height/3)-top;
      const dest=path.join(out,`${stages[i]}-v1.webp`);
      // One pixel inset avoids a neighboring panel's edge after compression.
      const info=await sharp(master).extract({left:left+1,top:top+1,width:cellWidth-2,height:cellHeight-2}).webp({quality:84,effort:6}).toFile(dest);
      manifest.push({family,stage:stages[i],path:path.relative(path.join(root,'public'),dest).replaceAll('\\','/'),width:info.width,height:info.height,bytes:info.size});
    }
  }
  fs.writeFileSync(path.join(root,'art-source/realm-scenes-v1/manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  console.log(`${manifest.length} frames, ${manifest.reduce((sum,m)=>sum+m.bytes,0)} bytes`);
})().catch(e=>{console.error(e);process.exitCode=1;});
