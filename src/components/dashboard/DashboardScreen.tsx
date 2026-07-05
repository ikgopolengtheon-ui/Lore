"use client";

// Analytics dashboard, modeled on a classic admin layout: sidebar, KPI stat
// tiles, a study-hours bar chart with range filters, a mini calendar, a quiz
// accuracy ring, and a recent-chats table. Single-series amber charts on the
// lore-card surface; values and labels stay in text tokens (cream/dusk) —
// colour only carries the marks. All data is representative mock data.

import { useState } from "react";
import Link from "next/link";
import { Logo } from "@/components/Logo";
import { Icon, type IconName } from "@/components/Icon";

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

const KPIS = [
  { label: "Study time", value: "23.9 h", delta: "+4.2%", up: true },
  { label: "Questions asked", value: "342", delta: "+1.7%", up: true },
  { label: "Documents", value: "12", delta: "+2.9%", up: true },
  { label: "Quizzes taken", value: "23", delta: "+0.9%", up: true },
];

const NAV: { icon: IconName; label: string; active?: boolean }[] = [
  { icon: "sparkle", label: "Dashboard", active: true },
  { icon: "doc", label: "My chats" },
  { icon: "quiz", label: "Quizzes" },
  { icon: "whiteboard", label: "Whiteboards" },
  { icon: "upload", label: "Uploads" },
];

const RECENT: {
  icon: IconName;
  doc: string;
  subject: string;
  questions: number;
  active: string;
  status: "mastered" | "progress" | "review";
}[] = [
  {
    icon: "doc",
    doc: "photosynthesis.pdf",
    subject: "Biology",
    questions: 24,
    active: "2 h ago",
    status: "mastered",
  },
  {
    icon: "image",
    doc: "Organic chem notes (photos)",
    subject: "Chemistry",
    questions: 18,
    active: "yesterday",
    status: "progress",
  },
  {
    icon: "doc",
    doc: "newtons-laws-slides.pptx",
    subject: "Physics",
    questions: 31,
    active: "2 d ago",
    status: "mastered",
  },
  {
    icon: "doc",
    doc: "ww2-essay-draft.docx",
    subject: "History",
    questions: 9,
    active: "5 d ago",
    status: "review",
  },
];

const STATUS: Record<
  "mastered" | "progress" | "review",
  { label: string; dot: string }
> = {
  mastered: { label: "Mastered", dot: "bg-green" },
  progress: { label: "In progress", dot: "bg-amber" },
  review: { label: "Needs review", dot: "bg-red" },
};

const CAL_DAYS = [
  { d: "Wed", n: 1 },
  { d: "Thu", n: 2 },
  { d: "Fri", n: 3 },
  { d: "Sat", n: 4 },
  { d: "Sun", n: 5, today: true },
];

export function DashboardScreen() {
  const [range, setRange] = useState<RangeKey>("month");
  const data = RANGES[range];
  const max = data.ticks[data.ticks.length - 1];

  return (
    <div className="flex min-h-dvh bg-void">
      {/* ── Sidebar ── */}
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col border-r border-line bg-depth/40 p-5 lg:flex">
        <Link href="/" aria-label="Lore home">
          <Logo />
        </Link>
        <nav className="mt-8 flex flex-col gap-1">
          {NAV.map((item) => (
            <a
              key={item.label}
              href="#"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                item.active
                  ? "bg-carbon font-medium text-cream"
                  : "text-dusk hover:bg-carbon/60 hover:text-cream"
              }`}
            >
              <Icon name={item.icon} size={17} />
              {item.label}
            </a>
          ))}
        </nav>

        <div className="lore-card mt-8 p-4">
          <p className="font-serif text-base text-cream">Upgrade to Pro</p>
          <p className="mt-1.5 text-xs leading-relaxed text-dusk">
            Unlimited voice questions, quizzes, and documents.
          </p>
          <button className="mt-3 w-full rounded-lg bg-amber px-3 py-2 text-xs font-semibold text-void transition-colors hover:bg-amber-lt">
            Upgrade
          </button>
        </div>

        <div className="mt-auto flex flex-col gap-1 pt-6">
          <a
            href="#"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dusk transition-colors hover:bg-carbon/60 hover:text-cream"
          >
            <Icon name="info" size={17} />
            Help Center
          </a>
          <Link
            href="/app"
            className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-dusk transition-colors hover:bg-carbon/60 hover:text-cream"
          >
            <Icon name="back" size={17} />
            Back to the app
          </Link>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="min-w-0 flex-1 px-5 py-6 sm:px-8">
        {/* header */}
        <header className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="font-serif text-2xl tracking-tight text-cream sm:text-3xl">
            Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <label className="hidden items-center gap-2 rounded-full border border-line-m bg-carbon px-4 py-2 sm:flex">
              <span className="text-faint">
                <Icon name="sparkle" size={14} />
              </span>
              <input
                type="search"
                placeholder="Search…"
                aria-label="Search"
                className="w-40 bg-transparent text-sm text-cream outline-none placeholder:text-faint"
              />
            </label>
            <span className="grid h-9 w-9 place-items-center rounded-full bg-amber/15 text-sm font-semibold text-amber">
              T
            </span>
          </div>
        </header>

        {/* range filters */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
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
          <span className="rounded-full border border-line-m px-4 py-2 text-xs text-dusk">
            {data.caption}
          </span>
        </div>

        {/* KPI tiles */}
        <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {KPIS.map((kpi, i) =>
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
                  <span className="text-green">↗ {kpi.delta}</span> from last{" "}
                  {range}
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
              {/* y axis */}
              <div
                className="flex h-52 flex-col justify-between text-right font-mono text-[10px] text-faint"
                aria-hidden
              >
                {[...data.ticks].reverse().map((t) => (
                  <span key={t}>{t}</span>
                ))}
              </div>
              {/* plot */}
              <div className="relative h-52 flex-1">
                {/* recessive grid */}
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
            {/* x labels */}
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

        {/* recent chats table */}
        <div className="lore-card mt-4 p-6">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-medium text-cream">Recent chats</h2>
            <Link
              href="/app"
              className="text-xs text-amber transition-colors hover:text-amber-lt"
            >
              Open the app →
            </Link>
          </div>
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
                {RECENT.map((row) => (
                  <tr key={row.doc} className="border-b border-line/60">
                    <td className="py-3.5">
                      <span className="flex items-center gap-2.5 text-cream">
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-line-m bg-carbon text-amber">
                          <Icon name={row.icon} size={15} />
                        </span>
                        {row.doc}
                      </span>
                    </td>
                    <td className="py-3.5 text-dusk">{row.subject}</td>
                    <td className="py-3.5 font-mono text-dusk">
                      {row.questions}
                    </td>
                    <td className="py-3.5 text-dusk">{row.active}</td>
                    <td className="py-3.5">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-line-m px-2.5 py-1 text-xs text-cream">
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${STATUS[row.status].dot}`}
                        />
                        {STATUS[row.status].label}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-faint">
          Preview with representative data — live stats arrive with usage
          tracking.
        </p>
      </div>
    </div>
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
