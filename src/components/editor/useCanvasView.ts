"use client";

import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

// Zoom/rotate/pan as a CSS transform. Never touches the bitmap.
export type View = {
  zoom: number;
  /** Quarter turns, in (-180, 180]. */
  rotation: number;
  flipped: boolean;
  /** px from the viewport center */
  panX: number;
  panY: number;
  limitX: number;
  limitY: number;
  /** Zoom where the whole canvas fits. Can't zoom out past this. */
  fitZoom: number;
};

export type PanDirection = "up" | "down" | "left" | "right";

export const DEFAULT_VIEW: View = {
  zoom: 1,
  rotation: 0,
  flipped: false,
  panX: 0,
  panY: 0,
  limitX: 0,
  limitY: 0,
  fitZoom: 1,
};
export const MAX_ZOOM = 8;
const ZOOM_STEP = 1.25;
/** Quarter turns keep pixels aligned to the screen grid (no jagged edges). */
const ROTATE_STEP = 90;

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

function normalizeAngle(deg: number): number {
  let a = ((deg % 360) + 360) % 360;
  if (a > 180) a -= 360;
  return a;
}

function isTypingTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

export function useCanvasView() {
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [view, setView] = useState<View>(DEFAULT_VIEW);
  const viewRef = useRef<View>(DEFAULT_VIEW);

  useEffect(() => {
    viewRef.current = view;
  }, [view]);

  const getWindow = () =>
    viewportRef.current?.querySelector<HTMLElement>("[data-canvas-window]") ?? null;

  const isInWindow = (clientX: number, clientY: number) => {
    const r = getWindow()?.getBoundingClientRect();
    return !!r && clientX >= r.left && clientX <= r.right && clientY >= r.top && clientY <= r.bottom;
  };

  const fromViewportCenter = (clientX: number, clientY: number) => {
    const r = viewportRef.current?.getBoundingClientRect();
    if (!r) return { x: 0, y: 0 };
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  };

  // Clamp pan so the canvas edge never goes past the window edge.
  // If the canvas fits on an axis, it stays centered on that axis.
  const clampPan = useCallback((v: View): View => {
    const win = getWindow();
    const canvas = win?.querySelector("canvas");
    if (!win || !canvas) return v;
    const rad = (v.rotation * Math.PI) / 180;
    const cos = Math.abs(Math.cos(rad));
    const sin = Math.abs(Math.sin(rad));
    const cw = canvas.offsetWidth * v.zoom;
    const ch = canvas.offsetHeight * v.zoom;
    const halfBoxW = (cw * cos + ch * sin) / 2;
    const halfBoxH = (cw * sin + ch * cos) / 2;
    const limitX = Math.max(0, halfBoxW - win.clientWidth / 2);
    const limitY = Math.max(0, halfBoxH - win.clientHeight / 2);
    const panX = clamp(v.panX, -limitX, limitX);
    const panY = clamp(v.panY, -limitY, limitY);
    const unchanged =
      panX === v.panX && panY === v.panY && limitX === v.limitX && limitY === v.limitY;
    return unchanged ? v : { ...v, panX, panY, limitX, limitY };
  }, []);

  // Zoom around the cursor (or the center if no point).
  const zoomBy = useCallback((factor: number, clientX?: number, clientY?: number) => {
    const anchor =
      clientX !== undefined && clientY !== undefined
        ? fromViewportCenter(clientX, clientY)
        : { x: 0, y: 0 };
    setView((prev) => {
      const zoom = clamp(prev.zoom * factor, prev.fitZoom, MAX_ZOOM * prev.fitZoom);
      if (zoom === prev.zoom) return prev;
      const k = zoom / prev.zoom;
      return clampPan({
        ...prev,
        zoom,
        panX: anchor.x - k * (anchor.x - prev.panX),
        panY: anchor.y - k * (anchor.y - prev.panY),
      });
    });
  }, [clampPan]);

  const rotateBy = useCallback(
    (deg: number) => {
      setView((prev) => {
        const rotation = normalizeAngle(prev.rotation + deg);
        return clampPan({ ...prev, rotation, fitZoom: 1, zoom: 1, panX: 0, panY: 0 });
      });
    },
    [clampPan],
  );

  // Mirror view, helps spot lopsided drawings.
  const toggleFlip = useCallback(() => {
    setView((prev) => ({ ...prev, flipped: !prev.flipped }));
  }, []);

  const panBy = useCallback((dx: number, dy: number) => {
    setView((prev) => clampPan({ ...prev, panX: prev.panX + dx, panY: prev.panY + dy }));
  }, [clampPan]);

  const reset = useCallback(() => setView(DEFAULT_VIEW), []);

  // Arrow-button / arrow-key pans animate briefly so the jump is easy to follow.
  const [smooth, setSmooth] = useState(false);
  const smoothTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const nudge = useCallback(
    (dir: PanDirection) => {
      const win = viewportRef.current?.querySelector<HTMLElement>("[data-canvas-window]");
      if (!win) return;
      const sx = win.clientWidth * 0.4;
      const sy = win.clientHeight * 0.4;
      setSmooth(true);
      if (smoothTimer.current) clearTimeout(smoothTimer.current);
      smoothTimer.current = setTimeout(() => setSmooth(false), 220);
      if (dir === "up") panBy(0, sy);
      else if (dir === "down") panBy(0, -sy);
      else if (dir === "left") panBy(sx, 0);
      else panBy(-sx, 0);
    },
    [panBy],
  );

  useEffect(
    () => () => {
      if (smoothTimer.current) clearTimeout(smoothTimer.current);
    },
    [],
  );

  // Re-apply the pan limit when the viewport changes size (window resize, rotation).
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const observer = new ResizeObserver(() => setView((v) => clampPan(v)));
    observer.observe(el);
    return () => observer.disconnect();
  }, [clampPan]);

  // Wheel: pinch / ctrl+wheel zooms, two-finger scroll pans.

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    const LATCH_MS = 250;
    let latch: { target: "canvas" | "page"; until: number } | null = null;
    let pointerDown = false;
    const onDown = () => (pointerDown = true);
    const onUp = () => (pointerDown = false);

    const onWheel = (e: WheelEvent) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        zoomBy(Math.exp(-e.deltaY * 0.01), e.clientX, e.clientY);
        return;
      }
      if (pointerDown) {
        e.preventDefault();
        return;
      }
      const v = viewRef.current;
      const dx = -e.deltaX;
      const dy = -e.deltaY;
      const canX = (dx > 0 && v.panX < v.limitX - 0.5) || (dx < 0 && v.panX > -v.limitX + 0.5);
      const canY = (dy > 0 && v.panY < v.limitY - 0.5) || (dy < 0 && v.panY > -v.limitY + 0.5);

      const now = performance.now();
      if (!latch || now > latch.until) {
        latch = { target: canX || canY ? "canvas" : "page", until: 0 };
      }
      latch.until = now + LATCH_MS;

      if (latch.target === "page") return;
      e.preventDefault();
      if (canX || canY) panBy(canX ? dx : 0, canY ? dy : 0);
    };
    const onTouch = (e: TouchEvent) => {
      const t = e.target as Element | null;
      if (t?.closest("[data-canvas-window]") && !t.closest("button")) e.preventDefault();
    };
    // React's onWheel is passive, so preventDefault needs a native listener.
    el.addEventListener("wheel", onWheel, { passive: false });
    el.addEventListener("touchstart", onTouch, { passive: false });
    el.addEventListener("touchmove", onTouch, { passive: false });
    el.addEventListener("pointerdown", onDown);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      el.removeEventListener("wheel", onWheel);
      el.removeEventListener("touchstart", onTouch);
      el.removeEventListener("touchmove", onTouch);
      el.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [zoomBy, panBy]);

  // Drag to pan (hand tool, Space, middle mouse).

  const [spaceHeld, setSpaceHeld] = useState(false);
  const spaceRef = useRef(false);
  const [panning, setPanning] = useState(false);
  const panState = useRef<{ id: number; x: number; y: number } | null>(null);

  const wantsPan = (e: ReactPointerEvent, handTool: boolean) =>
    handTool || spaceRef.current || (e.pointerType === "mouse" && e.button === 1);

  const onPanStart = (e: ReactPointerEvent<HTMLElement>) => {
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {}
    panState.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    setPanning(true);
  };

  const onPanMove = (e: ReactPointerEvent<HTMLElement>) => {
    const p = panState.current;
    if (!p || p.id !== e.pointerId) return;
    panBy(e.clientX - p.x, e.clientY - p.y);
    p.x = e.clientX;
    p.y = e.clientY;
  };

  const onPanEnd = (e: ReactPointerEvent<HTMLElement>) => {
    if (panState.current?.id !== e.pointerId) return;
    panState.current = null;
    setPanning(false);
  };

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isTypingTarget(e.target) || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.code === "Space") {
        // Let Space still activate a focused button (keyboard accessibility).
        if ((e.target as HTMLElement | null)?.closest?.("button, a, [role='button']")) return;
        e.preventDefault();
        if (!spaceRef.current) {
          spaceRef.current = true;
          setSpaceHeld(true);
        }
      } else if (e.key === "r" || e.key === "R") {
        rotateBy(e.shiftKey ? -ROTATE_STEP : ROTATE_STEP);
      } else if (e.key === "=" || e.key === "+") {
        zoomBy(ZOOM_STEP);
      } else if (e.key === "-" || e.key === "_") {
        zoomBy(1 / ZOOM_STEP);
      } else if (e.key === "f" || e.key === "F") {
        toggleFlip();
      } else if (e.key === "0") {
        reset();
      } else if (e.key.startsWith("Arrow")) {
        const dir = e.key.slice(5).toLowerCase() as PanDirection;
        const v = viewRef.current;
        const canPan =
          (dir === "up" || dir === "down" ? v.limitY : v.limitX) > 0.5;
        // Only grab arrow keys if there's something to pan to.
        if (canPan && !(e.target as HTMLElement | null)?.closest?.("button, a, input, select, textarea")) {
          e.preventDefault();
          nudge(dir);
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === "Space") {
        spaceRef.current = false;
        setSpaceHeld(false);
      }
    };
    const onBlur = () => {
      spaceRef.current = false;
      setSpaceHeld(false);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [rotateBy, zoomBy, reset, nudge, toggleFlip]);

  const transform = `translate(-50%, -50%) translate(${view.panX}px, ${view.panY}px) rotate(${view.rotation}deg) scale(${view.flipped ? -view.zoom : view.zoom}, ${view.zoom})`;
  const overflow = {
    up: view.panY < view.limitY - 0.5,
    down: view.panY > -view.limitY + 0.5,
    left: view.panX < view.limitX - 0.5,
    right: view.panX > -view.limitX + 0.5,
  };

  const isDefault =
    view.zoom === 1 &&
    view.rotation === 0 &&
    !view.flipped &&
    view.panX === 0 &&
    view.panY === 0;

  return {
    viewportRef,
    view,
    viewRef,
    transform,
    smooth,
    overflow,
    nudge,
    isInWindow,
    isDefault,
    spaceHeld,
    panning,
    wantsPan,
    onPanStart,
    onPanMove,
    onPanEnd,
    zoomIn: () => zoomBy(ZOOM_STEP),
    zoomOut: () => zoomBy(1 / ZOOM_STEP),
    toggleFlip,
    rotateLeft: () => rotateBy(-ROTATE_STEP),
    rotateRight: () => rotateBy(ROTATE_STEP),
    reset,
    canZoomIn: view.zoom < MAX_ZOOM * view.fitZoom - 1e-6,
    canZoomOut: view.zoom > view.fitZoom + 1e-6,
    /** 100% = whole canvas fits */
    zoomPercent: Math.round((view.zoom / view.fitZoom) * 100),
  };
}
