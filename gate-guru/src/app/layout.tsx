import type { Metadata, Viewport } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import Link from "next/link";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const jetbrains = JetBrains_Mono({ variable: "--font-jetbrains", subsets: ["latin"], weight: ["400", "600", "700"] });


export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "Gate Guru — food, lounges & facilities by terminal", template: "%s · Gate Guru" },
  description:
    "Find restaurants, lounges, restrooms, charging and more at your airport, filtered by terminal and by before or after security.",
  applicationName: "Gate Guru",
  openGraph: { type: "website", siteName: "Gate Guru", locale: "en_US" },
  twitter: { card: "summary" },
};

export const viewport: Viewport = { themeColor: "#0b1d3a", width: "device-width", initialScale: 1 };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} antialiased`}>
      <body className="min-h-dvh flex flex-col">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-amber focus:px-4 focus:py-3 focus:text-navy"
        >
          Skip to content
        </a>
        <header className="border-b border-line">
          <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
            <Link href="/" className="flex min-h-11 items-center gap-2 font-mono text-lg font-bold tracking-widest text-amber">
              <span aria-hidden="true" className="inline-block h-3 w-3 rounded-sm bg-amber" />
              GATE GURU
            </Link>
            <span className="font-mono text-xs uppercase tracking-widest text-muted">Departures · Facilities</span>
          </div>
        </header>
        <main id="main" className="mx-auto w-full max-w-3xl flex-1 px-4 pb-16 pt-6">
          {children}
        </main>
        <footer className="border-t border-line">
          <p className="mx-auto max-w-3xl px-4 py-6 text-sm text-muted">
            Information may be out of date. Always check signage at the airport. Spot something wrong? Use “Report an
            issue” on any listing.
          </p>
        </footer>
      </body>
    </html>
  );
}
