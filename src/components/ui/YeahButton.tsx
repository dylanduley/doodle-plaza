"use client";

import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { useMyProfile } from "@/lib/useMyProfile";
import { addYeah, removeYeah } from "@/lib/yeahs";
import { YeahIcon } from "./icons";

type Props = {
  count: number;
  size?: "sm" | "md";
  /** Real posts: saves to the database. Without it (sample posts) the toggle is local only. */
  postId?: string;
  /** Whether you've already yeahed this post. `count` includes it. */
  yeahed?: boolean;
};

export function YeahButton({ count, size = "md", postId, yeahed = false }: Props) {
  const { profile } = useMyProfile();
  const router = useRouter();
  const pathname = usePathname();
  // null = go with what the server said; set once you click
  const [override, setOverride] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  const on = override ?? yeahed;
  const total = count - (yeahed ? 1 : 0) + (on ? 1 : 0);

  async function toggle() {
    if (!postId) return setOverride(!on);
    if (!profile) return router.push(`/signin?next=${encodeURIComponent(pathname)}`);
    if (busy) return;

    // Optimistic: flip now, undo if saving fails.
    const next = !on;
    setOverride(next);
    setBusy(true);
    setFailed(false);
    try {
      if (next) await addYeah(postId);
      else await removeYeah(profile.id, postId);
    } catch {
      setOverride(!next);
      setFailed(true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-pressed={on}
        aria-label={`Yeah! ${total} ${total === 1 ? "yeah" : "yeahs"}`}
        onClick={toggle}
        className={`yeah ${size === "sm" ? "yeah-sm" : ""}`}
      >
        <YeahIcon size={size === "sm" ? 16 : 18} className="yeah-icon" />
        <span>Yeah!</span>
        <span className="tabular-nums opacity-80">{total}</span>
      </button>
      {failed && (
        <span role="status" className="text-xs font-bold text-accent">
          Didn&apos;t save. Try again.
        </span>
      )}
    </span>
  );
}
