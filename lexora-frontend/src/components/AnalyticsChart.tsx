"use client";

import type { AnalyticsResponse } from "@/types/api";

export function AnalyticsChart({ data }: { data: AnalyticsResponse }) {
  const timeline = data.activityTimeline ?? {};
  const entries = Object.entries(timeline)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([, v]) => Number(v));

  const max = Math.max(1, ...entries.map((n) => n));

  const byAction = data.activitiesByAction ?? {};

  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="lx-card">
        <h3 className="text-sm font-semibold text-[var(--lx-text)]">
          Activity timeline (7 buckets)
        </h3>
        <div className="mt-4 flex h-40 items-end gap-2">
          {entries.map((v, i) => (
            <div key={i} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t-lg bg-gradient-to-t from-[var(--lx-primary)] to-sky-400/80 transition-all"
                style={{ height: `${(v / max) * 100}%`, minHeight: v ? 8 : 2 }}
                title={`${v} events`}
              />
              <span className="text-[10px] text-[var(--lx-text-muted)]">
                {i + 1}
              </span>
            </div>
          ))}
        </div>
      </div>
      <div className="lx-card">
        <h3 className="text-sm font-semibold text-[var(--lx-text)]">
          By action
        </h3>
        <ul className="mt-3 max-h-44 space-y-2 overflow-auto text-sm">
          {Object.entries(byAction).map(([k, v]) => (
            <li
              key={k}
              className="flex justify-between gap-2 rounded-lg bg-[var(--lx-border)]/30 px-2 py-1"
            >
              <span className="truncate text-[var(--lx-text)]">{k}</span>
              <span className="tabular-nums text-[var(--lx-text-muted)]">{v}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
