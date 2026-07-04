"use client";

// Per-chat persistence + auth (PRD §11.1 / §14). Backed by Supabase when
// configured and reachable (anonymous-first auth + a `chats` table with RLS),
// otherwise localStorage so the app works before Supabase is set up. The store
// also owns the auth surface: anonymous by default, upgradeable to an email
// account (same user id → chats are kept), plus sign in / sign out.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { User } from "@supabase/supabase-js";
import type { Session, Turn, WhiteboardStep } from "./types";
import { uid } from "./mockAI";
import {
  ensureAuth,
  getSupabase,
  signInEmail,
  signOutToAnon,
  signUpEmail,
  supabaseConfigured,
  toLoreUser,
  type LoreUser,
} from "./supabase";

const STORAGE_KEY = "lore.sessions.v1";
type Mode = "supabase" | "local";

interface StoreValue {
  sessions: Session[];
  hydrated: boolean;
  /** true once chats are backed by Supabase (server-persisted) */
  synced: boolean;
  user: LoreUser | null;
  createSession: () => Session;
  getSession: (id: string) => Session | undefined;
  updateSession: (id: string, patch: Partial<Session>) => void;
  addTurn: (id: string, turn: Turn) => void;
  setWhiteboard: (id: string, steps: WhiteboardStep[]) => void;
  deleteSession: (id: string) => void;
  signUp: (email: string, password: string) => Promise<{ needsConfirm: boolean }>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const StoreCtx = createContext<StoreValue | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [synced, setSynced] = useState(false);
  const [user, setUser] = useState<LoreUser | null>(null);

  const modeRef = useRef<Mode>("local");
  const userIdRef = useRef<string | null>(null);
  const sessionsRef = useRef<Session[]>([]);
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    sessionsRef.current = sessions;
  }, [sessions]);

  // ─── loaders ───────────────────────────────────────────────────
  const loadLocal = useCallback(() => {
    modeRef.current = "local";
    setSynced(false);
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      setSessions(raw ? (JSON.parse(raw) as Session[]) : []);
    } catch {
      setSessions([]); // corrupt store — start clean
    }
  }, []);

  // Load a user's chats from Supabase; fall back to local if the table isn't
  // there yet. Always updates the current user.
  const loadForUser = useCallback(
    async (u: User) => {
      setUser(toLoreUser(u));
      const supa = getSupabase();
      if (!supa) {
        loadLocal();
        return;
      }
      const { data, error } = await supa
        .from("chats")
        .select("data")
        .eq("user_id", u.id)
        .order("last_active", { ascending: false });
      if (!error && data) {
        userIdRef.current = u.id;
        modeRef.current = "supabase";
        setSessions(data.map((r) => r.data as Session));
        setSynced(true);
      } else {
        loadLocal(); // table missing → local until schema is applied
      }
    },
    [loadLocal],
  );

  // ─── hydrate on mount ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (supabaseConfigured()) {
        const u = await ensureAuth();
        if (!cancelled && u) {
          await loadForUser(u);
          if (!cancelled) setHydrated(true);
          return;
        }
      }
      if (cancelled) return;
      loadLocal();
      setHydrated(true);
    })();
    return () => {
      cancelled = true;
    };
  }, [loadForUser, loadLocal]);

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

  // ─── auth actions ──────────────────────────────────────────────
  const signUp = useCallback(
    async (email: string, password: string) => {
      const { user: u, needsConfirm } = await signUpEmail(email, password);
      if (u && !needsConfirm) await loadForUser(u);
      else if (u) setUser(toLoreUser(u));
      return { needsConfirm };
    },
    [loadForUser],
  );

  const signIn = useCallback(
    async (email: string, password: string) => {
      const u = await signInEmail(email, password);
      await loadForUser(u);
    },
    [loadForUser],
  );

  const signOut = useCallback(async () => {
    const u = await signOutToAnon();
    if (u) await loadForUser(u);
    else {
      setUser(null);
      loadLocal();
    }
  }, [loadForUser, loadLocal]);

  const value = useMemo<StoreValue>(
    () => ({
      sessions,
      hydrated,
      synced,
      user,
      createSession,
      getSession,
      updateSession,
      addTurn,
      setWhiteboard,
      deleteSession,
      signUp,
      signIn,
      signOut,
    }),
    [
      sessions,
      hydrated,
      synced,
      user,
      createSession,
      getSession,
      updateSession,
      addTurn,
      setWhiteboard,
      deleteSession,
      signUp,
      signIn,
      signOut,
    ],
  );

  return <StoreCtx.Provider value={value}>{children}</StoreCtx.Provider>;
}

export function useStore(): StoreValue {
  const ctx = useContext(StoreCtx);
  if (!ctx) throw new Error("useStore must be used within StoreProvider");
  return ctx;
}
