// Pinecone RAG layer (PRD §4.2 / §14). Server-only. Uses Pinecone's integrated
// inference (hosted `multilingual-e5-large`) so we upsert/query with plain text
// and Pinecone does the embedding — no separate embeddings provider needed.
// Each chat session gets its own namespace, so retrieval is isolated per
// student and the whole namespace is deleted when the chat is deleted (§11.3).

import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_NAME = process.env.PINECONE_INDEX || "lore-rag";
const EMBED_MODEL = "multilingual-e5-large"; // 1024-dim, hosted on Pinecone
const TEXT_FIELD = "chunk_text";
const UPSERT_BATCH = 90; // integrated upsert cap is 96/request

let client: Pinecone | null = null;
let ensured: Promise<void> | null = null;

function pc(): Pinecone {
  if (!process.env.PINECONE_API_KEY) {
    throw new Error("PINECONE_API_KEY is not set");
  }
  if (!client) client = new Pinecone({ apiKey: process.env.PINECONE_API_KEY });
  return client;
}

// Create the integrated-embedding index once (idempotent, cached per process).
function ensureIndex(): Promise<void> {
  if (!ensured) {
    ensured = pc()
      .createIndexForModel({
        name: INDEX_NAME,
        cloud: "aws",
        region: "us-east-1",
        embed: { model: EMBED_MODEL, fieldMap: { text: TEXT_FIELD } },
        waitUntilReady: true,
        suppressConflicts: true, // fine if it already exists
      })
      .then(() => undefined);
  }
  return ensured;
}

// Split text into overlapping, embedding-sized chunks on sensible boundaries.
export function chunkText(text: string, size = 1200, overlap = 150): string[] {
  const clean = (text ?? "").replace(/\s+/g, " ").trim();
  if (!clean) return [];
  if (clean.length <= size) return [clean];
  const chunks: string[] = [];
  let i = 0;
  while (i < clean.length) {
    let end = Math.min(i + size, clean.length);
    if (end < clean.length) {
      const slice = clean.slice(i, end);
      const dot = slice.lastIndexOf(". ");
      const space = slice.lastIndexOf(" ");
      const brk =
        dot > size * 0.5 ? dot + 1 : space > size * 0.5 ? space : slice.length;
      end = i + brk;
    }
    const piece = clean.slice(i, end).trim();
    if (piece) chunks.push(piece);
    if (end >= clean.length) break;
    i = Math.max(0, end - overlap);
  }
  return chunks;
}

// Index a document's text into the session's namespace. Replaces prior content
// so re-uploads don't leave stale chunks.
export async function ingest(sessionId: string, text: string): Promise<number> {
  const chunks = chunkText(text);
  if (chunks.length === 0) return 0;
  await ensureIndex();
  const ns = pc().index(INDEX_NAME).namespace(sessionId);
  try {
    await ns.deleteAll();
  } catch {
    /* namespace may not exist yet — fine */
  }
  const records = chunks.map((chunk, idx) => ({
    _id: `c${idx}`,
    [TEXT_FIELD]: chunk,
  }));
  for (let i = 0; i < records.length; i += UPSERT_BATCH) {
    await ns.upsertRecords({ records: records.slice(i, i + UPSERT_BATCH) });
  }
  return records.length;
}

// Retrieve the top-k most relevant chunks for a question.
export async function retrieve(
  sessionId: string,
  query: string,
  topK = 6,
): Promise<string[]> {
  await ensureIndex();
  const ns = pc().index(INDEX_NAME).namespace(sessionId);
  const res = await ns.searchRecords({
    query: { topK, inputs: { text: query } },
    fields: [TEXT_FIELD],
  });
  const hits = res.result?.hits ?? [];
  return hits
    .map((h) => (h.fields as Record<string, unknown>)?.[TEXT_FIELD])
    .filter((t): t is string => typeof t === "string" && t.length > 0);
}

export async function deleteNamespace(sessionId: string): Promise<void> {
  try {
    await pc().index(INDEX_NAME).namespace(sessionId).deleteAll();
  } catch {
    /* nothing indexed / already gone */
  }
}
