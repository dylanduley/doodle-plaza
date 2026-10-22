import Link from "next/link";
import type { ReactNode } from "react";
import {
  type Post,
  type Reply,
  type ReplyBody,
  getPlaza,
  getUser,
  replyCount,
} from "@/lib/mock/data";
import { AnimationPlayer } from "./AnimationPlayer";
import { BitmapImage } from "./BitmapImage";
import { DoodleImage } from "./DoodleImage";
import { ReplyIcon } from "./icons";
import { YeahButton } from "./YeahButton";

export function SampleBadge() {
  return (
    <span
      className="rounded-full border-2 border-dashed border-leaf-dark/40 px-2 py-0.5 text-xs font-bold text-leaf-dark"
      title="An example post by Pip, the plaza mascot"
    >
      Sample
    </span>
  );
}

export function AuthorName({ handle, name }: { handle: string; name?: string }) {
  const displayName = name ?? getUser(handle)?.name ?? handle;
  return (
    <Link href={`/u/${handle}`} className="group inline-flex min-w-0 items-baseline gap-1.5">
      <span className="truncate font-extrabold group-hover:underline">{displayName}</span>
      <span className="truncate text-sm text-muted">@{handle}</span>
    </Link>
  );
}

export function PlazaChip({ slug }: { slug: string }) {
  const plaza = getPlaza(slug);
  if (!plaza) return null;
  return (
    <Link href={`/plazas/${slug}`} className="chip">
      <span aria-hidden>{plaza.emoji}</span>
      {plaza.name}
    </Link>
  );
}

export function PostBodyView({ body, label }: { body: ReplyBody; label: string }) {
  if (body.type === "drawing") {
    return (
      <div className="doodle-frame">
        <DoodleImage kind={body.kind} seed={body.seed} label={label} />
      </div>
    );
  }
  if (body.type === "animation") {
    return (
      <div className="doodle-frame">
        <AnimationPlayer
          frames={body.frames}
          width={body.width}
          height={body.height}
          fps={body.fps}
          label={label}
        />
      </div>
    );
  }
  if (body.type === "bitmap") {
    return (
      <div className="doodle-frame">
        <BitmapImage data={body.data} width={body.width} height={body.height} label={label} />
      </div>
    );
  }
  return <p className="speech text-lg">{body.text}</p>;
}

export function PostCard({
  post,
  showPlaza = true,
  yeahed,
}: {
  post: Post;
  showPlaza?: boolean;
  /** Real posts only: whether you've yeahed it. Turns on saving for the Yeah! button. */
  yeahed?: boolean;
}) {
  const name = post.authorName ?? getUser(post.author)?.name ?? post.author;
  const replies = post.replyCount ?? replyCount(post.id);
  const live = post.replyCount !== undefined;
  const kind = post.body.type === "animation" ? "Animation" : "Drawing";
  const label = post.caption ? `${kind} by ${name}: ${post.caption}` : `${kind} by ${name}`;

  return (
    <article className="card flex flex-col gap-3 p-4 sm:p-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <AuthorName handle={post.author} name={name} />
        {showPlaza && <PlazaChip slug={post.plaza} />}
        {!live && <SampleBadge />}
        <Link href={`/p/${post.id}`} className="ml-auto text-sm text-muted hover:underline">
          {post.ago}
        </Link>
      </header>

      {post.body.type === "animation" ? (
        // Animations have their own play/pause button, which can't sit inside a link.
        <PostBodyView body={post.body} label={label} />
      ) : (
        <Link href={`/p/${post.id}`} className="block rounded-2xl" aria-label={`Open post: ${label}`}>
          <PostBodyView body={post.body} label={label} />
        </Link>
      )}

      {post.caption && <p className="font-semibold">{post.caption}</p>}

      {/* sample posts can't be yeahed or replied to */}
      {live && (
        <footer className="flex items-center gap-2">
          <YeahButton count={post.yeahs} postId={post.id} yeahed={yeahed} />
          <Link href={`/p/${post.id}`} className="pill-link">
            <ReplyIcon size={17} />
            <span className="tabular-nums">{replies}</span>
            <span className="sr-only">{replies === 1 ? "reply" : "replies"}</span>
          </Link>
        </footer>
      )}
    </article>
  );
}

export function DoodleTile({ post }: { post: Post }) {
  if (post.body.type !== "drawing") return null;
  const user = getUser(post.author);
  return (
    <Link href={`/p/${post.id}`} className="tile-card group">
      <div className="overflow-hidden rounded-xl">
        <DoodleImage
          kind={post.body.kind}
          seed={post.body.seed}
          label={`Drawing by ${user?.name}`}
          className="transition-transform duration-200 group-hover:scale-[1.03]"
        />
      </div>
      <div className="flex items-center justify-between gap-2 px-1 pt-2 text-sm">
        <span className="truncate font-bold">{user?.name}</span>
        <SampleBadge />
      </div>
    </Link>
  );
}

export function ReplyCard({ reply, actions }: { reply: Reply; actions?: ReactNode }) {
  const name = reply.authorName ?? getUser(reply.author)?.name ?? reply.author;
  return (
    <article className="flex flex-col gap-2.5 border-t-2 border-leaf-light px-4 py-4 sm:px-5">
      <header className="flex items-center gap-3">
        <AuthorName handle={reply.author} name={name} />
        <span className="ml-auto text-sm text-muted">{reply.ago}</span>
      </header>
      <div className={reply.body.type === "text" ? "" : "max-w-md"}>
        <PostBodyView body={reply.body} label={`Reply drawing by ${name}`} />
      </div>
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </article>
  );
}
