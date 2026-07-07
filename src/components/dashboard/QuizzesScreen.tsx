"use client";

// Quiz hub: every chat with study material, ready to quiz on. Clicking one
// opens the session at /app directly in quiz mode.

import Link from "next/link";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { AppShell } from "./AppShell";

export function QuizzesScreen() {
  const store = useStore();
  const ready = [...store.sessions]
    .filter((s) => Boolean(s.documentText))
    .sort((a, b) => b.lastActive - a.lastActive);

  return (
    <AppShell active="quizzes">
      <main className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-8 sm:py-12">
        <h1 className="font-serif text-3xl leading-tight tracking-tight text-cream sm:text-4xl">
          Quiz <span className="italic text-amber">yourself</span>
        </h1>
        <p className="mt-2 text-sm text-dusk">
          Pick a subject — Lore asks questions from its material, you answer
          aloud, and it tells you where you stand.
        </p>

        {ready.length === 0 ? (
          <div className="lore-card mt-10 flex flex-col items-center gap-4 p-10 text-center">
            <span className="grid h-12 w-12 place-items-center rounded-2xl border border-line-m bg-carbon text-amber">
              <Icon name="quiz" size={22} />
            </span>
            <p className="max-w-sm text-sm leading-relaxed text-dusk">
              No study material yet. Upload a document first — once Lore has
              read it, you can quiz yourself on it here.
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
          <ul className="mt-8 flex flex-col gap-2.5">
            {ready.map((s) => (
              <li key={s.id}>
                <Link
                  href={`/app?session=${s.id}&mode=quiz`}
                  className="lore-card group flex items-center gap-4 p-5"
                >
                  <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line-m bg-carbon text-amber">
                    <Icon
                      name={s.files[0]?.kind === "image" ? "image" : "quiz"}
                      size={20}
                    />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-cream">
                      {s.title}
                    </span>
                    <span className="mt-0.5 block text-xs text-dusk">
                      {s.subject ? `${s.subject} · ` : ""}
                      {s.wordCount.toLocaleString()} words ·{" "}
                      {timeAgo(s.lastActive)}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-1.5 text-xs font-medium text-amber transition-colors group-hover:text-amber-lt">
                    Take quiz
                    <span className="-rotate-90 inline-block">
                      <Icon name="chevron" size={13} />
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </AppShell>
  );
}
