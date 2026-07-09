"use client";

// Whiteboard gallery: every subject appears (fixes boards-only filtering
// that hid existing chats) — subjects with a saved board show a handwritten
// preview, the rest offer to start one. Saved boards are metered per tier
// (Focus 5 / Scholar 15 / Mastery unlimited); at the limit, starting new
// boards routes to /pricing instead.

import Link from "next/link";
import type { Session } from "@/lib/types";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { useSettings, PLANS, formatSubjectLimit } from "@/lib/settings";
import { Icon } from "@/components/Icon";
import { AppShell } from "./AppShell";

export function WhiteboardsScreen() {
  const store = useStore();
  const { plan } = useSettings();
  const tier = PLANS[plan];

  const subjects = [...store.sessions].sort(
    (a, b) => b.lastActive - a.lastActive,
  );
  const boardsUsed = subjects.filter((s) => s.whiteboard.length > 0).length;
  const atLimit = boardsUsed >= tier.boards;

  return (
    <AppShell active="whiteboards">
      <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-3xl leading-tight tracking-tight text-cream sm:text-4xl">
              Your <span className="italic text-amber">whiteboards</span>
            </h1>
            <p className="mt-2 text-sm text-dusk">
              Every board Lore has written on, saved with its subject —
              equations, derivations, and the tricky bits.
            </p>
            <p
              className={`mt-2 text-xs ${atLimit ? "text-amber" : "text-faint"}`}
            >
              {boardsUsed} of {formatSubjectLimit(tier.boards)} saved
              whiteboards on {tier.label}
              {atLimit && (
                <>
                  {" — "}
                  <Link
                    href="/pricing"
                    className="underline underline-offset-2 hover:text-amber-lt"
                  >
                    upgrade for more
                  </Link>
                </>
              )}
            </p>
          </div>
          {subjects.length > 0 &&
            (atLimit ? (
              <Link
                href="/pricing"
                className="flex shrink-0 items-center gap-2 rounded-xl border border-amber/50 px-4 py-2.5 text-sm font-semibold text-amber transition-colors hover:bg-amber/10"
              >
                Upgrade for more boards
              </Link>
            ) : (
              <Link
                href="/app?new=1&mode=whiteboard"
                className="flex shrink-0 items-center gap-2 rounded-xl bg-amber px-4 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
              >
                <Icon name="plus" size={16} />
                New board
              </Link>
            ))}
        </div>

        {subjects.length === 0 ? (
          <div className="lore-card mt-10 flex flex-col items-center gap-4 p-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line-m bg-carbon text-amber">
              <Icon name="whiteboard" size={22} />
            </span>
            <p className="max-w-sm text-sm leading-relaxed text-dusk">
              No subjects yet. Upload material and open the board — Lore
              writes the steps out as it explains, and they&rsquo;re saved
              here.
            </p>
            <Link
              href="/app?new=1&mode=whiteboard"
              className="flex items-center gap-2 rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
            >
              <Icon name="plus" size={16} />
              Start a board
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {subjects.map((s) => (
              <li key={s.id}>
                <BoardCard session={s} locked={atLimit} />
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}

function BoardCard({ session: s, locked }: { session: Session; locked: boolean }) {
  const hasBoard = s.whiteboard.length > 0;

  // a boardless subject at the limit can't start a new board — upgrade
  if (!hasBoard && locked) {
    return (
      <Link
        href="/pricing"
        className="lore-card group block h-full p-5 opacity-80"
      >
        <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-line-m bg-depth/50 p-4">
          <p className="text-center font-hand text-sm text-faint">
            Board limit reached
          </p>
        </div>
        <div className="mt-4 flex items-center justify-between gap-3">
          <span className="min-w-0">
            <span className="block truncate text-sm font-medium text-cream">
              {s.title}
            </span>
            <span className="mt-0.5 block text-xs text-dusk">
              {timeAgo(s.lastActive)}
            </span>
          </span>
          <span className="shrink-0 text-xs font-medium text-amber">
            Upgrade →
          </span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      href={`/app?session=${s.id}&mode=whiteboard`}
      className="lore-card group block h-full p-5"
    >
      {hasBoard ? (
        <div className="rounded-xl bg-[#12100c] p-4">
          {s.whiteboard.slice(0, 3).map((step, i) => (
            <p
              key={i}
              className={`truncate font-hand text-sm leading-relaxed ${
                step.emphasis ? "text-amber" : "text-cream"
              }`}
            >
              {step.text}
            </p>
          ))}
          {s.whiteboard.length > 3 && (
            <p className="mt-1 font-hand text-xs text-faint">
              + {s.whiteboard.length - 3} more…
            </p>
          )}
        </div>
      ) : (
        <div className="grid min-h-24 place-items-center rounded-xl border border-dashed border-line-m bg-depth/50 p-4">
          <p className="flex items-center gap-2 font-hand text-sm text-dusk">
            <Icon name="whiteboard" size={16} />
            No board yet — start one
          </p>
        </div>
      )}
      <div className="mt-4 flex items-center justify-between gap-3">
        <span className="min-w-0">
          <span className="block truncate text-sm font-medium text-cream">
            {s.title}
          </span>
          <span className="mt-0.5 block text-xs text-dusk">
            {hasBoard
              ? `${s.whiteboard.length} steps · ${timeAgo(s.lastActive)}`
              : timeAgo(s.lastActive)}
          </span>
        </span>
        <span className="shrink-0 text-xs font-medium text-amber transition-colors group-hover:text-amber-lt">
          {hasBoard ? "Open →" : "Start board →"}
        </span>
      </div>
    </Link>
  );
}
