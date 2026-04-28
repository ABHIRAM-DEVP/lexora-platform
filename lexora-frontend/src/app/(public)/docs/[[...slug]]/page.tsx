import Link from "next/link";

export default async function DocsPage({
  params,
}: {
  params: Promise<{ slug?: string[] }>;
}) {
  const { slug } = await params;
  const path = slug?.length ? slug.join(" / ") : "index";

  return (
    <main className="mx-auto max-w-3xl px-4 py-16 md:px-6">
      <div className="lx-card">
        <p className="text-xs font-semibold uppercase tracking-widest text-[var(--lx-text-muted)]">
          Documentation
        </p>
        <h1 className="mt-2 text-2xl font-semibold text-[var(--lx-text)]">
          routing / {path}
        </h1>
        <p className="mt-3 text-[var(--lx-text-muted)]">
          This catch-all route demonstrates App Router segments. Swap slug
          segments in the URL to see the title update.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <Link className="lx-btn-secondary !py-2 !text-xs" href="/docs/routing/app-router">
            routing / app-router
          </Link>
          <Link className="lx-btn-secondary !py-2 !text-xs" href="/docs/api/auth-flow">
            api / auth-flow
          </Link>
          <Link className="lx-btn-secondary !py-2 !text-xs" href="/docs">
            docs home
          </Link>
        </div>
      </div>
    </main>
  );
}
