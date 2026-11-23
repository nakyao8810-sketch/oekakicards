'use strict';
/* DoodleNet (ml5, QuickDraw) in plain JS: conv3x3x2 -> pool, x3, dense 512 tanh, dense N softmax (N = 345, or more after extra training) */
const DoodleNet = (() => {
  let N = 345;
  function decode(b64, isFloat){
    const SH = [[3,3,1,16],[16],[3,3,16,16],[16],[3,3,16,32],[32],[3,3,32,32],[32],[3,3,32,64],[64],[3,3,64,64],[64],[576,512],[512],[512,N],[N]];
    const bin = atob(b64), u8 = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
    const dv = new DataView(u8.buffer), out = []; let o = 0;
    for (const s of SH){
      const n = s.reduce((a, b) => a * b, 1);
      if (s.length === 1 || isFloat){
        const f = new Float32Array(n); for (let i = 0; i < n; i++) f[i] = dv.getFloat32(o + 4 * i, true);
        o += 4 * n; out.push(f); continue;
      }
      const oc = s[s.length - 1], sc = new Float32Array(oc);
      for (let i = 0; i < oc; i++) sc[i] = dv.getFloat32(o + 4 * i, true);
      o += 4 * oc;
      const f = new Float32Array(n);
      for (let i = 0; i < n; i++) f[i] = ((u8[o + i] << 24) >> 24) * sc[i % oc];
      o += n; o = (o + 3) & ~3; out.push(f);
    }
    return out;
  }
  function conv(inp, H, W, C, k, b, O){
    const out = new Float32Array(H * W * O), acc = new Float32Array(O);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
      acc.set(b);
      for (let ky = 0; ky < 3; ky++){
        const iy = y + ky - 1; if (iy < 0 || iy >= H) continue;
        for (let kx = 0; kx < 3; kx++){
          const ix = x + kx - 1; if (ix < 0 || ix >= W) continue;
          const ib = (iy * W + ix) * C, kb = (ky * 3 + kx) * C * O;
          for (let c = 0; c < C; c++){
            const v = inp[ib + c]; if (v === 0) continue;
            const kk = kb + c * O;
            for (let o = 0; o < O; o++) acc[o] += v * k[kk + o];
          }
        }
      }
      const ob = (y * W + x) * O;
      for (let o = 0; o < O; o++) out[ob + o] = acc[o] > 0 ? acc[o] : 0;
    }
    return out;
  }
  function pool(inp, H, W, C){
    const h = H >> 1, w = W >> 1, out = new Float32Array(h * w * C);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let c = 0; c < C; c++){
      const a = inp[((2*y) * W + 2*x) * C + c], b = inp[((2*y) * W + 2*x + 1) * C + c], d = inp[((2*y+1) * W + 2*x) * C + c], e = inp[((2*y+1) * W + 2*x + 1) * C + c];
      out[(y * w + x) * C + c] = Math.max(a, b, d, e);
    }
    return out;
  }
  function dense(inp, k, b, O){
    const out = new Float32Array(b), I = inp.length;
    for (let i = 0; i < I; i++){ const v = inp[i]; if (v === 0) continue; const kb = i * O; for (let o = 0; o < O; o++) out[o] += v * k[kb + o]; }
    return out;
  }
  function make(W){
    return function predict(x){
      let a = conv(x, 28, 28, 1, W[0], W[1], 16);
      a = conv(a, 28, 28, 16, W[2], W[3], 16); a = pool(a, 28, 28, 16);
      a = conv(a, 14, 14, 16, W[4], W[5], 32);
      a = conv(a, 14, 14, 32, W[6], W[7], 32); a = pool(a, 14, 14, 32);
      a = conv(a, 7, 7, 32, W[8], W[9], 64);
      a = conv(a, 7, 7, 64, W[10], W[11], 64); a = pool(a, 7, 7, 64);
      let h = dense(a, W[12], W[13], 512);
      for (let i = 0; i < h.length; i++) h[i] = Math.tanh(h[i]);
      const z = dense(h, W[14], W[15], W[15].length);
      let m = -Infinity; for (const v of z) if (v > m) m = v;
      let s = 0; for (let i = 0; i < z.length; i++){ z[i] = Math.exp(z[i] - m); s += z[i]; }
      for (let i = 0; i < z.length; i++) z[i] /= s;
      return z;
    };
  }
  return { load: (b64, isFloat, n) => { N = n || 345; return make(decode(b64, isFloat)); } };
})();
