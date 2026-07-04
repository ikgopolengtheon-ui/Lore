"use client";

// Per-chat persistence (PRD §11.1). Backed by Supabase when configured and
// reachable (anonymous auth + a `chats` table with RLS), otherwise localStorage
// so the app works before Supabase is set up. The context API stays synchronous
// — persistence is a write-through side effect — so no consumer changes.

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
import { ensureAuth, getSupabase, supabaseConfigured } from "./supabase";

const STORAGE_KEY = "lore.sessions.v1";
type Mode = "supabase" | "local";

interface StoreValue {
  sessions: Session[];
  hydrated: boolean;
  /** true once chats are backed by Supabase (server-persisted) */
  synced: boolean;
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
  const [synced, setSynced] = useState(false);

  const modeRef = useRef<Mode>("local");
  const userIdRef = useRef<string | null>(null);
  const sessionsRef = useRef<Session[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // ─── hydrate: Supabase if available, else localStorage ─────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (supabaseConfigured()) {
        const userId = await ensureAuth();
        const supa = getSupabase();
        if (userId && supa) {
          const { data, error } = await supa
            .from("chats")
            .select("data")
            .eq("user_id", userId)
            .order("last_active", { ascending: false });
          if (!cancelled && !error && data) {
            userIdRef.current = userId;
            modeRef.current = "supabase";
            setSessions(data.map((r) => r.data as Session));
            setSynced(true);
            setHydrated(true);
            return;
          }
        }
      }
      // Fallback: localStorage (Supabase unconfigured, anon disabled, or no table)
      if (cancelled) return;
      modeRef.current = "local";
      try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (raw) setSessions(JSON.parse(raw) as Session[]);
      } catch {
        /* corrupt store — start clean */
      }
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  // ─── persistence helpers ───────────────────────────────────────
  const scheduleLocalSave = useCallback(() => {
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(sessionsRef.current));
      } catch {
        /* storage full/unavailable — non-fatal */
      }
    }, 250);
  }, []);

  const persist = useCallback(
    (s: Session) => {
      if (modeRef.current === "supabase" && userIdRef.current) {
        getSupabase()
          ?.from("chats")
          .upsert({
            id: s.id,
            user_id: userIdRef.current,
            data: s,
            last_active: new Date(s.lastActive).toISOString(),
          })
          .then(() => {}); // best-effort; in-memory state is source of truth
      } else {
        scheduleLocalSave();
      }
    },
    [scheduleLocalSave],
  );

  const removeRow = useCallback(
    (id: string) => {
      if (modeRef.current === "supabase") {
        getSupabase()?.from("chats").delete().eq("id", id).then(() => {});
      } else {
        scheduleLocalSave();
      }
    },
    [scheduleLocalSave],
  );

  // ─── mutations (compute next from ref → set state → persist) ────
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
    persist(s);
    return s;
  }, [persist]);

  const getSession = useCallback(
    (id: string) => sessions.find((s) => s.id === id),
    [sessions],
  );

  const commit = useCallback(
    (id: string, mutate: (s: Session) => Session) => {
      const cur = sessionsRef.current.find((s) => s.id === id);
      if (!cur) return;
      const next = { ...mutate(cur), lastActive: Date.now() };
      setSessions((prev) => prev.map((s) => (s.id === id ? next : s)));
      persist(next);
    },
    [persist],
  );

  const updateSession = useCallback(
    (id: string, patch: Partial<Session>) =>
      commit(id, (s) => ({ ...s, ...patch })),
    [commit],
  );

  const addTurn = useCallback(
    (id: string, turn: Turn) =>
      commit(id, (s) => ({ ...s, turns: [...s.turns, turn] })),
    [commit],
  );

  const setWhiteboard = useCallback(
    (id: string, steps: WhiteboardStep[]) =>
      commit(id, (s) => ({ ...s, whiteboard: steps })),
    [commit],
  );

  const deleteSession = useCallback(
    (id: string) => {
      setSessions((prev) => prev.filter((s) => s.id !== id));
      removeRow(id);
    },
    [removeRow],
  );

  const value = useMemo<StoreValue>(
    () => ({
      sessions,
      hydrated,
      synced,
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
      synced,
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
