"use client";

import Link from "next/link";
import { useEffect } from "react";
import { HomeIcon } from "@/components/ui/icons";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center" role="alert">
      <h1 className="page-title">Something went wrong</h1>
      <p className="text-lg font-bold">We tripped over a pixel. Your saved doodles are safe.</p>
      <div className="flex flex-wrap justify-center gap-3">
        <button type="button" className="btn btn-primary" onClick={reset}>
          Try again
        </button>
        <Link href="/" className="btn">
          <HomeIcon size={18} /> Back to the plaza
        </Link>
      </div>
    </div>
  );
}
