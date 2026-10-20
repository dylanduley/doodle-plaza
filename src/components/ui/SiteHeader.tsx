"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { HomeIcon, PencilIcon, PlazasIcon, SignInIcon } from "./icons";
import { Mascot } from "./Mascot";

const NAV = [
  { href: "/", label: "Plaza", icon: HomeIcon, match: (p: string) => p === "/" },
  { href: "/plazas", label: "Plazas", icon: PlazasIcon, match: (p: string) => p.startsWith("/plazas") },
  { href: "/draw", label: "Draw", icon: PencilIcon, match: (p: string) => p.startsWith("/draw") },
];

export function SiteHeader() {
  const pathname = usePathname();
  return (
    <header className="site-header">
      <div className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-2.5 sm:gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Doodle Plaza home">
          <Mascot size={36} />
          <span className="logo-text hidden text-2xl sm:inline">Doodle Plaza</span>
        </Link>

        <nav aria-label="Main" className="flex min-w-0 items-center gap-0.5 sm:ml-4 sm:gap-1">
          {NAV.map(({ href, label, icon: NavIcon, match }) => (
            <Link
              key={href}
              href={href}
              aria-current={match(pathname) ? "page" : undefined}
              className="nav-link"
            >
              <NavIcon size={19} />
              <span>{label}</span>
            </Link>
          ))}
        </nav>

        <Link
          href="/signin"
          aria-current={pathname === "/signin" ? "page" : undefined}
          className="nav-link ml-auto"
        >
          <SignInIcon size={19} />
          <span className="hidden sm:inline">Sign in</span>
          <span className="sr-only sm:hidden">Sign in</span>
        </Link>
      </div>
    </header>
  );
}
