// Client helper for POST /api/extract — uploads one file and returns its
// extracted text plus quality flags.

import type { ExtractResult } from "./types";

export async function extractFile(file: File): Promise<ExtractResult> {
  const form = new FormData();
  form.append("file", file);
  try {
    const res = await fetch("/api/extract", { method: "POST", body: form });
    const data = (await res.json()) as ExtractResult;
    return data;
  } catch {
    return {
      ok: false,
      text: "",
      error: "Could not reach the processing service.",
    };
  }
}
