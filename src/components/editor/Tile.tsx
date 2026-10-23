"use client";

import type { ReactNode } from "react";

export function Tile({
  label,
  badge,
  pressed,
  disabled,
  small,
  className,
  onClick,
  children,
}: {
  label: string;
  badge?: string;
  pressed?: boolean;
  disabled?: boolean;
  small?: boolean;
  className?: string;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={[small ? "tile tile-small" : "tile", className].filter(Boolean).join(" ")}
      aria-label={label}
      title={badge ? `${label} (${badge})` : label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
    >
      {children}
      {badge && (
        <span aria-hidden className="tile-badge">
          {badge}
        </span>
      )}
    </button>
  );
}
