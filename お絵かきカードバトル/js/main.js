'use strict';
/* ---------- 起動 ---------- */
(function boot(){
  rkBasicArt();   // はじめからあるカードの絵（basicart.js）
  rkLoad();
  const sum=DECKS.map(d=>Object.values(d.list).reduce((a,b)=>a+b,0));
  if(sum.some(x=>x!==30))console.warn('デッキ枚数が30ではない',sum);
  const q=new URLSearchParams(location.search);
  if(q.get('fast'))SPEED=+q.get('fast')||0.05;
  if(q.get('sim')){$('#app').innerHTML=`<pre id="simout">計算中…</pre>`;setTimeout(()=>{const t0=performance.now();const out=runSim(+q.get('sim'));$('#simout').textContent=out+`\n(${((performance.now()-t0)/1000).toFixed(1)}秒)`;document.title='SIMDONE'},50);return}
  if(q.get('demo')){
    UI.mode='cpu';S=makeState([+(q.get('d1')||0),+(q.get('d2')||1)],['あなた','CPU'],[true,true]);aiMulligan(S,0);aiMulligan(S,1);startTurn(S);
    const n=+q.get('demo');while(S.winner==null&&(S.turnNo<n||S.cur!==0))aiFullTurn(S);
    S.pl[0].cpu=false;S.ev=[];UI.screen='game';UI.resultShown=true;
    if(q.get('battle')&&canBattle(S)){S.phase='battle'}
    render();
    if(q.get('sheet')){const c=S.pl[0].hand[0];if(c){UI.sheet={kind:'hand',p:0,uid:c.uid};render()}}
    if(q.get('cut')){const m=S.pl[0].lane.find(x=>x&&D(x).sp)||S.pl[0].lane.find(x=>x);if(m)fx1({t:'banner',p:0,id:m.id,txt:D(m).sp?spName(D(m)):'ファイアボール',sub:'テスト'});const k=occ(S.pl[1])[0];if(k!=null)fx1({t:'dmg',p:1,s:k,n:3});fx1({t:'life',p:1,n:4})}
    if(q.get('modal')==='guard'){const i=occ(S.pl[1])[0];if(i!=null){S.cur=1;S.pl[0].gauge=5;askGuard(1,i)}}
    if(q.get('modal')==='res'){S.winner=0;S.why='CPUのライフが0になった';UI.resultShown=false;showResult()}
    return;
  }
  if(olBoot())return;
  render();
})();
