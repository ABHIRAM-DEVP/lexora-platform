"use client";

import { useCallback, useEffect, useState } from "react";
import type * as React from "react";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import { fetchActiveWorkspaces } from "@/lib/workspace-api";
import type { NoteResponse, Paged, WorkspaceResponse } from "@/types/api";

export default function ContentNotesPage() {
  const { push } = useToast();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [wsId, setWsId] = useState("");
  const [scope, setScope] = useState<"PRIVATE" | "ORG" | "PUBLIC">("PRIVATE");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [inventory, setInventory] = useState<NoteResponse[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchActiveWorkspaces().then((loadedWorkspaces) => {
      setWorkspaces(loadedWorkspaces);
      const stored = localStorage.getItem("lexora_last_workspace");
      if (stored === "NO_WORKSPACE") {
        setWsId("NO_WORKSPACE");
        return;
      }
      setWsId(stored && loadedWorkspaces.some((workspace) => workspace.id === stored) ? stored : loadedWorkspaces[0]?.id ?? "");
    });
  }, []);

  const loadInventory = useCallback(async () => {
    if (!wsId) {
      setInventory([]);
      return;
    }

    setLoading(true);
    try {
      const path = wsId === "NO_WORKSPACE"
        ? "/api/notes/personal?page=0&size=50"
        : `/api/notes/list/${wsId}?page=0&size=50`;
      const res = await apiFetch(path);
      if (!res.ok) {
        const err = await parseJson<{ error?: string }>(res);
        throw new Error(err?.error ?? "Failed to load notes");
      }
      const page = (await res.json()) as Paged<NoteResponse>;
      setInventory(page.content ?? []);
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [push, wsId]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  async function create(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!title.trim() || !body.trim()) {
      push("error", "Title and body are required");
      return;
    }

    if (!wsId) {
      push("error", "Choose a workspace or select without workspace");
      return;
    }

    const res = await apiFetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title,
        content: body,
        workspaceId: wsId === "NO_WORKSPACE" ? null : wsId,
      }),
    });

    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Failed to save draft");
      return;
    }

    push("success", wsId === "NO_WORKSPACE" ? "Personal note saved" : "Workspace note saved");
    setTitle("");
    setBody("");
    void loadInventory();
  }

  async function removeNote(id: string) {
    const res = await apiFetch(`/api/notes/${id}`, { method: "DELETE" });
    if (!res.ok) {
      push("error", "Delete failed");
      return;
    }
    push("info", "Note removed");
    void loadInventory();
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
            <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
              {wsId === "NO_WORKSPACE" ? (
                <p>
                  You are creating a personal note outside any workspace. It is now stored in your account and can also be published publicly from Publish Studio.
                </p>
              ) : (
                <p>
                  Workspace content is shared according to workspace permissions. Choose public publishing later only when you want this content visible to outsiders.
                </p>
              )}
            </div>

            <div>
              <p className="text-xs font-medium uppercase text-[var(--lx-text-muted)]">
                Publishing scope
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(
                  [
                    ["PRIVATE", "Private"],
                    ["ORG", "Organizational"],
                    ["PUBLIC", "Public"],
                  ] as const
                ).map(([key, label]) => (
                  <button
                    key={key}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      scope === key
                        ? key === "PUBLIC"
                          ? "bg-[var(--lx-gold)] text-slate-900"
                          : "bg-[var(--lx-primary)] text-white"
                        : "bg-[var(--lx-border)]/60 text-[var(--lx-text-muted)]"
                    }`}
                    onClick={() => setScope(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--lx-text-muted)]">
                Save the note here first. Then use <strong className="text-[var(--lx-text)]">Publish</strong> to expose it publicly with or without a workspace.
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
                      push("warning", "File uploads still require a workspace selection");
                      return;
                    }
                    setUploading(true);
                    try {
                      const fd = new FormData();
                      fd.append("file", file);
                      fd.append("workspaceId", wsId);
                      const token = localStorage.getItem("lexora_access_token");
                      const res = await fetch(`${window.location.origin}/api/media/upload`, {
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
                  {uploading ? "Uploading..." : "Upload file"}
                </button>
              </div>
              <button type="submit" className="lx-btn-primary w-full">
                Save note
              </button>
            </form>
          </section>
        </div>

        <section className="lx-card h-fit">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
            Content inventory
          </h2>
          {loading ? (
            <p className="mt-4 text-sm text-[var(--lx-text-muted)]">Loading...</p>
          ) : (
            <ul className="mt-4 max-h-[480px] space-y-2 overflow-y-auto text-sm">
              {inventory.map((note) => (
                <li
                  key={note.id}
                  className="rounded-xl border border-[var(--lx-border)] p-3"
                >
                  <p className="font-medium text-[var(--lx-text)]">{note.title}</p>
                  <p className="line-clamp-2 text-xs text-[var(--lx-text-muted)]">
                    {note.content}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="rounded-lg border border-[var(--lx-border)] px-2 py-0.5 text-[11px]"
                      onClick={async () => {
                        const nextTitle = prompt("New title", note.title);
                        const nextBody = prompt("New body", note.content);
                        if (!nextTitle || !nextBody) return;
                        const res = await apiFetch(`/api/notes/${note.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ title: nextTitle, content: nextBody }),
                        });
                        if (res.ok) {
                          void loadInventory();
                        }
                      }}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="rounded-lg border border-red-500/40 px-2 py-0.5 text-[11px] text-red-600"
                      onClick={() => void removeNote(note.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
              {inventory.length === 0 && (
                <li className="text-sm text-[var(--lx-text-muted)]">
                  No notes yet.
                </li>
              )}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
