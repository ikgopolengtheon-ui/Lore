"use client";

// Screen 7 — Quiz Mode (PRD §5 / §7.4). Lore generates questions from the
// document, evaluates spoken answers, shows per-question feedback and a
// running score, then a summary card on End Quiz.

import { useMemo, useState } from "react";
import type { QuizEntry, Session } from "@/lib/types";
import { evaluateAnswer, generateQuiz, mockQuizAnswer } from "@/lib/mockAI";
import { MicButton } from "../MicButton";
import { Button } from "../Button";
import { Icon } from "../Icon";

const MIN_WORDS = 200; // gate for a meaningful quiz (PRD Screen 7)

interface Props {
  session: Session;
  offline: boolean;
  onExit: () => void;
  onMicDenied: () => void;
}

export function Quiz({ session, offline, onExit, onMicDenied }: Props) {
  const tooShort = session.wordCount < MIN_WORDS;
  const quiz = useMemo(() => (tooShort ? [] : generateQuiz(5)), [tooShort]);

  const [entries, setEntries] = useState<QuizEntry[]>(quiz);
  const [idx, setIdx] = useState(0);
  const [answering, setAnswering] = useState(false);
  const [finished, setFinished] = useState(false);

  const current = entries[idx];
  const answered = entries.filter((e) => e.correct !== undefined);
  const score = answered.filter((e) => e.correct).length;

  if (tooShort) {
    return (
      <Centered>
        <Icon name="info" size={40} className="text-amber" />
        <p className="font-serif text-2xl">Not enough to quiz on yet.</p>
        <p className="max-w-sm text-sm text-dusk">
          Your document is too brief to generate a full quiz. Try uploading more
          content.
        </p>
        <Button variant="secondary" onClick={onExit}>
          Back to study
        </Button>
      </Centered>
    );
  }

  if (finished) {
    return (
      <Centered>
        <span className="grid h-16 w-16 place-items-center rounded-2xl border border-line bg-carbon text-amber">
          <Icon name="quiz" size={30} />
        </span>
        <p className="font-serif text-3xl">
          {score} / {answered.length} correct
        </p>
        <p className="max-w-sm text-sm text-dusk">
          {score === answered.length
            ? "Flawless. You clearly know this material cold."
            : score >= answered.length / 2
              ? "Solid work — a couple of spots worth another read."
              : "Good start. Revisit the sections you missed and try again."}
        </p>
        <Button onClick={onExit}>Back to study</Button>
      </Centered>
    );
  }

  const answer = () => {
    setAnswering(true);
    const spoken = mockQuizAnswer();
    setTimeout(() => {
      const result = evaluateAnswer(current);
      setEntries((prev) =>
        prev.map((e, i) =>
          i === idx
            ? { ...e, studentAnswer: spoken, ...result }
            : e,
        ),
      );
      setAnswering(false);
    }, 700);
  };

  const next = () => {
    if (idx + 1 >= entries.length) setFinished(true);
    else setIdx((i) => i + 1);
  };

  const graded = current.correct !== undefined;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-line px-4 py-3 sm:px-6">
        <div className="flex items-center gap-2">
          <Icon name="quiz" size={18} className="text-amber" />
          <h2 className="font-serif text-lg">Quiz Mode</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="rounded-full bg-amber/12 px-3 py-1 text-sm font-medium text-amber tabular-nums">
            {score} / {answered.length} correct
          </span>
          <Button variant="ghost" onClick={onExit}>
            End Quiz
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-4 py-8 sm:px-6">
        <div className="w-full max-w-xl">
          <p className="mb-2 text-xs uppercase tracking-wide text-dusk">
            Question {idx + 1} of {entries.length}
          </p>
          <p className="font-serif text-2xl leading-snug text-cream">
            {current.question}
          </p>

          {graded && (
            <div
              className={`mt-6 rounded-xl border p-4 ${
                current.correct
                  ? "border-green/40 bg-green/5"
                  : "border-amber/40 bg-amber/5"
              }`}
            >
              <p
                className={`mb-1 flex items-center gap-2 text-sm font-medium ${
                  current.correct ? "text-green" : "text-amber"
                }`}
              >
                <Icon name={current.correct ? "info" : "warning"} size={16} />
                {current.correct ? "Correct" : "Not quite"}
              </p>
              {current.studentAnswer && (
                <p className="mb-2 text-xs text-dusk">
                  You said: “{current.studentAnswer}”
                </p>
              )}
              <p className="text-sm leading-relaxed text-cream">
                {current.feedback}
              </p>
            </div>
          )}
        </div>

        {!graded ? (
          <MicButton
            disabled={answering || offline}
            onQuestion={answer}
            onTooShort={answer}
            onPermissionDenied={onMicDenied}
          />
        ) : (
          <Button onClick={next}>
            {idx + 1 >= entries.length ? "See results" : "Next Question"}
            <Icon name="chevron" size={16} className="-rotate-90" />
          </Button>
        )}
      </div>
    </div>
  );
}

function Centered({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-20 text-center">
      {children}
    </div>
  );
}
