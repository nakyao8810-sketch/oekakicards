'use strict';
/* ---- 新しい共鳴効果（19）と必殺技（17）を、絵に合わせて選ぶ（2026-11-23） ----
   共鳴効果：カードの印（牙・盾・星・心。虹ならどれでも）に合う系統から。絵のタイプ（moves.js の rkArch）に合うものと、
             物の知識表（know_*.js）にある前の効果と意味の近いものが出やすい。特別（入れ替え・効果けし）はまれ。
   必殺技：知識表の前の技と意味の近いもの（技名もそのまま）か、タイプに合う新しい技。ゲージは X から SPX で決まり、
           （コスト-3）〜コスト（6まで）に入るものだけ。
   強さの点（RK_PT2）は makecard.js でATK+HPから引く */
const RK_NEW_RES={atk1:'atkX',pierce:'pierce',haste:'rush',drSelf:'drX',drAdj:'drAdjX',lifeStart:'lifeX',drawOnDeath:'drawDeathX',healEnd:'healAdj',regen:'healAdj',gaugeStart:'resG'};
const RK_NEW_SP={flare:'hit',starfall:'hit',gale:'hit',raikou:'shot',tsunami:'blast',gigabolt:'blast',reap:'cull',drop:'mend',sanctuary:'mendAll',aurora:'mendAll',bloom:'mendAll'};
const RK_ARCH_RES2={fang:['atkX','pierce','reach','killG'],shell:['drX','drAdjX','hpX','cover','barrier'],heal:['healAdj','lifeX','drawDeathX','spHeal','resDraw'],
  storm:['atkX','reach','resG','pierce'],swift:['rush','reach','resDraw','atkX'],machine:['resG','spTax','barrier','drX'],trick:['hush','flip','spTax','resDraw','killG']};
const RK_ARCH_SP2={fang:['power','rallyA','weak','stun','hit'],shell:['stun','weak','rallyB','mend'],heal:['mend','mendAll','revive','study','rallyB'],storm:['blast','swap','seal','hit'],
  swift:['power','swap','stun','bounce','shot'],machine:['study','mute','seal','weakP','shot'],trick:['bounce','seal','mute','prism','swap','revive','weakP']};
// 名前のことば（知識表に名前がないとき）。「〇〇の＋ことば」で読めるよう、名詞にそろえる（2026-11-23 見直し）
const RK_RESW2={atkX:['ほんき','いかり','ちからこぶ','やるき'],pierce:['つらぬき','いっきうち'],reach:['まわりこみ','ひろいしや','とおめがね'],rush:['とびだし','はやがけ','いちばんのり'],
  drX:['かたいからだ','てっぺき','まもりのかまえ'],drAdjX:['まもりのわ','なかまのたて'],hpX:['ねばりづよさ','スタミナ','がんじょうなからだ'],cover:['みがわり','かばいだて'],barrier:['バリア','まもりのまく'],
  killG:['かちどき','せんりひん'],spTax:['にらみ','じゃまだて'],spHeal:['ひといき','たてなおし'],resG:['しゅうちゅう','ためこみ'],healAdj:['なかまおもい','いたわり'],
  lifeX:['ぽかぽか','げんきのもと'],drawDeathX:['おみやげ','バトンタッチ'],resDraw:['ひらめき','めききのめ'],flip:['あまのじゃく','うらおもて'],hush:['しずけさ','ちんもくのにらみ']};
// 必殺技のことば。前からある技と同じ意味のものは moves.js の RK_SPW（絵のタイプごとのことば：キバ→クロー、あらし→ブレス、きかい→ビーム…）を使う
const RK_SPOLD={hit:x=>x>=3?'starfall':'flare',blast:x=>x>=3?'gigabolt':'tsunami',shot:()=>'raikou',cull:()=>'reap',mend:()=>'drop',mendAll:()=>'sanctuary'};
const RK_SPW2={power:['ためこうげき','フルパワー','ちからため'],rallyA:['ときのこえ','おうえんだん'],rallyB:['だいおうえん','みんなのちから'],seal:['ふういん','しるしけし'],mute:['ちんもくのじゅもん','おしずかに'],
  stun:['いかく','にらみつけ'],bounce:['ふきとばし','おかえりなさい'],swap:['まぜこぜ','いれかえのじゅつ'],weak:['しびれ','よわらせ'],weakP:['のろい','ちからぬき'],prism:['にじのかけはし','レインボー'],
  revive:['よみがえり','ふっかつのいのり'],study:['さがしもの','ひらめき']};
// 知識表の名前のうち、新しい効果と意味がずれるもの（2回攻撃・ライフ回復・自分だけ回復）は使わない
const RK_NONAME=new Set(['gale','bloom','aurora','regen']);
// 絵の名前をつけるのは半分ちょっと。つけるときは「〇〇の」（10字まで）
const rkJoin2=(r,obj,w)=>obj&&r()<.6&&(obj+'の'+w).length<=10?obj+'の'+w:w;// 共鳴効果の X（コストが高いほど大きい。「どの列にも」の X はダメージが減る数なので、高いほど小さい）
function rkResX(id,cost){
  if(RES_NOX.has(id))return undefined;
  switch(id){
    case'atkX':case'spHeal':return cost<=3?1:cost<=6?2:3;
    case'hpX':return Math.min(3,1+Math.floor(cost/3));
    case'reach':return cost<=3?2:1;
    case'healAdj':return cost>=5?2:1;
    case'resDraw':return cost>=7?2:1;
    default:return cost>=6?2:1;   // drX drAdjX killG spTax resG lifeX drawDeathX
  }
}
function rkWPick(r,L){let t=r()*L.reduce((a,x)=>a+x.v,0);for(const x of L){t-=x.v;if(t<=0)return x}return L[L.length-1]}
// 返り値 {res,rx,resn,sp,spx,spg,spn}
function rkMoves5(w,cost,r,sc,L,R){
  const arch=rkArch(w.lb,sc),obj=rkMoveObj(w.lb,sc),ic=new Set([L,R]),rb=ic.has('rainbow');
  // 知識表から：前の効果 → 新しい効果（名前つき）
  const kres={},ksp={};
  for(const{k,w:wt}of w.K){
    for(const e of k.res){const n=RK_NEW_RES[e.id];if(n&&!kres[n])kres[n]={v:wt,n:RK_NONAME.has(e.id)?null:e.n}}
    for(const e of k.sp){const n=RK_NEW_SP[e.id];if(n&&!(ksp[n]&&ksp[n].n))ksp[n]={v:wt,n:RK_NONAME.has(e.id)?null:e.n}}
  }
  // 共鳴効果：まず系統（牙・盾・星・心）を同じくらいの割合でえらぶ。印に合う系統は3倍、特別はまれ。系統の中は絵のタイプと知識表に合うものが出やすい
  const GW={fang:1,shield:1,star:1,heart:1,sp:.3};for(const g of['fang','shield','star','heart'])if(rb||ic.has(g))GW[g]=3;
  const grp=rkWPick(r,Object.entries(GW).map(([id,v])=>({id,v}))).id,RL=[];
  for(const id in RES_IC){
    if(RES_IC[id]!==grp||(id==='pierce'&&cost<3))continue;
    let v=1;if(RK_ARCH_RES2[arch].includes(id))v+=1.5;if(kres[id])v+=3*kres[id].v;
    RL.push({id,v});
  }
  const res=rkWPick(r,RL).id,rx=rkResX(res,cost);
  const resn=kres[res]&&kres[res].n&&r()<.8?kres[res].n:rkJoin2(r,obj,rkPick(r,RK_RESW2[res]));  // 必殺技
  let sp,spx,spg,spn;
  if(cost>=2&&r()<.25+.08*cost){
    const cg=Math.min(cost,6),fits=id=>SPX[id].xs.filter(x=>{const g=SPX[id].g(x);return g<=cg&&g>=Math.max(1,cg-3)});
    const SL=[];
    for(const id in SPX){
      if(!fits(id).length)continue;
      let v=0;
      if(ksp[id])v+=2*ksp[id].v+.6;
      if(RK_ARCH_SP2[arch].includes(id))v+=.8;
      if(v>0)SL.push({id,v});
    }
    if(SL.length){
      sp=rkWPick(r,SL).id;const xs=fits(sp);spx=xs[Math.floor(r()*xs.length)];spg=SPX[sp].g(spx);
      if(ksp[sp]&&ksp[sp].n&&r()<.85)spn=ksp[sp].n;
      else if(RK_SPOLD[sp]){const W=RK_SPW[RK_SPOLD[sp](spx)]||{};spn=rkJoin2(r,obj,rkPick(r,W[arch]||W.def||['ひっさつ']))}
      else spn=rkJoin2(r,obj,rkPick(r,RK_SPW2[sp]));
    }
  }
  return{res,rx,resn,sp,spx,spg,spn};
}
