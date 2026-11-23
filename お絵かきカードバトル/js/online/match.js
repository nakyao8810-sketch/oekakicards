'use strict';
/* =========================================================
   オンライン対戦：1試合の進行（画面と通信は知らない）
   2台が同じ手を同じ順に engine.js へ入れて、同じ盤面を作る。
     ・相手の手札・山札は番号（uid）だけで、中身（id）は null。出したときに中身が届く
     ・中身は試合の前に交換した指紋（ハッシュ）と合うか確かめるので、すり替えられない
     ・先攻と山札の並びは2人の乱数を合わせて決める。自分だけでは選べない
     ・手を決める人はいつも1人（手番の人。ガードを聞かれている間は守る人）
   記録 G：{me:自分のひみつ, op:相手の指紋, x:相手の乱数, ops:[[席,手]]}。G から盤面を作り直せる
   ========================================================= */

// 自分のひみつ：まぜた30枚・1枚ずつの塩・乱数
function olSecret(deck,name){
  const j=deck.j.slice();
  for(let i=j.length-1;i>0;i--){const k=olPick(i+1);[j[i],j[k]]=[j[k],j[i]]}
  return{name,j,salt:j.map(()=>olRand(16)),x:olRand(32),sent:false};
}
// 相手に先に見せるのは指紋だけ
function olPublic(me){return{k:'ready',name:me.name,c:me.j.map((j,i)=>olSha(me.salt[i]+j)),h:olSha(me.x)}}
function olReadyOK(m){
  const h=s=>typeof s==='string'&&/^[0-9a-f]{64}$/.test(s);
  return Array.isArray(m.c)&&m.c.length===DE_M+DE_T&&m.c.every(h)&&h(m.h);
}

function olMatch(G,seat){
  const name=[],commit=[],nonce=[],other=1-seat;
  const mine=G.me.j.map(j=>{const id=olUseCard(j);if(!id)throw new Error('自分のカードを読めない');return id});
  name[seat]=olClean(G.me.name,10)||'あなた';name[other]=olClean(G.op.name,10)||'相手';
  if(name[0]===name[1])name[other]+='（相手）';
  commit[seat]=olPublic(G.me).c;commit[other]=G.op.c;
  nonce[seat]=G.me.x;nonce[other]=G.x;

  const seed=olSha(nonce[0]+'|'+nonce[1]),decks=[];
  for(let p=0;p<2;p++){
    const a=G.me.j.map((_,i)=>({uid:p*100+i+1,id:p===seat?mine[i]:null}));
    const r=rkRng(parseInt(seed.slice(8+p*8,16+p*8),16));
    for(let i=a.length-1;i>0;i--){const k=Math.floor(r()*(i+1));[a[i],a[k]]=[a[k],a[i]]}
    decks.push(a);
  }
  const st=newState([0,1].map(p=>newPlayer(name[p],false,-1,decks[p])),parseInt(seed.slice(0,2),16)&1);
  return{S:st,seat,commit,mull:[false,false],pend:null,quit:null,shown:new Map(),me:G.me};
}

// いまの公開されている盤面の指紋。2台でずれていないかを1手ごとに確かめる
function olHash(M){
  const T=M.S,u=a=>a.map(c=>c.uid);
  return olSha(JSON.stringify([T.cur,T.phase,T.turnNo,T.winner,M.pend&&[M.pend.p,M.pend.i,M.pend.t],T.pl.map(p=>[p.life,p.gauge,p.energy,p.maxE,p.turn,p.shiftUsed,p.rechargeUsed,p.guardUsed,p.bigSp,p.rbw,
    u(p.deck),u(p.hand),u(p.trash),p.lane.map(m=>m&&[m.uid,m.id,m.dmg,m.buff,m.summoned,m.attacked,m.usedSp,!!m.rz,!!m.rush,!!m.bar,m.thp||0,m.seal||0,m.sil||0,m.stun||0,m.wkt||0,m.wku||0,m.wkp||0])])])).slice(0,16);
}

// 自分が打つ手に、盤面の指紋と出すカードの中身をつける
function olMakeMove(M,m){
  const o=Object.assign({},m);
  if(M.S.phase!=='setup'&&m.k!=='quit')o.s=olHash(M);
  if(m.k==='act'&&(m.a.k==='summon'||m.a.k==='tactic')){const i=(m.a.uid-1)%100;o.r=[M.me.j[i],M.me.salt[i]]}
  // よみがえり：捨てたカードは相手が中身を知らないので、出すときに見せる
  if(m.k==='act'&&m.a.k==='sp'&&Array.isArray(m.a.tg)&&SP[D(M.S.pl[M.seat].lane[m.a.i]).sp].t==='trash'){const i=(m.a.tg[0]-1)%100;o.r=[M.me.j[i],M.me.salt[i]]}
  return o;
}

function olUidsOK(u,hand){return Array.isArray(u)&&u.length<=hand.length&&new Set(u).size===u.length&&u.every(x=>hand.some(c=>c.uid===x))}

// 出されたカードの中身を確かめて、場に出せる形にする
function olReveal(M,p,c,r){
  if(!Array.isArray(r)||typeof r[0]!=='string'||!/^[0-9a-f]{32}$/.test(r[1]))return'カードの中身がない';
  if(olSha(r[1]+r[0])!==M.commit[p][(c.uid-1)%100])return'カードが試合前のものとちがう';
  const id=olUseCard(r[0]);if(!id)return'使えないカード';
  if(!M.shown.has(c.uid)){
    let same=0,kind=0;const type=CARDS[id].type;
    for(const[u,x]of M.shown)if(Math.floor(u/100)===p){if(x===id)same++;if(CARDS[x].type===type)kind++}
    if(same>=DE_COPY||kind>=(type==='m'?DE_M:DE_T))return'デッキの枚数の決まりに合わない';
    M.shown.set(c.uid,id);
  }
  c.id=id;return'';
}

/* 手を1つ進める（自分の手・相手の手・作り直しの全部がここを通る）
   返り値 ''＝進めた／'skip'＝もう関係のない手／それ以外＝おかしい手の理由 */
function olStep(M,p,m){
  const T=M.S,pl=T.pl[p];
  if(!m||typeof m!=='object')return'形がちがう';
  if(m.k==='quit'){
    if(M.quit===p)return'skip';
    // 降参は、入れちがいで決着していても優先。2人同時の降参も2台で同じ結果になる
    if(M.quit==null){M.quit=p;T.winner=1-p;T.why=`${pl.name}が降参した`}
    else{M.quit=2;T.winner=2;T.why='ふたりとも降参した'}   // winner 2＝引き分け
    M.pend=null;lg(T,`${pl.name}が降参した`,p);return'';
  }
  if(m.k==='left'){   // 通信では来ない（退出を知ったときに自分で入れる）
    if(T.winner!=null)return'skip';
    win(T,1-p,`${pl.name}が退出した`);M.pend=null;return'';
  }
  if(T.winner!=null)return'skip';

  if(T.phase==='setup'){
    if(m.k!=='mull'||M.mull[p]||!olUidsOK(m.u,pl.hand))return'引き直しが正しくない';
    mulligan(T,p,m.u);M.mull[p]=true;
    if(M.mull[0]&&M.mull[1])startTurn(T);
    return'';
  }
  if(m.s!==olHash(M))return'盤面がずれている';

  if(M.pend){
    if(m.k!=='guard'||p===M.pend.p||typeof m.y!=='boolean')return'ガードの返事が正しくない';
    const a=M.pend,c=m.c==null?null:m.c;
    if(c!==null&&!coverOpts(T,a.p,a.t).includes(c))return'かばえない';
    if(m.y&&!guardOK(T,a.p,a.t,c))return'ガードできない';   // ガードはプレイヤーへのダイレクトアタックだけ
    M.pend=null;
    doAttack(T,a.p,a.i,m.y,a.t,c);return'';
  }
  if(p!==T.cur)return'手番ではない';

  switch(m.k){
    case'act':return olAction(M,p,m);
    case'battle':
      if(T.phase!=='main'||!canBattle(T))return'バトルに入れない';
      T.phase='battle';lg(T,'バトルフェイズ',p);return'';
    case'atk':
      if(!olInt(m.i,0,2)||!canAttack(T,p,m.i))return'アタックできない';
      {const t=m.t==null?2-m.i:m.t;if(!atkTargets(T,p,m.i).includes(t))return'その列にはアタックできない';
      if(guardOK(T,p,t,null)||coverOpts(T,p,t).length)M.pend={p,i:m.i,t};else doAttack(T,p,m.i,false,t)}
      return'';
    case'end':{
      if(T.phase!=='main'&&T.phase!=='battle')return'ターンを終われない';
      if(!olUidsOK(m.u,pl.hand)||m.u.length!==Math.max(0,pl.hand.length-HANDMAX))return'捨てる枚数が正しくない';
      endPhase(T);discard(T,p,m.u);nextTurn(T);return'';
    }
  }
  return'知らない手';
}
function olAction(M,p,m){
  const T=M.S,pl=T.pl[p],a=m.a;
  if(!a||T.phase!=='main')return'いまはできない';
  const slot=v=>olInt(v,0,2),tg=a.tg==null?null:a.tg,tg2=a.tg2==null?null:a.tg2;
  let act;
  switch(a.k){
    case'summon':case'tactic':{
      const c=pl.hand.find(x=>x.uid===a.uid);if(!c)return'手札にない';
      const err=olReveal(M,p,c,m.r);if(err)return err;
      const d=D(c);
      if(cardCheck(T,p,c))return'そのカードは使えない';
      if(a.k==='summon'){
        if(d.type!=='m'||!slot(a.s)||!sumSlots(T,p).slots.includes(a.s))return'そこには召喚できない';
        act={k:'summon',uid:c.uid,s:a.s};
      }else{
        if(d.type!=='t')return'タクティクスではない';
        if(d.t==='move'){if(!slot(tg)||!slot(tg2)||tg===tg2||!pl.lane[tg])return'動かせない'}
        else if(tg2!==null||!tacTargets(T,p,d.t,d).some(([x])=>x===tg))return'対象が正しくない';
        act={k:'tactic',uid:c.uid,tg,tg2};
      }
      break;
    }
    case'sp':{
      if(!slot(a.i)||!pl.lane[a.i]||!D(pl.lane[a.i]).sp)return'必殺技を使えない';
      // よみがえり：捨てたカードの中身をここで確かめてから、使えるかを見る（知らないままだと対象がいないことになる）
      if(SP[D(pl.lane[a.i]).sp].t==='trash'){
        const c=Array.isArray(tg)?pl.trash.find(x=>x.uid===tg[0]):null;if(!c)return'トラッシュにない';
        if(c.id==null){const err=olReveal(M,p,c,m.r);if(err)return err}
      }
      if(spCheck(T,p,a.i))return'必殺技を使えない';
      const js=JSON.stringify(tg);if(!spTg(T,p,a.i).some(x=>JSON.stringify(x)===js))return'対象が正しくない';
      act={k:'sp',i:a.i,tg};break;
    }
    case'shift':
      if(!slot(a.a)||!slot(a.b)||a.a===a.b||!pl.lane[a.a])return'動かせない';
      act={k:'shift',a:a.a,b:a.b};break;
    case'recharge':act={k:'recharge'};break;
    default:return'知らない行動';
  }
  return applyAction(T,p,act)?'':'その行動はできない';
}
