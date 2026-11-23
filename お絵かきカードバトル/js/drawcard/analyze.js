'use strict';
/* ---- 絵を測る ---- */
function rkAnalyze(){
  const S2=128,o=document.createElement('canvas');o.width=o.height=S2;
  const octx=o.getContext('2d',{willReadFrequently:true});octx.drawImage(rk.base,0,0,S2,S2);
  const d=octx.getImageData(0,0,S2,S2).data,ink=new Uint8Array(S2*S2),cc=new Array(RK_PENS.length).fill(0);
  let n=0,minX=S2,minY=S2,maxX=-1,maxY=-1;
  for(let k=0;k<S2*S2;k++){
    const i=k*4;if(d[i+3]<=70)continue;ink[k]=1;n++;
    const x=k%S2,y=(k/S2)|0;if(x<minX)minX=x;if(x>maxX)maxX=x;if(y<minY)minY=y;if(y>maxY)maxY=y;
    let best=0,bd=1e9;for(let j=0;j<RK_RGB.length;j++){const c=RK_RGB[j],dd=(d[i]-c[0])**2+(d[i+1]-c[1])**2+(d[i+2]-c[2])**2;if(dd<bd){bd=dd;best=j}}cc[best]++;
  }
  if(n<25)return null;
  const w=maxX-minX+1,h=maxY-minY+1,cx2=minX+maxX;let hit=0;
  for(let k=0;k<S2*S2;k++){if(!ink[k])continue;const x=k%S2,y=(k/S2)|0,mx=cx2-x;let ok=0;
    for(let dy=-1;dy<=1&&!ok;dy++)for(let dx=-1;dx<=1&&!ok;dx++){const xx=mx+dx,yy=y+dy;if(xx>=0&&xx<S2&&yy>=0&&yy<S2&&ink[yy*S2+xx])ok=1}hit+=ok}
  let L=0,corners=0,smooth=0,loops=0,T=0,nS=0,nFill=0,erLen=0,nEr=0;const spans=[];
  // 線けしで消した線は数えない。左右対称で写した側（mr）は、かいた時間・線の数・長さに入れない（絵のインクには入る）
  const live=rkLive();
  for(const a of live){
    if(a.mr)continue;
    if(a.t==='fill'||a.t==='poly'){nFill++;spans.push([a.ts,a.ts+300]);continue}
    const p=a.p;let len=0;for(let i=1;i<p.length;i++)len+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);
    spans.push([p[0].t,p[p.length-1].t]);
    if(a.er){erLen+=len;nEr++;continue}
    nS++;L+=len;T+=Math.max(16,p[p.length-1].t-p[0].t);
    const rs=[p[0]];let acc=0;for(let i=1;i<p.length;i++){acc+=Math.hypot(p[i].x-p[i-1].x,p[i].y-p[i-1].y);if(acc>=8){rs.push(p[i]);acc=0}}
    let prevA=null,lastC=null;
    for(let i=1;i<rs.length;i++){
      const ang=Math.atan2(rs[i].y-rs[i-1].y,rs[i].x-rs[i-1].x);
      if(prevA!=null){let dA=ang-prevA;while(dA>Math.PI)dA-=2*Math.PI;while(dA<-Math.PI)dA+=2*Math.PI;const ad=Math.abs(dA),here=rs[i-1];
        if(ad>1){if(!lastC||Math.hypot(here.x-lastC.x,here.y-lastC.y)>14)corners++;lastC=here}else smooth+=ad}
      prevA=ang;
    }
    const q=p[p.length-1];if(len>70&&Math.hypot(q.x-p[0].x,q.y-p[0].y)<Math.max(22,len*.12))loops++;
  }
  spans.sort((a,b)=>a[0]-b[0]);let sec=0,last=null;
  for(const[s,e]of spans){sec+=Math.max(0,e-s);if(last!=null)sec+=rkClamp(s-last,0,4000);last=Math.max(e,last==null?e:last)}
  sec=Math.max(1,Math.round(sec/1000));
  const colors=cc.map((c,i)=>({k:RK_PENS[i].k,share:c/n})).filter(c=>c.share>=.05).sort((a,b)=>b.share-a.share);
  const size=Math.max(w,h)/S2,fillRatio=n/(w*h),sym=hit/n,cp300=corners/Math.max(1,L/300),curv=smooth/Math.max(1,L/100),speed=L/Math.max(1,T);
  const sc={
    spiky:rkClamp(cp300/4), round:rkClamp(rkClamp(curv/1.6)*(1-rkClamp(cp300/4)*.6)+loops*.12), solid:rkClamp((fillRatio-.12)/.45),
    big:rkClamp((size-.4)/.5), fast:nS?rkClamp((speed-.35)/1.2):0, detail:rkClamp(.6*Math.log(1+nS+nFill)/Math.log(41)+.4*rkClamp(sec/120)),
    colorful:rkClamp((colors.length-1)/4), sym:rkClamp((sym-.35)/.5)
  };
  const top=colors[0],second=colors[1];let inkKey=null;
  if(top.k==='黒'&&second&&second.share>=.25)inkKey=second.k;else if(top.k!=='黒')inkKey=top.k;
  const key=live.map(a=>a.t==='fill'?`f${a.x},${a.y},${a.c}`:`${a.c}${a.er?'e':''}${a.w}:`+a.p.map(q=>`${q.x|0},${q.y|0}`).join(';')).join('|');
  return{n,inkRatio:n/(S2*S2),sec,nS,nFill,corners,loops,aspect:w/h,colors,sc,inkKey,bbox:{x:minX*4,y:minY*4,w:w*4,h:h*4},hash:rkHash(key)};
}
