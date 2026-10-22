"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PROFILE_PICTURE_SIZE } from "@/lib/pixel/constants";
import { useMyProfile } from "@/lib/useMyProfile";
import { BitmapImage } from "./BitmapImage";
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

        <ProfileLink pathname={pathname} />
      </div>
    </header>
  );
}

/** Your drawn profile picture once you have a profile, otherwise "Join". */
function ProfileLink({ pathname }: { pathname: string }) {
  const { loading, profile } = useMyProfile();

  // Same size as the picture, so the header doesn't jump when it loads.
  if (loading) return <span aria-hidden className="ml-auto size-9 rounded-xl bg-white/15" />;

  if (!profile) {
    return (
      <Link href="/signin" aria-current={pathname === "/signin" ? "page" : undefined} className="nav-link ml-auto">
        <SignInIcon size={19} />
        <span className="hidden sm:inline">Join</span>
        <span className="sr-only sm:hidden">Make your profile</span>
      </Link>
    );
  }

  return (
    <Link
      href={`/u/${profile.handle}`}
      aria-current={pathname === `/u/${profile.handle}` ? "page" : undefined}
      className="nav-link ml-auto py-1! pl-1!"
      title={`@${profile.handle}`}
      aria-label={`Your profile, @${profile.handle}`}
    >
      <span className="block size-8 overflow-hidden rounded-lg border-2 border-white bg-white">
        <BitmapImage
          data={profile.avatar}
          width={PROFILE_PICTURE_SIZE}
          height={PROFILE_PICTURE_SIZE}
          label={`Your profile, ${profile.display_name}`}
        />
      </span>
      <span className="hidden max-w-32 truncate sm:inline">{profile.display_name}</span>
    </Link>
  );
}
