'use strict';
/* =========================================================
   オンライン対戦：画面（入口・待ち合わせ・対戦中のたずねごと・結果）
   ========================================================= */
function onlineHTML(){return OL.R?olRoomHTML():olEntryHTML()}
function olEntryHTML(){
  if(OL.deck>=DECKS.length)OL.deck=0;
  const ok=olCanUse(),saves=ok?olSaves():[];
  const top=`<h2>オンライン対戦</h2>${OL.msg?`<p class="olmsg" role="status">${OL.msg}</p>`:''}`;
  if(!ok)return`<div class="deckscr">${top}
    <p class="olmsg">この開き方ではオンライン対戦を使えません。index.html をそのまま開くか、https のページで開いてください。</p>
    <div class="go"><button class="btn ghost" data-act="back">もどる</button></div></div>`;
  return`<div class="deckscr">${top}
    ${saves.length?`<h3>とちゅうの対戦</h3>${saves.map(({id,R})=>`<div class="olresume"><span>部屋 ${esc(olCodeText(R.code))}<small>${R.game?`${esc(R.game.op.name||'相手')}との対戦`:'相手を待っていた部屋'}</small></span>
      <button class="btn pri" data-act="olresume" data-id="${id}">もどる</button><button class="btn" data-act="oldrop" data-id="${id}">消す</button></div>`).join('')}`:''}
    <h3>あなたの名前</h3>
    <input id="olname" class="rkin olin" maxlength="10" autocomplete="off" placeholder="プレイヤー" value="${OL.name}" aria-label="あなたの名前">
    <h3>使うデッキ</h3>
    ${DECKS.map((d,i)=>`<div class="dk ${OL.deck===i?'on':''}" data-act="oldeck" data-i="${i}">
      <div class="els">${d.els.map(e=>`<span class="seal" style="background:${EL[e].c}">${EL[e].n}</span>`).join('')}</div>
      <div class="dkb"><div class="dkn">${esc(d.name)}</div><div class="dkd">${esc(d.desc)}</div></div>
      <button class="btn" data-act="viewdeck" data-i="${i}">中身</button></div>`).join('')}
    <div class="olways">
      <div class="olway"><h4>部屋を作る</h4><p class="sub">出てきた部屋番号を相手に教えます</p>
        <button class="btn pri" data-act="olcreate">部屋を作る</button></div>
      <div class="olway"><h4>部屋に入る</h4>
        <input id="olcode" class="rkin olin olcodein" maxlength="12" autocomplete="off" autocapitalize="characters" spellcheck="false" placeholder="部屋番号（8文字）" value="${OL.code}" aria-label="部屋番号">
        <button class="btn pri" data-act="oljoin">入る</button></div>
    </div>
    <p class="sub">部屋番号は、対戦する相手にだけ教えてください。</p>
    <div class="go"><button class="btn ghost" data-act="back">もどる</button></div>
  </div>`;
}
function olRoomHTML(){
  const R=OL.R,host=R.seat===0;
  return`<div class="deckscr olroom">
    <h2>${host?'相手を待っています':'部屋に入っています'}</h2>
    ${OL.msg?`<p class="olmsg" role="status">${OL.msg}</p>`:''}
    <div class="olcard"><small>部屋番号</small><b class="olcode">${olCodeText(R.code)}</b>
      ${host?`<div class="olshare"><button class="btn" data-act="olcopy">コピー</button>${navigator.share?'<button class="btn" data-act="olshare">送る</button>':''}</div>`:''}</div>
    <p class="sub olhow">${host?'この番号を相手に教えてください。相手が「オンライン対戦」→「部屋に入る」で入力すると、はじまります。':'つながると、自動で対戦がはじまります。'}</p>
    <p class="olstate" id="olstate" role="status">${olRoomState()}</p>
    <p class="sub">${esc(R.name)}　／　${esc(R.deck.name)}</p>
    <div class="go"><button class="btn ghost" data-act="olcancel">部屋を出る</button></div>
  </div>`;
}
function olRoomState(){
  const R=OL.R,L=OL.link;if(!R||!L)return'';
  if(R.bad)return`対戦をはじめられませんでした（${R.bad}）`;
  if(!L.up())return L.age()>15000?'中継につながりません。ほかのWi-Fiやモバイル回線にすると、つながることがあります。':'中継につないでいます…';
  if(R.peer)return L.alive()||L.quiet()<OL_LOST?'相手とつながりました。対戦の準備をしています…':'相手からの返事が止まっています…';
  if(R.seat===0)return'相手が入るのを待っています';
  return L.age()>15000?'部屋が見つかりません。番号が合っているか、相手が待ち合わせの画面を開いているか確かめてください。':'部屋をさがしています…';
}
function olNetState(){
  const R=OL.R,L=OL.link;if(!R||!L)return'';
  if(R.gone)return'退出';
  if(OL.saveNG&&L.alive())return'再開不可';
  if(!L.up())return'通信切れ';
  if(L.alive())return'';
  return L.quiet()<8000?'接続中':'相手が切断';
}
function olResultState(){
  const R=OL.R,L=OL.link;if(!R||!L)return'';
  if(R.gone)return'相手は退出しました';
  if(R.mine)return'相手の返事を待っています…';
  if(R.opp)return'相手は「もう一度」を待っています';
  return L.alive()?'':'相手と通信が切れています';
}
// 描き直さずに、状態の文字だけ入れかえる
function olStatus(){
  if(!OL.R)return;
  const put=(id,s)=>{const e=document.getElementById(id);if(e&&e.textContent!==s)e.textContent=s};
  if(!OL.R.game)put('olstate',olRoomState());
  else{put('olnet',olNetState());put('olres',olResultState())}
}
// まん中の帯に出す、待っている理由
function olHint(){
  const M=OL.M;if(!M||S.winner!=null)return'';
  if(S.phase==='setup')return M.mull[M.seat]?'相手が手札を引き直すか決めています':'';
  if(M.pend&&M.pend.p===M.seat)return'相手がガード・かばうか考えています';
  return'';
}

/* ---- たずねごと：盤面の状態から、いま出すものを決める ---- */
function olCloseModal(){
  OL.ask='';OL.askN++;OL.ending=false;
  const el=$('#modal');if(el){el.className='';el.innerHTML='';el.onclick=null}
}
function olLater(ms){if(!OL.pumpT)OL.pumpT=setTimeout(()=>{OL.pumpT=null;olPump()},ms)}
function olPump(){
  const R=OL.R,M=OL.M;if(!R)return;
  olStatus();
  if(R.bad){olAskBad();return}
  if(!M)return;
  if(S.winner!=null){olAskResult();return}
  if(OL.q.length&&!M.pend&&!OL.qT)OL.qT=setTimeout(olAttackNext,900);
  const key=S.phase==='setup'&&!M.mull[M.seat]?'mull':M.pend&&M.pend.p!==M.seat?'guard':'';
  if(!key||OL.ask===key)return;
  if($('#modal').classList.contains('show')){olLater(400);return}   // メニューなどを閉じるまで待つ
  if(key==='guard'){
    // 続けて届いた手の演出（カットイン・数字）にかくれないよう、終わってから聞く
    if(!OL.guardAt)OL.guardAt=Date.now()+450;
    if(Date.now()<OL.guardAt||document.querySelector('.cutin,.stamp,.rburst')){olLater(300);return}
    OL.guardAt=0;
  }
  if(key==='mull')olAskMulligan();else olAskGuard();
}
async function olAskMulligan(){
  const M=OL.M,n=++OL.askN,me=M.seat;OL.ask='mull';
  await modal(`<div class="coin2"><div class="sub">${S.pl[me].name} 対 ${S.pl[1-me].name}</div><div class="ct">${S.first===me?'あなたが先攻':'あなたが後攻'}</div>
    <p class="sub">先攻は最初のターン、ドローとバトルができません。後攻は最初の手札が1枚多く、ソウルゲージ1からはじめます。</p></div>`,[['OK','ok','pri']]);
  if(n!==OL.askN)return;
  const u=await pickCards('最初の手札',S.pl[me].hand,0,S.pl[me].hand.length,k=>k?`${k}枚を引き直す`:'このままでいい','引き直したいカードをタップ。山札の下に戻して、同じ枚数を引きます（1回だけ）','戻す');
  if(n!==OL.askN)return;
  OL.ask='';olDo({k:'mull',u});
}
async function olAskGuard(){
  const M=OL.M,a=M.pend,n=++OL.askN;OL.ask='guard';
  UI.sheet=null;render();
  const r=await askDefend(a.p,a.i,a.t);
  if(n!==OL.askN)return;
  OL.ask='';olDo({k:'guard',y:r.g,c:r.c});
}
async function olAskBad(){
  if(OL.ask==='bad')return;
  olCloseModal();OL.ask='bad';const n=OL.askN;
  await modal(`<h3>対戦を続けられません</h3><p class="sub">${OL.R.bad}。2人とも同じ新しいファイルで開いて、部屋を作り直してください。</p>`,[['部屋を出る','leave','pri']]);
  if(n===OL.askN)olExit('online');
}
async function olAskResult(){
  const R=OL.R,M=OL.M,key=`res:${S.winner}:${M.quit}:${R.gone}:${!!R.mine}`;
  if(OL.ask===key)return;
  olCloseModal();OL.ask=key;UI.sheet=UI.tgt=null;render();
  const n=OL.askN,win=S.winner===M.seat,even=S.winner===2,snda=`${S.winner}:${M.quit}`;
  if(!OL.sang){
    await sleep(900);   // とどめの演出を見せてから
    if(n!==OL.askN)return;
  }
  if(OL.sang!==snda&&OL.sang!=='done'){OL.sang=snda;snd(win?'win':even?'coin':'lose')}
  const wait=!!R.mine,again=!wait&&!R.gone;
  const btns=again?[['もう一度','again','pri'],['デッキをかえて','deck'],['部屋を出る','leave']]:[['部屋を出る','leave','pri']];
  const v=await modal(`<div class="res ${win?'win':'lose'}"><div class="seal2">${win?'勝利':even?'引分':'敗北'}</div><p>${esc(S.why)}</p>
    <p class="sub">${S.turnNo}ターン　/　ライフ ${S.pl[M.seat].name} ${S.pl[M.seat].life}・${S.pl[1-M.seat].name} ${S.pl[1-M.seat].life}</p>
    <p class="olres" id="olres" role="status">${olResultState()}</p></div>`,btns);
  if(n!==OL.askN)return;
  if(v==='leave'){olExit('title');return}
  if(v==='deck'){
    const pick=await modal('<h3>つぎに使うデッキ</h3>',[...DECKS.map((d,i)=>[esc(d.name),'d'+i]),['やめる','x']]);
    if(n!==OL.askN)return;
    if(pick==='x'){OL.ask='';olPump();return}
    const i=+pick.slice(1),deck=olDeckCards(DECKS[i]);
    if(deck.err){
      await modal(`<h3>このデッキは使えません</h3><p class="sub">${deck.err}</p>`,[['OK','x','pri']]);
      if(n===OL.askN){OL.ask='';olPump()}
      return;
    }
    R.deck=deck;OL.deck=i;
  }
  OL.ask='';olPrepare();olPump();
}
async function olMenu(){
  const M=OL.M,L=OL.link;if(!M||!L)return;
  const lost=!L.alive()&&L.quiet()>30000;
  const btns=[['ルール','rules'],['カード一覧','cards'],[soundOn?'音を消す':'音を出す','snd'],lost?['勝敗なしでぬける','leave','red']:['降参する','quit','red'],['とじる','x','pri']];
  const v=await modal(`<h3>メニュー</h3><p class="sub">部屋 ${olCodeText(OL.R.code)}</p>`,btns);
  if(v==='rules')await showRules();
  else if(v==='cards')await showCardList();
  else if(v==='snd')ACT.sound();
  else if(v==='quit'||v==='leave'){
    const ok=await modal(v==='quit'?'<h3>降参しますか</h3><p class="sub">この対戦はあなたの負けになります。</p>':'<h3>対戦をぬけますか</h3><p class="sub">相手と通信が切れています。ぬけると、この対戦にはもどれません。</p>',[[v==='quit'?'降参する':'ぬける','y','red'],['つづける','n','pri']]);
    if(ok!=='y'||OL.M!==M||S.winner!=null)return;
    if(v==='leave')olExit('title');else olDo({k:'quit'});
  }
}

/* ---- ボタン ---- */
function olStart(seat){
  let code;
  if(seat===0)code=Array.from({length:8},()=>OL_CHARS[olPick(OL_CHARS.length)]).join('');
  else{
    code=olCodeRead(OL.code);
    if(!code){OL.msg='部屋番号の8文字を入力してください（0・O・1・I・L は使われません）。';render();$('.deckscr').scrollTop=0;return}
  }
  const deck=olDeckCards(DECKS[OL.deck]);
  if(deck.err){OL.msg=deck.err;render();$('.deckscr').scrollTop=0;return}
  OL.name=olClean(OL.name,10);
  try{localStorage.setItem('tr_ol_name',OL.name)}catch(e){}
  snd('tap');olEnter(seat,code,OL.name||'プレイヤー',deck);
}
function olInvite(){
  const u=rkGameURL();
  return`お絵かきカードバトルで対戦しよう！\n部屋番号：${olCodeText(OL.R.code)}${u?`\n${u}#room=${OL.R.code}`:''}`;
}
Object.assign(ACT,{
  online(){OL.msg='';UI.screen='online';snd('tap');render()},
  oldeck(t,e){if(e.target.closest('[data-act="viewdeck"]'))return;OL.deck=+t.dataset.i;snd('tap');const s=$('.deckscr'),y=s.scrollTop;render();$('.deckscr').scrollTop=y},
  olcreate(){olStart(0)},
  oljoin(){olStart(1)},
  olcancel(){olExit('online')},
  async olcopy(t){
    try{await navigator.clipboard.writeText(olInvite());t.textContent='コピーしました'}
    catch(e){t.textContent='番号を長押しでコピー'}
  },
  async olshare(){try{await navigator.share({text:olInvite()})}catch(e){}},
  olresume(t){
    const s=olSaves().find(x=>x.id===t.dataset.id);
    if(s)olResume(s.id,s.R);else render();
  },
  async oldrop(t){
    const id=t.dataset.id,ok=await modal('<h3>この対戦を消しますか</h3><p class="sub">もどれなくなります。</p>',[['消す','y','red'],['やめる','n','pri']]);
    if(ok!=='y')return;
    try{localStorage.removeItem(OL_SAVE+id);localStorage.removeItem(OL_BEATKEY+id)}catch(e){}
    render();
  }
});
document.addEventListener('input',e=>{
  if(e.target.id==='olname')OL.name=e.target.value.replace(/[<>&"'`]/g,'');
  else if(e.target.id==='olcode')OL.code=e.target.value.replace(/[<>&"'`]/g,'');
});
document.addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.isComposing&&e.target.id==='olcode')olStart(1)});

// 起動時：このタブの対戦が残っていればそのままもどる。招待のURLなら入口を開く
function olBoot(){
  if(!olCanUse())return false;
  let id='';try{id=sessionStorage.getItem(OL_TAB)||''}catch(e){}
  if(/^[0-9a-f]{12}$/.test(id)){
    let R=null;try{R=olUnzip(localStorage.getItem(OL_SAVE+id)||'')}catch(e){}
    if(R){olResume(id,R);return true}
  }
  const m=/^#room=([A-Za-z0-9]{8})$/.exec(location.hash);
  if(m&&olCodeRead(m[1])){
    OL.code=olCodeText(olCodeRead(m[1]));
    try{history.replaceState(null,'',location.pathname+location.search)}catch(e){}
    UI.screen='online';render();return true;
  }
  return false;
}
