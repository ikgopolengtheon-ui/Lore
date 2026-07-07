"use client";

// Shared authenticated-app chrome: sidebar on desktop, slim bar + chip nav on
// mobile. Used by /dashboard, /quizzes, and /whiteboards. The Study button is
// the primary action — it jumps straight into a fresh upload-and-study flow.

import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";
import { ProfileMenu } from "./ProfileMenu";

export type ShellKey =
  | "dashboard"
  | "chats"
  | "quizzes"
  | "whiteboards"
  | "settings";

const NAV: { key: ShellKey; icon: IconName; label: string; href: string }[] = [
  { key: "dashboard", icon: "sparkle", label: "Dashboard", href: "/dashboard" },
  { key: "chats", icon: "doc", label: "My chats", href: "/app" },
  { key: "quizzes", icon: "quiz", label: "Quizzes", href: "/quizzes" },
  {
    key: "whiteboards",
    icon: "whiteboard",
    label: "Whiteboards",
    href: "/whiteboards",
  },
];

export function AppShell({
  active,
  children,
}: {
  active: ShellKey;
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-dvh bg-void">
      {/* ── Sidebar (desktop) ── */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-depth/40 p-5 lg:flex">
        <Link href="/dashboard" aria-label="Lore dashboard">
          <Logo />
        </Link>

        <Link
          href="/app?new=1"
          className="mt-7 flex items-center justify-center gap-2 rounded-xl bg-amber px-4 py-3 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
        >
          <Icon name="upload" size={17} />
          Study
        </Link>

        <nav className="mt-6 flex flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.key}
              href={item.href}
              aria-current={active === item.key ? "page" : undefined}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                active === item.key
                  ? "bg-carbon font-medium text-cream"
                  : "text-dusk hover:bg-carbon/60 hover:text-cream"
              }`}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="lore-card mt-8 p-4">
          <p className="font-serif text-base text-cream">Upgrade to Pro</p>
          <p className="mt-1.5 text-xs leading-relaxed text-dusk">
            Unlimited voice questions, quizzes, and documents.
          </p>
          <Link
            href="/pricing"
            className="mt-3 block w-full rounded-lg bg-amber px-3 py-2 text-center text-xs font-semibold text-void transition-colors hover:bg-amber-lt"
          >
            Upgrade
          </Link>
        </div>

        <div className="mt-auto flex flex-col gap-2 pt-6">
          <Link
            href="/#how"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dusk transition-colors hover:bg-carbon/60 hover:text-cream"
          >
            <Icon name="info" size={17} />
            Help Center
          </Link>
          <ProfileMenu />
        </div>
      </aside>

      {/* ── Main column ── */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* mobile bar */}
        <div className="border-b border-line px-5 py-3 lg:hidden">
          <div className="flex items-center justify-between">
            <Link href="/dashboard" aria-label="Lore dashboard">
              <Logo />
            </Link>
            <div className="flex items-center gap-2">
              <Link
                href="/app?new=1"
                className="flex items-center gap-1.5 rounded-lg bg-amber px-3 py-2 text-xs font-semibold text-void"
              >
                <Icon name="upload" size={14} />
                Study
              </Link>
              <ProfileMenu compact />
            </div>
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto pb-0.5">
            {NAV.map((item) => (
              <Link
                key={item.key}
                href={item.href}
                aria-current={active === item.key ? "page" : undefined}
                className={`shrink-0 rounded-full border px-3.5 py-1.5 text-xs transition-colors ${
                  active === item.key
                    ? "border-amber/50 bg-carbon text-cream"
                    : "border-line-m text-dusk hover:text-cream"
                }`}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        </div>

        {children}
      </div>
    </div>
  );
}
