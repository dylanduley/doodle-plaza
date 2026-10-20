// Canvas sizes and palette limits, see docs/decisions.md

export const CANVAS_WIDTH = 320;
export const CANVAS_HEIGHT = 120;

export const PROFILE_PICTURE_SIZE = 120;

export const ANIMATION_WIDTH = 320;
export const ANIMATION_HEIGHT = 180;

// Index 0 = paper (the eraser paints 0).
export const PAPER = 0;

export type PaletteColor = {
  name: string;
  hex: string;
};

export const PALETTE: readonly PaletteColor[] = [
  { name: "Paper", hex: "#ffffff" },
  { name: "Ink", hex: "#1d1b22" },
  { name: "Red", hex: "#e2463f" },
  { name: "Blue", hex: "#2f6fdb" },
] as const;

export const BRUSH_SIZES = [1, 2, 4] as const;
export type BrushSize = (typeof BRUSH_SIZES)[number];

// ~38 KB each at 320x120
export const HISTORY_LIMIT = 50;
