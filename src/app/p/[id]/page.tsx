import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LivePostView } from "@/components/post/LivePostView";
import { SectionBar } from "@/components/ui/Blocks";
import { ArrowRightIcon, ReplyIcon, SignInIcon } from "@/components/ui/icons";
import { AuthorName, DoodleTile, PlazaChip, PostBodyView, ReplyCard } from "@/components/ui/Post";
import { YeahButton } from "@/components/ui/YeahButton";
import { getPost, getUser, posts, postsByUser, repliesTo } from "@/lib/mock/data";
import { isLivePostId } from "@/lib/posts";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string }>;
};

export function generateStaticParams() {
  return posts.map((p) => ({ id: p.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  if (isLivePostId(id)) return { title: "Doodle" };
  const post = getPost(id);
  if (!post) return { title: "Post not found" };
  const name = getUser(post.author)?.name ?? post.author;
  return { title: post.caption ? `${post.caption} by ${name}` : `Post by ${name}` };
}

export default async function PostPage({ params, searchParams }: Props) {
  const { id } = await params;
  if (isLivePostId(id)) {
    return <LivePostView id={id} justPosted={(await searchParams).posted === "1"} />;
  }
  const post = getPost(id);
  if (!post) notFound();
  const user = getUser(post.author);
  const replies = repliesTo(post.id);
  const more = postsByUser(post.author)
    .filter((p) => p.id !== post.id && p.body.type === "drawing")
    .slice(0, 4);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <article className="card overflow-hidden">
        <div className="flex flex-col gap-4 p-5 sm:p-6">
          <header className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <AuthorName handle={post.author} />
            <PlazaChip slug={post.plaza} />
            <span className="ml-auto text-sm text-muted">{post.ago} ago</span>
          </header>
          <PostBodyView
            body={post.body}
            label={post.caption ? `Drawing by ${user?.name}: ${post.caption}` : `Drawing by ${user?.name}`}
          />
          {post.caption && <h1 className="text-xl font-extrabold">{post.caption}</h1>}
          <div className="flex items-center gap-2">
            <YeahButton count={post.yeahs} />
            <span className="pill-link pointer-events-none">
              <ReplyIcon size={17} /> {replies.length} {replies.length === 1 ? "reply" : "replies"}
            </span>
          </div>
        </div>

        {replies.length > 0 && (
          <section aria-label="Replies" className="bg-cream">
            {replies.map((r) => (
              <ReplyCard key={r.id} reply={r} />
            ))}
          </section>
        )}

        <div className="flex flex-col items-start gap-3 border-t-2 border-leaf-light bg-leaf-light/50 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
          <p className="font-semibold">
            {replies.length === 0 ? "No replies yet. " : ""}Replies can be text or a doodle.
          </p>
          <Link href={`/signin?next=/p/${post.id}`} className="btn sm:ml-auto">
            <SignInIcon size={18} /> Make a profile to reply
          </Link>
        </div>
      </article>

      {more.length > 0 && (
        <section className="flex flex-col gap-4">
          <SectionBar
            icon={<ArrowRightIcon size={20} />}
            title={`More from ${user?.name ?? post.author}`}
            action={
              <Link
                href={`/u/${post.author}`}
                className="rounded-full bg-black/15 px-3 py-1 text-sm font-bold hover:bg-black/25"
              >
                View profile
              </Link>
            }
          />
          <ul className="grid gap-4 sm:grid-cols-2">
            {more.map((p) => (
              <li key={p.id}>
                <DoodleTile post={p} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
