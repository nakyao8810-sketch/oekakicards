'use strict';
/* ---- 何の絵か当てる（線だけを黒で28×28にして DoodleNet へ）----
   下手な絵でも当たりやすいように、少しずつ変えた絵（線の太さ・大きさ・かたむき）を何枚か見せて、答えを平均する */
// 1枚の28×28を作る。o: lw=線の太さ（28マスで何マスぶん） fit=絵をおさめる大きさ rot=かたむき（ラジアン） dx,dy=ずらし（マス）
// 線を間引いてまっすぐにする（ふるえた線を、Quick, Draw! の絵と同じくらいすっきりさせる）
function rkSimplify(p,eps){
  if(p.length<3)return p;
  const keep=new Uint8Array(p.length);keep[0]=keep[p.length-1]=1;const st=[[0,p.length-1]];
  while(st.length){const[a,b]=st.pop();const A=p[a],B=p[b],dx=B.x-A.x,dy=B.y-A.y,L=Math.hypot(dx,dy)||1;let mi=-1,md=eps;
    for(let i=a+1;i<b;i++){const d=Math.abs((p[i].x-A.x)*dy-(p[i].y-A.y)*dx)/L;if(d>md){md=d;mi=i}}
    if(mi>=0){keep[mi]=1;st.push([a,mi],[mi,b])}}
  return p.filter((_,i)=>keep[i]);
}
function rkRaster(actions,o){
  if(o.simp){const sz=rkBox(actions);if(sz)actions=actions.map(a=>a.t==='s'&&!a.er?Object.assign({},a,{p:rkSimplify(a.p,o.simp*sz)}):a)}
  const pens=actions.filter(a=>a.t==='s'&&!a.er);
  if(!pens.length)return null;
  let minX=1e9,minY=1e9,maxX=-1e9,maxY=-1e9;
  const cs=Math.cos(o.rot||0),sn=Math.sin(o.rot||0);
  for(const a of pens)for(const q of a.p){if(q.x<minX)minX=q.x;if(q.x>maxX)maxX=q.x;if(q.y<minY)minY=q.y;if(q.y>maxY)maxY=q.y}
  const R=224,k=R/28,s=(o.fit||24)*k/Math.max(maxX-minX,maxY-minY,1),mx=(minX+maxX)/2,my=(minY+maxY)/2;
  const cx=R/2+(o.dx||0)*k,cy=R/2+(o.dy||0)*k;
  const P=q=>{const x=(q.x-mx)*s,y=(q.y-my)*s;return[cx+x*cs-y*sn,cy+x*sn+y*cs]};
  const c=document.createElement('canvas');c.width=c.height=R;const x=c.getContext('2d');
  x.fillStyle='#fff';x.fillRect(0,0,R,R);x.lineCap='round';x.lineJoin='round';
  for(const a of actions){
    if(a.t!=='s')continue;x.strokeStyle=x.fillStyle=a.er?'#fff':'#000';const lw=a.er?a.w*s:(o.lw||1.8)*k;x.lineWidth=lw;const p=a.p;
    if(p.length===1){const[px,py]=P(p[0]);x.beginPath();x.arc(px,py,lw/2,0,Math.PI*2);x.fill();continue}
    x.beginPath();p.forEach((q,i)=>{const[px,py]=P(q);i?x.lineTo(px,py):x.moveTo(px,py)});x.stroke();
  }
  let cur=c;while(cur.width>28){const nn=document.createElement('canvas');nn.width=nn.height=Math.max(28,cur.width/2);nn.getContext('2d').drawImage(cur,0,0,nn.width,nn.height);cur=nn}
  const d=cur.getContext('2d').getImageData(0,0,28,28).data,inp=new Float32Array(784);
  for(let i=0;i<784;i++)inp[i]=1-(d[i*4]+d[i*4+1]+d[i*4+2])/765;
  return inp;
}
function rkBox(actions){let a=1e9,b=1e9,c=-1e9,d=-1e9;for(const s of actions)if(s.t==='s'&&!s.er)for(const q of s.p){if(q.x<a)a=q.x;if(q.x>c)c=q.x;if(q.y<b)b=q.y;if(q.y>d)d=q.y}return c<a?0:Math.max(c-a,d-b)}
// 見せ方の組。はじめの1つがもとの見せ方。ほかは「ふるえた線をまっすぐに」「左右に少しかたむける」
// Quick, Draw! の絵（学習に使っていない約1300枚）で測ると、ふつうの絵 77%→80%、手ぶれさせた絵 68%→72.5%
const RK_TTA=[{},{simp:.02},{rot:.14},{rot:-.14}];
function rkModel(){if(!rk.model)rk.model=DoodleNet.load(DN_WEIGHTS,false,RK_LABELS.length);return rk.model}
// 2つのモデルを合わせる：DN_WEIGHTS は Quick, Draw! の下手な絵・手ぶれした絵で学習し直したもの（345種類の答えに使う）。
// DN_WEIGHTS_X は学習し直す前のもの。ハート・ひと など Quick, Draw! にない35種類は学習データがなく、学習し直すと忘れてしまうので、そこだけこちらの答えを使う
const RK_NQD=345;
function rkModelX(){if(rk.modelX===undefined)rk.modelX=typeof DN_WEIGHTS_X!=='undefined'?DoodleNet.load(DN_WEIGHTS_X,false,RK_LABELS.length):null;return rk.modelX}
function rkPredict(inp){
  const p=rkModel()(inp),mx=rkModelX();if(!mx)return p;
  const px=mx(inp);let ex=0,qn=0;
  for(let i=0;i<p.length;i++)if(i<RK_NQD)qn+=p[i];else ex+=px[i];
  const k=qn>0?(1-ex)/qn:0;for(let i=0;i<p.length;i++)p[i]=i<RK_NQD?p[i]*k:px[i];
  return p;
}
// 平均した確率（N 個）。tta=false ならもとの見せ方だけ
function rkProbs(actions,tta=true){
  if(typeof DoodleNet==='undefined')return null;
  let sum=null,n=0;
  try{
    for(const o of(tta?RK_TTA:[RK_TTA[0]])){
      const inp=rkRaster(actions,o);if(!inp)return null;
      const p=rkPredict(inp);
      if(!sum)sum=new Float32Array(p.length);
      for(let i=0;i<p.length;i++)sum[i]+=p[i];n++;
    }
  }catch(_){return null}
  for(let i=0;i<sum.length;i++)sum[i]/=n;
  return sum;
}
// 結果：top=上位5つ、known=何の絵かはっきりしている、grp=はっきりしないときに一番ありそうななかま（RK_GROUPS の記号）と、その確からしさ
function rkRecognize(actions=rkLive()){
  const probs=rkProbs(actions);if(!probs)return null;
  const top=Array.from(probs,(p,i)=>({p,i})).sort((a,b)=>b.p-a.p).slice(0,5);
  const gs={};for(let i=0;i<probs.length;i++){const g=RK_LABELS[i].g;gs[g]=(gs[g]||0)+probs[i]}
  const gk=Object.keys(gs).sort((a,b)=>gs[b]-gs[a])[0];
  return{top,known:top[0].p>=RK_KNOWN,grp:gk,gp:gs[gk]};
}
// はっきりしている＝一番の答えが30%以上（15%だと、下手な絵の73%で「ちがう物」と言い切っていた → 30%で46%）
// それより下で、上位にそれらしい答え（12%以上）があれば「〜ににたもの」として使う（rkMakeCard）
const RK_KNOWN=.3,RK_HINT=.12;
