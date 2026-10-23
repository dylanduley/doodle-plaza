"use client";

import type { ReactNode } from "react";
import type { Bitmap } from "@/lib/pixel/bitmap";
import { BRUSH_SIZES, CANVAS_HEIGHT, CANVAS_WIDTH, PALETTE } from "@/lib/pixel/constants";
import {
  DownloadIcon,
  EraserIcon,
  FillIcon,
  FitIcon,
  FlipIcon,
  HandIcon,
  PenIcon,
  RedoIcon,
  RotateLeftIcon,
  RotateRightIcon,
  TrashIcon,
  UndoIcon,
  ZoomInIcon,
  ZoomOutIcon,
} from "./icons";
import { AnimationBar } from "./AnimationBar";
import { Tile } from "./Tile";
import { type PanDirection, useCanvasView } from "./useCanvasView";
import { useDrawingEditor } from "./useDrawingEditor";

export type EditorApi = {
  blank: boolean;
  /** Read it on submit; don't hold onto it. */
  getBitmap: () => Bitmap;
  getFrames: () => Bitmap[];
  fps: number;
  animated: boolean;
};

type Props = {
  width?: number;
  height?: number;
  footer?: (api: EditorApi) => ReactNode;
  animated?: boolean;
  /** only read on mount */
  initial?: Bitmap;
};

const SIZE_ICON = [14, 19, 25] as const;
const SIZE_NAME = ["small", "medium", "large"] as const;

export function DrawingEditor({
  width = CANVAS_WIDTH,
  height = CANVAS_HEIGHT,
  footer,
  animated = false,
  initial,
}: Props) {
  // Refs kept separate from render data (React Compiler lint).
  const { viewportRef, viewRef, ...view } = useCanvasView();
  const { canvasRef, ...editor } = useDrawingEditor({ width, height, viewRef, animated, initial });

  const download = async () => {
    const blob = await editor.toPngBlob(4);
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "doodle.png";
    a.click();
    URL.revokeObjectURL(url);
  };

  const wideCanvas = width / (height + 28) >= 2;
  const sideways = width !== height && Math.abs(view.view.rotation) % 180 === 90;
  const [boxW, boxH] = sideways ? [height, width] : [width, height];
  const handActive = editor.tool === "hand" || view.spaceHeld;
  const cursor = view.panning
    ? "grabbing"
    : handActive
      ? "grab"
      : editor.tool === "fill"
        ? "cell"
        : "crosshair";

  return (
    <div className="flex flex-col gap-3">
      <div className="editor-frame">
        <div role="toolbar" aria-label="Drawing tools" className="flex flex-wrap items-center gap-2.5">
          <Tile label="Undo" badge="⌘Z" onClick={editor.undo} disabled={!editor.canUndo}>
            <UndoIcon size={28} />
          </Tile>
          <Tile label="Redo" badge="⇧⌘Z" onClick={editor.redo} disabled={!editor.canRedo}>
            <RedoIcon size={28} />
          </Tile>

          <div className="tray" role="group" aria-label="View">
            <Tile small label="Zoom out" badge="−" onClick={view.zoomOut} disabled={!view.canZoomOut}>
              <ZoomOutIcon size={22} />
            </Tile>
            <button
              type="button"
              className="tile tile-small w-16 text-sm font-bold tabular-nums"
              onClick={view.reset}
              title="Reset view (0)"
              aria-label={`Zoom ${view.zoomPercent}%. Reset view`}
            >
              {view.zoomPercent}%
            </button>
            <Tile small label="Zoom in" badge="+" onClick={view.zoomIn} disabled={!view.canZoomIn}>
              <ZoomInIcon size={22} />
            </Tile>
            <Tile small label="Rotate left" badge="⇧R" onClick={view.rotateLeft}>
              <RotateLeftIcon size={22} />
            </Tile>
            <Tile small label="Rotate right" badge="R" onClick={view.rotateRight}>
              <RotateRightIcon size={22} />
            </Tile>
            <Tile
              small
              label="Flip view"
              badge="F"
              pressed={view.view.flipped}
              onClick={view.toggleFlip}
            >
              <FlipIcon size={22} />
            </Tile>
            <Tile small label="Reset view" badge="0" onClick={view.reset} disabled={view.isDefault}>
              <FitIcon size={22} />
            </Tile>
          </div>

          <div className="tray" role="group" aria-label="Brushes">
            {BRUSH_SIZES.map((size, i) => (
              <div key={size} className="pair">
                <button
                  type="button"
                  className="seg"
                  aria-label={`Eraser, ${SIZE_NAME[i]}`}
                  title={`Eraser, ${SIZE_NAME[i]} (E)`}
                  aria-pressed={editor.tool === "eraser" && editor.brushSize === size}
                  onClick={() => editor.selectBrush("eraser", size)}
                >
                  <EraserIcon size={SIZE_ICON[i]} />
                </button>
                <button
                  type="button"
                  className="seg"
                  aria-label={`Pen, ${SIZE_NAME[i]}`}
                  title={`Pen, ${SIZE_NAME[i]} (B)`}
                  aria-pressed={editor.tool === "pen" && editor.brushSize === size}
                  onClick={() => editor.selectBrush("pen", size)}
                >
                  <PenIcon size={SIZE_ICON[i]} />
                </button>
              </div>
            ))}
          </div>

          <div className="tray" role="group" aria-label="Other tools">
            <Tile
              small
              label="Fill"
              badge="G"
              pressed={editor.tool === "fill"}
              onClick={() => editor.setTool("fill")}
            >
              <FillIcon size={22} />
            </Tile>
            <Tile
              small
              label="Hand (pan)"
              badge="H"
              pressed={editor.tool === "hand"}
              onClick={() => editor.setTool("hand")}
            >
              <HandIcon size={22} />
            </Tile>
          </div>
        </div>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row">
          {/* Viewport: pointer events land here so strokes can start off the canvas edge */}
          <div
            ref={viewportRef}
            // Square canvases get a fixed wide stage so they don't get too tall.
            className={sideways ? "viewport viewport-tall" : wideCanvas ? "viewport" : "viewport viewport-compact"}
            style={{
              aspectRatio: sideways ? `${height + 40} / ${width + 28}` : wideCanvas ? width / (height + 28) : undefined,
              cursor,
            }}
            onPointerDown={(e) => {
              if (view.wantsPan(e, editor.tool === "hand")) view.onPanStart(e);
              // Don't paint parts of the canvas that are hidden while zoomed in.
              else if (view.isInWindow(e.clientX, e.clientY)) editor.onPointerDown(e);
            }}
            onPointerMove={(e) => {
              view.onPanMove(e);
              editor.onPointerMove(e);
            }}
            onPointerUp={(e) => {
              view.onPanEnd(e);
              editor.onPointerEnd(e);
            }}
            onPointerCancel={(e) => {
              view.onPanEnd(e);
              editor.onPointerEnd(e);
            }}
            onContextMenu={(e) => e.preventDefault()}
            onLostPointerCapture={(e) => {
              view.onPanEnd(e);
              editor.onPointerEnd(e);
            }}
          >
            {/* Fixed-size window onto the canvas. Zooming happens inside it, and
                arrow bars show which directions have more drawing hidden. */}
            <div
              data-canvas-window
              className="canvas-window"
              style={{
                // Fit inside the stage in both directions, leaving a small margin
                width: `min(94cqw, ${((88 * boxW) / boxH).toFixed(2)}cqh)`,
                aspectRatio: `${boxW} / ${boxH}`,
              }}
            >
              <canvas
                ref={canvasRef}
                width={width}
                height={height}
                role="img"
                aria-label={editor.blank ? "Empty drawing canvas" : "Your drawing"}
                className="pixel-canvas absolute top-1/2 left-1/2 w-full"
                style={{
                  aspectRatio: `${width} / ${height}`,
                  width: sideways ? "100cqh" : undefined,
                  transform: view.transform,
                  transition: view.smooth ? "transform 200ms ease-out" : undefined,
                }}
              />
              {editor.playing && (
                <p className="absolute top-2 left-2 z-20 rounded-full bg-ink/75 px-3 py-1 text-xs font-bold text-white">
                  ▶ Playing · pause to draw
                </p>
              )}
              {(Object.keys(view.overflow) as PanDirection[]).map((dir) =>
                view.overflow[dir] ? (
                  <button
                    key={dir}
                    type="button"
                    className={`pan-arrow pan-arrow-${dir}`}
                    aria-label={`Scroll canvas ${dir}`}
                    title={`Scroll ${dir} (arrow keys)`}
                    // Don't let a tap on the arrow start a stroke underneath it
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => view.nudge(dir)}
                  >
                    <svg width="22" height="12" viewBox="0 0 22 12" aria-hidden className="pan-arrow-icon">
                      <path d="M11 0 22 12H0Z" fill="currentColor" />
                    </svg>
                  </button>
                ) : null,
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 sm:flex-col sm:justify-start">
            <div className="tray sm:flex-col" role="group" aria-label="Ink color">
              {PALETTE.slice(1).map((c, i) => {
                const index = i + 1;
                return (
                  <button
                    key={c.name}
                    type="button"
                    className="swatch"
                    aria-label={`${c.name} ink (${index})`}
                    title={`${c.name} (${index})`}
                    aria-pressed={editor.color === index}
                    onClick={() => {
                      editor.setColor(index);
                      if (editor.tool === "eraser" || editor.tool === "hand") editor.setTool("pen");
                    }}
                    style={{ backgroundColor: c.hex }}
                  />
                );
              })}
            </div>
            <div className="ml-auto flex gap-2 sm:ml-0 sm:mt-auto sm:flex-col">
              <Tile
                small
                label={animated ? "Clear this frame" : "Clear canvas"}
                onClick={editor.clear}
                disabled={editor.blank}
              >
                <TrashIcon size={22} />
              </Tile>
              <Tile
                small
                label={animated ? "Save this frame as PNG" : "Save PNG"}
                onClick={download}
                disabled={editor.blank}
              >
                <DownloadIcon size={22} />
              </Tile>
            </div>
          </div>
        </div>

        {animated && (
          <AnimationBar
            frames={editor.frames}
            current={editor.current}
            playing={editor.playing}
            fps={editor.fps}
            onion={editor.onion}
            canRestoreFrame={editor.canRestoreFrame}
            onSelect={editor.goToFrame}
            onAdd={editor.addFrame}
            onDelete={editor.deleteFrame}
            onRestore={editor.restoreFrame}
            onMove={editor.moveFrame}
            onTogglePlay={editor.togglePlay}
            onToggleOnion={editor.toggleOnion}
            onFps={editor.setFps}
          />
        )}
      </div>

      <p className="text-sm text-muted">
        {width}×{height} pixels. Pinch or ⌘/Ctrl + scroll to zoom. Scroll, hold Space, or use the
        arrow keys to pan. R turns a quarter turn, F flips, 0 resets the view. [ and ] change brush
        size.
      </p>

      {footer?.({
        blank: editor.allBlank,
        getBitmap: editor.getBitmap,
        getFrames: editor.getFrames,
        fps: editor.fps,
        animated,
      })}
    </div>
  );
}

