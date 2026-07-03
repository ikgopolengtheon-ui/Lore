"use client";

// Per-chat persistence model (PRD §11.1): sessions, transcript, and
// whiteboard state persist across returns. Backed by localStorage to stand
// in for Supabase in the prototype.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { Session, Turn, WhiteboardStep } from "./types";
import { uid } from "./mockAI";

const STORAGE_KEY = "lore.sessions.v1";

interface StoreValue {
  sessions: Session[];
  hydrated: boolean;
  createSession: () => Session;
  getSession: (id: string) => Session | undefined;
  updateSession: (id: string, patch: Partial<Session>) => void;
  addTurn: (id: string, turn: Turn) => void;
  setWhiteboard: (id: string, steps: WhiteboardStep[]) => void;
  deleteSession: (id: string) => void;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Hydrate once on mount. We intentionally render empty first and populate
  // from localStorage after mount — reading storage during render would cause
  // an SSR/client hydration mismatch. This is external-store synchronisation,
  // which the set-state-in-effect heuristic can't distinguish, so scope-disable.
  useEffect(() => {
    let restored: Session[] = [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) restored = JSON.parse(raw) as Session[];
    } catch {
      /* corrupt store — start clean (surfaces as Screen 8.9 on restore) */
    }
    /* eslint-disable react-hooks/set-state-in-effect */
    setSessions(restored);
    setHydrated(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);

  // debounced persistence
  useEffect(() => {
    if (!hydrated) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
      } catch {
        /* storage full / unavailable — non-fatal in prototype */
      }
    }, 250);
  }, [sessions, hydrated]);

  const createSession = useCallback((): Session => {
    const now = Date.now();
    const s: Session = {
      id: uid(),
      title: "New chat",
      files: [],
      turns: [],
      whiteboard: [],
      createdAt: now,
      lastActive: now,
      wordCount: 0,
    };
    setSessions((prev) => [s, ...prev]);
    return s;
  }, []);

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions],
  );

  const updateSession = useCallback((id: string, patch: Partial<Session>) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, ...patch, lastActive: Date.now() } : s,
      ),
    );
  }, []);

  const addTurn = useCallback((id: string, turn: Turn) => {
    setSessions((prev) =>
      prev.map((s) =>
        s.id === id
          ? { ...s, turns: [...s.turns, turn], lastActive: Date.now() }
          : s,
      ),
    );
  }, []);

  const setWhiteboard = useCallback((id: string, steps: WhiteboardStep[]) => {
    setSessions((prev) =>
      prev.map((s) => (s.id === id ? { ...s, whiteboard: steps } : s)),
    );
  }, []);

  const deleteSession = useCallback((id: string) => {
    setSessions((prev) => prev.filter((s) => s.id !== id));
  }, []);

  const value = useMemo<StoreValue>(
    () => ({
      sessions,
      hydrated,
      createSession,
      getSession,
      updateSession,
      addTurn,
      setWhiteboard,
      deleteSession,
    }),
    [
      sessions,
      hydrated,
      createSession,
      getSession,
      updateSession,
      addTurn,
      setWhiteboard,
      deleteSession,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
