import Link from "next/link";
import type { ReactNode } from "react";
import { DAILY_PROMPT, type Plaza, plazas, postsInPlaza } from "@/lib/mock/data";
import { ArrowRightIcon, CalendarIcon, PencilIcon, PlazasIcon } from "./icons";
import { Mascot } from "./Mascot";

export function SectionBar({
  icon,
  title,
  action,
  id,
}: {
  icon: ReactNode;
  title: string;
  action?: ReactNode;
  id?: string;
}) {
  return (
    <div className="section-bar">
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

export function PromptCard() {
  return (
    <section aria-labelledby="prompt-heading" className="prompt-card">
      <p className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-widest">
        <CalendarIcon size={15} /> Today&apos;s prompt
      </p>
      <h2 id="prompt-heading" className="font-display text-3xl leading-tight">
        {DAILY_PROMPT.title}
      </h2>
      <p className="text-sm">{DAILY_PROMPT.hint}</p>
      <Link
        href={`/draw?prompt=${encodeURIComponent(DAILY_PROMPT.title)}`}
        className="btn btn-dark mt-1 self-start"
      >
        <PencilIcon size={18} /> Draw it
      </Link>
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
      <Mascot size={44} className="shrink-0" />
      <div className="text-sm">
        <h2 className="font-extrabold">Hi, I&apos;m Pip!</h2>
        <p className="mt-1 text-muted">
          Everything in the plaza is hand-drawn, so have no pressure, just have fun exploring and make cool art!
        </p>
      </div>
    </section>
  );
}

export function PlazaCard({ plaza }: { plaza: Plaza }) {
  const count = postsInPlaza(plaza.slug).length;
  return (
    <Link href={`/plazas/${plaza.slug}`} className="card group flex w-full flex-col gap-3 p-5 transition-transform hover:-translate-y-0.5">
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
        <ArrowRightIcon size={20} className="ml-auto text-leaf-dark transition-transform group-hover:translate-x-1" />
      </div>
      <p className="text-sm">{plaza.description}</p>
    </Link>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="card flex flex-col items-center gap-3 px-6 py-10 text-center">
      <Mascot size={64} />
      <h3 className="font-display text-2xl">{title}</h3>
      {children && <div className="max-w-sm text-muted">{children}</div>}
    </div>
  );
}
