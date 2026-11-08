"use client";

import { useEffect, useState } from "react";
import { PlazaCard } from "@/components/ui/Blocks";
import { plazas } from "@/lib/mock/data";
import { fetchPlazaCounts } from "@/lib/posts";

/** Grid of every plaza with how many real posts it has (sample doodles aren't counted). */
export function PlazaCards() {
  const [counts, setCounts] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchPlazaCounts(plazas.map((p) => p.slug))
      .then((real) => !cancelled && setCounts(real))
      // leave the counts blank rather than show a wrong number
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {plazas.map((p) => (
        <li key={p.slug} className="flex">
          <PlazaCard plaza={p} count={counts ? (counts[p.slug] ?? 0) : undefined} />
        </li>
      ))}
    </ul>
  );
}
