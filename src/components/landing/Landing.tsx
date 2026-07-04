"use client";

// Premium marketing landing for Lore. Motion is built with GSAP (useGSAP +
// ScrollTrigger) over Lenis smooth scroll, applying the premium-frontend-ui and
// gsap skills: staggered hero entrance, scroll-batched reveals, hide-on-scroll
// nav, magnetic CTAs, parallax glows, and an atmospheric noise layer. Every
// animation is transform/opacity only and fully disabled under reduced-motion.

import { useRef } from "react";
import Link from "next/link";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";
import { Logo, Wordmark } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { WaitlistForm } from "./WaitlistForm";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const HERO_LINE_1 = ["The", "teacher", "you"];

export function Landing() {
  const root = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useGSAP(
    (_ctx, contextSafe) => {
      const reduce = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const cleanups: Array<() => void> = [];

      // ── Lenis smooth scroll, driven by GSAP's ticker ──────────────
      let lenis: Lenis | null = null;
      if (!reduce) {
        lenis = new Lenis({ duration: 1.1, smoothWheel: true });
        lenis.on("scroll", ScrollTrigger.update);
        const raf = (time: number) => lenis!.raf(time * 1000);
        gsap.ticker.add(raf);
        gsap.ticker.lagSmoothing(0);
        cleanups.push(() => {
          gsap.ticker.remove(raf);
          lenis?.destroy();
        });

        // smooth in-page anchor jumps
        const onAnchor = contextSafe!((e: Event) => {
          const a = e.currentTarget as HTMLAnchorElement;
          const id = a.getAttribute("href");
          if (id && id.startsWith("#") && id.length > 1) {
            e.preventDefault();
            lenis?.scrollTo(id, { offset: -20 });
          }
        });
        root.current
          ?.querySelectorAll<HTMLAnchorElement>('a[href^="#"]')
          .forEach((a) => {
            a.addEventListener("click", onAnchor);
            cleanups.push(() => a.removeEventListener("click", onAnchor));
          });
      }

      if (reduce) return () => cleanups.forEach((c) => c());

      // ── Hero entrance ─────────────────────────────────────────────
      const heroTl = gsap.timeline({
        defaults: { ease: "power3.out" },
        delay: 0.1,
      });
      heroTl
        .from("[data-hero-eyebrow]", { y: 16, opacity: 0, duration: 0.6 })
        .from(
          "[data-hero-word]",
          { yPercent: 118, opacity: 0, stagger: 0.07, duration: 0.9 },
          "-=0.25",
        )
        .from(
          "[data-hero-sub]",
          { y: 18, opacity: 0, duration: 0.7 },
          "-=0.55",
        )
        .from(
          "[data-hero-form]",
          { y: 18, opacity: 0, duration: 0.7 },
          "-=0.5",
        )
        .from(
          "[data-hero-wave] > span",
          { scaleY: 0.1, opacity: 0, stagger: 0.015, duration: 0.5 },
          "-=0.45",
        );

      // ── Scroll-batched section reveals ────────────────────────────
      gsap.set("[data-reveal]", { opacity: 0, y: 30 });
      ScrollTrigger.batch("[data-reveal]", {
        start: "top 86%",
        onEnter: (els) =>
          gsap.to(els, {
            opacity: 1,
            y: 0,
            stagger: 0.12,
            duration: 0.85,
            ease: "power3.out",
            overwrite: true,
          }),
      });

      // ── Parallax on the ambient glows ─────────────────────────────
      gsap.utils.toArray<HTMLElement>("[data-parallax]").forEach((el) => {
        gsap.to(el, {
          yPercent: 22,
          ease: "none",
          scrollTrigger: {
            trigger: el,
            start: "top bottom",
            end: "bottom top",
            scrub: true,
          },
        });
      });

      // ── Nav: hide on scroll down, reveal on scroll up ─────────────
      let navShown = true;
      const setNav = (show: boolean) => {
        if (show === navShown) return;
        navShown = show;
        gsap.to(navRef.current, {
          yPercent: show ? 0 : -110,
          duration: show ? 0.3 : 0.45,
          ease: "power3.out",
        });
      };
      ScrollTrigger.create({
        start: 0,
        end: "max",
        onUpdate: (self) => {
          if (self.scroll() < 90) setNav(true);
          else setNav(self.direction === -1);
        },
      });

      // ── Magnetic CTAs (fine-pointer devices only) ─────────────────
      if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) {
        gsap.utils.toArray<HTMLElement>("[data-magnetic]").forEach((btn) => {
          const move = contextSafe!((e: PointerEvent) => {
            const r = btn.getBoundingClientRect();
            gsap.to(btn, {
              x: (e.clientX - (r.left + r.width / 2)) * 0.3,
              y: (e.clientY - (r.top + r.height / 2)) * 0.45,
              duration: 0.4,
              ease: "power3.out",
            });
          });
          const reset = contextSafe!(() =>
            gsap.to(btn, {
              x: 0,
              y: 0,
              duration: 0.6,
              ease: "elastic.out(1, 0.4)",
            }),
          );
          btn.addEventListener("pointermove", move);
          btn.addEventListener("pointerleave", reset);
          cleanups.push(() => {
            btn.removeEventListener("pointermove", move);
            btn.removeEventListener("pointerleave", reset);
          });
        });
      }

      return () => cleanups.forEach((c) => c());
    },
    { scope: root },
  );

  return (
    <div ref={root} className="relative overflow-x-hidden">
      <NoiseOverlay />

      {/* ── Nav ── */}
      <header
        ref={navRef}
        className="fixed inset-x-0 top-0 z-40 border-b border-line/60 bg-void/70 backdrop-blur-md"
      >
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
              data-magnetic
              className="rounded-lg bg-amber px-4 py-2 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
            >
              Join waitlist
            </a>
          </div>
        </nav>
      </header>

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
              <span data-hero-word className="mr-[0.22em] inline-block italic text-amber">
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
            Upload your notes, hold the mic, and ask anything. Lore explains out
            loud — drawn only from your own material, never the open web.
          </p>

          <div data-hero-form className="mt-9">
            <WaitlistForm />
            <p className="mt-3 text-xs text-faint">
              Join the waitlist — be first when we open. No spam, ever.
            </p>
          </div>

          <div data-hero-wave className="mt-14">
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
              Three steps to <span className="italic text-amber">clarity</span>.
            </>
          }
        />
        <div className="mt-14 grid gap-4 md:grid-cols-3">
          {(
            [
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
            ] as { icon: IconName; title: string; body: string }[]
          ).map((s, i) => (
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
              <p className="mt-2 text-sm leading-relaxed text-dusk">{s.body}</p>
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
              <span className="italic text-amber">read everything you have</span>
              .
            </>
          }
        />
        <div className="mt-14 grid gap-4 sm:grid-cols-2">
          {(
            [
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
            ] as { icon: IconName; title: string; body: string }[]
          ).map((f) => (
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
            <Waveform bars={28} />
            <h2 className="mx-auto mt-8 max-w-2xl font-serif text-3xl leading-tight text-cream sm:text-4xl">
              The voice <span className="italic text-amber">is</span> the
              product.
            </h2>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-dusk">
              Most apps have a sound. Lore is a sound. Every detail serves one
              feeling — a calm, knowledgeable person sitting beside you,
              explaining until it finally clicks.
            </p>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section id="waitlist" className="relative scroll-mt-24 px-5 py-28 sm:px-8">
        <div
          data-parallax
          aria-hidden
          className="pointer-events-none absolute inset-x-0 bottom-0 z-0 mx-auto h-[440px] max-w-3xl"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(212,147,60,0.16) 0%, transparent 65%)",
          }}
        />
        <div data-reveal className="relative z-10 mx-auto max-w-2xl text-center">
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
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-line px-5 py-10 sm:px-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <Wordmark size={22} />
          <p className="text-xs text-faint">
            Your notes. Finally explained. · © {new Date().getFullYear()} Lore
          </p>
        </div>
      </footer>
    </div>
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
