// POST /api/tts — text-to-speech via ElevenLabs (PRD §4.2 / §14).
// Streams audio/mpeg back for the answer text. Voice delivery parameters come
// from the Lore audio brand (stability 0.72, similarity 0.80).

export const runtime = "nodejs";
export const maxDuration = 60;

// Default voice: "River" (relaxed, neutral, informative) — the closest match
// to the brand's androgynous-leaning, warm, tutor voice among ElevenLabs'
// premade voices. Override via LORE_TTS_VOICE_ID.
const VOICE_ID = process.env.LORE_TTS_VOICE_ID || "SAz9YHcvj6GT2YYXdXww";
const MODEL_ID = process.env.LORE_TTS_MODEL || "eleven_turbo_v2_5";

export async function POST(req: Request) {
  const key = process.env.ELEVENLABS_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Text-to-speech is not configured (ELEVENLABS_API_KEY)." },
      { status: 503 },
    );
  }

  let text = "";
  try {
    ({ text } = (await req.json()) as { text: string });
  } catch {
    return Response.json({ error: "Invalid request." }, { status: 400 });
  }
  text = (text ?? "").trim();
  if (!text) return Response.json({ error: "No text." }, { status: 400 });

  const url = `https://api.elevenlabs.io/v1/text-to-speech/${VOICE_ID}/stream?optimize_streaming_latency=2`;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "xi-api-key": key,
        "Content-Type": "application/json",
        Accept: "audio/mpeg",
      },
      body: JSON.stringify({
        text,
        model_id: MODEL_ID,
        voice_settings: {
          stability: 0.72,
          similarity_boost: 0.8,
          style: 0.0,
          use_speaker_boost: true,
        },
      }),
    });

    if (!res.ok || !res.body) {
      const detail = await res.text().catch(() => "");
      return Response.json(
        { error: `ElevenLabs error ${res.status}`, detail: detail.slice(0, 300) },
        { status: 502 },
      );
    }

    return new Response(res.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-store",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "TTS request failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
