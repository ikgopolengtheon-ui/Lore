// Premium marketing landing for Lore. This file is a server component: the
// content below is rendered to static HTML and never ships as client JS. All
// motion lives in LandingMotion (client), which animates this markup via
// data-* attributes; WaitlistForm is the only other client island.

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { LandingMotion } from "./LandingMotion";
import { SiteFooter } from "./SiteFooter";
import { WaitlistForm } from "./WaitlistForm";

const HERO_LINE_1 = ["The", "teacher", "you"];

const STEPS: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "upload",
    title: "Upload your material",
    body: "Drop in a PDF, slides, a Word doc, or a photo of your handwritten notes. Lore reads it and indexes it.",
  },
  {
    icon: "mic",
    title: "Hold the mic, ask aloud",
    body: "Press and speak, just like asking a tutor. No typing, no menus — the whole thing is voice.",
  },
  {
    icon: "sparkle",
    title: "Understand it",
    body: "Lore answers in a warm, spoken voice — and writes out equations on a whiteboard for the tricky bits.",
  },
];

const FEATURES: { icon: IconName; title: string; body: string }[] = [
  {
    icon: "doc",
    title: "Answers only from your notes",
    body: "Lore is grounded in your uploaded material and nothing else. No open-web answers, no hallucinations, no contradicting your course.",
  },
  {
    icon: "play",
    title: "A real voice, not a robot",
    body: "Calm, warm, unhurried — like a tutor who has taught this a thousand times and still wants you to get it. Adjustable speed.",
  },
  {
    icon: "whiteboard",
    title: "A whiteboard for the hard stuff",
    body: "For maths, physics, and chemistry, Lore writes equations and derivations step by step as it explains — because voice alone isn't enough.",
  },
  {
    icon: "quiz",
    title: "Quiz yourself",
    body: "Turn any document into active-recall practice. Lore asks, you answer aloud, and it tells you where you stand.",
  },
];

export function Landing() {
  return (
    <LandingMotion>
      <NoiseOverlay />

      {/* ── Nav: floating pill ── */}
      <header data-nav className="fixed inset-x-0 top-4 z-40 px-5 sm:top-6 sm:px-10">
        <nav className="mx-auto flex max-w-4xl items-center justify-between rounded-full border border-line-m bg-carbon/85 py-2 pl-5 pr-2 shadow-lg shadow-black/30 backdrop-blur-md">
          <Logo />
          <div className="flex items-center gap-1 sm:gap-2">
            <a
              href="#how"
              className="hidden rounded-full px-3 py-2 text-sm text-dusk transition-colors hover:text-cream sm:block"
            >
              How it works
            </a>
            <a
              href="#features"
              className="hidden rounded-full px-3 py-2 text-sm text-dusk transition-colors hover:text-cream sm:block"
            >
              Features
            </a>
            <Link
              href="/app"
              className="hidden rounded-full px-3 py-2 text-sm text-dusk transition-colors hover:text-cream md:block"
            >
              Try the demo
            </Link>
            <Link
              href="/waitlist"
              data-magnetic
              className="rounded-full bg-amber px-5 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
            >
              Join waitlist
            </Link>
          </div>
        </nav>
      </header>

      <main>
        {/* ── Hero ── */}
        <section className="relative px-5 pb-20 pt-32 sm:px-8 sm:pt-40">
          <div
            data-parallax
            aria-hidden
            className="pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto h-[560px] max-w-4xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 0%, rgba(212,147,60,0.18) 0%, transparent 62%)",
            }}
          />
          <div className="relative z-10 mx-auto max-w-3xl text-center">
            <span
              data-hero-eyebrow
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-line-m bg-carbon/70 px-3.5 py-1.5 text-xs font-medium text-dusk backdrop-blur"
            >
              <span className="h-1.5 w-1.5 rounded-full bg-amber" />
              Voice-first AI study companion
            </span>

            <h1
              className="font-serif font-normal leading-[1.02] tracking-tight text-cream"
              style={{ fontSize: "clamp(2.75rem, 8.5vw, 5.75rem)" }}
            >
              <span className="block overflow-hidden pb-[0.12em]">
                {HERO_LINE_1.map((w) => (
                  <span
                    key={w}
                    data-hero-word
                    className="mr-[0.22em] inline-block"
                  >
                    {w}
                  </span>
                ))}
              </span>
              <span className="block overflow-hidden pb-[0.12em]">
                <span
                  data-hero-word
                  className="mr-[0.22em] inline-block italic text-amber"
                >
                  never
                </span>
                <span data-hero-word className="inline-block italic text-amber">
                  had.
                </span>
              </span>
            </h1>

            <p
              data-hero-sub
              className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-dusk"
            >
              Upload your notes, hold the mic, and ask anything. Lore explains
              out loud — drawn only from your own material, never the open web.
            </p>

            <div data-hero-form className="mt-9">
              <WaitlistForm />
              <p className="mt-3 text-xs text-faint">
                Join the waitlist — be first when we open. No spam, ever.
              </p>
            </div>

            <div data-hero-wave data-wave className="mt-14">
              <Waveform bars={40} />
            </div>
          </div>
        </section>

        {/* ── Pull quote ── */}
        <section className="border-y border-line bg-depth/40 px-5 py-16 sm:px-8">
          <div data-reveal className="mx-auto max-w-3xl text-center">
            <p className="font-serif text-2xl italic leading-snug text-cream sm:text-3xl">
              “You have nobody to ask at midnight.
              <span className="text-amber"> Lore does.</span>”
            </p>
          </div>
        </section>

        {/* ── How it works ── */}
        <section id="how" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionHeading
            eyebrow="How it works"
            title={
              <>
                Three steps to{" "}
                <span className="italic text-amber">clarity</span>.
              </>
            }
          />
          <div className="mt-14 grid gap-4 md:grid-cols-3">
            {STEPS.map((s, i) => (
              <div
                key={s.title}
                data-reveal
                className="group h-full rounded-2xl border border-line bg-depth p-7 transition-colors hover:border-line-m"
              >
                <div className="flex items-center gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl border border-line-m bg-carbon text-amber transition-transform duration-300 group-hover:-translate-y-0.5">
                    <Icon name={s.icon} size={22} />
                  </span>
                  <span className="font-mono text-xs text-faint">0{i + 1}</span>
                </div>
                <h3 className="mt-5 font-serif text-xl text-cream">{s.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-dusk">
                  {s.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Features ── */}
        <section id="features" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
          <SectionHeading
            eyebrow="Why Lore"
            title={
              <>
                A study partner that has{" "}
                <span className="italic text-amber">
                  read everything you have
                </span>
                .
              </>
            }
          />
          <div className="mt-14 grid gap-4 sm:grid-cols-2">
            {FEATURES.map((f) => (
              <div
                key={f.title}
                data-reveal
                className="group flex h-full gap-4 rounded-2xl border border-line bg-depth p-7 transition-colors hover:border-line-m"
              >
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line-m bg-carbon text-amber transition-transform duration-300 group-hover:-translate-y-0.5">
                  <Icon name={f.icon} size={22} />
                </span>
                <div>
                  <h3 className="font-serif text-xl text-cream">{f.title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-dusk">
                    {f.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Voice section ── */}
        <section className="px-5 py-24 sm:px-8">
          <div
            data-reveal
            className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-line-m bg-carbon px-6 py-16 text-center sm:px-12"
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-2xl"
              style={{
                background:
                  "radial-gradient(ellipse at 50% 0%, rgba(212,147,60,0.14) 0%, transparent 70%)",
              }}
            />
            <div className="relative">
              <div data-wave>
                <Waveform bars={28} />
              </div>
              <h2 className="mx-auto mt-8 max-w-2xl font-serif text-3xl leading-tight text-cream sm:text-4xl">
                The voice <span className="italic text-amber">is</span> the
                product.
              </h2>
              <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-dusk">
                Most apps have a sound. Lore is a sound. Every detail serves
                one feeling — a calm, knowledgeable person sitting beside you,
                explaining until it finally clicks.
              </p>
            </div>
          </div>
        </section>

        {/* ── Final CTA ── */}
        <section
          id="waitlist"
          className="relative scroll-mt-24 px-5 py-28 sm:px-8"
        >
          <div
            data-parallax
            aria-hidden
            className="pointer-events-none absolute inset-x-0 bottom-0 z-0 mx-auto h-[440px] max-w-3xl"
            style={{
              background:
                "radial-gradient(ellipse at 50% 100%, rgba(212,147,60,0.16) 0%, transparent 65%)",
            }}
          />
          <div
            data-reveal
            className="relative z-10 mx-auto max-w-2xl text-center"
          >
            <h2 className="font-serif text-4xl leading-tight tracking-tight text-cream sm:text-5xl">
              Study like you finally
              <br />
              <span className="italic text-amber">understand it.</span>
            </h2>
            <p className="mx-auto mt-5 max-w-lg text-lg text-dusk">
              Lore is opening soon. Join the waitlist and we&rsquo;ll let you
              in early.
            </p>
            <div className="mt-9">
              <WaitlistForm />
            </div>
            <p className="mt-8 text-sm text-faint">
              Want a peek first?{" "}
              <Link
                href="/app"
                className="text-amber underline underline-offset-2 hover:text-amber-lt"
              >
                Try the live demo →
              </Link>
            </p>
          </div>
        </section>
      </main>

      <SiteFooter />
    </LandingMotion>
  );
}

// ── shared bits ──────────────────────────────────────────────────
function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: React.ReactNode;
}) {
  return (
    <div data-reveal className="mx-auto max-w-2xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber">
        {eyebrow}
      </p>
      <h2 className="font-serif text-3xl leading-tight tracking-tight text-cream sm:text-4xl">
        {title}
      </h2>
    </div>
  );
}

function Waveform({ bars }: { bars: number }) {
  const heights = Array.from({ length: bars }, (_, i) => {
    const base = 0.35 + 0.55 * Math.abs(Math.sin(i * 1.7));
    return Math.round((0.25 + base * 0.75) * 100) / 100;
  });
  return (
    <div
      aria-hidden
      className="flex items-center justify-center gap-[3px]"
      style={{ height: 56 }}
    >
      {heights.map((h, i) => (
        <span
          key={i}
          className="w-[3px] rounded-full bg-amber"
          style={{
            height: `${Math.round(h * 52)}px`,
            opacity: 0.3 + h * 0.6,
            transformOrigin: "center",
            animation: "lore-wave 1.5s ease-in-out infinite",
            animationDelay: `${(i % 10) * 0.09}s`,
          }}
        />
      ))}
    </div>
  );
}

function NoiseOverlay() {
  // Subtle photographic grain to remove digital sterility (premium-frontend-ui
  // §4). Fixed, non-interactive, blended over the page at very low opacity.
  const svg =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E";
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-50 opacity-[0.035] mix-blend-overlay"
      style={{ backgroundImage: `url("${svg}")`, backgroundSize: "140px 140px" }}
    />
  );
}
