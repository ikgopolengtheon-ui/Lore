import type { Metadata } from "next";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Pricing } from "@/components/landing/Pricing";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const metadata: Metadata = { title: "Pricing" };

// Dedicated pricing page — same tier cards as the landing #pricing section,
// with the shared marketing footer.
export default function PricingPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-void">
      <header className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-5 sm:px-8">
        <Link href="/" aria-label="Lore home">
          <Logo />
        </Link>
        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/dashboard"
            className="hidden rounded-full px-3 py-2 text-sm text-dusk transition-colors hover:text-cream sm:block"
          >
            Try the demo
          </Link>
          <Link
            href="/waitlist"
            className="rounded-full bg-amber px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
          >
            Join waitlist
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-5 pb-24 pt-12 sm:px-8 sm:pt-16">
        <div className="mx-auto max-w-2xl text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber">
            Pricing
          </p>
          <h1 className="font-serif text-4xl leading-tight tracking-tight text-cream sm:text-5xl">
            One tutor.{" "}
            <span className="italic text-amber">Three paces.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-relaxed text-dusk sm:text-base">
            Choose how much study time you need now, and upgrade when exams
            heat up. Every plan is the full Lore — nothing core is held back.
          </p>
        </div>
        <div className="mt-16">
          <Pricing />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
