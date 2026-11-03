"use client";

import Link from "next/link";
import { PencilIcon, SignInIcon } from "@/components/ui/icons";
import { useMyProfile } from "@/lib/useMyProfile";

export function ProfileNeededNotice({ next }: { next: string }) {
  const { loading, profile } = useMyProfile();
  if (loading || profile) return null;

  return (
    <div role="note" className="notice">
      <span aria-hidden className="notice-icon">
        <PencilIcon size={22} />
      </span>
      <div className="flex-1">
        <p className="font-extrabold">You&apos;ll need a profile to post</p>
        <p className="text-sm text-muted">Your drawing is saved in this browser, so you won&apos;t lose it.</p>
      </div>
      <Link href={`/signin?next=${encodeURIComponent(next)}`} className="btn btn-dark shrink-0">
        <SignInIcon size={18} /> Make your profile
      </Link>
    </div>
  );
}
