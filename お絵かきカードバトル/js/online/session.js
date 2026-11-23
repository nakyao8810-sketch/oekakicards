'use strict';
/* =========================================================
   オンライン対戦：部屋に入ってから出るまで（保存・再開・試合のつなぎ）
   R は丸ごと保存する：{v,code,seat,sid,peer,sn,rn,out, name,deck, mine,opp,game, gone,bad,t}
     seat 0＝部屋を作った人、1＝入った人。mine/opp＝次の試合の準備、game＝いまの試合の記録
   保存はタブごと（同じブラウザの2つのタブで対戦しても混ざらない）
   ========================================================= */
const OL={R:null,link:null,M:null,q:[],qT:null,ending:false,ask:'',askN:0,pumpT:null,msg:'',saveNG:false,sang:'',code:'',name:'',deck:0};
const OL_SAVE='tr_ol_room_',OL_BEATKEY='tr_ol_beat_',OL_TAB='tr_ol_tab',OL_KEEP=2*24*3600*1000;
const OL_CHARS='23456789ABCDEFGHJKMNPQRSTUVWXYZ';   // まぎらわしい 0 O 1 I L はなし
const OL_INST=olPick(1e9);   // このページの印
try{OL.name=olClean(localStorage.getItem('tr_ol_name')||'',10)}catch(e){}

let olTab='';
function olTabId(){
  if(olTab)return olTab;
  try{olTab=sessionStorage.getItem(OL_TAB)||''}catch(e){}
  if(!/^[0-9a-f]{12}$/.test(olTab))olSetTab(olRand(6));
  return olTab;
}
function olSetTab(id){olTab=id;try{if(id)sessionStorage.setItem(OL_TAB,id);else sessionStorage.removeItem(OL_TAB)}catch(e){}}

/* ---- 保存：同じ絵は1回だけ入れる ---- */
function olZip(R){
  const tbl=[],at=new Map();
  const body=JSON.stringify(R,(k,v)=>{
    if(typeof v!=='string'||v.length<600)return v;
    if(!at.has(v)){at.set(v,tbl.length);tbl.push(v)}
    return{$i:at.get(v)};
  });
  return JSON.stringify({tbl,body});
}
function olUnzip(s){
  try{
    const o=JSON.parse(s),R=JSON.parse(o.body,(k,v)=>v&&typeof v==='object'&&Number.isInteger(v.$i)?o.tbl[v.$i]:v);
    return R&&R.v===OL_VER&&typeof R.code==='string'&&(R.seat===0||R.seat===1)&&Date.now()-R.t<OL_KEEP?R:null;
  }catch(e){return null}
}
function olBeat(gone){
  if(!OL.R)return true;
  const k=OL_BEATKEY+olTabId();
  try{
    const b=JSON.parse(localStorage.getItem(k)||'null');
    if(b&&b.inst!==OL_INST){if(!gone)olDetach();return false}   // ほかのタブが続きを引きついだ
    localStorage.setItem(k,JSON.stringify({inst:OL_INST,t:gone?0:Date.now()}));
  }catch(e){}
  return true;
}
function olSave(){
  if(!OL.R||!olBeat())return;
  const k=OL_SAVE+olTabId();OL.R.t=Date.now();
  try{localStorage.setItem(k,olZip(OL.R));OL.saveNG=false}
  catch(e){
    // 古い記録から再開すると相手とずれるので、残さない
    OL.saveNG=true;try{localStorage.removeItem(k)}catch(e2){}
  }
}
function olForget(){
  try{localStorage.removeItem(OL_SAVE+olTabId());localStorage.removeItem(OL_BEATKEY+olTabId())}catch(e){}
  olSetTab('');
}
// もどれる対戦（ほかのタブで開いている分は出さない）
function olSaves(){
  const out=[];
  try{
    for(const k of Object.keys(localStorage).filter(x=>x.startsWith(OL_SAVE))){
      const id=k.slice(OL_SAVE.length),R=/^[0-9a-f]{12}$/.test(id)?olUnzip(localStorage.getItem(k)):null;
      if(!R){localStorage.removeItem(k);localStorage.removeItem(OL_BEATKEY+id);continue}
      let b=null;try{b=JSON.parse(localStorage.getItem(OL_BEATKEY+id))}catch(e){}
      if(b&&b.inst!==OL_INST&&Date.now()-b.t<10000)continue;
      out.push({id,R});
    }
  }catch(e){}
  return out.sort((a,b)=>b.R.t-a.R.t);
}

/* ---- 部屋 ---- */
function olCanUse(){return!!(window.isSecureContext&&window.crypto&&crypto.subtle&&window.WebSocket)}
function olCodeText(c){return c.slice(0,4)+'-'+c.slice(4)}
function olCodeRead(s){
  const c=String(s).normalize('NFKC').toUpperCase().replace(/[^A-Z0-9]/g,'');
  return c.length===8&&[...c].every(x=>OL_CHARS.includes(x))?c:'';
}
function olNewRoom(seat,code,name,deck){
  return{v:OL_VER,code,seat,sid:olRand(8),peer:'',sn:0,rn:0,out:[],name,deck,mine:null,opp:null,game:null,gone:false,bad:'',t:Date.now()};
}
function olTake(){try{localStorage.setItem(OL_BEATKEY+olTabId(),JSON.stringify({inst:OL_INST,t:Date.now()}))}catch(e){}}
function olOpen(R){
  OL.R=R;OL.M=null;OL.msg='';OL.q=[];OL.ask='';OL.sang='';
  const link=olLink(R,{
    bind:()=>{snd('card');if(!R.game&&!R.mine)olPrepare()},
    msg:m=>{try{olReceive(m)}catch(e){console.error('[online]',e);olBad('相手から読めないデータが届きました')}},
    save:olSave,
    state:olLinkState,
    full:()=>{if(R.game)olPeerLeft();else olExit('online','その部屋はもう2人そろっているか、相手が部屋を作り直しています。')},
    version:()=>olExit('online','相手とゲームの版がちがいます。2人とも同じ新しいファイルで開いてください。'),
    bye:olPeerLeft
  });
  OL.link=link;
  link.ready.catch(e=>{console.error('[online]',e);if(OL.link===link)olExit('online','このブラウザでは通信の準備ができませんでした。')});
}
function olEnter(seat,code,name,deck){
  olDropCards();olTabId();olTake();
  olOpen(olNewRoom(seat,code,name,deck));
  olSave();UI.screen='online';render();
}
function olResume(id,R){
  olSetTab(id);olTake();
  olOpen(R);
  if(!R.game){UI.screen='online';render();return}
  if(olBuild(true)){render();olPump()}
}
// 部屋から出る。to：'title' か 'online'
function olExit(to,msg){
  const link=OL.link,had=!!OL.R;
  clearTimeout(OL.qT);clearTimeout(OL.pumpT);OL.qT=OL.pumpT=null;
  if(had)olForget();
  OL.R=OL.link=OL.M=null;OL.q=[];OL.ending=false;
  if(link)link.leave();
  olCloseModal();olDropCards();
  if(UI.mode==='net'){S=null;UI.mode='cpu';UI.busy=false;UI.sheet=UI.tgt=null;UI.atk=[]}
  OL.msg=msg||'';UI.screen=to;render();
}
// ほかのタブが引きついだ：保存には手をつけずに手をはなす
function olDetach(){
  const link=OL.link;
  OL.R=OL.link=OL.M=null;
  if(link)link.close();
  olSetTab('');
  olExit('online','この対戦は、ほかのタブで続いています。');
}
// 試合の前に相手がいなくなった：同じ部屋番号で待ち直す
function olHostReset(msg){
  const old=OL.R,link=OL.link;
  if(link)link.leave();
  olOpen(olNewRoom(0,old.code,old.name,old.deck));
  OL.msg=msg;olSave();UI.screen='online';render();
}
function olPeerLeft(){
  const R=OL.R;if(!R||R.gone)return;
  if(!R.game){
    if(R.seat===0)olHostReset('相手が出ていきました。');
    else olExit('online','相手が部屋を出ました。');
    return;
  }
  R.gone=true;
  const m={k:'left'},p=1-R.seat;
  if(OL.M&&olStep(OL.M,p,m)==='')R.game.ops.push([p,m]);
  olSave();flush();
}
function olBad(why){
  const R=OL.R;if(!R||R.bad)return;
  R.bad=why;olSave();
  if(OL.M&&UI.screen==='game')render();
  olPump();
}
function olLinkState(){
  const R=OL.R,L=OL.link;if(!R||!L)return;
  if(R.seat===0&&R.peer&&!R.game&&L.quiet()>20000){olHostReset('相手との通信が切れたので、もう一度待っています。');return}
  olStatus();
}

/* ---- 試合の準備：指紋を交換 → 乱数を交換 → はじめ ---- */
function olPrepare(){
  const R=OL.R;
  R.mine=olSecret(R.deck,R.name);
  OL.link.send(olPublic(R.mine));
  olSeed();
}
function olSeed(){
  const R=OL.R;if(!R.mine||!R.opp||R.mine.sent)return;
  R.mine.sent=true;OL.link.send({k:'seed',x:R.mine.x});
}
function olReceive(m){
  const R=OL.R;if(!R||R.bad||!m||typeof m!=='object')return;
  if(m.k==='ready'){
    if(R.opp||!olReadyOK(m)||(OL.M&&OL.M.S.winner==null)){olBad('試合の準備のデータがおかしいです');return}
    R.opp={name:olClean(m.name,10),c:m.c,h:m.h};
    olSeed();olStatus();return;
  }
  if(m.k==='seed'){
    if(!R.mine||!R.mine.sent||!R.opp||typeof m.x!=='string'||olSha(m.x)!==R.opp.h){olBad('先攻を決める乱数が合いません');return}
    R.game={me:R.mine,op:R.opp,x:m.x,ops:[]};R.mine=R.opp=null;
    olCloseModal();
    if(olBuild(false)){snd('coin');render();olPump()}
    return;
  }
  if(!OL.M||m.k==='left'){olBad('知らないデータが届きました');return}
  if(m.k==='quit'){
    if(!olInt(m.got,0,100000)){olBad('降参のデータがおかしいです');return}
    if(!olRewind(m.got))return;
  }
  olAdvance(1-R.seat,m,true);
}
// 降参と入れちがいに打った自分の手は、相手に見えていないので取り消す（2台で同じ結末になる）
function olRewind(got){
  const R=OL.R,ops=R.game.ops;let n=0;
  const keep=ops.filter(([p,m])=>p!==R.seat||m.k==='quit'||n++<got);
  if(keep.length===ops.length)return true;
  R.game.ops=keep;
  return olBuild(false);
}
// 記録から盤面を作る。again：再開
function olBuild(again){
  const R=OL.R;
  try{
    olDropCards();
    OL.M=olMatch(R.game,R.seat);
    for(const[p,m]of R.game.ops){const e=olStep(OL.M,p,m);if(e&&e!=='skip')throw new Error(e)}
  }catch(e){
    console.error('[online] build',e);
    olExit('online','対戦のデータを読みこめませんでした。');return false;
  }
  S=OL.M.S;S.ev=[];
  Object.assign(UI,{mode:'net',screen:'game',seat:R.seat,view:null,sheet:null,tgt:null,atk:[],resultShown:true,reso:null});
  OL.q=[];OL.ending=false;OL.guardAt=0;OL.sang=again&&S.winner!=null?'done':'';
  return true;
}

/* ---- 1手進める ---- */
function olAdvance(p,m,remote){
  const R=OL.R,M=OL.M,turn=S.turnNo,phase=S.phase;
  const err=olStep(M,p,m);
  if(err==='skip')return false;
  if(err){if(remote)olBad(err);else console.warn('[online]',err);return false}
  R.game.ops.push([p,m]);
  if(!remote)OL.link.send(m);
  if(S.winner!=null){OL.q=[];OL.ending=false;UI.tgt=null;UI.sheet=null}
  if(S.turnNo!==turn){UI.tgt=null;snd(S.cur===M.seat?'turn':'turnop')}
  else if(S.phase==='battle'&&phase!=='battle')snd('battle');
  flush();
  return true;
}
function olDo(m){
  if(!OL.M||!OL.R||OL.R.bad)return false;
  const p=OL.M.seat,w=olMakeMove(OL.M,m);
  if(m.k==='quit')w.got=OL.R.game.ops.filter(([q,x])=>q!==p&&x.k!=='left').length;
  return olAdvance(p,w,false);
}
function olAct(a){UI.sheet=null;if(!olDo({k:'act',a}))render()}
function olAttack(list){
  UI.atk=[];UI.sheet=null;OL.q=list.slice();
  olAttackNext();
}
function olAttackNext(){
  clearTimeout(OL.qT);OL.qT=null;
  if(!OL.M||OL.M.pend||S.winner!=null)return;
  while(OL.q.length){
    const i=OL.q.shift(),M=OL.M;
    if(!canAttack(S,M.seat,i))continue;
    if(!olDo({k:'atk',i}))render();return;
  }
  render();
}
async function olEndTurn(){
  if(!myTurn())return;
  const M=OL.M,pl=S.pl[M.seat],n=pl.hand.length-HANDMAX;let u=[];
  if(n>0){
    OL.ending=true;UI.sheet=UI.tgt=null;render();
    u=await pickCards(`手札が${pl.hand.length}枚あります`,pl.hand,n,n,k=>`${k}/${n}枚 捨てる`,`手札は7枚まで。捨てるカードを${n}枚えらんでください`,'捨てる');
    OL.ending=false;
    if(OL.M!==M||S.winner!=null)return;
  }
  UI.sheet=UI.tgt=null;UI.atk=[];
  if(!olDo({k:'end',u}))render();
}
// 描く前に：いま自分が操作できないか
function olSync(){
  const M=OL.M;
  UI.busy=!M||S.winner!=null||S.phase==='setup'||!!M.pend||!!OL.q.length||OL.ending||!!(OL.R&&OL.R.bad);
}

setInterval(()=>{if(OL.R)olBeat()},2000);
window.addEventListener('pagehide',()=>olBeat(true));
window.addEventListener('pageshow',e=>{if(e.persisted&&OL.R)olBeat()});
