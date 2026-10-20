"use client";

import { useState } from "react";
import { YeahIcon } from "./icons";

// TODO: call the API once accounts exist (and roll back on failure).
export function YeahButton({ count, size = "md" }: { count: number; size?: "sm" | "md" }) {
  const [on, setOn] = useState(false);
  const total = count + (on ? 1 : 0);
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={`Yeah! ${total} ${total === 1 ? "yeah" : "yeahs"}`}
      onClick={() => setOn((v) => !v)}
      className={`yeah ${size === "sm" ? "yeah-sm" : ""}`}
    >
      <YeahIcon size={size === "sm" ? 16 : 18} className="yeah-icon" />
      <span>Yeah!</span>
      <span className="tabular-nums opacity-80">{total}</span>
    </button>
  );
}
