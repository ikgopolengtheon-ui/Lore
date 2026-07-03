"use client";

// Screen 8 — full-screen error/edge states (PRD §5). Standard Lore layout with
// an amber alert icon, non-technical message, and a single primary action.
// Errors are announced assertively for screen readers (PRD §12.2).

import { ERRORS, type ErrorKey } from "@/lib/errors";
import { Icon } from "../Icon";
import { Button } from "../Button";

interface Props {
  errorKey: ErrorKey;
  onPrimary: () => void;
  onDismiss?: () => void;
}

export function ErrorScreen({ errorKey, onPrimary, onDismiss }: Props) {
  const spec = ERRORS[errorKey];
  return (
    <main
      className="flex flex-1 flex-col items-center justify-center px-6 py-20 text-center"
      role="alert"
      aria-live="assertive"
    >
      <span className="mb-6 grid h-16 w-16 place-items-center rounded-2xl border border-amber/30 bg-amber/10 text-amber">
        <Icon name={spec.icon} size={30} />
      </span>
      <p className="mb-3 max-w-md font-serif text-2xl leading-snug text-cream">
        {spec.title}
      </p>
      <p className="mb-8 max-w-md text-sm leading-relaxed text-dusk">
        {spec.body}
      </p>
      <div className="flex flex-col items-center gap-3">
        <Button onClick={onPrimary}>{spec.primary}</Button>
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="text-xs text-faint hover:text-dusk"
          >
            Dismiss
          </button>
        )}
      </div>
      <span className="mt-10 text-[10px] uppercase tracking-widest text-faint">
        Error {spec.code}
      </span>
    </main>
  );
}
