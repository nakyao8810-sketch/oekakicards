'use strict';
/* =========================================================
   オンライン対戦：通信
   無料の公開中継（MQTT over WebSocket）を全部同時に使う。公開の場所なので
     ・中身は部屋番号から作った鍵で暗号化（AES-GCM）
     ・宛先の名前も鍵から作ったでたらめな文字列（ゲーム名・名前・部屋番号を入れない）
   届かない・2回届く・順番が入れかわる、はここで直す（通し番号と受け取りの返事）
   ========================================================= */
const OL_RELAYS=['wss://broker.emqx.io:8084/mqtt','wss://broker.hivemq.com:8884/mqtt','wss://test.mosquitto.org:8081'];
const OL_BEAT=3000;       // 何もなくても送る間隔
const OL_LOST=15000;      // これだけ何も届かなければ「切れている」
const OL_PACKET=1000000;  // これより大きいものは受け取らない

/* ---- 中継1つ分（MQTT 3.1.1 の必要なところだけ）---- */
function olMqtt(url,topic,onData,onState){
  let ws=null,up=false,closed=false,buf=new Uint8Array(0),retryT=null,wait=1000,pingAt=0,lastPing=0,openAt=0;
  const str=s=>{const b=OL_ENC.encode(s);return Uint8Array.from([b.length>>8,b.length&255,...b])};
  const packet=(head,...parts)=>{
    const n=parts.reduce((a,p)=>a+p.length,0),size=[];let x=n;
    do{let d=x%128;x=Math.floor(x/128);if(x)d|=128;size.push(d)}while(x);
    const o=new Uint8Array(1+size.length+n);o[0]=head;o.set(size,1);let k=1+size.length;
    for(const p of parts){o.set(p,k);k+=p.length}
    return o;
  };
  const write=b=>{try{if(ws&&ws.readyState===1)ws.send(b)}catch(e){}};
  function drop(){
    const w=ws,was=up;ws=null;up=false;pingAt=0;buf=new Uint8Array(0);
    if(w){try{w.close()}catch(e){}}
    if(was)onState();
    if(closed)return;
    clearTimeout(retryT);retryT=setTimeout(open,wait);wait=Math.min(wait*2,15000);
  }
  function handle(h,p){
    const type=h>>4;
    if(type===2){
      if(p[1]!==0){drop();return}
      write(packet(0x82,Uint8Array.from([0,1]),str(topic),Uint8Array.from([0])));
    }else if(type===9){
      if(p[2]===128){drop();return}
      up=true;wait=1000;lastPing=Date.now();onState();
    }else if(type===3){
      const n=(p[0]<<8)|p[1];onData(p.slice(2+n+(h&6?2:0)));
    }else if(type===13)pingAt=0;
  }
  function feed(data){
    const b=new Uint8Array(buf.length+data.length);b.set(buf);b.set(data,buf.length);buf=b;
    while(buf.length>1){
      let len=0,mul=1,i=1,d;
      do{if(i>=buf.length)return;if(i>4){drop();return}d=buf[i++];len+=(d&127)*mul;mul*=128}while(d&128);
      if(len>OL_PACKET){drop();return}
      if(buf.length<i+len)return;
      const h=buf[0],p=buf.slice(i,i+len);buf=buf.slice(i+len);
      handle(h,p);
    }
  }
  function open(){
    clearTimeout(retryT);retryT=null;if(closed)return;
    let me;
    try{me=ws=new WebSocket(url,'mqtt')}catch(e){drop();return}
    openAt=Date.now();me.binaryType='arraybuffer';
    me.onopen=()=>{if(ws===me)write(packet(0x10,str('MQTT'),Uint8Array.from([4,2,0,120]),str('c'+olRand(10))))};
    me.onmessage=e=>{if(ws===me&&e.data instanceof ArrayBuffer)feed(new Uint8Array(e.data))};
    me.onclose=()=>{if(ws===me)drop()};
    me.onerror=()=>{};
  }
  function ping(){if(up&&!pingAt){pingAt=lastPing=Date.now();write(packet(0xc0))}}
  open();
  return{
    up:()=>up,
    pub(to,bytes){if(up)write(packet(0x30,str(to),bytes))},
    check(now){
      if(!ws)return;
      if(!up){if(now-openAt>12000)drop();return}
      if(pingAt&&now-pingAt>8000)drop();       // つながっているように見えて死んでいる
      else if(now-lastPing>10000)ping();
    },
    kick(){if(closed)return;if(!ws){wait=1000;open()}else ping()},
    close(){closed=true;clearTimeout(retryT);if(up)write(packet(0xe0));const w=ws;ws=null;up=false;if(w){try{w.close()}catch(e){}}}
  };
}

/* ---- 2人の間の、確実に届く通り道 ----
   R（保存される）：code seat sid peer sn out rn
   on：bind() msg(m) save() state() full() version() bye() */
function olLink(R,on){
  let dead=false,links=[],outTopic='',key=null,aad=null,sendQ,recvQ=Promise.resolve();
  let seen=0,lastSend=0,ackT=null,bye=null,tick=null,online=false;
  const tries=new Map(),early=new Map(),born=Date.now();

  const ready=(async()=>{
    const base=await crypto.subtle.importKey('raw',OL_ENC.encode(R.code),'PBKDF2',false,['deriveBits']);
    const bits=new Uint8Array(await crypto.subtle.deriveBits({name:'PBKDF2',hash:'SHA-256',salt:OL_ENC.encode('room-key-v1'),iterations:150000},base,512));
    key=await crypto.subtle.importKey('raw',bits.slice(0,32),'AES-GCM',false,['encrypt','decrypt']);
    const root=olHex(bits.slice(32,48));
    outTopic=`${root}/${1-R.seat}`;
    aad=[OL_ENC.encode('from0'),OL_ENC.encode('from1')];
    if(dead)return;
    links=OL_RELAYS.map(u=>olMqtt(u,`${root}/${R.seat}`,receive,relayState));
  })();
  sendQ=ready;

  function write(body,to){
    if(dead)return;
    const text=JSON.stringify(Object.assign({f:R.sid,t:to===undefined?(R.peer||''):to,a:R.rn},body));
    if(to===undefined)lastSend=Date.now();
    sendQ=sendQ.then(async()=>{
      if(!key||!links.length)return;
      const iv=crypto.getRandomValues(new Uint8Array(12));
      const enc=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv,additionalData:aad[R.seat]},key,OL_ENC.encode(text)));
      const b=new Uint8Array(12+enc.length);b.set(iv);b.set(enc,12);
      for(const l of links)l.pub(outTopic,b);
    }).catch(e=>console.warn('[online] send',e));
  }
  function transmit(n,m){
    const o=tries.get(n)||{c:0,at:0};o.c++;o.at=Date.now();tries.set(n,o);
    write({n,m});
  }
  function resend(now){
    let k=0;
    for(const[n,m]of R.out){
      const o=tries.get(n);
      if(o&&now-o.at<Math.min(8000,1500*2**(o.c-1)))continue;
      transmit(n,m);if(++k>=3)break;
    }
    return k;
  }
  function hello(){
    if(!R.peer){if(R.seat===1)write({hi:OL_VER})}
    else write({});
  }
  function relayState(){
    if(dead)return;
    if(links.some(l=>l.up())){tries.clear();hello();if(R.peer)resend(Date.now())}
    on.state();
  }
  function ackSoon(){if(!ackT)ackT=setTimeout(()=>{ackT=null;if(!dead)write({})},150)}

  function receive(bytes){
    recvQ=recvQ.then(async()=>{
      if(dead||bytes.length<29||bytes.length>OL_PACKET)return;
      let p;
      try{p=JSON.parse(OL_DEC.decode(await crypto.subtle.decrypt({name:'AES-GCM',iv:bytes.slice(0,12),additionalData:aad[1-R.seat]},key,bytes.slice(12))))}
      catch(e){return}   // 鍵がちがう・こわれている
      if(!dead)accept(p);
    }).catch(e=>console.error('[online] receive',e));
  }
  function accept(p){
    if(!p||!/^[0-9a-f]{16}$/.test(p.f)||typeof p.t!=='string')return;
    const toMe=p.t===R.sid;
    if(R.seat===0){
      if(!R.peer&&p.hi!==undefined){
        if(p.hi!==OL_VER){write({ver:1},p.f);return}
        R.peer=p.f;seen=Date.now();on.bind();on.save();hello();
      }
      if(p.f!==R.peer){if(p.hi!==undefined||p.t)write({full:1},p.f);return}   // 3人目・もういない部屋あて
      if(!toMe){if(p.hi!==undefined){seen=Date.now();hello()}return}
    }else{
      if(!toMe)return;
      if(p.ver){on.version();return}
      // 部屋を作り直したホストは新しい印（sid）で断ってくる
      if(p.full&&(!R.game||!R.game.ops.length||p.f===R.peer)){on.full();return}
      if(!R.peer){R.peer=p.f;on.bind();on.save()}
      if(p.f!==R.peer)return;
    }
    const now=Date.now();
    if(seen&&now-seen>OL_LOST)tries.clear();   // もどってきた：たまっている分をすぐ送り直す
    seen=now;

    if(olInt(p.a,0,R.sn)&&R.out.length&&R.out[0][0]<=p.a){
      while(R.out.length&&R.out[0][0]<=p.a)tries.delete(R.out.shift()[0]);
      on.save();
    }
    if(Number.isSafeInteger(p.n)&&p.n>0){
      if(p.n>R.rn&&p.n<=R.rn+64)early.set(p.n,p.m);
      while(!dead&&early.has(R.rn+1)){
        const m=early.get(R.rn+1);early.delete(R.rn+1);
        R.rn++;on.msg(m);
        if(!dead)on.save();   // 保存してから受け取りの返事をする
      }
      if(!dead)ackSoon();
    }else if(now-lastSend>2500)ackSoon();   // 相手のタイマーが止まりがちでも返事で生存が伝わる
    if(p.bye&&!bye)bye={last:p.last,at:now};
    if(!dead&&bye&&!(bye.last>R.rn)){bye=null;on.bye();return}
    if(online!==alive()){online=alive();on.state()}
  }
  function alive(){return!!R.peer&&!!seen&&Date.now()-seen<OL_LOST}

  tick=setInterval(()=>{
    const now=Date.now();
    for(const l of links)l.check(now);
    if(links.some(l=>l.up())){
      const n=R.peer?resend(now):0;
      if(!n&&now-lastSend>=(R.peer?OL_BEAT:2000))hello();
    }
    if(bye&&now-bye.at>5000){bye=null;on.bye();return}
    online=alive();on.state();
  },1000);

  const kick=()=>{if(dead||document.hidden)return;for(const l of links)l.kick();tries.clear();if(links.some(l=>l.up()))hello()};
  document.addEventListener('visibilitychange',kick);
  window.addEventListener('online',kick);

  function stop(){
    dead=true;clearInterval(tick);clearTimeout(ackT);
    document.removeEventListener('visibilitychange',kick);window.removeEventListener('online',kick);
  }
  return{
    ready,
    send(m){
      const n=++R.sn;R.out.push([n,m]);on.save();
      if(links.some(l=>l.up()))transmit(n,m);
    },
    up:()=>links.filter(l=>l.up()).length,
    alive,
    quiet:()=>Date.now()-(seen||born),
    age:()=>Date.now()-born,
    close(){stop();for(const l of links)l.close()},
    // 出ていく：まだ届いていない分とお別れを送ってから切る
    leave(){
      if(R.peer){
        for(const[n,m]of R.out.slice(0,5))write({n,m});
        for(let i=0;i<2;i++)write({bye:1,last:R.sn});
      }
      stop();
      const end=()=>{for(const l of links)l.close()};
      sendQ.then(()=>setTimeout(end,700),end);
    }
  };
}
