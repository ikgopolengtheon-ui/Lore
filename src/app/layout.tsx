import type { Metadata, Viewport } from "next";
import { Fraunces, Shantell_Sans, Permanent_Marker } from "next/font/google";
import "./globals.css";

// Wordmark + editorial serif (PRD §8.2 — replaces Playfair Display)
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  display: "swap",
});

// Whiteboard handwritten body (PRD §6.4 — replaces Caveat)
const shantell = Shantell_Sans({
  variable: "--font-shantell",
  subsets: ["latin"],
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

// Whiteboard headings / emphasis (PRD §6.4 — replaces Kalam)
const marker = Permanent_Marker({
  variable: "--font-marker",
  subsets: ["latin"],
  display: "swap",
  weight: "400",
});

const TITLE = "Lore — Your notes. Finally explained.";
const DESCRIPTION =
  "A voice-first AI study companion that answers only from your own uploaded material. Upload your notes, hold the mic, ask anything.";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ??
      (process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : "http://localhost:3000"),
  ),
  title: { default: TITLE, template: "%s · Lore" },
  description: DESCRIPTION,
  applicationName: "Lore",
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Lore",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#0c0b09",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${shantell.variable} ${marker.variable} h-full`}
    >
      <body className="min-h-full antialiased">
        {/* Switzer is served from Fontshare (globals.css @font-face); warm the
            connection so the body font doesn't wait on a cold TLS handshake. */}
        <link
          rel="preconnect"
          href="https://api.fontshare.com"
          crossOrigin="anonymous"
        />
        <link
          rel="preconnect"
          href="https://cdn.fontshare.com"
          crossOrigin="anonymous"
        />
        {children}
      </body>
    </html>
  );
}
