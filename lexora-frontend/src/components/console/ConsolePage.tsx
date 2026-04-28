"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import { fetchActiveWorkspaces, fetchDeletedWorkspaces } from "@/lib/workspace-api";
import type { ActivityLog, NotificationItem } from "@/types/api";
import {
  ArrowPathIcon,
  BellAlertIcon,
  BoltIcon,
  ChartBarIcon,
  ClockIcon,
  NewspaperIcon,
  RectangleStackIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";

function QuickLink({
  href,
  title,
  desc,
  icon: Icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ComponentType<{ className?: string }>;
}) {
  return (
    <Link
      href={href}
      className="group lx-card flex gap-4 transition hover:border-[var(--lx-primary)]/35"
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--lx-primary)]/10 text-[var(--lx-primary)] group-hover:bg-[var(--lx-primary)]/20">
        <Icon className="h-6 w-6" />
      </div>
      <div>
        <p className="font-semibold text-[var(--lx-text)]">{title}</p>
        <p className="text-sm text-[var(--lx-text-muted)]">{desc}</p>
      </div>
    </Link>
  );
}

export function ConsolePage({ activeTab }: { activeTab: "overview" }) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activeWs, setActiveWs] = useState(0);
  const [deletedWs, setDeletedWs] = useState(0);
  const [contentCount, setContentCount] = useState(0);
  const [unread, setUnread] = useState(0);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);

  const load = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [active, deleted, actRes, notifRes] = await Promise.all([
        fetchActiveWorkspaces().catch(() => []),
        fetchDeletedWorkspaces().catch(() => []),
        apiFetch("/api/activity/me?page=0&size=8"),
        apiFetch(`/api/notifications/${user.id}`),
      ]);

      setActiveWs(active.length);
      setDeletedWs(deleted.length);

      let notesTotal = 0;
      await Promise.all(
        active.map(async (w) => {
          const r = await apiFetch(
            `/api/notes/list/${w.id}?page=0&size=1`,
          );
          if (r.ok) {
            const p = await r.json();
            notesTotal += Number(p.totalElements ?? 0);
          }
        }),
      );
      setContentCount(notesTotal);

      if (actRes.ok) {
        const rows = (await actRes.json()) as ActivityLog[];
        setActivity(rows.slice(0, 8));
      } else setActivity([]);

      if (notifRes.ok) {
        const list = (await notifRes.json()) as NotificationItem[];
        setNotifications(list.slice(0, 6));
        setUnread(list.filter((n) => !n.isRead).length);
      } else {
        setNotifications([]);
        setUnread(0);
      }
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    load();
  }, [load]);

  const markRead = async (id: string) => {
    const res = await apiFetch(`/api/notifications/${id}/read`, {
      method: "PUT",
    });
    if (res.ok) {
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnread((u) => Math.max(0, u - 1));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <div className="lx-card flex max-w-md flex-col items-center gap-4 text-center">
          <ArrowPathIcon className="h-10 w-10 animate-spin text-[var(--lx-primary)]" />
          <p className="text-sm font-medium text-[var(--lx-text)]">
            Loading the Lexora workspace console
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {activeTab === "overview" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {(
              [
                { label: "Active workspaces", value: activeWs, Icon: SparklesIcon },
                { label: "Deleted workspaces", value: deletedWs, Icon: RectangleStackIcon },
                { label: "Content items", value: contentCount, Icon: NewspaperIcon },
                { label: "Unread alerts", value: unread, Icon: BellAlertIcon },
              ] as const
            ).map(({ label, value, Icon }) => (
              <div key={label} className="lx-card">
                <div className="flex items-center gap-3">
                  <Icon className="h-8 w-8 text-[var(--lx-primary)]" />
                  <div>
                    <p className="text-2xl font-bold text-[var(--lx-text)]">{value}</p>
                    <p className="text-xs font-medium uppercase tracking-wide text-[var(--lx-text-muted)]">
                      {label}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
                Quick links
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                <QuickLink
                  href="/dashboard/workspaces"
                  title="Workspaces"
                  desc="Create, search, and restore"
                  icon={RectangleStackIcon}
                />
                <QuickLink
                  href="/dashboard/notes"
                  title="Content lab"
                  desc="Notes & publishing scope"
                  icon={NewspaperIcon}
                />
                <QuickLink
                  href="/dashboard/publish"
                  title="Publish studio"
                  desc="Ship to the public shelf"
                  icon={SparklesIcon}
                />
                <QuickLink
                  href="/publications"
                  title="Public library"
                  desc="Reader-facing articles"
                  icon={ClockIcon}
                />
                <QuickLink
                  href="/activity"
                  title="Activity feed"
                  desc="Filters, paging, workspace scope"
                  icon={BoltIcon}
                />
                <QuickLink
                  href="/activity/analytics"
                  title="Analytics"
                  desc="Timeline & action breakdown"
                  icon={ChartBarIcon}
                />
              </div>
            </div>

            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
                Notifications
              </h2>
              <div className="lx-card space-y-3 !py-4">
                {notifications.length === 0 && (
                  <p className="text-sm text-[var(--lx-text-muted)]">No notifications.</p>
                )}
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className="flex items-start justify-between gap-2 rounded-xl border border-[var(--lx-border)]/60 p-2"
                  >
                    <p className="text-sm text-[var(--lx-text)]">{n.message}</p>
                    <div className="flex shrink-0 flex-col items-end gap-1">
                      <span className="text-[10px] text-[var(--lx-text-muted)]">
                        {new Date(n.createdAt).toLocaleString()}
                      </span>
                      {!n.isRead && (
                        <button
                          type="button"
                          onClick={() => markRead(n.id)}
                          className="rounded-full bg-[var(--lx-gold)]/25 px-2 py-0.5 text-[10px] font-medium text-amber-900 dark:text-amber-100"
                        >
                          Mark read
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
              Recent activity
            </h2>
            <div className="mt-3 lx-card !py-4">
              {activity.length === 0 ? (
                <p className="text-sm text-[var(--lx-text-muted)]">
                  No activities yet.
                </p>
              ) : (
                <ul className="divide-y divide-[var(--lx-border)]">
                  {activity.map((a) => (
                    <li key={a.id} className="flex flex-wrap gap-2 py-3 text-sm">
                      <span className="font-medium text-[var(--lx-text)]">
                        {a.action}
                      </span>
                      <span className="text-[var(--lx-text-muted)]">
                        {new Date(a.timestamp).toLocaleString()}
                      </span>
                      {a.entityType && (
                        <span className="text-xs text-[var(--lx-text-muted)]">
                          · {a.entityType}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
