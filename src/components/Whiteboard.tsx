"use client";

// Whiteboard Mode (PRD §6). Dark dot-grid "digital blackboard"; Lore writes
// equation steps sequentially in amber handwriting; the student annotates in
// blue on the same canvas. Canvas exports to PNG (v1). State is lifted so it
// persists with the session.

import { useCallback, useEffect, useRef, useState } from "react";
import type { WhiteboardStep } from "@/lib/types";
import { Icon } from "./Icon";

interface Stroke {
  points: { x: number; y: number }[];
}

interface Props {
  steps: WhiteboardStep[];
  /** how many steps have been "written" so far (drives sequential reveal) */
  revealed: number;
  onClose: () => void;
}

const DOT_GRID =
  "radial-gradient(circle at center, rgba(212,147,60,0.14) 1px, transparent 1.4px)";

export function Whiteboard({ steps, revealed, onClose }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [strokes, setStrokes] = useState<Stroke[]>([]);
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

  function down(e: React.PointerEvent) {
    drawing.current = true;
    canvasRef.current?.setPointerCapture(e.pointerId);
    setStrokes((s) => [...s, { points: [pos(e)] }]);
  }
  function move(e: React.PointerEvent) {
    if (!drawing.current) return;
    setStrokes((s) => {
      const copy = [...s];
      copy[copy.length - 1].points.push(pos(e));
      return copy;
    });
  }
  function up() {
    drawing.current = false;
  }

  function clearCanvas() {
    if (strokes.length === 0) return;
    if (confirm("Clear your annotations? Lore's steps will stay.")) {
      setStrokes([]);
    }
  }

  // Save Canvas → PNG (PRD §6.3). Composite background + steps + strokes onto
  // an offscreen canvas so no external capture library is needed.
  function saveCanvas() {
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

    const a = document.createElement("a");
    a.download = "lore-whiteboard.png";
    a.href = out.toDataURL("image/png");
    a.click();
  }

  return (
    <section
      className="relative flex h-full min-h-[320px] flex-col overflow-hidden rounded-2xl border border-line-m"
      aria-label="Whiteboard"
    >
      {/* toolbar (Google-Slides-style chrome, PRD §6.1) */}
      <div className="flex items-center justify-between border-b border-line bg-depth px-3 py-2">
        <span className="flex items-center gap-2 text-xs font-medium tracking-wide text-dusk">
          <Icon name="whiteboard" size={16} />
          Whiteboard
        </span>
        <div className="flex items-center gap-1">
          <ToolBtn label="Save Canvas" icon="download" onClick={saveCanvas} />
          <ToolBtn label="Clear" icon="trash" onClick={clearCanvas} />
          <ToolBtn label="Close whiteboard" icon="close" onClick={onClose} />
        </div>
      </div>

      <div
        ref={wrapRef}
        className="relative flex-1 bg-void"
        style={{ backgroundImage: DOT_GRID, backgroundSize: "22px 22px" }}
      >
        {/* Lore's handwritten steps (also mirrored to transcript for AT) */}
        <div className="pointer-events-none absolute inset-0 flex flex-col gap-3 p-6">
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
          className="absolute inset-0 h-full w-full cursor-crosshair touch-none"
        />
      </div>
    </section>
  );
}

function ToolBtn({
  label,
  icon,
  onClick,
}: {
  label: string;
  icon: "download" | "trash" | "close";
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-lg text-dusk hover:bg-carbon hover:text-cream"
    >
      <Icon name={icon} size={17} />
    </button>
  );
}
