"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { API_BASE } from "@/lib/config";
import type { PublicationRow } from "@/types/api";

export function PublicationsClient({ initialItems }: { initialItems: PublicationRow[] }) {
  const [items, setItems] = useState<PublicationRow[]>(initialItems);
  const [totalCount, setTotalCount] = useState(initialItems.length);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);

    void fetch(`${API_BASE}/api/public/blogs?size=24`, { cache: "no-store" })
      .then(async (res) => {
        if (!active) return;
        if (!res.ok) {
          setError("Unable to load public articles.");
          return;
        }
        const data = (await res.json()) as { content?: PublicationRow[]; totalElements?: number };
        setItems(data?.content ?? []);
        setTotalCount(data?.totalElements ?? data?.content?.length ?? 0);
      })
      .catch(() => {
        if (!active) return;
        setError("Unable to connect to the public library.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-3 rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-6 shadow-sm sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[var(--lx-text-muted)]">
            Public library
          </p>
          <h2 className="mt-3 text-2xl font-semibold text-[var(--lx-text)]">
            Browse the latest published stories
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-[var(--lx-text-muted)]">
            Public articles are promoted from workspaces and personal drafts. Share the story with your network or discover new voices.
          </p>
        </div>
        <div className="rounded-3xl bg-[var(--lx-panel-solid)] px-4 py-3 text-sm text-[var(--lx-text-muted)]">
          <p className="text-[var(--lx-text-muted)]">Available articles</p>
          <p className="mt-1 text-2xl font-semibold text-[var(--lx-text)]">{totalCount}</p>
        </div>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-8 text-center text-[var(--lx-text-muted)]">
          Loading published articles...
        </div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-700">
          {error}
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-3xl border border-[var(--lx-border)] bg-[var(--lx-panel)] p-8 text-center text-[var(--lx-text-muted)]">
          No published articles yet. Publish from the studio to make your posts visible here.
        </div>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((blog) => (
            <article key={blog.id} className="lx-card flex h-full flex-col p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-[var(--lx-primary)]">Published</p>
              <h3 className="mt-4 text-lg font-semibold text-[var(--lx-text)]">{blog.title}</h3>
              <div className="mt-2 flex flex-col gap-1">
                {blog.publishedAt && (
                  <p className="text-xs text-[var(--lx-text-muted)]">
                    {new Date(blog.publishedAt).toLocaleDateString()}
                  </p>
                )}
                {blog.publishedByName && (
                  <p className="text-xs font-medium text-[var(--lx-primary)]">
                    By {blog.publishedByName}
                  </p>
                )}
              </div>
              <p className="mt-4 flex-1 text-sm leading-6 text-[var(--lx-text-muted)] whitespace-pre-wrap">
                {(blog.content ?? "").slice(0, 180) || "This story has been published to the public library."}
              </p>
              {blog.tags && blog.tags.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {blog.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-[var(--lx-primary)]/10 px-2 py-1 text-[11px] font-semibold text-[var(--lx-primary)]">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}
              <Link
                href={`/blog/${blog.slug}`}
                className="lx-btn-primary mt-6 inline-flex items-center justify-center !py-2 text-sm"
              >
                Read article
              </Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
