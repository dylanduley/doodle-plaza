// Unposted drawings saved in this browser, so leaving the page or pressing Back doesn't lose them.
import { type Bitmap, createBitmap, isBlank } from "./bitmap";
import { decodeBitmap, encodeBitmap } from "./codec";
import { PAPER } from "./constants";

export type DraftKey = "still" | "animation";

type Stored = { v: 1; width: number; height: number; frames: string[]; fps?: number; savedAt: number };

export type Draft = { frames: Bitmap[]; fps?: number };

const storageKey = (key: DraftKey) => `doodle-plaza:draft:${key}`;

export function loadDraft(key: DraftKey, size: { width: number; height: number }): Draft | null {
  try {
    const raw = localStorage.getItem(storageKey(key));
    if (!raw) return null;
    const stored = JSON.parse(raw) as Stored;
    if (stored.v !== 1 || !Array.isArray(stored.frames) || stored.frames.length === 0) return null;
    const frames = stored.frames.map((f) => decodeBitmap(f, size));
    if (frames.every((f) => isBlank(f, PAPER))) return null;
    return { frames, fps: stored.fps };
  } catch {
    // missing, corrupt, or storage blocked: start fresh
    return null;
  }
}

/** Returns false if the browser wouldn't save it (private mode, storage full). */
export function saveDraft(key: DraftKey, frames: Bitmap[], fps?: number): boolean {
  try {
    if (frames.every((f) => isBlank(f, PAPER))) {
      localStorage.removeItem(storageKey(key));
      return true;
    }
    const stored: Stored = {
      v: 1,
      width: frames[0].width,
      height: frames[0].height,
      frames: frames.map(encodeBitmap),
      fps,
      savedAt: Date.now(),
    };
    localStorage.setItem(storageKey(key), JSON.stringify(stored));
    return true;
  } catch {
    return false;
  }
}

export function clearDraft(key: DraftKey): void {
  try {
    localStorage.removeItem(storageKey(key));
  } catch {}
}

/** Copies a drawing onto a new canvas of another size, centered (cropped if it doesn't fit). */
export function placeCentered(src: Bitmap, width: number, height: number): Bitmap {
  const out = createBitmap(width, height, PAPER);
  const ox = Math.floor((width - src.width) / 2);
  const oy = Math.floor((height - src.height) / 2);
  for (let y = 0; y < src.height; y++) {
    const ty = y + oy;
    if (ty < 0 || ty >= height) continue;
    for (let x = 0; x < src.width; x++) {
      const tx = x + ox;
      if (tx < 0 || tx >= width) continue;
      out.data[ty * width + tx] = src.data[y * src.width + x];
    }
  }
  return out;
}
