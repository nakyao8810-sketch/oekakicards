'use strict';
/* ---------- 対象をえらぶ ---------- */
// onCancel：「やめる」を押したとき
function startTarget(msg,valid,cb,prev,onCancel){UI.sheet=null;UI.tgt={msg,valid:new Set(valid.map(v=>v[0]+'-'+v[1])),cb,prev:prev||null,onCancel:onCancel||null};render()}
function onSlot(p,s){
  const atkMine=()=>myTurn()&&S.phase==='battle'&&p===S.cur&&canAttack(S,p,s);
  if(UI.tgt){
    if(UI.tgt.valid.has(p+'-'+s)){const cb=UI.tgt.cb;UI.tgt=null;snd('tap');cb(p,s);return}
    // アタックの相手をえらんでいるとき：同じモンスターをもう一度でやめる、ほかのアタックできるモンスターなら選びなおし
    if(UI.tgt.atk!=null&&atkMine()){if(s===UI.tgt.atk){UI.tgt=null;snd('tap');render()}else{snd('tap');humanAtkPick(s)}}
    return;
  }
  if(!S.pl[p].lane[s])return;
  // バトル中は、アタックできる自分のモンスターをタップ → アタックできる相手が光る → 相手をタップでアタック
  if(atkMine()){UI.sheet=null;snd('tap');humanAtkPick(s);return}
  UI.sheet={kind:'field',p,s};snd('tap');render();
}
// アタックの見こみ（相手の上に出す短い字）
function atkLabel(p,i,t){
  const o=S.pl[1-p],em=o.lane[t],a=atkDmg(S,p,i,t);
  if(!em)return`ライフ-${a}`;
  const d=Math.max(0,a-redu(S,1-p,t,laneInfo(S,1-p))),c=Math.max(0,atkOf(S,1-p,t)-redu(S,p,i,laneInfo(S,p)));
  return`${d}ダメージ${d>=hpLeft(S,1-p,t)?'<b>撃破</b>':''}<br><small>反撃${c}${c>=hpLeft(S,p,i)?' やられる':''}</small>`;
}
// アタックするモンスター i をえらんだ：相手をえらぶ
function humanAtkPick(i){
  const p=S.cur,ts=atkTargets(S,p,i),prev={};
  for(const t of ts)prev[(1-p)+'-'+t]=atkLabel(p,i,t);
  startTarget(`${esc(D(S.pl[p].lane[i]).sn)}のアタック：相手をタップ${ts.length>1?'（どの列にも。向かい以外は-'+rxOf(D(S.pl[p].lane[i]))+'）':''}`,ts.map(t=>[1-p,t]),(pp,t)=>humanAttack(i,t),prev);
  UI.tgt.atk=i;render();
}
async function humanAttack(i,t){
  const p=S.cur;if(!myTurn()||!canAttack(S,p,i))return;
  if(UI.mode==='net'){UI.sheet=null;if(!olDo({k:'atk',i,t}))render();return}
  UI.sheet=null;UI.busy=true;render();
  await performAttack(p,i,t);
  if(S&&S.winner==null){UI.busy=false;render()}
}
function humanDo(a){if(!S||S.winner!=null)return;if(UI.mode==='net'){olAct(a);return}applyAction(S,S.cur,a);UI.sheet=null;flush()}
function humanMove(prefix,cb){
  const p=S.cur;
  startTarget(prefix+'動かすモンスターをえらんでください',occ(S.pl[p]).map(s=>[p,s]),(pp,a)=>{
    startTarget(prefix+`${D(S.pl[p].lane[a]).sn}をどこへ動かす？（いれば入れ替え）`,[0,1,2].filter(x=>x!==a).map(x=>[p,x]),(pp2,b)=>cb(a,b));
  });
}
function previewLinks(p,id,s){
  const l=S.pl[p].lane,d=CARDS[id];let n=0;
  if(s>0&&l[s-1]&&mt(D(l[s-1]).R,d.L))n++;
  if(s<2&&l[s+1]&&mt(d.R,D(l[s+1]).L))n++;
  return n;
}

