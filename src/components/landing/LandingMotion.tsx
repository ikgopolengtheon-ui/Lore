"use client";

// Client-side motion layer for the landing page. The page content itself is
// server-rendered (see Landing.tsx); this wrapper only orchestrates GSAP
// (useGSAP + ScrollTrigger) over Lenis smooth scroll: staggered hero entrance,
// scroll-batched reveals, hide-on-scroll nav, magnetic CTAs, and parallax
// glows. Every animation is transform/opacity only and fully disabled under
// reduced-motion (content simply stays visible).

import { useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useGSAP } from "@gsap/react";
import Lenis from "lenis";

gsap.registerPlugin(useGSAP, ScrollTrigger);

export function LandingMotion({ children }: { children: React.ReactNode }) {
  const root = useRef<HTMLDivElement>(null);

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

      // Pause the infinite waveform animations while they're offscreen so
      // they don't burn frames the whole time the user reads the page.
      gsap.utils.toArray<HTMLElement>("[data-wave]").forEach((el) => {
        ScrollTrigger.create({
          trigger: el,
          start: "top bottom",
          end: "bottom top",
          onToggle: (self) => el.classList.toggle("wave-paused", !self.isActive),
        });
      });

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
          "[data-hero-mock]",
          { y: 48, opacity: 0, duration: 0.9 },
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
        gsap.to("[data-nav]", {
          // -150% (not -110%) so the pill also clears its top-4 offset
          yPercent: show ? 0 : -150,
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
      {children}
    </div>
  );
}
