"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  FolderIcon,
  MagnifyingGlassIcon,
  PhotoIcon,
  PlusIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import { DeletePermissionModal } from "@/components/DeletePermissionModal";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import { fetchActiveWorkspaces, fetchDeletedWorkspaces } from "@/lib/workspace-api";
import {
  loadWorkspaceStyles,
  saveWorkspaceStyle,
  type WorkspaceStyle,
} from "@/lib/workspace-style";
import type { WorkspaceResponse } from "@/types/api";

export default function WorkspacesPage() {
  const { user } = useAuth();
  const { push } = useToast();
  const [list, setList] = useState<WorkspaceResponse[]>([]);
  const [deleted, setDeleted] = useState<WorkspaceResponse[]>([]);
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [access, setAccess] = useState("PRIVATE");
  const [newIcon, setNewIcon] = useState("folder");
  const [newColor, setNewColor] = useState("from-sky-500 to-indigo-600");
  const [styles, setStyles] = useState<Record<string, WorkspaceStyle>>({});
  const [delTarget, setDelTarget] = useState<WorkspaceResponse | null>(null);

  const ACCESS_OPTIONS = [
    { value: "PRIVATE", label: "Private" },
    { value: "PUBLIC", label: "Public" },
    { value: "COLLABORATIVE", label: "Collaborative" },
  ] as const;

  const ICON_OPTIONS = [
    { id: "folder", label: "Workspace", icon: FolderIcon },
    { id: "sparkles", label: "Creative", icon: SparklesIcon },
    { id: "photo", label: "Media", icon: PhotoIcon },
    { id: "team", label: "Team", icon: UserGroupIcon },
    { id: "note", label: "Note", icon: DocumentTextIcon },
  ] as const;

  const COLOR_OPTIONS = [
    "from-sky-500 to-indigo-600",
    "from-emerald-500 to-emerald-700",
    "from-fuchsia-500 to-pink-600",
    "from-amber-500 to-orange-600",
    "from-rose-500 to-rose-700",
  ] as const;

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [active, archived] = await Promise.all([
        fetchActiveWorkspaces(),
        fetchDeletedWorkspaces(),
      ]);
      setList(active);
      setDeleted(archived);
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    setStyles(loadWorkspaceStyles());
    void load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const needle = q.toLowerCase();
    return list.filter((workspace) =>
      workspace.name.toLowerCase().includes(needle) ||
      workspace.description.toLowerCase().includes(needle),
    );
  }, [list, q]);

  const createWorkspace = async () => {
    if (!newName.trim()) {
      push("error", "Workspace name cannot be empty");
      return;
    }

    if (list.some((workspace) => workspace.name.toLowerCase() === newName.trim().toLowerCase())) {
      push("error", "Workspace name already exists. Choose a different name.");
      return;
    }

    const res = await apiFetch("/api/workspaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: newName,
        description: newDesc,
        accessType: access,
      }),
    });

    if (!res.ok) {
      const err = await parseJson<{ error?: string; details?: string }>(res);
      push("error", err?.error ?? err?.details ?? "Create failed");
      return;
    }

    const created = await res.json();
    const savedStyle = {
      iconId: newIcon,
      color: newColor,
      label: ICON_OPTIONS.find((item) => item.id === newIcon)?.label ?? "Workspace",
    };

    saveWorkspaceStyle(created.id, savedStyle);
    setStyles((current) => ({ ...current, [created.id]: savedStyle }));
    setCreateOpen(false);
    setNewName("");
    setNewDesc("");
    setNewIcon("folder");
    setNewColor("from-sky-500 to-indigo-600");
    push("success", "Workspace created");
    void load();
  };

  const archiveWorkspace = async () => {
    if (!delTarget) return;

    const res = await apiFetch(`/api/workspaces/${delTarget.id}`, {
      method: "DELETE",
    });

    setDelTarget(null);

    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Archive failed");
      return;
    }

    push("info", "Workspace archived for 30 days. You can restore it from the archive panel.");
    void load();
  };

  const restoreWorkspace = async (id: string) => {
    const res = await apiFetch(`/api/workspaces/${id}/restore`, {
      method: "POST",
    });

    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Restore failed");
      return;
    }

    push("success", "Workspace restored");
    void load();
  };

  const daysUntilPurge = (deletedAt?: string | null) => {
    if (!deletedAt) return 30;
    const deletedTime = new Date(deletedAt).getTime();
    const msRemaining = deletedTime + 30 * 24 * 60 * 60 * 1000 - Date.now();
    return Math.max(0, Math.ceil(msRemaining / (24 * 60 * 60 * 1000)));
  };

  return (
    <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr),320px]">
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[var(--lx-text)]">Workspace operations</h1>
            <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
              Create, search, archive, and restore collaborative spaces.
            </p>
          </div>
          <button type="button" className="lx-btn-primary" onClick={() => setCreateOpen(true)}>
            <PlusIcon className="h-5 w-5" />
            Create workspace
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--lx-text-muted)]" />
          <input
            className="lx-input pl-10"
            placeholder="Search workspaces..."
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-[var(--lx-text-muted)]">Loading...</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((workspace) => {
              const style = styles[workspace.id];
              const iconDef = ICON_OPTIONS.find((item) => item.id === style?.iconId) ?? ICON_OPTIONS[0];
              const Icon = iconDef.icon;
              const color = style?.color ?? "from-sky-500 to-indigo-600";

              return (
                <div
                  key={workspace.id}
                  className={`relative overflow-hidden rounded-[28px] border border-white/10 bg-gradient-to-br ${color} shadow-[0_24px_70px_-42px_rgba(15,23,42,0.7)]`}
                >
                  <div className="absolute inset-0 bg-[linear-gradient(140deg,rgba(255,255,255,0.18),rgba(15,23,42,0.18))]" />
                  <div className="relative flex flex-wrap items-start justify-between gap-5 p-6 text-white">
                    <div className="flex min-w-0 gap-4">
                      <div className={`grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-gradient-to-br ${color} text-white shadow-lg shadow-slate-900/20 ring-1 ring-white/20`}>
                        <Icon className="h-6 w-6" />
                      </div>
                      <div className="min-w-0">
                        <h2 className="truncate text-xl font-semibold text-white">{workspace.name}</h2>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-white/85">
                          {workspace.description || "No description added yet."}
                        </p>
                        <div className="mt-4 flex flex-wrap gap-2">
                          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white">
                            {workspace.ownerId === user?.id ? "Owner" : "Member"}
                          </span>
                          <span className="rounded-full border border-white/20 bg-white/10 px-2.5 py-1 text-xs font-semibold text-white/90">
                            {workspace.accessType}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/workspaces/${workspace.id}`}
                        className="inline-flex items-center justify-center rounded-2xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 transition hover:bg-white/90"
                      >
                        Open workspace
                      </Link>
                      {workspace.ownerId === user?.id && (
                        <button
                          type="button"
                          className="inline-flex items-center justify-center rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-white/16"
                          onClick={() => setDelTarget(workspace)}
                        >
                          Archive
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
          Archived workspaces
        </h2>
        <div className="lx-card space-y-3 !py-4">
          {deleted.length === 0 && (
            <p className="text-sm text-[var(--lx-text-muted)]">None yet.</p>
          )}

          {deleted.map((workspace) => (
            <div
              key={workspace.id}
              className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-4"
            >
              <p className="font-medium text-[var(--lx-text)]">{workspace.name}</p>
              <p className="mt-1 text-xs text-[var(--lx-text-muted)]">
                {workspace.description || "No description added yet."}
              </p>
              <p className="mt-3 flex items-center gap-2 text-xs text-[var(--lx-text-muted)]">
                <ClockIcon className="h-4 w-4" />
                Permanently deleted in {daysUntilPurge(workspace.deletedAt)} day{daysUntilPurge(workspace.deletedAt) === 1 ? "" : "s"}.
              </p>
              <button
                type="button"
                className="lx-btn-gold mt-3 w-full !py-2 !text-xs"
                onClick={() => void restoreWorkspace(workspace.id)}
              >
                Restore
              </button>
            </div>
          ))}
        </div>
      </aside>

      {createOpen && (
        <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="lx-card max-w-md">
            <h2 className="text-lg font-semibold text-[var(--lx-text)]">Create workspace</h2>
            <input
              className="lx-input mt-4"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <textarea
              className="lx-input mt-3 min-h-[96px]"
              placeholder="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="workspace-access-type" className="block text-xs font-medium uppercase tracking-wide text-[var(--lx-text-muted)]">
                  Access type
                </label>
                <select
                  id="workspace-access-type"
                  className="lx-input mt-2 w-full"
                  value={access}
                  onChange={(e) => setAccess(e.target.value)}
                >
                  {ACCESS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <p className="block text-xs font-medium uppercase tracking-wide text-[var(--lx-text-muted)]">
                  Workspace icon
                </p>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ICON_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = newIcon === option.id;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`rounded-2xl border px-2 py-3 text-xs transition ${
                          active
                            ? "border-[var(--lx-primary)] bg-[var(--lx-primary)]/10"
                            : "border-[var(--lx-border)] bg-[var(--lx-panel-solid)]"
                        }`}
                        onClick={() => setNewIcon(option.id)}
                      >
                        <Icon className="mx-auto h-5 w-5 text-[var(--lx-text)]" />
                        <div className="mt-1 text-[var(--lx-text-muted)]">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="block text-xs font-medium uppercase tracking-wide text-[var(--lx-text-muted)]">
                Workspace color
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`h-10 w-20 rounded-2xl border transition ${
                      newColor === option
                        ? "border-[var(--lx-primary)] ring-1 ring-[var(--lx-primary)]/20"
                        : "border-transparent"
                    }`}
                    onClick={() => setNewColor(option)}
                    aria-label={`Color ${option}`}
                  >
                    <span className={`block h-full w-full rounded-2xl bg-gradient-to-br ${option}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              <button type="button" className="lx-btn-secondary flex-1" onClick={() => setCreateOpen(false)}>
                Cancel
              </button>
              <button type="button" className="lx-btn-primary flex-1" onClick={() => void createWorkspace()} disabled={!newName.trim()}>
                Create
              </button>
            </div>

            <p className="mt-4 text-xs text-[var(--lx-text-muted)]">
              Archived workspaces stay restorable for 30 days before permanent deletion.
            </p>
          </div>
        </div>
      )}

      <DeletePermissionModal
        open={!!delTarget}
        workspaceName={delTarget?.name ?? ""}
        onCancel={() => setDelTarget(null)}
        onConfirm={() => void archiveWorkspace()}
      />
    </div>
  );
}
