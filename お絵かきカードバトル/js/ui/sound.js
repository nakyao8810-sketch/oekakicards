'use strict';
/* =========================================================
   音（効果音）：スケッチブックとえんぴつの世界に合わせて、紙・えんぴつ・クレヨン・木琴・鈴の音を
   Web Audio でその場で作る（音のファイルは使わない）
   snd('名前')        ：1回鳴らす
   sndPen(on,kind,速さ)：線をかいているあいだの「かきかき」（kind: pen / eraser）
   ========================================================= */
let AC=null,soundOn=true,SNDM=null,NOISE=null,GRIT=null;
try{soundOn=localStorage.getItem('tr_sound')!=='0'}catch(e){}
function sndInit(){
  if(AC)return AC;
  AC=new(window.AudioContext||window.webkitAudioContext)();
  const comp=AC.createDynamicsCompressor();comp.threshold.value=-14;comp.ratio.value=4;
  SNDM=AC.createGain();SNDM.gain.value=1.8;SNDM.connect(comp).connect(AC.destination);
  // ノイズ（紙・風・はじける音のもと）と、ざらざらのノイズ（えんぴつの芯が紙をこする音）
  const n=AC.sampleRate*1.2;NOISE=AC.createBuffer(1,n,AC.sampleRate);GRIT=AC.createBuffer(1,n,AC.sampleRate);
  const a=NOISE.getChannelData(0),b=GRIT.getChannelData(0);
  for(let i=0;i<n;i++){const w=Math.random()*2-1;a[i]=w;b[i]=w*(.25+.75*Math.random()**3)*(Math.random()<.02?2.2:1)}
  return AC;
}
// 同じ音を短いあいだに何度も鳴らさない（おまかせでかく・まとめて攻撃のとき）
const SND_GAP={fill:.09,hit:.05,tap:.03,heal:.08,gauge:.08,draw:.06,poly:.12,crayon:.1};const sndLast={};
function snd(type){
  if(!soundOn)return;
  try{
    sndInit();if(AC.state==='suspended')AC.resume();
    const t=AC.currentTime;if(SND_GAP[type]&&t-(sndLast[type]||-9)<SND_GAP[type])return;sndLast[type]=t;
    // 音の部品：tone＝音の高さのある音（f→f2 にすべる）、noise＝ノイズをフィルターに通した音
    const tone=(f,d,ty='sine',v=.07,dl=0,f2,att=.004)=>{const o=AC.createOscillator(),g=AC.createGain();o.type=ty;o.frequency.setValueAtTime(f,t+dl);if(f2)o.frequency.exponentialRampToValueAtTime(f2,t+dl+d);
      g.gain.setValueAtTime(.0001,t+dl);g.gain.exponentialRampToValueAtTime(v,t+dl+att);g.gain.exponentialRampToValueAtTime(.0005,t+dl+d);o.connect(g).connect(SNDM);o.start(t+dl);o.stop(t+dl+d+.05)};
    // ノイズはフィルターで小さくなるので、ほかの音と同じくらいに聞こえるよう3倍にする
    const noise=(d,v,dl=0,ft='bandpass',f=2000,f2,Q=1,att=.004,buf=NOISE)=>{v*=3;const s=AC.createBufferSource(),fl=AC.createBiquadFilter(),g=AC.createGain();s.buffer=buf;fl.type=ft;fl.frequency.setValueAtTime(f,t+dl);if(f2)fl.frequency.exponentialRampToValueAtTime(f2,t+dl+d);fl.Q.value=Q;
      g.gain.setValueAtTime(.0001,t+dl);g.gain.exponentialRampToValueAtTime(v,t+dl+att);g.gain.exponentialRampToValueAtTime(.0005,t+dl+d);s.connect(fl).connect(g).connect(SNDM);s.start(t+dl,Math.random()*.5);s.stop(t+dl+d+.05)};
    // 木琴・鈴っぽい音（三角波＋少し高い倍音）
    const bell=(f,d=.35,v=.05,dl=0)=>{tone(f,d,'triangle',v,dl);tone(f*2,d*.6,'sine',v*.35,dl);tone(f*3.01,d*.3,'sine',v*.15,dl)};
    const thud=(v=.12,dl=0,f=900)=>noise(.09,v,dl,'lowpass',f,120,.7,.002);
    switch(type){
      /* ---- 画面 ---- */
      case'tap':noise(.025,.05,0,'bandpass',3200,null,2.5,.001);tone(1100,.03,'triangle',.018);break;                 // えんぴつでつつく
      case'open':noise(.2,.035,0,'bandpass',1400,3200,1.2,.03);break;                                                // 紙がすべる
      case'page':noise(.16,.03,0,'highpass',1800,5000,.7,.02);noise(.12,.022,.1,'highpass',2500,6000,.7,.02);break;     // ページをめくる
      case'coin':bell(1319,.25,.05);bell(1760,.4,.05,.09);break;
      /* ---- お絵かき ---- */
      case'pick':tone(660,.07,'sine',.05,0,990);noise(.02,.03,0,'bandpass',4000,null,2);break;                         // クレヨンをえらぶ「ぽっ」
      case'fill':tone(260,.16,'sine',.07,0,620);noise(.12,.035,.02,'bandpass',900,2400,1.5,.01);break;                  // ペンキ「ぽちゃ」
      case'poly':tone(420+Math.random()*200,.07,'sine',.03,0,700);break;                                               // おまかせでぬる（かるく）
      case'snap':tone(880,.06,'square',.025);tone(1320,.12,'square',.022,.06);break;                                   // ととのえ「ピコン」
      case'cut':noise(.03,.035,0,'highpass',3500,null,1,.001);noise(.03,.03,.07,'highpass',4200,null,1,.001);break;     // はさみ「チョキン」
      case'undo':noise(.14,.05,0,'bandpass',3000,900,1,.02);break;                                                     // もどす「シュッ」
      case'redo':noise(.14,.05,0,'bandpass',900,3000,1,.02);break;
      case'crumple':for(let i=0;i<14;i++)noise(.03+Math.random()*.03,.03+Math.random()*.05,i*.028+Math.random()*.02,'bandpass',1200+Math.random()*3500,null,1.5,.001);break; // 紙をくしゃくしゃ
      case'magic':[784,988,1175,1568].forEach((f,k)=>bell(f,.3,.03,k*.06));break;                                       // おまかせ・左右対称
      case'scan':for(let i=0;i<10;i++)bell(880*Math.pow(1.0595,i*2),.22,.022,i*.11);noise(1.1,.012,0,'bandpass',5000,9000,3,.3);break; // 鑑定中のキラキラ
      case'reveal':thud(.12);[523,659,784].forEach(f=>tone(f,.6,'triangle',.04,.02));bell(1047,.6,.05,.12);bell(1568,.5,.03,.24);break;  // カードができた「ジャーン」
      case'save':thud(.16,0,600);bell(1175,.3,.04,.06);break;                                                          // スタンプ「ポン」
      /* ---- バトル ---- */
      case'draw':noise(.09,.045,0,'highpass',2500,6500,.8,.005);break;                                                 // カードを引く「シュッ」
      case'card':noise(.07,.05,0,'bandpass',1800,900,1,.003);thud(.06);break;                                           // カードを動かす
      case'summon':thud(.12,0,700);noise(.05,.04,0,'bandpass',2500,null,1);tone(330,.25,'sine',.04,.04,660);bell(988,.25,.025,.12);break; // カードを出す「パシッ→ふわっ」
      case'atk':noise(.22,.07,0,'bandpass',800,2600,1.2,.04);break;                                                    // 風を切る「ヒュッ」
      case'hit':thud(.17);noise(.04,.06,0,'bandpass',2200,null,1.2,.001);tone(150,.14,'triangle',.05,0,70);break;        // 「バシッ」
      case'big':thud(.24,0,500);tone(95,.3,'triangle',.08,0,45);noise(.25,.04,.03,'lowpass',400,100,.7,.01);break;       // ライフにダメージ「ドスン」
      case'kill':noise(.25,.07,0,'bandpass',2600,700,1.2,.003);thud(.14,.02);tone(392,.08,'triangle',.04,.05);tone(196,.35,'triangle',.05,.12,90);break; // 紙がやぶれて「ボンッ」
      case'heal':[1047,1319,1568,2093].forEach((f,k)=>tone(f,.25,'sine',.03,k*.05));break;                              // キラキラ
      case'gauge':bell(1568,.25,.035);bell(2093,.3,.025,.05);break;                                                    // 宝石「キン」
      case'guard':noise(.05,.08,0,'highpass',3000,null,1,.001);[523,787,1047].forEach(f=>tone(f*1.003,.45,'triangle',.035));tone(785,.45,'square',.012);break; // たて「カーン」
      case'sp':tone(196,.5,'sawtooth',.03,0,784,.05);noise(.5,.025,0,'bandpass',600,4000,1,.1);thud(.16,.45);[392,494,587,784].forEach(f=>tone(f,.5,'triangle',.035,.46));break; // 必殺技：ためて「ドン」
      case'tactic':noise(.1,.05,0,'highpass',2500,6000,.8,.005);[659,880,1175].forEach((f,k)=>bell(f,.3,.03,.08+k*.07));break; // タクティクス：カードをめくって魔法
      case'recharge':noise(.09,.025,0,'highpass',2500,6500,.8);noise(.09,.025,.12,'highpass',2500,6500,.8);bell(1175,.2,.03,.22);break;
      case'reso':bell(659,.4,.05);bell(988,.5,.04,.07);bell(1319,.5,.03,.14);break;                                    // 共鳴
      case'full':[523,659,784,1047].forEach((f,k)=>bell(f,.6,.045,k*.08));bell(1568,.8,.035,.36);noise(.8,.015,.3,'bandpass',6000,10000,3,.2);break;
      case'turn':noise(.16,.05,0,'highpass',1800,5000,.7,.02);bell(784,.3,.04,.12);bell(1175,.4,.04,.22);break;        // 自分の番：ページをめくって「ポロン」
      case'turnop':noise(.16,.045,0,'highpass',1800,5000,.7,.02);bell(587,.3,.035,.12);bell(440,.4,.035,.22);break;    // 相手の番
      case'battle':thud(.2,0,300);thud(.16,.16,300);[392,523].forEach(f=>tone(f,.4,'sawtooth',.018,.3));tone(784,.5,'triangle',.04,.3);break; // バトル開始「ドンドン」
      case'win':[523,659,784,1047].forEach((f,k)=>bell(f,.35,.05,k*.12));[523,659,784].forEach(f=>tone(f*2,.9,'triangle',.03,.5));bell(1568,.9,.04,.5);break;
      case'lose':[392,349,311,262].forEach((f,k)=>tone(f,.45,'triangle',.045,k*.22));break;
    }
  }catch(e){if(window.SND_DEBUG)throw e}   // テストのときだけエラーを外に出す
}
// 線をかいているあいだの音。kind: pen（えんぴつ）/ eraser（けしゴム）。sp: 0〜1 の速さ（速いほど大きく・高く）
let PEN=null;
function sndPen(on,kind='pen',sp=0){
  if(!soundOn){if(PEN)sndPen(false);return}
  try{
    if(on){
      sndInit();if(AC.state==='suspended')AC.resume();const t=AC.currentTime;
      if(!PEN||PEN.kind!==kind){if(PEN)sndPen(false);
        const s=AC.createBufferSource(),bp=AC.createBiquadFilter(),hp=AC.createBiquadFilter(),g=AC.createGain();
        s.buffer=GRIT;s.loop=true;bp.type='bandpass';bp.frequency.value=kind==='eraser'?1100:3600;bp.Q.value=kind==='eraser'?.9:1.3;hp.type='highpass';hp.frequency.value=kind==='eraser'?300:1200;
        g.gain.value=0;s.connect(bp).connect(hp).connect(g).connect(SNDM);s.start();PEN={s,bp,g,kind};
      }
      const v=Math.min(1,sp)*(kind==='eraser'?.3:.18);
      PEN.g.gain.cancelScheduledValues(t);PEN.g.gain.setTargetAtTime(v,t,.02);PEN.g.gain.setTargetAtTime(0,t+.07,.05);   // 指が止まると自然に消える
      PEN.bp.frequency.setTargetAtTime((kind==='eraser'?900:3000)+sp*1500,t,.04);
    }else if(PEN){const P=PEN;PEN=null;const t=AC.currentTime;P.g.gain.cancelScheduledValues(t);P.g.gain.setTargetAtTime(0,t,.03);P.s.stop(t+.25)}
  }catch(e){}
}
