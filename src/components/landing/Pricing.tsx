// Pricing cards (ref: 3-up package layout, center card inverted and
// elevated). Shared by the landing #pricing section and /pricing. Tiers
// meter study time and voice quality — the full toolkit (grounded voice
// Q&A, whiteboard, quizzes) is in every plan, and there is no free tier.

import Link from "next/link";
import { Icon } from "@/components/Icon";

interface Tier {
  eyebrow: string;
  name: string;
  blurb: string;
  price: string;
  yearly: string;
  cta: string;
  featured?: boolean;
  included: string[];
}

const TIERS: Tier[] = [
  {
    eyebrow: "Get started",
    name: "Focus",
    blurb: "For steady revision — a subject or two, a few sessions a week.",
    price: "$8.99",
    yearly: "$86",
    cta: "Start with Focus",
    included: [
      "4 hours of study time / month",
      "Standard voice",
      "3 saved subjects · 5 whiteboards",
      "Voice Q&A, whiteboard & quizzes",
      "Adjustable playback speed",
    ],
  },
  {
    eyebrow: "Exam season",
    name: "Scholar",
    blurb: "The sweet spot — double the hours, with the premium voice.",
    price: "$17.99",
    yearly: "$173",
    cta: "Choose Scholar",
    featured: true,
    included: [
      "8 hours of study time / month",
      "Premium voice for 5 hrs, then standard",
      "10 saved subjects · 15 whiteboards",
      "Priority processing",
      "Everything in Focus",
    ],
  },
  {
    eyebrow: "Every day",
    name: "Mastery",
    blurb: "For heavy studiers who live in Lore through the term.",
    price: "$29.99",
    yearly: "$288",
    cta: "Go Mastery",
    included: [
      "16 hours of study time / month",
      "Premium voice for 8 hrs, then standard",
      "Unlimited subjects & whiteboards",
      "Priority processing",
      "First access to new features",
    ],
  },
];

export function Pricing({
  layout = "grid",
}: {
  /** "grid" = 3-up with elevated centre (landing); "stack" = single column
      for narrow contexts like the split /pricing page. */
  layout?: "grid" | "stack";
}) {
  const stacked = layout === "stack";
  return (
    <div>
      <div
        className={
          stacked
            ? "flex flex-col gap-4"
            : "grid gap-4 lg:grid-cols-3 lg:items-center"
        }
      >
        {TIERS.map((tier) =>
          tier.featured ? (
            <div
              key={tier.name}
              className={`relative rounded-[1.75rem] bg-amber p-7 shadow-2xl shadow-amber/15 ${
                stacked ? "" : "lg:-my-6 lg:p-8"
              }`}
            >
              <span className="inline-flex items-center gap-1.5 rounded-full bg-void/85 px-3 py-1.5 text-xs font-medium text-cream">
                <Icon name="check" size={12} />
                Most chosen
              </span>
              <p className="mt-5 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-void/60">
                {tier.eyebrow}
              </p>
              <h3 className="mt-2 font-serif text-2xl text-void">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-void/75">
                {tier.blurb}
              </p>
              <p className="mt-5">
                <span className="font-serif text-5xl tracking-tight text-void">
                  {tier.price}
                </span>
                <span className="ml-1.5 text-sm text-void/60">/ month</span>
              </p>
              <p className="mt-1 text-xs text-void/60">
                or {tier.yearly} billed yearly (~20% off)
              </p>
              <Link
                href="/waitlist"
                className="mt-6 block w-full rounded-full bg-void px-5 py-3 text-center text-sm font-semibold text-cream transition-colors hover:bg-carbon"
              >
                {tier.cta}
              </Link>
              <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-void/60">
                What&rsquo;s included
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {tier.included.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-void/85"
                  >
                    <span className="mt-0.5 shrink-0 text-void">
                      <Icon name="check" size={14} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <div key={tier.name} className="lore-card h-full p-7">
              <p className="font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">
                {tier.eyebrow}
              </p>
              <h3 className="mt-2 font-serif text-2xl text-cream">
                {tier.name}
              </h3>
              <p className="mt-2 text-sm leading-relaxed text-dusk">
                {tier.blurb}
              </p>
              <p className="mt-5">
                <span className="font-serif text-5xl tracking-tight text-cream">
                  {tier.price}
                </span>
                <span className="ml-1.5 text-sm text-dusk">/ month</span>
              </p>
              <p className="mt-1 text-xs text-faint">
                or {tier.yearly} billed yearly (~20% off)
              </p>
              <Link
                href="/waitlist"
                className="mt-6 block w-full rounded-full bg-amber px-5 py-3 text-center text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
              >
                {tier.cta}
              </Link>
              <p className="mt-6 font-mono text-[11px] font-semibold uppercase tracking-[0.2em] text-faint">
                What&rsquo;s included
              </p>
              <ul className="mt-3 flex flex-col gap-2.5">
                {tier.included.map((item) => (
                  <li
                    key={item}
                    className="flex items-start gap-2.5 text-sm text-dusk"
                  >
                    <span className="mt-0.5 shrink-0 text-amber">
                      <Icon name="check" size={14} />
                    </span>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ),
        )}
      </div>

      <p className="mx-auto mt-12 max-w-2xl text-center text-xs leading-relaxed text-faint">
        Prices in USD, cancel anytime. Every plan has the full toolkit — the
        tiers change volume and voice, never features. When premium voice
        hours run out, Lore keeps going on the standard voice, no hard
        cut-offs. One sample question is free to try; studying needs a plan.
      </p>
    </div>
  );
}
