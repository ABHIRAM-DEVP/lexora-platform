"use client";

import { ActivityFilters } from "@/components/ActivityFilters";
import { ActivityList } from "@/components/ActivityList";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/api";
import { fetchActiveWorkspaces } from "@/lib/workspace-api";
import type { ActivityLog, WorkspaceResponse } from "@/types/api";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";

export default function ActivityFeedPage() {
  const { push } = useToast();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [wsId, setWsId] = useState("");
  const [action, setAction] = useState("");
  const [entity, setEntity] = useState("");
  const [page, setPage] = useState(0);
  const [items, setItems] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const size = 20;

  const buildQuery = useCallback(() => {
    const p = new URLSearchParams();
    p.set("page", String(page));
    p.set("size", String(size));
    if (action.trim()) p.set("action", action.trim());
    if (entity.trim()) p.set("entityType", entity.trim());
    return p.toString();
  }, [page, action, entity]);

  const load = useCallback(async () => {
    if (!wsId) {
      setItems([]);
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await apiFetch(
        `/api/activity/workspace/${wsId}?${buildQuery()}`,
      );
      if (!res.ok) throw new Error("Could not load activity");
      const rows = (await res.json()) as ActivityLog[];
      setItems(rows);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [wsId, buildQuery]);

  useEffect(() => {
    fetchActiveWorkspaces()
      .then((w) => {
        setWorkspaces(w);
        const stored = localStorage.getItem("lexora_last_workspace");
        const initial =
          stored && w.some((x) => x.id === stored) ? stored : w[0]?.id ?? "";
        setWsId(initial);
      })
      .catch(() => push("error", "Workspaces unavailable"));
  }, [push]);

  useEffect(() => {
    load();
  }, [load]);

  const loadMore = async () => {
    if (!wsId) return;
    setLoadingMore(true);
    try {
      const nextPage = page + 1;
      const p = new URLSearchParams();
      p.set("page", String(nextPage));
      p.set("size", String(size));
      if (action.trim()) p.set("action", action.trim());
      if (entity.trim()) p.set("entityType", entity.trim());
      const res = await apiFetch(`/api/activity/workspace/${wsId}?${p}`);
      if (res.ok) {
        const rows = (await res.json()) as ActivityLog[];
        setItems((prev) => [...prev, ...rows]);
        setPage(nextPage);
      }
    } finally {
      setLoadingMore(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
    push("info", "Feed refreshed");
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold text-[var(--lx-text)]">
        Activity feed
      </h1>

      <div className="lx-card space-y-4">
        <WorkspaceSelector
          workspaces={workspaces}
          value={wsId}
          onChange={(id) => {
            localStorage.setItem("lexora_last_workspace", id);
            setWsId(id);
            setPage(0);
          }}
        />
        <ActivityFilters
          action={action}
          entityType={entity}
          onAction={(v) => {
            setAction(v);
            setPage(0);
          }}
          onEntity={(v) => {
            setEntity(v);
            setPage(0);
          }}
          page={page}
          onPage={(p) => {
            setPage(p);
          }}
        />
      </div>

      <ActivityList
        items={items}
        loading={loading}
        error={error}
        hasMore={items.length >= size}
        onLoadMore={loadMore}
        loadingMore={loadingMore}
        emptyMessage="No activities found for this workspace."
      />

      <button
        type="button"
        className="lx-btn-gold fixed bottom-8 right-8 z-30 shadow-lg"
        onClick={onRefresh}
        disabled={refreshing}
      >
        <ArrowPathIcon className={`h-5 w-5 ${refreshing ? "animate-spin" : ""}`} />
        Refresh
      </button>
    </div>
  );
}
