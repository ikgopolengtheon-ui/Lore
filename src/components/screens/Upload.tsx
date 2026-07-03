"use client";

// Screen 2 — Upload (PRD §5 / §4.5). Drag-drop + file picker, client-side
// validation before any upload, combined multi-image sessions, data notice.

import { useCallback, useRef, useState } from "react";
import type { UploadedFile } from "@/lib/types";
import {
  ACCEPT_ATTR,
  MAX_IMAGES_PER_SESSION,
  MAX_DOCS_PER_SESSION,
  MAX_SESSION_BYTES,
  fileExt,
  kindForExt,
  validateFile,
  formatBytes,
} from "@/lib/constants";
import { uid } from "@/lib/mockAI";
import { Icon } from "../Icon";
import { Button } from "../Button";

interface Props {
  onStart: (files: UploadedFile[]) => void;
}

export function Upload({ onStart }: Props) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback(
    (incoming: FileList | File[]) => {
      setError(null);
      const list = Array.from(incoming);
      setFiles((prev) => {
        let next = [...prev];
        for (const f of list) {
          const v = validateFile(f.name, f.size);
          if (v) {
            setError(v.message);
            continue;
          }
          const ext = fileExt(f.name);
          const kind = kindForExt(ext)!;

          // v1 rules: one document OR up to 10 images, not both mixed freely.
          if (kind === "document") {
            const docs = next.filter((x) => x.kind === "document");
            if (docs.length >= MAX_DOCS_PER_SESSION) {
              setError(
                "Only one document per session in v1. Remove the current document to swap it.",
              );
              continue;
            }
            if (next.some((x) => x.kind === "image")) {
              setError(
                "Combine either one document or a set of photos — not both in one session.",
              );
              continue;
            }
          } else {
            const imgs = next.filter((x) => x.kind === "image");
            if (imgs.length >= MAX_IMAGES_PER_SESSION) {
              setError(
                `You can combine up to ${MAX_IMAGES_PER_SESSION} photos into one session.`,
              );
              continue;
            }
            if (next.some((x) => x.kind === "document")) {
              setError(
                "Combine either one document or a set of photos — not both in one session.",
              );
              continue;
            }
          }

          const total =
            next.reduce((sum, x) => sum + x.sizeBytes, 0) + f.size;
          if (total > MAX_SESSION_BYTES) {
            setError("This session exceeds the 200 MB total upload limit.");
            continue;
          }

          const uf: UploadedFile = {
            id: uid(),
            name: f.name,
            sizeBytes: f.size,
            kind,
            ext,
          };
          if (kind === "image") {
            const reader = new FileReader();
            reader.onload = () => {
              setFiles((cur) =>
                cur.map((x) =>
                  x.id === uf.id
                    ? { ...x, thumbnail: reader.result as string }
                    : x,
                ),
              );
            };
            reader.readAsDataURL(f);
          }
          next.push(uf);
        }
        return next;
      });
    },
    [],
  );

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) addFiles(e.dataTransfer.files);
  };

  const remove = (id: string) =>
    setFiles((prev) => prev.filter((x) => x.id !== id));

  const kindLabel =
    files[0]?.kind === "image"
      ? `${files.length} photo${files.length > 1 ? "s" : ""}`
      : files[0]?.name;

  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 sm:py-16">
      <h1 className="mb-1 font-serif text-3xl tracking-tight sm:text-4xl">
        Add your <span className="italic text-amber">material</span>
      </h1>
      <p className="mb-8 text-sm text-dusk">
        Lore will only ever answer from what you upload here.
      </p>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging
            ? "border-amber bg-amber/5"
            : "border-line-m bg-depth/50 hover:border-amber/50"
        }`}
      >
        <span className="grid h-14 w-14 place-items-center rounded-2xl border border-line bg-carbon text-amber">
          <Icon name="upload" size={26} />
        </span>
        <div>
          <p className="font-medium text-cream">
            Drag &amp; drop, or{" "}
            <span className="text-amber underline underline-offset-2">
              choose a file
            </span>
          </p>
          <p className="mx-auto mt-2 max-w-md text-xs leading-relaxed text-dusk">
            Documents: PDF, PPTX, DOCX, TXT · Photos of notes: JPEG, PNG, WEBP,
            HEIC · max 50 MB per file
          </p>
        </div>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept={ACCEPT_ATTR}
          className="hidden"
          onChange={(e) => e.target.files && addFiles(e.target.files)}
        />
      </div>

      {error && (
        <p
          role="alert"
          className="mt-3 flex items-start gap-2 rounded-lg border border-red/30 bg-red/5 px-3 py-2.5 text-sm text-red"
        >
          <Icon name="warning" size={16} className="mt-0.5 shrink-0" />
          {error}
        </p>
      )}

      {files.length > 0 && (
        <div className="mt-6 flex flex-col gap-2">
          {files.map((f) => (
            <div
              key={f.id}
              className="flex items-center gap-3 rounded-lg border border-line bg-carbon px-3 py-2.5"
            >
              {f.thumbnail ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={f.thumbnail}
                  alt={f.name}
                  className="h-10 w-10 rounded object-cover"
                />
              ) : (
                <span className="grid h-10 w-10 place-items-center rounded bg-depth text-amber">
                  <Icon name={f.kind === "image" ? "image" : "doc"} size={20} />
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm text-cream">
                  {f.name}
                </span>
                <span className="block text-xs text-dusk">
                  {formatBytes(f.sizeBytes)} · {f.ext.toUpperCase()}
                </span>
              </span>
              <button
                onClick={() => remove(f.id)}
                aria-label={`Remove ${f.name}`}
                className="grid h-8 w-8 place-items-center rounded-lg text-faint hover:bg-depth hover:text-red"
              >
                <Icon name="close" size={18} />
              </button>
            </div>
          ))}

          <Button
            onClick={() => onStart(files)}
            className="mt-2 w-full sm:w-auto sm:self-start"
          >
            Start Studying{kindLabel ? ` · ${kindLabel}` : ""}
          </Button>
        </div>
      )}

      <p className="mt-8 flex items-start gap-2 text-xs leading-relaxed text-faint">
        <Icon name="info" size={14} className="mt-0.5 shrink-0" />
        Your document is stored privately in your chat and is never used to
        train AI models.
      </p>
    </main>
  );
}
