"use client";

// Screen 3 — Processing (PRD §5). Non-interactive; cycles status messages and
// a 4-step indicator, then auto-advances. Image sessions surface the vision
// OCR advisory (PRD §4.5).

import { useEffect, useRef, useState } from "react";
import { LogoMark } from "../Logo";

const STEPS = [
  "Reading your document…",
  "Chunking content…",
  "Building your knowledge index…",
  "Almost ready…",
];

interface Props {
  isImage: boolean;
  onDone: () => void;
}

export function Processing({ isImage, onDone }: Props) {
  const [step, setStep] = useState(0);
  const doneRef = useRef(onDone);
  doneRef.current = onDone;

  useEffect(() => {
    const perStep = 900;
    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i), i * perStep),
    );
    const finish = setTimeout(() => doneRef.current(), STEPS.length * perStep);
    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(finish);
    };
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
        Step {step + 1} of {STEPS.length} · This takes 10–30 seconds for most
        documents.
      </p>

      {isImage && (
        <p className="mt-8 max-w-sm rounded-lg border border-line bg-depth px-4 py-3 text-xs leading-relaxed text-dusk">
          Image content extracted. Results may vary depending on image clarity.
        </p>
      )}
    </main>
  );
}
