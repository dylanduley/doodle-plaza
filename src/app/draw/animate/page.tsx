import type { Metadata } from "next";
import Link from "next/link";
import { PostComposer } from "@/components/post/PostComposer";
import { PencilIcon } from "@/components/ui/icons";
import { getPlaza } from "@/lib/mock/data";
import { ANIMATION_HEIGHT, ANIMATION_WIDTH } from "@/lib/pixel/constants";

export const metadata: Metadata = { title: "Animate" };

type Props = {
  searchParams: Promise<{ plaza?: string; simulateError?: string }>;
};

export default async function AnimatePage({ searchParams }: Props) {
  const { plaza: plazaSlug, simulateError } = await searchParams;
  const plaza = plazaSlug ? getPlaza(plazaSlug) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-leaf-deep">New animation</h1>
          <p className="mt-1 max-w-xl text-muted">
            A {ANIMATION_WIDTH}×{ANIMATION_HEIGHT} flipbook. Draw a frame, add the next one, and the
            faded previous frame helps you line things up.
          </p>
        </div>
        {plaza ? (
          <p className="chip text-base">
            <span aria-hidden>{plaza.emoji}</span> Animating for {plaza.name}
          </p>
        ) : (
          <Link href="/draw" className="pill-link">
            <PencilIcon size={17} /> Draw a still instead
          </Link>
        )}
      </div>
      <PostComposer animated defaultPlaza={plaza?.slug} simulateError={simulateError === "1"} />
    </div>
  );
}
