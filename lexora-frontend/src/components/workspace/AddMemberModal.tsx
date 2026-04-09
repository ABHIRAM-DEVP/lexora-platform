"use client";

import { useCallback, useState } from "react";
import { apiFetch, parseJson } from "@/lib/api";
import type { UserSearchResult } from "@/types/api";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";

export function AddMemberModal({
  open,
  workspaceId,
  onClose,
  onAdded,
}: {
  open: boolean;
  workspaceId: string;
  onClose: () => void;
  onAdded: () => void;
}) {
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [picked, setPicked] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState("EDITOR");
  const [submitting, setSubmitting] = useState(false);

  const search = useCallback(async () => {
    if (!q.trim()) return;
    setSearching(true);
    try {
      const res = await apiFetch(
        `/api/users/search?query=${encodeURIComponent(q)}&workspaceId=${workspaceId}`,
      );
      if (!res.ok) {
        setResults([]);
        return;
      }
      setResults(await res.json());
    } finally {
      setSearching(false);
    }
  }, [q, workspaceId]);

  const add = async () => {
    if (!picked) return;
    setSubmitting(true);
    try {
      const res = await apiFetch(`/api/workspaces/${workspaceId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: picked.id, role }),
      });
      if (!res.ok) {
        const err = await parseJson<{ error?: string }>(res);
        throw new Error(err?.error ?? "Add failed");
      }
      onAdded();
      setPicked(null);
      setQ("");
      setResults([]);
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <div className="lx-card max-h-[90vh] w-full max-w-lg overflow-hidden">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--lx-text)]">Add member</h2>
          <button type="button" className="text-[var(--lx-text-muted)]" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="flex gap-2">
          <input
            className="lx-input flex-1"
            placeholder="Search by username or email"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && search()}
          />
          <button
            type="button"
            className="lx-btn-primary"
            onClick={search}
            disabled={searching || !q.trim()}
          >
            {searching ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            ) : (
              <MagnifyingGlassIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        <div className="mt-4 max-h-48 space-y-1 overflow-y-auto rounded-xl border border-[var(--lx-border)] p-2">
          {results.map((u) => (
            <button
              key={u.id}
              type="button"
              onClick={() => setPicked(u)}
              className={`flex w-full flex-col rounded-lg px-2 py-2 text-left text-sm hover:bg-[var(--lx-border)]/40 ${
                picked?.id === u.id ? "bg-[var(--lx-primary)]/10" : ""
              }`}
            >
              <span className="font-medium text-[var(--lx-text)]">{u.username}</span>
              <span className="text-xs text-[var(--lx-text-muted)]">{u.email}</span>
            </button>
          ))}
        </div>
        <label className="mt-4 block text-xs font-medium text-[var(--lx-text-muted)]">
          Role
        </label>
        <select
          className="lx-input mt-1"
          value={role}
          onChange={(e) => setRole(e.target.value)}
        >
          {["ADMIN", "EDITOR", "VIEWER", "MEMBER"].map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="lx-btn-primary mt-6 w-full"
          disabled={!picked || submitting}
          onClick={add}
        >
          Add member
        </button>
      </div>
    </div>
  );
}
