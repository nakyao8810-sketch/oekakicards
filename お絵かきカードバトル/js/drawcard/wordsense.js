'use strict';
/* ---- ことばの感覚（wordsense_data.js の学習結果を使う）----
   rkNatural：日本語の読み約58万語から学習した「かなの並びらしさ」（学習に使っていない約6.4万語で、本物と並べかえた偽物を90.5%見分ける）
   rkTaken  ：すでにあるキャラクター・ゲームの名前（Wikidata、約1.5万）と丸かぶりか。名前そのものは持たず、ハッシュだけ
   rkBadName：子どもに見せられない言葉・差別的な言葉がたまたま入っていないか */
const RK_BI=Uint8Array.from(atob(RK_BI_B64),c=>c.charCodeAt(0));
const RK_TAKEN=(()=>{const b=atob(RK_TAKEN_B64),s=new Set();for(let i=0;i<b.length;i+=3)s.add((b.charCodeAt(i)<<16)|(b.charCodeAt(i+1)<<8)|b.charCodeAt(i+2));return s})();
function rkKanaIdx(c){const k=c.charCodeAt(0);return k>=0x3041&&k<=0x3096?k-0x3041+1:k>=0x30a1&&k<=0x30f6?k-0x30a1+1:k===0x30fc?87:-1}
// -2（とても不自然）〜 .5（日本語によくある並び）
function rkNatural(s){
  let sum=0,prev=0;
  for(const c of s){const i=rkKanaIdx(c);if(i<0)return 0;sum-=RK_BI[prev*88+i]/16;prev=i}
  sum-=RK_BI[prev*88]/16;
  return rkClamp((sum/([...s].length+1)-RK_BI_MID)/(RK_BI_MID-RK_BI_P05),-2,.5);
}
function rkTaken(s){return RK_TAKEN.has(rkHash(s)>>>8)}
const RK_BAD=/ヒサン|シタイ|シネ|ブス|デブ|ハゲ|バカ|クソ|ウンコ|ウンチ|ウンピ|チンコ|チンポ|チンチ|チンカス|チンピ|マンコ|マンチョ|アホ|キモ|コロス|ボケ|ゴミ|ザコ|ビンボ|ドロボ|ヒニン|^エタ|ニンシン|セックス|エロ|アナル|レイプ|オナニ|オッパイ|パイパン|パイオツ|フェラ|ボッキ|ザーメ|ペニス|ボボ|ヤリマン|クリト|ニガー|ニグ|^チョン|ガイジ|キチガ|カタワ|ツンボ|メクラ|ジサツ|ナチス|^テロ|ゲイシャ|ドカタ|ポルノ|スカトロ|シッコ/;
function rkBadName(s){return RK_BAD.test(rkKana(s))}
// 長い名前の折り返す場所：いちばんつながりの弱い所
function rkSplit(s){
  const a=[...s];if(a.length<6)return[s,''];
  let at=0,best=-1;
  for(let i=2;i<=a.length-2;i++){
    if('ャュョァィゥェォッンー'.includes(a[i])||a[i-1]==='ッ')continue;
    const p=rkKanaIdx(a[i-1]),q=rkKanaIdx(a[i]);if(p<0||q<0)continue;
    const v=RK_BI[p*88+q]-Math.abs(i-a.length/2)*6;
    if(!at||v>best){best=v;at=i}
  }
  return at?[a.slice(0,at).join(''),a.slice(at).join('')]:[s,''];
}
