import { describe, expect, it } from "vitest";
import { createBitmap, setPixel } from "./bitmap";
import { placeCentered } from "./drafts";

describe("placeCentered", () => {
  it("centers a short drawing on a taller canvas", () => {
    const src = createBitmap(4, 2);
    setPixel(src, 0, 0, 1);
    setPixel(src, 3, 1, 2);
    const out = placeCentered(src, 4, 6);
    expect(out.width).toBe(4);
    expect(out.height).toBe(6);
    // 2 rows of padding above
    expect(out.data[2 * 4 + 0]).toBe(1);
    expect(out.data[3 * 4 + 3]).toBe(2);
    expect(out.data[0]).toBe(0);
  });

  it("crops a drawing that doesn't fit", () => {
    const src = createBitmap(2, 6, 1);
    const out = placeCentered(src, 2, 2);
    expect(Array.from(out.data)).toEqual([1, 1, 1, 1]);
  });
});
