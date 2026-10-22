"use client";

import type { ReactNode } from "react";
import { PostCard } from "@/components/ui/Post";
import { useMyYeahs } from "@/lib/useMyYeahs";
import { usePosts } from "@/lib/usePosts";

export function PostsFeed({
  plaza,
  authorId,
  empty = null,
}: {
  plaza?: string;
  authorId?: string;
  empty?: ReactNode;
}) {
  const { loading, posts, error } = usePosts({ plaza, authorId });
  const myYeahs = useMyYeahs(posts.map((p) => p.id));

  if (loading) return null;
  if (error) {
    return (
      <p role="alert" className="error-box">
        {error} Try refreshing the page.
      </p>
    );
  }
  if (posts.length === 0) return <>{empty}</>;

  return (
    <ul className="flex flex-col gap-4" aria-label="Latest doodles">
      {posts.map((post) => (
        <li key={post.id}>
          <PostCard post={post} showPlaza={!plaza} yeahed={myYeahs?.has(post.id) ?? false} />
        </li>
      ))}
    </ul>
  );
}
