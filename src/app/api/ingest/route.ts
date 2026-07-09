// POST /api/ingest — chunk + embed a session's document text into Pinecone
// (PRD §4.1 processing step). Called after extraction, before study.

import { ingest } from "@/lib/pinecone";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  if (!process.env.PINECONE_API_KEY) {
    // RAG not configured — not fatal; chat falls back to full-document context.
    return Response.json({ ok: false, indexed: 0, ragless: true });
  }
  let sessionId = "";
  let text = "";
  try {
    ({ sessionId, text } = (await req.json()) as {
      sessionId: string;
      text: string;
    });
  } catch {
    return Response.json({ ok: false, error: "Invalid request." }, { status: 400 });
  }
  if (!sessionId || !text?.trim()) {
    return Response.json({ ok: true, indexed: 0 });
  }
  try {
    const indexed = await ingest(sessionId, text);
    return Response.json({ ok: true, indexed });
  } catch (err) {
    const message = err instanceof Error ? err.message : "ingest failed";
    // Non-fatal: study can still proceed on full-document context.
    return Response.json({ ok: false, indexed: 0, error: message });
  }
}
