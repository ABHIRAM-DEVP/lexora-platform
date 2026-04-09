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

  const createWs = async () => {
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
    push("success", "Workspace created");
    setCreateOpen(false);
    setNewName("");
    setNewDesc("");
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
          <h1 className="text-2xl font-semibold text-[var(--lx-text)]">
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
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-[var(--lx-text-muted)]" />
          <input
            className="lx-input pl-10"
            placeholder="Search workspaces…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>

        {loading ? (
          <p className="text-[var(--lx-text-muted)]">Loading…</p>
        ) : (
          <div className="space-y-4">
            {filtered.map((w) => (
              <div key={w.id} className="lx-card">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[var(--lx-text)]">
                      {w.name}
                    </h2>
                    <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
                      {w.description}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-[var(--lx-primary)]/15 px-2 py-0.5 text-xs font-medium text-[var(--lx-primary)]">
                        {w.ownerId === user?.id ? "Owner" : "Member"}
                      </span>
                      <span className="rounded-full bg-[var(--lx-border)] px-2 py-0.5 text-xs text-[var(--lx-text-muted)]">
                        {w.accessType === "ORGANIZATIONAL"
                          ? "Organizational visibility"
                          : "Private workspace"}
                      </span>
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
              </div>
            ))}
          </div>
        )}
      </div>

      <aside className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
          Deleted workspaces
        </h2>
        <div className="lx-card space-y-3 !py-4">
          {deleted.length === 0 && (
            <p className="text-sm text-[var(--lx-text-muted)]">None yet.</p>
          )}
          {deleted.map((w) => (
            <div
              key={w.id}
              className="rounded-xl border border-[var(--lx-border)] p-3"
            >
              <p className="font-medium text-[var(--lx-text)]">{w.name}</p>
              <p className="text-xs text-[var(--lx-text-muted)]">{w.description}</p>
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
            <h2 className="text-lg font-semibold text-[var(--lx-text)]">
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
            <label className="mt-2 block text-xs text-[var(--lx-text-muted)]">
              Access
            </label>
            <select
              className="lx-input mt-1"
              value={access}
              onChange={(e) => setAccess(e.target.value)}
            >
              <option value="PRIVATE">PRIVATE</option>
              <option value="ORGANIZATIONAL">ORGANIZATIONAL</option>
            </select>
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
