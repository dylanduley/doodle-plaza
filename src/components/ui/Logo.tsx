// Doodle Plaza logo: a little robot holding a pencil, 14x11 pixel art
const ROWS = [
  "............XX",
  "...........X.X",
  "..X....X..X.X.",
  "...X..X..XXX..",
  "X.XXXXXX.X....",
  "XX......XX....",
  ".X.X..X.X.....",
  ".X......X.....",
  "..XXXXXX......",
  "..X....X......",
  "...X..X.......",
];

const WIDTH = ROWS[0].length;
const HEIGHT = ROWS.length;

// size is the height in px; the pixels use the current text color
export function Logo({ size = 32, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={Math.round((size * WIDTH) / HEIGHT)}
      height={size}
      viewBox={`0 0 ${WIDTH} ${HEIGHT}`}
      shapeRendering="crispEdges"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      {ROWS.flatMap((row, y) =>
        [...row].map((ch, x) => (ch === "X" ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} /> : null)),
      )}
    </svg>
  );
}
