"use client";

// Screen 1 — Chat Dashboard (PRD §5). Lists previous sessions with document
// name + last-active, and a prominent New Chat entry point.

import Link from "next/link";
import type { Session } from "@/lib/types";
import { timeAgo } from "@/lib/format";
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
        <ul className="flex flex-col gap-2.5">
          {sessions.map((s) => (
            <li key={s.id}>
              <SessionRow
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

function SessionRow({
  session,
  onOpen,
  onDelete,
}: {
  session: Session;
  onOpen: () => void;
  onDelete: () => void;
}) {
  const file = session.files[0];
  const isImage = file?.kind === "image";
  return (
    <div className="group flex items-center gap-4 rounded-xl border border-line bg-depth p-4 transition-colors hover:border-line-m">
      <button
        onClick={onOpen}
        className="flex flex-1 items-center gap-4 text-left"
      >
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg border border-line bg-carbon text-amber">
          <Icon name={isImage ? "image" : "doc"} size={22} />
        </span>
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span className="truncate font-medium text-cream">
              {session.title}
            </span>
            {session.subject && (
              <span className="rounded-full bg-amber/12 px-2 py-0.5 text-[11px] font-medium text-amber">
                {session.subject}
              </span>
            )}
          </span>
          <span className="mt-0.5 block truncate text-xs text-dusk">
            {session.files.length > 0
              ? `${session.files.length} ${session.files.length === 1 ? "document" : "documents"}`
              : "No material yet"}{" "}
            · {session.turns.length} turns · {timeAgo(session.lastActive)}
          </span>
        </span>
      </button>
      <button
        onClick={onDelete}
        aria-label={`Delete ${session.title}`}
        className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-faint opacity-0 transition-opacity hover:bg-carbon hover:text-red group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Icon name="trash" size={18} />
      </button>
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
