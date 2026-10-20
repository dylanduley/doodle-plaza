// Drawing <-> string. v1: [version, w hi, w lo, h hi, h lo, ...RLE pairs], base64.
import type { Bitmap } from "./bitmap";
import { packRuns, unpackRuns } from "./rle";

const VERSION = 1;
const HEADER = 5;

export function encodeBitmap(bmp: Bitmap): string {
  const runs = packRuns(bmp.data);
  const out = new Uint8Array(HEADER + runs.length);
  out.set([VERSION, bmp.width >> 8, bmp.width & 0xff, bmp.height >> 8, bmp.height & 0xff]);
  out.set(runs, HEADER);
  return toBase64(out);
}

export function decodeBitmap(encoded: string): Bitmap {
  const bytes = fromBase64(encoded);
  if (bytes.length < HEADER || bytes[0] !== VERSION) throw new Error("Unsupported drawing format");
  const width = (bytes[1] << 8) | bytes[2];
  const height = (bytes[3] << 8) | bytes[4];
  try {
    return { width, height, data: unpackRuns(bytes, width * height, HEADER) };
  } catch {
    throw new Error("Corrupt drawing data");
  }
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
