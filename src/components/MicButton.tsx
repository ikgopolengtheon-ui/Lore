"use client";

// Push-to-talk mic button (PRD §5 / §7.2 / §10.2 / §12.1).
// - Press-and-hold to record, release to send.
// - Real getUserMedia + AnalyserNode waveform where available; a synthetic
//   waveform stands in when a mic isn't accessible so the demo never blocks.
// - Keyboard operable: Space/Enter keydown starts, keyup stops.
// - Touch-friendly: 64px+ target, context menu + scroll suppressed.
// - Reports permission-denied so the app can show Screen 8.1.

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";

const MIN_RECORD_MS = 500; // < 0.5s → "hold a little longer" (PRD §5)

interface Props {
  disabled?: boolean;
  /** recorded clip on release, or null when no real mic (simulated fallback) */
  onQuestion: (audio: Blob | null) => void;
  onTooShort: () => void;
  onPermissionDenied: () => void;
}

// Prefer Opus/WebM; Safari only offers audio/mp4 (PRD §9.2).
function pickMime(): string {
  if (typeof MediaRecorder === "undefined") return "";
  const types = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const t of types) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function MicButton({
  disabled,
  onQuestion,
  onTooShort,
  onPermissionDenied,
}: Props) {
  const [listening, setListening] = useState(false);
  const [bars, setBars] = useState<number[]>(() => new Array(28).fill(0.08));

  const startedAt = useRef(0);
  const streamRef = useRef<MediaStream | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const simRef = useRef(false);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const cleanup = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (ctxRef.current && ctxRef.current.state !== "closed") {
      ctxRef.current.close().catch(() => {});
    }
    ctxRef.current = null;
  }, []);

  useEffect(() => cleanup, [cleanup]);

  const drawReal = useCallback(() => {
    const analyser = analyserRef.current;
    if (!analyser) return;
    const data = new Uint8Array(analyser.frequencyBinCount);
    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(data);
      const N = 28;
      const step = Math.floor(data.length / N) || 1;
      const next: number[] = [];
      for (let i = 0; i < N; i++) {
        next.push(Math.max(0.08, data[i * step] / 255));
      }
      setBars(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const drawSim = useCallback(() => {
    // synthetic "speech" motion when no real analyser is available
    const tick = () => {
      const t = Date.now() / 120;
      const next = new Array(28).fill(0).map((_, i) => {
        const v =
          0.35 +
          0.3 * Math.sin(t + i * 0.5) +
          0.25 * Math.sin(t * 1.7 + i) +
          0.1 * Math.random();
        return Math.min(1, Math.max(0.08, v));
      });
      setBars(next);
      rafRef.current = requestAnimationFrame(tick);
    };
    tick();
  }, []);

  const start = useCallback(async () => {
    if (disabled || listening) return;
    startedAt.current = Date.now();
    setListening(true);

    // Resume AudioContext on the user gesture (Safari, PRD §9.2)
    try {
      const AC =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      const ctx = new AC();
      if (ctx.state === "suspended") await ctx.resume();
      ctxRef.current = ctx;

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const source = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 128;
      source.connect(analyser);
      analyserRef.current = analyser;
      simRef.current = false;

      // Record the clip so it can be sent to STT on release.
      try {
        const mime = pickMime();
        const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
        chunksRef.current = [];
        rec.ondataavailable = (e) => {
          if (e.data.size) chunksRef.current.push(e.data);
        };
        rec.start(250); // timeslice so Safari flushes data (PRD §9.2)
        recorderRef.current = rec;
      } catch {
        recorderRef.current = null; // no recorder → STT falls back to mock
      }

      drawReal();
    } catch (err) {
      // Permission explicitly denied → surface Screen 8.1 and abort.
      const name = (err as DOMException)?.name;
      if (name === "NotAllowedError" || name === "SecurityError") {
        setListening(false);
        cleanup();
        onPermissionDenied();
        return;
      }
      // No device / insecure context → fall back to a simulated waveform.
      simRef.current = true;
      drawSim();
    }
  }, [disabled, listening, drawReal, drawSim, cleanup, onPermissionDenied]);

  const stop = useCallback(() => {
    if (!listening) return;
    const duration = Date.now() - startedAt.current;
    setListening(false);
    setBars(new Array(28).fill(0.08));
    // stop the waveform loop immediately; keep the stream alive until the
    // recorder finishes flushing so no audio is lost.
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    analyserRef.current = null;

    const rec = recorderRef.current;
    recorderRef.current = null;

    if (duration < MIN_RECORD_MS) {
      if (rec && rec.state !== "inactive") {
        rec.ondataavailable = null;
        rec.onstop = null;
        try {
          rec.stop();
        } catch {}
      }
      cleanup();
      onTooShort();
      return;
    }

    if (rec && rec.state !== "inactive") {
      rec.onstop = () => {
        const blob = new Blob(chunksRef.current, {
          type: rec.mimeType || "audio/webm",
        });
        cleanup();
        onQuestion(blob.size ? blob : null);
      };
      try {
        rec.requestData();
      } catch {}
      rec.stop();
    } else {
      cleanup();
      onQuestion(null); // simulated fallback — Study uses mock STT
    }
  }, [listening, cleanup, onTooShort, onQuestion]);

  // Keyboard: Space/Enter press-and-hold (avoid key repeat re-triggering)
  const onKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === " " || e.key === "Enter") && !e.repeat) {
      e.preventDefault();
      start();
    }
  };
  const onKeyUp = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      stop();
    }
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Waveform — decorative for AT (PRD §12.2) */}
      <div
        aria-hidden="true"
        className={`flex h-14 items-center justify-center gap-[3px] transition-opacity duration-300 ${
          listening ? "opacity-100" : "opacity-0"
        }`}
      >
        {bars.map((h, i) => (
          <span
            key={i}
            className="w-[3px] rounded-full bg-amber"
            style={{
              height: `${Math.round(h * 52)}px`,
              opacity: 0.35 + h * 0.65,
            }}
          />
        ))}
      </div>

      <div className="relative">
        {listening && (
          <span
            className="absolute inset-0 rounded-full border border-amber"
            style={{ animation: "lore-ring 1.2s ease-out infinite" }}
            aria-hidden="true"
          />
        )}
        <button
          type="button"
          disabled={disabled}
          onMouseDown={start}
          onMouseUp={stop}
          onMouseLeave={() => listening && stop()}
          onTouchStart={(e) => {
            e.preventDefault();
            start();
          }}
          onTouchEnd={(e) => {
            e.preventDefault();
            stop();
          }}
          onKeyDown={onKeyDown}
          onKeyUp={onKeyUp}
          onContextMenu={(e) => e.preventDefault()}
          aria-label="Hold to record your question"
          aria-pressed={listening}
          className={`grid h-[76px] w-[76px] touch-none select-none place-items-center rounded-full transition-all disabled:opacity-40 ${
            listening
              ? "bg-red text-cream shadow-[0_0_0_10px_rgba(196,96,96,0.12)]"
              : "bg-amber text-void shadow-[0_0_0_8px_rgba(212,147,60,0.10),0_0_0_16px_rgba(212,147,60,0.05)] hover:bg-amber-lt"
          }`}
          style={{ WebkitTouchCallout: "none", touchAction: "none" }}
        >
          <Icon name="mic" size={30} />
        </button>
      </div>

      {/* Colour is never the only state signal (PRD §12.4) */}
      <span className="text-xs font-medium tracking-wide text-dusk">
        {listening ? "Release to send" : "Hold to ask"}
      </span>
    </div>
  );
}
