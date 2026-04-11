"use client";

import Link from "next/link";
import { useToast } from "@/context/ToastContext";
import { apiFetch, parseJson } from "@/lib/api";
import { API_BASE } from "@/lib/config";
import type { MediaResponse, Paged } from "@/types/api";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

export default function WorkspaceMediaPage() {
  const params = useParams<{ workspaceId: string }>();
  const wid = params.workspaceId;
  const { push } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);
  const [list, setList] = useState<MediaResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch(`/api/media/list/${wid}?page=0&size=50`);
      if (!res.ok) {
        const err = await parseJson<{ error?: string }>(res);
        throw new Error(err?.error ?? "Failed to load media");
      }
      const p = (await res.json()) as Paged<MediaResponse>;
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

  async function upload() {
    const file = inputRef.current?.files?.[0];
    if (!file) {
      push("warning", "Choose a file first");
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("workspaceId", wid);
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
      push("success", "Uploaded");
      if (inputRef.current) inputRef.current.value = "";
      load();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <section className="lx-card">
        <h1 className="text-lg font-semibold text-[var(--lx-text)]">
          Upload and manage
        </h1>
        {error && (
          <div className="mt-3 rounded-xl border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {error}
          </div>
        )}
        <input ref={inputRef} type="file" className="lx-input mt-4" />
        <div className="mt-3 flex flex-wrap gap-2">
          <button
            type="button"
            className="lx-btn-primary"
            onClick={upload}
            disabled={uploading}
          >
            {uploading ? "Uploading…" : "Upload"}
          </button>
          <button type="button" className="lx-btn-secondary" onClick={load}>
            Refresh
          </button>
        </div>
      </section>

      <section className="lx-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
          Latest uploads
        </h2>
        {(() => {
          if (loading) {
            return <p className="mt-4 text-[var(--lx-text-muted)]">Loading…</p>;
          }
          if (list.length === 0) {
            return <p className="mt-4 text-[var(--lx-text-muted)]">No files yet.</p>;
          }
          return (
            <ul className="mt-4 space-y-2 text-sm">
              {list.map((f) => (
                <li key={f.id} className="rounded-xl border border-[var(--lx-border)]">
                  <Link
                    href={`/dashboard/workspaces/${wid}/media/${f.id}`}
                    className="group flex items-center justify-between gap-3 rounded-xl px-3 py-3 transition hover:bg-[var(--lx-border)]/40"
                  >
                    <div>
                      <p className="font-medium text-[var(--lx-text)]">{f.fileName}</p>
                      <p className="text-xs text-[var(--lx-text-muted)]">
                        {f.fileType} · {(f.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                    <span className="rounded-2xl bg-[var(--lx-panel)] px-3 py-1 text-[11px] text-[var(--lx-text-muted)] transition group-hover:bg-[var(--lx-border)]/70">
                      View
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          );
        })()}
      </section>
    </div>
  );
}
