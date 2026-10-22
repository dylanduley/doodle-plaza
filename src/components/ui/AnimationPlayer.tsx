"use client";

import { useCallback, useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import { PauseIcon, PlayIcon } from "@/components/editor/icons";
import type { Bitmap } from "@/lib/pixel/bitmap";
import { decodeBitmap } from "@/lib/pixel/codec";
import { paintBitmap } from "@/lib/pixel/paint";

const reducedMotionQuery = "(prefers-reduced-motion: reduce)";
function subscribeReducedMotion(cb: () => void) {
  const mq = window.matchMedia(reducedMotionQuery);
  mq.addEventListener("change", cb);
  return () => mq.removeEventListener("change", cb);
}
const useReducedMotion = () =>
  useSyncExternalStore(
    subscribeReducedMotion,
    () => window.matchMedia(reducedMotionQuery).matches,
    () => false,
  );

export function AnimationPlayer({
  frames,
  width,
  height,
  fps,
  label,
}: {
  frames: string[];
  width: number;
  height: number;
  fps: number;
  label: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const indexRef = useRef(0);
  const reduceMotion = useReducedMotion();
  // null = follow the default (play unless reduced motion is on)
  const [userPaused, setUserPaused] = useState<boolean | null>(null);
  const paused = userPaused ?? reduceMotion;
  const [visible, setVisible] = useState(false);

  const decoded = useMemo<Bitmap[] | null>(() => {
    try {
      return frames.map((f) => decodeBitmap(f, { width, height }));
    } catch {
      return null;
    }
  }, [frames, width, height]);

  const draw = useCallback(
    (i: number) => {
      if (decoded) paintBitmap(canvasRef.current, decoded[i]);
    },
    [decoded],
  );

  useEffect(() => {
    const el = canvasRef.current;
    if (!el) return;
    const io = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), {
      rootMargin: "100px",
    });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (!decoded) return;
    draw(indexRef.current);
    if (paused || !visible || decoded.length < 2) return;
    const id = setInterval(() => {
      indexRef.current = (indexRef.current + 1) % decoded.length;
      draw(indexRef.current);
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [decoded, paused, visible, fps, draw]);

  if (!decoded) {
    return (
      <div
        role="img"
        aria-label="This animation couldn't be loaded"
        className="grid place-items-center bg-leaf-light/60 p-6 text-sm font-semibold text-muted"
        style={{ aspectRatio: `${width} / ${height}` }}
      >
        This animation couldn&apos;t be loaded.
      </div>
    );
  }

  return (
    <div className="relative">
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        role="img"
        aria-label={`${label} (animation, ${decoded.length} frames)`}
        className="pixel-canvas block w-full bg-white"
        style={{ aspectRatio: `${width} / ${height}` }}
      />
      <button
        type="button"
        onClick={() => setUserPaused(!paused)}
        aria-label={paused ? "Play animation" : "Pause animation"}
        className="absolute bottom-2 left-2 flex items-center gap-1.5 rounded-full bg-ink/75 px-2.5 py-1 text-xs font-bold text-white hover:bg-ink/90"
      >
        {paused ? <PlayIcon size={14} /> : <PauseIcon size={14} />}
        {paused ? "Play" : "Pause"}
      </button>
      <span className="pointer-events-none absolute right-2 bottom-2 rounded-full bg-ink/60 px-2 py-0.5 text-[11px] font-bold text-white">
        {decoded.length} frames · {fps} fps
      </span>
    </div>
  );
}
