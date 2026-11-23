'use strict';
/* ---------- ゲームの進行 ---------- */
function startNew(){
  const pvp=UI.mode==='pvp';
  const strong=!pvp&&UI.cpuLv==='strong';
  const names=pvp?['プレイヤー1','プレイヤー2']:['あなた',strong?'CPU（つよい）':'CPU'];
  const d1=UI.deck[0],d2=pvp?UI.deck[1]:(UI.cpuDeck<0?rnd(3):UI.cpuDeck);
  S=makeState([d1,d2],names,[false,!pvp]);
  if(strong)S.pl[1].lv='strong';
  UI.resultShown=false;UI.sheet=null;UI.tgt=null;UI.busy=true;
  beginGame();
}
async function beginGame(){
  UI.screen='game';UI.view=UI.mode==='cpu'?null:S.first;render();snd('coin');
  await modal(`<div class="coin2"><div class="sub">先攻</div><div class="ct">${S.pl[S.first].name}</div>
    <p>${S.pl[0].name}　${DECKS[S.pl[0].deckNo].name}<br>${S.pl[1].name}　${DECKS[S.pl[1].deckNo].name}</p>
    <p class="sub">先攻は最初のターン、ドローとバトルができません。後攻は最初の手札が1枚多く、ソウルゲージ1からはじめます。</p></div>`,[['OK','ok','pri']]);
  for(const k of[S.first,1-S.first]){
    const pl=S.pl[k];
    if(pl.cpu){aiMulligan(S,k);continue}
    if(UI.mode==='pvp'){UI.view=k;render();await handover(k,'最初の手札を見て、引き直すか決めます')}
    const sel=await pickCards(`${UI.mode==='pvp'?pl.name+'　':''}最初の手札`,pl.hand,0,pl.hand.length,n=>n?`${n}枚を引き直す`:'このままでいい','引き直したいカードをタップ。山札の下に戻して、同じ枚数を引きます（1回だけ）','戻す');
    mulligan(S,k,sel);
  }
  UI.view=null;UI.busy=false;
  startTurn(S);
  await afterTurnStart();
}
async function afterTurnStart(){
  const p=S.cur;snd(S.pl[p].cpu||(UI.mode==='pvp'?false:p!==0)?'turnop':'turn');   // ターンのはじまり（自分と相手で音を分ける）
  flush();if(S.winner!=null)return;
  if(S.pl[p].cpu){await cpuTurn();return}
  if(UI.mode==='pvp'){UI.busy=true;render();await handover(p);UI.busy=false;flush()}
}
async function cpuTurn(){
  UI.busy=true;const p=S.cur;const mySt=S;render();
  await sleep(800);
  for(let k=0;k<20;k++){
    if(S!==mySt||S.winner!=null)return;
    const a=aiPickMain(S,p);if(!a)break;
    applyAction(S,p,a);flush();await sleep(a.k==='sp'||a.k==='tactic'?1500:1000);
  }
  if(S!==mySt||S.winner!=null)return;
  if(canBattle(S)&&anyReady(S,p)){
    S.phase='battle';lg(S,'バトルフェイズ',p);flush();snd('battle');await sleep(600);
    for(let k=0;k<3;k++){
      if(S!==mySt||S.winner!=null)return;
      const a=aiPickAttack(S,p);if(!a)break;
      await performAttack(p,a.i,a.t);await sleep(1000);
    }
  }
  if(S!==mySt||S.winner!=null)return;
  endPhase(S);aiDiscard(S,p);nextTurn(S);UI.busy=false;
  await afterTurnStart();
}
// t：アタックする列（なければ向かい）。守る側は、かばう・ガードを決める
async function performAttack(p,i,t){
  const d=1-p;if(t==null)t=2-i;let r={g:false,c:null};
  if(guardOK(S,p,t,null)||coverOpts(S,p,t).length){
    if(S.pl[d].cpu)r=aiDefend(S,d,p,i,t);
    else{render();r=await askDefend(p,i,t)}
  }
  doAttack(S,p,i,r.g,t,r.c);flush();
}

async function humanEndTurn(){
  if(!myTurn())return;
  if(UI.mode==='net')return olEndTurn();
  UI.busy=true;UI.sheet=null;UI.tgt=null;const p=S.cur;
  endPhase(S);flush();
  const pl=S.pl[p];
  if(pl.hand.length>HANDMAX){
    const n=pl.hand.length-HANDMAX;
    const sel=await pickCards(`手札が${pl.hand.length}枚あります`,pl.hand,n,n,k=>`${k}/${n}枚 捨てる`,`手札は7枚まで。捨てるカードを${n}枚えらんでください`,'捨てる');
    discard(S,p,sel);
  }
  nextTurn(S);UI.busy=false;
  await afterTurnStart();
}
async function showResult(){
  if(UI.resultShown)return;UI.resultShown=true;UI.busy=false;UI.sheet=null;UI.tgt=null;render();
  await sleep(800);
  const w=S.winner,cpu=UI.mode==='cpu';
  const lose=cpu&&w!==0;
  const word=cpu?(w===0?'勝利':'敗北'):'勝利';
  snd(lose?'lose':'win');
  const v=await modal(`<div class="res ${lose?'lose':'win'}">${cpu?'':`<div class="sub">${S.pl[w].name}</div>`}<div class="seal2">${word}</div><p>${esc(S.why)}</p>
    <p class="sub">${S.turnNo}ターン　/　ライフ ${S.pl[0].name} ${S.pl[0].life}・${S.pl[1].name} ${S.pl[1].life}　/　逆転ボーナス ${S.st.revP?`${S.pl[0].name} ${S.st.revP[0]}回・${S.pl[1].name} ${S.st.revP[1]}回`:`${S.st.rev}回`}</p></div>`,
    [['もう一度','again','pri'],['デッキを選び直す','deck'],['タイトルへ','title']]);
  if(v==='again')startNew();
  else{S=null;UI.screen=v==='deck'?'deck':'title';render()}
}

