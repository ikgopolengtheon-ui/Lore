// Client-side consumer for POST /api/chat. Streams token text back via a
// callback so the UI can render/"speak" incrementally (PRD §4.4).

import type { ChatTurn } from "./types";

const ERROR_MARKER = "[[LORE_ERROR]]";

export interface AskArgs {
  question: string;
  documentText?: string;
  history?: ChatTurn[];
  signal?: AbortSignal;
}

export interface AskHandlers {
  /** called with the full accumulated text each time more arrives */
  onChunk: (fullText: string) => void;
  onDone: (fullText: string) => void;
  onError: (message: string) => void;
}

export async function askLore(
  { question, documentText, history, signal }: AskArgs,
  { onChunk, onDone, onError }: AskHandlers,
): Promise<void> {
  let res: Response;
  try {
    res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question, documentText, history }),
      signal,
    });
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return;
    onError("Could not reach Lore. Check your connection and try again.");
    return;
  }

  if (!res.ok || !res.body) {
    let msg = "Lore ran into a problem generating a response.";
    try {
      const data = await res.json();
      if (data?.error) msg = data.error;
    } catch {
      /* keep default */
    }
    onError(msg);
    return;
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let text = "";
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      text += decoder.decode(value, { stream: true });
      // A mid-stream error marker means the server-side LLM call failed.
      const errIdx = text.indexOf(ERROR_MARKER);
      if (errIdx !== -1) {
        onError("Lore ran into a problem generating a response.");
        return;
      }
      onChunk(text);
    }
  } catch (e) {
    if ((e as Error)?.name === "AbortError") return;
    onError("The response was interrupted. Please try again.");
    return;
  }
  onDone(text);
}
