"use client";

import type { ActivityLog } from "@/types/api";

export function ActivityList({
  items,
  loading,
  error,
  hasMore,
  onLoadMore,
  loadingMore,
  emptyMessage,
}: {
  items: ActivityLog[];
  loading: boolean;
  error: string | null;
  hasMore: boolean;
  onLoadMore?: () => void;
  loadingMore?: boolean;
  emptyMessage: string;
}) {
  if (error) {
    return (
      <div className="lx-card border-red-500/40 bg-red-500/5 text-sm text-red-700 dark:text-red-300">
        {error}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-16 animate-pulse rounded-2xl bg-[var(--lx-border)]/40"
          />
        ))}
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="lx-card text-center text-sm text-[var(--lx-text-muted)]">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {items.map((a) => (
        <div key={a.id} className="lx-card !py-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="rounded-full bg-[var(--lx-primary)]/15 px-3 py-0.5 text-xs font-semibold text-[var(--lx-primary)]">
              {a.action}
            </span>
            <time className="text-xs text-[var(--lx-text-muted)]">
              {new Date(a.timestamp).toLocaleString()}
            </time>
          </div>
          {a.entityType && (
            <p className="mt-1 text-xs text-[var(--lx-text-muted)]">
              Entity: {a.entityType}
            </p>
          )}
        </div>
      ))}
      {hasMore && onLoadMore && (
        <button
          type="button"
          className="lx-btn-secondary w-full"
          onClick={onLoadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      )}
    </div>
  );
}
