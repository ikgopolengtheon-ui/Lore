"use client";

// Account entry point (PRD §11.2 / §14). Anonymous visitors get explicit
// Log in / Sign up buttons; a signed-in user gets their avatar pill. All of
// them route to the dedicated /auth page. Hidden entirely when Supabase
// isn't configured.

import Link from "next/link";
import { useStore } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";

export function AccountButton() {
  const { user } = useStore();
  if (!supabaseConfigured()) return null;

  if (user?.email) {
    return (
      <Link
        href="/auth"
        className="flex items-center gap-1.5 rounded-lg border border-line-m px-3 py-2 text-xs font-medium text-dusk transition-colors hover:text-cream"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-amber/15 text-[10px] font-semibold text-amber">
          {user.email[0].toUpperCase()}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">
          {user.email.split("@")[0]}
        </span>
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Link
        href="/auth?mode=signin"
        className="rounded-lg border border-line-m px-3.5 py-2 text-xs font-medium text-dusk transition-colors hover:border-amber/50 hover:text-cream"
      >
        Log in
      </Link>
      <Link
        href="/auth?mode=signup"
        className="rounded-lg bg-amber px-3.5 py-2 text-xs font-semibold text-void transition-colors hover:bg-amber-lt"
      >
        Sign up
      </Link>
    </div>
  );
}
