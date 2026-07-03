// Mock AI layer for the frontend prototype.
// Simulates the STT → RAG → LLM → TTS pipeline with fake streaming so the
// full UX can be exercised without real providers or API keys.
// Every response is deliberately "grounded" — canned answers stand in for
// retrieval over the uploaded document (PRD §4.3).

import type { QuizEntry, WhiteboardStep } from "./types";

export const uid = () =>
  `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

// ─── STEM / whiteboard classifier (PRD §6.2) ─────────────────────
// Lightweight client-side regex check — fast, not perfect. Runs on the
// first ~200 tokens of a response to decide whether to auto-open the board.
const STEM_PATTERNS: RegExp[] = [
  /\\(frac|int|sum|sqrt|partial|nabla|alpha|beta|theta|pi)/i,
  /[=+\-−×÷]/,
  /\b(where|let|derive|given that|integrating|differentiating|equation|solve for|substitute|therefore)\b/i,
  /\^|_\{|\d\s*\/\s*\d/, // exponents, subscripts, fractions
  /\b[A-Z][a-z]?\d/, // chemical-formula-ish (H2, CO2, Na)
  /\b(mol|joule|newton|velocity|acceleration|derivative|integral|matrix|vector)\b/i,
];

export function classifyStem(text: string): boolean {
  const head = text.split(/\s+/).slice(0, 200).join(" ");
  let hits = 0;
  for (const re of STEM_PATTERNS) if (re.test(head)) hits++;
  return hits >= 2; // require a couple of signals to reduce false positives
}

// ─── Canned questions students "speak" (mock STT) ────────────────
// The prototype captures real audio but returns a canned transcript on
// release, cycling through these (PRD §4.2 STT is mocked here).
const STUDENT_QUESTIONS = [
  "Can you explain osmosis to me?",
  "Walk me through the derivation step by step.",
  "What's the difference between mitosis and meiosis?",
  "How do I solve this integral?",
  "Summarise the key points of this chapter.",
  "Why does the reaction release energy?",
];

let qIdx = 0;
export function mockTranscribe(): string {
  const q = STUDENT_QUESTIONS[qIdx % STUDENT_QUESTIONS.length];
  qIdx++;
  return q;
}

// ─── Canned grounded answers ─────────────────────────────────────
interface MockAnswer {
  match: RegExp;
  text: string;
  steps?: WhiteboardStep[];
}

const ANSWERS: MockAnswer[] = [
  {
    match: /osmosis/i,
    text: "From your notes: osmosis is the net movement of water molecules across a semi-permeable membrane, from a region of lower solute concentration to one of higher solute concentration. Your document frames it as the cell's way of balancing water without spending energy — it's passive transport. The key idea highlighted in your material is water potential: water always moves down its potential gradient.",
  },
  {
    match: /deriv|integral|integrat|solve/i,
    text: "Let's work through it the way your notes set it out. We start from the definition, then integrate term by term. I'll write each step on the board as I go so you can follow the algebra.",
    steps: [
      { text: "Given:  f(x) = 3x² + 2x", emphasis: true },
      { text: "∫ f(x) dx = ∫ (3x² + 2x) dx" },
      { text: "= 3 · (x³/3) + 2 · (x²/2) + C" },
      { text: "= x³ + x² + C", emphasis: true },
    ],
  },
  {
    match: /mitosis|meiosis/i,
    text: "According to your material: mitosis produces two genetically identical diploid cells and is used for growth and repair. Meiosis produces four genetically distinct haploid gametes and involves two divisions plus crossing over. Your notes stress that the crossing-over step in meiosis is the main source of genetic variation.",
  },
  {
    match: /reaction|energy|exotherm/i,
    text: "Your notes describe this as an exothermic reaction. Energy is released because the total energy in the bonds of the products is lower than in the reactants — the difference is given off as heat. I'll write the energy relationship on the board.",
    steps: [
      { text: "ΔH = H(products) − H(reactants)", emphasis: true },
      { text: "Bonds broken (in) < Bonds formed (out)" },
      { text: "ΔH < 0  →  energy released", emphasis: true },
    ],
  },
  {
    match: /summ|key point|overview/i,
    text: "Here's the summary drawn only from what you uploaded: the chapter builds from definitions toward the worked example at the end. The three ideas your notes return to most are the core mechanism, the conditions under which it happens, and the one common exam mistake flagged in the margin. Everything else supports those three.",
  },
];

const GROUNDING_MISS =
  "I could not find anything relevant to that question in your document. Could you rephrase, or ask something more specific to your material?";

export interface MockResponse {
  text: string;
  steps?: WhiteboardStep[];
  grounded: boolean;
}

export function mockAnswer(question: string): MockResponse {
  const found = ANSWERS.find((a) => a.match.test(question));
  if (!found) {
    // simulate a RAG miss occasionally (PRD §8.6)
    return { text: GROUNDING_MISS, grounded: false };
  }
  return { text: found.text, steps: found.steps, grounded: true };
}

// ─── Fake token streaming ────────────────────────────────────────
// Streams a string word-by-word to mimic LLM + TTS streaming so the UI
// can render/"speak" incrementally (PRD §4.4).
export function streamText(
  text: string,
  onToken: (soFar: string) => void,
  onDone: () => void,
  wordsPerTick = 2,
  tickMs = 55,
): () => void {
  const words = text.split(" ");
  let i = 0;
  const timer = setInterval(() => {
    i += wordsPerTick;
    onToken(words.slice(0, i).join(" "));
    if (i >= words.length) {
      clearInterval(timer);
      onDone();
    }
  }, tickMs);
  return () => clearInterval(timer);
}

// ─── Quiz generation (PRD §7) ────────────────────────────────────
const QUIZ_BANK: Omit<QuizEntry, "id">[] = [
  {
    question:
      "In your own words, what drives the net movement of water during osmosis?",
    correctAnswer:
      "A difference in water potential — water moves from higher to lower water potential across a semi-permeable membrane, without energy input.",
  },
  {
    question:
      "What is the main source of genetic variation introduced during meiosis?",
    correctAnswer:
      "Crossing over during the first division, where homologous chromosomes exchange segments.",
  },
  {
    question:
      "Why is a reaction with ΔH < 0 described as exothermic?",
    correctAnswer:
      "Because the products hold less energy than the reactants, so the surplus is released as heat.",
  },
  {
    question:
      "When integrating 3x² + 2x, what is the resulting expression?",
    correctAnswer: "x³ + x² + C, where C is the constant of integration.",
  },
  {
    question:
      "What are the two functions your notes give for mitosis?",
    correctAnswer: "Growth and repair, producing genetically identical cells.",
  },
];

export function generateQuiz(count = 5): QuizEntry[] {
  const shuffled = [...QUIZ_BANK].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count).map((q) => ({ ...q, id: uid() }));
}

// Mocked answer evaluation — the real product sends the transcript + source
// to the LLM. Here we award correct most of the time so the flow reads well.
export function evaluateAnswer(entry: QuizEntry): {
  correct: boolean;
  feedback: string;
} {
  const correct = Math.random() > 0.35;
  return {
    correct,
    feedback: correct
      ? `That's right. ${entry.correctAnswer}`
      : `Not quite. ${entry.correctAnswer}`,
  };
}

// Canned spoken answers the student "gives" in quiz mode (mock STT).
export function mockQuizAnswer(): string {
  const samples = [
    "It moves from high to low water potential across the membrane.",
    "Crossing over between chromosomes.",
    "Because energy is released as heat.",
    "It becomes x cubed plus x squared plus a constant.",
    "Growth and repair of cells.",
  ];
  return samples[Math.floor(Math.random() * samples.length)];
}
