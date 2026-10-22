import Link from "next/link";
import { PopularStrip } from "@/components/post/PopularStrip";
import { PostsFeed } from "@/components/post/PostsFeed";
import { AboutCard, PlazaList, PromptCard, SectionBar } from "@/components/ui/Blocks";
import { ClockIcon, PencilIcon, PlazasIcon } from "@/components/ui/icons";
import { Mascot } from "@/components/ui/Mascot";
import { PostCard } from "@/components/ui/Post";
import { popularDrawings, posts } from "@/lib/mock/data";

export default function Home() {
  const popular = popularDrawings(6);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="film" aria-labelledby="hero-heading">
          <div className="grid items-center gap-6 md:grid-cols-[1fr_1.1fr]">
            <div className="flex items-center gap-4">
              <Mascot size={88} className="shrink-0 drop-shadow-[3px_3px_0_var(--color-leaf-shadow)]" />
              <div>
                <h1 id="hero-heading" className="logo-text text-4xl sm:text-5xl">
                  Doodle Plaza
                </h1>
                <p className="mt-2 font-bold text-white">A community-driven place for doodling and animating.</p>
              </div>
            </div>
            <div className="flex flex-col gap-3 rounded-2xl bg-white/25 p-3">
              <p className="rounded-xl bg-cream px-4 py-3 text-center text-ink">
                Draw your posts on a small canvas, share them in plazas, and give your
                favorites a <strong>Yeah!</strong>
              </p>
              <div className="flex flex-wrap gap-3 [&>*]:flex-1">
                <Link href="/draw" className="btn btn-primary">
                  <PencilIcon size={18} /> Start drawing
                </Link>
                <Link href="/plazas" className="btn">
                  <PlazasIcon size={18} /> Explore plazas
                </Link>
              </div>
            </div>
          </div>
        </section>

        <PopularStrip samples={popular} />

        <section aria-labelledby="fresh-heading" className="flex flex-col gap-4">
          <SectionBar id="fresh-heading" icon={<ClockIcon size={20} />} title="Latest posts" />
          <PostsFeed />
          <ul className="flex flex-col gap-4">
            {posts.map((post) => (
              <li key={post.id}>
                <PostCard post={post} />
              </li>
            ))}
          </ul>
        </section>
      </div>

      <aside className="flex flex-col gap-5" aria-label="Plaza info">
        <PromptCard />
        <PlazaList />
        <AboutCard />
      </aside>
    </div>
  );
}
