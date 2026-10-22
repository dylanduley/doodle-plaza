// Drawing <-> string. v1: [version, w hi, w lo, h hi, h lo, ...RLE pairs], base64.
import type { Bitmap } from "./bitmap";
import { PALETTE } from "./constants";
import { packRuns, unpackRuns } from "./rle";

const VERSION = 1;
const HEADER = 5;
// Drawings come from other people, so cap the size before allocating memory.
const MAX_SIDE = 1024;

export function encodeBitmap(bmp: Bitmap): string {
  const runs = packRuns(bmp.data);
  const out = new Uint8Array(HEADER + runs.length);
  out.set([VERSION, bmp.width >> 8, bmp.width & 0xff, bmp.height >> 8, bmp.height & 0xff]);
  out.set(runs, HEADER);
  return toBase64(out);
}

/** Pass `expected` to reject a drawing whose size doesn't match where it's shown. */
export function decodeBitmap(encoded: string, expected?: { width: number; height: number }): Bitmap {
  const bytes = fromBase64(encoded);
  if (bytes.length < HEADER || bytes[0] !== VERSION) throw new Error("Unsupported drawing format");
  const width = (bytes[1] << 8) | bytes[2];
  const height = (bytes[3] << 8) | bytes[4];
  if (!width || !height || width > MAX_SIDE || height > MAX_SIDE) throw new Error("Bad drawing size");
  if (expected && (width !== expected.width || height !== expected.height)) throw new Error("Bad drawing size");

  let data: Uint8Array;
  try {
    data = unpackRuns(bytes, width * height, HEADER);
  } catch {
    throw new Error("Corrupt drawing data");
  }
  for (const value of data) {
    if (value >= PALETTE.length) throw new Error("Corrupt drawing data");
  }
  return { width, height, data };
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(s);
}

function fromBase64(str: string): Uint8Array {
  const s = atob(str);
  const out = new Uint8Array(s.length);
  for (let i = 0; i < s.length; i++) out[i] = s.charCodeAt(i);
  return out;
}
