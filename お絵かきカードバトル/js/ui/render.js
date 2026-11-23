'use strict';
/* =========================================================
   画面
   ========================================================= */
let S=null,SPEED=1;
const $=s=>document.querySelector(s);
const sleep=ms=>new Promise(r=>setTimeout(r,ms*SPEED));
// CPUの強さ（ふつう＝1手ずつ、つよい＝cpu_strong.js の先読み）。えらんだものは覚えておく
const CPU_LV=[['normal','ふつう','今までのCPU'],['strong','つよい','先を読んで、いちばん良い手をえらぶ']];
const UI={screen:'title',mode:'cpu',cpuLv:(()=>{try{return localStorage.getItem('tr_cpulv')==='strong'?'strong':'normal'}catch(e){return'normal'}})(),deck:[0,1],cpuDeck:-1,sheet:null,tgt:null,busy:false,view:null,resultShown:false,atk:[],reso:null};
// バトルでえらんだアタックの順番（自分の番のバトル中だけ。アタックできなくなったものは外す）
function atkSel(){if(!S||!myTurn()||S.phase!=='battle'){UI.atk=[];return UI.atk}UI.atk=UI.atk.filter(i=>canAttack(S,S.cur,i));return UI.atk}
function viewer(){if(UI.mode==='cpu')return 0;if(UI.mode==='net')return UI.seat;if(UI.view!=null)return UI.view;return S.cur}
function myTurn(){return S&&S.winner==null&&!UI.busy&&S.cur===viewer()&&!S.pl[S.cur].cpu}
const esc=s=>String(s).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
// 印と属性の図形（24×24。白でぬる）
const SEAL_SVG={fang:'<path d="M3 6h18v2.2l-3.6 11-2.6-7.4H9.2l-2.6 7.4L3 8.2z"/>',shield:'<path d="M12 2l8.5 3.2v6.2c0 5.2-3.6 9-8.5 10.9-4.9-1.9-8.5-5.7-8.5-10.9V5.2z"/>',
  star:'<path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.7 7-6.3-3.8-6.3 3.8 1.7-7L2 9.2l7.1-.6z"/>',heart:'<path d="M12 21C5.2 15.4 2 12.2 2 8.2A4.9 4.9 0 0 1 12 6.6a4.9 4.9 0 0 1 10 1.6c0 4-3.2 7.2-10 12.8z"/>',
  rainbow:'<path d="M2.5 18a9.5 9.5 0 0 1 19 0M6 18a6 6 0 0 1 12 0M9.5 18a2.5 2.5 0 0 1 5 0" fill="none" stroke="#fff" stroke-width="2.4"/>'};
const EL_SVG={fire:'<path d="M12 2c.8 3.8 6 6.2 6 12a6 6 0 0 1-12 0c0-3 1.7-5 3-6.8.2 2.6 1.2 3.8 2.2 4-1-3 .1-6.4.8-9.2z"/>',water:'<path d="M12 2.5C9 7.2 5.8 10.4 5.8 14.6a6.2 6.2 0 0 0 12.4 0c0-4.2-3.2-7.4-6.2-12.1z"/>',
  thunder:'<path d="M13.5 2L5 13.8h6.2L10 22l9-12.2h-6.3z"/>',forest:'<path d="M20.5 3.5C10.5 3.5 4 8.6 4 15.6c0 2.2.8 3.8 1.7 4.6 1.2-4.8 4.6-8.6 9.6-10.8-3.8 2.8-6.6 6.2-7.6 10.8 8.4.4 12.8-6 12.8-16.7z"/>',
  light:'<circle cx="12" cy="12" r="4.6"/><path d="M12 1.5v3.4M12 19.1v3.4M1.5 12h3.4M19.1 12h3.4M4.6 4.6l2.4 2.4M17 17l2.4 2.4M4.6 19.4L7 17M17 7l2.4-2.4" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>',
  dark:'<path d="M15.5 2.5a9.6 9.6 0 1 0 6 14.6A7.6 7.6 0 0 1 15.5 2.5z"/>'};
const svgI=(p,cls)=>`<svg class="${cls}" viewBox="0 0 24 24" aria-hidden="true">${p}</svg>`;
const sealH=(k,cls='')=>`<span class="seal s-${k} ${cls}" title="${IC[k]}">${svgI(SEAL_SVG[k],'si')}</span>`;
// はじめからあるカードの番号（見本の「MS01-002」のように）
let CARD_NO=null;
function cardNo(id){if(!CARD_NO){CARD_NO={};let n=0;for(const k in CARDS)if(!CARDS[k].my)CARD_NO[k]='TR01-'+String(++n).padStart(3,'0')}return CARD_NO[id]||''}

/* 1枚のカード。o: atk hp res mirror spOk tag tagc cls field */
function cardHTML(id,o={}){
  const d=CARDS[id];
  if(d.type==='t')return`<div class="card t ${d.my?'mt':''} ${o.cls||''}"><div class="plate"><span class="coin">${d.cost}</span><span class="nm">${esc(d.name)}</span></div>
    <div class="cbody">${d.img?`<div class="cart a-${id}"></div>`:''}<div class="cfxbox"><b class="pill">タクティクス</b><div class="ctx">${d.x}</div></div></div>
    <div class="cst"><span class="cno">${cardNo(id)}</span></div></div>`;
  const atk=o.atk!=null?o.atk:d.atk,hp=o.hp!=null?o.hp:d.hp;
  const Lk=o.mirror?d.R:d.L,Rk=o.mirror?d.L:d.R;
  // 場の絵つきカードは絵を大きく見せるため、属性・必殺技・共鳴効果の文字は出さない（タップの詳細で見る）
  const fa=o.field&&d.img;
  // 見本の配置：絵（ないカードは属性の図形をうすく）→ 効果のらん（「共鳴」の札＋共鳴効果、「2G」の札＋必殺技）
  const art=d.img?`<div class="cart a-${id}"></div>`:`<div class="cart cnone">${svgI(EL_SVG[d.el],'ei')}</div>`;
  const body=fa?art
    :`${art}<div class="cfxbox"><div class="crt ${o.res?'on':''}"><b class="pill">共鳴</b><span>${d.rs}</span></div>${d.sp?`<div class="csp ${o.spOk?'ok':''}"><b class="pill">${spG(d)}G</b><span>${esc(spName(d))}</span></div>`:''}</div>`;
  return`<div class="card m e-${d.el} ${fa?'fa':''} ${o.res?'res':''} ${o.cls||''}" style="--ec:${EL[d.el].c}">
    <div class="plate"><span class="coin">${d.cost}</span><span class="nm">${nmHTML(d)}</span>${fa&&o.spOk?'<span class="spm" title="必殺技が使える">必</span>':''}<span class="eli" title="${EL[d.el].n}">${svgI(EL_SVG[d.el],'ei')}</span></div>
    <div class="cbody">${body}</div>
    <div class="cst"><span class="atk ${atk>d.atk?'up':''}"><i>ATK</i>${atk}</span><span class="cno">${cardNo(id)}</span><span class="hp ${hp<d.hp?'hurt':''}"><i>HP</i>${hp}</span></div>
    ${o.tag?`<span class="ctag ${o.tagc||''}">${o.tag}</span>`:''}${o.fx&&o.fx.length?`<span class="cfx">${o.fx.map(x=>`<i>${x}</i>`).join('')}</span>`:''}
    ${sealH(Lk,'tab l')}${sealH(Rk,'tab r')}</div>`;
}

let handOf=null;   // いま出ている手札はどの対戦の・だれのものか
function render(){
  const app=$('#app'),net=UI.mode==='net'&&UI.screen==='game';
  // 描き直しても手札の見ていた場所を保つ：縦のスクロール（横持ち）はいつも、横のスクロールはオンライン（相手の手でも描き直す）のとき。
  // 別の対戦・別の人の手札になったら最初から
  const v=UI.screen==='game'&&S?viewer():-1,oldHand=$('.hand'),same=!!oldHand&&!!handOf&&handOf.S===S&&handOf.v===v;
  const handY=same?oldHand.scrollTop:0,handX=same&&net?oldHand.scrollLeft:0;
  handOf={S,v};
  if(net)olSync();
  app.classList.toggle('gamew',UI.screen==='game');app.classList.toggle('draww',UI.screen==='draw');
  if(UI.screen==='title')app.innerHTML=titleHTML();
  else if(UI.screen==='deck')app.innerHTML=deckHTML();
  else if(UI.screen==='atelier')app.innerHTML=atelierHTML();
  else if(UI.screen==='decks')app.innerHTML=decksHTML();
  else if(UI.screen==='edit')app.innerHTML=editHTML();
  else if(UI.screen==='draw'){app.innerHTML=drawHTML();mountDraw()}
  else if(UI.screen==='online')app.innerHTML=onlineHTML();
  else app.innerHTML=gameHTML();
  if(handX||handY){const h=$('.hand');if(h){h.scrollLeft=handX;h.scrollTop=handY}}
  $('#sheet').innerHTML=(UI.screen==='game')?sheetHTML():'';
  fltInit(app);
}
function titleHTML(){
  return`<div class="title">
    <h1>お絵かきカードバトル</h1>
    <p class="lead">かいた絵がカードになる。となりと共鳴させて戦おう</p>
    <button class="btn pri" data-act="mode" data-m="cpu">CPUと対戦</button>
    <button class="btn" data-act="online">オンライン対戦<small>はなれた相手と部屋番号で</small></button>
    <button class="btn" data-act="mode" data-m="pvp">二人で対戦<small>1台を交代で使う</small></button>
    <button class="btn" data-act="atelier">お絵かきカード<small>絵をかいて自分のカードを作る</small></button>
    <button class="btn" data-act="decks">デッキ編成<small>カードをえらんで自分のデッキを作る</small></button>
    <div class="row"><button class="btn ghost" data-act="rules">ルール</button><button class="btn ghost" data-act="cards">カード一覧</button><button class="btn ghost" data-act="sound">${soundOn?'音：ON':'音：OFF'}</button></div>
    <div class="ver">RULE v0.3</div>
  </div>`;
}
function deckHTML(){
  const pvp=UI.mode==='pvp';
  if(UI.deck[0]>=DECKS.length)UI.deck[0]=0;if(UI.deck[1]>=DECKS.length)UI.deck[1]=1;if(UI.cpuDeck>=DECKS.length)UI.cpuDeck=-1;
  const elSeal=e=>`<span class="seal" style="background:${EL[e].c}">${EL[e].n}</span>`;
  const box=(w,label,sel,omakase)=>`<h3>${label}</h3>`+(omakase?`<div class="dk ${sel<0?'on':''}" data-act="pickdeck" data-w="${w}" data-i="-1"><div class="dkb"><div class="dkn">おまかせ</div><div class="dkd">3つの中からランダムに選ぶ</div></div></div>`:'')+
    DECKS.map((d,i)=>`<div class="dk ${sel===i?'on':''}" data-act="pickdeck" data-w="${w}" data-i="${i}">
      <div class="els">${d.els.map(elSeal).join('')}</div>
      <div class="dkb"><div class="dkn">${d.name}</div><div class="dkd">${d.desc}</div></div>
      <button class="btn" data-act="viewdeck" data-i="${i}">中身</button></div>`).join('');
  return`<div class="deckscr">
    <h2>${pvp?'二人で対戦':'CPUと対戦'}</h2>
    ${DECKS.length>3?'':'<p class="sub">タイトルの「お絵かきカード」で絵をかくと「お絵かきデッキ」が、「デッキ編成」で組むと自分のデッキが、ここでえらべるようになります。</p>'}
    ${pvp?'':`<h3>CPUの強さ</h3><div class="lvsel" role="radiogroup" aria-label="CPUの強さ">${CPU_LV.map(([k,n,s])=>`<button class="btn ${UI.cpuLv===k?'on':''}" role="radio" aria-checked="${UI.cpuLv===k}" data-act="cpulv" data-lv="${k}"><b>${n}</b><small>${s}</small></button>`).join('')}</div>`}
    ${box(0,pvp?'プレイヤー1のデッキ':'あなたのデッキ',UI.deck[0],false)}
    ${pvp?box(1,'プレイヤー2のデッキ',UI.deck[1],false):box(1,'CPUのデッキ',UI.cpuDeck,true)}
    <div class="go"><button class="btn ghost" data-act="back">もどる</button><button class="btn pri" data-act="start">対戦をはじめる</button></div>
  </div>`;
}
function gameHTML(){
  const v=viewer(),o=1-v;
  const pl=S.pl[S.cur];
  // 配置：.gside（相手の情報・真ん中の帯・自分の情報）は、スマホでは display:contents で場のあいだに並び、
  // 横長の画面では左の列になる（05_game.css）
  return`<div class="game">
    <div class="gside ${UI.tgt||atkSel().length?'sel':''}">
      ${pinfoHTML(o,false)}
      ${midHTML()}
      ${pinfoHTML(v,true)}
    </div>
    ${laneHTML(o,false)}
    ${laneHTML(v,true)}
    ${handHTML(v)}
  </div>`;
}
function gems(n){let h='';for(let i=0;i<GMAX;i++)h+=`<i class="gem ${i<n?'on':''}"></i>`;return h}
// エナジー。タクティクスでふえたぶん（上限をこえた分）は ex で色を変える
function coins(e,mx){let h='';for(let i=0;i<Math.max(e,mx);i++)h+=`<i class="cn ${i<e?'on':''} ${i>=mx?'ex':''}"></i>`;return h}
function pinfoHTML(p,mine){
  const pl=S.pl[p],cur=S.cur===p&&S.phase!=='setup';
  let acts='';
  if(mine){
    const my=myTurn(),main=S.phase==='main';
    const goBattle=main&&canBattle(S)&&anyReady(S,p);
    acts=`<div class="acts">
      <button class="btn" data-act="shift" ${my&&main&&!pl.shiftUsed&&pl.gauge>=SHIFT_G&&occ(pl).length?'':'disabled'}>シフト<small>1G 位置を入れ替え</small></button>
      <button class="btn" data-act="recharge" ${my&&main&&!pl.rechargeUsed&&pl.gauge>=RECH_G?'':'disabled'}>リチャージ<small>${RECH_G}G 2枚引く</small></button>
      <button class="btn pri" data-act="phase" ${my?'':'disabled'}>${goBattle?'バトルへ':'ターン終了'}</button></div>`;
  }
  const guard=canGuard(S,p)&&S.cur!==p?'<span class="gchip">ガード可</span>':'';
  const net=UI.mode==='net',me=net?mine:p===0||UI.mode==='pvp'&&mine;
  return`<div class="pinfo ${me?'me':'op'} ${mine?'pb':'pt'} ${net?'net':''} ${cur?'cur':''}">
    <div class="who"><span class="nm">${pl.name}</span>${cur?'<span class="tn">手番</span>':''}${net&&!mine?`<span class="olnet" id="olnet">${olNetState()}</span>`:''}</div>
    <div class="lifebox" id="life-${p}"><small>ライフ</small><b>${pl.life}</b></div>
    <div class="gk" id="gauge-${p}"><small>ソウルゲージ <b>${pl.gauge}</b>${guard}</small><div class="gems">${gems(pl.gauge)}</div></div>
    ${cur?`<div class="gk"><small>エナジー <b>${pl.energy}</b>/${pl.maxE}</small><div class="coins">${coins(pl.energy,pl.maxE)}</div></div>`:''}
    <div class="cnt">山札 ${pl.deck.length}<br> 手札 ${pl.hand.length}　捨て札 ${pl.trash.length}</div>
    ${acts}
  </div>`;
}
function laneHTML(p,mine){
  const info=laneInfo(S,p),order=mine?[0,1,2]:[2,1,0];
  let h=`<div class="lane ${mine?'me':'op'}"><span class="lname">${S.pl[p].name}の場</span>`;
  order.forEach((s,k)=>{
    if(k>0){const j=Math.min(order[k-1],s);h+=`<div class="conn ${info.k[j]?'on':''}" data-p="${p}" data-j="${j}"></div>`}
    h+=slotHTML(p,s,mine);
  });
  if(info.full)h+=`<div class="fullb">フルレゾナンス</div>`;
  return h+'</div>';
}
function slotHTML(p,s,mine){
  const m=S.pl[p].lane[s],key=p+'-'+s;
  const tg=UI.tgt&&UI.tgt.valid.has(key);
  const pv=tg&&UI.tgt.prev&&UI.tgt.prev[key]?`<div class="pv">${UI.tgt.prev[key]}</div>`:'';
  const inner=m?fieldCard(p,s,mine):`<div class="slb">${SLOTN[s]}</div>`;
  return`<div class="slot ${tg?'tg':''} ${tg&&p===S.cur?'mine':''}" data-act="slot" data-p="${p}" data-s="${s}">${inner}${pv}</div>`;
}
function fieldCard(p,s,mine){
  const m=S.pl[p].lane[s],d=D(m),f=laneInfo(S,p);
  const isMe=p===viewer()&&!S.pl[p].cpu;
  const ready=isMe&&myTurn()&&canAttack(S,p,s);
  const spOk=isMe&&myTurn()&&!!d.sp&&!spCheck(S,p,s);
  const done=S.cur===p&&S.phase==='battle'&&m.attacked;
  let tag='',tagc='';const pk=UI.tgt&&UI.tgt.atk===s&&p===S.cur?0:ready?atkSel().indexOf(s):-1;
  if(UI.tgt&&UI.tgt.atk===s&&p===S.cur){tag='アタック';tagc='go'}
  else if(pk>=0){tag=String(pk+1);tagc='pick'}
  else if(ready){tag='攻撃できる';tagc='go'}
  else if(fresh(S,p,s)&&S.cur===p)tag='出たばかり';
  return cardHTML(m.id,{field:true,atk:atkOf(S,p,s),hp:hpLeft(S,p,s),res:f.res[s],mirror:!mine,spOk,tag,tagc,fx:mFx(p,s).map(x=>x[0]),cls:`${ready?'ready':''} ${pk>=0?'picked':''} ${done?'done':''}`});
}
// 場のモンスターについている状態 [短い字, 説明]
function mFx(p,s){
  const m=S.pl[p].lane[s],f=laneInfo(S,p),T=S.turnNo,r=[];if(!m)return r;
  if(m.seal>=T)r.push(['封','印が封じられている（共鳴できない）']);
  if(m.sil>=T)r.push(['消','キーワードと共鳴効果が消えている']);
  else if(f.res[s]&&!f.on[s])r.push(['消','向かいのモンスターに共鳴効果を消されている']);
  if(m.stun>=T&&!(S.cur===p&&m.stun>T))r.push(['休',m.stun===T?'このターンはアタックできない':'次のターンはアタックできない']);
  if(m.bar)r.push(['守','バリア：次に受けるダメージを一度だけ防ぐ']);
  const w=(m.wkp||0)+(m.wku>=T?m.wkt||0:0);if(w)r.push([`↓${w}`,`ATK-${w}${m.wkp?'（ずっと '+m.wkp+'）':''}`]);
  if(m.thp)r.push([`+${m.thp}`,`このターンだけ HP+${m.thp}`]);
  return r;
}
function midHTML(){
  if(UI.tgt)return`<div class="mid tgt"><div class="pm">${UI.tgt.msg}</div>${UI.tgt.atk!=null?`<button class="btn" data-act="atkinfo">くわしく</button>`:''}<button class="btn" data-act="cancel">やめる</button></div>`;
  const sel=atkSel();
  if(sel.length){
    const p=S.cur,rows=sel.map((i,k)=>`<div><b>${'①②③'[k]}</b> ${esc(D(S.pl[p].lane[i]).sn)}　${atkShort(p,i)}</div>`).join('');
    return`<div class="mid tgt atkbar"><div class="pm">${rows}</div><div class="atkb"><button class="btn red" data-act="atkgo">アタック（${sel.length}体）</button><button class="btn" data-act="atkclear">やめる</button></div></div>`;
  }
  const pl=S.pl[S.cur];
  const mine=S.cur===viewer()&&!pl.cpu;
  const ph=['main','battle','end'],nm=['メイン','バトル','エンド'];
  const track=`<div class="track">${nm.map((n,k)=>`${k?'<i></i>':''}<span class="${S.phase===ph[k]?'on':''}">${n}</span>`).join('')}</div>`;
  let hint='';
  if(mine&&!UI.busy){
    if(S.phase==='main'&&S.turnNo<=3)hint='手札をタップして召喚。となりと同じ印でつなぐと共鳴';
    if(S.phase==='battle')hint='自分のモンスターをタップ → 光った相手をタップでアタック。「ぜんぶ」で全員が向かいにアタック';
    if(S.phase==='main'&&canBattle(S)&&anyReady(S,S.cur)&&S.turnNo>3&&!hint)hint='「バトルへ」か、モンスターをタップして「バトルへ進んでアタック」';
  }
  if(UI.mode==='net')hint=olHint()||hint;
  // ログは最近の8行を出す。スマホでは新しい1〜2行だけ（.old をかくす）。ログの所をタップすると全部見られる
  const L=S.log.filter(l=>l.p!==-1).slice(-8),keep=hint?1:2;
  const logs=L.map((l,k)=>`<div class="${k<L.length-keep?'old':''}">${esc(l.t)}</div>`).join('');
  const side=(UI.mode==='net'?mine:S.cur===0||UI.mode==='pvp'&&mine)?'me':'op';
  const all=mine&&!UI.busy&&S.phase==='battle'&&[0,1,2].filter(i=>canAttack(S,S.cur,i)).length>=2?'<button class="btn" data-act="atkall">ぜんぶ</button>':'';
  const turn=S.phase==='setup'?'':`第${S.turnNo}ターン`;
  return`<div class="mid ${side}"><button class="btn ghost mbtn" data-act="menu" aria-label="メニュー"><i></i><i></i><i></i></button>
    <div class="who2">${UI.mode!=='net'?pl.name+'の番':S.phase==='setup'?'対戦の準備':mine?'あなたの番':'相手の番'}<small>${turn}</small></div>${track}${all}
    <div class="lg" data-act="log" title="タップでログを全部見る">${hint?`<div class="hint">${hint}</div>`:''}<h6>ログ<span>全部見る ›</span></h6>${logs}</div></div>`;
}
function handHTML(v){
  const pl=S.pl[v],my=myTurn();
  return`<div class="hand">${pl.hand.map(c=>{
    const ok=my&&!cardCheck(S,v,c);
    return`<div class="hcw" data-act="hand" data-uid="${c.uid}">${cardHTML(c.id,{cls:'mini '+(my?(ok?'ok':'no'):'')})}</div>`;
  }).join('')||'<div class="sub" style="margin:auto">手札なし</div>'}</div>`;
}
function detailHTML(id,m,p,s){
  const d=CARDS[id];
  if(d.type==='t')return`<div class="dcard" style="--ec:${d.my?'#5b6a7a':'#55595c'}"><div class="plate"><span class="coin">${d.cost}</span><span class="nm">${esc(d.name)}</span><span class="el">タクティクス</span></div>
    <div class="dbody"><div class="dtop"><div class="dbig">${cardHTML(id,{cls:'big'})}</div><div class="dside"><div class="dsec" style="border:0;padding:0;margin:0">${d.x}</div></div></div><div class="dst">エナジー${d.cost}で使う、使い切りのカード</div>${d.my?'<div class="dseen">お絵かきカード</div>':''}</div></div>`;
  let atk=d.atk,hp=d.hp,res=false,st='';
  if(m){
    atk=atkOf(S,p,s);hp=hpLeft(S,p,s);res=laneInfo(S,p).on[s];
    const a=[];
    if(m.summoned&&S.cur===p)a.push(fresh(S,p,s)?'出たばかり（このターンはアタックできない）':'出たばかり（速攻でアタックできる）');
    for(const[,t]of mFx(p,s))a.push(t);
    if(m.attacked&&S.cur===p)a.push('アタック済み');
    if(m.usedSp&&S.cur===p)a.push('必殺技を使った');
    if(m.buff)a.push(`鼓舞 ATK+${m.buff}`);
    const f=laneInfo(S,p);if(f.same[s])a.push(`同属共鳴 ATK+${f.same[s]}`);if(f.full&&s===1)a.push('フルレゾナンスの中央 ATK+1');
    st=`<div class="dst">${S.pl[p].name}の${SLOTN[s]}${a.length?'　・　'+a.join('　・　'):''}</div>`;
  }
  let spT='なし';
  if(d.sp){const g=spG(d),c=m?spCost(S,p,s):g;spT=`${SP_KIND[d.sp]?`<span class="dic">${SP_KIND[d.sp]}</span>`:''}<b>${esc(spName(d))}</b>（${c}G${c!==g?`・元${g}G`:''}）　${spText(d)}`}
  const ric=RES_IC[d.res]&&d.my?`<span class="dic">${RES_ICN[RES_IC[d.res]]}</span>`:'';
  return`<div class="dcard" style="--ec:${EL[d.el].c}"><div class="plate"><span class="coin">${d.cost}</span><span class="nm">${esc(d.name)}</span><span class="el">${EL[d.el].n}</span></div>
    <div class="dbody">
      <div class="dtop"><div class="dbig">${cardHTML(id,{cls:'big',atk,hp,res})}</div><div class="dside">
      <div class="drow"><span>ATK<b>${atk}</b>${m&&atk!==d.atk?`（元${d.atk}）`:''}</span><span>HP<b>${hp}</b>/${m?maxHp(S,p,s):d.hp}</span><span class="ics">左 ${sealH(d.L)} 右 ${sealH(d.R)}</span></div>
      ${d.prof?`<div class="dprof">${esc(d.prof)}</div>`:''}</div></div>
      <div class="dsec ${res?'on':''}"><h5>共鳴効果${d.resn?`「${esc(d.resn)}」`:''}${res?'<em>成立中</em>':''}</h5>${ric}${resText(d)}</div>
      <div class="dsec"><h5>必殺技</h5>${spT}</div>${st}${d.my?`<div class="dseen">${d.kind?esc(d.kind)+'　・　':''}お絵かきカード</div>`:''}</div></div>`;
}
// アタックの見こみ（まとめてアタックの一覧用に短く）
function atkShort(p,i){
  const o=S.pl[1-p],em=o.lane[2-i],a=atkDmg(S,p,i,2-i),many=atkTargets(S,p,i).length>1?'（列をえらぶ）':'';
  if(!em)return`→ ${esc(o.name)}に ${a}${many}`;
  const d=Math.max(0,a-redu(S,1-p,2-i,laneInfo(S,1-p))),c=Math.max(0,atkOf(S,1-p,2-i)-redu(S,p,i,laneInfo(S,p)));
  return`→ ${esc(D(em).sn)}に ${d}${d>=hpLeft(S,1-p,2-i)?'（撃破）':''}　反撃 ${c}${c>=hpLeft(S,p,i)?'（やられる）':''}${many}`;
}
// アタックの見こみ。t：アタックする列（なければ向かい）
function atkPreview(p,i,t){
  if(t==null)t=2-i;
  const a=atkDmg(S,p,i,t),o=S.pl[1-p],em=o.lane[t],ts=atkTargets(S,p,i);
  const more=ts.length>1?`<br><span class="cnt2">どの列にもアタックできる（向かい以外へは-${rxOf(D(S.pl[p].lane[i]))}）。アタックを押すと列をえらぶ</span>`:'';
  if(!em)return`向かいは空いている　→　${o.name}に <b>${a}</b> ダメージ${more}`;
  const d=Math.max(0,a-redu(S,1-p,t,laneInfo(S,1-p))),h=hpLeft(S,1-p,t);
  const pierce=resOn(S,p,i,'pierce');
  const c=Math.max(0,atkOf(S,1-p,t)-redu(S,p,i,laneInfo(S,p))),mh=hpLeft(S,p,i);
  return`${t===2-i?'向かいの':''}${D(em).sn}（HP${h}）に <b>${d}</b> ダメージ${d>=h?'　撃破':''}${d>h&&pierce?`<br>貫通で${o.name}に${d-h}ダメージ`:''}`+
    `<br><span class="cnt2">反撃で <b>${c}</b> ダメージを受ける${c>=mh?'　撃破される':''}</span>${more}`;
}
function sheetHTML(){
  const sh=UI.sheet;if(!sh||!S)return'';
  let id,m=null;
  if(sh.kind==='hand'){const c=S.pl[sh.p].hand.find(x=>x.uid===sh.uid);if(!c){UI.sheet=null;return''}id=c.id}
  else{m=S.pl[sh.p].lane[sh.s];if(!m){UI.sheet=null;return''}id=m.id}
  const d=CARDS[id];let btns='';
  const my=myTurn()&&sh.p===S.cur;
  if(my&&sh.kind==='hand'){
    const c=S.pl[sh.p].hand.find(x=>x.uid===sh.uid);const r=cardCheck(S,sh.p,c);
    if(d.type==='m'){const rep=sumSlots(S,sh.p).rep;btns+=`<button class="btn pri" data-act="summon" data-uid="${c.uid}" ${r?'disabled':''}>${rep?'入れ替え召喚する':'召喚する'}（エナジー${d.cost}）</button>`}
    else btns+=`<button class="btn pri" data-act="tactic" data-uid="${c.uid}" ${r?'disabled':''}>使う（エナジー${d.cost}）</button>`;
    if(r)btns+=`<div class="why">${r}</div>`;
  }
  if(my&&sh.kind==='field'){
    if(S.phase==='main'&&canBattle(S)&&canAttackLater(S,sh.p,sh.s))btns+=`<button class="btn red" data-act="gobattle" data-s="${sh.s}">バトルへ進んでアタック</button>`;
    if(S.phase==='main'&&d.sp){const r=spCheck(S,sh.p,sh.s);btns+=`<button class="btn pri" data-act="sp" data-s="${sh.s}" ${r?'disabled':''}>必殺技「${esc(spName(d))}」（${spCost(S,sh.p,sh.s)}G）</button>`;if(r)btns+=`<div class="why">${r}</div>`}
    if(S.phase==='battle'){
      if(canAttack(S,sh.p,sh.s))btns+=`<div class="apv">${atkPreview(sh.p,sh.s)}</div><button class="btn red" data-act="attack" data-s="${sh.s}">相手をえらんでアタック</button>`;
      else btns+=`<div class="why">${m.attacked?'このターンはもうアタックした':m.stun===S.turnNo?'すくんでいて、このターンはアタックできない':'出たばかりなのでアタックできない'}</div>`;
    }
  }
  return`<div class="shbg" data-act="closesheet"></div><div class="sh">${detailHTML(id,m,sh.p,sh.s)}<div class="sbtns">${btns}<button class="btn" data-act="closesheet">とじる</button></div></div>`;
}

