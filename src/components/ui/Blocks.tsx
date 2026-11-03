import Link from "next/link";
import type { ReactNode } from "react";
import { getPlaza, type Plaza, plazas, postsInPlaza, SEASON_THEME } from "@/lib/mock/data";
import { ArrowRightIcon, PencilIcon, PlazasIcon } from "./icons";

export function SectionBar({
  icon,
  title,
  action,
  id,
  tone = "leaf",
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  id?: string;
  tone?: "leaf" | "sky" | "berry";
}) {
  return (
    <div className={tone === "leaf" ? "section-bar" : `section-bar section-bar-${tone}`}>
      <span aria-hidden className="shrink-0">
        {icon}
      </span>
      <h2 id={id} className="text-lg font-extrabold">
        {title}
      </h2>
      <span aria-hidden className="section-bar-pixels" />
      {action && <div className="ml-auto">{action}</div>}
    </div>
  );
}

export function SeasonCard() {
  const plaza = getPlaza(SEASON_THEME.plaza);
  return (
    <section aria-labelledby="season-heading" className="season-card">
      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest">
        <span aria-hidden>{plaza?.emoji}</span> This season
      </p>
      <h2 id="season-heading" className="font-black tracking-tight text-3xl leading-tight">
        {SEASON_THEME.title}
      </h2>
      <p className="text-sm">{SEASON_THEME.hint}</p>
      <div className="mt-1 flex flex-wrap gap-2">
        <Link href={`/draw?plaza=${SEASON_THEME.plaza}`} className="btn btn-dark">
          <PencilIcon size={18} /> Draw it
        </Link>
        {plaza && (
          <Link href={`/plazas/${plaza.slug}`} className="btn">
            See the plaza
          </Link>
        )}
      </div>
    </section>
  );
}

export function PlazaList() {
  return (
    <section aria-labelledby="plaza-list-heading" className="card overflow-hidden">
      <div className="flex items-center gap-2 border-b-2 border-leaf-light px-4 py-3">
        <PlazasIcon size={18} className="text-leaf-dark" />
        <h2 id="plaza-list-heading" className="font-extrabold">
          Plazas
        </h2>
        <Link href="/plazas" className="ml-auto text-sm font-bold text-leaf-dark hover:underline">
          See all
        </Link>
      </div>
      <ul>
        {plazas.map((p) => (
          <li key={p.slug}>
            <Link
              href={`/plazas/${p.slug}`}
              className="flex items-center gap-3 px-4 py-2.5 hover:bg-leaf-light/60"
            >
              <span aria-hidden className="emoji-badge">
                {p.emoji}
              </span>
              <span className="min-w-0">
                <span className="block truncate font-bold">{p.name}</span>
                <span className="block truncate text-xs text-muted">{p.tagline}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AboutCard() {
  return (
    <section className="card flex gap-3 p-4">
      <div className="text-sm">
        <h2 className="font-extrabold">Welcome to the plaza!</h2>
        <p className="mt-1 text-muted">
          Everything in the plaza is hand-drawn, so no pressure, just have fun exploring and make cool art!
        </p>
      </div>
    </section>
  );
}

export function PlazaCard({ plaza }: { plaza: Plaza }) {
  const count = postsInPlaza(plaza.slug).length;
  return (
    <Link href={`/plazas/${plaza.slug}`} className="card group flex w-full flex-col gap-3 p-5">
      <div className="flex items-center gap-3">
        <span aria-hidden className="emoji-badge emoji-badge-lg">
          {plaza.emoji}
        </span>
        <div className="min-w-0">
          <h2 className="truncate text-lg font-extrabold group-hover:underline">{plaza.name}</h2>
          <p className="text-sm text-muted">
            {count} {count === 1 ? "post" : "posts"}
          </p>
        </div>
        <ArrowRightIcon size={20} className="ml-auto text-leaf-dark" />
      </div>
      <p className="text-sm">{plaza.description}</p>
    </Link>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <h3 className="font-black tracking-tight text-2xl">{title}</h3>
      {children && <div className="max-w-sm text-muted">{children}</div>}
    </div>
  );
}
