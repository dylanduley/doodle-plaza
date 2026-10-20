import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { LocalPostsFeed } from "@/components/post/LocalPostsFeed";
import { EmptyState, PlazaList, PromptCard, SectionBar } from "@/components/ui/Blocks";
import { ClockIcon, PencilIcon } from "@/components/ui/icons";
import { PostCard } from "@/components/ui/Post";
import { getPlaza, plazas, postsInPlaza } from "@/lib/mock/data";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return plazas.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const plaza = getPlaza((await params).slug);
  return { title: plaza?.name ?? "Plaza not found" };
}

export default async function PlazaPage({ params }: Props) {
  const { slug } = await params;
  const plaza = getPlaza(slug);
  if (!plaza) notFound();
  const feed = postsInPlaza(slug);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="film">
          <div className="flex flex-wrap items-center gap-4">
            <span aria-hidden className="grid size-16 place-items-center rounded-2xl bg-cream text-4xl">
              {plaza.emoji}
            </span>
            <div className="min-w-0 flex-1">
              <h1 className="logo-text text-3xl sm:text-4xl">{plaza.name}</h1>
              <p className="mt-1 font-bold text-white">{plaza.tagline}</p>
            </div>
            <Link href={`/draw?plaza=${plaza.slug}`} className="btn btn-primary">
              <PencilIcon size={18} /> Draw here
            </Link>
          </div>
          <p className="mt-4 max-w-2xl rounded-xl bg-cream px-4 py-3 text-ink">{plaza.description}</p>
        </section>

        <section className="flex flex-col gap-4" aria-labelledby="plaza-feed-heading">
          <SectionBar id="plaza-feed-heading" icon={<ClockIcon size={20} />} title="Latest posts" />
          <LocalPostsFeed plaza={plaza.slug} />
          {feed.length === 0 ? (
            <EmptyState title="No doodles yet">
              <p>Be the first to post in {plaza.name}.</p>
              <Link href={`/draw?plaza=${plaza.slug}`} className="btn btn-primary mt-4">
                <PencilIcon size={18} /> Start drawing
              </Link>
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-4">
              {feed.map((post) => (
                <li key={post.id}>
                  <PostCard post={post} showPlaza={false} />
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      <aside className="flex flex-col gap-5" aria-label="More plazas">
        <PromptCard />
        <PlazaList />
      </aside>
    </div>
  );
}
