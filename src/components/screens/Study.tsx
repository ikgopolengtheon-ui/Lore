"use client";

// Screens 4/5/6 — Study Idle / Listening / Response (PRD §5).
// Push-to-talk → mock STT → grounded answer streamed as text + simulated TTS,
// with Whiteboard Mode auto-activating for STEM responses.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, Turn, WhiteboardStep } from "@/lib/types";
import {
  classifyStem,
  mockAnswer,
  mockTranscribe,
  uid,
} from "@/lib/mockAI";
import { useStore } from "@/lib/store";
import { MicButton } from "../MicButton";
import { Whiteboard } from "../Whiteboard";
import { Icon } from "../Icon";

interface Props {
  session: Session;
  offline: boolean;
  onQuiz: () => void;
  onMicDenied: () => void;
  onLlmError: (retry: () => void) => void;
  pushToast: (text: string, tone?: "neutral" | "error" | "success") => void;
}

interface LiveTurn {
  text: string;
  steps: WhiteboardStep[];
  revealed: number;
  grounded: boolean;
}

const BASE_TICK = 55; // ms per streaming tick at 1× speed

export function Study({
  session,
  offline,
  onQuiz,
  onMicDenied,
  onLlmError,
  pushToast,
}: Props) {
  const { addTurn, setWhiteboard } = useStore();
  const [studyState, setStudyState] = useState<
    "idle" | "thinking" | "responding"
  >("idle");
  const [live, setLive] = useState<LiveTurn | null>(null);
  const [wbOpen, setWbOpen] = useState(session.whiteboard.length > 0);
  const [speed, setSpeed] = useState(1);
  const [paused, setPaused] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const speedRef = useRef(speed);
  speedRef.current = speed;
  const pausedRef = useRef(paused);
  pausedRef.current = paused;

  // keep transcript pinned to the newest content
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session.turns.length, live?.text, live?.revealed]);

  const clearTimers = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = null;
  };
  useEffect(() => clearTimers, []);

  const runResponse = useCallback(
    (question: string) => {
      const answer = mockAnswer(question);
      const steps = answer.steps ?? [];
      const stem =
        answer.grounded && steps.length > 0 && classifyStem(answer.text);

      if (stem) setWbOpen(true);

      setStudyState("responding");
      setLive({ text: "", steps, revealed: 0, grounded: answer.grounded });

      // stream the answer word-by-word to mimic LLM + TTS streaming (PRD §4.4).
      // A self-rescheduling timeout naturally honours live speed + pause
      // changes via refs, with a single timer to tear down.
      const words = answer.text.split(" ");
      let i = 0;
      const stepInterval = steps.length
        ? Math.max(1, Math.floor(words.length / steps.length))
        : 0;

      const commit = () => {
        addTurn(session.id, {
          id: uid(),
          role: "lore",
          text: answer.text,
          steps: steps.length ? steps : undefined,
          grounded: answer.grounded,
          createdAt: Date.now(),
        });
        if (steps.length) setWhiteboard(session.id, steps);
        setLive(null);
        setStudyState("idle");
        setPaused(false);
        timerRef.current = null;
      };

      const tick = () => {
        if (pausedRef.current) {
          timerRef.current = setTimeout(tick, 90); // idle-poll while paused
          return;
        }
        i += 2;
        const revealed = stepInterval
          ? Math.min(steps.length, Math.floor(i / stepInterval))
          : 0;
        setLive({
          text: words.slice(0, i).join(" "),
          steps,
          revealed,
          grounded: answer.grounded,
        });
        if (i >= words.length) {
          commit();
          return;
        }
        timerRef.current = setTimeout(tick, BASE_TICK / speedRef.current);
      };

      timerRef.current = setTimeout(tick, BASE_TICK / speedRef.current);
    },
    [addTurn, setWhiteboard, session.id],
  );

  const handleQuestion = useCallback(() => {
    const transcript = mockTranscribe();
    addTurn(session.id, {
      id: uid(),
      role: "student",
      text: transcript,
      createdAt: Date.now(),
    });
    setStudyState("thinking");
    // response delay — never instant (PRD audio brand: 300–800ms)
    const delay = 300 + Math.random() * 500;
    setTimeout(() => {
      // ~8% simulated LLM failure → Screen 8.7 with retry
      if (Math.random() < 0.08) {
        setStudyState("idle");
        onLlmError(() => runResponse(transcript));
        return;
      }
      runResponse(transcript);
    }, delay);
  }, [addTurn, session.id, runResponse, onLlmError]);

  const hasSteps = live?.steps.length || session.whiteboard.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      {/* session sub-header */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <div className="min-w-0">
          <h2 className="truncate font-serif text-lg text-cream">
            {session.title}
          </h2>
          <p className="truncate text-xs text-dusk">
            {session.files[0]?.name ?? "No document"} · grounded answers only
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <button
            onClick={() => setWbOpen((v) => !v)}
            aria-pressed={wbOpen}
            className={`flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-medium transition-colors ${
              wbOpen
                ? "border-amber/60 bg-amber/10 text-amber"
                : "border-line-m text-dusk hover:text-cream"
            }`}
          >
            <Icon name="whiteboard" size={16} />
            <span className="hidden sm:inline">Whiteboard</span>
          </button>
          <button
            onClick={onQuiz}
            className="flex items-center gap-1.5 rounded-lg border border-line-m px-3 py-2 text-xs font-medium text-dusk transition-colors hover:text-cream"
          >
            <Icon name="quiz" size={16} />
            <span className="hidden sm:inline">Quiz Mode</span>
          </button>
        </div>
      </div>

      {/* body: transcript (+ whiteboard when open) */}
      <div
        className={`grid flex-1 gap-0 overflow-hidden ${
          wbOpen ? "lg:grid-cols-2" : "grid-cols-1"
        }`}
      >
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto px-4 py-6 sm:px-6"
        >
          <div className="mx-auto flex max-w-2xl flex-col gap-4">
            {session.turns.length === 0 && !live && (
              <div className="mt-16 text-center">
                <p className="font-serif text-2xl text-cream">
                  Ask Lore anything about your document.
                </p>
                <p className="mt-2 text-sm text-dusk">
                  Hold the mic to begin.
                </p>
              </div>
            )}

            <ul
              className="flex flex-col gap-4"
              aria-live="polite"
              aria-label="Conversation transcript"
            >
              {session.turns.map((t) => (
                <TurnBubble key={t.id} turn={t} onRetry={undefined} />
              ))}
              {live && (
                <TurnBubble
                  turn={{
                    id: "live",
                    role: "lore",
                    text: live.text || "…",
                    steps: live.steps.slice(0, live.revealed),
                    grounded: live.grounded,
                    createdAt: Date.now(),
                  }}
                  streaming
                />
              )}
              {studyState === "thinking" && (
                <li className="flex items-center gap-2 text-sm text-dusk">
                  <Spinner /> Lore is thinking…
                </li>
              )}
            </ul>
          </div>
        </div>

        {wbOpen && (
          <div className="border-t border-line p-3 lg:border-l lg:border-t-0">
            <Whiteboard
              steps={live?.steps ?? session.whiteboard}
              revealed={
                live ? live.revealed : session.whiteboard.length
              }
              onClose={() => setWbOpen(false)}
            />
          </div>
        )}
      </div>

      {/* footer: TTS controls + mic (sticky) */}
      <div className="sticky bottom-0 border-t border-line bg-void/90 px-4 py-4 backdrop-blur sm:px-6">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-4">
          {studyState === "responding" && (
            <div className="flex items-center gap-4">
              <button
                onClick={() => setPaused((p) => !p)}
                aria-label={paused ? "Resume playback" : "Pause playback"}
                className="grid h-10 w-10 place-items-center rounded-full border border-line-m text-cream hover:border-amber/60"
              >
                <Icon name={paused ? "play" : "pause"} size={18} />
              </button>
              <label className="flex items-center gap-2 text-xs text-dusk">
                <span>Speed</span>
                <input
                  type="range"
                  min={0.75}
                  max={2}
                  step={0.25}
                  value={speed}
                  onChange={(e) => setSpeed(parseFloat(e.target.value))}
                  className="accent-amber"
                  aria-label="Voice speed"
                />
                <span className="w-9 tabular-nums text-cream">
                  {speed.toFixed(2)}×
                </span>
              </label>
            </div>
          )}

          <div
            title={
              offline ? "Reconnect to the internet to use voice features" : undefined
            }
          >
            <MicButton
              disabled={offline || studyState !== "idle"}
              onQuestion={handleQuestion}
              onTooShort={() =>
                pushToast("Hold the mic a little longer to ask your question.")
              }
              onPermissionDenied={onMicDenied}
            />
          </div>
          {!hasSteps && studyState === "idle" && !offline && (
            <p className="text-center text-[11px] text-faint">
              Lore answers only from your uploaded material. Whiteboard opens
              automatically for equations.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function TurnBubble({
  turn,
  streaming,
  onRetry,
}: {
  turn: Turn;
  streaming?: boolean;
  onRetry?: () => void;
}) {
  const isStudent = turn.role === "student";
  return (
    <li className={`flex ${isStudent ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
          isStudent
            ? "bg-amber text-void"
            : turn.muted
              ? "border border-line bg-transparent text-dusk"
              : "border border-line bg-carbon text-cream"
        }`}
      >
        {!isStudent && (
          <span className="mb-1 block text-[11px] font-medium uppercase tracking-wide text-amber">
            Lore {streaming && <span className="text-dusk">· speaking</span>}
          </span>
        )}
        <p className={turn.grounded === false ? "italic text-dusk" : ""}>
          {turn.text}
        </p>
        {/* steps mirrored as text for accessibility (PRD §12.2) */}
        {turn.steps && turn.steps.length > 0 && (
          <div className="mt-2 border-t border-line pt-2 font-hand text-base text-amber">
            {turn.steps.map((s, i) => (
              <p key={i} className={s.emphasis ? "font-semibold" : ""}>
                {s.text}
              </p>
            ))}
          </div>
        )}
        {onRetry && (
          <button
            onClick={onRetry}
            className="mt-2 text-xs text-amber underline underline-offset-2"
          >
            Try again
          </button>
        )}
      </div>
    </li>
  );
}

function Spinner() {
  return (
    <span
      className="inline-block h-4 w-4 rounded-full border-2 border-line border-t-amber"
      style={{ animation: "lore-spin 0.7s linear infinite" }}
      aria-hidden="true"
    />
  );
}
