"use client";

// Account entry point (PRD §11.2 / §14). Anonymous by default; a student can
// create an email account (their anonymous chats carry over) or sign in on a
// new device. Hidden entirely when Supabase isn't configured.

import { useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/lib/store";
import { supabaseConfigured } from "@/lib/supabase";
import { Icon } from "./Icon";
import { Button } from "./Button";

export function AccountButton() {
  const { user } = useStore();
  const [open, setOpen] = useState(false);
  if (!supabaseConfigured()) return null;

  const label = user?.email ? user.email.split("@")[0] : "Sign in";

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-1.5 rounded-lg border border-line-m px-3 py-2 text-xs font-medium text-dusk transition-colors hover:text-cream"
      >
        <span className="grid h-5 w-5 place-items-center rounded-full bg-amber/15 text-[10px] font-semibold text-amber">
          {user?.email ? user.email[0].toUpperCase() : "?"}
        </span>
        <span className="hidden max-w-[120px] truncate sm:inline">{label}</span>
      </button>
      {open && <AccountModal onClose={() => setOpen(false)} />}
    </>
  );
}

function AccountModal({ onClose }: { onClose: () => void }) {
  const { user, signUp, signIn, signOut } = useStore();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const signedIn = Boolean(user?.email);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setNotice(null);
    setBusy(true);
    try {
      if (mode === "signup") {
        const { needsConfirm } = await signUp(email.trim(), password);
        if (needsConfirm) {
          setNotice("Check your email to confirm your account, then sign in.");
          setBusy(false);
          return;
        }
      } else {
        await signIn(email.trim(), password);
      }
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
      setBusy(false);
    }
  };

  const doSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
      onClose();
    } catch {
      setBusy(false);
    }
  };

  // Portal to <body>: the header's backdrop-filter would otherwise become
  // the containing block for this fixed overlay, pinning it to the header
  // strip instead of the viewport.
  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-void/70 p-4 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="w-full max-w-sm rounded-2xl border border-line-m bg-carbon p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-5 flex items-center justify-between">
          <h2 className="font-serif text-xl text-cream">
            {signedIn ? "Your account" : "Save your chats"}
          </h2>
          <button
            onClick={onClose}
            aria-label="Close"
            className="grid h-8 w-8 place-items-center rounded-lg text-dusk hover:bg-depth hover:text-cream"
          >
            <Icon name="close" size={18} />
          </button>
        </div>

        {signedIn ? (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-dusk">
              Signed in as{" "}
              <span className="text-cream">{user!.email}</span>. Your chats sync
              across devices.
            </p>
            <Button variant="secondary" onClick={doSignOut} disabled={busy}>
              Sign out
            </Button>
          </div>
        ) : (
          <>
            <p className="mb-4 text-sm text-dusk">
              {mode === "signup"
                ? "Create an account to keep your chats across devices. Your current chats come with you."
                : "Sign in to load your chats on this device."}
            </p>
            <form onSubmit={submit} className="flex flex-col gap-3">
              <input
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="rounded-lg border border-line-m bg-depth px-3 py-2.5 text-sm text-cream outline-none placeholder:text-faint focus:border-amber/60"
              />
              <input
                type="password"
                required
                minLength={6}
                autoComplete={
                  mode === "signup" ? "new-password" : "current-password"
                }
                placeholder="Password (min 6 characters)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="rounded-lg border border-line-m bg-depth px-3 py-2.5 text-sm text-cream outline-none placeholder:text-faint focus:border-amber/60"
              />
              {error && (
                <p className="flex items-start gap-2 text-xs text-red">
                  <Icon name="warning" size={14} className="mt-0.5 shrink-0" />
                  {error}
                </p>
              )}
              {notice && (
                <p className="flex items-start gap-2 text-xs text-green">
                  <Icon name="info" size={14} className="mt-0.5 shrink-0" />
                  {notice}
                </p>
              )}
              <Button type="submit" disabled={busy} className="mt-1">
                {busy
                  ? "Working…"
                  : mode === "signup"
                    ? "Create account"
                    : "Sign in"}
              </Button>
            </form>
            <button
              onClick={() => {
                setMode(mode === "signup" ? "signin" : "signup");
                setError(null);
                setNotice(null);
              }}
              className="mt-4 w-full text-center text-xs text-dusk hover:text-cream"
            >
              {mode === "signup"
                ? "Already have an account? Sign in"
                : "New to Lore? Create an account"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body,
  );
}
