import type { Session } from "@/lib/types";

// Heuristic "how far through this material is the student" for the subject
// cards' progress meter: the question count scaled against a target derived
// from document size (bigger documents take more questions to cover, capped
// so small documents don't read as instantly mastered). Replaced by real
// coverage tracking when usage analytics land.
export function studyProgress(s: Session): number {
  if (!s.documentText || s.wordCount === 0) return 0;
  const questions = s.turns.filter((t) => t.role === "student").length;
  const target = Math.min(30, Math.max(5, Math.round(s.wordCount / 300)));
  return Math.min(100, Math.round((questions / target) * 100));
}
