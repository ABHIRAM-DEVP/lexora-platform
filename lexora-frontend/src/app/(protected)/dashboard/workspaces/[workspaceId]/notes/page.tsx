"use client";

import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import type { NoteResponse, Paged } from "@/types/api";
import { useParams } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function WorkspaceNotesPage() {
  const params = useParams<{ workspaceId: string }>();
  const wid = params.workspaceId;
  const { push } = useToast();
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [list, setList] = useState<NoteResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/notes/list/${wid}?page=0&size=20`);
      if (!res.ok) {
        const err = await parseJson<{ error?: string }>(res);
        throw new Error(err?.error ?? "Failed to load notes");
      }
      const p = (await res.json()) as Paged<NoteResponse>;
      setList(p.content ?? []);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [wid]);

  useEffect(() => {
    load();
  }, [load]);

  async function create(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const res = await apiFetch("/api/notes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, content: body, workspaceId: wid }),
    });
    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      setError(err?.error ?? "Could not create note");
      return;
    }
    push("success", "Note created");
    setTitle("");
    setBody("");
    load();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="lx-card">
        <h1 className="text-lg font-semibold text-[var(--lx-text)]">
          Create and manage notes
        </h1>
        {error && (
          <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <form className="mt-4 space-y-3" onSubmit={create}>
          <input
            className="lx-input"
            placeholder="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />
          <textarea
            className="lx-input min-h-[140px]"
            placeholder="Write the note…"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            required
          />
          <div className="flex gap-2">
            <button
              type="button"
              className="lx-btn-secondary"
              onClick={() => {
                setTitle("");
                setBody("");
              }}
            >
              Clear
            </button>
            <button type="submit" className="lx-btn-primary">
              Create note
            </button>
          </div>
        </form>
      </section>

      <section className="lx-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
          Recent notes
        </h2>
        {loading ? (
          <p className="mt-4 text-[var(--lx-text-muted)]">Loading…</p>
        ) : list.length === 0 ? (
          <p className="mt-4 text-[var(--lx-text-muted)]">No notes yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {list.map((n) => (
              <li key={n.id}>
                <Link
                  href={`/dashboard/workspaces/${wid}/notes#${n.id}`}
                  className="block rounded-xl border border-[var(--lx-border)] px-3 py-2 text-sm font-medium text-[var(--lx-primary)] hover:bg-[var(--lx-border)]/30"
                >
                  {n.title}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
