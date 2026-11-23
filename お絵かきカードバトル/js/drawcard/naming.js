'use strict';
/* ---- キャラに合った名前・分類・能力 ----
   1) 絵から「何者か」を決め、その知識（know_*.js）を集める：rkWho
        はっきり分かる物        → その物の知識だけ（色は名前と属性に）
        何かに似たオリジナル    → 体つき＋似ている物＋色
        形から作るオリジナル    → 体つき＋色
        おまかせでかいた絵      → かいた体＋テーマ
   2) 名前：強さに合う名前（小→中→大で長く・にごる：音象徴の研究）。もう持っている名前はさけて、色・大きさの変化形にする。
      作った名前は、学習した「日本語らしい音の並び」で選び、有名な名前との丸かぶり・悪い言葉をはじく（wordsense.js）
   3) 能力・必殺技：知識にある「意味の合う効果と名前の組」からだけ選ぶ。物の名前に技の言葉をつなげて作らない */
const RK_VOICED='ガギグゲゴザジズゼゾダヂヅデドバビブベボヴ',RK_ROUND='ボブモムポプフウオルロンヌノマ',RK_SHARP='キクケカコチツテタトギジザズシ',RK_SIB='サシスセソザジズゼゾ',RK_PP='パピプペポ';
const rkMora=s=>[...s].filter(c=>!'ャュョァィゥェォ'.includes(c)).length;
const rkCnt=(s,set)=>[...s].filter(c=>set.includes(c)).length;
// 作る名前のうしろの音：やわらかい／ふつう／つよい（にごる）／するどい／とぶ（サ行）
const RK_SUF={soft:['ポン','ピィ','リン','ル','ッチ','ポ','ミ','プー','ロン','モ'],mid:['ロン','ラ','リオ','マル','ーナ','スケ','ール'],
  strong:['ゴン','ドン','ザウルス','ボルグ','ガルド','ドーン','ドラ'],sharp:['ガ','キ','ザン','ギス','キッド'],fly:['ス','ウィン','ソル','スー']};
// 色ちがい・大きさちがいの名前の頭
const RK_ELPRE={fire:['ベニ','ホノ'],water:['アオ','ミナ'],thunder:['ライ','イナ'],forest:['ミド','ワカ'],light:['ルミ','シロ'],dark:['クロ','ヨミ']};
const RK_BIGHEAD=['ギガ','グラン'],RK_SMALLHEAD=['プチ','チビ'];

// 何者か。rec＝鑑定の結果、sc＝形のようす、f＝絵を測った結果（色・丸の数・縦横）
// 返り値の K＝使う知識 [{k:知識, w:重み}]（先頭が主役）
function rkWho(rec,sc,r,f){
  f=f||{};
  // おまかせでかいた絵：何をかいたか分かっているので、鑑定の答えよりそちらを使う（剣士→けんし・剣の性質、ドラゴン→ツメ・空）
  const M=typeof rk!=='undefined'&&rk.meta&&rk.meta.plan?rk.meta:null,ck=f.inkKey||null,ink=ck?RK_KNOW['@t_'+RK_INKTHEME[ck]]:null;
  if(M){
    const key=M.role&&RK_META[M.role]?M.role:RK_META[M.plan]?M.plan:'chibi',D=RK_META[key],tt=RK_THEMETAG[M.tk];
    const tags=[];for(const x of[...D.tags,tt])if(x&&!tags.includes(x))tags.push(x);if(!tags.length)tags.push('cute');
    const orig=RK_META_ORIG[M.plan]||null,body=RK_KNOW['@'+key],th=RK_KNOW['@t_'+M.tk];
    // とくに特徴のない体（ちび・頭でっかち）はテーマが主役
    const K=!th?[{k:body,w:1}]:D.role?[{k:body,w:.75},{k:th,w:.25}]:[{k:th,w:.6},{k:body,w:.4}];
    return{type:'meta',lb:null,hl:null,g:D.g,orig,K,seal:D.seal||(orig&&RK_ORIG[orig].seal)||'',mim:D.m.slice().sort(()=>r()-.5),gm:RK_GMORPH[D.g],
      tags:tags.slice(0,3),kind:D.role||RK_THEMEROLE[M.tk]||'いきもの'};
  }
  const lb=rec&&rec.known?RK_LABELS[rec.top[0].i]:null;
  if(lb){
    const k=RK_KNOW[lb.en],K=[{k,w:1}];   // 色の能力は混ぜない（いちごに「もふもふ」がつく）。色は名前と属性に出る
    const tags=(RK_OBJTAG[lb.en]||RK_GTAG[lb.g]||['magic']).slice(0,3);
    return{type:'known',lb,g:lb.g,K,tags,kind:k.kind};
  }
  // オリジナル：形のようすから体つきを決める
  // ふつうの絵（Quick, Draw! 約1500枚の真ん中あたり）からどれだけはずれているかでくらべる。いちばん目立つ特徴の体つきになる
  const os={blob:(sc.round-.48)/.32+(.22-sc.spiky)/.5,spiky:(sc.spiky-.22)/.21,golem:(sc.solid-.05)/.15+(sc.big-.8),wisp:(sc.fast-.24)/.12,gear:(sc.detail-.33)/.15,
    prism:sc.colorful/.22,mask:(sc.sym-.1)/.3,doodle:.35};
  if((f.loops||0)>=6&&(f.nFill||0)<3)os.mask+=.6;   // 丸がたくさん（目がいっぱい）→ふしぎ（色をぬった部品の多い絵はのぞく）
  for(const k in os)os[k]+=r()*.7;
  const ok=Object.keys(os).sort((a,b)=>os[b]-os[a])[0],O=RK_ORIG[ok];
  const m=[...O.m,...(O.m2||[])].sort(()=>r()-.5).slice(0,4);
  // はっきりしない答えも使う：上位5つの答えの性質となかまを、確からしさの重みで足す（けものっぽい絵→爪の向き）
  const tw={},gw={};
  for(const x of(rec?rec.top:[])){const L=RK_LABELS[x.i];(RK_OBJTAG[L.en]||RK_GTAG[L.g]||[]).forEach((t,j)=>tw[t]=(tw[t]||0)+x.p*(1-j*.25));gw[L.g]=(gw[L.g]||0)+x.p}
  const tt=Object.keys(tw).sort((a,b)=>tw[b]-tw[a])[0],gg=Object.keys(gw).sort((a,b)=>gw[b]-gw[a])[0];
  const t=rec&&rec.top[0],hl=t&&t.p>=RK_HINT?RK_LABELS[t.i]:null;
  const g=hl?hl.g:(gg&&gw[gg]>=.2?gg:null);
  // 色の性質（赤→ほのお、桃→かわいい・いやし…）
  const ct=ck?RK_COLTAG[ck]||[]:[];
  const tags=[];for(const x of[O.tags[0],tt&&tw[tt]>=.08?tt:null,...ct,O.tags[1]])if(x&&!tags.includes(x))tags.push(x);
  const K=[{k:RK_KNOW['@o_'+ok],w:.5}];
  if(hl)K.push({k:RK_KNOW[hl.en],w:.2+Math.min(.3,t.p)});   // 似ているほど、その物らしい能力になりやすい
  if(ink)K.push({k:ink,w:.3});
  // 分類：体の特徴（のっぽ・ながーい・もじゃもじゃ・めだま）か手ざわり ＋ なかま
  const asp=f.aspect||1,form=asp<.45?'のっぽの':asp>2.4?'ながーい':(f.loops||0)>=7&&(f.nFill||0)<3?'めだまの':(f.nS||0)>=28?'もじゃもじゃの':'';
  const gk=g&&RK_GKIND[g]&&RK_GKIND[g]+'の'!==O.adj?RK_GKIND[g]:null;   // 「からくりのからくり」にしない
  const kind=gk?(form||O.adj)+gk:form?form+O.kind.split('の').pop():O.kind;
  return{type:hl?'hint':'orig',lb:null,hl,g,orig:ok,K,seal:O.seal,mim:m,gm:g?RK_GMORPH[g]:null,tags:tags.slice(0,3),kind};
}
// 音を組み立てて、どこにもない名前の芯をつくる（形に合う音のなかまから2つ）
function rkRoot(w,sc,el,r){
  const P=[sc.spiky>sc.round?'sharp':'round'];
  if(w.orig==='wisp'||sc.fast>.4)P.push('fast');if(w.orig==='golem'||sc.solid>.5)P.push('heavy');if(w.orig==='prism'||el==='light')P.push('shine');if(w.orig==='mask'||el==='dark')P.push('dark');
  const a=rkPick(r,RK_SYL[rkPick(r,P)]),b=rkPick(r,RK_SYL[rkPick(r,P)]);return a===b?a+'ン':a+b;
}
// 属性：物の属性＞インクの色＞その物のもとの属性（オリジナルは性質）
function rkWhoEl(w,f,sc){
  if(w.lb&&w.lb.el&&RK_KEL[w.lb.el])return RK_KEL[w.lb.el];
  if(f.inkKey)return RK_INK[f.inkKey];
  if(w.type==='known'||w.type==='meta')return w.K[0].k.el;
  for(const t of w.tags)if(RK_TAGEL[t])return RK_TAGEL[t];
  return w.K[0].k.el;
}
// 分類（くわしい画面に出す）。属性は別に出るので足さない（「ほのおのこおりのせんしゅ」にしない）
function rkKind(w){return w.kind}
// 名前の音の点数（大きい・強いほどにごって長く、形に合う音、とぶものはサ行、小さい・かわいいものはパ行）
function rkSoundScore(s,o){
  const L=rkMora(s),V=rkCnt(s,RK_VOICED),sh=rkCnt(s,RK_SHARP),ro=rkCnt(s,RK_ROUND);
  const Lt=2.6+o.cost*.4,Vt=(o.cost>=7?2.4:o.cost>=4?1.3:.4)+(o.heavy?.8:0)-(o.cute?.5:0);
  let v=-Math.abs(L-Lt)*.6-Math.abs(V-Vt)*.7+o.shape*(sh-ro)/Math.max(1,L)*1.6;
  if(o.fly)v+=.35*Math.min(2,rkCnt(s,RK_SIB));
  if(o.cute||o.cost<=2)v+=.3*Math.min(2,rkCnt(s,RK_PP));
  return v;
}
// 2つの音をつなげた名前。つながりの悪いものは null
function rkJoinName(a,b){
  if(!a||!b||a===b||b.startsWith(a)||a.endsWith(b))return null;
  if(/[ンッーャュョ]$/.test(a)&&/^[ンッーァィゥェォャュョ]/.test(b))return null;
  if(a[a.length-1]===b[0])return null;
  const s=a+b;
  return[...s].length>8||/(.)\1\1|ンン|ッ$/.test(s)?null:s;
}
// 名前。返り値 [前, うしろ]（札ではこの間で折り返す）
function rkName4(w,el,cost,sc,r){
  const T=w.tags,has=t=>T.includes(t),tier=cost>=7?3:cost>=4?2:0;
  const o={cost,shape:sc.spiky-sc.round,heavy:has('heavy')||has('stone')||sc.solid>.6,cute:has('cute'),fly:has('fly')||has('wind')};
  // 強さ（小・中・大）ごとの、表の4つの名前の合いぐあい
  const FIT={0:[1.6,1.5,-.6,-3],2:[-.8,.7,1.6,-.6],3:[-3,-1.2,.5,1.8]}[tier],C=[];
  const put=(s,v,cut)=>{if(s&&[...s].length<=8&&!rkBadName(s))C.push({s,v,cut})};
  const main=w.K[0].k;
  // 表の名前：主役はそのまま。似ている物・色の名前は少し下げる（はっきり分かる物には色の名前を使わない）
  w.K.forEach(({k},i)=>{if(i&&w.type==='known')return;k.names.forEach((s,j)=>put(s,FIT[j]-(i?.7:0)+(rkTaken(s)?-9:0)))});
  // 作った名前は、日本語らしくなければ使わない
  const coin=(a,b,v)=>{
    const s=rkJoinName(a,b);if(!s||rkTaken(s))return;
    const n=rkNatural(s);if(n<-1)return;
    put(s,v+n*.8+rkSoundScore(s,o)*.12,a.length);
  };
  const core=main.names[tier===3?2:tier===2?1:0],odd=el!==main.el;
  for(const p of RK_ELPRE[el]){coin(p,core,odd?1.5:.1);if(odd&&tier===2)coin(p,main.names[2],1.3)}
  if(tier===3)for(const h of RK_BIGHEAD)coin(h,main.names[2],.6);
  if(cost<=2)for(const h of RK_SMALLHEAD)coin(h,main.names[1],.2);
  if(w.type==='known'){
    // 表の名前を使いきったときの変化形
    const b=[...main.names[1]].length<=5?main.names[1]:main.names[0];
    for(const s of(tier===3?RK_SUF.strong:tier===2?RK_SUF.mid:RK_SUF.soft))coin(b,s,-1.3);
  }else{
    // どこにもない名前：手ざわり・なかまの音・組み立てた音
    const sufs=[...RK_SUF.mid,...(cost<=3||o.cute?RK_SUF.soft:[]),...(cost>=5||o.heavy?RK_SUF.strong:[]),...(sc.spiky>.4?RK_SUF.sharp:[]),...(o.fly?RK_SUF.fly:[])];
    const roots=[0,1,2].map(()=>rkRoot(w,sc,el,r));
    for(const m of w.mim){for(let i=0;i<2;i++)coin(m,rkPick(r,sufs),1.2);for(const g of w.gm||[])coin(m,g,1);for(const x of roots)coin(m,x,.8)}
    for(const x of roots)coin(x,rkPick(r,sufs),.9);
  }
  // もう持っているカードの名前はさける（同じ絵でもワンパターンにしない）
  const used=new Set(typeof MY!=='undefined'?MY.map(d=>d.sn):[]);
  for(const c of C)c.v+=r()*1.5-(used.has(c.s)?6:0);
  C.sort((a,b)=>b.v-a.v);
  const top=C[0];if(!top)return rkSplit(core);
  return top.cut&&top.s.length>=6?[top.s.slice(0,top.cut),top.s.slice(top.cut)]:rkSplit(top.s);
}
/* ---- 能力 ---- */
Object.assign(RK_RESW,{regen:['さいせい','じこしゅうふく'],thorn:['トゲトゲボディ','さわるとキケン'],lifeStart:['ぽかぽか','げんきのもと'],haste:['せんせいこうげき','すばやさ']});   // 古いカードの読みこみ用
const RK_OFF=new Set(['atk1','pierce','burnOnDeath','haste','thorn','flare','raikou','starfall','gale','tsunami','reap','gigabolt']),
  RK_DEF=new Set(['drSelf','drAdj','regen','healEnd','lifeOnDeath','lifeStart','drop','sanctuary','bloom','aurora']);
// 知識の組から1つ。とがった絵は攻め、まるい絵は守りの組が少し出やすい
function rkFitPick(w,sc,field,ok,r){
  const lean=rkClamp(sc.spiky-sc.round,-1,1),L=[];
  for(const{k,w:wt}of w.K)for(const e of k[field])if(ok(e.id))L.push({e,v:wt*Math.exp((RK_OFF.has(e.id)?lean:RK_DEF.has(e.id)?-lean:0)*.6)});
  if(!L.length)return null;
  let t=r()*L.reduce((a,x)=>a+x.v,0);
  for(const x of L){t-=x.v;if(t<=0)return x.e}
  return L[0].e;
}
// 共鳴効果と必殺技。cost に合う必殺技だけ（ゲージは（コスト-3）〜コスト、6まで）
function rkMoves4(w,cost,r,sc){
  const res=rkFitPick(w,sc,'res',k=>(k!=='pierce'||cost>=3)&&(k!=='haste'||cost>=2),r)||{id:'atk1',n:'まけんき'};
  const cg=Math.min(cost,6);
  let sp=null;
  if(cost>=2&&r()<.25+.08*cost)sp=rkFitPick(w,sc,'sp',k=>SP[k].g<=cg&&SP[k].g>=cg-3,r);
  return{res:res.id,sp:sp?sp.id:null,resn:res.n,spn:sp?sp.n:undefined};
}
const RK_CRY={cat:'ニャーン',dog:'ワンワン',cow:'モーモー',pig:'ブーブー',sheep:'メェェ',duck:'ガーガー',bird:'ピヨピヨ',owl:'ホーホー',frog:'ケロケロ',lion:'ガオー',elephant:'パオーン',
  monkey:'ウキキ',mouse:'チューチュー',rooster:'コケコッコー',horse:'ヒヒーン',tiger:'ガルル',parrot:'ペチャクチャ',penguin:'クワッ',dragon:'ゴオオ',dolphin:'キュイキュイ',raccoon:'キュルル',swan:'コォー'};
// すむところ：なかまごと（書いていないなかま・生き物は属性ごとの RK_PLACE）
const RK_GPLACE={S:['うみのそこ','サンゴのかげ'],F:['だいどころ','おいしいものの くに'],K:['ちずの はしっこ','おおきな まち'],V:['どこまでも つづく みち','しゃこの おく'],T:['どうぐばこの なか','しょくにんの しごとば'],
  W:['ぶきやの たな','いにしえの せんじょう'],H:['だれかの いえ','へやの すみっこ'],C:['クローゼットの なか','たんすの おく'],Y:['ふしぎな からだの くに','かがみの むこう'],M:['おんがくしつ','ステージの うえ'],
  G:['グラウンド','たいいくかんの そうこ'],E:['でんきの とおりみち','きかいの まち'],L:['ノートの すみっこ','ずけいの くに'],J:['となりまち','たびの とちゅう'],Z:['ことばの むこう','しるしの くに']};
// すむところを使う乗りもの・しぜんは、場所として不自然にならないものだけ
const RK_VPLACE={cruise_ship:'ひろい うみ',submarine:'ふかい うみ',aircraft_carrier:'ひろい うみ',canoe:'やまおくの かわ',speedboat:'なみの うえ',sailboat:'なみの うえ',airplane:'くもの うえ',helicopter:'くもの した',
  hot_air_balloon:'くもの うえ',blimp:'くもの うえ',parachute:'そらの うえ',space_shuttle:'ほしの うみ'};
// プロフィール：すむところ＋その物だけの一言＋鳴き声か能力のわけ
function rkProfile(w,el,res,r){
  const own=w.K[0].k,S=[],L=w.g&&(w.type==='known'||w.type==='meta')?RK_GPLACE[w.g]:null;
  const sea=w.lb&&RK_VPLACE[w.lb.en];
  if(w.g!=='N')S.push(`${sea||rkPick(r,L||RK_PLACE[w.type==='known'||w.type==='meta'?own.el:el])}に すむ。`);
  S.push(own.line);
  const cry=w.lb&&RK_CRY[w.lb.en];
  if(cry)S.push(`「${cry}」と なく。`);else if(RK_RESLINE[res])S.push(RK_RESLINE[res]);
  return S.join('');
}
// ATK寄り(+)かHP寄り(-)か
function rkLean(w){let v=0;w.tags.forEach((t,i)=>{const l=RK_TAG[t].lean;if(l)v+=(l==='atk'?1:-1)*(3-i)/3});if(w.lb&&RK_LEAN[w.lb.en])v+=RK_LEAN[w.lb.en]==='atk'?1:-1;return v}
