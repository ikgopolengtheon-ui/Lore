"use client";

// Supabase browser client + anonymous-auth bootstrap (PRD §14 anonymous-first).
// Uses the publishable key (browser-safe). The secret key is never imported
// here. If Supabase isn't configured, or anonymous sign-ins are disabled, the
// store falls back to localStorage so the app keeps working.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export function supabaseConfigured(): boolean {
  return Boolean(URL && KEY);
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseConfigured()) return null;
  if (!client) client = createClient(URL!, KEY!);
  return client;
}

// Return the current user id, signing in anonymously if needed. Returns null
// when Supabase is unconfigured or anonymous sign-ins are disabled (422) — the
// caller then uses localStorage.
export async function ensureAuth(): Promise<string | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const {
      data: { session },
    } = await supa.auth.getSession();
    if (session?.user) return session.user.id;
    const { data, error } = await supa.auth.signInAnonymously();
    if (error) return null;
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}
