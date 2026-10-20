import type { Metadata } from "next";
import { Nunito, Pixelify_Sans } from "next/font/google";
import { SiteFooter } from "@/components/ui/SiteFooter";
import { SiteHeader } from "@/components/ui/SiteHeader";
import "./globals.css";

const pixel = Pixelify_Sans({
  subsets: ["latin"],
  variable: "--font-pixel",
});

const body = Nunito({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: {
    default: "Doodle Plaza",
    template: "%s · Doodle Plaza",
  },
  description: "A pixel-art social plaza where every post is hand-drawn.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${pixel.variable} ${body.variable}`}>
      <body className="flex min-h-dvh flex-col antialiased">
        <a
          href="#main"
          className="sr-only z-50 rounded-full bg-white px-4 py-2 font-bold focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
        >
          Skip to content
        </a>
        <SiteHeader />
        <main id="main" className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
