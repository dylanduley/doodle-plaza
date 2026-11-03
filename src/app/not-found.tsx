import Link from "next/link";
import { HomeIcon } from "@/components/ui/icons";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center">
      <h1 className="page-title text-5xl">404</h1>
      <p className="text-lg font-bold">We looked everywhere, but this page could not be found.</p>
      <Link href="/" className="btn btn-primary">
        <HomeIcon size={18} /> Back to the plaza
      </Link>
    </div>
  );
}
