/* =====================================================================
   NITRO RUSH 3D — Vehicles.js
   Os 23 carros, perfis de motor, fábrica de modelos, veículos, IA e fantasma.
   Script clássico (carregado em ordem pelo index.html depois do Three.js):
   as classes/constantes de nível superior ficam no escopo global compartilhado.
   ===================================================================== */
'use strict';

/* =====================================================================
   DADOS DO JOGO — classes, 23 carros, upgrades e níveis
   ===================================================================== */
const CLASSES = {
  urban:  { id: 'urban',  name: 'Classe Urbana',        short: 'URBANA',    level: 1,  color: '#3dff9a', upMul: 1.0 },
  exec:   { id: 'exec',   name: 'Executiva e Rally',    short: 'EXECUTIVA', level: 5,  color: '#00e5ff', upMul: 1.6 },
  exotic: { id: 'exotic', name: 'Exóticos e Supercars', short: 'EXÓTICOS',  level: 12, color: '#ffc93c', upMul: 2.6 },
  hyper:  { id: 'hyper',  name: 'Hypercars',            short: 'HYPER',     level: 20, color: '#ff2d78', upMul: 4.0 },
};
const CLASS_ORDER = ['urban', 'exec', 'exotic', 'hyper'];

// Aparência padrão: cada carro sobrescreve só o que muda (geometria 100% procedural)
const LOOK_BASE = {
  L: 4.5, W: 1.98, wb: [0.62, -0.6], r: [0.35, 0.35], tw: [0.27, 0.3], yb: 0.22, bevel: 0.08,
  top: [[-1, 0.8], [-0.9, 0.92], [-0.5, 0.95], [0, 0.92], [0.4, 0.88], [0.8, 0.74], [0.97, 0.52], [1, 0.4]],
  cabin: { z0: -0.6, z1: 0.35, roof: 1.25, r0: -0.25, r1: 0.05, w: 0.74, style: 'coupe' },
  roofPaint: true, taper: [0.1, 0.06, 0.11], flare: 0, wingH: 0.28,
  head: 'slim', grille: 'wide', tail: 'bar', wing: 'none', exhaust: 'dual', intake: 'none', hood: 'none', roof: 'none',
  stripes: false, splitter: true, diffuser: true, skirts: true, extras: [],
  rim: 'y', rimKey: 'rim', cal: 'caliper',
};
const CARS = {};
const CAR_LIST = [];
function gearsFor(n) { if (n <= 1) return [1.04]; const g = []; for (let k = 0; k < n; k++) g.push(+(0.27 + 0.77 * Math.pow(k / (n - 1), 0.82)).toFixed(3)); return g; }
function defCar(o) {
  o.look = { ...LOOK_BASE, ...(o.look || {}), cabin: { ...LOOK_BASE.cabin, ...((o.look && o.look.cabin) || {}) } };
  o.hw = o.look.W / 2; o.hl = o.look.L / 2; o.gears = gearsFor(o.gearN || 6); o.full = `${o.brand} ${o.name}`;
  CARS[o.id] = o; CAR_LIST.push(o.id);
}

// ---------------- CLASSE URBANA (Nível 1+) ----------------
defCar({ id: 'civic', brand: 'Honda', name: 'Civic Type R', cls: 'urban', level: 1, price: 0, tag: 'HOT HATCH · TURBO 2.0',
  desc: 'O hot hatch recordista de Nürburgring: turbo 2.0, asa enorme e escape triplo central. Seu carro inicial.',
  colors: ['#f2f4f7', '#d6001c', '#1f5fd6', '#121317', '#ffd400', '#6b6f78', '#00a86b', '#ff7a00'],
  stats: { top: 61, accel: 11.6, grip: 2.0, brake: 29, steer: 0.58, wheelBase: 2.73, mass: 1430, nitro: 12, nitroTop: 0.2 },
  engine: 'i4t', gearN: 6,
  look: { L: 4.56, W: 1.94, wb: [0.62, -0.62], r: [0.34, 0.34], tw: [0.26, 0.27], yb: 0.24,
    top: [[-1, 0.9], [-0.92, 1.0], [-0.7, 1.02], [-0.3, 0.99], [0.2, 0.97], [0.6, 0.93], [0.88, 0.8], [1, 0.58]],
    cabin: { z0: -0.9, z1: 0.36, roof: 1.43, r0: -0.72, r1: 0.02, w: 0.8, style: 'hatch' },
    taper: [0.08, 0.05, 0.1], flare: 0.035, head: 'slim', grille: 'honeycomb', tail: 'split', wing: 'gt', wingH: 0.3,
    exhaust: 'center3', hood: 'vents', rim: 'star', rimKey: 'rimDark' } });
defCar({ id: 'supra', brand: 'Toyota', name: 'Supra MK4', cls: 'urban', level: 1, price: 3500, tag: 'LENDA JDM · 2JZ BITURBO',
  desc: 'O ícone dos anos 90 com o lendário 2JZ biturbo e a asa em arco. Traseira solta, perfeita para drifts.',
  colors: ['#c8102e', '#f2f4f7', '#ff8c1a', '#111216', '#1c4fd8', '#c0c4cc', '#6a2dc9', '#00b36b'],
  stats: { top: 65, accel: 12.4, grip: 1.9, brake: 28, steer: 0.55, wheelBase: 2.55, mass: 1500, nitro: 13, nitroTop: 0.22 },
  engine: 'i6t', gearN: 6,
  look: { L: 4.52, W: 1.96, wb: [0.6, -0.62], r: [0.35, 0.36], tw: [0.27, 0.3], yb: 0.24,
    top: [[-1, 0.82], [-0.88, 0.94], [-0.55, 0.97], [-0.2, 0.95], [0.25, 0.9], [0.62, 0.82], [0.9, 0.66], [1, 0.46]],
    cabin: { z0: -0.72, z1: 0.26, roof: 1.3, r0: -0.34, r1: -0.04, w: 0.76, style: 'coupe' },
    taper: [0.12, 0.08, 0.12], flare: 0.02, head: 'oval', grille: 'mouth', tail: 'round2', wing: 'hoop',
    exhaust: 'single', rim: 'star', rimKey: 'rim' } });
defCar({ id: 'skyline', brand: 'Nissan', name: 'Skyline GT-R R34', cls: 'urban', level: 1, price: 5500, tag: 'GODZILLA · AWD',
  desc: 'RB26 biturbo e tração integral ATTESA. Linhas retas, quatro lanternas redondas e asa ajustável.',
  colors: ['#1f5fbf', '#f2f4f7', '#c7c9cf', '#111216', '#7a1fb8', '#d6001c', '#ffd400', '#0f7a4a'],
  stats: { top: 64, accel: 13.1, grip: 2.05, brake: 29, steer: 0.54, wheelBase: 2.67, mass: 1560, nitro: 13, nitroTop: 0.21 },
  engine: 'i6t', gearN: 6, snd: { red: 8000, pitch: 1.06 },
  look: { L: 4.6, W: 1.92, wb: [0.6, -0.6], r: [0.35, 0.35], tw: [0.27, 0.29], yb: 0.25,
    top: [[-1, 0.9], [-0.9, 0.99], [-0.55, 0.99], [-0.2, 0.97], [0.3, 0.95], [0.78, 0.92], [0.95, 0.84], [1, 0.62]],
    cabin: { z0: -0.62, z1: 0.24, roof: 1.37, r0: -0.34, r1: 0.0, w: 0.8, style: 'sedan' },
    taper: [0.05, 0.04, 0.1], flare: 0.03, head: 'rect', grille: 'wide', tail: 'round4', wing: 'gtMid', wingH: 0.22,
    exhaust: 'single', rim: 'y', rimKey: 'rimBronze' } });
defCar({ id: 'camaro', brand: 'Chevrolet', name: 'Camaro SS', cls: 'urban', level: 1, price: 4500, tag: 'MUSCLE · V8 6.2',
  desc: 'V8 aspirado de 6.2 litros e visual agressivo com faróis estreitos. Muito torque, pouca aderência.',
  colors: ['#ffc20e', '#111216', '#d6001c', '#1f5fd6', '#f2f4f7', '#2f6b3a', '#ff7a00', '#8a8d94'],
  stats: { top: 66, accel: 12.9, grip: 1.8, brake: 27, steer: 0.52, wheelBase: 2.81, mass: 1720, nitro: 14, nitroTop: 0.2 },
  engine: 'v8', gearN: 6,
  look: { L: 4.78, W: 2.04, wb: [0.64, -0.6], r: [0.37, 0.38], tw: [0.29, 0.34], yb: 0.27,
    top: [[-1, 0.92], [-0.92, 1.02], [-0.58, 1.04], [-0.1, 1.02], [0.4, 1.0], [0.82, 0.97], [0.97, 0.88], [1, 0.62]],
    cabin: { z0: -0.64, z1: 0.18, roof: 1.36, r0: -0.36, r1: -0.08, w: 0.72, style: 'coupe' },
    taper: [0.04, 0.03, 0.08], flare: 0.02, head: 'squint', grille: 'wide', tail: 'rect2', wing: 'lip',
    exhaust: 'quad', hood: 'vents', stripes: true, rim: 'split', rimKey: 'rimDark' } });
defCar({ id: 'mustang', brand: 'Ford', name: 'Mustang GT', cls: 'urban', level: 1, price: 4000, tag: 'PONY CAR · V8 5.0',
  desc: 'O pony car fastback com V8 Coyote e as lanternas de três barras. Ronco grave e traseira divertida.',
  colors: ['#1f6fe0', '#d6001c', '#111216', '#f2f4f7', '#ff7a00', '#ffd400', '#2e8b57', '#9aa0a8'],
  stats: { top: 65, accel: 12.7, grip: 1.78, brake: 27, steer: 0.52, wheelBase: 2.72, mass: 1690, nitro: 14, nitroTop: 0.21 },
  engine: 'v8', gearN: 6, snd: { red: 7500, pitch: 1.04 },
  look: { L: 4.79, W: 2.0, wb: [0.62, -0.58], r: [0.37, 0.38], tw: [0.28, 0.32], yb: 0.26,
    top: [[-1, 0.9], [-0.93, 0.99], [-0.6, 1.0], [-0.1, 0.98], [0.4, 0.97], [0.84, 0.92], [0.97, 0.8], [1, 0.58]],
    cabin: { z0: -0.9, z1: 0.2, roof: 1.37, r0: -0.3, r1: -0.04, w: 0.74, style: 'fastback' },
    taper: [0.06, 0.04, 0.09], head: 'slim', grille: 'wide', tail: 'bars3', wing: 'duck',
    exhaust: 'quad', stripes: true, rim: 'star', rimKey: 'rim' } });

// ---------------- CLASSE EXECUTIVA E RALLY (Nível 5+) ----------------
defCar({ id: 'evo', brand: 'Mitsubishi', name: 'Lancer Evolution X', cls: 'exec', level: 5, price: 11000, tag: 'RALLY · AWD S-AWC',
  desc: 'O sedã de rally com grade "jet fighter", tração integral inteligente e asa alta. Gruda no asfalto.',
  colors: ['#d6001c', '#f2f4f7', '#111216', '#1f4fbf', '#c0c4cc', '#ffd400', '#ff7a00', '#2e8b57'],
  stats: { top: 66, accel: 14.9, grip: 2.2, brake: 31, steer: 0.57, wheelBase: 2.65, mass: 1560, nitro: 14, nitroTop: 0.2 },
  engine: 'i4t', gearN: 6, snd: { pitch: 0.94 },
  look: { L: 4.5, W: 1.92, wb: [0.62, -0.6], r: [0.35, 0.35], tw: [0.27, 0.28], yb: 0.26,
    top: [[-1, 0.95], [-0.9, 1.02], [-0.62, 1.02], [-0.25, 0.99], [0.3, 0.97], [0.8, 0.93], [0.96, 0.84], [1, 0.6]],
    cabin: { z0: -0.6, z1: 0.26, roof: 1.45, r0: -0.3, r1: 0.04, w: 0.8, style: 'sedan' },
    taper: [0.05, 0.04, 0.1], flare: 0.05, head: 'angular', grille: 'mouth', tail: 'rect2', wing: 'rally', wingH: 0.32,
    exhaust: 'single', hood: 'vents', rim: 'split', rimKey: 'rimDark' } });
defCar({ id: 'sti', brand: 'Subaru', name: 'Impreza WRX STI', cls: 'exec', level: 5, price: 11500, tag: 'RALLY · BOXER TURBO',
  desc: 'Boxer turbo com o inconfundível ronco "rumble", tomada de ar no capô e rodas douradas.',
  colors: ['#1540a0', '#f2f4f7', '#111216', '#c0c4cc', '#d6001c', '#ffd400', '#2e8b57', '#ff7a00'],
  stats: { top: 66, accel: 14.7, grip: 2.18, brake: 31, steer: 0.57, wheelBase: 2.65, mass: 1580, nitro: 14, nitroTop: 0.2 },
  engine: 'boxer4', gearN: 6,
  look: { L: 4.6, W: 1.9, wb: [0.62, -0.6], r: [0.35, 0.35], tw: [0.27, 0.28], yb: 0.26,
    top: [[-1, 0.96], [-0.9, 1.03], [-0.62, 1.03], [-0.25, 1.0], [0.3, 0.98], [0.8, 0.93], [0.96, 0.84], [1, 0.62]],
    cabin: { z0: -0.6, z1: 0.24, roof: 1.46, r0: -0.3, r1: 0.04, w: 0.8, style: 'sedan' },
    taper: [0.05, 0.04, 0.1], flare: 0.04, head: 'angular', grille: 'hex', tail: 'split', wing: 'rally', wingH: 0.36,
    exhaust: 'quad', hood: 'scoop', rim: 'y', rimKey: 'rimGold' } });
defCar({ id: 'm4', brand: 'BMW', name: 'M4 Competition', cls: 'exec', level: 6, price: 12000, tag: 'COUPÉ · 6 EM LINHA',
  desc: 'Seis cilindros biturbo, grade de duplo rim gigante e freios azuis M. Preciso e brutal.',
  colors: ['#2e8b57', '#ffd400', '#1f4fbf', '#111216', '#f2f4f7', '#8a8d94', '#ff7a00', '#b01e3a'],
  stats: { top: 69, accel: 14.2, grip: 2.08, brake: 31, steer: 0.55, wheelBase: 2.86, mass: 1720, nitro: 14, nitroTop: 0.22 },
  engine: 'i6t', gearN: 8, snd: { red: 7200, pitch: 1.02 },
  look: { L: 4.8, W: 1.96, wb: [0.62, -0.58], r: [0.36, 0.37], tw: [0.28, 0.31], yb: 0.25,
    top: [[-1, 0.9], [-0.9, 0.99], [-0.6, 0.99], [-0.25, 0.97], [0.3, 0.95], [0.8, 0.9], [0.96, 0.78], [1, 0.54]],
    cabin: { z0: -0.64, z1: 0.2, roof: 1.37, r0: -0.3, r1: -0.03, w: 0.78, style: 'coupe' },
    taper: [0.07, 0.05, 0.1], flare: 0.025, head: 'angular', grille: 'kidney', tail: 'L', wing: 'lip',
    exhaust: 'quad', rim: 'y', rimKey: 'rimDark', cal: 'caliperBlue' } });
defCar({ id: 'c63', brand: 'Mercedes-AMG', name: 'C63', cls: 'exec', level: 6, price: 13500, tag: 'SEDÃ · V8 BITURBO',
  desc: 'Sedã de quatro portas com V8 biturbo artesanal e grade Panamericana. Estalos no escape a cada tirada de pé.',
  colors: ['#5c6168', '#111216', '#f2f4f7', '#9aa0a8', '#1f3fbf', '#b01e3a', '#2e5d3a', '#e8e1d0'],
  stats: { top: 68, accel: 14.6, grip: 2.0, brake: 31, steer: 0.53, wheelBase: 2.84, mass: 1800, nitro: 15, nitroTop: 0.2 },
  engine: 'v8t', gearN: 9,
  look: { L: 4.76, W: 1.96, wb: [0.63, -0.58], r: [0.36, 0.36], tw: [0.27, 0.3], yb: 0.25,
    top: [[-1, 0.92], [-0.9, 1.0], [-0.62, 1.0], [-0.25, 0.97], [0.3, 0.95], [0.8, 0.9], [0.96, 0.79], [1, 0.55]],
    cabin: { z0: -0.6, z1: 0.24, roof: 1.43, r0: -0.3, r1: 0.04, w: 0.8, style: 'sedan' },
    taper: [0.07, 0.05, 0.1], head: 'angular', grille: 'vbars', tail: 'split', wing: 'lip',
    exhaust: 'quad', rim: 'y', rimKey: 'rim' } });
defCar({ id: 'rs6', brand: 'Audi', name: 'RS6 Avant', cls: 'exec', level: 7, price: 15000, tag: 'PERUA · V8 QUATTRO',
  desc: 'A perua mais insana do mundo: V8 biturbo, tração quattro e para-lamas alargados. Família em 3,6 s.',
  colors: ['#8e9296', '#111216', '#f2f4f7', '#1f3a8a', '#6e0f1a', '#2f4f3f', '#c9c3b6', '#ff7a00'],
  stats: { top: 70, accel: 14.4, grip: 2.1, brake: 32, steer: 0.53, wheelBase: 2.93, mass: 2070, nitro: 15, nitroTop: 0.2 },
  engine: 'v8t', gearN: 8, snd: { pitch: 1.03 },
  look: { L: 5.0, W: 2.02, wb: [0.62, -0.6], r: [0.37, 0.37], tw: [0.29, 0.3], yb: 0.27,
    top: [[-1, 1.02], [-0.92, 1.05], [-0.6, 1.04], [-0.2, 1.0], [0.3, 0.98], [0.8, 0.93], [0.96, 0.82], [1, 0.58]],
    cabin: { z0: -0.95, z1: 0.26, roof: 1.47, r0: -0.88, r1: 0.04, w: 0.8, style: 'wagon' },
    taper: [0.06, 0.05, 0.1], flare: 0.04, head: 'angular', grille: 'mesh', tail: 'bar', wing: 'lip',
    exhaust: 'ovals', roof: 'rails', rim: 'y', rimKey: 'rimDark' } });
defCar({ id: 'p911', brand: 'Porsche', name: '911 Carrera S', cls: 'exec', level: 8, price: 18000, tag: 'CLÁSSICO · BOXER 6',
  desc: 'A silhueta mais famosa do mundo: motor boxer traseiro, faróis redondos e barra de LED na traseira.',
  colors: ['#c0c4cc', '#f2f4f7', '#111216', '#ffd400', '#1f5fd6', '#b01e3a', '#2e8b57', '#ff7a00'],
  stats: { top: 70, accel: 14.8, grip: 2.15, brake: 33, steer: 0.56, wheelBase: 2.45, mass: 1515, nitro: 14, nitroTop: 0.22 },
  engine: 'flat6', gearN: 8,
  look: { L: 4.52, W: 1.9, wb: [0.64, -0.56], r: [0.35, 0.36], tw: [0.26, 0.31], yb: 0.24,
    top: [[-1, 0.8], [-0.9, 0.9], [-0.62, 0.95], [-0.3, 0.97], [0.05, 0.93], [0.45, 0.84], [0.82, 0.74], [1, 0.5]],
    cabin: { z0: -0.94, z1: 0.14, roof: 1.3, r0: -0.34, r1: -0.08, w: 0.72, style: 'fastback' },
    taper: [0.1, 0.07, 0.13], flare: [0.02, 0.07], head: 'round', grille: 'none', tail: 'bar', wing: 'duck',
    exhaust: 'center2', rim: 'y', rimKey: 'rim' } });

// ---------------- EXÓTICOS E SUPERCARS (Nível 12+) ----------------
defCar({ id: 'vantage', brand: 'Aston Martin', name: 'Vantage', cls: 'exotic', level: 12, price: 28000, tag: 'GT · V8 DIANTEIRO',
  desc: 'GT britânico de capô longo, grade larga e traseira curta com ducktail. Elegância com 500 cv.',
  colors: ['#1f4a32', '#c0c4cc', '#f2f4f7', '#111216', '#ffd400', '#b01e3a', '#1f3fbf', '#7fcf1f'],
  stats: { top: 75, accel: 15.8, grip: 2.18, brake: 33, steer: 0.55, wheelBase: 2.7, mass: 1630, nitro: 15, nitroTop: 0.22 },
  engine: 'v8t', gearN: 8, snd: { pitch: 1.06 },
  look: { L: 4.47, W: 1.96, wb: [0.64, -0.58], r: [0.35, 0.36], tw: [0.27, 0.31], yb: 0.22,
    top: [[-1, 0.82], [-0.86, 0.92], [-0.55, 0.94], [-0.2, 0.92], [0.3, 0.88], [0.72, 0.8], [0.94, 0.62], [1, 0.46]],
    cabin: { z0: -0.74, z1: 0.06, roof: 1.26, r0: -0.46, r1: -0.16, w: 0.72, style: 'fastback' },
    taper: [0.1, 0.07, 0.12], flare: [0.01, 0.04], head: 'slim', grille: 'aston', tail: 'bar', wing: 'duck',
    exhaust: 'quad', rim: 'y', rimKey: 'rimDark' } });
defCar({ id: 'f488', brand: 'Ferrari', name: '488 GTB', cls: 'exotic', level: 12, price: 32000, tag: 'V8 BITURBO CENTRAL',
  desc: 'Curvas esculpidas pelo vento, entradas laterais em concha e V8 biturbo que grita até 8.000 rpm.',
  colors: ['#d40000', '#ffd400', '#f2f4f7', '#111216', '#1f3fbf', '#6e0f1a', '#c0c4cc', '#ff7a00'],
  stats: { top: 78, accel: 17.0, grip: 2.25, brake: 34, steer: 0.56, wheelBase: 2.65, mass: 1475, nitro: 15, nitroTop: 0.22 },
  engine: 'v8f', gearN: 7,
  look: { L: 4.57, W: 1.95, wb: [0.6, -0.6], r: [0.35, 0.36], tw: [0.27, 0.32], yb: 0.2,
    top: [[-1, 0.76], [-0.86, 0.88], [-0.52, 0.93], [-0.18, 0.9], [0.22, 0.84], [0.58, 0.8], [0.86, 0.62], [1, 0.4]],
    cabin: { z0: -0.52, z1: 0.42, roof: 1.21, r0: -0.16, r1: 0.1, w: 0.7, style: 'coupe' },
    taper: [0.14, 0.07, 0.13], flare: [0.02, 0.05], head: 'slim', grille: 'none', tail: 'round4', wing: 'duck',
    intake: 'side', exhaust: 'center2', rim: 'y', rimKey: 'rim', cal: 'caliperYellow' } });
defCar({ id: 'huracan', brand: 'Lamborghini', name: 'Huracán', cls: 'exotic', level: 13, price: 35000, tag: 'V10 · AWD',
  desc: 'Cunha angular com assinatura de luz em "Y", V10 aspirado e tração integral. Pura agressividade.',
  colors: ['#7fcf1f', '#ff7a00', '#ffd400', '#f2f4f7', '#111216', '#1f5fd6', '#6a2dc9', '#d6001c'],
  stats: { top: 77, accel: 17.4, grip: 2.3, brake: 34, steer: 0.56, wheelBase: 2.62, mass: 1420, nitro: 15, nitroTop: 0.22 },
  engine: 'v10', gearN: 7,
  look: { L: 4.52, W: 1.96, wb: [0.62, -0.6], r: [0.35, 0.36], tw: [0.27, 0.32], yb: 0.2,
    top: [[-1, 0.8], [-0.8, 0.88], [-0.45, 0.9], [-0.1, 0.87], [0.3, 0.8], [0.66, 0.68], [0.93, 0.47], [1, 0.36]],
    cabin: { z0: -0.56, z1: 0.46, roof: 1.17, r0: -0.2, r1: 0.06, w: 0.7, style: 'wedge' },
    taper: [0.12, 0.06, 0.12], head: 'y', grille: 'none', tail: 'y', wing: 'lip', intake: 'big',
    exhaust: 'quadCenter', rim: 'y', rimKey: 'rimDark' } });
defCar({ id: 'r8', brand: 'Audi', name: 'R8 V10', cls: 'exotic', level: 13, price: 30000, tag: 'V10 · QUATTRO',
  desc: 'O superesportivo do dia a dia: V10 aspirado, quattro e as famosas "sideblades" em fibra de carbono.',
  colors: ['#1f4fd8', '#f2f4f7', '#111216', '#c0c4cc', '#d6001c', '#ffd400', '#7fcf1f', '#ff7a00'],
  stats: { top: 77, accel: 16.6, grip: 2.28, brake: 34, steer: 0.56, wheelBase: 2.65, mass: 1590, nitro: 15, nitroTop: 0.22 },
  engine: 'v10', gearN: 7, snd: { pitch: 0.97 },
  look: { L: 4.43, W: 1.94, wb: [0.62, -0.6], r: [0.35, 0.36], tw: [0.27, 0.31], yb: 0.21,
    top: [[-1, 0.84], [-0.86, 0.92], [-0.5, 0.93], [-0.15, 0.9], [0.25, 0.84], [0.62, 0.77], [0.9, 0.6], [1, 0.42]],
    cabin: { z0: -0.54, z1: 0.42, roof: 1.24, r0: -0.2, r1: 0.1, w: 0.72, style: 'coupe' },
    taper: [0.12, 0.06, 0.12], head: 'led', grille: 'mesh', tail: 'split', wing: 'gt', wingH: 0.16,
    intake: 'blade', exhaust: 'ovals', rim: 'y', rimKey: 'rim' } });
defCar({ id: 'mc720', brand: 'McLaren', name: '720S', cls: 'exotic', level: 14, price: 38000, tag: 'V8 · MONOCAGE',
  desc: 'Cockpit em gota, faróis em "órbita" e aerofólio ativo que vira freio a ar. Leve e cirúrgico.',
  colors: ['#ff7a00', '#f2f4f7', '#1f5fd6', '#111216', '#c0c4cc', '#ffd400', '#2e8b57', '#b01e3a'],
  stats: { top: 79, accel: 17.8, grip: 2.28, brake: 35, steer: 0.57, wheelBase: 2.67, mass: 1420, nitro: 15, nitroTop: 0.23 },
  engine: 'v8f', gearN: 7, snd: { pitch: 0.96 },
  look: { L: 4.54, W: 1.93, wb: [0.62, -0.6], r: [0.35, 0.36], tw: [0.27, 0.32], yb: 0.2,
    top: [[-1, 0.8], [-0.85, 0.88], [-0.5, 0.9], [-0.15, 0.86], [0.25, 0.8], [0.62, 0.72], [0.9, 0.52], [1, 0.38]],
    cabin: { z0: -0.62, z1: 0.46, roof: 1.19, r0: -0.2, r1: 0.12, w: 0.66, style: 'teardrop' },
    taper: [0.14, 0.08, 0.14], head: 'socket', grille: 'none', tail: 'slim', wing: 'active',
    extras: ['buttress'], exhaust: 'high2', rim: 'turbine', rimKey: 'rimDark' } });
defCar({ id: 'fordgt', brand: 'Ford', name: 'GT', cls: 'exotic', level: 15, price: 42000, tag: 'LE MANS · V6 BITURBO',
  desc: 'Nascido em Le Mans: arcos voadores (flying buttresses), cabine em gota e faixas de corrida clássicas.',
  colors: ['#1f5fd6', '#f2f4f7', '#d6001c', '#111216', '#ff7a00', '#c0c4cc', '#ffd400', '#2e8b57'],
  stats: { top: 80, accel: 16.9, grip: 2.32, brake: 35, steer: 0.55, wheelBase: 2.71, mass: 1385, nitro: 16, nitroTop: 0.22 },
  engine: 'v6tt', gearN: 7,
  look: { L: 4.76, W: 2.0, wb: [0.64, -0.6], r: [0.35, 0.37], tw: [0.27, 0.34], yb: 0.18,
    top: [[-1, 0.76], [-0.85, 0.86], [-0.5, 0.88], [-0.15, 0.84], [0.25, 0.8], [0.62, 0.74], [0.9, 0.56], [1, 0.38]],
    cabin: { z0: -0.4, z1: 0.46, roof: 1.12, r0: -0.1, r1: 0.14, w: 0.62, style: 'teardrop' },
    taper: [0.12, 0.08, 0.16], head: 'slim', grille: 'wide', tail: 'rings', wing: 'active',
    extras: ['buttress'], exhaust: 'center2', stripes: true, rim: 'y', rimKey: 'rimDark' } });

// ---------------- HYPERCARS (Nível 20+) ----------------
defCar({ id: 'gt3rs', brand: 'Porsche', name: '911 GT3 RS', cls: 'hyper', level: 20, price: 55000, tag: 'PISTA · 9.000 RPM',
  desc: 'O 911 mais extremo: asa pescoço-de-cisne gigante, aletas no teto e boxer aspirado que gira a 9.000 rpm.',
  colors: ['#4aa3df', '#f2f4f7', '#111216', '#ffd400', '#7fcf1f', '#ff7a00', '#b01e3a', '#c0c4cc'],
  stats: { top: 80, accel: 18.0, grip: 2.7, brake: 38, steer: 0.58, wheelBase: 2.46, mass: 1450, nitro: 15, nitroTop: 0.22 },
  engine: 'flat6na', gearN: 7,
  look: { L: 4.57, W: 1.95, wb: [0.64, -0.56], r: [0.35, 0.37], tw: [0.28, 0.34], yb: 0.2,
    top: [[-1, 0.8], [-0.9, 0.9], [-0.62, 0.95], [-0.3, 0.97], [0.05, 0.93], [0.45, 0.84], [0.82, 0.72], [1, 0.46]],
    cabin: { z0: -0.94, z1: 0.14, roof: 1.29, r0: -0.34, r1: -0.08, w: 0.72, style: 'fastback' },
    taper: [0.1, 0.07, 0.13], flare: [0.04, 0.08], head: 'round', grille: 'none', tail: 'bar', wing: 'swan', wingH: 0.55,
    hood: 'vents', roof: 'fins', exhaust: 'center2', extras: ['canards'], rim: 'y', rimKey: 'rimDark', cal: 'caliperYellow' } });
defCar({ id: 'huayra', brand: 'Pagani', name: 'Huayra', cls: 'hyper', level: 21, price: 85000, tag: 'V12 BITURBO · ARTE',
  desc: 'Obra de arte com V12 biturbo, quatro escapes centrais, snorkel no teto e abas aerodinâmicas ativas.',
  colors: ['#2a3f66', '#c0c4cc', '#111216', '#f2f4f7', '#b01e3a', '#d4a017', '#2e8b57', '#ff7a00'],
  stats: { top: 92, accel: 20.4, grip: 2.5, brake: 37, steer: 0.55, wheelBase: 2.8, mass: 1350, nitro: 16, nitroTop: 0.24 },
  engine: 'v12t', gearN: 7,
  look: { L: 4.6, W: 2.04, wb: [0.62, -0.6], r: [0.35, 0.37], tw: [0.28, 0.33], yb: 0.2,
    top: [[-1, 0.8], [-0.86, 0.9], [-0.5, 0.92], [-0.15, 0.88], [0.22, 0.82], [0.6, 0.78], [0.88, 0.6], [1, 0.4]],
    cabin: { z0: -0.52, z1: 0.46, roof: 1.18, r0: -0.14, r1: 0.12, w: 0.68, style: 'teardrop' },
    taper: [0.14, 0.08, 0.14], flare: [0.03, 0.04], head: 'round2', grille: 'none', tail: 'round4', wing: 'active',
    intake: 'side', roof: 'scoop', exhaust: 'quadCenter', rim: 'turbine', rimKey: 'rimGold' } });
defCar({ id: 'svj', brand: 'Lamborghini', name: 'Aventador SVJ', cls: 'hyper', level: 22, price: 70000, tag: 'V12 · AERO ALA 2.0',
  desc: 'V12 de 770 cv, asa gigante com aerodinâmica ALA, tomadas no teto e linhas de caça furtivo.',
  colors: ['#ff7a00', '#7fcf1f', '#111216', '#f2f4f7', '#ffd400', '#6a2dc9', '#1f5fd6', '#c0c4cc'],
  stats: { top: 88, accel: 19.6, grip: 2.55, brake: 38, steer: 0.55, wheelBase: 2.7, mass: 1525, nitro: 16, nitroTop: 0.24 },
  engine: 'v12', gearN: 7, snd: { pitch: 0.97 },
  look: { L: 4.94, W: 2.1, wb: [0.6, -0.6], r: [0.36, 0.38], tw: [0.28, 0.35], yb: 0.18,
    top: [[-1, 0.8], [-0.82, 0.86], [-0.45, 0.88], [-0.1, 0.84], [0.28, 0.76], [0.64, 0.64], [0.92, 0.44], [1, 0.32]],
    cabin: { z0: -0.5, z1: 0.46, roof: 1.13, r0: -0.16, r1: 0.06, w: 0.68, style: 'wedge' },
    taper: [0.14, 0.06, 0.14], head: 'y', grille: 'none', tail: 'y', wing: 'huge', wingH: 0.42,
    intake: 'big', roof: 'scoop', exhaust: 'center2', rim: 'turbine', rimKey: 'rimDark' } });
defCar({ id: 'laferrari', brand: 'Ferrari', name: 'LaFerrari', cls: 'hyper', level: 23, price: 75000, tag: 'HÍBRIDO · V12 HY-KERS',
  desc: 'V12 aspirado + motor elétrico HY-KERS: 963 cv, cabine em bolha e aerodinâmica ativa.',
  colors: ['#d40000', '#111216', '#ffd400', '#f2f4f7', '#1f3fbf', '#6e0f1a', '#c0c4cc', '#ff7a00'],
  stats: { top: 88, accel: 20.0, grip: 2.45, brake: 37, steer: 0.56, wheelBase: 2.65, mass: 1480, nitro: 16, nitroTop: 0.24 },
  engine: 'v12', gearN: 7, snd: { hybrid: 1 },
  look: { L: 4.7, W: 1.99, wb: [0.62, -0.6], r: [0.35, 0.37], tw: [0.27, 0.34], yb: 0.18,
    top: [[-1, 0.74], [-0.86, 0.86], [-0.5, 0.88], [-0.15, 0.84], [0.22, 0.78], [0.58, 0.74], [0.88, 0.54], [1, 0.34]],
    cabin: { z0: -0.46, z1: 0.48, roof: 1.13, r0: -0.12, r1: 0.14, w: 0.62, style: 'teardrop' },
    taper: [0.16, 0.08, 0.15], flare: [0.03, 0.06], head: 'slim', grille: 'none', tail: 'round4', wing: 'active',
    intake: 'side', exhaust: 'center3', rim: 'y', rimKey: 'rimDark', cal: 'caliperYellow' } });
defCar({ id: 'chiron', brand: 'Bugatti', name: 'Chiron', cls: 'hyper', level: 24, price: 95000, tag: 'W16 · 1.500 CV',
  desc: 'W16 quadriturbo de 1.500 cv, grade em ferradura e a icônica linha em "C" na lateral. Mais de 420 km/h.',
  colors: ['#1a3a8a', '#111216', '#f2f4f7', '#b01e3a', '#c0c4cc', '#ff7a00', '#2e8b57', '#ffd400'],
  stats: { top: 96, accel: 21.0, grip: 2.4, brake: 37, steer: 0.53, wheelBase: 2.71, mass: 1995, nitro: 17, nitroTop: 0.24 },
  engine: 'w16', gearN: 7,
  look: { L: 4.54, W: 2.04, wb: [0.62, -0.6], r: [0.36, 0.37], tw: [0.28, 0.34], yb: 0.2,
    top: [[-1, 0.84], [-0.86, 0.92], [-0.5, 0.94], [-0.15, 0.9], [0.25, 0.84], [0.6, 0.8], [0.88, 0.64], [1, 0.46]],
    cabin: { z0: -0.5, z1: 0.46, roof: 1.2, r0: -0.14, r1: 0.12, w: 0.7, style: 'teardrop' },
    taper: [0.12, 0.08, 0.13], head: 'quad', grille: 'horseshoe', tail: 'bar', wing: 'active', intake: 'cline',
    exhaust: 'quadCenter', rim: 'turbine', rimKey: 'rim', cal: 'caliperBlue' } });
defCar({ id: 'jesko', brand: 'Koenigsegg', name: 'Jesko', cls: 'hyper', level: 25, price: 90000, tag: 'V8 BITURBO · 1.600 CV',
  desc: 'Asa bumerangue gigante, V8 biturbo que gira a 8.500 rpm e câmbio de 9 marchas LST. Absurdo.',
  colors: ['#c0c4cc', '#f2f4f7', '#ff7a00', '#111216', '#1f5fd6', '#b01e3a', '#7fcf1f', '#ffd400'],
  stats: { top: 97, accel: 21.5, grip: 2.5, brake: 38, steer: 0.55, wheelBase: 2.7, mass: 1420, nitro: 17, nitroTop: 0.24 },
  engine: 'v8f', gearN: 9, snd: { red: 8500, pitch: 0.9 },
  look: { L: 4.61, W: 2.03, wb: [0.62, -0.6], r: [0.35, 0.37], tw: [0.28, 0.34], yb: 0.18,
    top: [[-1, 0.78], [-0.86, 0.86], [-0.5, 0.88], [-0.15, 0.85], [0.22, 0.78], [0.6, 0.72], [0.9, 0.52], [1, 0.34]],
    cabin: { z0: -0.5, z1: 0.46, roof: 1.13, r0: -0.14, r1: 0.12, w: 0.66, style: 'teardrop' },
    taper: [0.14, 0.08, 0.15], head: 'slim', grille: 'none', tail: 'rings', wing: 'boomerang', wingH: 0.5,
    intake: 'big', roof: 'fin', exhaust: 'center3', rim: 'turbine', rimKey: 'rimDark', cal: 'caliperYellow' } });

const UPGRADES = {
  engine: { name: 'Motor', icon: 'engine', desc: '+4% velocidade máxima por nível' },
  tires: { name: 'Pneus', icon: 'tire', desc: 'Aderência: +10% já no nível 1 (até +30%)' },
  turbo: { name: 'Turbo', icon: 'turbo', desc: '+12% potência e recarga do Nitro' },
};
const UPGRADE_BASE = [900, 1600, 2600, 4000, 6000];   // × multiplicador da classe
const TIRE_CURVE = [0, 0.1, 0.17, 0.22, 0.26, 0.3];   // ganho de aderência acumulado (forte no início)
const MAX_LEVEL = 5;

function computeStats(id, up) {
  const c = CARS[id], s = c.stats; up = up || {};
  const e = up.engine || 0, t = up.tires || 0, b = up.turbo || 0;
  const prof = ENGINE_PROFILES[c.engine] || ENGINE_PROFILES.v10, snd = c.snd || {};
  return {
    ...s, id, cls: c.cls, engine: c.engine, snd: c.snd || null, gears: c.gears, hw: c.hw, hl: c.hl,
    red: snd.red || prof.red, idle: prof.idle,
    top: s.top * (1 + 0.04 * e), accel: s.accel * (1 + 0.025 * e), grip: s.grip * (1 + TIRE_CURVE[t]),
    nitro: s.nitro * (1 + 0.12 * b), nitroRegen: 1 + 0.12 * b, nitroTop: s.nitroTop * (1 + 0.06 * b),
  };
}

/* =====================================================================
   AUDIO MANAGER — 100% síntese procedural (Web Audio API)
   Um perfil por arquitetura de motor; cada carro ajusta rotação e tom.
   ===================================================================== */
const ENGINE_PROFILES = {
  // 4 cilindros turbo (Civic, Evo): áspero, com assobio de turbina e blow-off
  i4t:    { cyl: 4, base: 1.0, idle: 900, red: 7200, oscs: [{ t: 'sawtooth', m: 1, g: 0.42 }, { t: 'square', m: 2, g: 0.16 }, { t: 'sawtooth', m: 0.5, g: 0.22 }],
            cut: [480, 0.3], q: 3, dist: 16, trem: 0.16, tremDiv: 2, vol: 0.3, turbo: 0.9, bov: 1 },
  // 6 em linha biturbo (Supra 2JZ, Skyline RB26, M4): liso e metálico
  i6t:    { cyl: 6, base: 0.5, idle: 850, red: 7300, oscs: [{ t: 'sawtooth', m: 1, g: 0.44 }, { t: 'sawtooth', m: 2, g: 0.2, d: 6 }, { t: 'triangle', m: 3, g: 0.1 }],
            cut: [560, 0.34], q: 2.5, dist: 8, trem: 0.07, tremDiv: 3, vol: 0.3, turbo: 1.0, bov: 1 },
  // Boxer 4 (STI): o "rumble" de ignição desigual (modulação forte)
  boxer4: { cyl: 4, base: 1.0, idle: 850, red: 7000, oscs: [{ t: 'sawtooth', m: 1, g: 0.4 }, { t: 'square', m: 0.5, g: 0.36 }, { t: 'sawtooth', m: 0.25, g: 0.22 }],
            cut: [260, 0.2], q: 5, dist: 34, trem: 0.6, tremDiv: 2, vol: 0.34, turbo: 0.8, bov: 1, pops: 0.5 },
  // V8 aspirado cross-plane (Camaro, Mustang): grave, distorcido e com "burble"
  v8:     { cyl: 8, base: 0.5, idle: 800, red: 6800, oscs: [{ t: 'sawtooth', m: 1, g: 0.5 }, { t: 'square', m: 0.5, g: 0.42 }, { t: 'sawtooth', m: 0.25, g: 0.3 }],
            cut: [200, 0.13], q: 6, dist: 45, trem: 0.5, tremDiv: 4, vol: 0.38, pops: 0.6 },
  // V8 biturbo (AMG, RS6, Vantage): grave, com estalos no alívio
  v8t:    { cyl: 8, base: 0.5, idle: 800, red: 7000, oscs: [{ t: 'sawtooth', m: 1, g: 0.48 }, { t: 'square', m: 0.5, g: 0.34 }, { t: 'sawtooth', m: 2, g: 0.14 }],
            cut: [300, 0.2], q: 4.5, dist: 30, trem: 0.3, tremDiv: 4, vol: 0.36, turbo: 0.6, bov: 0.6, pops: 0.9 },
  // V8 flat-plane (Ferrari, McLaren, Koenigsegg): agudo, "grita" em alta
  v8f:    { cyl: 8, base: 1.0, idle: 1000, red: 8500, oscs: [{ t: 'sawtooth', m: 1, g: 0.42 }, { t: 'square', m: 2, g: 0.16 }, { t: 'sawtooth', m: 0.5, g: 0.16 }],
            cut: [650, 0.34], q: 2.8, dist: 10, trem: 0.1, tremDiv: 2, vol: 0.3, turbo: 0.55, bov: 0.5 },
  // Boxer 6 (911): timbre rasgado de 1,5ª ordem
  flat6:  { cyl: 6, base: 0.5, idle: 900, red: 7500, oscs: [{ t: 'sawtooth', m: 1, g: 0.42 }, { t: 'sawtooth', m: 1.5, g: 0.22 }, { t: 'square', m: 3, g: 0.08 }],
            cut: [520, 0.33], q: 3.2, dist: 12, trem: 0.14, tremDiv: 3, vol: 0.3, turbo: 0.55, bov: 0.4 },
  flat6na:{ cyl: 6, base: 0.5, idle: 1000, red: 9000, oscs: [{ t: 'sawtooth', m: 1, g: 0.42 }, { t: 'sawtooth', m: 1.5, g: 0.24 }, { t: 'sawtooth', m: 3, g: 0.12, d: 5 }],
            cut: [760, 0.42], q: 2.4, dist: 7, trem: 0.1, tremDiv: 3, vol: 0.3 },
  // V10 (Huracán, R8): brilhante com oitava
  v10:    { cyl: 10, base: 0.5, idle: 1000, red: 8500, oscs: [{ t: 'sawtooth', m: 1, g: 0.42 }, { t: 'sawtooth', m: 2, g: 0.2, d: 9 }, { t: 'square', m: 0.5, g: 0.16 }],
            cut: [420, 0.3], q: 3.5, dist: 6, trem: 0.12, tremDiv: 2, vol: 0.3 },
  // V12 aspirado (Aventador, LaFerrari): rico em harmônicos, sirene em alta
  v12:    { cyl: 12, base: 0.5, idle: 1000, red: 9000, oscs: [{ t: 'sawtooth', m: 1, g: 0.36 }, { t: 'sawtooth', m: 2, g: 0.24, d: 5 }, { t: 'sawtooth', m: 3, g: 0.12 }, { t: 'square', m: 0.5, g: 0.1 }],
            cut: [700, 0.42], q: 2, dist: 5, trem: 0.05, tremDiv: 2, vol: 0.28 },
  v12t:   { cyl: 12, base: 0.5, idle: 900, red: 6800, oscs: [{ t: 'sawtooth', m: 1, g: 0.4 }, { t: 'sawtooth', m: 2, g: 0.2, d: 5 }, { t: 'square', m: 0.5, g: 0.18 }],
            cut: [480, 0.3], q: 3, dist: 10, trem: 0.08, tremDiv: 3, vol: 0.32, turbo: 0.9, bov: 0.8 },
  // W16 quadriturbo (Chiron): trovão grave + turbinas
  w16:    { cyl: 16, base: 0.5, idle: 800, red: 6700, oscs: [{ t: 'sawtooth', m: 1, g: 0.4 }, { t: 'square', m: 0.5, g: 0.36 }, { t: 'sawtooth', m: 0.25, g: 0.28 }, { t: 'sawtooth', m: 2, g: 0.14 }],
            cut: [300, 0.2], q: 4, dist: 26, trem: 0.22, tremDiv: 4, vol: 0.4, turbo: 1.2, bov: 1 },
  // V6 biturbo (Ford GT EcoBoost)
  v6tt:   { cyl: 6, base: 0.5, idle: 850, red: 7000, oscs: [{ t: 'sawtooth', m: 1, g: 0.46 }, { t: 'square', m: 0.5, g: 0.28 }, { t: 'sawtooth', m: 2, g: 0.14 }],
            cut: [420, 0.28], q: 3.5, dist: 18, trem: 0.18, tremDiv: 3, vol: 0.32, turbo: 1.0, bov: 1 },
};

function distortionCurve(k) {
  const n = 1024, c = new Float32Array(n), deg = Math.PI / 180;
  for (let i = 0; i < n; i++) { const x = (i * 2) / n - 1; c[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x)); }
  return c;
}

class EngineVoice {
  constructor(am, key, dest, positional = false, snd = null) {
    const ctx = am.ctx; this.ctx = ctx; this.key = key;
    this.p = { ...(ENGINE_PROFILES[key] || ENGINE_PROFILES.v10), ...(snd || {}) };
    const p = this.p;
    this.out = ctx.createGain(); this.out.gain.value = 0;
    this.filter = ctx.createBiquadFilter(); this.filter.type = 'lowpass'; this.filter.Q.value = p.q; this.filter.frequency.value = 600;
    this.mix = ctx.createGain(); this.mix.gain.value = 1;
    if (p.dist > 0) {
      this.shaper = ctx.createWaveShaper(); this.shaper.curve = distortionCurve(p.dist); this.shaper.oversample = '2x';
      this.mix.connect(this.shaper); this.shaper.connect(this.filter);
    } else this.mix.connect(this.filter);
    this.am = ctx.createGain(); this.am.gain.value = 1;
    this.filter.connect(this.am); this.am.connect(this.out);
    if (p.trem > 0) {
      this.lfo = ctx.createOscillator(); this.lfo.type = 'sine'; this.lfo.frequency.value = 10;
      this.lfoGain = ctx.createGain(); this.lfoGain.gain.value = p.trem * 0.5;
      this.am.gain.value = 1 - p.trem * 0.5;
      this.lfo.connect(this.lfoGain); this.lfoGain.connect(this.am.gain); this.lfo.start();
    }
    this.oscs = p.oscs.map((o) => {
      const osc = ctx.createOscillator(); osc.type = o.t; osc.frequency.value = 50 * o.m; if (o.d) osc.detune.value = o.d;
      const g = ctx.createGain(); g.gain.value = o.g; osc.connect(g); g.connect(this.mix); osc.start();
      return { osc, m: o.m };
    });
    // assobio da turbina (senoide aguda, fora do passa-baixa)
    if (p.turbo) {
      this.turboOsc = ctx.createOscillator(); this.turboOsc.type = 'sine'; this.turboOsc.frequency.value = 2000;
      this.turboGain = ctx.createGain(); this.turboGain.gain.value = 0;
      this.turboOsc.connect(this.turboGain); this.turboGain.connect(this.out); this.turboOsc.start();
    }
    // camada elétrica dos híbridos
    if (p.hybrid) {
      this.hyb = ctx.createOscillator(); this.hyb.type = 'triangle'; this.hyb.frequency.value = 200;
      this.hybGain = ctx.createGain(); this.hybGain.gain.value = 0;
      this.hyb.connect(this.hybGain); this.hybGain.connect(this.out); this.hyb.start();
    }
    if (positional) {
      this.panner = ctx.createPanner();
      this.panner.panningModel = 'equalpower'; this.panner.distanceModel = 'inverse';
      this.panner.refDistance = 9; this.panner.maxDistance = 500; this.panner.rolloffFactor = 1.3;
      this.out.connect(this.panner); this.panner.connect(dest);
    } else this.out.connect(dest);
    this.freq = 50;
  }
  update(rpm, speedN, throttle, volume = 1) {
    const t = this.ctx.currentTime, p = this.p;
    const f = (rpm / 60) * (p.cyl / 2) * p.base * (p.pitch || 1);
    this.freq = f;
    for (const o of this.oscs) o.osc.frequency.setTargetAtTime(f * o.m, t, 0.025);
    const rpmN = clamp(rpm / p.red, 0, 1.05);
    const cutoff = p.cut[0] + f * p.cut[1] * 10 * (0.45 + 0.55 * throttle);
    this.filter.frequency.setTargetAtTime(clamp(cutoff, 80, 12000), t, 0.04);
    const g = p.vol * volume * (0.42 + 0.58 * throttle) * (0.75 + 0.35 * rpmN);
    this.out.gain.setTargetAtTime(g, t, 0.05);
    if (this.lfo) this.lfo.frequency.setTargetAtTime(Math.max(4, f / p.tremDiv), t, 0.05);
    if (this.turboOsc) { this.turboOsc.frequency.setTargetAtTime(1500 + rpmN * 3600, t, 0.06); this.turboGain.gain.setTargetAtTime(p.turbo * 0.1 * throttle * rpmN * rpmN, t, 0.1); }
    if (this.hyb) { this.hyb.frequency.setTargetAtTime(120 + speedN * 1500, t, 0.05); this.hybGain.gain.setTargetAtTime(0.16 * p.hybrid * (0.3 + 0.7 * throttle), t, 0.1); }
  }
  setPosition(x, y, z) {
    if (!this.panner) return;
    const t = this.ctx.currentTime;
    if (this.panner.positionX) { this.panner.positionX.setTargetAtTime(x, t, 0.02); this.panner.positionY.setTargetAtTime(y, t, 0.02); this.panner.positionZ.setTargetAtTime(z, t, 0.02); }
    else this.panner.setPosition(x, y, z);
  }
  stop() {
    const t = this.ctx.currentTime;
    this.out.gain.cancelScheduledValues(t); this.out.gain.setTargetAtTime(0, t, 0.05);
    setTimeout(() => {
      try {
        for (const o of this.oscs) o.osc.stop(); if (this.lfo) this.lfo.stop(); if (this.turboOsc) this.turboOsc.stop(); if (this.hyb) this.hyb.stop();
        this.out.disconnect(); if (this.panner) this.panner.disconnect();
      } catch (e) { }
    }, 400);
  }
}

/* =====================================================================
   MODELOS 3D EXTERNOS — .glb/.gltf de repositórios abertos (GitHub Pages,
   jsDelivr, raw GitHub, unpkg). Cada carro pode listar espelhos; o Engine
   (GLTFLoader + DRACOLoader) tenta em ordem com tempo-limite. Qualquer falha
   (rede, CORS, 404, decodificador Draco) mantém o carro procedural PBR.
   Também aceita URLs na barra de endereço: index.html?glb=f488,https://…/carro.glb
   ===================================================================== */
const EXTERNAL_MODELS = {
  f488: {
    name: 'Ferrari 458 Italia (base do 488 GTB)',
    urls: [
      'https://threejs.org/examples/models/gltf/ferrari.glb',                                   // GitHub Pages (three.js)
      'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r160/examples/models/gltf/ferrari.glb',     // jsDelivr (espelho do GitHub)
      'https://raw.githubusercontent.com/mrdoob/three.js/r160/examples/models/gltf/ferrari.glb',
    ],
    credit: 'Ferrari 458 Italia por vicent091036 (Sketchfab), distribuído nos exemplos do three.js',
    // nome do nó/malha → papel no carro (materiais do jogo)
    parts: [
      [/^body$/, 'paint'], [/^glass$/, 'glass'], [/^lights$/, 'head'], [/^lights_red$/, 'tail'], [/^leds$/, 'drl'],
      [/^brakes$/, 'tail'], [/^(rim_[fr][lr]|wheel)$/, 'rim'],   // 'brakes' = lanternas redondas do 458 [/^brake$/, 'disc'], [/^tire$/, 'tire'],
      [/^(grills|wipers)$/, 'grille'], [/^chrome$/, 'chrome'], [/^(carbon fibre|carbon_fibre_trim|steering_carbon)$/, 'carbon'], [/^metal$/, 'metal'],
    ],
    interior: /^(leather|carpet|trim|carbon_fibre_trim|steering_\w+)$/,   // removido nas cópias das IAs (menos triângulos)
    wheels: /^wheel_(f|r)(l|r)$/,
  },
};
(() => {   // ?glb=idDoCarro,url — carrega qualquer glTF aberto no lugar do carro (adaptador genérico)
  try {
    for (const v of new URLSearchParams(location.search).getAll('glb')) {
      const i = v.indexOf(','), id = v.slice(0, i), url = v.slice(i + 1);
      if (i > 0 && /^https?:\/\//.test(url)) EXTERNAL_MODELS[id] = { name: 'Modelo externo (URL)', urls: [url], credit: url };
    }
  } catch (e) { }
})();

// junta geometrias indexadas (posição/normal/uv [+cor]) sem desindexar — modelos glTF têm centenas de milhares de triângulos
function mergeIndexed(list) {
  let nv = 0, ni = 0;
  for (const g of list) { nv += g.attributes.position.count; ni += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(nv * 3), nor = new Float32Array(nv * 3), uv = new Float32Array(nv * 2), col = list.every((g) => g.attributes.color) ? new Float32Array(nv * 3) : null;
  const idx = nv > 65535 ? new Uint32Array(ni) : new Uint16Array(ni);
  let ov = 0, oi = 0;
  for (const g of list) {
    const P = g.attributes.position, N = g.attributes.normal, U = g.attributes.uv, C = g.attributes.color, c = P.count;
    for (let i = 0; i < c; i++) {
      const o = (ov + i) * 3; pos[o] = P.getX(i); pos[o + 1] = P.getY(i); pos[o + 2] = P.getZ(i);
      nor[o] = N.getX(i); nor[o + 1] = N.getY(i); nor[o + 2] = N.getZ(i);
      uv[(ov + i) * 2] = U.getX(i); uv[(ov + i) * 2 + 1] = U.getY(i);
      if (col) { col[o] = C.getX(i); col[o + 1] = C.getY(i); col[o + 2] = C.getZ(i); }
    }
    if (g.index) { const a = g.index.array; for (let k = 0; k < a.length; k++) idx[oi + k] = a[k] + ov; oi += a.length; }
    else { for (let k = 0; k < c; k++) idx[oi + k] = ov + k; oi += c; }
    ov += c; g.dispose();
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3)); out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); if (col) out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(idx, 1)); out.computeBoundingSphere(); out.computeBoundingBox();
  return out;
}
// UV por projeção de caixa em metros (flakes/casca de laranja da pintura têm escala física em qualquer modelo)
function boxUV(geo) {
  const p = geo.attributes.position, n = geo.attributes.normal, uv = new Float32Array(p.count * 2);
  for (let i = 0; i < p.count; i++) {
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i));
    if (ax >= ay && ax >= az) { uv[i * 2] = p.getZ(i); uv[i * 2 + 1] = p.getY(i); }
    else if (ay >= az) { uv[i * 2] = p.getX(i); uv[i * 2 + 1] = p.getZ(i); }
    else { uv[i * 2] = p.getX(i); uv[i * 2 + 1] = p.getY(i); }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2));
}

/* =====================================================================
   LIGHT RIG — faróis (2 SpotLights apontadas para o asfalto) e lanterna
   (PointLight vermelha que acende com o freio) presos à carroceria.
   Número de luzes fixo durante a corrida (sem recompilar shaders): as
   luzes livres ficam "estacionadas" com intensidade 0.
   ===================================================================== */
class LightRig {
  constructor(parent) {
    this.parent = parent; this.inst = null;
    this.heads = [0, 1].map(() => new THREE.SpotLight(0xfff1dc, 0, 120, 0.44, 0.5, 1.2));
    this.tail = new THREE.PointLight(0xff1428, 0, 8, 2);
    this.park();
  }
  park() {
    for (const L of this.heads) { this.parent.add(L, L.target); L.intensity = 0; L.position.set(0, -600, 0); L.target.position.set(0, -601, 1); }
    this.parent.add(this.tail); this.tail.intensity = 0; this.tail.position.set(0, -600, 0); this.inst = null;
  }
  attach(inst) {
    if (this.inst === inst) return;
    const T = inst.T, B = inst.body; this.inst = inst;
    T.heads.forEach(([x, y, z], k) => { const L = this.heads[k]; B.add(L, L.target); L.position.set(x, y, z); L.target.position.set(x * 1.8, -0.4, z + 24); });
    const [tx, ty, tz] = T.tailPos; B.add(this.tail); this.tail.position.set(tx, ty, tz);
  }
  set(head, tail) { for (const L of this.heads) L.intensity = head; this.tail.intensity = tail; }
}

/* =====================================================================
   CAR FACTORY — construtor paramétrico de carros (primitivas combinadas)
   Um só gerador cria os 23 modelos a partir das especificações de CARS:
   perfil lateral (spline) extrudado com bevel + cabine + detalhes de estilo.
   Peças são mescladas por material → poucos draw calls por carro.
   ===================================================================== */
const CarFactory = {
  mats: null, templates: {}, tailColor: new THREE.Color(0.9, 0.01, 0.025),
  initMats() {
    if (this.mats) return;
    const S = (o) => new THREE.MeshStandardMaterial(o);
    // colmeia para grades
    const hc = makeCanvas(128, 128), hg = hc.getContext('2d');
    hg.fillStyle = '#050506'; hg.fillRect(0, 0, 128, 128); hg.strokeStyle = '#44474e'; hg.lineWidth = 2.5;
    for (let y = 0; y < 11; y++) for (let x = 0; x < 10; x++) {
      const cx = x * 14 + (y % 2) * 7, cy = y * 12; hg.beginPath();
      for (let k = 0; k < 6; k++) { const a = (k * Math.PI) / 3 + Math.PI / 6; hg.lineTo(cx + Math.cos(a) * 6.5, cy + Math.sin(a) * 6.5); }
      hg.closePath(); hg.stroke();
    }
    const hex = canvasTex(hc, true); hex.repeat.set(4, 2);
    // farol de painel: carcaça escura, refletores cromados, 2 projetores e faixa de LED na borda dianteira (v = 0)
    const lc = makeCanvas(256, 128), lg = lc.getContext('2d');
    lg.fillStyle = '#0b0d10'; lg.fillRect(0, 0, 256, 128);
    const rg = lg.createLinearGradient(0, 20, 0, 100); rg.addColorStop(0, '#23272d'); rg.addColorStop(1, '#101215');
    lg.fillStyle = rg; lg.fillRect(10, 18, 236, 78);
    for (const cx of [78, 170]) {
      const g = lg.createRadialGradient(cx, 56, 2, cx, 56, 30); g.addColorStop(0, '#ffffff'); g.addColorStop(0.35, '#dfe8ff'); g.addColorStop(0.5, '#59606b'); g.addColorStop(0.62, '#9aa2ad'); g.addColorStop(0.75, '#1a1d22'); g.addColorStop(1, 'rgba(16,18,21,0)');
      lg.fillStyle = g; lg.beginPath(); lg.ellipse(cx, 56, 34, 30, 0, 0, Math.PI * 2); lg.fill();
    }
    lg.fillStyle = '#ffffff'; lg.fillRect(8, 106, 240, 12); lg.fillStyle = 'rgba(255,255,255,0.35)'; lg.fillRect(8, 100, 240, 4);
    const headTex = canvasTex(lc);
    this.mats = {
      rubber: S({ color: 0x121214, roughness: 0.9, metalness: 0, side: THREE.DoubleSide }),
      rim: S({ color: 0xcfd4dc, roughness: 0.2, metalness: 1 }),
      chrome: S({ color: 0xeef1f6, roughness: 0.08, metalness: 1 }),
      rimDark: S({ color: 0x24272d, roughness: 0.35, metalness: 0.85 }),
      rimGold: S({ color: 0xc99a2e, roughness: 0.25, metalness: 1 }),
      rimBronze: S({ color: 0x7d6035, roughness: 0.3, metalness: 1 }),
      disc: S({ color: 0x77797e, roughness: 0.4, metalness: 0.9 }),
      caliper: S({ color: 0xe0162b, roughness: 0.4, metalness: 0.2 }),
      caliperGold: S({ color: 0xffb300, roughness: 0.35, metalness: 0.4 }),
      caliperBlue: S({ color: 0x1f5fd6, roughness: 0.4, metalness: 0.3 }),
      caliperYellow: S({ color: 0xffc400, roughness: 0.35, metalness: 0.3 }),
      trim: S({ color: 0x15161a, roughness: 0.55, metalness: 0.3 }),
      carbon: S({ color: 0x1b1c20, roughness: 0.42, metalness: 0.5 }),
      glass: S({ color: 0x080c12, roughness: 0.04, metalness: 0.92, envMapIntensity: 1.6 }),
      // faróis/lanternas: MeshBasic emissivo (HDR → bloom), ligados a SpotLight/PointLight reais (LightRig)
      head: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.0, 2.08, 2.3) }),
      tail: new THREE.MeshBasicMaterial({ color: this.tailColor.clone() }),
      drl: new THREE.MeshBasicMaterial({ color: new THREE.Color(1.8, 1.85, 2.0) }),
      headPanel: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.2, 2.28, 2.5), map: headTex }),
      metal: S({ color: 0x9a9da3, roughness: 0.32, metalness: 1 }),
      tire: S({ color: 0x121214, roughness: 0.86, metalness: 0, normalMap: TextureLab.rubber().normalMap, normalScale: new THREE.Vector2(0.6, 0.6) }),
      // vidro do modelo externo: fumê translúcido com reflexo de Fresnel (o interior aparece)
      glassExt: new THREE.MeshPhysicalMaterial({ color: 0x0b1016, metalness: 0, roughness: 0.08, transparent: true, opacity: 0.72, envMapIntensity: 2.2, side: THREE.DoubleSide }),
      // lente sobre faróis/lanternas procedurais: vidro transparente que reflete o ambiente por cima do emissivo
      lens: new THREE.MeshPhysicalMaterial({ color: 0xffffff, metalness: 0, roughness: 0.06, transparent: true, opacity: 0.22, envMapIntensity: 2.5, depthWrite: false }),
      neon: S({ color: 0x00333d, emissive: 0x00e5ff, emissiveIntensity: 3.0 }),
      grille: S({ color: 0x09090b, roughness: 0.85, metalness: 0.2 }),
      gmesh: S({ map: hex, color: 0xffffff, roughness: 0.6, metalness: 0.5 }),
      white: new THREE.MeshPhysicalMaterial({ color: 0xf4f6fa, roughness: 0.3, metalness: 0.1, clearcoat: 1, clearcoatRoughness: 0.12, side: THREE.DoubleSide }),
      flame: new THREE.MeshBasicMaterial({ color: new THREE.Color(0.35, 0.9, 3.2), transparent: true, opacity: 0.8, blending: THREE.AdditiveBlending, depthWrite: false }),
      flameCore: new THREE.MeshBasicMaterial({ color: new THREE.Color(2.5, 2.8, 3.2), transparent: true, opacity: 0.9, blending: THREE.AdditiveBlending, depthWrite: false }),
      shadow: new THREE.MeshBasicMaterial({ map: radialTexture('rgba(0,0,0,0.78)', 'rgba(0,0,0,0)'), transparent: true, depthWrite: false }),
      // carro fantasma (Modo Treino): azul, transparente, opacity 0.3
      ghost: new THREE.MeshStandardMaterial({ color: 0x7fc8ff, emissive: 0x2a6cff, emissiveIntensity: 0.9, transparent: true, opacity: 0.3, depthWrite: false, roughness: 0.3, metalness: 0.2 }),
      // pré-passo só de profundidade: o fantasma aparece como uma casca translúcida limpa (sem rodas/peças internas vazando)
      ghostDepth: new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true }),
    };
  },
  // Pintura PBR automotiva: base metálica com flocos (normal map de ruído de alta frequência) sob um
  // verniz (clearcoat) espelhado com leve "casca de laranja" — reflete o céu/ambiente (scene.environment).
  paint(color) {
    const F = TextureLab.flakes();
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color(color), metalness: 0.62, roughness: 0.36, envMapIntensity: 1.2,
      normalMap: F.flakes, normalScale: new THREE.Vector2(0.16, 0.16),
      clearcoat: 1, clearcoatRoughness: 0.08, clearcoatNormalMap: F.peel, clearcoatNormalScale: new THREE.Vector2(0.06, 0.06),
    });
  },

  build(id) {
    if (this.templates[id]) return this.templates[id];
    this.initMats();
    const C = CARS[id], S = C.look, H = Math.PI / 2;
    const L = S.L, W = S.W, hL = L / 2, zF = S.wb[0] * hL, zR = S.wb[1] * hL;
    const rF = S.r[0], rR = S.r[1], arF = rF + 0.085, arR = rR + 0.085, yb = S.yb, bev = S.bevel, bs = bev * 0.75;
    const fl = Array.isArray(S.flare) ? S.flare : [S.flare || 0, S.flare || 0];
    const parts = {};
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), V = new THREE.Vector3(), SC = new THREE.Vector3();
    const put = (key, g) => { (parts[key] || (parts[key] = [])).push(g); return g; };
    const add = (geo, key, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, sx = 1, sy = 1, sz = 1) => {
      M4.compose(V.set(x, y, z), Q.setFromEuler(E.set(rx, ry, rz)), SC.set(sx, sy, sz));
      geo.applyMatrix4(M4); return put(key, geo);
    };
    const box = (w, h, d, key, x, y, z, rx = 0, ry = 0, rz = 0) => add(new THREE.BoxGeometry(w, h, d), key === 'head' ? 'headPanel' : key, x, y, z, rx, ry, rz);
    const cyl = (rt, rb, h, seg, key, x, y, z, rx = 0, ry = 0, rz = 0) => add(new THREE.CylinderGeometry(rt, rb, h, seg), key, x, y, z, rx, ry, rz);
    const sym = (fn) => { fn(1); fn(-1); };
    const side = (shape, width, key, bevel = 0.08) => {
      const bt = Math.min(bevel, width * 0.25);
      const g = new THREE.ExtrudeGeometry(shape, { depth: Math.max(0.01, width - 2 * bt), bevelEnabled: true, bevelThickness: bt, bevelSize: bevel * 0.75, bevelSegments: 5, curveSegments: 22 });
      g.rotateY(-Math.PI / 2); g.translate((width - 2 * bt) / 2, 0, 0);
      return put(key, g);
    };

    // ---- 1) linha superior: interpolação Hermite (sem "dobras") + proteção dos arcos das rodas ----
    const kz = S.top.map((p) => p[0] * hL), ky = S.top.map((p) => p[1]), nK = kz.length;
    const mK = ky.map((_, k) => (k === 0 ? (ky[1] - ky[0]) / (kz[1] - kz[0]) : k === nK - 1 ? (ky[k] - ky[k - 1]) / (kz[k] - kz[k - 1]) : (ky[k + 1] - ky[k - 1]) / (kz[k + 1] - kz[k - 1])));
    const hermite = (z) => {
      let k = 0; while (k < nK - 2 && z > kz[k + 1]) k++;
      const h = kz[k + 1] - kz[k], t = clamp((z - kz[k]) / h, 0, 1), t2 = t * t, t3 = t2 * t;
      return (2 * t3 - 3 * t2 + 1) * ky[k] + (t3 - 2 * t2 + t) * h * mK[k] + (-2 * t3 + 3 * t2) * ky[k + 1] + (t3 - t2) * h * mK[k + 1];
    };
    const archLim = (z) => {
      let m = 0;
      for (const [zc, r, ar] of [[zF, rF, arF], [zR, rR, arR]]) { const d = z - zc, R2 = (ar + 0.08) * (ar + 0.08); if (d * d < R2) m = Math.max(m, r + Math.sqrt(R2 - d * d) - 0.04); }
      return m;
    };
    const NP = 96, dense = [];
    for (let i = 0; i <= NP; i++) { const z = -hL + (L * i) / NP; dense.push(new THREE.Vector2(z, Math.max(hermite(z), archLim(z)))); }
    for (let pass = 0; pass < 2; pass++) {
      const ys = dense.map((p) => p.y);
      for (let i = 1; i < NP; i++) dense[i].y = Math.max(archLim(dense[i].x), 0.25 * ys[i - 1] + 0.5 * ys[i] + 0.25 * ys[i + 1]);
    }
    const topY = (z) => { z = clamp(z, -hL, hL); const f = ((z + hL) / L) * NP, i = Math.min(NP - 1, Math.floor(f)); return lerp(dense[i].y, dense[i + 1].y, f - i); };
    const surf = (z) => topY(z) + bs;                           // superfície real (com bevel) no meio da largura
    const slopeAt = (z) => (topY(z + 0.12) - topY(z - 0.12)) / 0.24;
    const zNose = hL + bs, zTail = -hL - bs, yN = topY(hL), yT = topY(-hL);

    // ---- 2) carroceria: perfil lateral extrudado na largura ----
    const s = new THREE.Shape();
    s.moveTo(-hL, yb + 0.08);
    for (const p of dense) s.lineTo(p.x, p.y);
    s.lineTo(hL - 0.02, yb + 0.1); s.lineTo(hL - 0.14, yb);
    s.lineTo(zF + arF, yb); s.absarc(zF, rF, arF, 0, Math.PI, false); s.lineTo(zF - arF, yb);
    s.lineTo(zR + arR, yb); s.absarc(zR, rR, arR, 0, Math.PI, false); s.lineTo(zR - arR, yb);
    s.lineTo(-hL + 0.1, yb);
    side(s, W, 'paint', bev);

    // ---- 3) cabine (vidro) em 6 estilos: coupe, fastback, sedan, hatch, wagon, wedge, teardrop ----
    const cb = S.cabin, z0 = cb.z0 * hL, z1 = cb.z1 * hL, ra = cb.r0 * hL, rb = cb.r1 * hL, roof = cb.roof, cw = cb.w * W, st = cb.style;
    const cab = [], b0 = topY(z0) - 0.03, b1 = topY(z1) - 0.03;
    const quad = (A, P, B, n, skipFirst = false) => { for (let i = skipFirst ? 1 : 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; cab.push(new THREE.Vector2(a * A[0] + b * P[0] + c * B[0], a * A[1] + b * P[1] + c * B[1])); } };
    const line = (A, B, n, skipFirst = false) => { for (let i = skipFirst ? 1 : 0; i <= n; i++) { const t = i / n; cab.push(new THREE.Vector2(lerp(A[0], B[0], t), lerp(A[1], B[1], t))); } };
    if (st === 'hatch' || st === 'wagon') quad([z0, b0], [z0 + (st === 'wagon' ? 0.02 : 0.08), roof - 0.02], [ra, roof], 10);
    else if (st === 'sedan') quad([z0, b0], [lerp(z0, ra, 0.25), roof], [ra, roof], 10);
    else if (st === 'wedge') line([z0, b0], [ra, roof], 6);
    else if (st === 'teardrop') quad([z0, b0], [z0 + (ra - z0) * 0.15, roof + 0.02], [ra, roof], 12);
    else quad([z0, b0], [lerp(z0, ra, st === 'fastback' ? 0.55 : 0.4), lerp(b0, roof, st === 'fastback' ? 0.92 : 1.0)], [ra, roof], 12);
    for (let i = 1; i < 6; i++) { const t = i / 6; cab.push(new THREE.Vector2(lerp(ra, rb, t), roof + Math.sin(t * Math.PI) * 0.015)); }
    if (st === 'wedge') line([rb, roof], [z1, b1], 6);
    else quad([rb, roof], [lerp(rb, z1, st === 'teardrop' ? 0.45 : 0.28), roof - (st === 'teardrop' ? 0 : 0.01)], [z1, b1], 12);
    const cs = new THREE.Shape(); cs.moveTo(cab[0].x, cab[0].y);
    for (let i = 1; i < cab.length; i++) cs.lineTo(cab[i].x, cab[i].y);
    for (let i = 1; i < 12; i++) { const z = lerp(z1, z0, i / 12); cs.lineTo(z, topY(z) - 0.03); }
    side(cs, cw, 'glass', 0.07);
    const cabY = (z) => { if (z <= cab[0].x) return cab[0].y; for (let i = 1; i < cab.length; i++) if (cab[i].x >= z) { const a = cab[i - 1], b = cab[i]; return lerp(a.y, b.y, clamp((z - a.x) / Math.max(1e-6, b.x - a.x), 0, 1)); } return cab[cab.length - 1].y; };
    const bsg = 0.07 * 0.75;
    // teto pintado (deixa as janelas laterais escuras abaixo dele)
    if (S.roofPaint) {
      const zA = lerp(ra, z0, 0.2), zB = lerp(rb, z1, 0.12), n = 16, tp = [];
      for (let i = 0; i <= n; i++) { const z = lerp(zA, zB, i / n); tp.push([z, cabY(z) + bsg + 0.012]); }
      const rs = new THREE.Shape(); rs.moveTo(tp[0][0], tp[0][1]);
      for (let i = 1; i <= n; i++) rs.lineTo(tp[i][0], tp[i][1]);
      for (let i = n; i >= 0; i--) rs.lineTo(tp[i][0], tp[i][1] - 0.045);
      side(rs, cw * 0.97, 'paint', 0.02);
    }
    const roofTop = (z) => cabY(z) + bsg + (S.roofPaint ? 0.03 : 0);

    // ---- 4) faróis ----
    const zh = hL - 0.32, yh = surf(zh), rxh = Math.atan(-slopeAt(zh));
    const sph = () => new THREE.SphereGeometry(1, 18, 12);
    switch (S.head) {
      case 'round': sym((k) => { const z = hL - 0.46, y = surf(z) - 0.01; add(sph(), 'head', k * W * 0.3, y, z, rxh, 0, 0, 0.15, 0.09, 0.2); add(new THREE.TorusGeometry(0.15, 0.018, 6, 20), 'chrome', k * W * 0.3, y + 0.03, z, H + rxh * 0.7, 0, 0, 1, 1, 0.7); }); break;
      case 'oval': sym((k) => add(sph(), 'head', k * W * 0.31, yh - 0.01, zh - 0.05, rxh, k * 0.25, 0, 0.2, 0.06, 0.26)); break;
      case 'rect': sym((k) => { box(0.26, 0.1, 0.07, 'head', k * W * 0.34, yN - 0.12, zNose - 0.01); box(0.16, 0.1, 0.07, 'head', k * W * 0.2, yN - 0.12, zNose - 0.005); }); break;
      case 'squint': sym((k) => box(0.44, 0.045, 0.08, 'head', k * W * 0.3, yN - 0.06, zNose - 0.02, 0, k * 0.12, 0)); break;
      case 'y': sym((k) => { const x = k * W * 0.3; box(0.34, 0.03, 0.08, 'head', x, yh, zh, rxh, k * 0.35, 0); box(0.2, 0.03, 0.06, 'head', x + k * 0.1, yh - 0.02, zh + 0.1, rxh, -k * 0.6, 0); box(0.2, 0.03, 0.06, 'head', x - k * 0.08, yh - 0.03, zh + 0.12, rxh, k * 1.1, 0); }); break;
      case 'socket': sym((k) => { add(sph(), 'trim', k * W * 0.3, yh - 0.01, zh, rxh, k * 0.3, 0, 0.24, 0.07, 0.3); box(0.24, 0.028, 0.05, 'head', k * W * 0.3, yh + 0.035, zh + 0.04, rxh, k * 0.45, 0); }); break;
      case 'quad': sym((k) => { for (let j = 0; j < 4; j++) cyl(0.042, 0.042, 0.05, 10, 'head', k * (W * 0.2 + j * 0.075), yh + 0.005, zh + 0.04 - j * 0.035, H + rxh, 0, 0); }); break;
      case 'round2': sym((k) => { for (let j = 0; j < 2; j++) add(sph(), 'head', k * (W * 0.26 + j * 0.12), yh - 0.005, zh - j * 0.04, rxh, 0, 0, 0.07, 0.05, 0.1); }); break;
      case 'led': sym((k) => { box(0.42, 0.035, 0.18, 'head', k * W * 0.3, yh, zh, rxh, k * 0.25, 0); box(0.4, 0.015, 0.03, 'head', k * W * 0.3, yh - 0.05, zh + 0.1, rxh, k * 0.25, 0); }); break;
      default:
        sym((k) => box(0.44, 0.055, 0.24, 'head', k * W * 0.3, yh, zh, rxh, k * 0.22, 0));
        if (S.head === 'angular') sym((k) => box(0.36, 0.022, 0.05, 'head', k * W * 0.3, yN - 0.03, zNose - 0.02, 0, k * 0.18, 0));
    }
    // ---- 5) grade dianteira ----
    const yF0 = yb + 0.1, yF1 = yN - 0.02, fh = Math.max(0.12, yF1 - yF0), zg = zNose - 0.025;
    switch (S.grille) {
      case 'wide': box(W * 0.62, fh * 0.42, 0.08, 'grille', 0, yF0 + fh * 0.5, zg); break;
      case 'honeycomb': box(W * 0.68, fh * 0.5, 0.08, 'gmesh', 0, yF0 + fh * 0.42, zg); box(W * 0.5, 0.05, 0.09, 'grille', 0, yF1 - 0.03, zg); break;
      case 'kidney': sym((k) => { box(0.26, fh * 0.62, 0.08, 'gmesh', k * 0.155, yF0 + fh * 0.52, zg); box(0.3, fh * 0.66, 0.06, 'chrome', k * 0.155, yF0 + fh * 0.52, zg - 0.012); }); break;
      case 'vbars': box(W * 0.5, fh * 0.46, 0.07, 'grille', 0, yF0 + fh * 0.52, zg); for (let j = -4; j <= 4; j++) box(0.014, fh * 0.44, 0.09, 'chrome', j * W * 0.055, yF0 + fh * 0.52, zg); break;
      case 'mesh': box(W * 0.52, fh * 0.62, 0.08, 'gmesh', 0, yF0 + fh * 0.44, zg); box(W * 0.55, fh * 0.66, 0.06, 'chrome', 0, yF0 + fh * 0.44, zg - 0.012); break;
      case 'mouth': box(W * 0.64, fh * 0.46, 0.08, 'gmesh', 0, yF0 + fh * 0.32, zg); break;
      case 'hex': box(W * 0.46, fh * 0.44, 0.08, 'gmesh', 0, yF0 + fh * 0.44, zg); box(W * 0.5, 0.03, 0.09, 'chrome', 0, yF0 + fh * 0.67, zg); break;
      case 'horseshoe':
        add(new THREE.TorusGeometry(0.2, 0.03, 8, 22, Math.PI * 1.2), 'chrome', 0, yF0 + fh * 0.5, zg, 0, 0, -Math.PI * 0.1, 1, 1.35, 1);
        box(0.34, fh * 0.55, 0.06, 'gmesh', 0, yF0 + fh * 0.46, zg - 0.01); sym((k) => box(0.36, fh * 0.34, 0.08, 'gmesh', k * W * 0.3, yF0 + fh * 0.22, zg)); break;
      case 'aston': box(W * 0.6, fh * 0.52, 0.08, 'grille', 0, yF0 + fh * 0.4, zg); for (let j = 0; j < 5; j++) box(W * 0.58, 0.012, 0.09, 'chrome', 0, yF0 + fh * (0.2 + j * 0.1), zg); break;
      default: sym((k) => box(0.34, fh * 0.34, 0.08, 'grille', k * W * 0.28, yF0 + fh * 0.2, zg)); box(0.5, fh * 0.18, 0.08, 'grille', 0, yF0 + fh * 0.12, zg);
    }
    if (S.splitter) box(W * 0.94, 0.035, 0.34, 'carbon', 0, yb - bs - 0.015, hL - 0.1);
    if (S.skirts) sym((k) => box(0.07, 0.09, Math.max(0.2, zF - arF - (zR + arR) - 0.1), 'carbon', k * (W / 2 - 0.01), yb + 0.02, (zF - arF + zR + arR) / 2));
    // ---- 6) traseira: painel, difusor e lanternas ----
    box(W * 0.46, 0.17, 0.06, 'grille', 0, yb + 0.3, zTail + 0.02);
    if (S.diffuser) { box(W * 0.78, 0.16, 0.34, 'carbon', 0, yb + 0.02, -hL + 0.06); for (let j = -3; j <= 3; j++) box(0.025, 0.18, 0.36, 'carbon', j * W * 0.1, yb + 0.02, -hL + 0.02); }
    const zt = zTail + 0.012, yTl = yT - 0.13;
    switch (S.tail) {
      case 'round2': sym((k) => { for (const x of [0.36, 0.2]) cyl(0.075, 0.075, 0.07, 16, 'tail', k * W * x, yTl - 0.02, zt, H, 0, 0); }); box(W * 0.8, 0.13, 0.05, 'grille', 0, yTl - 0.02, zt + 0.012); break;
      case 'round4': sym((k) => { for (const x of [0.37, 0.22]) { cyl(0.078, 0.078, 0.07, 18, 'tail', k * W * x, yTl, zt, H, 0, 0); add(new THREE.TorusGeometry(0.08, 0.016, 6, 18), 'chrome', k * W * x, yTl, zt - 0.03); } }); break;
      case 'bars3': sym((k) => { for (let j = 0; j < 3; j++) box(0.055, 0.17, 0.07, 'tail', k * (W * 0.24 + j * 0.085), yTl - 0.02, zt); }); break;
      case 'rect2': sym((k) => box(0.38, 0.12, 0.07, 'tail', k * W * 0.3, yTl, zt)); break;
      case 'split': sym((k) => box(0.42, 0.08, 0.07, 'tail', k * W * 0.31, yTl + 0.01, zt, 0, 0, k * 0.1)); break;
      case 'L': sym((k) => { box(0.34, 0.05, 0.07, 'tail', k * W * 0.3, yTl + 0.03, zt); box(0.05, 0.16, 0.07, 'tail', k * (W * 0.3 + 0.15), yTl - 0.03, zt); }); break;
      case 'y': sym((k) => { const x = k * W * 0.3; box(0.26, 0.03, 0.07, 'tail', x, yTl + 0.02, zt, 0, 0, k * 0.45); box(0.26, 0.03, 0.07, 'tail', x, yTl - 0.06, zt, 0, 0, -k * 0.45); box(0.03, 0.12, 0.07, 'tail', x - k * 0.1, yTl - 0.02, zt); }); break;
      case 'rings': sym((k) => add(new THREE.TorusGeometry(0.1, 0.028, 8, 22), 'tail', k * W * 0.3, yTl - 0.02, zt)); break;
      case 'slim': sym((k) => box(0.5, 0.025, 0.07, 'tail', k * W * 0.26, yT - 0.04, zt, 0, 0, k * 0.05)); break;
      default: box(W * 0.82, 0.045, 0.07, 'tail', 0, yTl + 0.03, zt); sym((k) => box(0.2, 0.08, 0.07, 'tail', k * W * 0.36, yTl - 0.01, zt));
    }
    // ---- 7) escapes (as posições alimentam as partículas do nitro) ----
    const ex = [], ye = yb + 0.12, ze = zTail + 0.1;
    const pipe = (x, y, r, sx = 1) => {
      add(new THREE.CylinderGeometry(r, r, 0.3, 16), 'chrome', x, y, ze, H, 0, 0, sx, 1, 1);
      add(new THREE.CylinderGeometry(r * 0.78, r * 0.78, 0.02, 16), 'grille', x, y, ze - 0.155, H, 0, 0, sx, 1, 1);
      ex.push([x, y, ze - 0.18]);
    };
    switch (S.exhaust) {
      case 'single': pipe(-W * 0.26, ye, 0.1); break;
      case 'quad': sym((k) => { pipe(k * W * 0.32, ye, 0.062); pipe(k * W * 0.24, ye, 0.062); }); break;
      case 'center2': sym((k) => pipe(k * 0.12, ye + 0.08, 0.075)); break;
      case 'center3': pipe(0, ye + 0.02, 0.055); sym((k) => pipe(k * 0.15, ye + 0.02, 0.07)); break;
      case 'quadCenter': for (const [x, y] of [[-0.09, 0.07], [0.09, 0.07], [-0.09, -0.07], [0.09, -0.07]]) pipe(x, yb + 0.28 + y, 0.055); break;
      case 'ovals': sym((k) => pipe(k * W * 0.3, ye, 0.07, 1.6)); break;
      case 'high2': sym((k) => pipe(k * 0.1, yT - 0.24, 0.065)); break;
      default: sym((k) => pipe(k * W * 0.28, ye, 0.07));
    }
    // ---- 8) aerofólios ----
    const zw = -hL + 0.34, yw0 = surf(zw);
    switch (S.wing) {
      case 'lip': box(W * 0.78, 0.03, 0.12, 'paint', 0, surf(-hL + 0.1) + 0.012, -hL + 0.1, -0.22, 0, 0); break;
      case 'duck': box(W * 0.84, 0.05, 0.28, 'paint', 0, surf(-hL + 0.16) + 0.02, -hL + 0.14, -0.3, 0, 0); break;
      case 'gt': case 'gtMid': case 'rally': {
        const h = S.wingH, chord = S.wing === 'rally' ? 0.4 : 0.34, span = S.wing === 'gtMid' ? 0.8 : 0.9;
        sym((k) => box(0.05, h, 0.16, 'carbon', k * W * 0.28, yw0 + h / 2, zw));
        box(W * span, 0.05, chord, 'carbon', 0, yw0 + h, zw - 0.03, -0.08, 0, 0);
        sym((k) => box(0.03, 0.2, chord + 0.08, 'carbon', k * W * span * 0.5, yw0 + h - 0.03, zw - 0.03)); break;
      }
      case 'hoop': sym((k) => box(0.06, 0.28, 0.12, 'paint', k * W * 0.4, yw0 + 0.13, zw, 0, 0, -k * 0.22)); box(W * 0.8, 0.05, 0.26, 'paint', 0, yw0 + 0.27, zw - 0.02, -0.06, 0, 0); break;
      case 'swan': {
        const h = S.wingH;
        sym((k) => { box(0.05, h + 0.06, 0.12, 'carbon', k * 0.34, yw0 + (h + 0.06) / 2, zw + 0.06); box(0.05, 0.05, 0.18, 'carbon', k * 0.34, yw0 + h + 0.06, zw - 0.02); });
        box(W * 1.0, 0.055, 0.46, 'carbon', 0, yw0 + h, zw - 0.06, -0.1, 0, 0); box(W * 0.96, 0.03, 0.18, 'carbon', 0, yw0 + h + 0.11, zw - 0.24, -0.4, 0, 0);
        sym((k) => box(0.03, 0.3, 0.6, 'carbon', k * W * 0.5, yw0 + h - 0.02, zw - 0.08)); break;
      }
      case 'huge': {
        const h = S.wingH;
        box(0.08, h, 0.3, 'carbon', 0, yw0 + h / 2, zw); sym((k) => box(0.04, h * 0.9, 0.2, 'carbon', k * W * 0.3, yw0 + h * 0.45, zw));
        box(W * 1.02, 0.06, 0.5, 'carbon', 0, yw0 + h, zw - 0.05, -0.12, 0, 0); sym((k) => box(0.035, 0.36, 0.62, 'carbon', k * W * 0.51, yw0 + h - 0.04, zw - 0.06)); break;
      }
      case 'boomerang': {
        const h = S.wingH;
        sym((k) => {
          box(0.05, h + 0.08, 0.12, 'carbon', k * 0.42, yw0 + (h + 0.08) / 2, zw + 0.08);
          box(W * 0.54, 0.05, 0.42, 'carbon', k * W * 0.25, yw0 + h + 0.05, zw + 0.06, -0.1, k * 0.2, 0);
          box(0.03, 0.32, 0.5, 'carbon', k * W * 0.52, yw0 + h - 0.04, zw - 0.1);
        }); break;
      }
      case 'active': box(W * 0.9, 0.035, 0.34, 'carbon', 0, surf(-hL + 0.3) + 0.05, -hL + 0.3, -0.18, 0, 0); sym((k) => box(0.03, 0.06, 0.2, 'carbon', k * W * 0.3, surf(-hL + 0.3) + 0.02, -hL + 0.3)); break;
    }
    // ---- 9) entradas laterais ----
    switch (S.intake) {
      case 'side': sym((k) => box(0.06, 0.24, 0.66, 'trim', k * (W / 2 - 0.005), yb + 0.36, zR + arR + 0.5, 0.22, 0, 0)); break;
      case 'big': sym((k) => box(0.07, 0.34, 0.9, 'trim', k * (W / 2 - 0.005), yb + 0.36, zR + arR + 0.58, 0.28, 0, 0)); break;
      case 'blade': sym((k) => box(0.05, 0.44, 0.3, 'carbon', k * (W / 2 + 0.005), yb + 0.36, zR + arR + 0.28, 0.08, 0, 0)); break;
      case 'cline': sym((k) => add(new THREE.TorusGeometry(0.62, 0.032, 8, 30, Math.PI * 1.15), 'chrome', k * (W / 2 + 0.01), yb + 0.42, (zF + zR) / 2 - 0.1, 0, H, -Math.PI * 0.575, 1, 0.62, 1)); break;
    }
    // ---- 10) capô, teto, extras ----
    const zvh = hL * 0.45, rxv = Math.atan(-slopeAt(zvh));
    if (S.hood === 'vents') sym((k) => box(0.28, 0.02, 0.36, 'grille', k * W * 0.16, surf(zvh) - 0.004, zvh, rxv, 0, 0));
    if (S.hood === 'scoop') { box(0.55, 0.11, 0.62, 'paint', 0, surf(zvh) + 0.01, zvh, rxv, 0, 0); box(0.44, 0.06, 0.04, 'grille', 0, surf(zvh + 0.3) + 0.045, zvh + 0.31, rxv, 0, 0); }
    const rl = Math.max(0.3, rb - ra);
    if (S.roof === 'rails') sym((k) => box(0.035, 0.035, rl * 0.95, 'chrome', k * cw * 0.4, roofTop((ra + rb) / 2) + 0.03, (ra + rb) / 2));
    if (S.roof === 'fins') sym((k) => box(0.022, 0.05, rl * 0.9, 'carbon', k * cw * 0.3, roofTop((ra + rb) / 2) + 0.02, (ra + rb) / 2));
    if (S.roof === 'scoop') { box(0.36, 0.12, 0.5, 'carbon', 0, cabY(ra) + bsg + 0.05, ra - 0.12); box(0.3, 0.07, 0.04, 'grille', 0, cabY(ra) + bsg + 0.07, ra + 0.12); }
    if (S.roof === 'fin') box(0.03, 0.2, 0.9, 'paint', 0, surf(-hL * 0.55) + 0.1, -hL * 0.55);
    if (S.extras.includes('buttress')) sym((k) => {
      const zA = ra + 0.1, yA = cabY(zA) - 0.02, zB = -hL + 0.4, yB = surf(zB) - 0.02, len = Math.hypot(zA - zB, yA - yB), ang = Math.atan2(yA - yB, zA - zB);
      box(0.12, 0.05, len, 'paint', k * cw * 0.52, (yA + yB) / 2 + 0.02, (zA + zB) / 2, -ang, 0, 0);
    });
    if (S.extras.includes('canards')) sym((k) => box(0.2, 0.02, 0.12, 'carbon', k * W * 0.44, yb + 0.34, hL - 0.12, 0, 0, k * 0.25));
    if (S.stripes) {
      const rib = (za, zb, yfn) => sym((k) => {
        const pos = [], idx = [], n = 20;
        for (let i = 0; i <= n; i++) { const z = lerp(za, zb, i / n), y = yfn(z); pos.push(k * 0.2 - 0.1, y, z, k * 0.2 + 0.1, y, z); if (i < n) { const a = i * 2; idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3); } }
        const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals(); put('white', g);
      });
      rib(z1 + 0.06, hL - 0.06, (z) => surf(z) + 0.006);
      if (S.roofPaint) rib(lerp(ra, z0, 0.12), lerp(rb, z1, 0.06), (z) => roofTop(z) + 0.006);
      rib(-hL + 0.06, z0 - 0.06, (z) => surf(z) + 0.006);
    }
    // retrovisores e linhas das portas
    sym((k) => { const zm = z1 - 0.1, ym = topY(zm) + 0.14; box(0.2, 0.1, 0.13, 'paint', k * (cw / 2 + 0.15), ym, zm); box(0.12, 0.03, 0.05, 'carbon', k * (cw / 2 + 0.06), ym - 0.04, zm + 0.02); });
    sym((k) => box(0.006, 0.34, 0.012, 'grille', k * (W / 2 + 0.002), yb + 0.37, z1 - 0.14));

    // ---- 11) afunilamento (bico/traseira/tumblehome) + para-lamas alargados ----
    const [tn, tt, tu] = S.taper, yTu0 = 0.62, yTu1 = Math.max(yTu0 + 0.3, roof - 0.1);
    const T = { id, wheels: [], exhausts: ex, heads: [[W * 0.3, yh, zh + 0.12], [-W * 0.3, yh, zh + 0.12]], tailPos: [0, 0.35, zTail - 0.9], size: [W, roof, L] };
    T.taper = (y, z) => {
      let sc = (1 - tn * smoothstep(hL * 0.6, hL * 1.03, z)) * (1 - tt * smoothstep(-hL * 0.72, -hL * 1.03, z)) * (1 - tu * smoothstep(yTu0, yTu1, y));
      for (const [zc, a] of [[zF, fl[0]], [zR, fl[1]]]) if (a) { const d = (z - zc) / 0.8; sc *= 1 + a * Math.exp(-d * d * 2.2) * (1 - smoothstep(0.7, 0.98, y)); }
      return sc;
    };
    // lentes: capa de vidro um pouco maior que cada farol/lanterna
    for (const k of ['head', 'headPanel', 'tail']) for (const g of parts[k] || []) {
      const c = g.clone(); c.computeBoundingBox(); const o = c.boundingBox.getCenter(new THREE.Vector3());
      c.translate(-o.x, -o.y, -o.z); c.scale(1.06, 1.3, 1.06); c.translate(o.x, o.y, o.z); put('lens', c);
    }
    T.meshes = Object.entries(parts).map(([key, list]) => ({ key, geo: mergeGeometries(list) }));
    for (const m of T.meshes) this.applyTaper(m.geo, T.taper);
    T.wheels = [[(W / 2) * (1 + fl[0]) - S.tw[0] / 2 - 0.02, rF, zF, 1], [(W / 2) * (1 + fl[1]) - S.tw[1] / 2 - 0.02, rR, zR, 0]];
    T.wheelSpec = { f: [rF, S.tw[0]], r: [rR, S.tw[1]], style: S.rim, rimKey: S.rimKey, cal: S.cal };
    T.wheelGeoF = this.buildWheel(rF, S.tw[0], S.rim);
    T.wheelGeoR = rF === rR && S.tw[0] === S.tw[1] ? T.wheelGeoF : this.buildWheel(rR, S.tw[1], S.rim);
    this.templates[id] = T;
    return T;
  },

  // Afunila a carroceria (x *= f(y,z)). Normais corrigidas pela inversa-transposta da Jacobiana.
  applyTaper(geo, f) {
    const p = geo.attributes.position, n = geo.attributes.normal, e = 0.01;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const s = f(y, z), sy = (f(y + e, z) - f(y - e, z)) / (2 * e), sz = (f(y, z + e) - f(y, z - e)) / (2 * e);
      p.setX(i, x * s);
      const nx = n.getX(i), ny = n.getY(i), nz = n.getZ(i);
      const ax = nx / s, ay = ny - (x * sy * nx) / s, az = nz - (x * sz * nx) / s, L = Math.hypot(ax, ay, az) || 1;
      n.setXYZ(i, ax / L, ay / L, az / L);
    }
    geo.computeBoundingSphere(); geo.computeBoundingBox();
  },

  buildWheel(r, w, style) {
    const hw = w / 2, rr = r * 0.7;
    const pts = [[rr, -hw], [r - 0.05, -hw], [r - 0.012, -hw + 0.03], [r, -hw + 0.07], [r, hw - 0.07], [r - 0.012, hw - 0.03], [r - 0.05, hw], [rr, hw]]
      .map(([a, b]) => new THREE.Vector2(a, b));
    const tire = new THREE.LatheGeometry(pts, 36); tire.rotateZ(Math.PI / 2);
    const face = hw - 0.03, rim = [], back = [];
    const lip = new THREE.TorusGeometry(rr - 0.012, 0.024, 8, 36); lip.rotateY(Math.PI / 2); lip.translate(face, 0, 0); rim.push(lip);
    const hub = new THREE.CylinderGeometry(0.055, 0.07, 0.07, 12); hub.rotateZ(Math.PI / 2); hub.translate(face - 0.01, 0, 0); rim.push(hub);
    const n = { y: 10, dish: 8, star: 5, split: 10 }[style] || 14;
    for (let k = 0; k < n; k++) {
      let a = (k / n) * Math.PI * 2;
      if (style === 'y') a += k % 2 ? -0.12 : 0.12;
      if (style === 'split') a += k % 2 ? -0.07 : 0.07;
      const sw = { dish: 0.085, star: 0.1, y: 0.045 }[style] || 0.03;
      const sp = new THREE.BoxGeometry(0.035, rr * 0.95, sw);
      sp.translate(0, rr * 0.5, 0);
      if (style === 'turbine') sp.rotateY(0.5);
      sp.rotateX(a); sp.translate(face - 0.02, 0, 0); rim.push(sp);
    }
    const bk = new THREE.CircleGeometry(rr, 28); bk.rotateY(Math.PI / 2); bk.translate(face - 0.1, 0, 0); back.push(bk);
    const disc = new THREE.CylinderGeometry(rr * 0.8, rr * 0.8, 0.025, 28); disc.rotateZ(Math.PI / 2); disc.translate(face - 0.075, 0, 0);
    const cal = new THREE.BoxGeometry(0.06, 0.13, 0.22); cal.translate(face - 0.06, rr * 0.62, -0.05);
    return { tire, rim: mergeGeometries(rim), back: mergeGeometries(back), disc, cal };
  },

  createProcedural(id, color, opts = {}) {
    const T = this.build(id), ghost = !!opts.ghost;
    const shadows = !ghost && opts.shadows !== false;
    const root = new THREE.Group(); root.rotation.order = 'YXZ';
    const body = new THREE.Group(); root.add(body);
    const paint = opts.paint || this.paint(color), tail = opts.tail || this.tailMat();
    const G = this.mats.ghost, mat = (k) => (ghost ? G : this.mats[k]);
    for (const { key, geo } of T.meshes) {
      if (ghost && key === 'lens') continue;
      const m = new THREE.Mesh(geo, ghost ? G : key === 'paint' ? paint : key === 'tail' ? tail : this.mats[key]);
      m.castShadow = shadows && !['head', 'headPanel', 'tail', 'neon', 'glass', 'lens'].includes(key);
      if (ghost) m.renderOrder = 8;
      body.add(m);
    }
    const wheels = [];
    for (const [x, y, z, front] of T.wheels) {
      for (const sgn of [1, -1]) {
        const WG = front ? T.wheelGeoF : T.wheelGeoR;
        const pivot = new THREE.Group(); pivot.position.set(sgn * x, y, z);
        if (sgn < 0) pivot.scale.x = -1;
        const spin = new THREE.Group(); pivot.add(spin);
        const tire = new THREE.Mesh(WG.tire, mat('rubber')); tire.castShadow = shadows; spin.add(tire);
        spin.add(new THREE.Mesh(WG.rim, mat(T.wheelSpec.rimKey)));
        spin.add(new THREE.Mesh(WG.back, mat('rimDark')));
        spin.add(new THREE.Mesh(WG.disc, mat('disc')));
        pivot.add(new THREE.Mesh(WG.cal, mat(T.wheelSpec.cal)));
        if (ghost) pivot.traverse((o) => { if (o.isMesh) o.renderOrder = 8; });
        root.add(pivot);
        wheels.push({ pivot, spin, front: !!front, r: y });
      }
    }
    const flames = ghost || opts.noFlames ? [] : this.addFlames(body, T.exhausts);
    const shadow = this.addShadow(root, T.size, ghost || opts.noShadow);
    const lights = [];                                   // luzes reais: LightRig (pool fixo por corrida)
    if (ghost) {
      const list = []; root.traverse((o) => { if (o.isMesh && o.material === G) list.push(o); });
      for (const o of list) { const d = new THREE.Mesh(o.geometry, this.mats.ghostDepth); d.renderOrder = 7; o.renderOrder = 8; o.parent.add(d); }
    }
    return { root, body, wheels, paint, tail, flames, shadow, lights, T, exhausts: T.exhausts.map((e) => new THREE.Vector3(...e)) };
  },
  tailMat() { this.initMats(); const m = this.mats.tail.clone(); m.color.copy(this.tailColor); return m; },
  addFlames(body, exhausts) {
    const flames = [];
    for (const [x, y, z] of exhausts) {
      const g = new THREE.Group(); g.position.set(x, y, z);
      const outer = new THREE.Mesh(this.flameGeo || (this.flameGeo = (() => { const c = new THREE.ConeGeometry(0.11, 0.9, 14, 1, true); c.rotateX(-Math.PI / 2); c.translate(0, 0, -0.45); return c; })()), this.mats.flame);
      const core = new THREE.Mesh(this.flameGeo, this.mats.flameCore); core.scale.set(0.5, 0.5, 0.55);
      g.add(outer, core); g.visible = false; body.add(g); flames.push(g);
    }
    return flames;
  },
  addShadow(root, size, hidden) {
    const shadow = new THREE.Mesh(this.shadowGeo || (this.shadowGeo = new THREE.PlaneGeometry(2.9, 5.6).rotateX(-Math.PI / 2)), this.mats.shadow);
    shadow.position.y = 0.03; shadow.renderOrder = 1; shadow.visible = !hidden; shadow.scale.set(size[0] / 2, 1, size[2] / 4.7); root.add(shadow);
    shadow.userData.base = shadow.scale.clone();
    return shadow;
  },
  // escolhe o gerador: modelo glTF externo (se já baixado e normalizado) ou procedural PBR (fallback)
  create(id, color, opts = {}) {
    if (!opts.ghost && !opts.procedural && this.ext[id]) {
      try { return opts.lod ? this.createLOD(id, color, opts) : this.createExternal(id, color, opts); }
      catch (e) { console.warn('[modelo 3D] instância externa falhou, usando procedural:', e); }
    }
    return this.createProcedural(id, color, opts);
  },

  // ---------------- modelos externos (glTF/GLB + Draco) ----------------
  ext: {}, extError: {}, extListeners: [], loader: null,
  externalStatus(id) {
    if (!EXTERNAL_MODELS[id]) return 'none';
    if (this.ext[id]) return 'ok';
    if (this.extError[id]) return 'failed';
    return this.loader ? this.loader.status('car:' + id) : 'idle';
  },
  externalProgress(id) { return (this.loader && this.loader.progress.get('car:' + id)) || 0; },
  onExternal(fn) { this.extListeners.push(fn); },
  emitExternal(id, st) { for (const fn of this.extListeners) { try { fn(id, st); } catch (e) { console.warn(e); } } },
  preloadExternal(loader, ids = Object.keys(EXTERNAL_MODELS)) { this.loader = loader; return Promise.allSettled(ids.map((id) => this.loadExternal(id))); },
  loadExternal(id) {
    const cfg = EXTERNAL_MODELS[id];
    if (this.ext[id]) return Promise.resolve(this.ext[id]);
    if (!cfg || !this.loader) return Promise.reject(new Error('sem modelo externo para ' + id));
    delete this.extError[id];
    const p = this.loader.load('car:' + id, cfg.urls, cfg.timeout || 30000, () => this.emitExternal(id, 'loading'))
      .then((g) => {
        if (!this.ext[id]) { const t0 = performance.now(); this.ext[id] = this.prepareExternal(id, g.scene, cfg); this.ext[id].prepMs = Math.round(performance.now() - t0); }
        this.emitExternal(id, 'ok'); return this.ext[id];
      })
      .catch((e) => {
        this.extError[id] = String((e && e.message) || e);
        console.warn('[modelo 3D] ' + id + ': usando fallback procedural PBR —', this.extError[id]);
        this.emitExternal(id, 'failed'); throw e;
      });
    this.emitExternal(id, 'loading');
    return p;
  },
  // Normaliza um glTF qualquer para o referencial do jogo: frente = +z, escala pelo comprimento real do carro,
  // pneus no chão, rodas em pivôs (esterço) + giro, materiais PBR do jogo atribuídos por papel da peça.
  prepareExternal(id, src, cfg) {
    this.initMats();
    const C = CARS[id], P = this.build(id);
    src.updateMatrixWorld(true);
    // 1) rodas pelo nome; frente pelo nome (f/r) ou pela convenção glTF (+z = frente)
    const wre = cfg.wheels || /wheel|tire|tyre|roda/i, wheels = [];
    src.traverse((o) => {
      const m = wre.exec(o.name || ''); if (!m) return;
      for (let p = o.parent; p; p = p.parent) if (wheels.some((w) => w.o === p)) return;   // só o nó mais alto de cada roda
      wheels.push({ o, c: new THREE.Box3().setFromObject(o).getCenter(new THREE.Vector3()), front: m[1] ? /^f/i.test(m[1]) : null });
    });
    let yaw = { '+z': 0, '-z': Math.PI, '+x': Math.PI / 2, '-x': -Math.PI / 2 }[cfg.forward || '+z'];
    if (wheels.length >= 4) {
      if (wheels.some((w) => w.front === null)) {
        const f = new THREE.Vector3(Math.sin(yaw), 0, Math.cos(yaw)), d = wheels.map((w) => w.c.dot(f)).sort((a, b) => a - b), med = (d[0] + d[d.length - 1]) / 2;
        wheels.forEach((w) => (w.front = w.c.dot(f) > med));
      }
      const F = new THREE.Vector3(), R = new THREE.Vector3(); let nf = 0, nr = 0;
      for (const w of wheels) if (w.front) { F.add(w.c); nf++; } else { R.add(w.c); nr++; }
      if (nf && nr) { F.divideScalar(nf).sub(R.divideScalar(nr)); yaw = Math.atan2(F.x, F.z); }
    } else wheels.length = 0;                       // sem 4 rodas identificáveis: carroceria estática
    const rot = new THREE.Matrix4().makeRotationY(-yaw);
    // 2) assa as transformações (modelo girado) e mede a caixa real pelos vértices
    const role = (o) => {
      for (const [re, key] of cfg.parts || []) if (re.test(o.name)) return key;
      if (cfg.parts) return null;
      const s = (o.name + ' ' + ((o.material && o.material.name) || '')).toLowerCase();
      if (/glass|window|vidro|windshield/.test(s)) return 'glass';
      if (/tire|tyre|rubber|pneu/.test(s)) return 'tire';
      if (/body|paint|carroc/.test(s)) return 'paint';
      if (/chrome/.test(s)) return 'chrome';
      if (/carbon/.test(s)) return 'carbon';
      if (/(tail|rear|brake).?light|lanterna/.test(s)) return 'tail';
      if (/head.?(light|lamp)|farol/.test(s)) return 'head';
      if (/rim|wheel|roda/.test(s)) return 'rim';
      return null;
    };
    const parts = [], bb = new THREE.Box3(), V = new THREE.Vector3(), M = new THREE.Matrix4();
    src.traverse((o) => {
      if (!o.isMesh || !o.geometry || !o.geometry.attributes.position) return;
      let wheel = null; for (let p = o; p && !wheel; p = p.parent) wheel = wheels.find((w) => w.o === p) || null;
      const g = new THREE.BufferGeometry(), sg = o.geometry, mat = Array.isArray(o.material) ? o.material[0] : o.material;
      g.setAttribute('position', sg.attributes.position.clone());
      if (sg.attributes.normal) g.setAttribute('normal', sg.attributes.normal.clone());
      if (sg.attributes.uv) g.setAttribute('uv', sg.attributes.uv.clone());
      if (sg.attributes.color && mat && mat.vertexColors) g.setAttribute('color', sg.attributes.color.clone());
      if (sg.index) g.setIndex(sg.index.clone());
      g.applyMatrix4(M.multiplyMatrices(rot, o.matrixWorld));
      if (!g.attributes.normal) g.computeVertexNormals();
      const pa = g.attributes.position; for (let i = 0; i < pa.count; i++) bb.expandByPoint(V.fromBufferAttribute(pa, i));
      let inter = false; for (let p = o; p && !inter; p = p.parent) inter = !!(cfg.interior && cfg.interior.test(p.name || ''));
      parts.push({ geo: g, key: role(o), mat, wheel, interior: inter });
    });
    if (!parts.length) throw new Error('glTF sem malhas');
    // 3) escala pelo comprimento do carro do jogo, centraliza e apoia no chão
    const len = bb.max.z - bb.min.z, s = cfg.scale || C.look.L / len, ctr = bb.getCenter(new THREE.Vector3());
    const fit = new THREE.Matrix4().makeScale(s, s, s).multiply(new THREE.Matrix4().makeTranslation(-ctr.x, -bb.min.y, -ctr.z));
    for (const w of wheels) w.pos = w.c.clone().applyMatrix4(rot).applyMatrix4(fit);
    const X = { id, external: true, name: cfg.name || id, credit: cfg.credit || '', body: [], wheels: [], wheelSpec: P.wheelSpec, tris: 0 };
    const groups = new Map(), wgroups = new Map();
    for (const p of parts) {
      p.geo.applyMatrix4(fit);
      if (p.key || !p.geo.attributes.uv) boxUV(p.geo);          // materiais do jogo: UV em metros
      if (p.wheel) p.geo.translate(-p.wheel.pos.x, -p.wheel.pos.y, -p.wheel.pos.z);
      const gk = (p.key || 'm:' + (p.mat ? p.mat.uuid : '0')) + (p.interior ? '|i' : ''), map = p.wheel ? (wgroups.get(p.wheel) || wgroups.set(p.wheel, new Map()).get(p.wheel)) : groups;
      if (!map.has(gk)) map.set(gk, { key: p.key, mat: p.mat, interior: p.interior, list: [] });
      map.get(gk).list.push(p.geo);
      X.tris += (p.geo.index ? p.geo.index.count : p.geo.attributes.position.count) / 3;
    }
    // faróis/lanterna: caixas das peças por lado (para as luzes reais)
    const side = (key) => {
      const out = [new THREE.Box3(), new THREE.Box3()];
      for (const p of parts) if (p.key === key && !p.wheel) { const a = p.geo.attributes.position; for (let i = 0; i < a.count; i++) { V.fromBufferAttribute(a, i); out[V.x >= 0 ? 0 : 1].expandByPoint(V); } }
      return out;
    };
    for (const g of groups.values()) X.body.push({ key: g.key, mat: g.mat, interior: g.interior, geo: mergeIndexed(g.list) });
    const L = len * s, W = (bb.max.x - bb.min.x) * s, H = (bb.max.y - bb.min.y) * s, zF = L / 2, zR = -L / 2;
    const hs = side('head'), ts = side('tail');
    X.heads = hs.map((b, k) => (b.isEmpty() ? [(k ? -1 : 1) * W * 0.3, 0.68, zF - 0.3] : [(b.min.x + b.max.x) / 2, (b.min.y + b.max.y) / 2, b.max.z]));
    const tb = ts[0].clone().union(ts[1]);
    X.tailPos = [0, 0.35, (tb.isEmpty() ? zR : tb.min.z) - 0.9];          // PointLight atrás e baixa: ilumina o asfalto, não o para-choque
    X.exhausts = P.exhausts.map(([x, y]) => [x, y, zR + 0.12]);
    X.size = [W, H, L];
    for (const w of wheels) {
      const wp = [];
      for (const g of (wgroups.get(w) || new Map()).values()) wp.push({ key: g.key, mat: g.mat, geo: mergeIndexed(g.list) });
      const b = new THREE.Box3(); for (const q of wp) if (q.key === 'tire' || wp.length === 1) b.union(q.geo.boundingBox);
      X.wheels.push({ pos: [w.pos.x, w.pos.y, w.pos.z], front: !!w.front, r: b.isEmpty() ? w.pos.y : (b.max.y - b.min.y) / 2, parts: wp });
    }
    X.tris = Math.round(X.tris);
    return X;
  },
  createExternal(id, color, opts = {}) {
    this.initMats();
    const X = this.ext[id], shadows = opts.shadows !== false, lite = !!opts.lite, Mt = this.mats;
    const root = new THREE.Group(); root.rotation.order = 'YXZ';
    const body = new THREE.Group(); root.add(body);
    const paint = opts.paint || this.paint(color), tail = opts.tail || this.tailMat();
    const matFor = (p) => (p.key === 'paint' ? paint : p.key === 'tail' ? tail : p.key === 'glass' ? (lite ? Mt.glass : Mt.glassExt)
      : p.key === 'caliper' ? Mt[X.wheelSpec.cal] : p.key === 'rim' ? Mt[X.wheelSpec.rimKey] : p.key ? Mt[p.key] : p.mat);
    for (const p of X.body) {
      if (lite && p.interior) continue;                            // IAs: sem interior
      const m = new THREE.Mesh(p.geo, matFor(p)); m.castShadow = shadows && !['head', 'tail', 'drl', 'glass'].includes(p.key); body.add(m);
    }
    const wheels = [];
    for (const w of X.wheels) {
      const pivot = new THREE.Group(); pivot.position.set(w.pos[0], w.pos[1], w.pos[2]);
      const spin = new THREE.Group(); pivot.add(spin);
      for (const p of w.parts) { const m = new THREE.Mesh(p.geo, matFor(p)); m.castShadow = shadows && p.key === 'tire'; spin.add(m); }
      root.add(pivot); wheels.push({ pivot, spin, front: w.front, r: w.r });
    }
    const flames = opts.noFlames ? [] : this.addFlames(body, X.exhausts);
    const shadow = this.addShadow(root, X.size, opts.noShadow);
    return { root, body, wheels, paint, tail, flames, shadow, lights: [], T: X, exhausts: X.exhausts.map((e) => new THREE.Vector3(...e)), external: true };
  },
  // IAs: glTF sem interior de perto, procedural PBR ao longe (THREE.LOD na carroceria e nas rodas)
  createLOD(id, color, opts) {
    const E = this.createExternal(id, color, { ...opts, lite: true });
    const P = this.createProcedural(id, color, { ...opts, paint: E.paint, tail: E.tail, noFlames: true, noShadow: true });
    const far = opts.lodDist || 55;
    const lodB = new THREE.LOD(), eB = new THREE.Group(), pB = new THREE.Group();
    for (const c of [...E.body.children]) if (!E.flames.includes(c)) eB.add(c);
    for (const c of [...P.body.children]) pB.add(c);
    lodB.addLevel(eB, 0); lodB.addLevel(pB, far); E.body.add(lodB);
    const lodW = new THREE.LOD(), eW = new THREE.Group(), pW = new THREE.Group();
    for (const w of E.wheels) eW.add(w.pivot);
    for (const w of P.wheels) pW.add(w.pivot);
    lodW.addLevel(eW, 0); lodW.addLevel(pW, far); E.root.add(lodW);
    E.wheels = E.wheels.concat(P.wheels); E.lod = [lodB, lodW];
    return E;
  },
  disposeInstance(inst) { inst.paint.dispose(); inst.tail.dispose(); },
};

/* =====================================================================
   VEHICLE — estado, motor/marchas e visual de cada carro
   ===================================================================== */
class Vehicle {
  constructor(race, { model, color, stats, isPlayer = false, name = '', headlights = false, shadows = true }) {
    this.race = race; this.model = model; this.color = color; this.stats = stats; this.isPlayer = isPlayer; this.name = name;
    this.inst = CarFactory.create(model, color, { shadows, lod: !isPlayer });   // glTF externo (IAs com LOD) ou procedural PBR
    this.mesh = this.inst.root;
    this.x = 0; this.y = 0; this.z = 0; this.vx = 0; this.vy = 0; this.vz = 0;
    this.heading = 0; this.yaw = 0; this.steerAngle = 0;
    this.fx = 0; this.fz = 1; this.rx = -1; this.rz = 0;
    this.airborne = false; this.airTime = 0; this.sliding = false; this.slip = 0; this.driftAngle = 0; this.gripUse = 0;
    this.input = { throttle: 0, brake: 0, steer: 0, handbrake: false, nitro: false };
    this.nitro = 0.5; this.nitroOn = false; this.active = false;
    this.ti = 0; this.s = 0; this.lat = 0; this.roadY = 0; this.groundY = 0; this.rampH = 0; this.bank = 0; this.bankRoll = 0;
    this.tnx = -1; this.tnz = 0; this.ttx = 0; this.ttz = 1; this.trackSlope = 0;
    this.crossings = 0; this.cp = false; this.prevS = 0; this.lapStart = 0; this.lapTimes = []; this.bestLap = null;
    this.finished = false; this.finishTime = null; this.finishPos = 0; this.progress = 0;
    this.gear = 1; this.rpm = 950; this.shiftTimer = 0; this.speedN = 0;
    this.pitch = 0; this.pitchV = 0; this.roll = 0; this.rollV = 0; this.visPitch = 0;
    this.speedMul = 1; this.accelMul = 1; this.box = new THREE.Box3();
    this.wheelRot = 0; this.longAcc = 0; this.latAcc = 0; this.impact = 0;
  }
  get speed() { return Math.hypot(this.vx, this.vz); }
  get vf() { return this.vx * this.fx + this.vz * this.fz; }
  place(slot) {
    this.x = slot.x; this.z = slot.z; this.heading = slot.h; this.ti = slot.i;
    this.vx = this.vz = this.vy = 0; this.yaw = 0; this.steerAngle = 0; this.airborne = false;
    this.fx = Math.sin(slot.h); this.fz = Math.cos(slot.h); this.rx = -this.fz; this.rz = this.fx;
    this.race.track.project(this); this.y = this.groundY; this.prevS = this.s;
  }
  updateEngine(dt) {
    const st = this.stats, g = st.gears, v = Math.abs(this.vf), thr = this.input.throttle;
    const red = st.red || 8500, idle = st.idle || 950;
    let rpm;
    if (g.length === 1) { rpm = idle + (v / (st.top * g[0])) * (red - idle); this.gear = this.vf < -0.5 ? 0 : 1; }
    else {
      const vmax = (k) => st.top * g[k - 1];
      let gear = Math.max(1, this.gear);
      if (v > vmax(gear) * 0.97 && gear < g.length) gear++;
      else if (gear > 1 && v < vmax(gear - 1) * 0.7) gear--;
      if (gear > this.gear && this.gear > 0) { this.shiftTimer = 0.12; if (this.isPlayer) this.race.game.audio.shift(); }
      this.gear = this.vf < -0.5 ? 0 : gear;
      rpm = idle + (v / vmax(Math.max(1, gear))) * (red - idle);
    }
    if (!this.active || this.airborne || (this.sliding && thr > 0)) rpm = Math.max(rpm, idle + thr * (red - idle) * (this.active ? 0.9 : 0.8));
    this.rpm = damp(this.rpm, clamp(rpm, idle, red * 1.02), this.shiftTimer > 0 ? 25 : 10, dt);
    this.speedN = clamp(v / 85, 0, 1.3);
  }
  updateVisual(dt) {
    const m = this.mesh, I = this.inst;
    m.position.set(this.x, this.y, this.z);
    m.rotation.y = this.heading;
    const align = this.fx * this.ttx + this.fz * this.ttz;
    let tp;
    if (this.airborne) tp = -Math.atan2(this.vy, Math.max(6, this.speed)) * 0.7;
    else { let sl = this.trackSlope * align; if (this.rampH > 0) { const r = this.race.track.ramps.find((q) => this.s >= q.s0 && this.s <= q.s0 + q.len); if (r) sl += (r.h / r.len) * align; } tp = -Math.atan(sl); }
    this.visPitch = damp(this.visPitch, tp, this.airborne ? 3 : 14, dt);
    m.rotation.x = this.visPitch;
    // rolagem da carroceria acompanhando a inclinação lateral da pista (curvas inclinadas)
    const sR = this.airborne ? 0 : this.bank * (this.rx * this.tnx + this.rz * this.tnz);
    this.bankRoll = damp(this.bankRoll, -Math.atan(sR), 10, dt);
    m.rotation.z = this.bankRoll;
    // transferência de peso (mola-amortecedor na carroceria)
    const tPitch = clamp(-this.longAcc * 0.0042, -0.055, 0.055), tRoll = clamp(this.latAcc * 0.0026, -0.065, 0.065);
    this.pitchV += ((tPitch - this.pitch) * 90 - this.pitchV * 11) * dt; this.pitch += this.pitchV * dt;
    this.rollV += ((tRoll - this.roll) * 80 - this.rollV * 10) * dt; this.roll += this.rollV * dt;
    I.body.rotation.x = this.pitch; I.body.rotation.z = this.roll;
    I.body.position.y = -Math.abs(this.pitch) * 0.3 - clamp((this.normalF || 1) - 1, -0.4, 0.6) * 0.05;   // suspensão: afunda nas compressões, estende nas lombadas
    this.wheelRot += ((this.airborne ? this.input.throttle * 30 : this.vf) * dt) / 0.36;
    for (const w of I.wheels) { w.spin.rotation.x = this.wheelRot; if (w.front) w.pivot.rotation.y = this.steerAngle * 1.3; }
    const braking = this.input.brake > 0.1 && this.vf > 1;
    I.brake = damp(I.brake || 0, braking ? 1 : 0, 20, dt);                          // lanterna HDR + PointLight do LightRig
    I.tail.color.copy(CarFactory.tailColor).multiplyScalar(1 + I.brake * 2.4);
    for (const f of I.flames) {
      f.visible = this.nitroOn;
      if (this.nitroOn) { const s = 0.8 + Math.random() * 0.6; f.scale.set(0.9 + Math.random() * 0.3, 0.9 + Math.random() * 0.3, s * 1.3); }
    }
    const hgt = this.y - this.groundY, b = I.shadow.userData.base, k = 1 + hgt * 0.08;
    I.shadow.position.y = -hgt + 0.04; I.shadow.scale.set(b.x * k, 1, b.z * k);
  }
  dispose() { CarFactory.disposeInstance(this.inst); }
}

/* =====================================================================
   AI CAR — segue o traçado ótimo, desvia e se adapta à dificuldade
   ===================================================================== */
class AICar {
  constructor(car, race, skill) {
    this.car = car; this.race = race; this.T = race.track; this.skill = skill;
    this.phase = Math.random() * 100; this.avoid = 0; this.nitroT = 0; this.stuck = 0; this.wrong = 0;
    // perfil de velocidade calculado para a aderência real deste carro nesta pista
    this.prof = this.T.speedProfile((car.stats.profGrip || car.stats.grip) * this.T.gripMul);
  }
  update(dt, autopilot = false) {
    const c = this.car, T = this.T, N = T.N, d = autopilot ? DIFFICULTY.hard : this.race.diff, sp = c.speed, prof = this.prof;
    const look = 7 + sp * 0.4;
    const li = (c.ti + Math.max(3, Math.round(look / T.ds))) % N;
    let want = 0, brakeFor = 0;
    for (const o of this.race.cars) {
      if (o === c) continue;
      let ds = o.s - c.s; if (ds < -T.length / 2) ds += T.length; else if (ds > T.length / 2) ds -= T.length;
      if (ds < -1.5 || ds > 26) continue;
      const dl = o.lat - c.lat; if (Math.abs(dl) > 3.6) continue;
      const closing = c.vf - (o.vx * c.fx + o.vz * c.fz);
      if (closing < -1 && ds > 5) continue;
      const w = (1 - Math.abs(dl) / 3.6) * (1 - Math.max(0, ds) / 26);
      let side = dl >= 0 ? -1 : 1;
      if (Math.abs(c.lat + side * 3) > T.hw - 1.5) side = -side;
      want += side * w * 4.5;
      if (ds < 11 && ds > 0 && closing > 3 && Math.abs(dl) < 2.3) brakeFor = Math.max(brakeFor, closing);
    }
    this.avoid = damp(this.avoid, clamp(want, -5, 5), 2.2 + d.react, dt);
    const wob = autopilot ? 0 : Math.sin(this.race.time * 0.45 + this.phase) * d.wobble * 1.3;
    let tl = clamp(T.rlOff[li] + this.avoid + wob, -T.hw + 1.6, T.hw - 1.6);
    for (const r of T.ramps) {                                     // a IA não usa as rampas (caminho alternativo do jogador)
      const sL = li * T.ds;
      if ((sL > r.s0 - 40 && sL < r.s0 + r.len + 3) || (c.s > r.s0 - 10 && c.s < r.s0 + r.len)) {
        if (r.a > 0) tl = Math.min(tl, r.a - 1.7); else tl = Math.max(tl, r.b + 1.7);
      }
    }
    const tx = T.px[li] + T.nx[li] * tl, tz = T.pz[li] + T.nz[li] * tl;
    const dx = tx - c.x, dz = tz - c.z;
    const lx = dx * c.rx + dz * c.rz, lz = dx * c.fx + dz * c.fz;
    const ang = Math.atan2(lx, Math.max(0.1, lz));
    const steer = clamp(-ang * 2.5 - c.yaw * 0.06, -1, 1);
    const bi = (c.ti + Math.round((3 + sp * 0.2) / T.ds)) % N;
    const corner = autopilot ? 0.96 : d.corner * this.skill;
    let vt = Math.min(prof[bi], prof[(bi + 8) % N] + 4) * corner;
    if (brakeFor > 0) vt = Math.min(vt, sp - brakeFor * 0.6);
    let thr = 0, brk = 0;
    if (sp < vt - 0.5) thr = 1; else if (sp > vt + 1.5) brk = clamp((sp - vt) / 8, 0.25, 1); else thr = 0.35;
    let nitro = false;
    if (this.nitroT > 0) { this.nitroT -= dt; nitro = prof[(c.ti + 25) % N] > sp + 4; if (!nitro) this.nitroT = 0; }
    else if (!autopilot && d.nitro > 0 && c.nitro > 0.35 && prof[(c.ti + 30) % N] > sp + 12 && prof[(c.ti + 60) % N] > sp + 12 && Math.random() < d.nitro * dt * 0.7) this.nitroT = 1.4 + Math.random() * 1.6;
    c.input.throttle = thr; c.input.brake = brk; c.input.steer = steer; c.input.handbrake = false; c.input.nitro = nitro;
    if (c.active && !c.finished) {
      if (sp < 2.5) this.stuck += dt; else this.stuck = Math.max(0, this.stuck - dt * 2);
      const back = c.fx * c.ttx + c.fz * c.ttz < -0.3;
      this.wrong = back ? this.wrong + dt : 0;
      if (this.stuck > 2.5 || this.wrong > 2.5) { this.race.respawn(c); this.stuck = 0; this.wrong = 0; }
    }
  }
}

/* =====================================================================
   PLAYER — liga o carro do jogador aos controles (teclado/gamepad/toque)
   ===================================================================== */
class Player {
  constructor(car, input) { this.car = car; this.input = input; }
  update(dt) { Object.assign(this.car.input, this.input.read(dt)); }
}

/* =====================================================================
   GHOST SYSTEM — Modo Treino: grava a volta (20 Hz interpolado), salva o
   melhor tempo por pista no LocalStorage e reproduz o carro sombra.
   Amostra = [x, y, z, rumo, pitch, roll, distância na pista]
   ===================================================================== */
class GhostSystem {
  static key(trackId) { return 'nitroRush3D.ghost.' + trackId; }
  static load(trackId, len = 0) {
    try {
      const raw = localStorage.getItem(GhostSystem.key(trackId)); if (!raw) return null;
      const g = JSON.parse(raw);
      if (!g || !Array.isArray(g.d) || !(g.lap > 0) || !CARS[g.car] || g.d.length < 28 || g.d.length % 7) return null;
      if (len && g.len && Math.abs(g.len - len) > 2) return null;       // traçado mudou: fantasma inválido
      return g;
    } catch (e) { return null; }
  }
  constructor(race) {
    this.race = race; this.trackId = race.trackId; this.hz = 20; this.rec = []; this.recording = false; this.prev = null;
    this.best = GhostSystem.load(this.trackId, race.track.length); this.inst = null; this.tmp = new Array(7); this.wheel = 0;
    if (this.best) this.spawn(this.best);
  }
  spawn(g) {
    if (this.inst) { this.race.scene.remove(this.inst.root); CarFactory.disposeInstance(this.inst); }
    this.inst = CarFactory.create(g.car, '#88ccff', { ghost: true });
    this.inst.root.visible = false; this.race.scene.add(this.inst.root);
    this.data = Float32Array.from(g.d); this.n = this.data.length / 7; this.ghz = g.hz || 20; this.dur = (this.n - 1) / this.ghz;
  }
  pose() { const P = this.race.player; return [P.x, P.y, P.z, P.heading, P.visPitch, P.bankRoll, P.s]; }
  startLap() { this.rec = []; this.recording = true; this.nextT = 0; this.prev = null; }
  record(tLap) {
    if (!this.recording) return;
    const cur = { t: tLap, v: this.pose() };
    if (!this.prev) this.prev = cur;
    while (this.nextT <= cur.t + 1e-9) {           // amostras em intervalos fixos, interpoladas entre quadros
      const a = this.prev, b = cur, k = b.t > a.t ? clamp((this.nextT - a.t) / (b.t - a.t), 0, 1) : 1;
      for (let j = 0; j < 7; j++) this.rec.push(j === 3 ? a.v[3] + wrapAngle(b.v[3] - a.v[3]) * k : lerp(a.v[j], b.v[j], k));
      this.nextT += 1 / this.hz;
    }
    this.prev = cur;
  }
  // fim da volta: salva se for recorde pessoal (retorna true)
  finishLap(lapTime) {
    this.recording = false;
    if (this.rec.length < 7 * 10) return false;
    const isPB = !this.best || lapTime < this.best.lap;
    if (isPB) {
      const q = (x, d) => Math.round(x * d) / d;
      const d = this.rec.map((x, j) => { const f = j % 7; return f >= 3 && f <= 5 ? q(x, 1000) : q(x, 100); });
      const g = { v: 2, track: this.trackId, len: Math.round(this.race.track.length), car: this.race.player.model, lap: +lapTime.toFixed(3), hz: this.hz, date: Date.now(), d };
      try { localStorage.setItem(GhostSystem.key(this.trackId), JSON.stringify(g)); } catch (e) { console.warn('Ghost não salvo', e); }
      this.best = g; this.spawn(g);
    }
    return isPB;
  }
  sample(t, out) {
    const f = clamp(t * this.ghz, 0, this.n - 1), i = Math.min(this.n - 2, Math.floor(f)), k = f - i, D = this.data, a = i * 7, b = a + 7;
    for (let j = 0; j < 7; j++) out[j] = j === 3 ? D[a + 3] + wrapAngle(D[b + 3] - D[a + 3]) * k : lerp(D[a + j], D[b + j], k);
    return out;
  }
  update() {
    if (!this.inst) return;
    const P = this.race.player, root = this.inst.root, t = this.race.time - P.lapStart;
    if (P.crossings < 1 || P.finished || t > this.dur + 0.4) { root.visible = false; return; }
    const o = this.sample(Math.min(t, this.dur), this.tmp);
    root.visible = true; root.position.set(o[0], o[1], o[2]); root.rotation.set(o[4], o[3], o[5]);
    const ds = this.lastS != null ? Math.abs(o[6] - this.lastS) : 0; this.lastS = o[6];
    this.wheel += (ds < 30 ? ds : 0) / 0.36;
    for (const w of this.inst.wheels) w.spin.rotation.x = this.wheel;
  }
  // diferença de tempo para o fantasma no mesmo ponto da pista (negativo = você está à frente)
  delta() {
    if (!this.inst || !this.race.player.crossings) return null;
    const P = this.race.player, D = this.data, n = this.n, t = this.race.time - P.lapStart;
    if (t < 0.6 || P.s <= D[6] || P.s >= D[(n - 1) * 7 + 6]) return null;
    let lo = 0, hi = n - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (D[m * 7 + 6] < P.s) lo = m; else hi = m; }
    const s0 = D[lo * 7 + 6], s1 = D[hi * 7 + 6], k = s1 > s0 ? clamp((P.s - s0) / (s1 - s0), 0, 1) : 0;
    return t - (lo + k) / this.ghz;
  }
  dispose() { if (this.inst) { this.race.scene.remove(this.inst.root); CarFactory.disposeInstance(this.inst); this.inst = null; } }
}
