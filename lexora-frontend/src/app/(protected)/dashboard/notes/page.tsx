"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import type * as React from "react";
import { WorkspaceSelector } from "@/components/WorkspaceSelector";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import { fetchActiveWorkspaces } from "@/lib/workspace-api";
import type { NoteResponse, Paged, WorkspaceResponse, MediaResponse } from "@/types/api";
import { useAuth } from "@/context/AuthContext";
import { io, Socket } from "socket.io-client";
import { SOCKET_URL } from "@/lib/config";
import StyleToolbox, { StyleState } from "@/components/StyleToolbox";

type NoteHistoryEntry = {
  id: string;
  at: string;
  summary: string;
};

export default function ContentNotesPage() {
  const { push } = useToast();
  const { user: currentUser } = useAuth();
  const socketRef = useRef<Socket | null>(null);
  const [activeUsers, setActiveUsers] = useState<{id: string, name: string, email: string, avatar: string}[]>([]);
  const [workspaces, setWorkspaces] = useState<WorkspaceResponse[]>([]);
  const [wsId, setWsId] = useState("");
  const [scope, setScope] = useState<"PRIVATE" | "ORG" | "PUBLIC">("PRIVATE");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [inventory, setInventory] = useState<NoteResponse[]>([]);
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editBody, setEditBody] = useState("");
  const [noteHistoryMap, setNoteHistoryMap] = useState<Record<string, NoteHistoryEntry[]>>({});
  const [showTimeline, setShowTimeline] = useState(true);
  const [loading, setLoading] = useState(false);
  const [selectedMediaIds, setSelectedMediaIds] = useState<string[]>([]);
  const [mediaPick, setMediaPick] = useState<MediaResponse[]>([]);

  const [style, setStyle] = useState<StyleState>({
    alignment: 'left',
    size: 'md',
    textColor: '#1A202C',
    bgColor: '#FCFCFC',
    case: 'normal',
    shadow: false,
    fontFamily: 'Inter',
    mediaLayout: 'grid',
  });

  const updateStyle = (updates: Partial<StyleState>) => {
    setStyle(prev => ({ ...prev, ...updates }));
  };

  const getScopeButtonClass = (value: "PRIVATE" | "ORG" | "PUBLIC") => {
    if (scope !== value) {
      return "bg-[var(--lx-border)]/60 text-[var(--lx-text-muted)]";
    }

    return value === "PUBLIC"
      ? "bg-[var(--lx-gold)] text-slate-900"
      : "bg-[var(--lx-primary)] text-white";
  };

  const selectedNote = useMemo(
    () => inventory.find((note) => note.id === selectedNoteId) ?? null,
    [inventory, selectedNoteId],
  );

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

  useEffect(() => {
    if (selectedNote) {
      setEditTitle(selectedNote.title);
      setEditBody(selectedNote.content);
    } else {
      setEditTitle("");
      setEditBody("");
    }
  }, [selectedNote]);

  // WebSocket Collaboration Setup
  useEffect(() => {
    if (!currentUser) return;

    const socket = io(SOCKET_URL);
    socketRef.current = socket;

    socket.on("connect", () => {
      socket.emit("join-room", {
        roomId: "content-lab",
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

    return () => {
      socket.disconnect();
    };
  }, [currentUser]);

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
      const notePage = (await res.json()) as Paged<NoteResponse>;
      setInventory(notePage.content ?? []);

      // Also load media for the workspace
      const mediaRes = await apiFetch(`/api/media/list/${wsId}?page=0&size=50`);
      if (mediaRes.ok) {
        const mediaPage = (await mediaRes.json()) as Paged<MediaResponse>;
        setMediaPick(mediaPage.content ?? []);
      }
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [push, wsId]);

  useEffect(() => {
    void loadInventory();
  }, [loadInventory]);

  async function submitNote(e: React.SyntheticEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!selectedNote) {
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
      return;
    }

    if (!editTitle.trim() || !editBody.trim()) {
      push("error", "Title and body are required to save changes");
      return;
    }

    const res = await apiFetch(`/api/notes/${selectedNote.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: editTitle, content: editBody }),
    });

    if (!res.ok) {
      const err = await parseJson<{ error?: string }>(res);
      push("error", err?.error ?? "Failed to save note changes");
      return;
    }

    const historyEntry: NoteHistoryEntry = {
      id: selectedNote.id,
      at: new Date().toISOString(),
      summary: `Saved changes to ‘${editTitle}’`,
    };

    setNoteHistoryMap((current) => ({
      ...current,
      [selectedNote.id]: [historyEntry, ...(current[selectedNote.id] ?? [])],
    }));

    push("success", "Note updated inline");
    void loadInventory();
  }

  function openNoteEditor(note: NoteResponse) {
    setSelectedNoteId(note.id);
  }

  function clearSelection() {
    setSelectedNoteId(null);
  }

  const noteHistory = selectedNote ? noteHistoryMap[selectedNote.id] ?? [] : [];

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--lx-text)]">Content lab</h1>
          <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
            Create, edit and manage your workspace drafts. Changes are saved to your account.
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

      <div className="grid gap-8 xl:grid-cols-[1.7fr,1fr]">
        <div className="space-y-6">
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
                  Your personal note editor stays on the main page. It saves directly in your account and can be published publicly from Publish Studio.
                </p>
              ) : (
                <p>
                  Workspace content edits are available inline here, with immediate edit history and a clean, Google Docs-like experience.
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
                    className={`rounded-full px-3 py-1 text-xs font-medium ${getScopeButtonClass(key)}`}
                    onClick={() => setScope(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-[var(--lx-text-muted)]">
                Edit notes inline on the page, then publish when you’re ready. The timeline button tracks every save.
              </p>
            </div>

            <form className="space-y-4" onSubmit={submitNote}>
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--lx-text-muted)]">
                    {selectedNote ? "Edit note" : "New note"}
                  </p>
                  <p className="mt-1 text-sm text-[var(--lx-text-muted)]">
                    {selectedNote ? "Live editing with side timeline." : "Create notes directly in the page."}
                  </p>
                  {selectedNote && selectedNote.updatedAt && (
                    <p className="mt-2 text-xs text-[var(--lx-text-muted)]">
                      Last edited by {selectedNote.updatedByName ?? "you"} on {new Date(selectedNote.updatedAt).toLocaleString()}.
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                    {selectedNote && (
                    <button
                        type="button"
                        className="lx-btn-secondary text-xs"
                        onClick={clearSelection}
                    >
                        Close editor
                    </button>
                    )}
                    <StyleToolbox 
                        style={style} 
                        updateStyle={updateStyle}
                        media={mediaPick}
                        selectedMediaIds={selectedMediaIds}
                        onReorderMedia={setSelectedMediaIds}
                    />
                </div>
              </div>

              <input
                className="lx-input"
                placeholder="Title"
                value={selectedNote ? editTitle : title}
                onChange={(e) => (selectedNote ? setEditTitle(e.target.value) : setTitle(e.target.value))}
                required
              />
              <textarea
                className={`lx-input min-h-[260px] transition-all duration-500 ${style.alignment === 'center' ? 'text-center' : style.alignment === 'right' ? 'text-right' : 'text-left'} ${style.case === 'upper' ? 'uppercase' : style.case === 'lower' ? 'lowercase' : ''}`}
                placeholder="Write your note content here"
                style={{ color: style.textColor, backgroundColor: style.bgColor }}
                value={selectedNote ? editBody : body}
                onChange={(e) => (selectedNote ? setEditBody(e.target.value) : setBody(e.target.value))}
                required
              />

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <button type="submit" className="lx-btn-primary w-full">
                  {selectedNote ? "Save note changes" : "Save note"}
                </button>
                {selectedNote ? (
                  <button
                    type="button"
                    className="lx-btn-secondary w-full"
                    onClick={clearSelection}
                  >
                    Discard selection
                  </button>
                ) : null}
              </div>
            </form>
          </section>
        </div>

        <aside className="space-y-6">
          <section className="lx-card space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
                  Content inventory
                </h2>
                <p className="mt-1 text-xs text-[var(--lx-text-muted)]">
                  Select any note to edit it inline without popups.
                </p>
              </div>
              <button
                type="button"
                className="text-xs font-medium text-[var(--lx-primary)]"
                onClick={() => setShowTimeline((open) => !open)}
              >
                {showTimeline ? "Hide timeline" : "Show timeline"}
              </button>
            </div>

            {loading ? (
              <p className="text-sm text-[var(--lx-text-muted)]">Loading notes...</p>
            ) : (
              <div className="space-y-3 max-h-[560px] overflow-y-auto">
                {inventory.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    onClick={() => openNoteEditor(note)}
                    className={`w-full rounded-2xl border px-4 py-4 text-left transition ${
                      selectedNoteId === note.id ? "border-[var(--lx-primary)] bg-[var(--lx-primary)]/10" : "border-[var(--lx-border)] bg-[var(--lx-panel-solid)] hover:border-[var(--lx-primary)]/40"
                    }`}
                  >
                    <p className="font-medium text-[var(--lx-text)]">{note.title}</p>
                    <p className="mt-1 text-xs text-[var(--lx-text-muted)] line-clamp-2">
                      {note.content}
                    </p>
                    {note.updatedByName && note.updatedAt && (
                      <p className="mt-2 text-[11px] uppercase tracking-[0.22em] text-[var(--lx-text-muted)]">
                        Last edited by {note.updatedByName}
                      </p>
                    )}
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-[0.22em] text-[var(--lx-primary)]">
                      Open editor
                    </p>
                  </button>
                ))}
                {inventory.length === 0 && (
                  <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-4 text-sm text-[var(--lx-text-muted)]">
                    No notes yet.
                  </div>
                )}
              </div>
            )}
          </section>

          {selectedNote && showTimeline && (
            <section className="lx-card space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
                Activity timeline
              </h2>
              <div className="space-y-3 max-h-[320px] overflow-y-auto">
                {noteHistory.length === 0 ? (
                  <div className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-4 text-sm text-[var(--lx-text-muted)]">
                    No edits yet. Save changes to build a timeline.
                  </div>
                ) : (
                  noteHistory.map((entry) => (
                    <div key={entry.at} className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-4">
                      <p className="text-sm font-medium text-[var(--lx-text)]">{entry.summary}</p>
                      <p className="mt-2 text-xs text-[var(--lx-text-muted)]">{new Date(entry.at).toLocaleString()}</p>
                    </div>
                  ))
                )}
              </div>
            </section>
          )}
        </aside>
      </div>
    </div>
  );
}
