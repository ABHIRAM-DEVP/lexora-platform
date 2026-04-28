"use client";

import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { apiFetch } from "@/lib/api";
import type { ActivityLog } from "@/types/api";
import { FormEvent, useEffect, useState } from "react";

export default function AdminPage() {
  const { isAdmin } = useAuth();
  const { push } = useToast();
  const [email, setEmail] = useState("");
  const [feed, setFeed] = useState<ActivityLog[]>([]);

  useEffect(() => {
    if (!isAdmin) return;
    apiFetch("/api/activity?page=0&size=40").then(async (res) => {
      if (res.ok) setFeed(await res.json());
    });
  }, [isAdmin]);

  async function promote(e: FormEvent) {
    e.preventDefault();
    const res = await apiFetch(
      `/api/admin?email=${encodeURIComponent(email)}`,
      { method: "POST" },
    );
    const text = await res.text();
    if (!res.ok) {
      push("error", text);
      return;
    }
    push("success", text);
    setEmail("");
  }

  if (!isAdmin) {
    return (
      <div className="lx-card max-w-xl">
        <h1 className="text-lg font-semibold text-[var(--lx-text)]">Admin</h1>
        <p className="mt-2 text-sm text-[var(--lx-text-muted)]">
          This area is reserved for platform administrators. It is hidden from
          standard operators to keep promotion workflows deliberate.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--lx-text)]">
        Platform admin
      </h1>

      <section className="lx-card max-w-lg">
        <h2 className="text-sm font-semibold text-[var(--lx-text)]">
          Promote user
        </h2>
        <form className="mt-4 flex flex-col gap-3 sm:flex-row" onSubmit={promote}>
          <input
            type="email"
            className="lx-input flex-1"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" className="lx-btn-primary">
            Promote to admin
          </button>
        </form>
      </section>

      <section className="lx-card">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
          Cross-user activity
        </h2>
        <ul className="mt-4 max-h-[480px] space-y-2 overflow-y-auto text-sm">
          {feed.map((a) => (
            <li
              key={a.id}
              className="flex flex-wrap justify-between gap-2 rounded-xl border border-[var(--lx-border)] px-3 py-2"
            >
              <span className="font-medium text-[var(--lx-text)]">{a.action}</span>
              <span className="text-xs text-[var(--lx-text-muted)]">
                user {a.userId?.slice(0, 8)}… ·{" "}
                {new Date(a.timestamp).toLocaleString()}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
