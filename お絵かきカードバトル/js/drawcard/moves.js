'use strict';
/* ---- 技と能力を「何の絵か」に合わせる ----
   1) 絵をタイプに分ける（アタッカー・まもり・いやし・あらし・すばやい・きかい・ふしぎ）
   2) タイプに合った共鳴効果（RES）と必殺技（SP）を選ぶ（必殺技はコストに合うものだけ）
   3) 絵の名前を入れた技名・能力名をつける（有名な絵はとくべつな技名） */
const RK_ARCH_G={A:'fang',B:'swift',S:'shell',I:'fang',F:'heal',P:'heal',N:'storm',K:'shell',V:'swift',T:'machine',W:'fang',H:'shell',C:'shell',Y:'trick',M:'heal',G:'swift',E:'machine',L:'trick',X:'trick',J:'swift',Z:'trick'};
const RK_ARCH={};
[['fang','shark crocodile lion tiger bear snake scorpion spider bee mosquito dragon hedgehog crab lobster cross arrow sword axe knife rifle cannon'],
 ['storm','sun lightning hurricane tornado ocean rain river campfire fireplace volcano cloud snowflake rainbow whale'],
 ['heal','heart angel hospital syringe bandage teddy-bear pillow bed hot_tub bathtub flower house_plant music santa_claus present check birthday_cake cake'],
 ['shell','sea_turtle snail castle house barn church The_Great_Wall_of_China mountain helmet anvil umbrella tent bridge fence jail skyscraper'],
 ['trick','skull skeleton The_Mona_Lisa octopus owl infinity nothing money crown camouflage mermaid key'],
 ['swift','rabbit kangaroo horse cat dog bird duck parrot flamingo swan airplane helicopter race_car motorbike rollerskates skateboard snowboard space_shuttle person_walking yoga fish dolphin'],
 ['machine','robot computer laptop television cell_phone radio microwave toaster satellite satellite_dish loudspeaker microscope drill']
].forEach(([a,s])=>s.split(' ').forEach(k=>RK_ARCH[k]=a));
// タイプごとに出やすい共鳴効果と必殺技
const RK_ARCH_RES={fang:['atk1','pierce','burnOnDeath'],shell:['drSelf','drAdj'],heal:['healEnd','lifeOnDeath','drawOnDeath','drAdj'],storm:['burnOnDeath','atk1','pierce'],
  swift:['atk1','gaugeStart','drawOnDeath'],machine:['gaugeStart','drAdj','atk1'],trick:['gaugeOnDeath','gaugeStart','burnOnDeath','drawOnDeath']};
const RK_ARCH_SP={fang:['flare','raikou','gale','starfall','reap','gigabolt'],shell:['drop','flare','bloom','sanctuary','aurora'],heal:['drop','bloom','sanctuary','aurora'],
  storm:['flare','raikou','starfall','tsunami','gigabolt'],swift:['raikou','flare','gale','starfall','reap'],machine:['raikou','flare','gale','tsunami','gigabolt'],trick:['raikou','flare','starfall','reap','aurora']};
// 技の言葉（必殺技の種類×タイプ。def はどのタイプでも）
const RK_SPW={
  flare:{fang:['クロー','かみつき','ひっかき'],storm:['ブレス','ほのおだま'],swift:['とっしん','ダイブ'],machine:['ビーム','ショット'],trick:['まほうだん','のろい'],shell:['たいあたり','ずつき'],def:['パンチ']},
  starfall:{fang:['ファング','かみくだき'],storm:['メテオ','らくらい'],swift:['スマッシュ','きゅうこうか'],machine:['キャノン','レーザー'],trick:['ほしふり','シャドウ'],def:['いちげき']},
  gale:{fang:['れんぞくクロー','ダブルバイト'],swift:['ダブルアタック','つばめがえし'],machine:['れんしゃ'],storm:['かまいたち'],def:['にれんげき']},
  raikou:{fang:['とおぼえ','とびかかり'],swift:['ダッシュ','ひとっとび'],machine:['ミサイル','でんげき'],storm:['かみなり'],trick:['いたずら'],def:['ちょくげき']},
  reap:{fang:['とどめ'],trick:['しのせんこく','たましいがり'],swift:['ひっさつ'],def:['とどめ']},
  tsunami:{storm:['だいつなみ','うずしお','あらし'],machine:['ばくはつ'],fang:['あばれまわり'],def:['なぎはらい']},
  gigabolt:{storm:['いかずち','だいふんか'],machine:['ギガビーム','バースト'],fang:['だいぼうそう'],def:['ぜんりょく']},
  drop:{heal:['てあて','おまじない'],shell:['ばんそうこう'],def:['いやし']},
  sanctuary:{heal:['いやしのうた','ひとやすみ'],shell:['まもりのじん'],def:['かいふく']},
  bloom:{heal:['げんきチャージ','おやつタイム'],def:['ひとやすみ']},
  aurora:{heal:['だいかいふく','きせき'],trick:['オーロラ'],shell:['いのり'],def:['だいかいふく']}
};
// 能力（共鳴効果）の言葉
const RK_RESW={atk1:['やるき','きあいだめ','ほんき'],pierce:['つらぬき','かんつう'],drSelf:['てっぺき','みがまえ','かたいからだ'],drAdj:['かばう','まもりのわ'],
  gaugeStart:['しゅうちゅう','ためる'],gaugeOnDeath:['のこるおもい','たましい'],drawOnDeath:['おみやげ','バトンタッチ'],lifeOnDeath:['いのちのしずく','おまもり'],
  healEnd:['いやしのうた','やすらぎ'],burnOnDeath:['さいごのいっぱつ','みちづれ']};
// とくべつな絵：使える技・能力と名前（コストに合わないときはふつうの選び方）
const RK_SIG={
  cat:{sp:{gale:'ねこパンチ連打',flare:'ねこひっかき'},res:{atk1:'のらねこの本気'}},
  dog:{sp:{raikou:'わんわんダッシュ',flare:'がぶっとかみつき'},res:{drAdj:'ばんけん'}},
  fish:{sp:{flare:'みずでっぽう',drop:'みずあび'},res:{drawOnDeath:'うみのめぐみ'}},
  shark:{sp:{gale:'シャークバイト',starfall:'ジョーズ'},res:{pierce:'かみついたらはなさない'}},
  dragon:{sp:{flare:'ドラゴンブレス',starfall:'りゅうのきば',gigabolt:'ドラゴンストーム'},res:{atk1:'りゅうのいかり'}},
  sun:{sp:{flare:'サンフレア',gigabolt:'ひかりのほうりゅう',bloom:'ひなたぼっこ'},res:{healEnd:'おひさまのぬくもり'}},
  lightning:{sp:{raikou:'らくらい',gigabolt:'いかずち'},res:{atk1:'じゅうでん'}},
  ocean:{sp:{tsunami:'だいつなみ'},res:{drawOnDeath:'なみのおくりもの'}},
  tornado:{sp:{tsunami:'たつまき',gigabolt:'だいあらし'}},hurricane:{sp:{tsunami:'ハリケーン',gigabolt:'だいあらし'}},
  skull:{sp:{reap:'しのせんこく'},res:{burnOnDeath:'のろい'}},
  skeleton:{sp:{reap:'ほねぬき',raikou:'ほねなげ'},res:{lifeOnDeath:'ほねはのこる'}},
  angel:{sp:{aurora:'てんしのいのり',sanctuary:'はねのいやし'},res:{lifeOnDeath:'てんしのかご'}},
  heart:{sp:{drop:'ラブヒール',bloom:'ラブチャージ',aurora:'あいのきせき'},res:{healEnd:'やさしいきもち'}},
  sea_turtle:{sp:{sanctuary:'こうらのじん'},res:{drSelf:'こうらにこもる'}},
  snail:{sp:{drop:'ぬるぬるヒール'},res:{drSelf:'からにこもる'}},
  hedgehog:{sp:{flare:'はりはりタックル'},res:{burnOnDeath:'さいごのトゲ'}},
  castle:{sp:{sanctuary:'ろうじょう'},res:{drAdj:'じょうへき'}},
  sword:{sp:{starfall:'いっとうりょうだん',reap:'とどめのひとふり'},res:{pierce:'きれあじ'}},
  cactus:{sp:{flare:'トゲとばし'},res:{burnOnDeath:'トゲのしかえし'}},
  bee:{sp:{flare:'はりのいちげき'},res:{burnOnDeath:'さいごのひとさし'}},
  rabbit:{sp:{raikou:'ぴょんぴょんキック'},res:{gaugeStart:'はやおき'}},
  bird:{sp:{gale:'つばさのれんげき',raikou:'きゅうこうか'}},
  owl:{sp:{reap:'よるのかり'},res:{gaugeStart:'よみとおし'}},
  snake:{sp:{reap:'まるのみ'},res:{pierce:'どくのきば'}},
  money:{sp:{raikou:'おかねのちから'},res:{drawOnDeath:'おこづかい'}},
  music:{sp:{sanctuary:'いやしのメロディ'},res:{healEnd:'ララバイ'}},
  infinity:{sp:{aurora:'むげんのひかり'},res:{gaugeOnDeath:'むげんのちから'}},
  crown:{sp:{starfall:'おうのさばき'},res:{gaugeStart:'おうのいげん'}},
  santa_claus:{sp:{bloom:'クリスマスのきせき'},res:{drawOnDeath:'プレゼント'}},
  present:{res:{drawOnDeath:'なにが出るかな'}},
  cake:{sp:{bloom:'おいわい'}},birthday_cake:{sp:{bloom:'ハッピーバースデー'}},
  volcano:{sp:{gigabolt:'だいふんか',flare:'マグマだま'}},
  rainbow:{sp:{aurora:'にじのかけはし'},res:{healEnd:'あめあがり'}},
  robot:{sp:{flare:'ロケットパンチ',gigabolt:'フルバースト'}}
};
function rkArch(lb,sc){
  if(lb&&RK_ARCH[lb.en])return RK_ARCH[lb.en];
  let a=lb?RK_ARCH_G[lb.g]:null;
  if(a==='fang'&&lb&&RK_LEAN[lb.en]==='hp')a='shell';
  if(!a)a=sc.spiky>.5?'fang':sc.round>.5?'shell':sc.colorful>.6?'heal':'trick';
  return a;
}
// 絵の名前（カタカナ・短く）。技名の頭につける
function rkMoveObj(lb,sc){const s=rkKana(lb?(RK_SHORT[lb.en]||lb.ja):RK_TRW[rkTrait(sc)]);return s.length<=5?s:''}
function rkJoin(obj,w){
  if(!obj)return w;
  if(/^[ァ-ヶー]/.test(w)){const n=obj+w;return n.length<=9?n:w}
  const n=obj+'の'+w;return n.length<=10?n:w;
}
function rkSpName(arch,sp,lb,sc,r){
  const sig=lb&&RK_SIG[lb.en];if(sig&&sig.sp&&sig.sp[sp])return sig.sp[sp];
  const W=RK_SPW[sp]||{},w=rkPick(r,W[arch]||W.def||['ひっさつ']);
  return rkJoin(rkMoveObj(lb,sc),w);
}
function rkResName(arch,res,lb,sc,r){
  const sig=lb&&RK_SIG[lb.en];if(sig&&sig.res&&sig.res[res])return sig.res[res];
  return rkJoin(rkMoveObj(lb,sc),rkPick(r,RK_RESW[res]||['ちから']));
}
// 共鳴効果と必殺技を選ぶ。cost に合う必殺技だけ。返り値 {arch,res,sp,resn,spn}
function rkPickMoves(lb,sc,cost,r){
  const arch=rkArch(lb,sc),sig=lb&&RK_SIG[lb.en];
  // 共鳴効果：とくべつな絵の能力があれば半分以上の確率でそれ、なければタイプから
  let pool=RK_ARCH_RES[arch].filter(k=>k!=='pierce'||cost>=3);
  const sres=sig&&sig.res?Object.keys(sig.res).filter(k=>k!=='pierce'||cost>=3):[];
  const res=sres.length&&r()<.7?rkPick(r,sres):rkPick(r,pool);
  // 必殺技：ゲージコストが（コスト-3）〜コスト（6まで）のもの
  const cg=Math.min(cost,6),fit=k=>SP[k].g<=cg&&SP[k].g>=cg-3;
  let sp=null;
  if(cost>=2&&r()<.35+.1*cost){
    const ssp=sig&&sig.sp?Object.keys(sig.sp).filter(fit):[];
    const apool=RK_ARCH_SP[arch].filter(fit);
    sp=ssp.length&&r()<.75?rkPick(r,ssp):apool.length?rkPick(r,apool):null;
  }
  return{arch,res,sp,resn:rkResName(arch,res,lb,sc,r),spn:sp?rkSpName(arch,sp,lb,sc,r):undefined};
}
const spName=d=>d.spn||SP[d.sp].n;
