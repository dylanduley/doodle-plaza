// Indexed bitmap: one byte per pixel = palette index. No anti-aliasing.

export type Bitmap = {
  readonly width: number;
  readonly height: number;
  readonly data: Uint8Array;
};

export function createBitmap(width: number, height: number, fill = 0): Bitmap {
  const data = new Uint8Array(width * height);
  if (fill !== 0) data.fill(fill);
  return { width, height, data };
}

export function cloneBitmap(bmp: Bitmap): Bitmap {
  return { width: bmp.width, height: bmp.height, data: bmp.data.slice() };
}

export function inBounds(bmp: Bitmap, x: number, y: number): boolean {
  return x >= 0 && y >= 0 && x < bmp.width && y < bmp.height;
}

export function getPixel(bmp: Bitmap, x: number, y: number): number {
  if (!inBounds(bmp, x, y)) return -1;
  return bmp.data[y * bmp.width + x];
}

export function setPixel(bmp: Bitmap, x: number, y: number, color: number): void {
  if (!inBounds(bmp, x, y)) return;
  bmp.data[y * bmp.width + x] = color;
}

export function isBlank(bmp: Bitmap, paper = 0): boolean {
  for (let i = 0; i < bmp.data.length; i++) {
    if (bmp.data[i] !== paper) return false;
  }
  return true;
}

// Brushes

const brushCache = new Map<number, ReadonlyArray<readonly [number, number]>>();

// Round brush. Sizes 1-2 are squares, 4+ trim the corners.
export function brushOffsets(size: number): ReadonlyArray<readonly [number, number]> {
  const cached = brushCache.get(size);
  if (cached) return cached;

  const r = size / 2;
  const half = Math.floor(size / 2);
  const offsets: Array<readonly [number, number]> = [];
  for (let dy = 0; dy < size; dy++) {
    for (let dx = 0; dx < size; dx++) {
      const cx = dx + 0.5 - r;
      const cy = dy + 0.5 - r;
      if (cx * cx + cy * cy <= r * r) offsets.push([dx - half, dy - half]);
    }
  }
  brushCache.set(size, offsets);
  return offsets;
}

export function stamp(bmp: Bitmap, x: number, y: number, size: number, color: number): void {
  for (const [dx, dy] of brushOffsets(size)) setPixel(bmp, x + dx, y + dy, color);
}

// Bresenham line, stamping the brush each step so fast strokes have no gaps.
export function drawLine(
  bmp: Bitmap,
  x0: number,
  y0: number,
  x1: number,
  y1: number,
  size: number,
  color: number,
): void {
  let x = Math.round(x0);
  let y = Math.round(y0);
  const tx = Math.round(x1);
  const ty = Math.round(y1);

  const dx = Math.abs(tx - x);
  const dy = -Math.abs(ty - y);
  const sx = x < tx ? 1 : -1;
  const sy = y < ty ? 1 : -1;
  let err = dx + dy;

  for (;;) {
    stamp(bmp, x, y, size, color);
    if (x === tx && y === ty) break;
    const e2 = 2 * err;
    if (e2 >= dy) {
      err += dy;
      x += sx;
    }
    if (e2 <= dx) {
      err += dx;
      y += sy;
    }
  }
}

// Fill

// 4-way flood fill. Returns false if nothing changed (so no undo step).
export function floodFill(bmp: Bitmap, x: number, y: number, color: number): boolean {
  if (!inBounds(bmp, x, y)) return false;
  const { width, height, data } = bmp;
  const target = data[y * width + x];
  if (target === color) return false;

  const stack: number[] = [y * width + x];
  while (stack.length > 0) {
    const i = stack.pop()!;
    if (data[i] !== target) continue;
    data[i] = color;
    const px = i % width;
    const py = (i - px) / width;
    if (px > 0) stack.push(i - 1);
    if (px < width - 1) stack.push(i + 1);
    if (py > 0) stack.push(i - width);
    if (py < height - 1) stack.push(i + width);
  }
  return true;
}
