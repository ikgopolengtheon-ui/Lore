"use client";

// Whiteboard Mode (PRD §6). Dark dot-grid "digital blackboard"; Lore writes
// equation steps sequentially in amber handwriting; the student annotates in
// blue on the same canvas. Chrome follows the classic board-app layout: a
// named top bar with Export board, and a floating left tool rail (select /
// pen / eraser / undo / clear). Canvas exports to PNG. State is lifted so it
// persists with the session.

import { useCallback, useEffect, useRef, useState } from "react";
import type { WhiteboardStep } from "@/lib/types";
import { Icon, type IconName } from "./Icon";

interface Stroke {
  points: { x: number; y: number }[];
}

type Tool = "select" | "pen" | "eraser";

interface Props {
  steps: WhiteboardStep[];
  /** how many steps have been "written" so far (drives sequential reveal) */
  revealed: number;
  /** board name shown in the top bar (the subject) */
  title?: string;
  onClose: () => void;
}

const DOT_GRID =
  "radial-gradient(circle at center, rgba(212,147,60,0.14) 1px, transparent 1.4px)";

export function Whiteboard({ steps, revealed, title, onClose }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
  const [tool, setTool] = useState<Tool>("pen");
  const drawing = useRef(false);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.strokeStyle = "#6d9bd4"; // student blue
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const s of strokes) {
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

  // size the drawing canvas to its container (mount + window resize)
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
    return () => window.removeEventListener("resize", resize);
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
          !s.points.some(
            (q) => (q.x - p.x) ** 2 + (q.y - p.y) ** 2 <= R * R,
          ),
      ),
    );
  }, []);

  function down(e: React.PointerEvent) {
    if (tool === "select") return;
    drawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    if (tool === "eraser") eraseAt(pos(e));
    else setStrokes((s) => [...s, { points: [pos(e)] }]);
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

  const undo = () => setStrokes((s) => s.slice(0, -1));

  function clearCanvas() {
    if (strokes.length === 0) return;
    if (confirm("Clear your annotations? Lore's steps will stay.")) {
      setStrokes([]);
    }
  }

  // Export board → PNG (PRD §6.3). Composite background + steps + strokes
  // onto an offscreen canvas so no external capture library is needed.
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

    // dot grid
    ctx.fillStyle = "rgba(212,147,60,0.14)";
    for (let y = 12; y < out.height; y += 22) {
      for (let x = 12; x < out.width; x += 22) {
        ctx.beginPath();
        ctx.arc(x, y, 1, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Lore's steps in amber handwriting
    ctx.fillStyle = "#d4933c";
    ctx.textBaseline = "middle";
    let y = 56;
    steps.slice(0, revealed).forEach((s) => {
      ctx.font = `${s.emphasis ? "600 " : "400 "}${
        s.emphasis ? 30 : 26
      }px "Shantell Sans", cursive`;
      ctx.fillText(s.text, 40, y);
      y += 52;
    });

    // student strokes
    ctx.strokeStyle = "#6d9bd4";
    ctx.lineWidth = 2.5;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (const st of strokes) {
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

  return (
    <section
      className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-line-m"
      aria-label="Whiteboard"
    >
      {/* top bar: board name + export */}
      <div className="flex items-center justify-between gap-3 border-b border-line bg-depth px-3 py-2">
        <span className="flex min-w-0 items-center gap-2">
          <span className="shrink-0 text-amber">
            <Icon name="whiteboard" size={16} />
          </span>
          <span className="min-w-0">
            <span className="block truncate text-xs font-medium text-cream">
              {title ?? "Whiteboard"}
            </span>
            <span className="block text-[10px] text-faint">
              Saved with this subject
            </span>
          </span>
        </span>
        <div className="flex shrink-0 items-center gap-1.5">
          <button
            onClick={exportBoard}
            className="flex items-center gap-1.5 rounded-lg bg-amber px-3 py-1.5 text-xs font-semibold text-void transition-colors hover:bg-amber-lt"
          >
            <Icon name="download" size={14} />
            Export board
          </button>
          <button
            onClick={onClose}
            aria-label="Close whiteboard"
            title="Close whiteboard"
            className="grid h-8 w-8 place-items-center rounded-lg text-dusk hover:bg-carbon hover:text-cream"
          >
            <Icon name="close" size={17} />
          </button>
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative flex-1 bg-void"
        style={{ backgroundImage: DOT_GRID, backgroundSize: "22px 22px" }}
      >
        {/* floating tool rail */}
        <div
          role="toolbar"
          aria-label="Whiteboard tools"
          className="absolute left-2.5 top-1/2 z-10 flex -translate-y-1/2 flex-col gap-1 rounded-2xl border border-line-m bg-carbon/95 p-1.5 shadow-xl shadow-black/40"
        >
          <ToolBtn
            label="Select"
            icon="cursor"
            active={tool === "select"}
            onClick={() => setTool("select")}
          />
          <ToolBtn
            label="Pen (blue annotations)"
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
          <div className="mx-1.5 my-0.5 h-px bg-line" />
          <ToolBtn
            label="Undo last stroke"
            icon="undo"
            disabled={strokes.length === 0}
            onClick={undo}
          />
          <ToolBtn
            label="Clear annotations"
            icon="trash"
            disabled={strokes.length === 0}
            onClick={clearCanvas}
          />
        </div>

        {/* Lore's handwritten steps (also mirrored to transcript for AT) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-6 pl-16">
          {steps.slice(0, revealed).map((s, i) => (
            <p
              key={i}
              className={`font-hand text-amber ${
                s.emphasis ? "text-2xl font-semibold" : "text-xl"
              }`}
              style={{ animation: "lore-write-in 0.4s ease-out both" }}
            >
              {s.text}
            </p>
          ))}
        </div>

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
    </section>
  );
}

function ToolBtn({
  label,
  icon,
  onClick,
  active,
  disabled,
}: {
  label: string;
  icon: IconName;
  onClick: () => void;
  active?: boolean;
  disabled?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      title={label}
      disabled={disabled}
      className={`grid h-9 w-9 place-items-center rounded-xl transition-colors disabled:cursor-not-allowed disabled:opacity-35 ${
        active
          ? "bg-amber text-void"
          : "text-dusk hover:bg-depth hover:text-cream"
      }`}
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
