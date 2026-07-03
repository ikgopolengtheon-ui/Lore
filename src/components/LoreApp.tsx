"use client";

// App shell + UI state machine (PRD §5 screen map). Holds the current view,
// session stage, error overlay, offline state, and toasts, and routes between
// the screen components. Session data itself lives in the localStorage store.

import { useCallback, useEffect, useRef, useState } from "react";
import type { AppView, SessionStage, ToastMsg, UploadedFile } from "@/lib/types";
import { useStore } from "@/lib/store";
import { uid } from "@/lib/mockAI";
import { fileExt } from "@/lib/constants";
import type { ErrorKey } from "@/lib/errors";

import { Header } from "./Header";
import { Toaster } from "./Toast";
import { Icon } from "./Icon";
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

  const handleUploadStart = useCallback(
    (files: UploadedFile[]) => {
      if (!activeId) return;
      const first = files[0];
      const title =
        first.kind === "image"
          ? `Photo notes (${files.length})`
          : first.name.replace(/\.[^.]+$/, "");
      // Combine extracted text in upload order — multi-image sessions and any
      // future multi-doc combine here into one grounding corpus (PRD §4.5).
      const documentText = files
        .map((f) => f.extractedText ?? "")
        .filter(Boolean)
        .join("\n\n");
      // Word count from real text when available; otherwise a mock stand-in so
      // the quiz gate still behaves until PDF/OCR extraction lands.
      const wordCount = documentText
        ? documentText.split(/\s+/).filter(Boolean).length
        : 250 + Math.floor(Math.random() * 900);
      store.updateSession(activeId, {
        title,
        files,
        wordCount,
        documentText,
        subject: guessSubject(first.name),
      });
      setStage("processing");
    },
    [activeId, store],
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

  // ─── render ────────────────────────────────────────────────────
  const headerRight =
    view === "session" && active ? (
      <span className="hidden text-xs text-dusk sm:block">
        {stage === "quiz" ? "Quiz" : "Study"} · {active.title}
      </span>
    ) : null;

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
          onDelete={store.deleteSession}
        />
      ) : !active ? (
        <div className="flex flex-1 items-center justify-center text-dusk">
          Loading session…
        </div>
      ) : stage === "upload" ? (
        <Upload onStart={handleUploadStart} />
      ) : stage === "processing" ? (
        <Processing
          isImage={isImageSession}
          onDone={() => setStage("study")}
        />
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
      <StatePreview onError={triggerError} />
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
