"use client";

import Link from "next/link";
import { PencilIcon, SignInIcon } from "@/components/ui/icons";
import { useMyProfile } from "@/lib/useMyProfile";

// Sample posts aren't in the database, so they can't get real replies.
export function SampleReplyNotice({ postId, hasReplies }: { postId: string; hasReplies: boolean }) {
  const { loading, profile } = useMyProfile();

  return (
    <div className="flex flex-col items-start gap-3 border-t-2 border-leaf-light bg-leaf-light/50 px-5 py-5 sm:flex-row sm:items-center sm:px-6">
      <p className="font-semibold">
        {profile
          ? "This is a sample post, so it can't get replies. Reply to real doodles from the plaza!"
          : `${hasReplies ? "" : "No replies yet. "}Replies can be typed or drawn.`}
      </p>
      {loading ? null : profile ? (
        <Link href="/draw" className="btn sm:ml-auto">
          <PencilIcon size={18} /> Draw something
        </Link>
      ) : (
        <Link href={`/signin?next=/p/${postId}`} className="btn sm:ml-auto">
          <SignInIcon size={18} /> Make a profile to reply
        </Link>
      )}
    </div>
  );
}
