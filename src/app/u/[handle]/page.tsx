import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { LiveProfile } from "@/components/profile/LiveProfile";
import { EmptyState, SectionBar } from "@/components/ui/Blocks";
import { ClockIcon } from "@/components/ui/icons";
import { PostCard } from "@/components/ui/Post";
import { getUser, postsByUser } from "@/lib/mock/data";

type Props = {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ deleted?: string; updated?: string }>;
};

// Rendered per request: real profiles aren't known at build time, and the
// page reads ?deleted / ?updated (not allowed on prebuilt pages in production).
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const user = getUser((await params).handle);
  return { title: user ? `${user.name} (@${user.handle})` : `@${(await params).handle}` };
}

export default async function ProfilePage({ params, searchParams }: Props) {
  const { handle } = await params;
  if (handle === "you") redirect("/signin");
  const user = getUser(handle);
  if (!user) {
    const { deleted, updated } = await searchParams;
    return <LiveProfile handle={handle} justDeleted={deleted === "1"} justUpdated={updated === "1"} />;
  }
  const userPosts = postsByUser(handle);
  const drawings = userPosts.filter((p) => p.body.type === "drawing").length;

  const stats = [
    { label: "Posts", value: userPosts.length },
    { label: "Drawings", value: drawings },
  ];

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <section className="film">
        <h1 className="logo-text text-4xl sm:text-5xl">{user.name}</h1>
        <p className="mt-1 font-bold text-white">
          @{user.handle} · joined {user.joined}
        </p>
        <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-ink">{user.bio}</p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-black/15 px-3 py-2 text-center">
              <dt className="text-xs font-bold uppercase tracking-wide text-white">{s.label}</dt>
              <dd className="text-2xl font-black tabular-nums">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="user-posts-heading" className="flex flex-col gap-4">
        <SectionBar id="user-posts-heading" icon={<ClockIcon size={20} />} title="Posts" />
        {userPosts.length === 0 ? (
          <EmptyState title="Nothing here yet">
            <p>{user.name} hasn&apos;t posted any doodles.</p>
          </EmptyState>
        ) : (
          <ul className="flex flex-col gap-4">
            {userPosts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
