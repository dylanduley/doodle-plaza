import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="mt-12 border-t-4 border-white/70 bg-leaf-dark/90 text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-2 px-4 py-6 text-sm sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-display text-base">Doodle Plaza</span> · a portfolio project by{" "}
          <Link href="https://github.com/dylanduley" className="font-bold underline">
            Dylan Duley
          </Link>
        </p>
        <p className="text-white">
          Inspired by Miiverse &amp; Flipnote. Not affiliated with Nintendo.
        </p>
      </div>
    </footer>
  );
}
