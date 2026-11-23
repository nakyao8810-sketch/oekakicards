'use strict';
/* =========================================================
   定数（ルールブック v0.3）
   ========================================================= */
const LIFE0=15, GMAX=10, EMAX=9, HANDMAX=7, HAND0=4;   // HAND0: 最初の手札（ルールブックは5、ユーザーの指示で4）   // EMAX: エナジーの上限＝カードの最大コスト（ルールブックは6、お絵かきカード用に9へ）
const SHIFT_G=1, GUARD_G=3, GUARD_CUT=3, RECH_G=2;   // RECH_G：リチャージ（2枚引く）のゲージ。ルールブックは3、ユーザーの指示で2（2026-11-23）
const SLOTN=['左','中央','右'];
// お絵かきモンスターの ATK+HP の基準（コストごと）。ここから共鳴効果・必殺技の強さの点（makecard.js の RK_PT）を引く。
// DRAW_STAT_MAX はいちばん多くなるとき（オンラインで届いたカードの上限にも使う）
const DRAW_STAT=[0,3.5,5,6.5,8,10,12,14,16,18], DRAW_STAT_K=0;   // K：全体の強さの微調整。2026-11-23 ユーザー「低コストのステータスが高い」でコスト1〜3を−1、4を−0.5（前は 4.5,6,7.5,8.5）
const DRAW_STAT_OLD=[0,4.5,6,7.5,8.5,10,12,14,16,18];   // 前の基準（保存してある描いたカードを直すのに使う）
const DRAW_STAT_MAX=DRAW_STAT.map(v=>Math.ceil(v+DRAW_STAT_K));
const EL={
  fire:{n:'炎',c:'#a3432b'}, water:{n:'水',c:'#2e6386'},
  thunder:{n:'雷',c:'#a07816'}, forest:{n:'森',c:'#4a7236'},
  light:{n:'光',c:'#ae9447'}, dark:{n:'闇',c:'#56406e'}
};
const IC={fang:'牙',shield:'盾',star:'星',heart:'心',rainbow:'虹'};
const RES={
  atk1:'ATK+1',
  drAdj:'隣の自分のモンスターが受けるダメージ-1',
  drSelf:'このモンスターが受けるダメージ-1',
  gaugeStart:'自分のターン開始時、ゲージ+1',
  pierce:'貫通：相手モンスターを撃破した時、余ったダメージを相手プレイヤーに与える',
  drawOnDeath:'撃破された時、カードを1枚引く',
  gaugeOnDeath:'撃破された時、ゲージ+1',
  burnOnDeath:'撃破された時、相手プレイヤーに2ダメージ',
  lifeOnDeath:'撃破された時、自分のライフを2回復',
  healEnd:'自分のターン終了時、自分のモンスター全員のHPを1回復',
  // お絵かきカードで、キャラに合う能力を選べるように足したもの
  regen:'自分のターン終了時、このモンスターのHPを2回復',
  thorn:'トゲ：アタックされた時、アタックしてきたモンスターに1ダメージ',
  lifeStart:'自分のターン開始時、自分のライフを1回復',
  haste:'速攻：出たターンでもアタックできる',
  // ---- 新しいお絵かきモンスターの共鳴効果（2026-11-23 採用の19個）。数字 X はカードごと（d.rx）----
  atkX:x=>`ATK+${x}`,
  reach:x=>`どの列の相手モンスターにもアタックできる。ただし向かい以外へのダメージは-${x}`,
  rush:'共鳴した瞬間：その場に出たばかりでも、そのターンにアタックできる',
  drX:x=>`このモンスターが受けるダメージ-${x}`,
  drAdjX:x=>`隣の自分のモンスターが受けるダメージ-${x}`,
  hpX:x=>`HP+${x}`,
  cover:'隣の列へのアタックを、代わりに受けてもよい',
  barrier:'共鳴した瞬間：次に受けるダメージを一度だけ防ぐ',
  killG:x=>`相手モンスターを倒した時、ゲージ+${x}`,
  spTax:x=>`向かいの相手モンスターの必殺技のコスト+${x}`,
  spHeal:x=>`必殺技を使った後、このモンスターのHPを${x}回復`,
  resG:x=>`共鳴した瞬間：ゲージ+${x}`,
  healAdj:x=>`自分のターン終了時、隣の自分のモンスターのHPを${x}回復`,
  lifeX:x=>`自分のターン開始時、自分のライフを${x}回復`,
  drawDeathX:x=>`倒された時、カードを${x}枚引く`,
  resDraw:x=>`共鳴した瞬間：カードを${x}枚引く`,
  flip:'共鳴している間、ATKとHPの数字を入れ替える',
  hush:'向かいの相手モンスターのキーワードと共鳴効果を、働かなくする'
};
const RS={atk1:'ATK+1',drAdj:'となりの被ダメ-1',drSelf:'被ダメ-1',gaugeStart:'開始時ゲージ+1',pierce:'貫通',drawOnDeath:'撃破時1枚引く',gaugeOnDeath:'撃破時ゲージ+1',burnOnDeath:'撃破時2ダメージ',lifeOnDeath:'撃破時ライフ+2',healEnd:'終了時みんな回復1',
  regen:'終了時HP2回復',thorn:'トゲ（1ダメージ返す）',lifeStart:'開始時ライフ+1',haste:'速攻',
  atkX:x=>`ATK+${x}`,reach:x=>`どの列にも攻撃（-${x}）`,rush:'共鳴で速攻',drX:x=>`被ダメ-${x}`,drAdjX:x=>`となりの被ダメ-${x}`,hpX:x=>`HP+${x}`,cover:'となりをかばう',barrier:'共鳴で1回防ぐ',
  killG:x=>`倒すとゲージ+${x}`,spTax:x=>`向かいの技コスト+${x}`,spHeal:x=>`技のあとHP${x}回復`,resG:x=>`共鳴でゲージ+${x}`,healAdj:x=>`終了時となり回復${x}`,lifeX:x=>`開始時ライフ+${x}`,
  drawDeathX:x=>`倒されたら${x}枚引く`,resDraw:x=>`共鳴で${x}枚引く`,flip:'ATKとHP入れかえ',hush:'向かいの効果を消す'};
// 新しい共鳴効果のアイコン（効果の系統。お絵かきカードは自分の印に合う効果をもらう。sp＝特別）。数字のない効果は NOX
const RES_IC={atkX:'fang',pierce:'fang',reach:'fang',rush:'fang',drX:'shield',drAdjX:'shield',hpX:'shield',cover:'shield',barrier:'shield',
  killG:'star',spTax:'star',spHeal:'star',resG:'star',healAdj:'heart',lifeX:'heart',drawDeathX:'heart',resDraw:'heart',flip:'sp',hush:'sp'};
const RES_NOX=new Set(['pierce','rush','cover','barrier','flip','hush']);
const RES_ICN={fang:'牙',shield:'盾',star:'星',heart:'心',sp:'特別'};
// 効果の文。前からある効果は数字が決まっている（X はつかわない）
const rxOf=d=>d.rx||1;
const resText=d=>typeof RES[d.res]==='function'?RES[d.res](rxOf(d)):RES[d.res];
const resShort=d=>typeof RS[d.res]==='function'?RS[d.res](rxOf(d)):RS[d.res];

/* 必殺技 t: enemy / enemyLow / own / allEnemy / none / face */
const SP={
  flare:{n:'フレアブレス',g:2,t:'enemy',x:'相手モンスター1体に2ダメージ',f:(S,p,i,tg)=>hitOne(S,1-p,tg,2)},
  drop:{n:'しずくの癒し',g:1,t:'own',x:'自分のモンスター1体のHPを2回復',f:(S,p,i,tg)=>healM(S,p,tg,2)},
  starfall:{n:'星降り',g:3,t:'enemy',x:'相手モンスター1体に3ダメージ。フルレゾナンス中なら4ダメージ',f:(S,p,i,tg,full)=>hitOne(S,1-p,tg,full?4:3)},
  gigabolt:{n:'ギガボルト',g:6,t:'allEnemy',x:'相手のモンスター全員に3ダメージ',f:(S,p)=>hitAll(S,1-p,3)},
  sanctuary:{n:'聖域の光',g:3,t:'none',x:'自分のモンスター全員のHPを2回復',f:(S,p)=>{for(let j=0;j<3;j++)healM(S,p,j,2)}},
  tsunami:{n:'大津波',g:4,t:'allEnemy',x:'相手のモンスター全員に2ダメージ',f:(S,p)=>hitAll(S,1-p,2)},
  reap:{n:'魂刈り',g:4,t:'enemyLow',x:'残りHPが4以下の相手モンスター1体を撃破する',f:(S,p,i,tg)=>destroy(S,1-p,tg)},
  aurora:{n:'オーロラブレス',g:5,t:'none',x:'自分のライフを4回復し、自分のモンスター全員のHPを2回復',f:(S,p)=>{healLife(S,p,4);for(let j=0;j<3;j++)healM(S,p,j,2)}},
  raikou:{n:'雷光一閃',g:2,t:'face',x:'相手プレイヤーに2ダメージ',f:(S,p)=>hitPlayer(S,1-p,2)},
  gale:{n:'疾風二連',g:3,t:'enemy',x:'相手モンスター1体に2ダメージを2回',f:(S,p,i,tg)=>{hitOne(S,1-p,tg,2);if(S.pl[1-p].lane[tg])hitOne(S,1-p,tg,2)}},
  bloom:{n:'花の祈り',g:2,t:'none',x:'自分のライフを3回復',f:(S,p)=>healLife(S,p,3)},
  // ---- 新しいお絵かきモンスターの必殺技（2026-11-23 採用の17個。ATK+X全員と ATK-X は2つの版）。
  //      数字 X（d.spx）とゲージ（d.spg）はカードごと。ゲージは X から SPX で決まる。t：enemy2＝相手2体／trash＝自分のトラッシュ ----
  hit:{n:'いちげき',t:'enemy',x:X=>`相手モンスター1体に${X}ダメージ`,f:(S,p,i,tg,full,X)=>hitOne(S,1-p,tg,X)},
  blast:{n:'なぎはらい',t:'allEnemy',x:X=>`相手のモンスター全員に${X}ダメージ`,f:(S,p,i,tg,full,X)=>hitAll(S,1-p,X)},
  shot:{n:'ちょくげき',t:'face',x:X=>`相手プレイヤーに${X}ダメージ`,f:(S,p,i,tg,full,X)=>hitPlayer(S,1-p,X)},
  cull:{n:'とどめ',t:'enemyLow',x:X=>`HPが${X}以下の相手モンスター1体を倒す`,f:(S,p,i,tg)=>destroy(S,1-p,tg)},
  power:{n:'ためる',t:'none',x:X=>`このターン、このモンスターのATK+${X}`,f:(S,p,i,tg,full,X)=>{const m=S.pl[p].lane[i];if(m)m.buff+=X}},
  rallyA:{n:'おうえん',t:'none',x:X=>`このターン、自分のモンスター全員のATK+${X}`,f:(S,p,i,tg,full,X)=>{for(const m of S.pl[p].lane)if(m)m.buff+=X}},
  rallyB:{n:'だいおうえん',t:'none',x:X=>`このターン、自分のモンスター全員のATK+${X}・HP+${X}`,f:(S,p,i,tg,full,X)=>{for(const m of S.pl[p].lane)if(m){m.buff+=X;m.thp=(m.thp||0)+X}}},
  seal:{n:'ふういん',t:'enemy',x:()=>'相手モンスター1体の共鳴アイコンを、次の自分のターン開始時まで封じる',f:(S,p,i,tg)=>spMark(S,1-p,tg,'seal','封印')},
  mute:{n:'しずまれ',t:'enemy',x:()=>'相手モンスター1体のキーワードと共鳴効果を、次の相手ターン終了時まで消す',f:(S,p,i,tg)=>spMark(S,1-p,tg,'sil','効果けし')},
  stun:{n:'すくみ',t:'enemy',x:()=>'相手モンスター1体は、次の相手ターンにアタックできない',f:(S,p,i,tg)=>spMark(S,1-p,tg,'stun','すくみ')},
  bounce:{n:'おかえり',t:'enemy',x:()=>'相手モンスター1体を手札に戻す（倒していないのでゲージは増えない）',f:(S,p,i,tg)=>bounceM(S,1-p,tg)},
  swap:{n:'いれかえ',t:'enemy2',x:()=>'相手モンスター2体の位置を入れ替える',f:(S,p,i,tg)=>{const l=S.pl[1-p].lane;[l[tg[0]],l[tg[1]]]=[l[tg[1]],l[tg[0]]];lg(S,`相手の${SLOTN[tg[0]]}と${SLOTN[tg[1]]}を入れ替えた`,p);E(S,{t:'move',p:1-p})}},
  weak:{n:'よわらせ',t:'enemy',x:X=>`相手モンスター1体のATK-${X}（次の相手ターン終了時まで）`,f:(S,p,i,tg,full,X)=>{const m=S.pl[1-p].lane[tg];if(!m)return;m.wkt=(m.wku>=S.turnNo?m.wkt||0:0)+X;m.wku=S.turnNo+1;E(S,{t:'fx',p:1-p,s:tg,txt:`ATK-${X}`})}},
  weakP:{n:'のろい',t:'enemy',x:X=>`相手モンスター1体のATK-${X}（ずっと）`,f:(S,p,i,tg,full,X)=>{const m=S.pl[1-p].lane[tg];if(!m)return;m.wkp=(m.wkp||0)+X;E(S,{t:'fx',p:1-p,s:tg,txt:`ATK-${X}`})}},
  mend:{n:'てあて',t:'own',x:X=>`自分のモンスター1体のHPを${X}回復`,f:(S,p,i,tg,full,X)=>healM(S,p,tg,X)},
  mendAll:{n:'みんなでかいふく',t:'none',x:X=>`自分のモンスター全員のHPを${X}回復`,f:(S,p,i,tg,full,X)=>{for(let j=0;j<3;j++)healM(S,p,j,X)}},
  prism:{n:'にじのかけはし',t:'none',x:()=>'このターン、自分のモンスターの共鳴アイコンをすべて虹として扱う',f:(S,p)=>{S.pl[p].rbw=S.turnNo}},
  revive:{n:'よみがえり',t:'trash',x:X=>`自分のトラッシュにあるコスト${X}以下のモンスター1体を、空いているスロットに出す`,f:(S,p,i,tg)=>reviveM(S,p,tg[0],tg[1])},
  study:{n:'さがしもの',t:'none',x:X=>`カードを${X}枚引く`,f:(S,p,i,tg,full,X)=>draw(S,p,X)}
};
// 新しい必殺技の X（えらべる数）とゲージ g(X)。前からある技の強さ（フレア 2ダメ2G・大津波 全員2ダメ4G など）に合わせた
const SPX={
  hit:{xs:[1,2,3,4,5,6],g:x=>x},blast:{xs:[1,2,3],g:x=>2*x},shot:{xs:[1,2,3,4,5],g:x=>x},cull:{xs:[2,3,4,5,6],g:x=>x},
  power:{xs:[2,3,4,5,6],g:x=>Math.ceil(x/2)},rallyA:{xs:[1,2,3],g:x=>2*x},rallyB:{xs:[1,2],g:x=>2*x+1},
  seal:{xs:[0],g:()=>2},mute:{xs:[0],g:()=>2},stun:{xs:[0],g:()=>2},bounce:{xs:[0],g:()=>4},swap:{xs:[0],g:()=>1},
  weak:{xs:[1,2,3,4],g:x=>x},weakP:{xs:[1,2,3],g:x=>x+1},mend:{xs:[2,3,4,5,6],g:x=>Math.ceil(x/2)},mendAll:{xs:[1,2,3,4],g:x=>x+1},
  prism:{xs:[0],g:()=>2},revive:{xs:[2,3,4,5,6],g:x=>Math.ceil(x/2)+1},study:{xs:[1,2,3],g:x=>x+1}
};
const SP_KIND={hit:'攻撃',blast:'攻撃',shot:'攻撃',cull:'攻撃',power:'攻撃',rallyA:'攻撃',rallyB:'攻撃',seal:'妨害',mute:'妨害',stun:'妨害',bounce:'妨害',swap:'妨害',weak:'妨害',weakP:'妨害',
  mend:'守り',mendAll:'守り',prism:'共鳴',revive:'展開',study:'展開'};
// 必殺技のゲージと文（カードに spg・spx があればそれ）
const spG=d=>d.spg!=null?d.spg:SP[d.sp].g;
const spText=d=>{const x=SP[d.sp].x;return typeof x==='function'?x(d.spx):x};

const CARDS={
  // ---- サンプル6枚（ルールブックどおり）----
  kolopo:{type:'m',name:'森の語り部コロポ',sn:'コロポ',cost:1,el:'forest',atk:1,hp:2,L:'heart',R:'heart',res:'drawOnDeath'},
  hinoko:{type:'m',name:'紅蓮の仔竜ヒノコ',sn:'ヒノコ',cost:2,el:'fire',atk:2,hp:3,L:'fang',R:'star',res:'atk1',sp:'flare'},
  marin:{type:'m',name:'潮騒の守り手マリン',sn:'マリン',cost:2,el:'water',atk:1,hp:4,L:'star',R:'shield',res:'drAdj',sp:'drop'},
  luna:{type:'m',name:'星詠みの巫女ルナ',sn:'ルナ',cost:3,el:'light',atk:2,hp:3,L:'star',R:'star',res:'gaugeStart',sp:'starfall'},
  noxs:{type:'m',name:'宵闇の影狼ノクス',sn:'ノクス',cost:3,el:'dark',atk:4,hp:3,L:'fang',R:'heart',res:'atk1'},
  volga:{type:'m',name:'雷牙の獣王ボルガ',sn:'ボルガ',cost:5,el:'thunder',atk:4,hp:6,L:'shield',R:'fang',res:'pierce',sp:'gigabolt'},
  // ---- 追加カード（コスト基準に合わせた仮の数値。2026-11-23 コスト2〜4は DRAW_STAT−効果の点 に下げた）----
  pikke:{type:'m',name:'火花の仔鬼ピッケ',sn:'ピッケ',cost:1,el:'fire',atk:2,hp:1,L:'fang',R:'shield',res:'atk1'},
  goron:{type:'m',name:'苔岩のゴロン',sn:'ゴロン',cost:1,el:'forest',atk:1,hp:2,L:'shield',R:'fang',res:'drSelf'},
  puchiru:{type:'m',name:'しずくのプチル',sn:'プチル',cost:1,el:'water',atk:1,hp:2,L:'heart',R:'star',res:'gaugeOnDeath'},
  pirika:{type:'m',name:'疾風の雷鳥ピリカ',sn:'ピリカ',cost:2,el:'thunder',atk:2,hp:2,L:'star',R:'fang',res:'atk1'},
  fee:{type:'m',name:'花の妖精フィー',sn:'フィー',cost:2,el:'forest',atk:1,hp:3,L:'heart',R:'star',res:'lifeOnDeath',sp:'bloom'},
  imp:{type:'m',name:'闇の小鬼インプ',sn:'インプ',cost:2,el:'dark',atk:2,hp:2,L:'heart',R:'fang',res:'burnOnDeath'},
  moris:{type:'m',name:'木霊の番人モリス',sn:'モリス',cost:2,el:'forest',atk:1,hp:3,L:'shield',R:'heart',res:'healEnd'},
  gard:{type:'m',name:'鋼殻の甲虫ガルド',sn:'ガルド',cost:3,el:'forest',atk:2,hp:4,L:'shield',R:'shield',res:'drSelf'},
  raika:{type:'m',name:'蒼雷の妖狐ライカ',sn:'ライカ',cost:3,el:'thunder',atk:3,hp:2,L:'rainbow',R:'fang',res:'atk1',sp:'raikou'},
  jin:{type:'m',name:'嵐の剣士ジン',sn:'ジン',cost:3,el:'thunder',atk:3,hp:2,L:'fang',R:'shield',res:'pierce',sp:'gale'},
  ars:{type:'m',name:'光の騎士アルス',sn:'アルス',cost:4,el:'light',atk:3,hp:4,L:'shield',R:'star',res:'drSelf',sp:'sanctuary'},
  orca:{type:'m',name:'深海の巨鯨オルカ',sn:'オルカ',cost:4,el:'water',atk:2,hp:5,L:'shield',R:'heart',res:'drAdj',sp:'tsunami'},
  zekt:{type:'m',name:'冥府の死神ゼクト',sn:'ゼクト',cost:4,el:'dark',atk:4,hp:3,L:'fang',R:'star',res:'atk1',sp:'reap'},
  vulcan:{type:'m',name:'灼熱の古竜バルカン',sn:'バルカン',cost:6,el:'fire',atk:6,hp:7,L:'fang',R:'fang',res:'pierce'},
  celes:{type:'m',name:'天空の虹竜セレス',sn:'セレス',cost:6,el:'light',atk:4,hp:6,L:'rainbow',R:'rainbow',res:'gaugeStart',sp:'aurora'},
  // ---- タクティクス（エナジーで使う使い切り）----
  potion:{type:'t',name:'ポーション',cost:1,t:'own',x:'自分のモンスター1体のHPを3回復'},
  idea:{type:'t',name:'ひらめき',cost:2,t:'none',x:'カードを2枚引く'},
  fireball:{type:'t',name:'ファイアボール',cost:2,t:'enemy',x:'相手モンスター1体に2ダメージ'},
  thunder:{type:'t',name:'サンダーショット',cost:2,t:'face',x:'相手プレイヤーに2ダメージ'},
  spring:{type:'t',name:'生命の泉',cost:2,t:'none',x:'自分のライフを3回復'},
  formation:{type:'t',name:'陣形変更',cost:1,t:'move',x:'自分のモンスター1体を別のスロットへ動かす（いれば入れ替え）'},
  rally:{type:'t',name:'鼓舞',cost:1,t:'own',x:'このターン、自分のモンスター1体のATK+2'},
  soulcharge:{type:'t',name:'ソウルチャージ',cost:2,t:'none',x:'ソウルゲージ+2'}
};
// ---- 新しい効果を使う基本カード（2026-11-23）。ATK+HP は お絵かきカードと同じく DRAW_STAT から効果の点（makecard.js の RK_PT2）を引いた数（.5 は下げる）----
Object.assign(CARDS,{
  // 紅雷の牙（炎・雷）
  kon:{type:'m',name:'火走りの子狐コン',sn:'コン',cost:1,el:'fire',atk:2,hp:1,L:'fang',R:'fang',res:'rush',resn:'ひばしり'},
  pachi:{type:'m',name:'雷球のパチ',sn:'パチ',cost:2,el:'thunder',atk:2,hp:2,L:'fang',R:'star',res:'atkX',rx:1,resn:'じゅうでん',sp:'power',spx:2,spn:'パチパチためこみ'},
  tobi:{type:'m',name:'疾風のトビマル',sn:'トビマル',cost:2,el:'thunder',atk:2,hp:2,L:'star',R:'fang',res:'rush',resn:'はやがけ'},
  garu:{type:'m',name:'赤牙のガルム',sn:'ガルム',cost:3,el:'fire',atk:3,hp:2,L:'fang',R:'shield',res:'reach',rx:1,resn:'まわりこみ',sp:'hit',spx:2,spn:'ガルムクロー'},
  raiga:{type:'m',name:'迅雷の狼ライガ',sn:'ライガ',cost:4,el:'thunder',atk:4,hp:3,L:'fang',R:'fang',res:'pierce',resn:'いかずちのキバ',sp:'shot',spx:2,spn:'らいめいのとおぼえ'},
  enma:{type:'m',name:'炎拳のエンマ',sn:'エンマ',cost:4,el:'fire',atk:5,hp:3,L:'fang',R:'heart',res:'killG',rx:1,resn:'かちどき',sp:'rallyA',spx:1,spn:'ほのおのときのこえ'},
  dolga:{type:'m',name:'爆炎の暴れ牛ドルガ',sn:'ドルガ',cost:5,el:'fire',atk:5,hp:4,L:'shield',R:'fang',res:'atkX',rx:2,resn:'もえるいかり',sp:'stun',spx:0,spn:'もうしんのいかく'},
  ikazuchi:{type:'m',name:'天雷の大鷲イカヅチ',sn:'イカヅチ',cost:7,el:'thunder',atk:7,hp:6,L:'fang',R:'star',res:'reach',rx:1,resn:'てんくうのめ',sp:'blast',spx:2,spn:'てんらいのあらし'},
  // 潮森の城塞（水・森）
  karako:{type:'m',name:'殻もりのカラコ',sn:'カラコ',cost:1,el:'water',atk:1,hp:2,L:'shield',R:'shield',res:'drX',rx:1,resn:'からにこもる'},
  mossun:{type:'m',name:'苔むしたモッスン',sn:'モッスン',cost:2,el:'forest',atk:1,hp:4,L:'shield',R:'heart',res:'hpX',rx:1,resn:'こけのふとん'},
  awari:{type:'m',name:'泡のまもり手アワリ',sn:'アワリ',cost:2,el:'water',atk:1,hp:2,L:'heart',R:'shield',res:'barrier',resn:'あわのバリア'},
  donta:{type:'m',name:'岩甲羅のドンタ',sn:'ドンタ',cost:3,el:'water',atk:2,hp:4,L:'shield',R:'star',res:'cover',resn:'みがわり',sp:'mend',spx:4,spn:'しおみずのてあて'},
  kinobou:{type:'m',name:'森番のキノボウ',sn:'キノボウ',cost:3,el:'forest',atk:2,hp:3,L:'shield',R:'shield',res:'drAdjX',rx:1,resn:'なかまのたて',sp:'mendAll',spx:1,spn:'ほうしのいやし'},
  ganion:{type:'m',name:'鉄鋏のガニオン',sn:'ガニオン',cost:4,el:'water',atk:3,hp:4,L:'fang',R:'shield',res:'drX',rx:1,resn:'てつのこうら',sp:'weak',spx:2,spn:'はさみしめ'},
  jumoku:{type:'m',name:'大樹の番人ジュモク',sn:'ジュモク',cost:5,el:'forest',atk:3,hp:6,L:'shield',R:'heart',res:'hpX',rx:2,resn:'ねぶとのみき',sp:'rallyB',spx:1,spn:'もりのはげまし'},
  kujiland:{type:'m',name:'深海城のクジランド',sn:'クジランド',cost:7,el:'water',atk:4,hp:9,L:'shield',R:'shield',res:'cover',resn:'うごくしろ',sp:'swap',spx:0,spn:'うずしおのまよい'},
  // 星月の魔導（光・闇）
  kirari:{type:'m',name:'星くずのキラリ',sn:'キラリ',cost:1,el:'light',atk:1,hp:2,L:'star',R:'heart',res:'resG',rx:1,resn:'ほしあつめ'},
  miruru:{type:'m',name:'夜猫のミルル',sn:'ミルル',cost:2,el:'dark',atk:2,hp:2,L:'heart',R:'star',res:'resDraw',rx:1,resn:'よるのめききのめ',sp:'seal',spx:0,spn:'ねこのふういん'},
  pyonta:{type:'m',name:'月うさぎのピョンタ',sn:'ピョンタ',cost:2,el:'light',atk:2,hp:3,L:'heart',R:'heart',res:'lifeX',rx:1,resn:'つきのぽかぽか',sp:'study',spx:1,spn:'つきみのさがしもの'},
  tsubakuro:{type:'m',name:'おくりものの燕ツバクロ',sn:'ツバクロ',cost:2,el:'light',atk:2,hp:3,L:'heart',R:'star',res:'drawDeathX',rx:1,resn:'おみやげ'},
  kagenui:{type:'m',name:'影法師のカゲヌイ',sn:'カゲヌイ',cost:3,el:'dark',atk:3,hp:3,L:'star',R:'fang',res:'hush',resn:'ちんもくのにらみ',sp:'mute',spx:0,spn:'かげぬいのじゅつ'},
  noel:{type:'m',name:'祈りの巫女ノエル',sn:'ノエル',cost:3,el:'light',atk:2,hp:4,L:'heart',R:'star',res:'healAdj',rx:1,resn:'いのりのて',sp:'revive',spx:2,spn:'ふっかつのいのり'},
  uraha:{type:'m',name:'鏡月のウラハ',sn:'ウラハ',cost:3,el:'dark',atk:1,hp:5,L:'star',R:'star',res:'flip',resn:'かがみのうらおもて',sp:'bounce',spx:0,spn:'つきよのかえりみち'},
  horos:{type:'m',name:'星読み博士ホロス',sn:'ホロス',cost:4,el:'light',atk:3,hp:4,L:'star',R:'heart',res:'spTax',rx:1,resn:'ほしよみのにらみ',sp:'cull',spx:4,spn:'うんめいのよげん'},
  noctar:{type:'m',name:'冥夜の王ノクタール',sn:'ノクタール',cost:5,el:'dark',atk:5,hp:5,L:'star',R:'fang',res:'killG',rx:2,resn:'やみのせんりひん',sp:'weakP',spx:2,spn:'めいやののろい'},
  serafi:{type:'m',name:'光翼の天使セラフィ',sn:'セラフィ',cost:6,el:'light',atk:5,hp:7,L:'heart',R:'rainbow',res:'spHeal',rx:2,resn:'ひかりのいぶき',sp:'prism',spx:0,spn:'にじいろのつばさ'}
});
for(const k in CARDS){const d=CARDS[k];if(d.type==='m'){if(d.sp&&SPX[d.sp]&&d.spg==null)d.spg=SPX[d.sp].g(d.spx);d.rs=resShort(d)}}
const TACF={
  potion:(S,p,tg)=>healM(S,p,tg,3), idea:(S,p)=>draw(S,p,2), fireball:(S,p,tg)=>hitOne(S,1-p,tg,2),
  thunder:(S,p)=>hitPlayer(S,1-p,2), spring:(S,p)=>healLife(S,p,3), formation:(S,p,a,b)=>doMove(S,p,a,b),
  rally:(S,p,tg)=>{const m=S.pl[p].lane[tg];if(m)m.buff+=2}, soulcharge:(S,p)=>addG(S,p,2)
};
// お絵かきタクティクスの効果（カードの tk＝種類、tn＝数）
const TACK={
  dmg:(S,p,tg,tg2,n)=>hitOne(S,1-p,tg,n), face:(S,p,tg,tg2,n)=>hitPlayer(S,1-p,n), aoe:(S,p,tg,tg2,n)=>hitAll(S,1-p,n),
  heal:(S,p,tg,tg2,n)=>healM(S,p,tg,n), healall:(S,p,tg,tg2,n)=>{for(let j=0;j<3;j++)healM(S,p,j,n)}, life:(S,p,tg,tg2,n)=>healLife(S,p,n),
  draw:(S,p,tg,tg2,n)=>draw(S,p,n), buff:(S,p,tg,tg2,n)=>{const m=S.pl[p].lane[tg];if(m)m.buff+=n}, gauge:(S,p,tg,tg2,n)=>addG(S,p,n),
  move:(S,p,a,b)=>doMove(S,p,a,b),
  // ---- 2026-11-24 に足した15種（tactics.js の RK_TK）----
  stun:(S,p,tg,tg2,n)=>{if(n)hitOne(S,1-p,tg,n);spMark(S,1-p,tg,'stun','すくみ')},
  seal:(S,p,tg,tg2,n)=>{if(n)hitOne(S,1-p,tg,n);spMark(S,1-p,tg,'seal','封印')},
  mute:(S,p,tg,tg2,n)=>{if(n)hitOne(S,1-p,tg,n);spMark(S,1-p,tg,'sil','効果けし')},
  weak:(S,p,tg,tg2,n)=>{const m=S.pl[1-p].lane[tg];if(!m)return;m.wkt=(m.wku>=S.turnNo?m.wkt||0:0)+n;m.wku=S.turnNo+1;E(S,{t:'fx',p:1-p,s:tg,txt:`ATK-${n}`})},
  curse:(S,p,tg,tg2,n)=>{const m=S.pl[1-p].lane[tg];if(!m)return;m.wkp=(m.wkp||0)+n;E(S,{t:'fx',p:1-p,s:tg,txt:`ATK-${n}`})},
  drain:(S,p,tg,tg2,n)=>{hitOne(S,1-p,tg,n);healLife(S,p,n)},
  cull:(S,p,tg)=>destroy(S,1-p,tg),
  bounce:(S,p,tg)=>bounceM(S,1-p,tg),
  quake:(S,p,tg,tg2,n)=>{hitAll(S,1-p,n);hitAll(S,p,n)},
  barrier:(S,p,tg,tg2,n)=>{const m=S.pl[p].lane[tg];if(!m)return;if(n)healM(S,p,tg,n);m.bar=true;E(S,{t:'fx',p,s:tg,txt:'バリア'})},
  healdraw:(S,p,tg,tg2,n)=>{healM(S,p,tg,n);draw(S,p,1)},
  rallyAll:(S,p,tg,tg2,n)=>{for(const m of S.pl[p].lane)if(m)m.buff+=n},
  prism:(S,p,tg,tg2,n)=>{S.pl[p].rbw=S.turnNo;lg(S,'このターン、印がすべて虹になった',p);if(n)draw(S,p,n)},
  energy:(S,p,tg,tg2,n)=>{S.pl[p].energy+=n;lg(S,`エナジー+${n}`,p)},
  pact:(S,p,tg,tg2,n)=>{hitPlayer(S,p,n);if(S.winner==null)draw(S,p,n+1)}
};
// はじめからあるタクティクスで、新しい効果を使うもの（効果は TACK、文は tactics.js の RK_TK から作る）
const BASIC_TK={
  freeze:{name:'こおりのいぶき',tk:'stun',tn:2},ofuda:{name:'ふういんのおふだ',tk:'seal',tn:0},bell:{name:'しずけさのかね',tk:'mute',tn:0},
  smoke:{name:'よわきのけむり',tk:'weak',tn:2},vine:{name:'すいとるツタ',tk:'drain',tn:2},finish:{name:'とどめのいちげき',tk:'cull',tn:3},
  gust:{name:'おかえりのかぜ',tk:'bounce',tn:4},quake:{name:'だいじしん',tk:'quake',tn:2},shieldf:{name:'まもりのまく',tk:'barrier',tn:0},
  bento:{name:'おべんとう',tk:'healdraw',tn:2},warcry:{name:'ときのこえ',tk:'rallyAll',tn:1},rainbowd:{name:'にじのしずく',tk:'prism',tn:0},
  drink:{name:'エナジードリンク',tk:'energy',tn:2},pactc:{name:'あくまのけいやく',tk:'pact',tn:2}
};
// おすすめデッキ（2026-11-23 新しい効果のカードで作り直し。前の3つ「紅蓮の牙」「潮騒の守り」「星闇の祈り」は OLD_DECKS に残す）
const DECKS=[
  {name:'紅雷の牙',els:['fire','thunder'],desc:'炎と雷のこうげき型。速攻とどの列にもアタックで、一気にせめる',
   list:{kon:3,pachi:3,tobi:2,garu:3,raiga:2,enma:2,dolga:2,ikazuchi:1,pikke:2,raika:1,fireball:3,thunder:2,rally:2,idea:2}},
  {name:'潮森の城塞',els:['water','forest'],desc:'水と森の守り型。かばう・バリア・HPアップでかたく守って、じっくり勝つ',
   list:{karako:3,mossun:3,awari:2,donta:3,kinobou:2,ganion:2,jumoku:2,kujiland:1,gard:2,orca:1,potion:3,spring:2,fireball:2,idea:2}},
  {name:'星月の魔導',els:['light','dark'],desc:'光と闇のふしぎ型。封印・効果けし・手札に戻すで相手をみだし、共鳴でゲージとカードをためる',
   list:{kirari:3,miruru:3,pyonta:3,tsubakuro:2,kagenui:2,noel:2,uraha:2,horos:2,noctar:1,serafi:1,soulcharge:1,potion:2,idea:2,fireball:2,formation:2}}
];
const OLD_DECKS=[
  {name:'紅蓮の牙',els:['fire','thunder','dark'],desc:'炎と雷のこうげき型。牙でつないで一気にせめる',
   list:{pikke:3,hinoko:3,pirika:3,noxs:2,raika:2,jin:2,volga:2,vulcan:2,imp:1,zekt:1,fireball:3,thunder:2,rally:2,idea:2}},
  {name:'潮騒の守り',els:['water','forest','light'],desc:'水と森の守り型。盾でかたくつないで回復しながら戦う',
   list:{kolopo:2,goron:2,puchiru:2,marin:3,moris:2,fee:2,gard:2,luna:2,ars:2,orca:2,potion:3,spring:2,idea:2,soulcharge:1,formation:1}},
  {name:'星闇の祈り',els:['light','dark','water'],desc:'光と闇の必殺技型。星でゲージをためて大技をねらう',
   list:{puchiru:2,imp:2,hinoko:2,marin:2,luna:3,noxs:2,zekt:2,ars:1,celes:2,raika:2,fee:1,soulcharge:3,idea:2,fireball:2,formation:2}}
];

