"use client";

// Settings (ref: sectioned settings surface — General / Account / Privacy /
// Billing). Device preferences (name, voice) persist via lib/settings;
// account and data actions run against the session store.

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import {
  formatSubjectLimit,
  PLANS,
  saveSettings,
  useSettings,
  type LoreSettings,
  type PlanKey,
} from "@/lib/settings";
import { Icon } from "@/components/Icon";
import { Button } from "@/components/Button";
import { AppShell } from "./AppShell";

type Tab = "general" | "voice" | "account" | "privacy" | "billing";

const TABS: { key: Tab; label: string }[] = [
  { key: "general", label: "General" },
  { key: "voice", label: "Voice" },
  { key: "account", label: "Account" },
  { key: "privacy", label: "Privacy" },
  { key: "billing", label: "Billing" },
];

export function SettingsScreen() {
  const store = useStore();
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("general");
  const prefs = useSettings();
  // local draft so typing isn't saved keystroke-by-keystroke (saved on blur)
  const [nameDraft, setNameDraft] = useState<string | null>(null);
  const [savedFlash, setSavedFlash] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmWipe, setConfirmWipe] = useState(false);

  const update = (patch: Partial<LoreSettings>) => {
    saveSettings(patch);
    setSavedFlash(true);
    window.setTimeout(() => setSavedFlash(false), 1600);
  };

  const email = store.user?.email ?? null;
  const chatCount = store.sessions.length;

  const logOut = async () => {
    setBusy(true);
    try {
      await store.signOut();
      router.push("/auth?mode=signin");
    } finally {
      setBusy(false);
    }
  };

  const wipeChats = () => {
    if (!confirmWipe) {
      setConfirmWipe(true);
      return;
    }
    for (const s of [...store.sessions]) {
      fetch("/api/rag-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: s.id }),
      }).catch(() => {});
      store.deleteSession(s.id);
    }
    setConfirmWipe(false);
  };

  return (
    <AppShell active="settings">
      <div className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex items-center justify-between gap-4">
          <h1 className="font-serif text-3xl leading-tight tracking-tight text-cream sm:text-4xl">
            Settings
          </h1>
          <span
            aria-live="polite"
            className={`flex items-center gap-1.5 text-xs text-green transition-opacity ${
              savedFlash ? "opacity-100" : "opacity-0"
            }`}
          >
            <Icon name="check" size={14} />
            Saved
          </span>
        </div>

        <div className="mt-8 flex flex-col gap-8 lg:flex-row lg:gap-12">
          {/* section nav */}
          <nav
            aria-label="Settings sections"
            className="flex gap-2 overflow-x-auto pb-1 lg:w-40 lg:shrink-0 lg:flex-col lg:pb-0"
          >
            {TABS.map((t) => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                aria-current={tab === t.key ? "page" : undefined}
                className={`shrink-0 rounded-xl px-3.5 py-2.5 text-left text-sm transition-colors ${
                  tab === t.key
                    ? "bg-carbon font-medium text-cream"
                    : "text-dusk hover:bg-carbon/60 hover:text-cream"
                }`}
              >
                {t.label}
              </button>
            ))}
          </nav>

          {/* section body */}
          <div className="min-w-0 flex-1">
            {tab === "general" && (
              <section className="lore-card p-6 sm:p-7">
                <h2 className="text-sm font-semibold text-cream">Profile</h2>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="text-sm text-dusk">Avatar</span>
                  <span className="grid h-11 w-11 place-items-center rounded-full bg-amber/15 text-base font-semibold text-amber">
                    {(prefs.name || email || "?")[0].toUpperCase()}
                  </span>
                </div>
                <label className="mt-6 block">
                  <span className="text-sm text-dusk">
                    What should Lore call you?
                  </span>
                  <input
                    type="text"
                    value={nameDraft ?? prefs.name}
                    maxLength={40}
                    onChange={(e) => setNameDraft(e.target.value)}
                    onBlur={(e) => {
                      update({ name: e.target.value.trim() });
                      setNameDraft(null);
                    }}
                    placeholder="Your name"
                    className="mt-2 w-full rounded-lg border border-line-m bg-depth px-3.5 py-3 text-sm text-cream outline-none placeholder:text-faint focus:border-amber/60 sm:max-w-xs"
                  />
                </label>
                <p className="mt-3 text-xs leading-relaxed text-faint">
                  Lore uses this when it speaks to you. Saved on this device.
                </p>
              </section>
            )}

            {tab === "voice" && (
              <section className="lore-card p-6 sm:p-7">
                <h2 className="text-sm font-semibold text-cream">Voice</h2>
                <label className="mt-6 block">
                  <span className="flex items-center justify-between text-sm text-dusk">
                    Default speaking speed
                    <span className="tabular-nums text-cream">
                      {prefs.speed.toFixed(2)}×
                    </span>
                  </span>
                  <input
                    type="range"
                    min={0.75}
                    max={2}
                    step={0.25}
                    value={prefs.speed}
                    onChange={(e) =>
                      update({ speed: parseFloat(e.target.value) })
                    }
                    className="mt-3 w-full accent-amber"
                    aria-label="Default speaking speed"
                  />
                </label>
                <p className="mt-2 text-xs text-faint">
                  New study sessions start at this speed; you can still adjust
                  mid-answer.
                </p>

                <h3 className="mt-8 text-sm text-dusk">Voice quality</h3>
                <div className="mt-3 flex flex-col gap-2">
                  {(
                    [
                      {
                        key: "premium",
                        title: "Premium",
                        body: "The richest voice — uses your plan's premium hours.",
                      },
                      {
                        key: "standard",
                        title: "Standard",
                        body: "Always available, never metered.",
                      },
                    ] as const
                  ).map((v) => (
                    <label
                      key={v.key}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                        prefs.voice === v.key
                          ? "border-amber/60 bg-amber/5"
                          : "border-line-m hover:border-line-m"
                      }`}
                    >
                      <input
                        type="radio"
                        name="voice"
                        checked={prefs.voice === v.key}
                        onChange={() => update({ voice: v.key })}
                        className="mt-1 accent-amber"
                      />
                      <span>
                        <span className="block text-sm font-medium text-cream">
                          {v.title}
                        </span>
                        <span className="mt-0.5 block text-xs text-dusk">
                          {v.body}
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </section>
            )}

            {tab === "account" && (
              <section className="lore-card p-6 sm:p-7">
                <h2 className="text-sm font-semibold text-cream">Account</h2>
                {email ? (
                  <>
                    <div className="mt-5 flex items-center justify-between gap-4">
                      <span className="text-sm text-dusk">Email</span>
                      <span className="truncate text-sm text-cream">
                        {email}
                      </span>
                    </div>
                    <div className="mt-3 flex items-center justify-between gap-4">
                      <span className="text-sm text-dusk">Subjects synced</span>
                      <span className="text-sm text-cream">
                        {store.synced ? "Across devices" : "This device"}
                      </span>
                    </div>
                    <div className="mt-6 border-t border-line pt-5">
                      <Button
                        variant="secondary"
                        onClick={logOut}
                        disabled={busy}
                      >
                        <Icon name="logout" size={16} />
                        {busy ? "Logging out…" : "Log out"}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="mt-4 text-sm leading-relaxed text-dusk">
                      You&rsquo;re not signed in. Studying needs an account —
                      and it keeps your chats on every device.
                    </p>
                    <Link
                      href="/auth?mode=signin"
                      className="mt-5 inline-block rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
                    >
                      Log in or sign up
                    </Link>
                  </>
                )}
              </section>
            )}

            {tab === "privacy" && (
              <section className="lore-card p-6 sm:p-7">
                <h2 className="text-sm font-semibold text-cream">Privacy</h2>
                <p className="mt-4 text-sm leading-relaxed text-dusk">
                  Your documents are used only to answer your questions —
                  they&rsquo;re never used to train models and never leave
                  your account. Deleting a subject also deletes its indexed
                  content.
                </p>
                <div className="mt-6 rounded-xl border border-red/30 bg-red/5 p-5">
                  <h3 className="text-sm font-medium text-cream">
                    Delete all subjects
                  </h3>
                  <p className="mt-1.5 text-xs leading-relaxed text-dusk">
                    Permanently removes {chatCount === 1 ? "your 1 subject" : `all ${chatCount} subjects`},
                    including documents, transcripts, whiteboards, and indexed
                    content. This can&rsquo;t be undone.
                  </p>
                  <div className="mt-4 flex items-center gap-3">
                    <button
                      onClick={wipeChats}
                      disabled={chatCount === 0}
                      className={`rounded-lg px-4 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
                        confirmWipe
                          ? "bg-red text-void hover:bg-red/80"
                          : "border border-red/50 text-red hover:bg-red/10"
                      }`}
                    >
                      {confirmWipe
                        ? "Yes, delete everything"
                        : "Delete all subjects"}
                    </button>
                    {confirmWipe && (
                      <button
                        onClick={() => setConfirmWipe(false)}
                        className="text-xs text-dusk hover:text-cream"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              </section>
            )}

            {tab === "billing" && (
              <section className="lore-card p-6 sm:p-7">
                <h2 className="text-sm font-semibold text-cream">Billing</h2>
                <div className="mt-5 flex items-center justify-between gap-4">
                  <span className="text-sm text-dusk">Current plan</span>
                  <span className="rounded-full border border-amber/40 bg-amber/10 px-3 py-1 text-xs font-medium text-amber">
                    {PLANS[prefs.plan].label} · early access
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between gap-4">
                  <span className="text-sm text-dusk">Saved subjects</span>
                  <span className="text-sm text-cream">
                    {chatCount} of {formatSubjectLimit(PLANS[prefs.plan].subjects)}
                  </span>
                </div>

                <h3 className="mt-7 text-sm text-dusk">Preview a tier</h3>
                <div className="mt-3 flex flex-col gap-2">
                  {(Object.keys(PLANS) as PlanKey[]).map((key) => (
                    <label
                      key={key}
                      className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-colors ${
                        prefs.plan === key
                          ? "border-amber/60 bg-amber/5"
                          : "border-line-m"
                      }`}
                    >
                      <input
                        type="radio"
                        name="plan"
                        checked={prefs.plan === key}
                        onChange={() => update({ plan: key })}
                        className="mt-1 accent-amber"
                      />
                      <span>
                        <span className="block text-sm font-medium text-cream">
                          {PLANS[key].label}
                        </span>
                        <span className="mt-0.5 block text-xs text-dusk">
                          {formatSubjectLimit(PLANS[key].subjects)} saved
                          subjects
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
                <p className="mt-4 text-sm leading-relaxed text-dusk">
                  Paid plans launch with the public release — until then you
                  can preview any tier, and studying is on the house.
                </p>
                <Link
                  href="/pricing"
                  className="mt-5 inline-block rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
                >
                  See plans
                </Link>
              </section>
            )}
          </div>
        </div>
      </div>
    </AppShell>
  );
}
