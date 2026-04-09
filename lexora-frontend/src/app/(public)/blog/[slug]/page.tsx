import { API_BASE } from "@/lib/config";
import type { PublicBlogResponse } from "@/types/api";
import { notFound } from "next/navigation";

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  let data: PublicBlogResponse | null = null;
  try {
    const res = await fetch(`${API_BASE}/api/public/blog/${encodeURIComponent(slug)}`, {
      cache: "no-store",
    });
    if (!res.ok) notFound();
    data = await res.json();
  } catch {
    notFound();
  }

  if (!data) notFound();

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <p className="text-xs font-semibold uppercase tracking-widest text-[var(--lx-primary)]">
        Public article
      </p>
      <h1 className="font-serif text-4xl font-semibold leading-tight text-[var(--lx-text)] md:text-5xl">
        {data.title}
      </h1>
      <p className="mt-4 text-sm text-[var(--lx-text-muted)]">
        {data.publishedAt && new Date(data.publishedAt).toLocaleString()} ·{" "}
        {data.views != null ? `${data.views} views` : ""}
      </p>
      <div className="lx-card mt-8 whitespace-pre-wrap font-serif text-lg leading-relaxed text-[var(--lx-text)]">
        {data.content}
      </div>
    </main>
  );
}
