import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--lx-paper)] px-4">
      <h1 className="text-2xl font-semibold text-[var(--lx-text)]">Not found</h1>
      <p className="mt-2 text-center text-[var(--lx-text-muted)]">
        The page or article you opened is not available.
      </p>
      <Link href="/" className="lx-btn-primary mt-6">
        Back home
      </Link>
    </div>
  );
}
