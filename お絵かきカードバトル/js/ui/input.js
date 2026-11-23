'use strict';
/* ---------- タップ ---------- */
const ACT={
  mode(t){UI.mode=t.dataset.m;UI.screen='deck';snd('tap');render()},
  rules(){showRules()},
  cards(){showCardList()},
  back(){UI.screen='title';render()},
  pickdeck(t,e){if(e.target.closest('[data-act="viewdeck"]'))return;const w=+t.dataset.w,i=+t.dataset.i;if(w===1&&UI.mode==='cpu')UI.cpuDeck=i;else UI.deck[w]=i;snd('tap');render()},
  viewdeck(t){showCardList(+t.dataset.i)},
  cpulv(t){UI.cpuLv=t.dataset.lv==='strong'?'strong':'normal';try{localStorage.setItem('tr_cpulv',UI.cpuLv)}catch(e){}snd('tap');const s=$('.deckscr'),y=s?s.scrollTop:0;render();const s2=$('.deckscr');if(s2)s2.scrollTop=y},
  start(){startNew()},
  slot(t){if(S)onSlot(+t.dataset.p,+t.dataset.s)},
  hand(t){if(UI.tgt)return;UI.sheet={kind:'hand',p:viewer(),uid:+t.dataset.uid};snd('tap');render()},
  closesheet(){UI.sheet=null;render()},
  cancel(){const c=UI.tgt&&UI.tgt.onCancel;UI.tgt=null;render();if(c)c()},
  menu(){showMenu()},
  log(){if(S)showLog()},
  summon(t){
    if(!myTurn())return;const uid=+t.dataset.uid,p=S.cur;const c=S.pl[p].hand.find(x=>x.uid===uid);if(!c||cardCheck(S,p,c))return;
    const ss=sumSlots(S,p),prev={};
    for(const s of ss.slots){const n=previewLinks(p,c.id,s);if(n)prev[p+'-'+s]=`共鳴 ${n}`}
    startTarget(ss.rep?`入れ替え召喚：どこに出す？（そこのモンスターは捨て札へ。ゲージはたまらない）`:`${D(c).sn}をどこに出す？`,ss.slots.map(s=>[p,s]),(pp,s)=>humanDo({k:'summon',uid,s}),prev);
  },
  tactic(t){
    if(!myTurn())return;const uid=+t.dataset.uid,p=S.cur;const c=S.pl[p].hand.find(x=>x.uid===uid);if(!c||cardCheck(S,p,c))return;
    const d=D(c);
    const nm=esc(d.name);
    if(d.t==='own')startTarget(`${nm}：自分のモンスターをえらんでください`,occ(S.pl[p]).map(s=>[p,s]),(pp,s)=>humanDo({k:'tactic',uid,tg:s}));
    else if(d.t==='enemy'||d.t==='enemyLow'||d.t==='enemyCost')startTarget(`${nm}：相手のモンスターをえらんでください`,tacTargets(S,p,d.t,d).map(([s])=>[1-p,s]),(pp,s)=>humanDo({k:'tactic',uid,tg:s}));
    else if(d.t==='move')humanMove(`${d.name}：`,(a,b)=>humanDo({k:'tactic',uid,tg:a,tg2:b}));
    else humanDo({k:'tactic',uid,tg:null});
  },
  async sp(t){
    if(!myTurn())return;const i=+t.dataset.s,p=S.cur;if(spCheck(S,p,i))return;
    const d=D(S.pl[p].lane[i]),sp=SP[d.sp],tg=spTg(S,p,i),nm=esc(spName(d));
    if(sp.t==='enemy'||sp.t==='enemyLow')startTarget(`${nm}：相手のモンスターをえらんでください`,tg.map(s=>[1-p,s]),(pp,s)=>humanDo({k:'sp',i,tg:s}));
    else if(sp.t==='own')startTarget(`${nm}：自分のモンスターをえらんでください`,tg.map(s=>[p,s]),(pp,s)=>humanDo({k:'sp',i,tg:s}));
    else if(sp.t==='enemy2'){
      // 相手の2体：1体目→2体目
      startTarget(`${nm}：入れ替える相手のモンスター（1体目）`,occ(S.pl[1-p]).map(s=>[1-p,s]),(pp,a)=>{
        startTarget(`${nm}：${esc(D(S.pl[1-p].lane[a]).sn)}と入れ替えるモンスター（2体目）`,occ(S.pl[1-p]).filter(s=>s!==a).map(s=>[1-p,s]),(pp2,b)=>humanDo({k:'sp',i,tg:a<b?[a,b]:[b,a]}));
      });
    }else if(sp.t==='trash'){
      // トラッシュのモンスター→出すスロット
      const pl=S.pl[p],ok=new Set(tg.map(x=>x[0])),cs=pl.trash.filter(c=>ok.has(c.uid));
      UI.sheet=null;render();
      const sel=await pickCards(`${nm}：よみがえらせるモンスター`,cs,0,1,n=>n?'これを出す':'やめる',`トラッシュのコスト${d.spx}以下のモンスター`,'出す');
      if(!sel.length||!myTurn())return;
      const uid=sel[0];startTarget(`${nm}：どこに出す？`,tg.filter(x=>x[0]===uid).map(x=>[p,x[1]]),(pp,s)=>humanDo({k:'sp',i,tg:[uid,s]}));
    }
    else humanDo({k:'sp',i,tg:null});
  },
  // シートの「相手をえらんでアタック」：相手えらびへ
  attack(t){if(!myTurn())return;const i=+t.dataset.s;if(!canAttack(S,S.cur,i))return;UI.sheet=null;humanAtkPick(i)},
  // 相手をえらんでいる間に、アタックするモンスターのくわしい画面を見る
  atkinfo(){if(!UI.tgt||UI.tgt.atk==null)return;const s=UI.tgt.atk;UI.tgt=null;UI.sheet={kind:'field',p:S.cur,s};snd('tap');render()},
  // メインフェイズから：バトルへ進んで、そのモンスターの相手えらびへ
  gobattle(t){
    if(!myTurn()||S.phase!=='main'||!canBattle(S))return;const i=+t.dataset.s;UI.sheet=null;UI.tgt=null;
    if(UI.mode==='net'){if(!olDo({k:'battle'}))return}else{S.phase='battle';lg(S,'バトルフェイズ',S.cur);snd('battle')}
    if(canAttack(S,S.cur,i))humanAtkPick(i);else render();
  },
  // まとめてアタック：えらんだ順に1体ずつ向かいへ（ガードの確認もそのつど）
  async atkgo(){
    if(!myTurn())return;const p=S.cur,list=atkSel().slice(),mySt=S;if(!list.length)return;
    if(UI.mode==='net'){olAttack(list);return}
    UI.atk=[];UI.sheet=null;UI.tgt=null;UI.busy=true;render();
    for(let k=0;k<list.length;k++){
      if(S!==mySt||S.winner!=null)return;
      if(!S.pl[p].lane[list[k]]||!canAttack(S,p,list[k]))continue;
      await performAttack(p,list[k]);if(k<list.length-1)await sleep(900);
    }
    if(S===mySt&&S.winner==null){UI.busy=false;render()}
  },
  atkclear(){UI.atk=[];snd('tap');render()},
  // ぜんぶ：アタックできるモンスター全員が、すぐ向かいへアタック
  atkall(){if(!myTurn())return;UI.tgt=null;UI.atk=[0,1,2].filter(i=>canAttack(S,S.cur,i));snd('tap');ACT.atkgo()},  shift(){if(!myTurn())return;const pl=S.pl[S.cur];if(pl.shiftUsed||pl.gauge<SHIFT_G)return;humanMove('シフト（1G）：',(a,b)=>humanDo({k:'shift',a,b}))},
  recharge(){if(!myTurn())return;humanDo({k:'recharge'})},
  atelier(){if(rk.busy)return;UI.screen='atelier';snd('tap');render()},
  newdraw(){UI.screen='draw';snd('tap');render()},
  mycard(t){rkCardMenu(t.dataset.id)},
  // 色をえらぶ。せまい画面ではえらんだらパレットを閉じて紙を見やすく（広い画面ではいつも開いている）
  dcolor(t){rkSetColor(t.dataset.c);if(!matchMedia(RK_WIDE).matches){rk.palOpen=false;const p=$('#pal');if(p)p.classList.remove('open')}},
  dpal(){rk.palOpen=!rk.palOpen;const p=$('#pal');if(p)p.classList.toggle('open',rk.palOpen);snd('tap')},
  dtool(t){rk.tool=t.dataset.t;rkToolsUI()},
  dkind(t){if(rk.busy)return;rk.kind=t.dataset.k;snd('tap');rkToolsUI()},
  dsize(t){rk.size=+t.dataset.i;rkToolsUI()},
  dundo(){rkUndo()},
  dredo(){rkRedo()},
  dsmooth(){rk.sm=(rk.sm+1)%3;rkToolsUI()},
  dzin(){rkZoomBtn(1.5)},dzout(){rkZoomBtn(1/1.5)},dzreset(){rkZoomBtn(0)},
  drandom(){rkRandomDraw()},
  sound(){soundOn=!soundOn;try{localStorage.setItem('tr_sound',soundOn?'1':'0')}catch(e){}if(!soundOn)sndPen(false);snd('tap');render()},
  dsnap(){rk.snap=!rk.snap;snd('tap');rkToolsUI()},
  dmirror(){rk.mirror=!rk.mirror;snd(rk.mirror?'magic':'tap');rkPaint();rkToolsUI()},
  dtpl(){rkTplPick()},
  dtploff(){rk.tpl=-1;rkPaint();rkToolsUI()},
  dclear(){if(!rk.busy){if(rkLive().length)snd('crumple');rkClear()}},
  judge(){rkJudge()},
  phase(){
    if(!myTurn())return;
    if(S.phase==='main'&&canBattle(S)&&anyReady(S,S.cur)){
      if(UI.mode==='net'){UI.tgt=null;UI.sheet=null;olDo({k:'battle'});return}
      S.phase='battle';UI.tgt=null;UI.sheet=null;lg(S,'バトルフェイズ',S.cur);snd('battle');render()}
    else humanEndTurn();
  }
};
// 絵をかく画面のショートカット（PC）：Ctrl+Z もどす／Ctrl+Y・Ctrl+Shift+Z やりなおす
document.addEventListener('keydown',e=>{
  if(UI.screen!=='draw'||!(e.ctrlKey||e.metaKey)||document.querySelector('#modal .rkin'))return;
  const k=e.key.toLowerCase();
  if(k==='z'&&!e.shiftKey){e.preventDefault();rkUndo()}else if(k==='y'||(k==='z'&&e.shiftKey)){e.preventDefault();rkRedo()}
});
document.addEventListener('click',e=>{
  if(e.target.closest('#modal'))return;
  const t=e.target.closest('[data-act]');if(!t||t.disabled)return;
  const f=ACT[t.dataset.act];if(f)f(t,e);
});

