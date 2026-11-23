'use strict';
/* ---------- テスト用（?sim=回数 でCPUどうしを高速対戦して数字を出す）---------- */
function runSim(n){
  const r={g:0,firstWin:0,turns:0,deckout:0,rev:0,revGames:0,dk:DECKS.map(()=>[0,0]),minT:999,maxT:0};
  for(let g=0;g<n;g++){
    const a=g%3,b=Math.floor(g/3)%3;
    const T=makeState([a,b],['A','B'],[true,true]);aiMulligan(T,0);aiMulligan(T,1);startTurn(T);
    while(T.winner==null&&T.turnNo<120)aiFullTurn(T);
    if(T.winner==null)continue;
    r.g++;if(T.winner===T.first)r.firstWin++;r.turns+=T.turnNo;r.minT=Math.min(r.minT,T.turnNo);r.maxT=Math.max(r.maxT,T.turnNo);
    if(T.why.includes('山札'))r.deckout++;r.rev+=T.st.rev;if(T.st.rev)r.revGames++;
    r.dk[a][1]++;r.dk[b][1]++;r.dk[T.pl[T.winner].deckNo][0]++;
  }
  return`CPUどうし ${r.g}戦
先攻の勝率: ${(r.firstWin/r.g*100).toFixed(1)}%
平均ターン数(両者合計): ${(r.turns/r.g).toFixed(1)}  (最短${r.minT} 最長${r.maxT})
山札切れで決着: ${r.deckout}戦
逆転ボーナス: 1試合平均${(r.rev/r.g).toFixed(2)}回 / 発動した試合 ${(r.revGames/r.g*100).toFixed(0)}%
デッキ別勝率(ミラー含む): ${DECKS.map((d,i)=>`${d.name} ${(r.dk[i][0]/r.dk[i][1]*100).toFixed(0)}%`).join(' / ')}`;
}

