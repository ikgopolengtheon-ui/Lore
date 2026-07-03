// Screen 8 error/edge-state catalogue (PRD §5 Screen 8).
// Toast-style (non-blocking) states are handled inline; these are the
// full-screen states that use the standard Lore alert layout.

import type { IconName } from "@/components/Icon";

export type ErrorKey =
  | "mic-denied" // 8.1
  | "upload-failed" // 8.2
  | "processing-failed" // 8.3
  | "scanned-doc" // 8.4
  | "llm-failed" // 8.7
  | "session-restore" // 8.9
  | "image-extract"; // 8.11

export interface ErrorSpec {
  code: string;
  icon: IconName;
  title: string;
  body: string;
  sub?: string;
  primary: string;
}

export const ERRORS: Record<ErrorKey, ErrorSpec> = {
  "mic-denied": {
    code: "8.1",
    icon: "mic",
    title: "Lore needs access to your microphone to hear your questions.",
    body: "Go to your browser settings, allow microphone access for this site, then refresh the page.",
    primary: "How to enable microphone",
  },
  "upload-failed": {
    code: "8.2",
    icon: "warning",
    title: "Upload failed. Your document could not be saved.",
    body: "Check your internet connection and try again. If the problem continues, try a different file format.",
    primary: "Try Again",
  },
  "processing-failed": {
    code: "8.3",
    icon: "warning",
    title: "Lore could not process your file.",
    body: "This can happen with very large files or unusual formatting. Try a smaller file, or export your document as a plain PDF and upload again.",
    primary: "Upload a Different File",
  },
  "scanned-doc": {
    code: "8.4",
    icon: "doc",
    title: "Lore could not read the text in this document.",
    body: "This file appears to be a scanned image rather than a text-based PDF. Lore needs selectable text to study from. Try exporting your notes as a text-based PDF or DOCX.",
    primary: "Upload a Different File",
  },
  "llm-failed": {
    code: "8.7",
    icon: "error",
    title: "Lore ran into a problem generating a response.",
    body: "This is usually temporary. Please try your question again.",
    primary: "Try Again",
  },
  "session-restore": {
    code: "8.9",
    icon: "warning",
    title: "We could not restore this session.",
    body: "Your previous chat could not be loaded. You can upload your document again to start a new session.",
    primary: "Upload Document",
  },
  "image-extract": {
    code: "8.11",
    icon: "image",
    title: "Lore couldn't read any text in this photo.",
    body: "Make sure the page is well-lit, in focus, and fills the frame, then try again.",
    primary: "Retake or Upload a Different Photo",
  },
};
