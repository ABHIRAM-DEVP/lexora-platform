"use client";

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

  async function downloadFile(file: MediaResponse) {
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
  }

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
        {loading ? (
          <p className="mt-4 text-[var(--lx-text-muted)]">Loading…</p>
        ) : list.length === 0 ? (
          <p className="mt-4 text-[var(--lx-text-muted)]">No files yet.</p>
        ) : (
          <ul className="mt-4 space-y-2 text-sm">
            {list.map((f) => (
              <li
                key={f.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-[var(--lx-border)] px-3 py-2"
              >
                <div>
                  <p className="font-medium text-[var(--lx-text)]">{f.fileName}</p>
                  <p className="text-xs text-[var(--lx-text-muted)]">
                    {f.fileType} · {(f.size / 1024).toFixed(1)} KB
                  </p>
                </div>
                <button
                  type="button"
                  className="lx-btn-secondary !py-1 !text-xs"
                  onClick={() => downloadFile(f)}
                >
                  Download
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
