'use strict';
/* =========================================================
   ルールエンジン（画面と分けてあるのでCPUの読みにも使う）
   場のモンスター m：uid id dmg buff summoned attacked usedSp と、新しい効果のための
     rz（いま共鳴しているか。「共鳴した瞬間」を見つける）rush（共鳴で速攻を得た）bar（バリア）thp（このターンだけのHP）
     seal（この番まで印が封じられる）sil（この番まで効果が消える）stun（この番はアタックできない）
     wkt・wku（ATK-wkt を wku の番まで）wkp（ずっと ATK-）。番は S.turnNo（2人で通しの数）
   ========================================================= */
const rnd=n=>Math.floor(Math.random()*n);
let UIDC=1;
const D=x=>CARDS[x.id];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=rnd(i+1);[a[i],a[j]]=[a[j],a[i]]}return a}
function buildDeck(list){const a=[];for(const id in list)for(let i=0;i<list[id];i++)a.push({uid:UIDC++,id});return shuffle(a)}
function makeState(decks,names,cpu){
  const pl=[0,1].map(k=>newPlayer(names[k],cpu[k],decks[k],buildDeck(DECKS[decks[k]].list)));
  return newState(pl,rnd(2));
}
function newPlayer(name,cpu,deckNo,deck){
  return{name,cpu,deckNo,life:LIFE0,gauge:0,energy:0,maxE:0,turn:0,
    deck,hand:[],trash:[],lane:[null,null,null],shiftUsed:false,rechargeUsed:false,guardUsed:false,bigSp:false,rbw:0};
}
// オンライン対戦（js/online/match.js）もここから作る
function newState(pl,first){
  const S={pl,cur:first,first,phase:'setup',winner:null,why:'',turnNo:0,ev:[],log:[],st:{rev:0}};
  S.pl[1-S.first].gauge=1;
  // 最初の手札：先攻はHAND0枚、後攻は1枚多い
  S.pl.forEach((pl,k)=>{pl.hand=pl.deck.splice(0,HAND0+(k===S.first?0:1))});
  return S;
}
function cloneS(S){const c=JSON.parse(JSON.stringify(S,(k,v)=>(k==='ev'||k==='log')?undefined:v));c.ev=[];c.log=[];return c}
function lg(S,t,p){S.log.push({t,p});if(S.log.length>150)S.log.shift()}
function E(S,e){S.ev.push(e)}
const mt=(a,b)=>!!a&&!!b&&(a===b||a==='rainbow'||b==='rainbow');
const occ=pl=>[0,1,2].filter(s=>pl.lane[s]);
const newM=(c,summoned)=>({uid:c.uid,id:c.id,dmg:0,buff:0,summoned,attacked:false,usedSp:false});
// 共鳴に使う印。封じられていればなし、「虹の必殺技」のターンは虹
function icon(S,p,i,side){const m=S.pl[p].lane[i];if(!m||m.seal>=S.turnNo)return null;return S.pl[p].rbw===S.turnNo?'rainbow':D(m)[side]}
function rawRes(S,p){
  const l=S.pl[p].lane;
  const k=[!!(l[0]&&l[1]&&mt(icon(S,p,0,'R'),icon(S,p,1,'L'))),!!(l[1]&&l[2]&&mt(icon(S,p,1,'R'),icon(S,p,2,'L')))];
  return{k,res:[k[0],k[0]||k[1],k[1]]};
}
// res＝共鳴しているか、on＝共鳴効果が働くか（必殺技で消されている・向かいの「効果を消す」なら働かない）
function laneInfo(S,p){
  const l=S.pl[p].lane,{k,res}=rawRes(S,p);
  const same=[0,0,0];
  if(k[0]&&D(l[0]).el===D(l[1]).el){same[0]++;same[1]++}
  if(k[1]&&D(l[1]).el===D(l[2]).el){same[1]++;same[2]++}
  const o=S.pl[1-p].lane;let ro=null;
  const on=[0,1,2].map(i=>{
    if(!res[i]||l[i].sil>=S.turnNo)return false;
    const e=o[2-i];
    if(e&&D(e).res==='hush'&&!(e.sil>=S.turnNo)){if(!ro)ro=rawRes(S,1-p);if(ro.res[2-i])return false}
    return true;
  });
  return{k,res,full:k[0]&&k[1],same,on};
}
// この共鳴効果がいま働いているか
const resOn=(S,p,i,id,f)=>{const m=S.pl[p].lane[i];return!!m&&D(m).res===id&&(f||laneInfo(S,p)).on[i]};
function atkOf(S,p,i,noBuff){
  const m=S.pl[p].lane[i];if(!m)return 0;const d=D(m),f=laneInfo(S,p);
  let a=(f.on[i]&&d.res==='flip'?d.hp:d.atk)+(noBuff?0:m.buff);
  if(f.on[i]){if(d.res==='atk1')a++;else if(d.res==='atkX')a+=rxOf(d)}
  a+=f.same[i];
  if(f.full&&i===1)a++;
  a-=(m.wkp||0)+(m.wku>=S.turnNo?m.wkt||0:0);
  return Math.max(0,a);
}
function maxHp(S,p,i){
  const m=S.pl[p].lane[i],d=D(m),f=laneInfo(S,p);
  let h=f.on[i]&&d.res==='flip'?d.atk:d.hp;
  if(f.on[i]&&d.res==='hpX')h+=rxOf(d);
  return h;
}
// 残りHP（このターンだけのHPもふくむ）
function hpLeft(S,p,i){const m=S.pl[p].lane[i];return m?maxHp(S,p,i)-m.dmg+(m.thp||0):0}
function spCost(S,p,i){
  const d=D(S.pl[p].lane[i]);let c=spG(d);
  if(resOn(S,1-p,2-i,'spTax'))c+=rxOf(D(S.pl[1-p].lane[2-i]));
  if(laneInfo(S,p).full)c=Math.max(1,c-1);
  return c;
}
function redu(S,p,i,f){
  const l=S.pl[p].lane;let r=0;
  if(f.on[i]){const d=D(l[i]);if(d.res==='drSelf')r++;else if(d.res==='drX')r+=rxOf(d)}
  for(const j of[i-1,i+1])if(j>=0&&j<3&&l[j]&&f.on[j]){const d=D(l[j]);if(d.res==='drAdj')r++;else if(d.res==='drAdjX')r+=rxOf(d)}
  return r;
}
// ダメージを受ける（軽減のあと）。バリアは1回だけ0にする。このターンだけのHPから先にへる
function takeDmg(S,p,i,n){
  const m=S.pl[p].lane[i];if(!m||n<=0)return 0;
  if(m.bar){m.bar=false;lg(S,`${D(m).sn}のバリアがダメージを防いだ`,p);E(S,{t:'fx',p,s:i,txt:'バリア'});return 0}
  let left=n;if(m.thp){const a=Math.min(m.thp,left);m.thp-=a;left-=a}
  m.dmg+=left;E(S,{t:'dmg',p,s:i,n});return n;
}
function hitMany(S,p,slots,amt){
  const pl=S.pl[p],f=laneInfo(S,p),out=[];
  for(const i of slots){
    const m=pl.lane[i];if(!m)continue;
    const before=hpLeft(S,p,i),d=takeDmg(S,p,i,Math.max(0,amt-redu(S,p,i,f)));
    out.push({i,d,before,dead:hpLeft(S,p,i)<=0,wasRes:f.on[i]});
  }
  for(const r of out)if(r.dead)destroy(S,p,r.i,r.wasRes);
  return out;
}
const hitOne=(S,p,i,amt)=>hitMany(S,p,[i],amt)[0]||null;
const hitAll=(S,p,amt)=>hitMany(S,p,occ(S.pl[p]),amt);
// 撃破。wasRes：そのとき共鳴効果が働いていたか。S.kc：必殺技で倒したときの「倒すとゲージ」
function destroy(S,p,i,wasRes){
  const pl=S.pl[p],o=S.pl[1-p],m=pl.lane[i];if(!m)return;
  if(wasRes===undefined)wasRes=laneInfo(S,p).on[i];
  const d=D(m);
  pl.lane[i]=null;pl.trash.push({uid:m.uid,id:m.id});
  E(S,{t:'kill',p,s:i});lg(S,`${d.sn}が撃破された`,p);
  let g=1;
  // 逆転ボーナス：撃破されたモンスターの持ち主のライフが、相手より5以上少ないときだけ（持ち主に+1）
  if(pl.life<=o.life-5){g++;S.st.rev++;if(S.st.revP)S.st.revP[p]++;else S.st.revP=p?[0,1]:[1,0];
    lg(S,`逆転ボーナス！ ${pl.name}はライフ${pl.life}で、相手（${o.life}）より5以上少ないので、ゲージがさらに+1（あわせて+2）`,p);E(S,{t:'fx',p,s:i,txt:'逆転ボーナス'})}
  addG(S,p,g);addG(S,1-p,1);
  if(S.kc&&S.kc.p!==p){lg(S,`${S.kc.sn}の共鳴効果：倒したのでゲージ+${S.kc.x}`,S.kc.p);addG(S,S.kc.p,S.kc.x)}
  if(wasRes){
    switch(d.res){
      case'drawOnDeath':lg(S,`${d.sn}の共鳴効果：1枚引く`,p);draw(S,p,1);break;
      case'drawDeathX':lg(S,`${d.sn}の共鳴効果：${rxOf(d)}枚引く`,p);draw(S,p,rxOf(d));break;
      case'gaugeOnDeath':lg(S,`${d.sn}の共鳴効果：ゲージ+1`,p);addG(S,p,1);break;
      case'burnOnDeath':lg(S,`${d.sn}の共鳴効果：相手に2ダメージ`,p);hitPlayer(S,1-p,2);break;
      case'lifeOnDeath':lg(S,`${d.sn}の共鳴効果：ライフ+2`,p);healLife(S,p,2);break;
    }
  }
}
function addG(S,p,n){const pl=S.pl[p],b=pl.gauge;pl.gauge=Math.max(0,Math.min(GMAX,pl.gauge+n));if(pl.gauge>b)E(S,{t:'gauge',p,n:pl.gauge-b})}
function win(S,w,why){if(S.winner==null){S.winner=w;S.why=why}}
function hitPlayer(S,p,n){if(n<=0)return;const pl=S.pl[p];pl.life=Math.max(0,pl.life-n);E(S,{t:'life',p,n});if(pl.life<=0)win(S,1-p,`${pl.name}のライフが0になった`)}
function healLife(S,p,n){const pl=S.pl[p],b=pl.life;pl.life=Math.min(LIFE0,pl.life+n);if(pl.life>b)E(S,{t:'lheal',p,n:pl.life-b})}
function healM(S,p,i,n){const m=S.pl[p].lane[i];if(!m)return;const h=Math.min(n,m.dmg);m.dmg-=h;if(h)E(S,{t:'heal',p,s:i,n:h})}
function draw(S,p,n){
  const pl=S.pl[p];let c=0;
  for(let k=0;k<n;k++){
    if(!pl.deck.length){win(S,1-p,`${pl.name}の山札が0枚で、カードを引けなかった`);break}
    pl.hand.push(pl.deck.shift());c++;
  }
  if(c)E(S,{t:'draw',p,n:c});
}
// 必殺技でつける印（封印・効果けし・すくみ）。次の相手の番（S.turnNo+1）まで
function spMark(S,p,i,k,txt){const m=S.pl[p].lane[i];if(!m)return;m[k]=S.turnNo+1;lg(S,`${D(m).sn}に「${txt}」`,1-p);E(S,{t:'fx',p,s:i,txt})}
// 手札にもどす（撃破ではないのでゲージは増えない）
function bounceM(S,p,i){const pl=S.pl[p],m=pl.lane[i];if(!m)return;pl.lane[i]=null;pl.hand.push({uid:m.uid,id:m.id});lg(S,`${D(m).sn}が手札にもどった`,p);E(S,{t:'fx',p,s:i,txt:'手札へ'})}
// トラッシュから出す（出たばかりあつかい）
function reviveM(S,p,uid,s){
  const pl=S.pl[p],k=pl.trash.findIndex(c=>c.uid===uid);if(k<0||pl.lane[s])return;
  const c=pl.trash.splice(k,1)[0];pl.lane[s]=newM(c,true);
  lg(S,`${D(c).sn}がトラッシュから${SLOTN[s]}によみがえった`,p);E(S,{t:'summon',p,s});
}
/* ---- 盤面が変わったあとの後しまつ ----
   1) 共鳴が切れて HP が足りなくなったモンスター（HP+X・ATKとHPの入れ替え）を倒す
   2) 新しく共鳴したモンスターの「共鳴した瞬間」の効果 */
function settle(S){
  for(let n=0;n<12&&S.winner==null;n++){
    let any=false;
    for(const p of[S.cur,1-S.cur])for(let i=0;i<3;i++)if(S.pl[p].lane[i]&&hpLeft(S,p,i)<=0){destroy(S,p,i);any=true}
    if(!any)break;
  }
  for(const p of[S.cur,1-S.cur]){
    const f=laneInfo(S,p);
    for(let i=0;i<3;i++){
      const m=S.pl[p].lane[i];if(!m)continue;const now=f.res[i];
      if(now&&!m.rz&&f.on[i]&&S.winner==null)resoNow(S,p,i);
      m.rz=now;
    }
  }
}
function resoNow(S,p,i){
  const m=S.pl[p].lane[i],d=D(m),x=rxOf(d);
  switch(d.res){
    case'rush':m.rush=true;if(m.summoned){lg(S,`${d.sn}の共鳴効果：このターンにアタックできる`,p);E(S,{t:'fx',p,s:i,txt:'速攻'})}break;
    case'barrier':if(!m.bar){m.bar=true;lg(S,`${d.sn}の共鳴効果：バリア`,p);E(S,{t:'fx',p,s:i,txt:'バリア'})}break;
    case'resG':lg(S,`${d.sn}の共鳴効果：ゲージ+${x}`,p);addG(S,p,x);break;
    case'resDraw':lg(S,`${d.sn}の共鳴効果：${x}枚引く`,p);draw(S,p,x);break;
  }
}
/* ---- 行動 ---- */
function sumSlots(S,p){const l=S.pl[p].lane;const e=[0,1,2].filter(i=>!l[i]);return e.length?{slots:e,rep:false}:{slots:[0,1,2],rep:true}}
function doSummon(S,p,uid,s){
  const pl=S.pl[p],hi=pl.hand.findIndex(c=>c.uid===uid);if(hi<0)return false;
  const c=pl.hand[hi],d=D(c);
  if(d.type!=='m'||pl.energy<d.cost||!sumSlots(S,p).slots.includes(s))return false;
  pl.hand.splice(hi,1);pl.energy-=d.cost;
  if(pl.lane[s]){const o=pl.lane[s];pl.trash.push({uid:o.uid,id:o.id});lg(S,`${D(o).sn}をトラッシュに送って入れ替え召喚`,p)}
  pl.lane[s]=newM(c,true);
  lg(S,`${d.sn}を${SLOTN[s]}に召喚`,p);E(S,{t:'summon',p,s});
  settle(S);return true;
}
function doMove(S,p,a,b){const l=S.pl[p].lane;if(a==null||b==null||a===b)return;[l[a],l[b]]=[l[b],l[a]];lg(S,`${SLOTN[a]}と${SLOTN[b]}を入れ替え`,p);E(S,{t:'move',p});settle(S)}
function doShift(S,p,a,b){const pl=S.pl[p];if(pl.shiftUsed||pl.gauge<SHIFT_G)return false;pl.gauge-=SHIFT_G;pl.shiftUsed=true;lg(S,'シフト（1G）',p);doMove(S,p,a,b);return true}
function doRecharge(S,p){const pl=S.pl[p];if(pl.rechargeUsed||pl.gauge<RECH_G)return false;pl.gauge-=RECH_G;pl.rechargeUsed=true;lg(S,`リチャージ（${RECH_G}G）：2枚引く`,p);E(S,{t:'banner',txt:'リチャージ',sub:'カードを2枚引く',p});draw(S,p,2);return true}
function doTactic(S,p,uid,tg,tg2){
  const pl=S.pl[p],hi=pl.hand.findIndex(c=>c.uid===uid);if(hi<0)return false;
  const c=pl.hand[hi],d=D(c);if(d.type!=='t'||pl.energy<d.cost)return false;
  pl.hand.splice(hi,1);pl.energy-=d.cost;pl.trash.push(c);
  lg(S,`タクティクス「${d.name}」`,p);E(S,{t:'banner',txt:d.name,sub:d.x,p,id:c.id});
  if(TACF[c.id])TACF[c.id](S,p,tg,tg2);else if(TACK[d.tk])TACK[d.tk](S,p,tg,tg2,d.tn);
  settle(S);return true;
}
function doSpecial(S,p,i,tg){
  const pl=S.pl[p],m=pl.lane[i];if(!m)return false;const d=D(m),sp=SP[d.sp];
  const cost=spCost(S,p,i),f=laneInfo(S,p);
  pl.gauge-=cost;m.usedSp=true;if(spG(d)>=5)pl.bigSp=true;
  lg(S,`${d.sn}の必殺技「${spName(d)}」（${cost}G）`,p);E(S,{t:'banner',txt:spName(d),sub:`${d.sn}の必殺技　${spText(d)}`,p,id:m.id});
  S.kc=f.on[i]&&d.res==='killG'?{p,x:rxOf(d),sn:d.sn}:null;
  sp.f(S,p,i,tg,f.full,d.spx);
  S.kc=null;
  if(pl.lane[i]===m&&resOn(S,p,i,'spHeal')&&m.dmg>0){lg(S,`${d.sn}の共鳴効果：HP${rxOf(d)}回復`,p);healM(S,p,i,rxOf(d))}
  settle(S);return true;
}
function applyAction(S,p,a){
  switch(a.k){
    case'summon':return doSummon(S,p,a.uid,a.s);
    case'tactic':return doTactic(S,p,a.uid,a.tg,a.tg2);
    case'sp':return doSpecial(S,p,a.i,a.tg);
    case'shift':return doShift(S,p,a.a,a.b);
    case'recharge':return doRecharge(S,p);
  }
}
/* ---- 使えるかチェック（空文字ならOK）---- */
// d：そのタクティクスのカード（enemyLow＝残りHPが tn 以下、enemyCost＝コストが tn 以下 の相手だけ）
function tacTargets(S,p,t,d){
  const me=S.pl[p],o=S.pl[1-p],n=d&&d.tn!=null?d.tn:0;
  switch(t){
    case'own':return occ(me).map(s=>[s]);
    case'enemy':return occ(o).map(s=>[s]);
    case'enemyLow':return occ(o).filter(s=>hpLeft(S,1-p,s)<=n).map(s=>[s]);
    case'enemyCost':return occ(o).filter(s=>D(o.lane[s]).cost<=n).map(s=>[s]);
    case'move':{const r=[];for(const a of occ(me))for(let b=0;b<3;b++)if(b!==a&&!(me.lane[b]&&b<a))r.push([a,b]);return r}
    case'allEnemy':return occ(o).length?[[null]]:[];
    default:return[[null]];
  }
}
// 必殺技の対象。d はそのモンスターのカード（X を使う技のため）。enemy2 は [a,b]、trash は [uid,スロット]
function spTargets(S,p,t,d){
  const me=S.pl[p],o=S.pl[1-p];
  switch(t){
    case'enemy':return occ(o);
    case'enemyLow':{const x=d&&d.spx!=null?d.spx:4;return occ(o).filter(s=>hpLeft(S,1-p,s)<=x)}
    case'own':return occ(me);
    case'allEnemy':return occ(o).length?[null]:[];
    case'enemy2':{const a=occ(o),r=[];for(let x=0;x<a.length;x++)for(let y=x+1;y<a.length;y++)r.push([a[x],a[y]]);return r}
    case'trash':{
      const e=[0,1,2].filter(s=>!me.lane[s]),x=d?d.spx:0,r=[];if(!e.length)return r;
      for(const c of me.trash){const cd=c.id!=null&&CARDS[c.id];if(cd&&cd.type==='m'&&cd.cost<=x)for(const s of e)r.push([c.uid,s])}
      return r;
    }
    default:return[null];
  }
}
const spTg=(S,p,i)=>{const d=D(S.pl[p].lane[i]);return spTargets(S,p,SP[d.sp].t,d)};
function mainCheck(S,p){return(S.cur!==p||S.phase!=='main')?'メインフェイズに使えます':''}
function cardCheck(S,p,c){
  const r=mainCheck(S,p);if(r)return r;const d=D(c);
  if(S.pl[p].energy<d.cost)return'エナジーが足りない';
  if(d.type==='t'&&!tacTargets(S,p,d.t,d).length)return'対象がいない';
  return'';
}
function spCheck(S,p,i){
  const pl=S.pl[p],m=pl.lane[i];if(!m)return'?';const d=D(m);
  if(!d.sp)return'必殺技はない';
  const r=mainCheck(S,p);if(r)return r;
  if(m.usedSp)return'このターンはもう使った';
  if(spG(d)>=5&&pl.bigSp)return'コスト5以上の必殺技は1ターンに1回';
  if(pl.gauge<spCost(S,p,i))return'ゲージが足りない';
  if(!spTg(S,p,i).length)return'対象がいない';
  return'';
}
// 出たばかりでアタックできない（共鳴中の「速攻」、または共鳴した瞬間に速攻を得ていれば、出たターンでもアタックできる）
function fresh(S,p,i){const m=S.pl[p].lane[i];return!!m&&m.summoned&&!m.rush&&!resOn(S,p,i,'haste')}
function canAttack(S,p,i){const m=S.pl[p].lane[i];return!!m&&S.cur===p&&S.phase==='battle'&&!fresh(S,p,i)&&!m.attacked&&m.stun!==S.turnNo}
function anyReady(S,p){return[0,1,2].some(i=>{const m=S.pl[p].lane[i];return m&&!fresh(S,p,i)&&!m.attacked&&m.stun!==S.turnNo})}
function canGuard(S,d){const pl=S.pl[d];return pl.gauge>=GUARD_G&&!pl.guardUsed}
// このアタックをガードできるか：ガードはプレイヤーへのダイレクトアタックだけ（2026-11-24 ユーザー指示）。
// p：アタックする側、t：アタックする列、cov：かばうモンスター（かばえばモンスターへのアタックになるのでガードできない）
function guardOK(S,p,t,cov){return cov==null&&!S.pl[1-p].lane[t]&&canGuard(S,1-p)}
// アタックできる列（ふつうは向かいだけ。共鳴中の「どの列にも」なら相手モンスターのいる列も）
function atkTargets(S,p,i){
  const t=2-i;if(!resOn(S,p,i,'reach'))return[t];
  return[t,...occ(S.pl[1-p]).filter(s=>s!==t)];
}
// アタックのダメージ（向かい以外へは「どの列にも」の -X）
function atkDmg(S,p,i,t){const a=atkOf(S,p,i);return t!==2-i&&resOn(S,p,i,'reach')?Math.max(0,a-rxOf(D(S.pl[p].lane[i]))):a}
// 列 t へのアタックを代わりに受けられる、守る側のモンスター（となりの列の「かばう」）
function coverOpts(S,p,t){const d=1-p,f=laneInfo(S,d);return[t-1,t+1].filter(c=>c>=0&&c<3&&resOn(S,d,c,'cover',f))}
// guard：ガードする　tgt：アタックする列（なければ向かい）　cov：かばうモンスターの列
function doAttack(S,p,i,guard,tgt,cov){
  const pl=S.pl[p],o=S.pl[1-p],m=pl.lane[i];if(!m)return;const d=D(m);
  m.attacked=true;
  let t=2-i;if(tgt!=null&&atkTargets(S,p,i).includes(tgt))t=tgt;
  E(S,{t:'atk',p,s:i});
  if(cov!=null&&coverOpts(S,p,t).includes(cov)){lg(S,`${D(o.lane[cov]).sn}がかばった！`,1-p);E(S,{t:'fx',p:1-p,s:cov,txt:'かばう'});t=cov}
  let dmg=atkDmg(S,p,i,t);
  const pierce=resOn(S,p,i,'pierce');
  const em=o.lane[t];
  if(guard&&!em&&canGuard(S,1-p)){o.gauge-=GUARD_G;o.guardUsed=true;dmg=Math.max(0,dmg-GUARD_CUT);E(S,{t:'guard',p:1-p});lg(S,`${o.name}はガード！ ダメージ-3`,1-p)}
  if(em){
    lg(S,`${d.sn}のアタック → ${D(em).sn}`,p);
    // 反撃：アタックされたモンスターも自分のATKぶんを返す（同時に当たる。倒されても返す）
    const fo=laneInfo(S,1-p),fm=laneInfo(S,p);
    const catk=atkOf(S,1-p,t);
    const kA=fm.on[i]&&d.res==='killG'?rxOf(d):0,kE=fo.on[t]&&D(em).res==='killG'?rxOf(D(em)):0;
    const before=hpLeft(S,1-p,t),d1=takeDmg(S,1-p,t,Math.max(0,dmg-redu(S,1-p,t,fo)));
    if(catk>0){const d2=takeDmg(S,p,i,Math.max(0,catk-redu(S,p,i,fm)));lg(S,`${D(em).sn}の反撃！ ${d.sn}に${d2}ダメージ`,1-p)}
    // トゲ：アタックされたら1ダメージ返す（被ダメ-1で消える）
    if(fo.on[t]&&D(em).res==='thorn'){const d3=takeDmg(S,p,i,Math.max(0,1-redu(S,p,i,fm)));lg(S,`${D(em).sn}のトゲ！ ${d.sn}に${d3}ダメージ`,1-p)}
    const deadE=hpLeft(S,1-p,t)<=0,deadA=hpLeft(S,p,i)<=0;
    if(deadE)destroy(S,1-p,t,fo.on[t]);
    if(deadA)destroy(S,p,i,fm.on[i]);
    if(deadE&&kA){lg(S,`${d.sn}の共鳴効果：倒したのでゲージ+${kA}`,p);addG(S,p,kA)}
    if(deadA&&kE){lg(S,`${D(em).sn}の共鳴効果：倒したのでゲージ+${kE}`,1-p);addG(S,1-p,kE)}
    if(deadE&&pierce){const ov=d1-before;if(ov>0){lg(S,`貫通！ 相手に${ov}ダメージ`,p);hitPlayer(S,1-p,ov)}}
  }else{lg(S,`${d.sn}のダイレクトアタック！ ${dmg}ダメージ`,p);hitPlayer(S,1-p,dmg)}
  settle(S);
}
/* ---- ターン ---- */
function startTurn(S){
  const p=S.cur,pl=S.pl[p],o=S.pl[1-p];
  pl.turn++;S.turnNo++;pl.maxE=Math.min(EMAX,pl.turn);pl.energy=pl.maxE;
  pl.shiftUsed=pl.rechargeUsed=pl.bigSp=false;o.guardUsed=false;
  for(const m of pl.lane)if(m){m.summoned=false;m.attacked=false;m.usedSp=false;m.buff=0;m.rush=false}
  S.phase='main';lg(S,`── ${pl.name}のターン${pl.turn} ──`,-1);
  if(!(p===S.first&&pl.turn===1))draw(S,p,1);
  if(S.winner!=null)return;
  settle(S);if(S.winner!=null)return;   // 封印などが切れて共鳴しなおす
  const f=laneInfo(S,p);
  for(let i=0;i<3;i++){const m=pl.lane[i];if(m&&f.on[i]&&D(m).res==='gaugeStart'){lg(S,`${D(m).sn}の共鳴効果：ゲージ+1`,p);addG(S,p,1)}}
  for(let i=0;i<3;i++){const m=pl.lane[i];if(!m||!f.on[i]||pl.life>=LIFE0)continue;const d=D(m);
    if(d.res==='lifeStart'){lg(S,`${d.sn}の共鳴効果：ライフ+1`,p);healLife(S,p,1)}
    else if(d.res==='lifeX'){lg(S,`${d.sn}の共鳴効果：ライフ+${rxOf(d)}`,p);healLife(S,p,rxOf(d))}}
}
function canBattle(S){return!(S.cur===S.first&&S.pl[S.cur].turn===1)}
function endPhase(S){
  const p=S.cur,pl=S.pl[p],f=laneInfo(S,p);
  for(let i=0;i<3;i++){const m=pl.lane[i];if(m&&f.on[i]&&D(m).res==='healEnd'){lg(S,`${D(m).sn}の共鳴効果：みんなHP1回復`,p);for(let j=0;j<3;j++)healM(S,p,j,1)}}
  for(let i=0;i<3;i++){const m=pl.lane[i];if(m&&f.on[i]&&D(m).res==='regen'&&m.dmg>0){lg(S,`${D(m).sn}の共鳴効果：HP2回復`,p);healM(S,p,i,2)}}
  for(let i=0;i<3;i++){const m=pl.lane[i];if(!m||!f.on[i]||D(m).res!=='healAdj')continue;const x=rxOf(D(m));
    const adj=[i-1,i+1].filter(j=>j>=0&&j<3&&pl.lane[j]&&pl.lane[j].dmg>0);
    if(adj.length){lg(S,`${D(m).sn}の共鳴効果：となりのHP${x}回復`,p);for(const j of adj)healM(S,p,j,x)}}
  for(const m of pl.lane)if(m){m.buff=0;m.thp=0}
  settle(S);
  S.phase='end';
}
function discard(S,p,uids){const pl=S.pl[p];for(const u of uids){const k=pl.hand.findIndex(c=>c.uid===u);if(k>=0)pl.trash.push(pl.hand.splice(k,1)[0])}if(uids.length)lg(S,`手札を${uids.length}枚捨てた`,p)}
function nextTurn(S){S.cur=1-S.cur;startTurn(S)}
function mulligan(S,p,uids){
  const pl=S.pl[p];if(!uids.length){lg(S,`${pl.name}は引き直さなかった`,p);return}
  const back=[];for(const u of uids){const k=pl.hand.findIndex(c=>c.uid===u);if(k>=0)back.push(pl.hand.splice(k,1)[0])}
  pl.deck.push(...back);pl.hand.push(...pl.deck.splice(0,back.length));
  lg(S,`${pl.name}は${back.length}枚引き直した`,p);
}
