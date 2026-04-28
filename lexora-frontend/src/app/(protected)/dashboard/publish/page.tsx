/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import type * as React from "react";
import { useCallback, useEffect, useState, useRef } from "react";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson, userHeaderInit } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import { fetchActiveWorkspaces } from "@/lib/workspace-api";
import type {
  ActivityLog,
  MediaResponse,
  NoteResponse,
  Paged,
  PublishResponse,
  WorkspaceResponse,
} from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { SOCKET_URL } from "@/lib/config";
import { io, Socket } from "socket.io-client";
import StyleToolbox, { StyleState } from '@/components/StyleToolbox';
import { Copy, Send, Layers } from "lucide-react";

const NO_WORKSPACE_ID = "NO_WORKSPACE";

export default function PublishStudioPage() {
  const { push } = useToast();
  const { user: currentUser } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<{id: string, name: string, email: string, avatar: string}[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [wsId, setWsId] = useState(NO_WORKSPACE_ID);
  const [visibility, setVisibility] = useState<"PRIVATE" | "ORGANIZATIONAL" | "PUBLIC" | "NETWORK" | "FEATURED">("PUBLIC");
  const [layout, setLayout] = useState<"STANDARD" | "IMMERSIVE">("STANDARD");
  const [notes, setNotes] = useState<NoteResponse[]>([]);
  const [noteId, setNoteId] = useState("");
  const [pubTitle, setPubTitle] = useState("");
  const [meta, setMeta] = useState("");
  const [quickContent, setQuickContent] = useState("");
  const [tags, setTags] = useState("");
  const [deletedMedia, setDeletedMedia] = useState<MediaResponse[]>([]);
  const [activity, setActivity] = useState<ActivityLog[]>([]);
  const [mediaPick, setMediaPick] = useState<MediaResponse[]>([]);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [mediaUploadError, setMediaUploadError] = useState<string | null>(null);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [style, setStyle] = useState<StyleState>({
    alignment: 'left',
    size: 'md',
    textColor: '#1A202C',
    bgColor: '#FCFCFC',
    case: 'normal',
    shadow: false,
    fontFamily: 'Inter',
    mediaLayout: 'grid'
  });
  const previewRef = useRef<HTMLDivElement>(null);
  const updateStyle = (updates: Partial<StyleState>) => setStyle({...style, ...updates});
  const selectedNote = notes.find((n) => n.id === noteId);
  const isPersonal = wsId === NO_WORKSPACE_ID;

  useEffect(() => {
    async function loadWorkspaces() {
      try {
        const loadedWorkspaces = await fetchActiveWorkspaces();
        setWorkspaces(loadedWorkspaces);
        const stored = localStorage.getItem("lexora_last_workspace");

        if (stored === NO_WORKSPACE_ID) {
          setWsId(NO_WORKSPACE_ID);
          return;
        }

        if (stored && loadedWorkspaces.some((workspace) => workspace.id === stored)) {
          setWsId(stored);
          return;
        }

        if (loadedWorkspaces.length > 0) {
          setWsId(loadedWorkspaces[0].id);
          return;
        }

        setWsId(NO_WORKSPACE_ID);
      } catch {
        setWorkspaces([]);
        setWsId(NO_WORKSPACE_ID);
      }
    }

    void loadWorkspaces();
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

  // WebSocket Collaboration Setup
  useEffect(() => {
    if (!currentUser) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      console.log("Connected to socket server");
      socket.emit("join-room", {
        roomId: "publish-studio",
        user: {
          id: currentUser.id,
          name: currentUser.username,
          email: currentUser.email,
          avatar: `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.username)}&background=random`
        }
      });
    });

    socket.on("room-users", (users: {id: string, name: string, email: string, avatar: string}[]) => {
      setActiveUsers(users);
    });

    socket.on("content-update", () => {
        // Only update if not the one who sent it (to avoid loops)
        // But here we'll just show it's collaborative
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);



  async function publishNote(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    const title = pubTitle.trim();
    const body = previewRef.current?.innerHTML || quickContent.trim();

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
    setPublishedSlug(null);
    let targetNoteId = noteId;

    try {
      if (!targetNoteId) {
        const createRes = await apiFetch("/api/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            workspaceId: isPersonal ? null : wsId,
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
            visibility,
            layout,
            style,
            mediaIds: selectedMediaIds,
          }),
        }),
      );

      if (!publishRes.ok) {
        const err = await parseJson<{ error?: string; details?: string }>(publishRes);
        throw new Error(err?.error ?? err?.details ?? "Publish request failed");
      }

      const publishData = await parseJson<PublishResponse>(publishRes);
      if (publishData?.slug) {
        setPublishedSlug(publishData.slug);
      }

      push("success", "Published to the public library");
      setQuickContent("");
      setNoteId("");
      setMeta("");
      setTags("");
      await reload();
    } catch (error) {
      push("error", (error as Error).message);
    } finally {
      setSubmitting(false);
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
    if (mediaFiles.length === 0) {
      setMediaUploadError("Choose one or more files first");
      return;
    }

    if (!wsId) {
      setMediaUploadError("Choose a workspace or personal mode first");
      return;
    }

    setUploadingMedia(true);
    setMediaUploadError(null);

    try {
      const uploadPromises = mediaFiles.map(async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        if (!isPersonal) {
          formData.append("workspaceId", wsId);
        }

        const res = await fetch(`${API_BASE}/api/media/upload`, {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await parseJson<{ error?: string }>(res);
          throw new Error(err?.error ?? `Upload failed for ${file.name}`);
        }
        return res;
      });

      await Promise.all(uploadPromises);

      push("success", isPersonal ? "Media uploaded to your personal library" : "Media uploaded to workspace");
      setMediaFiles([]);
      await reload();
    } catch (error) {
      setMediaUploadError((error as Error).message);
    } finally {
      setUploadingMedia(false);
    }
  }

  const alignmentClass = style.alignment === "center" ? "text-center" : style.alignment === "right" ? "text-right" : "text-left";
  const transformClass = style.case === "upper" ? "uppercase tracking-widest" : style.case === "lower" ? "lowercase italic tracking-wide" : "tracking-wide normal-case";
  const shadowClass = style.shadow ? "shadow-lg shadow-black/30 ring-1 ring-black/20" : "";
  // const headingClass = style.size === "xl" ? "text-3xl" : "text-2xl"; // Removed unused

  const previewHeadline = pubTitle || selectedNote?.title || "Article headline";

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--lx-text)]">Publish Studio</h1>
          <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
            Publish personal or workspace notes publicly. Public articles are visible without login.
          </p>
        </div>
        <div className="flex items-center gap-4">
          {/* Active Users Profile Bubbles */}
          <div className="flex items-center gap-3 bg-[var(--lx-panel)] p-2 px-4 rounded-full border border-[var(--lx-border)] shadow-sm backdrop-blur-md">
            <div className="flex -space-x-2 overflow-hidden">
              {activeUsers.map((u, i) => (
                <div 
                  key={u.id || i} 
                  className="inline-block h-8 w-8 rounded-full ring-2 ring-[var(--lx-panel)] bg-cover bg-center cursor-help transition-all duration-300 hover:scale-125 hover:z-20 border border-white/10"
                  style={{ backgroundImage: `url(${u.avatar})` }}
                  title={u.name}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 border-l border-[var(--lx-border)] pl-3">
              <div className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </div>
              <span className="text-[10px] font-bold text-[var(--lx-text)] uppercase tracking-[0.2em]">
                {activeUsers.length} Active
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-8 xl:grid-cols-[1.8fr,0.95fr]">
        <main className="space-y-6">
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

            <div className="p-4 rounded-2xl bg-[#1e293b]/50 border border-white/5 text-[var(--lx-text-muted)] text-sm leading-relaxed">
              Workspace content edits are available inline here, with immediate edit history and a clean, Google Docs-like experience.
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--lx-text-muted)] mb-3">Publishing Scope</p>
                <div className="flex flex-wrap gap-2">
                  {(["Private", "Organizational", "Public"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                        visibility === value.toUpperCase() ? "bg-[#2563eb] text-white shadow-[0_0_15px_rgba(37,99,235,0.4)]" : "bg-[#1e293b] text-slate-400 hover:bg-[#334155]"
                      }`}
                      onClick={() => setVisibility(value.toUpperCase() as any)} // eslint-disable-line @typescript-eslint/no-explicit-any
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--lx-text-muted)] mb-3">Layout</p>
                <div className="flex flex-wrap gap-2">
                  {(["STANDARD", "IMMERSIVE"] as const).map((value) => (
                    <button
                      key={value}
                      type="button"
                      className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                        layout === value ? "bg-[#eab308] text-black shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "bg-[#1e293b] text-slate-400 hover:bg-[#334155]"
                      }`}
                      onClick={() => setLayout(value)}
                    >
                      {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-white/5">
              <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-[var(--lx-text-muted)] mb-1">New Note</p>
              <p className="text-xs text-slate-500 mb-4">Create notes directly in the page.</p>
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
              <p className="font-semibold text-[var(--lx-text)]">📎 Media attachments</p>
              <div className="mt-3 flex flex-col gap-3">
                <label className="flex flex-col gap-2">
                  <span className="text-xs uppercase tracking-[0.14em] text-[var(--lx-text-muted)]">Upload media files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                      className="lx-input"
                      onChange={(e) => setMediaFiles(Array.from(e.target.files ?? []))}
                    />
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="lx-btn-secondary"
                    onClick={() => void uploadMedia()}
                    disabled={uploadingMedia}
                  >
                    {uploadingMedia ? "Uploading..." : "Upload"}
                  </button>
                  {mediaFiles.length > 0 && (
                    <span className="rounded-full bg-[var(--lx-border)]/60 px-3 py-2 text-xs text-[var(--lx-text-muted)]">
                      {mediaFiles.length} file{mediaFiles.length === 1 ? "" : "s"} selected
                    </span>
                  )}
                </div>
                {mediaFiles.length > 0 && (
                  <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-3 text-sm text-[var(--lx-text-muted)]">
                    <p className="text-xs uppercase tracking-[0.16em] text-[var(--lx-text-muted)]">Pending upload</p>
                    <ul className="mt-3 space-y-2">
                      {mediaFiles.map((file) => (
                        <li key={file.name} className="flex items-center justify-between gap-3 text-sm">
                          <span className="truncate">{file.name}</span>
                          <span className="text-[11px] text-[var(--lx-text-muted)]">{(file.size / 1024).toFixed(0)} KB</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-3 text-sm text-[var(--lx-text-muted)]">
                  <p className="text-xs uppercase tracking-[0.16em] text-[var(--lx-text-muted)]">Select attached workspace media</p>
                  <div className="mt-3 grid max-h-40 gap-2 overflow-y-auto">
                    {mediaPick.map((media) => (
                      <button
                        key={media.id}
                        type="button"
                        className={`flex items-center justify-between rounded-2xl border px-3 py-2 text-left text-sm transition ${
                          selectedMediaIds.includes(media.id)
                            ? "border-[var(--lx-primary)] bg-[var(--lx-primary)]/10"
                            : "border-[var(--lx-border)] bg-[var(--lx-panel)] hover:border-[var(--lx-primary)]/30"
                        }`}
                        onClick={() =>
                          setSelectedMediaIds((current) =>
                            current.includes(media.id)
                              ? current.filter((id) => id !== media.id)
                              : [...current, media.id],
                          )
                        }
                      >
                        <span className="truncate">{media.fileName}</span>
                        <span className="text-[11px] text-[var(--lx-text-muted)]">{media.fileType}</span>
                      </button>
                    ))}
                    {mediaPick.length === 0 && (
                      <p className="text-sm text-[var(--lx-text-muted)]">No workspace media available yet.</p>
                    )}
                  </div>
                </div>
              </div>
              {mediaUploadError && (
                <p className="mt-2 text-xs text-red-500">{mediaUploadError}</p>
              )}
            </div>

            <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
              <p className="text-xs font-semibold text-[var(--lx-text)]">Selected media</p>
              <p className="mt-2 text-sm text-[var(--lx-text-muted)]">
                {selectedMediaIds.length} selected item{selectedMediaIds.length === 1 ? "" : "s"}
              </p>
            </div>

            <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-4 text-sm text-[var(--lx-text-muted)]">
              <div className="flex items-center justify-between gap-4 mb-4">
                <p className="font-semibold text-[var(--lx-text)]">Live publish preview</p>
                <div className="flex-shrink-0">
                  <StyleToolbox 
                    style={style} 
                    updateStyle={updateStyle} 
                    media={mediaPick}
                    selectedMediaIds={selectedMediaIds}
                    onReorderMedia={setSelectedMediaIds}
                  />
                </div>
              </div>
              <div
                className={`mt-4 relative rounded-[2rem] border border-[var(--lx-border)] p-8 transition-all duration-500 ${alignmentClass} ${transformClass} ${shadowClass}`}
                style={{ color: style.textColor, backgroundColor: style.bgColor }}
              >
                {/* Immersive card style */}
                <div 
                  className="absolute inset-0 rounded-[2rem] pointer-events-none shadow-2xl transition-all duration-500 opacity-20" 
                  style={{ backgroundColor: style.textColor }}
                />
                
                <div className="max-h-[650px] overflow-y-auto pr-4 custom-scrollbar space-y-8">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-indigo-500 opacity-80">
                        {visibility}
                    </span>
                    <span className="text-[10px] opacity-40">•</span>
                    <span className="text-[10px] font-bold uppercase tracking-[0.25em] text-gray-500 opacity-80">
                        {layout}
                    </span>
                  </div>
                  
                  <h2 className={`font-bold tracking-tight text-slate-900 ${style.size === 'xl' ? 'text-4xl' : 'text-3xl'}`}>
                    {previewHeadline}
                  </h2>
                  
                  <div 
                    ref={previewRef}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={(e) => {
                        const content = e.currentTarget.innerHTML;
                        socketRef.current?.emit('content-change', { roomId: 'publish-studio', content });
                    }}
                    className="text-base leading-relaxed whitespace-pre-wrap text-slate-600 focus:outline-none min-h-[120px] font-medium"
                  >
                    {meta || selectedNote?.content || quickContent || "Write a summary and choose a style to preview how this article will appear."}
                  </div>

                  {selectedMediaIds.length > 0 && (
                    <div className="pt-6 border-t border-gray-100">
                      <p className="text-[11px] font-bold mb-4 text-gray-400 uppercase tracking-[0.15em] flex items-center gap-2">
                        <Layers size={12} />
                        <span>Attached Media Assets ({style.mediaLayout})</span>
                      </p>
                      <div className={`
                        ${style.mediaLayout === 'masonry' ? 'columns-1 md:columns-2 gap-4 space-y-4' : 
                          style.mediaLayout === 'grid' ? 'grid grid-cols-2 gap-4' : 
                          style.mediaLayout === 'breakout' ? '-mx-12 grid grid-cols-1 gap-8' :
                          style.mediaLayout === 'marginalia' ? 'grid grid-cols-1 md:grid-cols-2 gap-8' :
                          'grid grid-cols-1 gap-6'}
                      `}>
                        {selectedMediaIds.map((id, idx) => {
                          const m = mediaPick.find(item => item.id === id);
                          if (!m) return null;
                          
                          const isPdf = m.fileType === 'application/pdf';
                          const layoutClass = style.mediaLayout === 'parallax' ? (idx % 2 === 0 ? 'translate-y-4' : '-translate-y-4') : '';
                          
                          return (
                            <div 
                              key={m.id} 
                              className={`
                                relative group rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 shadow-sm transition-all hover:shadow-md
                                ${style.mediaLayout === 'overlay' ? 'border-none' : ''}
                                ${style.mediaLayout === 'masonry' ? 'break-inside-avoid' : 'aspect-video'}
                                ${layoutClass}
                              `}
                            >
                              {isPdf ? (
                                <div className="w-full h-full flex flex-col items-center justify-center p-6 bg-slate-50">
                                  <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-600 mb-3">
                                    <span className="font-bold text-lg">PDF</span>
                                  </div>
                                  <p className="text-xs font-bold text-slate-700 truncate w-full text-center">{m.fileName}</p>
                                  <p className="text-[10px] text-slate-400 uppercase mt-1">{(m.size/1024).toFixed(1)} KB</p>
                                </div>
                              ) : (
                                <img 
                                  src={`${API_BASE}/api/media/view/${m.id}`} 
                                  alt={m.fileName} 
                                  className={`w-full h-full object-cover ${style.mediaLayout === 'parallax' ? 'scale-110 group-hover:scale-100 transition-transform duration-700' : ''}`}
                                />
                              )}
                              
                              {style.mediaLayout === 'overlay' ? (
                                <div className="absolute inset-0 bg-black/40 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
                                  <h4 className="text-white font-bold text-sm mb-1">{m.fileName}</h4>
                                  <p className="text-white/60 text-[10px] uppercase tracking-widest">{m.fileType.split('/')[1]}</p>
                                </div>
                              ) : (
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                                  <span className="text-[11px] font-medium text-white truncate w-full">{m.fileName}</span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                {publishedSlug ? (
                  <div className="mt-6 p-4 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-900">
                    <p className="text-[10px] font-bold uppercase tracking-widest opacity-60">Success! Published article link:</p>
                    <p className="mt-1 font-mono text-xs font-semibold break-all">{`${window.location.origin}/blog/${publishedSlug}`}</p>
                  </div>
                ) : null}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  className="lx-btn-secondary w-full flex items-center justify-center gap-2 !py-3 bg-[var(--lx-panel)] hover:bg-[var(--lx-border)]"
                  onClick={() => {
                    const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/publications` : "/publications";
                    navigator.clipboard.writeText(shareUrl);
                    push("success", "Public library link copied");
                  }}
                >
                  <Copy size={16} />
                  <span>Copy library link</span>
                </button>
                <button
                  type="button"
                  className="lx-btn-secondary w-full flex items-center justify-center gap-2 !py-3 bg-[var(--lx-panel)] hover:bg-[var(--lx-border)]"
                  onClick={() => {
                    const shareUrl = publishedSlug && typeof window !== "undefined"
                      ? `${window.location.origin}/blog/${publishedSlug}`
                      : typeof window !== "undefined"
                      ? `${window.location.origin}/publications`
                      : "/publications";
                    const subject = `Read my article on Lexora`;
                    const body = `Check out this article: ${shareUrl}`;
                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                  }}
                >
                  <Send size={16} />
                  <span>Share by Email</span>
                </button>
              </div>
            </div>

            <button type="submit" className="lx-btn-primary w-full !py-4 text-base font-bold shadow-[0_10px_20px_-5px_rgba(37,99,235,0.3)] hover:shadow-[0_15px_25px_-5px_rgba(37,99,235,0.4)] transition-all" disabled={submitting}>
              {submitting ? (
                <div className="flex items-center justify-center gap-2">
                   <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                   <span>Publishing to library...</span>
                </div>
              ) : noteId ? "Publish note to world" : "Publish quick article"}
            </button>
          </form>
        </section>
      </main>

      <div className="space-y-6">
        <section className="lx-card flex flex-col items-center text-center space-y-4">
          <h2 className="text-lg font-bold text-[var(--lx-text)]">Public Publications</h2>
          <p className="text-sm text-[var(--lx-text-muted)]">
            Explore all public articles in the community library. You can search by article name, slug, tag, or author.
          </p>
          <Link href="/publications" className="lx-btn-primary w-full py-3 text-sm">
            Go to Public Publications Page
          </Link>
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
