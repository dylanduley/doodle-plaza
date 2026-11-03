"use client";

import Link from "next/link";
import { SignInIcon } from "@/components/ui/icons";
import { useMyProfile } from "@/lib/useMyProfile";

export function ProfileNeededNotice({ next }: { next: string }) {
  const { loading, profile } = useMyProfile();
  if (loading || profile) return null;

  return (
    <div role="note" className="notice flex flex-col gap-3 sm:flex-row sm:items-center">
      <p>
        <strong>You&apos;ll need a profile to post.</strong> Your drawing is saved in this browser, so you can
        make one now and come right back to it.
      </p>
      <Link href={`/signin?next=${encodeURIComponent(next)}`} className="btn btn-dark shrink-0 sm:ml-auto">
        <SignInIcon size={18} /> Make your profile
      </Link>
    </div>
  );
}
