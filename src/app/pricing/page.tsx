import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { Pricing } from "@/components/landing/Pricing";
import { SiteFooter } from "@/components/landing/SiteFooter";

export const metadata: Metadata = { title: "Pricing" };

// Dedicated pricing page in the split style of /auth: plans on the left, an
// abstract flowing-orange art panel on the right. Drop the artwork in as
// public/pricing-art.jpg to use the exact image; a CSS recreation renders
// until then.
export default function PricingPage() {
  const hasArt = fs.existsSync(
    path.join(process.cwd(), "public", "pricing-art.jpg"),
  );

  return (
    <div className="flex min-h-dvh flex-col bg-void">
      <div className="flex flex-1">
        {/* ── Left: plans ── */}
        <div className="flex w-full flex-col px-6 py-6 lg:w-[54%] lg:shrink-0">
          <div className="flex items-center justify-between">
            <Link href="/" aria-label="Lore home">
              <Logo />
            </Link>
            <Link
              href="/dashboard"
              className="text-sm text-dusk transition-colors hover:text-cream"
            >
              Back to the app
            </Link>
          </div>

          <div className="mx-auto w-full max-w-xl flex-1 py-12">
            <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-amber">
              Pricing
            </p>
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-cream sm:text-5xl">
              One tutor.{" "}
              <span className="italic text-amber">Three paces.</span>
            </h1>
            <p className="mt-4 max-w-lg text-sm leading-relaxed text-dusk sm:text-base">
              Choose how much study time you need now, and upgrade when exams
              heat up. Every plan is the full Lore — nothing core is held
              back.
            </p>
            <div className="mt-10">
              <Pricing layout="stack" />
            </div>
          </div>
        </div>

        {/* ── Right: flowing orange art ── */}
        <div className="relative hidden flex-1 lg:block">
          <div className="sticky top-0 h-dvh overflow-hidden">
            {hasArt ? (
              <Image
                src="/pricing-art.jpg"
                alt=""
                fill
                priority
                sizes="46vw"
                className="object-cover"
              />
            ) : (
              <FlowArt />
            )}
          </div>
        </div>
      </div>

      <SiteFooter />
    </div>
  );
}

// ── CSS recreation of the flowing-orange artwork ───────────────────
// Soft molten curves of orange light on black, in the brand's warm range.
// Shown until public/pricing-art.jpg exists.
function FlowArt() {
  return (
    <div aria-hidden className="absolute inset-0 bg-black">
      {/* upper band */}
      <div
        className="absolute"
        style={{
          left: "-15%",
          top: "2%",
          width: "85%",
          height: "16%",
          background:
            "linear-gradient(180deg, rgba(255,210,150,0.65) 0%, rgba(240,127,34,0.55) 45%, transparent 100%)",
          filter: "blur(34px)",
          transform: "rotate(-4deg)",
        }}
      />
      {/* upper-right wave crest */}
      <div
        className="absolute"
        style={{
          right: "-25%",
          top: "12%",
          width: "95%",
          height: "42%",
          borderRadius: "50%",
          background:
            "radial-gradient(55% 45% at 50% 88%, rgba(240,127,34,0.85) 0%, rgba(160,80,20,0.35) 55%, transparent 75%)",
          filter: "blur(26px)",
          transform: "rotate(14deg)",
        }}
      />
      {/* mid highlight streak */}
      <div
        className="absolute"
        style={{
          left: "-10%",
          top: "46%",
          width: "110%",
          height: "9%",
          background:
            "linear-gradient(90deg, rgba(255,220,170,0.55) 0%, rgba(240,127,34,0.6) 40%, rgba(120,55,12,0.25) 80%, transparent 100%)",
          filter: "blur(28px)",
          transform: "rotate(-6deg)",
        }}
      />
      {/* lower molten curve */}
      <div
        className="absolute"
        style={{
          left: "-20%",
          bottom: "-12%",
          width: "115%",
          height: "58%",
          borderRadius: "50%",
          background:
            "radial-gradient(60% 50% at 55% 22%, rgba(245,150,60,0.9) 0%, rgba(200,90,18,0.5) 45%, rgba(90,40,10,0.25) 70%, transparent 85%)",
          filter: "blur(30px)",
          transform: "rotate(-10deg)",
        }}
      />
      {/* deep shadow pockets */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(45% 30% at 30% 30%, rgba(0,0,0,0.85) 0%, transparent 70%), radial-gradient(40% 28% at 70% 72%, rgba(0,0,0,0.8) 0%, transparent 70%)",
        }}
      />
      {/* edge vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 85% 80% at 50% 50%, transparent 55%, rgba(0,0,0,0.75) 100%)",
        }}
      />
    </div>
  );
}
