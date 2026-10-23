"use client";

import {
  type PointerEvent as ReactPointerEvent,
  type RefObject,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  type Bitmap,
  cloneBitmap,
  createBitmap,
  drawLine,
  floodFill,
  isBlank,
} from "@/lib/pixel/bitmap";
import { BRUSH_SIZES, type BrushSize, HISTORY_LIMIT, PAPER, PALETTE } from "@/lib/pixel/constants";
import { History } from "@/lib/pixel/history";
import { paintBitmap } from "@/lib/pixel/paint";
import { fadePalette, paletteToRgb } from "@/lib/pixel/render";
import type { View } from "./useCanvasView";

export type Tool = "pen" | "eraser" | "fill" | "hand";

export const MAX_FRAMES = 100;
export const FPS_OPTIONS = [2, 4, 8, 12, 24] as const;
export type Fps = (typeof FPS_OPTIONS)[number];

type Options = {
  width: number;
  height: number;
  viewRef: RefObject<View>;
  animated?: boolean;
  initial?: Bitmap;
};

type Frame = { id: number; bitmap: Bitmap; history: History; rev: number };

/** `rev` bumps when the pixels change. */
export type FrameView = { id: number; bitmap: Bitmap; rev: number };

let frameIds = 0;
function newFrame(width: number, height: number, bitmap?: Bitmap): Frame {
  return {
    id: ++frameIds,
    bitmap: bitmap ?? createBitmap(width, height, PAPER),
    history: new History(HISTORY_LIMIT),
    rev: 0,
  };
}

// Frames live in a ref, not state, since pixels change on every pointer move.
// After each change we publish a small snapshot to state for the UI.
export function useDrawingEditor({ width, height, viewRef, animated = false, initial }: Options) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [initialFrames] = useState(() => [newFrame(width, height, initial && cloneBitmap(initial))]);
  const framesRef = useRef<Frame[]>(initialFrames);
  const currentRef = useRef(0);
  const rgbPalette = useMemo(() => paletteToRgb(PALETTE), []);
  const onionPalette = useMemo(() => fadePalette(rgbPalette), [rgbPalette]);

  const getFrame = useCallback(() => framesRef.current[currentRef.current], []);
  const getBitmap = useCallback(() => getFrame().bitmap, [getFrame]);
  const getFrames = useCallback(() => framesRef.current.map((f) => f.bitmap), []);

  const [tool, setTool] = useState<Tool>("pen");
  const [color, setColor] = useState(1);
  const [brushSize, setBrushSize] = useState<BrushSize>(1);

  const [frames, setFrames] = useState<FrameView[]>(() =>
    initialFrames.map(({ id, bitmap, rev }) => ({ id, bitmap, rev })),
  );
  const [current, setCurrent] = useState(0);
  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);
  const [blank, setBlank] = useState(() => isBlank(initialFrames[0].bitmap));
  const [allBlank, setAllBlank] = useState(() => isBlank(initialFrames[0].bitmap));
  const [canRestoreFrame, setCanRestoreFrame] = useState(false);

  const [onion, setOnion] = useState(true);
  const onionRef = useRef(true);
  const [playing, setPlaying] = useState(false);
  const playingRef = useRef(false);
  const playIndexRef = useRef(0);
  const [fps, setFps] = useState<Fps>(8);

  const publish = useCallback(() => {
    const list = framesRef.current;
    const frame = list[currentRef.current];
    setFrames(list.map(({ id, bitmap, rev }) => ({ id, bitmap, rev })));
    setCurrent(currentRef.current);
    setCanUndo(frame.history.canUndo);
    setCanRedo(frame.history.canRedo);
    setBlank(isBlank(frame.bitmap, PAPER));
    setAllBlank(list.every((f) => isBlank(f.bitmap, PAPER)));
  }, []);

  const markChanged = useCallback(() => {
    getFrame().rev++;
    publish();
  }, [getFrame, publish]);

  const frameRequest = useRef<number | null>(null);

  const render = useCallback(() => {
    frameRequest.current = null;
    const list = framesRef.current;
    if (playingRef.current) {
      paintBitmap(canvasRef.current, list[playIndexRef.current % list.length].bitmap);
      return;
    }
    const i = currentRef.current;
    const ghost = animated && onionRef.current && i > 0 ? list[i - 1].bitmap : null;
    paintBitmap(
      canvasRef.current,
      list[i].bitmap,
      ghost ? { bitmap: ghost, palette: onionPalette, paper: PAPER } : undefined,
    );
  }, [onionPalette, animated]);

  // At most one redraw per animation frame.
  const requestRender = useCallback(() => {
    if (frameRequest.current === null) {
      frameRequest.current = requestAnimationFrame(render);
    }
  }, [render]);

  useEffect(() => {
    render();
    return () => {
      if (frameRequest.current !== null) cancelAnimationFrame(frameRequest.current);
    };
  }, [render]);

  const stroke = useRef<{ id: number; x: number; y: number; color: number; before: Uint8Array } | null>(null);

  // Screen point -> bitmap coords (undo pan/rotate/zoom).
  const toCanvasPoint = (e: { clientX: number; clientY: number }) => {
    const canvas = canvasRef.current!;
    const rect = canvas.getBoundingClientRect();
    const { zoom, rotation, flipped } = viewRef.current;
    const dx = e.clientX - (rect.left + rect.width / 2);
    const dy = e.clientY - (rect.top + rect.height / 2);
    const rad = (-rotation * Math.PI) / 180;
    const rx = dx * Math.cos(rad) - dy * Math.sin(rad);
    const lx = flipped ? -rx : rx;
    const ly = dx * Math.sin(rad) + dy * Math.cos(rad);
    const screenPxPerPixel = (canvas.offsetWidth * zoom) / width;
    return {
      x: Math.floor(lx / screenPxPerPixel + width / 2),
      y: Math.floor(ly / screenPxPerPixel + height / 2),
    };
  };

  const strokeColor = tool === "eraser" ? PAPER : color;

  const onPointerDown = (e: ReactPointerEvent<HTMLElement>) => {
    // 5 = pen eraser
    const penEraser = e.pointerType === "pen" && (e.button === 5 || (e.buttons & 32) !== 0);
    if (e.button !== 0 && !penEraser) return;
    // Drawing is paused during playback so it's always clear which frame you're on.
    if (stroke.current || tool === "hand" || playingRef.current) return;
    const bmp = getBitmap();
    const { x, y } = toCanvasPoint(e);

    if (tool === "fill") {
      const before = bmp.data.slice();
      if (floodFill(bmp, x, y, penEraser ? PAPER : color)) {
        getFrame().history.record(before);
        requestRender();
        markChanged();
      }
      return;
    }

    try {
      // Capture can throw if the pointer is already up.
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    const c = penEraser ? PAPER : strokeColor;
    stroke.current = { id: e.pointerId, x, y, color: c, before: bmp.data.slice() };
    drawLine(bmp, x, y, x, y, brushSize, c);
    requestRender();
  };

  const onPointerMove = (e: ReactPointerEvent<HTMLElement>) => {
    const active = stroke.current;
    if (!active || active.id !== e.pointerId) return;
    // Coalesced events = smoother fast strokes.
    const coalesced = e.nativeEvent.getCoalescedEvents?.() ?? [];
    const samples = coalesced.length ? coalesced : [e.nativeEvent];
    for (const sample of samples) {
      const { x, y } = toCanvasPoint(sample);
      if (x === active.x && y === active.y) continue;
      drawLine(getBitmap(), active.x, active.y, x, y, brushSize, active.color);
      active.x = x;
      active.y = y;
    }
    requestRender();
  };

  const onPointerEnd = (e: ReactPointerEvent<HTMLElement>) => {
    const active = stroke.current;
    if (!active || active.id !== e.pointerId) return;
    stroke.current = null;
    const after = getBitmap().data;
    let changed = false;
    for (let i = 0; i < after.length; i++) {
      if (after[i] !== active.before[i]) {
        changed = true;
        break;
      }
    }
    if (changed) {
      getFrame().history.record(active.before);
      markChanged();
    }
  };

  // Ignored mid-stroke, it would break the stroke's undo snapshot.
  const undo = useCallback(() => {
    if (stroke.current) return;
    const frame = getFrame();
    const prev = frame.history.undo(frame.bitmap.data);
    if (!prev) return;
    frame.bitmap.data.set(prev);
    requestRender();
    markChanged();
  }, [getFrame, requestRender, markChanged]);

  const redo = useCallback(() => {
    if (stroke.current) return;
    const frame = getFrame();
    const next = frame.history.redo(frame.bitmap.data);
    if (!next) return;
    frame.bitmap.data.set(next);
    requestRender();
    markChanged();
  }, [getFrame, requestRender, markChanged]);

  const clear = useCallback(() => {
    if (stroke.current) return;
    const frame = getFrame();
    if (isBlank(frame.bitmap, PAPER)) return;
    frame.history.record(frame.bitmap.data);
    frame.bitmap.data.fill(PAPER);
    requestRender();
    markChanged();
  }, [getFrame, requestRender, markChanged]);

  const toPngBlob = useCallback(
    (scale = 1): Promise<Blob | null> => {
      const out = document.createElement("canvas");
      out.width = width * scale;
      out.height = height * scale;
      const ctx = out.getContext("2d");
      if (!ctx) return Promise.resolve(null);
      // Render without the onion ghost, so the export is exactly the frame.
      const src = document.createElement("canvas");
      src.width = width;
      src.height = height;
      paintBitmap(src, getBitmap());
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(src, 0, 0, out.width, out.height);
      return new Promise((resolve) => out.toBlob(resolve, "image/png"));
    },
    [width, height, getBitmap],
  );

  const selectBrush = useCallback((next: "pen" | "eraser", size: BrushSize) => {
    setTool(next);
    setBrushSize(size);
  }, []);

  const stopPlaying = useCallback(() => {
    if (!playingRef.current) return;
    playingRef.current = false;
    setPlaying(false);
  }, []);

  const goToFrame = useCallback(
    (index: number) => {
      if (stroke.current) return;
      stopPlaying();
      const list = framesRef.current;
      currentRef.current = Math.max(0, Math.min(list.length - 1, index));
      requestRender();
      publish();
    },
    [stopPlaying, requestRender, publish],
  );

  const addFrame = useCallback(
    (duplicate = false) => {
      const list = framesRef.current;
      if (list.length >= MAX_FRAMES || stroke.current) return;
      stopPlaying();
      const frame = newFrame(width, height, duplicate ? cloneBitmap(getBitmap()) : undefined);
      const at = currentRef.current + 1;
      framesRef.current = [...list.slice(0, at), frame, ...list.slice(at)];
      currentRef.current = at;
      requestRender();
      publish();
    },
    [width, height, getBitmap, stopPlaying, requestRender, publish],
  );

  const deletedRef = useRef<{ frame: Frame; index: number } | null>(null);

  const deleteFrame = useCallback(() => {
    const list = framesRef.current;
    if (list.length <= 1 || stroke.current) return;
    stopPlaying();
    const index = currentRef.current;
    deletedRef.current = { frame: list[index], index };
    framesRef.current = list.filter((_, i) => i !== index);
    currentRef.current = Math.min(index, framesRef.current.length - 1);
    setCanRestoreFrame(true);
    requestRender();
    publish();
  }, [stopPlaying, requestRender, publish]);

  const restoreFrame = useCallback(() => {
    const deleted = deletedRef.current;
    const list = framesRef.current;
    if (!deleted || list.length >= MAX_FRAMES) return;
    const at = Math.min(deleted.index, list.length);
    framesRef.current = [...list.slice(0, at), deleted.frame, ...list.slice(at)];
    currentRef.current = at;
    deletedRef.current = null;
    setCanRestoreFrame(false);
    requestRender();
    publish();
  }, [requestRender, publish]);

  const moveFrame = useCallback(
    (direction: -1 | 1) => {
      const list = framesRef.current;
      const from = currentRef.current;
      const to = from + direction;
      if (to < 0 || to >= list.length || stroke.current) return;
      stopPlaying();
      const next = [...list];
      [next[from], next[to]] = [next[to], next[from]];
      framesRef.current = next;
      currentRef.current = to;
      requestRender();
      publish();
    },
    [stopPlaying, requestRender, publish],
  );

  const toggleOnion = useCallback(() => {
    onionRef.current = !onionRef.current;
    setOnion(onionRef.current);
    requestRender();
  }, [requestRender]);

  const togglePlay = useCallback(() => {
    if (framesRef.current.length < 2 || stroke.current) return;
    playingRef.current = !playingRef.current;
    playIndexRef.current = currentRef.current;
    setPlaying(playingRef.current);
    requestRender();
  }, [requestRender]);

  useEffect(() => {
    if (!playing) return;
    const id = setInterval(() => {
      playIndexRef.current = (playIndexRef.current + 1) % framesRef.current.length;
      requestRender();
    }, 1000 / fps);
    return () => clearInterval(id);
  }, [playing, fps, requestRender]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName))) {
        return;
      }
      const mod = e.metaKey || e.ctrlKey;
      const key = e.key.toLowerCase();
      if (mod && key === "z") {
        e.preventDefault();
        if (e.shiftKey) redo();
        else undo();
      } else if (mod && key === "y") {
        e.preventDefault();
        redo();
      } else if (!mod && !e.altKey) {
        if (key === "b") setTool("pen");
        else if (key === "e") setTool("eraser");
        else if (key === "g") setTool("fill");
        else if (key === "h") setTool("hand");
        else if (key === "[" || key === "]") {
          setBrushSize((s) => {
            const i = BRUSH_SIZES.indexOf(s) + (key === "]" ? 1 : -1);
            return BRUSH_SIZES[Math.max(0, Math.min(BRUSH_SIZES.length - 1, i))];
          });
        } else if (/^[1-9]$/.test(key)) {
          const index = Number(key);
          if (index < PALETTE.length) {
            setColor(index);
            setTool((t) => (t === "eraser" || t === "hand" ? "pen" : t));
          }
        } else if (animated) {
          if (key === ",") goToFrame(currentRef.current - 1);
          else if (key === ".") goToFrame(currentRef.current + 1);
          else if (key === "n") addFrame(e.shiftKey);
          else if (key === "p") togglePlay();
          else if (key === "o") toggleOnion();
        }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [undo, redo, animated, goToFrame, addFrame, togglePlay, toggleOnion]);

  return {
    canvasRef,
    onPointerDown,
    onPointerMove,
    onPointerEnd,
    tool,
    setTool,
    selectBrush,
    color,
    setColor,
    brushSize,
    canUndo,
    canRedo,
    blank,
    allBlank,
    undo,
    redo,
    clear,
    toPngBlob,
    getBitmap,
    getFrames,
    // animation
    frames,
    current,
    goToFrame,
    addFrame,
    deleteFrame,
    restoreFrame,
    canRestoreFrame,
    moveFrame,
    onion,
    toggleOnion,
    playing,
    togglePlay,
    fps,
    setFps,
  };
}
