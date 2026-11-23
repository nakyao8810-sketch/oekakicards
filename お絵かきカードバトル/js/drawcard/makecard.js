'use strict';
/* ---- カードにする ---- */
// お絵かきカードの名前は「称号｜もの」の切れ目（d.nb文字目）で折り返す
function nmHTML(d){
  const s=d.sn||'',b=d.my?d.nb:0;
  return b>0&&b<s.length?`<span class="ib">${esc(s.slice(0,b))}</span><span class="ib">${esc(s.slice(b))}</span>`:esc(s);
}
function rkKana(s){return[...s].map(ch=>{const c=ch.charCodeAt(0);return c>=0x3041&&c<=0x3096?String.fromCharCode(c+0x60):ch}).join('')}
function rkTrait(sc){let best='plain',bv=.35;for(const k in RK_TRW)if(sc[k]!=null&&sc[k]>bv){bv=sc[k];best=k}return best}
// 名前のかたちは6通りから選ぶ（8字まで）。返り値は [前, うしろ]（札ではこの間で折り返す）
//  焔牙ネコ／紅蓮のネコ／ブレイズキャット／フレア・キャット／ネコファング／ギガキャット
function rkName(lb,el,tr,r,cost){
  const ja=rkKana(lb?(RK_SHORT[lb.en]||lb.ja):RK_TRW[tr]);
  const isKata=lb&&/^[ァ-ヶー・]+$/.test(lb.ja),en=lb?(RK_EN[lb.en]||(isKata?ja:null)):null;
  const k1=rkPick(r,[...RK_ELC[el]]),k2=rkPick(r,[...RK_TRC[tr]].filter(x=>x!==k1)),k12=rkPick(r,RK_EL2[el]);
  const ele=rkPick(r,RK_ELE[el]),trs=rkPick(r,RK_TRS[tr]),head=cost>=7?rkPick(r,RK_HEAD.big):cost<=1?rkPick(r,RK_HEAD.small):null;
  const C=[[k1+k2,ja],[k12+'の',ja],[ja,trs]];
  if(en){C.push([ele,en],[ele+'・',en]);if(head)C.push([head,en],[head,en])}
  else if(!lb){C.push([ele,trs],[ele+'・',trs]);if(head&&tr!=='big')C.push([head,trs])}
  else if(head)C.push([head,ja]);
  const ok=C.filter(([a,b])=>a.length+b.length<=8&&a!==b);
  return rkPick(r,ok.length?ok:[[k1+k2,ja.slice(0,6)]]);
}
// 共鳴効果・必殺技の強さを ATK+HP の点にしたもの。21体ぜんぶに同じものをつけたデッキで基本デッキ3つと900戦ずつして、
// ATK+HP が1多いデッキとの勝率の差からはかった（2026-11-23。ここにない＝0点）。この分だけ ATK+HP を減らす
const RK_PT={atk1:.6,drAdj:.8,drSelf:.8,gaugeStart:.4,pierce:.3,drawOnDeath:.25,gaugeOnDeath:.2,burnOnDeath:.55,lifeOnDeath:.25,healEnd:.5,regen:.7,thorn:0,lifeStart:.15,haste:.65,
  flare:1.15,drop:.45,starfall:1.4,gigabolt:.5,sanctuary:.1,tsunami:.65,reap:.85,aurora:.1,raikou:.5,gale:1.45,bloom:0};
// 新しい効果（X のあるもの）は X ごとの点 {X:点}。はかっていない X は前後から直線でおぎなう
// 2026-11-23 に同じやり方（基本デッキ3つと900戦ずつ、ATK+HP 1点＝勝率の対数オッズ0.92）ではかった値。
// 21体ぜんぶにつけると強く出すぎる「隣の被ダメ-X」は下げ、山札切れで負けて低く出る「カードを引く」系は上げた
const RK_PT2={
  atkX:{1:.5,2:.85,3:1.3},pierce:.3,reach:{1:.25,2:.05},rush:.5,drX:{1:.7,2:1.8},drAdjX:{1:.8,2:1.8},hpX:{1:.4,2:.75,3:1.15},cover:.5,barrier:1.6,
  killG:{1:.1,2:.2},spTax:{1:.1,2:.25},spHeal:{1:0,2:.05,3:.1},resG:{1:.3,2:.4},healAdj:{1:.35,2:.55},lifeX:{1:.15,2:.25},drawDeathX:{1:.3,2:.55},resDraw:{1:.4,2:.75},flip:.1,hush:.5,
  hit:{1:.6,2:1,3:1.15,4:.7,5:.4,6:.4},blast:{1:1,2:.55,3:.5},shot:{1:0,2:.3,3:.2,4:.15,5:.2},cull:{2:.95,3:1.25,4:.75,5:.5,6:.25},power:{2:.45,4:.5,6:.5},
  rallyA:{1:.1,2:.15,3:.15},rallyB:{1:.3,2:.25},seal:.65,mute:.15,stun:.05,bounce:.3,swap:.5,weak:{1:.2,2:.4,3:.3,4:.3},weakP:{1:.2,2:.2,3:.25},
  mend:{2:.35,4:.3,6:.2},mendAll:{1:.25,2:.2,3:.1,4:.1},prism:0,revive:{2:.2,4:.4,6:.4},study:{1:.3,2:.45,3:.55}};
function rkPtOf(id,x){
  const t=RK_PT2[id];if(t==null)return RK_PT[id]||0;if(typeof t==='number')return t;
  if(t[x]!=null)return t[x];
  const ks=Object.keys(t).map(Number).sort((a,b)=>a-b);
  if(x<=ks[0])return t[ks[0]];if(x>=ks[ks.length-1])return t[ks[ks.length-1]];
  for(let k=1;k<ks.length;k++)if(x<ks[k]){const a=ks[k-1],b=ks[k];return t[a]+(t[b]-t[a])*(x-a)/(b-a)}
  return 0;
}
// かきこみの多さ（0〜1）。線の数・時間・色の数・インクの量
function rkEffort(f){const sc=f.sc;return .35*sc.detail+.2*sc.colorful+.2*rkClamp(f.inkRatio/.25)+.25*rkClamp(f.sec/120)}
// 強そうさ（0〜1）：何の絵か（性質のタグ・おまかせの体のつくり）＋形（トゲ・大きさ）。かきこみの量（線の数・時間・色・ぬり）は入れない
const RK_TAGPOW={claw:.8,horn:.75,poison:.6,spike:.7,shell:.55,heavy:.75,fly:.5,swim:.4,fire:.75,ice:.6,elec:.7,wind:.6,plant:.35,heal:.3,sweet:.15,food:.15,shine:.55,dark:.65,night:.5,
  tech:.6,speed:.5,blade:.8,shoot:.7,tool:.35,sound:.3,home:.45,ball:.3,water:.45,stone:.65,wear:.2,body:.4,treasure:.5,magic:.65,cute:.15,royal:.8,time:.5,bug:.35};
const RK_PLANPOW={dragon:.95,knight:.85,golem:.8,sword:.75,mage:.7,archer:.65,robot:.65,quad:.6,crab:.55,octopus:.55,tree:.55,bat:.5,ghost:.5,bug:.45,babydragon:.45,bird:.4,human:.6,
  fish:.35,jelly:.35,cloud:.3,headbody:.25,pot:.25,mushroom:.25,worm:.2,snail:.2,slime:.2,chibi:.2,turtle:.45,shark:.75,phoenix:.9,snake:.6,spider:.55};
// 演出（0〜1）：おまかせはオーラ・ほのお・いなずまなどの数、手でかいた絵は色の数・ぬり・かきこみ（できあがりのていねいさ）
function rkStage(f,w){const M=w.type==='meta'&&typeof rk!=='undefined'&&rk.meta?rk.meta:null;if(M)return rkClamp(.2+.27*(M.fx||0));const sc=f.sc;return rkClamp(.4*sc.colorful+.3*sc.solid+.3*sc.detail)}
const RK_THEMEPOW={fire:.08,dragon:.08,elec:.06,rock:.05,ghost:.04,water:0,star:0,plant:-.03,fluffy:-.08};
const RK_CMIN=.12,RK_CSPAN=.64,RK_CCURVE=1.4;   // コストの曲線（測って決める）
function rkStrong(w,sc,lb){
  let subj;const M=w.type==='meta'&&typeof rk!=='undefined'&&rk.meta?rk.meta:null;
  if(M)subj=(RK_PLANPOW[M.role]??RK_PLANPOW[M.plan]??.4)+(RK_THEMEPOW[M.tk]||0);
  else{let s=0,k=0;(w.tags||[]).forEach((t,i)=>{const wt=1/(i+1);s+=(RK_TAGPOW[t]??.4)*wt;k+=wt});subj=k?s/k:.4}
  if(lb&&lb.rare)subj+=.1;
  const shape=.6*sc.spiky+.4*sc.big;
  return rkClamp(.8*subj+.2*shape);
}
function rkMakeCard(f,rec){
  const r=rkRng(f.hash),sc=f.sc,conf=rec?rec.top[0].p:0;
  // 何者か（はっきり分かる物／似たものがあるオリジナル／形から作るオリジナル）: naming.js
  const w=rkWho(rec,sc,rkRng(f.hash^0x2545f491),f),lb=w.lb,G=w.g?RK_GROUPS[w.g]:null;
  const el=rkWhoEl(w,f,sc),elWhy='';
  // コスト 1〜9（EMAX）：強そうさ（ドラゴンや騎士は高く、スライムやかたつむりは低い）と演出で決める。運は ±0.5
  // 強そうさ×演出：強そうでも演出がうすいと高くならない。曲線をつけて7以上は出にくい
  const pw=rkStrong(w,sc,lb)*(.5+.5*rkStage(f,w));
  let cost=rkClamp(Math.round(1+8*Math.pow(rkClamp((pw-RK_CMIN)/RK_CSPAN),RK_CCURVE)+(r()-.5)),1,EMAX);
  // 印: トゲ→牙、まるみ・ぬり→盾、つりあい・こだわり→星、やさしい線・色→心（共鳴効果は印に合うものから選ぶので、先に決める）
  const gs=G?G.seal:(w.seal||'');
  // 4つの印が同じくらい出るように（前は盾と牙ばかりで心がほとんど出なかった）
  const ss={fang:sc.spiky*1.1+sc.fast*.5+(gs==='fang'?.5:0),shield:sc.round*.75+sc.solid*.5+(gs==='shield'?.5:0),
    star:sc.sym*.8+sc.detail*.5+(gs==='star'?.5:0),heart:(1-sc.spiky)*.45+sc.colorful*.45+sc.round*.2+(gs==='heart'?.5:0)};
  for(const k in ss)ss[k]+=r()*.45;
  const order=Object.keys(ss).sort((a,b)=>ss[b]-ss[a]);
  let Ls=order[0],Rs=ss[order[0]]-ss[order[1]]>.4?order[0]:order[1];
  // 虹（どれとも共鳴）はめずらしく：コスト5以上で、めずらしい絵・ふしぎな絵・とても色が多い絵だけが少しの確率で。虹の絵は出やすい
  const pr=lb&&lb.en==='rainbow'?.6:Math.min(.35,(lb&&lb.rare?.2:0)+(gs==='rainbow'?.1:0)+(sc.colorful>=.75?.08:0));
  if((cost>=5||(lb&&lb.en==='rainbow'&&cost>=3))&&r()<pr)Rs='rainbow';
  if(r()<.5)[Ls,Rs]=[Rs,Ls];
  // 共鳴効果と必殺技（新しい36個から。moves2.js）。必殺技のゲージは6まで
  const mv=rkMoves5(w,cost,r,sc,Ls,Rs),sp=mv.sp,res=mv.res;
  // ATK/HP: コストごとの合計から、能力と必殺技の強さの点を引く（はしたは運で切り上げ・切り捨て）。それを形と性質でATK寄りかHP寄りかに分ける
  const B=Math.max(2,Math.floor(DRAW_STAT[cost]+DRAW_STAT_K-rkPtOf(res,mv.rx)-(sp?rkPtOf(sp,mv.spx):0)+r()));
  const ln=rkLean(w)*(lb?1:.6);
  const wa=1+1.6*sc.spiky+1.0*sc.fast+.4*sc.colorful+Math.max(0,ln)*.7;
  const wh=1+1.2*sc.round+1.2*sc.solid+.8*sc.big+Math.max(0,-ln)*.7;
  const atk=rkClamp(Math.round(B*wa/(wa+wh)),1,B-1),hp=Math.max(1,B-atk);
  const nm=rkName4(w,el,cost,sc,rkRng(f.hash^0x9e3779b9)),sn=nm[0]+nm[1],nb=nm[0].length;
  const pre='';
  const why=[`ATK/HP：トゲ${Math.round(sc.spiky*100)}・いきおい${Math.round(sc.fast*100)} と まるみ${Math.round(sc.round*100)}・ぬり${Math.round(sc.solid*100)} で分けた`,
    `コスト：線${f.nS}本・${f.sec}秒・${f.colors.length}色${lb&&lb.rare?'・めずらしい絵':''}`,`性質：${w.tags.join('・')}${w.type!=='known'?`（オリジナル：${w.orig}${w.hl?'・'+w.hl.ja+'ににている':''}）`:''}`];
  return{type:'m',id:'u'+Date.now().toString(36)+Math.floor(Math.random()*1e4).toString(36),name:pre+sn,pre,sn,nb,nv:4,stv:2,cost,el,atk,hp,L:Ls,R:Rs,res,rx:mv.rx,sp:sp||undefined,spx:sp?mv.spx:undefined,spg:sp?mv.spg:undefined,spn:mv.spn,resn:mv.resn,
    kind:rkKind(w,el),prof:rkProfile(w,el,res,rkRng(f.hash^0x51ed27)),seen:lb?lb.ja:'',conf:Math.round(conf*100),why,my:true};
}
function rkArtURL(bb){
  const p=Math.max(bb.w,bb.h)*.06,x0=Math.max(0,bb.x-p),y0=Math.max(0,bb.y-p),w=Math.min(512-x0,bb.w+2*p),h=Math.min(512-y0,bb.h+2*p);
  const s=Math.min(200/w,150/h,1.2),c=document.createElement('canvas');c.width=Math.max(1,Math.round(w*s));c.height=Math.max(1,Math.round(h*s));
  const x=c.getContext('2d');x.imageSmoothingQuality='high';x.drawImage(rk.base,x0,y0,w,h,0,0,c.width,c.height);
  return c.toDataURL('image/png');
}

