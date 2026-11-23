'use strict';
/* ---- 絵からタクティクス（使い切りカード）を作る ----
   何の絵か → タイプ（moves.js の rkArch）→ 合う効果の種類。強そうさで強さ（3段階）とコストが決まる。
   効果は rules_cards_decks.js の TACK で動く（カードに tk=種類, tn=数 を持たせる） */
const RK_TK={
  dmg:{t:'enemy',lv:[[2,2],[3,3],[4,4]],x:n=>`相手モンスター1体に${n}ダメージ`,w:['ストライク','ショット','こうげき']},
  face:{t:'face',lv:[[2,2],[3,3],[4,5]],x:n=>`相手プレイヤーに${n}ダメージ`,w:['ちょくげき','ダイレクト']},
  aoe:{t:'allEnemy',lv:[[1,3],[2,4],[3,6]],x:n=>`相手のモンスター全員に${n}ダメージ`,w:['なぎはらい','だいばくはつ','あらし']},
  heal:{t:'own',lv:[[3,1],[4,2],[6,3]],x:n=>`自分のモンスター1体のHPを${n}回復`,w:['てあて','ばんそうこう']},
  healall:{t:'none',lv:[[1,2],[2,3],[3,4]],x:n=>`自分のモンスター全員のHPを${n}回復`,w:['いやしのあめ','みんなでひとやすみ']},
  life:{t:'none',lv:[[3,2],[4,3],[6,4]],x:n=>`自分のライフを${n}回復`,w:['げんきのみなもと','ひとやすみ']},
  draw:{t:'none',lv:[[1,1],[2,2],[3,4]],x:n=>`カードを${n}枚引く`,w:['ひらめき','さがしもの']},
  buff:{t:'own',lv:[[2,1],[3,2],[4,3]],x:n=>`このターン、自分のモンスター1体のATK+${n}`,w:['おうえん','パワーアップ']},
  gauge:{t:'none',lv:[[1,1],[2,2],[3,3]],x:n=>`ソウルゲージ+${n}`,w:['チャージ','ためこみ']},
  move:{t:'move',lv:[[0,1],[0,1],[0,1]],x:()=>'自分のモンスター1体を別のスロットへ動かす（いれば入れ替え）',w:['ワープ','いれかえ']},
  // ---- 2026-11-24 ユーザー「タクティクスの効果の種類を増やして」で足した15種 ----
  // じゃま（相手のモンスター1体）
  stun:{t:'enemy',lv:[[0,2],[2,3],[3,4]],x:n=>n?`相手モンスター1体に${n}ダメージ。生き残っても、次の相手ターンはアタックできない`:'相手モンスター1体は、次の相手ターンにアタックできない',w:['かなしばり','すくませる']},
  seal:{t:'enemy',lv:[[0,1],[1,2],[2,3]],x:n=>`${n?`相手モンスター1体に${n}ダメージ。さらにその`:'相手モンスター1体の'}印を、次の自分のターン開始時まで封じる（共鳴しなくなる）`,w:['ふういん','おふだ']},
  mute:{t:'enemy',lv:[[0,1],[1,2],[2,3]],x:n=>`${n?`相手モンスター1体に${n}ダメージ。さらにその`:'相手モンスター1体の'}キーワードと共鳴効果を、次の相手ターン終了時まで消す`,w:['しずまれ','ちんもく']},
  weak:{t:'enemy',lv:[[1,1],[2,2],[3,3]],x:n=>`相手モンスター1体のATK-${n}（次の相手ターン終了時まで）`,w:['よわらせ','へなへな']},
  curse:{t:'enemy',lv:[[1,2],[2,3],[3,5]],x:n=>`相手モンスター1体のATK-${n}（ずっと）`,w:['のろい','おもり']},
  drain:{t:'enemy',lv:[[1,2],[2,3],[3,5]],x:n=>`相手モンスター1体に${n}ダメージを与え、自分のライフを${n}回復`,w:['すいとる','ドレイン']},
  cull:{t:'enemyLow',lv:[[2,2],[3,3],[5,5]],x:n=>`残りHPが${n}以下の相手モンスター1体を倒す`,w:['とどめ','フィニッシュ']},
  bounce:{t:'enemyCost',lv:[[2,2],[4,4],[9,6]],x:n=>`${n>=9?'':`コスト${n}以下の`}相手モンスター1体を手札に戻す（倒していないのでゲージは増えない）`,w:['おかえり','ふきとばし']},
  quake:{t:'none',lv:[[2,2],[3,3],[4,5]],x:n=>`自分と相手のモンスター全員に${n}ダメージ`,w:['じしん','おおあばれ']},
  // まもり・たすけ（自分）
  barrier:{t:'own',lv:[[0,1],[2,2],[4,3]],x:n=>`自分のモンスター1体に${n?`HPを${n}回復し、`:''}バリアをはる（次に受けるダメージを1回防ぐ）`,w:['バリア','まもりのまく']},
  healdraw:{t:'own',lv:[[2,2],[3,3],[5,4]],x:n=>`自分のモンスター1体のHPを${n}回復し、カードを1枚引く`,w:['おべんとう','ひとやすみ']},
  rallyAll:{t:'none',lv:[[1,2],[2,4],[3,6]],x:n=>`このターン、自分のモンスター全員のATK+${n}`,w:['ときのこえ','みんなでおうえん']},
  prism:{t:'none',lv:[[0,1],[1,2],[2,3]],x:n=>`このターン、自分のモンスターの印をすべて虹にする${n?`。カードを${n}枚引く`:''}`,w:['にじのかけはし','にじいろ']},
  energy:{t:'none',lv:[[2,1],[3,1],[5,2]],x:n=>`このターン、エナジー+${n}`,w:['じゅうでん','ブースト']},
  pact:{t:'none',lv:[[1,1],[2,1],[3,2]],x:n=>`自分のライフを${n}へらし、カードを${n+1}枚引く`,w:['けいやく','かけひき']}
};
// 絵の性質（objects.js の RK_TAG）→ 合うタクティクスと、その名前（効果と名前の意味がそろうように組で持つ）
const RK_TK_TAG={
  poison:[['curse',['もうどく','どくのしずく']],['weak',['しびれどく']],['drain',['どくばり']]],
  dark:[['curse',['のろいのことば','やみのささやき']],['mute',['やみのとばり']],['drain',['たましいすい']]],
  night:[['mute',['よるのとばり']],['stun',['ねむりのじゅもん','こもりうた']]],
  ice:[['stun',['こおりづけ','ふぶき']],['barrier',['こおりのかべ']]],
  elec:[['stun',['しびれでんき','スタンボルト']],['energy',['じゅうでん','フルチャージ']]],
  heavy:[['quake',['じしん','じならし']]],
  stone:[['quake',['がんせきおとし','じわれ']],['barrier',['いわのたて']]],
  shell:[['barrier',['からにこもる','かたいまもり']]],
  wear:[['barrier',['よろいをまとう']]],
  home:[['barrier',['おうちにかくれる']],['healdraw',['ただいま']]],
  wind:[['bounce',['ふきとばし','おいかぜ']]],
  fly:[['bounce',['つばさのかぜ']]],
  water:[['bounce',['おしながす']]],
  swim:[['bounce',['うずしお']]],
  ball:[['bounce',['はねかえし']]],
  magic:[['prism',['にじのまほう']],['seal',['ふういんのじゅもん']],['bounce',['テレポート']]],
  shine:[['prism',['にじのひかり']],['stun',['めくらまし']]],
  time:[['stun',['ときよとまれ']],['energy',['じかんかそく']]],
  sound:[['rallyAll',['おうえんか','しんぐんのマーチ']],['stun',['おおごえ']]],
  royal:[['rallyAll',['しゅつじんのごうれい']],['seal',['おうのめいれい']]],
  body:[['rallyAll',['きあいだめ']]],
  fire:[['rallyAll',['もえあがれ']]],
  treasure:[['energy',['おたからパワー']],['pact',['のろわれたたから']]],
  food:[['healdraw',['おべんとう','いただきます']]],
  sweet:[['healdraw',['おやつタイム']]],
  heal:[['healdraw',['てあてとはげまし']],['barrier',['まもりのいのり']]],
  plant:[['drain',['すいとるツタ','ねっこすい']]],
  bug:[['drain',['ちゅうちゅう']],['weak',['りんぷん']]],
  claw:[['cull',['とどめのツメ']]],
  blade:[['cull',['いっせん','とどめのいちげき']]],
  shoot:[['cull',['ねらいうち']]],
  spike:[['weak',['トゲのわな']]],
  cute:[['weak',['うるうるのめ','あまえる']]],
  tech:[['energy',['ブースト','オーバードライブ']],['stun',['システムダウン']]],
  tool:[['seal',['ロックのくさり']]],
  speed:[['energy',['ダッシュ']]]
};
// はじめからあるタクティクスのうち、新しい効果を使うもの（rules_cards_decks.js の BASIC_TK）をカードにする。コストは RK_TK の強さの段から
for(const id in BASIC_TK){const b=BASIC_TK[id],T=RK_TK[b.tk],lv=T.lv.find(([n])=>n===b.tn);
  CARDS[id]={type:'t',name:b.name,sn:b.name,cost:lv[1],t:T.t,x:T.x(b.tn),tk:b.tk,tn:b.tn}}
// 物の知識（共鳴効果・必殺技）→ 同じ意味のタクティクス
const RK_TK_FROM={flare:'dmg',starfall:'dmg',gale:'dmg',raikou:'face',tsunami:'aoe',gigabolt:'aoe',drop:'heal',sanctuary:'healall',bloom:'life',aurora:'life',
  atk1:'buff',pierce:'buff',drawOnDeath:'draw',gaugeStart:'gauge',gaugeOnDeath:'gauge',haste:'move',regen:'heal',healEnd:'healall',lifeStart:'life',
  reap:'cull',drSelf:'barrier',drAdj:'barrier'};
// 物ごとにはっきり決まるもの
const RK_TK_OBJ={light_bulb:'draw',book:'draw',pencil:'draw',map:'draw',calendar:'draw',envelope:'draw',postcard:'draw',key:'draw',
  bandage:'heal',syringe:'heal',hospital:'heal',stethoscope:'heal',cup:'life',coffee_cup:'life',mug:'life',teapot:'life',
  hurricane:'aoe',tornado:'aoe',ocean:'aoe',lightning:'aoe',rain:'healall',rainbow:'healall',bomb:'aoe',
  sword:'dmg',axe:'dmg',knife:'dmg',rifle:'face',cannon:'face',arrow:'face',boomerang:'dmg',
  battery:'gauge',power_outlet:'gauge',money:'gauge',crown:'gauge',infinity:'gauge',
  megaphone:'buff',drums:'buff',trumpet:'buff',music:'healall',
  door:'move',bridge:'move',car:'move',stairs:'move',ladder:'move',
  heart:'heal',sun:'life',moon:'gauge',star:'draw',
  snowflake:'stun',snowman:'stun',alarm_clock:'stun',stopwatch:'stun',hourglass:'stun',
  helmet:'barrier',umbrella:'barrier',fence:'barrier',castle:'barrier',jail:'seal',
  skull:'curse',spider:'weak',mosquito:'drain',bee:'weak',
  volcano:'quake',mountain:'quake',anvil:'quake',
  sandwich:'healdraw',hamburger:'healdraw',pizza:'healdraw',bread:'healdraw',lollipop:'healdraw',
  campfire:'rallyAll',diamond:'energy',lightning_bolt:'energy',
  hammer:'cull',scissors:'cull',dragon:'quake'};
// とくべつな名前
const RK_TK_SIG={heart:{heal:'ラブヒール'},lightning:{aoe:'いかずち'},sun:{life:'ひなたぼっこ'},sword:{dmg:'いっとうりょうだん'},
  light_bulb:{draw:'ひらめいた！'},book:{draw:'よみきかせ'},money:{gauge:'おこづかい'},rainbow:{healall:'にじのいやし'},
  tornado:{aoe:'たつまき'},hurricane:{aoe:'ハリケーン'},ocean:{aoe:'だいつなみ'},bandage:{heal:'ばんそうこう'},door:{move:'どこかのとびら'},
  drums:{buff:'たいこのおうえん'},megaphone:{buff:'おおごえおうえん'},crown:{gauge:'おうのめいれい'},cannon:{face:'たいほう'},arrow:{face:'ねらいうち'},
  snowflake:{stun:'ゆきのけっしょう'},snowman:{stun:'ゆきだるまのにらみ'},hourglass:{stun:'すなどけい'},alarm_clock:{stun:'めざましどけい'},
  skull:{curse:'どくろののろい'},mosquito:{drain:'ちゅうちゅうきゅうけつ'},volcano:{quake:'だいふんか'},umbrella:{barrier:'かさのバリア'},
  castle:{barrier:'ろうじょう'},jail:{seal:'てつごうし'},campfire:{rallyAll:'キャンプファイヤー'},sandwich:{healdraw:'サンドイッチべんとう'}};
function rkMakeTactic(f,rec){
  const r=rkRng(f.hash^0x5bd1e995),sc=f.sc;
  const lb=rec&&rec.known?RK_LABELS[rec.top[0].i]:null,conf=rec?rec.top[0].p:0;
  // 何者かの知識（能力・技）のうち、タクティクスにできるものから選ぶ。名前も効果と同じ組のものを使うので意味がずれない
  const w=rkWho(rec,sc,rkRng(f.hash^0x2545f491),f),opts=[];
  // 技の名前のほうが「1回使うカード」らしいので、能力の名前より出やすく
  for(const{k,w:wt}of w.K)[...k.sp,...k.res].forEach((e,i)=>{if(RK_TK_FROM[e.id])opts.push({tk:RK_TK_FROM[e.id],n:e.n,v:wt*(i<k.sp.length?1:.45)})});
  // 絵の性質（どく・こおり・でんき…）から、じゃまや守りのタクティクスも出す
  (w.tags||[]).forEach((tg,j)=>{for(const[tk,ns]of RK_TK_TAG[tg]||[])opts.push({tk,n:rkPick(r,ns),v:.9*(1-j*.3)})});
  // 物ではっきり決まる効果は、知識になくても出す（名前はその効果のことば）
  const fixed=lb&&RK_TK_OBJ[lb.en];
  if(fixed&&!opts.some(x=>x.tk===fixed))opts.push({tk:fixed,n:rkPick(r,RK_TK[fixed].w),v:1});
  if(!opts.length)opts.push({tk:'dmg',n:rkPick(r,RK_TK.dmg.w),v:1});
  const pool=fixed?opts.filter(x=>x.tk===fixed):opts;
  let t=r()*pool.reduce((a,x)=>a+x.v,0),got=pool[pool.length-1];
  for(const x of pool){t-=x.v;if(t<=0){got=x;break}}
  const tk=got.tk;
  // 強さ（0〜2）：絵の強そうさ×演出（makecard.js の rkStrong・rkStage）＋運。モンスターのコストと同じ考え
  const lv=rkClamp(Math.floor((rkStrong(w,sc,lb)*(.5+.5*rkStage(f,w))-.1)*3.6+(r()-.5)*.8),0,2),[tn,cost]=RK_TK[tk].lv[lv];
  const sig=lb&&RK_TK_SIG[lb.en]&&RK_TK_SIG[lb.en][tk];
  const name=sig||got.n;
  return{type:'t',id:'u'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),name,sn:name,cost,t:RK_TK[tk].t,x:RK_TK[tk].x(tn),tk,tn,
    seen:lb?lb.ja:'',conf:Math.round(conf*100),my:true};
}
