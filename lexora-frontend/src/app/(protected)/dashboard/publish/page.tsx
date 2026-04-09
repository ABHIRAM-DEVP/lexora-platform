"use client";

import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { apiFetch, userHeaderInit } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { fetchActiveWorkspaces } from "@/lib/workspace-api";
import type {
  ActivityLog,
  BlogSearchDTO,
  MediaResponse,
  NoteResponse,
  Paged,
  PublicationRow,
  WorkspaceResponse,
} from "@/types/api";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { FormEvent, useCallback, useEffect, useState } from "react";

export default function PublishStudioPage() {
  const { push } = useToast();
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [wsId, setWsId] = useState("");
  const [visibility, setVisibility] = useState<"NETWORK" | "FEATURED">("NETWORK");
  const [layout, setLayout] = useState<"STANDARD" | "IMMERSIVE">("STANDARD");
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [noteId, setNoteId] = useState("");
  const [pubTitle, setPubTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [tags, setTags] = useState("");
  const [deletedMedia, setDeletedMedia] = useState<MediaResponse[]>([]);
  const [shelfQ, setShelfQ] = useState("");
  const [shelf, setShelf] = useState<PublicationRow[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [mediaPick, setMediaPick] = useState<MediaResponse[]>([]);

  useEffect(() => {
    fetchActiveWorkspaces().then((w) => {
      setWorkspaces(w);
      const stored = localStorage.getItem("lexora_last_workspace");
      setWsId(stored && w.some((x) => x.id === stored) ? stored : w[0]?.id ?? "");
    });
  }, []);

  const reload = useCallback(async () => {
    if (!wsId) return;
    const [nRes, dRes, aRes, mRes] = await Promise.all([
      apiFetch(`/api/notes/list/${wsId}?page=0&size=50`),
      apiFetch(`/api/media/deleted/${wsId}?page=0&size=20`),
      apiFetch("/api/activity/me?page=0&size=10"),
      apiFetch(`/api/media/list/${wsId}?page=0&size=12`),
    ]);
    if (nRes.ok) {
      const p = (await nRes.json()) as Paged<NoteResponse>;
      setNotes(p.content ?? []);
    }
    if (dRes.ok) {
      const p = (await dRes.json()) as Paged<MediaResponse>;
      setDeletedMedia(p.content ?? []);
    }
    if (aRes.ok) setActivity(await aRes.json());
    if (mRes.ok) {
      const p = (await mRes.json()) as Paged<MediaResponse>;
      setMediaPick(p.content ?? []);
    }
  }, [wsId]);

  useEffect(() => {
    reload();
  }, [reload]);

  async function publishNote(e: FormEvent) {
    e.preventDefault();
    if (!noteId) {
      push("warning", "Pick a note to publish");
      return;
    }
    const tagList = tags
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);
    const res = await apiFetch(
      `/api/publication/${noteId}/publish`,
      userHeaderInit({
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: pubTitle,
          metaDescription: meta,
          tags: tagList,
        }),
      }),
    );
    if (!res.ok) {
      push("error", "Publish request failed (check editor access)");
      return;
    }
    push("success", "Published to public shelf");
    reload();
    searchShelf();
  }

  async function searchShelf() {
    const res = await fetch(
      `${API_BASE}/api/public/blogs?size=8&${shelfQ ? `tag=${encodeURIComponent(shelfQ)}` : ""}`,
    );
    if (res.ok) {
      const page = await res.json();
      setShelf(page.content ?? []);
    }
  }

  useEffect(() => {
    searchShelf();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function searchBlogs() {
    if (!shelfQ.trim()) {
      searchShelf();
      return;
    }
    const res = await apiFetch(
      `/api/search?query=${encodeURIComponent(shelfQ)}`,
    );
    if (res.ok) {
      const rows = (await res.json()) as BlogSearchDTO[];
      setShelf(
        rows.map((r) => ({
          id: String(r.id),
          title: r.title,
          slug: r.slug,
          content: r.content,
          publishedAt: r.publishedAt,
        })),
      );
    }
  }

  async function restoreMedia(id: string) {
    const res = await apiFetch(`/api/media/restore/${id}`, { method: "POST" });
    if (!res.ok) {
      push("error", "Restore failed");
      return;
    }
    push("success", "Media restored");
    reload();
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--lx-text)]">
        Publish studio
      </h1>

      <div className="grid gap-8 xl:grid-cols-2">
        <section className="lx-card space-y-4">
          <WorkspaceSelector
            workspaces={workspaces}
            value={wsId}
            onChange={(id) => {
              localStorage.setItem("lexora_last_workspace", id);
              setWsId(id);
            }}
          />

          <div>
            <p className="text-xs text-[var(--lx-text-muted)]">Visibility</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["NETWORK", "FEATURED"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    visibility === v
                      ? "bg-[var(--lx-primary)] text-white"
                      : "bg-[var(--lx-border)]/50"
                  }`}
                  onClick={() => setVisibility(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p className="text-xs text-[var(--lx-text-muted)]">Layout</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(["STANDARD", "IMMERSIVE"] as const).map((v) => (
                <button
                  key={v}
                  type="button"
                  className={`rounded-full px-3 py-1 text-xs font-medium ${
                    layout === v ? "bg-[var(--lx-gold)] text-slate-900" : "bg-[var(--lx-border)]/50"
                  }`}
                  onClick={() => setLayout(v)}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          <form className="space-y-3" onSubmit={publishNote}>
            <div>
              <label className="text-xs text-[var(--lx-text-muted)]">Note</label>
              <select
                className="lx-input mt-1"
                value={noteId}
                onChange={(e) => setNoteId(e.target.value)}
              >
                <option value="">Select note</option>
                {notes.map((n) => (
                  <option key={n.id} value={n.id}>
                    {n.title}
                  </option>
                ))}
              </select>
            </div>
            <input
              className="lx-input"
              placeholder="Publication title"
              value={pubTitle}
              onChange={(e) => setPubTitle(e.target.value)}
              required
            />
            <textarea
              className="lx-input min-h-[72px]"
              placeholder="Meta description"
              value={meta}
              onChange={(e) => setMeta(e.target.value)}
            />
            <input
              className="lx-input"
              placeholder="Tags (comma separated)"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <button type="submit" className="lx-btn-primary w-full">
              Publish note
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="lx-card">
            <h2 className="text-sm font-semibold text-[var(--lx-text)]">
              Linked media (reference)
            </h2>
            <ul className="mt-3 space-y-2 text-xs text-[var(--lx-text-muted)]">
              {mediaPick.map((m) => (
                <li key={m.id}>
                  {m.fileName} — <span className="text-[var(--lx-text)]">{m.fileType}</span>
                </li>
              ))}
            </ul>
          </section>

          <section className="lx-card">
            <h2 className="text-sm font-semibold text-[var(--lx-text)]">
              Deleted media
            </h2>
            <ul className="mt-3 space-y-2">
              {deletedMedia.map((m) => (
                <li
                  key={m.id}
                  className="flex items-center justify-between gap-2 text-sm"
                >
                  <span className="truncate">{m.fileName}</span>
                  <button
                    type="button"
                    className="lx-btn-gold shrink-0 !py-1 !text-xs"
                    onClick={() => restoreMedia(m.id)}
                  >
                    Restore
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="lx-card">
            <h2 className="text-sm font-semibold text-[var(--lx-text)]">
              Public blog shelf
            </h2>
            <div className="mt-3 flex gap-2">
              <input
                className="lx-input flex-1"
                placeholder="Search or tag filter"
                value={shelfQ}
                onChange={(e) => setShelfQ(e.target.value)}
              />
              <button type="button" className="lx-btn-secondary" onClick={searchBlogs}>
                Search
              </button>
            </div>
            <ul className="mt-4 space-y-2">
              {shelf.map((b) => (
                <li key={b.id ?? b.slug}>
                  <Link
                    href={`/blog/${b.slug}`}
                    className="text-sm font-medium text-[var(--lx-primary)] hover:underline"
                  >
                    {b.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>

          <section className="lx-card">
            <h2 className="text-sm font-semibold text-[var(--lx-text)]">
              Recent publishing activity
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--lx-text-muted)]">
              {activity.map((a) => (
                <li key={a.id}>
                  <span className="font-medium text-[var(--lx-text)]">{a.action}</span>{" "}
                  · {new Date(a.timestamp).toLocaleString()}
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
