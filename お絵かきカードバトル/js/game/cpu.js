'use strict';
/* =========================================================
   CPU（1手ずつ先読みして盤面の点数が一番上がる手を選ぶ）
   ========================================================= */
function lifeV(l){return l*1.3-(l<8?(8-l)*(8-l)*0.18:0)}
function handV(n){n=Math.min(n,HANDMAX);return n<=4?n:4+(n-4)*0.5}
// 共鳴している間の、続けて得をする効果の値うち
const RES_V={gaugeStart:1,lifeStart:.8,regen:.5,thorn:.4,lifeX:.8,healAdj:.5,cover:.4,spTax:.4,hush:.6,reach:.5,killG:.4,spHeal:.3};
function sideV(S,p){
  const pl=S.pl[p],o=S.pl[1-p],f=laneInfo(S,p);let v=0;
  const act=S.cur===p&&(S.phase==='main'||S.phase==='battle');
  for(let i=0;i<3;i++){
    const m=pl.lane[i];if(!m)continue;
    const d=D(m),a=atkOf(S,p,i,true),h=hpLeft(S,p,i);
    v+=2+a*1.0+h*0.6+(f.on[i]?0.6:0)+(d.sp?0.8:0)+(f.on[i]?RES_V[d.res]||0:0)+(m.bar?1:0);
    const em=o.lane[2-i];
    if(act&&canAttackLater(S,p,i)){const aa=atkOf(S,p,i);if(!em)v+=aa*1.0;else{const eh=hpLeft(S,1-p,2-i),ca=atkOf(S,1-p,2-i);v+=Math.min(aa,eh)*0.4+(aa>=eh?1.2:0)-(ca>=h?0.8:0)}}
    else if(!em)v+=S.cur!==p&&m.stun===S.turnNo+1?0:a*0.5;   // 次の番にアタックできない（すくみ）ならねらわれない
  }
  if(f.full)v+=0.8;
  return v;
}
// この番のうちにまだアタックできるか（バトルの前でも）
function canAttackLater(S,p,i){const m=S.pl[p].lane[i];return!!m&&!fresh(S,p,i)&&!m.attacked&&m.stun!==S.turnNo}
function evalS(S,p){
  if(S.winner!=null)return S.winner===p?1e6:-1e6;
  const me=S.pl[p],o=S.pl[1-p];
  return lifeV(me.life)-lifeV(o.life)+(me.gauge-o.gauge)*0.9+handV(me.hand.length)-handV(o.hand.length)
    +sideV(S,p)-sideV(S,1-p)-(me.deck.length<4?(4-me.deck.length)*1.5:0);
}
function aiActions(S,p){
  const pl=S.pl[p],A=[],seen=new Set();
  for(const c of pl.hand){
    const d=D(c);if(seen.has(c.id)||d.cost>pl.energy)continue;seen.add(c.id);
    if(d.type==='m'){for(const s of sumSlots(S,p).slots)A.push({k:'summon',uid:c.uid,s})}
    else for(const[tg,tg2]of tacTargets(S,p,d.t,d))A.push({k:'tactic',uid:c.uid,tg,tg2});
  }
  for(let i=0;i<3;i++){
    const m=pl.lane[i];if(!m||!D(m).sp||spCheck(S,p,i))continue;
    const ts=new Set();
    for(const tg of spTg(S,p,i)){
      // よみがえり：同じカードは1回だけ考える
      if(SP[D(m).sp].t==='trash'){const k=pl.trash.find(c=>c.uid===tg[0]).id+'/'+tg[1];if(ts.has(k))continue;ts.add(k)}
      A.push({k:'sp',i,tg});
    }
  }
  if(!pl.shiftUsed&&pl.gauge>=SHIFT_G)for(const[a,b]of tacTargets(S,p,'move'))A.push({k:'shift',a,b});
  if(!pl.rechargeUsed&&pl.gauge>=RECH_G&&pl.deck.length>6)A.push({k:'recharge'});
  return A;
}
// エナジーをふやすタクティクスか（使ったあとの1手まで見ないと値うちが分からない）
const aiIsEnergy=(S,p,a)=>{if(a.k!=='tactic')return false;const c=S.pl[p].hand.find(x=>x.uid===a.uid);return!!c&&D(c).tk==='energy'};
// CPUの強さ：pl.lv==='strong' なら cpu_strong.js の先読み、ふつうは1手ずつ（今までどおり）
function aiPickMain(S,p){return S.pl[p].lv==='strong'?aiStrongMain(S,p):aiPickMainN(S,p)}
function aiPickAttack(S,p){return S.pl[p].lv==='strong'?aiStrongAttack(S,p):aiPickAttackN(S,p)}
function aiPickMainN(S,p){
  let best=null,bv=evalS(S,p)+0.2;
  for(const a of aiActions(S,p)){
    const c=cloneS(S);if(!applyAction(c,p,a))continue;let v=evalS(c,p);
    if(aiIsEnergy(S,p,a)){
      let b=-1e9;
      for(const a2 of aiActions(c,p)){if(aiIsEnergy(c,p,a2))continue;const c2=cloneS(c);if(applyAction(c2,p,a2))b=Math.max(b,evalS(c2,p))}
      v=b-0.3;   // ふやしたエナジーで出せるものがなければ使わない
    }
    if(v>bv){bv=v;best=a}
  }
  return best;
}
// アタックするモンスターと列。返り値 {i,t} か null
function aiPickAttackN(S,p){
  let best=null,bv=evalS(S,p)+0.01;
  for(let i=0;i<3;i++){if(!canAttack(S,p,i))continue;
    for(const t of atkTargets(S,p,i)){const c=cloneS(S);doAttack(c,p,i,false,t);const v=evalS(c,p);if(v>bv){bv=v;best={i,t}}}}
  return best;
}
// 守る側：ガードするか・どれがかばうか。返り値 {g,c}
function aiDefend(S,d,p,i,t){
  const gs=guardOK(S,p,t,null)?[false,true]:[false],cs=[null,...coverOpts(S,p,t)];
  let best={g:false,c:null},bv=-1e9;
  // かばうとモンスターへのアタックになるので、ガードとかばうはいっしょにしない
  for(const g of gs)for(const c of cs){if(g&&c!=null)continue;const x=cloneS(S);doAttack(x,p,i,g,t,c);const v=evalS(x,d)-(g?1.2:0);if(v>bv){bv=v;best={g,c}}}
  return best;
}
function aiGuard(S,d,p,i){return aiDefend(S,d,p,i,2-i).g}
function aiMulligan(S,p){
  const pl=S.pl[p];const cheap=pl.hand.filter(c=>D(c).type==='m'&&D(c).cost<=2).length;
  mulligan(S,p,pl.hand.filter(c=>D(c).cost>=4||(cheap<2&&D(c).type==='t')).map(c=>c.uid));
}
function aiDiscard(S,p){const pl=S.pl[p];if(pl.hand.length<=HANDMAX)return;const s=[...pl.hand].sort((a,b)=>D(b).cost-D(a).cost);discard(S,p,s.slice(0,pl.hand.length-HANDMAX).map(c=>c.uid))}
function aiFullTurn(S){
  const p=S.cur;
  for(let k=0;k<20&&S.winner==null;k++){const a=aiPickMain(S,p);if(!a)break;applyAction(S,p,a)}
  if(S.winner!=null)return;
  if(canBattle(S)){S.phase='battle';for(let k=0;k<3&&S.winner==null;k++){const a=aiPickAttack(S,p);if(!a)break;const d=1-p,r=(guardOK(S,p,a.t,null)||coverOpts(S,p,a.t).length)?aiDefend(S,d,p,a.i,a.t):{g:false,c:null};doAttack(S,p,a.i,r.g,a.t,r.c)}}
  if(S.winner!=null)return;
  endPhase(S);aiDiscard(S,p);nextTurn(S);
}
