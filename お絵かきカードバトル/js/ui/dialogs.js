'use strict';
/* ---------- ダイアログ ---------- */
function modal(html,btns,cls=''){
  return new Promise(res=>{
    const el=$('#modal');el.className='show';snd('open');
    el.innerHTML=`<div class="mbox ${cls}">${html}<div class="mbtns">${btns.map(([l,v,c])=>`<button class="btn ${c||''}" data-mv="${v}">${l}</button>`).join('')}</div></div>`;
    el.onclick=e=>{const b=e.target.closest('[data-mv]');if(!b)return;el.className='';el.innerHTML='';el.onclick=null;snd('tap');res(b.dataset.mv)};
  });
}
function pickCards(title,cards,min,max,okLabel,sub,markTxt){
  return new Promise(res=>{
    const el=$('#modal'),sel=new Set();
    let shown=false;
    const draw=()=>{
      const box=shown?el.querySelector('.mbox'):null,y=box?box.scrollTop:0;   // えらんでも見ていた場所のまま
      el.className='show';
      el.innerHTML=`<div class="mbox"><h3>${title}</h3><div class="sub">${sub||''}</div><div class="pick">${cards.map(c=>`<div class="pk ${sel.has(c.uid)?'sel':''}" data-pk="${c.uid}">${cardHTML(c.id,{cls:'mini'})}${sel.has(c.uid)?`<div class="mark">${markTxt||'えらんだ'}</div>`:''}</div>`).join('')}</div>
        <div class="mbtns"><button class="btn pri" data-ok ${sel.size<min||sel.size>max?'disabled':''}>${okLabel(sel.size)}</button></div></div>`;
      shown=true;if(y)el.querySelector('.mbox').scrollTop=y;
    };
    el.onclick=e=>{
      const pk=e.target.closest('[data-pk]');
      if(pk){const u=+pk.dataset.pk;if(sel.has(u))sel.delete(u);else if(sel.size<max)sel.add(u);snd('tap');draw();return}
      const ok=e.target.closest('[data-ok]');
      if(ok&&!ok.disabled){el.className='';el.innerHTML='';el.onclick=null;res([...sel])}
    };
    draw();
  });
}
function handover(p,sub){return modal(`<div class="ho"><div class="hoT">${S.pl[p].name}の番</div><p class="sub">${sub||'相手に手札が見えないように交代してください'}</p></div>`,[['はじめる','ok','pri']],'full')}
// 守る側にたずねる：となりの「かばう」モンスターがいればかばうか、ゲージがあればガードするか。返り値 {g,c}
async function askDefend(p,i,t){
  if(t==null)t=2-i;
  const d=1-p,o=S.pl[d],m=S.pl[p].lane[i],cs=coverOpts(S,p,t);let c=null;
  if(cs.length){
    const em=o.lane[t],tgt=em?`${D(em).sn}（HP${hpLeft(S,d,t)}）`:`${o.name}（ライフ${o.life}）`;
    const v=await modal(`<div class="gq"><div class="sub">${S.pl[p].name}のアタック</div><div class="big">${D(m).sn}（ATK${atkDmg(S,p,i,t)}）→ ${tgt}</div>
      <p>${o.name}：となりのモンスターが、このアタックを代わりに受けられます（反撃もそのモンスターがする）。</p></div>`,
      [...cs.map(x=>[`${esc(D(o.lane[x]).sn)}（HP${hpLeft(S,d,x)}）がかばう`,'c'+x,'pri']),['かばわない','n']]);
    if(v!=='n')c=+v.slice(1);
  }
  // ガードはプレイヤーへのダイレクトアタックのときだけ（かばったらモンスターへのアタックになる）
  const g=guardOK(S,p,t,c)?await askGuard(p,i,t):false;
  return{g,c};
}
function askGuard(p,i,t){
  const d=1-p,o=S.pl[d],m=S.pl[p].lane[i];if(t==null)t=2-i;const em=o.lane[t];
  const a=atkDmg(S,p,i,t);
  let without,with_;
  if(em){const r=redu(S,d,t,laneInfo(S,d));without=Math.max(0,a-r);with_=Math.max(0,a-GUARD_CUT-r)}
  else{without=a;with_=Math.max(0,a-GUARD_CUT)}
  const tgt=em?`${D(em).sn}（HP${hpLeft(S,d,t)}）`:`${o.name}（ライフ${o.life}）`;
  const cnt=em?`<p>${D(em).sn}は反撃で ${D(m).sn}（HP${hpLeft(S,p,i)}）に ${Math.max(0,atkOf(S,d,t)-redu(S,p,i,laneInfo(S,p)))} ダメージを返す（ガードしても変わらない）</p>`:'';
  return modal(`<div class="gq"><div class="sub">${S.pl[p].name}のアタック</div><div class="big">${D(m).sn}（ATK${a}）→ ${tgt}</div>
    <p>${o.name}：ガード（${GUARD_G}G）でダメージを3減らせます。ソウルゲージ ${o.gauge} → ${o.gauge-GUARD_G}</p>${cnt}
    <div class="cmp"><div>ガードしない<b style="color:#a8302a">${without}</b>ダメージ</div><div>ガードする<b style="color:#2f5677">${with_}</b>ダメージ</div></div></div>`,
    [['ガードする','y','pri'],['しない','n']]).then(v=>v==='y');
}

