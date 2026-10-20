import Link from "next/link";
import {
  type Post,
  type Reply,
  type ReplyBody,
  getPlaza,
  getUser,
  replyCount,
} from "@/lib/mock/data";
import { isLocalPostId } from "@/lib/local/posts";
import { AnimationPlayer } from "./AnimationPlayer";
import { BitmapImage } from "./BitmapImage";
import { DoodleImage } from "./DoodleImage";
import { ReplyIcon, YeahIcon } from "./icons";
import { YeahButton } from "./YeahButton";

export function AuthorName({ handle }: { handle: string }) {
  const user = getUser(handle);
  return (
    <Link href={`/u/${handle}`} className="group inline-flex min-w-0 items-baseline gap-1.5">
      <span className="truncate font-extrabold group-hover:underline">{user?.name ?? handle}</span>
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

export function DeviceBadge() {
  return (
    <span
      className="rounded-full border-2 border-dashed border-leaf-dark/40 px-2 py-0.5 text-xs font-bold text-leaf-dark"
      title="Saved in this browser until accounts launch"
    >
      On this device
    </span>
  );
}

export function PostCard({ post, showPlaza = true }: { post: Post; showPlaza?: boolean }) {
  const user = getUser(post.author);
  const replies = replyCount(post.id);
  const kind = post.body.type === "animation" ? "Animation" : "Drawing";
  const label = post.caption
    ? `${kind} by ${user?.name}: ${post.caption}`
    : `${kind} by ${user?.name}`;

  return (
    <article className="card flex flex-col gap-3 p-4 sm:p-5">
      <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <AuthorName handle={post.author} />
        {showPlaza && <PlazaChip slug={post.plaza} />}
        {isLocalPostId(post.id) && <DeviceBadge />}
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

      <footer className="flex items-center gap-2">
        <YeahButton count={post.yeahs} />
        <Link href={`/p/${post.id}`} className="pill-link">
          <ReplyIcon size={17} />
          <span className="tabular-nums">{replies}</span>
          <span className="sr-only">{replies === 1 ? "reply" : "replies"}</span>
        </Link>
      </footer>
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
        <span className="flex items-center gap-1 font-bold text-leaf-dark">
          <YeahIcon size={15} />
          <span className="tabular-nums">{post.yeahs}</span>
        </span>
      </div>
    </Link>
  );
}

export function ReplyCard({ reply }: { reply: Reply }) {
  const user = getUser(reply.author);
  return (
    <article className="flex flex-col gap-2.5 border-t-2 border-leaf-light px-4 py-4 sm:px-5">
      <header className="flex items-center gap-3">
        <AuthorName handle={reply.author} />
        <span className="ml-auto text-sm text-muted">{reply.ago}</span>
      </header>
      <div className={reply.body.type === "drawing" ? "max-w-md" : ""}>
        <PostBodyView body={reply.body} label={`Reply drawing by ${user?.name}`} />
      </div>
      <div>
        <YeahButton count={reply.yeahs} size="sm" />
      </div>
    </article>
  );
}
