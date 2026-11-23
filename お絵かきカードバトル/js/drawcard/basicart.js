'use strict';
/* ---- はじめからあるカードの絵（2026-11-23） ----
   おまかせ絵（random.js）の体のつくり・テーマ・演出を、カードの名前に合わせて決めてかく。
   たね（seed）を決めてあるので毎回同じ絵になる。起動のときに1回だけかいて rkArt に入れる（main.js） */
const RK_BASIC_ART={
  kolopo:{plan:'headbody',tk:'plant'},hinoko:{plan:'babydragon',tk:'fire',fx:['flames']},marin:{plan:'chibi',tk:'water',fx:['orbs']},
  luna:{plan:'human',role:'mage',tk:'star',fx:['sparkle']},noxs:{plan:'quad',tk:'ghost',fx:['speed']},volga:{plan:'quad',tk:'elec',fx:['bolts']},
  pikke:{plan:'chibi',tk:'fire'},goron:{plan:'golem',tk:'plant'},puchiru:{plan:'slime',tk:'water'},pirika:{plan:'bird',tk:'elec',fx:['speed']},
  fee:{plan:'pot',tk:'plant',fx:['sparkle']},imp:{plan:'bat',tk:'ghost'},moris:{plan:'tree',tk:'plant'},gard:{plan:'bug',tk:'plant'},
  raika:{plan:'quad',tk:'elec',fx:['orbs']},jin:{plan:'human',role:'sword',tk:'elec',fx:['bolts']},ars:{plan:'human',role:'knight',tk:'star',fx:['rays']},
  orca:{plan:'fish',tk:'water'},zekt:{plan:'ghost',tk:'ghost',fx:['ring']},vulcan:{plan:'dragon',tk:'fire',fx:['flames']},celes:{plan:'dragon',tk:'star',fx:['sparkle']},
  // 新しい効果のカード（2026-11-23）
  kon:{plan:'quad',tk:'fire',fx:['speed']},pachi:{plan:'chibi',tk:'elec',fx:['bolts']},tobi:{plan:'bird',tk:'elec',fx:['speed']},garu:{plan:'quad',tk:'fire',fx:['flames']},
  raiga:{plan:'quad',tk:'elec',fx:['bolts']},enma:{plan:'human',role:'sword',tk:'fire',fx:['flames']},dolga:{plan:'quad',tk:'rock',fx:['flames']},ikazuchi:{plan:'bird',tk:'elec',fx:['bolts','sparkle']},
  karako:{plan:'snail',tk:'water'},mossun:{plan:'chibi',tk:'plant'},awari:{plan:'slime',tk:'water',fx:['orbs']},donta:{plan:'turtle',tk:'water'},kinobou:{plan:'mushroom',tk:'plant'},
  ganion:{plan:'crab',tk:'water'},jumoku:{plan:'tree',tk:'plant',fx:['ring']},kujiland:{plan:'shark',tk:'water',fx:['ring']},
  kirari:{plan:'chibi',tk:'star',fx:['sparkle']},miruru:{plan:'quad',tk:'ghost'},pyonta:{plan:'headbody',tk:'fluffy'},tsubakuro:{plan:'bird',tk:'star',fx:['sparkle']},
  kagenui:{plan:'ghost',tk:'ghost',fx:['speed']},noel:{plan:'human',role:'mage',tk:'star',fx:['sparkle']},uraha:{plan:'jelly',tk:'ghost',fx:['orbs']},horos:{plan:'human',role:'mage',tk:'ghost',fx:['orbs']},
  noctar:{plan:'dragon',tk:'ghost',fx:['ring']},serafi:{plan:'phoenix',tk:'star',fx:['sparkle']},  // タクティクス：物の絵
  potion:{obj:'potion',tk:'fluffy'},idea:{obj:'bulb',tk:'star',fx:['rays']},fireball:{obj:'fireball',tk:'fire'},thunder:{obj:'bolt',tk:'elec',fx:['sparkle']},
  spring:{obj:'drop',tk:'water',fx:['ring']},formation:{obj:'arrows',tk:'water'},rally:{obj:'flag',tk:'fire'},soulcharge:{obj:'gem',tk:'star',fx:['orbs']},
  // 新しい効果のタクティクス（2026-11-24）
  freeze:{obj:'snow',tk:'water',fx:['sparkle']},ofuda:{obj:'ofuda',tk:'ghost'},bell:{obj:'bell',tk:'star',fx:['ring']},smoke:{obj:'smoke',tk:'ghost'},
  vine:{obj:'leaf',tk:'plant'},finish:{obj:'sword',tk:'rock',fx:['speed']},gust:{obj:'gust',tk:'water'},quake:{obj:'rock',tk:'rock',fx:['speed']},
  shieldf:{obj:'shield',tk:'water',fx:['ring']},bento:{obj:'bento',tk:'fire'},warcry:{obj:'flag',tk:'elec',fx:['rays']},rainbowd:{obj:'drop',tk:'star',fx:['sparkle']},
  drink:{obj:'can',tk:'elec',fx:['bolts']},pactc:{obj:'scroll',tk:'ghost',fx:['orbs']}
};
// 物の絵（タクティクス）
const RK_OBJ_ART={
  potion(B){const P=B.pal,cx=256;B.part(rkRR(cx-26,120,52,26,6),P.C(30,45,45));B.part(rkRR(cx-34,140,68,70,10),P.white,{w:8});
    B.part(rkE(cx,300,110,110,{n:40}),'#ffffff',{w:10,inner:[{poly:[...rkE(cx,300,98,98,{a0:.2,a1:PI-.2,n:24})],c:P.C(335,80,62)},{poly:rkE(cx-45,250,18,30,{ang:.5}),c:'#ffffff'}]})},
  bulb(B){const P=B.pal,cx=256;B.part(rkRR(cx-48,330,96,70,14),P.C(210,10,70),{inner:[0,1,2].map(i=>({p:[[cx-48,348+i*18],[cx+48,348+i*18]],w:5,c:P.C(210,10,45)}))});
    B.part(rkE(cx,230,110,115,{n:40}),P.C(52,100,70),{w:10,inner:[{p:[[cx-25,320],[cx-18,250],[cx,280],[cx+18,250],[cx+25,320]],w:6,c:P.C(30,90,45)},{poly:rkE(cx-50,190,16,28,{ang:.5}),c:'#ffffff'}]})},
  fireball(B){const P=B.pal,C=P.C;   // 左下へとぶ火の玉：うしろに3本のほのおの尾
    for(const[k,c]of[[-1,C(15,90,55)],[1,C(15,90,55)],[0,C(35,95,58)]]){const L=rkQuad(230+k*30,300-k*30,330+k*20,200-k*40,420+k*25,95-k*30,10);B.part(rkTube(L,62-Math.abs(k)*16,4),c,{w:8})}
    B.part(rkE(215,315,105,105,{n:40}),C(20,90,55),{w:10,inner:[{poly:rkE(205,325,70,70),c:C(42,100,62)},{poly:rkE(195,335,38,38),c:C(55,100,85)}]})},
  bolt(B){const P=B.pal,x=256,y=260,s=230;B.part([[x+s*.05,y-s],[x-s*.4,y+s*.1],[x-s*.02,y+s*.1],[x-s*.2,y+s],[x+s*.45,y-s*.15],[x+s*.05,y-s*.15],[x+s*.3,y-s],[x+s*.05,y-s]],P.C(52,100,58),{w:10})},
  drop(B){const P=B.pal,cx=256,cy=300,R=120;B.part([...rkE(cx,cy,R,R,{a0:0,a1:PI,n:24}),...rkQuad(cx-R,cy,cx-R*.5,cy-R*1.1,cx,cy-R*2,10).slice(1),...rkQuad(cx,cy-R*2,cx+R*.5,cy-R*1.1,cx+R,cy,10).slice(1)],P.base,{w:10,inner:[{poly:rkE(cx-45,cy-30,16,30,{ang:.4}),c:'#ffffff'}]})},
  arrows(B){const P=B.pal;for(const[k,c]of[[-1,P.base],[1,P.acc]]){const y=256+k*70,L=[[130,y],[330,y]];B.part(rkTube(L,22,22),c,{w:8});B.part([[330,y-55],[410,y],[330,y+55]].map(([x,yy])=>k<0?[x,yy]:[512-x,yy]),c,{w:8})}},
  flag(B){const P=B.pal;B.part(rkCap(170,90,170,440,10,10),P.C(30,45,40));B.part([[180,100],[400,150],[300,190],[400,230],[180,260]],P.base,{w:9,inner:[{poly:rkStarP(255,180,30,13),c:P.C(50,95,62)}]})},
  gem(B){const P=B.pal,cx=256;B.part([[cx-130,200],[cx-70,120],[cx+70,120],[cx+130,200],[cx,400],[cx-130,200]],P.C(285,60,62),{w:10,inner:[{p:[[cx-130,200],[cx+130,200]],w:5,c:P.C(285,60,40)},{p:[[cx-70,120],[cx-40,200],[cx,400],[cx+40,200],[cx+70,120]],w:5,c:P.C(285,60,40)},{poly:[[cx-40,140],[cx,140],[cx-20,190]],c:'#ffffff'}]})},
  // ---- 2026-11-24 新しいタクティクスの物 ----
  snow(B){const P=B.pal,cx=256,cy=256,R=170,c=P.C(200,75,62);   // 雪の結晶：3本の軸＋枝
    for(let k=0;k<3;k++){const a=k*PI/3,dx=Math.cos(a)*R,dy=Math.sin(a)*R;B.part(rkCap(cx-dx,cy-dy,cx+dx,cy+dy,16,16),c,{w:7});
      for(const s of[-1,1])for(const f of[.55,.8]){const bx=cx+s*dx*f,by=cy+s*dy*f;for(const t of[-1,1]){const b=a+t*PI/4+(s<0?PI:0);B.ln([[bx,by],[bx+Math.cos(b)*45,by+Math.sin(b)*45]],14,c)}}}
    B.part(rkE(cx,cy,42,42),P.C(200,60,88),{w:7})},
  ofuda(B){const P=B.pal,cx=256,L=P.C(5,65,38);
    B.part(rkRR(cx-75,80,150,350,8),P.C(45,55,92),{w:8,inner:[{poly:rkE(cx,165,40,40),c:P.C(5,75,52)},{p:[[cx-45,250],[cx+45,250]],w:8,c:L},{p:[[cx,230],[cx,400]],w:8,c:L},{p:[[cx-40,300],[cx+40,330]],w:7,c:L},{p:[[cx+40,300],[cx-40,330]],w:7,c:L}]})},
  bell(B){const P=B.pal,cx=256,g=P.C(45,85,58);
    B.part(rkE(cx,100,26,26),g,{w:7});
    B.part([...rkQuad(140,370,150,130,cx,120,14),...rkQuad(cx,120,362,130,372,370,14).slice(1),[392,395],[120,395],[140,370]],g,{w:9,inner:[{p:[[150,330],[362,330]],w:6,c:P.C(40,80,40)},{poly:rkE(205,220,16,40,{ang:.25}),c:'#ffffff'}]});
    B.part(rkE(cx,420,30,30),P.C(30,60,40),{w:7})},
  smoke(B){const P=B.pal,c1=P.C(275,18,72),c2=P.C(275,14,82);
    for(const[x,y,r,c]of[[180,300,90,c1],[330,290,100,c1],[255,220,110,c2],[255,330,85,c2]])B.part(rkBlobP(x,y,r,r*.85,.06,5,x),c,{w:8});
    B.ln(rkQuad(200,240,250,200,300,240,10),6,P.C(275,20,45))},
  leaf(B){const P=B.pal;
    B.part(rkTube(rkQuad(150,420,120,300,190,250,10),10,6),P.C(110,45,35),{w:6});
    B.part([...rkQuad(170,400,150,170,400,110,16),...rkQuad(400,110,370,350,170,400,16).slice(1)],P.C(110,60,48),{w:9,inner:[{p:rkQuad(180,385,280,260,385,125,10),w:6,c:P.C(110,60,30)},{p:[[250,300],[230,230]],w:5,c:P.C(110,60,30)},{p:[[300,240],[290,170]],w:5,c:P.C(110,60,30)},{p:[[270,300],[340,290]],w:5,c:P.C(110,60,30)}]})},
  sword(B){const P=B.pal,cx=256;
    B.part([[cx,60],[cx+26,105],[cx+26,330],[cx-26,330],[cx-26,105],[cx,60]],P.C(210,15,85),{w:8,inner:[{p:[[cx,95],[cx,315]],w:5,c:P.C(210,15,62)}]});
    B.part(rkRR(cx-75,326,150,28,10),P.C(45,80,52),{w:8});
    B.part(rkRR(cx-16,352,32,80,8),P.C(20,55,35),{w:7});
    B.part(rkE(cx,445,22,22),P.C(45,80,52),{w:7})},
  gust(B){const P=B.pal;
    for(const[y,len,c]of[[170,300,P.C(190,55,70)],[270,340,P.C(190,45,80)],[370,260,P.C(190,55,70)]]){
      const x0=256-len/2,L=[...rkQuad(x0,y,x0+len*.5,y-40,x0+len,y,12),...rkE(x0+len-30,y+5,30,32,{a0:-PI/2+.3,a1:PI*1.2,n:12}).slice(1)];
      B.part(rkTube(L,16,6),c,{w:6})}},
  rock(B){const P=B.pal,c=P.C(28,18,55),d=P.C(28,18,35);
    B.part([[110,400],[150,250],[230,170],[330,190],[400,290],[410,400],[110,400]],c,{w:9,inner:[{p:[[250,180],[270,250],[240,300],[285,360],[260,400]],w:7,c:d},{poly:[[170,260],[220,200],[240,215],[190,280]],c:P.C(28,15,72)}]});
    B.part([[60,420],[85,375],[130,370],[140,420],[60,420]],c,{w:7});B.part([[400,425],[420,385],[460,390],[465,425],[400,425]],c,{w:7})},
  shield(B){const P=B.pal,cx=256;
    B.part([[cx,80],[390,130],[380,280],...rkQuad(380,280,360,370,cx,440,10).slice(1),...rkQuad(cx,440,152,370,132,280,10).slice(1),[122,130],[cx,80]],P.C(210,60,52),{w:10,inner:[{poly:[[cx,120],[350,155],[342,275],[cx,395],[170,275],[162,155]],c:P.C(210,55,68)},{poly:rkStarP(cx,250,70,30),c:P.C(48,95,62)}]})},
  bento(B){const P=B.pal;
    B.part(rkRR(110,170,292,210,22),P.C(5,60,42),{w:9,inner:[{poly:rkRR(130,190,130,170,12),c:'#ffffff'},{poly:rkE(195,275,22,22),c:P.C(350,70,48)},{poly:rkRR(272,190,110,80,10),c:P.C(40,85,62)},{poly:rkRR(272,282,110,78,10),c:P.C(110,55,50)}]})},
  can(B){const P=B.pal,cx=256;
    B.part(rkRR(cx-80,110,160,320,30),P.C(200,70,45),{w:9,inner:[{poly:rkRR(cx-80,200,160,130,0),c:P.C(52,100,60)},{poly:[[cx+10,210],[cx-35,275],[cx-5,275],[cx-15,320],[cx+35,250],[cx+5,250],[cx+15,210]],c:P.C(200,70,35)},{poly:rkE(cx-45,150,10,26),c:'#ffffff'}]});
    B.part(rkE(cx,112,70,16),P.C(200,15,80),{w:7})},
  scroll(B){const P=B.pal,L=P.C(30,40,40);
    B.part(rkRR(150,120,212,280,10),P.C(42,60,86),{w:8,inner:[{p:[[185,180],[325,180]],w:6,c:L},{p:[[185,225],[325,225]],w:6,c:L},{p:[[185,270],[300,270]],w:6,c:L},{poly:rkE(300,340,32,32),c:P.C(0,75,45)}]});
    for(const y of[115,405])B.part(rkCap(130,y,382,y,20,20),P.C(30,50,55),{w:7})}
};
// 部品の記録を紙にかく（random.js と同じ重ね方：形をぬる→中のもよう→りんかく）
function rkDrawItems(ctx,S){
  const P=a=>a.map(([x,y])=>({x,y,t:0}));
  const one=s=>{if(s.poly)rkPolyFill(ctx,{p:P(s.poly),c:s.c});else if(s.p)rkStroke(ctx,{t:'s',c:s.c,w:s.w,p:P(s.p),poly:!!s.sharp})};
  for(const s of S){if(s.part){rkPolyFill(ctx,{p:P(s.p),c:s.fill});s.inner.forEach(one);rkStroke(ctx,{t:'s',c:s.c,w:s.w,p:P(s.p),poly:s.sharp})}else one(s)}
}
function rkBasicArtOf(id,A){
  const r=rkRng(rkHash('basic:'+id)),B=rkBuild(rkPal(r,A.tk));
  if(A.obj)RK_OBJ_ART[A.obj](B,r);else{B.want=A.role;RK_PLANS[A.plan](B,r,rkStyle(r))}
  if(A.fx)rkAddFx(B,r,A.fx.length,A.fx);
  const S=rkFit(B.S),c=document.createElement('canvas');c.width=c.height=512;const x=c.getContext('2d');rkDrawItems(x,S);
  // 絵のあるところだけを切り出す（お絵かきカードの rkArtURL と同じ大きさ）
  const d=x.getImageData(0,0,512,512).data;let x0=512,y0=512,x1=0,y1=0;
  for(let y=0;y<512;y+=2)for(let k=0;k<512;k+=2)if(d[(y*512+k)*4+3]>20){if(k<x0)x0=k;if(k>x1)x1=k;if(y<y0)y0=y;if(y>y1)y1=y}
  const w=x1-x0,h=y1-y0,p=Math.max(w,h)*.06,sx=Math.max(0,x0-p),sy=Math.max(0,y0-p),sw=Math.min(512-sx,w+2*p),sh=Math.min(512-sy,h+2*p),k=Math.min(200/sw,150/sh,1.2);
  const o=document.createElement('canvas');o.width=Math.round(sw*k);o.height=Math.round(sh*k);const ox=o.getContext('2d');ox.imageSmoothingQuality='high';ox.drawImage(c,sx,sy,sw,sh,0,0,o.width,o.height);
  return o.toDataURL('image/png');
}
function rkBasicArt(){
  for(const id in RK_BASIC_ART){const d=CARDS[id];if(!d)continue;try{d.img=rkBasicArtOf(id,RK_BASIC_ART[id]);rkArt[id]=d.img}catch(e){console.warn('basic art',id,e)}}
  rkCssSync();
}
