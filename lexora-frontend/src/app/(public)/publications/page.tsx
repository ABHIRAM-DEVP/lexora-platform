import Link from "next/link";
import { API_BASE } from "@/lib/config";
import type { PublicationRow } from "@/types/api";

type SpringPage = {
  content: PublicationRow[];
  totalElements: number;
};

async function loadBlogs(): Promise<SpringPage | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/blogs?size=12`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export default async function PublicationsPage() {
  const page = await loadBlogs();
  const items = page?.content ?? [];

  return (
    <main className="mx-auto max-w-6xl px-4 pb-24 pt-12 md:px-6">
      <section className="relative overflow-hidden rounded-3xl border border-[var(--lx-border)] bg-gradient-to-r from-slate-950 via-[var(--lx-primary)] to-[var(--lx-gold)] px-8 py-12 text-white shadow-xl">
        <div className="relative max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/70">
            Reader mode
          </p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">
            Published articles from the Lexora workspace network
          </h1>
          <p className="mt-4 text-white/85">
            Long-form content promoted from private workspaces to the public shelf, discoverable and calm to read.
          </p>
        </div>
      </section>

      <section className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {items.length === 0 && (
          <p className="text-[var(--lx-text-muted)]">No published articles yet.</p>
        )}
        {items.map((blog) => (
          <article key={blog.id} className="lx-card flex h-full flex-col">
            <h2 className="text-lg font-semibold text-[var(--lx-text)]">{blog.title}</h2>
            {blog.publishedAt && (
              <p className="mt-1 text-xs text-[var(--lx-text-muted)]">
                {new Date(blog.publishedAt).toLocaleDateString()}
              </p>
            )}
            <p className="mt-3 flex-1 text-sm text-[var(--lx-text-muted)]">
              {(blog.content ?? "").slice(0, 180) || "Published content is available from the article page."}
              ...
            </p>
            {blog.tags && blog.tags.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-2">
                {blog.tags.slice(0, 3).map((tag) => (
                  <span key={tag} className="rounded-full bg-[var(--lx-primary)]/10 px-2.5 py-1 text-[11px] font-semibold text-[var(--lx-primary)]">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <Link
              href={`/blog/${blog.slug}`}
              className="lx-btn-primary mt-4 w-full !py-2 !text-sm"
            >
              Read article
            </Link>
          </article>
        ))}
      </section>
    </main>
  );
}
