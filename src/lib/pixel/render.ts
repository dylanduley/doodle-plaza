import type { Bitmap } from "./bitmap";
import type { PaletteColor } from "./constants";

export type RGB = readonly [number, number, number];

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace("#", ""), 16);
  return [(n >> 16) & 0xff, (n >> 8) & 0xff, n & 0xff];
}

export function paletteToRgb(palette: readonly PaletteColor[]): RGB[] {
  return palette.map((c) => hexToRgb(c.hex));
}

// Fade toward white for onion skin.
export function fadePalette(palette: readonly RGB[], amount = 0.72): RGB[] {
  return palette.map(([r, g, b]) => [
    Math.round(r + (255 - r) * amount),
    Math.round(g + (255 - g) * amount),
    Math.round(b + (255 - b) * amount),
  ]);
}

// Bitmap -> RGBA. With onion, paper pixels show the onion frame faded.
export function writeRgba(
  bmp: Bitmap,
  palette: readonly RGB[],
  out: Uint8ClampedArray,
  onion?: { bitmap: Bitmap; palette: readonly RGB[]; paper?: number },
): void {
  const { data } = bmp;
  const paper = onion?.paper ?? 0;
  for (let i = 0, j = 0; i < data.length; i++, j += 4) {
    const v = data[i];
    const ghost = onion && v === paper ? onion.bitmap.data[i] : paper;
    const [r, g, b] =
      ghost !== paper ? onion!.palette[ghost] : (palette[v] ?? palette[0]);
    out[j] = r;
    out[j + 1] = g;
    out[j + 2] = b;
    out[j + 3] = 255;
  }
}
