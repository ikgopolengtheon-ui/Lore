"use client";

// Whiteboard gallery: each chat's saved board with a handwritten preview of
// its latest steps. Opening one goes to the session at /app, where the full
// whiteboard lives.

import Link from "next/link";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { AppShell } from "./AppShell";

export function WhiteboardsScreen() {
  const store = useStore();
  const boards = [...store.sessions]
    .filter((s) => s.whiteboard.length > 0)
    .sort((a, b) => b.lastActive - a.lastActive);

  return (
    <AppShell active="whiteboards">
      <main className="mx-auto w-full max-w-4xl px-5 py-8 sm:px-8 sm:py-12">
        <h1 className="font-serif text-3xl leading-tight tracking-tight text-cream sm:text-4xl">
          Your <span className="italic text-amber">whiteboards</span>
        </h1>
        <p className="mt-2 text-sm text-dusk">
          Every board Lore has written on, saved with its chat — equations,
          derivations, and the tricky bits.
        </p>

        {boards.length === 0 ? (
          <div className="lore-card mt-10 flex flex-col items-center gap-4 p-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line-m bg-carbon text-amber">
              <Icon name="whiteboard" size={22} />
            </span>
            <p className="max-w-sm text-sm leading-relaxed text-dusk">
              No whiteboards yet. When you ask about maths, physics, or
              chemistry, Lore writes the steps out — they&rsquo;re saved here.
            </p>
            <Link
              href="/app?new=1"
              className="flex items-center gap-2 rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
            >
              <Icon name="upload" size={16} />
              Study
            </Link>
          </div>
        ) : (
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {boards.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app?session=${s.id}`}
                  className="lore-card group block h-full p-5"
                >
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
                  <div className="mt-4 flex items-center justify-between gap-3">
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium text-cream">
                        {s.title}
                      </span>
                      <span className="mt-0.5 block text-xs text-dusk">
                        {s.whiteboard.length} steps · {timeAgo(s.lastActive)}
                      </span>
                    </span>
                    <span className="shrink-0 text-xs font-medium text-amber transition-colors group-hover:text-amber-lt">
                      Open →
                    </span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
