import { packRuns, unpackRuns } from "./rle";

type Snapshot = { runs: Uint8Array; length: number };

// Undo/redo with full snapshots, RLE-compressed. Raw copies got huge with
// animations (100 frames x 50 steps could hit ~290 MB).
export class History {
  private past: Snapshot[] = [];
  private future: Snapshot[] = [];
  private readonly limit: number;

  constructor(limit: number) {
    this.limit = limit;
  }

  private static pack(data: Uint8Array): Snapshot {
    return { runs: packRuns(data), length: data.length };
  }

  private static unpack(s: Snapshot): Uint8Array {
    return unpackRuns(s.runs, s.length);
  }

  // Call this BEFORE the change.
  record(snapshot: Uint8Array): void {
    this.past.push(History.pack(snapshot));
    if (this.past.length > this.limit) this.past.shift();
    this.future = [];
  }

  discardLast(): void {
    this.past.pop();
  }

  undo(current: Uint8Array): Uint8Array | null {
    const prev = this.past.pop();
    if (!prev) return null;
    this.future.push(History.pack(current));
    return History.unpack(prev);
  }

  redo(current: Uint8Array): Uint8Array | null {
    const next = this.future.pop();
    if (!next) return null;
    this.past.push(History.pack(current));
    return History.unpack(next);
  }

  get canUndo(): boolean {
    return this.past.length > 0;
  }

  get canRedo(): boolean {
    return this.future.length > 0;
  }

  clear(): void {
    this.past = [];
    this.future = [];
  }
}
