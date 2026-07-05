"use client";

// App shell + UI state machine (PRD §5 screen map). Holds the current view,
// session stage, error overlay, offline state, and toasts, and routes between
// the screen components. Session data itself lives in the localStorage store.

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import type {
  AppView,
  ExtractResult,
  SessionStage,
  ToastMsg,
  UploadedFile,
} from "@/lib/types";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/mockAI";
import { fileExt } from "@/lib/constants";
import { extractFile } from "@/lib/extractClient";
import type { ErrorKey } from "@/lib/errors";

import { Header } from "./Header";
import { Toaster } from "./Toast";
import { Icon } from "./Icon";
import { AccountButton } from "./AccountButton";
import { Dashboard } from "./screens/Dashboard";
import { Upload } from "./screens/Upload";
import { Processing } from "./screens/Processing";
import { Study } from "./screens/Study";
import { Quiz } from "./screens/Quiz";
import { ErrorScreen } from "./screens/ErrorScreen";
import { StatePreview } from "./StatePreview";

export function LoreApp() {
  const store = useStore();
  const [view, setView] = useState<AppView>("dashboard");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [stage, setStage] = useState<SessionStage>("upload");
  const [errorKey, setErrorKey] = useState<ErrorKey | null>(null);
  const [toasts, setToasts] = useState<ToastMsg[]>([]);
  const [offline, setOffline] = useState(false);
  const retryRef = useRef<(() => void) | null>(null);

  const active = activeId ? store.getSession(activeId) : undefined;
  const isImageSession = active?.files[0]?.kind === "image";

  // ─── toasts ────────────────────────────────────────────────────
  const pushToast = useCallback(
    (text: string, tone: ToastMsg["tone"] = "neutral") => {
      setToasts((t) => [...t, { id: uid(), text, tone }]);
    },
    [],
  );
  const dismissToast = useCallback(
    (id: string) => setToasts((t) => t.filter((x) => x.id !== id)),
    [],
  );

  // ─── connectivity (Screen 8.10) ────────────────────────────────
  useEffect(() => {
    const set = () => setOffline(!navigator.onLine);
    set();
    window.addEventListener("online", set);
    window.addEventListener("offline", set);
    return () => {
      window.removeEventListener("online", set);
      window.removeEventListener("offline", set);
    };
  }, []);

  // ─── navigation ────────────────────────────────────────────────
  const goHome = useCallback(() => {
    setView("dashboard");
    setActiveId(null);
    setErrorKey(null);
  }, []);

  const newChat = useCallback(() => {
    const s = store.createSession();
    setActiveId(s.id);
    setStage("upload");
    setErrorKey(null);
    setView("session");
  }, [store]);

  const openSession = useCallback(
    (id: string) => {
      const s = store.getSession(id);
      setActiveId(id);
      setErrorKey(null);
      setStage(s && s.files.length > 0 ? "study" : "upload");
      setView("session");
    },
    [store],
  );

  // Deep links from the dashboard shell: /app?new=1 starts a fresh
  // upload-and-study flow; /app?session=<id>[&mode=quiz] opens a chat
  // (optionally straight into its quiz). Waits for the store to hydrate, and
  // for the Supabase load when the chat isn't in the local copy yet.
  const params = useSearchParams();
  const deepLinkDone = useRef(false);
  /* eslint-disable react-hooks/set-state-in-effect -- one-time URL→state
     sync: the deep link is applied exactly once after hydration, then the
     query is stripped; the state isn't derivable during render. */
  useEffect(() => {
    if (deepLinkDone.current || !store.hydrated) return;
    const clean = () => window.history.replaceState(null, "", "/app");
    if (params.get("new")) {
      deepLinkDone.current = true;
      newChat();
      clean();
      return;
    }
    const sid = params.get("session");
    if (!sid) {
      deepLinkDone.current = true;
      return;
    }
    const s = store.getSession(sid);
    if (s) {
      deepLinkDone.current = true;
      openSession(sid);
      if (params.get("mode") === "quiz" && s.files.length > 0) {
        setStage("quiz");
      }
      clean();
    } else if (store.synced) {
      // fully loaded and still missing — fall back to the chats list
      deepLinkDone.current = true;
      clean();
    }
  }, [params, store, newChat, openSession]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleUploadStart = useCallback(
    async (files: UploadedFile[], raw: Record<string, File>) => {
      if (!activeId) return;
      const id = activeId;
      const first = files[0];
      const isImage = first.kind === "image";
      const title = isImage
        ? `Photo notes (${files.length})`
        : first.name.replace(/\.[^.]+$/, "");

      // show Processing immediately with the file metadata
      store.updateSession(id, {
        title,
        files,
        subject: guessSubject(first.name),
      });
      setStage("processing");

      // Extract text for every file (TXT already read client-side; others go
      // through /api/extract). Keep a floor so Processing doesn't just flash.
      const sleep = new Promise((r) => setTimeout(r, 1200));
      const [results] = await Promise.all([
        Promise.all(
          files.map(async (f): Promise<ExtractResult> => {
            if (f.extractedText !== undefined) {
              return { ok: true, kind: f.kind, text: f.extractedText };
            }
            const file = raw[f.id];
            if (!file) return { ok: true, kind: f.kind, text: "" };
            return extractFile(file);
          }),
        ),
        sleep,
      ]);

      // Combine extracted text in upload order → one grounding corpus (§4.5).
      const documentText = results
        .map((r) => r.text)
        .filter(Boolean)
        .join("\n\n")
        .trim();

      // Failure routing (PRD Screen 8.3 / 8.4 / 8.11).
      const hardError = results.some((r) => r.error);
      if (hardError) {
        setErrorKey("processing-failed");
        return;
      }
      if (!documentText) {
        if (isImage) setErrorKey("image-extract");
        else setErrorKey(results.some((r) => r.scanned) ? "scanned-doc" : "processing-failed");
        return;
      }

      // Partial-quality advisories (non-blocking, PRD §4.5/§4.6).
      if (isImage && results.some((r) => r.imageEmpty)) {
        pushToast("Some photos had no readable text and were skipped.");
      }
      if (results.some((r) => r.unsupported)) {
        pushToast("Some content (like slides) couldn't be read and was skipped.");
      }
      if (!isImage && results.some((r) => r.scanned)) {
        pushToast("Part of this document had no selectable text.");
      }

      store.updateSession(id, {
        documentText,
        wordCount: documentText.split(/\s+/).filter(Boolean).length,
      });

      // Index into the vector store for RAG (fire-and-forget). Until embedding
      // finishes, chat falls back to full-document context, so study isn't
      // blocked on it.
      fetch("/api/ingest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: id, text: documentText }),
      }).catch(() => {});

      setStage("study");
    },
    [activeId, store, pushToast],
  );

  // ─── error triggers ────────────────────────────────────────────
  const triggerError = useCallback((key: ErrorKey) => {
    setErrorKey(key);
  }, []);

  const onLlmError = useCallback((retry: () => void) => {
    retryRef.current = retry;
    setErrorKey("llm-failed");
  }, []);

  const resolveError = useCallback(() => {
    const key = errorKey;
    setErrorKey(null);
    switch (key) {
      case "llm-failed":
        retryRef.current?.();
        retryRef.current = null;
        break;
      case "mic-denied":
        // stay on study; user re-grants and holds mic again
        break;
      case "upload-failed":
        setStage("upload");
        break;
      case "processing-failed":
      case "scanned-doc":
      case "image-extract":
        setStage("upload");
        break;
      case "session-restore":
        setStage("upload");
        break;
    }
  }, [errorKey]);

  // Delete a chat: drop its vectors too (PRD §11.3), then remove it locally.
  const handleDelete = useCallback(
    (sid: string) => {
      fetch("/api/rag-delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId: sid }),
      }).catch(() => {});
      store.deleteSession(sid);
    },
    [store],
  );

  // ─── render ────────────────────────────────────────────────────
  const headerRight = (
    <>
      {view === "session" && active && (
        <span className="hidden text-xs text-dusk md:block">
          {stage === "quiz" ? "Quiz" : "Study"} · {active.title}
        </span>
      )}
      <Link
        href="/dashboard"
        className="flex items-center gap-1.5 rounded-lg border border-line-m px-3 py-2 text-xs font-medium text-dusk transition-colors hover:text-cream"
      >
        <Icon name="sparkle" size={14} />
        <span className="hidden sm:inline">Dashboard</span>
      </Link>
      <AccountButton />
    </>
  );

  return (
    <div className="flex min-h-dvh flex-col">
      {offline && (
        <div className="flex items-center justify-center gap-2 bg-amber/15 px-4 py-2 text-center text-xs text-amber">
          <Icon name="wifi-off" size={14} />
          No internet connection. Some features may be unavailable.
        </div>
      )}

      <Header
        onHome={goHome}
        right={headerRight}
        showBack={view === "session"}
      />

      {errorKey ? (
        <ErrorScreen
          errorKey={errorKey}
          onPrimary={resolveError}
          onDismiss={errorKey === "mic-denied" ? () => setErrorKey(null) : undefined}
        />
      ) : view === "dashboard" ? (
        <Dashboard
          sessions={store.sessions}
          onNewChat={newChat}
          onOpen={openSession}
          onDelete={handleDelete}
        />
      ) : !active ? (
        <div className="flex flex-1 items-center justify-center text-dusk">
          Loading session…
        </div>
      ) : stage === "upload" ? (
        <Upload onStart={handleUploadStart} />
      ) : stage === "processing" ? (
        <Processing isImage={isImageSession} />
      ) : stage === "quiz" ? (
        <Quiz
          session={active}
          offline={offline}
          onExit={() => setStage("study")}
          onMicDenied={() => triggerError("mic-denied")}
        />
      ) : (
        <Study
          session={active}
          offline={offline}
          onQuiz={() => setStage("quiz")}
          onMicDenied={() => triggerError("mic-denied")}
          onLlmError={onLlmError}
          pushToast={pushToast}
        />
      )}

      <Toaster toasts={toasts} onDismiss={dismissToast} />
      {process.env.NODE_ENV === "development" && (
        <StatePreview onError={triggerError} />
      )}
    </div>
  );
}

// crude subject tag from filename — cosmetic only
function guessSubject(name: string): string | undefined {
  const n = name.toLowerCase();
  if (/bio/.test(n)) return "Biology";
  if (/chem/.test(n)) return "Chemistry";
  if (/phys/.test(n)) return "Physics";
  if (/math|calc|algebra/.test(n)) return "Maths";
  if (/hist/.test(n)) return "History";
  const ext = fileExt(name);
  return ext ? ext.toUpperCase() : undefined;
}
