// Stand-in for the real API. Async with typed errors so the UI already
// handles loading and failures. Swap for Supabase later.
import type { Bitmap } from "@/lib/pixel/bitmap";
import { encodeBitmap } from "@/lib/pixel/codec";
import type { Post } from "@/lib/mock/data";

export const GUEST_HANDLE = "you";
export const CAPTION_MAX = 80;

const STORAGE_KEY = "doodle-plaza:posts:v1";
const FAKE_LATENCY_MS = 700;

export type StoredPost = {
  id: string;
  plaza: string;
  caption?: string;
  createdAt: string;
  /** For animations, this is the first frame. */
  drawing: string;
  width: number;
  height: number;
  frames?: string[];
  fps?: number;
};

export type PostErrorKind = "network" | "storage";

export class PostError extends Error {
  readonly kind: PostErrorKind;
  constructor(kind: PostErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "PostError";
  }
}

// Cached snapshot for useSyncExternalStore

export const NO_POSTS: StoredPost[] = [];
let cachedRaw: string | null | undefined;
let cached: StoredPost[] = NO_POSTS;

function readRaw(): string | null {
  try {
    return localStorage.getItem(STORAGE_KEY);
  } catch {
    // Storage can be unavailable (private mode, blocked cookies).
    return null;
  }
}

function isStoredPost(v: unknown): v is StoredPost {
  const p = v as StoredPost;
  return (
    !!p &&
    typeof p.id === "string" &&
    typeof p.plaza === "string" &&
    typeof p.createdAt === "string" &&
    typeof p.drawing === "string" &&
    typeof p.width === "number" &&
    typeof p.height === "number"
  );
}

// Same array until storage changes (useSyncExternalStore needs this).
export function getLocalPosts(): StoredPost[] {
  const raw = readRaw();
  if (raw !== cachedRaw) {
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cached = Array.isArray(parsed) ? parsed.filter(isStoredPost) : NO_POSTS;
    } catch {
      cached = NO_POSTS;
    }
  }
  return cached;
}

const listeners = new Set<() => void>();

export function subscribeLocalPosts(listener: () => void): () => void {
  listeners.add(listener);
  // Keep other tabs in sync too.
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function write(posts: StoredPost[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(posts));
  listeners.forEach((l) => l());
}

export async function createLocalPost(
  input: { frames: Bitmap[]; fps?: number; caption: string; plaza: string },
  options: { simulateNetworkError?: boolean } = {},
): Promise<StoredPost> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_LATENCY_MS));

  if (options.simulateNetworkError) {
    throw new PostError("network", "We couldn't reach the plaza. Check your connection and try again.");
  }

  const caption = input.caption.trim().slice(0, CAPTION_MAX);
  const [first] = input.frames;
  const isAnimation = input.frames.length > 1;
  const post: StoredPost = {
    id: `local-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
    plaza: input.plaza,
    caption: caption || undefined,
    createdAt: new Date().toISOString(),
    drawing: encodeBitmap(first),
    width: first.width,
    height: first.height,
    ...(isAnimation ? { frames: input.frames.map(encodeBitmap), fps: input.fps ?? 8 } : {}),
  };

  try {
    write([post, ...getLocalPosts()]);
  } catch {
    throw new PostError(
      "storage",
      "This browser is out of space for doodles. Delete an older doodle from your profile and try again.",
    );
  }
  return post;
}

export function deleteLocalPost(id: string): void {
  try {
    write(getLocalPosts().filter((p) => p.id !== id));
  } catch {
    // Removing can only shrink storage, so this is very unlikely; ignore.
  }
}

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

export function toPost(p: StoredPost): Post {
  return {
    id: p.id,
    author: GUEST_HANDLE,
    plaza: p.plaza,
    ago: timeAgo(p.createdAt),
    caption: p.caption,
    body: p.frames
      ? { type: "animation", frames: p.frames, width: p.width, height: p.height, fps: p.fps ?? 8 }
      : { type: "bitmap", data: p.drawing, width: p.width, height: p.height },
    yeahs: 0,
  };
}

export const isLocalPostId = (id: string) => id.startsWith("local-");
