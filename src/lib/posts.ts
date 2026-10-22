import type { Post } from "@/lib/mock/data";
import type { Bitmap } from "@/lib/pixel/bitmap";
import { encodeBitmap } from "@/lib/pixel/codec";
import { createClient } from "@/lib/supabase/client";

export const CAPTION_MAX = 80;
const FEED_LIMIT = 30;

export type LivePost = Post & { authorId: string };

export type PostErrorKind = "network" | "no-profile" | "too-big";

export class PostError extends Error {
  readonly kind: PostErrorKind;
  constructor(kind: PostErrorKind, message: string) {
    super(message);
    this.kind = kind;
    this.name = "PostError";
  }
}

type PostRow = {
  id: string;
  author_id: string;
  plaza: string;
  caption: string | null;
  width: number;
  height: number;
  frames: string[];
  fps: number | null;
  created_at: string;
  author: { handle: string; display_name: string; avatar: string } | null;
  yeahs: { count: number }[];
};

// profiles!posts_author_id_fkey: posts link to profiles twice (author, and via yeahs), so name the author one
const POST_FIELDS =
  "id, author_id, plaza, caption, width, height, frames, fps, created_at, author:profiles!posts_author_id_fkey(handle, display_name, avatar), yeahs(count)";

export function timeAgo(iso: string, now = Date.now()): string {
  const seconds = Math.max(0, (now - Date.parse(iso)) / 1000);
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

function toLivePost(row: PostRow): LivePost {
  const [first] = row.frames;
  return {
    id: row.id,
    authorId: row.author_id,
    author: row.author?.handle ?? "unknown",
    authorName: row.author?.display_name,
    plaza: row.plaza,
    ago: timeAgo(row.created_at),
    caption: row.caption ?? undefined,
    body:
      row.frames.length > 1
        ? { type: "animation", frames: row.frames, width: row.width, height: row.height, fps: row.fps ?? 8 }
        : { type: "bitmap", data: first, width: row.width, height: row.height },
    yeahs: row.yeahs[0]?.count ?? 0,
  };
}

export async function fetchPosts(filter: { plaza?: string; authorId?: string } = {}): Promise<LivePost[]> {
  let query = createClient().from("posts").select(POST_FIELDS).order("created_at", { ascending: false }).limit(FEED_LIMIT);
  if (filter.plaza) query = query.eq("plaza", filter.plaza);
  if (filter.authorId) query = query.eq("author_id", filter.authorId);

  const { data, error } = await query;
  if (error) throw new PostError("network", "We couldn't load the latest doodles.");
  return (data as unknown as PostRow[]).map(toLivePost);
}

export async function fetchPost(id: string): Promise<LivePost | null> {
  const { data, error } = await createClient().from("posts").select(POST_FIELDS).eq("id", id).maybeSingle();
  if (error) throw new PostError("network", "We couldn't load this doodle.");
  return data ? toLivePost(data as unknown as PostRow) : null;
}

export async function createPost(
  input: { frames: Bitmap[]; fps?: number; caption: string; plaza: string },
  options: { simulateNetworkError?: boolean } = {},
): Promise<{ id: string }> {
  if (options.simulateNetworkError) {
    // for /draw?simulateError=1
    await new Promise((resolve) => setTimeout(resolve, 600));
    throw new PostError("network", "We couldn't reach the plaza. Check your connection and try again.");
  }

  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new PostError("no-profile", "You need a profile to post.");

  const [first] = input.frames;
  const isAnimation = input.frames.length > 1;
  const caption = input.caption.trim().slice(0, CAPTION_MAX);

  const { data, error } = await supabase
    .from("posts")
    .insert({
      plaza: input.plaza,
      caption: caption || null,
      width: first.width,
      height: first.height,
      frames: input.frames.map(encodeBitmap),
      fps: isAnimation ? (input.fps ?? 8) : null,
    })
    .select("id")
    .single();

  if (error) {
    // 23503 = foreign key: signed in, but no profile row yet.
    if (error.code === "23503") throw new PostError("no-profile", "You need a profile to post.");
    // 23514 = a check constraint, most likely the size limit.
    if (error.code === "23514") {
      throw new PostError("too-big", "This animation is too big to post. Try removing some frames.");
    }
    throw new PostError("network", "We couldn't reach the plaza. Check your connection and try again.");
  }
  return { id: data.id };
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await createClient().from("posts").delete().eq("id", id);
  if (error) throw new PostError("network", "We couldn't delete this doodle. Please try again.");
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
// real posts use UUIDs, sample posts use ids like "p4"
export const isLivePostId = (id: string) => UUID.test(id);
