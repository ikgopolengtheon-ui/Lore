"use client";

import { useState } from "react";
import { Icon } from "../Icon";

export function WaitlistForm({ id }: { id?: string }) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">("idle");
  const [message, setMessage] = useState("");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (state === "busy") return;
    setState("busy");
    setMessage("");
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) {
        setState("error");
        setMessage(data.error ?? "Something went wrong.");
        return;
      }
      setState("done");
      setMessage(
        data.already
          ? "You're already on the list — we'll be in touch."
          : "You're on the list. We'll email you when Lore opens.",
      );
    } catch {
      setState("error");
      setMessage("Couldn't reach the server. Try again.");
    }
  };

  if (state === "done") {
    return (
      <div
        id={id}
        className="flex items-center justify-center gap-3 rounded-xl border border-green/40 bg-green/5 px-5 py-4 text-sm text-cream"
      >
        <span className="text-green">
          <Icon name="check" size={18} />
        </span>
        {message}
      </div>
    );
  }

  return (
    <form
      id={id}
      onSubmit={submit}
      className="mx-auto flex w-full max-w-md flex-col gap-2 sm:flex-row"
    >
      <div className="flex flex-1 flex-col gap-1">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="you@university.edu"
          aria-label="Email address"
          className="w-full rounded-xl border border-line-m bg-carbon px-4 py-3.5 text-sm text-cream outline-none placeholder:text-faint focus:border-amber/60"
        />
        {state === "error" && (
          <span className="pl-1 text-left text-xs text-red">{message}</span>
        )}
      </div>
      <button
        type="submit"
        disabled={state === "busy"}
        className="shrink-0 rounded-xl bg-amber px-6 py-3.5 text-sm font-semibold text-void transition-colors hover:bg-amber-lt disabled:opacity-60"
      >
        {state === "busy" ? "Joining…" : "Join the waitlist"}
      </button>
    </form>
  );
}
