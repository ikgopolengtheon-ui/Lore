// POST /api/extract — turn an uploaded file into plain study text (PRD §4.5/§4.6).
// Documents (PDF/DOCX/TXT) are parsed locally; images are OCR'd through
// Claude's vision API. Keeping this server-side keeps the API key and the
// parsing libraries off the client. Returns text plus quality flags the UI
// maps to Screens 8.3 / 8.4 / 8.11.

import Anthropic from "@anthropic-ai/sdk";
import sharp from "sharp";
import mammoth from "mammoth";
import { extractText as extractPdfText } from "unpdf";
import { unzipSync, strFromU8 } from "fflate";
import { fileExt, kindForExt } from "@/lib/constants";
import type { ExtractResult } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODEL = process.env.LORE_LLM_MODEL || "claude-sonnet-5";
const MAX_EDGE = 4096; // cap longest edge before vision (PRD §4.5)
const SCANNED_CHARS_PER_PAGE = 50; // below this avg = scanned/unreadable (§4.6)

const VISION_PROMPT =
  "Extract all readable text from this image: handwritten notes, printed text, mathematical notation, and any labels on diagrams. Return only the extracted text as plain text with no commentary or description. If the image contains no readable text at all, return an empty response.";

export async function POST(req: Request) {
  let file: File | null = null;
  try {
    const form = await req.formData();
    file = form.get("file") as File | null;
  } catch {
    return Response.json(
      { ok: false, text: "", error: "Invalid upload." } satisfies ExtractResult,
      { status: 400 },
    );
  }
  if (!file) {
    return Response.json(
      { ok: false, text: "", error: "No file provided." } satisfies ExtractResult,
      { status: 400 },
    );
  }

  const ext = fileExt(file.name);
  const kind = kindForExt(ext);
  const buf = Buffer.from(await file.arrayBuffer());

  try {
    if (kind === "image") {
      return Response.json(await extractImage(buf, ext));
    }

    if (ext === "txt") {
      const text = buf.toString("utf-8");
      return Response.json({
        ok: true,
        kind: "document",
        text,
        scanned: text.trim().length < 20,
      } satisfies ExtractResult);
    }

    if (ext === "pdf") {
      const { text, totalPages } = await extractPdfText(new Uint8Array(buf), {
        mergePages: true,
      });
      const clean = (text ?? "").trim();
      const scanned =
        clean.length < SCANNED_CHARS_PER_PAGE * Math.max(1, totalPages);
      return Response.json({
        ok: true,
        kind: "document",
        text: clean,
        scanned,
      } satisfies ExtractResult);
    }

    if (ext === "docx") {
      const { value } = await mammoth.extractRawText({ buffer: buf });
      const clean = (value ?? "").trim();
      return Response.json({
        ok: true,
        kind: "document",
        text: clean,
        scanned: clean.length < 20,
      } satisfies ExtractResult);
    }

    if (ext === "pptx") {
      const text = extractPptx(buf).trim();
      return Response.json({
        ok: true,
        kind: "document",
        text,
        scanned: text.length < 20, // no readable text on any slide → 8.4
      } satisfies ExtractResult);
    }

    // any other type: not parsed — index nothing, warn the student.
    return Response.json({
      ok: true,
      kind: "document",
      text: "",
      unsupported: true,
    } satisfies ExtractResult);
  } catch (err) {
    const message = err instanceof Error ? err.message : "extraction failed";
    return Response.json(
      { ok: false, text: "", error: message } satisfies ExtractResult,
      { status: 200 },
    );
  }
}

async function extractImage(buf: Buffer, ext: string): Promise<ExtractResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      kind: "image",
      text: "",
      error: "Image reading needs an API key (ANTHROPIC_API_KEY).",
    };
  }

  // Normalise to JPEG (handles HEIC via sharp) and downscale oversized photos.
  let jpeg: Buffer;
  try {
    jpeg = await sharp(buf)
      .rotate() // honour EXIF orientation
      .resize({ width: MAX_EDGE, height: MAX_EDGE, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 90 })
      .toBuffer();
  } catch {
    return {
      ok: false,
      kind: "image",
      text: "",
      error:
        ext === "heic"
          ? "This HEIC photo could not be converted. Try exporting it as JPEG."
          : "This photo could not be processed. Try a different image.",
    };
  }

  const client = new Anthropic({ apiKey });
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: jpeg.toString("base64"),
            },
          },
          { type: "text", text: VISION_PROMPT },
        ],
      },
    ],
  });

  const text = msg.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n")
    .trim();

  return {
    ok: true,
    kind: "image",
    text,
    imageEmpty: text.length === 0, // → Screen 8.11
  };
}

// ─── PPTX ─────────────────────────────────────────────────────────
// A .pptx is a ZIP of OOXML. Slide text lives in <a:t> runs inside
// ppt/slides/slideN.xml; speaker notes in ppt/notesSlides/notesSlideN.xml.
// Rasterised equation images can't be extracted, but that's fine — we index
// whatever text is present and don't crash (PRD §4.6).

function decodeXmlEntities(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)))
    .replace(/&amp;/g, "&"); // ampersand last
}

function slideNumber(name: string): number {
  const m = name.match(/(\d+)\.xml$/);
  return m ? parseInt(m[1], 10) : 0;
}

function textFromSlideXml(xml: string): string {
  const runs = [...xml.matchAll(/<a:t[^>]*>([\s\S]*?)<\/a:t>/g)].map((m) =>
    decodeXmlEntities(m[1]),
  );
  return runs.join(" ").replace(/\s+/g, " ").trim();
}

function extractPptx(buf: Buffer): string {
  const files = unzipSync(new Uint8Array(buf));
  const names = Object.keys(files);
  const byNum = (a: string, b: string) => slideNumber(a) - slideNumber(b);

  const slides = names
    .filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n))
    .sort(byNum);
  const notes = names
    .filter((n) => /^ppt\/notesSlides\/notesSlide\d+\.xml$/.test(n))
    .sort(byNum);

  const parts: string[] = [];
  slides.forEach((n, i) => {
    const t = textFromSlideXml(strFromU8(files[n]));
    if (t) parts.push(`Slide ${i + 1}: ${t}`);
  });

  const noteTexts = notes
    .map((n) => textFromSlideXml(strFromU8(files[n])))
    .filter(Boolean);
  if (noteTexts.length) parts.push(`Speaker notes:\n${noteTexts.join("\n")}`);

  return parts.join("\n\n");
}
