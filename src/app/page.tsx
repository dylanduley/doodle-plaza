import Link from "next/link";
import { PopularStrip } from "@/components/post/PopularStrip";
import { PostsFeed } from "@/components/post/PostsFeed";
import { AboutCard, PlazaList, SeasonCard, SectionBar } from "@/components/ui/Blocks";
import { ClockIcon, PencilIcon, PlazasIcon } from "@/components/ui/icons";
import { PostCard } from "@/components/ui/Post";
import { popularDrawings, posts } from "@/lib/mock/data";

export default function Home() {
  const popular = popularDrawings(6);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-6">
        <section className="film hero" aria-labelledby="hero-heading">
          <span aria-hidden className="hero-spark" style={{ top: "26%", right: "24%" }} />
          <span aria-hidden className="hero-spark hero-spark-sun" style={{ top: "52%", right: "10%", animationDelay: "-1.2s" }} />
          <span aria-hidden className="hero-spark" style={{ top: "72%", right: "30%", animationDelay: "-2.1s" }} />
          <span aria-hidden className="hero-spark hero-spark-red" style={{ top: "20%", right: "6%", animationDelay: "-0.6s" }} />

          <div className="relative max-w-2xl">
            <h1 id="hero-heading" className="logo-text text-4xl sm:text-5xl">
              Welcome to the plaza!
            </h1>
            <p className="mt-3 text-lg font-bold text-white">A community-driven place for doodling and animating.</p>
            <ul className="mt-4 flex flex-wrap gap-2" aria-label="What you can do">
              <li className="hero-chip">
                <span aria-hidden>🖍️</span> Draw on a tiny canvas
              </li>
              <li className="hero-chip">
                <span aria-hidden>🎞️</span> Make flip-book animations
              </li>
              <li className="hero-chip">
                <span aria-hidden>🙌</span> Give your favorites a Yeah!
              </li>
            </ul>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/draw" className="btn btn-primary">
                <PencilIcon size={18} /> Start drawing
              </Link>
              <Link href="/plazas" className="btn">
                <PlazasIcon size={18} /> Explore plazas
              </Link>
            </div>
          </div>
        </section>

        <PopularStrip samples={popular} />

        <section aria-labelledby="fresh-heading" className="flex flex-col gap-4">
          <SectionBar id="fresh-heading" icon={<ClockIcon size={20} />} title="Latest posts" tone="sky" />
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
        <SeasonCard />
        <PlazaList />
        <AboutCard />
      </aside>
    </div>
  );
}
