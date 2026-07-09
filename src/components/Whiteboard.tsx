"use client";

// Whiteboard Mode (PRD §6) — the full board experience. When open it takes
// over the study screen: a top bar with the subject and a working
// Voice / Board / Quiz mode switch, a drawing toolbar (undo/redo, select,
// pen, eraser, five chalk colours), the dot-grid board where Lore's steps
// are written sequentially with past steps chalk-faded, a live Lore bubble
// with the spoken answer, a steps sidebar with the real mic and playback
// controls, and a bottom bar with step navigation, fullscreen Present, and
// PNG export. Everything visible works; nothing is decorative.

import { useCallback, useEffect, useRef, useState } from "react";
import type { WhiteboardStep } from "@/lib/types";
import { LogoMark } from "./Logo";
import { Icon, type IconName } from "./Icon";

interface Stroke {
  points: { x: number; y: number }[];
  color: string;
}

type Tool = "select" | "pen" | "eraser";

// Chalk palette (brand ramp; blue is the PRD student-annotation colour)
const INKS = [
  { name: "Chalk", value: "#f4eee2" },
  { name: "Amber", value: "#d4933c" },
  { name: "Blue", value: "#6d9bd4" },
  { name: "Red", value: "#c46060" },
  { name: "Green", value: "#6db87a" },
];

interface Props {
  steps: WhiteboardStep[];
  /** how many steps have been "written" so far (drives sequential reveal) */
  revealed: number;
  /** board name shown in the top bar (the subject) */
  title?: string;
  /** the answer Lore is writing/speaking, shown in the board bubble */
  answerText?: string;
  speaking: boolean;
  writing: boolean;
  paused: boolean;
  onTogglePause: () => void;
  speed: number;
  onSpeedChange: (v: number) => void;
  /** the real MicButton, built by Study with its handlers */
  mic: React.ReactNode;
  onQuiz: () => void;
  onClose: () => void;
}

const DOT_GRID =
  "radial-gradient(circle at center, rgba(212,147,60,0.14) 1px, transparent 1.4px)";

export function Whiteboard({
  steps,
  revealed,
  title,
  answerText,
  speaking,
  writing,
  paused,
  onTogglePause,
  speed,
  onSpeedChange,
  mic,
  onQuiz,
  onClose,
}: Props) {
  const rootRef = useRef<HTMLElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [redoStack, setRedoStack] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<Tool>("pen");
  const [ink, setInk] = useState(INKS[2].value); // student blue by default
  // step being reviewed via Prev/Next; null = follow the newest step
  const [focus, setFocus] = useState<number | null>(null);
  const drawing = useRef(false);

  const shown = steps.slice(0, revealed);
  const activeIdx = focus ?? Math.max(0, shown.length - 1);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes) {
      ctx.strokeStyle = s.color;
      ctx.beginPath();
      s.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
      );
      ctx.stroke();
    }
  }, [strokes]);

  // keep a live handle to the latest redraw for the mount-only resize handler
  const redrawRef = useRef(redraw);
  useEffect(() => {
    redrawRef.current = redraw;
  }, [redraw]);

  // size the drawing canvas to its container (mount + resizes, incl. Present)
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      const wrap = wrapRef.current;
      if (!c || !wrap) return;
      const r = wrap.getBoundingClientRect();
      c.width = r.width;
      c.height = r.height;
      redrawRef.current();
    };
    resize();
    window.addEventListener("resize", resize);
    document.addEventListener("fullscreenchange", resize);
    return () => {
      window.removeEventListener("resize", resize);
      document.removeEventListener("fullscreenchange", resize);
    };
  }, []);

  // redraw whenever strokes change
  useEffect(() => {
    redraw();
  }, [redraw]);

  function pos(e: React.PointerEvent) {
    const r = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  // eraser: drop any stroke that passes near the pointer
  const eraseAt = useCallback((p: { x: number; y: number }) => {
    const R = 14;
    setStrokes((all) =>
      all.filter(
        (s) =>
          !s.points.some((q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 <= R * R),
      ),
    );
  }, []);

  function down(e: React.PointerEvent) {
    if (tool === "select") return;
    drawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    if (tool === "eraser") eraseAt(pos(e));
    else {
      setRedoStack([]);
      setStrokes((s) => [...s, { points: [pos(e)], color: ink }]);
    }
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    if (tool === "eraser") {
      eraseAt(pos(e));
      return;
    }
    setStrokes((s) => {
      const copy = [...s];
      copy[copy.length - 1].points.push(pos(e));
      return copy;
    });
  }
  function up() {
    drawing.current = false;
  }

  const undo = () => {
    setStrokes((s) => {
      if (s.length === 0) return s;
      setRedoStack((r) => [...r, s[s.length - 1]]);
      return s.slice(0, -1);
    });
  };
  const redo = () => {
    setRedoStack((r) => {
      if (r.length === 0) return r;
      setStrokes((s) => [...s, r[r.length - 1]]);
      return r.slice(0, -1);
    });
  };

  const present = () => {
    if (document.fullscreenElement) document.exitFullscreen();
    else rootRef.current?.requestFullscreen().catch(() => {});
  };

  // Export board → PNG. Composite background + steps + strokes onto an
  // offscreen canvas so no external capture library is needed.
  function exportBoard() {
    const wrap = wrapRef.current;
    if (!wrap) return;
    const r = wrap.getBoundingClientRect();
    const out = document.createElement("canvas");
    out.width = r.width;
    out.height = r.height;
    const ctx = out.getContext("2d")!;
    ctx.fillStyle = "#0c0b09";
    ctx.fillRect(0, 0, out.width, out.height);

    ctx.fillStyle = "rgba(212,147,60,0.14)";
    for (let y = 12; y < out.height; y += 22) {
      for (let x = 12; x < out.width; x += 22) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.textBaseline = "middle";
    ctx.fillStyle = "#f4eee2";
    ctx.font = '700 34px "Shantell Sans", cursive';
    ctx.fillText(title ?? "Whiteboard", 40, 48);
    let y = 108;
    shown.forEach((s, i) => {
      ctx.fillStyle = "#d4933c";
      ctx.font = '700 20px "Shantell Sans", cursive';
      ctx.fillText(String(i + 1), 40, y);
      ctx.fillStyle = s.emphasis ? "#d4933c" : "#e8e4dc";
      ctx.font = `${s.emphasis ? "600" : "400"} 26px "Shantell Sans", cursive`;
      ctx.fillText(s.text, 72, y);
      y += 52;
    });

    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const st of strokes) {
      ctx.strokeStyle = st.color;
      ctx.beginPath();
      st.points.forEach((p, i) =>
        i === 0 ? ctx.moveTo(p.x, p.y) : ctx.lineTo(p.x, p.y),
      );
      ctx.stroke();
    }

    const slug = (title ?? "whiteboard")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    const a = document.createElement("a");
    a.download = `lore-board-${slug || "whiteboard"}.png`;
    a.href = out.toDataURL("image/png");
    a.click();
  }

  const cursorClass =
    tool === "pen"
      ? "cursor-crosshair"
      : tool === "eraser"
        ? "cursor-cell"
        : "cursor-default";

  const busyChip = speaking || writing;

  return (
    <section
      ref={rootRef}
      className="flex h-full min-h-0 flex-col overflow-hidden rounded-2xl border border-line-m bg-void"
      aria-label="Whiteboard"
    >
      {/* ── top bar: identity + mode switch + export ── */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-depth px-3 py-2">
        <div className="flex min-w-0 items-center gap-2.5">
          <LogoMark size={18} />
          <span className="truncate rounded-full border border-line-m bg-carbon px-3 py-1 text-xs text-dusk">
            {title ?? "Whiteboard"}
          </span>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <div
            className="flex overflow-hidden rounded-lg border border-line-m"
            role="tablist"
            aria-label="Study mode"
          >
            <button
              role="tab"
              aria-selected={false}
              onClick={onClose}
              className="px-3 py-1.5 text-xs font-medium text-dusk transition-colors hover:text-cream"
            >
              Voice
            </button>
            <button
              role="tab"
              aria-selected={true}
              className="bg-amber/15 px-3 py-1.5 text-xs font-medium text-amber"
            >
              Board
            </button>
            <button
              role="tab"
              aria-selected={false}
              onClick={onQuiz}
              className="px-3 py-1.5 text-xs font-medium text-dusk transition-colors hover:text-cream"
            >
              Quiz
            </button>
          </div>
          <button
            onClick={exportBoard}
            className="flex items-center gap-1.5 rounded-lg bg-amber px-3 py-1.5 text-xs font-semibold text-void transition-colors hover:bg-amber-lt"
          >
            <Icon name="download" size={14} />
            Export
          </button>
        </div>
      </div>

      {/* ── toolbar: history, tools, inks, status chip ── */}
      <div className="flex flex-wrap items-center gap-1.5 border-b border-line bg-depth/60 px-3 py-1.5">
        <ToolBtn
          label="Undo"
          icon="undo"
          disabled={strokes.length === 0}
          onClick={undo}
        />
        <ToolBtn
          label="Redo"
          icon="undo"
          flip
          disabled={redoStack.length === 0}
          onClick={redo}
        />
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <ToolBtn
          label="Select"
          icon="cursor"
          active={tool === "select"}
          onClick={() => setTool("select")}
        />
        <ToolBtn
          label="Pen"
          icon="pen"
          active={tool === "pen"}
          onClick={() => setTool("pen")}
        />
        <ToolBtn
          label="Eraser"
          icon="eraser"
          active={tool === "eraser"}
          onClick={() => setTool("eraser")}
        />
        <span className="mx-1 h-5 w-px bg-line" aria-hidden />
        <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Ink colour">
          {INKS.map((c) => (
            <button
              key={c.value}
              role="radio"
              aria-checked={ink === c.value}
              aria-label={`${c.name} ink`}
              title={c.name}
              onClick={() => {
                setInk(c.value);
                if (tool !== "pen") setTool("pen");
              }}
              className={`h-4 w-4 rounded-full transition-transform ${
                ink === c.value
                  ? "scale-110 ring-2 ring-cream ring-offset-2 ring-offset-depth"
                  : "hover:scale-110"
              }`}
              style={{ background: c.value }}
            />
          ))}
        </div>
        {busyChip && (
          <span className="ml-auto flex items-center gap-2 rounded-full border border-amber/25 bg-amber/10 px-3 py-1">
            <ChipWave />
            <span className="text-[11px] font-medium text-amber">
              {speaking ? "Lore speaking" : "Lore writing"}
            </span>
          </span>
        )}
      </div>

      {/* ── main: board + sidebar ── */}
      <div className="flex min-h-0 flex-1">
        <div
          ref={wrapRef}
          className="relative min-w-0 flex-1"
          style={{ backgroundImage: DOT_GRID, backgroundSize: "22px 22px" }}
        >
          {shown.length === 0 ? (
            <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <span className="opacity-25">
                <LogoMark size={44} />
              </span>
              <p className="font-hand text-3xl text-dusk">
                Ready when you are.
              </p>
              <p className="max-w-[260px] font-hand text-sm leading-relaxed text-faint">
                Hold the mic and ask — Lore writes the steps out here as it
                explains.
              </p>
            </div>
          ) : (
            <div className="pointer-events-none absolute inset-0 flex flex-col overflow-y-auto p-6 sm:px-9">
              <p className="font-marker text-2xl text-cream">{title}</p>
              <p className="mb-5 mt-0.5 font-hand text-xs text-faint">
                from your notes · grounded answers only
              </p>
              {shown.map((s, i) => {
                const state =
                  i === activeIdx ? "active" : i < activeIdx ? "past" : "next";
                return (
                  <div
                    key={i}
                    className="mb-4 flex items-start gap-3.5"
                    style={{ animation: "lore-write-in 0.4s ease-out both" }}
                  >
                    <span
                      className={`min-w-5 pt-1 font-hand text-sm font-bold ${
                        state === "active" ? "text-amber" : "text-faint"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <p
                      className={`font-hand leading-snug ${
                        s.emphasis ? "text-2xl font-semibold" : "text-xl"
                      } ${
                        state === "active"
                          ? `text-cream ${s.emphasis ? "text-amber" : ""}`
                          : state === "past"
                            ? "text-dusk/70"
                            : "text-faint/60"
                      }`}
                    >
                      {s.text}
                    </p>
                  </div>
                );
              })}

              {answerText && (
                <div className="mt-auto max-h-32 overflow-y-auto rounded-xl border border-amber/20 bg-amber/5 px-4 py-3">
                  <span className="mb-1 flex items-center gap-2">
                    <LogoMark size={13} />
                    <span className="text-[11px] font-medium text-amber">
                      Lore
                    </span>
                    {speaking && <ChipWave />}
                  </span>
                  <p className="font-hand text-sm leading-relaxed text-dusk">
                    {answerText}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* student annotation layer */}
          <canvas
            ref={canvasRef}
            onPointerDown={down}
            onPointerMove={move}
            onPointerUp={up}
            onPointerLeave={up}
            className={`absolute inset-0 h-full w-full touch-none ${cursorClass}`}
          />
        </div>

        {/* sidebar: steps + controls */}
        <aside className="hidden w-56 shrink-0 flex-col border-l border-line bg-depth/60 md:flex">
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              Steps
            </p>
            {shown.length === 0 ? (
              <p className="font-hand text-sm text-faint">
                Steps appear as Lore writes.
              </p>
            ) : (
              shown.map((s, i) => (
                <button
                  key={i}
                  onClick={() =>
                    setFocus(i === shown.length - 1 ? null : i)
                  }
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left transition-colors ${
                    i === activeIdx ? "bg-amber/10" : "hover:bg-carbon/60"
                  }`}
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      i === activeIdx
                        ? "bg-amber"
                        : i < activeIdx
                          ? "bg-green/60"
                          : "bg-faint"
                    }`}
                  />
                  <span
                    className={`truncate font-hand text-sm ${
                      i === activeIdx ? "text-amber" : "text-dusk"
                    }`}
                  >
                    {s.text}
                  </span>
                </button>
              ))
            )}
          </div>

          <div className="border-t border-line p-3">
            <p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">
              Controls
            </p>
            <div className="flex justify-center">{mic}</div>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={onTogglePause}
                disabled={!speaking}
                className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-line-m px-2 py-2 text-xs text-dusk transition-colors hover:text-cream disabled:opacity-35"
              >
                <Icon name={paused ? "play" : "pause"} size={13} />
                {paused ? "Resume" : "Pause"}
              </button>
            </div>
            <label className="mt-2.5 flex items-center gap-2 text-[11px] text-dusk">
              <span>Speed</span>
              <input
                type="range"
                min={0.75}
                max={2}
                step={0.25}
                value={speed}
                onChange={(e) => onSpeedChange(parseFloat(e.target.value))}
                className="min-w-0 flex-1 accent-amber"
                aria-label="Voice speed"
              />
              <span className="w-9 tabular-nums text-cream">
                {speed.toFixed(2)}×
              </span>
            </label>
          </div>
        </aside>
      </div>

      {/* ── bottom bar: step nav + present ── */}
      <div className="flex items-center justify-between gap-3 border-t border-line bg-depth px-3 py-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setFocus(Math.max(0, activeIdx - 1))}
            disabled={shown.length === 0 || activeIdx === 0}
            className="rounded-lg border border-line-m px-3 py-1.5 text-xs text-dusk transition-colors hover:text-cream disabled:opacity-35"
          >
            ← Prev
          </button>
          <span className="text-[11px] tabular-nums text-faint">
            {shown.length === 0
              ? "No steps yet"
              : `Step ${activeIdx + 1} of ${shown.length}`}
          </span>
          <button
            onClick={() =>
              setFocus(activeIdx + 1 >= shown.length - 1 ? null : activeIdx + 1)
            }
            disabled={shown.length === 0 || activeIdx >= shown.length - 1}
            className="rounded-lg border border-amber/40 bg-amber/10 px-3 py-1.5 text-xs font-medium text-amber transition-colors hover:bg-amber/20 disabled:opacity-35"
          >
            Next →
          </button>
        </div>
        <button
          onClick={present}
          className="flex items-center gap-1.5 rounded-lg border border-line-m px-3 py-1.5 text-xs text-dusk transition-colors hover:text-cream"
        >
          <Icon name="whiteboard" size={13} />
          Present
        </button>
      </div>
    </section>
  );
}

function ToolBtn({
  label,
  icon,
  onClick,
  active,
  disabled,
  flip,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
  flip?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      className={`grid h-8 w-8 place-items-center rounded-lg transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "bg-amber/15 text-amber"
          : "text-dusk hover:bg-carbon hover:text-cream"
      }`}
    >
      <span className={flip ? "-scale-x-100" : undefined}>
        <Icon name={icon} size={15} />
      </span>
    </button>
  );
}

function ChipWave() {
  return (
    <span className="flex h-3.5 items-center gap-[2px]" aria-hidden>
      {[0.5, 1, 0.7, 0.9, 0.6].map((h, i) => (
        <span
          key={i}
          className="w-[2.5px] rounded-full bg-amber"
          style={{
            height: `${h * 13}px`,
            animation: "lore-wave 0.8s ease-in-out infinite",
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </span>
  );
}
