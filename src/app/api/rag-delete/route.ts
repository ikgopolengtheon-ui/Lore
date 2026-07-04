// POST /api/rag-delete — remove a session's vectors when the chat is deleted
// (PRD §11.3: embeddings deleted with the chat).

import { deleteNamespace } from "@/lib/pinecone";

export const runtime = "nodejs";

export async function POST(req: Request) {
  if (!process.env.PINECONE_API_KEY) return Response.json({ ok: true });
  let sessionId = "";
  try {
    ({ sessionId } = (await req.json()) as { sessionId: string });
  } catch {
    return Response.json({ ok: false }, { status: 400 });
  }
  if (sessionId) await deleteNamespace(sessionId);
  return Response.json({ ok: true });
}
