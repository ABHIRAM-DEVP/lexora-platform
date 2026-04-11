"use client";

import Link from "next/link";
import type * as React from "react";
import { useCallback, useEffect, useState } from "react";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson, userHeaderInit } from "@/lib/api";
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
  const [quickContent, setQuickContent] = useState("");
  const [tags, setTags] = useState("");
  const [deletedMedia, setDeletedMedia] = useState<MediaResponse[]>([]);
  const [shelfQ, setShelfQ] = useState("");
  const [shelf, setShelf] = useState<PublicationRow[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [mediaPick, setMediaPick] = useState<MediaResponse[]>([]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [textAlign, setTextAlign] = useState<"left" | "center" | "right">("left");
  const [visualStyle, setVisualStyle] = useState<"normal" | "emphasis" | "quote">("normal");
  const selectedNote = notes.find((n) => n.id === noteId);

  useEffect(() => {
    fetchActiveWorkspaces().then((loadedWorkspaces) => {
      setWorkspaces(loadedWorkspaces);
      const stored = localStorage.getItem("lexora_last_workspace");
      if (stored === "NO_WORKSPACE") {
        setWsId("NO_WORKSPACE");
        return;
      }
      setWsId(
        stored && loadedWorkspaces.some((workspace) => workspace.id === stored)
          ? stored
          : loadedWorkspaces[0]?.id ?? "",
      );
    });
  }, []);

  const reload = useCallback(async () => {
    if (!wsId) return;

    const notePath = wsId === "NO_WORKSPACE"
      ? "/api/notes/personal?page=0&size=50"
      : `/api/notes/list/${wsId}?page=0&size=50`;

    const requests: Promise<Response>[] = [
      apiFetch(notePath),
      wsId === "NO_WORKSPACE"
        ? Promise.resolve(new Response(JSON.stringify({ content: [] }), { status: 200 }))
        : apiFetch(`/api/media/deleted/${wsId}?page=0&size=20`),
      apiFetch("/api/activity/me?page=0&size=10"),
      wsId === "NO_WORKSPACE"
        ? Promise.resolve(new Response(JSON.stringify({ content: [] }), { status: 200 }))
        : apiFetch(`/api/media/list/${wsId}?page=0&size=12`),
    ];

    const [notesRes, deletedRes, activityRes, mediaRes] = await Promise.all(requests);

    if (notesRes.ok) {
      const page = (await notesRes.json()) as Paged<NoteResponse>;
      setNotes(page.content ?? []);
    } else {
      setNotes([]);
    }

    if (deletedRes.ok) {
      const page = (await deletedRes.json()) as Paged<MediaResponse>;
      setDeletedMedia(page.content ?? []);
    } else {
      setDeletedMedia([]);
    }

    if (activityRes.ok) {
      const payload = await activityRes.json();
      setActivity(Array.isArray(payload) ? (payload as ActivityLog[]) : ((payload?.content ?? []) as ActivityLog[]));
    } else {
      setActivity([]);
    }

    if (mediaRes.ok) {
      const page = (await mediaRes.json()) as Paged<MediaResponse>;
      setMediaPick(page.content ?? []);
    } else {
      setMediaPick([]);
    }
  }, [wsId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const searchShelf = useCallback(async () => {
    const query = shelfQ.trim() ? `tag=${encodeURIComponent(shelfQ)}` : "";
    let url = `${API_BASE}/api/public/blogs?size=8`;
    if (query) url += `&${query}`;
    const res = await fetch(url);
    if (res.ok) {
      const page = await res.json();
      setShelf(page.content ?? []);
    } else {
      setShelf([]);
    }
  }, [shelfQ]);

  useEffect(() => {
    void searchShelf();
  }, [searchShelf]);

  async function publishNote(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();
    const title = pubTitle.trim();
    const body = quickContent.trim();

    if (!title) {
      push("warning", "Add a title for the publication");
      return;
    }
    if (!noteId && !body) {
      push("warning", "Select a note or write quick content to publish");
      return;
    }
    if (!wsId) {
      push("warning", "Choose a workspace or personal mode first");
      return;
    }

    setSubmitting(true);
    let targetNoteId = noteId;

    try {
      if (!targetNoteId) {
        const createRes = await apiFetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: wsId === "NO_WORKSPACE" ? null : wsId,
            title,
            content: body,
          }),
        });
        if (!createRes.ok) {
          const err = await parseJson<{ error?: string }>(createRes);
          throw new Error(err?.error ?? "Could not create draft note");
        }
        const createdNote = (await createRes.json()) as NoteResponse;
        targetNoteId = createdNote.id;
        setNotes((prev) => [createdNote, ...prev]);
      }

      const publishRes = await apiFetch(
        `/api/publication/${targetNoteId}/publish`,
        userHeaderInit({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title,
            metaDescription: meta,
            tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
          }),
        }),
      );

      if (!publishRes.ok) {
        const err = await parseJson<{ error?: string; details?: string }>(publishRes);
        throw new Error(err?.error ?? err?.details ?? "Publish request failed");
      }

      push("success", "Published to the public library");
      setQuickContent("");
      await reload();
      await searchShelf();
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setSubmitting(false);
    }
  }

  async function searchBlogs() {
    if (!shelfQ.trim()) {
      await searchShelf();
      return;
    }
    const res = await apiFetch(`/api/search?query=${encodeURIComponent(shelfQ)}`);
    if (res.ok) {
      const rows = (await res.json()) as BlogSearchDTO[];
      setShelf(
        rows.map((row) => ({
          id: String(row.id),
          title: row.title,
          slug: row.slug,
          content: row.content,
          publishedAt: row.publishedAt,
        })),
      );
    } else {
      await searchShelf();
    }
  }

  async function restoreMedia(id: string) {
    const res = await apiFetch(`/api/media/restore/${id}`, { method: "POST" });
    if (!res.ok) {
      push("error", "Restore failed");
      return;
    }
    push("success", "Media restored");
    await reload();
  }

  async function uploadMedia() {
    if (!mediaFile) {
      setMediaUploadError("Choose a file first");
      return;
    }
    if (wsId === "NO_WORKSPACE" || !wsId) {
      setMediaUploadError("Media uploads require a workspace");
      return;
    }

    setUploadingMedia(true);
    setMediaUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", mediaFile);
      fd.append("workspaceId", wsId);
      const token = localStorage.getItem("lexora_access_token");
      const res = await fetch(`${API_BASE}/api/media/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: fd,
      });
      if (!res.ok) {
        const err = await parseJson<{ error?: string }>(res);
        throw new Error(err?.error ?? "Upload failed");
      }
      push("success", "Media uploaded to workspace");
      setMediaFile(null);
      await reload();
    } catch (e) {
      setMediaUploadError((e as Error).message);
    } finally {
      setUploadingMedia(false);
    }
  }

  let alignmentClass = "";
  if (textAlign === "center") alignmentClass = "text-center";
  else if (textAlign === "right") alignmentClass = "text-right";

  let styleClass = "";
  if (visualStyle === "quote") styleClass = "bg-slate-100 dark:bg-slate-900";
  else if (visualStyle === "emphasis") styleClass = "bg-[var(--lx-primary)]/10";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[var(--lx-text)]">Publish studio</h1>
          <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
            Publish personal or workspace notes publicly. Public articles are visible without login.
          </p>
        </div>
        <Link href="/publications" className="lx-btn-secondary">
          Open public library
        </Link>
      </div>

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.2fr),minmax(320px,0.8fr)]">
        <section className="lx-card space-y-5">
          <WorkspaceSelector
            workspaces={workspaces}
            value={wsId}
            onChange={(id) => {
              localStorage.setItem("lexora_last_workspace", id);
              setWsId(id);
              setNoteId("");
            }}
            includeNoWorkspace
            noWorkspaceLabel="Without workspace"
          />

          <div className="grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lx-text-muted)]">
                Publish access
              </p>
              <ul className="mt-3 space-y-2">
                <li>Personal notes: only the note owner can publish.</li>
                <li>Workspace notes: `OWNER`, `ADMIN`, or `EDITOR` can publish.</li>
                <li>Public articles are readable without login and can be shared by link.</li>
              </ul>
            </div>
            <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
              {wsId === "NO_WORKSPACE" ? (
                <p>
                  Personal notes can be published directly without a workspace. This is useful for individual essays, updates, and standalone writing.
                </p>
              ) : (
                <p>
                  Workspace publishing is best for team-reviewed content. After publishing, the article appears in the public library and on its direct article page.
                </p>
              )}
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            <div>
              <p className="text-xs text-[var(--lx-text-muted)]">Visibility</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["NETWORK", "FEATURED"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      visibility === value ? "bg-[var(--lx-primary)] text-white" : "bg-[var(--lx-border)]/50"
                    }`}
                    onClick={() => setVisibility(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-[var(--lx-text-muted)]">Layout</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["STANDARD", "IMMERSIVE"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      layout === value ? "bg-[var(--lx-gold)] text-slate-900" : "bg-[var(--lx-border)]/50"
                    }`}
                    onClick={() => setLayout(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-[var(--lx-text-muted)]">Text alignment</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["left", "center", "right"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      textAlign === value ? "bg-[var(--lx-primary)] text-white" : "bg-[var(--lx-border)]/50"
                    }`}
                    onClick={() => setTextAlign(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-[var(--lx-text-muted)]">Presentation style</p>
              <div className="mt-2 flex flex-wrap gap-2">
                {(["normal", "emphasis", "quote"] as const).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`rounded-full px-3 py-1 text-xs font-medium ${
                      visualStyle === value ? "bg-[var(--lx-primary)] text-white" : "bg-[var(--lx-border)]/50"
                    }`}
                    onClick={() => setVisualStyle(value)}
                  >
                    {value}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <form className="space-y-4" onSubmit={publishNote}>
            <div>
              <label htmlFor="publish-note-id" className="text-xs text-[var(--lx-text-muted)]">
                Note
              </label>
              <select
                id="publish-note-id"
                className="lx-input mt-1"
                value={noteId}
                onChange={(e) => setNoteId(e.target.value)}
              >
                <option value="">Select note</option>
                {notes.map((note) => (
                  <option key={note.id} value={note.id}>
                    {note.title}
                  </option>
                ))}
              </select>
            </div>

            {selectedNote ? (
              <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
                <p className="font-semibold text-[var(--lx-text)]">Selected note preview</p>
                <p className="mt-2 line-clamp-3">{selectedNote.content}</p>
              </div>
            ) : (
              <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
                <p className="font-semibold text-[var(--lx-text)]">Quick publish</p>
                <p className="mt-2">Write the article body here if you do not want to use an existing note.</p>
              </div>
            )}

            <textarea
              className={`lx-input min-h-[140px] ${alignmentClass}`}
              placeholder="Write article content when no note is selected"
              value={quickContent}
              onChange={(e) => setQuickContent(e.target.value)}
            />
            <input
              className="lx-input"
              placeholder="Publication title"
              value={pubTitle}
              onChange={(e) => setPubTitle(e.target.value)}
              required
            />
            <textarea
              className="lx-input min-h-[88px]"
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

            <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
              <p className="font-semibold text-[var(--lx-text)]">Workspace media</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <input
                  type="file"
                  className="lx-input flex-1 min-w-[180px]"
                  onChange={(e) => setMediaFile(e.target.files?.[0] ?? null)}
                />
                <button
                  type="button"
                  className="lx-btn-secondary"
                  onClick={() => void uploadMedia()}
                  disabled={uploadingMedia}
                >
                  {uploadingMedia ? "Uploading..." : "Upload"}
                </button>
              </div>
              {mediaUploadError && (
                <p className="mt-2 text-xs text-red-500">{mediaUploadError}</p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
              <p className="font-semibold text-[var(--lx-text)]">Live publish preview</p>
              <div className={`mt-3 rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-5 text-[var(--lx-text)] ${alignmentClass} ${styleClass}`}>
                <p className="text-xs uppercase tracking-[0.2em] text-[var(--lx-text-muted)]">
                  {visibility} · {layout.toLowerCase()}
                </p>
                <h2 className="mt-2 text-xl font-semibold text-[var(--lx-text)]">
                  {pubTitle || selectedNote?.title || "Article headline"}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--lx-text-muted)]">
                  {meta || selectedNote?.content.slice(0, 120) || quickContent.slice(0, 120) || "Write a summary and choose a style to preview how this article will appear."}
                </p>
              </div>
            </div>

            <button type="submit" className="lx-btn-primary w-full" disabled={submitting}>
              {submitting ? "Publishing..." : noteId ? "Publish note" : "Publish quick article"}
            </button>
          </form>
        </section>

        <div className="space-y-6">
          <section className="lx-card">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-sm font-semibold text-[var(--lx-text)]">Public blog shelf</h2>
              <Link href="/publications" className="text-sm font-medium text-[var(--lx-primary)] hover:underline">
                Open all
              </Link>
            </div>
            <div className="mt-3 flex gap-2">
              <input
                className="lx-input flex-1"
                placeholder="Search or tag filter"
                value={shelfQ}
                onChange={(e) => setShelfQ(e.target.value)}
              />
              <button type="button" className="lx-btn-secondary" onClick={() => void searchBlogs()}>
                Search
              </button>
            </div>
            <ul className="mt-4 space-y-3">
              {shelf.map((blog) => (
                <li key={blog.id ?? blog.slug} className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-4">
                  <Link
                    href={`/blog/${blog.slug}`}
                    className="text-sm font-semibold text-[var(--lx-primary)] hover:underline"
                  >
                    {blog.title}
                  </Link>
                  {blog.publishedAt && (
                    <p className="mt-1 text-xs text-[var(--lx-text-muted)]">
                      {new Date(blog.publishedAt).toLocaleString()}
                    </p>
                  )}
                  <p className="mt-2 text-xs text-[var(--lx-text-muted)] break-all">
                    {typeof window !== "undefined" ? `${window.location.origin}/blog/${blog.slug}` : `/blog/${blog.slug}`}
                  </p>
                </li>
              ))}
              {shelf.length === 0 && (
                <li className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-4 text-sm text-[var(--lx-text-muted)]">
                  No published articles yet.
                </li>
              )}
            </ul>
          </section>

          <section className="lx-card">
            <h2 className="text-sm font-semibold text-[var(--lx-text)]">Linked media</h2>
            <ul className="mt-3 space-y-2 text-xs text-[var(--lx-text-muted)]">
              {mediaPick.map((media) => (
                <li key={media.id}>
                  {media.fileName} - <span className="text-[var(--lx-text)]">{media.fileType}</span>
                </li>
              ))}
              {mediaPick.length === 0 && <li>No linked workspace media.</li>}
            </ul>
          </section>

          <section className="lx-card">
            <h2 className="text-sm font-semibold text-[var(--lx-text)]">Deleted media</h2>
            <ul className="mt-3 space-y-2">
              {deletedMedia.map((media) => (
                <li key={media.id} className="flex items-center justify-between gap-2 text-sm">
                  <span className="truncate">{media.fileName}</span>
                  <button
                    type="button"
                    className="lx-btn-gold shrink-0 !py-1 !text-xs"
                    onClick={() => void restoreMedia(media.id)}
                  >
                    Restore
                  </button>
                </li>
              ))}
              {deletedMedia.length === 0 && <li className="text-sm text-[var(--lx-text-muted)]">No deleted media.</li>}
            </ul>
          </section>

          <section className="lx-card">
            <h2 className="text-sm font-semibold text-[var(--lx-text)]">Recent publishing activity</h2>
            <ul className="mt-3 space-y-2 text-sm text-[var(--lx-text-muted)]">
              {activity.map((entry) => (
                <li key={entry.id}>
                  <span className="font-medium text-[var(--lx-text)]">{entry.action}</span> · {new Date(entry.timestamp).toLocaleString()}
                </li>
              ))}
              {activity.length === 0 && <li>No recent publishing activity yet.</li>}
            </ul>
          </section>
        </div>
      </div>
    </div>
  );
}
