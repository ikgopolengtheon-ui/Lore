"use client";

// Lightweight user preferences, persisted in localStorage. These are
// device-level settings (display name, default voice speed, preferred voice
// quality) — chat data itself lives in the session store / Supabase.
// Exposed as an external store via useSettings() (useSyncExternalStore), so
// components stay in sync and hydration is handled by React.

import { useSyncExternalStore } from "react";

export type PlanKey = "focus" | "scholar" | "mastery";

/** Tier definitions — subjects and saved whiteboards are the metered units
    (see /pricing). */
export const PLANS: Record<
  PlanKey,
  { label: string; subjects: number; boards: number }
> = {
  focus: { label: "Focus", subjects: 3, boards: 5 },
  scholar: { label: "Scholar", subjects: 10, boards: 15 },
  mastery: {
    label: "Mastery",
    subjects: Number.POSITIVE_INFINITY,
    boards: Number.POSITIVE_INFINITY,
  },
};

export function formatSubjectLimit(n: number): string {
  return Number.isFinite(n) ? String(n) : "Unlimited";
}

export interface LoreSettings {
  /** what Lore should call the student */
  name: string;
  /** default TTS playback speed for new study sessions */
  speed: number;
  /** preferred voice quality (metering by plan happens server-side later) */
  voice: "premium" | "standard";
  /** current tier — a preview until billing lands; gates saved subjects */
  plan: PlanKey;
}

const KEY = "lore-settings";

const DEFAULTS: LoreSettings = {
  name: "",
  speed: 1,
  voice: "premium",
  plan: "focus",
};

let cache: LoreSettings | null = null;
const listeners = new Set<() => void>();

function read(): LoreSettings {
  if (typeof window === "undefined") return DEFAULTS;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return DEFAULTS;
    return { ...DEFAULTS, ...(JSON.parse(raw) as Partial<LoreSettings>) };
  } catch {
    return DEFAULTS;
  }
}

export function getSettings(): LoreSettings {
  if (cache === null) cache = read();
  return cache;
}

function getServerSettings(): LoreSettings {
  return DEFAULTS;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function saveSettings(patch: Partial<LoreSettings>): LoreSettings {
  cache = { ...getSettings(), ...patch };
  try {
    localStorage.setItem(KEY, JSON.stringify(cache));
  } catch {
    // storage full/blocked — settings just won't persist
  }
  listeners.forEach((fn) => fn());
  return cache;
}

/** Live view of the settings; re-renders subscribers on saveSettings. */
export function useSettings(): LoreSettings {
  return useSyncExternalStore(subscribe, getSettings, getServerSettings);
}
