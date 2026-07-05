import fs from "node:fs";
import path from "node:path";
import type { Metadata } from "next";
import Image from "next/image";
import { Logo } from "@/components/Logo";
import { SiteFooter } from "@/components/landing/SiteFooter";
import { WaitlistForm } from "@/components/landing/WaitlistForm";

export const metadata: Metadata = { title: "Join the waitlist" };

// Dedicated waitlist page: an art card on the left (drop the artwork in as
// public/waitlist-art.jpg to use the exact image; a CSS recreation of the
// orange swirl renders until then), the signup form on the right, and a
// mini footer. Fully static — the only client island is WaitlistForm.
export default function WaitlistPage() {
  const hasArt = fs.existsSync(
    path.join(process.cwd(), "public", "waitlist-art.jpg"),
  );

  return (
    <div className="flex min-h-dvh flex-col bg-void">
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-5 py-6 lg:flex-row lg:items-stretch lg:gap-14 sm:px-8">
        {/* ── Art card ── */}
        <section className="relative min-h-[420px] overflow-hidden rounded-3xl border border-line lg:min-h-[560px] lg:w-[44%] lg:shrink-0">
          {hasArt ? (
            <Image
              src="/waitlist-art.jpg"
              alt=""
              fill
              priority
              sizes="(min-width: 1024px) 44vw, 100vw"
              className="object-cover"
            />
          ) : (
            <SwirlArt />
          )}

          {/* overlay chrome */}
          <div className="absolute left-5 top-5">
            <Logo />
          </div>
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 via-black/35 to-transparent px-6 pb-6 pt-20 sm:px-7 sm:pb-7">
            <span className="inline-flex items-center gap-2 rounded-full border border-cream/25 bg-void/40 px-3 py-1 text-xs font-medium text-cream backdrop-blur">
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              Opening soon
            </span>
            <h2 className="mt-4 font-serif text-3xl leading-tight text-cream sm:text-4xl">
              Be the first when
              <br />
              the doors <span className="italic text-amber">open</span>.
            </h2>
            <p className="mt-2 max-w-sm text-sm leading-relaxed text-cream/70">
              Drop your email and we&rsquo;ll reach out the moment Lore goes
              live — no noise, just the signal.
            </p>
          </div>
        </section>

        {/* ── Form column ── */}
        <section className="flex flex-1 items-center justify-center py-6 lg:py-0">
          <div className="w-full max-w-md text-center">
            <h1 className="font-serif text-4xl leading-tight tracking-tight text-cream sm:text-5xl">
              Join the <span className="italic text-amber">waitlist</span>
            </h1>
            <p className="mt-3 text-sm text-dusk">
              Be first in line — we&rsquo;ll notify you the moment we launch.
            </p>
            <div className="mt-8">
              <WaitlistForm />
            </div>
            <p className="mt-4 text-xs text-faint">
              No spam. Unsubscribe any time.
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}

// ── CSS recreation of the orange swirl artwork ─────────────────────
// A glowing torus emerging from darkness, in the brand's amber family.
// Shown until public/waitlist-art.jpg exists.
function SwirlArt() {
  return (
    <div aria-hidden className="absolute inset-0 overflow-hidden bg-[#0a0705]">
      {/* outer ring */}
      <div
        className="absolute"
        style={{
          left: "-35%",
          top: "50%",
          width: "130%",
          aspectRatio: "1",
          transform: "translateY(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, transparent 34%, rgba(200,90,18,0.55) 42%, rgba(240,127,34,0.9) 48%, rgba(255,176,77,0.95) 51%, rgba(200,90,18,0.7) 56%, transparent 68%)",
          filter: "blur(18px)",
        }}
      />
      {/* inner bright arc */}
      <div
        className="absolute"
        style={{
          left: "-12%",
          top: "50%",
          width: "84%",
          aspectRatio: "1",
          transform: "translateY(-50%)",
          borderRadius: "50%",
          background:
            "radial-gradient(circle, transparent 44%, rgba(255,210,122,0.9) 50%, rgba(240,127,34,0.8) 54%, transparent 62%)",
          filter: "blur(6px)",
        }}
      />
      {/* warm ambient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 30% 50%, rgba(212,120,40,0.18) 0%, transparent 65%)",
        }}
      />
      {/* vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 90% 80% at 40% 50%, transparent 50%, rgba(0,0,0,0.85) 100%)",
        }}
      />
    </div>
  );
}
