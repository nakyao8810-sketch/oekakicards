'use strict';
/* ---- 画面 ---- */
function atelierHTML(){
  const cards=MY.slice().reverse(),od=DECKS.find(d=>d.my),inD=id=>!!(od&&od.list[id]);
  return`<div class="deckscr">
    <h2>お絵かきカード</h2>
    <p class="sub" style="font-size:13px;line-height:1.7">絵をかくと、モンスターカードやタクティクス（使い切りのカード）になります。作ったカードは、デッキ選びの「お絵かきデッキ」で対戦に使えます。</p>
    <h3>作ったカード　${cards.length}枚${cards.some(d=>!inD(d.id))?'（お絵かきデッキに入るのは新しいモンスター10種類・タクティクス4種類）':''}</h3>
    ${cards.length?`<div class="mygrid">${cards.map(d=>`<div class="myc" data-act="mycard" data-id="${d.id}">${cardHTML(d.id,{cls:'mini'})}${inD(d.id)?'':'<span class="off">デッキ外</span>'}</div>`).join('')}</div>`
      :'<p class="sub">まだありません。「新しくかく」から作れます。</p>'}
    <div class="go"><button class="btn ghost" data-act="back">もどる</button><button class="btn pri" data-act="newdraw">新しくかく</button></div>
  </div>`;
}
// 図形ボタンの小さな絵（えんぴつ線）
const RK_ICON=(()=>{const s=d=>`<svg class="ic2" viewBox="0 0 16 16" aria-hidden="true"><path d="${d}" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" stroke-linecap="round"/></svg>`;
  return{circle:s('M8 2a6 6 0 1 0 .01 0Z'),rect:s('M2.5 3.5h11v9h-11Z'),tri:s('M8 2.5 14 13.5H2Z'),star:s('M8 1.8l1.8 4 4.3.4-3.3 2.8 1 4.2L8 11l-3.8 2.2 1-4.2L1.9 6.2l4.3-.4Z'),
    heart:s('M8 13.5S2 9.6 2 5.8C2 3.8 3.5 2.5 5.1 2.5c1.3 0 2.3.8 2.9 1.8.6-1 1.6-1.8 2.9-1.8 1.6 0 3.1 1.3 3.1 3.3 0 3.8-6 7.7-6 7.7Z'),line:s('M2.5 13.5 13.5 2.5')}})();
function drawHTML(){
  return`<div class="drawscr">
    <div class="dtop"><button class="btn ghost" data-act="atelier">もどる</button><b>絵をかく</b><span class="sub">すきな絵を自由にかいてね</span></div>
    <div class="kindsw" role="group" aria-label="つくるカード"><span>つくるカード</span><button class="btn" data-act="dkind" data-k="m">モンスター</button><button class="btn" data-act="dkind" data-k="t">タクティクス</button></div>
    <div class="dwork">
    <div class="dpadcol">
      <div class="padw" id="padw"><canvas id="pad" width="512" height="512"></canvas><div class="scan"></div>
        <div class="zctl"><span id="dzlv"></span><button class="btn" data-act="dzin" aria-label="大きくする">＋</button><button class="btn" data-act="dzout" aria-label="小さくする">－</button><button class="btn" data-act="dzreset" aria-label="もとの大きさ">もとに</button></div></div>
      <p class="dhint">線のさいごで指をとめて はなすと形がととのう・2本指でつまむと大きくなる</p>
    </div>
    <div class="dtools">
      <div class="drow2">
        <button class="btn curc" data-act="dpal" aria-label="いろをえらぶ"><i></i>いろ</button>
        <button class="btn" data-act="dtool" data-t="pen">ペン</button><button class="btn" data-act="dtool" data-t="fill">ぬりつぶし</button><button class="btn" data-act="dtool" data-t="eraser">けしゴム</button><button class="btn" data-act="dtool" data-t="cut" title="タップした線を1本まるごと消す">線けし</button><button class="btn" data-act="dtool" data-t="hand" title="大きくした紙をうごかす">うごかす</button>
      </div>
      <div class="pal${rk.palOpen?' open':''}" id="pal">
        <div class="palg">${RK_PAL.flat().map(c=>`<button class="sw" data-act="dcolor" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join('')}</div>
        <div class="palr"><span class="dlb">さいきん</span><div id="precent" class="palrc"></div><label class="btn ghost palc">じぶんで<input type="color" id="dcustom" value="${rk.col}"></label></div>
      </div>
      <div class="drow2 szrow"><span class="dlb">太さ</span>
        ${RK_SIZES.map((_,i)=>`<button class="btn" data-act="dsize" data-i="${i}" aria-label="${['ごく細い','細い','ふつう','太い','とても太い'][i]}"><span class="dt" style="width:${[3,6,9,13,18][i]}px;height:${[3,6,9,13,18][i]}px"></span></button>`).join('')}
      </div>
      <div class="drow2">
        ${[['circle','まる'],['rect','しかく'],['tri','さんかく'],['star','ほし'],['heart','ハート'],['line','まっすぐ']].map(([k,n])=>`<button class="btn shp" data-act="dtool" data-t="${k}">${RK_ICON[k]}${n}</button>`).join('')}
      </div>
      <div class="drow2">
        <button class="btn ghost" data-act="dmirror" title="かいた線が左右にうつる">左右対称 OFF</button><button class="btn ghost" data-act="dsmooth">手ぶれ補正 ふつう</button><button class="btn ghost" data-act="dsnap" title="線のさいごで指を止めると、まる・まっすぐにととのえる">ととのえ ON</button>
        <button class="btn ghost" data-act="dtpl">おてほん</button><button class="btn ghost" data-act="dtploff" hidden>下絵を消す</button><button class="btn ghost" data-act="drandom" title="ランダムな絵をかく">おまかせでかく</button>
      </div>
      <div class="drow2">
        <button class="btn ghost" data-act="dundo">ひとつもどす</button><button class="btn ghost" data-act="dredo">やりなおす</button><button class="btn ghost" data-act="dclear">ぜんぶ消す</button>
      </div>
      <button class="btn pri judgeb" data-act="judge">鑑定する</button>
    </div>
    </div>
  </div>`;
}
async function rkJudge(){
  if(rk.busy)return;
  const f=rkAnalyze();
  if(!f){await modal('<h3>もう少しかいてね</h3><p class="sub">線がほとんどないので、鑑定できません。</p>',[['OK','x','pri']]);return}
  rk.busy=true;const jb=$('[data-act="judge"]');if(jb){jb.disabled=true;jb.textContent='鑑定中…'}
  const pw=$('#padw');if(pw)pw.classList.add('scanning');snd('scan');
  const rec=rkRecognize();
  await sleep(1200);
  const d=rk.kind==='t'?rkMakeTactic(f,rec):rkMakeCard(f,rec);d.img=rkArtURL(f.bbox);
  rkRegister(d);rkCssSync();
  if(pw)pw.classList.remove('scanning');if(jb){jb.disabled=false;jb.textContent='鑑定する'}
  snd('reveal');
  const v=await modal(`<h3>鑑定結果</h3>
    <div style="margin-top:10px">${detailHTML(d.id,null)}</div>`,[['カードにする','save','pri'],['かき直す','redo']]);
  rk.busy=false;
  if(v==='save'){
    MY.push(d);
    if(!rkSave()){MY.pop();rkUnregister(d.id);rkCssSync();await modal('<h3>保存できませんでした</h3><p class="sub">ブラウザの保存領域がいっぱいか、保存が止められています。古いカードを消すと入るかもしれません。</p>',[['OK','x','pri']]);return}
    snd('save');rkSyncDeck();rkClear();UI.screen='atelier';render();
    // 作ったらすぐ「投稿する？」（ユーザー指示 2026-11-23）
    const p=await modal(`<div class="askpost"><h3>カードができました！</h3><div class="dbig">${cardHTML(d.id,{cls:'big'})}</div><p class="sub">Xに投稿しますか？</p></div>`,
      [[RK_XBTN,'share','xbtn'],['あとで','x']]);
    if(p==='share')await rkShareCard(d);
  }else{rkUnregister(d.id);rkCssSync()}
}
async function rkCardMenu(id){
  const d=MY.find(x=>x.id===id);if(!d)return;
  // 名前は鑑定で決まったまま（2026-11-24 ユーザー指示で「名前を変える」はなくした）
  const v=await modal(`<div>${detailHTML(id,null)}</div>`,[[RK_XBTN,'share','xbtn'],['消す','del','red'],['とじる','x','pri']]);
  if(v==='share')await rkShareCard(d);
  else if(v==='del'){
    const ok=await modal(`<h3>「${esc(d.sn)}」を消しますか</h3><p class="sub">消したカードはもとにもどせません。</p>`,[['消す','y','red'],['やめる','n','pri']]);
    if(ok==='y'){MY=MY.filter(x=>x.id!==id);rkUnregister(id);rkCssSync();rkSave();rkSyncDeck();render()}
  }
}

