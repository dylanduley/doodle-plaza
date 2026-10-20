// RLE as (value, count <= 255) pairs. Used by codec.ts and history.ts.

export function packRuns(data: Uint8Array): Uint8Array {
  const out: number[] = [];
  let i = 0;
  while (i < data.length) {
    const value = data[i];
    let run = 1;
    while (i + run < data.length && data[i + run] === value && run < 255) run++;
    out.push(value, run);
    i += run;
  }
  return Uint8Array.from(out);
}

// Throws on bad input instead of returning garbage.
export function unpackRuns(runs: Uint8Array, length: number, offset = 0): Uint8Array {
  const out = new Uint8Array(length);
  let o = 0;
  for (let i = offset; i + 1 < runs.length; i += 2) {
    const run = runs[i + 1];
    if (run === 0 || o + run > length) throw new Error("Corrupt run-length data");
    out.fill(runs[i], o, o + run);
    o += run;
  }
  if (o !== length) throw new Error("Corrupt run-length data");
  return out;
}
