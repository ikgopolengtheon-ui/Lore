"use client";

// Profile button + pop-up menu (ref: account menu with settings / help /
// upgrade / log out). Full row at the bottom of the sidebar; `compact`
// renders just the avatar for the mobile bar, with the menu dropping down
// instead of up.

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { PLANS, useSettings } from "@/lib/settings";
import { Icon, type IconName } from "@/components/Icon";

const ITEMS: { icon: IconName; label: string; href: string }[] = [
  { icon: "settings", label: "Settings", href: "/settings" },
  { icon: "info", label: "Get help", href: "/#faq" },
  { icon: "upload", label: "Upgrade plan", href: "/pricing" },
];

export function ProfileMenu({ compact }: { compact?: boolean }) {
  const { user, signOut } = useStore();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { name: displayName, plan } = useSettings();
  const rootRef = useRef<HTMLDivElement>(null);

  // dismiss on outside click / Escape
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const email = user?.email ?? null;
  const name = displayName || (email ? email.split("@")[0] : "Student");
  const initial = (displayName || email || "?")[0].toUpperCase();

  const logOut = async () => {
    if (busy) return;
    setBusy(true);
    try {
      await signOut();
      router.push("/auth?mode=signin");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={
          compact
            ? "grid h-9 w-9 place-items-center rounded-full bg-amber/15 text-sm font-semibold text-amber transition-colors hover:bg-amber/25"
            : "flex w-full items-center gap-3 rounded-xl px-2.5 py-2 text-left transition-colors hover:bg-carbon/60"
        }
      >
        {compact ? (
          initial
        ) : (
          <>
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber/15 text-sm font-semibold text-amber">
              {initial}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-medium text-cream">
                {name}
              </span>
              <span className="block text-xs text-faint">
                {PLANS[plan].label} plan · early access
              </span>
            </span>
            <span
              className={`shrink-0 text-faint transition-transform ${open ? "rotate-180" : ""}`}
            >
              <Icon name="chevron" size={14} />
            </span>
          </>
        )}
      </button>

      {open && (
        <div
          role="menu"
          className={`absolute z-50 w-60 rounded-2xl border border-line-m bg-carbon p-1.5 shadow-2xl shadow-black/50 ${
            compact ? "right-0 top-full mt-2" : "bottom-full left-0 mb-2"
          }`}
        >
          <p className="truncate px-3 py-2 text-xs text-faint">
            {email ?? "Not signed in"}
          </p>
          <div className="my-1 h-px bg-line" />
          {ITEMS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              role="menuitem"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dusk transition-colors hover:bg-depth hover:text-cream"
            >
              <Icon name={item.icon} size={16} />
              {item.label}
            </Link>
          ))}
          <div className="my-1 h-px bg-line" />
          {email ? (
            <button
              role="menuitem"
              onClick={logOut}
              disabled={busy}
              className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm text-dusk transition-colors hover:bg-depth hover:text-cream disabled:opacity-50"
            >
              <Icon name="logout" size={16} />
              {busy ? "Logging out…" : "Log out"}
            </button>
          ) : (
            <Link
              role="menuitem"
              href="/auth?mode=signin"
              onClick={() => setOpen(false)}
              className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dusk transition-colors hover:bg-depth hover:text-cream"
            >
              <Icon name="logout" size={16} />
              Log in
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
