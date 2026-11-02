// The radar's 8-LED light ring and its round screen, in the browser.
//
// renderRing() is a straight port of the firmware's src/ui/led_ring.cpp
// render() + alerts() (radar repo, main fdd62ad): the same effects, palette
// maths, sweep beam and alert rules. The palettes are the web UI's RING_PALS,
// the sweep turns once every 6 s like radar_display.cpp, and plane colours are
// the altitude ramp. drawScope() draws a made-up sky (no real map, no real
// location) for the demos.

export const N = 8;
const LED_DEG = 45;
export const SWEEP_S = 6;

export const FX = ["Solid", "Breathe", "Comet", "Scroll", "Sparkle", "Beam", "Pings", "Planes"] as const;
export type Fx = (typeof FX)[number];
export const RADAR_FX: Fx[] = ["Beam", "Pings", "Planes"];
export const AMBIENT_FX: Fx[] = ["Solid", "Breathe", "Comet", "Scroll", "Sparkle"];

export const FX_DESC: Record<Fx, string> = {
  Beam: "A light turns round the ring with the sweep.",
  Pings: "Each plane flashes its height colour as the sweep passes it.",
  Planes: "A steady glow toward each plane. Brighter when it's close.",
  Solid: "One colour, fading slowly between your colours.",
  Breathe: "The whole ring breathes, stepping through your colours.",
  Comet: "A bright head and a tail chase round the ring.",
  Scroll: "Your colours as a band, turning round.",
  Sparkle: "Twinkles over a dim glow.",
};

type Hsv = readonly [number, number, number];

/** The web UI's colour sets (HSV bytes, as the radar stores them). */
export const PALS: Record<string, readonly Hsv[]> = {
  Radar: [[96, 220, 255], [132, 220, 255], [28, 235, 255]],
  Mega: [[132, 220, 255], [20, 235, 255], [214, 220, 255]],
  Fire: [[0, 255, 255], [16, 255, 255], [40, 255, 255]],
  Ocean: [[160, 255, 255], [132, 235, 255], [120, 220, 220]],
  Rainbow: [[0, 255, 255], [60, 255, 255], [132, 255, 255], [200, 255, 255]],
  Ember: [[2, 255, 255], [22, 255, 200]],
  Ice: [[140, 90, 255], [150, 200, 255]],
  Neon: [[214, 255, 255], [132, 255, 255], [80, 255, 255]],
  Sunset: [[16, 255, 255], [230, 200, 255], [180, 220, 220]],
};
export type PalName = keyof typeof PALS;

type Rgb = [number, number, number];

function hsv(h: number, s: number, v: number): Rgb {
  const f = (n: number) => {
    const k = (n + h * 6) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return [f(5), f(3), f(1)].map((x) => Math.round(x * 255)) as Rgb;
}

const hex = (c: Hsv) =>
  "#" + hsv(c[0] / 255, c[1] / 255, c[2] / 255).map((x) => x.toString(16).padStart(2, "0")).join("");

/** A conic-gradient stop list for a palette swatch. */
export const palCss = (name: string) => {
  const c = PALS[name];
  return c.map(hex).concat(hex(c[0])).join(",");
};

/** Height colours (web/index.html ALT_BANDS). */
const ALT: [number, string][] = [
  [2000, "#FF4900"],
  [10000, "#FFB600"],
  [20000, "#55DB00"],
  [30000, "#00DBDB"],
  [40000, "#006DFF"],
  [1e9, "#FF00FF"],
];
const altHex = (ft: number) => ALT.find((a) => ft < a[0])![1];
const rgbOf = (h: string) => [1, 3, 5].map((i) => parseInt(h.substr(i, 2), 16)) as Rgb;

interface Plane {
  b: number; // bearing, degrees
  f: number; // distance, as a fraction of the screen radius
  alt: number;
  hd: number; // heading
  cs?: string;
}
interface Blip extends Plane {
  em?: boolean;
  rgb: Rgb;
}

/** A made-up sky. */
export const PLANES: Plane[] = [
  { b: 35, f: 0.62, alt: 4100, hd: 200, cs: "SWA21" },
  { b: 200, f: 0.42, alt: 2100, hd: 80, cs: "N52KP" },
  { b: 228, f: 0.8, alt: 41000, hd: 20, cs: "UAL7" },
  { b: 300, f: 0.4, alt: 23000, hd: 120, cs: "DAL88" },
  { b: 125, f: 0.9, alt: 12000, hd: 270, cs: "AAL6" },
];
const CLOSE: Plane = { b: 62, f: 0.17, alt: 1800, hd: 300, cs: "N9TR" };

export interface RingState {
  on: number;
  fx: Fx;
  pal: PalName;
  /** 0..1, the playground's brightness (the radar's is 0..255) */
  bri: number;
  /** 0..255 */
  spd: number;
  /** bit 1 = close planes, bit 2 = emergencies */
  alerts: number;
  /** "Turn the ring": 0..7, 45° steps */
  rot: number;
  ccw: number;
}

export const RING_DEFAULT: RingState = { on: 1, fx: "Breathe", pal: "Radar", bri: 0.65, spd: 130, alerts: 2, rot: 0, ccw: 0 };

interface RenderIn {
  on: number;
  fx: number;
  c: readonly Hsv[];
  spd: number;
  alerts: number;
  rot: number;
  ccw: number;
}

/** led_ring.cpp render(t) + alerts(t), into `out` (8 RGB triples). */
export function renderRing(g: RenderIn, t: number, blips: Blip[], out: Rgb[]) {
  for (let i = 0; i < N; i++) out[i] = [0, 0, 0];
  if (!g.on) return;
  const c = g.c;
  const n = Math.max(1, c.length);
  const rate = 0.15 + (g.spd / 255) * 2.2;
  const phase = t * rate;
  const head = ((t / SWEEP_S) % 1) * 360;
  const pal = (p: number, i: number, v: number, add = false) => {
    i = ((i % n) + n) % n;
    const rgb = hsv(c[i][0] / 255, c[i][1] / 255, (c[i][2] / 255) * Math.max(0, Math.min(1, v)));
    out[p] = add ? (out[p].map((x, k) => Math.min(255, x + rgb[k])) as Rgb) : rgb;
  };
  const ledDeg = (i: number) => {
    const k = (((i - g.rot) % N) + N) % N;
    return ((g.ccw ? N - k : k) % N) * LED_DEG;
  };
  const behind = (deg: number, h: number) => (h - deg + 720) % 360;
  const apart = (a: number, b: number) => {
    const d = Math.abs(a - b) % 360;
    return d > 180 ? 360 - d : d;
  };
  const addRgb = (p: number, rgb: Rgb, v: number) => {
    out[p] = out[p].map((x, k) => Math.min(255, x + rgb[k] * v)) as Rgb;
  };
  const addBlip = (p: Blip, v: number) => {
    for (let i = 0; i < N; i++) {
      const w = 1 - apart(ledDeg(i), p.b) / LED_DEG;
      if (w > 0) addRgb(i, p.rgb, v * w);
    }
  };
  const beam = (scale: number) => {
    for (let i = 0; i < N; i++) {
      const d = behind(ledDeg(i), head);
      const v =
        d < 120 ? (1 - d / 120) * (1 - d / 120) : d > 360 - LED_DEG ? ((d - (360 - LED_DEG)) / LED_DEG) * 0.5 : 0;
      if (v > 0.01) pal(i, 0, v * scale);
    }
  };
  switch (g.fx) {
    case 0: {
      const f = (phase * 0.25) % n;
      const a = Math.floor(f);
      const k = f - a;
      for (let i = 0; i < N; i++) {
        pal(i, a, 1 - k);
        pal(i, a + 1, k, true);
      }
      break;
    }
    case 1: {
      const br = 0.15 + 0.85 * (0.5 + 0.5 * Math.sin(phase));
      const idx = Math.floor(phase * 0.35);
      for (let i = 0; i < N; i++) pal(i, idx, br);
      break;
    }
    case 2: {
      const hd = (phase * 0.9) % N;
      const idx = Math.floor(phase * 0.4);
      for (let i = 0; i < N; i++) {
        let d = Math.abs(i - hd);
        d = Math.min(d, N - d);
        const v = Math.max(0, 1 - d * 0.5);
        if (v > 0.02) pal(i, idx, v * v);
      }
      break;
    }
    case 3: {
      const off = phase * 0.6;
      for (let i = 0; i < N; i++) {
        const f = (i / N) * n + off;
        const a = Math.floor(f) % n;
        pal(i, f - Math.floor(f) < 0.5 ? a : a + 1, 1);
      }
      break;
    }
    case 4: {
      for (let i = 0; i < N; i++) pal(i, 0, 0.08);
      const seed = Math.floor(phase * 3);
      for (let k = 0; k < 3; k++) {
        const i = (((seed * 37 + k * 101) % N) + N) % N;
        pal(i, seed + k, 0.5 + 0.5 * Math.sin(phase * 6 + k));
      }
      break;
    }
    case 5:
      beam(1);
      break;
    case 6: {
      beam(0.25);
      for (const p of blips) {
        const v = Math.max(0, 1 - behind(p.b, head) / 270);
        if (v > 0) addBlip(p, v * v);
      }
      break;
    }
    case 7: {
      const sh = 0.85 + 0.15 * Math.sin(phase);
      for (const p of blips) addBlip(p, (0.2 + 0.8 * (1 - Math.min(1, p.f))) * sh);
      break;
    }
  }
  // alerts, drawn over any effect
  const ring1 = 0.245;
  const em = blips.some((p) => p.em);
  let close: Blip | null = null;
  for (const p of blips) if (p.f < ring1 && (!close || p.f < close.f)) close = p;
  if (g.alerts & 2 && em) {
    const on = Math.floor(t * 4) % 2 === 0; // 2 Hz
    for (let i = 0; i < N; i++) out[i] = [on ? 255 : 0, 0, 0];
    return;
  }
  if (g.alerts & 1 && close) {
    const v = 0.5 + 0.5 * Math.sin(t * 6.2832); // 1 Hz
    for (let i = 0; i < N; i++) addRgb(i, close.rgb, 0.6 * v);
  }
}

// ------------------------------------------------------------------ the screen

/** A look for the round screen (web/index.html THEMES, simplified). */
export interface Look {
  bg: string;
  ring: string;
  sweep: string;
  ink: string;
  /** null = colour planes by height */
  plane: string | null;
  map?: { land: string; water: string; road: string };
}

export const SCOPE_LOOK: Look = { bg: "#000", ring: "#0E5A2C", sweep: "29,255,134", ink: "#9AFFC8", plane: null };

export interface SkyOpts {
  emergency?: boolean;
  close?: boolean;
  /** No planes yet (no location). */
  empty?: boolean;
  /** Zoom: 1 = middle range. Bigger = closer in (planes spread out). */
  zoom?: number;
  /** Call sign, type and height beside each plane (big screens only). */
  labels?: boolean;
  /** Written on the third ring, like "9 mi". */
  ringLabel?: string;
  /** Dots on the rim for planes just past the edge. */
  rim?: boolean;
  /** A made-up airport's runway and code. */
  runway?: boolean;
}

export function blipsFor(o: SkyOpts): Blip[] {
  if (o.empty) return [];
  const z = o.zoom ?? 1;
  const b: Blip[] = PLANES.map((p, i) => ({ ...p, f: p.f * z, em: !!o.emergency && i === 1, rgb: [0, 0, 0] as Rgb })).filter(
    (p) => p.f < 0.97,
  );
  if (o.close) b.push({ ...CLOSE, rgb: [0, 0, 0] });
  b.forEach((p) => (p.rgb = rgbOf(p.em ? "#FF3B30" : altHex(p.alt))));
  return b;
}

/** A made-up town: a lake, a river and two roads. Not anyone's real map. */
function drawMap(x: CanvasRenderingContext2D, R: number, dpr: number, m: NonNullable<Look["map"]>) {
  x.fillStyle = m.water;
  x.beginPath();
  x.ellipse(R * 0.42, -R * 0.38, R * 0.36, R * 0.22, -0.5, 0, 7);
  x.fill();
  x.strokeStyle = m.water;
  x.lineWidth = 7 * dpr;
  x.beginPath();
  x.moveTo(-R, R * 0.2);
  x.bezierCurveTo(-R * 0.4, R * 0.05, -R * 0.1, R * 0.6, R * 0.5, R * 0.45);
  x.bezierCurveTo(R * 0.8, R * 0.38, R * 0.9, R * 0.7, R, R * 0.8);
  x.stroke();
  x.strokeStyle = m.road;
  x.lineWidth = 1.4 * dpr;
  x.beginPath();
  x.moveTo(-R, -R * 0.55);
  x.lineTo(R, R * 0.1);
  x.moveTo(-R * 0.25, -R);
  x.lineTo(-R * 0.05, R);
  x.moveTo(-R * 0.9, R * 0.7);
  x.lineTo(R * 0.1, -R * 0.2);
  x.stroke();
}

const TYPES = ["B738", "SR20", "A321", "E175", "B39M", "C172"];

export function drawScope(cv: HTMLCanvasElement, dpr: number, look: Look, t: number, blips: Blip[], sky: SkyOpts = {}) {
  const labels = !!sky.labels;
  const x = cv.getContext("2d");
  if (!x) return;
  const S = cv.width;
  const R = S / 2;
  x.setTransform(1, 0, 0, 1, 0, 0);
  x.fillStyle = look.bg;
  x.fillRect(0, 0, S, S);
  x.translate(R, R);
  if (look.map) drawMap(x, R, dpr, look.map);
  const pt = (deg: number, f: number) => {
    const a = (deg * Math.PI) / 180;
    return [Math.sin(a) * f * R * 0.94, -Math.cos(a) * f * R * 0.94];
  };
  x.strokeStyle = look.ring;
  x.lineWidth = 1.2 * dpr;
  for (const f of [0.23, 0.45, 0.69, 0.94]) {
    x.beginPath();
    x.arc(0, 0, f * R, 0, 7);
    x.stroke();
  }
  x.globalAlpha = 0.5;
  x.beginPath();
  x.moveTo(-R, 0);
  x.lineTo(R, 0);
  x.moveTo(0, -R);
  x.lineTo(0, R);
  x.stroke();
  x.globalAlpha = 1;
  const px1 = S / dpr; // css size
  if (sky.runway) {
    const [ax, ay] = pt(340, 0.6);
    x.strokeStyle = "#E8C547";
    x.lineWidth = 2 * dpr;
    x.beginPath();
    x.moveTo(ax - R * 0.06, ay - R * 0.03);
    x.lineTo(ax + R * 0.05, ay + R * 0.035);
    x.moveTo(ax - R * 0.02, ay + R * 0.05);
    x.lineTo(ax + R * 0.03, ay - R * 0.05);
    x.stroke();
    x.fillStyle = "#E8C547";
    x.font = `700 ${Math.max(7, px1 / 22) * dpr}px Helvetica, Arial, sans-serif`;
    x.textAlign = "center";
    x.textBaseline = "middle";
    x.fillText("KXYZ", ax, ay - R * 0.11);
  }
  if (sky.ringLabel) {
    x.fillStyle = look.ink;
    x.globalAlpha = 0.85;
    x.font = `700 ${Math.max(7, px1 / 22) * dpr}px Helvetica, Arial, sans-serif`;
    x.textAlign = "left";
    x.textBaseline = "middle";
    x.fillText(sky.ringLabel, R * 0.69 * 0.94 + 3 * dpr, -R * 0.06);
    x.globalAlpha = 1;
  }
  if (sky.rim) {
    for (const [deg, c] of [
      [312, "#00DBDB"],
      [118, "#FFB600"],
    ] as const) {
      const [rx, ry] = pt(deg, 0.985);
      x.fillStyle = c;
      x.beginPath();
      x.arc(rx, ry, 3 * dpr, 0, 7);
      x.fill();
    }
  }
  const head = ((t / SWEEP_S) % 1) * 360;
  for (let k = 0; k < 40; k++) {
    const a0 = ((head - 70 + k * 1.75 - 90) * Math.PI) / 180;
    const a1 = a0 + (1.9 * Math.PI) / 180;
    x.fillStyle = `rgba(${look.sweep},${0.32 * (k / 40) ** 2})`;
    x.beginPath();
    x.moveTo(0, 0);
    x.arc(0, 0, R * 0.94, a0, a1);
    x.closePath();
    x.fill();
  }
  const [hx, hy] = pt(head, 1);
  x.strokeStyle = `rgb(${look.sweep})`;
  x.lineWidth = 1.6 * dpr;
  x.beginPath();
  x.moveTo(0, 0);
  x.lineTo(hx, hy);
  x.stroke();
  x.fillStyle = look.ink;
  x.font = `700 ${Math.max(7, S / dpr / 18) * dpr}px Helvetica, Arial, sans-serif`;
  x.textAlign = "center";
  x.textBaseline = "middle";
  x.fillText("N", 0, -R * 0.83);
  x.fillText("S", 0, R * 0.83);
  x.fillText("E", R * 0.83, 0);
  x.fillText("W", -R * 0.83, 0);
  const s = Math.max(3.5, S / dpr / 34) * dpr;
  for (const p of blips) {
    const [px, py] = pt(p.b, p.f);
    const col = p.em ? "#FF3B30" : look.plane ?? altHex(p.alt);
    if (p.em) {
      const pu = 0.5 + 0.5 * Math.sin(t * 8);
      x.strokeStyle = `rgba(255,59,48,${0.3 + 0.5 * pu})`;
      x.lineWidth = 2 * dpr;
      x.beginPath();
      x.arc(px, py, s * (1.8 + pu), 0, 7);
      x.stroke();
    }
    x.save();
    x.translate(px, py);
    x.rotate((p.hd * Math.PI) / 180);
    x.fillStyle = col;
    x.beginPath();
    x.moveTo(0, -s);
    x.lineTo(s * 0.75, s * 0.8);
    x.lineTo(0, s * 0.35);
    x.lineTo(-s * 0.75, s * 0.8);
    x.closePath();
    x.fill();
    x.restore();
    if (labels && p.cs) {
      const fs = Math.max(7, px1 / 26) * dpr;
      const right = px < R * 0.35;
      const tx = right ? px + s * 1.4 : px - s * 1.4;
      x.textAlign = right ? "left" : "right";
      x.textBaseline = "middle";
      x.font = `700 ${fs}px Helvetica, Arial, sans-serif`;
      x.fillStyle = look.ink;
      x.fillText(p.cs, tx, py - fs * 0.9);
      x.fillStyle = look.map ? "#0B6E8A" : "#3FD0FF";
      x.fillText(TYPES[(p.alt / 100) % TYPES.length | 0], tx, py + fs * 0.1);
      x.fillStyle = look.map ? "#8A5A00" : "#FFB64A";
      x.fillText(`${p.alt.toLocaleString("en-US")} ft`, tx, py + fs * 1.1);
    }
  }
  x.fillStyle = "#B69CFF";
  x.beginPath();
  x.arc(0, 0, 2.5 * dpr, 0, 7);
  x.fill();
}

// ------------------------------------------------------------------ one clock for every device

type Tick = (t: number) => void;
const ticks = new Set<Tick>();
const t0 = typeof performance !== "undefined" ? performance.now() : 0;
let raf = 0;
/** A still moment that shows something in every effect. */
export const STILL_T = 4.3;

export const now = () => (performance.now() - t0) / 1000;

function loop() {
  const t = now();
  ticks.forEach((f) => f(t));
  raf = ticks.size ? requestAnimationFrame(loop) : 0;
}

/** Adds a per-frame callback. Returns the remover. */
export function onTick(f: Tick) {
  ticks.add(f);
  if (!raf) raf = requestAnimationFrame(loop);
  return () => {
    ticks.delete(f);
  };
}
