"use client";

// Screens 4/5/6 — Study Idle / Listening / Response (PRD §5).
// Push-to-talk → mock STT → grounded answer streamed as text + simulated TTS,
// with Whiteboard Mode auto-activating for STEM responses.

import { useCallback, useEffect, useRef, useState } from "react";
import type { Session, Turn, WhiteboardStep } from "@/lib/types";
import {
  classifyStem,
  extractWhiteboardSteps,
  mockTranscribe,
  uid,
} from "@/lib/mockAI";
import { askLore } from "@/lib/chatClient";
import { GROUNDING_MISS } from "@/lib/grounding";
import type { SttResult } from "@/lib/sttStream";
import { getSettings } from "@/lib/settings";
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
    "idle" | "thinking" | "responding" | "speaking"
  >("idle");
  const [live, setLive] = useState<LiveTurn | null>(null);
  const [wbOpen, setWbOpen] = useState(session.whiteboard.length > 0);
  // default speaking speed comes from Settings (device preference)
  const [speed, setSpeed] = useState(() => getSettings().speed);
  const [paused, setPaused] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const runResponseRef = useRef<((q: string) => void) | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const speedRef = useRef(speed);
  useEffect(() => {
    speedRef.current = speed;
    if (audioRef.current) audioRef.current.playbackRate = speed;
  }, [speed]);

  // keep transcript pinned to the newest content
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [session.turns.length, live?.text]);

  const stopAudio = useCallback(() => {
    const a = audioRef.current;
    if (a) {
      a.pause();
      if (a.src) URL.revokeObjectURL(a.src);
      audioRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      stopAudio();
    };
  }, [stopAudio]);

  const isMiss = (t: string) =>
    t.trim().startsWith(GROUNDING_MISS.slice(0, 32));

  // Speak the answer via ElevenLabs and drive playback with the pause/speed
  // controls. TTS failure falls back to text-only (Screen 8.8).
  const speak = useCallback(
    async (text: string) => {
      setStudyState("speaking");
      setPaused(false);
      try {
        const res = await fetch("/api/tts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text }),
        });
        if (!res.ok) throw new Error("tts");
        const blob = await res.blob();
        const audio = new Audio(URL.createObjectURL(blob));
        audio.playbackRate = speedRef.current;
        audioRef.current = audio;
        audio.onended = () => {
          stopAudio();
          setStudyState("idle");
        };
        audio.onerror = () => {
          stopAudio();
          setStudyState("idle");
          pushToast("Audio playback failed. Your answer is shown above.");
        };
        await audio.play();
      } catch {
        setStudyState("idle");
        pushToast("Audio playback failed. Your answer is shown above.");
      }
    },
    [pushToast, stopAudio],
  );

  // Ask Claude, stream the answer text into the transcript live, then speak it.
  // STEM steps are pulled from the model's equation lines for Whiteboard (§6.2).
  const runResponse = useCallback(
    (question: string) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      let wbTriggered = false;

      setStudyState("responding");
      setLive({ text: "", steps: [], revealed: 0, grounded: true });

      // Prior turns only — the route appends `question` as the final user
      // message, so drop a trailing student turn equal to it to avoid a dupe.
      const turns = session.turns;
      const last = turns[turns.length - 1];
      const prior =
        last && last.role === "student" && last.text === question
          ? turns.slice(0, -1)
          : turns;
      const history = prior.map((t) => ({ role: t.role, text: t.text }));

      const render = (full: string) => {
        let steps: WhiteboardStep[] = [];
        if (!isMiss(full) && classifyStem(full)) {
          steps = extractWhiteboardSteps(full);
          if (steps.length && !wbTriggered) {
            wbTriggered = true;
            setWbOpen(true);
          }
        }
        setLive({
          text: full,
          steps,
          revealed: steps.length,
          grounded: !isMiss(full),
        });
      };

      askLore(
        {
          question,
          documentText: session.documentText,
          history,
          sessionId: session.id,
          signal: controller.signal,
        },
        {
          onChunk: render,
          onDone: (full) => {
            const text = full.trim();
            const steps =
              !isMiss(text) && classifyStem(text)
                ? extractWhiteboardSteps(text)
                : [];
            addTurn(session.id, {
              id: uid(),
              role: "lore",
              text,
              steps: steps.length ? steps : undefined,
              grounded: !isMiss(text),
              createdAt: Date.now(),
            });
            if (steps.length) setWhiteboard(session.id, steps);
            // The board follows the conversation: open while answers need
            // it, tucked away again when the chat steers elsewhere.
            setWbOpen(steps.length > 0);
            setLive(null);
            if (text) speak(text);
            else setStudyState("idle");
          },
          onError: () => {
            setLive(null);
            setStudyState("idle");
            onLlmError(() => runResponseRef.current?.(question));
          },
        },
      );
    },
    [
      addTurn,
      setWhiteboard,
      session.id,
      session.turns,
      session.documentText,
      onLlmError,
      speak,
    ],
  );
  useEffect(() => {
    runResponseRef.current = runResponse;
  }, [runResponse]);

  // Push-to-talk release: a live-streamed transcript arrives directly; if not,
  // fall back to prerecorded /api/stt on the clip, or mock STT when no mic.
  const handleQuestion = useCallback(
    async (result: SttResult) => {
      stopAudio();
      setStudyState("thinking");

      let transcript = (result.transcript ?? "").trim();
      if (!transcript && result.audio) {
        try {
          const res = await fetch("/api/stt", {
            method: "POST",
            headers: { "Content-Type": result.audio.type || "audio/webm" },
            body: result.audio,
          });
          const data = await res.json();
          transcript = (data.transcript || "").trim();
        } catch {
          transcript = "";
        }
      } else if (!transcript && !result.audio) {
        transcript = mockTranscribe(); // simulated fallback (no real mic)
      }

      // Screen 8.5 — no transcript: non-blocking toast, return to idle.
      if (!transcript) {
        setStudyState("idle");
        pushToast(
          "Lore didn't catch that. Try speaking a little louder or moving to a quieter space.",
        );
        return;
      }

      addTurn(session.id, {
        id: uid(),
        role: "student",
        text: transcript,
        createdAt: Date.now(),
      });
      setTimeout(() => runResponse(transcript), 300);
    },
    [addTurn, session.id, runResponse, pushToast, stopAudio],
  );

  // Typed questions enter the same pipeline as voice — voice stays the
  // primary input; this is the quiet fallback for silent rooms.
  const [draft, setDraft] = useState("");
  const askTyped = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = draft.trim();
      if (!q || studyState !== "idle") return;
      setDraft("");
      stopAudio();
      setStudyState("thinking");
      addTurn(session.id, {
        id: uid(),
        role: "student",
        text: q,
        createdAt: Date.now(),
      });
      setTimeout(() => runResponse(q), 300);
    },
    [draft, studyState, stopAudio, addTurn, session.id, runResponse],
  );

  const togglePause = useCallback(() => {
    const a = audioRef.current;
    if (!a) return;
    if (a.paused) {
      a.play();
      setPaused(false);
    } else {
      a.pause();
      setPaused(true);
    }
  }, []);

  const hasSteps = live?.steps.length || session.whiteboard.length > 0;

  return (
    <div className="flex flex-1 flex-col">
      {/* session sub-header — the whiteboard has no toggle: it opens and
          closes itself based on whether answers need it */}
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3 sm:px-6">
        <p className="min-w-0 truncate text-xs text-dusk">
          <span className="font-medium text-amber">{session.title}</span> ·
          grounded answers only
        </p>
        <button
          onClick={onQuiz}
          className="flex shrink-0 items-center gap-1.5 rounded-lg bg-amber px-3.5 py-2 text-xs font-semibold text-void transition-colors hover:bg-amber-lt"
        >
          <Icon name="quiz" size={15} />
          Quiz me on this
        </button>
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
                    createdAt: 0, // display-only placeholder; not persisted
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
          {studyState === "speaking" && (
            <div className="flex items-center gap-4">
              <button
                onClick={togglePause}
                aria-label={paused ? "Resume playback" : "Pause playback"}
                className="grid h-10 w-10 place-items-center rounded-full border border-line-m text-cream hover:border-amber/60"
              >
                <Icon name={paused ? "play" : "pause"} size={18} />
              </button>
              <span className="text-xs font-medium text-amber">
                {paused ? "Paused" : "Speaking"}
              </span>
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

          {/* typed fallback — voice first, keyboard second */}
          <form
            onSubmit={askTyped}
            className="flex w-full max-w-xl items-center gap-2 rounded-full border border-line-m bg-carbon py-1.5 pl-4 pr-1.5 transition-colors focus-within:border-amber/50"
          >
            <input
              type="text"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Prefer to type? Ask anything…"
              aria-label="Type your question"
              disabled={offline || studyState !== "idle"}
              className="min-w-0 flex-1 bg-transparent text-sm text-cream outline-none placeholder:text-faint disabled:opacity-50"
            />
            <button
              type="submit"
              aria-label="Send question"
              disabled={offline || studyState !== "idle" || !draft.trim()}
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-amber text-void transition-colors hover:bg-amber-lt disabled:opacity-40"
            >
              <Icon name="play" size={14} />
            </button>
          </form>

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
            Lore {streaming && <span className="text-dusk">· writing</span>}
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
