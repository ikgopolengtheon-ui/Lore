// POST /api/stt — speech-to-text via Deepgram Nova-2 (PRD §4.2 / §14).
// Accepts the recorded audio clip on mic release and returns the transcript.
// Prerecorded (not streaming) for v1 — the push-to-talk clip is short.

export const runtime = "nodejs";
export const maxDuration = 30;

const DEEPGRAM_URL =
  "https://api.deepgram.com/v1/listen?model=nova-2&smart_format=true&punctuate=true";

export async function POST(req: Request) {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Speech-to-text is not configured (DEEPGRAM_API_KEY)." },
      { status: 503 },
    );
  }

  const contentType = req.headers.get("content-type") || "audio/webm";
  const audio = await req.arrayBuffer();
  if (!audio.byteLength) {
    return Response.json({ transcript: "" });
  }

  try {
    const res = await fetch(DEEPGRAM_URL, {
      method: "POST",
      headers: { Authorization: `Token ${key}`, "Content-Type": contentType },
      body: audio,
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json(
        { error: `Deepgram error ${res.status}`, detail: detail.slice(0, 300) },
        { status: 502 },
      );
    }
    const data = await res.json();
    const transcript: string =
      data?.results?.channels?.[0]?.alternatives?.[0]?.transcript ?? "";
    const confidence: number =
      data?.results?.channels?.[0]?.alternatives?.[0]?.confidence ?? 0;
    return Response.json({ transcript: transcript.trim(), confidence });
  } catch (err) {
    const message = err instanceof Error ? err.message : "STT request failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
