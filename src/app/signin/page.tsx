import type { Metadata } from "next";
import Link from "next/link";
import { PencilIcon } from "@/components/ui/icons";
import { Mascot } from "@/components/ui/Mascot";

export const metadata: Metadata = { title: "Sign in" };

export default function SignInPage() {
  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6">
      <section className="film text-center">
        <Mascot size={80} className="mx-auto drop-shadow-[3px_3px_0_var(--color-leaf-shadow)]" />
        <h1 className="logo-text mt-3 text-4xl">Accounts are coming soon</h1>
        <p className="mx-auto mt-3 max-w-md rounded-xl bg-cream px-4 py-3 text-ink">
          When sign-up opens, your first step will be <strong>drawing your own profile
          picture</strong>. Want to practice? The canvas is open to everyone.
        </p>
        <Link href="/draw/profile" className="btn btn-primary mt-5">
          <PencilIcon size={18} /> Practice your profile picture
        </Link>
      </section>
    </div>
  );
}
