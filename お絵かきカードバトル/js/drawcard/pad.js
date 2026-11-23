'use strict';
/* ---- お絵かきの紙 ---- */
// tool: pen / fill / eraser / cut（線を1本消す） / line / circle / rect / tri / star / heart
// tpl: おてほんの番号（-1でなし）　sm: 手ぶれ補正（0なし 1ふつう 2つよい）　mirror: 左右対称　redo: もどした線
// actions の中身：t='s' 線（er=けしゴム、g=左右対称の組の番号、mr=左右対称で写した側）、t='fill' ぬりつぶし、t='hide' 線けしで消した線（refs）
// col: いまのペンの色（#rrggbb）。カラーパレットで自由にえらべる（属性などは analyze.js でいちばん近い基本の色 RK_PENS にまとめる）
const rk={actions:[],redo:[],cur:null,tool:'pen',col:'#2b2b2b',size:2,t0:null,base:null,bctx:null,pad:null,pctx:null,raf:0,busy:false,model:null,tpl:-1,sm:1,mirror:false,snap:true,gid:0,snapT:0,kind:'m'};   // snap: ととのえ（線のさいごで指を止めると形をととのえる）   // kind: 作るカード m=モンスター t=タクティクス
const RK_SHAPES={line:1,circle:1,rect:1,tri:1,star:1,heart:1};
const RK_SMK=[1,.45,.25];   // 手ぶれ補正：指の位置にどれだけ近づくか（小さいほどなめらか）
function rkInit(){if(rk.base)return;rk.base=document.createElement('canvas');rk.base.width=rk.base.height=512;rk.bctx=rk.base.getContext('2d',{willReadFrequently:true})}
// いま見えている線とぬりつぶし（線けしで消したものと、消した記録をのぞく）
function rkLive(){const hid=new Set();for(const a of rk.actions)if(a.t==='hide')a.refs.forEach(x=>hid.add(x));return rk.actions.filter(a=>a.t!=='hide'&&!hid.has(a))}
function rkStroke(ctx,a){
  const p=a.p;if(!p.length)return;
  ctx.save();ctx.globalCompositeOperation=a.er?'destination-out':'source-over';
  ctx.strokeStyle=ctx.fillStyle=a.er?'#000':a.c;ctx.lineWidth=a.w;ctx.lineCap='round';ctx.lineJoin='round';
  ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);
  if(p.length<3){const q=p[p.length-1];if(p.length===1||Math.hypot(q.x-p[0].x,q.y-p[0].y)<.5){ctx.arc(p[0].x,p[0].y,a.w/2,0,Math.PI*2);ctx.fill()}else{ctx.lineTo(q.x,q.y);ctx.stroke()}}
  else if(a.poly){for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);ctx.stroke()}
  else{for(let i=1;i<p.length-1;i++)ctx.quadraticCurveTo(p[i].x,p[i].y,(p[i].x+p[i+1].x)/2,(p[i].y+p[i+1].y)/2);const q=p[p.length-1];ctx.lineTo(q.x,q.y);ctx.stroke()}
  ctx.restore();
}
function rkFill(ctx,x,y,hex){
  const W=512,H=512;x=rkClamp(x|0,0,W-1);y=rkClamp(y|0,0,H-1);
  const img=ctx.getImageData(0,0,W,H),d=img.data,i0=(y*W+x)*4,tr=d[i0],tg=d[i0+1],tb=d[i0+2],ta=d[i0+3];
  const fr=parseInt(hex.slice(1,3),16),fg=parseInt(hex.slice(3,5),16),fb=parseInt(hex.slice(5,7),16),clear=ta<128;
  if(!clear&&Math.abs(tr-fr)+Math.abs(tg-fg)+Math.abs(tb-fb)<12)return;
  const match=i=>clear?d[i+3]<128:(d[i+3]>=128&&Math.abs(d[i]-tr)+Math.abs(d[i+1]-tg)+Math.abs(d[i+2]-tb)<90);
  const mask=new Uint8Array(W*H),st=[y*W+x];
  while(st.length){const k=st.pop();if(mask[k]||!match(k*4))continue;mask[k]=1;const px=k%W,py=(k/W)|0;if(px>0)st.push(k-1);if(px<W-1)st.push(k+1);if(py>0)st.push(k-W);if(py<H-1)st.push(k+W)}
  if(clear){
    let m=mask;
    for(let pass=0;pass<2;pass++){const n=new Uint8Array(W*H);for(let k=0;k<W*H;k++){if(!m[k])continue;n[k]=1;const px=k%W;if(px>0)n[k-1]=1;if(px<W-1)n[k+1]=1;if(k>=W)n[k-W]=1;if(k<W*(H-1))n[k+W]=1}m=n}
    const layer=new ImageData(W,H),ld=layer.data;
    for(let k=0;k<W*H;k++)if(m[k]){const i=k*4;ld[i]=fr;ld[i+1]=fg;ld[i+2]=fb;ld[i+3]=255}
    const tmp=document.createElement('canvas');tmp.width=W;tmp.height=H;tmp.getContext('2d').putImageData(layer,0,0);
    ctx.save();ctx.globalCompositeOperation='destination-over';ctx.drawImage(tmp,0,0);ctx.restore();
  }else{for(let k=0;k<W*H;k++)if(mask[k]){const i=k*4;d[i]=fr;d[i+1]=fg;d[i+2]=fb}ctx.putImageData(img,0,0)}
}
// t='poly'：形の中を色でぬる（おまかせでかく絵で使う。重ねる順にぬるので、ぬりつぶしのようなすき間やにじみが出ない）
function rkPolyFill(ctx,a){const p=a.p;if(p.length<3)return;ctx.save();ctx.fillStyle=a.c;ctx.beginPath();ctx.moveTo(p[0].x,p[0].y);for(let i=1;i<p.length;i++)ctx.lineTo(p[i].x,p[i].y);ctx.closePath();ctx.fill();ctx.restore()}
function rkApply(ctx,a){if(a.t==='fill')rkFill(ctx,a.x,a.y,a.c);else if(a.t==='poly')rkPolyFill(ctx,a);else if(a.t==='s')rkStroke(ctx,a)}
// 左右対称で写した線（紙のまん中が軸）
const rkMirrorOf=a=>Object.assign({},a,{p:a.p.map(q=>({x:Math.round((512-q.x)*10)/10,y:q.y,t:q.t})),mr:true});
// 方眼（紙といっしょにズームするので、キャンバスにかく）
function rkGrid(c){c.save();c.strokeStyle='rgba(60,90,120,.13)';c.lineWidth=1;c.beginPath();for(let i=1;i<20;i++){const v=Math.round(i*25.6)+.5;c.moveTo(v,0);c.lineTo(v,512);c.moveTo(0,v);c.lineTo(512,v)}c.stroke();c.restore()}
function rkPaint(){
  rk.raf=0;if(!rk.pctx)return;const c=rk.pctx;c.clearRect(0,0,512,512);rkGrid(c);rkDrawTpl(c);c.drawImage(rk.base,0,0);
  // 左右対称の線と、写した側の下書き（おまかせでかいているあいだは出さない）
  const mir=rk.mirror&&!rk.auto;
  if(mir){c.save();c.strokeStyle='rgba(47,111,196,.45)';c.lineWidth=2;c.setLineDash([10,8]);c.beginPath();c.moveTo(256,0);c.lineTo(256,512);c.stroke();c.restore()}
  if(rk.cur){rkStroke(c,rk.cur);if(mir)rkStroke(c,rkMirrorOf(rk.cur))}
}
function rkSchedule(){if(!rk.raf)rk.raf=requestAnimationFrame(rkPaint)}
function rkRebuild(){rk.bctx.clearRect(0,0,512,512);for(const a of rkLive())rkApply(rk.bctx,a);rkPaint()}
function rkClear(){rk.actions=[];rk.redo=[];rk.cur=null;rk.t0=null;rk.meta=null;rkRebuild();rkToolsUI()}   // meta：おまかせでかいた絵のなかみ（random.js）
// 図形：押したところから今の指の位置までの箱の中に、ふつうのペンの線（点の列）として作る
function rkShapePts(kind,a,b){
  const t0=a.t,t1=Math.max(b.t,a.t+1),pts=[];
  const add=(x,y,k,n)=>pts.push({x:Math.round(x*10)/10,y:Math.round(y*10)/10,t:Math.round(t0+(t1-t0)*k/n)});
  if(kind==='line'){add(a.x,a.y,0,1);add(b.x,b.y,1,1);return pts}
  const x0=Math.min(a.x,b.x),x1=Math.max(a.x,b.x),y0=Math.min(a.y,b.y),y1=Math.max(a.y,b.y),cx=(x0+x1)/2,cy=(y0+y1)/2,rx=(x1-x0)/2,ry=(y1-y0)/2;
  const poly=c=>{c.forEach(([x,y],i)=>add(x,y,i,c.length-1));return pts};
  if(kind==='rect')return poly([[x0,y0],[x1,y0],[x1,y1],[x0,y1],[x0,y0]]);
  if(kind==='tri')return poly([[cx,y0],[x1,y1],[x0,y1],[cx,y0]]);
  if(kind==='star'){const c=[];for(let i=0;i<=10;i++){const q=-Math.PI/2+i*Math.PI/5,r=i%2?.42:1;c.push([cx+Math.cos(q)*rx*r,cy+Math.sin(q)*ry*r*1.05+ry*.05])}return poly(c)}
  if(kind==='heart'){const n=48;for(let i=0;i<=n;i++){const t=Math.PI*2*i/n,x=16*Math.sin(t)**3,y=-(13*Math.cos(t)-5*Math.cos(2*t)-2*Math.cos(3*t)-Math.cos(4*t));add(cx+x/16*rx,cy+(y+1.5)/15.5*ry,i,n)}return pts}
  const n=48;for(let i=0;i<=n;i++){const q=-Math.PI/2+i/n*Math.PI*2;add(cx+Math.cos(q)*rx,cy+Math.sin(q)*ry,i,n)}
  return pts;
}
// ととのえ：線のさいごで指を止めると、まっすぐな線・まる（だ円）にする。どちらでもなければそのまま
function rkSnapPts(p){
  if(p.length<3)return null;let L=0,x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;
  for(let i=0;i<p.length;i++){const q=p[i];if(i)L+=Math.hypot(q.x-p[i-1].x,q.y-p[i-1].y);x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y)}
  if(L<40)return null;
  const A=p[0],B=p[p.length-1],d=Math.hypot(B.x-A.x,B.y-A.y),w=x1-x0,h=y1-y0,size=Math.max(w,h);
  let dev=0;for(const q of p)dev=Math.max(dev,Math.abs((q.x-A.x)*(B.y-A.y)-(q.y-A.y)*(B.x-A.x))/(d||1));
  if(d>30&&dev<Math.max(7,d*.07))return rkShapePts('line',A,B);
  if(size>30&&d<size*.25&&L>size*2){
    const asp=w/Math.max(1,h);
    if(asp>.8&&asp<1.25){const cx=(x0+x1)/2,cy=(y0+y1)/2,r=(w+h)/4;return rkShapePts('circle',{x:cx-r,y:cy-r,t:A.t},{x:cx+r,y:cy+r,t:B.t})}
    return rkShapePts('circle',{x:x0,y:y0,t:A.t},{x:x1,y:y1,t:B.t});
  }
  return null;
}
// 指を止めたら「ととのえた形」を見せる。そのまま指を動かせば、もとの線にもどってかきつづけられる（はなしたときだけ確定）
function rkSnapNow(){
  rk.snapT=0;const a=rk.cur;if(!a||a.shape||a.er||a.snapped||!rk.snap)return;
  const s=rkSnapPts(a.p);if(!s)return;
  a.orig=a.p;a.p=s;a.snapped=true;snd('snap');rkSchedule();
}
function rkUnsnap(a){if(a&&a.snapped){a.p=a.orig;delete a.orig;a.snapped=false;rkSchedule()}}
function rkPt(e){
  const r=rk.pad.getBoundingClientRect();if(rk.t0==null)rk.t0=performance.now();
  return{x:Math.round((e.clientX-r.left)*512/r.width*10)/10,y:Math.round((e.clientY-r.top)*512/r.height*10)/10,t:Math.round(performance.now()-rk.t0)};
}
// 線とぬりつぶしを記録（左右対称のときは写した側も、同じ組の番号で）
function rkCommit(a){
  delete a.raw;delete a.snapped;delete a.anchor;delete a.orig;delete a.sv;
  const list=[a];if(rk.mirror){const g=++rk.gid;a.g=g;const m=a.t==='fill'?Object.assign({},a,{x:511-a.x,mr:true}):rkMirrorOf(a);m.g=g;list.push(m)}
  for(const x of list){rkApply(rk.bctx,x);rk.actions.push(x)}
  rk.redo=[];rkPaint();rkToolsUI();
}
function rkEnd(){
  if(rk.snapT){clearTimeout(rk.snapT);rk.snapT=0}
  sndPen(false);
  if(!rk.cur)return;const a=rk.cur;rk.cur=null;
  if(a.shape){const tiny=Math.hypot(a.last.x-a.p0.x,a.last.y-a.p0.y)<6;delete a.shape;delete a.p0;delete a.last;if(tiny){rkPaint();return}}
  else if(rk.sm&&a.raw&&!a.snapped){const q=a.p[a.p.length-1];if(Math.hypot(a.raw.x-q.x,a.raw.y-q.y)>=1.5)a.p.push(a.raw)}
  rkCommit(a);
}
// 線けし：タップしたところにいちばん近い線（上にかいたものから）を1本消す。左右対称の組はいっしょに
function rkCutAt(p){
  const live=rkLive();
  for(let i=live.length-1;i>=0;i--){
    const a=live[i];if(a.t!=='s'||a.er)continue;const tol=a.w/2+10,q=a.p;let hit=false;
    if(q.length===1)hit=Math.hypot(q[0].x-p.x,q[0].y-p.y)<=tol;
    for(let k=1;k<q.length&&!hit;k++){const A=q[k-1],B=q[k],dx=B.x-A.x,dy=B.y-A.y,L2=dx*dx+dy*dy||1,t=rkClamp(((p.x-A.x)*dx+(p.y-A.y)*dy)/L2);if(Math.hypot(A.x+dx*t-p.x,A.y+dy*t-p.y)<=tol)hit=true}
    if(hit){const refs=a.g?live.filter(x=>x.g===a.g):[a];rk.actions.push({t:'hide',refs});rk.redo=[];rkRebuild();rkToolsUI();snd('cut');return true}
  }
  return false;
}
/* ---- ズーム（2本指でつまむ・ホイール・＋−ボタン・うごかす道具）----
   キャンバスに CSS の transform をかけるだけ。線の座標は rkPt が見た目の大きさから計算するので、ズーム中もそのまま */
function rkZoomApply(){
  const pad=rk.pad,w=pad&&pad.parentElement;if(!w)return;const W=w.clientWidth,Z=rk.zoom;
  Z.s=rkClamp(Z.s,1,6);Z.x=rkClamp(Z.x,W-W*Z.s,0);Z.y=rkClamp(Z.y,W-W*Z.s,0);
  pad.style.transformOrigin='0 0';pad.style.transform=Z.s>1?`translate(${Z.x}px,${Z.y}px) scale(${Z.s})`:'';
  const zl=$('#dzlv');if(zl)zl.textContent=Z.s>1?'×'+Z.s.toFixed(1):'';
  const zr=$('[data-act="dzreset"]');if(zr)zr.disabled=Z.s<=1;
}
// cx,cy：紙の枠の中の位置（px）を中心に f 倍
function rkZoomAt(f,cx,cy){const Z=rk.zoom,s=rkClamp(Z.s*f,1,6),k=s/Z.s;Z.x=cx-(cx-Z.x)*k;Z.y=cy-(cy-Z.y)*k;Z.s=s;rkZoomApply()}
function rkZoomBtn(f){const w=rk.pad&&rk.pad.parentElement;if(!w)return;if(f===0){rk.zoom={s:1,x:0,y:0};rkZoomApply();return}const W=w.clientWidth;rkZoomAt(f,W/2,W/2)}
function mountDraw(){
  rkInit();const pad=$('#pad');if(!pad)return;
  rk.pad=pad;rk.pctx=pad.getContext('2d');rk.zoom={s:1,x:0,y:0};rkPaint();rkToolsUI();rkZoomApply();
  const box=pad.parentElement,ptrs=new Map();let pinch=null,pan=null,hold=false;
  const local=e=>{const r=box.getBoundingClientRect();return{x:e.clientX-r.left,y:e.clientY-r.top}};
  const cancelCur=()=>{if(rk.snapT){clearTimeout(rk.snapT);rk.snapT=0}sndPen(false);if(rk.cur){rk.cur=null;rkPaint()}};
  box.addEventListener('wheel',e=>{if(rk.busy)return;e.preventDefault();const p=local(e);rkZoomAt(e.deltaY<0?1.15:1/1.15,p.x,p.y)},{passive:false});
  pad.onpointerdown=e=>{
    if(e.button>0||rk.busy)return;e.preventDefault();
    ptrs.set(e.pointerId,local(e));try{pad.setPointerCapture(e.pointerId)}catch(_){}
    // 2本目の指：かきかけの線はやめて、つまんでズーム・移動
    if(ptrs.size===2){cancelCur();pan=null;const[a,b]=[...ptrs.values()];pinch={d:Math.hypot(a.x-b.x,a.y-b.y)||1,m:{x:(a.x+b.x)/2,y:(a.y+b.y)/2}};hold=true;return}
    if(ptrs.size>2||hold)return;
    if(rk.tool==='hand'){pan=local(e);return}
    const p=rkPt(e);
    if(rk.tool==='fill'){rkCommit({t:'fill',x:Math.round(p.x),y:Math.round(p.y),c:rk.col,ts:p.t});snd('fill');return}
    if(rk.tool==='cut'){rkCutAt(p);return}
    rk.cur={t:'s',er:rk.tool==='eraser',c:rk.col,w:RK_SIZES[rk.size]*(rk.tool==='eraser'?1.8:1),p:[p],anchor:p};
    if(RK_SHAPES[rk.tool]){rk.cur.shape=rk.tool;rk.cur.p0=p;rk.cur.last=p;if(rk.tool!=='circle'&&rk.tool!=='heart')rk.cur.poly=true}
    rk.cur.sv={x:e.clientX,y:e.clientY,t:performance.now()};sndPen(true,rk.cur.er?'eraser':'pen',.25);   // かきはじめの「かきかき」
    rkSchedule();
  };
  pad.onpointermove=e=>{
    if(ptrs.has(e.pointerId))ptrs.set(e.pointerId,local(e));
    if(pinch&&ptrs.size>=2){
      const[a,b]=[...ptrs.values()],d=Math.hypot(a.x-b.x,a.y-b.y)||1,m={x:(a.x+b.x)/2,y:(a.y+b.y)/2};
      rk.zoom.x+=m.x-pinch.m.x;rk.zoom.y+=m.y-pinch.m.y;rkZoomAt(d/pinch.d,m.x,m.y);pinch={d,m};return;
    }
    if(pan){const q=local(e);rk.zoom.x+=q.x-pan.x;rk.zoom.y+=q.y-pan.y;pan=q;rkZoomApply();return}
    if(!rk.cur)return;
    // 指の速さで「かきかき」の大きさと高さを変える
    {const v=rk.cur.sv,now=performance.now(),dt=Math.max(8,now-v.t),sp=Math.hypot(e.clientX-v.x,e.clientY-v.y)/dt;if(now-v.t>=30){sndPen(true,rk.cur.er?'eraser':'pen',Math.min(1,sp/1.4));rk.cur.sv={x:e.clientX,y:e.clientY,t:now}}}
    // ととのえた形を見せているときに指が動いたら、もとの線にもどす
    if(rk.cur.snapped){const raw=rkPt(e),an=rk.cur.anchor;if(Math.hypot(raw.x-an.x,raw.y-an.y)<=6)return;rkUnsnap(rk.cur)}
    const evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
    if(rk.cur.shape){const p=rkPt(evs.length?evs[evs.length-1]:e);rk.cur.last=p;rk.cur.p=rkShapePts(rk.cur.shape,rk.cur.p0,p);rkSchedule();return}
    for(const ev of(evs.length?evs:[e])){
      let p=rkPt(ev);const q=rk.cur.p[rk.cur.p.length-1];
      // 手ぶれ補正：指の位置に少しずつ近づける（線がなめらかになる）
      if(rk.sm){rk.cur.raw=p;const k=RK_SMK[rk.sm];p={x:Math.round((q.x+(p.x-q.x)*k)*10)/10,y:Math.round((q.y+(p.y-q.y)*k)*10)/10,t:p.t}}
      if(Math.hypot(p.x-q.x,p.y-q.y)>=1.5)rk.cur.p.push(p);
    }
    // 指が止まったら少し待って「ととのえ」（動いているあいだは待ち直す）
    if(!rk.cur.er){const raw=rkPt(e),an=rk.cur.anchor;if(Math.hypot(raw.x-an.x,raw.y-an.y)>4){rk.cur.anchor=raw;if(rk.snapT)clearTimeout(rk.snapT);rk.snapT=setTimeout(rkSnapNow,500)}}
    rkSchedule();
  };
  // 指をはなす：つまんでいたときは、ぜんぶの指がはなれるまで線をかかない
  const up=e=>{ptrs.delete(e.pointerId);if(ptrs.size<2)pinch=null;if(!ptrs.size){hold=false;pan=null}if(!hold&&!pan)rkEnd()};
  pad.onpointerup=pad.onpointercancel=up;pad.onlostpointercapture=e=>{if(ptrs.has(e.pointerId))up(e)};
  const ci=$('#dcustom');if(ci)ci.oninput=e=>rkSetColor(e.target.value);
  rkRecentUI();
}
/* ---- カラーパレット ---- */
function rkHex(h,s,l){s/=100;l/=100;const k=n=>(n+h/30)%12,a=s*Math.min(l,1-l),f=n=>l-a*Math.max(-1,Math.min(k(n)-3,9-k(n),1));return'#'+[f(0),f(8),f(4)].map(v=>Math.round(v*255).toString(16).padStart(2,'0')).join('')}
// 色相12×明るさ4段＋灰色・茶色・はだ色（白は紙と同じで見えないので入れない）
const RK_PAL=[[80,30],[82,47],[85,63],[80,80]].map(([s,l])=>Array.from({length:12},(_,i)=>rkHex(i*30,s,l)));
RK_PAL.push(['#1e1e1e','#2b2b2b','#4a4c50','#6b6e73','#8d939a','#b3b7bc','#d5d8dc','#5e3a1a','#8b5a2b','#c08040','#f2c69c','#fde3c8']);
const RK_RECENT_KEY='tr_recentcol',RK_WIDE='(min-width:900px) and (min-aspect-ratio:5/4)';   // RK_WIDE：道具を紙の横にならべる広い画面（09_drawcard.css と同じ条件）
function rkRecent(){try{const a=JSON.parse(localStorage.getItem(RK_RECENT_KEY)||'[]');return Array.isArray(a)?a.filter(c=>/^#[0-9a-f]{6}$/i.test(c)).slice(0,8):[]}catch(e){return[]}}
function rkSetColor(c){
  rk.col=c.toLowerCase();if(rk.tool==='eraser'||rk.tool==='cut')rk.tool='pen';snd('pick');
  const r=[rk.col,...rkRecent().filter(x=>x!==rk.col)].slice(0,8);try{localStorage.setItem(RK_RECENT_KEY,JSON.stringify(r))}catch(e){}
  rkRecentUI();rkToolsUI();
}
function rkRecentUI(){const el=$('#precent');if(!el)return;const r=rkRecent();el.innerHTML=r.length?r.map(c=>`<button class="sw" data-act="dcolor" data-c="${c}" style="background:${c}" aria-label="${c}"></button>`).join(''):'<span class="sub">まだありません</span>';rkToolsUI()}
function rkToolsUI(){
  const penOn=rk.tool!=='eraser'&&rk.tool!=='cut';
  document.querySelectorAll('[data-act="dcolor"]').forEach(b=>b.classList.toggle('on',b.dataset.c===rk.col&&penOn));
  const cc=$('.curc');if(cc){cc.style.setProperty('--cc',rk.col);cc.classList.toggle('dim',!penOn)}
  const ci=$('#dcustom');if(ci&&ci.value!==rk.col)ci.value=rk.col;
  document.querySelectorAll('[data-act="dtool"]').forEach(b=>b.classList.toggle('on',b.dataset.t===rk.tool));
  if(rk.pad)rk.pad.style.cursor=rk.tool==='hand'?'grab':'crosshair';
  const rb=$('[data-act="drandom"]');if(rb)rb.disabled=rk.busy;
  document.querySelectorAll('[data-act="dsize"]').forEach(b=>b.classList.toggle('on',+b.dataset.i===rk.size));
  const u=$('[data-act="dundo"]');if(u)u.disabled=!rk.actions.length;
  const rd=$('[data-act="dredo"]');if(rd)rd.disabled=!rk.redo.length;
  document.querySelectorAll('[data-act="dkind"]').forEach(b=>b.classList.toggle('on',b.dataset.k===rk.kind));
  const sm=$('[data-act="dsmooth"]');if(sm){sm.classList.toggle('on',rk.sm>0);sm.textContent='手ぶれ補正 '+['なし','ふつう','つよい'][rk.sm]}
  const sn=$('[data-act="dsnap"]');if(sn){sn.classList.toggle('on',rk.snap);sn.textContent=rk.snap?'ととのえ ON':'ととのえ OFF'}
  const mi=$('[data-act="dmirror"]');if(mi){mi.classList.toggle('on',rk.mirror);mi.textContent=rk.mirror?'左右対称 ON':'左右対称 OFF'}
  const tb=$('[data-act="dtpl"]');if(tb)tb.textContent=rk.tpl>=0?`おてほん：${RK_TPL[rk.tpl].n}`:'おてほん';
  const tf=$('[data-act="dtploff"]');if(tf)tf.hidden=rk.tpl<0;
}
// もどす・やりなおす（左右対称の組はいっしょに）
function rkUndo(){if(rk.busy||!rk.actions.length)return;snd('undo');const a=rk.actions.pop();rk.redo.push(a);while(a.g&&rk.actions.length&&rk.actions[rk.actions.length-1].g===a.g)rk.redo.push(rk.actions.pop());rkRebuild();rkToolsUI()}
function rkRedo(){if(rk.busy||!rk.redo.length)return;snd('redo');const a=rk.redo.pop();rk.actions.push(a);while(a.g&&rk.redo.length&&rk.redo[rk.redo.length-1].g===a.g)rk.actions.push(rk.redo.pop());rkRebuild();rkToolsUI()}
// おてほんをえらぶ
async function rkTplPick(){
  if(rk.busy)return;
  const v=await modal(`<h3>おてほんをえらぶ</h3><p class="sub">紙にうすく下絵が出ます。なぞってかいてね。下絵は鑑定にもカードの絵にも入りません。</p>
    <div class="tplgrid">${RK_TPL.map((t,i)=>`<button class="tplb${i===rk.tpl?' on':''}" data-mv="t${i}">${rkTplSVG(t)}<span>${t.n}</span></button>`).join('')}</div>`,
    [['おてほんなし','none'],['とじる','x','pri']]);
  if(v==='none')rk.tpl=-1;else if(v&&v[0]==='t')rk.tpl=+v.slice(1);
  rkPaint();rkToolsUI();
}
