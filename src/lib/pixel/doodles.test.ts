import { describe, expect, it } from "vitest";
import { isBlank } from "./bitmap";
import { CANVAS_HEIGHT, CANVAS_WIDTH, PALETTE } from "./constants";
import { DOODLE_KINDS, generateDoodle } from "./doodles";

describe("sample doodles", () => {
  it.each(DOODLE_KINDS)("%s is deterministic, canvas-sized, and palette-only", (kind) => {
    const a = generateDoodle(kind, 42);
    const b = generateDoodle(kind, 42);
    expect(a.width).toBe(CANVAS_WIDTH);
    expect(a.height).toBe(CANVAS_HEIGHT);
    expect(Array.from(a.data)).toEqual(Array.from(b.data));
    expect(isBlank(a)).toBe(false);
    expect(a.data.every((v) => v < PALETTE.length)).toBe(true);
  });

  it("different seeds give different drawings", () => {
    const a = generateDoodle("city", 1);
    const b = generateDoodle("city", 2);
    expect(Array.from(a.data)).not.toEqual(Array.from(b.data));
  });
});
