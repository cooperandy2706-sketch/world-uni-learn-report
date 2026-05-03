import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Heart, Trophy, RefreshCcw, Maximize2, Minimize2, Zap } from 'lucide-react';

// ─── Types ──────────────────────────────────────────────────────────────────
interface EnemyCar {
  id: string;
  word: string;
  lane: number;      // 0 | 1 | 2
  depth: number;     // 1 = horizon, 0 = camera
  speed: number;
  color: string;     // body color
  accentColor: string;
  type: 'sports' | 'sedan' | 'suv';
  hit: boolean;
  hitTimer: number;  // frames after hit (for explosion)
}

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  life: number; maxLife: number;
  color: string; size: number;
}

interface FloatText {
  x: number; y: number;
  vx: number; vy: number;
  text: string; life: number;
  color: string; size: number;
}

// ─── Constants ───────────────────────────────────────────────────────────────
const LANE_COUNT = 3;
const ROAD_W_FRAC = 0.6;    // road width as fraction of canvas width
const HORIZON_Y_FRAC = 0.30;
const BASE_SPEED = 0.0038;
const SPAWN_INTERVAL_MS = 2400;

const WORDS = [
  'NITRO','TURBO','SPEED','DRIFT','BLAZE','STORM','FORGE','PULSE','NOVA','NEXUS',
  'ORBIT','HYPER','CYBER','BOOST','SURGE','FLASH','VIPER','REBEL','RACER','APEX',
  'LEARN','STUDY','BRAIN','FOCUS','SHARP','LOGIC','THINK','SMART','SKILL','GOAL',
];

const CAR_COLORS = [
  { color: '#e53935', accent: '#ff8a80' },   // red
  { color: '#1e88e5', accent: '#82b1ff' },   // blue
  { color: '#43a047', accent: '#b9f6ca' },   // green
  { color: '#8e24aa', accent: '#ea80fc' },   // purple
  { color: '#f4511e', accent: '#ffd180' },   // orange
  { color: '#00897b', accent: '#a7ffeb' },   // teal
  { color: '#fdd835', accent: '#ffffff' },   // yellow (dark accent)
];

const CAR_TYPES: Array<'sports' | 'sedan' | 'suv'> = ['sports', 'sedan', 'suv'];

// ─── Canvas Drawing Helpers ───────────────────────────────────────────────────

/** Draw a realistic top-down car at center (cx,cy) scaled by `scale`. */
function drawCar(
  ctx: CanvasRenderingContext2D,
  cx: number, cy: number,
  scale: number,
  bodyColor: string,
  accentColor: string,
  type: 'sports' | 'sedan' | 'suv',
  hit: boolean,
  hitTimer: number,
) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(scale, scale);

  const dims = {
    sports: { bw: 26, bh: 52, roofW: 18, roofH: 24, roofY: -8 },
    sedan:  { bw: 28, bh: 58, roofW: 20, roofH: 28, roofY: -6 },
    suv:    { bw: 32, bh: 64, roofW: 24, roofH: 34, roofY: -10 },
  }[type];

  const { bw, bh, roofW, roofH, roofY } = dims;

  // Hit flash effect
  if (hit && hitTimer > 0) {
    ctx.globalAlpha = 0.85;
  }

  // ── Shadow under car ──
  ctx.save();
  ctx.fillStyle = 'rgba(0,0,0,0.45)';
  ctx.beginPath();
  ctx.ellipse(0, bh * 0.2, bw * 0.6, bh * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  // ── Car body ──
  const bodyGrad = ctx.createLinearGradient(-bw / 2, -bh / 2, bw / 2, bh / 2);
  bodyGrad.addColorStop(0, lighten(bodyColor, 0.3));
  bodyGrad.addColorStop(0.4, bodyColor);
  bodyGrad.addColorStop(1, darken(bodyColor, 0.35));
  ctx.fillStyle = hit ? `rgba(255,80,80,0.9)` : bodyGrad;
  ctx.beginPath();
  roundedRect(ctx, -bw / 2, -bh / 2, bw, bh, 7);
  ctx.fill();

  // Body outline
  ctx.strokeStyle = darken(bodyColor, 0.5);
  ctx.lineWidth = 1;
  ctx.stroke();

  // ── Roof / cabin ──
  const roofGrad = ctx.createLinearGradient(-roofW / 2, roofY, roofW / 2, roofY + roofH);
  roofGrad.addColorStop(0, 'rgba(20,20,50,0.85)');
  roofGrad.addColorStop(0.5, 'rgba(40,40,80,0.7)');
  roofGrad.addColorStop(1, 'rgba(10,10,30,0.9)');
  ctx.fillStyle = roofGrad;
  ctx.beginPath();
  roundedRect(ctx, -roofW / 2, roofY, roofW, roofH, 5);
  ctx.fill();

  // ── Windshield glare ──
  ctx.fillStyle = 'rgba(180,220,255,0.18)';
  ctx.beginPath();
  ctx.ellipse(-roofW * 0.15, roofY + roofH * 0.2, roofW * 0.25, roofH * 0.25, -0.3, 0, Math.PI * 2);
  ctx.fill();

  // ── Wheels ──
  const wR = type === 'suv' ? 6 : 5;
  const wX = bw / 2 + 1;
  const wY1 = -bh / 2 + (type === 'suv' ? 14 : 12);
  const wY2 = bh / 2 - (type === 'suv' ? 14 : 12);
  [[wX, wY1], [-wX, wY1], [wX, wY2], [-wX, wY2]].forEach(([wx, wy]) => {
    // Tyre
    ctx.fillStyle = '#1a1a1a';
    ctx.beginPath(); ctx.ellipse(wx, wy, wR, wR, 0, 0, Math.PI * 2); ctx.fill();
    // Rim
    ctx.fillStyle = '#c0c0c0';
    ctx.beginPath(); ctx.ellipse(wx, wy, wR * 0.55, wR * 0.55, 0, 0, Math.PI * 2); ctx.fill();
    // Rim spoke
    ctx.strokeStyle = '#888888';
    ctx.lineWidth = 0.8;
    for (let a = 0; a < Math.PI; a += Math.PI / 3) {
      ctx.beginPath();
      ctx.moveTo(wx + Math.cos(a) * wR * 0.5, wy + Math.sin(a) * wR * 0.5);
      ctx.lineTo(wx - Math.cos(a) * wR * 0.5, wy - Math.sin(a) * wR * 0.5);
      ctx.stroke();
    }
  });

  // ── Headlights (front) ──
  const hlY = -bh / 2 + 5;
  const hlW = 8, hlH = 4;
  [[-bw / 2 + 3, hlY], [bw / 2 - 11, hlY]].forEach(([hx, hy]) => {
    // Lens
    ctx.fillStyle = accentColor;
    ctx.shadowColor = accentColor;
    ctx.shadowBlur = 12;
    ctx.beginPath(); roundedRect(ctx, hx, hy, hlW, hlH, 2); ctx.fill();
    // Beam
    const beam = ctx.createLinearGradient(hx + hlW / 2, hy, hx + hlW / 2, hy - 20);
    beam.addColorStop(0, accentColor.replace(')', ',0.4)').replace('rgb', 'rgba'));
    beam.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = beam;
    ctx.beginPath();
    ctx.moveTo(hx, hy);
    ctx.lineTo(hx + hlW, hy);
    ctx.lineTo(hx + hlW + 6, hy - 22);
    ctx.lineTo(hx - 6, hy - 22);
    ctx.closePath();
    ctx.fill();
    ctx.shadowBlur = 0;
  });

  // ── Brake / tail lights (rear) ──
  const tlY = bh / 2 - 8;
  const tlW = 10, tlH = 4;
  [[-bw / 2 + 2, tlY], [bw / 2 - 12, tlY]].forEach(([tx, ty]) => {
    ctx.fillStyle = '#ff2222';
    ctx.shadowColor = '#ff0000';
    ctx.shadowBlur = 10;
    ctx.beginPath(); roundedRect(ctx, tx, ty, tlW, tlH, 2); ctx.fill();
    ctx.shadowBlur = 0;
  });

  // ── Bonnet stripe for sports cars ──
  if (type === 'sports') {
    ctx.fillStyle = `rgba(0,0,0,0.2)`;
    ctx.beginPath();
    roundedRect(ctx, -3, -bh / 2 + 6, 6, 16, 2);
    ctx.fill();
  }

  // ── Accent line along sides ──
  ctx.strokeStyle = accentColor;
  ctx.lineWidth = 1.0;
  ctx.globalAlpha = 0.5;
  ctx.beginPath(); ctx.moveTo(-bw / 2 + 2, -bh * 0.1); ctx.lineTo(-bw / 2 + 2, bh * 0.25); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(bw / 2 - 2, -bh * 0.1); ctx.lineTo(bw / 2 - 2, bh * 0.25); ctx.stroke();
  ctx.globalAlpha = 1;

  ctx.restore();
}

/** Draw scrolling perspective road */
function drawRoad(
  ctx: CanvasRenderingContext2D,
  cW: number, cH: number,
  scrollOffset: number,
) {
  const horizonY = cH * HORIZON_Y_FRAC;
  const roadHalfW = cW * ROAD_W_FRAC / 2;
  const vpX = cW / 2;

  // ── Sky gradient ──
  const sky = ctx.createLinearGradient(0, 0, 0, horizonY);
  sky.addColorStop(0, '#000308');
  sky.addColorStop(0.5, '#040d2e');
  sky.addColorStop(1, '#091436');
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, cW, horizonY);

  // ── Stars ──
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  // Use deterministic "random" via sine to keep stars stable
  for (let i = 0; i < 60; i++) {
    const sx = ((Math.sin(i * 13.7) * 0.5 + 0.5) * cW) | 0;
    const sy = ((Math.sin(i * 7.3) * 0.5 + 0.5) * horizonY * 0.9) | 0;
    const sr = Math.sin(i * 3.1) * 0.5 + 0.8;
    ctx.beginPath(); ctx.arc(sx, sy, sr, 0, Math.PI * 2); ctx.fill();
  }

  // ── City silhouette ──
  ctx.fillStyle = '#080f28';
  const towers = [
    [0.05, 0.45, 0.08], [0.12, 0.28, 0.06], [0.18, 0.48, 0.05],
    [0.24, 0.20, 0.07], [0.30, 0.38, 0.04], [0.36, 0.32, 0.06],
    [0.58, 0.35, 0.06], [0.65, 0.22, 0.07], [0.72, 0.42, 0.05],
    [0.78, 0.28, 0.06], [0.85, 0.50, 0.08], [0.92, 0.32, 0.05],
  ];
  towers.forEach(([xf, hf, wf]) => {
    const bx = cW * xf, bw2 = cW * wf;
    const bh2 = horizonY * hf;
    ctx.fillRect(bx, horizonY - bh2, bw2, bh2);
    // Windows
    for (let wy = horizonY - bh2 + 4; wy < horizonY - 2; wy += 7) {
      for (let wx = bx + 3; wx < bx + bw2 - 3; wx += 6) {
        if ((Math.sin((wy + wx) * 1.3) > 0.1)) {
          ctx.fillStyle = Math.sin((wy * wx) * 0.01) > 0 ? 'rgba(255,220,60,0.6)' : 'rgba(0,180,255,0.4)';
          ctx.fillRect(wx, wy, 3, 4);
          ctx.fillStyle = '#080f28';
        }
      }
    }
  });

  // ── Horizon glow ──
  const hGlow = ctx.createLinearGradient(0, horizonY - 20, 0, horizonY + 20);
  hGlow.addColorStop(0, 'transparent');
  hGlow.addColorStop(0.5, 'rgba(0, 160, 255, 0.15)');
  hGlow.addColorStop(1, 'transparent');
  ctx.fillStyle = hGlow;
  ctx.fillRect(0, horizonY - 20, cW, 40);

  // ── Road surface ──
  ctx.beginPath();
  ctx.moveTo(vpX - 2, horizonY);
  ctx.lineTo(vpX + 2, horizonY);
  ctx.lineTo(vpX + roadHalfW, cH);
  ctx.lineTo(vpX - roadHalfW, cH);
  ctx.closePath();

  // Road surface gradient (dark asphalt feel)
  const road = ctx.createLinearGradient(0, horizonY, 0, cH);
  road.addColorStop(0, '#141428');
  road.addColorStop(0.4, '#1a1a30');
  road.addColorStop(1, '#0e0e20');
  ctx.fillStyle = road;
  ctx.fill();

  // Road surface specular (wet road shimmer)
  const shimmer = ctx.createRadialGradient(vpX, cH, 10, vpX, cH * 0.8, cW * 0.5);
  shimmer.addColorStop(0, 'rgba(100, 180, 255, 0.07)');
  shimmer.addColorStop(1, 'transparent');
  ctx.fillStyle = shimmer;
  ctx.beginPath();
  ctx.moveTo(vpX - 2, horizonY); ctx.lineTo(vpX + 2, horizonY);
  ctx.lineTo(vpX + roadHalfW, cH); ctx.lineTo(vpX - roadHalfW, cH);
  ctx.closePath(); ctx.fill();

  // ── Neon road border rails ──
  drawNeonLine(ctx, vpX - 2, horizonY, vpX - roadHalfW, cH, '#ff00ff', 2.5, 14);
  drawNeonLine(ctx, vpX + 2, horizonY, vpX + roadHalfW, cH, '#00f0ff', 2.5, 14);

  // ── Lane dividers (scrolling dashes) ──
  for (let li = 1; li < LANE_COUNT; li++) {
    const frac = li / LANE_COUNT; // 0.33, 0.67
    const x0 = vpX; // vanish point
    const x1 = vpX - roadHalfW + (roadHalfW * 2 * frac);
    const y0 = horizonY, y1 = cH;

    // Draw dashed perspective line
    const DASH_COUNT = 12;
    for (let d = 0; d < DASH_COUNT; d++) {
      const t0 = ((d / DASH_COUNT) + scrollOffset) % 1;
      const t1 = (((d + 0.48) / DASH_COUNT) + scrollOffset) % 1;
      if (t0 > t1) continue; // skip wrap-around segment
      const tsx0 = lerp(x0, x1, t0 * t0); const tsy0 = lerp(y0, y1, t0 * t0);
      const tsx1 = lerp(x0, x1, t1 * t1); const tsy1 = lerp(y0, y1, t1 * t1);
      const alpha = 0.15 + t0 * 0.35;
      ctx.strokeStyle = `rgba(0, 200, 255, ${alpha})`;
      ctx.lineWidth = 0.5 + t0 * 2;
      ctx.shadowColor = '#00c8ff'; ctx.shadowBlur = 4 * t0;
      ctx.beginPath(); ctx.moveTo(tsx0, tsy0); ctx.lineTo(tsx1, tsy1); ctx.stroke();
      ctx.shadowBlur = 0;
    }
  }
}

// ─── Player Car ───────────────────────────────────────────────────────────────
function drawPlayerCar(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  // Glow puddle under car
  const glow = ctx.createRadialGradient(cx, cy + 30, 0, cx, cy + 30, 60);
  glow.addColorStop(0, 'rgba(0, 243, 255, 0.35)');
  glow.addColorStop(1, 'transparent');
  ctx.fillStyle = glow;
  ctx.fillRect(cx - 70, cy - 10, 140, 80);

  // Headlight beam projection
  ctx.save();
  ctx.globalAlpha = 0.1;
  ctx.fillStyle = '#00f3ff';
  ctx.beginPath();
  ctx.moveTo(cx - 15, cy - 20);
  ctx.lineTo(cx + 15, cy - 20);
  ctx.lineTo(cx + 80, cy - 200);
  ctx.lineTo(cx - 80, cy - 200);
  ctx.closePath(); ctx.fill();
  ctx.globalAlpha = 1;
  ctx.restore();

  drawCar(ctx, cx, cy, 1.4, '#00d4ff', '#ffffff', 'sports', false, 0);
}

// ─── Utility ──────────────────────────────────────────────────────────────────
function lerp(a: number, b: number, t: number) { return a + (b - a) * t; }

function roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}

function drawNeonLine(
  ctx: CanvasRenderingContext2D,
  x0: number, y0: number, x1: number, y1: number,
  color: string, width: number, blur: number
) {
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.shadowColor = color; ctx.shadowBlur = blur;
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke();
  ctx.restore();
}

function lighten(hex: string, amt: number): string {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.min(255, ((c >> 16) & 0xff) + Math.round(255 * amt));
  const g = Math.min(255, ((c >> 8) & 0xff) + Math.round(255 * amt));
  const b = Math.min(255, (c & 0xff) + Math.round(255 * amt));
  return `rgb(${r},${g},${b})`;
}

function darken(hex: string, amt: number): string {
  const c = parseInt(hex.slice(1), 16);
  const r = Math.max(0, ((c >> 16) & 0xff) - Math.round(255 * amt));
  const g = Math.max(0, ((c >> 8) & 0xff) - Math.round(255 * amt));
  const b = Math.max(0, (c & 0xff) - Math.round(255 * amt));
  return `rgb(${r},${g},${b})`;
}

/** Project a lane position + depth onto the canvas */
function project(lane: number, depth: number, cW: number, cH: number) {
  const horizonY  = cH * HORIZON_Y_FRAC;
  const roadHalfW = cW * ROAD_W_FRAC / 2;
  const vpX       = cW / 2;
  const laneWidth = (roadHalfW * 2) / LANE_COUNT;
  const laneOff   = (lane - (LANE_COUNT - 1) / 2) * laneWidth;
  const t         = 1 - Math.max(0, Math.min(1, depth)); // 0 at horizon → 1 at bottom
  const perspT    = t * t; // squared for stronger perspective
  const screenY   = horizonY + (cH - horizonY) * perspT;
  const screenX   = vpX + laneOff * perspT;
  const scale     = 0.10 + perspT * 0.90;
  return { x: screenX, y: screenY, scale };
}

// ─── Audio ───────────────────────────────────────────────────────────────────
function playBeep(ctx: AudioContext, freq: number, dur: number, vol = 0.12, type: OscillatorType = 'sine') {
  try {
    const osc  = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq * 0.6, ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain); gain.connect(ctx.destination);
    osc.start(); osc.stop(ctx.currentTime + dur);
  } catch (_) {}
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function TypingGame() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef     = useRef<HTMLInputElement>(null);
  const audioRef     = useRef<AudioContext | null>(null);
  const rafRef       = useRef(0);

  // ── Mutable game state (refs used in RAF loop) ──
  const gsRef        = useRef<'menu' | 'playing' | 'gameover'>('menu');
  const carsRef      = useRef<EnemyCar[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const floatsRef    = useRef<FloatText[]>([]);
  const scrollRef    = useRef(0);
  const lastSpawnRef = useRef(0);
  const shakeRef     = useRef(0);
  const scoreRef     = useRef(0);
  const healthRef    = useRef(3);
  const levelRef     = useRef(1);
  const comboRef     = useRef(0);
  const inputValRef  = useRef('');

  // ── React state for HUD ──
  const [uiState, setUiState]     = useState<'menu' | 'playing' | 'gameover'>('menu');
  const [score, setScore]         = useState(0);
  const [health, setHealth]       = useState(3);
  const [level, setLevel]         = useState(1);
  const [combo, setCombo]         = useState(0);
  const [input, setInput]         = useState('');
  const [isFS, setIsFS]           = useState(false);
  const [highScore, setHighScore] = useState(() => Number(localStorage.getItem('ngt_hs') || 0));

  const getAudio = () => {
    if (!audioRef.current) audioRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    return audioRef.current;
  };

  // ── Spawn enemy car ──
  const spawnCar = useCallback(() => {
    const palette = CAR_COLORS[Math.floor(Math.random() * CAR_COLORS.length)];
    const type    = CAR_TYPES[Math.floor(Math.random() * CAR_TYPES.length)];
    const word    = WORDS[Math.floor(Math.random() * WORDS.length)];
    const lane    = Math.floor(Math.random() * LANE_COUNT);
    const speed   = BASE_SPEED * (1 + (levelRef.current - 1) * 0.10) * (0.85 + Math.random() * 0.3);
    carsRef.current.push({
      id: Math.random().toString(36).slice(2, 9),
      word, lane, depth: 1.0,
      speed, color: palette.color, accentColor: palette.accent,
      type, hit: false, hitTimer: 0,
    });
  }, []);

  // ── Explosion ──
  const explode = (x: number, y: number, color: string, count = 30) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 2.5 + Math.random() * 6;
      particlesRef.current.push({
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        life: 1, maxLife: 1,
        color: Math.random() > 0.4 ? color : '#ffffff',
        size: 2.5 + Math.random() * 5,
      });
    }
  };

  // ── Start game ──
  const startGame = useCallback(() => {
    scoreRef.current = 0; healthRef.current = 3; levelRef.current = 1; comboRef.current = 0;
    carsRef.current = []; particlesRef.current = []; floatsRef.current = [];
    scrollRef.current = 0; shakeRef.current = 0; lastSpawnRef.current = 0;
    inputValRef.current = '';
    gsRef.current = 'playing';
    setUiState('playing'); setScore(0); setHealth(3); setLevel(1); setCombo(0); setInput('');
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  // ── Game over ──
  const gameOver = useCallback(() => {
    gsRef.current = 'gameover';
    setUiState('gameover');
    const hs = Math.max(scoreRef.current, Number(localStorage.getItem('ngt_hs') || 0));
    localStorage.setItem('ngt_hs', String(hs));
    setHighScore(hs);
    shakeRef.current = 28;
    playBeep(getAudio(), 110, 0.9, 0.18, 'sawtooth');
  }, []);

  // ── Input ──
  const handleInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (gsRef.current !== 'playing') return;
    const val = e.target.value.toUpperCase();
    setInput(val); inputValRef.current = val;

    const match = carsRef.current.find(c => !c.hit && c.depth < 0.95 && c.word === val);
    if (match) {
      match.hit = true; match.hitTimer = 18;
      const canvas = canvasRef.current;
      if (canvas) {
        const { x, y, scale } = project(match.lane, match.depth, canvas.width, canvas.height);
        explode(x, y - 40 * scale, match.color, 32);
        shakeRef.current = 7;
        const pts = 10 * levelRef.current + comboRef.current * 4;
        scoreRef.current += pts;
        comboRef.current++;
        floatsRef.current.push({ x, y: y - 50 * scale, vx: 0, vy: -2, text: `+${pts}`, life: 1, color: '#fbbf24', size: 20 });
        if (comboRef.current > 1) {
          floatsRef.current.push({ x: x + 20, y: y - 80 * scale, vx: 0, vy: -1.5, text: `×${comboRef.current} COMBO!`, life: 1, color: '#ff00ff', size: 15 });
        }
        if (comboRef.current % 10 === 0) {
          levelRef.current = Math.min(levelRef.current + 1, 15);
          setLevel(levelRef.current);
          playBeep(getAudio(), 880, 0.25, 0.12, 'triangle');
        } else {
          playBeep(getAudio(), 400 + comboRef.current * 30, 0.1, 0.10, 'sine');
        }
        setScore(scoreRef.current); setCombo(comboRef.current);
      }
      setInput(''); inputValRef.current = '';
    }
  }, []);

  // ── Fullscreen ──
  const toggleFS = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) containerRef.current.requestFullscreen().catch(() => {});
    else document.exitFullscreen();
  };
  useEffect(() => {
    const h = () => { const f = !!document.fullscreenElement; setIsFS(f); window.dispatchEvent(new CustomEvent('game-fullscreen-toggle', { detail: f })); };
    document.addEventListener('fullscreenchange', h);
    return () => document.removeEventListener('fullscreenchange', h);
  }, []);

  // ── Canvas resize ──
  useEffect(() => {
    const c = canvasRef.current, el = containerRef.current;
    if (!c || !el) return;
    const ro = new ResizeObserver(() => { c.width = el.clientWidth; c.height = el.clientHeight; });
    ro.observe(el); c.width = el.clientWidth; c.height = el.clientHeight;
    return () => ro.disconnect();
  }, []);

  // ── Main RAF loop ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let running = true;
    let lastT   = performance.now();

    const loop = (now: number) => {
      if (!running) return;
      const dt = Math.min(now - lastT, 50);
      lastT = now;
      const ctx = canvas.getContext('2d')!;
      const cW = canvas.width, cH = canvas.height;
      const gs = gsRef.current;

      ctx.clearRect(0, 0, cW, cH);

      // Screenshake
      let sx = 0, sy = 0;
      if (shakeRef.current > 0) {
        const m = shakeRef.current * 0.5;
        sx = (Math.random() - 0.5) * m; sy = (Math.random() - 0.5) * m;
        shakeRef.current--;
      }
      ctx.save(); ctx.translate(sx, sy);

      // Road scroll
      if (gs === 'playing') {
        scrollRef.current += BASE_SPEED * (1 + (levelRef.current - 1) * 0.05) * (dt / 16.67);
        if (scrollRef.current > 1) scrollRef.current -= 1;
      }
      drawRoad(ctx, cW, cH, scrollRef.current);

      // Player car
      const playerY = cH - 110;
      drawPlayerCar(ctx, cW / 2, playerY);

      // Spawn
      if (gs === 'playing') {
        const interval = SPAWN_INTERVAL_MS / (1 + (levelRef.current - 1) * 0.12);
        if (now - lastSpawnRef.current > interval) { spawnCar(); lastSpawnRef.current = now; }
      }

      // Enemy cars — sort far-to-near (largest depth first)
      carsRef.current.sort((a, b) => b.depth - a.depth);

      carsRef.current = carsRef.current.filter(car => {
        // Advance
        if (gs === 'playing' && !car.hit) car.depth -= car.speed * (dt / 16.67);
        if (car.hit) { car.hitTimer--; car.depth -= car.speed * 2.5 * (dt / 16.67); }

        const { x, y, scale } = project(car.lane, Math.max(0, car.depth), cW, cH);

        if (!car.hit || car.hitTimer > 0) {
          drawCar(ctx, x, y, scale, car.color, car.accentColor, car.type, car.hit, car.hitTimer);

          // Word label
          const fs = Math.max(9, Math.round(12 * scale * 2));
          ctx.font = `900 ${fs}px monospace`;
          const typed = inputValRef.current;
          const matchLen = car.word.startsWith(typed) && typed.length > 0 ? typed.length : 0;
          const tw = ctx.measureText(car.word).width + 18;
          const lh = fs + 12;
          const lx = x - tw / 2, ly = y - Math.max(50, 50 * scale) - lh;

          // Tag background
          ctx.fillStyle = 'rgba(0,4,20,0.88)';
          ctx.strokeStyle = '#00e5ff'; ctx.lineWidth = 1.2;
          ctx.shadowColor = '#00e5ff'; ctx.shadowBlur = 8;
          drawPill(ctx, lx, ly, tw, lh, 7); ctx.fill();
          drawPill(ctx, lx, ly, tw, lh, 7); ctx.stroke();
          ctx.shadowBlur = 0;

          // Text
          ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
          const midX = x, midY = ly + lh / 2;
          if (matchLen > 0) {
            // Draw matched portion in cyan, rest in white
            const pre = car.word.slice(0, matchLen);
            const post = car.word.slice(matchLen);
            const preW = ctx.measureText(pre).width;
            const postW = ctx.measureText(post).width;
            ctx.fillStyle = '#00f3ff';
            ctx.shadowColor = '#00f3ff'; ctx.shadowBlur = 6;
            ctx.fillText(pre, midX - postW / 2, midY);
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.fillText(post, midX + preW / 2, midY);
          } else {
            ctx.fillStyle = '#ffffff';
            ctx.fillText(car.word, midX, midY);
          }
          ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
        }

        // Crash check
        if (!car.hit && car.depth <= 0.04) {
          const { x: ex, y: ey } = project(car.lane, 0.04, cW, cH);
          explode(ex, ey, '#ff2040', 40);
          shakeRef.current = 24;
          playBeep(getAudio(), 100, 0.6, 0.2, 'sawtooth');
          healthRef.current--;
          setHealth(healthRef.current);
          comboRef.current = 0; setCombo(0);
          if (healthRef.current <= 0) { gameOver(); return false; }
          return false;
        }

        return car.depth > -0.15;
      });

      // Particles
      ctx.save();
      particlesRef.current = particlesRef.current.filter(p => {
        p.x += p.vx * (dt / 16); p.y += p.vy * (dt / 16); p.vy += 0.2;
        p.life -= 0.03 * (dt / 16);
        if (p.life <= 0) return false;
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath(); ctx.arc(p.x, p.y, p.size * p.life, 0, Math.PI * 2); ctx.fill();
        return true;
      });
      ctx.globalAlpha = 1; ctx.restore();

      // Float texts
      ctx.save();
      floatsRef.current = floatsRef.current.filter(f => {
        f.x += f.vx * (dt / 16); f.y += f.vy * (dt / 16); f.life -= 0.025 * (dt / 16);
        if (f.life <= 0) return false;
        ctx.globalAlpha = Math.max(0, Math.min(1, f.life * 2));
        ctx.font = `900 ${f.size}px "DM Sans", sans-serif`;
        ctx.textAlign = 'center'; ctx.fillStyle = f.color;
        ctx.shadowColor = f.color; ctx.shadowBlur = 10;
        ctx.fillText(f.text, f.x, f.y);
        ctx.shadowBlur = 0; ctx.textAlign = 'left';
        return true;
      });
      ctx.globalAlpha = 1; ctx.restore();

      ctx.restore(); // screenshake

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(rafRef.current); };
  }, [spawnCar, gameOver]);

  return (
    <div ref={containerRef} style={{
      width: '100%', height: isFS ? '100vh' : 'calc(100vh - 120px)', minHeight: 520,
      background: '#000', borderRadius: isFS ? 0 : 22, overflow: 'hidden', position: 'relative',
      fontFamily: '"DM Sans", system-ui, sans-serif',
      boxShadow: isFS ? 'none' : '0 24px 60px rgba(0,0,0,0.8)',
      border: isFS ? 'none' : '1px solid rgba(0,200,255,0.12)', zIndex: isFS ? 9999 : 1,
    }}>
      <style>{`
        @keyframes _nt_float {0%,100%{transform:translateY(0)} 50%{transform:translateY(-10px)}}
        @keyframes _nt_flicker {0%,18%,22%,100%{opacity:1} 20%{opacity:0.35}}
        @keyframes _nt_pulse {0%,100%{opacity:1;box-shadow:0 0 0 rgba(0,243,255,0)} 50%{opacity:0.8;box-shadow:0 0 16px rgba(0,243,255,0.3)}}
        .ntbtn { display:inline-flex;align-items:center;gap:10px;padding:15px 38px;border:none;border-radius:14px;font-size:16px;font-weight:900;cursor:pointer;transition:all .18s;letter-spacing:.08em;text-transform:uppercase;font-family:"DM Sans",monospace; }
        .ntbtn:hover { transform:scale(1.06); } .ntbtn:active { transform:scale(0.97); }
      `}</style>

      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block' }} />

      {/* CRT scanline overlay */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 2, backgroundImage: 'repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.06) 2px,rgba(0,0,0,0.06) 4px)' }} />

      {/* ── HUD ── */}
      {uiState === 'playing' && (
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, zIndex: 10, padding: '14px 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'linear-gradient(to bottom, rgba(0,0,0,0.75),transparent)' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#00f3ff', letterSpacing: '.14em', textShadow: '0 0 8px #00f3ff' }}>SCORE</div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: '#fff', textShadow: '0 0 10px #00f3ff' }}>{score.toString().padStart(6, '0')}</div>
            </div>
            <div>
              <div style={{ fontSize: 9, fontWeight: 800, color: '#ff00ff', letterSpacing: '.14em', textShadow: '0 0 8px #ff00ff' }}>LEVEL</div>
              <div style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', color: '#fff', textShadow: '0 0 10px #ff00ff' }}>{level}</div>
            </div>
            {combo > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '4px 14px', background: 'rgba(255,0,255,0.12)', border: '1px solid rgba(255,0,255,0.35)', borderRadius: 99, animation: '_nt_pulse 0.7s infinite' }}>
                <Zap size={13} color="#ff00ff" fill="#ff00ff" />
                <span style={{ fontSize: 12, fontWeight: 900, color: '#ff00ff' }}>×{combo} COMBO</span>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} style={{ transition: 'all .3s', transform: i < health ? 'scale(1)' : 'scale(0.7)', opacity: i < health ? 1 : 0.2 }}>
                <Heart size={22} fill={i < health ? '#ff0055' : 'transparent'} color="#ff0055" style={{ filter: i < health ? 'drop-shadow(0 0 6px #ff0055)' : 'none' }} />
              </div>
            ))}
            <button onClick={toggleFS} style={{ marginLeft: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.12)', borderRadius: 9, width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}>
              {isFS ? <Minimize2 size={17} /> : <Maximize2 size={17} />}
            </button>
          </div>
        </div>
      )}

      {/* ── Input ── */}
      {uiState === 'playing' && (
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 10, padding: '16px 24px', background: 'linear-gradient(to top, rgba(0,0,0,0.88),transparent)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
          <div style={{ position: 'relative', width: '100%', maxWidth: 420 }}>
            <input ref={inputRef} type="text" value={input} onChange={handleInput}
              placeholder="TYPE WORD → DESTROY ENEMY" autoComplete="off" autoCorrect="off" spellCheck={false}
              style={{ width: '100%', boxSizing: 'border-box', padding: '14px 24px', borderRadius: 14, background: 'rgba(0,8,30,0.9)', border: '2px solid rgba(0,243,255,0.5)', color: '#00f3ff', fontSize: 19, fontWeight: 900, textAlign: 'center', fontFamily: 'monospace', letterSpacing: '.2em', outline: 'none', boxShadow: '0 0 20px rgba(0,243,255,0.15)' }}
              onFocus={e => e.target.style.borderColor = '#00f3ff'} onBlur={e => e.target.style.borderColor = 'rgba(0,243,255,0.4)'}
            />
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)', letterSpacing: '.08em' }}>TYPE THE WORD ON AN ENEMY CAR TO DESTROY IT</div>
        </div>
      )}

      {/* ── MENU ── */}
      {uiState === 'menu' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,2,18,0.88)', backdropFilter: 'blur(8px)' }}>
          <div style={{ textAlign: 'center', marginBottom: 10, animation: '_nt_float 3s ease-in-out infinite' }}>
            <div style={{ fontSize: 'clamp(38px,7vw,70px)', fontWeight: 900, letterSpacing: '.16em', color: '#00f3ff', textShadow: '0 0 24px #00f3ff, 0 0 60px rgba(0,243,255,0.3)', animation: '_nt_flicker 5s infinite', fontFamily: '"DM Sans",monospace' }}>
              NITRO<span style={{ color: '#ff00ff', textShadow: '0 0 24px #ff00ff' }}>TYPER</span>
            </div>
            <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.4)', letterSpacing: '.2em', marginTop: 6 }}>TYPE · AIM · DESTROY</div>
          </div>
          {highScore > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 28, padding: '7px 18px', background: 'rgba(255,204,0,0.08)', border: '1px solid rgba(255,204,0,0.28)', borderRadius: 99 }}>
              <Trophy size={15} color="#ffcc00" />
              <span style={{ fontSize: 13, fontWeight: 700, color: '#ffcc00' }}>BEST: {highScore.toString().padStart(6, '0')}</span>
            </div>
          )}
          <button className="ntbtn" onClick={startGame} style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff', boxShadow: '0 0 40px rgba(0,212,255,0.35)', marginBottom: 36 }}>
            🏎  START ENGINE
          </button>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12, maxWidth: 540, width: '90%' }}>
            {[
              { icon: '⌨', t: 'Type the Word', d: 'Words appear on enemy cars approaching you' },
              { icon: '💥', t: 'Destroy It', d: 'Type it fully to explode the enemy car' },
              { icon: '🔥', t: 'Build Combos', d: 'Chain kills for massive point multipliers' },
            ].map(x => (
              <div key={x.t} style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, padding: '14px 10px', textAlign: 'center' }}>
                <div style={{ fontSize: 22, marginBottom: 5 }}>{x.icon}</div>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#00f3ff', marginBottom: 4 }}>{x.t}</div>
                <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.38)', lineHeight: 1.4 }}>{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── GAME OVER ── */}
      {uiState === 'gameover' && (
        <div style={{ position: 'absolute', inset: 0, zIndex: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'rgba(80,0,15,0.85)', backdropFilter: 'blur(12px)' }}>
          <div style={{ fontSize: 52, marginBottom: 6 }}>💥</div>
          <div style={{ fontSize: 'clamp(30px,5vw,54px)', fontWeight: 900, color: '#ff0055', textShadow: '0 0 30px #ff0055', letterSpacing: '.1em', marginBottom: 14 }}>TOTAL CRASH!</div>
          <div style={{ display: 'flex', gap: 28, marginBottom: 36, padding: '18px 28px', background: 'rgba(0,0,0,0.45)', borderRadius: 18, border: '1px solid rgba(255,255,255,0.07)' }}>
            {[
              { label: 'YOUR SCORE', value: score.toString().padStart(6, '0'), color: '#00f3ff' },
              { label: 'BEST', value: highScore.toString().padStart(6, '0'), color: '#fbbf24' },
              { label: 'LEVEL', value: String(level), color: '#ff00ff' },
            ].map((s, i) => (
              <React.Fragment key={s.label}>
                {i > 0 && <div style={{ width: 1, background: 'rgba(255,255,255,0.08)' }} />}
                <div style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.38)', letterSpacing: '.12em', marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 32, fontWeight: 900, fontFamily: 'monospace', color: s.color, textShadow: `0 0 12px ${s.color}` }}>{s.value}</div>
                </div>
              </React.Fragment>
            ))}
          </div>
          <button className="ntbtn" onClick={startGame} style={{ background: 'linear-gradient(135deg,#00d4ff,#7c3aed)', color: '#fff', boxShadow: '0 0 30px rgba(0,212,255,0.3)' }}>
            <RefreshCcw size={17} /> PLAY AGAIN
          </button>
        </div>
      )}
    </div>
  );
}

function drawPill(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y); ctx.arcTo(x + w, y, x + w, y + r, r);
  ctx.lineTo(x + w, y + h - r); ctx.arcTo(x + w, y + h, x + w - r, y + h, r);
  ctx.lineTo(x + r, y + h); ctx.arcTo(x, y + h, x, y + h - r, r);
  ctx.lineTo(x, y + r); ctx.arcTo(x, y, x + r, y, r);
  ctx.closePath();
}
