// Core domain types for the Lore prototype.

export type FileKind = "document" | "image";

export type DocFormat = "pdf" | "pptx" | "docx" | "txt";
export type ImageFormat = "jpeg" | "jpg" | "png" | "webp" | "heic";

export interface UploadedFile {
  id: string;
  name: string;
  sizeBytes: number;
  kind: FileKind;
  ext: string;
  /** data URL preview for image thumbnails */
  thumbnail?: string;
  /** text extracted client-side (TXT today; PDF/DOCX/OCR to follow) */
  extractedText?: string;
}

export type TurnRole = "student" | "lore";

/** minimal turn shape sent to the LLM route */
export interface ChatTurn {
  role: TurnRole;
  text: string;
}

export interface WhiteboardStep {
  /** rendered as handwritten math/notation on the canvas */
  text: string;
  emphasis?: boolean;
}

export interface Turn {
  id: string;
  role: TurnRole;
  text: string;
  /** whiteboard steps that accompanied a Lore response, if any */
  steps?: WhiteboardStep[];
  /** true when this turn is a grounding-miss ("not in your document") */
  grounded?: boolean;
  /** muted = failed / retryable turn (PRD §8.7) */
  muted?: boolean;
  createdAt: number;
}

export interface QuizEntry {
  id: string;
  question: string;
  correctAnswer: string;
  studentAnswer?: string;
  correct?: boolean;
  feedback?: string;
}

export interface Session {
  id: string;
  title: string;
  subject?: string;
  files: UploadedFile[];
  turns: Turn[];
  /** persisted whiteboard steps (last render), PRD §6.3 */
  whiteboard: WhiteboardStep[];
  createdAt: number;
  lastActive: number;
  /** approximate word count of indexed content, gates quiz (PRD §7 / Screen 7) */
  wordCount: number;
  /** combined extracted study text the LLM is grounded against */
  documentText?: string;
}

// ─── UI state machine ────────────────────────────────────────────

export type AppView = "dashboard" | "session";

export type SessionStage =
  | "upload"
  | "processing"
  | "study"
  | "quiz";

export type StudyState =
  | "idle"
  | "listening"
  | "thinking"
  | "responding";

export interface ToastMsg {
  id: string;
  text: string;
  tone?: "neutral" | "error" | "success";
}
