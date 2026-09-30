/* =====================================================================
   NITRO RUSH 3D — Engine.js
   Inicialização gráfica (renderer, pós-processamento), céu e mapa de ambiente,
   sol com sombras suaves, loaders GLTF/Draco, texturas PBR procedurais,
   partículas e áudio procedural (Web Audio).
   Script clássico (carregado em ordem pelo index.html depois do Three.js):
   as classes/constantes de nível superior ficam no escopo global compartilhado.
   ===================================================================== */
'use strict';

/* =====================================================================
   UTILITÁRIOS
   ===================================================================== */
const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
const lerp = (a, b, t) => a + (b - a) * t;
const smoothstep = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const damp = (a, b, k, dt) => lerp(a, b, 1 - Math.exp(-k * dt));
const wrapAngle = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
const $ = (id) => document.getElementById(id);

function mulberry32(a) {
  return function () {
    a |= 0; a = (a + 0x6D2B79F5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Simplex Noise 2D (Stefan Gustavson) com permutação semeada
class SimplexNoise {
  constructor(seed = 1) {
    const rand = mulberry32(seed);
    const p = new Uint8Array(256);
    for (let i = 0; i < 256; i++) p[i] = i;
    for (let i = 255; i > 0; i--) { const j = Math.floor(rand() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    this.perm = new Uint8Array(512); this.pm12 = new Uint8Array(512);
    for (let i = 0; i < 512; i++) { this.perm[i] = p[i & 255]; this.pm12[i] = this.perm[i] % 12; }
    this.g = new Float32Array([1,1,0,-1,1,0,1,-1,0,-1,-1,0,1,0,1,-1,0,1,1,0,-1,-1,0,-1,0,1,1,0,-1,1,0,1,-1,0,-1,-1]);
  }
  noise2D(xin, yin) {
    const F2 = 0.3660254037844386, G2 = 0.21132486540518713, g = this.g, perm = this.perm, pm = this.pm12;
    const s = (xin + yin) * F2; const i = Math.floor(xin + s), j = Math.floor(yin + s);
    const t = (i + j) * G2; const x0 = xin - (i - t), y0 = yin - (j - t);
    const i1 = x0 > y0 ? 1 : 0, j1 = x0 > y0 ? 0 : 1;
    const x1 = x0 - i1 + G2, y1 = y0 - j1 + G2, x2 = x0 - 1 + 2 * G2, y2 = y0 - 1 + 2 * G2;
    const ii = i & 255, jj = j & 255;
    let n = 0, tt, gi;
    tt = 0.5 - x0 * x0 - y0 * y0; if (tt > 0) { gi = pm[ii + perm[jj]] * 3; tt *= tt; n += tt * tt * (g[gi] * x0 + g[gi + 1] * y0); }
    tt = 0.5 - x1 * x1 - y1 * y1; if (tt > 0) { gi = pm[ii + i1 + perm[jj + j1]] * 3; tt *= tt; n += tt * tt * (g[gi] * x1 + g[gi + 1] * y1); }
    tt = 0.5 - x2 * x2 - y2 * y2; if (tt > 0) { gi = pm[ii + 1 + perm[jj + 1]] * 3; tt *= tt; n += tt * tt * (g[gi] * x2 + g[gi + 1] * y2); }
    return 70 * n;
  }
  fbm(x, y, oct = 4, lac = 2, gain = 0.5) {
    let a = 1, f = 1, sum = 0, norm = 0;
    for (let o = 0; o < oct; o++) { sum += a * this.noise2D(x * f, y * f); norm += a; a *= gain; f *= lac; }
    return sum / norm;
  }
  ridged(x, y, oct = 4) {
    let a = 1, f = 1, sum = 0, norm = 0;
    for (let o = 0; o < oct; o++) { const n = 1 - Math.abs(this.noise2D(x * f, y * f)); sum += a * n * n; norm += a; a *= 0.5; f *= 2; }
    return sum / norm;
  }
}

// Junta várias geometrias (já transformadas) em uma só — reduz draw calls
function mergeGeometries(list) {
  const geos = list.map((g) => (g.index ? g.toNonIndexed() : g));
  let total = 0; for (const g of geos) total += g.attributes.position.count;
  const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3), uv = new Float32Array(total * 2);
  let hasColor = geos.every((g) => g.attributes.color);
  const col = hasColor ? new Float32Array(total * 3) : null;
  let o = 0;
  for (const g of geos) {
    const c = g.attributes.position.count;
    if (!g.attributes.normal) g.computeVertexNormals();
    pos.set(g.attributes.position.array, o * 3);
    nor.set(g.attributes.normal.array, o * 3);
    if (g.attributes.uv) uv.set(g.attributes.uv.array, o * 2);
    if (col) col.set(g.attributes.color.array, o * 3);
    o += c;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
  if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.computeBoundingSphere(); out.computeBoundingBox();
  for (const g of geos) g.dispose();
  for (const g of list) g.dispose();
  return out;
}

function makeCanvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function canvasTex(canvas, repeat = false, srgb = true) {
  const t = new THREE.CanvasTexture(canvas);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; }
  t.anisotropy = 8;
  return t;
}
function radialTexture(inner = 'rgba(255,255,255,1)', outer = 'rgba(255,255,255,0)', size = 128) {
  const c = makeCanvas(size, size), g = c.getContext('2d');
  const gr = g.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  gr.addColorStop(0, inner); gr.addColorStop(1, outer);
  g.fillStyle = gr; g.fillRect(0, 0, size, size);
  return canvasTex(c);
}
function fmtTime(t) {
  if (t == null || !isFinite(t) || t < 0) return '--:--.---';
  const m = Math.floor(t / 60), s = t - m * 60;
  return String(m).padStart(2, '0') + ':' + s.toFixed(3).padStart(6, '0');
}
function hexToCss(h) { return typeof h === 'string' ? h : '#' + h.toString(16).padStart(6, '0'); }


/* =====================================================================
   QUALIDADE GRÁFICA
   ===================================================================== */
const QUALITY = {
  low: { pixelRatio: 1, shadows: false, shadowSize: 1024, bloom: false, terrainSeg: 200, trees: 1000, aiShadows: false, grass: 0.35, tex: 512, clouds: false, vegDist: 150, lights: 1 },
  medium: { pixelRatio: 1.25, shadows: true, shadowSize: 2048, bloom: true, terrainSeg: 260, trees: 1800, aiShadows: false, grass: 0.7, tex: 1024, clouds: true, vegDist: 200, lights: 2 },
  high: { pixelRatio: 1.75, shadows: true, shadowSize: 4096, bloom: true, terrainSeg: 330, trees: 2800, aiShadows: true, grass: 1, tex: 1024, clouds: true, vegDist: 260, lights: 3 },
};

/* =====================================================================
   TEXTURE LAB — texturas PBR procedurais geradas em canvas no carregamento:
   albedo + normal map (a partir de um campo de altura) + roughness map.
   Ruído "valor" periódico → as texturas repetem sem emendas.
   ===================================================================== */
const TextureLab = {
  cache: new Map(), aniso: 8,
  // ruído fractal periódico (w×h), célula inicial em pixels
  noise(w, h, cell, oct, seed, gain = 0.5) {
    const out = new Float32Array(w * h), rnd = mulberry32(seed); let amp = 1, norm = 0;
    for (let o = 0; o < oct && cell >= 1; o++, cell /= 2, amp *= gain) {
      const gw = Math.max(1, Math.round(w / cell)), gh = Math.max(1, Math.round(h / cell)), L = new Float32Array(gw * gh);
      for (let i = 0; i < L.length; i++) L[i] = rnd();
      const sx = gw / w, sy = gh / h;
      for (let y = 0; y < h; y++) {
        const fy = y * sy, iy = Math.floor(fy), ty = fy - iy, uy = ty * ty * (3 - 2 * ty), y0 = (iy % gh) * gw, y1 = ((iy + 1) % gh) * gw;
        for (let x = 0; x < w; x++) {
          const fx = x * sx, ix = Math.floor(fx), tx = fx - ix, ux = tx * tx * (3 - 2 * tx), x0 = ix % gw, x1 = (ix + 1) % gw;
          const a = L[y0 + x0], b = L[y0 + x1], c = L[y1 + x0], d = L[y1 + x1];
          out[y * w + x] += amp * (a + (b - a) * ux + (c - a + (a - b - c + d) * ux) * uy);
        }
      }
      norm += amp;
    }
    for (let i = 0; i < out.length; i++) out[i] /= norm;
    return out;
  },
  // normal map (tangente) por Sobel sobre o campo de altura, com bordas periódicas
  normalFrom(hf, w, h, strength) {
    const c = makeCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
    for (let y = 0; y < h; y++) {
      const ym = ((y - 1 + h) % h) * w, yc = y * w, yp = ((y + 1) % h) * w;
      for (let x = 0; x < w; x++) {
        const xm = (x - 1 + w) % w, xp = (x + 1) % w;
        const dx = hf[ym + xp] + 2 * hf[yc + xp] + hf[yp + xp] - hf[ym + xm] - 2 * hf[yc + xm] - hf[yp + xm];
        const dy = hf[yp + xm] + 2 * hf[yp + x] + hf[yp + xp] - hf[ym + xm] - 2 * hf[ym + x] - hf[ym + xp];
        let nx = -dx * strength, ny = dy * strength, nz = 1; const L = Math.hypot(nx, ny, nz); nx /= L; ny /= L; nz /= L;
        const o = (yc + x) * 4; d[o] = (nx * 0.5 + 0.5) * 255; d[o + 1] = (ny * 0.5 + 0.5) * 255; d[o + 2] = (nz * 0.5 + 0.5) * 255; d[o + 3] = 255;
      }
    }
    g.putImageData(im, 0, 0); return c;
  },
  tex(canvas, srgb, rep = [1, 1]) {
    const t = new THREE.CanvasTexture(canvas); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rep[0], rep[1]);
    t.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace; t.anisotropy = this.aniso; return t;
  },
  gray(values, w, h, fn) {   // canvas em tons de cinza (roughness/AO): fn(i) → 0..1
    const c = makeCanvas(w, h), g = c.getContext('2d'), im = g.createImageData(w, h), d = im.data;
    for (let i = 0; i < w * h; i++) { const v = clamp(fn(i), 0, 1) * 255, o = i * 4; d[o] = d[o + 1] = d[o + 2] = v; d[o + 3] = 255; }
    g.putImageData(im, 0, 0); return c;
  },
  hex(c) { const v = new THREE.Color(c); return [v.r * 255, v.g * 255, v.b * 255]; },

  // Asfalto de corrida: agregado, juntas, ranhuras, trincas, remendos, manchas de óleo,
  // borracha no traçado e marcas de pneu. u = largura da pista, v = ao longo (1 repetição = 12 m).
  // A parte pesada (padrões, normal e rugosidade) é gerada uma vez por condição (seco/molhado/gelo);
  // o albedo de cada circuito é composto rapidamente com a cor do asfalto local (faixas continuam brancas).
  asphaltCore({ size = 1024, wet = false, ice = false, rubber = 0.55, center = false }) {
    const key = ['asphaltCore', size, wet, ice, rubber, center].join('|'); if (this.cache.has(key)) return this.cache.get(key);
    const W = size, H = size, seed = ice ? 41 : wet ? 29 : 7, r = mulberry32(seed);
    const fine = this.noise(W, H, 3, 2, seed + 1), grain = this.noise(W, H, 10, 3, seed + 2), mid = this.noise(W, H, 90, 4, seed + 3), big = this.noise(W, H, 360, 3, seed + 4);
    const N = W * H, stain = new Float32Array(N), crack = new Float32Array(N), patch = new Float32Array(N);
    for (let k = 0; k < 26; k++) {   // trincas: caminhadas aleatórias finas
      let x = r() * W, y = r() * H, a = r() * Math.PI * 2; const len = 60 + r() * 260;
      for (let s = 0; s < len; s++) { a += (r() - 0.5) * 0.5; x = (x + Math.cos(a) + W) % W; y = (y + Math.sin(a) + H) % H; const i = (y | 0) * W + (x | 0); crack[i] = 1; crack[(i + 1) % N] = Math.max(crack[(i + 1) % N], 0.5); }
    }
    for (let k = 0; k < 5; k++) {    // remendos retangulares (asfalto mais novo)
      const rx = r() * W, ry = r() * H, rw = 60 + r() * 220, rh = 80 + r() * 380, s = 0.4 + r() * 0.6;
      for (let yy = 0; yy < rh; yy++) for (let xx = -rw / 2; xx < rw / 2; xx++) patch[(Math.round(ry + yy) % H) * W + (((Math.round(rx + xx) % W) + W) % W)] = s;
    }
    for (let k = 0; k < 16; k++) {   // manchas de óleo (só na caixa de cada mancha)
      const sx = W * (0.25 + r() * 0.5), sy = r() * H, sr = 10 + r() * 38, s = 0.4 + r() * 0.6, ry = Math.ceil(sr / 0.75);
      for (let yy = -ry; yy <= ry; yy++) for (let xx = -Math.ceil(sr); xx <= Math.ceil(sr); xx++) {
        const d = Math.hypot(xx, yy * 0.75) / sr; if (d >= 1) continue;
        const i = (((Math.round(sy + yy) % H) + H) % H) * W + (((Math.round(sx + xx) % W) + W) % W);
        stain[i] = Math.max(stain[i], (1 - d * d) * s * (0.6 + mid[i] * 0.8));
      }
    }
    const lum = new Float32Array(N), agg = new Float32Array(N), paint = new Uint8Array(N), wear = new Float32Array(N), frost = new Float32Array(N), hgt = new Float32Array(N), rough = new Float32Array(N);
    const lineU = [0.03, 0.97], lineW = 0.009;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, u = x / W;
      agg[i] = fine[i] > 0.68 ? (fine[i] - 0.68) * 3.1 : 0;                                   // pedrinhas claras do agregado
      let t = 0.78 + (grain[i] - 0.5) * 0.28 + (mid[i] - 0.5) * 0.22 + (big[i] - 0.5) * 0.18;
      const groove = 0.5 + 0.5 * Math.sin(u * Math.PI * 2 * 180);                            // ranhuras finas longitudinais
      const band = Math.exp(-Math.pow((u - 0.5) / 0.16, 2)) * rubber;                         // borracha do traçado
      const skid = Math.max(0, Math.sin(u * 37 + big[i] * 9) - 0.93) * 6 * (mid[i] > 0.55 ? 1 : 0);
      t *= 1 - band * 0.22 - skid * 0.18 - stain[i] * 0.45 - crack[i] * 0.35;
      if (patch[i]) t *= 0.9 + patch[i] * 0.06;
      lum[i] = t;
      if (ice) frost[i] = clamp((big[i] - 0.35) * 1.6, 0, 1) * 0.55 + clamp((fine[i] - 0.6) * 2, 0, 1) * 0.25;
      let rg = 0.9 - band * 0.18 - stain[i] * 0.55 - agg[i] * 0.1 + (grain[i] - 0.5) * 0.08;
      for (const lu of lineU) if (Math.abs(u - lu) < lineW) paint[i] = 1;
      if (center && Math.abs(u - 0.5) < lineW * 0.6 && y % 256 < 150) paint[i] = 2;
      if (paint[i]) { wear[i] = 0.82 + grain[i] * 0.2 - crack[i] * 0.4; rg = 0.55; }
      if (wet) rg *= 0.45; if (ice) rg = lerp(rg, 0.3, frost[i]);
      hgt[i] = fine[i] * 0.55 + grain[i] * 0.3 + groove * 0.06 - crack[i] * 0.9 - stain[i] * 0.05 + (paint[i] ? 0.25 : 0) + patch[i] * 0.05;
      rough[i] = rg;
    }
    const core = { W, H, lum, agg, paint, wear, frost, ice, normalMap: this.tex(this.normalFrom(hgt, W, H, ice ? 1.2 : 2.4), false), roughnessMap: this.tex(this.gray(null, W, H, (i) => rough[i]), false) };
    this.cache.set(key, core); return core;
  },
  asphalt(opts = {}) {
    const { size = 1024, base = '#34363b', stone = '#8f8f93', lines = '#f2f2f2', centerColor = '#ffc400', wet = false, ice = false, rubber = 0.55, center = false } = opts;
    const key = ['asphalt', size, base, stone, lines, wet, ice, rubber, center].join('|'); if (this.cache.has(key)) return this.cache.get(key);
    const C = this.asphaltCore({ size, wet, ice, rubber, center }), W = C.W, H = C.H, cb = this.hex(base), cs = this.hex(stone), cl = this.hex(lines), cc = this.hex(centerColor);
    const col = makeCanvas(W, H), cg = col.getContext('2d'), im = cg.createImageData(W, H), d = im.data;
    for (let i = 0, n = W * H; i < n; i++) {
      const t = C.lum[i], a = C.agg[i] * 0.55, o = i * 4;
      let R = cb[0] * t + cs[0] * a, G = cb[1] * t + cs[1] * a, B = cb[2] * t + cs[2] * a;
      if (C.ice) { const f = C.frost[i]; R = lerp(R, 225, f); G = lerp(G, 236, f); B = lerp(B, 248, f); }
      if (C.paint[i]) { const p = C.paint[i] === 2 ? cc : cl, w = C.wear[i]; R = p[0] * w; G = p[1] * w; B = p[2] * w; }
      d[o] = R > 255 ? 255 : R; d[o + 1] = G > 255 ? 255 : G; d[o + 2] = B > 255 ? 255 : B; d[o + 3] = 255;
    }
    cg.putImageData(im, 0, 0);
    const out = { map: this.tex(col, true), normalMap: C.normalMap, roughnessMap: C.roughnessMap };
    this.cache.set(key, out); return out;
  },
  // Zebra: listras vermelho/branco com relevo arredondado e sulcos
  kerb({ a = '#e9e9ea', b = '#d4141e', seed = 3 } = {}) {
    const key = 'kerb' + a + b; if (this.cache.has(key)) return this.cache.get(key);
    const W = 128, H = 512, n = this.noise(W, H, 6, 3, seed), ca = this.hex(a), cb = this.hex(b);
    const col = makeCanvas(W, H), g = col.getContext('2d'), im = g.createImageData(W, H), d = im.data, hgt = new Float32Array(W * H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x, stripe = Math.floor(y / 128) % 2, c = stripe ? cb : ca, w = 0.86 + n[i] * 0.18, u = x / W;
      const o = i * 4; d[o] = c[0] * w; d[o + 1] = c[1] * w; d[o + 2] = c[2] * w; d[o + 3] = 255;
      hgt[i] = Math.sin(u * Math.PI) * 0.8 + (Math.sin((y / 128) * Math.PI * 2 * 4) > 0.6 ? 0.25 : 0) + n[i] * 0.12;
    }
    g.putImageData(im, 0, 0);
    const out = { map: this.tex(col, true), normalMap: this.tex(this.normalFrom(hgt, W, H, 3), false), roughnessMap: this.tex(this.gray(null, W, H, (i) => 0.42 + n[i] * 0.2), false) };
    this.cache.set(key, out); return out;
  },
  // detalhe de terreno (grama/terra/neve/areia): normal + rugosidade repetidos
  ground(kind = 'grass') {
    const key = 'ground' + kind; if (this.cache.has(key)) return this.cache.get(key);
    const W = 512, H = 512, a = this.noise(W, H, 4, 3, 11), b = this.noise(W, H, 40, 3, 12);
    const st = { grass: 2.4, dirt: 1.8, snow: 0.8, sand: 1.2, city: 1.1 }[kind] || 1.5;
    const hgt = new Float32Array(W * H); for (let i = 0; i < W * H; i++) hgt[i] = a[i] * 0.7 + b[i] * 0.3;
    const out = { normalMap: this.tex(this.normalFrom(hgt, W, H, st), false), roughnessMap: this.tex(this.gray(null, W, H, (i) => (kind === 'snow' ? 0.62 : 0.9) + (a[i] - 0.5) * 0.12), false) };
    this.cache.set(key, out); return out;
  },
  // "flakes" metálicos da pintura (normal de alta frequência sob o verniz)
  flakes() {
    if (this.cache.has('flakes')) return this.cache.get('flakes');
    const W = 256, r = mulberry32(77), c = makeCanvas(W, W), g = c.getContext('2d'), im = g.createImageData(W, W), d = im.data;
    for (let i = 0; i < W * W; i++) { let x = (r() - 0.5) * 0.9, y = (r() - 0.5) * 0.9; const z = Math.sqrt(Math.max(0.05, 1 - x * x - y * y)); const o = i * 4; d[o] = (x * 0.5 + 0.5) * 255; d[o + 1] = (y * 0.5 + 0.5) * 255; d[o + 2] = (z * 0.5 + 0.5) * 255; d[o + 3] = 255; }
    g.putImageData(im, 0, 0);
    const peel = this.noise(W, W, 24, 3, 78), out = { flakes: this.tex(c, false, [14, 14]), peel: this.tex(this.normalFrom(peel, W, W, 0.9), false, [3, 3]) };
    this.cache.set('flakes', out); return out;
  },
  // borracha do pneu (lateral) com microtextura
  rubber() {
    if (this.cache.has('rubber')) return this.cache.get('rubber');
    const W = 256, n = this.noise(W, W, 2, 2, 91), out = { normalMap: this.tex(this.normalFrom(n, W, W, 1.6), false, [6, 2]) };
    this.cache.set('rubber', out); return out;
  },
};

/* =====================================================================
   SKY DOME — céu avançado: gradiente atmosférico, disco solar com halo,
   camada de nuvens procedurais animadas (FBM) e estrelas à noite.
   O mesmo material alimenta o mapa de reflexo (PMREM → scene.environment).
   ===================================================================== */
class SkyDome {
  constructor(o) {
    const C = (c) => new THREE.Color(c);
    this.uniforms = {
      uZenith: { value: C(o.top) }, uHorizon: { value: C(o.horizon) }, uGround: { value: C(o.bottom) },
      uSunDir: { value: o.sunDir.clone().normalize() }, uSunColor: { value: C(o.sunColor || '#ffffff') },
      uSunSize: { value: o.sunSize != null ? o.sunSize : 0.9994 }, uHalo: { value: o.glow != null ? o.glow : 0.4 },
      uTime: { value: 0 }, uCloud: { value: o.clouds != null ? o.clouds : 0.45 }, uCloudScale: { value: o.cloudScale || 0.55 },
      uCloudLight: { value: C(o.cloudLight || '#ffffff') }, uCloudShadow: { value: C(o.cloudShadow || '#8a97a8') },
      uStars: { value: o.stars ? 1 : 0 }, uHaze: { value: o.haze != null ? o.haze : 0.5 }, uCloudOn: { value: o.cloudsOn === false ? 0 : 1 },
    };
    this.mat = new THREE.ShaderMaterial({
      uniforms: this.uniforms, side: THREE.BackSide, depthWrite: false, fog: false,
      vertexShader: `varying vec3 vDir; void main(){ vDir = normalize(position); vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position = p.xyww; }`,
      fragmentShader: `uniform vec3 uZenith, uHorizon, uGround, uSunDir, uSunColor, uCloudLight, uCloudShadow;
        uniform float uSunSize, uHalo, uTime, uCloud, uCloudScale, uStars, uHaze, uCloudOn; varying vec3 vDir;
        float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
        float vnoise(vec2 p){ vec2 i = floor(p), f = fract(p); vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y); }
        float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++){ s += a * vnoise(p); p = p * 2.03 + vec2(1.7, 9.2); a *= 0.5; } return s; }
        void main(){
          vec3 d = normalize(vDir); float h = d.y;
          vec3 col = h > 0.0 ? mix(uHorizon, uZenith, pow(clamp(h, 0.0, 1.0), 0.42)) : mix(uHorizon, uGround, pow(clamp(-h, 0.0, 1.0), 0.3));
          col = mix(col, uHorizon * 1.06, exp(-abs(h) * 16.0) * uHaze);
          float sd = max(dot(d, uSunDir), 0.0);
          col += uSunColor * (pow(sd, 6.0) * 0.12 + pow(sd, 90.0) * uHalo);
          col += uSunColor * smoothstep(uSunSize, uSunSize + 0.0007, sd) * 14.0;
          if (h > 0.0 && uCloudOn > 0.5) {
            vec2 uv = d.xz / (h + 0.1) * uCloudScale + vec2(uTime * 0.006, uTime * 0.0025);
            float n = fbm(uv) * 0.62 + fbm(uv * 2.6 + 13.0) * 0.38;
            float c = smoothstep(1.0 - uCloud, 1.0 - uCloud + 0.32, n) * smoothstep(0.0, 0.16, h);
            vec3 cc = mix(uCloudShadow, uCloudLight, clamp((n - 0.35) * 2.2, 0.0, 1.0)) * (0.7 + 0.5 * pow(sd, 4.0));
            col = mix(col, cc, c);
          }
          if (uStars > 0.5 && h > 0.0) {
            vec2 sp = floor(d.xz / (h + 0.25) * 240.0); float st = step(0.9972, hash(sp));
            col += vec3(st) * smoothstep(0.03, 0.25, h) * (0.55 + 0.45 * sin(uTime * 2.3 + hash(sp + 3.1) * 40.0)) * 1.4;
          }
          gl_FragColor = vec4(col, 1.0);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
    });
    this.mesh = new THREE.Mesh(new THREE.SphereGeometry(4000, 48, 24), this.mat);
    this.mesh.renderOrder = -10; this.mesh.frustumCulled = false;
    // cena de ambiente: o céu + um "chão" na cor do terreno (reflexo inferior correto nas latarias)
    this.envScene = new THREE.Scene();
    this.envScene.add(new THREE.Mesh(new THREE.SphereGeometry(50, 48, 24), this.mat));
    const gnd = new THREE.Mesh(new THREE.CircleGeometry(48, 48).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: C(o.groundEnv || o.bottom) }));
    gnd.position.y = -2; this.envScene.add(gnd);
  }
  addPanel(w, h, pos, color) {   // "softbox" extra no mapa de reflexo (ex.: neon à noite, céu nublado)
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color, side: THREE.DoubleSide }));
    m.position.copy(pos); m.lookAt(0, pos.y * 0.4, 0); this.envScene.add(m); return m;
  }
  update(t, camPos) { this.uniforms.uTime.value = t; if (camPos) this.mesh.position.copy(camPos); }
}

/* =====================================================================
   SOL — luz direcional com sombras suaves (PCF soft) que acompanha o carro;
   a câmera de sombra é "presa" à grade de texels para não tremer.
   ===================================================================== */
class SunLight {
  constructor(scene, { dir, color, intensity, shadows, size = 2048, range = 70 }) {
    this.dir = dir.clone().normalize(); this.range = range; this.size = size;
    const L = (this.light = new THREE.DirectionalLight(color, intensity));
    L.castShadow = !!shadows;
    if (shadows) {
      const s = L.shadow, c = s.camera; s.mapSize.set(size, size);
      c.left = -range; c.right = range; c.top = range; c.bottom = -range; c.near = 5; c.far = 900;
      s.bias = -0.00025; s.normalBias = 0.035; s.radius = 3; s.blurSamples = 12;
    }
    scene.add(L, L.target);
    // base ortonormal do espaço da luz (para o encaixe na grade de texels)
    this.ax = new THREE.Vector3().crossVectors(this.dir, new THREE.Vector3(0, 1, 0)).normalize();
    if (this.ax.lengthSq() < 1e-6) this.ax.set(1, 0, 0);
    this.ay = new THREE.Vector3().crossVectors(this.ax, this.dir).normalize();
    this.tmp = new THREE.Vector3();
  }
  follow(p) {
    const texel = (2 * this.range) / this.size, a = p.dot(this.ax), b = p.dot(this.ay), c = p.dot(this.dir);
    const t = this.tmp.copy(this.ax).multiplyScalar(Math.round(a / texel) * texel).addScaledVector(this.ay, Math.round(b / texel) * texel).addScaledVector(this.dir, c);
    this.light.target.position.copy(t); this.light.position.copy(t).addScaledVector(this.dir, 420);
    this.light.target.updateMatrixWorld();
  }
}

/* =====================================================================
   MODEL LOADER — GLTFLoader + DRACOLoader (decodificador por CDN) com
   espelhos alternativos, tempo-limite e cache. Falha → fallback procedural.
   ===================================================================== */
const DRACO_PATHS = ['https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/libs/draco/gltf/', 'https://www.gstatic.com/draco/versioned/decoders/1.5.6/'];
// Brilhos especulares extremos (verniz/vidro sob o sol) podem passar do limite do buffer half-float (Inf → NaN no
// tonemapping = pixels pretos). Limita a radiância de saída de todos os materiais antes do pós-processamento.
THREE.ShaderChunk.opaque_fragment = THREE.ShaderChunk.opaque_fragment.replace('vec4( outgoingLight,', 'vec4( min( outgoingLight, vec3( 3e4 ) ),');
class ModelLoader {
  constructor() {
    this.cache = new Map(); this.pending = new Map(); this.failed = new Map(); this.progress = new Map(); this.dracoIdx = 0;
    this.gltf = new GLTFLoader(); this.draco = new DRACOLoader(); this.draco.setDecoderPath(DRACO_PATHS[0]); this.gltf.setDRACOLoader(this.draco);
  }
  status(key) { return this.cache.has(key) ? 'ok' : this.pending.has(key) ? 'loading' : this.failed.has(key) ? 'failed' : 'idle'; }
  withTimeout(p, ms) { let t; return Promise.race([p, new Promise((_, rej) => { t = setTimeout(() => rej(new Error('tempo esgotado (' + ms + ' ms)')), ms); })]).finally(() => clearTimeout(t)); }
  // tenta cada URL em ordem; resolve com o gltf ou rejeita com o último erro
  load(key, urls, ms = 15000, onProgress = null) {
    if (this.cache.has(key)) return Promise.resolve(this.cache.get(key));
    if (this.pending.has(key)) return this.pending.get(key);
    const run = (async () => {
      let last = null;
      for (const url of urls) {
        for (let d = 0; d < DRACO_PATHS.length; d++) {
          try {
            const prog = (e) => { if (e && e.total) { this.progress.set(key, e.loaded / e.total); if (onProgress) onProgress(e.loaded / e.total); } };
            const g = await this.withTimeout(this.gltf.loadAsync(url, prog), ms);
            this.cache.set(key, g); this.failed.delete(key); this.progress.set(key, 1); g.url = url; return g;
          }
          catch (e) {
            last = e;
            if (!/draco|decoder|wasm/i.test(String(e && e.message))) break;   // só troca o decodificador se o erro for dele
            this.dracoIdx = (this.dracoIdx + 1) % DRACO_PATHS.length; this.draco.dispose(); this.draco = new DRACOLoader(); this.draco.setDecoderPath(DRACO_PATHS[this.dracoIdx]); this.gltf.setDRACOLoader(this.draco);
          }
        }
      }
      this.failed.set(key, String((last && last.message) || last)); throw last || new Error('falha ao carregar ' + key);
    })();
    this.pending.set(key, run); run.catch(() => { }).finally(() => this.pending.delete(key));
    return run;
  }
}

/* =====================================================================
   ENGINE — renderer WebGL, pós-processamento (bloom com limite), PMREM,
   sol com sombras suaves, céu/ambiente e carregamento de modelos 3D.
   ===================================================================== */
class Engine {
  constructor(canvas, qName) {
    this.qName = QUALITY[qName] ? qName : 'high'; this.q = QUALITY[this.qName]; this.dynScale = 1;
    const r = (this.renderer = new THREE.WebGLRenderer({ canvas, antialias: true, powerPreference: 'high-performance', stencil: false }));
    r.setSize(innerWidth, innerHeight);
    r.toneMapping = THREE.ACESFilmicToneMapping; r.toneMappingExposure = 1;
    r.shadowMap.enabled = true; r.shadowMap.type = THREE.PCFSoftShadowMap;
    r.info.autoReset = false;
    TextureLab.aniso = Math.min(16, r.capabilities.getMaxAnisotropy());
    this.pmrem = new THREE.PMREMGenerator(r);
    this.models = new ModelLoader();
    this.setupComposer(); this.applyPixelRatio();
  }
  setupComposer() {
    const w = innerWidth, h = innerHeight;
    const rt = new THREE.WebGLRenderTarget(w, h, { type: THREE.HalfFloatType, samples: 4 });
    this.composer = new EffectComposer(this.renderer, rt);
    this.renderPass = new RenderPass(new THREE.Scene(), new THREE.PerspectiveCamera());
    this.bloom = new UnrealBloomPass(new THREE.Vector2(w, h), 0.32, 0.45, 1.0);
    // limita a entrada do bloom: reflexos especulares minúsculos (ou Inf em half-float) não viram "quadrados" nem NaN
    const hp = this.bloom.materialHighPassFilter;
    hp.fragmentShader = hp.fragmentShader.replace('vec4 texel = texture2D( tDiffuse, vUv );', 'vec4 texel = min( texture2D( tDiffuse, vUv ), vec4( 10.0 ) );');
    hp.needsUpdate = true;
    this.composer.addPass(this.renderPass); this.composer.addPass(this.bloom); this.composer.addPass(new OutputPass());
  }
  applyPixelRatio() {
    const pr = Math.min(devicePixelRatio || 1, this.q.pixelRatio) * this.dynScale;
    this.renderer.setPixelRatio(pr); this.composer.setPixelRatio(pr);
    this.renderer.setSize(innerWidth, innerHeight); this.composer.setSize(innerWidth, innerHeight);
  }
  setQuality(name) { this.qName = name; this.q = QUALITY[name]; this.dynScale = 1; this.applyPixelRatio(); }
  render(scene, camera) {
    if (this.q.bloom) { this.renderPass.scene = scene; this.renderPass.camera = camera; this.composer.render(); }
    else this.renderer.render(scene, camera);
  }
  envFrom(skyDome) { const rt = this.pmrem.fromScene(skyDome.envScene, 0.02); return rt; }
}

/* =====================================================================
   PARTÍCULAS — THREE.Points com shader (escala animada + fade out)
   ===================================================================== */
class ParticleSystem {
  constructor(max, additive = true) {
    this.max = max; this.i = 0; this.additive = additive;
    this.pos = new Float32Array(max * 3); this.vel = new Float32Array(max * 3);
    this.life = new Float32Array(max); this.maxLife = new Float32Array(max).fill(1);
    this.s0 = new Float32Array(max); this.s1 = new Float32Array(max); this.a0 = new Float32Array(max);
    this.c0 = new Float32Array(max * 3); this.c1 = new Float32Array(max * 3);
    this.aSize = new Float32Array(max); this.aAlpha = new Float32Array(max); this.aColor = new Float32Array(max * 3);
    this.drag = new Float32Array(max); this.rise = new Float32Array(max);
    const g = new THREE.BufferGeometry();
    const dyn = (arr, n) => new THREE.BufferAttribute(arr, n).setUsage(THREE.DynamicDrawUsage);
    g.setAttribute('position', dyn(this.pos, 3)); g.setAttribute('aSize', dyn(this.aSize, 1));
    g.setAttribute('aAlpha', dyn(this.aAlpha, 1)); g.setAttribute('aColor', dyn(this.aColor, 3));
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({
      uniforms: { uScale: { value: 500 } },
      vertexShader: `attribute float aSize; attribute float aAlpha; attribute vec3 aColor; uniform float uScale;
        varying float vA; varying vec3 vC;
        void main(){ vA=aAlpha; vC=aColor; vec4 mv=modelViewMatrix*vec4(position,1.0);
          gl_PointSize = clamp(aSize*uScale/max(0.2,-mv.z), 0.0, 400.0); gl_Position=projectionMatrix*mv; }`,
      fragmentShader: `varying float vA; varying vec3 vC;
        void main(){ vec2 c=gl_PointCoord-0.5; float d=length(c)*2.0; if(d>1.0||vA<0.003) discard;
          float a=pow(1.0-d, ${additive ? '1.8' : '1.2'})*vA; gl_FragColor=vec4(vC, a);
          #include <tonemapping_fragment>
          #include <colorspace_fragment>
        }`,
      transparent: true, depthWrite: false, blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    });
    this.points = new THREE.Points(g, this.mat); this.points.frustumCulled = false; this.points.renderOrder = 5;
    this.alive = 0;
  }
  emit(x, y, z, vx, vy, vz, life, s0, s1, c0, c1, a0 = 1, drag = 1.5, rise = 0) {
    const i = this.i; this.i = (i + 1) % this.max; const j = i * 3;
    this.pos[j] = x; this.pos[j + 1] = y; this.pos[j + 2] = z;
    this.vel[j] = vx; this.vel[j + 1] = vy; this.vel[j + 2] = vz;
    this.life[i] = life; this.maxLife[i] = life; this.s0[i] = s0; this.s1[i] = s1; this.a0[i] = a0;
    this.c0[j] = c0[0]; this.c0[j + 1] = c0[1]; this.c0[j + 2] = c0[2];
    this.c1[j] = c1[0]; this.c1[j + 1] = c1[1]; this.c1[j + 2] = c1[2];
    this.drag[i] = drag; this.rise[i] = rise;
  }
  update(dt) {
    let alive = 0;
    for (let i = 0; i < this.max; i++) {
      if (this.life[i] <= 0) { this.aAlpha[i] = 0; continue; }
      this.life[i] -= dt; alive++;
      const j = i * 3, t = 1 - Math.max(0, this.life[i]) / this.maxLife[i], dk = Math.exp(-this.drag[i] * dt);
      this.vel[j] *= dk; this.vel[j + 1] = this.vel[j + 1] * dk + this.rise[i] * dt; this.vel[j + 2] *= dk;
      this.pos[j] += this.vel[j] * dt; this.pos[j + 1] += this.vel[j + 1] * dt; this.pos[j + 2] += this.vel[j + 2] * dt;
      this.aSize[i] = lerp(this.s0[i], this.s1[i], Math.sqrt(t));
      this.aAlpha[i] = this.a0[i] * Math.pow(1 - t, 1.3);
      this.aColor[j] = lerp(this.c0[j], this.c1[j], t); this.aColor[j + 1] = lerp(this.c0[j + 1], this.c1[j + 1], t); this.aColor[j + 2] = lerp(this.c0[j + 2], this.c1[j + 2], t);
    }
    this.alive = alive;
    const a = this.geo.attributes; a.position.needsUpdate = a.aSize.needsUpdate = a.aAlpha.needsUpdate = a.aColor.needsUpdate = true;
  }
  dispose() { this.geo.dispose(); this.mat.dispose(); }
}

class AudioManager {
  constructor() { this.ctx = null; this.volume = 0.8; this.muted = false; this.race = null; }
  init() {
    try {
      if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      this.ctx = new AC();
      this.master = this.ctx.createGain(); this.master.gain.value = this.muted ? 0 : this.volume;
      this.comp = this.ctx.createDynamicsCompressor(); this.comp.threshold.value = -12; this.comp.ratio.value = 5; this.comp.attack.value = 0.005;
      this.master.connect(this.comp); this.comp.connect(this.ctx.destination);
      this.sfx = this.ctx.createGain(); this.sfx.gain.value = 0.9; this.sfx.connect(this.master);
      this.white = this.makeNoise('white'); this.brown = this.makeNoise('brown'); this.pink = this.makeNoise('pink');
      if (this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { console.warn('Áudio indisponível', e); this.ctx = null; }
  }
  get ok() { return !!this.ctx; }
  makeNoise(type) {
    const len = this.ctx.sampleRate * 2, b = this.ctx.createBuffer(1, len, this.ctx.sampleRate), d = b.getChannelData(0);
    if (type === 'white') { for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1; }
    else if (type === 'brown') { let l = 0; for (let i = 0; i < len; i++) { const w = Math.random() * 2 - 1; l = (l + 0.02 * w) / 1.02; d[i] = l * 3.5; } }
    else {
      let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
      for (let i = 0; i < len; i++) {
        const w = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + w * 0.0555179; b1 = 0.99332 * b1 + w * 0.0750759; b2 = 0.969 * b2 + w * 0.153852;
        b3 = 0.8665 * b3 + w * 0.3104856; b4 = 0.55 * b4 + w * 0.5329522; b5 = -0.7616 * b5 - w * 0.016898;
        d[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * 0.5362) * 0.11; b6 = w * 0.115926;
      }
    }
    return b;
  }
  loopNoise(buf) { const s = this.ctx.createBufferSource(); s.buffer = buf; s.loop = true; s.loopStart = Math.random(); s.start(0, Math.random() * 1.5); return s; }
  setVolume(v) { this.volume = v; if (this.master) this.master.gain.setTargetAtTime(this.muted ? 0 : v, this.ctx.currentTime, 0.05); }
  toggleMute() { this.muted = !this.muted; this.setVolume(this.volume); return this.muted; }
  suspend(on) { if (!this.ctx) return; if (on) this.ctx.suspend(); else this.ctx.resume(); }

  // ---------- efeitos curtos ----------
  tone(freq, dur, type = 'sine', vol = 0.3, when = 0, slideTo = null, dest = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime + when;
    const o = this.ctx.createOscillator(), g = this.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (slideTo) o.frequency.exponentialRampToValueAtTime(slideTo, t + dur);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(vol, t + 0.006); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g); g.connect(dest || this.sfx); o.start(t); o.stop(t + dur + 0.05);
  }
  noiseBurst(dur, vol, type = 'lowpass', f0 = 1000, f1 = null, q = 1, buf = null) {
    if (!this.ctx) return;
    const t = this.ctx.currentTime;
    const s = this.ctx.createBufferSource(); s.buffer = buf || this.white;
    const f = this.ctx.createBiquadFilter(); f.type = type; f.frequency.setValueAtTime(f0, t); f.Q.value = q;
    if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + dur);
    const g = this.ctx.createGain(); g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f); f.connect(g); g.connect(this.sfx); s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }
  coin() { [1318.5, 1760, 2093, 2637].forEach((f, i) => { this.tone(f, 0.17, 'sine', 0.2, i * 0.045); this.tone(f * 2, 0.08, 'triangle', 0.04, i * 0.045); }); }
  crash(intensity) {
    const v = clamp(intensity, 0.05, 1);
    this.noiseBurst(0.35 + v * 0.3, 0.9 * v, 'lowpass', 1400, 200, 0.8);
    this.tone(85, 0.35, 'sine', 0.7 * v, 0, 38);
    if (v > 0.4) this.noiseBurst(0.18, 0.35 * v, 'bandpass', 3500, 1800, 3);
  }
  scrape() { this.noiseBurst(0.12, 0.12, 'bandpass', 2600, 1600, 4); }
  land(v) { this.tone(70, 0.25, 'sine', clamp(v, 0.1, 0.8), 0, 35); this.noiseBurst(0.2, 0.25 * v, 'lowpass', 600, 120); }
  beep(go) { if (go) { this.tone(1046.5, 0.7, 'square', 0.14); this.tone(523.25, 0.7, 'square', 0.1); } else this.tone(523.25, 0.28, 'square', 0.14); }
  click() { this.tone(820, 0.07, 'sine', 0.12, 0, 1300); }
  hover() { this.tone(1400, 0.035, 'sine', 0.035); }
  purchase() { [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.28, 'triangle', 0.17, i * 0.06)); this.noiseBurst(0.3, 0.06, 'highpass', 6000); }
  error() { this.tone(170, 0.22, 'sawtooth', 0.12, 0, 110); }
  overtake() { this.tone(880, 0.12, 'triangle', 0.12); this.tone(1318.5, 0.2, 'triangle', 0.12, 0.08); }
  driftBank() { [659.25, 987.77, 1318.5].forEach((f, i) => this.tone(f, 0.16, 'square', 0.06, i * 0.05)); }
  lap() { [783.99, 1046.5].forEach((f, i) => this.tone(f, 0.3, 'triangle', 0.16, i * 0.12)); }
  record() { [659.25, 830.61, 987.77, 1318.5, 1661.2].forEach((f, i) => this.tone(f, 0.32, 'triangle', 0.15, i * 0.08)); }
  levelUp() { [523.25, 659.25, 783.99, 1046.5, 1318.5, 1567.98].forEach((f, i) => { this.tone(f, 0.4, 'triangle', 0.16, i * 0.09); this.tone(f * 1.5, 0.3, 'sine', 0.05, i * 0.09); }); }
  finish() { [523.25, 659.25, 783.99, 1046.5, 783.99, 1046.5, 1318.5].forEach((f, i) => this.tone(f, 0.35, 'triangle', 0.16, i * 0.11)); }
  shift() { if (this.race) { const g = this.race.player.out.gain, t = this.ctx.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(0.05, t, 0.01); } }

  // ---------- sons contínuos da corrida ----------
  startRace(playerKey, playerSnd, aiKeys) {
    if (!this.ctx) return;
    this.stopRace();
    const ctx = this.ctx, bus = ctx.createGain(); bus.gain.value = 0; bus.connect(this.master);
    bus.gain.setTargetAtTime(1, ctx.currentTime, 0.3);
    const R = { bus, prevThr: 0, bovT: 0, popT: 0 };
    R.player = new EngineVoice(this, playerKey, bus, false, playerSnd);
    R.ai = {};                                   // uma voz posicional por arquitetura de motor presente no grid
    for (const k of aiKeys) if (!R.ai[k]) R.ai[k] = new EngineVoice(this, k, bus, true);
    R.skidSrc = this.loopNoise(this.white);        // derrapagem: ruído branco → passa-banda dinâmico
    R.skidBP = ctx.createBiquadFilter(); R.skidBP.type = 'bandpass'; R.skidBP.frequency.value = 1100; R.skidBP.Q.value = 1.4;
    R.skidBP2 = ctx.createBiquadFilter(); R.skidBP2.type = 'bandpass'; R.skidBP2.frequency.value = 2300; R.skidBP2.Q.value = 9;
    R.skidGain = ctx.createGain(); R.skidGain.gain.value = 0;
    R.skidSrc.connect(R.skidBP); R.skidSrc.connect(R.skidBP2); R.skidBP.connect(R.skidGain); R.skidBP2.connect(R.skidGain); R.skidGain.connect(bus);
    R.nitroSrc = this.loopNoise(this.brown);       // nitro: ruído marrom → filtro dinâmico
    R.nitroF = ctx.createBiquadFilter(); R.nitroF.type = 'lowpass'; R.nitroF.frequency.value = 300; R.nitroF.Q.value = 5;
    R.nitroGain = ctx.createGain(); R.nitroGain.gain.value = 0;
    R.nitroSrc.connect(R.nitroF); R.nitroF.connect(R.nitroGain); R.nitroGain.connect(bus);
    R.windSrc = this.loopNoise(this.pink);         // vento: ruído rosa → passa-alta
    R.windF = ctx.createBiquadFilter(); R.windF.type = 'highpass'; R.windF.frequency.value = 500;
    R.windGain = ctx.createGain(); R.windGain.gain.value = 0;
    R.windSrc.connect(R.windF); R.windF.connect(R.windGain); R.windGain.connect(bus);
    this.race = R;
  }
  updateRace(d) {
    const R = this.race; if (!R) return;
    const t = this.ctx.currentTime, p = R.player.p;
    R.player.update(d.rpm, d.speedN, d.throttle, 1);
    // blow-off (turbo) ao tirar o pé em alta e estalos no escape
    if (p.bov && R.prevThr > 0.75 && d.throttle < 0.2 && d.rpm > p.red * 0.5 && t - R.bovT > 0.6) { R.bovT = t; this.noiseBurst(0.3, 0.12 * p.bov, 'bandpass', 3400, 1100, 1.6); }
    if (p.pops && d.throttle < 0.08 && d.rpm > p.red * 0.42 && t - R.popT > 0.07 && Math.random() < 0.18 * p.pops) {
      R.popT = t; this.noiseBurst(0.06, 0.26, 'lowpass', 1100, 300, 1.2); this.tone(55 + Math.random() * 30, 0.06, 'square', 0.07);
    }
    R.prevThr = d.throttle;
    const skid = clamp(d.skid, 0, 1);
    R.skidGain.gain.setTargetAtTime(skid * 0.32, t, 0.05);
    R.skidBP.frequency.setTargetAtTime(800 + skid * 900 + Math.random() * 120, t, 0.03);
    R.skidBP2.frequency.setTargetAtTime(1900 + skid * 700 + Math.random() * 200, t, 0.03);
    R.nitroGain.gain.setTargetAtTime(d.nitro ? 0.55 : 0, t, d.nitro ? 0.06 : 0.2);
    R.nitroF.frequency.setTargetAtTime(d.nitro ? 1600 + Math.random() * 900 : 300, t, 0.08);
    R.windGain.gain.setTargetAtTime(clamp(d.speedN * d.speedN * 0.22, 0, 0.25), t, 0.1);
    R.windF.frequency.setTargetAtTime(400 + d.speedN * 1400, t, 0.1);
    for (const k of Object.keys(R.ai)) {                      // IA posicional: o carro mais próximo de cada tipo de motor
      const a = d.ai[k], v = R.ai[k];
      if (!a) { v.out.gain.setTargetAtTime(0, t, 0.1); continue; }
      v.update(a.rpm, a.speedN, a.throttle, 0.85); v.setPosition(a.x, a.y, a.z);
    }
    const L = this.ctx.listener, c = d.cam, f = d.camFwd;
    if (L.positionX) {
      L.positionX.setTargetAtTime(c.x, t, 0.02); L.positionY.setTargetAtTime(c.y, t, 0.02); L.positionZ.setTargetAtTime(c.z, t, 0.02);
      L.forwardX.setTargetAtTime(f.x, t, 0.02); L.forwardY.setTargetAtTime(f.y, t, 0.02); L.forwardZ.setTargetAtTime(f.z, t, 0.02);
      L.upX.value = 0; L.upY.value = 1; L.upZ.value = 0;
    } else { L.setPosition(c.x, c.y, c.z); L.setOrientation(f.x, f.y, f.z, 0, 1, 0); }
  }
  duckRace(on) { if (this.race) this.race.bus.gain.setTargetAtTime(on ? 0.25 : 1, this.ctx.currentTime, 0.3); }
  stopRace() {
    const R = this.race; if (!R) return; this.race = null;
    const t = this.ctx.currentTime;
    R.bus.gain.cancelScheduledValues(t); R.bus.gain.setTargetAtTime(0, t, 0.08);
    R.player.stop(); Object.values(R.ai).forEach((v) => v.stop());
    setTimeout(() => { try { R.skidSrc.stop(); R.nitroSrc.stop(); R.windSrc.stop(); R.bus.disconnect(); } catch (e) { } }, 500);
  }
}
