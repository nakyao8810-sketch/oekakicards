'use strict';
/* ---- 作ったカードをXに投稿 ----
   Xの投稿画面のURLには文しか渡せないので、画像は
     スマホ：共有画面に渡す ／ PC：コピーして貼り付け ／ どちらもだめ：保存して添付 */
const RK_POST={w:1200,h:675,tag:'#お絵かきカードバトル'};
// Xに投稿のボタンの文字（見た目は 11_share.css の .xbtn）
const RK_XBTN='<span class="xm">𝕏</span>で投稿する';

// ネットに置いてあるときだけ、遊べる場所のURLをつける（手もとのファイル・家の中のアドレスはつけない）
function rkGameURL(){
  if(location.protocol!=='https:'&&location.protocol!=='http:')return'';
  const h=location.hostname;
  if(!h.includes('.')||/\.local$|^(127|10|192\.168|169\.254|172\.(1[6-9]|2\d|3[01]))\./.test(h))return'';
  return location.origin+location.pathname.replace(/index\.html$/,'');
}
function rkPostText(d){
  const a=[`お絵かきカードバトルで「${d.name}」を作ったよ！`];
  if(d.type==='t')a.push(`コスト${d.cost}のタクティクス：${d.x}`);
  else{a.push(`コスト${d.cost}｜ATK ${d.atk}｜HP ${d.hp}`);if(d.sp)a.push(`必殺技「${spName(d)}」`)}
  a.push(RK_POST.tag);const u=rkGameURL();if(u)a.push(u);
  return a.join('\n');
}

/* 画像づくり */
// 分かち書きの文は空白で折る。数字・英字のかたまりは割らない。句読点などは行の頭に来ないようにする
function rkWrap(g,str,w){
  const out=[];let line=[];
  for(const t of String(str).match(/[A-Za-z0-9+-]+|./gu)||[]){
    if(line.length&&g.measureText(line.join('')+t).width>w){
      let next=[];
      const sp=line.lastIndexOf(' ');
      if(t===' '){/* ちょうど切れ目 */}
      else if(sp>=line.length*.5){next=line.slice(sp+1);line=line.slice(0,sp)}
      else if(/^[。、，．）」』】！？：・ーぁぃぅぇぉっゃゅょァィゥェォッャュョ]/.test(t)&&line.length>1)next.push(line.pop());
      while(line.length>1&&t!==' '&&/[「『（【]$/.test(line[line.length-1]))next.unshift(line.pop());
      out.push(line.join('').trim());line=next;
    }
    if(line.length||t!==' ')line.push(t);
  }
  if(line.length){
    // 最後の行が1〜3文字だけにならないよう、前の行から分けてもらう（「HPを2回／復」→「／HPを2回復」）
    if(out.length&&line.length<4&&!String(str).includes(' ')){
      const prev=out[out.length-1].match(/[A-Za-z0-9+-]+|./gu);
      while(prev.length>6&&(line.length<5||/^[。、，．）」』】！？：・ーぁぃぅぇぉっゃゅょァィゥェォッャュョ]/.test(line[0])))line.unshift(prev.pop());
      out[out.length-1]=prev.join('');
    }
    out.push(line.join('').trim());
  }
  return out;
}
/* ゲームの中と同じカード（14_cardframe.css の .card.big）を canvas にかく。
   cx,cy は真ん中、ch はカードの高さ。ic は rkPostIcons で読んだ図形の絵。
   **カードの枠（14_cardframe.css・render.js の cardHTML）を変えたらここも直す** */
const RK_POST_EF={fire:'#cf3f2a',water:'#2a7bcb',thunder:'#e09312',forest:'#3a9441',light:'#c9a640',dark:'#6d45ad'};
const RK_POST_SEAL={fang:'#a8402f',shield:'#3b5f86',star:'#a8801f',heart:'#a5506a'};
function rkMix(a,b,p){   // color-mix(in srgb, a p, b)
  const h=s=>[1,3,5].map(i=>parseInt(s.slice(i,i+2),16)),A=h(a),B=h(b);
  return'#'+A.map((x,i)=>Math.round(x*p+B[i]*(1-p)).toString(16).padStart(2,'0')).join('');
}
function rkPostCard(g,d,ic,cx,cy,ch,rot){
  const mon=d.type!=='t',cw=ch*.716,u=cw/215;           // u：くわしい画面の大きいカード（高さ300）の1px
  const q=cw/100;                                       // 1cqmin（たてのカードなので幅の1%）
  const ef=mon?RK_POST_EF[d.el]:d.my?'#4c6f92':'#5f6b78';
  const efd=rkMix(ef,'#000000',.52),efdd=rkMix(ef,'#000000',.34),efl=rkMix(ef,'#ffffff',.52),efp=rkMix(ef,'#ffffff',.13),ef62=rkMix(ef,'#000000',.62);
  const font=v=>`${v.w} ${v.s}px ${v.f||'"Zen Kaku Gothic New","Hiragino Sans","Yu Gothic UI","Meiryo",sans-serif'}`;
  const F=(w,s)=>font({w,s});
  const fp=7*u,cs=15*q,es=13.5*q,nf=8.6*q,ss=12.5*q,sh=14*q,sf=12*q,tf=5*q;
  const rr=(x,y,w,h,r)=>{g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h)};
  const circ=(x,y,r)=>{g.beginPath();g.arc(x,y,r,0,Math.PI*2)};
  const lin=(x0,y0,x1,y1,stops)=>{const gr=g.createLinearGradient(x0,y0,x1,y1);stops.forEach(([p,c])=>gr.addColorStop(p,c));return gr};
  const rad=(x,y,r,stops)=>{const gr=g.createRadialGradient(x,y,0,x,y,r);stops.forEach(([p,c])=>gr.addColorStop(p,c));return gr};
  // 字が幅に入るまで小さくする
  const fitFont=(s,w,size,min,wt=900)=>{g.font=F(wt,size);while(size>min&&g.measureText(s).width>w)g.font=F(wt,size-=.5);return size};
  const icon=(im,x,y,s)=>{if(im)g.drawImage(im,x-s/2,y-s/2,s,s)};

  g.save();g.translate(cx,cy);g.rotate(rot);
  const L=-cw/2,T=-ch/2;
  // 影と枠（属性色のななめのグラデーション＋うすい白のすじ）
  g.save();g.shadowColor='rgba(0,0,0,.3)';g.shadowBlur=20*u;g.shadowOffsetY=5*u;
  rr(L,T,cw,ch,12*u);g.fillStyle=ef;g.fill();g.restore();
  g.save();rr(L,T,cw,ch,12*u);g.clip();
  const a=155*Math.PI/180,dx=Math.sin(a),dy=-Math.cos(a),len=Math.abs(cw*dx)+Math.abs(ch*dy);
  g.fillStyle=lin(-dx*len/2,-dy*len/2,dx*len/2,dy*len/2,[[0,efl],[.3,ef],[.68,ef],[1,efd]]);g.fillRect(L,T,cw,ch);
  g.save();g.rotate((118-90)*Math.PI/180);g.fillStyle='rgba(255,255,255,.07)';
  for(let x=-ch;x<ch;x+=9*u)g.fillRect(x,-ch,2*u,ch*2);g.restore();
  g.restore();
  rr(L+.75*u,T+.75*u,cw-1.5*u,ch-1.5*u,12*u);g.strokeStyle=efdd;g.lineWidth=1.5*u;g.stroke();
  rr(L+2.2*u,T+2.2*u,cw-4.4*u,ch-4.4*u,10.5*u);g.strokeStyle='rgba(255,255,255,.38)';g.lineWidth=1.5*u;g.stroke();

  const x0=L+fp+1.5*u,x1=-L-fp-1.5*u,iw=x1-x0;
  let y=T+fp+1.5*u;
  // 名前の帯：コストの丸・名前・属性のメダル
  // 長い名前は小さくし、それでも入らなければ「称号｜もの」の切れ目で2行に（帯も高くする）
  const nm=String(d.sn||d.name),nx=x0+cs+cs*.18,nr=mon?x1-es-cs*.18:x1-es*.12,nw=nr-nx;
  let ns=fitFont(nm,nw,nf,nf*.72),lines=[nm];
  if(g.measureText(nm).width>nw&&d.nb>0&&d.nb<nm.length){
    lines=[nm.slice(0,d.nb),nm.slice(d.nb)];
    ns=Math.min(...lines.map(s=>fitFont(s,nw,nf*.8,nf*.5)));
  }
  const ph=Math.max(cs*.8,lines.length*ns*1.1+4*u);
  rr(x0,y,iw,ph,[cs*.5,es*.5,es*.5,cs*.5]);g.fillStyle=lin(0,y,0,y+ph,[[0,'#fff'],[.45,'#fff'],[1,efp]]);g.fill();
  g.strokeStyle=efdd;g.lineWidth=1.5*u;g.stroke();
  const coinX=x0+cs/2,midY=y+ph/2;
  circ(coinX,midY,cs/2);g.fillStyle='#fff';g.fill();g.strokeStyle=efdd;g.lineWidth=1.5*u;g.stroke();
  circ(coinX,midY,cs/2-cs*.09);g.fillStyle=rad(coinX-cs*.14,midY-cs*.2,cs*.5,[[0,efl],[.48,ef],[1,efd]]);g.fill();
  g.font=F(900,cs*.58);g.textAlign='center';g.textBaseline='middle';
  g.fillStyle='rgba(0,0,0,.35)';g.fillText(String(d.cost),coinX,midY+1.5*u);g.fillStyle='#fff';g.fillText(String(d.cost),coinX,midY);
  if(mon){
    const ex=x1+es*.12-es/2;
    circ(ex,midY,es/2);g.fillStyle='#fff';g.fill();g.strokeStyle=efdd;g.lineWidth=1.5*u;g.stroke();
    circ(ex,midY,es/2-es*.08);g.fillStyle=rad(ex-es*.14,midY-es*.2,es*.5,[[0,efl],[.48,ef],[1,efd]]);g.fill();
    icon(ic['el_'+d.el],ex,midY,es*.58*.84);
  }
  g.textAlign='left';g.fillStyle='#1b1815';g.font=F(900,ns);
  lines.forEach((s,i)=>g.fillText(s,nx,midY+(i-(lines.length-1)/2)*ns*1.1,nw));
  y+=ph+3*u;

  // 下の ATK／HP（タクティクスは番号だけのうすい帯）
  const sth=mon?sh:sh*.5,sty=-T-fp+1*u-sth;
  // 絵のらん
  const by=y,bh=sty-3*u-by;
  g.save();rr(x0,by,iw,bh,5*u);g.clip();
  g.fillStyle=rad(0,by+bh*.36,Math.max(iw,bh)*.8,[[0,'#fff'],[.55,efp],[1,rkMix(ef,'#ffffff',.3)]]);g.fillRect(x0,by,iw,bh);
  if(ic.art){const im=ic.art,k=Math.min(iw/im.width,bh/im.height);g.imageSmoothingQuality='high';g.drawImage(im,x0+(iw-im.width*k)/2,by+(bh-im.height*k)/2,im.width*k,im.height*k)}
  else if(mon){g.globalAlpha=.2;const s=bh*.62;g.drawImage(ic['elc_'+d.el]||ic['el_'+d.el],-s/2,by+(bh-s)/2,s,s);g.globalAlpha=1}
  // 効果のらん（絵の下のほうに白いらんを重ねる）
  const pad=tf*.6,lh=tf*1.25,rowP=tf*.28,fx=x0+iw*.04,fw=iw*.92;
  const pill=(s,px,py)=>{g.font=F(700,tf*.86);const pw=Math.max(tf*3.1,g.measureText(s).width+tf);
    rr(px,py-tf*.86*.75,pw,tf*.86*1.5,3*u);g.fillStyle=efd;g.fill();g.fillStyle='#fff';g.textAlign='center';g.fillText(s,px+pw/2,py);return pw};
  let rows,boxH;
  if(mon){
    rows=[['共鳴',d.rs||resShort(d)]];if(d.sp)rows.push([spG(d)+'G',spName(d)]);
    boxH=pad*.9*2+rows.length*(lh+rowP*2);
  }else{
    g.font=F(700,tf);rows=rkWrap(g,d.x,fw-pad*2);boxH=pad*.9*2+tf*.86*1.5+tf*.3+rows.length*tf*1.35;
  }
  const fy=by+bh-bh*.04-boxH;
  g.save();g.shadowColor='rgba(0,0,0,.22)';g.shadowBlur=3*u;g.shadowOffsetY=1*u;rr(fx,fy,fw,boxH,6*u);g.fillStyle='rgba(255,255,255,.9)';g.fill();g.restore();
  g.textBaseline='middle';
  if(mon){
    rows.forEach(([p,s],i)=>{
      const ry=fy+pad*.9+i*(lh+rowP*2)+rowP+lh/2;
      if(i){g.fillStyle='rgba(0,0,0,.13)';g.fillRect(fx+pad,ry-lh/2-rowP,fw-pad*2,1*u)}
      const pw=pill(p,fx+pad,ry);
      g.textAlign='left';g.fillStyle='#1b1815';fitFont(s,fw-pad*2-pw-tf*.5,tf,tf*.75,700);g.fillText(s,fx+pad+pw+tf*.5,ry,fw-pad*2-pw-tf*.5);
    });
  }else{
    pill('タクティクス',fx+pad,fy+pad*.9+tf*.86*.75);
    g.textAlign='left';g.fillStyle='#1b1815';g.font=F(700,tf);
    rows.forEach((s,i)=>g.fillText(s,fx+pad,fy+pad*.9+tf*.86*1.5+tf*.3+(i+.5)*tf*1.35));
  }
  g.restore();
  rr(x0,by,iw,bh,5*u);g.strokeStyle=efdd;g.lineWidth=1.5*u;g.stroke();
  rr(x0+1.5*u,by+1.5*u,iw-3*u,bh-3*u,4*u);g.strokeStyle='rgba(255,255,255,.85)';g.lineWidth=1.5*u;g.stroke();

  // ATK（こい板・右がとがる）／番号／HP（明るい板・左がとがる）
  const no=d.my?'':cardNo(d.id||'');
  if(mon){
    const stat=(k,val,left)=>{
      g.font=F(700,sf*.42);const iwk=g.measureText(k).width;g.font=F(900,sf);const vw=g.measureText(String(val)).width;
      const w=sh*.25+iwk+sf*.06+sf*.18+vw+sh*.55,sx=left?x0:x1-w;
      g.beginPath();
      if(left){g.moveTo(sx,sty);g.lineTo(sx+w*.84,sty);g.lineTo(sx+w,sty+sth/2);g.lineTo(sx+w*.84,sty+sth);g.lineTo(sx,sty+sth)}
      else{g.moveTo(sx+w*.16,sty);g.lineTo(sx+w,sty);g.lineTo(sx+w,sty+sth);g.lineTo(sx+w*.16,sty+sth);g.lineTo(sx,sty+sth/2)}
      g.closePath();
      g.fillStyle=left?lin(0,sty,0,sty+sth,[[0,ef62],[1,efdd]]):lin(0,sty,0,sty+sth,[[0,'#fff'],[1,efp]]);g.fill();
      g.save();g.clip();g.strokeStyle=left?'rgba(255,255,255,.25)':efd;g.lineWidth=3*u;g.stroke();g.restore();
      const tx=sx+(left?sh*.25:sh*.55),col=left?'#fff':'#1b1815';
      g.textAlign='left';g.fillStyle=col;g.globalAlpha=left?.85:.6;g.font=F(700,sf*.42);g.fillText(k,tx,sty+sth/2+sf*.06);
      g.globalAlpha=1;g.font=F(900,sf);g.fillText(String(val),tx+iwk+sf*.06+sf*.18,sty+sth/2+sf*.04);
    };
    stat('ATK',d.atk,true);stat('HP',d.hp,false);
  }
  if(no){g.font=F(700,(mon?sf:sf)*.36);g.textAlign='center';g.fillStyle='rgba(0,0,0,.3)';g.fillText(no,0,sty+sth/2+1*u);g.fillStyle='rgba(255,255,255,.88)';g.fillText(no,0,sty+sth/2)}

  // 左右の印：ふちにまたがる丸
  if(mon)[[d.L,L-ss*.42+ss/2],[d.R,-L+ss*.42-ss/2]].forEach(([k,sx])=>{
    circ(sx,0,ss/2);g.save();g.shadowColor='rgba(0,0,0,.3)';g.shadowBlur=3*u;g.shadowOffsetY=2*u;g.fillStyle='#fff';g.fill();g.restore();
    g.strokeStyle='rgba(0,0,0,.42)';g.lineWidth=1.5*u;circ(sx,0,ss/2+.75*u);g.stroke();
    circ(sx,0,ss/2-ss*.1);
    if(k==='rainbow'){g.save();g.clip();['#a8402f','#a8801f','#4a7236','#3b5f86','#56406e'].forEach((c,i)=>{g.fillStyle=c;g.fillRect(sx-ss/2,-ss/2+i*ss/5,ss,ss/5+.5)});g.restore()}
    else{g.fillStyle=RK_POST_SEAL[k];g.fill()}
    icon(ic['seal_'+k],sx,0,(ss-ss*.2)*.62);
  });
  g.restore();
}
// 図形（属性・印）の SVG と絵を読む。foreignObject を使わないのでどのブラウザでも canvas が汚れない
async function rkPostIcons(d){
  const load=src=>new Promise(r=>{const im=new Image();im.onload=()=>r(im);im.onerror=()=>r(null);im.src=src});
  const svg=(p,fill='#fff')=>'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="96" height="96" fill="${fill}">${p}</svg>`);
  const want={art:d.img||''};
  if(d.type!=='t'){
    want['el_'+d.el]=svg(EL_SVG[d.el]);
    if(!d.img)want['elc_'+d.el]=svg(EL_SVG[d.el].replace(/stroke="#fff"/g,`stroke="${RK_POST_EF[d.el]}"`),RK_POST_EF[d.el]);
    for(const k of[d.L,d.R])want['seal_'+k]=svg(SEAL_SVG[k]);
  }
  const out={};
  await Promise.all(Object.entries(want).map(async([k,src])=>{out[k]=src?await load(src):null}));
  return out;
}

function rkPostDraw(d,ic){
  const {w:W,h:H}=RK_POST,c=document.createElement('canvas');c.width=W;c.height=H;
  const g=c.getContext('2d'),css=getComputedStyle(document.documentElement),v=n=>css.getPropertyValue(n).trim();
  // タイムラインでは小さく出るので、文も細いえんぴつ字でなくマジックの字でかく
  const head=v('--minc'),body=head,ink=v('--ink'),ink2=v('--ink2'),pencil=v('--pencil');
  const mon=d.type!=='t',ec=mon?EL[d.el].c:'#5b6a7a';
  const box=(x,y,w,h,r,fill,stroke,lw=2)=>{
    g.beginPath();g.roundRect?g.roundRect(x,y,w,h,r):g.rect(x,y,w,h);
    if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}
  };
  // max を渡すと、その幅に入るまで字を小さくする
  const text=(s,x,y,size,font,col,al='left',max=0)=>{
    g.font=`400 ${size}px ${font}`;
    if(max)while(size>12&&g.measureText(s).width>max)g.font=`400 ${--size}px ${font}`;
    g.fillStyle=col;g.textAlign=al;g.textBaseline='middle';g.fillText(s,x,y);
  };

  // スケッチブックの紙
  g.fillStyle=v('--mat');g.fillRect(0,0,W,H);
  g.fillStyle='rgba(70,110,160,.11)';
  for(let x=0;x<W;x+=30)g.fillRect(x,0,1.5,H);
  for(let y=0;y<H;y+=30)g.fillRect(0,y,W,1.5);

  // 左：ゲームの中と同じ見た目のカード
  rkPostCard(g,d,ic,280,H/2+2,612,-.025);

  // 右：名前・しょうかい・効果。長いカードは全体を少し小さくして収める
  const X=550,RW=594;
  text('お絵かきカードバトル',X,66,30,head,pencil);
  g.fillStyle=pencil;g.fillRect(X,91,RW,2);
  const secs=mon
    ?[[`共鳴効果${d.resn?`「${d.resn}」`:''}`,resText(d)],
      ['必殺技'+(d.sp?`「${spName(d)}」（${spG(d)}G）`:''),d.sp?spText(d):'なし']]
    :[['効果',d.x],['使いかた',`エナジー${d.cost}で使う、使い切りのカード`]];
  const block=(k,y,paint)=>{
    const y0=y,kind=mon?[EL[d.el].n+'属性',d.kind].filter(Boolean).join('・'):'タクティクスカード';
    if(paint)text(d.name,X,y+32*k,58*k,head,ink,'left',RW);
    y+=76*k;
    if(paint)text(kind,X,y+12*k,23*k,body,ink2,'left',RW);
    y+=42*k;
    if(d.prof){
      g.font=`400 ${23*k}px ${body}`;
      const ls=rkWrap(g,d.prof,RW-34),bh=(ls.length*34+18)*k;
      if(paint){box(X,y,RW,bh,3,'#fffdf6');g.fillStyle=ec;g.fillRect(X,y,5,bh);ls.forEach((s,i)=>text(s,X+18,y+(26+i*34)*k,23*k,body,ink2))}
      y+=bh+16*k;
    }
    for(const[title,x]of secs){
      g.font=`400 ${25*k}px ${body}`;
      const ls=rkWrap(g,x,RW);
      if(paint){g.fillStyle='#cbbd9c';g.fillRect(X,y,RW,1.5);g.fillStyle=ec;g.fillRect(X,y+11*k,7,25*k);text(title,X+18,y+24*k,24*k,head,ink2,'left',RW-18);ls.forEach((s,i)=>text(s,X,y+(60+i*34)*k,25*k,body,ink))}
      y+=(52+ls.length*34)*k;
    }
    return y-y0;
  };
  let k=1,bh;while((bh=block(k,0,false))>474&&k>.6)k-=.03;
  block(k,114+Math.max(0,474-bh)/2,true);
  text(RK_POST.tag,X+RW,628,25,head,ink2,'right');
  return c;
}
const mon0=d=>d.type!=='t';
async function rkPostImage(d){
  const css=getComputedStyle(document.documentElement);
  const all=[d.name,d.kind,d.prof,d.resn,d.spn,d.x,mon0(d)&&resText(d),d.sp&&SP[d.sp].n,d.sp&&spText(d),mon0(d)&&resShort(d),RK_POST.tag,
    'お絵かきカードバトル属性炎水雷森光闇牙盾星心虹共鳴効果必殺技なし使いかたエナジーで使う、切りのカードタクティクス「」（）・ATKHPG0123456789'].filter(Boolean).join('');
  // 手書きの字を待つ。つながっていないときは待ち続けない
  const cf='"Zen Kaku Gothic New"';
  if(document.fonts)await Promise.race([
    Promise.all([document.fonts.load(`400 30px ${css.getPropertyValue('--minc')}`,all),
      document.fonts.load(`900 30px ${cf}`,all),document.fonts.load(`700 30px ${cf}`,all)]).catch(()=>{}),
    new Promise(r=>setTimeout(r,2500))]);
  const c=rkPostDraw(d,await rkPostIcons(d));
  return new Promise((res,rej)=>c.toBlob(b=>b?res(b):rej(new Error('toBlob')),'image/png'));
}

/* 渡しかた */
function rkIsMobile(){return/Android|iPhone|iPad|iPod/.test(navigator.userAgent)||(/Macintosh/.test(navigator.userAgent)&&navigator.maxTouchPoints>1)}
function rkSaveImage(blob,name){
  const a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=name;
  document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(a.href),30000);
}
// noopener を指定すると開けたかどうか分からないので、空で開いて縁を切ってから移る
function rkOpenX(url){
  const w=window.open('about:blank','_blank');if(!w)return false;
  try{w.opener=null;w.location.replace(url);return true}catch(e){return false}
}

/* 投稿の画面。押したその場で共有・コピーしないとブラウザに断られるので、画像は開いたときに作っておく */
function rkShareCard(d){
  return new Promise(done=>{
    const el=$('#modal'),text=rkPostText(d),url='https://x.com/intent/tweet?text='+encodeURIComponent(text);
    const mobile=rkIsMobile(),name=`お絵かきカード_${String(d.name).replace(/[\\/:*?"<>|]/g,'')}.png`;
    const canCopy=!!(navigator.clipboard&&navigator.clipboard.write&&window.ClipboardItem);
    let blob=null,file=null,src='',closed=false,busy=false;
    el.className='show';snd('open');
    el.innerHTML=`<div class="mbox share"><h3>Xに投稿</h3>
      <div class="shpv"><span class="sub">画像を作っています…</span></div>
      <div class="shtx">${esc(text)}</div>
      <p class="shmsg" role="status"></p>
      <a class="btn shlink" target="_blank" rel="noopener noreferrer" hidden>Xの投稿画面をひらく</a>
      <div class="mbtns"><button class="btn xbtn" data-sh="post" disabled>${RK_XBTN}</button><button class="btn" data-sh="open" disabled hidden>Xをひらく</button><button class="btn" data-sh="save" disabled>画像を保存</button><button class="btn" data-sh="close">とじる</button></div></div>`;
    const q=s=>el.querySelector(s),box=q('.share'),link=q('.shlink');
    link.href=url;
    const say=s=>{if(!closed)box.querySelector('.shmsg').textContent=s};

    async function toX(){
      let copied=false;
      if(canCopy){
        try{
          // write は押した直後に呼ぶ（Safari）。長く待つと新しいタブも開けなくなる
          copied=await Promise.race([
            navigator.clipboard.write([new ClipboardItem({'image/png':blob})]).then(()=>true),
            new Promise(r=>setTimeout(()=>r(false),2500))]);
        }catch(e){copied=false}
      }
      if(closed)return;
      const opened=rkOpenX(url);
      if(!copied)rkSaveImage(blob,name);
      link.hidden=opened;
      const how=copied
        ?`画像をコピーしました。Xの投稿画面に貼り付けてください（${mobile?'長押し':/Mac/.test(navigator.platform)?'⌘+V':'Ctrl+V'}）。`

        :'画像を保存しました。Xの投稿画面で画像を添付してください。';
      say(how+(opened?'':'下のボタンからXをひらけます。'));
    }
    async function toShare(){
      try{await navigator.share({files:[file],text});say('共有画面に渡しました。')}
      catch(e){
        if(e.name==='AbortError')return;   // 共有画面をとじただけ
        say('共有画面をひらけませんでした。「Xをひらく」からも投稿できます。');
      }
    }
    el.onclick=async e=>{
      const b=e.target.closest('[data-sh]');if(!b||b.disabled)return;
      const a=b.dataset.sh;
      if(a==='close'){closed=true;if(src)URL.revokeObjectURL(src);el.className='';el.innerHTML='';el.onclick=null;snd('tap');done();return}
      if(!blob||busy)return;
      snd('tap');
      if(a==='save'){rkSaveImage(blob,name);say('画像を保存しました。');return}
      busy=true;
      try{await(a==='post'&&file?toShare():toX())}finally{busy=false}
    };

    rkPostImage(d).then(b=>{
      if(closed)return;
      blob=b;src=URL.createObjectURL(b);
      const im=new Image();im.src=src;im.alt=`${d.name}のカード画像`;
      box.querySelector('.shpv').replaceChildren(im);
      if(mobile&&navigator.canShare){
        try{const f=new File([b],'oekaki-card.png',{type:'image/png'});if(navigator.canShare({files:[f],text}))file=f}catch(e){}
      }
      box.querySelectorAll('[data-sh]').forEach(x=>{x.disabled=false});
      box.querySelector('[data-sh="open"]').hidden=!file;
      say(file?'「𝕏で投稿する」を押して、共有先からXをえらんでください。'
        :canCopy?'「𝕏で投稿する」を押すと画像がコピーされ、Xがひらきます。投稿画面で貼り付けてください。'
        :'「𝕏で投稿する」を押すと画像が保存され、Xがひらきます。投稿画面で画像を添付してください。');
    }).catch(e=>{
      console.error(e);if(closed)return;
      box.querySelector('.shpv').textContent='画像を作れませんでした';
      link.hidden=false;say('文だけなら、下のボタンから投稿できます。');
    });
  });
}
