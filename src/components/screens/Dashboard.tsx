"use client";

// Screen 1 — Chat Dashboard (PRD §5). Lists previous sessions with document
// name + last-active, and a prominent New Chat entry point.

import Link from "next/link";
import type { Session } from "@/lib/types";
import { timeAgo } from "@/lib/format";
import { studyProgress } from "@/lib/progress";
import { useStore } from "@/lib/store";
import { useSettings, PLANS, formatSubjectLimit } from "@/lib/settings";
import { Icon } from "../Icon";
import { Button } from "../Button";

interface Props {
  sessions: Session[];
  onNewChat: () => void;
  onOpen: (id: string) => void;
  onDelete: (id: string) => void;
}

export function Dashboard({ sessions, onNewChat, onOpen, onDelete }: Props) {
  const { user } = useStore();
  const { plan } = useSettings();
  const tier = PLANS[plan];
  const atLimit = sessions.length >= tier.subjects;
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 sm:py-16">
      <div className="mb-10 flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-serif text-4xl leading-tight tracking-tight sm:text-5xl">
            Your <span className="italic text-amber">subjects</span>
          </h1>
          <p className="mt-2 text-sm text-dusk">
            Every subject keeps its material, transcript, and whiteboard —
            exactly as you left it.
          </p>
          <p
            className={`mt-2 text-xs ${atLimit ? "text-amber" : "text-faint"}`}
          >
            {sessions.length} of {formatSubjectLimit(tier.subjects)} saved
            subjects on {tier.label}
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
        <Button onClick={onNewChat} className="shrink-0">
          <Icon name="plus" size={18} />
          New subject
        </Button>
      </div>

      {sessions.length === 0 ? (
        <EmptyState onNewChat={onNewChat} />
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2">
          {sessions.map((s) => (
            <li key={s.id}>
              <SubjectCard
                session={s}
                onOpen={() => onOpen(s.id)}
                onDelete={() => onDelete(s.id)}
              />
            </li>
          ))}
        </ul>
      )}

      {!user?.email && (
        <p className="mt-10 flex items-center justify-center gap-2 text-center text-xs text-faint">
          <Icon name="info" size={14} />
          <span>
            You&rsquo;re browsing anonymously.{" "}
            <Link
              href="/auth"
              className="text-amber underline underline-offset-2 transition-colors hover:text-amber-lt"
            >
              Create an account
            </Link>{" "}
            to keep your subjects across devices.
          </span>
        </p>
      )}
    </main>
  );
}

function SubjectCard({
  session,
  onOpen,
  onDelete,
}: {
  session: Session;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const isImage = session.files[0]?.kind === "image";
  const questions = session.turns.filter((t) => t.role === "student").length;
  const progress = studyProgress(session);
  return (
    <div
      onClick={onOpen}
      className="lore-card group flex h-full cursor-pointer flex-col p-5"
    >
      <div className="flex items-start justify-between gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onOpen();
          }}
          className="flex min-w-0 items-center gap-3 text-left"
        >
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-line bg-carbon text-amber">
            <Icon name={isImage ? "image" : "doc"} size={20} />
          </span>
          <span className="min-w-0">
            <span className="block truncate font-medium text-cream">
              {session.title}
            </span>
            {session.subject && (
              <span className="mt-1 inline-block rounded-full bg-amber/12 px-2 py-0.5 text-[11px] font-medium text-amber">
                {session.subject}
              </span>
            )}
          </span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
          aria-label={`Delete ${session.title}`}
          className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-faint opacity-0 transition-opacity hover:bg-carbon hover:text-red focus-visible:opacity-100 group-hover:opacity-100"
        >
          <Icon name="trash" size={17} />
        </button>
      </div>

      {/* stats */}
      <dl className="mt-5 grid grid-cols-3 gap-2 rounded-xl border border-line bg-depth/60 px-2 py-3 text-center">
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-faint">
            Documents
          </dt>
          <dd className="mt-0.5 font-serif text-lg text-cream">
            {session.files.length}
          </dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-faint">
            Questions
          </dt>
          <dd className="mt-0.5 font-serif text-lg text-cream">{questions}</dd>
        </div>
        <div>
          <dt className="text-[10px] uppercase tracking-wide text-faint">
            Words
          </dt>
          <dd className="mt-0.5 font-serif text-lg text-cream">
            {session.wordCount >= 1000
              ? `${(session.wordCount / 1000).toFixed(1)}k`
              : session.wordCount}
          </dd>
        </div>
      </dl>

      {/* progress meter */}
      <div className="mt-auto pt-5">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-dusk">Study progress</span>
          <span className="tabular-nums text-cream">{progress}%</span>
        </div>
        <div
          role="progressbar"
          aria-valuenow={progress}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`Study progress for ${session.title}`}
          className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-depth"
        >
          <div
            className="h-full rounded-full bg-amber transition-[width] duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="mt-2 text-[11px] text-faint">
          Last studied {timeAgo(session.lastActive)}
        </p>
      </div>
    </div>
  );
}

function EmptyState({ onNewChat }: { onNewChat: () => void }) {
  return (
    <div className="flex flex-col items-center gap-5 rounded-2xl border border-dashed border-line-m bg-depth/50 px-6 py-16 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-carbon text-amber">
        <Icon name="sparkle" size={30} />
      </span>
      <div>
        <p className="font-serif text-2xl">Nothing here yet.</p>
        <p className="mx-auto mt-2 max-w-sm text-sm text-dusk">
          Upload your lecture slides, textbook pages, or a photo of your notes,
          then just ask.
        </p>
      </div>
      <Button onClick={onNewChat}>
        <Icon name="plus" size={18} />
        Start your first subject
      </Button>
    </div>
  );
}
