import { describe, expect, it } from "vitest";
import { createBitmap, drawLine } from "./bitmap";
import { decodeBitmap, encodeBitmap } from "./codec";
import { generateDoodle } from "./doodles";

describe("drawing codec", () => {
  it("round-trips a drawing exactly", () => {
    const bmp = generateDoodle("city", 7);
    const back = decodeBitmap(encodeBitmap(bmp));
    expect(back.width).toBe(bmp.width);
    expect(back.height).toBe(bmp.height);
    expect(Array.from(back.data)).toEqual(Array.from(bmp.data));
  });

  it("keeps non-default sizes (profile pictures)", () => {
    const bmp = createBitmap(120, 120);
    drawLine(bmp, 0, 0, 119, 119, 2, 3);
    const back = decodeBitmap(encodeBitmap(bmp));
    expect([back.width, back.height]).toEqual([120, 120]);
    expect(Array.from(back.data)).toEqual(Array.from(bmp.data));
  });

  it("is much smaller than the raw bitmap for typical doodles", () => {
    const bmp = generateDoodle("frog", 1);
    expect(encodeBitmap(bmp).length).toBeLessThan(bmp.data.length / 10);
  });

  it("rejects corrupt or unknown data instead of returning garbage", () => {
    expect(() => decodeBitmap(btoa("\x02\x00\x01\x00\x01\x00\x01"))).toThrow();
    const valid = encodeBitmap(createBitmap(4, 4));
    expect(() => decodeBitmap(valid.slice(0, -4))).toThrow();
  });
});
