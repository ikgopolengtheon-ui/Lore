"use client";

// The app's home: live KPIs and recent chats from the session store, plus a
// study-hours chart, calendar, and accuracy ring (representative data until
// usage tracking lands — labeled as such). Single-series amber marks on the
// lore-card surface; values and labels stay in text ink.

import { useState } from "react";
import Link from "next/link";
import { useStore } from "@/lib/store";
import { timeAgo } from "@/lib/format";
import { Icon } from "@/components/Icon";
import { AppShell } from "./AppShell";

type RangeKey = "day" | "week" | "month" | "year";

const RANGES: Record<
  RangeKey,
  { caption: string; labels: string[]; values: number[]; ticks: number[] }
> = {
  day: {
    caption: "Today · 5 Jul 2026",
    labels: ["8a", "10a", "12p", "2p", "4p", "6p", "8p"],
    values: [0.4, 1.1, 0.7, 1.6, 0.9, 1.8, 1.2],
    ticks: [0, 1, 2],
  },
  week: {
    caption: "29 Jun – 5 Jul 2026",
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [1.5, 2.2, 0.8, 3.1, 2.6, 1.2, 2.4],
    ticks: [0, 1, 2, 3, 4],
  },
  month: {
    caption: "Jan – Jun 2026",
    labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
    values: [14, 18, 26, 21, 24, 29],
    ticks: [0, 10, 20, 30],
  },
  year: {
    caption: "2023 – 2026",
    labels: ["2023", "2024", "2025", "2026"],
    values: [46, 132, 210, 168],
    ticks: [0, 80, 160, 240],
  },
};

const CAL_DAYS = [
  { d: "Wed", n: 1 },
  { d: "Thu", n: 2 },
  { d: "Fri", n: 3 },
  { d: "Sat", n: 4 },
  { d: "Sun", n: 5, today: true },
];

function studentTurns(turnCount: { role: string }[]): number {
  return turnCount.filter((t) => t.role === "student").length;
}

export function DashboardScreen() {
  const store = useStore();
  const [range, setRange] = useState<RangeKey>("month");
  const data = RANGES[range];
  const max = data.ticks[data.ticks.length - 1];

  const sessions = [...store.sessions].sort(
    (a, b) => b.lastActive - a.lastActive,
  );
  const questionsAsked = sessions.reduce(
    (n, s) => n + studentTurns(s.turns),
    0,
  );
  const documents = sessions.reduce((n, s) => n + s.files.length, 0);
  const recent = sessions.slice(0, 5);

  const kpis = [
    { label: "Study time", value: "23.9 h", delta: "+4.2%", mock: true },
    {
      label: "Questions asked",
      value: String(questionsAsked),
      delta: null,
    },
    { label: "Documents", value: String(documents), delta: null },
    { label: "Quizzes taken", value: "23", delta: "+0.9%", mock: true },
  ];

  return (
    <AppShell active="dashboard">
      <div className="min-w-0 px-5 py-6 sm:px-8">
        {/* header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-2xl tracking-tight text-cream sm:text-3xl">
            Dashboard
          </h1>
          <div className="flex flex-wrap items-center gap-3">
            <div
              className="flex rounded-full border border-line-m bg-carbon p-1"
              role="tablist"
              aria-label="Time range"
            >
              {(Object.keys(RANGES) as RangeKey[]).map((key) => (
                <button
                  key={key}
                  role="tab"
                  aria-selected={range === key}
                  onClick={() => setRange(key)}
                  className={`rounded-full px-4 py-1.5 text-xs font-medium capitalize transition-colors ${
                    range === key
                      ? "bg-amber text-void"
                      : "text-dusk hover:text-cream"
                  }`}
                >
                  {key}
                </button>
              ))}
            </div>
            <span className="hidden rounded-full border border-line-m px-4 py-2 text-xs text-dusk sm:block">
              {data.caption}
            </span>
          </div>
        </header>

        {/* KPI tiles */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((kpi, i) =>
            i === 0 ? (
              <div key={kpi.label} className="rounded-[1.75rem] bg-amber p-5">
                <p className="text-xs font-medium text-void/70">{kpi.label}</p>
                <p className="mt-2 font-serif text-3xl text-void">
                  {kpi.value}
                </p>
                <p className="mt-1.5 text-xs text-void/70">
                  ↗ {kpi.delta} from last {range}
                </p>
              </div>
            ) : (
              <div key={kpi.label} className="lore-card p-5">
                <p className="text-xs font-medium text-dusk">{kpi.label}</p>
                <p className="mt-2 font-serif text-3xl text-cream">
                  {kpi.value}
                </p>
                <p className="mt-1.5 text-xs text-dusk">
                  {kpi.delta ? (
                    <>
                      <span className="text-green">↗ {kpi.delta}</span> from
                      last {range}
                    </>
                  ) : (
                    "across all your chats"
                  )}
                </p>
              </div>
            ),
          )}
        </div>

        {/* charts row */}
        <div className="mt-4 grid gap-4 xl:grid-cols-[1.6fr_1fr]">
          {/* bar chart */}
          <div className="lore-card p-6">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-medium text-cream">Study hours</h2>
              <span className="text-xs text-faint">hours per {range}</span>
            </div>
            <div className="mt-6 flex gap-3">
              <div
                className="flex h-52 flex-col justify-between text-right font-mono text-[10px] text-faint"
                aria-hidden
              >
                {[...data.ticks].reverse().map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              <div className="relative h-52 flex-1">
                <div
                  className="absolute inset-0 flex flex-col justify-between"
                  aria-hidden
                >
                  {data.ticks.map((t) => (
                    <div key={t} className="border-t border-line/60" />
                  ))}
                </div>
                <div className="absolute inset-0 flex items-end justify-around gap-2 pt-2">
                  {data.values.map((v, i) => (
                    <div
                      key={data.labels[i]}
                      className="group relative flex h-full w-full max-w-14 items-end justify-center"
                    >
                      <span className="pointer-events-none absolute -top-1 hidden -translate-y-full rounded-md border border-line-m bg-depth px-2 py-1 font-mono text-[10px] text-cream group-hover:block">
                        {v} h
                      </span>
                      <div
                        className="w-full max-w-9 rounded-t-[4px] bg-amber transition-colors group-hover:bg-amber-lt"
                        style={{ height: `${(v / max) * 100}%` }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mt-2 flex justify-around gap-2 pl-8">
              {data.labels.map((l) => (
                <span
                  key={l}
                  className="w-full max-w-14 text-center font-mono text-[10px] text-faint"
                >
                  {l}
                </span>
              ))}
            </div>
          </div>

          {/* calendar + accuracy */}
          <div className="flex flex-col gap-4">
            <div className="lore-card p-6">
              <div className="flex items-center justify-between">
                <span className="rotate-90 text-faint">
                  <Icon name="chevron" size={14} />
                </span>
                <h2 className="text-sm font-medium text-cream">July 2026</h2>
                <span className="-rotate-90 text-faint">
                  <Icon name="chevron" size={14} />
                </span>
              </div>
              <div className="mt-5 flex justify-between">
                {CAL_DAYS.map((day) => (
                  <div
                    key={day.n}
                    className={`flex w-11 flex-col items-center gap-1.5 rounded-2xl py-2.5 ${
                      day.today ? "bg-amber" : ""
                    }`}
                  >
                    <span
                      className={`text-[10px] ${day.today ? "text-void/70" : "text-faint"}`}
                    >
                      {day.d}
                    </span>
                    <span
                      className={`text-sm font-medium ${day.today ? "text-void" : "text-cream"}`}
                    >
                      {day.n}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="lore-card flex items-center gap-5 p-6">
              <AccuracyRing value={78} />
              <div>
                <h2 className="text-sm font-medium text-cream">
                  Quiz accuracy
                </h2>
                <p className="mt-1 text-xs text-dusk">
                  <span className="text-green">↗ +2.1%</span> from last {range}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* recent chats table — live from the store */}
        <div className="lore-card mt-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-cream">Recent chats</h2>
            <Link
              href="/app"
              className="text-xs text-amber transition-colors hover:text-amber-lt"
            >
              All chats →
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="flex flex-col items-center gap-4 py-10 text-center">
              <p className="text-sm text-dusk">
                Nothing here yet. Upload a document and start your first study
                session.
              </p>
              <Link
                href="/app?new=1"
                className="flex items-center gap-2 rounded-xl bg-amber px-5 py-2.5 text-sm font-semibold text-void transition-colors hover:bg-amber-lt"
              >
                <Icon name="upload" size={16} />
                Study
              </Link>
            </div>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs text-faint">
                    <th className="pb-3 font-medium">Document</th>
                    <th className="pb-3 font-medium">Subject</th>
                    <th className="pb-3 font-medium">Questions</th>
                    <th className="pb-3 font-medium">Last active</th>
                    <th className="pb-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recent.map((s) => {
                    const asked = studentTurns(s.turns);
                    const status = !s.documentText
                      ? { label: "New", dot: "bg-faint" }
                      : asked < 10
                        ? { label: "In progress", dot: "bg-amber" }
                        : { label: "Well studied", dot: "bg-green" };
                    return (
                      <tr key={s.id} className="border-b border-line/60">
                        <td className="py-3.5">
                          <Link
                            href={`/app?session=${s.id}`}
                            className="flex items-center gap-2.5 text-cream transition-colors hover:text-amber-lt"
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line-m bg-carbon text-amber">
                              <Icon
                                name={
                                  s.files[0]?.kind === "image" ? "image" : "doc"
                                }
                                size={15}
                              />
                            </span>
                            <span className="max-w-56 truncate">{s.title}</span>
                          </Link>
                        </td>
                        <td className="py-3.5 text-dusk">
                          {s.subject ?? "—"}
                        </td>
                        <td className="py-3.5 font-mono text-dusk">{asked}</td>
                        <td className="py-3.5 text-dusk">
                          {timeAgo(s.lastActive)}
                        </td>
                        <td className="py-3.5">
                          <span className="inline-flex items-center gap-1.5 rounded-full border border-line-m px-2.5 py-1 text-xs text-cream">
                            <span
                              className={`h-1.5 w-1.5 rounded-full ${status.dot}`}
                            />
                            {status.label}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          Questions, documents, and chats are live. Study time and quiz stats
          are representative until usage tracking lands.
        </p>
      </div>
    </AppShell>
  );
}

// Single-value progress ring: amber arc on a faint track, number in text ink.
function AccuracyRing({ value }: { value: number }) {
  const r = 44;
  const c = 2 * Math.PI * r;
  return (
    <div className="relative h-28 w-28 shrink-0">
      <svg viewBox="0 0 112 112" className="h-full w-full -rotate-90">
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke="var(--faint)"
          strokeOpacity="0.35"
          strokeWidth="10"
        />
        <circle
          cx="56"
          cy="56"
          r={r}
          fill="none"
          stroke="var(--amber)"
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={`${(value / 100) * c} ${c}`}
        />
      </svg>
      <span className="absolute inset-0 grid place-items-center font-serif text-2xl text-cream">
        {value}%
      </span>
    </div>
  );
}
