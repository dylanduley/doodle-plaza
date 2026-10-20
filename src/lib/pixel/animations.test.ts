import { describe, expect, it } from "vitest";
import { ANIMATION_KINDS, generateAnimation } from "./animations";
import { ANIMATION_HEIGHT, ANIMATION_WIDTH, PALETTE } from "./constants";
import { fadePalette, writeRgba } from "./render";
import { createBitmap, setPixel } from "./bitmap";

describe("sample animations", () => {
  it.each(ANIMATION_KINDS)("%s has several distinct, palette-only frames at 320×180", (kind) => {
    const frames = generateAnimation(kind, 1);
    expect(frames.length).toBeGreaterThan(4);
    for (const f of frames) {
      expect([f.width, f.height]).toEqual([ANIMATION_WIDTH, ANIMATION_HEIGHT]);
      expect(f.data.every((v) => v < PALETTE.length)).toBe(true);
    }
    // Consecutive frames should actually differ, or it isn't animating
    expect(Array.from(frames[0].data)).not.toEqual(Array.from(frames[1].data));
  });

  it("is deterministic for a seed", () => {
    const a = generateAnimation("boat", 9);
    const b = generateAnimation("boat", 9);
    expect(a.map((f) => Array.from(f.data))).toEqual(b.map((f) => Array.from(f.data)));
  });
});

describe("onion skin rendering", () => {
  it("shows the previous frame faded only where the current frame is blank", () => {
    const current = createBitmap(2, 1);
    const previous = createBitmap(2, 1);
    setPixel(current, 0, 0, 1); // ink on the current frame
    setPixel(previous, 0, 0, 1);
    setPixel(previous, 1, 0, 1); // ink only on the previous frame
    const palette = [[255, 255, 255], [0, 0, 0]] as const;
    const faded = fadePalette(palette, 0.5);
    const out = new Uint8ClampedArray(8);
    writeRgba(current, palette, out, { bitmap: previous, palette: faded });
    expect(Array.from(out.slice(0, 3))).toEqual([0, 0, 0]); // current ink wins
    expect(Array.from(out.slice(4, 7))).toEqual([128, 128, 128]); // ghost shows through
  });
});
