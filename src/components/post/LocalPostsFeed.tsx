"use client";

import { PostCard } from "@/components/ui/Post";
import { toPost } from "@/lib/local/posts";
import { useLocalPosts } from "@/lib/local/useLocalPosts";

export function LocalPostsFeed({ plaza }: { plaza?: string }) {
  const posts = useLocalPosts().filter((p) => !plaza || p.plaza === plaza);
  if (posts.length === 0) return null;
  return (
    <ul className="flex flex-col gap-4" aria-label="Your doodles">
      {posts.map((p) => (
        <li key={p.id}>
          <PostCard post={toPost(p)} showPlaza={!plaza} />
        </li>
      ))}
    </ul>
  );
}
