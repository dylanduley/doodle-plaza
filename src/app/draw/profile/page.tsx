import type { Metadata } from "next";
import Link from "next/link";
import { DrawingEditor } from "@/components/editor/DrawingEditor";
import { PencilIcon } from "@/components/ui/icons";
import { PROFILE_PICTURE_SIZE } from "@/lib/pixel/constants";

export const metadata: Metadata = { title: "Draw your profile picture" };

export default function ProfilePictureDrawPage() {
  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-4xl text-leaf-deep">Your profile picture</h1>
          <p className="mt-1 max-w-xl text-muted">
            A square {PROFILE_PICTURE_SIZE}×{PROFILE_PICTURE_SIZE} canvas. Draw yourself, your pet,
            or anything that feels like you.
          </p>
        </div>
        <Link href="/draw" className="pill-link">
          <PencilIcon size={17} /> Draw a post instead
        </Link>
      </div>
      <DrawingEditor width={PROFILE_PICTURE_SIZE} height={PROFILE_PICTURE_SIZE} />
    </div>
  );
}
