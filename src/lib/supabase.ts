"use client";

// Supabase browser client + anonymous-auth bootstrap (PRD §14 anonymous-first).
// Uses the publishable key (browser-safe). The secret key is never imported
// here. If Supabase isn't configured, or anonymous sign-ins are disabled, the
// store falls back to localStorage so the app keeps working.

import {
  createClient,
  type SupabaseClient,
  type User,
} from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

let client: SupabaseClient | null = null;

export interface LoreUser {
  id: string;
  email: string | null;
  isAnonymous: boolean;
}

export function toLoreUser(u: User | null | undefined): LoreUser | null {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email ?? null,
    isAnonymous: Boolean(u.is_anonymous),
  };
}

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
export async function ensureAuth(): Promise<User | null> {
  const supa = getSupabase();
  if (!supa) return null;
  try {
    const {
      data: { session },
    } = await supa.auth.getSession();
    if (session?.user) return session.user;
    const { data, error } = await supa.auth.signInAnonymously();
    if (error) return null;
    return data.user ?? null;
  } catch {
    return null;
  }
}

// Create a permanent email account. If the current user is anonymous, upgrade
// it in place (same id → existing chats are kept). Returns { needsConfirm }.
export async function signUpEmail(
  email: string,
  password: string,
): Promise<{ user: User | null; needsConfirm: boolean }> {
  const supa = getSupabase();
  if (!supa) throw new Error("Accounts aren't available right now.");
  const {
    data: { user: current },
  } = await supa.auth.getUser();

  if (current?.is_anonymous) {
    const { data, error } = await supa.auth.updateUser({ email, password });
    if (error) throw error;
    // If confirmation is required, the email change is pending (new_email set).
    const pending = Boolean(
      (data.user as User & { new_email?: string })?.new_email,
    );
    return { user: data.user, needsConfirm: pending };
  }

  const { data, error } = await supa.auth.signUp({ email, password });
  if (error) throw error;
  // No session means email confirmation is required.
  return { user: data.user, needsConfirm: !data.session };
}

export async function signInEmail(
  email: string,
  password: string,
): Promise<User> {
  const supa = getSupabase();
  if (!supa) throw new Error("Accounts aren't available right now.");
  const { data, error } = await supa.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.user;
}

// Sign out and drop back to a fresh anonymous session (anonymous-first).
export async function signOutToAnon(): Promise<User | null> {
  const supa = getSupabase();
  if (!supa) return null;
  await supa.auth.signOut();
  const { data } = await supa.auth.signInAnonymously();
  return data.user ?? null;
}
