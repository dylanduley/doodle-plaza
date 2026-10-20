import { describe, expect, it } from "vitest";
import {
  brushOffsets,
  createBitmap,
  drawLine,
  floodFill,
  getPixel,
  isBlank,
  setPixel,
} from "./bitmap";
import { History } from "./history";
import { hexToRgb, writeRgba } from "./render";

describe("bitmap", () => {
  it("starts blank and ignores out-of-bounds writes", () => {
    const bmp = createBitmap(4, 4);
    expect(isBlank(bmp)).toBe(true);
    setPixel(bmp, -1, 0, 1);
    setPixel(bmp, 4, 4, 1);
    expect(isBlank(bmp)).toBe(true);
    expect(getPixel(bmp, 99, 99)).toBe(-1);
  });

  it("draws a gap-free diagonal line", () => {
    const bmp = createBitmap(8, 8);
    drawLine(bmp, 0, 0, 7, 7, 1, 1);
    for (let i = 0; i < 8; i++) expect(getPixel(bmp, i, i)).toBe(1);
    expect(getPixel(bmp, 1, 0)).toBe(0);
  });

  it("draws a steep line with one pixel per row", () => {
    const bmp = createBitmap(8, 8);
    drawLine(bmp, 2, 0, 3, 7, 1, 1);
    for (let y = 0; y < 8; y++) {
      const row = [0, 1, 2, 3, 4, 5, 6, 7].filter((x) => getPixel(bmp, x, y) === 1);
      expect(row.length).toBe(1);
    }
  });

  it("makes round brushes by trimming corners", () => {
    expect(brushOffsets(1)).toHaveLength(1);
    expect(brushOffsets(2)).toHaveLength(4);
    expect(brushOffsets(4)).toHaveLength(12); // 4x4 minus 4 corners
  });

  it("fills an enclosed region without leaking past the outline", () => {
    const bmp = createBitmap(5, 5);
    // 3x3 box outline in the middle
    for (let i = 1; i <= 3; i++) {
      setPixel(bmp, i, 1, 1);
      setPixel(bmp, i, 3, 1);
      setPixel(bmp, 1, i, 1);
      setPixel(bmp, 3, i, 1);
    }
    expect(floodFill(bmp, 2, 2, 2)).toBe(true);
    expect(getPixel(bmp, 2, 2)).toBe(2);
    expect(getPixel(bmp, 0, 0)).toBe(0);
  });

  it("reports a no-op fill so no undo step is wasted", () => {
    const bmp = createBitmap(3, 3);
    expect(floodFill(bmp, 1, 1, 0)).toBe(false);
  });
});

describe("history", () => {
  it("undoes and redoes snapshots, and caps its size", () => {
    const h = new History(2);
    const a = new Uint8Array([0]);
    const b = new Uint8Array([1]);
    const c = new Uint8Array([2]);
    h.record(a);
    h.record(b);
    h.record(c); // drops `a`
    const current = new Uint8Array([3]);
    expect(h.undo(current)).toEqual(c);
    expect(h.undo(c)).toEqual(b);
    expect(h.undo(b)).toBeNull();
    expect(h.redo(b)).toEqual(c);
  });

  it("clears redo after a new change", () => {
    const h = new History(10);
    h.record(new Uint8Array([0]));
    h.undo(new Uint8Array([1]));
    expect(h.canRedo).toBe(true);
    h.record(new Uint8Array([0]));
    expect(h.canRedo).toBe(false);
  });
});

describe("render", () => {
  it("maps palette indices to RGBA", () => {
    const bmp = createBitmap(2, 1);
    setPixel(bmp, 1, 0, 1);
    const out = new Uint8ClampedArray(8);
    writeRgba(bmp, [hexToRgb("#ffffff"), hexToRgb("#102030")], out);
    expect(Array.from(out)).toEqual([255, 255, 255, 255, 16, 32, 48, 255]);
  });
});
