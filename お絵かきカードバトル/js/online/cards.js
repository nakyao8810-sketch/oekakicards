'use strict';
/* =========================================================
   オンライン対戦：道具と、やりとりするカード
   相手から届いたものは信用しない。カードはここで1項目ずつ確かめ、ゲームで使う形に作り直す
   ========================================================= */
const OL_VER=8;                           // 通信の版。ルール・カードの数字・通信の形を変えたら上げる（ちがう版どうしは対戦できない）
const OL_ENC=new TextEncoder(),OL_DEC=new TextDecoder();
const olHas=(o,k)=>typeof k==='string'&&Object.prototype.hasOwnProperty.call(o,k);
const olInt=(v,a,b)=>Number.isInteger(v)&&v>=a&&v<=b;
const olHex=b=>[...b].map(x=>x.toString(16).padStart(2,'0')).join('');
const olRand=n=>olHex(crypto.getRandomValues(new Uint8Array(n)));
function olPick(n){const max=Math.floor(2**32/n)*n,a=new Uint32Array(1);do{crypto.getRandomValues(a)}while(a[0]>=max);return a[0]%n}
// 画面にそのまま入るので、記号と見えない文字を取りのぞく
function olClean(v,max){return typeof v==='string'?[...v.replace(/[<>&"'`]|\p{Cc}|\p{Cf}/gu,'')].slice(0,max).join('').trim():''}

// SHA-256（crypto.subtle は待ちが入るので、ルールの処理の中ではこれを使う）
const olSha=(()=>{
  const K=[],H0=[],frac=v=>((v-Math.floor(v))*2**32)>>>0;
  for(let n=2;K.length<64;n++){let ok=true;for(let d=2;d*d<=n;d++)if(n%d===0){ok=false;break}if(!ok)continue;if(H0.length<8)H0.push(frac(Math.sqrt(n)));K.push(frac(Math.cbrt(n)))}
  return str=>{
    const b=OL_ENC.encode(str),n=(((b.length+8)>>6)+1)<<6,m=new Uint8Array(n),v=new DataView(m.buffer);
    m.set(b);m[b.length]=0x80;v.setUint32(n-4,(b.length*8)>>>0);v.setUint32(n-8,Math.floor(b.length/2**29));
    const H=H0.slice(),W=new Uint32Array(64);
    for(let o=0;o<n;o+=64){
      for(let i=0;i<16;i++)W[i]=v.getUint32(o+i*4);
      for(let i=16;i<64;i++){
        const x=W[i-15],y=W[i-2];
        W[i]=W[i-16]+((x>>>7|x<<25)^(x>>>18|x<<14)^x>>>3)+W[i-7]+((y>>>17|y<<15)^(y>>>19|y<<13)^y>>>10);
      }
      let[a,b1,c,d,e,f,g,h]=H;
      for(let i=0;i<64;i++){
        const t1=(h+((e>>>6|e<<26)^(e>>>11|e<<21)^(e>>>25|e<<7))+((e&f)^(~e&g))+K[i]+W[i])>>>0;
        const t2=(((a>>>2|a<<30)^(a>>>13|a<<19)^(a>>>22|a<<10))+((a&b1)^(a&c)^(b1&c)))>>>0;
        h=g;g=f;f=e;e=(d+t1)>>>0;d=c;c=b1;b1=a;a=(t1+t2)>>>0;
      }
      [a,b1,c,d,e,f,g,h].forEach((x,i)=>{H[i]=(H[i]+x)>>>0});
    }
    return H.map(x=>x.toString(16).padStart(8,'0')).join('');
  };
})();

/* ---- カードを送る形にする・受け取った形からもどす ---- */
const OL_BASE=new Set(Object.keys(CARDS).filter(id=>!CARDS[id].my));   // はじめからあるカード（この時点ではお絵かきカードはまだ入っていない）
const OL_TOTAL=DRAW_STAT_MAX.map((v,c)=>Math.max(v,Math.round([0,3,5,6.5,8,9.5,12,14,16,18][c])));   // コストごとの ATK+HP の上限（rkMakeCard と同じ。前の版で作ったカードも通す）
const OL_IMG_MAX=200000;
function olPack(id){
  const d=CARDS[id];if(!d)return null;
  if(OL_BASE.has(id))return JSON.stringify({b:id});
  if(d.type==='t')return JSON.stringify({t:'t',n:d.name,cost:d.cost,tk:d.tk,tn:d.tn,img:d.img});
  return JSON.stringify({t:'m',n:d.name,sn:d.sn,nb:d.nb,cost:d.cost,el:d.el,atk:d.atk,hp:d.hp,L:d.L,R:d.R,res:d.res,rx:d.rx,sp:d.sp,spx:d.spx,spg:d.spg,spn:d.spn,resn:d.resn,kind:d.kind,prof:d.prof,img:d.img});
}
// PNGだけ。大きさは頭の24バイトから読む（小さいデータで巨大な絵を送られないように）
function olImgOK(u){
  if(typeof u!=='string'||u.length>OL_IMG_MAX||!/^data:image\/png;base64,[A-Za-z0-9+/]+={0,2}$/.test(u))return false;
  try{
    const b=atob(u.slice(22,22+32)),n=k=>b.charCodeAt(k)*2**24+(b.charCodeAt(k+1)<<16)+(b.charCodeAt(k+2)<<8)+b.charCodeAt(k+3);
    return b.slice(1,4)==='PNG'&&b.slice(12,16)==='IHDR'&&n(16)>0&&n(16)<=512&&n(20)>0&&n(20)<=512;
  }catch(e){return false}
}
// 返り値 {id,d}。d がなければはじめからあるカード。おかしければ null
function olUnpack(j){
  if(typeof j!=='string'||j.length>OL_IMG_MAX+3000)return null;
  let w;try{w=JSON.parse(j)}catch(e){return null}
  if(!w||typeof w!=='object')return null;
  if(w.b!==undefined)return OL_BASE.has(w.b)?{id:w.b}:null;
  if(!olInt(w.cost,1,EMAX)||!olImgOK(w.img))return null;
  const id='n'+olSha(j).slice(0,20),name=olClean(w.n,24)||'？';
  if(w.t==='t'){
    if(!olHas(RK_TK,w.tk)||!RK_TK[w.tk].lv.some(([n,c])=>n===w.tn&&c===w.cost))return null;
    const T=RK_TK[w.tk];
    return{id,d:{type:'t',id,name,sn:name,cost:w.cost,t:T.t,x:T.x(w.tn),tk:w.tk,tn:w.tn,img:w.img,my:true}};
  }
  if(w.t!=='m'||!olHas(EL,w.el)||!olHas(IC,w.L)||!olHas(IC,w.R)||!olHas(RES,w.res))return null;
  if(w.sp!==undefined&&!olHas(SP,w.sp))return null;
  if(!olInt(w.atk,1,18)||!olInt(w.hp,1,18)||w.atk+w.hp>OL_TOTAL[w.cost])return null;
  // 新しい効果の数字：共鳴効果の X は1〜5、必殺技の X とゲージは SPX の決まりどおりか
  const xRes=olHas(RES_IC,w.res)&&!RES_NOX.has(w.res);
  if(xRes?!olInt(w.rx,1,5):w.rx!==undefined)return null;
  const xSp=w.sp!==undefined&&olHas(SPX,w.sp);
  if(xSp?!(SPX[w.sp].xs.includes(w.spx)&&w.spg===SPX[w.sp].g(w.spx)):(w.spx!==undefined||w.spg!==undefined))return null;
  const d={type:'m',id,name,sn:olClean(w.sn,16)||name,nb:olInt(w.nb,0,16)?w.nb:0,cost:w.cost,el:w.el,atk:w.atk,hp:w.hp,L:w.L,R:w.R,res:w.res,rx:xRes?w.rx:undefined,
    sp:w.sp,spx:xSp?w.spx:undefined,spg:xSp?w.spg:undefined,spn:olClean(w.spn,30)||undefined,resn:olClean(w.resn,30)||undefined,kind:olClean(w.kind,30),prof:olClean(w.prof,200),img:w.img,my:true};
  d.rs=resShort(d);
  return{id,d};
}
// 対戦中だけのカード。列挙されない形で入れるので、カード一覧・デッキ編成・保存には出てこない
const olCardIds=new Set();
function olUseCard(j){
  const u=olUnpack(j);if(!u)return null;
  if(u.d&&!olHas(CARDS,u.id)){
    Object.defineProperty(CARDS,u.id,{value:u.d,configurable:true,enumerable:false});
    olCardIds.add(u.id);rkArt[u.id]=u.d.img;rkCssSync();
  }
  return u.id;
}
function olDropCards(){
  if(!olCardIds.size)return;
  for(const id of olCardIds){delete CARDS[id];delete rkArt[id]}
  olCardIds.clear();rkCssSync();
}
// デッキを30枚分の送る形に。使えなければ {err}
function olDeckCards(deck){
  if(!deck)return{err:'デッキをえらんでください'};
  const j=[];let m=0,t=0;
  for(const id in deck.list){
    const n=deck.list[id],d=CARDS[id];if(!d||!n)continue;
    const p=olPack(id);
    if(!p||!olUnpack(p))return{err:`「${esc(d.name)}」はオンライン対戦に使えないカードです。デッキから外してください`};
    if(n>DE_COPY)return{err:`同じカードは${DE_COPY}枚までです`};
    for(let k=0;k<n;k++)j.push(p);
    if(d.type==='m')m+=n;else t+=n;
  }
  return m===DE_M&&t===DE_T?{j,name:deck.name}:{err:`デッキはモンスター${DE_M}枚・タクティクス${DE_T}枚にしてください`};
}
