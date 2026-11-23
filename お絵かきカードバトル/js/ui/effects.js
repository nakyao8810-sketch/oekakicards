'use strict';
/* ---------- 演出 ---------- */
function flush(){
  render();playFx();resoFx();
  if(UI.mode==='net'){olPump();return}   // たずねごと・結果は js/online/screens.js
  if(S&&S.winner!=null&&!UI.resultShown)showResult();
}
/* ---- 共鳴の演出：前の盤面とくらべて、新しくつながった印だけ光らせる ---- */
function resoState(){return[0,1].map(p=>{const f=laneInfo(S,p),l=S.pl[p].lane;return{k:f.k.slice(),full:f.full,u:l.map(m=>m?m.uid:0)}})}
function resoFx(){
  if(!S)return;
  const now=resoState(),prev=UI.reso&&UI.reso.S===S?UI.reso.st:null;UI.reso={S,st:now};
  if(!prev||UI.screen!=='game')return;
  let dl=380;
  for(const p of[0,1]){
    const a=prev[p],b=now[p];
    const fresh=[0,1].filter(j=>b.k[j]&&!(a.k[j]&&a.u[j]===b.u[j]&&a.u[j+1]===b.u[j+1]));
    if(b.full&&fresh.length&&!(a.full&&a.u.join()===b.u.join())){setTimeout(()=>resoFull(p),dl);dl+=900;continue}
    for(const j of fresh){setTimeout(()=>resoLink(p,j),dl);dl+=650}
  }
}
function resoBurst(el,txt,big){
  if(!el)return;const r=el.getBoundingClientRect(),n=big?18:12,R0=big?54:30,R1=big?100:52;
  let lines='';
  for(let i=0;i<n;i++){const a=i/n*Math.PI*2+(i%2?.12:0),r0=R0+(i%3)*4,r1=R1-(i%2)*10,c=Math.cos(a),s=Math.sin(a),o=R1+8;
    lines+=`<path d="M${(o+c*r0).toFixed(1)} ${(o+s*r0).toFixed(1)}L${(o+c*r1).toFixed(1)} ${(o+s*r1).toFixed(1)}" stroke="${i%3?'#3b342c':'#f0b53f'}" stroke-width="${i%3?2.4:4}"/>`}
  const sz=(R1+8)*2,b=document.createElement('div');b.className='rburst'+(big?' big':'');
  b.style.left=(r.left+r.width/2)+'px';b.style.top=(r.top+r.height/2)+'px';b.style.width=b.style.height=sz+'px';
  b.innerHTML=`<svg viewBox="0 0 ${sz} ${sz}" fill="none" stroke-linecap="round">${lines}</svg><b>${txt}</b>`;
  document.body.appendChild(b);setTimeout(()=>b.remove(),1500);
}
function resoLink(p,j){
  const c=document.querySelector(`.conn[data-p="${p}"][data-j="${j}"]`);if(!c)return;
  anim(c,'cflash');anim(slotEl(p,j),'rglow');anim(slotEl(p,j+1),'rglow');
  resoBurst(c,'共鳴！',false);snd('reso');
}
function resoFull(p){
  const mid=slotEl(p,1);if(!mid)return;
  anim(mid.closest('.lane'),'lflash');
  document.querySelectorAll(`.conn[data-p="${p}"]`).forEach(c=>anim(c,'cflash'));
  [0,1,2].forEach((s,k)=>setTimeout(()=>anim(slotEl(p,s),'rglow'),k*140));
  resoBurst(mid,'フルレゾナンス！',true);snd('full');
}
function playFx(){
  if(!S)return;const evs=S.ev.splice(0);let dl=0;
  for(const e of evs){setTimeout(()=>fx1(e),dl);dl+=e.t==='banner'?260:80}
}
function slotEl(p,s){return document.querySelector(`.slot[data-p="${p}"][data-s="${s}"]`)}
function stamp(el,txt,cls,dx=0,dy=0){
  if(!el)return;const r=el.getBoundingClientRect();
  const f=document.createElement('div');f.className='stamp '+cls;f.textContent=txt;
  f.style.left=(r.left+r.width/2+dx)+'px';f.style.top=(r.top+r.height/2+dy)+'px';
  document.body.appendChild(f);setTimeout(()=>f.remove(),1200);
}
function anim(el,cls){if(!el)return;el.classList.remove(cls);void el.offsetWidth;el.classList.add(cls)}
function fx1(e){
  switch(e.t){
    case'dmg':{const el=slotEl(e.p,e.s);stamp(el,e.n,'d');anim(el,'shake');snd('hit');break}
    case'heal':stamp(slotEl(e.p,e.s),'+'+e.n,'h');snd('heal');break;
    case'kill':stamp(slotEl(e.p,e.s),'撃破','k',0,-18);snd('kill');break;
    case'summon':anim(slotEl(e.p,e.s),'pop');snd('summon');break;
    case'atk':anim(slotEl(e.p,e.s),'lunge');snd('atk');break;
    case'draw':snd('draw');break;
    case'life':{const el=$('#life-'+e.p);stamp(el,e.n,'d L',8);anim(el,'hit');snd('big');break}
    case'lheal':stamp($('#life-'+e.p),'+'+e.n,'h',8);snd('heal');break;
    case'gauge':stamp($('#gauge-'+e.p),'+'+e.n,'g');snd('gauge');break;
    case'guard':stamp($('#life-'+e.p),'ガード','gd',30);snd('guard');break;
    case'move':snd('card');break;
    case'fx':stamp(slotEl(e.p,e.s),e.txt,'gd',0,-10);snd('guard');break;   // バリア・封印・かばう など
    case'banner':{
      const b=document.createElement('div');
      const side=(UI.mode==='cpu'?e.p===0:e.p===viewer())?'me':'op';
      b.className='cutin '+side;
      b.innerHTML=`${e.id?cardHTML(e.id,{cls:'mini'}):''}<div class="ci-t"><div class="who3">${esc(S.pl[e.p].name)}</div><b>${esc(e.txt)}</b><small>${esc(e.sub||'')}</small></div>`;
      // 必殺技・タクティクス・リチャージで音を分ける
      document.body.appendChild(b);setTimeout(()=>b.remove(),1600);snd(e.txt==='リチャージ'?'recharge':(e.sub||'').includes('必殺技')?'sp':'tactic');break;
    }
  }
}

