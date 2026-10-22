"use client";

import Link from "next/link";
import { SignInIcon } from "@/components/ui/icons";
import { useMyProfile } from "@/lib/useMyProfile";

export function ProfileNeededNotice({ next }: { next: string }) {
  const { loading, profile } = useMyProfile();
  if (loading || profile) return null;

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-sun/40 px-4 py-3 font-semibold sm:flex-row sm:items-center">
      <p>
        You&apos;ll need a profile to post. Make one first, since your drawing won&apos;t carry over.
      </p>
      <Link href={`/signin?next=${encodeURIComponent(next)}`} className="btn shrink-0 sm:ml-auto">
        <SignInIcon size={18} /> Make your profile
      </Link>
    </div>
  );
}
