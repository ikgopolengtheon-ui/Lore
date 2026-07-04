"use client";

// Screen: dedicated sign-in / sign-up page (/auth). Split layout: brand +
// auth card on the left, atmospheric lamp image on the right (photo if
// public/auth-lamp.jpg exists, CSS recreation otherwise). All login/signup
// entry points across the app route here.

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { signInWithGoogle } from "@/lib/supabase";
import { Logo } from "./Logo";
import { Icon } from "./Icon";
import { Button } from "./Button";

export function AuthScreen({ photo }: { photo: string | null }) {
  const { user } = useStore();
  const signedIn = Boolean(user?.email);

  return (
    <div className="flex min-h-dvh bg-void">
      {/* ── Left: brand + auth card ── */}
      <div className="relative flex w-full flex-col px-6 py-6 lg:w-[46%] lg:shrink-0">
        <div className="flex items-center justify-between">
          <Link href="/" aria-label="Lore home" className="rounded-lg">
            <Logo />
          </Link>
          <Link
            href="/app"
            className="text-sm text-dusk transition-colors hover:text-cream"
          >
            Back to the app
          </Link>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center py-12 text-center">
          <h1 className="font-serif text-4xl leading-[1.08] tracking-tight text-cream sm:text-5xl">
            Learn <span className="italic text-amber">out loud.</span>
          </h1>
          <p className="mx-auto mt-4 max-w-sm text-base leading-relaxed text-dusk">
            Lore keeps every chat, document, and whiteboard exactly as you
            left it — on every device you sign in to.
          </p>

          <div className="mt-10">
            {signedIn ? <SignedInCard /> : <AuthCard />}
          </div>

          {!signedIn && (
            <p className="mt-6 text-xs text-faint">
              Just looking?{" "}
              <Link
                href="/app"
                className="text-dusk underline underline-offset-2 transition-colors hover:text-cream"
              >
                Continue without an account
              </Link>
            </p>
          )}
        </div>
      </div>

      {/* ── Right: lamp scene ── */}
      <div className="relative hidden flex-1 overflow-hidden lg:block">
        {photo ? (
          <Image
            src={photo}
            alt=""
            fill
            priority
            sizes="54vw"
            className="object-cover"
          />
        ) : (
          <LampScene />
        )}
      </div>
    </div>
  );
}

// ── The auth card (mode toggle, email + password) ──────────────────
function AuthCard() {
  const { signUp, signIn } = useStore();
  const router = useRouter();
  const params = useSearchParams();
  const [mode, setMode] = useState<"signin" | "signup">(
    params.get("mode") === "signin" ? "signin" : "signup",
  );
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [googleBusy, setGoogleBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const google = async () => {
    if (googleBusy) return;
    setError(null);
    setNotice(null);
    setGoogleBusy(true);
    try {
      await signInWithGoogle();
      // success = the browser is redirecting to Google; stay "busy"
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
      setGoogleBusy(false);
    }
  };

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
      router.push("/app");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Try again.",
      );
      setBusy(false);
    }
  };

  return (
    <div>
      {/* banner peeking above the card, like a release strip */}
      <div className="rounded-t-2xl border border-b-0 border-amber/25 bg-amber/10 px-4 pb-5 pt-2 text-xs text-amber">
        {mode === "signup"
          ? "Your anonymous chats come with you — nothing is lost."
          : "Welcome back. Your chats are where you left them."}
      </div>
      <div className="relative -mt-3 rounded-2xl border border-line-m bg-carbon p-6 shadow-2xl">
        <button
          type="button"
          onClick={google}
          disabled={googleBusy}
          className="flex w-full items-center justify-center gap-2.5 rounded-lg border border-line-m bg-depth px-3.5 py-3 text-sm font-medium text-cream transition-colors hover:border-amber/50 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <GoogleG />
          {googleBusy ? "Opening Google…" : "Continue with Google"}
        </button>

        <div className="my-4 flex items-center gap-3" aria-hidden>
          <span className="h-px flex-1 bg-line-m" />
          <span className="text-[11px] uppercase tracking-widest text-faint">
            or
          </span>
          <span className="h-px flex-1 bg-line-m" />
        </div>

        <form onSubmit={submit} className="flex flex-col gap-3">
          <input
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            aria-label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-lg border border-line-m bg-depth px-3.5 py-3 text-sm text-cream outline-none placeholder:text-faint focus:border-amber/60"
          />
          <input
            type="password"
            required
            minLength={6}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            placeholder="Password (min 6 characters)"
            aria-label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-lg border border-line-m bg-depth px-3.5 py-3 text-sm text-cream outline-none placeholder:text-faint focus:border-amber/60"
          />
          {error && (
            <p className="flex items-start gap-2 text-left text-xs text-red">
              <Icon name="warning" size={14} className="mt-0.5 shrink-0" />
              {error}
            </p>
          )}
          {notice && (
            <p className="flex items-start gap-2 text-left text-xs text-green">
              <Icon name="info" size={14} className="mt-0.5 shrink-0" />
              {notice}
            </p>
          )}
          <Button type="submit" disabled={busy} className="mt-1 w-full py-3">
            {busy
              ? "Working…"
              : mode === "signup"
                ? "Create account"
                : "Log in"}
          </Button>
        </form>
        <button
          onClick={() => {
            setMode(mode === "signup" ? "signin" : "signup");
            setError(null);
            setNotice(null);
          }}
          className="mt-4 w-full text-center text-xs text-dusk transition-colors hover:text-cream"
        >
          {mode === "signup"
            ? "Already have an account? Log in"
            : "New to Lore? Create an account"}
        </button>
      </div>
    </div>
  );
}

// Official multicolour Google "G" mark.
function GoogleG() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.41 5.41 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.59A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

// ── Signed-in state: manage the account instead of a form ──────────
function SignedInCard() {
  const { user, signOut } = useStore();
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  const doSignOut = async () => {
    setBusy(true);
    try {
      await signOut();
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-2xl border border-line-m bg-carbon p-6 shadow-2xl">
      <p className="text-sm text-dusk">
        Signed in as <span className="text-cream">{user!.email}</span>. Your
        chats sync across devices.
      </p>
      <div className="mt-5 flex flex-col gap-2">
        <Button onClick={() => router.push("/app")} className="w-full py-3">
          Go to your chats
        </Button>
        <Button
          variant="secondary"
          onClick={doSignOut}
          disabled={busy}
          className="w-full py-3"
        >
          {busy ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </div>
  );
}

// ── CSS recreation of the lamp photograph ──────────────────────────
// A warm table lamp glowing in darkness — the fallback shown until
// public/auth-lamp.jpg is added. Pure gradients, no assets.
function LampScene() {
  return (
    <div aria-hidden className="absolute inset-0 bg-black">
      {/* ambient halo */}
      <div
        className="absolute left-1/2 top-1/2 h-[130%] w-[130%] -translate-x-1/2 -translate-y-1/2"
        style={{
          background:
            "radial-gradient(closest-side, rgba(212,120,40,0.30) 0%, rgba(140,70,20,0.10) 42%, transparent 68%)",
        }}
      />
      {/* lamp, centred */}
      <div className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center">
        {/* shade */}
        <div
          style={{
            width: 210,
            height: 165,
            clipPath: "polygon(22% 0%, 78% 0%, 100% 100%, 0% 100%)",
            background:
              "radial-gradient(ellipse 70% 60% at 50% 62%, #ffb04d 0%, #f07f22 55%, #c85a12 100%)",
            filter: "drop-shadow(0 0 70px rgba(240,130,40,0.55))",
          }}
        />
        {/* neck */}
        <div
          style={{
            width: 34,
            height: 26,
            marginTop: -1,
            borderRadius: "0 0 12px 12px",
            background:
              "linear-gradient(180deg, #ffc470 0%, #f1a047 100%)",
            boxShadow: "0 0 34px rgba(255,170,80,0.8)",
          }}
        />
        {/* base */}
        <div
          style={{
            width: 120,
            height: 132,
            marginTop: -6,
            borderRadius: "48% 48% 44% 44% / 56% 56% 42% 42%",
            background:
              "radial-gradient(ellipse 60% 45% at 50% 30%, #ffd89a 0%, #f0a851 45%, #b06018 78%, #5c2e0a 100%)",
            boxShadow: "0 0 60px rgba(240,150,60,0.45)",
          }}
        />
        {/* floor glow */}
        <div
          style={{
            width: 340,
            height: 60,
            marginTop: -18,
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse closest-side, rgba(200,110,30,0.5) 0%, transparent 70%)",
            filter: "blur(10px)",
          }}
        />
      </div>
      {/* vignette into the page background */}
      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 75% 70% at 50% 48%, transparent 55%, rgba(0,0,0,0.9) 100%)",
        }}
      />
    </div>
  );
}
