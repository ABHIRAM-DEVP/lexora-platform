"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import type { NoteResponse } from "@/types/api";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";

type CommentItem = {
  id: string;
  content: string;
  userId: string;
  createdAt: string;
};

export default function WorkspaceNoteDetailPage() {
  const params = useParams<{
    workspaceId: string;
    noteId: string;
  }>();
  const noteId = params.noteId;
  const workspaceId = params.workspaceId;
  const { push } = useToast();
  const [note, setNote] = useState<NoteResponse | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [reply, setReply] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!noteId) return;
    setLoading(true);
    setError(null);
    try {
      const [noteRes, commentsRes] = await Promise.all([
        apiFetch(`/api/notes/${noteId}`),
        apiFetch(`/api/notes/${noteId}/comments?workspaceId=${workspaceId}`),
      ]);

      if (!noteRes.ok) {
        const err = await parseJson<{ error?: string }>(noteRes);
        throw new Error(err?.error ?? "Failed to load note");
      }
      setNote((await noteRes.json()) as NoteResponse);

      if (commentsRes.ok) {
        setComments((await commentsRes.json()) as CommentItem[]);
      } else {
        setComments([]);
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [noteId, workspaceId]);

  useEffect(() => {
    load();
  }, [load]);

  const submitReply = async () => {
    if (!reply.trim()) {
      push("warning", "Reply cannot be empty");
      return;
    }
    setSending(true);
    try {
      const res = await apiFetch(`/api/notes/${noteId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ workspaceId, content: reply.trim() }),
      });
      if (!res.ok) {
        const err = await parseJson<{ error?: string }>(res);
        throw new Error(err?.error ?? "Unable to post reply");
      }
      setReply("");
      push("success", "Reply posted");
      load();
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <p className="text-[var(--lx-text-muted)]">Loading note…</p>;
  }

  if (!note) {
    return <p className="text-[var(--lx-text-muted)]">Note not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Link
              href={`/dashboard/workspaces/${workspaceId}/notes`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lx-primary)]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to notes
            </Link>
            <h1 className="text-2xl font-semibold text-[var(--lx-text)]">{note.title}</h1>
            <p className="text-sm text-[var(--lx-text-muted)]">
              Updated {new Date(note.updatedAt ?? note.createdAt).toLocaleString()}
            </p>
          </div>
          <div className="rounded-full bg-[var(--lx-border)] px-3 py-1 text-xs font-semibold text-[var(--lx-text-muted)]">
            Workspace {workspaceId.slice(0, 8)}…
          </div>
        </div>
        <div className="rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-6 text-[var(--lx-text)] shadow-sm">
          <pre className="whitespace-pre-wrap break-words text-sm leading-relaxed">{note.content}</pre>
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--lx-text)]">
          <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
          <span>Replies</span>
        </div>

        <div className="space-y-3">
          {comments.length === 0 ? (
            <p className="text-[var(--lx-text-muted)]">No replies yet. Start the conversation.</p>
          ) : (
            comments.map((comment) => (
              <div key={comment.id} className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-[var(--lx-text-muted)]">
                  <span>User {comment.userId.slice(0, 8)}…</span>
                  <span>{new Date(comment.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-[var(--lx-text)]">{comment.content}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <textarea
            className="lx-input min-h-[120px]"
            placeholder="Write a reply…"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
          />
          <button
            type="button"
            className="lx-btn-primary"
            onClick={submitReply}
            disabled={sending}
          >
            {sending ? "Posting…" : "Post reply"}
          </button>
          {error && <p className="text-sm text-red-500">{error}</p>}
        </div>
      </section>
    </div>
  );
}
