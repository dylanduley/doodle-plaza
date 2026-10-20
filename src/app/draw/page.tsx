import type { Metadata } from "next";
import Link from "next/link";
import { PlayIcon } from "@/components/editor/icons";
import { PostComposer } from "@/components/post/PostComposer";
import { CalendarIcon } from "@/components/ui/icons";
import { getPlaza } from "@/lib/mock/data";

export const metadata: Metadata = { title: "Draw" };

type Props = {
  searchParams: Promise<{ prompt?: string; plaza?: string; simulateError?: string }>;
};

export default async function DrawPage({ searchParams }: Props) {
  const { prompt: rawPrompt, plaza: plazaSlug, simulateError } = await searchParams;
  // It comes from the URL, so keep it to a sensible length.
  const prompt = rawPrompt?.slice(0, 80);
  const plaza = plazaSlug ? getPlaza(plazaSlug) : undefined;

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-4xl text-leaf-deep">New doodle</h1>
        {plaza ? (
          <p className="chip text-base">
            <span aria-hidden>{plaza.emoji}</span> Drawing for {plaza.name}
          </p>
        ) : (
          <div className="flex flex-wrap gap-1">
            <Link href="/draw/animate" className="pill-link">
              <PlayIcon size={16} /> Make an animation
            </Link>
            <Link href="/draw/profile" className="pill-link">
              Draw your profile picture
            </Link>
          </div>
        )}
      </div>
      {prompt && (
        <p className="prompt-card flex-row! items-center gap-2! py-3! font-bold">
          <CalendarIcon size={18} /> Prompt: {prompt}
        </p>
      )}
      <PostComposer
        defaultPlaza={plaza?.slug ?? (prompt ? "daily-prompt" : undefined)}
        simulateError={simulateError === "1"}
      />
    </div>
  );
}
