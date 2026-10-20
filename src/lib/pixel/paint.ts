// Draws an indexed bitmap onto a canvas (browser only).
import type { Bitmap } from "./bitmap";
import { PALETTE } from "./constants";
import { paletteToRgb, type RGB, writeRgba } from "./render";

const DEFAULT_PALETTE = paletteToRgb(PALETTE);

export function paintBitmap(
  canvas: HTMLCanvasElement | null | undefined,
  bmp: Bitmap,
  onion?: { bitmap: Bitmap; palette: readonly RGB[]; paper?: number },
): void {
  const ctx = canvas?.getContext("2d");
  if (!ctx) return;
  const image = ctx.createImageData(bmp.width, bmp.height);
  writeRgba(bmp, DEFAULT_PALETTE, image.data, onion);
  ctx.putImageData(image, 0, 0);
}
