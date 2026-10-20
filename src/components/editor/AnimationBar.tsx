"use client";

import { useEffect, useRef } from "react";
import { paintBitmap } from "@/lib/pixel/paint";
import {
  ChevronLeftIcon,
  ChevronRightIcon,
  CopyIcon,
  OnionIcon,
  PauseIcon,
  PlayIcon,
  PlusIcon,
  TrashIcon,
} from "./icons";
import { Tile } from "./Tile";
import { FPS_OPTIONS, type Fps, type FrameView, MAX_FRAMES } from "./useDrawingEditor";

type Props = {
  frames: FrameView[];
  current: number;
  playing: boolean;
  fps: Fps;
  onion: boolean;
  canRestoreFrame: boolean;
  onSelect: (index: number) => void;
  onAdd: (duplicate: boolean) => void;
  onDelete: () => void;
  onRestore: () => void;
  onMove: (direction: -1 | 1) => void;
  onTogglePlay: () => void;
  onToggleOnion: () => void;
  onFps: (fps: Fps) => void;
};

export function AnimationBar(p: Props) {
  const count = p.frames.length;
  const currentIndex = p.current;
  const full = count >= MAX_FRAMES;
  const stripRef = useRef<HTMLOListElement | null>(null);

  useEffect(() => {
    const el = stripRef.current?.children[currentIndex] as HTMLElement | undefined;
    el?.scrollIntoView({ block: "nearest", inline: "nearest" });
  }, [currentIndex, count]);

  return (
    <div className="mt-3 flex flex-col gap-2.5" role="group" aria-label="Animation">
      <div className="flex flex-wrap items-center gap-2.5">
        <Tile
          label={p.playing ? "Pause" : "Play"}
          badge="P"
          pressed={p.playing}
          disabled={count < 2}
          onClick={p.onTogglePlay}
        >
          {p.playing ? <PauseIcon size={26} /> : <PlayIcon size={26} />}
        </Tile>

        <div className="tray" role="group" aria-label="Speed">
          {FPS_OPTIONS.map((f) => (
            <button
              key={f}
              type="button"
              className="fps-btn"
              aria-pressed={p.fps === f}
              onClick={() => p.onFps(f)}
              title={`${f} frames per second`}
            >
              {f}
              <span className="text-[10px] opacity-75">fps</span>
            </button>
          ))}
        </div>

        <div className="tray">
          <Tile small label="Onion skin (show previous frame)" badge="O" pressed={p.onion} onClick={p.onToggleOnion}>
            <OnionIcon size={22} />
          </Tile>
        </div>

        <div className="tray" role="group" aria-label="Frame actions">
          <Tile small label="New blank frame" badge="N" disabled={full} onClick={() => p.onAdd(false)}>
            <PlusIcon size={22} />
          </Tile>
          <Tile small label="Duplicate frame" badge="⇧N" disabled={full} onClick={() => p.onAdd(true)}>
            <CopyIcon size={20} />
          </Tile>
          <Tile small label="Move frame earlier" disabled={p.current === 0} onClick={() => p.onMove(-1)}>
            <ChevronLeftIcon size={22} />
          </Tile>
          <Tile small label="Move frame later" disabled={p.current === count - 1} onClick={() => p.onMove(1)}>
            <ChevronRightIcon size={22} />
          </Tile>
          <Tile small label="Delete frame" disabled={count < 2} onClick={p.onDelete}>
            <TrashIcon size={20} />
          </Tile>
        </div>

        <p className="ml-auto text-sm font-extrabold text-white tabular-nums" aria-live="polite">
          Frame {p.current + 1} / {count}
          {full && <span className="ml-1 font-semibold">(max)</span>}
        </p>
      </div>

      {p.canRestoreFrame && (
        <p className="flex items-center gap-2 self-start rounded-full bg-ink/80 py-1 pr-1 pl-3 text-sm font-bold text-white" role="status">
          Frame deleted
          <button type="button" className="rounded-full bg-white px-3 py-0.5 text-ink" onClick={p.onRestore}>
            Undo
          </button>
        </p>
      )}

      <ol ref={stripRef} className="frame-strip" aria-label="Frames">
        {p.frames.map((frame, i) => (
          <li key={frame.id}>
            <button
              type="button"
              className="frame-thumb"
              aria-current={i === p.current ? "true" : undefined}
              aria-label={`Frame ${i + 1}`}
              onClick={() => p.onSelect(i)}
            >
              <FrameThumb frame={frame} />
              <span className="frame-num">{i + 1}</span>
            </button>
          </li>
        ))}
      </ol>
      <p className="text-xs font-semibold text-white">
        , and . step between frames · N new frame · Shift+N duplicate · P play · O onion skin
      </p>
    </div>
  );
}

function FrameThumb({ frame }: { frame: FrameView }) {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { bitmap, rev } = frame;
  useEffect(() => {
    paintBitmap(ref.current, bitmap);
  }, [bitmap, rev]);
  return (
    <canvas
      ref={ref}
      width={bitmap.width}
      height={bitmap.height}
      aria-hidden
      // Smooth scaling so 1px lines don't disappear in thumbnails.
      className="block w-full bg-white"
      style={{ aspectRatio: `${bitmap.width} / ${bitmap.height}` }}
    />
  );
}
