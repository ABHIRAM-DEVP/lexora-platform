import { API_BASE } from "@/lib/config";
import type { PublicationRow } from "@/types/api";
import { PublicationsClient } from "./PublicationsClient";

type SpringPage = {
  content: PublicationRow[];
  totalElements: number;
};

async function loadBlogs(): Promise<SpringPage | null> {
  try {
    const res = await fetch(`${API_BASE}/api/public/blogs?size=24`, {
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

      <section className="mt-12">
        <PublicationsClient initialItems={items} />
      </section>
    </main>
  );
}
