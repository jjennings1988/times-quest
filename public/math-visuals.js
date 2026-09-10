(function(root){
  'use strict';
  function render(a,b,options={}){
    if(!Number.isInteger(a)||!Number.isInteger(b)||a<0||b<0||a>12||b>12)return '';
    const answer=a*b,w=Math.max(180,b*22+62),h=Math.max(64,a*25+20),parts=root.LearningJourney?.parts(a),split=parts&&parts[1]>0?parts[0]:a;
    let rows='';
    for(let r=0;r<a;r++){
      let tiles='';for(let c=0;c<b;c++)tiles+=`<rect x="${12+c*22}" y="${10+r*25}" width="17" height="17" rx="4" fill="${r<split?'#377d74':'#b57c24'}"/>`;
      rows+=`<g class="mv-row" style="--row:${r}" data-group="${r+1}"><rect x="5" y="${5+r*25}" width="${b*22+7}" height="23" rx="7" fill="${r<split?'#dceee6':'#f7ead3'}"/>${tiles}<text x="${b*22+22}" y="${23+r*25}" fill="#36534c" font-size="12">${(r+1)*b}</text></g>`;
    }
    const equation=options.equation||`${a} × ${b} = <strong>${answer}</strong>`;
    return `<figure class="math-visual" data-groups="${a}" data-each="${b}" data-count="0"><figcaption>${a} group${a===1?'':'s'} of ${b}</figcaption><svg viewBox="0 0 ${w} ${h}" role="img" aria-label="${a} groups of ${b} equals ${answer}">${a&&b?rows:`<rect x="8" y="8" width="${w-16}" height="48" rx="14" fill="#e5eee2" stroke="#9eaf98" stroke-dasharray="5 4"/><text x="${w/2}" y="38" text-anchor="middle" fill="#36534c" font-size="16">Nothing to count: 0</text>`}</svg><div class="mv-equation">${equation}</div>${options.note?`<p class="mv-split">${options.note}</p>`:''}${a&&b?'<button type="button" class="mv-count" onclick="MathVisuals.advance(this)">Count the groups with me</button><span class="mv-count-result" role="status"></span>':'<p>Any number multiplied by zero is zero.</p>'}</figure>`;
  }
  function explain(q){
    const division=q.text?.match(/^(\d+) ÷ (\d+)$/),missing=q.text?.match(/^(\d+) × \? = (\d+)$/),shown=q.text?.match(/^(\d+) × (\d+)$/);
    if(division||missing){
      const total=Number(division?division[1]:missing[2]),groups=Number(division?division[2]:missing[1]);
      if(groups===0)return {label:'The missing amount',body:'Zero groups always total zero. There is not one unique missing amount.',visual:''};
      const each=total/groups;
      return {label:'Share into equal groups',body:`Share ${total} equally into ${groups} group${groups===1?'':'s'}. Each group has ${each}. The missing amount is ${each}.`,visual:render(groups,each,{equation:division?`${total} ÷ ${groups} = <strong>${each}</strong>`:`${groups} × <strong>${each}</strong> = ${total}`,note:'The highlighted number answers the original question.'})};
    }
    const a=shown?Number(shown[1]):q.a,b=shown?Number(shown[2]):q.b;
    return {label:'Build equal groups',body:root.LearningJourney?root.LearningJourney.explanation(a,b):`${a} groups of ${b} make ${a*b}.`,visual:render(a,b)};
  }
  function advance(button){
    const host=button.closest('.math-visual'),total=Number(host.dataset.groups),each=Number(host.dataset.each);let count=Number(host.dataset.count)+1;if(count>total)count=1;
    host.dataset.count=count;host.querySelectorAll('.mv-row').forEach((row,i)=>row.classList.toggle('mv-muted',i>=count));
    host.querySelector('.mv-count-result').textContent=`${count} group${count===1?'':'s'} of ${each} = ${count*each}`;button.textContent=count===total?'Count again':'Add one more group';
  }
  root.MathVisuals={render,explain,advance};if(typeof module!=='undefined'&&module.exports)module.exports=root.MathVisuals;
})(typeof window!=='undefined'?window:globalThis);
