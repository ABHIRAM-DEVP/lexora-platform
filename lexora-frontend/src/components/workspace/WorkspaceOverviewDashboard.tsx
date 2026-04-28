"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowTopRightOnSquareIcon,
  ClockIcon,
  DocumentTextIcon,
  PhotoIcon,
  TrashIcon,
  UserPlusIcon,
} from "@heroicons/react/24/outline";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import { getWorkspaceStyle, type WorkspaceStyle } from "@/lib/workspace-style";
import {
  isWorkspaceOwnerOrAdmin,
  workspaceRoleLabel,
} from "@/lib/workspace-permissions";
import type {
  ActivityLog,
  MediaResponse,
  NoteResponse,
  WorkspaceMemberSummary,
  WorkspaceResponse,
} from "@/types/api";
import { AddMemberModal } from "./AddMemberModal";

type FeedItem =
  | { kind: "note"; at: string; note: NoteResponse }
  | { kind: "media"; at: string; media: MediaResponse }
  | { kind: "activity"; at: string; log: ActivityLog };

type WorkspaceOverviewDashboardProps = {
  readonly workspaceId: string;
};

function normalizeMembers(payload: unknown): WorkspaceMemberSummary[] {
  if (Array.isArray(payload)) {
    return payload.filter(Boolean) as WorkspaceMemberSummary[];
  }

  if (payload && typeof payload === "object") {
    return Object.entries(payload as Record<string, string>).map(([id, role]) => ({
      id,
      username: `User ${id.slice(0, 8)}`,
      email: null,
      role,
      owner: role === "OWNER",
    }));
  }

  return [];
}

export function WorkspaceOverviewDashboard({
  workspaceId,
}: WorkspaceOverviewDashboardProps) {
  const { user } = useAuth();
  const { push } = useToast();
  const [ws, setWs] = useState<WorkspaceResponse | null>(null);
  const [workspaceStyle, setWorkspaceStyle] = useState<WorkspaceStyle | null>(null);
  const [members, setMembers] = useState<WorkspaceMemberSummary[]>([]);
  const [feed, setFeed] = useState<FeedItem[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const wsRes = await apiFetch(`/api/workspaces/${workspaceId}`);
      if (!wsRes.ok) throw new Error("Workspace not found");
      const workspace = (await wsRes.json()) as WorkspaceResponse;
      setWs(workspace);
      setWorkspaceStyle(getWorkspaceStyle(workspaceId) ?? null);

      const membersRes = await apiFetch(`/api/workspaces/${workspaceId}/members`);
      if (membersRes.ok) {
        const membersPayload = await membersRes.json();
        setMembers(normalizeMembers(membersPayload));
      } else {
        setMembers([]);
      }

      const [notesRes, mediaRes, activityRes] = await Promise.all([
        apiFetch(`/api/notes/list/${workspaceId}?page=0&size=10`),
        apiFetch(`/api/media/list/${workspaceId}?page=0&size=10`),
        apiFetch(`/api/activity/workspace/${workspaceId}?page=0&size=20`),
      ]);

      const merged: FeedItem[] = [];

      if (notesRes.ok) {
        const notesPage = await notesRes.json();
        const notes = (notesPage.content ?? []) as NoteResponse[];
        notes.forEach((note) => {
          merged.push({
            kind: "note",
            at: note.updatedAt ?? note.createdAt,
            note,
          });
        });
      }

      if (mediaRes.ok) {
        const mediaPage = await mediaRes.json();
        const files = (mediaPage.content ?? []) as MediaResponse[];
        files.forEach((media) => {
          merged.push({
            kind: "media",
            at: media.updatedAt ?? media.createdAt ?? new Date().toISOString(),
            media,
          });
        });
      }

      if (activityRes.ok) {
        const activityPayload = await activityRes.json();
        const logs = Array.isArray(activityPayload)
          ? (activityPayload as ActivityLog[])
          : ((activityPayload?.content ?? []) as ActivityLog[]);
        logs.forEach((log) => {
          merged.push({ kind: "activity", at: log.timestamp, log });
        });
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
    void load();
  }, [load]);

  const currentMember = useMemo(
    () => members.find((member) => member.id === user?.id),
    [members, user?.id],
  );
  const canManage = isWorkspaceOwnerOrAdmin(user?.id, ws, currentMember);
  const roleLabel = workspaceRoleLabel(user?.id, ws, currentMember);

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
    void load();
  };

  const removeMember = async (memberId: string) => {
    const res = await apiFetch(`/api/workspaces/${workspaceId}/members/${memberId}`, {
      method: "DELETE",
    });
    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Could not remove member");
      return;
    }
    push("success", "Member removed");
    void load();
  };

  if (loading || !ws) {
    return <p className="text-[var(--lx-text-muted)]">Loading...</p>;
  }

  const accent = workspaceStyle?.color ?? "from-sky-500 to-indigo-600";

  return (
    <div className="space-y-8">
      <div className={`overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${accent} shadow-[0_24px_80px_-40px_rgba(15,23,42,0.75)]`}>
        <div className="bg-slate-950/10 p-6 backdrop-blur-[2px] md:p-8">
          <div className="flex flex-col justify-between gap-5 md:flex-row md:items-start">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-white/70">
                Workspace overview
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-white">{ws.name}</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/85">
                {ws.description || "This workspace is ready for notes, media, and publishing activity."}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-semibold text-white">
                  {roleLabel}
                </span>
                <span className="rounded-full border border-white/20 bg-white/12 px-3 py-1 text-xs font-semibold text-white">
                  {ws.accessType} access
                </span>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Link
                href={`/dashboard/workspaces/${workspaceId}/notes`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
              >
                Write
              </Link>
              <Link
                href={`/dashboard/workspaces/${workspaceId}/media`}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
              >
                Upload media
              </Link>
              {canManage && (
                <button
                  type="button"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
                  onClick={() => setShowAdd(true)}
                >
                  <UserPlusIcon className="h-4 w-4" />
                  Add member
                </button>
              )}
              <Link
                href="/dashboard/workspaces"
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/16"
              >
                <ArrowTopRightOnSquareIcon className="h-4 w-4" />
                All workspaces
              </Link>
            </div>
          </div>
        </div>
      </div>

      <AddMemberModal
        open={showAdd}
        workspaceId={workspaceId}
        onClose={() => setShowAdd(false)}
        onAdded={() => {
          setShowAdd(false);
          void load();
          push("success", "Member added");
        }}
      />

      <section className="grid gap-5 xl:grid-cols-[minmax(0,1.4fr),minmax(320px,0.8fr)]">
        <div>
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
                href = `/dashboard/workspaces/${workspaceId}/notes/${item.note.id}`;
                actionLabel = "Open note";
              } else if (item.kind === "media") {
                iconElement = <PhotoIcon className="h-4 w-4 text-white" />;
                bg = "from-amber-500 to-orange-600";
                title = "View media";
                href = `/dashboard/workspaces/${workspaceId}/media/${item.media.id}`;
                actionLabel = "Open media";
              }

              return (
                <Link
                  key={`${item.kind}-${idx}`}
                  href={href}
                  className="group block"
                  title={title}
                >
                  <div className="lx-card flex gap-4 !py-4 transition hover:ring-1 hover:ring-[var(--lx-primary)]/20">
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${bg}`}>
                      {iconElement}
                    </div>
                    <div className="min-w-0 flex-1">
                      {item.kind === "note" && (
                        <>
                          <p className="font-medium text-[var(--lx-text)]">{item.note.title}</p>
                          <p className="line-clamp-2 text-sm text-[var(--lx-text-muted)]">
                            {item.note.content}
                          </p>
                        </>
                      )}

                      {item.kind === "media" && (
                        <>
                          <p className="font-medium text-[var(--lx-text)]">{item.media.fileName}</p>
                          <p className="text-sm text-[var(--lx-text-muted)]">
                            {item.media.fileType} · {(item.media.size / 1024).toFixed(1)} KB
                          </p>
                        </>
                      )}

                      {item.kind === "activity" && (
                        <>
                          <p className="font-medium text-[var(--lx-text)]">{item.log.action}</p>
                          {item.log.entityType && (
                            <p className="text-sm text-[var(--lx-text-muted)]">{item.log.entityType}</p>
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
        </div>

        <div className="space-y-6">
          <section>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
              Team members
            </h2>
            <div className="mt-3 max-h-[560px] space-y-3 overflow-y-auto pr-2">
              {members.map((member) => {
                const initial = (member.username || "U").slice(0, 2).toUpperCase();

                return (
                  <div key={member.id} className="lx-card flex flex-wrap items-center gap-4 !py-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--lx-border)] text-xs font-bold text-[var(--lx-text)]">
                      {initial}
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[var(--lx-text)]">
                        {member.username}
                      </p>
                      <p className="truncate text-xs text-[var(--lx-text-muted)]">
                        {member.email ?? "Email not available"}
                      </p>
                    </div>

                    <span className="rounded-full bg-[var(--lx-gold)]/20 px-2 py-0.5 text-xs font-semibold text-amber-900 dark:text-amber-100">
                      {member.role}
                    </span>

                    {member.owner && (
                      <span className="rounded-full bg-[var(--lx-primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--lx-primary)]">
                        Owner
                      </span>
                    )}

                    {canManage && !member.owner && member.role !== "OWNER" && (
                      <>
                        <select
                          className="lx-input !w-auto !py-2 !text-xs"
                          value={member.role}
                          onChange={(e) => void changeRole(member.id, e.target.value)}
                        >
                          {["ADMIN", "MEMBER", "EDITOR", "VIEWER"].map((role) => (
                            <option key={role} value={role}>
                              {role}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="inline-flex items-center gap-1 rounded-xl border border-red-500/25 px-3 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10 hover:text-red-400"
                          aria-label="Remove member"
                          onClick={() => void removeMember(member.id)}
                        >
                          <TrashIcon className="h-4 w-4" />
                          Remove
                        </button>
                      </>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </div>
      </section>
    </div>
  );
}
