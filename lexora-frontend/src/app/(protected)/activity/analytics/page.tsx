"use client";

import { AnalyticsChart } from "@/components/AnalyticsChart";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { apiFetch, parseJson } from "@/lib/api";
import { fetchActiveWorkspaces } from "@/lib/workspace-api";
import type { AnalyticsResponse, WorkspaceResponse } from "@/types/api";
import { useCallback, useEffect, useState } from "react";

type Preset = "today" | "7" | "30" | "90";

function rangeFor(p: Preset): { start?: string; end?: string } {
  const now = Date.now();
  const day = 86400000;
  const end = new Date(now).toISOString();
  if (p === "today") {
    const start = new Date(now - day).toISOString();
    return { start, end };
  }
  const days = p === "7" ? 7 : p === "30" ? 30 : 90;
  const start = new Date(now - days * day).toISOString();
  return { start, end };
}

export default function AnalyticsPage() {
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [wsId, setWsId] = useState("");
  const [preset, setPreset] = useState<Preset>("7");
  const [data, setData] = useState<AnalyticsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [denied, setDenied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActiveWorkspaces().then((w) => {
      setWorkspaces(w);
      const stored = localStorage.getItem("lexora_last_workspace");
      setWsId(stored && w.some((x) => x.id === stored) ? stored : w[0]?.id ?? "");
    });
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setDenied(false);
    const { start, end } = rangeFor(preset);
    const q = new URLSearchParams();
    if (wsId) q.set("workspaceId", wsId);
    if (start) q.set("startDate", start);
    if (end) q.set("endDate", end);
    const res = await apiFetch(`/api/activity/analytics?${q}`);
    if (res.status === 403) {
      const b = await parseJson<{ error?: string }>(res);
      setDenied(true);
      setError(b?.error ?? "Access denied");
      setData(null);
    } else if (!res.ok) {
      const b = await parseJson<{ error?: string }>(res);
      setError(b?.error ?? "Analytics failed");
      setData(null);
    } else {
      setData(await res.json());
    }
    setLoading(false);
  }, [wsId, preset]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-[var(--lx-text)]">
          Activity analytics
        </h1>
        <button type="button" className="lx-btn-gold" onClick={load} disabled={loading}>
          {loading ? "…" : "Refresh"}
        </button>
      </div>

      <div className="lx-card flex flex-wrap gap-4">
        <WorkspaceSelector
          workspaces={workspaces}
          value={wsId}
          onChange={(id) => {
            localStorage.setItem("lexora_last_workspace", id);
            setWsId(id);
          }}
        />
        <div className="flex flex-wrap gap-2">
          {(
            [
              ["today", "Today"],
              ["7", "Last 7"],
              ["30", "Last 30"],
              ["90", "Last 90"],
            ] as const
          ).map(([k, label]) => (
            <button
              key={k}
              type="button"
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                preset === k
                  ? "bg-[var(--lx-primary)] text-white"
                  : "bg-[var(--lx-border)]/50 text-[var(--lx-text-muted)]"
              }`}
              onClick={() => setPreset(k)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {denied && (
        <div className="lx-card border-amber-500/30 bg-amber-500/5 text-center">
          <p className="text-3xl">🔒</p>
          <p className="mt-2 font-medium text-[var(--lx-text)]">Access restricted</p>
          <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
            You need workspace owner or admin privileges for analytics in this
            tenant. Platform admins can review all workspaces.
          </p>
        </div>
      )}

      {error && !denied && (
        <div className="lx-card border-red-400/40 bg-red-500/5">
          <p className="text-2xl">⚠️</p>
          <p className="mt-2 text-sm text-red-800 dark:text-red-200">{error}</p>
          <button type="button" className="lx-btn-secondary mt-4" onClick={load}>
            Try again
          </button>
        </div>
      )}

      {data && !loading && <AnalyticsChart data={data} />}

      {loading && <p className="text-[var(--lx-text-muted)]">Loading analytics…</p>}
    </div>
  );
}
