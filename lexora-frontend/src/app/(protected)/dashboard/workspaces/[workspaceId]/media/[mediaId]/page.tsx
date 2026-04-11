"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useToast } from "@/context/ToastContext";
import { useAuth } from "@/context/AuthContext";
import { apiFetch } from "@/lib/api";
import type { MediaResponse } from "@/types/api";
import { useCallback, useEffect, useState } from "react";
import { ArrowLeftIcon, PhotoIcon, ChatBubbleLeftEllipsisIcon } from "@heroicons/react/24/outline";

type MediaReply = {
  id: string;
  author: string;
  message: string;
  createdAt: string;
};

function loadMediaReplies(mediaId: string): MediaReply[] {
  if (globalThis.window === undefined) return [];
  try {
    return JSON.parse(globalThis.localStorage.getItem(`lexora_media_replies_${mediaId}`) ?? "[]") as MediaReply[];
  } catch {
    return [];
  }
}

function saveMediaReplies(mediaId: string, replies: MediaReply[]) {
  if (globalThis.window === undefined) return;
  globalThis.localStorage.setItem(`lexora_media_replies_${mediaId}`, JSON.stringify(replies));
}

export default function WorkspaceMediaDetailPage() {
  const params = useParams<{ workspaceId: string; mediaId: string }>();
  const workspaceId = params.workspaceId;
  const mediaId = params.mediaId;
  const { user } = useAuth();
  const { push } = useToast();
  const [item, setItem] = useState<MediaResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [reply, setReply] = useState("");
  const [replies, setReplies] = useState<MediaReply[]>([]);

  const load = useCallback(async () => {
    if (!mediaId) return;
    setLoading(true);
    try {
      const res = await apiFetch(`/api/media/list/${workspaceId}?page=0&size=50`);
      if (!res.ok) throw new Error("Unable to load media details");
      const payload = await res.json();
      const found = (payload.content ?? []).find((file: MediaResponse) => file.id === mediaId);
      setItem(found ?? null);
      setReplies(loadMediaReplies(mediaId));
    } catch (e) {
      push("error", (e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [workspaceId, mediaId, push]);

  useEffect(() => {
    load();
  }, [load]);

  const addReply = () => {
    if (!reply.trim()) {
      push("warning", "Reply cannot be empty");
      return;
    }
    const next: MediaReply = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      author: user?.username ?? "You",
      message: reply.trim(),
      createdAt: new Date().toISOString(),
    };
    const nextReplies = [...replies, next];
    setReplies(nextReplies);
    saveMediaReplies(mediaId, nextReplies);
    setReply("");
    push("success", "Reply saved locally");
  };

  const downloadFile = async (file: MediaResponse) => {
    const res = await apiFetch(`/api/media/download/${file.id}`);
    if (!res.ok) {
      push("error", "Download failed");
      return;
    }
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <p className="text-[var(--lx-text-muted)]">Loading media…</p>;
  }

  if (!item) {
    return <p className="text-[var(--lx-text-muted)]">Media not found.</p>;
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-6 shadow-sm">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Link
              href={`/dashboard/workspaces/${workspaceId}/media`}
              className="inline-flex items-center gap-2 text-sm font-medium text-[var(--lx-primary)]"
            >
              <ArrowLeftIcon className="h-4 w-4" />
              Back to workspace media
            </Link>
            <div className="flex items-center gap-3 text-xs uppercase tracking-[0.22em] text-[var(--lx-text-muted)]">
              <PhotoIcon className="h-4 w-4" />
              <span>Media detail</span>
            </div>
            <h1 className="text-2xl font-semibold text-[var(--lx-text)]">{item.fileName}</h1>
          </div>
          <button
            type="button"
            className="lx-btn-secondary"
            onClick={() => downloadFile(item)}
          >
            Download file
          </button>
        </div>

        <div className="rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-6 text-[var(--lx-text)] shadow-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[var(--lx-text-muted)]">Type</p>
              <p className="mt-1 font-medium">{item.fileType}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--lx-text-muted)]">Size</p>
              <p className="mt-1 font-medium">{(item.size / 1024).toFixed(1)} KB</p>
            </div>
            <div>
              <p className="text-sm text-[var(--lx-text-muted)]">Uploaded</p>
              <p className="mt-1 font-medium">{new Date(item.createdAt ?? new Date().toISOString()).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-[var(--lx-text-muted)]">Owner</p>
              <p className="mt-1 font-medium">{item.ownerId.slice(0, 8)}…</p>
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-4 rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-6 shadow-sm">
        <div className="flex items-center gap-2 text-sm font-semibold text-[var(--lx-text)]">
          <ChatBubbleLeftEllipsisIcon className="h-5 w-5" />
          <span>Replies</span>
        </div>

        <div className="space-y-3">
          {replies.length === 0 ? (
            <p className="text-[var(--lx-text-muted)]">Start a reply for this media item.</p>
          ) : (
            replies.map((replyItem) => (
              <div key={replyItem.id} className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-4">
                <div className="flex items-center justify-between gap-3 text-sm text-[var(--lx-text-muted)]">
                  <span>{replyItem.author}</span>
                  <span>{new Date(replyItem.createdAt).toLocaleString()}</span>
                </div>
                <p className="mt-2 text-[var(--lx-text)]">{replyItem.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="space-y-3">
          <textarea
            className="lx-input min-h-[120px]"
            placeholder="Reply to this upload…"
            value={reply}
            onChange={(event) => setReply(event.target.value)}
          />
          <button
            type="button"
            className="lx-btn-primary"
            onClick={addReply}
          >
            Save reply
          </button>
        </div>
      </section>
    </div>
  );
}
