'use strict';
/* =========================================================
   CPU「つよい」（2026-11-24）
   ふつう（cpu.js）は1手ずつ、その場でいちばん点の上がる手をえらぶ。
   つよいは、そのターンにできる手の「組み合わせと順番」をまとめて先読みする：
     1) メイン：手の並びをビームサーチ（AIS.beam 本ずつ、AIS.depth 手まで）。同じ盤面になる並びは1つにまとめる
     2) 候補の上位 AIS.fin 個を、くわしく調べる
          アタック：だれが・どの列へ・どの順で、をすべて試す（相手のガード・かばうは cpu.js の aiDefend で予想）
          その先：ターンを終えたあと AIS.horizon 回の番（相手→自分→相手）を、ありそうな相手の手札で AIS.samples 通り進めて平均
     3) いちばん点の高い並びを1手ずつ出す。予想とちがう盤面になったら（カードを引いた・相手の守りがちがう）考えなおす
   ズルはしない：先読みでは自分の山札をまぜなおし（次に引くカードを知らない）、相手の手札は使わない
   ========================================================= */
// 2026-11-24 測定（ふつう相手に60戦ずつ）：先の番を見ない 77%・相手の1ターン 68%・2ターン 83%・3ターン 87%・4ターン 83%。
// 同じ90戦で、3通り・候補8個 67% → 6通り・候補12個 79%。1手を決める時間は平均約0.2秒・最大約1.7秒（このPC）
const AIS={beam:10,depth:7,fin:12,reply:.8,samples:6,horizon:3};
let AI_PLAN=null,AI_ATK=null;
// 盤面のしるし（同じ盤面か・予想どおりか）。山札の順は入れない
function aiSig(S){
  return JSON.stringify([S.cur,S.phase,S.winner,S.pl.map(p=>[p.life,p.gauge,p.energy,p.shiftUsed,p.rechargeUsed,p.guardUsed,p.bigSp,p.rbw,p.hand.map(c=>c.uid),p.trash.length,p.deck.length,
    p.lane.map(m=>m&&[m.uid,m.dmg,m.buff,m.summoned,m.attacked,m.usedSp,m.rush,m.bar,m.thp,m.seal,m.sil,m.stun,m.wkt,m.wku,m.wkp])])]);
}
// 先読み用の写し：自分の山札をまぜなおす（引くカードは分からないものとして考える）
function aiPlanClone(S,p){const c=cloneS(S);shuffle(c.pl[p].deck);return c}
// ターンの終わりとしての点（まだアタックできる、という見こみの点を入れない）
function aiEndV(S,p){const ph=S.phase;S.phase='end';const v=evalS(S,p);S.phase=ph;return v}

/* ---- アタック：順番と列をすべて試す ---- */
function aiAtkSearch(S,p,n){
  let best={v:aiEndV(S,p),seq:[],sigs:[]};
  if(S.winner!=null||(n||0)>=3)return best;
  for(let i=0;i<3;i++){
    if(!canAttack(S,p,i))continue;
    for(const t of atkTargets(S,p,i)){
      const c=cloneS(S),d=1-p;
      const r=(guardOK(c,p,t,null)||coverOpts(c,p,t).length)?aiDefend(c,d,p,i,t):{g:false,c:null};
      doAttack(c,p,i,r.g,t,r.c);
      const sub=aiAtkSearch(c,p,(n||0)+1);
      if(sub.v>best.v+1e-9)best={v:sub.v,seq:[{i,t},...sub.seq],sigs:[aiSig(c),...sub.sigs]};
    }
  }
  return best;
}

/* ---- 相手の返し ----
   相手の手札は見えないので、「相手の手札＋山札」（どちらもこちらからは見えないカード）をまぜて、
   手札の枚数だけ配りなおした「ありそうな手札」を AIS.samples 通り作り、相手が1ターン（ふつうのCPUの考え方で）動いたあとの点を平均する */
// ふつうのCPUの考え方で、いまの番の人が1ターン動く（ターンの終わりまで。次の番には進めない）
function aiPlayTurnN(c){
  const q=c.cur;
  for(let k=0;k<10&&c.winner==null;k++){const a=aiPickMainN(c,q);if(!a)break;applyAction(c,q,a)}
  if(c.winner==null&&canBattle(c)&&anyReady(c,q)){
    c.phase='battle';
    for(let k=0;k<3&&c.winner==null;k++){
      const a=aiPickAttackN(c,q);if(!a)break;
      const r=(guardOK(c,q,a.t,null)||coverOpts(c,q,a.t).length)?aiDefend(c,1-q,q,a.i,a.t):{g:false,c:null};
      doAttack(c,q,a.i,r.g,a.t,r.c);
    }
  }
}
// 自分のターンを終えたあと、AIS.horizon 回の番（相手→自分→…）を進めた点
function aiReplyOnce(S,p){
  const c=cloneS(S),o=1-p,op=c.pl[o];
  const pool=shuffle([...op.hand,...op.deck]);op.hand=pool.slice(0,op.hand.length);op.deck=pool.slice(op.hand.length);
  shuffle(c.pl[p].deck);
  for(let h=0;h<AIS.horizon;h++){
    endPhase(c);if(c.winner!=null)break;
    if(c.pl[c.cur].hand.length>HANDMAX)aiDiscard(c,c.cur);
    nextTurn(c);if(c.winner!=null)break;
    aiPlayTurnN(c);if(c.winner!=null)break;
  }
  if(c.winner!=null)return evalS(c,p);
  return aiEndV(c,p);
}
function aiReplyV(S,p){let s=0;for(let k=0;k<AIS.samples;k++)s+=aiReplyOnce(S,p);return s/AIS.samples}
// メインの手を並べ終えた盤面の、くわしい点：いちばん良いアタック → 相手の返し
function aiFullV(S,p){
  const c=cloneS(S);
  if(c.winner!=null)return{v:evalS(c,p)};
  let atk={seq:[]};
  if(canBattle(c)&&anyReady(c,p)){c.phase='battle';atk=aiAtkSearch(c,p);for(const x of atk.seq){const d=1-p,r=(guardOK(c,p,x.t,null)||coverOpts(c,p,x.t).length)?aiDefend(c,d,p,x.i,x.t):{g:false,c:null};doAttack(c,p,x.i,r.g,x.t,r.c)}}
  if(c.winner!=null)return{v:evalS(c,p)};
  const end=aiEndV(c,p),rep=aiReplyV(c,p);
  return{v:rep*AIS.reply+end*(1-AIS.reply)};
}

/* ---- メイン：手の並びをビームサーチ ---- */
function aiStrongPlan(S,p){
  const root=aiPlanClone(S,p),seen=new Set([aiSig(root)]);
  const start={s:root,seq:[],sigs:[],v:evalS(root,p)};
  let beam=[start];const pool=[start];
  for(let dep=0;dep<AIS.depth;dep++){
    const kids=[];
    for(const n of beam){
      for(const a of aiActions(n.s,p)){
        const c=cloneS(n.s);if(!applyAction(c,p,a))continue;
        const g=aiSig(c);if(seen.has(g))continue;seen.add(g);
        let v=evalS(c,p);
        // エナジーをふやすカードは、そのあとの手で値うちが出るので少しおまけして残す
        if(aiIsEnergy(n.s,p,a))v+=.6;
        kids.push({s:c,seq:[...n.seq,a],sigs:[...n.sigs,g],v});
        if(c.winner===p)return{seq:[...n.seq,a],sigs:[...n.sigs,g]};   // 勝てるならそれで決まり
      }
    }
    if(!kids.length)break;
    kids.sort((a,b)=>b.v-a.v);beam=kids.slice(0,AIS.beam);pool.push(...beam);
  }
  pool.sort((a,b)=>b.v-a.v);
  const fin=pool.slice(0,AIS.fin);if(!fin.includes(start))fin.push(start);
  let best=start,bv=-Infinity;
  for(const f of fin){const r=aiFullV(f.s,p);f.full=r.v;if(r.v>bv+1e-9){bv=r.v;best=f}}
  return best;
}
function aiStrongMain(S,p){
  if(S.phase!=='main'||S.winner!=null)return null;
  const now=aiSig(S);
  if(!(AI_PLAN&&AI_PLAN.S===S&&AI_PLAN.turn===S.turnNo&&AI_PLAN.expect===now)){
    const b=aiStrongPlan(S,p);AI_PLAN={S,turn:S.turnNo,seq:b.seq,sigs:b.sigs,i:0,expect:now};
  }
  const P=AI_PLAN;if(P.i>=P.seq.length)return null;
  P.expect=P.sigs[P.i];return P.seq[P.i++];
}
function aiStrongAttack(S,p){
  if(S.winner!=null)return null;
  const now=aiSig(S);
  if(!(AI_ATK&&AI_ATK.S===S&&AI_ATK.turn===S.turnNo&&AI_ATK.expect===now)){
    const b=aiAtkSearch(aiPlanClone(S,p),p);AI_ATK={S,turn:S.turnNo,seq:b.seq,sigs:b.sigs,i:0,expect:now};
  }
  const P=AI_ATK;if(P.i>=P.seq.length)return null;
  P.expect=P.sigs[P.i];return P.seq[P.i++];
}
