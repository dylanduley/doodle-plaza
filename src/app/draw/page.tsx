import type { Metadata } from "next";
import Link from "next/link";
import { PlayIcon } from "@/components/editor/icons";
import { PostComposer } from "@/components/post/PostComposer";
import { getPlaza } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Draw" };

type Props = {
  searchParams: Promise<{ plaza?: string; simulateError?: string }>;
};

export default async function DrawPage({ searchParams }: Props) {
  const { plaza: plazaSlug, simulateError } = await searchParams;
  const plaza = plazaSlug ? getPlaza(plazaSlug) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="page-title">New doodle</h1>
        {plaza ? (
          <p className="chip text-base">
            <span aria-hidden>{plaza.emoji}</span> Drawing for {plaza.name}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            <Link href="/draw/animate?from=still" className="pill-link">
              <PlayIcon size={16} /> Make an animation
            </Link>
            <Link href="/signin" className="pill-link">
              Make your profile
            </Link>
          </div>
        )}
      </div>
      <PostComposer
        defaultPlaza={plaza?.slug}
        simulateError={simulateError === "1"}
      />
    </div>
  );
}
