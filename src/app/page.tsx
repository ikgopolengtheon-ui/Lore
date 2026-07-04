import Link from "next/link";
import { Logo, Wordmark } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { WaitlistForm } from "@/components/landing/WaitlistForm";
import { Reveal } from "@/components/landing/Reveal";

export default function Landing() {
  return (
    <div className="relative overflow-x-hidden">
      <Nav />
      <Hero />
      <QuoteStrip />
      <HowItWorks />
      <Features />
      <VoiceSection />
      <FinalCta />
      <Footer />
    </div>
  );
}

// ─── Nav ───────────────────────────────────────────────────────────
function Nav() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/60 bg-void/70 backdrop-blur-md">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5 sm:px-8">
        <Logo />
        <div className="flex items-center gap-2 sm:gap-4">
          <a
            href="#how"
            className="hidden text-sm text-dusk transition-colors hover:text-cream sm:block"
          >
            How it works
          </a>
          <a
            href="#features"
            className="hidden text-sm text-dusk transition-colors hover:text-cream sm:block"
          >
            Features
          </a>
          <Link
            href="/app"
            className="hidden text-sm text-dusk transition-colors hover:text-cream md:block"
          >
            Try the demo
          </Link>
          <a
            href="#waitlist"
            className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
          >
            Join waitlist
          </a>
        </div>
      </nav>
    </header>
  );
}

// ─── Hero ──────────────────────────────────────────────────────────
function Hero() {
  return (
    <section className="relative px-5 pb-20 pt-20 sm:px-8 sm:pt-28">
      {/* warm amber glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 z-0 mx-auto h-[520px] max-w-4xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 0%, rgba(212,147,60,0.16) 0%, transparent 62%)",
        }}
      />
      <div className="animate-fade-up relative z-10 mx-auto max-w-3xl text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-line-m bg-carbon/70 px-3.5 py-1.5 text-xs font-medium text-dusk">
          <span className="h-1.5 w-1.5 rounded-full bg-amber" />
          Voice-first AI study companion
        </span>

        <h1 className="font-serif text-5xl leading-[1.03] tracking-tight text-cream sm:text-7xl">
          The teacher you
          <br />
          <span className="italic text-amber">never had.</span>
        </h1>

        <p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-dusk">
          Upload your notes, hold the mic, and ask anything. Lore explains out
          loud — drawn only from your own material, never the open web.
        </p>

        <div className="mt-9">
          <WaitlistForm />
          <p className="mt-3 text-xs text-faint">
            Join the waitlist — be first when we open. No spam, ever.
          </p>
        </div>

        <div className="mt-14">
          <Waveform bars={40} />
        </div>
      </div>
    </section>
  );
}

// ─── Pull quote ────────────────────────────────────────────────────
function QuoteStrip() {
  return (
    <section className="border-y border-line bg-depth/40 px-5 py-16 sm:px-8">
      <Reveal className="mx-auto max-w-3xl text-center">
        <p className="font-serif text-2xl italic leading-snug text-cream sm:text-3xl">
          “You have nobody to ask at midnight.
          <span className="text-amber"> Lore does.</span>”
        </p>
      </Reveal>
    </section>
  );
}

// ─── How it works ──────────────────────────────────────────────────
function HowItWorks() {
  const steps: { icon: IconName; title: string; body: string }[] = [
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
  return (
    <section id="how" className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
      <SectionHeading
        eyebrow="How it works"
        title={
          <>
            Three steps to <span className="italic text-amber">clarity</span>.
          </>
        }
      />
      <div className="mt-14 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.title} delay={i * 90}>
            <div className="h-full rounded-2xl border border-line bg-depth p-7">
              <div className="flex items-center gap-3">
                <span className="grid h-11 w-11 place-items-center rounded-xl border border-line-m bg-carbon text-amber">
                  <Icon name={s.icon} size={22} />
                </span>
                <span className="font-mono text-xs text-faint">
                  0{i + 1}
                </span>
              </div>
              <h3 className="mt-5 font-serif text-xl text-cream">{s.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-dusk">{s.body}</p>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── Features ──────────────────────────────────────────────────────
function Features() {
  const feats: { icon: IconName; title: string; body: string }[] = [
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
  return (
    <section
      id="features"
      className="mx-auto max-w-6xl px-5 py-24 sm:px-8"
    >
      <SectionHeading
        eyebrow="Why Lore"
        title={
          <>
            A study partner that has{" "}
            <span className="italic text-amber">read everything you have</span>.
          </>
        }
      />
      <div className="mt-14 grid gap-4 sm:grid-cols-2">
        {feats.map((f, i) => (
          <Reveal key={f.title} delay={(i % 2) * 90}>
            <div className="flex h-full gap-4 rounded-2xl border border-line bg-depth p-7">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line-m bg-carbon text-amber">
                <Icon name={f.icon} size={22} />
              </span>
              <div>
                <h3 className="font-serif text-xl text-cream">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-dusk">
                  {f.body}
                </p>
              </div>
            </div>
          </Reveal>
        ))}
      </div>
    </section>
  );
}

// ─── Voice section ─────────────────────────────────────────────────
function VoiceSection() {
  return (
    <section className="px-5 py-24 sm:px-8">
      <Reveal className="relative mx-auto max-w-4xl overflow-hidden rounded-3xl border border-line-m bg-carbon px-6 py-16 text-center sm:px-12">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-64 max-w-2xl"
          style={{
            background:
              "radial-gradient(ellipse at 50% 0%, rgba(212,147,60,0.12) 0%, transparent 70%)",
          }}
        />
        <div className="relative">
          <Waveform bars={28} />
          <h2 className="mx-auto mt-8 max-w-2xl font-serif text-3xl leading-tight text-cream sm:text-4xl">
            The voice <span className="italic text-amber">is</span> the product.
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-dusk">
            Most apps have a sound. Lore is a sound. Every detail serves one
            feeling — a calm, knowledgeable person sitting beside you, explaining
            until it finally clicks.
          </p>
        </div>
      </Reveal>
    </section>
  );
}

// ─── Final CTA ─────────────────────────────────────────────────────
function FinalCta() {
  return (
    <section
      id="waitlist"
      className="relative scroll-mt-20 px-5 py-28 sm:px-8"
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 z-0 mx-auto h-[420px] max-w-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 100%, rgba(212,147,60,0.14) 0%, transparent 65%)",
        }}
      />
      <Reveal className="relative z-10 mx-auto max-w-2xl text-center">
        <h2 className="font-serif text-4xl leading-tight tracking-tight text-cream sm:text-5xl">
          Study like you finally
          <br />
          <span className="italic text-amber">understand it.</span>
        </h2>
        <p className="mx-auto mt-5 max-w-lg text-lg text-dusk">
          Lore is opening soon. Join the waitlist and we&rsquo;ll let you in
          early.
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
      </Reveal>
    </section>
  );
}

// ─── Footer ────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="border-t border-line px-5 py-10 sm:px-8">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <Wordmark size={22} />
        <p className="text-xs text-faint">
          Your notes. Finally explained. · © {new Date().getFullYear()} Lore
        </p>
      </div>
    </footer>
  );
}

// ─── shared bits ───────────────────────────────────────────────────
function SectionHeading({
  eyebrow,
  title,
}: {
  eyebrow: string;
  title: React.ReactNode;
}) {
  return (
    <Reveal className="mx-auto max-w-2xl text-center">
      <p className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-amber">
        {eyebrow}
      </p>
      <h2 className="font-serif text-3xl leading-tight tracking-tight text-cream sm:text-4xl">
        {title}
      </h2>
    </Reveal>
  );
}

function Waveform({ bars }: { bars: number }) {
  // deterministic pseudo-heights so server/client render identically
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
