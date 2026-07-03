// File-handling limits — must stay consistent across UI + validation
// + error copy (PRD §4.5).

export const MAX_FILE_BYTES = 50 * 1024 * 1024; // 50 MB per file
export const MAX_SESSION_BYTES = 200 * 1024 * 1024; // 200 MB per session
export const MAX_IMAGES_PER_SESSION = 10;
export const MAX_DOCS_PER_SESSION = 1; // multi-document is v2

export const DOC_EXTS = ["pdf", "pptx", "docx", "txt"] as const;
export const IMAGE_EXTS = ["jpeg", "jpg", "png", "webp", "heic"] as const;

export const ACCEPT_ATTR =
  ".pdf,.pptx,.docx,.txt,.jpeg,.jpg,.png,.webp,.heic," +
  "application/pdf,image/jpeg,image/png,image/webp,image/heic";

export function fileExt(name: string): string {
  const dot = name.lastIndexOf(".");
  return dot === -1 ? "" : name.slice(dot + 1).toLowerCase();
}

export function kindForExt(ext: string): "document" | "image" | null {
  if ((DOC_EXTS as readonly string[]).includes(ext)) return "document";
  if ((IMAGE_EXTS as readonly string[]).includes(ext)) return "image";
  return null;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export interface ValidationError {
  code: "type" | "size";
  message: string;
}

// Client-side validation runs before any upload begins (PRD §5 Screen 2).
export function validateFile(
  name: string,
  sizeBytes: number,
): ValidationError | null {
  const ext = fileExt(name);
  if (!kindForExt(ext)) {
    return {
      code: "type",
      message:
        "Only PDF, PPTX, DOCX, TXT documents or JPEG, PNG, WEBP, HEIC photos are supported.",
    };
  }
  if (sizeBytes > MAX_FILE_BYTES) {
    return {
      code: "size",
      message:
        "This file exceeds the 50 MB limit. Please compress or split your document.",
    };
  }
  return null;
}
