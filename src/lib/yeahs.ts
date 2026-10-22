import { createClient } from "@/lib/supabase/client";

/** Which of these posts you've yeahed. */
export async function fetchMyYeahs(userId: string, postIds: string[]): Promise<Set<string>> {
  if (postIds.length === 0) return new Set();
  const { data, error } = await createClient()
    .from("yeahs")
    .select("post_id")
    .eq("user_id", userId)
    .in("post_id", postIds);
  if (error) throw error;
  return new Set(data.map((row) => row.post_id as string));
}

export async function addYeah(postId: string): Promise<void> {
  const { error } = await createClient().from("yeahs").insert({ post_id: postId });
  // 23505 = already yeahed (e.g. in another tab), which is fine
  if (error && error.code !== "23505") throw error;
}

export async function removeYeah(userId: string, postId: string): Promise<void> {
  const { error } = await createClient().from("yeahs").delete().eq("post_id", postId).eq("user_id", userId);
  if (error) throw error;
}
