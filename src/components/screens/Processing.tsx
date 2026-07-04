"use client";

// Screen 3 — Processing (PRD §5). Non-interactive visual state shown while the
// document is extracted/indexed. Cycles status messages until the parent
// advances the stage (real extraction drives the transition, not a timer).

import { useEffect, useState } from "react";
import { LogoMark } from "../Logo";

const STEPS = [
  "Reading your document…",
  "Chunking content…",
  "Building your knowledge index…",
  "Almost ready…",
];

interface Props {
  isImage: boolean;
}

export function Processing({ isImage }: Props) {
  const [step, setStep] = useState(0);

  useEffect(() => {
    const t = setInterval(
      () => setStep((s) => (s + 1) % STEPS.length),
      900,
    );
    return () => clearInterval(t);
  }, []);

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-6 py-20 text-center">
      <span
        className="mb-8 grid h-20 w-20 place-items-center rounded-3xl border border-line-m bg-carbon"
        style={{ animation: "lore-pulse 1.6s ease-in-out infinite" }}
      >
        <LogoMark size={40} />
      </span>

      <p className="mb-6 min-h-[1.5rem] font-serif text-2xl text-cream">
        {STEPS[step]}
      </p>

      <div className="mb-3 flex w-full max-w-xs gap-1.5">
        {STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1.5 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-amber" : "bg-carbon"
            }`}
          />
        ))}
      </div>
      <p className="text-xs text-dusk">
        {isImage
          ? "Reading the text in your photos…"
          : "This takes 10–30 seconds for most documents."}
      </p>

      {isImage && (
        <p className="mt-8 max-w-sm rounded-lg border border-line bg-depth px-4 py-3 text-xs leading-relaxed text-dusk">
          Image content extracted. Results may vary depending on image clarity.
        </p>
      )}
    </main>
  );
}
