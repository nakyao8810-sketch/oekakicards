'use strict';
/* ---- おまかせでかく ----
   ランダムな絵を、1本ずつ線をひくように自動でかく（かいたあとは、ふつうの線として足したり消したり鑑定できる）
   ・モンスター（75%）：体のつくり12種類 × テーマ9種類（色と飾り）× 目5種類 × 口7種類
     体の後ろにあるものから順に「形をぬる→りんかくの線」でかさねる（t:'poly' の記録。ぬりつぶしのすき間やにじみが出ない）
   ・おてほんを少しくずして、ところごとに色をぬる（25%） */
const PI=Math.PI;
/* ---- 形の材料（点の列 [[x,y]...]） ---- */
function rkE(cx,cy,rx,ry,o={}){const{ang=0,a0=0,a1=PI*2,n=36}=o,c=Math.cos(ang),s=Math.sin(ang),P=[];for(let i=0;i<=n;i++){const t=a0+(a1-a0)*i/n,x=Math.cos(t)*rx,y=Math.sin(t)*ry;P.push([cx+x*c-y*s,cy+x*s+y*c])}return P}
// 2点のあいだの手足（太さ r0→r1 のカプセル）
function rkCap(x0,y0,x1,y1,r0,r1=r0,n=8){const a=Math.atan2(y1-y0,x1-x0);
  // x1側の半円（外向き）＋x0側の半円
  const A=[];for(let i=0;i<=n;i++){const t=a-PI/2+PI*i/n;A.push([x1+Math.cos(t)*r1,y1+Math.sin(t)*r1])}
  const B=[];for(let i=0;i<=n;i++){const t=a+PI/2+PI*i/n;B.push([x0+Math.cos(t)*r0,y0+Math.sin(t)*r0])}
  return[...A,...B,A[0]];}
function rkQuad(x0,y0,cx,cy,x1,y1,n=14){return Array.from({length:n+1},(_,i)=>{const t=i/n,u=1-t;return[u*u*x0+2*u*t*cx+t*t*x1,u*u*y0+2*u*t*cy+t*t*y1]})}
function rkStarP(cx,cy,R,r,n=5,rot=-PI/2){const P=[];for(let i=0;i<=n*2;i++){const a=rot+i*PI/n,d=i%2?r:R;P.push([cx+Math.cos(a)*d,cy+Math.sin(a)*d])}return P}
// ふちがでこぼこの丸（くも・ぐにゃぐにゃ）
function rkBlobP(cx,cy,rx,ry,amp,k,ph=0,n=60,abs=false){const P=[];for(let i=0;i<=n;i++){const t=i/n*PI*2,s=Math.sin(k*t+ph),m=1+amp*(abs?Math.abs(s):s);P.push([cx+Math.cos(t)*rx*m,cy+Math.sin(t)*ry*m])}return P}
function rkWobble(P,r,a){let wx=0,wy=0;return P.map(([x,y])=>{wx=wx*.6+(r()-.5)*a;wy=wy*.6+(r()-.5)*a;return[x+wx,y+wy]})}
// 部品の記録（あとで紙に合わせて大きさをそろえる）
//  {part:1,p,fill,w,c,inner:[...]}：形をぬる→中のもよう→りんかく   {poly:p,c}：ぬるだけ   {p,w,c,sharp}：線（sharp＝角をとがらせる）   1点の線＝点
function rkBuild(pal){const S=[];return{S,pal,
  // 点の少ない形（しかく・さんかく・ツノ）は角をとがらせて、ぬりとりんかくの線をぴったり合わせる
  part(p,fill,o={}){S.push({part:1,p,fill,w:o.w||8,c:o.line||pal.line,inner:o.inner||[],sharp:p.length<=12})},
  ln(p,w=7,c,sharp){S.push({p,w,c:c||pal.line,sharp:!!sharp})},
  dot(x,y,w,c){S.push({p:[[x,y]],w,c:c||pal.line})},
  fill(p,c){S.push({poly:p,c})}}}
/* ---- 色（テーマ）---- */
const RK_THEME={
  fire:{hue:[0,10,20,340],sat:80,lit:56,belly:[48,90,80],acc:[45,95,58],deco:['flame','flame','horns']},
  water:{hue:[195,205,215,175],sat:66,lit:60,belly:[195,70,88],acc:[190,80,72],deco:['fin','fin','none','orb']},
  plant:{hue:[95,110,130,75],sat:55,lit:55,belly:[60,70,86],acc:[330,70,75],deco:['sprout','flower','leafears']},
  elec:{hue:[185,200,270,25],sat:70,lit:58,belly:[55,90,85],acc:[52,100,62],deco:['antenna','antenna1','bolt']},
  ghost:{hue:[265,280,290,180],sat:48,lit:70,belly:[270,60,88],acc:[300,70,70],deco:['bumps','none','halo']},
  fluffy:{hue:[330,345,25,200,45],sat:62,lit:76,belly:[30,80,92],acc:[340,80,80],deco:['roundears','bow','pointears']},
  dragon:{hue:[100,140,0,215,280],sat:55,lit:48,belly:[45,75,78],acc:[40,70,85],deco:['horns','horns','spikes']},
  rock:{hue:[25,30,210,0],sat:14,lit:56,belly:[30,15,74],acc:[280,60,72],deco:['crystal','none','spikes']},
  star:{hue:[45,55,200,280],sat:70,lit:78,belly:[50,90,90],acc:[48,95,60],deco:['star','halo','antenna1']}
};
function rkPal(r,tk){
  const T=RK_THEME[tk],hue=rkPick(r,T.hue)+Math.floor((r()-.5)*14),C=(h,s,l)=>rkHex(((h%360)+360)%360,s,l);
  return{tk,hue,C,base:C(hue,T.sat,T.lit),dark:C(hue,T.sat,Math.max(18,T.lit-18)),light:C(hue,T.sat-10,Math.min(92,T.lit+18)),line:C(hue,Math.min(55,T.sat+5),15),
    belly:C(...T.belly),acc:C(...T.acc),acc2:C(T.acc[0]+30,T.acc[1],Math.min(85,T.acc[2]+12)),white:'#ffffff',blush:C(345,80,80)};
}
/* ---- 顔 ---- */
// 正面の顔。s＝顔の大きさのめやす、skin＝顔の色（まぶたをぬる色）
function rkFace(B,r,x,y,s,skin,st){
  const P=B.pal,ghost=P.tk==='ghost';const er=s*.2,gap=s*.36;
  const eyes=st.eye==='none'?[]:st.eye==='one'?[[0,er*1.45]]:[[-1,er],[1,er]];   // none：目は顔の外（カニの目玉のぼう）
  for(const[sx,R]of eyes){const ex=x+sx*gap,ey=st.eye==='one'?y-er*.3:y;
    B.part(rkE(ex,ey,R,R*1.15,{n:24}),ghost?P.C(55,100,72):'#ffffff',{w:5});
    if(!ghost){B.dot(ex+sx*R*.1,ey+R*.25,R*1.15);B.dot(ex-R*.22,ey-R*.12,R*.42,'#ffffff');if(st.eye==='sparkle')B.dot(ex+R*.25,ey+R*.45,R*.22,'#ffffff')}
    else B.dot(ex,ey+R*.2,R*.6);
    if(st.eye==='sleepy'){B.fill(rkE(ex,ey,R*1.08,R*1.22,{a0:PI,a1:PI*2,n:16}),skin);B.ln([[ex-R*1.1,ey],[ex+R*1.1,ey]],5,null,true)}
    if(st.eye==='angry'){const bx=sx===0?0:sx;if(bx)B.ln([[ex-bx*R*1.2,ey-R*1.6],[ex+bx*R*.9,ey-R*1.05]],6,null,true);else B.ln([[ex-R*1.2,ey-R*1.5],[ex,ey-R*1.1],[ex+R*1.2,ey-R*1.5]],6,null,true)}
  }
  const my=y+s*.38,mw=s*.2;
  switch(st.mouth){
    case'smile':B.ln(rkQuad(x-mw,my,x,my+mw*.9,x+mw,my),5);break;
    case'open':B.part([[x-mw,my],...rkQuad(x-mw,my,x,my+mw*1.6,x+mw,my,12).slice(1),[x-mw,my]],P.C(355,60,32),{w:5,inner:[{poly:rkE(x,my+mw*.85,mw*.5,mw*.3),c:P.C(350,75,68)}]});break;
    case'o':B.part(rkE(x,my+5,mw*.4,mw*.35,{n:16}),P.C(355,60,32),{w:5});break;
    case'w':B.ln([...rkQuad(x-mw,my,x-mw*.5,my+mw*.8,x,my,8),...rkQuad(x,my,x+mw*.5,my+mw*.8,x+mw,my,8).slice(1)],5);break;
    case'fang':B.ln(rkQuad(x-mw*1.2,my,x,my+mw*.6,x+mw*1.2,my),5);for(const sx of[-1,1])B.part([[x+sx*mw*.75,my+mw*.15],[x+sx*mw*.6,my+mw*.95],[x+sx*mw*.4,my+mw*.3],[x+sx*mw*.75,my+mw*.15]],'#ffffff',{w:3});break;
    case'grin':{B.part([[x-mw*1.2,my],[x+mw*1.2,my],...rkQuad(x+mw*1.2,my,x,my+mw*1.5,x-mw*1.2,my,10).slice(1)],'#ffffff',{w:5});for(const k of[-.4,0,.4])B.ln([[x+k*mw*1.2,my],[x+k*mw*1.1,my+mw*.85]],3,null,true);break}
    case'tongue':B.ln(rkQuad(x-mw,my,x,my+mw*.7,x+mw,my),5);B.part(rkCap(x+mw*.25,my+mw*.35,x+mw*.35,my+mw*1.1,mw*.28,mw*.3),P.C(350,75,68),{w:4});break;
  }
  if(st.cheek)for(const sx of[-1,1])B.dot(x+sx*(gap+er*1.35),y+er*1.45,s*.17,P.blush);
}
// 横向きの顔（目ひとつ・口は向いている側）
function rkFaceSide(B,r,x,y,s,dir,skin,st){
  const P=B.pal,R=s*.2;B.part(rkE(x,y,R,R*1.15,{n:22}),'#ffffff',{w:5});B.dot(x+dir*R*.2,y+R*.2,R*1.1);B.dot(x+dir*R*.05-R*.15,y-R*.15,R*.4,'#ffffff');
  if(st.eye==='sleepy'){B.fill(rkE(x,y,R*1.08,R*1.22,{a0:PI,a1:PI*2,n:14}),skin);B.ln([[x-R*1.1,y],[x+R*1.1,y]],5,null,true)}
  if(st.eye==='angry')B.ln([[x-dir*R*1.2,y-R*1.65],[x+dir*R*1.1,y-R*1.15]],6,null,true);
}
/* ---- 頭の飾り（頭の上 x,y、大きさ s）。頭より先にかく（頭のうしろにかくれる） ---- */
function rkDeco(B,r,kind,x,y,s,dir=0){
  const P=B.pal;
  switch(kind){
    case'flame':B.part([[x-s*.32,y+s*.2],[x-s*.42,y-s*.3],[x-s*.18,y-s*.12],[x-s*.06,y-s*.62],[x+s*.12,y-s*.18],[x+s*.34,y-s*.4],[x+s*.36,y+s*.2],[x-s*.32,y+s*.2]],P.acc,{w:6,inner:[{poly:[[x-s*.14,y+s*.1],[x-s*.06,y-s*.26],[x+s*.04,y-s*.08],[x+s*.14,y+s*.1]],c:P.C(52,100,72)}]});break;
    case'fin':B.part([[x-s*.3,y+s*.15],[x-s*.08,y-s*.55],[x+s*.42,y+s*.18]],P.acc,{w:6});break;
    case'orb':B.ln(rkQuad(x,y+s*.1,x+s*.1,y-s*.2,x,y-s*.4),5);B.part(rkE(x,y-s*.52,s*.15,s*.15,{n:18}),P.acc,{w:5});B.dot(x-s*.05,y-s*.57,s*.06,'#ffffff');break;
    case'sprout':B.ln(rkQuad(x,y+s*.1,x+s*.06,y-s*.25,x-s*.02,y-s*.45),6,P.C(110,55,28));for(const sx of[-1,1])B.part(rkE(x+sx*s*.3,y-s*.52,s*.3,s*.13,{ang:sx*-.35}),P.C(100,60,52),{w:5,line:P.C(110,55,28)});break;
    case'flower':B.ln([[x,y+s*.1],[x,y-s*.38]],6,P.C(110,55,28),true);for(let i=0;i<5;i++){const a=i/5*PI*2-PI/2;B.part(rkE(x+Math.cos(a)*s*.17,y-s*.5+Math.sin(a)*s*.17,s*.13,s*.13,{n:16}),P.acc,{w:4})}B.part(rkE(x,y-s*.5,s*.1,s*.1,{n:14}),P.C(50,95,60),{w:4});break;
    case'leafears':for(const sx of[-1,1])B.part(rkE(x+sx*s*.42,y-s*.12,s*.36,s*.15,{ang:sx*-.7}),P.C(100,60,52),{w:5,inner:[{p:[[x+sx*s*.15,y+s*.08],[x+sx*s*.68,y-s*.33]],w:3,c:P.C(110,55,28)}]});break;
    case'antenna':case'antenna1':for(const sx of(kind==='antenna'?[-1,1]:[0])){const bx=x+sx*s*.32,by=y-s*.55;B.ln(rkQuad(x+sx*s*.12,y+s*.1,x+sx*s*.14,y-s*.2,bx,by+s*.12),5);B.part(rkE(bx,by,s*.13,s*.13,{n:18}),P.acc,{w:5});B.dot(bx-s*.04,by-s*.04,s*.05,'#ffffff')}break;
    case'bolt':B.part([[x-s*.05,y+s*.15],[x-s*.2,y-s*.18],[x-s*.04,y-s*.18],[x-s*.12,y-s*.55],[x+s*.2,y-s*.1],[x+s*.04,y-s*.1],[x+s*.12,y+s*.15],[x-s*.05,y+s*.15]],P.acc,{w:5});break;
    case'bumps':for(const sx of[-1,1])B.part(rkE(x+sx*s*.3,y,s*.13,s*.2,{n:18}),P.acc,{w:5});break;
    case'halo':B.part(rkE(x,y-s*.42,s*.36,s*.1,{n:30}),P.C(50,95,62),{w:5,inner:[{poly:rkE(x,y-s*.42,s*.22,s*.05,{n:20}),c:P.C(50,60,92)}]});break;
    case'roundears':for(const sx of[-1,1]){const ox=x+sx*s*.42,oy=y-s*.02;B.part(rkE(ox,oy,s*.22,s*.21,{n:24}),P.base,{w:6,inner:[{poly:rkE(ox,oy+s*.02,s*.11,s*.1,{n:16}),c:P.blush}]})}break;
    case'pointears':for(const sx of[-1,1])B.part([[x+sx*s*.12,y+s*.15],[x+sx*s*.42,y-s*.45],[x+sx*s*.6,y+s*.18]],P.base,{w:6,inner:[{poly:[[x+sx*s*.26,y+s*.08],[x+sx*s*.42,y-s*.28],[x+sx*s*.5,y+s*.1]],c:P.blush}]});break;
    case'bow':for(const sx of[-1,1])B.part([[x,y-s*.08],[x+sx*s*.38,y-s*.32],[x+sx*s*.4,y+s*.12],[x,y-s*.08]],P.acc,{w:5});B.part(rkE(x,y-s*.08,s*.07,s*.07,{n:12}),P.acc,{w:5});break;
    case'horns':for(const sx of[-1,1]){const p=[...rkQuad(x+sx*s*.15,y+s*.12,x+sx*s*.45,y-s*.2,x+sx*s*.38,y-s*.6,10),...rkQuad(x+sx*s*.38,y-s*.6,x+sx*s*.62,y-s*.15,x+sx*s*.42,y+s*.18,10)];B.part(p,P.acc,{w:6})}break;
    case'spikes':{const n=3;for(let i=0;i<n;i++){const t=(i-(n-1)/2)*.42,bx=x+Math.sin(t)*s*.4,by=y+s*.05-Math.cos(t)*s*.05;B.part([[bx-s*.12,by+s*.12],[bx+Math.sin(t)*s*.2,by-s*.38],[bx+s*.12,by+s*.12]],P.dark,{w:5})}break}
    case'crystal':B.part([[x-s*.18,y+s*.15],[x-s*.22,y-s*.15],[x,y-s*.6],[x+s*.22,y-s*.15],[x+s*.18,y+s*.15]],P.acc,{w:6,inner:[{p:[[x,y-s*.55],[x-s*.05,y+s*.05]],w:3,c:P.acc2}]});break;
    case'star':B.part(rkStarP(x,y-s*.3,s*.28,s*.12),P.acc,{w:5});break;
  }
}
// テーマに合った飾りをえらぶ（頭の上用）
const rkDecoOf=(r,tk)=>rkPick(r,RK_THEME[tk].deco);
const rkStyle=r=>({eye:rkPick(r,['normal','normal','normal','sleepy','one','angry','sparkle']),mouth:rkPick(r,['smile','open','o','w','fang','grin','tongue']),cheek:r()<.45});
/* ---- 体のつくり ---- */
const RK_PLANS={
  // ちびまる（正面・まるい体に顔）
  chibi(B,r,st){const P=B.pal,RX=100+r()*20,RY=100+r()*22,cx=256,cy=280,top=cy-RY,bot=cy+RY;
    rkDeco(B,r,rkDecoOf(r,P.tk),cx,top+8,RX*1.2);
    for(const sx of[-1,1])B.part(rkE(cx+sx*RX*.45,bot,RX*.3,RX*.17,{n:24}),P.dark);
    if(r()<.5){const tx=cx+RX*.85;B.part(rkCap(tx,cy+RY*.4,tx+RX*.55,cy+RY*.1,RX*.12,RX*.07),P.base)}
    B.part(rkE(cx,cy,RX,RY,{n:48}),P.base,{w:10,inner:[{poly:rkE(cx,cy+RY*.35,RX*.55,RY*.45),c:P.belly},{poly:[...rkE(cx,cy,RX,RY,{a0:-.1,a1:PI*.45,n:16}),...rkE(cx-RX*.08,cy-RY*.08,RX*.9,RY*.9,{a0:PI*.45,a1:-.1,n:16})],c:P.dark},{p:rkE(cx,cy,RX*.8,RY*.8,{a0:PI*1.15,a1:PI*1.35,n:8}),w:7,c:P.light}]});
    for(const sx of[-1,1])B.part(rkCap(cx+sx*RX*.92,cy+RY*.05,cx+sx*RX*1.25,cy+RY*.3,RX*.13,RX*.11),P.base);
    rkFace(B,r,cx,cy-RY*.25,RX*1.05,P.base,st)},
  // 頭でっかち（大きな頭＋小さな体）
  headbody(B,r,st){const P=B.pal,HR=95+r()*20,cx=256,hy=215,by=hy+HR*1.2,BR=HR*.62;
    for(const sx of[-1,1])B.part(rkCap(cx+sx*BR*.45,by+BR*.6,cx+sx*BR*.5,by+BR*1.25,BR*.22,BR*.24),P.dark);
    B.part(rkE(cx,by,BR,BR*1.05,{n:36}),P.base,{inner:[{poly:rkE(cx,by+BR*.2,BR*.55,BR*.6),c:P.belly}]});
    for(const sx of[-1,1])B.part(rkCap(cx+sx*BR*.8,by-BR*.2,cx+sx*BR*1.45,by+BR*.25,BR*.17,BR*.16),P.base);
    rkDeco(B,r,rkDecoOf(r,P.tk),cx,hy-HR*.85,HR*1.1);
    B.part(rkBlobP(cx,hy,HR*1.05,HR*.95,.04,3,r()*6),P.base,{w:10,inner:[{poly:[...rkE(cx,hy,HR*1.05,HR*.95,{a0:.05,a1:PI*.5,n:14}),...rkE(cx-HR*.1,hy-HR*.1,HR*.95,HR*.86,{a0:PI*.5,a1:.05,n:14})],c:P.dark},{p:rkE(cx,hy,HR*.8,HR*.75,{a0:PI*1.12,a1:PI*1.32,n:8}),w:7,c:P.light}]});
    rkFace(B,r,cx,hy+HR*.05,HR*1.05,P.base,st)},
  // 4本足のけもの（横向き）
  quad(B,r,st){const P=B.pal,d=r()<.5?-1:1,cx=256,cy=290,RX=120+r()*20,RY=62+r()*12,hx=cx+d*RX*.95,hy=cy-RY*.9,HR=58+r()*10;
    for(const k of[-.55,.55])B.part(rkCap(cx+k*RX+d*14,cy+RY*.4,cx+k*RX+d*20,cy+RY*1.55,RY*.22,RY*.2),P.dark);
    const tt=rkPick(r,['thin','bushy','none']);if(tt!=='none'){const tx=cx-d*RX*.92;B.part(tt==='thin'?rkCap(tx,cy-RY*.2,tx-d*RX*.5,cy-RY*1.1,RY*.12,RY*.08):rkE(tx-d*RX*.25,cy-RY*.5,RX*.32,RY*.36,{ang:d*.6}),tt==='thin'?P.base:P.light)}
    const back=rkPick(r,['spikes','none','none','leaf','flame']);
    if(back==='spikes')for(let i=0;i<4;i++){const x=cx-d*RX*.5+d*i*RX*.3;B.part([[x-16,cy-RY*.8],[x,cy-RY*1.4],[x+16,cy-RY*.8]],P.dark,{w:5})}
    if(back==='leaf')B.part(rkE(cx,cy-RY*1.05,RX*.35,RY*.3,{ang:d*-.3}),P.C(100,60,52),{w:6});
    if(back==='flame')rkDeco(B,r,'flame',cx-d*RX*.2,cy-RY*.85,RY*1.3);
    B.part(rkE(cx,cy,RX,RY,{n:44}),P.base,{w:10,inner:[{poly:rkE(cx,cy+RY*.45,RX*.75,RY*.45,{a0:0,a1:PI,n:20}),c:P.belly}]});
    for(const k of[-.62,.45])B.part(rkCap(cx+k*RX,cy+RY*.45,cx+k*RX-d*6,cy+RY*1.6,RY*.24,RY*.22),P.base);
    rkDeco(B,r,rkPick(r,['pointears','roundears','horns','none','antenna1']),hx-d*HR*.1,hy-HR*.7,HR*1.4);
    B.part(rkE(hx,hy,HR,HR*.95,{n:34}),P.base,{w:10});
    B.part(rkE(hx+d*HR*.75,hy+HR*.25,HR*.45,HR*.32,{n:24}),P.belly,{w:7});B.dot(hx+d*HR*1.15,hy+HR*.12,HR*.16);
    B.ln(rkQuad(hx+d*HR*.6,hy+HR*.42,hx+d*HR*.85,hy+HR*.55,hx+d*HR*1.05,hy+HR*.4),5);
    rkFaceSide(B,r,hx+d*HR*.2,hy-HR*.15,HR*1.1,d,P.base,st)},
  // とり（横向き）
  bird(B,r,st){const P=B.pal,d=r()<.5?-1:1,cx=256,cy=290,RX=100+r()*20,RY=82+r()*14,hx=cx+d*RX*.7,hy=cy-RY*.95,HR=52+r()*8;
    for(let i=-1;i<=1;i++)B.part(rkE(cx-d*RX*1.05,cy-RY*.2+i*20,RX*.42,RY*.16,{ang:d*(-.3+i*.25)}),i?P.dark:P.acc);
    for(const k of[-.2,.2])B.ln([[cx+k*RX,cy+RY*.85],[cx+k*RX,cy+RY*1.4],[cx+k*RX+d*20,cy+RY*1.45]],6,P.C(30,80,45),true);
    B.part(rkE(cx,cy,RX,RY,{n:40,ang:d*-.15}),P.base,{w:10,inner:[{poly:rkE(cx+d*RX*.2,cy+RY*.35,RX*.6,RY*.5),c:P.belly}]});
    B.part([...rkQuad(cx+d*RX*.35,cy-RY*.25,cx-d*RX*.1,cy-RY*.5,cx-d*RX*.75,cy+RY*.05,10),...rkQuad(cx-d*RX*.75,cy+RY*.05,cx-d*RX*.1,cy+RY*.45,cx+d*RX*.35,cy-RY*.25,10).slice(1)],P.dark,{w:7});
    if(r()<.6)for(let i=0;i<3;i++)B.part(rkE(hx-d*HR*.3+d*i*12,hy-HR*.95,HR*.12,HR*.38,{ang:d*(.5-i*.35)}),P.acc,{w:5});
    else rkDeco(B,r,rkDecoOf(r,P.tk),hx,hy-HR*.8,HR*1.3);
    B.part(rkE(hx,hy,HR,HR,{n:30}),P.base,{w:10});
    B.part([[hx+d*HR*.75,hy-HR*.05],[hx+d*HR*1.55,hy+HR*.15],[hx+d*HR*.75,hy+HR*.38]],P.C(40,95,58),{w:6});
    rkFaceSide(B,r,hx+d*HR*.25,hy-HR*.15,HR*1.15,d,P.base,st)},
  // さかな（横向き）
  fish(B,r,st){const P=B.pal,d=r()<.5?-1:1,cx=256,cy=270,RX=130+r()*25,RY=70+r()*20;
    const tx=cx-d*RX*.9;B.part([[tx,cy],[tx-d*RX*.55,cy-RY*.85],[tx-d*RX*.4,cy],[tx-d*RX*.55,cy+RY*.85],[tx,cy]],P.acc,{w:7});
    B.part([[cx-d*RX*.35,cy-RY*.85],[cx-d*RX*.1,cy-RY*1.55],[cx+d*RX*.35,cy-RY*.9]],P.acc,{w:7});
    if(r()<.3)for(const k of[-.25,.2])B.part(rkCap(cx+k*RX,cy+RY*.7,cx+k*RX+d*8,cy+RY*1.5,14,13),P.dark);
    const body=rkE(cx,cy,RX,RY,{n:44}).map(([x,y])=>[x,y+(d*(x-cx)>0?0:Math.sin((x-cx)/RX*PI)*0)]);
    const sc=[];for(let i=0;i<3;i++)for(let j=-1;j<=1;j++){const x=cx-d*RX*.4+d*i*RX*.25,y=cy+j*RY*.32;sc.push({p:rkE(x,y,RY*.16,RY*.14,{a0:d>0?-PI/2:PI/2,a1:d>0?PI/2:PI*1.5,n:8}),w:3,c:P.dark})}
    B.part(body,P.base,{w:10,inner:[{poly:rkE(cx,cy,RX,RY,{a0:0,a1:PI,n:24}),c:P.belly},...(r()<.6?sc:[{p:[[cx-d*RX*.3,cy-RY*.95],[cx-d*RX*.3,cy+RY*.95]],w:10,c:P.dark},{p:[[cx+d*RX*.05,cy-RY],[cx+d*RX*.05,cy+RY]],w:10,c:P.dark}])]});
    B.part([[cx+d*RX*.05,cy+RY*.15],[cx-d*RX*.3,cy+RY*.55],[cx+d*RX*.2,cy+RY*.5]],P.acc2,{w:6});
    B.ln(rkQuad(cx+d*RX*.45,cy-RY*.55,cx+d*RX*.32,cy,cx+d*RX*.45,cy+RY*.55),6);
    if(r()<.5)rkDeco(B,r,rkDecoOf(r,P.tk),cx+d*RX*.55,cy-RY*.8,RY*1.1);
    rkFaceSide(B,r,cx+d*RX*.68,cy-RY*.2,RY*1.25,d,P.base,st);B.ln(rkQuad(cx+d*RX*.82,cy+RY*.3,cx+d*RX*.9,cy+RY*.42,cx+d*RX*.98,cy+RY*.25),5)},
  // いもむし・へび（からだのふし）
  worm(B,r,st){const P=B.pal,n=4+Math.floor(r()*3),d=r()<.5?-1:1,ph=r()*6,seg=[];
    for(let i=0;i<n;i++){const u=i/(n-1),x=256-d*(170-u*300),y=310+Math.sin(u*PI*1.6+ph)*45-u*40,R=38+u*30;seg.push([x,y,R])}
    for(const[x,y,R]of seg.slice(0,-1))for(const k of[-.4,.4])B.ln([[x+k*R,y+R*.7],[x+k*R+d*6,y+R*1.15]],6,P.dark,true);
    seg.forEach(([x,y,R],i)=>{if(i===n-1)return;B.part(rkE(x,y,R,R*.95,{n:26}),i%2?P.base:P.light,{w:8,inner:r()<.5?[{poly:rkE(x,y-R*.35,R*.25,R*.2),c:P.acc}]:[]})});
    const[hx,hy,HR]=seg[n-1];rkDeco(B,r,rkPick(r,['antenna','horns','antenna','none',rkDecoOf(r,P.tk)]),hx,hy-HR*.85,HR*1.6);
    B.part(rkE(hx,hy,HR*1.1,HR,{n:32}),P.base,{w:10,inner:[{poly:rkE(hx,hy+HR*.4,HR*.65,HR*.4),c:P.belly}]});rkFace(B,r,hx,hy-HR*.05,HR*1.05,P.base,st)},
  // クラゲ（ういている）
  jelly(B,r,st){const P=B.pal,cx=256,cy=230,R=110+r()*20,n=5;
    for(let i=0;i<n;i++){const x=cx-R*.7+i*R*1.4/(n-1),Pp=[];for(let k=0;k<=12;k++)Pp.push([x+Math.sin(k*.8+i)*12,cy+R*.25+k*15]);B.ln(Pp,8,P.dark)}
    const bell=[...rkE(cx,cy,R,R*.85,{a0:PI,a1:PI*2,n:30})];const sc=6;for(let i=0;i<=sc*4;i++){const u=i/(sc*4),x=cx+R-2*R*u;bell.push([x,cy+R*.22+Math.abs(Math.sin(u*sc*PI))*-18+10])}bell.push(bell[0]);
    B.part(bell,P.base,{w:10,inner:[{poly:rkE(cx-R*.35,cy-R*.45,R*.18,R*.1,{ang:-.5}),c:P.light},...[0,1,2].map(i=>({poly:rkE(cx-R*.45+i*R*.45,cy-R*.1+(i%2)*10,R*.08,R*.08),c:P.acc}))]});
    rkFace(B,r,cx,cy-R*.15,R*.9,P.base,st)},
  // くも型（ふわふわのふち）
  cloud(B,r,st){const P=B.pal,cx=256,cy=270,RX=130+r()*15,RY=95+r()*15;
    if(r()<.5)for(let i=0;i<3;i++){const x=cx-RX*.5+i*RX*.5,y=cy+RY*1.2;B.part([[x,y-14],[x+10,y+6],[x,y+16],[x-10,y+6],[x,y-14]],P.acc,{w:5})}
    rkDeco(B,r,rkDecoOf(r,P.tk),cx,cy-RY*.95,RY*1.2);
    B.part(rkBlobP(cx,cy,RX,RY,.1,7,r()*6,70,true),P.base,{w:10,inner:[{poly:rkE(cx-RX*.35,cy-RY*.5,RX*.22,RY*.12,{ang:-.4}),c:P.light},{poly:rkE(cx-RX*.62,cy-RY*.3,RX*.07,RY*.07),c:P.light}]});
    for(const sx of[-1,1])B.part(rkCap(cx+sx*RX*1.05,cy+RY*.1,cx+sx*RX*1.3,cy-RY*.1,RY*.13,RY*.11),P.base);
    rkFace(B,r,cx,cy-RY*.1,RY*1.15,P.base,st)},
  // むし
  bug(B,r,st){const P=B.pal,cx=256,cy=290,d=r()<.5?-1:1;
    for(const k of[-.5,0,.5])for(const sx of[-1,1])B.ln([[cx+k*90,cy+20],[cx+k*90+sx*30,cy+80],[cx+k*90+sx*45,cy+110]],6,P.line);
    const ax=cx-d*70;B.part(rkE(ax,cy,95,70,{n:36}),P.base,{w:9,inner:[0,1,2].map(i=>({p:[[ax-d*(20+i*25),cy-62+i*4],[ax-d*(20+i*25),cy+62-i*4]],w:10,c:P.dark}))});
    for(const sx of[-1,1])B.part(rkE(cx-d*40,cy-70+sx*8,85,34,{ang:d*(-.5+sx*.25)}),P.C(195,50,90),{w:6});
    B.part(rkE(cx+d*35,cy-5,50,48,{n:28}),P.dark,{w:9});
    const hx=cx+d*110,hy=cy-35;for(const sx of[-1,1])B.ln(rkQuad(hx+sx*20,hy-50,hx+sx*35,hy-100,hx+sx*60,hy-110),5);
    B.part(rkE(hx,hy,62,58,{n:30}),P.base,{w:10});rkFace(B,r,hx,hy-5,62,P.base,Object.assign({},st,{eye:st.eye==='one'?'normal':st.eye}))},
  // ロボット
  robot(B,r,st){const P=B.pal,cx=256,M=P.C(P.hue,10,72),Md=P.C(P.hue,10,52);
    const rr=(x,y,w,h,k=14)=>{const P2=[];const pts=[[x+w-k,y,-PI/2],[x+w-k,y+h-k*2+k,0],[x+k,y+h-k,PI/2],[x+k,y+k,PI]];for(const[px,py,a]of[[x+w-k,y+k,-PI/2],[x+w-k,y+h-k,0],[x+k,y+h-k,PI/2],[x+k,y+k,PI]])for(let i=0;i<=6;i++){const t=a+PI/2*i/6;P2.push([px+Math.cos(t)*k,py+Math.sin(t)*k])}P2.push(P2[0]);return P2};
    const wheels=r()<.4;
    if(wheels)for(const sx of[-1,1])B.part(rkE(cx+sx*55,420,32,32,{n:24}),Md,{w:8,inner:[{poly:rkE(cx+sx*55,420,12,12),c:M}]});
    else for(const sx of[-1,1])B.part(rr(cx+sx*50-20,370,40,70,10),Md);
    B.part(rr(cx-90,260,180,130,20),P.base,{w:10,inner:[{poly:rr(cx-50,285,100,70,10),c:P.C(190,60,25)},{poly:rkStarP(cx,320,22,10),c:P.acc}]});
    for(const sx of[-1,1]){B.ln([[cx+sx*90,290],[cx+sx*125,320],[cx+sx*130,360]],12,Md);B.part([[cx+sx*118,360],[cx+sx*130,385],[cx+sx*142,360],[cx+sx*130,372],[cx+sx*118,360]],M,{w:5})}
    for(const[x,y]of[[cx-75,272],[cx+75,272],[cx-75,378],[cx+75,378]])B.dot(x,y,8,Md);
    B.ln([[cx,170],[cx,130]],6,Md,true);B.part(rkE(cx,122,13,13,{n:16}),P.acc,{w:5});
    B.part(rr(cx-80,165,160,105,22),P.base,{w:10,inner:[{poly:rr(cx-60,180,120,60,12),c:P.C(190,60,22)}]});
    if(st.eye==='one'){B.part(rkE(cx,205,16,16),P.acc,{w:4})}else for(const sx of[-1,1])B.part(rr(cx+sx*28-12,195,24,22,6),P.acc,{w:4});
    B.ln([[cx-20,228],[cx-10,234],[cx,228],[cx+10,234],[cx+20,228]],4,P.acc,true)},
  // はちうえのお花モンスター
  pot(B,r,st){const P=B.pal,cx=256,hy=215,HR=78;
    for(const sx of[-1,1])B.part(rkE(cx+sx*70,330,70,26,{ang:sx*-.45}),P.C(110,55,48),{w:7,line:P.C(110,55,22)});
    B.ln([[cx,hy+HR],[cx,340]],10,P.C(110,55,30),true);
    const pc=rkPick(r,[P.acc,P.light,P.C(50,95,62)]),np=6+Math.floor(r()*3);for(let i=0;i<np;i++){const a=i/np*PI*2;B.part(rkE(cx+Math.cos(a)*HR*1.05,hy+Math.sin(a)*HR*1.05,HR*.42,HR*.3,{ang:a}),pc,{w:6})}
    B.part(rkE(cx,hy,HR,HR,{n:32}),P.C(48,90,72),{w:9});rkFace(B,r,cx,hy,HR*1.1,P.C(48,90,72),st);
    const pc2=P.C(rkPick(r,[18,200,340,45]),55,50);
    B.part([[cx-85,350],[cx+85,350],[cx+68,455],[cx-68,455],[cx-85,350]],pc2,{w:9});
    B.part([[cx-100,322],[cx+100,322],[cx+100,356],[cx-100,356],[cx-100,322]],P.C(rkPick(r,[18,200,340,45]),50,38),{w:9})},
  // おばけ
  ghost(B,r,st){const P=B.pal,cx=256,cy=260,RX=105+r()*15,RY=125;const bp=[...rkE(cx,cy-RY*.1,RX,RY*.85,{a0:PI,a1:PI*2,n:30})];
    const w=4;for(let i=0;i<=w*6;i++){const u=i/(w*6);bp.push([cx+RX-2*RX*u,cy+RY*.85+Math.sin(u*w*PI*2)*14])}bp.push(bp[0]);
    rkDeco(B,r,rkDecoOf(r,P.tk),cx,cy-RY*.85,RX*1.1);
    B.part(bp,P.base,{w:10,inner:[{poly:rkE(cx-RX*.4,cy-RY*.45,RX*.18,RY*.1,{ang:-.6}),c:P.light}]});
    for(const sx of[-1,1])B.part(rkCap(cx+sx*RX*.95,cy+RY*.1,cx+sx*RX*1.3,cy-RY*.05,RX*.12,RX*.09),P.base);
    rkFace(B,r,cx,cy-RY*.15,RX*1.1,P.base,st)},
  // いわのゴーレム
  golem(B,r,st){const P=B.pal,cx=256,cy=290,R=115,ph=r()*6;const body=[];for(let i=0;i<=9;i++){const t=ph+i/9*PI*2,m=.85+r()*.2;body.push([cx+Math.cos(t)*R*m,cy+Math.sin(t)*R*.95*m])}body[9]=body[0];
    for(const sx of[-1,1])B.part([[cx+sx*R*.25,cy+R*.75],[cx+sx*R*.7,cy+R*.75],[cx+sx*R*.65,cy+R*1.15],[cx+sx*R*.3,cy+R*1.15],[cx+sx*R*.25,cy+R*.75]],P.dark);
    rkDeco(B,r,rkDecoOf(r,P.tk),cx,cy-R*.8,R*1.1);
    B.part(body,P.base,{w:10,inner:[{p:[[cx+R*.45,cy-R*.6],[cx+R*.3,cy-R*.4],[cx+R*.42,cy-R*.3]],w:5,c:P.line},{p:[[cx-R*.6,cy+R*.3],[cx-R*.45,cy+R*.45],[cx-R*.52,cy+R*.6]],w:5,c:P.line}]});
    for(const sx of[-1,1])B.part([[cx+sx*R*.85,cy-R*.2],[cx+sx*R*1.3,cy],[cx+sx*R*1.25,cy+R*.45],[cx+sx*R*.9,cy+R*.35],[cx+sx*R*.85,cy-R*.2]],P.base,{w:8});
    rkFace(B,r,cx,cy-R*.2,R*1.05,P.base,st)}
};
// 角のまるい四角
function rkRR(x,y,w,h,k=14){const P=[];for(const[px,py,a]of[[x+w-k,y+k,-PI/2],[x+w-k,y+h-k,0],[x+k,y+h-k,PI/2],[x+k,y+k,PI]])for(let i=0;i<=6;i++){const t=a+PI/2*i/6;P.push([px+Math.cos(t)*k,py+Math.sin(t)*k])}P.push(P[0]);return P}
// 剣（にぎり x,y から角度 ang の向きに長さ L）
function rkSword(B,x,y,ang,L){const P=B.pal,c=Math.cos(ang),s=Math.sin(ang),nx=-s,ny=c,w=L*.075;
  const at=(t,o)=>[x+c*t+nx*o,y+s*t+ny*o];
  B.part([at(-L*.22,-w*.5),at(L*.02,-w*.5),at(L*.02,w*.5),at(-L*.22,w*.5),at(-L*.22,-w*.5)],P.C(25,45,32),{w:5});
  B.part([at(L*.05,-w),at(L*.88,-w),at(L*1.02,0),at(L*.88,w),at(L*.05,w),at(L*.05,-w)],P.C(210,15,88),{w:6,inner:[{p:[at(L*.1,0),at(L*.88,0)],w:3,c:P.C(210,15,65)}]});
  B.part([at(0,-w*2.6),at(L*.07,-w*2.6),at(L*.07,w*2.6),at(0,w*2.6),at(0,-w*2.6)],P.C(45,85,55),{w:5});
  B.dot(...at(-L*.26,0),w*1.5,P.C(45,85,55));}
/* 人型（剣士・騎士・魔法使い・弓使い）。正面・2.5頭身 */
RK_PLANS.human=function(B,r,st){
  const P=B.pal,C=P.C,role=B.want||rkPick(r,['sword','sword','knight','mage','archer']);B.role=role;
  const skin=rkPick(r,[C(28,70,84),C(25,55,72),C(24,45,56),C(32,60,88)]),hair=rkPick(r,[C(30,40,22),C(35,65,42),C(10,60,35),C(48,80,62),C(205,55,45),C(330,50,62),C(0,0,88),C(150,40,40)]);
  const cloth=P.base,cloth2=P.dark,trim=P.acc,boot=C(25,40,26);
  const cx=256,hy=160,HR=62,ty=232,th=96,tw=104,ly=ty+th,lh=84;
  const hs=role==='knight'||role==='mage'?'none':rkPick(r,['spiky','bob','long','pony']);
  // マント・うしろ髪・矢づつ（体のうしろ）
  if((role==='sword'||role==='knight')&&r()<.75)B.part([[cx-tw*.5,ty+6],[cx+tw*.5,ty+6],[cx+tw*.9,ly+lh*.9],[cx-tw*.9,ly+lh*.9],[cx-tw*.5,ty+6]],C(P.hue+180,55,40));
  if(role==='archer')B.part(rkRR(cx+tw*.15,ty-28,30,100,8),C(25,50,38));
  if(hs==='long')B.part(rkE(cx,hy+26,HR*1.12,HR*1.3,{n:30}),hair);
  if(hs==='pony')B.part(rkCap(cx+HR*.6,hy-HR*.4,cx+HR*1.2,hy+HR*1.0,HR*.3,HR*.16),hair);
  // 足（魔法使いはローブ）
  if(role!=='mage')for(const sx of[-1,1]){B.part(rkCap(cx+sx*tw*.22,ly-12,cx+sx*tw*.24,ly+lh-16,tw*.15,tw*.14),cloth2);B.part(rkE(cx+sx*tw*.27,ly+lh-6,tw*.21,tw*.12,{n:22}),boot)}
  else for(const sx of[-1,1])B.part(rkE(cx+sx*tw*.3,ly+lh-2,tw*.2,tw*.11,{n:22}),boot);
  // 体
  if(role==='mage')B.part([[cx-tw*.42,ty],[cx+tw*.42,ty],[cx+tw*.78,ly+lh-8],[cx-tw*.78,ly+lh-8],[cx-tw*.42,ty]],cloth,{inner:[{poly:[[cx-7,ty],[cx+7,ty],[cx+12,ly+lh-10],[cx-12,ly+lh-10]],c:trim},{poly:rkStarP(cx-tw*.35,ly+lh*.45,12,5),c:trim}]});
  else B.part(rkRR(cx-tw/2,ty,tw,th,20),cloth,{inner:[{poly:[[cx-tw/2,ly-26],[cx+tw/2,ly-26],[cx+tw/2,ly-12],[cx-tw/2,ly-12]],c:boot},{poly:rkRR(cx-9,ly-29,18,20,4),c:trim},
    ...(role==='knight'?[{poly:rkE(cx,ty+th*.32,tw*.36,th*.28),c:C(210,12,78)},{p:[[cx,ty+th*.1],[cx,ty+th*.55]],w:4,c:C(210,12,55)}]:[{poly:[[cx-tw*.18,ty],[cx,ty+th*.32],[cx+tw*.18,ty]],c:C(0,0,95)}])]});
  // うで・手
  const sh=ty+16,hand=[[cx-tw*.85,ty+th*.72],[cx+tw*.85,ty+th*.7]];
  for(const[i,sx]of[[0,-1],[1,1]]){B.part(rkCap(cx+sx*tw*.46,sh,hand[i][0],hand[i][1],tw*.13,tw*.12),role==='mage'?cloth:cloth2);B.part(rkE(hand[i][0],hand[i][1],tw*.12,tw*.12,{n:18}),skin,{w:6})}
  // 武器（右手）とたて（左手）
  const[rx,ry]=hand[1],[lx,lyy]=hand[0];
  if(role==='sword'||role==='knight')rkSword(B,rx,ry,-PI/2+.55,170);
  if(role==='mage'){B.part(rkCap(rx,ty-90,rx,ly+lh,7,7),C(28,50,35));B.part(rkE(rx,ty-100,20,20,{n:22}),trim,{w:6,inner:[{poly:rkE(rx-6,ty-106,6,6),c:'#ffffff'}]});
    for(const[dx,dy]of[[-30,-120],[28,-80]])B.part(rkStarP(rx+dx,ty+dy,10,4),C(50,95,65),{w:3})}
  if(role==='archer'){B.ln(rkQuad(lx+4,lyy-110,lx-50,lyy,lx+4,lyy+110,16),9,C(28,50,35));B.ln([[lx+4,lyy-110],[lx+4,lyy+110]],3,C(0,0,90),true)}
  if(role==='knight'||(role==='sword'&&r()<.45)){const sx2=lx-6,sy=lyy-6,heat=[[sx2-40,sy-44],[sx2+40,sy-44],[sx2+40,sy+4],[sx2,sy+52],[sx2-40,sy+4],[sx2-40,sy-44]];
    B.part(heat,trim,{w:7,inner:[{poly:[[sx2-26,sy-32],[sx2+26,sy-32],[sx2+26,sy+2],[sx2,sy+36],[sx2-26,sy+2],[sx2-26,sy-32]],c:C(P.hue+180,55,45)},{poly:rkStarP(sx2,sy-4,14,6),c:trim}]})}
  // 首・頭（魔法使いは帽子の下に髪）
  if(role==='mage')B.part(rkE(cx,hy+12,HR*1.12,HR*1.0,{n:30}),hair);
  B.part(rkRR(cx-14,hy+HR*.78,28,30,6),skin,{w:6});
  B.part(rkE(cx,hy,HR,HR*1.02,{n:36}),skin,{w:8});
  // 髪・かぶと・ぼうし（顔の上に）
  if(role==='knight'){B.part([...rkE(cx,hy-4,HR*1.1,HR*1.08,{a0:PI,a1:PI*2,n:22}),[cx+HR*1.1,hy+HR*.35],[cx+HR*.82,hy+HR*.35],[cx+HR*.82,hy-HR*.15],[cx-HR*.82,hy-HR*.15],[cx-HR*.82,hy+HR*.35],[cx-HR*1.1,hy+HR*.35],[cx-HR*1.1,hy-4]],C(210,12,74),{w:7,inner:[{p:[[cx,hy-HR*1.05],[cx,hy-HR*.2]],w:5,c:C(210,12,55)}]});
    B.part(rkE(cx,hy-HR*1.2,HR*.2,HR*.32,{n:18,ang:.3}),trim,{w:5})}
  else if(role==='mage'){B.part([[cx-HR*.95,hy-HR*.55],[cx+HR*.95,hy-HR*.55],[cx+HR*.3,hy-HR*1.6],[cx+HR*.7,hy-HR*2.1],[cx-HR*.05,hy-HR*1.75],[cx-HR*.95,hy-HR*.55]],cloth,{inner:[{poly:rkStarP(cx+HR*.05,hy-HR*1.05,13,6),c:trim}]});
    B.part(rkE(cx,hy-HR*.55,HR*1.45,HR*.28,{n:30}),cloth2,{w:7})}
  else{const top=rkE(cx,hy-2,HR*1.1,HR*1.1,{a0:PI*.95,a1:PI*2.05,n:22}),bang=[];const nb=4;for(let i=0;i<=nb*2;i++){const u=i/(nb*2);bang.push([cx+HR*1.05-u*HR*2.1,hy-HR*(i%2?.15:.35)])}
    B.part([...top,...bang,top[0]],hair,{w:7});
    if(hs==='spiky')for(let i=0;i<3;i++){const x=cx-HR*.6+i*HR*.6;B.part([[x-20,hy-HR*.9],[x+(i-1)*14,hy-HR*1.55],[x+20,hy-HR*.9]],hair,{w:6})}}
  rkFace(B,r,cx,hy+HR*.2,HR*.9,skin,Object.assign({},st,{eye:st.eye==='one'?'normal':st.eye,mouth:rkPick(r,['smile','open','w','grin','o'])}));
};
/* ドラゴン（横向き・つばさとツノ） */
RK_PLANS.dragon=function(B,r,st){
  const P=B.pal,C=P.C,d=r()<.5?-1:1,cx=256,cy=300,RX=118,RY=68,belly=P.belly,mem=rkPick(r,[P.acc2,P.light,C(P.hue+30,60,70)]);
  const wing=(ox,oy,k,fill)=>{const pts=[[ox,oy],[ox-d*30*k,oy-150*k],[ox-d*110*k,oy-130*k],[ox-d*175*k,oy-60*k],[ox-d*120*k,oy-40*k],[ox-d*90*k,oy+5*k],[ox,oy]];
    B.part(pts,fill,{w:7,inner:[{p:[[ox,oy],[ox-d*110*k,oy-130*k]],w:4,c:P.dark},{p:[[ox,oy],[ox-d*175*k,oy-60*k]],w:4,c:P.dark}]})};
  wing(cx+d*20,cy-RY*.55,.85,P.dark);                                   // 向こうのつばさ
  for(const k of[-.5,.5])B.part(rkCap(cx+k*RX+d*12,cy+RY*.3,cx+k*RX+d*20,cy+RY*1.45,RY*.24,RY*.2),P.dark);
  // しっぽ（太い→細い）と先のとげ
  const tl=[...rkQuad(cx-d*RX*.75,cy-RY*.35,cx-d*RX*1.55,cy-RY*.2,cx-d*RX*1.95,cy-RY*1.05,12),...rkQuad(cx-d*RX*1.95,cy-RY*1.05,cx-d*RX*1.45,cy+RY*.55,cx-d*RX*.6,cy+RY*.45,12).slice(1)];tl.push(tl[0]);
  const tx=cx-d*RX*1.95,tyy=cy-RY*1.05;B.part([[tx,tyy+14],[tx-d*14,tyy-28],[tx+d*26,tyy-16],[tx,tyy+14]],P.acc,{w:6});
  B.part(tl,P.base,{w:9});
  for(let i=0;i<5;i++){const u=i/4,x=cx-d*RX*(.6-u*1.2),y=cy-RY*Math.sqrt(Math.max(0,1-((x-cx)/RX)**2))+4;B.part([[x-12,y+6],[x-d*4,y-26],[x+12,y+6]],P.acc,{w:5})}
  B.part(rkE(cx,cy,RX,RY,{n:44}),P.base,{w:10,inner:[{poly:rkE(cx+d*10,cy+RY*.4,RX*.78,RY*.5,{a0:0,a1:PI,n:22}),c:belly},...[-.4,0,.4].map(k=>({p:[[cx+d*10+k*RX*.7,cy+RY*.48],[cx+d*10+k*RX*.7,cy+RY*.88]],w:3,c:P.dark}))]});
  for(const k of[-.6,.45]){const x=cx+k*RX,y=cy+RY*.5;B.part(rkCap(x,y,x-d*6,y+RY*1.0,RY*.26,RY*.22),P.base);for(const c2 of[-1,0,1])B.ln([[x-d*6+c2*8,y+RY*1.15],[x-d*6+c2*9+d*6,y+RY*1.32]],4)}
  // 首と頭
  const nx=cx+d*RX*.75,ny=cy-RY*.35,hx=cx+d*RX*1.15,hy=cy-RY*1.75;
  B.part(rkCap(nx,ny,hx-d*12,hy+18,RY*.42,RY*.3),P.base,{w:9,inner:[{poly:rkCap(nx+d*8,ny+10,hx-d*4,hy+28,RY*.2,RY*.14),c:belly}]});
  for(const k of[0,1])B.part([...rkQuad(hx-d*(18+k*16),hy-20,hx-d*(40+k*20),hy-60,hx-d*(70+k*14),hy-78-k*6,8),...rkQuad(hx-d*(70+k*14),hy-78-k*6,hx-d*(30+k*12),hy-46,hx-d*(4+k*16),hy-22,8).slice(1)],P.acc,{w:5});
  B.part(rkE(hx,hy,52,42,{n:30}),P.base,{w:9});
  B.part(rkE(hx+d*44,hy+12,38,25,{n:26}),P.base,{w:8,inner:[{poly:rkE(hx+d*44,hy+26,30,9,{a0:0,a1:PI,n:12}),c:belly}]});
  B.dot(hx+d*70,hy+4,7);B.ln(rkQuad(hx+d*18,hy+26,hx+d*45,hy+34,hx+d*76,hy+20),5);
  for(const k of[0,1])B.part([[hx+d*(34+k*20),hy+28],[hx+d*(40+k*20),hy+42],[hx+d*(46+k*20),hy+29]],'#ffffff',{w:3});
  rkFaceSide(B,r,hx+d*6,hy-12,46,d,P.base,Object.assign({},st,{eye:rkPick(r,['angry','normal','angry'])}));
  wing(cx-d*10,cy-RY*.5,1,mem);                                          // 手前のつばさ
};
/* 子どものドラゴン（正面） */
RK_PLANS.babydragon=function(B,r,st){
  const P=B.pal,C=P.C,cx=256,hy=205,HR=88,by=hy+HR*1.15,BR=HR*.68,mem=rkPick(r,[P.acc2,P.light]);
  for(const sx of[-1,1])B.part([[cx+sx*BR*.5,by-BR*.3],[cx+sx*BR*1.9,by-BR*1.2],[cx+sx*BR*1.7,by-BR*.5],[cx+sx*BR*2.0,by-BR*.15],[cx+sx*BR*.9,by+BR*.2],[cx+sx*BR*.5,by-BR*.3]],mem,{w:7});
  B.part([...rkQuad(cx+BR*.6,by+BR*.6,cx+BR*1.8,by+BR*.9,cx+BR*1.6,by-BR*.1,10),...rkQuad(cx+BR*1.6,by-BR*.1,cx+BR*1.4,by+BR*.5,cx+BR*.5,by+BR*.25,10).slice(1),[cx+BR*.6,by+BR*.6]],P.base,{w:8});
  for(const sx of[-1,1])B.part(rkCap(cx+sx*BR*.45,by+BR*.6,cx+sx*BR*.5,by+BR*1.2,BR*.24,BR*.25),P.dark);
  B.part(rkE(cx,by,BR,BR*1.05,{n:34}),P.base,{inner:[{poly:rkE(cx,by+BR*.2,BR*.58,BR*.65),c:P.belly},...[-.2,.15,.5].map(k=>({p:[[cx-BR*.45,by+k*BR],[cx+BR*.45,by+k*BR]],w:3,c:P.dark}))]});
  for(const sx of[-1,1])B.part(rkCap(cx+sx*BR*.85,by-BR*.15,cx+sx*BR*1.35,by+BR*.25,BR*.17,BR*.16),P.base);
  rkDeco(B,r,'horns',cx,hy-HR*.75,HR*1.15);
  B.part(rkBlobP(cx,hy,HR*1.08,HR*.92,.03,3,r()*6),P.base,{w:10,inner:[{poly:rkE(cx,hy+HR*.45,HR*.5,HR*.28),c:P.belly},{p:rkE(cx,hy,HR*.8,HR*.72,{a0:PI*1.12,a1:PI*1.32,n:8}),w:7,c:P.light}]});
  for(const sx of[-1,1])B.dot(cx+sx*HR*.15,hy+HR*.38,6);
  rkFace(B,r,cx,hy-HR*.08,HR*1.0,P.base,Object.assign({},st,{mouth:rkPick(r,['fang','open','grin'])}));
};
// 線のまわりを太らせた形（しょくしゅ・えだ・からだ）。L：点の列、r0→r1：太さ
function rkTube(L,r0,r1){const A=[],Bq=[];for(let i=0;i<L.length;i++){const a=L[Math.max(0,i-1)],b=L[Math.min(L.length-1,i+1)],g=Math.atan2(b[1]-a[1],b[0]-a[0]),w=r0+(r1-r0)*i/(L.length-1),nx=-Math.sin(g)*w,ny=Math.cos(g)*w;A.push([L[i][0]+nx,L[i][1]+ny]);Bq.unshift([L[i][0]-nx,L[i][1]-ny])}return[...A,...Bq,A[0]]}
/* 2026-11-23 追加の体のつくり */
// タコ（あしが6本）
RK_PLANS.octopus=function(B,r,st){const P=B.pal,cx=256,hy=200,RX=105+r()*15,RY=95+r()*15;
  for(let i=0;i<6;i++){const k=i-2.5,x0=cx+k*30,y0=hy+RY*.6,L=rkQuad(x0,y0,x0+k*25+(r()-.5)*50,y0+95,x0+k*58+(r()-.5)*30,y0+150+r()*35,10);
    B.part(rkTube(L,20,7),i%2?P.base:P.dark,{w:7,inner:[0,1,2].map(j=>({p:[L[3+j*2]],w:9,c:P.belly}))})}
  B.part(rkE(cx,hy,RX,RY,{n:40}),P.base,{w:10,inner:[{poly:rkE(cx+RX*.45,hy-RY*.45,RX*.13,RY*.11),c:P.dark},{poly:rkE(cx-RX*.5,hy-RY*.25,RX*.09,RY*.08),c:P.dark}]});
  rkFace(B,r,cx,hy+RY*.2,RX*.95,P.base,st)};
// キノコ（かさの下に顔）
RK_PLANS.mushroom=function(B,r,st){const P=B.pal,cx=256,cy=250,W=150+r()*20,H=110+r()*20;
  B.part(rkRR(cx-58,cy-10,116,160,40),P.belly,{w:9});
  for(const sx of[-1,1])B.part(rkCap(cx+sx*55,cy+60,cx+sx*95,cy+95,14,12),P.belly);
  const cap=[...rkE(cx,cy,W,H,{a0:PI,a1:PI*2,n:30}),...rkQuad(cx+W,cy,cx,cy+40,cx-W,cy,12).slice(1)];
  B.part(cap,P.base,{w:10,inner:[0,1,2,3].map(i=>({poly:rkE(cx-W*.55+i*W*.37,cy-H*(.35+(i%2)*.3),18+r()*10,14+r()*8),c:'#ffffff'}))});
  rkFace(B,r,cx,cy+70,100,P.belly,st)};
// カニ（横長の体・はさみ・目玉のぼう）
RK_PLANS.crab=function(B,r,st){const P=B.pal,cx=256,cy=300,RX=125,RY=72;
  for(const sx of[-1,1])for(let k=0;k<3;k++)B.ln([[cx+sx*(40+k*30),cy+RY*.5],[cx+sx*(95+k*28),cy+RY*.9],[cx+sx*(110+k*28),cy+RY*1.5]],8,null,true);
  for(const sx of[-1,1]){B.part(rkCap(cx+sx*RX*.8,cy-RY*.3,cx+sx*RX*1.25,cy-RY*1.3,16,14),P.base);
    const hx=cx+sx*RX*1.3,hy=cy-RY*1.75;B.part([[hx,hy],...rkE(hx,hy,48,42,{a0:sx>0?-1.9:PI-1.2+.0,a1:sx>0?2.9:PI+3.1,n:20}),[hx,hy]],P.base,{w:8})}
  for(const sx of[-1,1]){B.ln([[cx+sx*35,cy-RY*.7],[cx+sx*45,cy-RY*1.6]],8,null,true);B.part(rkE(cx+sx*45,cy-RY*1.75,22,22,{n:20}),'#ffffff',{w:6});B.dot(cx+sx*48,cy-RY*1.72,16)}
  B.part(rkE(cx,cy,RX,RY,{n:44}),P.base,{w:10,inner:[{poly:rkE(cx,cy+RY*.35,RX*.6,RY*.35,{a0:0,a1:PI,n:16}),c:P.belly}]});
  rkFace(B,r,cx,cy-RY*.1,RX*.75,P.base,Object.assign({},st,{eye:'none'}))};
// コウモリ（ひらいたつばさ）
RK_PLANS.bat=function(B,r,st){const P=B.pal,cx=256,cy=270,R=70+r()*10;
  for(const sx of[-1,1]){const w=[[cx+sx*R*.6,cy-R*.4],[cx+sx*R*1.6,cy-R*1.3],[cx+sx*R*2.9,cy-R*.9]];for(let i=0;i<3;i++){const x0=cx+sx*R*(2.9-i*.8),x1=cx+sx*R*(2.1-i*.8);w.push(...rkQuad(x0,cy-R*(.9-i*.25)+(i?0:0),(x0+x1)/2,cy-R*(.2-i*.25),x1,cy-R*(.6-i*.25),6).slice(1))}w.push([cx+sx*R*.6,cy+R*.3],w[0]);B.part(w,P.dark,{w:8})}
  for(const sx of[-1,1])B.part([[cx+sx*R*.2,cy-R*.75],[cx+sx*R*.65,cy-R*1.6],[cx+sx*R*.85,cy-R*.6]],P.base,{w:7});
  for(const sx of[-1,1])B.ln([[cx+sx*R*.3,cy+R*.85],[cx+sx*R*.35,cy+R*1.2]],7,null,true);
  B.part(rkE(cx,cy,R,R*1.05,{n:34}),P.base,{w:10,inner:[{poly:rkE(cx,cy+R*.4,R*.5,R*.4),c:P.belly}]});
  rkFace(B,r,cx,cy-R*.15,R*1.1,P.base,Object.assign({},st,{mouth:rkPick(r,['fang','fang','smile','o'])}))};
// カタツムリ（うずまきのから）
RK_PLANS.snail=function(B,r,st){const P=B.pal,d=r()<.5?-1:1,cx=256,cy=330;
  const body=[...rkQuad(cx+d*150,cy+40,cx,cy+60,cx-d*150,cy+40,12),...rkQuad(cx-d*150,cy+40,cx-d*175,cy-60,cx-d*150,cy-110,8).slice(1),...rkQuad(cx-d*150,cy-110,cx-d*90,cy-40,cx+d*150,cy+5,10).slice(1)];body.push(body[0]);
  for(const k of[-1,1])B.ln(rkQuad(cx-d*(150+k*12),cy-105,cx-d*(160+k*28),cy-150,cx-d*(150+k*40),cy-180),6);
  for(const k of[-1,1])B.part(rkE(cx-d*(150+k*40),cy-185,11,11,{n:14}),P.belly,{w:5});
  B.part(body,P.belly,{w:9});
  const sx=cx+d*30,sy=cy-60,sR=105+r()*15,sp=[];for(let i=0;i<=60;i++){const t=i/60*PI*5,rr=sR*.85*(1-i/66);sp.push([sx+Math.cos(t)*rr*d,sy+Math.sin(t)*rr])}
  B.part(rkE(sx,sy,sR,sR*.95,{n:40}),P.base,{w:10,inner:[{p:sp,w:6,c:P.dark}]});
  rkFace(B,r,cx-d*140,cy-50,80,P.belly,Object.assign({},st,{eye:st.eye==='one'?'normal':st.eye}))};
// スライム（しずく形・たれている）
RK_PLANS.slime=function(B,r,st){const P=B.pal,cx=256,cy=300,R=120+r()*20,tip=cy-R*1.5-r()*30;
  const body=[...rkE(cx,cy,R,R*.8,{a0:0,a1:PI,n:24}),...rkQuad(cx-R,cy,cx-R*.6,cy-R*.9,cx,tip,10).slice(1),...rkQuad(cx,tip,cx+R*.6,cy-R*.9,cx+R,cy,10).slice(1)];
  for(let i=0;i<3;i++)B.part(rkE(cx-R*.9+i*R*.9+(r()-.5)*30,cy+R*.95,16,11,{n:14}),P.base,{w:6});
  B.part(body,P.base,{w:10,inner:[{poly:rkE(cx,cy+R*.3,R*.55,R*.3),c:P.light}]});
  rkFace(B,r,cx,cy-R*.1,R*.95,P.base,st)};
// 木（みきに顔・えだのうで）
RK_PLANS.tree=function(B,r,st){const P=B.pal,C=P.C,cx=256,bark=C(28,45,38),leaf=P.tk==='plant'||r()<.5?C(105+r()*30,50,45):P.base;
  for(const k of[-1,0,1])B.ln(rkQuad(cx+k*30,420,cx+k*60,440,cx+k*95,450),9,bark,false);
  for(const sx of[-1,1])B.part(rkTube(rkQuad(cx+sx*45,300,cx+sx*110,280,cx+sx*150,230,8),16,8),bark,{w:7});
  B.part(rkRR(cx-62,230,124,200,26),bark,{w:10,inner:[{p:rkQuad(cx-40,380,cx-30,330,cx-45,290,6),w:4,c:C(28,45,26)}]});
  B.part(rkBlobP(cx,175,155+r()*20,105+r()*15,.1,7,r()*6,70,true),leaf,{w:10,inner:[0,1,2].map(i=>({poly:rkE(cx-90+i*90,150+(i%2)*40,14,14),c:rkPick(r,[C(0,75,55),C(45,90,60),C(330,70,72)])}))});
  rkFace(B,r,cx,300,105,bark,st)};
// カメ（横向き・こうらのもよう）
RK_PLANS.turtle=function(B,r,st){const P=B.pal,d=r()<.5?-1:1,cx=256,cy=290,RX=120,RY=85;
  for(const k of[-.55,.45])B.part(rkE(cx+k*RX,cy+RY*.55,26,34,{n:20}),P.belly);
  B.part(rkCap(cx-d*RX*.9,cy+RY*.2,cx-d*RX*1.15,cy+RY*.35,14,8),P.belly);
  const hx=cx+d*RX*1.12,hy=cy-RY*.05;B.part(rkCap(cx+d*RX*.7,cy+RY*.15,hx,hy,26,34),P.belly,{w:9});
  const shell=[...rkE(cx,cy+RY*.25,RX,RY*1.15,{a0:PI,a1:PI*2,n:30}),[cx-RX,cy+RY*.25]];
  const hex=[];for(let i=-1;i<=1;i++)hex.push({poly:rkE(cx+i*RX*.55,cy-RY*.35+(i?RY*.25:0),RX*.22,RY*.22,{n:6}),c:P.dark});
  B.part(shell,P.base,{w:10,inner:hex});B.ln([[cx-RX*1.02,cy+RY*.28],[cx+RX*1.02,cy+RY*.28]],12,P.dark,true);
  rkFaceSide(B,r,hx+d*6,hy-8,48,d,P.belly,st);B.ln(rkQuad(hx+d*10,hy+16,hx+d*22,hy+24,hx+d*32,hy+14),5)};
// サメ（横向き・大きな背びれと歯）
RK_PLANS.shark=function(B,r,st){const P=B.pal,d=r()<.5?-1:1,cx=256,cy=280,RX=165,RY=62;
  const tx=cx-d*RX*.92;B.part([[tx,cy],[tx-d*80,cy-85],[tx-d*45,cy],[tx-d*80,cy+70],[tx,cy]],P.dark,{w:8});
  B.part([[cx-d*30,cy-RY*.8],[cx-d*5,cy-RY*2.1],[cx+d*55,cy-RY*.8]],P.dark,{w:8});
  B.part([[cx+d*10,cy+RY*.5],[cx-d*20,cy+RY*1.5],[cx+d*50,cy+RY*.6]],P.dark,{w:7});
  B.part(rkE(cx,cy,RX,RY,{n:44}),P.base,{w:10,inner:[{poly:rkE(cx+d*20,cy+RY*.45,RX*.85,RY*.5,{a0:0,a1:PI,n:22}),c:P.belly},...[0,1,2].map(i=>({p:rkQuad(cx+d*(RX*.45-i*16),cy-RY*.35,cx+d*(RX*.4-i*16),cy,cx+d*(RX*.45-i*16),cy+RY*.25,6),w:4,c:P.dark}))]});
  const mx=cx+d*RX*.62,my=cy+RY*.38;B.part([[mx-d*40,my],[mx+d*40,my-6],[mx+d*30,my+20],[mx-d*30,my+22],[mx-d*40,my]],P.C(355,55,30),{w:6,inner:[0,1,2,3].map(i=>({poly:[[mx-d*(30-i*18),my+1],[mx-d*(22-i*18),my+14],[mx-d*(14-i*18),my+1]],c:'#ffffff'}))});
  rkFaceSide(B,r,cx+d*RX*.62,cy-RY*.3,60,d,P.base,Object.assign({},st,{eye:'angry'}))};
// ふしぎな火の鳥（正面・大きなつばさと長い尾）
RK_PLANS.phoenix=function(B,r,st){const P=B.pal,C=P.C,cx=256,cy=250,f1=C(15,90,55),f2=C(40,95,58);
  for(let i=0;i<3;i++){const a=(i-1)*.35;B.part(rkTube(rkQuad(cx,cy+60,cx+Math.sin(a)*60,cy+150,cx+Math.sin(a)*130,cy+230,8),18,4),i===1?f2:f1,{w:6})}
  for(const sx of[-1,1]){const w=[[cx+sx*30,cy-10],[cx+sx*90,cy-125],[cx+sx*150,cy-110],[cx+sx*215,cy-60],[cx+sx*170,cy-30],[cx+sx*195,cy+5],[cx+sx*120,cy+10],[cx+sx*60,cy+55],[cx+sx*30,cy-10]];B.part(w,f1,{w:8,inner:[{poly:[[cx+sx*45,cy],[cx+sx*110,cy-90],[cx+sx*150,cy-60],[cx+sx*90,cy+25]],c:f2}]})}
  B.part(rkE(cx,cy+20,58,72,{n:30}),P.base,{w:9,inner:[{poly:rkE(cx,cy+40,32,40),c:P.belly}]});
  for(let i=0;i<3;i++)B.part(rkE(cx+(i-1)*22,cy-100-(i===1?14:0),10,26,{ang:(i-1)*.4}),f2,{w:5});
  B.part(rkE(cx,cy-55,44,42,{n:28}),P.base,{w:9});B.part([[cx-12,cy-45],[cx,cy-25],[cx+12,cy-45]],C(45,95,55),{w:5});
  rkFace(B,r,cx,cy-62,62,P.base,Object.assign({},st,{mouth:'none',cheek:false}))};
// ヘビ（とぐろを巻く）
RK_PLANS.snake=function(B,r,st){const P=B.pal,d=r()<.5?-1:1,cx=256;
  const L=[];for(let i=0;i<=40;i++){const t=i/40,a=t*PI*3.2,R=150-t*95;L.push([cx+Math.cos(a)*R*d,330+Math.sin(a)*R*.42-t*40])}
  B.part(rkTube(L,20,30),P.base,{w:9,inner:L.filter((_,i)=>i%5===2).map(q=>({poly:rkE(q[0],q[1],11,8),c:P.dark}))});
  const[ex,ey]=L[L.length-1],hx=ex,hy=ey-80;B.part(rkTube(rkQuad(ex,ey,ex+d*20,ey-40,hx,hy,8),30,26),P.base,{w:9,inner:[{poly:rkTube(rkQuad(ex,ey,ex+d*20,ey-40,hx,hy,8),14,10),c:P.belly}]});
  B.part(rkE(hx,hy-20,56,44,{n:30}),P.base,{w:9});B.ln([[hx+d*40,hy],[hx+d*70,hy+6],[hx+d*82,hy-4]],4,P.C(355,75,50));B.ln([[hx+d*70,hy+6],[hx+d*82,hy+14]],4,P.C(355,75,50));
  rkFace(B,r,hx,hy-28,72,P.base,Object.assign({},st,{mouth:'none',cheek:false}))};
// クモ（8本あし）
RK_PLANS.spider=function(B,r,st){const P=B.pal,cx=256,cy=290;
  for(const sx of[-1,1])for(let k=0;k<4;k++){const y=cy-30+k*22;B.ln([[cx+sx*40,y],[cx+sx*(110+k*8),y-60+k*18],[cx+sx*(150+k*10),y+60+k*12]],9,null,false)}
  B.part(rkE(cx,cy+70,95,80,{n:36}),P.dark,{w:10,inner:[{poly:rkStarP(cx,cy+75,26,12,4,0),c:P.acc}]});
  B.part(rkE(cx,cy-20,72,62,{n:32}),P.base,{w:10});
  for(const sx of[-1,1])B.part([[cx+sx*12,cy+30],[cx+sx*20,cy+58],[cx+sx*28,cy+30]],'#ffffff',{w:4});
  rkFace(B,r,cx,cy-30,80,P.base,Object.assign({},st,{eye:rkPick(r,['normal','angry','one']),mouth:'none'}))};
/* ---- 演出（2026-11-23）：オーラ・ほのお・いなずま・まほうじん・きらきら・スピード線・ひかるたま。0〜3こ。
   多いほど「演出がしっかりした絵」としてコストが上がる（makecard.js の rkStage） ---- */
const RK_FX={
  rays:{back:1,f(B,r,b){const P=B.pal;B.part(rkStarP(b.cx,b.cy,b.R*1.3,b.R*1.02,14+Math.floor(r()*6),r()),P.C(P.hue+30,80,82),{w:6})}},
  ring:{back:1,f(B,r,b){const P=B.pal,y=b.y1-4;B.part(rkE(b.cx,y,b.R*.95,b.R*.22,{n:40}),P.C(P.hue+180,60,62),{w:6,inner:[{p:rkE(b.cx,y,b.R*.7,b.R*.15,{n:30}),w:4,c:P.C(P.hue+180,60,40)},...[0,1,2,3].map(i=>({poly:rkStarP(b.cx+Math.cos(i*PI/2)*b.R*.82,y+Math.sin(i*PI/2)*b.R*.18,10,4),c:P.C(50,95,62)}))]})}},
  flames:{back:1,f(B,r,b){for(let i=0;i<5;i++){const a=PI*(.15+i*.175),x=b.cx-Math.cos(a)*b.R*.95,y=b.y1-Math.sin(a)*b.R*.55;rkDeco(B,r,'flame',x,y+b.R*.1,b.R*.55)}}},
  bolts:{back:0,f(B,r,b){const P=B.pal,c=P.C(52,100,60);for(const sx of[-1,1]){const x=b.cx+sx*b.R*1.05,y=b.cy-b.R*.45,s=b.R*.45;B.part([[x,y-s],[x-sx*s*.35,y],[x+sx*s*.05,y],[x-sx*s*.25,y+s],[x+sx*s*.45,y-s*.15],[x+sx*s*.05,y-s*.15],[x+sx*s*.3,y-s],[x,y-s]],c,{w:6})}}},
  sparkle:{back:0,f(B,r,b){const P=B.pal;for(let i=0;i<5;i++){const a=r()*PI*2,d=b.R*(1+r()*.25);B.part(rkStarP(b.cx+Math.cos(a)*d,b.cy+Math.sin(a)*d*.9,14+r()*10,5,4),P.C(50,95,65),{w:4})}}},
  speed:{back:1,f(B,r,b){const d=r()<.5?-1:1;for(let i=0;i<4;i++){const y=b.cy-b.R*.5+i*b.R*.33,x=b.cx-d*b.R*(1.05+(i%2)*.15);B.ln([[x,y],[x-d*b.R*(.45+r()*.25),y]],7,null,true)}}},
  orbs:{back:0,f(B,r,b){const P=B.pal;for(let i=0;i<3;i++){const a=-PI/2+(i-1)*1.1,x=b.cx+Math.cos(a)*b.R*1.15,y=b.cy+Math.sin(a)*b.R*1.05;B.part(rkE(x,y,b.R*.12,b.R*.12,{n:18}),P.acc,{w:5,inner:[{poly:rkE(x-b.R*.03,y-b.R*.03,b.R*.04,b.R*.04),c:'#ffffff'}]})}}}
};
function rkAddFx(B,r,n,want){   // want：演出をえらぶとき（基本カードの絵）
  if(!n)return[];let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;for(const s of B.S)for(const[x,y]of(s.p||s.poly||[])){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y)}
  const b={cx:(x0+x1)/2,cy:(y0+y1)/2,R:Math.max(x1-x0,y1-y0)/2,y1},keys=want||Object.keys(RK_FX).sort(()=>r()-.5).slice(0,n),body=B.S.splice(0),back=[],front=[];
  for(const k of keys){B.S.length=0;RK_FX[k].f(B,r,b);(RK_FX[k].back?back:front).push(...B.S)}
  B.S.length=0;B.S.push(...back,...body,...front);return keys;
}
const RK_PLAN_W={chibi:1.3,headbody:1.1,quad:1.3,bird:1,fish:1,worm:.8,jelly:.8,cloud:.8,bug:.8,robot:.9,pot:.8,ghost:.8,golem:.8,human:1.8,dragon:1.3,babydragon:.9,
  octopus:.9,mushroom:.9,crab:.9,bat:.9,snail:.9,slime:.9,tree:.9,turtle:.9,shark:.9,phoenix:.8,snake:.9,spider:.8};
function rkRndMonster(r){
  // 体のつくりに合うテーマ（さかな→みず多め、おばけ→おばけ多め…）
  let plan;{let t=r()*Object.values(RK_PLAN_W).reduce((a,b)=>a+b,0);for(const k in RK_PLAN_W){t-=RK_PLAN_W[k];if(t<=0){plan=k;break}}plan=plan||'chibi'}
  const lean={fish:'water',jelly:'water',ghost:'ghost',golem:'rock',pot:'plant',robot:'elec',cloud:'star',dragon:'dragon',babydragon:'dragon',octopus:'water',crab:'water',mushroom:'plant',tree:'plant',bat:'ghost',snail:'plant',turtle:'water',shark:'water',phoenix:'fire',snake:'plant',spider:'ghost'}[plan];
  const tk=lean&&r()<.6?lean:rkPick(r,Object.keys(RK_THEME));
  const B=rkBuild(rkPal(r,tk)),st=rkStyle(r);
  RK_PLANS[plan](B,r,st);
  // 演出：0こ30%・1こ35%・2こ25%・3こ10%
  const u=r(),nfx=u<.3?0:u<.65?1:u<.9?2:3,fx=rkAddFx(B,r,nfx);
  const S=rkFit(B.S);S.meta={plan,tk,role:B.role||'',fx:fx.length};   // 何をかいたか（カードの名前・能力を合わせる。naming.js の rkWho）
  return S;
}
// 絵ぜんたいを紙のまん中に、ちょうどよい大きさでおさめる
function rkFit(S){
  let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const each=f=>{for(const s of S){for(const q of(s.p||s.poly||[]))f(q,(s.w||0)/2);for(const t of(s.inner||[]))for(const q of(t.p||t.poly||[]))f(q,(t.w||0)/2)}};
  each(([x,y],h)=>{x0=Math.min(x0,x-h);x1=Math.max(x1,x+h);y0=Math.min(y0,y-h);y1=Math.max(y1,y+h)});
  const k=Math.min(1.3,440/Math.max(x1-x0,y1-y0)),ox=256-(x0+x1)/2*k,oy=262-(y0+y1)/2*k;
  const T=P=>P.map(([x,y])=>[x*k+ox,y*k+oy]),fx=s=>{if(s.p)s.p=T(s.p);if(s.poly)s.poly=T(s.poly);if(s.w)s.w*=k;if(s.inner)s.inner.forEach(fx)};
  S.forEach(fx);return S;
}
/* ---- おてほんを少しくずして、ところごとに色をぬる ----
   f：ぬるところ（おてほんの座標）と色の役わり m=メイン s=サブ a=アクセント e=目（黒） n=はな g=肌の緑 k=タイヤ l=銀 b=茶 */
const RK_TPLFILL={
  'ねこ':{m:[[30,70,60],[0,0,55],[35,60,80],[25,20,30]],s:[345,70,82],f:[[256,180,'m'],[190,122,'s'],[322,122,'s'],[256,430,'m'],[212,222,'e'],[300,222,'e'],[256,263,'n']]},
  'いぬ':{m:[[30,55,70],[40,70,85],[25,40,45]],s:[25,45,38],f:[[256,175,'m'],[135,245,'s'],[377,245,'s'],[256,430,'m'],[216,205,'e'],[296,205,'e'],[256,250,'e']]},
  'うさぎ':{m:[[0,0,96],[30,30,80],[330,40,85]],s:[345,70,82],f:[[256,250,'m'],[212,140,'s'],[300,140,'s'],[256,450,'m'],[222,282,'e'],[290,282,'e'],[256,313,'n']]},
  'さかな':{m:[[200,70,58],[25,85,60],[330,60,65]],s:[48,90,62],f:[[160,280,'m'],[300,280,'m'],[420,256,'s'],[262,172,'s'],[168,236,'e']]},
  'とり':{m:[[200,65,60],[0,70,55],[50,85,62]],s:[200,55,80],f:[[300,330,'m'],[150,205,'m'],[78,204,'a'],[290,262,'s'],[410,282,'s'],[138,188,'e']]},
  'かめ':{m:[[100,45,42],[30,50,42]],s:[60,50,70],f:[[256,262,'s'],[160,270,'m'],[350,270,'m'],[446,280,'g'],[166,312,'g'],[346,312,'g'],[456,268,'e']]},
  'ドラゴン':{m:[[120,55,45],[0,65,48],[220,55,50]],s:[45,70,75],f:[[150,190,'m'],[133,115,'a'],[180,115,'a'],[306,350,'m'],[350,200,'s'],[142,170,'e'],[455,460,'a']]},
  'ひと':{m:[[28,60,80]],s:[28,60,80],f:[[256,100,'m'],[240,112,'e'],[272,112,'e']]},
  'くるま':{m:[[0,75,55],[210,70,50],[50,90,58],[130,50,45]],s:[195,70,82],f:[[120,295,'m'],[400,295,'m'],[232,226,'s'],[310,226,'s'],[170,352,'k'],[350,352,'k'],[170,330,'l'],[350,330,'l']]},
  'おしろ':{m:[[35,15,82]],s:[35,12,72],f:[[220,330,'m'],[110,320,'s'],[400,320,'s'],[118,160,'a'],[394,160,'a'],[256,420,'b'],[132,66,'a'],[165,240,'m'],[229,240,'m'],[283,240,'m'],[347,240,'m']]},
  'けん':{m:[[210,15,82]],s:[45,85,58],f:[[244,200,'m'],[268,200,'l'],[256,343,'s'],[256,400,'b'],[256,456,'s']]},
  'ハート':{m:[[350,80,62],[0,80,58],[330,70,72]],s:[0,0,100],f:[[256,250,'m']]},
  'ほし':{m:[[48,95,60],[45,90,68]],s:[0,0,100],f:[[256,270,'m']]},
  'き':{m:[[110,55,45],[95,60,52],[130,45,40]],s:[25,45,38],f:[[256,240,'m'],[256,400,'s']]}
};
function rkRndTemplate(r){
  const T=rkPick(r,RK_TPL),F=RK_TPLFILL[T.n],line=rkPick(r,['#2b2b2b','#3a2a1e','#26324a']),sc=.86+r()*.16,rot=(r()-.5)*.18,cs=Math.cos(rot),sn=Math.sin(rot),dx=(r()-.5)*24,dy=(r()-.5)*20;
  const tf=([x,y])=>{x=(x-256)*sc;y=(y-256)*sc;return[256+dx+x*cs-y*sn,256+dy+x*sn+y*cs]};
  const S=T.s.map((p,i)=>({p:rkWobble(p.map(tf),r,2.2),w:i===0?10:8,c:line}));
  if(!F)return S;
  const hx=([h,s,l])=>rkHex(h,s,l);
  const col={m:hx(rkPick(r,F.m)),s:hx(F.s),e:'#2b2b2b',w:'#ffffff',n:rkHex(350,70,70),a:rkHex(rkPick(r,[45,0,30,200]),85,58),g:rkHex(95,45,55),k:'#3d3f44',l:'#c9ccd1',b:rkHex(25,50,35)};
  // ぬりはぜんぶの線をかいてから（線でかこまれたところだけ。ぬりつぶし）。目には光を入れる
  for(const[x,y,k]of F.f){const p=tf([x,y]);S.push({fillIn:p,fc:col[k]})}
  for(const[x,y,k]of F.f)if(k==='e'){const p=tf([x,y]);S.push({p:[[p[0]-3,p[1]-4]],w:5,c:'#ffffff'})}
  return S;
}
// ぬりつぶしの広さ（紙のほとんどがぬれてしまうとき＝形がとじていないときはぬらない）
function rkFillArea(x,y){
  const W=512,d=rk.bctx.getImageData(0,0,W,W).data;x=rkClamp(x|0,0,W-1);y=rkClamp(y|0,0,W-1);
  if(d[(y*W+x)*4+3]>=128)return 0;const seen=new Uint8Array(W*W),st=[y*W+x];let n=0;
  while(st.length){const k=st.pop();if(seen[k]||d[k*4+3]>=128)continue;seen[k]=1;if(++n>W*W*.45)return n;const px=k%W;if(px>0)st.push(k-1);if(px<W-1)st.push(k+1);if(k>=W)st.push(k-W);if(k<W*(W-1))st.push(k+W)}
  return n;
}
// 1コマ待つ（タブが裏にあって画面の更新が止まっていても進むよう、時計でも待つ）
const rkFrame=()=>new Promise(res=>{let done=false;const f=()=>{if(!done){done=true;res()}};requestAnimationFrame(f);setTimeout(f,20)});
const rkPts=P=>P.map(([x,y])=>({x:Math.round(rkClamp(x,1,511)*10)/10,y:Math.round(rkClamp(y,1,511)*10)/10,t:0}));
async function rkRandomDraw(){
  if(rk.busy)return;
  if(rkLive().length){const v=await modal('<h3>おまかせでかく</h3><p class="sub">いまの絵を消して、新しい絵をかきます。</p>',[['かく','y','pri'],['やめる','n']]);if(v!=='y')return}
  rkClear();rk.zoom={s:1,x:0,y:0};rkZoomApply();
  const r=rkRng((Date.now()^Math.floor(Math.random()*1e9))>>>0);
  const S=r()<.25?rkRndTemplate(r):rkRndMonster(r);
  rk.meta=S.meta||null;
  rk.busy=true;rk.auto=true;const jb=$('[data-act="judge"]');if(jb)jb.disabled=true;snd('magic');rkToolsUI();
  if(rk.t0==null)rk.t0=performance.now();
  const now=()=>Math.round(performance.now()-rk.t0);
  const put=a=>{rkApply(rk.bctx,a);rk.actions.push(a)};
  const putItem=s=>{if(s.poly)put({t:'poly',p:rkPts(s.poly),c:s.c,ts:now()});else if(s.p){const p=rkPts(s.p);p.forEach(q=>q.t=now());put({t:'s',c:s.c,w:Math.round(s.w*10)/10,p,poly:!!s.sharp})}};
  try{
    for(const s of S){
      if(!rk.pad)break;   // 画面を移った
      if(s.p&&!s.poly){
        // 線（部品のりんかくも）を少しずつかく
        const pts=rkPts(s.p),a={t:'s',c:s.c,w:Math.round(s.w*10)/10,p:[],poly:!!s.sharp};rk.cur=a;   // 部品は sharp（点が少ない形）のとき角をとがらせる
        const per=Math.max(1,Math.ceil(pts.length/6));
        for(let i=0;i<pts.length;i+=per){for(const q of pts.slice(i,i+per)){q.t=now();a.p.push(q)}sndPen(true,'pen',pts.length>2?.75:.3);rkSchedule();await rkFrame()}
        rk.cur=null;sndPen(false);
        if(s.part){put({t:'poly',p:rkPts(s.p),c:s.fill,ts:now()});snd('poly');for(const t of s.inner)putItem(t)}   // 部品：形をぬる→中のもよう→りんかく
        put(a);
      }else if(s.poly)putItem(s);
      // ぬりつぶし（おてほん）：とじた形の中だけ
      if(s.fillIn){
        const area=s.fillAny?1:rkFillArea(s.fillIn[0],s.fillIn[1]);
        if(area>0&&area<512*512*.45){put({t:'fill',x:Math.round(rkClamp(s.fillIn[0],1,510)),y:Math.round(rkClamp(s.fillIn[1],1,510)),c:s.fc,ts:now()});snd('fill')}
      }
      rkPaint();await rkFrame();
    }
  }finally{sndPen(false);rk.busy=false;rk.auto=false;rk.cur=null;if(jb)jb.disabled=false;rk.redo=[];rkPaint();rkToolsUI()}}
