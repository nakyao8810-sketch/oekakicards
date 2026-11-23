'use strict';
/* ---- 作ったカードの保存とデッキ ---- */
const MYKEY='tr_mycards';
let MY=[];const rkArt={};let rkCss=null;
function rkCssSync(){if(!rkCss){rkCss=document.createElement('style');document.head.appendChild(rkCss)}rkCss.textContent=Object.entries(rkArt).map(([id,u])=>`.a-${id}{background-image:url("${u}")}`).join('\n')}
function rkRegister(d){d.rs=resShort(d);CARDS[d.id]=d;rkArt[d.id]=d.img}
function rkUnregister(id){delete CARDS[id];delete rkArt[id]}
function rkSave(){try{localStorage.setItem(MYKEY,JSON.stringify(MY));return true}catch(e){return false}}
function rkLoad(){
  const okM=d=>EL[d.el]&&IC[d.L]&&IC[d.R]&&RES[d.res],okT=d=>d.type==='t'&&TACK[d.tk]&&d.t&&d.x;
  try{const a=JSON.parse(localStorage.getItem(MYKEY)||'[]');if(Array.isArray(a))MY=a.filter(d=>d&&d.id&&d.img&&(d.type==='t'?okT(d):okM(d)))}catch(e){MY=[]}
  // 前の版の名前（星明かりのねこキラネコ／光のねこ／炎牙ネコ）を今の名前に直す。自分でつけた名前はそのまま
  let fixed=false;
  const lbOf=ja=>RK_LABELS.find(l=>l.ja===ja);
  for(const d of MY)if(!d.nv&&RK_ELC[d.el]){
    const s=d.sn||'',oldPre=d.pre&&RK_OLDPRE.test(d.pre);
    const auto=oldPre?(/^[ァ-ヶー]{2,6}$/.test(s)||s===d.seen||['トゲトゲ','まるまる','らくがき'].includes(s)):(!d.pre&&/^[一-龯]{2}[ァ-ヶー]{1,6}$/.test(s)&&RK_ELC[d.el].includes(s[0]));
    if(!oldPre&&!auto)continue;
    if(auto){const nm=rkName(d.seen?lbOf(d.seen):null,d.el,RK_SEALTR[d.L]||'plain',rkRng(rkHash(d.id)),d.cost);d.sn=nm[0]+nm[1];d.nb=nm[0].length}
    d.pre='';d.name=d.sn;d.nv=3;fixed=true;
  }
  // 前の版のカードには技名・能力名がないので、絵に合った名前だけつける（効果はそのまま）
  const sc0={spiky:0,round:0,solid:0,big:0,fast:0,detail:0,colorful:0,sym:0};
  for(const d of MY)if(d.type!=='t'&&!d.resn){
    const lb=d.seen?lbOf(d.seen):null,r=rkRng(rkHash(d.id)+7),a=rkArch(lb,sc0);
    d.resn=rkResName(a,d.res,lb,sc0,r);if(d.sp&&!d.spn)d.spn=rkSpName(a,d.sp,lb,sc0,r);fixed=true;
  }
  // 2026-11-23 低コストの ATK+HP の基準を下げた（DRAW_STAT。コスト1〜3は−1、4は−0.5）。前に描いたカードも同じだけ下げる
  // （.5 は運で。多いほうから引き、どちらも1は残す。元の数字は st0 に残す）。stv:2 はもう直したカードと新しいカード
  for(const d of MY)if(d.type!=='t'&&!d.stv){
    let n=Math.floor((DRAW_STAT_OLD[d.cost]||0)-(DRAW_STAT[d.cost]||0)+rkRng(rkHash(d.id)+11)());
    d.st0=[d.atk,d.hp];
    while(n>0&&d.atk+d.hp>2){if(d.hp>d.atk)d.hp--;else d.atk--;n--}
    d.stv=2;fixed=true;
  }
  if(fixed)rkSave();
  for(const d of MY)rkRegister(d);rkCssSync();rkSyncDeck();
}
// お絵かきデッキのモンスター21枚のコストの並び（1〜5、6は6以上）と、埋めるのに使う基本カード（各コストに3枚以上あるので、3枚までの決まりでも足りる）
const RK_CURVE=[0,3,5,5,4,2,2];
const RK_FILL=[[],['pikke','goron','puchiru','kolopo'],['pirika','hinoko','imp','marin','moris','fee'],['noxs','gard','luna','jin','raika'],['zekt','ars','orca'],['volga'],['vulcan','celes']];
function rkSyncDeck(){
  DECKS.length=3;
  // モンスターは新しい10種類（ふつうは2枚、コスト1と5以上は1枚）、タクティクスは新しい4種類×2枚（9枚まで）。
  // 足りない分は基本カードで、コストの並び RK_CURVE にいちばん足りないところから埋める（重いカードや軽いカードばかりにならないように）
  const rev=MY.slice().reverse(),use=rev.filter(d=>d.type!=='t').slice(0,10),tuse=rev.filter(d=>d.type==='t').slice(0,4);
  if(!use.length&&!tuse.length){deSync();return}
  const list={},have=[0,0,0,0,0,0,0];const bk=c=>Math.min(c,6);
  for(const d of use){const n=d.cost<=1||d.cost>=5?1:2;list[d.id]=n;have[bk(d.cost)]+=n}
  let m=have.reduce((a,b)=>a+b,0);
  for(;m<21;m++){
    let b=1,bv=-1e9;for(let c=1;c<=6;c++){const v=RK_CURVE[c]-have[c];if(v>bv){bv=v;b=c}}
    const ids=RK_FILL[b].filter(id=>(list[id]||0)<3),id=ids.find(x=>!list[x])||ids[0];
    list[id]=(list[id]||0)+1;have[b]++;
  }
  let t=0;for(const d of tuse){const n=Math.min(2,9-t);if(n>0){list[d.id]=n;t+=n}}
  for(const[id,n]of[['potion',2],['idea',2],['fireball',2],['spring',1],['rally',1],['soulcharge',1]]){const k=Math.min(n,9-t);if(k>0){list[id]=(list[id]||0)+k;t+=k}}
  const cnt={};for(const d of use)cnt[d.el]=(cnt[d.el]||0)+1;
  const els=Object.keys(cnt).sort((a,b)=>cnt[b]-cnt[a]).slice(0,3);
  DECKS.push({name:'お絵かきデッキ',els:els.length?els:['light'],desc:`自分でかいた${[use.length?`モンスター${use.length}種類`:'',tuse.length?`タクティクス${tuse.length}種類`:''].filter(Boolean).join('・')}と、足りない分の基本カード`,list,my:true});
  deSync();
}

