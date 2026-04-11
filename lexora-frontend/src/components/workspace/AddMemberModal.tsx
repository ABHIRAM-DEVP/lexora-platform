"use client";

import { useCallback, useEffect, useState } from "react";
import { MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import type { UserSearchResult } from "@/types/api";

function dedupeUsers(users: UserSearchResult[]) {
  const seen = new Set<string>();
  return users.filter((user) => {
    if (seen.has(user.id)) return false;
    seen.add(user.id);
    return true;
  });
}

export function AddMemberModal({
  open,
  workspaceId,
  onClose,
  onAdded,
}: {
  readonly open: boolean;
  readonly workspaceId: string;
  readonly onClose: () => void;
  readonly onAdded: () => void;
}) {
  const { push } = useToast();
  const [q, setQ] = useState("");
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [picked, setPicked] = useState<UserSearchResult | null>(null);
  const [role, setRole] = useState("MEMBER");
  const [submitting, setSubmitting] = useState(false);

  const search = useCallback(async (queryOverride?: string) => {
    const query = (queryOverride ?? q).trim();
    setSearching(true);
    try {
      const users: UserSearchResult[] = [];

      const searchRes = await apiFetch(
        `/api/users/search?query=${encodeURIComponent(query)}&workspaceId=${workspaceId}`,
      );
      if (searchRes.ok) {
        users.push(...((await searchRes.json()) as UserSearchResult[]));
      }

      if (query) {
        if (query.includes("@")) {
          const emailRes = await apiFetch(`/api/users/by-email?email=${encodeURIComponent(query)}`);
          if (emailRes.ok) {
            const exactUser = await parseJson<UserSearchResult>(emailRes);
            if (exactUser?.id) users.push(exactUser);
          }
        } else {
          const usernameRes = await apiFetch(`/api/users/by-username?username=${encodeURIComponent(query)}`);
          if (usernameRes.ok) {
            const exactUser = await parseJson<UserSearchResult>(usernameRes);
            if (exactUser?.id) users.push(exactUser);
          }
        }
      }

      setResults(dedupeUsers(users));
    } finally {
      setSearching(false);
    }
  }, [q, workspaceId]);

  useEffect(() => {
    if (!open) return;
    void search("");
  }, [open, search]);

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
      setRole("MEMBER");
      push("success", `${picked.username} added to workspace`);
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/50 p-4 backdrop-blur-md">
      <div className="lx-card max-h-[90vh] w-full max-w-2xl overflow-hidden !p-0">
        <div className="border-b border-[var(--lx-border)] px-6 py-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-[var(--lx-text)]">Add member</h2>
              <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
                Search by username or email, then add the matching account directly.
              </p>
            </div>
            <button type="button" className="text-sm font-medium text-[var(--lx-text-muted)]" onClick={onClose}>
              Close
            </button>
          </div>
        </div>

        <div className="space-y-5 px-6 py-6">
          <div className="flex flex-col gap-3 sm:flex-row">
            <input
              className="lx-input flex-1"
              placeholder="Search by username or email"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && void search()}
            />
            <button
              type="button"
              className="lx-btn-primary min-w-[120px]"
              onClick={() => void search()}
              disabled={searching}
            >
              {searching ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
              ) : (
                <>
                  <MagnifyingGlassIcon className="h-5 w-5" />
                  Search
                </>
              )}
            </button>
          </div>

          <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lx-text-muted)]">
              Existing users
            </p>
            <div className="mt-4 grid max-h-72 gap-2 overflow-y-auto pr-1">
              {searching && (
                <div className="rounded-xl bg-[var(--lx-panel-solid)] p-4 text-sm text-[var(--lx-text-muted)]">
                  Searching users...
                </div>
              )}

              {!searching && results.length > 0 && results.map((u) => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => setPicked(u)}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border px-4 py-3 text-left transition ${
                    picked?.id === u.id
                      ? "border-[var(--lx-primary)] bg-[var(--lx-primary)]/8"
                      : "border-[var(--lx-border)] bg-[var(--lx-panel-solid)] hover:border-[var(--lx-primary)]/35"
                  }`}
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium text-[var(--lx-text)]">{u.username}</p>
                    <p className="truncate text-sm text-[var(--lx-text-muted)]">{u.email}</p>
                  </div>
                  <span className="shrink-0 rounded-full bg-[var(--lx-border)] px-2 py-1 text-[11px] font-semibold text-[var(--lx-text-muted)]">
                    Select
                  </span>
                </button>
              ))}

              {!searching && results.length === 0 && (
                <div className="rounded-xl bg-[var(--lx-panel-solid)] p-4 text-sm text-[var(--lx-text-muted)]">
                  No matching account found. Try a different username or email.
                </div>
              )}
            </div>
          </div>

          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr),220px]">
            <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
              <p className="text-xs uppercase tracking-[0.2em] text-[var(--lx-text-muted)]">Selected user</p>
              {picked ? (
                <>
                  <p className="mt-3 font-medium text-[var(--lx-text)]">{picked.username}</p>
                  <p className="mt-1 text-sm text-[var(--lx-text-muted)]">{picked.email}</p>
                </>
              ) : (
                <p className="mt-3">Choose an account from the list to add it to this workspace.</p>
              )}
            </div>

            <div>
              <label htmlFor="workspace-member-role" className="block text-xs font-medium uppercase tracking-wide text-[var(--lx-text-muted)]">
                Role
              </label>
              <select
                id="workspace-member-role"
                className="lx-input mt-2"
                value={role}
                onChange={(e) => setRole(e.target.value)}
              >
                {["ADMIN", "MEMBER", "EDITOR", "VIEWER"].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-[var(--lx-text-muted)]">
                Public article publishing requires the note owner or workspace editor-level access.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="lx-btn-primary w-full"
            disabled={!picked || submitting}
            onClick={add}
          >
            {submitting ? "Adding member..." : "Add member"}
          </button>
        </div>
      </div>
    </div>
  );
}
