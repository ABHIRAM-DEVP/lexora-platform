"use client";

import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import type { ActivityLog, MediaResponse, NoteResponse, WorkspaceResponse } from "@/types/api";
import {
  DocumentTextIcon,
  PhotoIcon,
  UserPlusIcon,
  Cog6ToothIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AddMemberModal } from "./AddMemberModal";

type FeedItem =
  | { kind: "note"; at: string; note: NoteResponse }
  | { kind: "media"; at: string; media: MediaResponse }
  | { kind: "activity"; at: string; log: ActivityLog };

function shortId(id: string) {
  return id.replaceAll("-", "").slice(-6).toUpperCase();
}

type WorkspaceOverviewDashboardProps = {
  readonly workspaceId: string;
};

export function WorkspaceOverviewDashboard({
  workspaceId,
}: WorkspaceOverviewDashboardProps) {
  const { user } = useAuth();
  const { push } = useToast();
  const [ws, setWs] = useState<WorkspaceResponse | null>(null);
  const [members, setMembers] = useState<Record<string, string>>({});
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const wsRes = await apiFetch(`/api/workspaces/${workspaceId}`);
      if (!wsRes.ok) throw new Error("Workspace not found");
      const w = (await wsRes.json()) as WorkspaceResponse;
      setWs(w);

      const mRes = await apiFetch(`/api/workspaces/${workspaceId}/members`);
      if (mRes.ok) {
        const map = (await mRes.json()) as Record<string, string>;
        setMembers(map ?? {});
      }

      const [notesRes, mediaRes, actRes] = await Promise.all([
        apiFetch(`/api/notes/list/${workspaceId}?page=0&size=10`),
        apiFetch(`/api/media/list/${workspaceId}?page=0&size=10`),
        apiFetch(`/api/activity/workspace/${workspaceId}?page=0&size=20`),
      ]);

      const merged: FeedItem[] = [];
      if (notesRes.ok) {
        const p = await notesRes.json();
        const notes = (p.content ?? []) as NoteResponse[];
        notes.forEach((note) =>
          merged.push({
            kind: "note",
            at: note.updatedAt ?? note.createdAt,
            note,
          }),
        );
      }
      if (mediaRes.ok) {
        const p = await mediaRes.json();
        const files = (p.content ?? []) as MediaResponse[];
        files.forEach((media) =>
          merged.push({
            kind: "media",
            at: media.updatedAt ?? media.createdAt ?? new Date().toISOString(),
            media,
          }),
        );
      }
      if (actRes.ok) {
        const logs = (await actRes.json()) as ActivityLog[];
        logs.forEach((log) =>
          merged.push({ kind: "activity", at: log.timestamp, log }),
        );
      }

      merged.sort((a, b) => (a.at < b.at ? 1 : -1));
      setFeed(merged.slice(0, 24));
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, push]);

  useEffect(() => {
    load();
  }, [load]);

  const isOwner = ws?.ownerId === user?.id;
  const canManage = isOwner || members[user?.id ?? ""] === "ADMIN";

  const memberEntries = useMemo(() => Object.entries(members), [members]);

  const changeRole = async (memberId: string, role: string) => {
    const res = await apiFetch(`/api/workspaces/${workspaceId}/role`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: memberId, role }),
    });
    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Could not change role");
      return;
    }
    push("success", "Role updated");
    load();
  };

  const removeMember = async (memberId: string) => {
    const res = await apiFetch(
      `/api/workspaces/${workspaceId}/members/${memberId}`,
      { method: "DELETE" },
    );
    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Could not remove");
      return;
    }
    push("success", "Member removed");
    load();
  };

  if (loading || !ws) {
    return <p className="text-[var(--lx-text-muted)]">Loading…</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-start">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--lx-text)]">{ws.name}</h1>
          <p className="mt-2 max-w-2xl text-[var(--lx-text-muted)]">{ws.description}</p>
          <span className="mt-3 inline-flex rounded-full bg-[var(--lx-primary)]/15 px-3 py-1 text-xs font-medium text-[var(--lx-primary)]">
            {ws.accessType} access
          </span>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/workspaces/${workspaceId}/notes`}
            className="lx-btn-primary"
          >
            Create Note
          </Link>
          <Link
            href={`/dashboard/workspaces/${workspaceId}/media`}
            className="lx-btn-secondary"
          >
            Upload Media
          </Link>
          {canManage && (
            <button
              type="button"
              className="lx-btn-secondary"
              onClick={() => setShowAdd(true)}
            >
              <UserPlusIcon className="h-4 w-4" />
              Add Member
            </button>
          )}
          <Link href="/dashboard/workspaces" className="lx-btn-secondary">
            <Cog6ToothIcon className="h-4 w-4" />
            Settings
          </Link>
        </div>
      </div>

      <AddMemberModal
        open={showAdd}
        workspaceId={workspaceId}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          setShowAdd(false);
          load();
          push("success", "Member added");
        }}
      />

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
          Timeline
        </h2>
        <div className="mt-3 space-y-3">
          {feed.length === 0 && (
            <div className="lx-card text-sm text-[var(--lx-text-muted)]">
              No notes, files, or activity yet.
            </div>
          )}
          {feed.map((item, idx) => {
            let iconElement = <ClockIcon className="h-4 w-4 text-white" />;
            let bg = "from-violet-600 to-fuchsia-600";
            let title = "View workspace activity";
            let href = `/dashboard/workspaces/${workspaceId}`;
            let actionLabel = "View workspace";

            if (item.kind === "note") {
              iconElement = <DocumentTextIcon className="h-4 w-4 text-white" />;
              bg = "from-blue-600 to-indigo-600";
              title = "View note";
              href = `/dashboard/workspaces/${workspaceId}/notes#${item.note.id}`;
              actionLabel = "Open note";
            } else if (item.kind === "media") {
              iconElement = <PhotoIcon className="h-4 w-4 text-white" />;
              bg = "from-amber-500 to-orange-600";
              title = "View media";
              href = `/dashboard/workspaces/${workspaceId}/media`;
              actionLabel = "Open media library";
            }

            return (
              <Link
                key={`${item.kind}-${idx}`}
                href={href}
                className="group block"
                title={title}
              >
                <div className="lx-card flex gap-4 !py-4 transition hover:ring-1 hover:ring-[var(--lx-primary)]/20">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${bg}`}
                  >
                    {iconElement}
                  </div>
                  <div className="min-w-0 flex-1">
                    {item.kind === "note" && (
                      <>
                        <p className="font-medium text-[var(--lx-text)]">
                          {item.note.title}
                        </p>
                        <p className="line-clamp-2 text-sm text-[var(--lx-text-muted)]">
                          {item.note.content}
                        </p>
                      </>
                    )}
                    {item.kind === "media" && (
                      <>
                        <p className="font-medium text-[var(--lx-text)]">
                          {item.media.fileName}
                        </p>
                        <p className="text-sm text-[var(--lx-text-muted)]">
                          {item.media.fileType} · {(item.media.size / 1024).toFixed(1)} KB
                        </p>
                      </>
                    )}
                    {item.kind === "activity" && (
                      <>
                        <p className="font-medium text-[var(--lx-text)]">
                          {item.log.action}
                        </p>
                        {item.log.entityType && (
                          <p className="text-sm text-[var(--lx-text-muted)]">
                            {item.log.entityType}
                          </p>
                        )}
                      </>
                    )}
                    <p className="mt-2 text-xs text-[var(--lx-text-muted)]">
                      {new Date(item.at).toLocaleString()}
                    </p>
                    <p className="mt-2 text-xs font-semibold text-[var(--lx-primary)]">
                      {actionLabel}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
          Team members
        </h2>
        <div className="mt-3 space-y-2">
          {memberEntries.map(([uid, role]) => {
            const initial = shortId(uid).slice(0, 2);
            return (
              <div
                key={uid}
                className="lx-card flex flex-wrap items-center gap-3 !py-3"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--lx-border)] text-xs font-bold text-[var(--lx-text)]">
                  {initial}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-[var(--lx-text)]">
                    User ···{shortId(uid)}
                  </p>
                  <p className="text-xs text-[var(--lx-text-muted)]">ID hidden in UI</p>
                </div>
                <span className="rounded-full bg-[var(--lx-gold)]/20 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-100">
                  {role}
                </span>
                {canManage && uid !== ws.ownerId && role !== "OWNER" && (
                  <>
                    <select
                      className="lx-input !w-auto !py-1 !text-xs"
                      value={role}
                      onChange={(e) => changeRole(uid, e.target.value)}
                    >
                      {["OWNER", "ADMIN", "EDITOR", "VIEWER", "MEMBER"].map((r) => (
                        <option key={r} value={r}>
                          {r}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-400"
                      aria-label="Remove member"
                      onClick={() => removeMember(uid)}
                    >
                      🗑
                    </button>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
