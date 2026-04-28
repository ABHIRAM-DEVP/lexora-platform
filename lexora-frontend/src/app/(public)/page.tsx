import Link from "next/link";
import {
  BuildingOffice2Icon,
  ChartBarIcon,
  PaintBrushIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";

const feats = [
  {
    title: "Workspaces",
    desc: "Private and org lanes with crisp membership.",
    icon: BuildingOffice2Icon,
  },
  {
    title: "Analytics",
    desc: "Signals from real activity, not vanity charts.",
    icon: ChartBarIcon,
  },
  {
    title: "Role-ready",
    desc: "OWNER → VIEWER, enforced at the API edge.",
    icon: ShieldCheckIcon,
  },
  {
    title: "Design",
    desc: "Formal blues, gold accents, calm typography.",
    icon: PaintBrushIcon,
  },
];

export default function LandingPage() {
  return (
    <main className="relative mx-auto max-w-6xl px-4 pb-24 pt-12 md:px-6 md:pt-20">
      <div className="grid gap-12 md:grid-cols-2 md:items-center">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[var(--lx-primary)]">
            Lexora
          </p>
          <h1 className="mt-4 bg-gradient-to-br from-slate-900 via-[var(--lx-primary)] to-[var(--lx-gold)] bg-clip-text text-4xl font-semibold leading-tight text-transparent dark:from-white dark:via-blue-200 dark:to-amber-100 md:text-5xl">
            A workspace platform built for clarity.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-[var(--lx-text-muted)]">
            Spin up workspaces, capture notes and media, publish to the public
            shelf, and watch the console stay composed — even on busy days.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/signup" className="lx-btn-primary">
              Get started
            </Link>
            <Link href="/login" className="lx-btn-secondary">
              Sign in
            </Link>
            <Link href="/publications" className="lx-btn-secondary">
              Public blog shelf
            </Link>
          </div>
        </div>

        <div className="relative">
          <div className="absolute -inset-4 rounded-3xl bg-gradient-to-br from-blue-600/20 via-slate-900/40 to-amber-500/20 blur-2xl" />
          <div className="relative lx-card overflow-hidden border-[var(--lx-border)] bg-gradient-to-b from-[var(--lx-panel-solid)] to-slate-50/80 dark:to-slate-950/80">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--lx-text-muted)]">
              Why teams adopt Lexora
            </p>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {feats.map(({ title, desc, icon: Icon }) => (
                <div
                  key={title}
                  className="rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)]/80 p-4"
                >
                  <Icon className="h-6 w-6 text-[var(--lx-primary)]" />
                  <p className="mt-3 font-semibold text-[var(--lx-text)]">{title}</p>
                  <p className="mt-1 text-sm text-[var(--lx-text-muted)]">{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
