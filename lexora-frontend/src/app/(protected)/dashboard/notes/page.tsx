"use client";

import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import { fetchActiveWorkspaces } from "@/lib/workspace-api";
import type { NoteResponse, Paged, WorkspaceResponse } from "@/types/api";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";

type LocalDraft = {
  id: string;
  title: string;
  content: string;
  createdAt: string;
};

export default function ContentNotesPage() {
  const { push } = useToast();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [wsId, setWsId] = useState("");
  const [scope, setScope] = useState<"PRIVATE" | "ORG" | "PUBLIC">("PRIVATE");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [inventory, setInventory] = useState<NoteResponse[]>([]);
  const [localDrafts, setLocalDrafts] = useState<LocalDraft[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  const loadLocalDrafts = () => {
    try {
      return JSON.parse(globalThis.localStorage?.getItem("lexora_local_drafts") ?? "[]") as LocalDraft[];
    } catch {
      return [] as LocalDraft[];
    }
  };

  const syncLocalDrafts = (drafts: LocalDraft[]) => {
    setLocalDrafts(drafts);
    localStorage.setItem("lexora_local_drafts", JSON.stringify(drafts));
  };

  useEffect(() => {
    fetchActiveWorkspaces().then((w) => {
      setWorkspaces(w);
      const stored = localStorage.getItem("lexora_last_workspace");
      setWsId(stored && w.some((x) => x.id === stored) ? stored : w[0]?.id ?? "");
    });
    syncLocalDrafts(loadLocalDrafts());
  }, []);

  const loadInv = useCallback(async () => {
    if (!wsId || wsId === "NO_WORKSPACE") {
      setInventory([]);
      return;
    }
    setLoading(true);
    try {
      const res = await apiFetch(`/api/notes/list/${wsId}?page=0&size=50`);
      if (res.ok) {
        const p = (await res.json()) as Paged<NoteResponse>;
        setInventory(p.content ?? []);
      }
    } finally {
      setLoading(false);
    }
  }, [wsId]);

  useEffect(() => {
    loadInv();
  }, [loadInv]);

  async function create(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      push("error", "Title and body are required");
      return;
    }

    if (wsId === "NO_WORKSPACE") {
      const draft: LocalDraft = {
        id: `local-${Date.now()}`,
        title: title.trim(),
        content: body.trim(),
        createdAt: new Date().toISOString(),
      };
      const next = [draft, ...localDrafts];
      syncLocalDrafts(next);
      push("success", "Draft saved locally without workspace");
      setTitle("");
      setBody("");
      return;
    }

    if (!wsId) {
      push("error", "Choose a workspace or select without workspace");
      return;
    }

    const res = await apiFetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: body, workspaceId: wsId }),
    });
    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Failed to save draft");
      return;
    }
    push("success", "Draft saved to workspace");
    setTitle("");
    setBody("");
    loadInv();
  }

  async function removeNote(id: string) {
    const res = await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      push("error", "Delete failed");
      return;
    }
    push("info", "Note removed");
    loadInv();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--lx-text)]">Content lab</h1>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <section className="lx-card space-y-4">
            <WorkspaceSelector
              workspaces={workspaces}
              value={wsId}
              onChange={(id) => {
                localStorage.setItem("lexora_last_workspace", id);
                setWsId(id);
              }}
              includeNoWorkspace
              noWorkspaceLabel="Without workspace"
            />
            <div className="mt-3 rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-3 text-sm text-[var(--lx-text-muted)]">
              {wsId === "NO_WORKSPACE" ? (
                <p>
                  You are creating a personal draft outside of any workspace. It will be saved in your browser only and will not be sent to the backend.
                </p>
              ) : (
                <p>
                  Workspace content is stored and shared according to workspace access. Attach files when you want a draft to include image, PDF or media references.
                </p>
              )}
            </div>
            <div>
              <p className="text-xs font-medium uppercase text-[var(--lx-text-muted)]">
                Publishing scope (intent)
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["PRIVATE", "Private"],
                    ["ORG", "Organizational"],
                  ] as const
                ).map(([k, lab]) => (
                  <button
                    key={k}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      scope === k
                        ? "bg-[var(--lx-primary)] text-white"
                        : "bg-[var(--lx-border)]/60 text-[var(--lx-text-muted)]"
                    }`}
                    onClick={() => setScope(k)}
                  >
                    {lab}
                  </button>
                ))}
                <button
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    scope === "PUBLIC"
                      ? "bg-[var(--lx-gold)] text-slate-900"
                      : "bg-[var(--lx-border)]/60 text-[var(--lx-text-muted)]"
                  }`}
                  onClick={() => setScope("PUBLIC")}
                >
                  Public (via Publish studio)
                </button>
              </div>
              <p className="mt-2 text-xs text-[var(--lx-text-muted)]">
                Notes are always stored in the workspace. Use{" "}
                <strong className="text-[var(--lx-text)]">Publish</strong> to
                expose PUBLIC articles.
              </p>
            </div>
            <form className="space-y-3" onSubmit={create}>
              <input
                className="lx-input"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
              <textarea
                className="lx-input min-h-[200px]"
                placeholder="Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                required
              />
              <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
                <label htmlFor="content-note-file" className="flex flex-col gap-2 text-xs text-[var(--lx-text-muted)]">
                  Attach a file
                </label>
                <input
                  id="content-note-file"
                  type="file"
                  className="lx-input"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="lx-btn-secondary h-fit"
                  onClick={async () => {
                    if (!file) {
                      push("warning", "Pick a file first");
                      return;
                    }
                    if (wsId === "NO_WORKSPACE" || !wsId) {
                      push("warning", "File uploads require a workspace selection");
                      return;
                    }
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("workspaceId", wsId);
                      const token = globalThis.localStorage?.getItem("lexora_access_token");
                      const res = await fetch(`${globalThis.location.origin}/api/media/upload`, {
                        method: "POST",
                        headers: token ? { Authorization: `Bearer ${token}` } : {},
                        body: fd,
                      });
                      if (!res.ok) {
                        const err = await parseJson<{ error?: string }>(res);
                        push("error", err?.error ?? "Upload failed");
                        return;
                      }
                      push("success", "File uploaded to workspace");
                      setFile(null);
                    } catch (e) {
                      push("error", (e as Error).message);
                    } finally {
                      setUploading(false);
                    }
                  }}
                  disabled={!file || uploading}
                >
                  {uploading ? "Uploading…" : "Upload file"}
                </button>
              </div>
              <button type="submit" className="lx-btn-primary w-full">
                Save note
              </button>
            </form>
          </section>

          <section className="lx-card">
            <h2 className="text-sm font-semibold text-[var(--lx-text)]">
              Editorial guidance
            </h2>
            <ul className="mt-2 list-inside list-disc text-sm text-[var(--lx-text-muted)]">
              <li>Keep titles specific — they flow into publication slugs.</li>
              <li>Organizational scope signals shared editing culture.</li>
              <li>Promotion to the public shelf is explicit and auditable.</li>
            </ul>
          </section>
        </div>

        <section className="lx-card h-fit">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
            Content inventory
          </h2>
          {loading && wsId !== "NO_WORKSPACE" ? (
            <p className="mt-4 text-sm text-[var(--lx-text-muted)]">Loading…</p>
          ) : (
            <ul className="mt-4 max-h-[480px] space-y-2 overflow-y-auto text-sm">
              {(wsId === "NO_WORKSPACE" ? localDrafts : inventory).map((n) => (
                <li
                  key={n.id}
                  className="rounded-xl border border-[var(--lx-border)] p-2"
                >
                  <p className="font-medium text-[var(--lx-text)]">{n.title}</p>
                  <p className="line-clamp-2 text-xs text-[var(--lx-text-muted)]">
                    {n.content}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {wsId === "NO_WORKSPACE" ? (
                      <button
                        type="button"
                        className="rounded-lg border border-red-500/40 px-2 py-0.5 text-[11px] text-red-600"
                        onClick={() => {
                          const next = localDrafts.filter((draft) => draft.id !== n.id);
                          syncLocalDrafts(next);
                        }}
                      >
                        Remove draft
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          className="rounded-lg border border-[var(--lx-border)] px-2 py-0.5 text-[11px]"
                          onClick={async () => {
                            const t = prompt("New title", n.title);
                            const c = prompt("New body", n.content);
                            if (!t || !c) return;
                            const res = await apiFetch(`/api/notes/${n.id}`, {
                              method: "PUT",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ title: t, content: c }),
                            });
                            if (res.ok) loadInv();
                          }}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="rounded-lg border border-red-500/40 px-2 py-0.5 text-[11px] text-red-600"
                          onClick={() => removeNote(n.id)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
