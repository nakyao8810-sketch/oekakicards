'use strict';
/* ---------- メニュー類 ---------- */
/* ルール：ページを分け、図で見せる。ページの切りかえは data-rtab（下の document のクリック） */
const RU_TABS=[['win','勝ち方'],['turn','ターン'],['battle','バトル'],['reso','共鳴'],['gauge','ゲージ'],['draw','お絵かき']];
let ruTab='win';
// えんぴつ線の小さな絵（24×24）
const RU_IC={
  deck:'<path d="M6 4h11v15H6z"/><path d="M8.5 2h11v15" opacity=".55"/><path d="M3.5 6.5V21h11" opacity=".55"/>',
  hand:'<path d="M4 18 8.5 5.5l6.5 2.4L10.5 20z"/><path d="M11 6.6 15 3.5l5.2 4.3-6.4 8.6"/>',
  swap:'<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/>',
  energy:EL_SVG.thunder,life:SEAL_SVG.heart,star:SEAL_SVG.star,shield:SEAL_SVG.shield,fang:SEAL_SVG.fang};
const ruI=(k,cls='')=>`<svg class="rui ${['deck','hand','swap'].includes(k)?'ln':''} ${cls}" viewBox="0 0 24 24" aria-hidden="true">${RU_IC[k]}</svg>`;
// 共鳴の図に使う、印だけの小さなカード
const ruMini=(L,R,el,name)=>`<div class="rum" style="--ec:${EL[el].c}"><b>${name}</b>${sealH(L,'l')}${sealH(R,'r')}</div>`;
function rulesHTML(){
  const pg=(k,h)=>`<section class="rpage" data-rp="${k}" ${ruTab===k?'':'hidden'}>${h}</section>`;
  const tile=(ic,t,s,cls='')=>`<div class="rtile ${cls}">${ic}<div><b>${t}</b><span>${s}</span></div></div>`;
  const ana=CARDS.hinoko?`<div class="rana"><div class="ranac">${cardHTML('hinoko',{cls:'big'})}
      ${[[1,-7,6],[2,52,-6],[3,107,6],[4,-12,50],[5,107,72],[6,107,82],[7,-7,95],[8,107,95]].map(([n,x,y])=>`<i class="rno" style="left:${x}%;top:${y}%">${n}</i>`).join('')}</div>
    <ol class="ranal">
      <li><b>コスト</b>出すのに使うエナジー</li><li><b>名前</b></li><li><b>属性</b>となりと同じ属性で共鳴するとATK+1</li>
      <li><b>左右の印</b>となりと共鳴するかどうか</li><li><b>共鳴効果</b>共鳴しているあいだ働く</li>
      <li><b>必殺技</b>数字は使うゲージ（G）</li><li><b>ATK</b>アタックで与えるダメージ</li><li><b>HP</b>0になると撃破</li></ol></div>`:'';
  const steps=[['スタート','エナジーが<b>自分のターン数</b>まで回復（最大'+EMAX+'・持ちこしなし）。山札から1枚引く。'],
    ['メイン','エナジーで<b>召喚</b>・<b>タクティクス</b>。ゲージで<b>必殺技</b>・<b>シフト</b>・<b>リチャージ</b>。'],
    ['バトル','出したばかりではないモンスターが、向かいの列に<b>アタック</b>できる（しなくてもいい）。'],
    ['エンド','手札が'+(HANDMAX+1)+'枚以上なら、'+HANDMAX+'枚になるまで捨てる。']];
  const lane=(who,names,cls)=>`<div class="rlane ${cls}"><span class="rwho">${who}</span>${names.map(n=>`<div class="rslot">${n}</div>`).join('')}</div>`;
  const gauge=n=>`<div class="rgauge">${Array.from({length:GMAX},(_,i)=>`<i class="${i<n?'on':''}"></i>`).join('')}<span>${n}/${GMAX}</span></div>`;
  return`<div class="rules">
  <div class="mhead"><h3>ルール</h3><button class="mx" data-mv="x" aria-label="とじる">×</button>
    <div class="rtabs" role="tablist">${RU_TABS.map(([k,l])=>`<button class="btn ${ruTab===k?'on':''}" role="tab" aria-selected="${ruTab===k}" data-rtab="${k}">${l}</button>`).join('')}</div></div>
  ${pg('win',`
    <h4>勝ち方</h4>
    <div class="rtiles">${tile(ruI('life','big red'),'相手のライフを0にする',`ライフははじめ${LIFE0}。回復しても${LIFE0}まで`)}${tile(ruI('deck','big'),'相手の山札をなくす','カードを引くときに山札が0枚なら負け')}</div>
    <h4>はじめのじゅんび</h4>
    <div class="rtiles three">${tile(ruI('deck'),'デッキ30枚','モンスター21・タクティクス9')}${tile(ruI('hand'),`手札 先攻${HAND0}・後攻${HAND0+1}`,'1回だけ、好きな枚数を引き直せる')}${tile(ruI('star'),'後攻はゲージ1から','先攻は1ターン目、引かずバトルもなし')}</div>
    <h4>カードの見かた</h4>${ana}`)}
  ${pg('turn',`
    <h4>1ターンの流れ</h4>
    <ol class="rflow">${steps.map(([t,s],i)=>`<li><i>${i+1}</i><div><b>${t}</b><p>${s}</p></div></li>`).join('')}</ol>
    <h4>エナジー</h4>
    <div class="renergy">${Array.from({length:EMAX},(_,i)=>`<div><i style="height:${(i+1)/EMAX*100}%"></i><small>${i+1}</small></div>`).join('')}</div>
    <p class="rcap">ターンごとに1ずつふえる（${EMAX}ターン目からは${EMAX}）。使わなかったぶんは次のターンに残らない。</p>
    <h4>入れ替え召喚</h4>
    <div class="rtiles">${tile(ruI('swap'),'3体いても出せる','1体をトラッシュに送って、そこに召喚。撃破ではないのでゲージはたまらない')}</div>`)}
  ${pg('battle',`
    <h4>向かい合う列</h4>
    <div class="rboard">${lane('相手',['右','中央','左'],'op')}<div class="rarrows"><i></i><i></i><i></i></div>${lane('自分',['左','中央','右'],'me')}</div>
    <p class="rcap">上下にならんだモンスターどうしが向かい合う（自分の左と相手の右）。</p>
    <h4>アタックと反撃</h4>
    <div class="rfight"><div class="rfc me">自分<b>ATK 3</b></div><div class="rfa"><span class="go">アタック 3</span><span class="back">反撃 2</span></div><div class="rfc op">相手<b>ATK 2</b></div></div>
    <ul class="rlist"><li>アタックされたモンスターは、自分のATKぶんを<b>反撃</b>する。2つのダメージは<b>同時</b>なので、倒されても反撃は届く。</li>
      <li>向かいが空いていれば、相手プレイヤーに<b>ダイレクトアタック</b>（反撃なし）。</li>
      <li>そのターンに出したばかりのモンスターはアタックできない（速攻をのぞく）。</li>
      <li>盾の軽減は反撃にも効く。</li>
      <li><b>ガード</b>（-${GUARD_CUT}）は、プレイヤーへのダイレクトアタックのときだけ使える。モンスターへのアタックや、かばったときはガードできない。</li></ul>
    <h4>そうさ</h4>
    <ul class="rlist"><li>自分のモンスターをタップ → アタックできる相手が光り、見こみのダメージが出る → 相手をタップでアタック。</li>
      <li>「ぜんぶ」で、全員がそれぞれ向かいにアタック。</li></ul>`)}
  ${pg('reso',`
    <h4>共鳴のしかた</h4>
    <div class="rreso">${ruMini('star','fang','fire','A')}<div class="rlink on"><span>共鳴</span></div>${ruMini('fang','heart','fire','B')}<div class="rlink"><span>×</span></div>${ruMini('star','shield','water','C')}</div>
    <p class="rcap">となりどうしの、<b>くっついている側の印</b>が同じなら共鳴。AとBは牙どうしで共鳴、BとCは心と星なので共鳴しない。</p>
    <div class="rtiles">${tile(`<span class="rsx">${sealH('rainbow')}</span>`,'虹の印','どの印とも共鳴する')}${tile(ruI('fang','red'),'共鳴すると','2体とも「共鳴効果」が働く')}</div>
    <h4>ボーナス</h4>
    <div class="rtiles">${tile(`<span class="rdot" style="--a:${EL.fire.c}"><i></i><i></i></span>`,'同属共鳴','共鳴した2体が同じ属性なら、2体ともATK+1')}
      ${tile(`<span class="rfull"><i></i><i></i><i></i></span>`,'フルレゾナンス','左右どちらも共鳴すると、中央のATK+1。自分の必殺技のゲージが1へる（最低1）')}</div>
    <h4>印と効果の傾向</h4>
    <div class="rseals">${[['fang','牙','ATKアップ・貫通・どの列にも・速攻'],['shield','盾','ダメージ軽減・HPアップ・かばう・バリア'],['star','星','ゲージ獲得・必殺技'],['heart','心','回復・カードを引く']].map(([k,n,s])=>`<div>${sealH(k)}<b>${n}</b><span>${s}</span></div>`).join('')}</div>`)}
  ${pg('gauge',`
    <h4>ソウルゲージ</h4>${gauge(4)}
    <div class="rtiles">${tile(ruI('fang','red'),'相手を撃破した','+1')}${tile(ruI('life'),'自分のモンスターが撃破された','+1。そのとき自分のライフが相手より5以上少なければ「逆転ボーナス」でさらに+1（ライフが多いほうにはつかない）')}</div>
    <h4>ゲージの使い道</h4>
    <div class="ruse">${[['必殺技','1〜6','各モンスター1ターン1回。5G以上の技は、全体で1ターン1回'],['シフト',SHIFT_G,'1ターン1回。自分のモンスターの場所を入れ替える（空いている場所へも動ける）'],['ガード',GUARD_G,`相手のターンに1回。自分へのダイレクトアタック1回のダメージ-${GUARD_CUT}（ダイレクトアタックされたときに聞かれる。モンスターへのアタックには使えない）`],['リチャージ',RECH_G,'1ターン1回。カードを2枚引く']].map(([n,g,s])=>`<div><b class="rg">${g}<small>G</small></b><div><b>${n}</b><span>${s}</span></div></div>`).join('')}</div>`)}
  ${pg('draw',`
  <h4>お絵かきカードの作りかた</h4>
  <ol class="rsteps"><li><i>1</i><b>絵をかく</b><span>タイトルの「お絵かきカード」から</span></li><li><i>2</i><b>鑑定</b><span>名前・属性・印・効果が決まる</span></li><li><i>3</i><b>対戦で使う</b><span>お絵かきデッキやデッキ編成で</span></li></ol>
  <p class="rcap">共鳴効果や必殺技の数字（X）・ゲージはカードごとにちがう。効果は、そのカードの印（牙・盾・星・心）に合ったものがつきやすい。</p>
  <h4>効果のことば</h4>
  <dl class="rwords">${[
    ['共鳴した瞬間','共鳴がつながった時に1回だけ働く。切れて、またつながればもう一度。召喚してすぐつながっても働く。'],
    ['HP+X・ATKとHPの入れ替え','共鳴が切れるともどる。そのとき受けたダメージがHP以上なら撃破。'],
    ['このターン、HP+X','先にへるHP。ターンが終わって消えても撃破にはならない。'],
    ['どの列にもアタック','相手モンスターのいる列か、向かいの列をえらべる。向かい以外へのダメージは-X。'],
    ['かばう','となりの列へのアタック（空いた列からのダイレクトアタックもふくむ）を代わりに受ける。反撃もかばったモンスターがする。'],
    ['効果を消す','共鳴していても共鳴効果（貫通・速攻などもふくむ）が働かない。同属共鳴・フルレゾナンスのボーナスは残る。'],
    ['封印','印がないものとして共鳴しない。虹の必殺技のターンは、自分のモンスターの印がすべて虹になる（封印された印はのぞく）。'],
    ['すくみ','次の相手ターン、そのモンスターはアタックできない。'],
    ['バリア','次に受けるダメージを1回だけ0にする。使うまで残る。'],
    ['エナジー+X（タクティクス）','そのターンだけエナジーがふえる。上限の'+EMAX+'をこえてもいい。使わなかったぶんは残らない。'],
    ['手札に戻す・トラッシュから出す','撃破ではないのでゲージはたまらない。トラッシュから出したモンスターは「出たばかり」あつかい。'],
    ['ダメージ軽減（盾）',`アタック・必殺技・タクティクスのどのダメージにも効く。`]
  ].map(([t,s])=>`<div><dt>${t}</dt><dd>${s}</dd></div>`).join('')}</dl>
  <h4>クレジット</h4><p style="font-size:11.5px">ml5.js DoodleNet（Google Quick, Draw! データセット）／TU Berlin スケッチ集（Eitz, Hays, Alexa 2012、CC BY 4.0）／HASYv2（Martin Thoma 2017、ODbL）／Mozc 公開辞書（Google・NAIST IPAdic・ICOT）／Wikidata（CC0）</p>`)}
  </div>`;
}
function showRules(){return modal(rulesHTML(),[['とじる','x','pri']],'rulebox')}
// ルールのページを切りかえる（ほかのページの中身はそのまま、上へもどす）
document.addEventListener('click',e=>{
  const b=e.target.closest('[data-rtab]');if(!b)return;
  ruTab=b.dataset.rtab;const box=b.closest('.mbox');if(!box)return;
  box.querySelectorAll('[data-rtab]').forEach(x=>{const on=x.dataset.rtab===ruTab;x.classList.toggle('on',on);x.setAttribute('aria-selected',on)});
  box.querySelectorAll('.rpage').forEach(p=>{p.hidden=p.dataset.rp!==ruTab});
  box.scrollTop=0;snd('page');
});
function cardListHTML(di){
  let ids=Object.keys(CARDS),cnt=null;
  if(di!=null){cnt=DECKS[di].list;ids=ids.filter(k=>cnt[k])}
  const ms=ids.filter(k=>CARDS[k].type==='m').sort((a,b)=>CARDS[a].cost-CARDS[b].cost),ts=ids.filter(k=>CARDS[k].type==='t').sort((a,b)=>CARDS[a].cost-CARDS[b].cost);
  const F=fltGet('cards');
  const one=k=>`<div data-fid="${k}" ${fltMatch(k,F)?'':'hidden'}>${detailHTML(k,null)}${cnt?`<div class="cnum">×${cnt[k]}</div>`:''}</div>`;
  const grp=(t,a)=>a.length?`<div data-fgrp><div class="cat">${t}</div><div class="clist">${a.map(one).join('')}</div></div>`:'';
  return`<div class="mhead"><h3>${di!=null?`「${esc(DECKS[di].name)}」の中身（30枚）`:'カード一覧'}</h3><button class="mx" data-mv="x" aria-label="とじる">×</button>${fltBarHTML('cards',{kind:true})}</div>
    ${grp('モンスター',ms)}${grp('タクティクス',ts)}<p class="sub flt0" hidden>条件に合うカードがありません。</p>`;
}
function showCardList(di){const p=modal(cardListHTML(di),[['とじる','x','pri']],'listbox');fltInit($('#modal'));return p}
function showLog(){
  const h=S.log.slice().reverse().map(l=>`<div class="${l.p===-1?'sys':'p'+(UI.mode==='cpu'?l.p:(l.p===viewer()?0:1))}">${esc(l.t)}</div>`).join('');
  return modal(`<h3>ログ</h3><div class="sub">新しい順</div><div class="logl">${h}</div>`,[['とじる','x','pri']]);
}
async function showMenu(){
  if(UI.mode==='net')return olMenu();
  const v=await modal(`<h3>メニュー</h3>`,[['ルール','rules'],['カード一覧','cards'],[soundOn?'音を消す':'音を出す','snd'],['タイトルにもどる','title','red'],['とじる','x','pri']]);
  if(v==='rules')await showRules();
  else if(v==='cards')await showCardList();
  else if(v==='snd'){soundOn=!soundOn;try{localStorage.setItem('tr_sound',soundOn?'1':'0')}catch(e){}}
  else if(v==='title'){const ok=await modal('<h3>タイトルにもどりますか</h3><p class="sub">この対戦は終わりになります。</p>',[['もどる','y','red'],['つづける','n','pri']]);if(ok==='y'){S=null;UI.busy=false;UI.screen='title';render()}}
}

