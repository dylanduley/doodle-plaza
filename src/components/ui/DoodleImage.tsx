"use client";

import { useEffect, useRef } from "react";
import { CANVAS_HEIGHT, CANVAS_WIDTH } from "@/lib/pixel/constants";
import { type DoodleKind, generateDoodle } from "@/lib/pixel/doodles";
import { paintBitmap } from "@/lib/pixel/paint";

export function DoodleImage({
  kind,
  seed,
  label,
  className = "",
}: {
  kind: DoodleKind;
  seed: number;
  label: string;
  className?: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    paintBitmap(ref.current, generateDoodle(kind, seed));
  }, [kind, seed]);

  return (
    <canvas
      ref={ref}
      width={CANVAS_WIDTH}
      height={CANVAS_HEIGHT}
      role="img"
      aria-label={label}
      className={`pixel-canvas block w-full bg-white ${className}`}
      style={{ aspectRatio: `${CANVAS_WIDTH} / ${CANVAS_HEIGHT}` }}
    />
  );
}
