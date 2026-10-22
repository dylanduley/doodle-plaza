import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LivePostView } from "@/components/post/LivePostView";
import { SectionBar } from "@/components/ui/Blocks";
import { ArrowRightIcon } from "@/components/ui/icons";
import { AuthorName, DoodleTile, PlazaChip, PostBodyView, SampleBadge } from "@/components/ui/Post";
import { getPost, getUser, postsByUser } from "@/lib/mock/data";
import { isLivePostId } from "@/lib/posts";

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ posted?: string }>;
};

// Rendered per request: real posts aren't known at build time, and the page
// reads ?posted (not allowed on prebuilt pages in production).
export const dynamic = "force-dynamic";

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
            <SampleBadge />
            <span className="ml-auto text-sm text-muted">{post.ago} ago</span>
          </header>
          <PostBodyView
            body={post.body}
            label={post.caption ? `Drawing by ${user?.name}: ${post.caption}` : `Drawing by ${user?.name}`}
          />
          {post.caption && <h1 className="text-xl font-extrabold">{post.caption}</h1>}
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
