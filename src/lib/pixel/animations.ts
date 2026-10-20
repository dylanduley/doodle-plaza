// Sample animations for the feed.
import { type Bitmap, createBitmap, drawLine, setPixel } from "./bitmap";
import { ANIMATION_HEIGHT, ANIMATION_WIDTH, PAPER } from "./constants";
import {
  curve,
  fillCircle,
  fillEllipse,
  fillTriangle,
  ringEllipse,
  rng,
  sparkle,
  triangleOutline,
} from "./doodles";

export const ANIMATION_KINDS = ["bounce", "boat"] as const;
export type AnimationKind = (typeof ANIMATION_KINDS)[number];

const INK = 1;
const RED = 2;
const BLUE = 3;
const W = ANIMATION_WIDTH;
const H = ANIMATION_HEIGHT;

// Bouncing ball
function bounce(seed: number): Bitmap[] {
  const frameCount = 12;
  const groundY = H - 24;
  const cx = 160;
  const r = 16;
  const grass = rng(seed);
  const tufts = Array.from({ length: 24 }, () => grass.int(4, W - 5));
  const stars = Array.from({ length: 10 }, () => [grass.int(6, W - 6), grass.int(6, 70)] as const);

  return Array.from({ length: frameCount }, (_, t) => {
    const b = createBitmap(W, H, PAPER);
    for (const [x, y] of stars) sparkle(b, x, y, BLUE);
    drawLine(b, 0, groundY, W - 1, groundY, 2, INK);
    for (const x of tufts) {
      drawLine(b, x, groundY - 1, x - 2, groundY - 5, 1, INK);
      drawLine(b, x, groundY - 1, x + 2, groundY - 4, 1, INK);
    }
    const lift = Math.sin((Math.PI * t) / frameCount); // 0 on the ground, 1 at the top
    const height = Math.round(lift * 100);
    const landed = t === 0;
    const rx = landed ? r + 6 : r;
    const ry = landed ? r - 5 : r;
    const cy = groundY - ry - 1 - height;
    // Shadow shrinks as the ball rises
    const shadow = Math.round(18 - lift * 10);
    for (let x = -shadow; x <= shadow; x += 2) setPixel(b, cx + x, groundY + 4, INK);
    // Speed lines on the way up/down
    if (!landed && lift < 0.9) {
      for (const dx of [-8, 0, 8]) drawLine(b, cx + dx, cy + ry + 6, cx + dx, cy + ry + 14, 1, INK);
    }
    ringEllipse(b, cx, cy, rx, ry, 3, INK, RED);
    fillEllipse(b, cx - 6, cy - 6, 3, 2, PAPER);
    return b;
  });
}

// Boat on waves
function boat(seed: number): Bitmap[] {
  const frameCount = 8;
  const r = rng(seed);
  const birds = Array.from({ length: 3 }, () => [r.int(20, 200), r.int(14, 50)] as const);
  const sunX = r.int(230, 290);

  return Array.from({ length: frameCount }, (_, t) => {
    const b = createBitmap(W, H, PAPER);
    const phase = (t / frameCount) * Math.PI * 2;
    for (let i = 0; i < 10; i++) {
      const a = (i / 10) * Math.PI * 2 + phase / 4;
      drawLine(b, sunX + Math.cos(a) * 22, 36 + Math.sin(a) * 22, sunX + Math.cos(a) * 28, 36 + Math.sin(a) * 28, 2, RED);
    }
    fillCircle(b, sunX, 36, 16, RED);
    for (const [i, [x, y]] of birds.entries()) {
      const flap = (t + i) % 2 === 0 ? 3 : 0;
      drawLine(b, x - 6, y - 3 + flap, x, y, 1, INK);
      drawLine(b, x, y, x + 6, y - 3 + flap, 1, INK);
    }
    // Boat bobs and tilts with the swell
    const bob = Math.round(Math.sin(phase) * 4);
    const tilt = Math.round(Math.sin(phase) * 3);
    const bx = 130;
    const deck = 112 + bob;
    fillTriangle(b, bx - 30, deck - tilt, bx + 30, deck + tilt, bx + 18, deck + 13, INK);
    fillTriangle(b, bx - 30, deck - tilt, bx - 18, deck + 13, bx + 18, deck + 13, INK);
    drawLine(b, bx, deck, bx + tilt, deck - 44, 2, INK);
    triangleOutline(b, [bx + 2 + tilt, deck - 42, bx + 2, deck - 4, bx + 28, deck - 4 + tilt], INK, RED, 2);
    for (const [i, y] of [118, 134, 150, 166].entries()) {
      curve(b, 0, W - 1, (x) => y + Math.round(Math.sin(x / 13 + phase + i * 1.3) * 3.5), 2, i % 2 ? INK : BLUE);
    }
    return b;
  });
}

const GENERATORS: Record<AnimationKind, (seed: number) => Bitmap[]> = { bounce, boat };

export function generateAnimation(kind: AnimationKind, seed: number): Bitmap[] {
  return GENERATORS[kind](seed);
}
