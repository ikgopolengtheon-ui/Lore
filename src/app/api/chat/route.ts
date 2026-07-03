// POST /api/chat — grounded, streaming LLM answers (PRD §4.2 LLM, §4.4 streaming).
// Calls Claude with a strict document-grounding system prompt and streams token
// text back to the client so playback/rendering can begin on the first chunk.

import Anthropic from "@anthropic-ai/sdk";
import {
  GROUNDING_SYSTEM,
  documentBlock,
} from "@/lib/grounding";

export const runtime = "nodejs";

// Provider/model are swappable per PRD §4.2 — one env var flips Sonnet ↔ Opus.
// Default: current Sonnet tier (PRD §14 selected Sonnet for student-scale cost).
const MODEL = process.env.LORE_LLM_MODEL || "claude-sonnet-5";
const MAX_DOC_CHARS = 60_000; // guard payload/context size until RAG lands (v2)

interface ChatTurn {
  role: "student" | "lore";
  text: string;
}

interface ChatRequest {
  question: string;
  documentText?: string;
  history?: ChatTurn[];
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      {
        error:
          "Lore is not configured with an API key yet. Add ANTHROPIC_API_KEY to .env.local.",
      },
      { status: 503 },
    );
  }

  let body: ChatRequest;
  try {
    body = (await req.json()) as ChatRequest;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const question = body.question?.trim();
  if (!question) {
    return Response.json({ error: "No question provided." }, { status: 400 });
  }

  const docText = (body.documentText ?? "").slice(0, MAX_DOC_CHARS);
  const history = (body.history ?? []).slice(-12); // recent turns only

  const client = new Anthropic({ apiKey });

  // Build alternating message history, then the current question last.
  const messages: Anthropic.MessageParam[] = [];
  for (const t of history) {
    messages.push({
      role: t.role === "student" ? "user" : "assistant",
      content: t.text,
    });
  }
  messages.push({ role: "user", content: question });

  const encoder = new TextEncoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        const llm = client.messages.stream({
          model: MODEL,
          max_tokens: 1500,
          // Thinking off for snappy first-token streaming toward the <3s
          // latency target; the grounded task doesn't need deliberation.
          thinking: { type: "disabled" },
          system: [
            { type: "text", text: GROUNDING_SYSTEM },
            {
              // Per-session document — stable across a session's turns, so cache it.
              type: "text",
              text: documentBlock(docText),
              cache_control: { type: "ephemeral" },
            },
          ],
          messages,
        });

        llm.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });

        await llm.finalMessage();
        controller.close();
      } catch (err) {
        // Surface a terminal marker the client treats as an LLM failure (8.7).
        const msg = err instanceof Error ? err.message : "LLM request failed";
        controller.enqueue(encoder.encode(`\n\n[[LORE_ERROR]] ${msg}`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Accel-Buffering": "no",
    },
  });
}
