/* Paints the chart off the main thread, so the map stays responsive the first
   time it is drawn on a device. Returns the ink and pencil versions as JPEGs. */
importScripts('chart-world.js','chart-paint.js');
self.onmessage=async e=>{
  const{id,scale,season}=e.data;
  try{
    const world=ChartWorld.build(),W=Math.round(ChartWorld.W*scale),H=Math.round(ChartWorld.H*scale);
    const ink=new OffscreenCanvas(W,H),ctx=ink.getContext('2d');
    if(!ctx)throw new Error('No 2D canvas in this worker');
    ChartPaint.renderAll(ctx,world,{scale,season,makeCanvas:(w,h)=>new OffscreenCanvas(w,h)});
    const pencil=new OffscreenCanvas(W,H),pctx=pencil.getContext('2d'),dst=pctx.createImageData(W,H);
    ChartPaint.pencilize(ctx.getImageData(0,0,W,H),dst);pctx.putImageData(dst,0,0);
    const[inkBlob,pencilBlob]=await Promise.all([ink.convertToBlob({type:'image/jpeg',quality:.9}),pencil.convertToBlob({type:'image/jpeg',quality:.88})]);
    self.postMessage({id,ok:true,ink:inkBlob,pencil:pencilBlob});
  }catch(err){self.postMessage({id,ok:false,error:String(err&&err.message||err)});}
};
