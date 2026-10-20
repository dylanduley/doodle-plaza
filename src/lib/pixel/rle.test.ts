import { describe, expect, it } from "vitest";
import { generateAnimation } from "./animations";
import { History } from "./history";
import { packRuns, unpackRuns } from "./rle";

describe("run-length encoding", () => {
  it("round-trips, including runs longer than 255", () => {
    const data = new Uint8Array(1000);
    data.fill(3, 10, 700);
    data[999] = 1;
    expect(Array.from(unpackRuns(packRuns(data), data.length))).toEqual(Array.from(data));
  });

  it("rejects data that doesn't add up to the expected length", () => {
    const runs = packRuns(new Uint8Array(10));
    expect(() => unpackRuns(runs, 11)).toThrow();
    expect(() => unpackRuns(Uint8Array.from([1, 0]), 0)).toThrow();
  });
});

describe("compressed undo history", () => {
  it("restores exact pixels and stores far less than raw snapshots", () => {
    const frames = generateAnimation("bounce", 1);
    const h = new History(50);
    let stored = 0;
    for (const f of frames) {
      h.record(f.data);
      stored += packRuns(f.data).length;
    }
    const raw = frames.length * frames[0].data.length;
    expect(stored).toBeLessThan(raw / 10);
    const restored = h.undo(new Uint8Array(frames[0].data.length));
    expect(Array.from(restored!)).toEqual(Array.from(frames.at(-1)!.data));
  });
});
