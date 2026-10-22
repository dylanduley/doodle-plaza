"use client";

import { useEffect, useState } from "react";
import { useMyProfile } from "@/lib/useMyProfile";
import { fetchMyYeahs } from "@/lib/yeahs";

/** Which of these posts you've yeahed (one request for the whole list). Null until known. */
export function useMyYeahs(postIds: string[]): Set<string> | null {
  const { profile } = useMyProfile();
  const userId = profile?.id ?? null;
  const key = postIds.join(",");
  const [result, setResult] = useState<{ for: string; yeahs: Set<string> } | null>(null);

  useEffect(() => {
    if (!userId || !key) return;
    let cancelled = false;
    fetchMyYeahs(userId, key.split(","))
      .then((yeahs) => !cancelled && setResult({ for: `${userId}|${key}`, yeahs }))
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [userId, key]);

  return result && result.for === `${userId}|${key}` ? result.yeahs : null;
}
