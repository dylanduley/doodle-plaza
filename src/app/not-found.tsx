import Link from "next/link";
import { HomeIcon } from "@/components/ui/icons";
import { Mascot } from "@/components/ui/Mascot";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-xl flex-col items-center gap-4 py-10 text-center">
      <Mascot size={96} />
      <h1 className="font-display text-5xl text-leaf-deep">404</h1>
      <p className="text-lg font-bold">Pip looked everywhere, but this page could not be found.</p>
      <Link href="/" className="btn btn-primary">
        <HomeIcon size={18} /> Back to the plaza
      </Link>
    </div>
  );
}
