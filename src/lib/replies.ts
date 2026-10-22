import type { Reply } from "@/lib/mock/data";
import type { Bitmap } from "@/lib/pixel/bitmap";
import { encodeBitmap } from "@/lib/pixel/codec";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/pixel/constants";
import { timeAgo } from "@/lib/posts";
import { createClient } from "@/lib/supabase/client";

export const REPLY_MAX = 280;

export type LiveReply = Reply & { authorId: string };

export class ReplyError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ReplyError";
  }
}

type ReplyRow = {
  id: string;
  post_id: string;
  author_id: string;
  text: string | null;
  drawing: string | null;
  created_at: string;
  author: { handle: string; display_name: string } | null;
};

// replies link to profiles twice (author, and via reports), so name the author one
const REPLY_FIELDS =
  "id, post_id, author_id, text, drawing, created_at, author:profiles!replies_author_id_fkey(handle, display_name)";

function toLiveReply(row: ReplyRow): LiveReply {
  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    author: row.author?.handle ?? "unknown",
    authorName: row.author?.display_name,
    ago: timeAgo(row.created_at),
    body: row.drawing
      ? { type: "bitmap", data: row.drawing, width: CANVAS_WIDTH, height: CANVAS_HEIGHT }
      : { type: "text", text: row.text ?? "" },
    yeahs: 0,
  };
}

/** Oldest first, so a conversation reads top to bottom. */
export async function fetchReplies(postId: string): Promise<LiveReply[]> {
  const { data, error } = await createClient()
    .from("replies")
    .select(REPLY_FIELDS)
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new ReplyError("We couldn't load the replies.");
  return (data as unknown as ReplyRow[]).map(toLiveReply);
}

export async function createReply(
  postId: string,
  body: { text: string } | { drawing: Bitmap },
): Promise<LiveReply> {
  const row: { post_id: string; text?: string; drawing?: string } =
    "text" in body
      ? { post_id: postId, text: body.text.trim().slice(0, REPLY_MAX) }
      : { post_id: postId, drawing: encodeBitmap(body.drawing) };

  const { data, error } = await createClient().from("replies").insert(row).select(REPLY_FIELDS).single();
  if (error) {
    // P0001 = the hourly limit from the rate-limit trigger
    if (error.code === "P0001") throw new ReplyError("You've replied a lot in the last hour. Try again in a bit.");
    // 23503 = no profile row yet, or the post was deleted
    if (error.code === "23503") throw new ReplyError("You need a profile to reply, or this doodle was deleted.");
    throw new ReplyError("Your reply wasn't sent. Check your connection and try again.");
  }
  return toLiveReply(data as unknown as ReplyRow);
}

export async function deleteReply(id: string): Promise<void> {
  const { error } = await createClient().from("replies").delete().eq("id", id);
  if (error) throw new ReplyError("We couldn't delete your reply. Please try again.");
}
