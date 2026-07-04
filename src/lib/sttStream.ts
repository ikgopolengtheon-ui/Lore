// Browser-side streaming STT via Deepgram's live WebSocket (PRD §4.4).
// A short-lived token from /api/stt-token authenticates the connection (passed
// as the `token` subprotocol). Audio chunks are streamed in as the student
// speaks; final transcript is assembled from the `is_final` results. Any
// failure returns null so the caller falls back to prerecorded /api/stt.

const DG_URL =
  "wss://api.deepgram.com/v1/listen" +
  "?model=nova-2&smart_format=true&punctuate=true&interim_results=true";

// What the mic hands back on release: a streamed transcript when available,
// otherwise the recorded clip for the prerecorded /api/stt fallback.
export interface SttResult {
  transcript?: string;
  audio?: Blob | null;
}

export interface LiveStt {
  /** forward an audio chunk (Opus/WebM from MediaRecorder) */
  send: (chunk: Blob) => void;
  /** flush + close; resolves with the final transcript */
  finish: () => Promise<string>;
  /** tear down without waiting (e.g. recording too short) */
  abort: () => void;
}

export async function openLiveStt(): Promise<LiveStt | null> {
  if (typeof WebSocket === "undefined") return null;

  let token: string | undefined;
  try {
    const r = await fetch("/api/stt-token", { method: "POST" });
    if (!r.ok) return null;
    ({ access_token: token } = await r.json());
  } catch {
    return null;
  }
  if (!token) return null;

  let ws: WebSocket;
  try {
    ws = new WebSocket(DG_URL, ["token", token]);
  } catch {
    return null;
  }

  const opened = await new Promise<boolean>((resolve) => {
    const t = setTimeout(() => resolve(false), 3500);
    ws.onopen = () => {
      clearTimeout(t);
      resolve(true);
    };
    ws.onerror = () => {
      clearTimeout(t);
      resolve(false);
    };
  });
  if (!opened) {
    try {
      ws.close();
    } catch {
      /* ignore */
    }
    return null;
  }

  let finalText = "";
  ws.onmessage = (ev) => {
    try {
      const msg = JSON.parse(ev.data as string);
      if (msg.type === "Results") {
        const t: string = msg.channel?.alternatives?.[0]?.transcript ?? "";
        if (msg.is_final && t) finalText += (finalText ? " " : "") + t;
      }
    } catch {
      /* non-JSON keepalive — ignore */
    }
  };

  return {
    send: (chunk) => {
      if (ws.readyState === WebSocket.OPEN) ws.send(chunk);
    },
    finish: () =>
      new Promise<string>((resolve) => {
        const done = () => resolve(finalText.trim());
        // Ask Deepgram to flush remaining audio, then resolve on close.
        try {
          ws.send(JSON.stringify({ type: "CloseStream" }));
        } catch {
          /* ignore */
        }
        const t = setTimeout(() => {
          try {
            ws.close();
          } catch {
            /* ignore */
          }
          done();
        }, 2500);
        ws.onclose = () => {
          clearTimeout(t);
          done();
        };
      }),
    abort: () => {
      try {
        ws.close();
      } catch {
        /* ignore */
      }
    },
  };
}
