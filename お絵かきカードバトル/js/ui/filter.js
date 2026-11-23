'use strict';
/* ---------- カードのしぼりこみ（カード一覧・デッキ編成） ----------
   しぼりこみの帯 fltBarHTML(キー) を置き、カードには data-fid="カードid" をつける。
   条件はキーごとに FLT[キー] に持つ（画面を描きなおしても残る）。
   変えたときは描きなおさずに data-fid の [hidden] を切りかえる（文字を打っている途中でも消えない）。
   data-fgrp のかたまりは、見えるカードがなくなるとかくす */
const FLT={};
const FLT_KIND=[['all','すべて'],['m','モンスター'],['t','タクティクス'],['my','お絵かき']];
const FLT_COST=[1,2,3,4,5,6,7];   // 7 は「7以上」
function fltGet(k){return FLT[k]||(FLT[k]={q:'',kind:'all',el:'',cost:0,seal:'',open:false})}
function fltReset(k){const f=fltGet(k);Object.assign(f,{q:'',kind:'all',el:'',cost:0,seal:''})}
const fltNorm=s=>rkKana(String(s||'').toLowerCase()).replace(/\s+/g,'');
// さがす文（カードのデータは保存・送信されるので、そこには書きこまず別にとっておく）
const FLT_TXT=new WeakMap();
function fltText(d){
  let s=FLT_TXT.get(d);
  if(s==null){
    const a=[d.name,d.sn,d.kind,d.resn,d.spn,d.x,d.rs];
    if(d.type==='m'){try{a.push(EL[d.el].n,resText(d));if(d.sp)a.push(spName(d),spText(d))}catch(e){}}
    s=fltNorm(a.filter(Boolean).join(' ').replace(/<[^>]*>/g,''));FLT_TXT.set(d,s);
  }
  return s;
}
function fltMatch(id,f){
  const d=CARDS[id];if(!d)return false;
  if(f.kind==='m'&&d.type!=='m')return false;
  if(f.kind==='t'&&d.type!=='t')return false;
  if(f.kind==='my'&&!d.my)return false;
  if(f.el&&(d.type!=='m'||d.el!==f.el))return false;
  if(f.cost&&(f.cost>=7?d.cost<7:d.cost!==f.cost))return false;
  if(f.seal&&(d.type!=='m'||d.L!==f.seal&&d.R!==f.seal))return false;   // 左右どちらかにその印
  if(f.q&&!fltText(d).includes(fltNorm(f.q)))return false;
  return true;
}
const fltN=f=>(f.el?1:0)+(f.cost?1:0)+(f.seal?1:0)+(f.kind!=='all'?1:0);
// o.kind：種類（モンスター／タクティクス／お絵かき）のボタンも出す
function fltBarHTML(k,o={}){
  const f=fltGet(k);
  return`<div class="flt" data-fltk="${k}" data-kind="${o.kind?1:0}">
    <div class="fltq"><label class="fltin"><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg>
      <input type="search" placeholder="名前・効果でさがす" value="${esc(f.q).replace(/"/g,'&quot;')}" autocomplete="off" enterkeyhint="search" aria-label="名前・効果でさがす"></label>
      <button class="btn fltop ${f.open?'on':''}" data-flt="open" aria-expanded="${f.open}">しぼりこみ<b class="fltc">${fltN(f)||''}</b></button></div>
    <div class="fltp">${fltPanelHTML(f,o.kind)}</div></div>`;
}
function fltPanelHTML(f,kind){
  if(!f.open)return'';
  const chip=(k,v,on,body,label)=>`<button class="fch ${on?'on':''}" data-flt="${k}" data-v="${v}" aria-pressed="${on}" ${label?`aria-label="${label}"`:''}>${body}</button>`;
  const row=(t,s)=>`<div class="fltr"><span class="fltl">${t}</span><div class="fltcs">${s}</div></div>`;
  return(kind?row('種類',FLT_KIND.map(([v,l])=>chip('kind',v,f.kind===v,l)).join('')):'')
    +row('属性',Object.keys(EL).map(e=>chip('el',e,f.el===e,`<i class="fel" style="background:${EL[e].c}">${svgI(EL_SVG[e],'ei')}</i>${EL[e].n}`)).join(''))
    +row('コスト',FLT_COST.map(c=>chip('cost',c,f.cost===c,c>=7?'7〜':String(c),c>=7?'コスト7以上':'コスト'+c)).join(''))
    +row('印',['fang','shield','star','heart','rainbow'].map(s=>chip('seal',s,f.seal===s,`${sealH(s)}${IC[s]}`)).join(''))
    +`<div class="fltr fltend"><span class="fltn"></span><span class="fltbs">${fltN(f)||f.q?'<button class="btn ghost fltclr" data-flt="clear">条件をけす</button>':''}<button class="btn fltclr" data-flt="open">とじる</button></span></div>`;
}
// 条件に合わないカードをかくす。数と「ありません」も出す
function fltApply(root){
  const k=root.dataset.fltk,f=fltGet(k),scope=root.closest('.mbox,.edscr,.deckscr')||document;
  let n=0;
  scope.querySelectorAll('[data-fid]').forEach(e=>{const ok=fltMatch(e.dataset.fid,f);e.hidden=!ok;if(ok)n++});
  scope.querySelectorAll('[data-fgrp]').forEach(g=>{g.hidden=!g.querySelector('[data-fid]:not([hidden])')});
  const none=scope.querySelector('.flt0');if(none)none.hidden=n>0;
  const ns=root.querySelector('.fltn');if(ns)ns.textContent=`${n}枚`;
  const c=root.querySelector('.fltc');if(c)c.textContent=fltN(f)||'';
}
function fltRedraw(root){
  const f=fltGet(root.dataset.fltk),op=root.querySelector('.fltop');
  root.querySelector('.fltp').innerHTML=fltPanelHTML(f,root.dataset.kind==='1');
  op.classList.toggle('on',f.open);op.setAttribute('aria-expanded',f.open);
  fltApply(root);
}
// 描いたあとに呼ぶ（数を出す）
function fltInit(scope){(scope||document).querySelectorAll('.flt').forEach(fltApply)}
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-flt]');if(!b)return;
  const root=b.closest('.flt');if(!root)return;
  const f=fltGet(root.dataset.fltk),a=b.dataset.flt,v=b.dataset.v;
  if(a==='open')f.open=!f.open;
  else if(a==='clear'){fltReset(root.dataset.fltk);const i=root.querySelector('input');if(i)i.value=''}
  else if(a==='cost')f.cost=f.cost===+v?0:+v;
  else if(a==='kind')f.kind=v;
  else f[a]=f[a]===v?'':v;
  if(typeof snd==='function')snd('tap');
  fltRedraw(root);
});
document.addEventListener('input',e=>{
  const i=e.target;if(!i.matches||!i.matches('.flt input'))return;
  const root=i.closest('.flt');fltGet(root.dataset.fltk).q=i.value;fltRedraw(root);
});
// 決定キーでキーボードを閉じる（スマホ）
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&e.target.matches&&e.target.matches('.flt input'))e.target.blur()});
