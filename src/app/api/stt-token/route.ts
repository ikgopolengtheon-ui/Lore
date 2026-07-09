// POST /api/stt-token — mint a short-lived Deepgram token (PRD §4.4 streaming
// STT). The browser opens the Deepgram live WebSocket directly with this token,
// so the real API key never reaches the client and no WebSocket proxy is
// needed on our (serverless) side. Tokens expire in ~30s — one per mic press.

export const runtime = "nodejs";

export async function POST() {
  const key = process.env.DEEPGRAM_API_KEY;
  if (!key) {
    return Response.json(
      { error: "Speech-to-text is not configured." },
      { status: 503 },
    );
  }
  try {
    const res = await fetch("https://api.deepgram.com/v1/auth/grant", {
      method: "POST",
      headers: {
        Authorization: `Token ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ ttl_seconds: 30 }),
    });
    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      return Response.json(
        { error: `Deepgram grant ${res.status}`, detail: detail.slice(0, 200) },
        { status: 502 },
      );
    }
    const data = await res.json();
    return Response.json({
      access_token: data.access_token,
      expires_in: data.expires_in,
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "token request failed";
    return Response.json({ error: message }, { status: 502 });
  }
}
