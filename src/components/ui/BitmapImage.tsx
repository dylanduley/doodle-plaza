"use client";

import { useEffect, useMemo, useRef } from "react";
import { decodeBitmap } from "@/lib/pixel/codec";
import { paintBitmap } from "@/lib/pixel/paint";

export function BitmapImage({
  data,
  width,
  height,
  label,
}: {
  data: string;
  width: number;
  height: number;
  label: string;
}) {
  const ref = useRef<HTMLCanvasElement | null>(null);

  // Decode during render so bad data shows a placeholder right away.
  const bitmap = useMemo(() => {
    try {
      return decodeBitmap(data, { width, height });
    } catch {
      return null;
    }
  }, [data, width, height]);

  useEffect(() => {
    if (bitmap) paintBitmap(ref.current, bitmap);
  }, [bitmap]);

  if (!bitmap) {
    return (
      <div
        role="img"
        aria-label="This drawing couldn't be loaded"
        className="grid place-items-center bg-leaf-light/60 p-6 text-sm font-semibold text-muted"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        This drawing couldn&apos;t be loaded.
      </div>
    );
  }

  return (
    <canvas
      ref={ref}
      width={bitmap.width}
      height={bitmap.height}
      role="img"
      aria-label={label}
      className="pixel-canvas block w-full bg-white"
      style={{ aspectRatio: `${bitmap.width} / ${bitmap.height}` }}
    />
  );
}
