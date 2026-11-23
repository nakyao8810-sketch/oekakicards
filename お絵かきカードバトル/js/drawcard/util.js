'use strict';
/* =========================================================
   お絵かきカード
   絵をかく → このページの中の DoodleNet（Quick, Draw! ＋ TU Berlin のスケッチ＋HASYv2 のしるしで学習した380種類の見分け）で何の絵かを当てる
   → 線の形と色を測って、属性・コスト・ATK/HP・印・共鳴効果・必殺技を決める
   ========================================================= */
const rkClamp=(v,a=0,b=1)=>Math.max(a,Math.min(b,v));
function rkRng(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
function rkHash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619)}return h>>>0}
const rkPick=(r,a)=>a[Math.floor(r()*a.length)%a.length];
const RK_PENS=[{k:'黒',c:'#2b2b2b'},{k:'赤',c:'#d8412f'},{k:'橙',c:'#ee8a2a'},{k:'黄',c:'#f2c81e'},{k:'黄緑',c:'#94c83a'},{k:'緑',c:'#3c9a4a'},{k:'水色',c:'#5bbde6'},{k:'青',c:'#2f6fc4'},
  {k:'紫',c:'#7a4bb0'},{k:'桃',c:'#f08cb4'},{k:'肌',c:'#f2c69c'},{k:'茶',c:'#8b5a2b'},{k:'灰',c:'#8d939a'}];
const RK_RGB=RK_PENS.map(p=>[1,3,5].map(i=>parseInt(p.c.slice(i,i+2),16)));
const RK_SIZES=[3,6,10,18,30];   // 太さ5段（ごく細い〜とても太い）
const RK_INK={'赤':'fire','橙':'fire','黄':'thunder','黄緑':'forest','緑':'forest','茶':'forest','水色':'water','青':'water','紫':'dark','桃':'light','肌':'light','灰':'thunder'};
const RK_KEL={'炎':'fire','水':'water','雷':'thunder','森':'forest','夢':'light','影':'dark','土':'forest','鋼':'thunder','無':null};
