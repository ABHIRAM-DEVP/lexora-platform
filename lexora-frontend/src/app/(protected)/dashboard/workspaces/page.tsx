"use client";

import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch, parseJson } from "@/lib/api";
import { fetchActiveWorkspaces, fetchDeletedWorkspaces } from "@/lib/workspace-api";
import type { WorkspaceResponse } from "@/types/api";
import { DeletePermissionModal } from "@/components/DeletePermissionModal";
import { MagnifyingGlassIcon, PlusIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  DocumentTextIcon,
  FolderIcon,
  PhotoIcon,
  SparklesIcon,
  UserGroupIcon,
} from "@heroicons/react/24/outline";
import {
  loadWorkspaceStyles,
  saveWorkspaceStyle,
  WorkspaceStyle,
} from "@/lib/workspace-style";

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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [active, del] = await Promise.all([
        fetchActiveWorkspaces(),
        fetchDeletedWorkspaces(),
      ]);
      setList(active);
      setDeleted(del);
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [push]);

  useEffect(() => {
    setStyles(loadWorkspaceStyles());
    load();
  }, [load]);

  const filtered = useMemo(() => {
    if (!q.trim()) return list;
    const s = q.toLowerCase();
    return list.filter(
      (w) =>
        w.name.toLowerCase().includes(s) ||
        w.description.toLowerCase().includes(s),
    );
  }, [list, q]);

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

  const createWs = async () => {
    if (!newName.trim()) {
      push("error", "Workspace name cannot be empty");
      return;
    }
    if (list.some((w) => w.name.toLowerCase() === newName.trim().toLowerCase())) {
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
    saveWorkspaceStyle(created.id, {
      iconId: newIcon,
      color: newColor,
      label: ICON_OPTIONS.find((item) => item.id === newIcon)?.label ?? "Workspace",
    });
    setStyles((current) => ({
      ...current,
      [created.id]: {
        iconId: newIcon,
        color: newColor,
        label: ICON_OPTIONS.find((item) => item.id === newIcon)?.label ?? "Workspace",
      },
    }));
    push("success", "Workspace created");
    setCreateOpen(false);
    setNewName("");
    setNewDesc("");
    setNewIcon("folder");
    setNewColor("from-sky-500 to-indigo-600");
    load();
  };

  const deleteWs = async () => {
    if (!delTarget) return;
    const res = await apiFetch(`/api/workspaces/${delTarget.id}`, {
      method: "DELETE",
    });
    setDelTarget(null);
    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Delete failed");
      return;
    }
    push("info", "Workspace archived. You can restore it from the right panel.");
    load();
  };

  const restoreWs = async (id: string) => {
    const res = await apiFetch(`/api/workspaces/${id}/restore`, {
      method: "POST",
    });
    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Restore failed");
      return;
    }
    push("success", "Workspace restored");
    load();
  };

  return (
    <div className="grid gap-8 lg:grid-cols-3">
      <div className="space-y-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            Workspace operations
          </h1>
          <button
            type="button"
            className="lx-btn-primary"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon className="h-5 w-5" />
            Create workspace
          </button>
        </div>

        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-500" />
          <input
            className="lx-input pl-10"
            placeholder="Search workspaces…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-gray-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((w) => {
              const style = styles[w.id];
              const iconDef = ICON_OPTIONS.find((item) => item.id === style?.iconId) ?? ICON_OPTIONS[0];
              const Icon = iconDef.icon;
              return (
                <div key={w.id} className="lx-card">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex gap-3">
                      <div
                        className={`grid h-12 w-12 place-items-center rounded-2xl bg-gradient-to-br ${
                          style?.color ?? "from-sky-500 to-indigo-600"
                        } text-white shadow-lg shadow-slate-900/10`}
                      >
                        <Icon className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-black">
                          {w.name}
                        </h2>
                        <p className="mt-1 text-sm text-gray-500">
                          {w.description}
                        </p>
                        <div className="mt-3 flex flex-wrap gap-2">
                          <span className="rounded-full bg-blue-500/15 px-2 py-0.5 text-xs font-medium text-blue-500">
                            {w.ownerId === user?.id ? "Owner" : "Member"}
                          </span>
                          <span className="rounded-full bg-gray-300 px-2 py-0.5 text-xs text-gray-500">
                            {w.accessType}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Link
                      href={`/dashboard/workspaces/${w.id}`}
                      className="lx-btn-secondary !py-2"
                    >
                      Open workspace
                    </Link>
                    {w.ownerId === user?.id && (
                      <button
                        type="button"
                        className="lx-btn-danger !py-2"
                        onClick={() => setDelTarget(w)}
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Deleted workspaces
        </h2>
        <div className="lx-card space-y-3 !py-4">
          {deleted.length === 0 && (
            <p className="text-sm text-gray-500">None yet.</p>
          )}
          {deleted.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-gray-300 p-3"
            >
              <p className="font-medium text-black">{w.name}</p>
              <p className="text-xs text-gray-500">{w.description}</p>
              <button
                type="button"
                className="lx-btn-gold mt-2 w-full !py-1.5 !text-xs"
                onClick={() => restoreWs(w.id)}
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
            <h2 className="text-lg font-semibold text-black">
              Create workspace
            </h2>
            <input
              className="lx-input mt-4"
              placeholder="Name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
            />
            <textarea
              className="lx-input mt-2 min-h-[88px]"
              placeholder="Description"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
            />
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Access type
                </label>
                <select
                  className="lx-input mt-1 w-full"
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
                <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                  Workspace icon
                </label>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  {ICON_OPTIONS.map((option) => {
                    const Icon = option.icon;
                    const active = newIcon === option.id;
                    return (
                      <button
                        key={option.id}
                        type="button"
                        className={`rounded-2xl border px-2 py-2 text-xs transition ${
                          active
                            ? "border-blue-500 bg-blue-500/10"
                            : "border-gray-300 bg-white"
                        }`}
                        onClick={() => setNewIcon(option.id)}
                      >
                        <Icon className="mx-auto h-5 w-5" />
                        <div className="mt-1 text-gray-500">{option.label}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium uppercase tracking-wide text-gray-500">
                Workspace color
              </label>
              <div className="mt-2 flex flex-wrap gap-2">
                {COLOR_OPTIONS.map((option) => (
                  <button
                    key={option}
                    type="button"
                    className={`h-10 w-20 rounded-2xl border transition ${
                      newColor === option
                        ? "border-blue-500 ring-1 ring-blue-500/20"
                        : "border-transparent"
                    }`}
                    onClick={() => setNewColor(option)}
                    aria-label={`Color ${option}`}
                  >
                    <span
                      className={`block h-full w-full rounded-2xl bg-gradient-to-br ${option}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className="lx-btn-secondary flex-1"
                onClick={() => setCreateOpen(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="lx-btn-primary flex-1"
                onClick={createWs}
                disabled={!newName.trim()}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      <DeletePermissionModal
        open={!!delTarget}
        workspaceName={delTarget?.name ?? ""}
        onCancel={() => setDelTarget(null)}
        onConfirm={() => deleteWs()}
      />
    </div>
  );
}
