import type { Metadata } from "next";
import { MakeProfile } from "@/components/profile/MakeProfile";
import { PROFILE_PICTURE_SIZE } from "@/lib/pixel/constants";

export const metadata: Metadata = { title: "Make your profile" };

type Props = { searchParams: Promise<{ next?: string }> };

export default async function MakeProfilePage({ searchParams }: Props) {
  const { next } = await searchParams;
  // Only same-site paths, so the link can't send people to another website.
  const safeNext = next?.startsWith("/") && !next.startsWith("//") ? next : "/";

  return (
    <div className="flex flex-col gap-5">
      <div>
        <h1 className="font-display text-4xl text-leaf-deep">Make your profile</h1>
        <p className="mt-1 max-w-xl text-muted">
          Everything here is drawn, including you. Draw your profile picture on the{" "}
          {PROFILE_PICTURE_SIZE}×{PROFILE_PICTURE_SIZE} canvas, then pick a name.
        </p>
      </div>
      <MakeProfile next={safeNext} />
    </div>
  );
}
