// Seeded sample doodles drawn with the real engine (no image files).
import { type Bitmap, createBitmap, drawLine, setPixel, stamp } from "./bitmap";
import { CANVAS_HEIGHT, CANVAS_WIDTH, PAPER } from "./constants";

export const DOODLE_KINDS = [
  "frog",
  "cat",
  "city",
  "sea",
  "space",
  "garden",
  "ghost",
  "mountains",
  "rain",
] as const;
export type DoodleKind = (typeof DOODLE_KINDS)[number];

const INK = 1;
const RED = 2;
const BLUE = 3;
const W = CANVAS_WIDTH;
const H = CANVAS_HEIGHT;

// Seeded random

export type Rng = {
  next: () => number;
  int: (min: number, max: number) => number;
  pick: <T>(items: readonly T[]) => T;
  chance: (p: number) => boolean;
};

export function rng(seed: number): Rng {
  let a = seed >>> 0 || 1;
  const next = () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    next,
    int: (min, max) => Math.floor(next() * (max - min + 1)) + min,
    pick: (items) => items[Math.floor(next() * items.length)],
    chance: (p) => next() < p,
  };
}

// Shapes

export function fillRect(b: Bitmap, x: number, y: number, w: number, h: number, c: number) {
  for (let yy = y; yy < y + h; yy++) for (let xx = x; xx < x + w; xx++) setPixel(b, xx, yy, c);
}

function rectOutline(b: Bitmap, x: number, y: number, w: number, h: number, c: number, size = 1) {
  fillRect(b, x, y, w, h, PAPER);
  drawLine(b, x, y, x + w - 1, y, size, c);
  drawLine(b, x, y + h - 1, x + w - 1, y + h - 1, size, c);
  drawLine(b, x, y, x, y + h - 1, size, c);
  drawLine(b, x + w - 1, y, x + w - 1, y + h - 1, size, c);
}

export function fillEllipse(b: Bitmap, cx: number, cy: number, rx: number, ry: number, c: number) {
  for (let y = -ry; y <= ry; y++) {
    for (let x = -rx; x <= rx; x++) {
      if ((x * x) / (rx * rx) + (y * y) / (ry * ry) <= 1.05) setPixel(b, cx + x, cy + y, c);
    }
  }
}

export const fillCircle = (b: Bitmap, cx: number, cy: number, r: number, c: number) =>
  fillEllipse(b, cx, cy, r, r, c);

// Ellipse with an outline of thickness t
export function ringEllipse(
  b: Bitmap,
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  t = 2,
  c = INK,
  inside = PAPER,
) {
  fillEllipse(b, cx, cy, rx, ry, c);
  fillEllipse(b, cx, cy, rx - t, ry - t, inside);
}

export function fillTriangle(
  b: Bitmap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  x2: number,
  y2: number,
  c: number,
) {
  const minX = Math.floor(Math.min(x0, x1, x2));
  const maxX = Math.ceil(Math.max(x0, x1, x2));
  const minY = Math.floor(Math.min(y0, y1, y2));
  const maxY = Math.ceil(Math.max(y0, y1, y2));
  for (let y = minY; y <= maxY; y++) {
    for (let x = minX; x <= maxX; x++) {
      const px = x + 0.5;
      const py = y + 0.5;
      const w0 = (x1 - x0) * (py - y0) - (px - x0) * (y1 - y0);
      const w1 = (x2 - x1) * (py - y1) - (px - x1) * (y2 - y1);
      const w2 = (x0 - x2) * (py - y2) - (px - x2) * (y0 - y2);
      if ((w0 >= 0 && w1 >= 0 && w2 >= 0) || (w0 <= 0 && w1 <= 0 && w2 <= 0)) setPixel(b, x, y, c);
    }
  }
}

export function triangleOutline(
  b: Bitmap,
  pts: [number, number, number, number, number, number],
  c = INK,
  inside = PAPER,
  size = 2,
) {
  const [x0, y0, x1, y1, x2, y2] = pts;
  fillTriangle(b, x0, y0, x1, y1, x2, y2, inside);
  drawLine(b, x0, y0, x1, y1, size, c);
  drawLine(b, x1, y1, x2, y2, size, c);
  drawLine(b, x2, y2, x0, y0, size, c);
}

export function curve(b: Bitmap, x0: number, x1: number, f: (x: number) => number, size: number, c: number) {
  let px = x0;
  let py = f(x0);
  for (let x = x0 + 1; x <= x1; x++) {
    const y = f(x);
    drawLine(b, px, py, x, y, size, c);
    px = x;
    py = y;
  }
}

export function sparkle(b: Bitmap, x: number, y: number, c: number) {
  drawLine(b, x - 2, y, x + 2, y, 1, c);
  drawLine(b, x, y - 2, x, y + 2, 1, c);
}

function ground(b: Bitmap, y: number, r: Rng) {
  drawLine(b, 0, y, W - 1, y, 2, INK);
  for (let i = 0; i < 26; i++) {
    const x = r.int(2, W - 3);
    drawLine(b, x, y - 1, x - 2, y - 5, 1, INK);
    drawLine(b, x, y - 1, x + 2, y - 4, 1, INK);
  }
}

// Doodles

function frog(b: Bitmap, r: Rng) {
  ground(b, H - 14, r);
  const cx = r.int(110, 210);
  ringEllipse(b, cx, 82, 40, 22, 3);
  for (const side of [-1, 1]) {
    ringEllipse(b, cx + side * 20, 58, 11, 11, 3);
    fillCircle(b, cx + side * 20 + r.int(-2, 2), 59, 4, INK);
    fillCircle(b, cx + side * 30, 88, 4, RED);
  }
  curve(b, cx - 16, cx + 16, (x) => 80 + Math.round((256 - (x - cx) ** 2) / 45), 2, INK);
  const fx = cx + r.pick([-1, 1]) * r.int(70, 110);
  const fy = r.int(18, 40);
  fillEllipse(b, fx - 3, fy - 3, 3, 2, BLUE);
  fillEllipse(b, fx + 3, fy - 3, 3, 2, BLUE);
  fillCircle(b, fx, fy, 2, INK);
  for (let i = 0; i < 6; i++) setPixel(b, fx + 6 + i * 3, fy + (i % 2 ? 2 : -1), INK);
}

function cat(b: Bitmap, r: Rng) {
  const cx = r.int(100, 220);
  const cy = 70;
  triangleOutline(b, [cx - 38, cy - 8, cx - 30, cy - 44, cx - 8, cy - 26], INK, PAPER, 3);
  triangleOutline(b, [cx + 38, cy - 8, cx + 30, cy - 44, cx + 8, cy - 26], INK, PAPER, 3);
  ringEllipse(b, cx, cy, 42, 32, 3);
  for (const side of [-1, 1]) {
    fillEllipse(b, cx + side * 16, cy - 4, 5, 7, INK);
    setPixel(b, cx + side * 16 - 2, cy - 7, PAPER);
    setPixel(b, cx + side * 16 - 1, cy - 7, PAPER);
    for (let i = 0; i < 3; i++) {
      drawLine(b, cx + side * 22, cy + 8 + i * 4, cx + side * 52, cy + 4 + i * 6, 1, INK);
    }
    fillCircle(b, cx + side * 26, cy + 10, 4, RED);
  }
  fillTriangle(b, cx - 5, cy + 6, cx + 5, cy + 6, cx, cy + 11, RED);
  // "ω" mouth: two little U-shaped arcs
  for (const mid of [cx - 4.5, cx + 4.5]) {
    curve(b, Math.round(mid - 4.5), Math.round(mid + 4.5), (x) => cy + 12 + Math.round((20 - (x - mid) ** 2) / 5), 1, INK);
  }
  for (let i = 0; i < 3; i++) drawLine(b, cx - 6 + i * 6, cy - 30, cx - 6 + i * 6, cy - 22, 2, INK);
  for (let i = 0; i < 14; i++) {
    const x = r.int(4, W - 4);
    const y = r.int(4, H - 4);
    if (Math.abs(x - cx) > 60) sparkle(b, x, y, r.pick([BLUE, RED, INK]));
  }
}

function city(b: Bitmap, r: Rng) {
  for (let i = 0; i < 40; i++) setPixel(b, r.int(0, W - 1), r.int(0, 50), INK);
  const mx = r.int(30, W - 30);
  ringEllipse(b, mx, 22, 13, 13, 2);
  fillCircle(b, mx + 6, 18, 11, PAPER);
  let x = r.int(-10, 0);
  while (x < W) {
    const w = r.int(22, 42);
    const h = r.int(34, 88);
    fillRect(b, x, H - h, w, h, INK);
    for (let wy = H - h + 6; wy < H - 8; wy += 9) {
      for (let wx = x + 5; wx < x + w - 6; wx += 8) {
        const lit = r.next();
        if (lit < 0.55) fillRect(b, wx, wy, 4, 5, lit < 0.12 ? RED : lit < 0.3 ? BLUE : PAPER);
      }
    }
    if (r.chance(0.3)) {
      drawLine(b, x + w / 2, H - h, x + w / 2, H - h - 10, 1, INK);
      setPixel(b, x + w / 2, H - h - 11, RED);
    }
    x += w + r.int(1, 6);
  }
}

function sea(b: Bitmap, r: Rng) {
  const sx = r.int(220, 290);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    drawLine(b, sx + Math.cos(a) * 20, 28 + Math.sin(a) * 20, sx + Math.cos(a) * 26, 28 + Math.sin(a) * 26, 2, RED);
  }
  fillCircle(b, sx, 28, 15, RED);
  const phase = r.next() * 6;
  const bx = r.int(60, 160);
  // boat
  fillTriangle(b, bx - 26, 66, bx + 26, 66, bx + 16, 78, INK);
  fillTriangle(b, bx - 26, 66, bx - 16, 78, bx + 16, 78, INK);
  drawLine(b, bx, 66, bx, 30, 2, INK);
  triangleOutline(b, [bx + 2, 32, bx + 2, 62, bx + 24, 62], INK, RED, 2);
  for (const [i, y] of [70, 84, 98, 112].entries()) {
    curve(b, 0, W - 1, (x) => y + Math.round(Math.sin(x / 11 + phase + i) * 3), 2, i % 2 ? INK : BLUE);
  }
  for (let i = 0; i < 4; i++) {
    const gx = r.int(20, 200);
    const gy = r.int(10, 40);
    drawLine(b, gx - 5, gy - 3, gx, gy, 1, INK);
    drawLine(b, gx, gy, gx + 5, gy - 3, 1, INK);
  }
}

function space(b: Bitmap, r: Rng) {
  for (let i = 0; i < 90; i++) setPixel(b, r.int(0, W - 1), r.int(0, H - 1), INK);
  for (let i = 0; i < 8; i++) sparkle(b, r.int(5, W - 5), r.int(5, H - 5), r.pick([INK, BLUE]));
  const px = r.int(80, 240);
  const py = r.int(48, 72);
  ringEllipse(b, px, py, 26, 26, 2, INK, PAPER);
  for (let y = py - 22; y <= py + 22; y += 7) {
    for (let x = px - 26; x <= px + 26; x++) {
      const dx = x - px;
      const dy = y - py;
      if (dx * dx + dy * dy < 23 * 23) {
        setPixel(b, x, y, BLUE);
        setPixel(b, x, y + 1, BLUE);
      }
    }
  }
  curve(b, px - 48, px + 48, (x) => py + 4 + Math.round(Math.sqrt(Math.max(0, 1 - ((x - px) / 48) ** 2)) * 9), 2, INK);
  // comet
  const cx = r.int(20, 60);
  const cy = r.int(15, 35);
  drawLine(b, cx, cy, cx + 40, cy + 14, 1, RED);
  drawLine(b, cx, cy + 3, cx + 34, cy + 15, 1, RED);
  fillCircle(b, cx + 42, cy + 16, 3, INK);
}

function garden(b: Bitmap, r: Rng) {
  ground(b, H - 10, r);
  const sun = r.int(20, 60);
  ringEllipse(b, sun, 22, 12, 12, 2);
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    drawLine(b, sun + Math.cos(a) * 16, 22 + Math.sin(a) * 16, sun + Math.cos(a) * 21, 22 + Math.sin(a) * 21, 2, INK);
  }
  const count = r.int(4, 6);
  for (let i = 0; i < count; i++) {
    const x = 90 + Math.round((i + 0.5) * (200 / count)) + r.int(-6, 6);
    const top = r.int(36, 64);
    const sway = r.int(-6, 6);
    drawLine(b, x, H - 11, x + sway, top, 2, INK);
    const petal = r.pick([RED, BLUE]);
    for (let p = 0; p < 6; p++) {
      const a = (p / 6) * Math.PI * 2;
      fillCircle(b, x + sway + Math.round(Math.cos(a) * 8), top + Math.round(Math.sin(a) * 8), 5, petal);
    }
    fillCircle(b, x + sway, top, 4, INK);
  }
}

function ghost(b: Bitmap, r: Rng) {
  const mx = r.int(240, 295);
  ringEllipse(b, mx, 24, 14, 14, 2);
  fillCircle(b, mx - 6, 20, 12, PAPER);
  // ghost: ink silhouette, then paper body inset by 3px
  const gx = r.int(90, 150);
  const shape = (inset: number, c: number) => {
    fillCircle(b, gx, 46, 28 - inset, c);
    fillRect(b, gx - 28 + inset, 46, 56 - inset * 2, 40 - inset, c);
    for (let i = 0; i < 4; i++) {
      const x = gx - 28 + inset + i * ((56 - inset * 2) / 4);
      fillTriangle(b, x, 85 - inset, x + (56 - inset * 2) / 4, 85 - inset, x + (56 - inset * 2) / 8, 96 - inset * 1.5, c);
    }
  };
  shape(0, INK);
  shape(3, PAPER);
  fillEllipse(b, gx - 10, 44, 4, 6, INK);
  fillEllipse(b, gx + 10, 44, 4, 6, INK);
  ringEllipse(b, gx, 62, 5, 7, 2);
  // pumpkins
  for (const px of [gx + 80, gx + 140].filter((v) => v < W - 20)) {
    const pr = r.int(14, 20);
    ringEllipse(b, px, H - pr - 4, pr + 6, pr, 2, INK, RED);
    drawLine(b, px, H - pr * 2 - 4, px + 3, H - pr * 2 - 12, 3, INK);
    fillTriangle(b, px - 10, H - pr - 10, px - 4, H - pr - 10, px - 7, H - pr - 4, INK);
    fillTriangle(b, px + 4, H - pr - 10, px + 10, H - pr - 10, px + 7, H - pr - 4, INK);
    drawLine(b, px - 8, H - pr + 2, px + 8, H - pr + 2, 2, INK);
  }
  for (let i = 0; i < 3; i++) {
    const bx = r.int(20, W - 20);
    const by = r.int(8, 30);
    drawLine(b, bx - 7, by - 3, bx - 3, by + 1, 2, INK);
    drawLine(b, bx - 3, by + 1, bx, by - 1, 2, INK);
    drawLine(b, bx, by - 1, bx + 3, by + 1, 2, INK);
    drawLine(b, bx + 3, by + 1, bx + 7, by - 3, 2, INK);
  }
}

function mountains(b: Bitmap, r: Rng) {
  const sx = r.int(30, W - 30);
  ringEllipse(b, sx, 20, 10, 10, 2, INK, RED);
  let x = -30;
  while (x < W) {
    const w = r.int(70, 120);
    const h = r.int(50, 85);
    const peak = x + w / 2;
    triangleOutline(b, [x, H - 18, peak, H - 18 - h, x + w, H - 18], INK, PAPER, 2);
    fillTriangle(b, peak - h * 0.18, H - 18 - h * 0.7, peak, H - 18 - h + 2, peak + h * 0.18, H - 18 - h * 0.7, BLUE);
    x += w * 0.6;
  }
  fillRect(b, 0, H - 17, W, 17, PAPER);
  drawLine(b, 0, H - 17, W - 1, H - 17, 2, INK);
  for (let i = 0; i < 14; i++) {
    const lx = r.int(0, W - 20);
    const ly = r.int(H - 13, H - 3);
    drawLine(b, lx, ly, lx + r.int(6, 16), ly, 1, BLUE);
  }
  for (let i = 0; i < 5; i++) {
    const tx = r.int(10, W - 10);
    fillTriangle(b, tx - 6, H - 17, tx + 6, H - 17, tx, H - 34, INK);
  }
}

function rain(b: Bitmap, r: Rng) {
  for (let i = 0; i < 70; i++) {
    const x = r.int(0, W);
    const y = r.int(30, H);
    drawLine(b, x, y, x - 3, y + 6, 1, BLUE);
  }
  for (let c = 0; c < 2; c++) {
    const cx = r.int(40, W - 60);
    const cy = r.int(14, 22);
    const puffs = [
      [cx, cy, 14],
      [cx + 18, cy - 4, 16],
      [cx + 36, cy, 13],
    ] as const;
    for (const [x, y, rr] of puffs) fillCircle(b, x, y, rr, INK);
    for (const [x, y, rr] of puffs) fillCircle(b, x, y, rr - 2, PAPER);
  }
  const hx = r.int(100, 180);
  rectOutline(b, hx, 66, 56, 44, INK, 2);
  triangleOutline(b, [hx - 8, 68, hx + 28, 40, hx + 64, 68], INK, RED, 2);
  rectOutline(b, hx + 8, 88, 14, 22, INK, 2);
  rectOutline(b, hx + 32, 76, 16, 14, INK, 2);
  drawLine(b, hx + 40, 76, hx + 40, 89, 1, INK);
  drawLine(b, hx + 32, 83, hx + 47, 83, 1, INK);
  stamp(b, hx + 18, 99, 2, INK);
  drawLine(b, 0, H - 9, W - 1, H - 9, 2, INK);
  fillRect(b, 0, H - 8, W, 8, PAPER);
}

const GENERATORS: Record<DoodleKind, (b: Bitmap, r: Rng) => void> = {
  frog,
  cat,
  city,
  sea,
  space,
  garden,
  ghost,
  mountains,
  rain,
};

export function generateDoodle(kind: DoodleKind, seed: number): Bitmap {
  const b = createBitmap(W, H, PAPER);
  GENERATORS[kind](b, rng(seed));
  return b;
}
