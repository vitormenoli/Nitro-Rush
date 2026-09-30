/* =====================================================================
   NITRO RUSH 3D — PhysicsEngine.js
   Dirigibilidade, física veicular, colisões e entrada (teclado/gamepad/toque).
   Script clássico (carregado em ordem pelo index.html depois do Three.js):
   as classes/constantes de nível superior ficam no escopo global compartilhado.
   ===================================================================== */
'use strict';

/* =====================================================================
   DIRIGIBILIDADE — ajustes de resposta do volante e aderência
   ===================================================================== */
const HANDLING = {
  steerRate: 6.5,     // teclado: velocidade do esterço ao pressionar (unid./s)   [v1: 4.2]
  returnRate: 12,     // retorno das rodas ao centro ao soltar                   [v1: 8]
  reverseRate: 15,    // troca rápida de um lado para o outro
  steerDamp: 22,      // resposta mecânica das rodas                             [v1: 14]
  speedDiv: 30,       // perda de ângulo de esterço com a velocidade             [v1: 24]
  yawDamp: 17,        // rapidez com que o carro gira (guinada)                  [v1: 11]
  yawDampSlide: 8,
  limitMult: 1.03,    // uso da aderência em curva normal
  slideMult: 1.12,    // rotação extra no drift intencional (iniciado no freio de mão) [v1: 1.3]
  escMult: 1.0,       // controle de estabilidade (ESC): derrapagem involuntária não ganha rotação extra...
  escKinetic: 0.95,   // ...os pneus recuperam mais rápido...
  escBrake: 3.5,      // ...e o sistema corta potência e freia de leve (m/s²) até voltar a aderir
  escSlip: 1.2,       // só intervém acima deste escorregamento lateral (m/s): no limite o carro ainda "rola" natural
  staticTol: 1.1,     // tolerância do atrito estático antes de escorregar
  kinetic: 0.86,      // atrito cinético / estático                               [v1: 0.78]
  downforce: 12000,   // v² que dobraria a aderência (pressão aerodinâmica)
  wallFriction: 0.16, // atrito ao raspar no muro (baixo = desliza em vez de "travar") [v1: 0.35]
};

/* =====================================================================
   PHYSICS ENGINE — dinâmica veicular, drift, relevo, inclinação e colisões
   ===================================================================== */
const G_VERT = 16;   // gravidade "arcade" para saltos mais firmes
const G_TIRE = 9.81; // gravidade usada nas forças de atrito dos pneus
class PhysicsEngine {
  constructor(track) { this.track = track; this.events = []; }
  step(cars, dt) {
    for (const c of cars) this.integrate(c, dt);
    for (const c of cars) { this.track.project(c); this.ground(c, dt); this.walls(c); }
    this.carCollisions(cars);
  }
  integrate(c, dt) {
    const st = c.stats, inp = c.input, active = c.active, H = HANDLING, gm = this.track.gripMul;
    const thr = active ? inp.throttle : 0, brk = active ? inp.brake : 0, hb = active && inp.handbrake;
    let fx = Math.sin(c.heading), fz = Math.cos(c.heading);
    let vf = c.vx * fx + c.vz * fz;
    const grounded = !c.airborne;
    // direção sensível à velocidade (modelo bicicleta)
    const steerLim = st.steer / (1 + Math.abs(vf) / H.speedDiv);
    c.steerAngle = damp(c.steerAngle, inp.steer * steerLim, H.steerDamp, dt);
    // aderência: pneus × pista (gelo/chuva) × pressão aerodinâmica (cresce com v²)
    // superfície: área de escape (grama/brita) → menos aderência; relevo: compressão/lombada muda a força normal
    const off = c.offRoad && grounded, gravel = off && this.track.gravelSide && this.track.gravelSide[c.ti] === Math.sign(c.lat);
    const align = Math.abs(c.fx * (c.ttx || 0) + c.fz * (c.ttz || 1));
    c.normalF = damp(c.normalF || 1, clamp(1 + (vf * vf * (c.vcurv || 0) * align) / G_TIRE, 0.3, 1.7), 14, dt);
    const surf = off ? (gravel ? 0.5 : 0.64) : 1;
    const grip = st.grip * gm * surf * c.normalF * (1 + (vf * vf) / H.downforce);
    // inclinação lateral da pista sob o eixo direito do carro (> 0 = lado direito mais alto)
    const sR = (c.bank || 0) * (c.rx * c.tnx + c.rz * c.tnz);
    if (grounded) {
      let target = (vf * Math.tan(c.steerAngle)) / st.wheelBase;
      const trail = brk > 0.3 && Math.abs(inp.steer) > 0.4 && vf > 20;       // frenagem em curva: transferência de peso
      const assist = 2.5 * Math.max(0, sR * Math.sign(target));              // curva inclinada "segura" o carro
      if (hb && Math.abs(vf) > 6) c.drifting = true; else if (!c.sliding) c.drifting = false;   // drift só é mantido se começou no freio de mão
      c.esc = c.sliding && !c.drifting && !hb && (c.slip || 0) > H.escSlip;                      // ESC: derrapagem involuntária grande
      const mult = hb ? 1.9 : c.sliding ? (c.esc ? H.escMult : H.slideMult) : trail ? 1.12 : H.limitMult;
      const lim = ((grip + assist) * G_TIRE * mult) / Math.max(3, Math.abs(vf)); // limite centrípeto (a = v·ω ≤ μ·g)
      target = clamp(target, -lim, lim);
      if (hb && Math.abs(vf) > 6) target *= 1.25;
      c.yaw = damp(c.yaw, target, c.sliding ? H.yawDampSlide : H.yawDamp, dt);
    } else {                                                        // no ar: controle aéreo leve (arcade) — gira o carro e 80% do vetor velocidade
      c.yaw = damp(c.yaw, (active ? inp.steer : 0) * 0.55, 3, dt);
      const da = c.yaw * dt * 0.8, cs = Math.cos(da), sn = Math.sin(da), vx0 = c.vx;
      c.vx = vx0 * cs + c.vz * sn; c.vz = c.vz * cs - vx0 * sn;
    }
    c.heading += c.yaw * dt;
    fx = Math.sin(c.heading); fz = Math.cos(c.heading);
    const rx = -fz, rz = fx;
    c.fx = fx; c.fz = fz; c.rx = rx; c.rz = rz;
    vf = c.vx * fx + c.vz * fz;
    let vl = c.vx * rx + c.vz * rz;
    const nitroOn = active && inp.nitro && c.nitro > 0.005;
    c.nitroOn = nitroOn;
    const top = st.top * c.speedMul * (nitroOn ? 1 + st.nitroTop : 1);
    let a = 0;
    if (grounded) {
      const esc = c.esc && vf > 8;                                            // ESC ativo: corta potência e freia de leve
      const thrE = esc ? thr * 0.3 : thr;
      if (esc) a -= H.escBrake * clamp(Math.abs(vl) / 2.5, 0.3, 1);
      if (thr > 0) {
        if (vf < -1) a += st.brake * thr;
        else { const r = clamp(vf / top, 0, 1.5); a += st.accel * c.accelMul * thrE * Math.max(0, 1 - r * r * r) * (c.shiftTimer > 0 ? 0.35 : 1); }
      }
      if (nitroOn) a += st.nitro * (vf < top ? 1 : 0.15);          // força vetorial extra na direção frontal
      const bk = st.brake * (0.55 + 0.45 * gm);                    // no gelo o freio rende menos
      if (brk > 0) { if (vf > 0.8) a -= bk * brk; else a -= 10 * brk * (vf > -15 ? 1 : 0); }
      if (hb) a -= Math.sign(vf) * 5;
      a -= 0.4 * Math.sign(vf) + 0.00035 * vf * Math.abs(vf);      // rolamento + arrasto aerodinâmico
      if (off) a -= (gravel ? 9 : 3.2) * Math.sign(vf) * Math.min(1, Math.abs(vf) / 3);   // grama/brita seguram o carro
      if (thr === 0 && brk === 0) a -= 1.0 * Math.sign(vf);        // freio-motor
      if (vf > top * 1.02) a -= (vf - top) * 0.6;                  // volta ao limite após o nitro
      let nvf = vf + a * dt;
      if (brk > 0 && vf > 0.8 && nvf < 0) nvf = 0;
      if (thr > 0 && vf < -1 && nvf > 0) nvf = 0;
      if (thr === 0 && brk === 0 && Math.sign(nvf) !== Math.sign(vf)) nvf = 0;
      vf = nvf;
      // atrito lateral: estático (aderência total) x cinético (derrapagem)
      let mu = (grip + 2.5 * Math.max(0, sR * Math.sign(c.yaw))) * (hb ? 0.45 : 1);
      if (brk > 0.3 && Math.abs(inp.steer) > 0.4 && vf > 20) mu *= 0.88;
      if (sR) vl -= ((G_TIRE * sR) / Math.sqrt(1 + sR * sR)) * dt;   // gravidade puxa para o lado baixo da inclinação
      const maxStatic = mu * G_TIRE * dt * (hb ? 1 : H.staticTol);
      if (Math.abs(vl) <= maxStatic) { vl = 0; c.sliding = false; }
      else {
        const kin = mu * (hb ? 0.78 : c.esc ? H.escKinetic : H.kinetic) * G_TIRE * dt;
        vl -= Math.sign(vl) * Math.min(Math.abs(vl), kin);
        c.sliding = true;
        vf -= Math.sign(vf) * Math.min(Math.abs(vf), Math.abs(vl) * 0.35 * dt);
      }
    } else {
      vf -= 0.00035 * vf * Math.abs(vf) * dt;
      if (nitroOn) vf += st.nitro * 0.5 * dt;
    }
    if (nitroOn) c.nitro = Math.max(0, c.nitro - dt / 4.2);
    c.vx = fx * vf + rx * vl; c.vz = fz * vf + rz * vl;
    c.longAcc = a; c.latAcc = vf * c.yaw;
    c.slip = Math.abs(vl); c.driftAngle = Math.atan2(Math.abs(vl), Math.max(1, Math.abs(vf)));
    c.gripUse = Math.abs(c.latAcc) / (grip * G_TIRE);
    c.x += c.vx * dt; c.z += c.vz * dt;
    if (c.shiftTimer > 0) c.shiftTimer -= dt;
  }
  ground(c, dt) {
    const g = c.groundY;
    if (c.airborne) {
      c.vy -= G_VERT * dt; c.y += c.vy * dt; c.airTime += dt;
      if (c.y <= g) {
        const imp = -c.vy; c.y = g; c.vy = 0; c.airborne = false;
        if (imp > 3) this.events.push({ type: 'land', car: c, v: imp, air: c.airTime });
        c.airTime = 0;
      }
    } else {
      const pred = c.y + (c.vy - G_VERT * dt) * dt;
      const sp = Math.hypot(c.vx, c.vz);
      // decolagem: impulso vertical limitado → salto de no máx. ~70 m mesmo a 400 km/h (pouso ainda na pista)
      if (g < pred - 0.04 && sp > 8) { c.airborne = true; c.airTime = 0; c.vy = Math.min(c.vy, Math.max(6, 560 / sp)); c.vy -= G_VERT * dt; c.y += c.vy * dt; }
      else { c.vy = clamp((g - c.y) / dt, -30, 30); c.y = g; }
    }
  }
  updateBox(c) {
    const ex = Math.abs(c.stats.hl * c.fx) + Math.abs(c.stats.hw * c.rx), ez = Math.abs(c.stats.hl * c.fz) + Math.abs(c.stats.hw * c.rz);
    c.box.min.set(c.x - ex, c.y, c.z - ez); c.box.max.set(c.x + ex, c.y + 1.4, c.z + ez);
  }
  walls(c) {
    const T = this.track, hw = (T.wallLat || T.hw) - 0.05, nx = c.tnx, nz = c.tnz;   // barreira além da área de escape
    const ext = Math.abs(c.stats.hl * (c.fx * nx + c.fz * nz)) + Math.abs(c.stats.hw * (c.rx * nx + c.rz * nz));
    // broadphase: caixa do carro x caixas (THREE.Box3) das paredes vizinhas (failsafe se estiver fora da pista)
    this.updateBox(c);
    let nearR = Math.abs(c.lat) > hw + 1, nearL = nearR;
    const ch = Math.floor(c.ti / T.wallChunk), nC = T.wallBoxes.length;
    for (let d = -1; d <= 1 && !(nearR && nearL); d++) {
      const B = T.wallBoxes[(ch + d + nC) % nC];
      if (!nearR && c.box.intersectsBox(B[0])) nearR = true;
      if (!nearL && c.box.intersectsBox(B[1])) nearL = true;
    }
    let pen = 0, dir = 0;
    if (nearR && c.lat + ext > hw) { pen = c.lat + ext - hw; dir = 1; }
    else if (nearL && c.lat - ext < -hw) { pen = -hw - (c.lat - ext); dir = -1; }
    if (dir) this.pushOut(c, nx * dir, nz * dir, pen, 0.25, 'wall');
    for (const r of T.ramps) {                                     // laterais das rampas funcionam como paredes
      const d = c.s - r.s0; if (d < 0.5 || d > r.len) continue;
      const hR = (r.h * d) / r.len; if (c.y - c.roadY > hR - 0.4) continue;
      if (c.lat + ext > r.a && c.lat - ext < r.b) {
        const toA = c.lat + ext - r.a, toB = r.b - (c.lat - ext);
        if (toA < toB) this.pushOut(c, nx, nz, toA, 0.3, 'wall'); else this.pushOut(c, -nx, -nz, toB, 0.3, 'wall');
      }
    }
  }
  // empurra o carro para fora de uma superfície (normal ox,oz apontando para dentro dela)
  pushOut(c, ox, oz, pen, e, type) {
    c.x -= ox * pen; c.z -= oz * pen; c.lat -= (ox * c.tnx + oz * c.tnz) * pen;
    const vn = c.vx * ox + c.vz * oz;
    if (vn <= 0) return;
    c.vx -= (1 + e) * vn * ox; c.vz -= (1 + e) * vn * oz;           // colisão elástica (restituição e)
    const tx = -oz, tz = ox, vt = c.vx * tx + c.vz * tz, fr = Math.min(Math.abs(vt), vn * HANDLING.wallFriction);
    c.vx -= Math.sign(vt) * fr * tx; c.vz -= Math.sign(vt) * fr * tz;  // pouco atrito: raspa e continua em vez de "travar"
    if (vn > 1) {
      const th = Math.atan2(c.ttx, c.ttz); let d = wrapAngle(th - c.heading);
      if (Math.abs(d) > Math.PI / 2) d = wrapAngle(d + Math.PI);
      c.heading += d * clamp(vn * 0.035, 0, 0.4); c.yaw *= 0.5;       // alinha o carro com o muro
    }
    c.impact = Math.max(c.impact, vn);
    if (vn > 2.5) this.events.push({ type, car: c, v: vn });
  }
  carCollisions(cars) {
    for (const c of cars) this.updateBox(c);
    for (let i = 0; i < cars.length; i++) for (let j = i + 1; j < cars.length; j++) {
      const a = cars[i], b = cars[j];
      if (!a.box.intersectsBox(b.box)) continue;                   // broadphase THREE.Box3
      const v = this.collidePair(a, b);
      if (v > 1.5) this.events.push({ type: 'car', car: a, other: b, v });
    }
  }
  collidePair(a, b) {                                              // narrowphase: SAT entre OBBs 2D
    const dx = b.x - a.x, dz = b.z - a.z;
    const axes = [a.fx, a.fz, a.rx, a.rz, b.fx, b.fz, b.rx, b.rz];
    let minO = Infinity, nx = 0, nz = 0;
    for (let k = 0; k < 8; k += 2) {
      const ax = axes[k], az = axes[k + 1];
      const pa = a.stats.hl * Math.abs(a.fx * ax + a.fz * az) + a.stats.hw * Math.abs(a.rx * ax + a.rz * az);
      const pb = b.stats.hl * Math.abs(b.fx * ax + b.fz * az) + b.stats.hw * Math.abs(b.rx * ax + b.rz * az);
      const d = dx * ax + dz * az, o = pa + pb - Math.abs(d);
      if (o <= 0) return 0;
      if (o < minO) { minO = o; const s = d < 0 ? -1 : 1; nx = ax * s; nz = az * s; }
    }
    const ma = a.stats.mass, mb = b.stats.mass, tot = ma + mb;
    a.x -= nx * minO * (mb / tot); a.z -= nz * minO * (mb / tot);
    b.x += nx * minO * (ma / tot); b.z += nz * minO * (ma / tot);
    const vr = (b.vx - a.vx) * nx + (b.vz - a.vz) * nz;
    if (vr >= 0) return 0;
    const e = 0.45, jimp = (-(1 + e) * vr) / (1 / ma + 1 / mb);
    a.vx -= (jimp / ma) * nx; a.vz -= (jimp / ma) * nz; b.vx += (jimp / mb) * nx; b.vz += (jimp / mb) * nz;
    const lever = (dx * a.fx + dz * a.fz) / (a.stats.hl * 2);
    a.yaw += clamp(-vr * 0.04 * lever * (nx * a.rx + nz * a.rz), -1.2, 1.2);
    b.yaw -= clamp(-vr * 0.04 * lever * (nx * b.rx + nz * b.rz), -1.2, 1.2);
    a.impact = Math.max(a.impact, -vr); b.impact = Math.max(b.impact, -vr);
    return -vr;
  }
}

/* =====================================================================
   INPUT — teclado, gamepad e toque
   ===================================================================== */
class InputManager {
  constructor() {
    this.keys = new Set(); this.pressed = new Set(); this.touch = {}; this.steer = 0; this.padPrev = {};
    const block = new Set(['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ShiftLeft', 'ShiftRight']);
    addEventListener('keydown', (e) => {
      if (e.target && (e.target.tagName === 'INPUT')) return;
      if (!e.repeat) this.pressed.add(e.code);
      this.keys.add(e.code);
      if (block.has(e.code) || ((e.ctrlKey) && ['KeyW', 'KeyS', 'KeyA', 'KeyD', 'KeyR'].includes(e.code))) e.preventDefault();
    });
    addEventListener('keyup', (e) => this.keys.delete(e.code));
    addEventListener('blur', () => { this.keys.clear(); this.touch = {}; });
    document.querySelectorAll('#touch .tbtn').forEach((b) => {
      const k = b.dataset.k;
      const on = (e) => { e.preventDefault(); this.touch[k] = true; b.classList.add('on'); };
      const off = (e) => { e.preventDefault(); this.touch[k] = false; b.classList.remove('on'); };
      b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
    });
  }
  down(...c) { for (const k of c) if (this.keys.has(k)) return true; return false; }
  consume(code) { const h = this.pressed.has(code); this.pressed.delete(code); return h; }
  clearPressed() { this.pressed.clear(); }
  pad() { const ps = navigator.getGamepads ? navigator.getGamepads() : []; for (const p of ps) if (p && p.connected) return p; return null; }
  padPressed(i) { const p = this.pad(); const v = !!(p && p.buttons[i] && p.buttons[i].pressed); const was = this.padPrev[i]; this.padPrev[i] = v; return v && !was; }
  read(dt) {
    const t = this.touch, H = HANDLING;
    let thr = this.down('KeyW', 'ArrowUp') || t.gas ? 1 : 0;
    let brk = this.down('KeyS', 'ArrowDown') || t.brake ? 1 : 0;
    const left = this.down('KeyA', 'ArrowLeft') || t.left, right = this.down('KeyD', 'ArrowRight') || t.right;
    const target = (left ? 1 : 0) - (right ? 1 : 0);
    // esterço digital com rampa: pressiona (steerRate), solta = volta rápido ao centro (returnRate), inverte (reverseRate)
    const rate = target === 0 ? H.returnRate : Math.sign(target) !== Math.sign(this.steer) && Math.abs(this.steer) > 0.05 ? H.reverseRate : H.steerRate;
    this.steer += clamp(target - this.steer, -rate * dt, rate * dt);
    let steer = this.steer;
    let hb = this.down('ControlLeft', 'ControlRight');
    let nitro = this.down('ShiftLeft', 'ShiftRight', 'Space') || !!t.nitro;
    const p = this.pad();
    if (p) {
      const ax = p.axes[0] || 0;
      if (Math.abs(ax) > 0.12) steer = -Math.sign(ax) * Math.pow((Math.abs(ax) - 0.12) / 0.88, 1.4);
      const b = (i) => (p.buttons[i] ? p.buttons[i].value || (p.buttons[i].pressed ? 1 : 0) : 0);
      thr = Math.max(thr, b(7)); brk = Math.max(brk, b(6));
      if (b(0) > 0.5) nitro = true; if (b(2) > 0.5 || b(1) > 0.5) hb = true;
    }
    return { throttle: thr, brake: brk, steer, handbrake: hb, nitro };
  }
}
