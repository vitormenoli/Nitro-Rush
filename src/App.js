/* =====================================================================
   NITRO RUSH 3D — App.js
   Regras, economia/LocalStorage, corrida, interface e laço principal.
   Script clássico (carregado em ordem pelo index.html depois do Three.js):
   as classes/constantes de nível superior ficam no escopo global compartilhado.
   ===================================================================== */
'use strict';

const DIFFICULTY = {
  easy:   { id: 'easy', name: 'Fácil', speed: 0.83, corner: 0.82, accel: 0.8, wobble: 1.3, nitro: 0.0, ahead: 0.9, behind: 1.02, reward: 1.0, xp: 1.0, react: 1.6 },
  medium: { id: 'medium', name: 'Médio', speed: 0.92, corner: 0.91, accel: 0.92, wobble: 0.55, nitro: 0.45, ahead: 0.95, behind: 1.05, reward: 1.5, xp: 1.3, react: 2.1 },
  hard:   { id: 'hard', name: 'Difícil', speed: 0.98, corner: 0.97, accel: 1.0, wobble: 0.15, nitro: 1.0, ahead: 0.98, behind: 1.08, reward: 2.2, xp: 1.6, react: 2.6 },
};
const POS_REWARD = [500, 320, 230, 170, 130, 100, 80, 65, 50, 40, 30];
const POS_POINTS = [5000, 3200, 2400, 1800, 1400, 1100, 900, 700, 500, 300, 150];
const XP_POS = [900, 700, 560, 460, 380, 320, 270, 230, 190, 160, 130];
const COIN_VALUE = 5;
const TOTAL_LAPS = 3;
const TRIAL_LAPS = 5;
const NUM_AI = 10;
const AI_NAMES = ['Raio', 'Viper', 'Nômade', 'Falcão', 'Tempestade', 'Sombra', 'Cometa', 'Titã', 'Fênix', 'Blitz', 'Trovão', 'Ícaro'];

// Curva de níveis exponencial: Nível 2 = 1.000 XP, Nível 3 = 2.500 XP, depois +13% por nível
const LEVELS = {
  max: 60,
  xpFor(L) { if (L <= 1) return 0; if (L === 2) return 1000; let total = 2500, inc = 1500; for (let l = 4; l <= L; l++) { inc = Math.round(inc * 1.13); total += inc; } return total; },
  levelFor(xp) { let L = 1; while (L < this.max && xp >= this.xpFor(L + 1)) L++; return L; },
};

/* =====================================================================
   ÍCONES SVG — toda a iconografia da interface (menus, HUD, mapa, moedas)
   é vetorial, desenhada aqui (24×24, traço currentColor) e injetada
   dinamicamente: qualquer elemento com data-icon="nome" ou .coin-ic vazio
   recebe o SVG (MutationObserver cobre o que é criado depois).
   ===================================================================== */
const UI_ICONS = (() => {
  const P = (d, f) => `<path d="${d}"${f ? ' fill="currentColor" stroke="none"' : ''}/>`;
  const C = (cx, cy, r, f) => `<circle cx="${cx}" cy="${cy}" r="${r}"${f ? ' fill="currentColor" stroke="none"' : ''}/>`;
  const poly = (pts) => pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(2) + ' ' + p[1].toFixed(2)).join('') + 'Z';
  const gear = () => {
    const n = 8, st = (Math.PI * 2) / n, pts = [];
    for (let k = 0; k < n; k++) for (const [r, o] of [[6.7, -0.3], [9.4, -0.17], [9.4, 0.17], [6.7, 0.3]]) pts.push([12 + Math.cos(k * st + o * st) * r, 12 + Math.sin(k * st + o * st) * r]);
    return P(poly(pts)) + C(12, 12, 2.9);
  };
  const star = (r1, r2) => { const pts = []; for (let k = 0; k < 10; k++) { const a = -Math.PI / 2 + (k * Math.PI) / 5, r = k % 2 ? r2 : r1; pts.push([12 + Math.cos(a) * r, 12.8 + Math.sin(a) * r]); } return poly(pts); };
  return {
    play: P('M8 5.2v13.6L19 12z', 1),
    garage: P('M14.8 3.6a4.6 4.6 0 0 0-4.9 6.3L3.6 16.2a1.9 1.9 0 0 0 2.7 2.7l6.3-6.3a4.6 4.6 0 0 0 6.3-4.9l-2.8 2.8-2.6-.5-.5-2.6z'),
    gamepad: P('M7.2 7.5h9.6a4.2 4.2 0 0 1 4.1 5l-.9 4.2a2.2 2.2 0 0 1-3.9.9l-1.8-2.4H9.7l-1.8 2.4a2.2 2.2 0 0 1-3.9-.9l-.9-4.2a4.2 4.2 0 0 1 4.1-5z') + P('M8.2 10.2v3.4M6.5 11.9h3.4') + C(15.6, 11, 1, 1) + C(17.6, 13, 1, 1),
    settings: gear(),
    back: P('M19 12H5.5M11 6l-6 6 6 6'),
    prev: P('M14.5 5.5 8 12l6.5 6.5'), next: P('M9.5 5.5 16 12l-6.5 6.5'),
    up: P('M12 19V5.5M6 11l6-6 6 6'), down: P('M12 5v13.5M6 13l6 6 6-6'), left: P('M19 12H5.5M11 6l-6 6 6 6'), right: P('M5 12h13.5M13 6l6 6-6 6'),
    sound: P('M4 9.3h3.4L12 5.4v13.2l-4.6-3.9H4z') + P('M15.6 9a4.2 4.2 0 0 1 0 6M18.2 6.4a7.8 7.8 0 0 1 0 11.2'),
    mute: P('M4 9.3h3.4L12 5.4v13.2l-4.6-3.9H4z') + P('M15.8 9.6l4.8 4.8M20.6 9.6l-4.8 4.8'),
    flag: P('M5 21V3.6') + P('M5 4.2h14v8.6H5') + P('M5 4.2h3.5v4.3H5zM12 4.2h3.5v4.3H12zM8.5 8.5H12v4.3H8.5zM15.5 8.5H19v4.3h-3.5z', 1),
    ghost: P('M6 20.2V10.4a6 6 0 0 1 12 0v9.8l-2-1.6-2 1.6-2-1.6-2 1.6-2-1.6z') + C(9.8, 10.8, 1.15, 1) + C(14.2, 10.8, 1.15, 1),
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/>' + P('M8 10.5V7.6a4 4 0 0 1 8 0v2.9M12 14.4v2.4'),
    unlock: '<rect x="5" y="10.5" width="14" height="10" rx="2"/>' + P('M8 10.5V7.6a4 4 0 0 1 7.7-1.5M12 14.4v2.4'),
    check: P('M4.5 12.6l4.8 4.8L19.5 7.2'),
    close: P('M6 6l12 12M18 6 6 18'),
    retry: P('M19.5 12a7.5 7.5 0 1 1-2.2-5.3M19.6 4.4v4.8h-4.8'),
    star: P(star(9, 3.9), 1),
    bolt: P('M13.4 2.6 5.6 13.4h5.6l-.9 8 7.9-10.9h-5.7z', 1),
    warning: P('M12 3.6 21.4 20H2.6z') + P('M12 9.8v4.6') + C(12, 17.2, 1.05, 1),
    info: C(12, 12, 9) + P('M12 11v5.6') + C(12, 7.8, 1.1, 1),
    bulb: P('M9.2 18h5.6M10.2 21h3.6M12 3a6 6 0 0 0-3.6 10.8c.7.5 1 1.3 1 2.2h5.2c0-.9.3-1.7 1-2.2A6 6 0 0 0 12 3z'),
    trophy: P('M8 3.8h8v5.4a4 4 0 0 1-8 0zM8 5.6H4.8a3.2 3.2 0 0 0 3.4 4M16 5.6h3.2a3.2 3.2 0 0 1-3.4 4M12 13.2v3.6M8.6 20.4h6.8M9.8 16.8h4.4v3.6H9.8z'),
    levelup: P('M6 12.5l6-6 6 6M6 18.5l6-6 6 6'),
    engine: P('M5 9.2h2.4V7.2H10V5.6h4.6v1.6h2.2l2.2 2.4v5.8h-2v2.4h-5l-2-2.4H7.4v-1.8H5z') + P('M2.6 10.2v4.6M2.6 12.5H5M19 12h2.4M21.4 10v4.4'),
    tire: C(12, 12, 8.6) + C(12, 12, 3.4) + P('M12 3.4v5.2M12 15.4v5.2M3.4 12h5.2M15.4 12h5.2'),
    turbo: C(12, 12, 8.6) + P('M12 12c0-3.2 2.2-5.4 5.4-5.4M12 12c2.8 1.6 3.6 4.6 2 7.4M12 12c-2.8 1.6-5.8.8-7.4-1.9') + C(12, 12, 1.4, 1),
    timer: C(12, 13.4, 7.6) + P('M12 13.4V9.4M9.4 2.8h5.2M18.4 6.6l1.6-1.6'),
    pin: P('M12 21.2s-6.6-6.3-6.6-11.1a6.6 6.6 0 0 1 13.2 0c0 4.8-6.6 11.1-6.6 11.1z') + C(12, 10.1, 2.4),
    globe: C(12, 12, 9) + P('M3 12h18M12 3c2.6 2.6 3.8 5.6 3.8 9s-1.2 6.4-3.8 9M12 3C9.4 5.6 8.2 8.6 8.2 12s1.2 6.4 3.8 9'),
    cube: P('M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9zM3.5 7.5 12 12.2l8.5-4.7M12 12.2v9'),
    pause: P('M8.5 5.5v13M15.5 5.5v13'),
    route: C(6, 18, 2.2) + C(18, 6, 2.2) + P('M8 17.2c6-1 2-7.8 8-10.4'),
    speed: P('M4.2 16.8a8.6 8.6 0 1 1 15.6 0') + P('M12 13.2l4.2-4.4') + C(12, 13.6, 1.5, 1),
    credits: P('M6 3.5h9l3 3v14H6z') + P('M14.5 3.5v3.5H18M8.8 11h6.4M8.8 14h6.4M8.8 17h4'),
    medal: C(12, 15, 5.6) + P('M8.6 10.5 5.5 3.5h4l2.5 5 2.5-5h4l-3.1 7'),
    mountain: P('M2.5 19.5 9 8.5l4 6.5 2.6-3.8 5.9 8.3z'),
    turns: P('M4 19c0-5 5-5 5-9s-3-5-3-5M20 5c0 5-5 5-5 9s3 5 3 5'),
    ruler: P('M3.5 15.5 15.5 3.5l5 5-12 12zM7 12l2 2M10 9l2 2M13 6l2 2'),
    laps: P('M12 4.5a7.5 7.5 0 1 1-6.8 4.3') + P('M3.6 4.8 5.2 9l4.2-1.4'),
    brake: C(12, 12, 8.4) + C(12, 12, 4.2) + P('M3.6 6.5A10 10 0 0 0 3.6 17.5M20.4 6.5a10 10 0 0 1 0 11'),
    pedal: '<rect x="7" y="3" width="10" height="15" rx="2.4"/>' + P('M9.5 7h5M9.5 10h5M9.5 13h5M12 18v3'),
  };
})();
function setIcon(el, name) { if (el) { el.dataset.icon = name; IconInjector.apply(el); } }
function svgIcon(name, cls = '') { const g = UI_ICONS[name]; return g ? `<svg class="ico${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${g}</svg>` : ''; }
// moeda da UI: disco dourado com gradiente (definido uma vez em <defs> global) e "N" gravado
const COIN_SVG = '<svg class="coin-svg" viewBox="0 0 24 24" aria-hidden="true" focusable="false"><circle cx="12" cy="12" r="10.6" fill="url(#nr-coin-g)"/><circle cx="12" cy="12" r="10.6" fill="none" stroke="#7a4f00" stroke-opacity=".6" stroke-width=".9"/><circle cx="12" cy="12" r="7.3" fill="none" stroke="#8a5a00" stroke-opacity=".5" stroke-width="1.1"/><path d="M9.3 15.5V8.5l5.4 7V8.5" fill="none" stroke="#6b4400" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const IconInjector = {
  sel: '[data-icon], .coin-ic',
  apply(el) {
    if (el.classList.contains('coin-ic')) { if (!el.firstElementChild) el.innerHTML = COIN_SVG; return; }
    const n = el.dataset.icon; if (el.dataset.iconDone === n) return;
    el.dataset.iconDone = n; el.innerHTML = svgIcon(n);
  },
  fill(root) {
    if (root.nodeType !== 1) return;
    if (root.matches(this.sel)) this.apply(root);
    root.querySelectorAll(this.sel).forEach((el) => this.apply(el));
  },
  start() {
    const defs = document.createElement('div');
    defs.innerHTML = '<svg width="0" height="0" style="position:absolute;left:-9px" aria-hidden="true"><defs><radialGradient id="nr-coin-g" cx="36%" cy="30%" r="78%"><stop offset="0" stop-color="#fff6c8"/><stop offset=".42" stop-color="#ffcf4a"/><stop offset="1" stop-color="#b27400"/></radialGradient></defs></svg>';
    document.body.appendChild(defs.firstChild);
    this.fill(document.body);
    new MutationObserver((ms) => { for (const m of ms) for (const n of m.addedNodes) this.fill(n); }).observe(document.body, { childList: true, subtree: true });
  },
};

/* =====================================================================
   HUD SVG — velocímetro vetorial (arco de velocidade + arco de giro,
   ponteiro, marcha), barra de nitro segmentada e minimapa com marcadores.
   Atualização por atributo (sem redesenhar), só quando o valor muda.
   ===================================================================== */
const HudSVG = {
  arc(cx, cy, r, a0, a1) {
    const p = (a) => [cx + Math.cos((a * Math.PI) / 180) * r, cy + Math.sin((a * Math.PI) / 180) * r], [x0, y0] = p(a0), [x1, y1] = p(a1);
    return `M${x0.toFixed(2)} ${y0.toFixed(2)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`;
  },
  speedo(el, max = 440) {
    const A0 = 135, SW = 270, c = 120, ang = (v) => A0 + (v / max) * SW;
    let ticks = '', labels = '';
    for (let v = 0; v <= max; v += 20) {
      const a = (ang(v) * Math.PI) / 180, major = v % 40 === 0, r1 = 91, r2 = major ? 80 : 85;
      ticks += `<line x1="${(c + Math.cos(a) * r1).toFixed(1)}" y1="${(c + Math.sin(a) * r1).toFixed(1)}" x2="${(c + Math.cos(a) * r2).toFixed(1)}" y2="${(c + Math.sin(a) * r2).toFixed(1)}" class="${major ? 'mj' : 'mn'}"/>`;
      if (v % 80 === 0) labels += `<text x="${(c + Math.cos(a) * 67).toFixed(1)}" y="${(c + Math.sin(a) * 67 + 4).toFixed(1)}">${v}</text>`;
    }
    el.innerHTML = `<svg viewBox="0 0 240 240" class="speedo-svg" aria-hidden="true">
      <defs><linearGradient id="sp-grad" x1="0" y1="1" x2="1" y2="0"><stop offset="0" stop-color="#58c8ff"/><stop offset=".62" stop-color="#eef7ff"/><stop offset="1" stop-color="#ff3d4d"/></linearGradient></defs>
      <circle cx="120" cy="120" r="116" class="sp-bg"/>
      <path d="${this.arc(c, c, 100, A0, A0 + SW)}" class="sp-track"/>
      <path d="${this.arc(c, c, 100, ang(360), A0 + SW)}" class="sp-red"/>
      <path d="${this.arc(c, c, 100, A0, A0 + SW)}" class="sp-fill" id="sp-fill" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000"/>
      <path d="${this.arc(c, c, 109, A0, A0 + SW)}" class="sp-rpm-track"/>
      <path d="${this.arc(c, c, 109, A0, A0 + SW)}" class="sp-rpm" id="sp-rpm" pathLength="1000" stroke-dasharray="1000" stroke-dashoffset="1000"/>
      <g class="sp-ticks">${ticks}</g><g class="sp-lbl">${labels}</g>
      <g id="sp-needle" transform="rotate(${A0} 120 120)"><path d="M136 118.4L204 120 136 121.6z" class="sp-needle"/></g>
      <circle cx="120" cy="120" r="6.5" class="sp-hub"/>
      <text x="120" y="152" class="sp-kmh" id="sp-kmh">0</text><text x="120" y="168" class="sp-unit">KM/H</text>
      <rect x="103" y="178" width="34" height="28" rx="4" class="sp-gbox"/><text x="120" y="199" class="sp-gear" id="sp-gear">N</text>
    </svg>`;
    return { A0, SW, max, fill: el.querySelector('#sp-fill'), rpm: el.querySelector('#sp-rpm'), needle: el.querySelector('#sp-needle'), kmh: el.querySelector('#sp-kmh'), gear: el.querySelector('#sp-gear'), root: el.firstElementChild, last: {} };
  },
  nitro(el, n = 24) {
    let s = ''; const w = 230 / n;
    for (let i = 0; i < n; i++) s += `<rect x="${(i * w + 0.8).toFixed(2)}" y="0" width="${(w - 1.6).toFixed(2)}" height="12" rx="1.2"/>`;
    el.innerHTML = `<svg viewBox="0 0 230 12" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
    return { segs: [...el.querySelectorAll('rect')], on: -1 };
  },
  minimap(el, T) {
    const b = T.bounds, w = b.x1 - b.x0, h = b.z1 - b.z0, m = Math.max(w, h), pad = m * 0.08, k = m / 100;
    let d = '';
    for (let i = 0; i <= T.N; i += 3) { const j = i % T.N; d += (i ? 'L' : 'M') + T.px[j].toFixed(1) + ' ' + T.pz[j].toFixed(1); }
    d += 'Z';
    const tx = T.tx ? T.tx[0] : 0, tz = T.tz ? T.tz[0] : 1, sx = T.px[0], sz = T.pz[0], L = 4.2 * k;
    el.innerHTML = `<svg viewBox="${(b.x0 - pad).toFixed(1)} ${(b.z0 - pad).toFixed(1)} ${(w + 2 * pad).toFixed(1)} ${(h + 2 * pad).toFixed(1)}" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
      <path d="${d}" class="mm-road" style="stroke-width:${(3.4 * k).toFixed(2)}"/><path d="${d}" class="mm-line" style="stroke-width:${(1.1 * k).toFixed(2)}"/>
      <line x1="${(sx - tz * L).toFixed(1)}" y1="${(sz + tx * L).toFixed(1)}" x2="${(sx + tz * L).toFixed(1)}" y2="${(sz - tx * L).toFixed(1)}" class="mm-start" style="stroke-width:${(1.4 * k).toFixed(2)}"/>
      <g id="mm-cars"></g><circle id="mm-ghost" r="${(2.2 * k).toFixed(2)}" class="mm-ghost" cx="-99999" cy="0"/>
      <g id="mm-player"><path d="M0 -4.4L3.4 3.8 0 2 -3.4 3.8Z" class="mm-me" transform="scale(${(k * 0.95).toFixed(3)})"/></g>
    </svg>`;
    return { k, cars: el.querySelector('#mm-cars'), ghost: el.querySelector('#mm-ghost'), player: el.querySelector('#mm-player'), dots: [] };
  },
  // contorno de pista (painel da campanha): path normalizado numa caixa
  outline(points, W = 300, H = 170, pad = 14) {
    let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
    for (const p of points) { x0 = Math.min(x0, p.x); x1 = Math.max(x1, p.x); z0 = Math.min(z0, p.z); z1 = Math.max(z1, p.z); }
    const s = Math.min((W - 2 * pad) / (x1 - x0), (H - 2 * pad) / (z1 - z0)), ox = (W - (x1 - x0) * s) / 2, oz = (H - (z1 - z0) * s) / 2;
    const P = points.map((p) => [ox + (p.x - x0) * s, oz + (p.z - z0) * s]);
    return { d: P.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join('') + 'Z', start: P[0], next: P[Math.min(P.length - 1, 4)] };
  },
};

/* =====================================================================
   MAPA DA CAMPANHA — mapa-múndi escuro em matriz de pontos (Natural Earth),
   lente de aumento sobre a Europa, circuitos reais como nós ligados por uma
   rota neon. Um nó acende só com Nível da conta ≥ requisito E vitória
   (1º lugar) no circuito anterior da rota.
   ===================================================================== */
const WORLD_DOTS = {"world":{"lon0":-180,"lon1":180,"lat0":-58,"lat1":80,"step":1.8,"rows":["15,2,5,4,1,5,4,r,h,6,15,5,16","x,2,g,5,6,r,j,2,1b,2,15","z,6,3,2,1,8,c,m,17,3,f,d,d,5,j","v,5,8,2,1,3,5,1,d,k,15,2,d,i,1,1,3,1,9,1,l","u,3,1,8,2,2,4,9,a,i,16,2,7,2,1,u,7,5,h","a,9,g,9,1,4,3,a,8,i,n,6,k,3,1,1c,b","0,1,6,u,3,2,3,1,1,4,1,3,4,4,8,d,p,d,2,1,4,1,1,1x","0,5,3,1,1,18,5,7,4,b,q,c,1,3,2,23","3,1,4,2,1,14,1,2,2,7,8,6,a,5,e,6,2,5,1,28","8,15,5,1,6,3,8,4,s,6,2,2g","8,14,9,4,c,3,r,7,2,23,2,1,1,5,4","a,4,9,o,a,4,2,2,12,7,3,1y,1,2,3,2,9","c,1,1,1,b,n,8,9,v,2,8,2,3,1u,9,4,9","a,2,f,p,5,9,v,2,7,2,4,1s,a,4,a","q,1,1,q,2,c,r,2,1,2,5,1z,1,1,9,2,b","t,q,1,d,q,1,1,4,1,24,1,1,7,1,c","t,12,1,1,w,25,1,1,k","w,w,3,4,q,29,m","v,y,5,1,s,l,1,1k,2,1,k","v,w,1,1,y,8,1,8,3,1,1,1j,o","v,u,y,7,4,2,2,6,6,1f,1,1,3,2,k","v,t,z,6,6,2,2,5,2,3,2,1d,6,1,l","v,s,10,5,b,2,2,1f,4,1,7,1,l","w,q,11,5,7,1,4,1,2,1f,4,2,5,1,m","x,p,16,6,e,1b,3,2,3,3,m","y,n,13,a,e,1b,6,3,o","z,k,14,d,3,2,6,1c,5,1,r","11,i,14,f,1,1k,x","10,1,1,9,7,1,13,x,1,14,w","11,1,1,7,8,2,10,r,1,8,2,1,1,z,x","14,6,1a,r,2,8,8,t,1,1,w","15,5,19,t,1,c,5,r,z","15,5,5,1,4,1,y,u,1,b,6,9,3,9,1,1,12","d,1,s,4,4,1,8,2,u,u,2,9,8,8,4,7,2,1,12","17,8,6,1,x,u,2,8,a,5,6,7,8,1,w","1a,1,1,3,14,v,2,5,c,4,7,1,1,6,7,1,w","1d,5,11,w,1,3,e,4,9,7,6,1,w","1g,2,11,x,i,2,b,1,1,4,8,1,u","1g,2,4,4,3,1,q,w,1,3,e,2,d,3,8,2,u","1i,c,r,z,g,1,a,1,2,1,6,1,3,1,u","1l,b,p,z,g,1,a,1,d,1,u","1l,e,o,5,3,o,q,1,2,1,7,2,y","1l,f,x,l,s,1,1,1,6,2,z","1k,g,x,k,u,3,3,5,y","1j,h,x,j,v,3,3,4,z","1j,k,u,i,x,2,3,4,1,2,5,2,1,1,n","1j,o,r,g,z,2,5,1,1,2,2,1,3,6,k","1j,p,r,f,10,1,7,1,a,4,1,1,h","1k,p,q,f,11,4,e,5,i","1k,o,r,f,1b,1,8,2,2,1,6,1,a","1l,m,t,e,26","1l,m,s,g,4,1,18,4,3,1,k","1m,k,t,g,4,1,16,1,1,3,4,1,k","1n,j,s,g,3,3,15,7,2,3,j","1p,h,t,d,4,3,15,d,j","1p,h,t,c,6,2,14,f,i","1p,g,v,c,4,3,11,j,9,1,7","1p,e,x,c,4,2,11,l,g","1p,c,z,a,7,1,11,m,f","1p,c,z,a,19,m,f","1o,d,10,9,1a,l,f","1o,c,12,7,1b,l,f","1o,b,13,6,1c,6,4,b,f","1o,a,14,2,1g,2,9,9,g","1o,8,32,5,h","1n,9,32,4,f,1,2","1n,6,3o,1,2","1n,5,39,1,e,2,2","1n,5,39,1,c,2,4","1n,4,3m,2,5","1n,4,3t","1m,5,3t","1m,4,3u","1m,3,3v","1n,4,3t","5k","5k"]},"eu":{"lon0":-7,"lon1":17,"lat0":39.5,"lat1":55,"step":0.3,"rows":["0,4,2,5,1,7,x,4,4,2,1,1,g","0,5,6,a,w,4,a,2,a,1","0,4,4,1,3,a,v,7,4,3,9,4","0,2,c,9,u,g,1,1,1,8","0,3,a,b,n,3,2,s","0,3,5,1,5,a,j,3,1,x","0,3,6,f,f,1,1,13","0,3,7,j,a,15","0,2,8,j,a,15","8,l,9,16","6,m,9,17","b,f,9,1,1,17","d,f,5,1b","8,j,2,1f","7,5,3,2,1,1,a,1f","6,3,1,1,i,1f","s,1g","o,1k","h,2,6,1j","i,1q","i,1q","8,20","8,20","9,1z","d,1v","f,1t","h,1r","h,1r","i,1q","k,1o","k,1o","k,1a,3,b","j,19,5,2,1,8","j,1a,4,1,1,1,1,7","j,19,7,1,1,7","j,x,2,a,a,6","j,w,5,9,9,6","j,t,a,9,9,4","0,7,3,2,6,i,2,8,c,b,a,1","0,y,8,3,d,b,9,2","0,x,l,1,4,b,a","0,y,i,3,6,9,a","0,y,i,3,7,a,8","0,y,i,3,9,a,6","0,w,l,1,b,c,3","0,v,z,b,3","0,r,q,2,f,a","0,q,p,5,f,9","0,p,q,5,h,7","0,o,s,4,i,5,1","0,n,a,1,3,1,e,4,k,2,2","0,m,9,3,h,4,l,4"]}};
const CAMPAIGN_NODES = {   // nudge: deslocamento do nó em relação ao ponto geográfico (evita sobreposição na lente)
  interlagos: { map: 'world', nudge: [0, 0] }, laguna: { map: 'world', nudge: [0, 0] },
  monza: { map: 'eu', nudge: [30, 10] }, spa: { map: 'eu', nudge: [-34, -16], short: 'Spa' }, monaco: { map: 'eu', nudge: [-26, 30], lab: 'b' }, nordschleife: { map: 'eu', nudge: [30, -24] },
};
class CampaignMap {
  constructor(ui, el) {
    this.ui = ui; this.el = el; this.W = 1000; this.H = ((WORLD_DOTS.world.lat1 - WORLD_DOTS.world.lat0) * 1000) / 360;
    const E = WORLD_DOTS.eu, ky = 15.2, kx = ky * Math.cos((47 * Math.PI) / 180);
    this.lens = { x: 712, y: 16, kx, ky, w: (E.lon1 - E.lon0) * kx, h: (E.lat1 - E.lat0) * ky };
    this.build();
  }
  world(lon, lat) { const G = WORLD_DOTS.world; return [((lon - G.lon0) * 1000) / 360, ((G.lat1 - lat) * 1000) / 360]; }
  eu(lon, lat) { const E = WORLD_DOTS.eu, L = this.lens; return [L.x + (lon - E.lon0) * L.kx, L.y + (E.lat1 - lat) * L.ky]; }
  dots(G, proj, r) {
    let d = '';
    G.rows.forEach((row, j) => {
      const lat = G.lat1 - G.step / 2 - j * G.step; let i = 0, v = 0;
      for (const t of row.split(',')) {
        const n = parseInt(t, 36);
        if (v) for (let q = i; q < i + n; q++) { const [x, y] = proj(G.lon0 + G.step / 2 + q * G.step, lat); d += `M${x.toFixed(1)} ${y.toFixed(1)}h0`; }
        i += n; v ^= 1;
      }
    });
    return `<path d="${d}" class="cm-dots" style="stroke-width:${r}"/>`;
  }
  nodePos(id) {
    const g = TRACK_DEFS[id].geo, c = CAMPAIGN_NODES[id], p = c.map === 'eu' ? this.eu(g.lon, g.lat) : this.world(g.lon, g.lat);
    return { geo: p, at: [p[0] + c.nudge[0], p[1] + c.nudge[1]] };
  }
  build() {
    const G = WORLD_DOTS.world, E = WORLD_DOTS.eu, L = this.lens;
    let grat = '';
    for (let lon = -150; lon <= 180; lon += 30) { const [x] = this.world(lon, 0); grat += `M${x.toFixed(1)} 0V${this.H.toFixed(1)}`; }
    for (let lat = -30; lat <= 60; lat += 30) { const [, y] = this.world(0, lat); grat += `M0 ${y.toFixed(1)}H1000`; }
    const [ex0, ey0] = this.world(E.lon0, E.lat1), [ex1, ey1] = this.world(E.lon1, E.lat0);
    let nodes = '', pins = '';
    this.pos = {};
    TRACK_ORDER.forEach((id, k) => {
      const p = this.nodePos(id), d = TRACK_DEFS[id], c = CAMPAIGN_NODES[id], [x, y] = p.at; this.pos[id] = p;
      if (p.at[0] !== p.geo[0] || p.at[1] !== p.geo[1]) pins += `<line x1="${p.geo[0].toFixed(1)}" y1="${p.geo[1].toFixed(1)}" x2="${x.toFixed(1)}" y2="${y.toFixed(1)}" class="cm-leader"/>`;
      pins += `<circle cx="${p.geo[0].toFixed(1)}" cy="${p.geo[1].toFixed(1)}" r="2.2" class="cm-geo"/>`;
      const below = c.lab ? (c.lab === 'b' ? 1 : -1) : y < 60 ? 1 : -1;
      nodes += `<g class="cm-node" data-id="${id}" transform="translate(${x.toFixed(1)} ${y.toFixed(1)})" tabindex="0" role="button" aria-label="${d.name}">
        <circle r="17" class="cm-hit"/><circle r="15" class="cm-halo"/><circle r="10" class="cm-ring"/><circle r="7" class="cm-core"/>
        <g class="cm-ic" transform="translate(-5.4 -5.4) scale(.45)"></g><text class="cm-num" y="3.6">${k + 1}</text>
        <text class="cm-lbl" y="${below > 0 ? 29 : -19}">${(c.short || d.name).toUpperCase()}</text><text class="cm-sub" y="${below > 0 ? 40 : -30}">NV ${d.level}</text>
      </g>`;
    });
    this.el.innerHTML = `<svg viewBox="0 0 1000 ${this.H.toFixed(1)}" class="cm-svg" preserveAspectRatio="xMidYMid meet">
      <defs>
        <radialGradient id="cm-vig" cx="50%" cy="45%" r="70%"><stop offset="0" stop-color="#0d1219" stop-opacity="0"/><stop offset="1" stop-color="#05070a" stop-opacity=".85"/></radialGradient>
        <filter id="cm-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.6" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
        <clipPath id="cm-lens-clip"><rect x="${L.x}" y="${L.y}" width="${L.w.toFixed(1)}" height="${L.h.toFixed(1)}" rx="6"/></clipPath>
      </defs>
      <path d="${grat}" class="cm-grat"/>
      ${this.dots(G, (lon, lat) => this.world(lon, lat), 2.7)}
      <rect x="${ex0.toFixed(1)}" y="${ey0.toFixed(1)}" width="${(ex1 - ex0).toFixed(1)}" height="${(ey1 - ey0).toFixed(1)}" class="cm-eubox"/>
      <path d="M${ex1.toFixed(1)} ${ey0.toFixed(1)}L${L.x} ${L.y}M${ex1.toFixed(1)} ${ey1.toFixed(1)}L${L.x} ${(L.y + L.h).toFixed(1)}" class="cm-conn"/>
      <rect x="${L.x}" y="${L.y}" width="${L.w.toFixed(1)}" height="${L.h.toFixed(1)}" rx="6" class="cm-lens"/>
      <g clip-path="url(#cm-lens-clip)">${this.dots(E, (lon, lat) => this.eu(lon, lat), 2.3)}</g>
      <text x="${L.x + 10}" y="${L.y + L.h - 10}" class="cm-lens-t">EUROPA</text>
      <rect width="1000" height="${this.H.toFixed(1)}" fill="url(#cm-vig)" pointer-events="none"/>
      <g id="cm-route"></g>${pins}${nodes}
    </svg>`;
    this.el.querySelectorAll('.cm-node').forEach((g) => {
      const pick = () => this.ui.pickTrack(g.dataset.id);
      g.addEventListener('click', pick); g.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); pick(); } });
    });
  }
  // estados: concluído (vencido), liberado, bloqueado; trechos da rota acendem conforme o progresso
  render(sel) {
    const E = this.ui.E; let route = '';
    TRACK_ORDER.forEach((id, k) => {
      const g = this.el.querySelector(`.cm-node[data-id="${id}"]`), won = E.won(id), open = E.trackUnlocked(id);
      g.setAttribute('class', 'cm-node ' + (won ? 'st-won' : open ? 'st-open' : 'st-locked') + (id === sel ? ' sel' : ''));
      g.querySelector('.cm-ic').innerHTML = won ? UI_ICONS.check : open ? '' : UI_ICONS.lock;
      if (k + 1 < TRACK_ORDER.length) {
        const b = TRACK_ORDER[k + 1], [x0, y0] = this.pos[id].at, [x1, y1] = this.pos[b].at, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy);
        const bow = Math.min(0.32, 40 / Math.max(40, len) + 0.12) * (k % 2 ? 1 : -1), cx = (x0 + x1) / 2 - dy * bow, cy = (y0 + y1) / 2 + dx * bow;
        const st = won ? (E.trackUnlocked(b) ? 'done' : 'next') : 'locked';
        route += `<path d="M${x0.toFixed(1)} ${y0.toFixed(1)}Q${cx.toFixed(1)} ${cy.toFixed(1)} ${x1.toFixed(1)} ${y1.toFixed(1)}" class="cm-seg ${st}"/>`;
      }
    });
    this.el.querySelector('#cm-route').innerHTML = route;
  }
}

/* =====================================================================
   ECONOMY MANAGER — moedas, XP/nível, inventário, upgrades e LocalStorage
   ===================================================================== */
class EconomyManager {
  constructor() {
    this.key = 'nitroRush3D.save.v3'; this.v2Key = 'nitroRush3D.save.v2'; this.oldKey = 'nitroRush3D.save.v1'; this.data = this.load();
    if (this.migrated || this.migrated3) this.save();                              // grava a conversão já (a chave v1 foi removida)
  }
  defaults() {
    return {
      v: 3, coins: 1000, xp: 0, level: 1, owned: ['civic'], selected: 'civic', upgrades: {}, colors: {},
      stats: { races: 0, wins: 0, podiums: 0, trials: 0, earned: 0, best: {}, pb: {} },
      settings: { volume: 0.8, quality: 'high', fps: false },
      last: { track: 'interlagos', diff: 'easy', mode: 'race' },
      campaign: { won: {} },                                   // etapas vencidas (1º lugar no modo corrida)
    };
  }
  load() {
    const d = this.defaults();
    let s = null;
    try { const raw = localStorage.getItem(this.key); if (raw) s = JSON.parse(raw); } catch (e) { console.warn('Save inválido', e); }
    if (!s) {   // save da v2: mantém moedas, XP, carros e tunagem; campanha nova nos circuitos reais
      try { const r2 = localStorage.getItem(this.v2Key); if (r2) { s = JSON.parse(r2); s.stats = { ...(s.stats || {}), best: {}, pb: {} }; s.last = { ...(s.last || {}), track: 'interlagos' }; this.migrated3 = true; } } catch (e) { s = null; }
    }
    if (!s) { const m = this.migrateV1(); if (m) { this.migrated = m; s = m.data; } }
    if (!s) return d;
    try {
      if (Number.isFinite(s.coins)) d.coins = Math.max(0, Math.floor(s.coins));
      if (Number.isFinite(s.xp)) d.xp = Math.max(0, Math.floor(s.xp));
      d.level = LEVELS.levelFor(d.xp);                       // nível sempre recalculado a partir do XP salvo
      if (Array.isArray(s.owned)) d.owned = Array.from(new Set(['civic', ...s.owned.filter((x) => CARS[x])]));
      if (CARS[s.selected] && d.owned.includes(s.selected)) d.selected = s.selected;
      if (s.upgrades) for (const id of Object.keys(s.upgrades)) {
        if (!CARS[id]) continue; d.upgrades[id] = {};
        for (const k of Object.keys(UPGRADES)) { const v = s.upgrades[id][k]; if (Number.isInteger(v)) d.upgrades[id][k] = clamp(v, 0, MAX_LEVEL); }
      }
      if (s.colors) for (const id of Object.keys(s.colors)) if (CARS[id] && typeof s.colors[id] === 'string') d.colors[id] = s.colors[id];
      if (s.stats) Object.assign(d.stats, s.stats, { best: { ...(s.stats.best || {}) }, pb: { ...(s.stats.pb || {}) } });
      if (s.settings) Object.assign(d.settings, s.settings);
      if (s.last) Object.assign(d.last, s.last);
      if (s.campaign && s.campaign.won) for (const id of TRACK_ORDER) if (s.campaign.won[id]) d.campaign.won[id] = true;
    } catch (e) { console.warn('Save inválido, usando padrão', e); }
    return d;
  }
  // Save da versão 1 (3 carros genéricos): converte carros/upgrades em moedas e corridas em XP
  migrateV1() {
    try {
      const raw = localStorage.getItem(this.oldKey); if (!raw) return null;
      const o = JSON.parse(raw), OLD = { muscle: 500, hyper: 1200 }, OLDUP = [150, 250, 400, 600, 850];
      let refund = 0;
      for (const id of o.owned || []) refund += OLD[id] || 0;
      for (const id of Object.keys(o.upgrades || {})) for (const k of Object.keys(o.upgrades[id] || {})) { const l = o.upgrades[id][k] | 0; for (let i = 0; i < l; i++) refund += OLDUP[i]; }
      const races = (o.stats && o.stats.races) || 0;
      const data = { coins: (o.coins || 0) + refund, xp: races * 500, owned: ['civic'], selected: 'civic',
        stats: { ...(o.stats || {}), best: { ...((o.stats && o.stats.best) || {}) } }, settings: o.settings, last: { ...(o.last || {}), mode: 'race' } };
      localStorage.removeItem(this.oldKey);
      return { data, refund, xp: data.xp };
    } catch (e) { return null; }
  }
  save() { this.data.level = LEVELS.levelFor(this.data.xp); try { localStorage.setItem(this.key, JSON.stringify(this.data)); } catch (e) { /* modo privado */ } }
  get coins() { return this.data.coins; }
  get level() { return this.data.level; }
  addCoins(n) { n = Math.round(n); this.data.coins += n; if (n > 0) this.data.stats.earned += n; this.save(); }
  spend(n) { if (this.data.coins < n) return false; this.data.coins -= n; this.save(); return true; }
  owns(id) { return this.data.owned.includes(id); }
  carUnlocked(id) { return this.data.level >= CARS[id].level; }
  // campanha: etapa k libera com Nível ≥ requisito E vitória na etapa k−1
  trackLock(id) {
    const k = TRACK_ORDER.indexOf(id), prev = k > 0 ? TRACK_ORDER[k - 1] : null, L = TRACK_DEFS[id].level || 1;
    const levelOk = this.data.level >= L, prevOk = !prev || this.won(prev);
    return { ok: levelOk && prevOk, levelOk, prevOk, prev, level: L };
  }
  trackUnlocked(id) { return this.trackLock(id).ok; }
  lockReason(id) { const l = this.trackLock(id); return !l.levelOk ? `requer Nível ${l.level} (você está no nível ${this.level})` : !l.prevOk ? `vença ${TRACK_DEFS[l.prev].name} (1º lugar) para liberar` : ''; }
  won(id) { return !!this.data.campaign.won[id]; }
  wonCount() { return TRACK_ORDER.filter((id) => this.won(id)).length; }
  openTracks() { return TRACK_ORDER.filter((id) => this.trackUnlocked(id)); }
  stageTrack() { return TRACK_ORDER.find((id) => this.trackUnlocked(id) && !this.won(id)) || [...TRACK_ORDER].reverse().find((id) => this.trackUnlocked(id)) || TRACK_ORDER[0]; }
  buyCar(id) {
    const c = CARS[id];
    if (this.owns(id)) return { ok: false, msg: 'Você já possui este carro' };
    if (!this.carUnlocked(id)) return { ok: false, msg: `Bloqueado - Requer Nível ${c.level}` };
    if (!this.spend(c.price)) return { ok: false, msg: `Moedas insuficientes (faltam ${(c.price - this.data.coins).toLocaleString('pt-BR')})` };
    this.data.owned.push(id); this.data.selected = id; this.save();
    return { ok: true, msg: `${c.full} comprado!` };
  }
  select(id) { if (!this.owns(id)) return false; this.data.selected = id; this.save(); return true; }
  upLevel(id, k) { return (this.data.upgrades[id] && this.data.upgrades[id][k]) || 0; }
  upgradeCost(id, k) { const l = this.upLevel(id, k); return l >= MAX_LEVEL ? null : Math.round((UPGRADE_BASE[l] * CLASSES[CARS[id].cls].upMul) / 50) * 50; }
  upgrade(id, k) {
    if (!this.owns(id)) return { ok: false, msg: 'Compre o carro primeiro' };
    const c = this.upgradeCost(id, k);
    if (c == null) return { ok: false, msg: 'Nível máximo atingido' };
    if (!this.spend(c)) return { ok: false, msg: `Moedas insuficientes (faltam ${(c - this.data.coins).toLocaleString('pt-BR')})` };
    this.data.upgrades[id] = this.data.upgrades[id] || {};
    this.data.upgrades[id][k] = this.upLevel(id, k) + 1; this.save();
    return { ok: true, msg: `${UPGRADES[k].name} nível ${this.data.upgrades[id][k]}!` };
  }
  color(id) { return this.data.colors[id] || CARS[id].colors[0]; }
  setColor(id, c) { this.data.colors[id] = c; this.save(); }
  stats(id) { return computeStats(id, this.data.upgrades[id]); }
  xpProgress() {
    const L = this.data.level, a = LEVELS.xpFor(L), b = LEVELS.xpFor(L + 1);
    return { level: L, cur: this.data.xp - a, need: b - a, total: this.data.xp, frac: clamp((this.data.xp - a) / Math.max(1, b - a), 0, 1) };
  }
  addXP(n) {
    const before = this.data.level; n = Math.max(0, Math.round(n)); this.data.xp += n; this.save();
    const after = this.data.level, unlocked = [];
    if (after > before) {
      for (const id of CAR_LIST) { const L = CARS[id].level; if (L > before && L <= after) unlocked.push(CARS[id].full); }
    }
    return { gained: n, before, after, unlocked };
  }
  recordRace(trackId, pos, bestLap) {
    const st = this.data.stats; st.races++; if (pos === 1) { st.wins++; this.data.campaign.won[trackId] = true; } if (pos <= 3) st.podiums++;
    if (bestLap && (!st.best[trackId] || bestLap < st.best[trackId])) st.best[trackId] = bestLap;
    this.save();
  }
  // próximo desbloqueio (menor nível acima do atual): { level, names }
  nextUnlock() {
    const L = this.data.level, items = [];
    for (const id of CAR_LIST) if (CARS[id].level > L) items.push([CARS[id].level, CARS[id].full]);
    for (const id of TRACK_ORDER) if ((TRACK_DEFS[id].level || 1) > L) items.push([TRACK_DEFS[id].level, 'Circuito ' + TRACK_DEFS[id].name]);
    if (!items.length) return null;
    const lv = Math.min(...items.map((x) => x[0]));
    return { level: lv, names: items.filter((x) => x[0] === lv).map((x) => x[1]) };
  }
  recordTrial(trackId, bestLap) {
    const st = this.data.stats; st.trials = (st.trials || 0) + 1;
    if (bestLap && (!st.pb[trackId] || bestLap < st.pb[trackId])) st.pb[trackId] = bestLap;
    this.save();
  }
  reset() {
    const settings = this.data.settings; this.data = this.defaults(); this.data.settings = settings; this.save();
    for (const id of TRACK_ORDER) try { localStorage.removeItem(GhostSystem.key(id)); } catch (e) { }
  }
}

class Race {
  constructor(game, trackId, diffId, mode = 'race') {
    this.game = game; this.trackId = trackId; this.diffId = diffId; this.mode = mode; this.trial = mode === 'trial';
    this.def = TRACK_DEFS[trackId]; this.diff = DIFFICULTY[diffId];
    this.totalLaps = this.trial ? (this.def.trialLaps || TRIAL_LAPS) : (this.def.laps || TOTAL_LAPS);
    const q = game.q, E = game.economy;
    this.scene = new THREE.Scene();
    const lt = (window.__nitroLoad = { t0: performance.now() }), mark = (k) => (lt[k] = Math.round(performance.now() - lt.t0));
    const T = (this.track = new TrackManager(this.def, q).build(this.scene)); mark('pista');
    const env = T.env;
    this.scene.fog = new THREE.Fog(env.fog[0], env.fog[1], env.fog[2]);
    this.hemi = new THREE.HemisphereLight(env.hemi[0], env.hemi[1], env.hemi[2]); this.scene.add(this.hemi);
    // sol com sombras suaves (Engine.SunLight): câmera de sombra presa à grade de texels, seguindo o carro
    this.sunL = new SunLight(this.scene, { dir: env.sunDir, color: env.sunColor, intensity: env.sunI, shadows: q.shadows, size: q.shadowSize, range: 72 });
    this.sun = this.sunL.light;
    if (env.night) {
      const cols = this.def.theme === 'monaco' ? [[0, 2.6, 3], [3, 0.3, 1.8], [1.6, 0.6, 3], [0, 2.6, 3]] : [[0, 2.5, 3], [3, 0.4, 1.4], [3, 2.2, 0.8], [1.2, 0.6, 3]];
      for (let k = 0; k < 16; k++) {
        const a = (k / 16) * Math.PI * 2, c = cols[k % 4];
        const m = new THREE.Mesh(new THREE.PlaneGeometry(3 + (k % 3) * 2, 1.5 + (k % 2)), new THREE.MeshBasicMaterial({ color: new THREE.Color(...c), side: THREE.DoubleSide }));
        m.position.set(Math.cos(a) * 30, 2 + (k % 4) * 3, Math.sin(a) * 30); m.lookAt(0, 2, 0); T.envScene.add(m);
      }
    }
    this.envRT = game.engine.pmrem.fromScene(T.envScene, 0.03); mark('reflexo');   // mapa de reflexo global (céu + nuvens + softboxes)
    this.scene.environment = this.envRT.texture;
    game.renderer.toneMappingExposure = env.exposure;
    if (game.bloom) game.bloom.strength = env.night ? 0.55 : 0.3;
    // carros: IAs da MESMA CLASSE do seu carro (corridas equilibradas) + jogador
    this.physics = new PhysicsEngine(T);
    this.cars = []; this.ais = [];
    const selId = E.data.selected;
    const P = (this.player = new Vehicle(this, { model: selId, color: E.color(selId), stats: E.stats(selId), isPlayer: true, name: 'VOCÊ', headlights: env.night, shadows: q.shadows }));
    if (!this.trial) {
      const rnd = mulberry32((Date.now() & 0xffff) + 7), names = AI_NAMES.slice().sort(() => rnd() - 0.5);
      const cls = CARS[selId].cls, pool = CAR_LIST.filter((id) => CARS[id].cls === cls);
      for (let k = 0; k < NUM_AI; k++) {
        const model = pool[Math.floor(rnd() * pool.length)], cols = CARS[model].colors;
        const color = cols[Math.floor(rnd() * cols.length)];
        const skill = 0.965 + rnd() * 0.06 + (k < 3 ? 0.01 : 0);
        const base = computeStats(model);
        const stats = { ...base, top: base.top * this.diff.speed * skill, accel: base.accel * this.diff.accel, grip: base.grip * 1.04, profGrip: base.grip };
        const car = new Vehicle(this, { model, color, stats, name: names[k], shadows: q.aiShadows });
        this.cars.push(car); this.ais.push(new AICar(car, this, skill));
      }
    }
    this.cars.push(P); mark('carros');
    // faróis/lanternas com luz real: o jogador sempre; à noite/chuva/neve também as IAs mais próximas (pool fixo)
    const nRig = 1 + (env.night ? Math.max(0, (q.lights || 1) - 1) : 0);   // mesma contagem de luzes em todas as pistas diurnas → shaders reaproveitados
    this.rigs = []; for (let k = 0; k < nRig; k++) this.rigs.push(new LightRig(this.scene));
    this.rigs[0].attach(P.inst); this.rigT = 0;
    this.playerCtl = new Player(P, game.input);
    if (this.trial) P.place(T.trialSlot()); else this.cars.forEach((c, k) => c.place(T.gridSlot(k)));
    for (const c of this.cars) this.scene.add(c.mesh);
    this.coins = new CoinField(this.scene, T.coinSpots);
    this.nitroFX = new ParticleSystem(1200, true); this.smokeFX = new ParticleSystem(800, false);
    this.scene.add(this.nitroFX.points, this.smokeFX.points);
    this.spots = [];
    if (T.lamps.length) for (let k = 0; k < 6; k++) {
      const L = new THREE.SpotLight(0xffc98a, 260, 44, 0.95, 0.65, 1.5); L.position.set(0, -500, 0);
      this.scene.add(L, L.target); this.spots.push(L);
    }
    this.weather = this.def.weather ? new WeatherFX(this.def.weather, this.scene, q) : null;
    this.ghost = this.trial ? new GhostSystem(this) : null;
    this.time = -4; this.started = false; this.paused = false; this.finishCount = 0; this.resultsShown = false;
    this.score = 0; this.raceCoins = 0; this.driftTotal = 0; this.newPB = false; this.drift = { active: false, pts: 0, t: 0, idle: 0, mult: 1 };
    this.shake = 0; this.camMode = game.camMode || 0; this.camYaw = P.heading + Math.PI; this.camY = P.y + 2.4; this.wrongT = 0; this.lastBeep = 99;
    this.aheadFlags = new Map(); this.passT = new Map(); this.resetCD = 0; this.silent = false; this.pointScale = 500;
    for (const c of this.cars) { c.updateEngine(0.016); c.updateVisual(0.016); c.mesh.updateMatrixWorld(); }
    this.updateRanking();
    this.updateCamera(0.016);
  }

  update(dt) {
    if (this.paused) return;
    const game = this.game, P = this.player, audio = game.audio, ui = game.ui;
    this.time += dt; this.resetCD -= dt;
    if (!this.started) {
      const n = Math.ceil(-this.time);
      if (this.time > -3 && n !== this.lastBeep && n >= 1 && n <= 3) {
        this.lastBeep = n; audio.beep(false); ui.countdown(String(n));
        this.track.startLights.forEach((m, k) => { m.material.emissiveIntensity = k < 4 - n ? 4 : 0; });
      }
      if (this.time >= 0) {
        this.started = true; for (const c of this.cars) { c.active = true; c.lapStart = 0; }
        audio.beep(true); ui.countdown('GO!', true);
        this.track.startLights.forEach((m) => { m.material.emissive.setHex(0x20ff60); m.material.emissiveIntensity = 4; });
      }
    }
    if (P.finished || this.autoplay) { this.autopilot = this.autopilot || new AICar(P, this, 1); this.autopilot.update(dt, true); if (P.finished) P.input.nitro = false; }
    else this.playerCtl.update(dt);
    if (this.inputOverride) Object.assign(P.input, this.inputOverride); // usado pelos testes automatizados
    for (const ai of this.ais) ai.update(dt);
    if (this.started) for (const ai of this.ais) {
      const c = ai.car, gap = c.progress - P.progress;
      const tgt = P.finished ? 1 : gap > 70 ? this.diff.ahead : gap < -45 ? this.diff.behind : 1;
      c.speedMul = damp(c.speedMul, tgt, 0.5, dt); c.accelMul = c.speedMul;
      if (c.speed > 39 && !c.nitroOn) c.nitro = Math.min(1, c.nitro + 0.025 * dt);
    }
    const n = Math.min(10, Math.max(1, Math.ceil(dt / (1 / 120)))), h = dt / n;
    for (let k = 0; k < n; k++) this.physics.step(this.cars, h);
    this.handleEvents();
    for (const c of this.cars) this.updateProgress(c);
    this.updateRanking();
    if (this.started && !P.finished) this.updateScoring(dt);
    const got = this.coins.collect(P.x, P.y + 0.7, P.z);
    if (got) {
      const v = got * COIN_VALUE; this.raceCoins += v; game.economy.addCoins(v);
      audio.coin(); ui.popup(`+${v} <span class="coin-ic ci"></span>`, '#ffc93c', true); ui.refreshCoins(true); ui.bumpHudCoins();
    }
    for (const c of this.cars) { c.updateEngine(dt); c.updateVisual(dt); c.mesh.updateMatrixWorld(); c.impact = 0; }
    if (this.ghost) { if (P.crossings >= 1 && !P.finished) this.ghost.record(this.time - P.lapStart); this.ghost.update(); }
    this.coins.update(dt, this.time);
    this.emitParticles(dt); this.nitroFX.update(dt); this.smokeFX.update(dt);
    this.updateCamera(dt); this.updateLights(dt);
    this.track.update(dt, this.time, game.camera.position);
    if (this.weather) this.weather.update(this.time, game.camera.position, this.pointScale);
    if (!this.silent) { this.updateAudio(); ui.updateHUD(this); }
    if (P.finished && !this.resultsShown && this.time - P.finishTime > 2.5) this.showResults();
  }

  handleEvents() {
    const ev = this.physics.events, P = this.player, audio = this.game.audio, cp = this.game.camera.position;
    for (const e of ev) {
      const mine = e.car === P || e.other === P;
      if (e.type === 'land') {
        if (e.car === P) {
          audio.land(clamp(e.v / 12, 0.1, 0.8)); this.shake = Math.max(this.shake, clamp(e.v * 0.03, 0, 0.5));
          if (e.air > 0.45 && this.started && !P.finished) { const pts = Math.round(e.air * 250); this.score += pts; this.game.ui.popup(`SALTO! +${pts}`, '#3dff9a'); }
        }
        continue;
      }
      const dist = mine ? 0 : Math.hypot(e.car.x - cp.x, e.car.z - cp.z);
      const vol = clamp(e.v / 22, 0, 1) * (mine ? 1 : clamp(1 - dist / 90, 0, 0.6));
      if (vol > 0.03 && this.time - (e.car._snd || -9) > 0.2) { e.car._snd = this.time; if (e.v > 5) audio.crash(vol); else audio.scrape(); }
      if (mine) {
        this.shake = Math.max(this.shake, clamp(e.v * 0.035, 0, 0.8));
        if (this.drift.active && e.v > 6) { this.drift.active = false; this.drift.pts = 0; this.drift.t = 0; this.game.ui.popup('DRIFT PERDIDO', '#ff4057'); }
      }
    }
    ev.length = 0;
  }

  updateProgress(c) {
    const L = this.track.length, s = c.s, ps = c.prevS;
    // voltar de ré pela linha e cruzar de novo só restaura a contagem (não vale como volta nova)
    if (ps > L * 0.75 && s < L * 0.25) { if (c.crossings === 0 || c.cp) { c.crossings++; c.cp = false; if (c.crossings > (c.maxCross || 0)) { c.maxCross = c.crossings; this.onLine(c); } } }
    else if (ps < L * 0.25 && s > L * 0.75) { if (c.crossings > 0 && !c.finished) { c.crossings--; c.cp = true; } }
    if (s > L * 0.42 && s < L * 0.58) c.cp = true;
    c.prevS = s;
    c.progress = (c.crossings - 1) * L + s;
  }
  onLine(c) {
    if (c.finished) return;
    const ui = this.game.ui, mine = c === this.player;
    if (c.crossings === 1) {                                  // cruzou a linha pela primeira vez
      if (this.trial && mine) { c.lapStart = this.time; this.ghost.startLap(); ui.message(this.ghost.best ? 'VOLTA CRONOMETRADA — BATA O FANTASMA!' : 'VOLTA CRONOMETRADA', 2, this.ghost.best ? 'ghost' : 'timer'); }
      return;
    }
    const lt = this.time - c.lapStart; c.lapStart = this.time; c.lapTimes.push(lt);
    if (!c.bestLap || lt < c.bestLap) c.bestLap = lt;
    if (this.trial && mine) {
      const pb = this.ghost.finishLap(lt);
      if (pb) { this.newPB = true; this.game.audio.record(); ui.popup(`NOVO RECORDE! ${fmtTime(lt)}`, '#3dff9a'); }
      else ui.popup(`VOLTA ${c.crossings - 1} · ${fmtTime(lt)}`, '#ffffff');
    }
    if (c.crossings > this.totalLaps) {
      c.finished = true; c.finishTime = this.time; c.finishPos = ++this.finishCount;
      if (mine) this.onPlayerFinish();
      return;
    }
    if (mine) {
      if (this.trial) this.ghost.startLap();
      this.coins.respawn(); this.game.audio.lap();
      if (!this.trial) ui.popup(`VOLTA ${c.crossings - 1} · ${fmtTime(lt)}`, '#ffffff');
      ui.message(c.crossings === this.totalLaps ? 'VOLTA FINAL!' : `VOLTA ${c.crossings}/${this.totalLaps}`, 2);
    }
  }
  onPlayerFinish() {
    const P = this.player;
    if (this.drift.active) { const pts = Math.round(this.drift.pts); if (pts >= 40) { this.score += pts; this.driftTotal += pts; } this.drift.active = false; }
    this.game.audio.finish();
    this.game.ui.message(this.trial ? 'FIM DO TREINO' : P.finishPos === 1 ? 'VITÓRIA!' : `CHEGADA · ${P.finishPos}º LUGAR`, 3, this.trial ? 'flag' : P.finishPos === 1 ? 'trophy' : 'flag');
  }
  updateRanking() {
    const arr = this.cars.slice().sort((a, b) => {
      if (a.finished && b.finished) return a.finishPos - b.finishPos;
      if (a.finished) return -1; if (b.finished) return 1;
      return b.progress - a.progress;
    });
    arr.forEach((c, i) => (c.rank = i + 1));
    this.order = arr;
  }
  updateScoring(dt) {
    const P = this.player, kmh = P.speed * 3.6, ui = this.game.ui, D = this.drift;
    if (kmh > 120) this.score += (kmh - 120) * 0.5 * dt;
    const drifting = !P.airborne && P.sliding && P.driftAngle > 0.17 && P.speed > 14 && P.vf > 0;
    if (drifting) {
      D.active = true; D.idle = 0; D.t += dt; D.mult = 1 + Math.min(3, D.t * 0.35);
      D.pts += dt * (P.driftAngle * 57.3) * kmh * 0.035 * D.mult;
    } else if (D.active) {
      D.idle += dt;
      if (D.idle > 0.6) {
        const pts = Math.round(D.pts);
        if (pts >= 40) { this.score += pts; this.driftTotal += pts; ui.popup(`DRIFT! +${pts}`, '#ff2d78'); P.nitro = Math.min(1, P.nitro + (pts / 2200) * P.stats.nitroRegen); this.game.audio.driftBank(); }
        D.active = false; D.pts = 0; D.t = 0;
      }
    }
    for (const ai of this.ais) {
      const c = ai.car, ahead = c.rank < P.rank, was = this.aheadFlags.get(c);
      if (was === true && !ahead && this.time > 2 && this.time - (this.passT.get(c) || -99) > 6) {
        this.score += 250; ui.popup('ULTRAPASSAGEM! +250', '#00e5ff'); this.game.audio.overtake(); this.passT.set(c, this.time);
      } else if (was === false && ahead) this.passT.set(c, this.time);
      this.aheadFlags.set(c, ahead);
    }
    if (kmh > 140 && !P.nitroOn) P.nitro = Math.min(1, P.nitro + 0.028 * P.stats.nitroRegen * dt);
    const back = P.fx * P.ttx + P.fz * P.ttz < -0.2 && P.speed > 3;
    this.wrongT = back ? this.wrongT + dt : 0;
  }
  respawn(c) {
    this.respawns = (this.respawns || 0) + 1;
    const T = this.track, i = c.ti, s0 = c.s;
    let bestLat = 0, bestD = -1;
    for (const lat of [0, -T.hw * 0.45, T.hw * 0.45]) {
      const x = T.px[i] + T.nx[i] * lat, z = T.pz[i] + T.nz[i] * lat;
      let dmin = Infinity; for (const o of this.cars) if (o !== c) dmin = Math.min(dmin, Math.hypot(o.x - x, o.z - z));
      if (dmin > bestD) { bestD = dmin; bestLat = lat; }
    }
    c.place({ i, x: T.px[i] + T.nx[i] * bestLat, z: T.pz[i] + T.nz[i] * bestLat, h: T.head[i] });
    c.nitroOn = false; c.prevS = s0; this.updateProgress(c);
  }
  resetPlayer() {
    if (this.resetCD > 0 || !this.started || this.player.finished) return;
    this.resetCD = 1.5; this.respawn(this.player); this.game.ui.message('REPOSICIONADO', 1);
  }

  emitParticles(dt) {
    const cam = this.game.camera.position, V = this._v || (this._v = new THREE.Vector3());
    const th = this.def.theme;
    const smoke = th === 'laguna' ? [[0.85, 0.72, 0.52], [0.72, 0.6, 0.45]] : th === 'spa' ? [[0.95, 0.97, 1], [0.85, 0.9, 0.95]] : [[0.8, 0.8, 0.83], [0.55, 0.55, 0.58]];
    const dust = th === 'spa' ? [[0.96, 0.98, 1], [0.9, 0.93, 0.97]] : th === 'laguna' ? [[0.82, 0.7, 0.5], [0.7, 0.6, 0.45]] : [[0.55, 0.5, 0.36], [0.45, 0.42, 0.32]];
    for (const c of this.cars) {
      if ((c.x - cam.x) ** 2 + (c.z - cam.z) ** 2 > 170 * 170) continue;
      if (c.nitroOn) {
        const n = Math.max(1, Math.round(dt * 220));
        for (const e of c.inst.exhausts) for (let k = 0; k < n; k++) {
          V.copy(e); c.inst.body.localToWorld(V);
          const sp = 7 + Math.random() * 7;
          this.nitroFX.emit(V.x, V.y, V.z, c.vx * 0.55 - c.fx * sp + (Math.random() - 0.5) * 2, (Math.random() - 0.2) * 1.5, c.vz * 0.55 - c.fz * sp + (Math.random() - 0.5) * 2,
            0.22 + Math.random() * 0.22, 0.35, 1.35, [0.35, 1.05, 2.7], [1.0, 0.3, 2.4], 0.85, 3);
        }
      }
      if (c.offRoad && !c.airborne && c.speed > 7 && Math.random() < 0.3) {       // poeira/grama/neve saindo da área de escape
        const w = c.inst.wheels[Math.floor(Math.random() * c.inst.wheels.length)]; V.set(0, -w.r + 0.1, 0); w.pivot.localToWorld(V);
        this.smokeFX.emit(V.x, V.y, V.z, c.vx * 0.3 + (Math.random() - 0.5) * 3, 0.8 + Math.random() * 1.5, c.vz * 0.3 + (Math.random() - 0.5) * 3, 0.7 + Math.random() * 0.5, 0.5, 2.6, dust[0], dust[1], 0.26, 1.8, 0.4);
      }
      const smoking = !c.airborne && ((c.sliding && c.slip > 2.5 && c.speed > 5) || (c.input.throttle > 0.9 && c.input.brake > 0.9 && c.active && c.speed < 8));
      if (smoking) {
        const inten = clamp(c.slip / 10, 0.3, 1);
        for (const w of c.inst.wheels) {
          if (w.front || Math.random() < 0.3) continue;
          V.set(0, -w.r + 0.15, 0); w.pivot.localToWorld(V);
          this.smokeFX.emit(V.x, V.y, V.z, c.vx * 0.2 + (Math.random() - 0.5) * 2, 0.6 + Math.random(), c.vz * 0.2 + (Math.random() - 0.5) * 2,
            1.0 + Math.random() * 0.8, 0.8, 4.5 + inten * 3, smoke[0], smoke[1], 0.3 * inten, 1.4, 0.8);
        }
      }
    }
  }

  updateCamera(dt) {
    const cam = this.game.camera, P = this.player, sp = P.speed;
    const portrait = cam.aspect < 1 ? (1 - cam.aspect) * 34 : 0;
    let fov = 64 + portrait + clamp((sp * 3.6) / 320, 0, 1) * 10 + (P.nitroOn ? 14 : 0);   // distorção de velocidade
    let pos, look;
    if (!this.started && this.time < -0.8) {
      const k = clamp((this.time + 4) / 3.2, 0, 1), e = k * k * (3 - 2 * k), ang = P.heading + Math.PI * (1 - e), dist = lerp(8.5, 6.4, e);
      pos = [P.x - Math.sin(ang) * dist, P.y + lerp(1.6, 2.4, e), P.z - Math.cos(ang) * dist];
      look = [P.x, P.y + 0.9, P.z];
      this.camYaw = ang; this.camY = pos[1]; fov = 55 + e * 9 + portrait;
    } else if (P.finished && this.time - P.finishTime > 0.6) {
      const a = P.heading + 0.8 + (this.time - P.finishTime) * 0.25;
      pos = [P.x - Math.sin(a) * 8, P.y + 2.6, P.z - Math.cos(a) * 8]; look = [P.x, P.y + 0.8, P.z]; fov = 58 + portrait;
    } else if (this.camMode === 2) {
      pos = [P.x + P.fx * 0.35, P.y + 1.15 + P.pitch, P.z + P.fz * 0.35]; look = [P.x + P.fx * 20, P.y + 0.9, P.z + P.fz * 20]; fov += 6;
      this.camYaw = P.heading; this.camY = pos[1];
    } else {
      let dir = P.heading;
      if (sp > 3 && P.vf > 0) { const d = wrapAngle(Math.atan2(P.vx, P.vz) - P.heading); if (Math.abs(d) < 1.4) dir = P.heading + d * 0.45; }
      this.camYaw += wrapAngle(dir - this.camYaw) * (1 - Math.exp(-6 * dt));
      const far = this.camMode === 1, dist = (far ? 9.5 : 6.3) + sp * 0.022 + (P.nitroOn ? 1.1 : 0), hgt = (far ? 3.6 : 2.3) + sp * 0.005;
      this.camY = damp(this.camY, P.y + hgt, 9, dt);
      const cx = P.x - Math.sin(this.camYaw) * dist, cz = P.z - Math.cos(this.camYaw) * dist;
      pos = [cx, Math.max(this.camY, P.groundY + 1.2), cz];
      look = [P.x + Math.sin(this.camYaw) * 4, P.y + 1.05, P.z + Math.cos(this.camYaw) * 4];
    }
    this.shake = Math.max(this.shake * Math.exp(-5 * dt), P.nitroOn ? 0.05 : 0);
    const sh = this.shake * (this.camMode === 2 ? 0.4 : 1);
    cam.position.set(pos[0] + (Math.random() - 0.5) * sh, pos[1] + (Math.random() - 0.5) * sh, pos[2] + (Math.random() - 0.5) * sh);
    cam.lookAt(look[0], look[1], look[2]);
    cam.fov = damp(cam.fov, fov, 4, dt); cam.updateProjectionMatrix();
    this.track.skyDome.update(this.time + 600, cam.position);                  // nuvens animadas + domo centrado na câmera
    const hpx = this.game.renderer.domElement.height;
    const sc = (this.pointScale = hpx / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2)));
    this.nitroFX.mat.uniforms.uScale.value = sc; this.smokeFX.mat.uniforms.uScale.value = sc;
  }
  updateLights(dt) {
    const P = this.player, T = this.track, env = T.env;
    this.sunL.follow((this._sp || (this._sp = new THREE.Vector3())).set(P.x + P.fx * 22, P.y, P.z + P.fz * 22));
    if (this.spots.length) {
      const L = T.lamps, cand = [];
      for (let i = 0; i < L.length; i++) {
        const l = L[i], dx = l.x - P.x, dz = l.z - P.z, d = Math.hypot(dx, dz);
        if (d > 170) continue;
        cand.push([d - Math.max(0, dx * P.fx + dz * P.fz) * 0.55, i]);
      }
      cand.sort((a, b) => a[0] - b[0]);
      this.spots.forEach((s, k) => {
        if (k < cand.length) { const idx = cand[k][1], l = L[idx]; s.position.copy(l); s.target.position.set(l.x, l.y - 8.4, l.z); s.color.setHex(T.lampCol[idx] || 0xffc98a); }
        else s.position.set(0, -500, 0);
      });
    }
    const night = !!env.night, dim = night || !!this.def.weather;
    if (this.rigs.length > 1 && (this.rigT -= dt) <= 0) {      // luzes livres vão para as IAs mais próximas da câmera
      this.rigT = 0.3; const cp = this.game.camera.position;
      const near = this.cars.filter((c) => c !== P).map((c) => [(c.x - cp.x) ** 2 + (c.z - cp.z) ** 2, c]).filter((a) => a[0] < 150 * 150).sort((a, b) => a[0] - b[0]);
      for (let k = 1; k < this.rigs.length; k++) { const n = near[k - 1]; if (n) this.rigs[k].attach(n[1].inst); else if (this.rigs[k].inst) this.rigs[k].park(); }
    }
    for (const r of this.rigs) { const b = r.inst ? r.inst.brake || 0 : 0; if (r.inst) r.set(night ? 60 : dim ? 38 : 14, (night ? 1.6 : 0.5) + b * (night ? 5 : 2)); else r.set(0, 0); }
    if (T.beacons) T.beacons.material.emissiveIntensity = Math.sin(this.time * 3.2) > 0.55 ? 6 : 0.4;
    if (T.crowd && this.started) for (const cr of T.crowd) cr.im.position.y = Math.abs(Math.sin(this.time * 9)) * 0.06;
    for (let k = 0; k < T.holos.length; k++) { const hm = T.holos[k]; hm.material.opacity = 0.62 + 0.25 * Math.sin(this.time * 7 + k * 1.7) + (Math.random() < 0.02 ? -0.4 : 0); }
    if (T.flyers) {                                            // carros voadores sobre a cidade cyberpunk
      const F = T.flyers, d = F.d;
      F.data.forEach((f, k) => {
        const x = T.cx - 1300 + (((f.ph + this.time * f.sp * f.dir) % 2600) + 2600) % 2600;
        d.position.set(x, f.h, T.cz + f.lane * 0.5 - 250); d.rotation.set(0, f.dir > 0 ? Math.PI / 2 : -Math.PI / 2, 0); d.scale.setScalar(1); d.updateMatrix();
        F.im.setMatrixAt(k, d.matrix);
      });
      F.im.instanceMatrix.needsUpdate = true;
    }
  }
  updateAudio() {
    const P = this.player, cam = this.game.camera, A = this.game.audio;
    if (!A.race) return;
    const near = {};
    for (const ai of this.ais) {
      const c = ai.car, k = c.stats.engine, d = (c.x - P.x) ** 2 + (c.z - P.z) ** 2;
      if (d < 250 * 250 && (!near[k] || d < near[k].d)) near[k] = { d, x: c.x, y: c.y + 0.6, z: c.z, rpm: c.rpm, speedN: c.speedN, throttle: c.input.throttle };
    }
    const skid = P.airborne || P.speed < 4 ? 0 : Math.max(P.sliding ? clamp((P.slip - 1.2) / 7, 0, 1) : 0, clamp((P.gripUse - 0.92) * 3, 0, 0.35), P.input.brake > 0.5 && P.vf > 25 ? 0.25 : 0);
    const f = cam.getWorldDirection(this._cf || (this._cf = new THREE.Vector3()));
    A.updateRace({ rpm: P.rpm, speedN: P.speedN, throttle: P.finished ? 0.3 : P.input.throttle, skid, nitro: P.nitroOn, ai: near, cam: cam.position, camFwd: f });
  }
  showResults() {
    this.resultsShown = true;
    const res = this.trial ? this.computeTrialResults() : this.computeResults();
    this.game.ui.showResults(res);
    this.game.audio.duckRace(true);
  }
  computeResults() {
    const P = this.player, d = this.diff, E = this.game.economy, L = this.track.length;
    const pos = P.finishPos;
    const posPts = Math.round(POS_POINTS[pos - 1] * d.reward);
    this.score += posPts;
    const posCoins = POS_REWARD[pos - 1], scoreCoins = Math.floor(this.score / 100);
    const bonus = Math.round((posCoins + scoreCoins) * d.reward);
    E.addCoins(bonus);
    const open0 = E.openTracks();
    E.recordRace(this.trackId, pos, P.bestLap);
    // XP: posição + moedas + tempo (comparado ao tempo de referência da pista) + drifts, × dificuldade
    const par = this.track.parLap(P.stats.grip * this.track.gripMul, P.stats.top) * this.totalLaps + 5;
    const xpPos = XP_POS[pos - 1], xpCoins = Math.round(this.raceCoins * 1.5), xpTime = Math.round(clamp(par / Math.max(1, P.finishTime), 0.5, 1.6) * 300), xpDrift = Math.round(this.driftTotal / 8);
    const xpTotal = Math.round((xpPos + xpCoins + xpTime + xpDrift) * d.xp);
    const lv = E.addXP(xpTotal);
    lv.trackIds = E.openTracks().filter((id) => !open0.includes(id)); lv.tracks = lv.trackIds.map((id) => TRACK_DEFS[id].name); lv.stageWon = pos === 1;
    const order = this.cars.slice().sort((a, b) => {
      if (a.finished && b.finished) return a.finishPos - b.finishPos;
      if (a.finished) return -1; if (b.finished) return 1; return b.progress - a.progress;
    });
    const standings = order.map((c, i) => ({
      pos: i + 1, name: c.name, color: c.color, model: CARS[c.model].full, me: c === P,
      time: c.finished ? fmtTime(c.finishTime) : '~' + fmtTime(this.time + Math.max(0, this.totalLaps * L - c.progress) / Math.max(20, (c.progress + 45) / Math.max(1, this.time))),
    }));
    this.results = {
      pos, totalTime: P.finishTime, bestLap: P.bestLap, score: Math.round(this.score), posPts, raceCoins: this.raceCoins, posCoins, scoreCoins, mult: d.reward, bonus,
      total: this.raceCoins + bonus, standings, balance: E.coins, track: this.def.name, diff: d.name,
      xp: { rows: [[`Posição (${pos}º)`, `+${xpPos}`], ['Moedas coletadas', `+${xpCoins}`], [`Tempo (${fmtTime(P.finishTime)})`, `+${xpTime}`], ['Drifts', `+${xpDrift}`], ['Dificuldade', `x${d.xp}`]], total: xpTotal, ...lv },
    };
    return this.results;
  }
  computeTrialResults() {
    const P = this.player, E = this.game.economy;
    const laps = P.lapTimes.length, xpLaps = laps * 140, xpPB = this.newPB ? 400 : 0, xpCoins = Math.round(this.raceCoins * 1.5), xpDrift = Math.round(this.driftTotal / 8);
    const open0 = E.openTracks(), xpTotal = xpLaps + xpPB + xpCoins + xpDrift, lv = E.addXP(xpTotal);
    lv.trackIds = E.openTracks().filter((id) => !open0.includes(id)); lv.tracks = lv.trackIds.map((id) => TRACK_DEFS[id].name);
    E.recordTrial(this.trackId, P.bestLap);
    this.results = {
      trial: true, laps: P.lapTimes.slice(), bestLap: P.bestLap, pb: this.ghost.best ? this.ghost.best.lap : P.bestLap, newPB: this.newPB,
      totalTime: P.finishTime, score: Math.round(this.score), raceCoins: this.raceCoins, total: this.raceCoins, balance: E.coins, track: this.def.name, car: CARS[P.model].full,
      xp: { rows: [[`Voltas completadas (${laps})`, `+${xpLaps}`], ['Novo recorde pessoal', `+${xpPB}`], ['Moedas coletadas', `+${xpCoins}`], ['Drifts', `+${xpDrift}`]], total: xpTotal, ...lv },
    };
    return this.results;
  }
  dispose() {
    if (this.ghost) this.ghost.dispose();
    for (const c of this.cars) { this.scene.remove(c.mesh); c.dispose(); }
    const seen = new Set();
    const dm = (m) => {
      if (!m || seen.has(m)) return; seen.add(m);
      for (const k in m) { const v = m[k]; if (v && v.isTexture) v.dispose(); }
      if (m.uniforms) for (const u of Object.values(m.uniforms)) if (u.value && u.value.isTexture) u.value.dispose();
      m.dispose();
    };
    this.scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(dm);
      if (o.isLight && o.dispose) o.dispose();
    });
    this.track.envScene.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) dm(o.material); });
    this.envRT.dispose();
  }
}

/* =====================================================================
   SHOWROOM — garagem 3D com o carro girando na plataforma
   ===================================================================== */
class Showroom {
  constructor(game) {
    this.game = game;
    const s = (this.scene = new THREE.Scene());
    s.background = new THREE.Color(0x04060b); s.fog = new THREE.Fog(0x04060b, 16, 44);
    const env = new THREE.Scene();
    env.add(new THREE.Mesh(new THREE.BoxGeometry(30, 14, 30), new THREE.MeshBasicMaterial({ color: 0x0b0e15, side: THREE.BackSide })));
    const panel = (w, h, x, y, z, c, ry = 0, rx = 0) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: c, side: THREE.DoubleSide })); m.position.set(x, y, z); m.rotation.set(rx, ry, 0); env.add(m); };
    panel(12, 5, 0, 6.8, 0, new THREE.Color(1.5, 1.5, 1.6), 0, Math.PI / 2);
    panel(9, 3, -14.5, 3, 0, new THREE.Color(0.1, 1.0, 1.4), Math.PI / 2);
    panel(9, 3, 14.5, 3, 0, new THREE.Color(1.4, 0.2, 0.7), Math.PI / 2);
    panel(14, 2.5, 0, 3, -14.5, new THREE.Color(0.9, 0.9, 1.0));
    panel(14, 2, 0, 2.5, 14.5, new THREE.Color(0.6, 0.6, 0.7));
    const pm = new THREE.PMREMGenerator(game.renderer); this.envRT = pm.fromScene(env, 0.035); pm.dispose();
    s.environment = this.envRT.texture;
    const floor = new THREE.Mesh(new THREE.CircleGeometry(44, 64).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x090c13, roughness: 0.3, metalness: 0.6 }));
    floor.receiveShadow = true; s.add(floor);
    const grid = new THREE.GridHelper(88, 88, 0x14405a, 0x0c1d2a); grid.material.transparent = true; grid.material.opacity = 0.35; grid.position.y = 0.003; s.add(grid);
    const plat = new THREE.Mesh(new THREE.CylinderGeometry(3.3, 3.5, 0.24, 72), new THREE.MeshStandardMaterial({ color: 0x141821, roughness: 0.42, metalness: 0.7 }));
    plat.position.y = 0.12; plat.receiveShadow = true; s.add(plat);
    this.ring = new THREE.Mesh(new THREE.TorusGeometry(3.42, 0.035, 8, 140), new THREE.MeshStandardMaterial({ color: 0x00262c, emissive: 0x00e5ff, emissiveIntensity: 3.5 }));
    this.ring.rotation.x = Math.PI / 2; this.ring.position.y = 0.2; s.add(this.ring);
    for (let k = 0; k < 11; k++) {
      const a = -1.4 + k * 0.28, c = k % 2 ? 0xff2d78 : 0x00e5ff;
      const bar = new THREE.Mesh(new THREE.BoxGeometry(0.14, 5 + (k % 3) * 1.4, 0.14), new THREE.MeshStandardMaterial({ color: 0x000000, emissive: c, emissiveIntensity: 2.4 }));
      bar.position.set(Math.sin(a) * 17, 3, -Math.cos(a) * 17); s.add(bar);
    }
    s.add(new THREE.HemisphereLight(0x8fb4ff, 0x0a0a10, 0.35));
    const key = new THREE.SpotLight(0xffffff, 150, 34, 0.62, 0.7, 1.4); key.position.set(3, 9, 5); key.castShadow = true;
    key.shadow.mapSize.set(1024, 1024); key.shadow.bias = -0.0004; s.add(key, key.target);
    const rimA = new THREE.PointLight(0x00e5ff, 30, 24, 1.4); rimA.position.set(-6, 2.5, -3); s.add(rimA);
    const rimB = new THREE.PointLight(0xff2d78, 30, 24, 1.4); rimB.position.set(6, 2.5, -4); s.add(rimB);
    this.camera = new THREE.PerspectiveCamera(38, innerWidth / innerHeight, 0.1, 150);
    this.camera.position.set(8, 3, 9); this.look = new THREE.Vector3(0, 0.6, 0);
    this.rig = new LightRig(s);
    this.mode = 'menu'; this.rot = 0.8; this.inst = null; this.pop = 0;
  }
  setCar(id, color) {
    if (this.inst && this.carId === id && this.color === color) return;
    if (this.inst) { this.scene.remove(this.inst.root); CarFactory.disposeInstance(this.inst); }
    this.inst = CarFactory.create(id, color, { shadows: true });
    this.inst.root.position.y = 0.24; this.scene.add(this.inst.root);
    this.rig.attach(this.inst); this.rig.set(30, 0.5);        // faróis reais iluminando o piso do estúdio
    this.carId = id; this.color = color; this.pop = 1;
  }
  refresh(id) { if (this.inst && this.carId === id) { const c = this.color; this.carId = null; this.setCar(id, c); } }   // modelo glTF chegou
  setMode(m) { this.mode = m; }
  update(dt) {
    if (this.mode === 'free') return;
    this.rot += dt * 0.32;
    if (this.inst) {
      this.inst.root.rotation.y = this.rot; this.pop = Math.max(0, this.pop - dt * 3);
      const s = 1 + Math.sin(this.pop * Math.PI) * 0.05; this.inst.root.scale.setScalar(s);
    }
    const wide = innerWidth > 900 || (innerWidth > innerHeight && innerHeight < 560);   // celular deitado usa o layout largo
    let pos, look;
    if (this.mode === 'garage') { pos = wide ? [7.4, 2.5, 8.6] : [7.0, 3.6, 8.6]; look = wide ? [0, 0.45, 0] : [0, -2.8, 0]; }
    else if (this.mode === 'setup') { pos = [7.5, 3.4, 8.5]; look = [0, 0.4, 0]; }
    else { pos = wide ? [6.4, 2.0, 7.6] : [8.0, 3.0, 9.8]; look = wide ? [-1.9, 0.75, 0.3] : [0, -2.6, 0]; }
    const c = this.camera, k = 1 - Math.exp(-3 * dt);
    const fov = c.aspect < 1 ? 38 + (1 - c.aspect) * 48 : 38;
    if (Math.abs(c.fov - fov) > 0.01) { c.fov = fov; c.updateProjectionMatrix(); }
    c.position.x += (pos[0] - c.position.x) * k; c.position.y += (pos[1] - c.position.y) * k; c.position.z += (pos[2] - c.position.z) * k;
    this.look.x += (look[0] - this.look.x) * k; this.look.y += (look[1] - this.look.y) * k; this.look.z += (look[2] - this.look.z) * k;
    c.lookAt(this.look);
    this.ring.material.emissiveIntensity = 3 + Math.sin(performance.now() * 0.003) * 0.8;
  }
}

/* =====================================================================
   INTERFACE MANAGER — menus, nível, garagem, HUD e painel de resultados
   ===================================================================== */
class InterfaceManager {
  constructor(game) {
    this.game = game; this.E = game.economy;
    this.screens = {};
    for (const k of ['menu', 'setup', 'garage', 'help', 'settings', 'pause', 'results']) this.screens[k] = $('screen-' + k);
    const last = this.E.data.last;
    this.current = null; this.garageView = this.E.data.selected; this.garageClass = CARS[this.garageView].cls;
    this.setupTrack = TRACK_DEFS[last.track] && this.E.trackUnlocked(last.track) ? last.track : this.E.stageTrack();
    this.setupDiff = DIFFICULTY[last.diff] ? last.diff : 'easy';
    this.setupMode = last.mode === 'trial' ? 'trial' : 'race';
    this.h = {};
    for (const id of ['hud-pos', 'hud-lap', 'hud-laptime', 'hud-time', 'hud-best', 'hud-coins', 'hud-score', 'nitro-pct', 'countdown', 'hud-msg', 'wrongway', 'drift-meter', 'drift-pts', 'drift-mult', 'popups', 'speedfx', 'fps', 'hud-ghost', 'hud-ghost-row', 'hud-sector-t']) this.h[id] = $(id);
    this.cache = {}; this.popN = 0;
    this.isTouch = matchMedia('(pointer: coarse)').matches || (navigator.maxTouchPoints > 0 && !matchMedia('(pointer: fine)').matches);
    this.campaign = new CampaignMap(this, $('camp-map')); this._pts = {};
    this.bind(); this.refreshCoins(); this.renderLevel(); this.applySettingsUI();
  }
  get A() { return this.game.audio; }
  bind() {
    const tap = (fn) => (e) => { this.A.init(); this.A.click(); fn(e); };
    document.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', tap(() => this.show(b.dataset.go))));
    document.querySelectorAll('.btn').forEach((b) => b.addEventListener('mouseenter', () => this.A.ok && this.A.hover()));
    $('btn-start-race').addEventListener('click', tap(() => this.game.startRace(this.setupTrack, this.setupDiff, this.setupMode)));
    $('diff-list').querySelectorAll('.diff-btn').forEach((b) => b.addEventListener('click', tap(() => { this.setupDiff = b.dataset.diff; this.renderSetup(); })));
    $('mode-list').querySelectorAll('.mode-btn').forEach((b) => b.addEventListener('click', tap(() => { this.setupMode = b.dataset.mode; this.renderSetup(); })));
    $('gd-prev').addEventListener('click', tap(() => this.pageCar(-1)));
    $('gd-next').addEventListener('click', tap(() => this.pageCar(1)));
    $('btn-mute').addEventListener('click', () => { this.A.init(); const m = this.A.toggleMute(); setIcon($('btn-mute'), m ? 'mute' : 'sound'); });
    // campanha: setas do teclado percorrem as etapas do mapa
    addEventListener('keydown', (e) => {
      if (this.current !== 'setup' || (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft')) return;
      const i = TRACK_ORDER.indexOf(this.setupTrack), j = (i + (e.key === 'ArrowRight' ? 1 : -1) + TRACK_ORDER.length) % TRACK_ORDER.length;
      this.pickTrack(TRACK_ORDER[j]);
    });
    const act = (sel, fn) => document.querySelectorAll(sel).forEach((b) => b.addEventListener('click', tap(() => fn(b.dataset.act))));
    act('#screen-pause [data-act]', (a) => { if (a === 'resume') this.game.togglePause(); else if (a === 'restart') this.game.restartRace(); else this.game.quitRace(); });
    act('#screen-results [data-act]', (a) => { if (a === 'again') this.game.restartRace(); else this.game.quitRace(a === 'garage' ? 'garage' : a === 'campaign' ? 'setup' : 'menu'); });
    const vol = $('set-volume');
    vol.addEventListener('input', () => { this.A.init(); this.A.setVolume(+vol.value); this.E.data.settings.volume = +vol.value; this.E.save(); });
    $('set-quality').querySelectorAll('button').forEach((b) => b.addEventListener('click', tap(() => { this.game.setQuality(b.dataset.q); this.applySettingsUI(); this.toast('Qualidade: ' + b.textContent + ' (sombras/relevo na próxima corrida)', 'ok'); })));
    $('set-fps').querySelectorAll('button').forEach((b) => b.addEventListener('click', tap(() => { this.E.data.settings.fps = b.dataset.v === '1'; this.E.save(); this.applySettingsUI(); })));
    $('btn-reset').addEventListener('click', tap(() => {
      if (!confirm('Apagar moedas, nível, carros, upgrades e fantasmas salvos?')) return;
      this.E.reset(); this.garageView = 'civic'; this.garageClass = 'urban'; this.setupTrack = TRACK_ORDER[0];
      this.refreshCoins(); this.renderLevel(); this.renderMenu(); this.game.onScreen('settings'); this.toast('Progresso apagado', 'ok');
    }));
  }
  applySettingsUI() {
    const S = this.E.data.settings;
    $('set-volume').value = S.volume;
    $('set-quality').querySelectorAll('button').forEach((b) => b.classList.toggle('sel', b.dataset.q === this.game.qName));
    $('set-fps').querySelectorAll('button').forEach((b) => b.classList.toggle('sel', (b.dataset.v === '1') === !!S.fps));
    this.h.fps.style.display = S.fps ? 'block' : 'none';
  }
  show(name) {
    for (const [k, el] of Object.entries(this.screens)) el.classList.toggle('active', k === name);
    this.current = name;
    const menus = ['menu', 'setup', 'garage', 'help', 'settings'].includes(name);
    $('topbar').classList.toggle('hidden', !menus);                  // resultados têm saldo e barra de XP próprios
    $('vignette').style.opacity = menus ? 1 : 0;
    if (menus) this.renderLevel();
    if (name === 'garage') this.renderGarage();
    if (name === 'setup') this.renderSetup();
    if (name === 'menu') this.renderMenu();
    this.game.onScreen(name);
  }
  loading(on, text) {
    const L = $('loading');
    if (on) { $('loading-text').textContent = text || 'CARREGANDO…'; $('loading-bar').style.width = '15%'; L.classList.remove('hide'); requestAnimationFrame(() => ($('loading-bar').style.width = '85%')); }
    else { $('loading-bar').style.width = '100%'; setTimeout(() => L.classList.add('hide'), 150); }
  }
  toast(msg, type = '', icon = null) {
    const t = $('toast'); t.innerHTML = svgIcon(icon || (type === 'err' ? 'warning' : type === 'ok' ? 'check' : 'info')) + '<span></span>'; t.lastChild.textContent = msg; t.className = 'glass show ' + type;
    clearTimeout(this._tt); this._tt = setTimeout(() => (t.className = 'glass ' + type), 2400);
  }
  refreshCoins(bump = false) {
    const el = $('coin-balance'); el.textContent = this.E.coins.toLocaleString('pt-BR');
    if (bump) { el.classList.remove('coin-bump'); void el.offsetWidth; el.classList.add('coin-bump'); }
  }
  // barra de nível permanente (topo dos menus): "Nível 5 [=====] 450 / 2.000 XP"
  renderLevel() {
    const p = this.E.xpProgress();
    $('lvl-num').textContent = p.level; $('lvl-label').textContent = 'NÍVEL ' + p.level;
    $('lvl-xp').textContent = `${p.cur.toLocaleString('pt-BR')} / ${p.need.toLocaleString('pt-BR')} XP`;
    $('lvl-bar').style.width = (p.frac * 100).toFixed(1) + '%';
  }
  renderMenu() {
    const st = this.E.data.stats, id = this.E.data.selected;
    $('menu-stats').textContent = `${st.races} corridas · ${st.wins} vitórias · campanha ${this.E.wonCount()}/${TRACK_ORDER.length}`;
    $('menu-car-name').textContent = CARS[id].full;
    if (this.E.migrated3 && !this._mig3) { this._mig3 = true; setTimeout(() => this.toast('Save da v2 convertido: carros, moedas e nível mantidos — campanha nova nos circuitos reais', 'ok'), 900); }
    if (this.E.migrated && !this._migShown) { this._migShown = true; setTimeout(() => this.toast(`Save convertido para a v2: +${this.E.migrated.refund.toLocaleString('pt-BR')} moedas e ${this.E.migrated.xp.toLocaleString('pt-BR')} XP`, 'ok'), 900); }
  }

  // ---------- campanha: mapa-múndi + painel da etapa ----------
  pickTrack(id) { if (!TRACK_DEFS[id]) return; this.A.init(); this.A.click(); this.setupTrack = id; this.renderSetup(); }
  renderSetup() {
    const E = this.E, id = TRACK_DEFS[this.setupTrack] ? this.setupTrack : TRACK_ORDER[0], d = TRACK_DEFS[id], k = TRACK_ORDER.indexOf(id), trial = this.setupMode === 'trial';
    const lk = E.trackLock(id);
    this.campaign.render(id);
    $('camp-prog').innerHTML = `${svgIcon('trophy')}<b>${E.wonCount()}</b> / ${TRACK_ORDER.length} ETAPAS VENCIDAS`;
    $('cs-stage').textContent = `ETAPA ${k + 1} / ${TRACK_ORDER.length} · ${d.country.toUpperCase()}`;
    $('cs-name').textContent = d.name; $('screen-setup').style.setProperty('--tc', d.color);
    $('cs-full').textContent = `${d.full} — ${d.city}`;
    const pts = this._pts[id] || (this._pts[id] = new THREE.CatmullRomCurve3(d.points(), true, 'centripetal').getSpacedPoints(360));
    let y0 = Infinity, y1 = -Infinity; for (const q of pts) { y0 = Math.min(y0, q.y); y1 = Math.max(y1, q.y); }
    const o = HudSVG.outline(pts, 300, 150, 14);
    $('cs-outline').innerHTML = `<svg viewBox="0 0 300 150" aria-hidden="true"><path d="${o.d}" class="ol-road"/><path d="${o.d}" class="ol-line"/><circle cx="${o.start[0].toFixed(1)}" cy="${o.start[1].toFixed(1)}" r="4.5" class="ol-start"/></svg>`;
    const facts = [['ruler', 'EXTENSÃO', (d.realLength / 1000).toFixed(2).replace('.', ',') + ' km'], ['turns', 'SETORES', String((d.names || []).length)], ['mountain', 'DESNÍVEL', Math.round(y1 - y0) + ' m'], ['laps', 'VOLTAS', String(trial ? d.trialLaps : d.laps)]];
    $('cs-facts').innerHTML = facts.map(([ic, l, v]) => `<div class="fact">${svgIcon(ic)}<span>${l}</span><b>${v}</b></div>`).join('');
    $('cs-desc').innerHTML = `<b class="cs-badge">${d.badge}</b><span></span>`; $('cs-desc').lastChild.textContent = d.desc;
    const rows = [[lk.levelOk, `NÍVEL ${d.level} DA CONTA`, `você: nível ${E.level}`]];
    if (lk.prev) rows.push([lk.prevOk, `VENCER ${TRACK_DEFS[lk.prev].name.toUpperCase()}`, '1º lugar no modo corrida']);
    $('cs-req').innerHTML = '<div class="req-t">REQUISITOS</div>' + rows.map(([ok, a, b]) => `<div class="req ${ok ? 'ok' : 'no'}">${svgIcon(ok ? 'check' : 'lock')}<span>${a}</span><small>${b}</small></div>`).join('') +
      (E.won(id) ? `<div class="req won">${svgIcon('trophy')}<span>ETAPA VENCIDA</span><small>próxima etapa liberada por esta vitória</small></div>` : '');
    const b = E.data.stats.best[id], g = GhostSystem.load(id);
    $('cs-best').innerHTML = `<div>${svgIcon('flag')}<span>Melhor volta (corrida)</span><b>${b ? fmtTime(b) : '--:--.---'}</b></div><div>${svgIcon('ghost')}<span>Recorde do ghost</span><b>${g ? fmtTime(g.lap) : '--:--.---'}</b></div>`;
    $('mode-list').querySelectorAll('.mode-btn').forEach((m) => m.classList.toggle('sel', m.dataset.mode === this.setupMode));
    $('diff-block').classList.toggle('diff-off', trial);
    $('diff-list').querySelectorAll('.diff-btn').forEach((m) => m.classList.toggle('sel', m.dataset.diff === this.setupDiff));
    $('setup-sub').textContent = trial ? `${d.trialLaps} voltas contra o relógio · sem IAs · o fantasma reproduz sua melhor volta` : `${d.laps} ${d.laps > 1 ? 'voltas' : 'volta'} · ${NUM_AI + 1} carros no grid · vença para liberar a próxima etapa`;
    const btn = $('btn-start-race'); btn.disabled = !lk.ok;
    btn.innerHTML = lk.ok ? `<span class="ic">${svgIcon('play')}</span>${trial ? 'INICIAR TREINO' : 'INICIAR CORRIDA'}` : `<span class="ic">${svgIcon('lock')}</span>BLOQUEADO`;
    $('setup-car').textContent = CARS[E.data.selected].full;
  }

  // ---------- garagem (23 carros em 4 classes, com abas e paginação) ----------
  pageCar(dir) {
    const i = CAR_LIST.indexOf(this.garageView), j = (i + dir + CAR_LIST.length) % CAR_LIST.length;
    this.garageView = CAR_LIST[j]; this.garageClass = CARS[this.garageView].cls; this.renderGarage();
  }
  // selo da origem do modelo 3D do carro exibido (glTF externo / baixando / fallback procedural PBR)
  renderModelStatus() {
    const el = $('gd-model'); if (!el) return;
    const id = this.garageView, st = CarFactory.externalStatus(id), cfg = EXTERNAL_MODELS[id];
    const txt = { none: 'MODELO PROCEDURAL PBR', idle: 'MODELO glTF NA FILA', loading: 'BAIXANDO glTF + DRACO ' + Math.round(CarFactory.externalProgress(id) * 100) + '%', ok: 'MODELO glTF EXTERNO + DRACO', failed: 'SEM CONEXÃO · FALLBACK PBR' }[st] || '';
    const ic = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.8 20.5 7.5v9L12 21.2 3.5 16.5v-9z M3.5 7.5 12 12.2l8.5-4.7 M12 12.2v9" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"/></svg>';
    el.className = 'gd-model ' + st; el.innerHTML = ic + '<span>' + txt + '</span>';
    el.title = cfg ? cfg.name + ' — ' + cfg.credit + (st === 'failed' ? ' | erro: ' + CarFactory.extError[id] : '') : 'Carroceria gerada por código: pintura com flocos metálicos, verniz (clearcoat) e reflexos do ambiente';
  }
  renderGarage() {
    const E = this.E, lv = E.level;
    const tabs = $('class-tabs'); tabs.innerHTML = '';
    for (const cl of CLASS_ORDER) {
      const C = CLASSES[cl], open = lv >= C.level, ids = CAR_LIST.filter((id) => CARS[id].cls === cl), own = ids.filter((id) => E.owns(id)).length;
      const b = document.createElement('button'); b.className = 'cls-tab' + (cl === this.garageClass ? ' sel' : ''); b.style.setProperty('--tc', C.color);
      b.innerHTML = `${C.short}<span class="lk">${open ? `${own}/${ids.length}` : `${svgIcon('lock')}NV ${C.level}`}</span>`;
      b.addEventListener('click', () => { this.A.init(); this.A.click(); this.garageClass = cl; this.garageView = ids.includes(this.garageView) ? this.garageView : ids[0]; this.renderGarage(); });
      tabs.appendChild(b);
    }
    $('garage-count').textContent = `${E.data.owned.length}/${CAR_LIST.length}`;
    const list = $('car-list'); list.innerHTML = '';
    for (const id of CAR_LIST.filter((x) => CARS[x].cls === this.garageClass)) {
      const m = CARS[id], own = E.owns(id), sel = E.data.selected === id, open = E.carUnlocked(id);
      const card = document.createElement('div'); card.className = 'car-card' + (this.garageView === id ? ' view' : '') + (open || own ? '' : ' locked'); card.dataset.car = id;
      const badge = sel ? '<span class="badge selb">EM USO</span>' : own ? '<span class="badge own">NA GARAGEM</span>' : !open ? `<span class="badge lockb" title="Bloqueado - Requer Nível ${m.level}">${svgIcon('lock')}NÍVEL ${m.level}</span>` : `<span class="badge price"><span class="coin-ic ci"></span> ${m.price.toLocaleString('pt-BR')}</span>`;
      card.innerHTML = `<div class="cb">${m.brand.toUpperCase()}</div><div class="row"><span class="cn">${m.name}</span>${badge}</div><div class="ct">${m.tag}</div>`;
      card.addEventListener('click', () => { this.A.init(); this.A.click(); this.garageView = id; this.renderGarage(); });
      list.appendChild(card);
    }
    const id = this.garageView, m = CARS[id], st = E.stats(id), base = computeStats(id), own = E.owns(id), open = E.carUnlocked(id);
    $('gd-index').textContent = `${CAR_LIST.indexOf(id) + 1} / ${CAR_LIST.length}`;
    $('gd-tag').textContent = `${CLASSES[m.cls].short} · ${m.tag.toUpperCase()}`; $('gd-tag').style.color = CLASSES[m.cls].color;
    $('gd-brand').textContent = m.brand.toUpperCase(); $('gd-name').textContent = m.name; $('gd-desc').textContent = m.desc;
    this.renderModelStatus();
    const bars = [
      ['VELOCIDADE MÁX.', st.top * 3.6 * 0.95, base.top * 3.6 * 0.95, 420, ' km/h'],
      ['ACELERAÇÃO', st.accel, base.accel, 25, ''],
      ['ADERÊNCIA', st.grip, base.grip, 3.6, ''],
      ['NITRO', st.nitro * st.nitroRegen, base.nitro, 44, ''],
    ];
    $('gd-stats').innerHTML = bars.map(([l, v, b, max, u]) => `<div class="stat"><div class="sl"><span>${l}</span><b>${u ? Math.round(v) + u : Math.round((v / max) * 100)}</b></div><div class="bar"><i class="up" style="width:${clamp((v / max) * 100, 3, 100)}%"></i><i style="width:${clamp((b / max) * 100, 3, 100)}%"></i></div></div>`).join('');
    const act = $('gd-action');
    if (own) act.innerHTML = E.data.selected !== id ? `<button class="btn center" id="gd-select"><span class="ic">${svgIcon('check')}</span>USAR ESTE CARRO</button>` : `<div class="badge selb sel-big">${svgIcon('check')}CARRO SELECIONADO</div>`;
    else if (!open) act.innerHTML = `<div class="lockbox">${svgIcon('lock')}Bloqueado - Requer Nível ${m.level}<small>Você está no nível ${lv}. Preço após desbloquear: ${m.price.toLocaleString('pt-BR')} moedas.</small></div>`;
    else act.innerHTML = `<button class="btn primary center" id="gd-buy">COMPRAR <i class="sep"></i><span class="coin-ic ci"></span> ${m.price.toLocaleString('pt-BR')}</button>`;
    const buy = $('gd-buy');
    if (buy) buy.addEventListener('click', () => {
      this.A.init(); const r = E.buyCar(id);
      if (r.ok) { this.A.purchase(); this.toast(r.msg, 'ok'); this.refreshCoins(true); } else { this.A.error(); this.toast(r.msg, 'err'); }
      this.renderGarage();
    });
    const selB = $('gd-select');
    if (selB) selB.addEventListener('click', () => { this.A.init(); this.A.click(); E.select(id); this.toast(`${m.full} selecionado`, 'ok'); this.renderGarage(); });
    const ul = $('upgrade-list'); ul.innerHTML = '';
    for (const k of Object.keys(UPGRADES)) {
      const U = UPGRADES[k], l = E.upLevel(id, k), cost = E.upgradeCost(id, k);
      const row = document.createElement('div'); row.className = 'up-row';
      row.innerHTML = `<div class="uh"><div><div class="un">${svgIcon(U.icon)}${U.name}</div><div class="ud">${U.desc}</div></div>
        <button class="up-btn" data-up="${k}" ${cost == null || !own ? 'disabled' : ''}>${cost == null ? 'MÁX' : `<span class="coin-ic"></span>${cost.toLocaleString('pt-BR')}`}</button></div>
        <div class="pips">${Array.from({ length: MAX_LEVEL }, (_, i) => `<i class="${i < l ? 'on' : ''}"></i>`).join('')}</div>`;
      row.querySelector('button').addEventListener('click', () => {
        this.A.init(); const r = E.upgrade(id, k);
        if (r.ok) { this.A.purchase(); this.toast(r.msg, 'ok'); this.refreshCoins(true); this.game.showroom.pop = 1; } else { this.A.error(); this.toast(r.msg, 'err'); }
        this.renderGarage();
      });
      ul.appendChild(row);
    }
    if (!own) { const nt = document.createElement('div'); nt.className = 'ud'; nt.style.color = 'var(--muted)'; nt.textContent = 'Compre este carro para liberar a tunagem.'; ul.appendChild(nt); }
    const cl = $('color-list'); cl.innerHTML = '';
    for (const c of m.colors) {
      const b = document.createElement('button'); b.style.background = c; b.style.color = c; b.title = 'Pintura';
      if (E.color(id) === c) b.classList.add('sel');
      b.addEventListener('click', () => { this.A.init(); this.A.click(); E.setColor(id, c); this.renderGarage(); });
      cl.appendChild(b);
    }
    this.game.showroom.setCar(id, E.color(id));
  }

  // ---------- HUD ----------
  initHUD(race) {
    this.cache = {}; this.race = race;
    this.initMinimap(race.track); this.initSpeedo();
    this.h['popups'].innerHTML = ''; this.h['hud-msg'].classList.remove('show'); this.h['countdown'].className = '';
    this.h['hud-ghost-row'].classList.remove('on');
    $('touch').classList.toggle('on', this.isTouch);
    $('hud-hint').style.display = this.isTouch ? 'none' : '';
    $('pause-restart').textContent = race.trial ? 'REINICIAR TREINO' : 'REINICIAR CORRIDA';
    this.set('hud-sector-t', '');
  }
  initMinimap(T) { this.mm = HudSVG.minimap($('minimap'), T); }
  drawMinimap(race) {
    const M = this.mm; if (!M) return;
    const ai = race.cars.filter((c) => !c.isPlayer);
    if (M.dots.length !== ai.length) { M.cars.innerHTML = ai.map(() => `<circle r="${(2 * M.k).toFixed(2)}" class="mm-ai"/>`).join(''); M.dots = [...M.cars.children]; }
    ai.forEach((c, i) => { const el = M.dots[i]; el.setAttribute('cx', c.x.toFixed(1)); el.setAttribute('cy', c.z.toFixed(1)); });
    const gv = !!(race.ghost && race.ghost.inst && race.ghost.inst.root.visible);
    if (gv) { const p = race.ghost.inst.root.position; M.ghost.setAttribute('cx', p.x.toFixed(1)); M.ghost.setAttribute('cy', p.z.toFixed(1)); } else if (M.gOn) M.ghost.setAttribute('cx', '-99999');
    M.gOn = gv;
    const P = race.player;
    M.player.setAttribute('transform', `translate(${P.x.toFixed(1)} ${P.z.toFixed(1)}) rotate(${(180 - (P.heading * 180) / Math.PI).toFixed(1)})`);
  }
  initSpeedo() { this.sp = HudSVG.speedo($('speedo')); this.nb = HudSVG.nitro($('nitro-bar')); }
  drawSpeedo(kmh, rpmN, gear, nitro) {
    const s = this.sp; if (!s) return;
    const L = s.last, f = Math.round(clamp(kmh / s.max, 0, 1) * 1000);
    if (L.f !== f) { L.f = f; s.fill.setAttribute('stroke-dashoffset', 1000 - f); s.needle.setAttribute('transform', `rotate(${(s.A0 + (f / 1000) * s.SW).toFixed(1)} 120 120)`); }
    const r = Math.round(clamp(rpmN, 0, 1) * 200) * 5;
    if (L.r !== r) { L.r = r; s.rpm.setAttribute('stroke-dashoffset', 1000 - r); const red = r > 900; if (L.red !== red) { L.red = red; s.rpm.classList.toggle('red', red); } }
    const k = String(Math.round(kmh)); if (L.k !== k) { L.k = k; s.kmh.textContent = k; }
    if (L.g !== gear) { L.g = gear; s.gear.textContent = gear; }
    if (L.n !== nitro) { L.n = nitro; s.root.classList.toggle('nitro', nitro); }
  }
  set(id, v, html = false) { if (this.cache[id] !== v) { this.cache[id] = v; if (html) this.h[id].innerHTML = v; else this.h[id].textContent = v; } }
  updateHUD(race) {
    const P = race.player, h = this.h;
    if (race.trial) {
      const done = P.lapTimes.length, timed = P.crossings >= 1;
      this.set('hud-pos', timed ? `${Math.min(done + 1, race.totalLaps)}<small>/${race.totalLaps}</small>` : '<small style="font-size:24px;color:#fff">OUT</small>', true);
      this.set('hud-lap', P.finished ? 'FIM DO TREINO' : timed ? 'MODO TREINO' : 'AQUECIMENTO');
      this.set('hud-laptime', timed ? fmtTime(P.finished ? P.lapTimes[done - 1] : Math.max(0, race.time - P.lapStart)) : '--:--.---');
      const pb = race.ghost.best ? race.ghost.best.lap : P.bestLap;
      this.set('hud-best', fmtTime(pb));
      const dl = P.finished ? null : race.ghost.delta();
      const on = dl != null;
      if (this.cache.gOn !== on) { this.cache.gOn = on; h['hud-ghost-row'].classList.toggle('on', on); }
      if (on) {
        const txt = (dl <= 0 ? '−' : '+') + Math.abs(dl).toFixed(2) + 's';
        this.set('hud-ghost', txt); const cls = dl <= 0 ? 'ahead' : 'behind';
        if (this.cache.gCls !== cls) { this.cache.gCls = cls; h['hud-ghost'].className = cls; }
      }
    } else {
      this.set('hud-pos', `${P.rank}º<small>/${race.cars.length}</small>`, true);
      this.set('hud-lap', P.finished ? 'CHEGADA!' : `VOLTA ${clamp(P.crossings, 1, race.totalLaps)}/${race.totalLaps}`);
      this.set('hud-laptime', fmtTime(P.finished ? P.lapTimes[P.lapTimes.length - 1] : Math.max(0, race.time - P.lapStart)));
      this.set('hud-best', fmtTime(P.bestLap));
    }
    this.set('hud-time', fmtTime(Math.max(0, P.finished ? P.finishTime : race.time)));
    this.set('hud-coins', String(race.raceCoins));
    this.set('hud-score', Math.floor(race.score).toLocaleString('pt-BR'));
    const np = Math.round(P.nitro * 100);
    if (this.cache.np !== np) {
      this.cache.np = np; h['nitro-pct'].textContent = np + '%';
      const on = Math.round(P.nitro * this.nb.segs.length); if (this.nb.on !== on) { this.nb.on = on; this.nb.segs.forEach((r, i) => r.classList.toggle('on', i < on)); }
    }
    if (this.cache.nOn !== P.nitroOn) { this.cache.nOn = P.nitroOn; $('nitro-bar').classList.toggle('active', P.nitroOn); }
    const sec = race.track.sectionAt(P.s); this.set('hud-sector-t', sec ? sec.toUpperCase() : '');
    const D = race.drift, showD = D.active && D.pts > 8;
    if (this.cache.dShow !== showD) { this.cache.dShow = showD; h['drift-meter'].classList.toggle('show', showD); }
    if (showD) { this.set('drift-pts', String(Math.round(D.pts))); this.set('drift-mult', 'x' + D.mult.toFixed(1)); }
    const ww = race.wrongT > 1.2;
    if (this.cache.ww !== ww) { this.cache.ww = ww; h.wrongway.style.display = ww ? 'flex' : 'none'; }
    const kmh = P.speed * 3.6;
    const fx = P.nitroOn ? 0.95 : clamp((kmh - 230) / 160, 0, 0.3);
    this.cache.fx = damp(this.cache.fx || 0, fx, 6, 1 / 60);
    h.speedfx.style.opacity = this.cache.fx.toFixed(3);
    const gear = P.gear === 0 ? 'R' : String(P.gear);
    this.drawSpeedo(kmh, clamp(P.rpm / (P.stats.red || 8500), 0, 1), gear, P.nitroOn);
    this.drawMinimap(race);
  }
  bumpHudCoins() { const el = this.h['hud-coins']; el.classList.remove('coin-bump'); void el.offsetWidth; el.classList.add('coin-bump'); }
  popup(text, color = '#fff', html = false) {
    const el = document.createElement('div'); el.className = 'popup'; if (html) el.innerHTML = text; else el.textContent = text; el.style.color = color;
    el.style.top = -(this.popN % 4) * 44 + 'px'; this.popN++;
    this.h.popups.appendChild(el); setTimeout(() => { el.remove(); this.popN = Math.max(0, this.popN - 1); }, 1600);
  }
  countdown(text, go = false) { const el = this.h.countdown; el.textContent = text; el.className = ''; void el.offsetWidth; el.className = 'show' + (go ? ' go' : ''); }
  message(text, dur = 2, icon = null) { const el = this.h['hud-msg']; el.innerHTML = (icon ? svgIcon(icon) : '') + '<span></span>'; el.lastChild.textContent = text; el.classList.add('show'); clearTimeout(this._mt); this._mt = setTimeout(() => el.classList.remove('show'), dur * 1000); }
  showResults(r) {
    const pe = $('res-pos');
    if (r.trial) {
      $('res-title').textContent = `TREINO · ${r.track.toUpperCase()} · ${r.car.toUpperCase()}`;
      pe.textContent = r.newPB ? 'NOVO RECORDE!' : 'TREINO CONCLUÍDO'; pe.className = 'res-pos' + (r.newPB ? ' p1' : ''); pe.style.fontSize = '52px';
      $('res-k1').firstChild.textContent = 'RECORDE (GHOST)'; $('res-time').textContent = fmtTime(r.pb);
      const best = Math.min(...r.laps);
      $('res-standings').innerHTML = r.laps.map((t, i) => `<tr class="${t === best ? 'me' : ''}"><td>V${i + 1}</td><td>${t === best ? svgIcon('star', 'gold') + 'Melhor volta da sessão' : 'Volta ' + (i + 1)}</td><td class="${t <= r.pb + 1e-6 ? 'pb' : ''}">${fmtTime(t)}</td></tr>`).join('');
      $('res-rewards').innerHTML = `<div class="rw"><span>Moedas coletadas na pista</span><b>+${r.raceCoins}</b></div><div class="rw total"><span>TOTAL GANHO</span><b><span class="coin-ic ci"></span> ${r.total.toLocaleString('pt-BR')}</b></div><div class="rw"><span>Novo saldo</span><b>${r.balance.toLocaleString('pt-BR')}</b></div>`;
      $('res-again').textContent = 'TENTAR BATER O GHOST';
    } else {
      $('res-title').textContent = `${r.track.toUpperCase()} · ${r.diff.toUpperCase()}`;
      pe.textContent = `${r.pos}º LUGAR`; pe.className = 'res-pos' + (r.pos === 1 ? ' p1' : ''); pe.style.fontSize = '';
      $('res-k1').firstChild.textContent = 'TEMPO TOTAL'; $('res-time').textContent = fmtTime(r.totalTime);
      $('res-standings').innerHTML = r.standings.map((s) => `<tr class="${s.me ? 'me' : ''}"><td>${s.pos}º</td><td><span class="dot" style="background:${s.color}"></span>${s.name} <small style="color:var(--muted)">${s.model}</small></td><td>${s.time}</td></tr>`).join('');
      const rows = [['Moedas coletadas na pista', `+${r.raceCoins}`], [`Prêmio pela posição (${r.pos}º)`, `+${r.posCoins}`], [`Bônus de score (${r.score.toLocaleString('pt-BR')} pts)`, `+${r.scoreCoins}`], ['Multiplicador de dificuldade', `x${r.mult}`]];
      $('res-rewards').innerHTML = rows.map(([a, b]) => `<div class="rw"><span>${a}</span><b>${b}</b></div>`).join('') +
        `<div class="rw total"><span>TOTAL GANHO</span><b><span class="coin-ic ci"></span> ${r.total.toLocaleString('pt-BR')}</b></div><div class="rw"><span>Novo saldo</span><b>${r.balance.toLocaleString('pt-BR')}</b></div>`;
      $('res-again').textContent = 'CORRER NOVAMENTE';
    }
    $('res-best').textContent = fmtTime(r.bestLap); $('res-score').textContent = r.score.toLocaleString('pt-BR');
    if (r.xp && r.xp.trackIds && r.xp.trackIds.length) this.setupTrack = r.xp.trackIds[0];   // próxima etapa liberada já fica selecionada no mapa
    this.renderXP(r.xp);
    this.show('results');
    [...document.querySelectorAll('#res-rewards .rw')].forEach((el, i) => setTimeout(() => { el.classList.add('show'); if (this.A.ok) this.A.tone(700 + i * 120, 0.08, 'triangle', 0.08); }, 350 + i * 260));
    setTimeout(() => this.refreshCoins(true), 1400);
    $('hud').classList.remove('active');
  }
  renderXP(x) {
    const p = this.E.xpProgress(), up = x.after > x.before, nu = this.E.nextUnlock();
    const next = nu ? `<div class="xp-next">${svgIcon('unlock')}Próximo desbloqueio no nível ${nu.level}: ${nu.names.join(' · ')}</div>` : '';
    const camp = (x.stageWon ? `<div class="camp-won">${svgIcon('trophy')}ETAPA VENCIDA${x.tracks && x.tracks.length ? `<small>Nova etapa liberada no mapa: ${x.tracks.join(' · ')}</small>` : '<small>vitória registrada na campanha</small>'}</div>`
      : x.tracks && x.tracks.length ? `<div class="camp-won">${svgIcon('unlock')}NOVA ETAPA LIBERADA<small>${x.tracks.join(' · ')}</small></div>` : '');
    $('res-xp').innerHTML = `${camp}<div class="xp-box"><div class="xp-head"><span>${svgIcon('star', 'gold')}EXPERIÊNCIA</span><b>+${x.total.toLocaleString('pt-BR')} XP</b></div>
      <div class="xp-lines">${x.rows.map(([a, b]) => `<span>${a}</span><b>${b}</b>`).join('')}</div>
      <div class="xp-lv"><span>NÍVEL ${p.level}</span><span>${p.cur.toLocaleString('pt-BR')} / ${p.need.toLocaleString('pt-BR')} XP</span></div>
      <div class="xpbar"><i id="res-xpbar"></i></div>
      ${up ? `<div class="lvlup">${svgIcon('levelup')}SUBIU PARA O NÍVEL ${x.after}!<small>${x.unlocked.length ? 'Desbloqueado: ' + x.unlocked.join(' · ') : 'Nada novo neste nível — continue evoluindo!'}</small></div>` : ''}${next}</div>`;
    setTimeout(() => { const b = $('res-xpbar'); if (b) b.style.width = (p.frac * 100).toFixed(1) + '%'; }, 450);
    if (up) setTimeout(() => this.A.ok && this.A.levelUp(), 900);
    this.renderLevel();
  }
}

/* =====================================================================
   GAME — loop principal, renderização e estados
   ===================================================================== */
class Game {
  constructor() {
    this.economy = new EconomyManager();
    const S = this.economy.data.settings;
    this.audio = new AudioManager(); this.audio.volume = S.volume;
    this.qName = QUALITY[S.quality] ? S.quality : 'high'; this.q = QUALITY[this.qName];
    // Engine: renderer WebGL, pós-processamento, PMREM, loaders GLTF/Draco (src/Engine.js)
    this.engine = new Engine($('gl'), this.qName);
    this.renderer = this.engine.renderer; this.composer = this.engine.composer; this.bloom = this.engine.bloom; this.renderPass = this.engine.renderPass;
    this.camera = new THREE.PerspectiveCamera(64, innerWidth / innerHeight, 0.1, 9000);
    this.dynScale = 1; this.timeScale = 1; this.camMode = 0; this.state = 'menu'; this.race = null;
    this.input = new InputManager();
    this.showroom = new Showroom(this);
    this.ui = new InterfaceManager(this);
    this.showroom.setCar(this.economy.data.selected, this.economy.color(this.economy.data.selected));
    // modelos 3D externos (glTF + Draco) baixados em segundo plano; quando chegam, a garagem troca o carro na hora
    CarFactory.onExternal((id, st) => { if (st === 'ok') this.showroom.refresh(id); this.ui.renderModelStatus(); });
    setTimeout(() => CarFactory.preloadExternal(this.engine.models), 400);
    addEventListener('resize', () => this.resize());
    document.addEventListener('visibilitychange', () => { if (document.hidden && this.state === 'race' && this.race && !this.race.paused && !this.race.resultsShown) this.togglePause(); });
    addEventListener('beforeunload', (e) => { if (this.state === 'race' && this.race && !this.race.resultsShown) { e.preventDefault(); e.returnValue = ''; } });
    addEventListener('pointerdown', () => this.audio.init(), { once: true });
    addEventListener('keydown', () => this.audio.init(), { once: true });
    this.fpsAcc = 0; this.fpsN = 0; this.slowT = 0; this.fastT = 0;
    // gera a textura de asfalto (seco) em segundo plano enquanto o jogador está no menu
    setTimeout(() => { try { TextureLab.asphalt({ size: this.q.tex }); } catch (e) { console.warn(e); } }, 1200);
    this.loop = this.loop.bind(this); this.last = performance.now();
    requestAnimationFrame(this.loop);
  }
  applyPixelRatio() { this.engine.q = this.q; this.engine.dynScale = this.dynScale; this.engine.applyPixelRatio(); }
  setQuality(name) {
    this.qName = name; this.q = QUALITY[name]; this.economy.data.settings.quality = name; this.economy.save();
    this.dynScale = 1; this.engine.setQuality(name);
  }
  resize() {
    this.applyPixelRatio();
    this.camera.aspect = innerWidth / innerHeight; this.camera.updateProjectionMatrix();
    this.showroom.camera.aspect = innerWidth / innerHeight; this.showroom.camera.updateProjectionMatrix();
    if (this.race) { this.ui.initMinimap(this.race.track); this.ui.initSpeedo(); }
  }
  render(scene, camera) { this.engine.q = this.q; this.engine.render(scene, camera); }
  onScreen(name) {
    const E = this.economy;
    this.showroom.setMode(name === 'garage' ? 'garage' : name === 'setup' ? 'setup' : 'menu');
    if (['menu', 'setup', 'help', 'settings'].includes(name)) this.showroom.setCar(E.data.selected, E.color(E.data.selected));
  }
  setWeatherOverlay(w) {
    $('rainfx').classList.toggle('on', w === 'rain'); $('dropfx').classList.toggle('on', w === 'rain'); $('frostfx').classList.toggle('on', w === 'snow');
  }
  startRace(trackId, diffId, mode = 'race') {
    if (!this.economy.trackUnlocked(trackId)) { this.ui.toast(`${TRACK_DEFS[trackId].name} bloqueado: ${this.economy.lockReason(trackId)}`, 'err', 'lock'); this.audio.error(); return; }
    this.economy.data.last = { track: trackId, diff: diffId, mode }; this.economy.save();
    this.audio.init();
    if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); // Espaço (nitro) não pode "clicar" botões
    this.ui.show(null);
    this.ui.loading(true, (mode === 'trial' ? 'TREINO · ' : 'GERANDO ') + TRACK_DEFS[trackId].name.toUpperCase() + '…');
    this.state = 'loading';
    // se o modelo glTF do seu carro ainda está baixando, espera um pouco (máx. 8 s) antes de montar a corrida
    const sel = this.economy.data.selected, wait = CarFactory.externalStatus(sel) === 'loading'
      ? Promise.race([CarFactory.loadExternal(sel).catch(() => { }), new Promise((r) => setTimeout(r, 8000))]) : Promise.resolve();
    wait.then(() => setTimeout(async () => {
      try {
        this.disposeRace();
        const R = (this.race = new Race(this, trackId, diffId, mode));
        this.ui.initHUD(R);
        this.setWeatherOverlay(R.def.weather);
        // shaders compilados em paralelo (KHR_parallel_shader_compile) com a tela de carregamento ativa: nada de quadro congelado
        $('loading-text').textContent = 'PREPARANDO SHADERS…';
        // compila já com o alvo real (buffer HDR do compositor: sem tonemapping, espaço linear) → as chaves dos programas batem com o 1º quadro
        const rt = this.q.bloom ? this.engine.composer.renderTarget1 : null; this.renderer.setRenderTarget(rt);
        try { if (this.renderer.compileAsync) await this.renderer.compileAsync(R.scene, this.camera); else this.renderer.compile(R.scene, this.camera); }
        finally { this.renderer.setRenderTarget(null); }
        if (this.race !== R) return;                                   // outra corrida foi pedida durante a compilação
        window.__nitroLoad.compile = Math.round(performance.now() - window.__nitroLoad.t0);
        $('hud').classList.add('active');
        const P = this.race.player, aiKeys = [...new Set(this.race.ais.map((a) => a.car.stats.engine))];
        this.audio.startRace(P.stats.engine, P.stats.snd, aiKeys);
        this.state = 'race';
      } catch (e) {
        console.error(e); this.ui.toast('Erro ao gerar a pista: ' + e.message, 'err');
        this.disposeRace(); this.state = 'menu'; this.ui.show('menu');
      }
      this.ui.loading(false);
    }, 80));
  }
  restartRace() { const R = this.race; if (R) this.startRace(R.trackId, R.diffId, R.mode); }
  disposeRace() {
    if (!this.race) return;
    try { this.race.dispose(); } catch (e) { console.warn(e); }
    this.race = null;
  }
  quitRace(to = 'menu') {
    this.audio.stopRace(); this.disposeRace(); this.state = 'menu';
    $('hud').classList.remove('active'); $('touch').classList.remove('on'); $('speedfx').style.opacity = 0; this.setWeatherOverlay(null);
    this.renderer.toneMappingExposure = 1; this.bloom.strength = 0.32;
    this.ui.show(to); this.ui.refreshCoins(); this.ui.renderLevel();
  }
  togglePause() {
    const R = this.race; if (!R || R.resultsShown) return;
    R.paused = !R.paused;
    if (!R.paused && document.activeElement && document.activeElement.blur) document.activeElement.blur();
    this.ui.show(R.paused ? 'pause' : null);
    if (this.audio.race) this.audio.race.bus.gain.setTargetAtTime(R.paused ? 0 : 1, this.audio.ctx.currentTime, 0.05);
  }
  toggleFullscreen() {
    if (!document.fullscreenElement) {
      const p = document.documentElement.requestFullscreen && document.documentElement.requestFullscreen();
      if (p && p.then) p.then(() => navigator.keyboard && navigator.keyboard.lock && navigator.keyboard.lock(['KeyW', 'KeyA', 'KeyS', 'KeyD', 'KeyR']).catch(() => { })).catch(() => { });
    } else if (document.exitFullscreen) document.exitFullscreen();
  }
  handleKeys() {
    const I = this.input, ui = this.ui;
    if (I.consume('KeyM')) { this.audio.init(); const m = this.audio.toggleMute(); setIcon($('btn-mute'), m ? 'mute' : 'sound'); ui.toast(m ? 'Som desligado' : 'Som ligado', '', m ? 'mute' : 'sound'); }
    if (I.consume('KeyF')) this.toggleFullscreen();
    const esc = I.consume('Escape') | I.consume('KeyP') | I.padPressed(9);
    if (this.state === 'race' && this.race) {
      const R = this.race;
      if (esc && !R.resultsShown) this.togglePause();
      if (!R.paused) {
        if (I.consume('KeyC')) { R.camMode = (R.camMode + 1) % 3; this.camMode = R.camMode; }
        if (I.consume('KeyR') | I.padPressed(3)) R.resetPlayer();
      }
    } else if (esc && ['setup', 'garage', 'help', 'settings'].includes(ui.current)) ui.show('menu');
    I.clearPressed();
  }
  perf(dt) {
    this.fpsAcc += dt; this.fpsN++;
    if (this.fpsAcc >= 0.5) {
      const fps = this.fpsN / this.fpsAcc; this.fps = fps;
      if (this.economy.data.settings.fps) this.ui.h.fps.textContent = `${fps.toFixed(0)} FPS · ${this.renderer.getPixelRatio().toFixed(2)}x · ${this.renderer.info.render.calls} draws`;
      if (this.state === 'race' && this.race && !this.race.paused) {
        if (fps < 40) { this.slowT += this.fpsAcc; this.fastT = 0; } else if (fps > 58) { this.fastT += this.fpsAcc; this.slowT = 0; } else { this.slowT = this.fastT = 0; }
        if (this.slowT > 2.5 && this.dynScale > 0.55) { this.dynScale = Math.max(0.55, this.dynScale - 0.15); this.applyPixelRatio(); this.slowT = 0; }
        if (this.fastT > 6 && this.dynScale < 1) { this.dynScale = Math.min(1, this.dynScale + 0.1); this.applyPixelRatio(); this.fastT = 0; }
      }
      this.fpsAcc = 0; this.fpsN = 0;
    }
  }
  loop(now) {
    requestAnimationFrame(this.loop);
    const dt = Math.min(0.05, Math.max(0.0005, (now - this.last) / 1000)); this.last = now;
    this.handleKeys(); this.perf(dt); this.renderer.info.reset();
    if (this.state === 'race' && this.race) { this.race.update(dt * this.timeScale); this.render(this.race.scene, this.camera); }
    else if (this.state !== 'loading') { this.showroom.update(dt); this.render(this.showroom.scene, this.showroom.camera); }
  }
}

/* =====================================================================
   BOOT
   ===================================================================== */
const NitroApp = {
  boot() {
try {
  IconInjector.start();                                   // ícones SVG em toda a interface
  const game = new Game();
  game.ui.show('menu');
  requestAnimationFrame(() => requestAnimationFrame(() => game.ui.loading(false)));
  // API de depuração/testes automatizados (e "cheats" para demonstração)
  window.__nitro = {
    game, THREE, CARS, CAR_LIST, CLASSES, TRACK_DEFS, TRACK_ORDER, LEVELS, HANDLING, Race, TrackManager, CarFactory, GhostSystem, EXTERNAL_MODELS, LightRig, TextureLab, UI_ICONS, IconInjector,
    simulate(seconds, dt = 1 / 60) {
      const R = game.race; if (!R) return null;
      R.silent = true; const steps = Math.round(seconds / dt);
      for (let i = 0; i < steps && !R.resultsShown; i++) R.update(dt);
      R.silent = false;
      return { time: R.time, crossings: R.player.crossings, rank: R.player.rank, finished: R.player.finished, results: !!R.resultsShown };
    },
    autopilot(on = true) { if (game.race) game.race.autoplay = on; },
    cheat({ coins = 0, xp = 0, win = null } = {}) { const E = game.economy; if (coins) E.addCoins(coins); if (xp) E.addXP(xp); if (win) { for (const id of win) E.data.campaign.won[id] = true; E.save(); } game.ui.refreshCoins(true); game.ui.renderLevel(); if (game.ui.current === 'menu') game.ui.renderMenu(); return { coins: E.coins, level: E.level, xp: E.data.xp }; },
  };
} catch (e) {
  console.error(e);
  const b = $('boot-error'); b.style.display = 'block'; b.textContent = 'Erro ao iniciar: ' + e.message + ' — seu navegador suporta WebGL?';
}
  },
};
