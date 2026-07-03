"use client";

// Prototype-only helper: a small floating panel to preview the full-screen
// Screen 8 error/edge states, which are otherwise only reachable via real
// failures. Not part of the shipping product.

import { useState } from "react";
import { ERRORS, type ErrorKey } from "@/lib/errors";
import { Icon } from "./Icon";

export function StatePreview({ onError }: { onError: (k: ErrorKey) => void }) {
  const [open, setOpen] = useState(false);
  const keys = Object.keys(ERRORS) as ErrorKey[];

  return (
    <div className="fixed bottom-4 left-4 z-40">
      {open && (
        <div className="mb-2 w-60 rounded-xl border border-line-m bg-carbon p-2 shadow-xl">
          <p className="px-2 py-1.5 text-[10px] uppercase tracking-widest text-faint">
            Preview error states
          </p>
          {keys.map((k) => (
            <button
              key={k}
              onClick={() => {
                onError(k);
                setOpen(false);
              }}
              className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs text-dusk hover:bg-depth hover:text-cream"
            >
              <span className="text-faint tabular-nums">{ERRORS[k].code}</span>
              <span className="truncate">{ERRORS[k].title}</span>
            </button>
          ))}
        </div>
      )}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-1.5 rounded-full border border-line-m bg-carbon/90 px-3 py-1.5 text-[11px] text-dusk backdrop-blur hover:text-cream"
        aria-label="Preview error states"
      >
        <Icon name="warning" size={13} />
        States
      </button>
    </div>
  );
}
