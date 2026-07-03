"use client";

// Non-blocking toasts (PRD uses these for STT-no-transcript, TTS-failure,
// short-recording, etc.). Bottom-centre, aria-live polite.

import { useEffect } from "react";
import type { ToastMsg } from "@/lib/types";
import { Icon } from "./Icon";

const toneStyles: Record<NonNullable<ToastMsg["tone"]>, string> = {
  neutral: "border-line-m text-cream",
  error: "border-red/40 text-cream",
  success: "border-green/40 text-cream",
};

export function Toaster({
  toasts,
  onDismiss,
}: {
  toasts: ToastMsg[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-6 z-50 flex flex-col items-center gap-2 px-4"
      aria-live="polite"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: ToastMsg;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 4200);
    return () => clearTimeout(t);
  }, [toast.id, onDismiss]);

  const tone = toast.tone ?? "neutral";
  return (
    <div
      className={`animate-fade-up pointer-events-auto flex max-w-md items-center gap-3 rounded-xl border bg-carbon/95 px-4 py-3 text-sm shadow-lg backdrop-blur ${toneStyles[tone]}`}
    >
      <span
        className={
          tone === "error"
            ? "text-red"
            : tone === "success"
              ? "text-green"
              : "text-amber"
        }
      >
        <Icon
          name={tone === "error" ? "warning" : tone === "success" ? "info" : "info"}
          size={18}
        />
      </span>
      <span className="leading-snug">{toast.text}</span>
    </div>
  );
}
