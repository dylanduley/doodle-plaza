// Pip the turtle, 32x32 pixel art (cropped)
const ROWS = [
  "......................",
  "......................",
  "......................",
  "......................",
  "...KKKK...............",
  "..KHGGGK..............",
  ".KHGGGGGK.............",
  ".KGKGGKGK.KKKKKK......",
  "KGGGKGGGKKBLLBBBK.....",
  "KGKGGGKGKBLBBLBLBK..K.",
  "KGGKKKGGKLBBBBLBBBKKGK",
  ".KGGGGGKKLBBBBLBBBBKGK",
  "..KKKKKLLBLBBLBLBBLKK.",
  "......KKLBBLLBBBLKKK..",
  "......KGKKKKKKKKKK....",
  "......KGDK....KGDK....",
  ".......KK......KK.....",
  "......................",
  "......................",
  "......................",
  "......................",
  "......................",
];

const COLORS: Record<string, string> = {
  K: "#000000", // outline
  G: "#32bf86", // skin
  H: "#73e3b6", // skin highlight
  D: "#1f6247", // skin shadow
  B: "#452828", // shell
  L: "#805c5c", // shell pattern
};

const SIZE = ROWS.length;

export function Mascot({ size = 48, className = "" }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      shapeRendering="crispEdges"
      aria-hidden
      className={className}
    >
      {ROWS.flatMap((row, y) =>
        [...row].map((ch, x) =>
          COLORS[ch] ? <rect key={`${x}-${y}`} x={x} y={y} width={1} height={1} fill={COLORS[ch]} /> : null,
        ),
      )}
    </svg>
  );
}
