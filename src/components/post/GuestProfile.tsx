"use client";

import Link from "next/link";
import { EmptyState, SectionBar } from "@/components/ui/Blocks";
import { ClockIcon, PencilIcon } from "@/components/ui/icons";
import { useIsClient, useLocalPosts } from "@/lib/local/useLocalPosts";
import { LocalPostsFeed } from "./LocalPostsFeed";

export function GuestProfile({ justDeleted }: { justDeleted: boolean }) {
  const isClient = useIsClient();
  const posts = useLocalPosts();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <section className="film">
        <h1 className="logo-text text-4xl sm:text-5xl">You</h1>
        <p className="mt-1 font-bold text-white">@you · this browser</p>
        <p className="mt-4 rounded-xl bg-cream px-4 py-3 text-ink">
          Doodles you post are saved here until accounts launch. Then you&apos;ll draw your profile
          picture and they&apos;ll move to your real account.
        </p>
        <dl className="mt-4 grid grid-cols-2 gap-3 sm:max-w-sm">
          <div className="rounded-xl bg-black/15 px-3 py-2 text-center">
            <dt className="text-xs font-bold uppercase tracking-wide text-white">Doodles</dt>
            <dd className="text-2xl font-black tabular-nums">{isClient ? posts.length : "–"}</dd>
          </div>
          <div className="rounded-xl bg-black/15 px-3 py-2 text-center">
            <dt className="text-xs font-bold uppercase tracking-wide text-white">Plazas</dt>
            <dd className="text-2xl font-black tabular-nums">
              {isClient ? new Set(posts.map((p) => p.plaza)).size : "–"}
            </dd>
          </div>
        </dl>
      </section>

      {justDeleted && (
        <p role="status" className="success-box">
          Doodle deleted.
        </p>
      )}

      <section aria-labelledby="guest-posts-heading" className="flex flex-col gap-4">
        <SectionBar
          id="guest-posts-heading"
          icon={<ClockIcon size={20} />}
          title="Your doodles"
          action={
            <Link href="/draw" className="rounded-full bg-black/15 px-3 py-1 text-sm font-bold hover:bg-black/25">
              New doodle
            </Link>
          }
        />
        {!isClient ? (
          <div className="card h-48 animate-pulse" aria-busy="true" aria-label="Loading your doodles" />
        ) : posts.length === 0 ? (
          <EmptyState title="No doodles yet">
            <p>Draw something and post it to a plaza. It&apos;ll show up here.</p>
            <Link href="/draw" className="btn btn-primary mt-4">
              <PencilIcon size={18} /> Start drawing
            </Link>
          </EmptyState>
        ) : (
          <LocalPostsFeed />
        )}
      </section>
    </div>
  );
}
