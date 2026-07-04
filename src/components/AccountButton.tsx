"use client";

// Account entry point (PRD §11.2 / §14). Anonymous by default; every
// sign-in / sign-up action routes to the dedicated /auth page. Hidden
// entirely when Supabase isn't configured.

import Link from "next/link";
import { useStore } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";

export function AccountButton() {
  const { user } = useStore();
  if (!supabaseConfigured()) return null;

  const label = user?.email ? user.email.split("@")[0] : "Sign in";

  return (
    <Link
      href="/auth"
      className="flex items-center gap-1.5 rounded-lg border border-line-m px-3 py-2 text-xs font-medium text-dusk transition-colors hover:text-cream"
    >
      <span className="grid h-5 w-5 place-items-center rounded-full bg-amber/15 text-[10px] font-semibold text-amber">
        {user?.email ? user.email[0].toUpperCase() : "?"}
      </span>
      <span className="hidden max-w-[120px] truncate sm:inline">{label}</span>
    </Link>
  );
}
