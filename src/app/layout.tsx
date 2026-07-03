import type { Metadata } from "next";
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

export const metadata: Metadata = {
  title: "Lore — Your notes. Finally explained.",
  description:
    "A voice-first AI study companion that answers only from your own uploaded material.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${shantell.variable} ${marker.variable} h-full`}
    >
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
