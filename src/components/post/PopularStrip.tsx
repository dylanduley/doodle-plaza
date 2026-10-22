"use client";

import Link from "next/link";
import { useState } from "react";
import { BitmapImage } from "@/components/ui/BitmapImage";
import { SectionBar } from "@/components/ui/Blocks";
import { TrendingIcon, YeahIcon } from "@/components/ui/icons";
import { DoodleTile } from "@/components/ui/Post";
import type { Post } from "@/lib/mock/data";
import type { LivePost } from "@/lib/posts";
import { usePosts } from "@/lib/usePosts";

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;
const MAX_TILES = 6;

/** Most-yeahed real posts from the last week, or the sample doodles until there are some. */
export function PopularStrip({ samples }: { samples: Post[] }) {
  const { loading, posts } = usePosts();
  // read the clock once, not on every render
  const [weekAgo] = useState(() => Date.now() - WEEK_MS);
  const popular = posts
    .filter((p) => p.yeahs > 0 && Date.parse(p.createdAt) > weekAgo)
    .toSorted((a, b) => b.yeahs - a.yeahs)
    .slice(0, MAX_TILES);
  const showReal = !loading && popular.length > 0;

  return (
    <section aria-labelledby="popular-heading" className="flex flex-col gap-4">
      <SectionBar
        id="popular-heading"
        icon={<TrendingIcon size={20} />}
        title={showReal ? "Popular this week" : "Sample doodles"}
      />
      <ul className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-3">
        {showReal
          ? popular.map((post) => (
              <li key={post.id}>
                <LiveTile post={post} />
              </li>
            ))
          : samples.map((post) => (
              <li key={post.id}>
                <DoodleTile post={post} />
              </li>
            ))}
      </ul>
    </section>
  );
}

function LiveTile({ post }: { post: LivePost }) {
  const name = post.authorName ?? post.author;
  // animations show their first frame
  const image =
    post.body.type === "bitmap"
      ? { data: post.body.data, width: post.body.width, height: post.body.height }
      : post.body.type === "animation"
        ? { data: post.body.frames[0], width: post.body.width, height: post.body.height }
        : null;

  return (
    <Link href={`/p/${post.id}`} className="tile-card group">
      <div className="overflow-hidden rounded-xl transition-transform duration-200 group-hover:scale-[1.03]">
        {image && <BitmapImage data={image.data} width={image.width} height={image.height} label={`Drawing by ${name}`} />}
      </div>
      <div className="flex items-center justify-between gap-2 px-1 pt-2 text-sm">
        <span className="truncate font-bold">{name}</span>
        <span className="flex items-center gap-1 font-bold text-leaf-dark">
          <YeahIcon size={15} />
          <span className="tabular-nums">{post.yeahs}</span>
          <span className="sr-only">yeahs</span>
        </span>
      </div>
    </Link>
  );
}
