'use strict';
/* ---------- デッキ編成 ----------
   自分で組んだデッキを localStorage（tr_decks）に保存する。
   決まり：モンスター21枚・タクティクス9枚の30枚。同じカードは3枚まで。
   できあがったデッキだけが、対戦のデッキ選びに出る（DECKS の後ろに足す） */
const DE_KEY='tr_decks',DE_MAX=8,DE_M=21,DE_T=9,DE_COPY=3;
let DE=null;   // [{id,name,list:{cardId:枚数}}]
function deLoad(){if(DE)return DE;try{const a=JSON.parse(localStorage.getItem(DE_KEY)||'[]');DE=Array.isArray(a)?a.filter(d=>d&&d.id&&d.list):[]}catch(e){DE=[]}return DE}
function deSave(){try{localStorage.setItem(DE_KEY,JSON.stringify(DE));return true}catch(e){return false}}
// 中身の数（消えたお絵かきカードは数えない）
function deCount(list){let m=0,t=0;for(const id in list){const d=CARDS[id];if(!d)continue;if(d.type==='m')m+=list[id];else t+=list[id]}return{m,t,all:m+t}}
const deDone=list=>{const c=deCount(list);return c.m===DE_M&&c.t===DE_T};
function deEls(list){const cnt={};for(const id in list){const d=CARDS[id];if(d&&d.type==='m')cnt[d.el]=(cnt[d.el]||0)+list[id]}return Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,3)}
// できあがったデッキを対戦用の DECKS に足す（rkSyncDeck の最後から呼ぶ）
function deSync(){
  for(const d of deLoad()){
    if(!deDone(d.list))continue;
    const list={};for(const id in d.list)if(CARDS[id]&&d.list[id]>0)list[id]=d.list[id];
    DECKS.push({name:d.name,els:deEls(list),desc:'自分で組んだデッキ',list,custom:d.id});
  }
}
function deResync(){rkSyncDeck()}

/* ---- 画面：デッキの一覧 ---- */
function decksHTML(){
  const L=deLoad();
  const row=d=>{const c=deCount(d.list),ok=deDone(d.list);return`<div class="dk" data-act="dedit" data-id="${d.id}">
    <div class="els">${deEls(d.list).map(e=>`<span class="seal" style="background:${EL[e].c}">${EL[e].n}</span>`).join('')}</div>
    <div class="dkb"><div class="dkn">${esc(d.name)}</div><div class="dkd">${ok?'完成　対戦でえらべます':`未完成　モンスター${c.m}/${DE_M}・タクティクス${c.t}/${DE_T}`}</div></div>
    <button class="btn" data-act="dedel" data-id="${d.id}">消す</button></div>`};
  return`<div class="deckscr">
    <h2>デッキ編成</h2>
    <p class="sub" style="font-size:13px;line-height:1.7">モンスター${DE_M}枚とタクティクス${DE_T}枚、あわせて30枚で自分だけのデッキを作ります。同じカードは${DE_COPY}枚まで。お絵かきカードも入れられます。</p>
    <h3>自分のデッキ　${L.length}/${DE_MAX}</h3>
    ${L.length?L.map(row).join(''):'<p class="sub">まだありません。</p>'}
    <div class="go"><button class="btn ghost" data-act="back">もどる</button><button class="btn pri" data-act="denew" ${L.length>=DE_MAX?'disabled':''}>新しく作る</button></div>
  </div>`;
}

/* ---- 画面：編集 ---- */
const DE_TABS=[['all','すべて'],['m','モンスター'],['t','タクティクス'],['my','お絵かき'],['in','デッキの中身']];
function dePool(tab,list){
  const ids=Object.keys(CARDS).filter(id=>{const d=CARDS[id];
    if(tab==='m')return d.type==='m';if(tab==='t')return d.type==='t';if(tab==='my')return!!d.my;if(tab==='in')return(list[id]||0)>0;return true});
  return ids.sort((a,b)=>{const A=CARDS[a],B=CARDS[b];return(A.type===B.type?0:A.type==='m'?-1:1)||A.cost-B.cost||(A.my?1:0)-(B.my?1:0)||a.localeCompare(b)});
}
function editHTML(){
  const E=UI.ed,c=deCount(E.list),curve=Array(EMAX+1).fill(0);
  for(const id in E.list){const d=CARDS[id];if(d&&d.type==='m')curve[d.cost]+=E.list[id]}
  const top=Math.max(4,...curve);
  const pool=dePool(E.tab,E.list),F=fltGet('ed');
  const card=id=>{const d=CARDS[id],n=E.list[id]||0,full=d.type==='m'?c.m>=DE_M:c.t>=DE_T;
    return`<div class="edc ${n?'in':''}" data-fid="${id}" ${fltMatch(id,F)?'':'hidden'}><div class="edv" data-act="edview" data-id="${id}">${cardHTML(id,{cls:'mini'})}${n?`<span class="edn">${n}</span>`:''}</div>
      <div class="edq"><button class="btn" data-act="edminus" data-id="${id}" ${n?'':'disabled'} aria-label="1枚へらす">−</button><b>${n}</b><button class="btn" data-act="edplus" data-id="${id}" ${n>=DE_COPY||full?'disabled':''} aria-label="1枚ふやす">＋</button></div></div>`};
  return`<div class="edscr">
    <div class="edhead">
      <div class="edtop"><button class="btn ghost" data-act="edback">もどる</button><b class="edname">${esc(E.name)}</b><button class="btn ghost" data-act="edrename">名前</button><button class="btn pri" data-act="edsave">保存</button></div>
      <div class="edstat">
        <div class="edcnt"><span class="${c.m===DE_M?'ok':''}">モンスター <b>${c.m}</b>/${DE_M}</span><span class="${c.t===DE_T?'ok':''}">タクティクス <b>${c.t}</b>/${DE_T}</span><span class="${c.all===30?'ok':''}">合計 <b>${c.all}</b>/30</span></div>
        <div class="curve" aria-label="モンスターのコストごとの枚数">${curve.slice(1).map((n,k)=>`<div><i style="height:${Math.round(n/top*30)}px"></i><em>${n||''}</em><small>${k+1}</small></div>`).join('')}</div>
      </div>
      <div class="edbtns"><button class="btn ghost" data-act="edauto">おまかせで埋める</button><button class="btn ghost" data-act="edclear">ぜんぶ外す</button></div>
      <div class="edtabs">${DE_TABS.map(([k,l])=>`<button class="btn ${E.tab===k?'on':''}" data-act="edtab" data-t="${k}">${l}</button>`).join('')}</div>
      ${fltBarHTML('ed')}
    </div>
    <div class="edgrid">${pool.map(card).join('')||`<p class="sub" style="grid-column:1/-1">${E.tab==='my'?'お絵かきカードがまだありません。タイトルの「お絵かきカード」で作れます。':'カードがありません。'}</p>`}
      ${pool.length?'<p class="sub flt0" style="grid-column:1/-1" hidden>条件に合うカードがありません。</p>':''}</div>
  </div>`;
}
// のこりをうめる：多い属性のモンスター・低コスト多め／タクティクスは定番から
function deAutoFill(list){
  let c=deCount(list);
  const els=deEls(list),want=[0,0,5,6,4,3,2,1,0,0];
  const mons=Object.keys(CARDS).filter(id=>CARDS[id].type==='m');
  const curve=Array(EMAX+1).fill(0);for(const id in list){const d=CARDS[id];if(d&&d.type==='m')curve[d.cost]+=list[id]}
  const score=id=>{const d=CARDS[id];let s=0;const ei=els.indexOf(d.el);if(ei>=0)s+=3-ei;else if(!els.length)s+=1;
    s+=Math.max(-3,(want[Math.min(d.cost,9)]||0)-curve[d.cost])*.8;/* そのコストが多すぎると下げる */s-=(list[id]||0)*(d.cost>=5?1.6:.9);if(d.cost>=6)s-=1.5;if(d.my)s+=.6;if(d.cost<=2)s+=.4;return s+(d.atk+d.hp)/(d.cost+2)*.3};
  while(c.m<DE_M){
    const can=mons.filter(id=>(list[id]||0)<DE_COPY);if(!can.length)break;
    can.sort((a,b)=>score(b)-score(a));const id=can[0];list[id]=(list[id]||0)+1;curve[CARDS[id].cost]++;c.m++;
  }
  const tacs=[...MY.filter(d=>d.type==='t').map(d=>d.id).reverse().slice(0,3),'idea','potion','fireball','rally','soulcharge','spring','thunder','formation'].filter(id=>CARDS[id]);
  for(let k=0;c.t<DE_T&&k<tacs.length*DE_COPY;k++){const id=tacs[k%tacs.length];if((list[id]||0)<DE_COPY){list[id]=(list[id]||0)+1;c.t++}}
}
function deCopyList(i){const src=i>=0&&DECKS[i]?DECKS[i].list:{};const l={};for(const id in src)if(CARDS[id])l[id]=src[id];return l}
function deOpen(d){UI.ed={id:d.id,name:d.name,list:Object.assign({},d.list),tab:'all',dirty:false};UI.screen='edit';render();const g=$('.edscr');if(g)g.scrollTop=0}

Object.assign(ACT,{
  decks(){UI.screen='decks';snd('tap');render()},
  async denew(){
    const L=deLoad();if(L.length>=DE_MAX)return;
    const opts=DECKS.map((d,i)=>[`${esc(d.name)}をもとに`,'d'+i]);
    const v=await modal('<h3>新しいデッキ</h3><p class="sub">からっぽから作るか、今あるデッキをもとにして作れます。</p>',[['からっぽから','e','pri'],...opts,['やめる','x']]);
    if(!v||v==='x')return;
    let n=1;while(L.some(d=>d.name==='マイデッキ'+n))n++;
    const src=v==='e'?-1:+v.slice(1);
    deOpen({id:'d'+Date.now().toString(36),name:src>=0?`${DECKS[src].name}（改）`.slice(0,12):'マイデッキ'+n,list:deCopyList(src)});
    UI.ed.dirty=true;
  },
  dedit(t,e){if(e.target.closest('[data-act="dedel"]'))return;const d=deLoad().find(x=>x.id===t.dataset.id);if(d){snd('tap');deOpen(d)}},
  async dedel(t){
    const d=deLoad().find(x=>x.id===t.dataset.id);if(!d)return;
    const ok=await modal(`<h3>「${esc(d.name)}」を消しますか</h3><p class="sub">消したデッキはもとにもどせません。</p>`,[['消す','y','red'],['やめる','n','pri']]);
    if(ok!=='y')return;DE=DE.filter(x=>x.id!==d.id);deSave();deResync();render();
  },
  edtab(t){UI.ed.tab=t.dataset.t;snd('tap');render();const g=$('.edscr');if(g)g.scrollTop=0},
  edplus(t){const E=UI.ed,id=t.dataset.id,d=CARDS[id],c=deCount(E.list);if(!d||(E.list[id]||0)>=DE_COPY)return;if(d.type==='m'?c.m>=DE_M:c.t>=DE_T)return;E.list[id]=(E.list[id]||0)+1;E.dirty=true;snd('card');deKeepScroll()},
  edminus(t){const E=UI.ed,id=t.dataset.id;if(!E.list[id])return;if(--E.list[id]<=0)delete E.list[id];E.dirty=true;snd('tap');deKeepScroll()},
  edview(t){modal(detailHTML(t.dataset.id,null),[['とじる','x','pri']])},
  edauto(){deAutoFill(UI.ed.list);UI.ed.dirty=true;snd('summon');deKeepScroll()},
  async edclear(){const ok=await modal('<h3>ぜんぶ外しますか</h3>',[['外す','y','red'],['やめる','n','pri']]);if(ok==='y'){UI.ed.list={};UI.ed.dirty=true;render()}},
  async edrename(){
    let val=UI.ed.name;
    const pr=modal('<h3>デッキの名前</h3><p class="sub">12文字まで</p><input id="dename" class="rkin" maxlength="12" autocomplete="off">',[['決める','ok','pri'],['やめる','x']]);
    const inp=$('#dename');if(inp){inp.value=val;inp.oninput=()=>{val=inp.value};setTimeout(()=>inp.focus(),30)}
    const ok=await pr;const nv=String(val).replace(/[\u0000-\u001f<>&"]/g,'').trim().slice(0,12);
    if(ok==='ok'&&nv){UI.ed.name=nv;UI.ed.dirty=true}render();
  },
  async edsave(){
    const E=UI.ed,L=deLoad(),list={};for(const id in E.list)if(E.list[id]>0)list[id]=E.list[id];
    const i=L.findIndex(d=>d.id===E.id),rec={id:E.id,name:E.name,list};
    if(i>=0)L[i]=rec;else L.push(rec);
    if(!deSave()){await modal('<h3>保存できませんでした</h3><p class="sub">ブラウザの保存領域がいっぱいか、保存が止められています。</p>',[['OK','x','pri']]);return}
    E.dirty=false;deResync();
    const c=deCount(list);
    await modal(deDone(list)?`<h3>保存しました</h3><p class="sub">対戦のデッキ選びで「${esc(E.name)}」がえらべます。</p>`
      :`<h3>保存しました（未完成）</h3><p class="sub">モンスター${c.m}/${DE_M}枚・タクティクス${c.t}/${DE_T}枚です。そろうと対戦で使えるようになります。</p>`,[['OK','x','pri']]);
    UI.screen='decks';render();
  },
  async edback(){
    if(UI.ed.dirty){const v=await modal('<h3>保存せずにもどりますか</h3><p class="sub">変えたところは消えます。</p>',[['もどる','y','red'],['編集をつづける','n','pri']]);if(v!=='y')return}
    UI.ed=null;UI.screen='decks';render();
  }
});
// ＋−のあと、見ていた場所のまま描きなおす
function deKeepScroll(){const g=$('.edscr'),y=g?g.scrollTop:0;render();const h=$('.edscr');if(h)h.scrollTop=y}
