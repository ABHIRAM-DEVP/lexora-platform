"use client";

import { useAuth } from "@/context/AuthContext";
import { API_BASE } from "@/lib/config";
import { fetchActiveWorkspaces } from "@/lib/workspace-api";
import Link from "next/link";
import { useEffect, useState } from "react";

function OverviewCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="lx-card">
      <h2 className="text-xs font-semibold uppercase tracking-wide text-[var(--lx-text-muted)]">
        {title}
      </h2>
      <p className="mt-2 text-sm text-[var(--lx-text)]">{children}</p>
    </div>
  );
}

export default function SettingsPage() {
  const { user, isAdmin } = useAuth();
  const [backendHealth, setBackendHealth] = useState("…");
  const [pubHealth, setPubHealth] = useState("…");
  const [wsName, setWsName] = useState("—");

  useEffect(() => {
    fetch(`${API_BASE}/health-check`)
      .then((r) => r.text())
      .then(setBackendHealth)
      .catch(() => setBackendHealth("unreachable"));

    fetch(`${API_BASE}/api/publication/ping`)
      .then((r) => r.text())
      .then(setPubHealth)
      .catch(() => setPubHealth("unreachable"));

    const stored = localStorage.getItem("lexora_last_workspace");
    fetchActiveWorkspaces()
      .then((list) => {
        const w = list.find((x) => x.id === stored) ?? list[0];
        setWsName(w?.name ?? "—");
      })
      .catch(() => setWsName("—"));
  }, []);

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-[var(--lx-text)]">Settings</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <OverviewCard title="Username">{user?.username ?? "—"}</OverviewCard>
        <OverviewCard title="Platform role">
          {user?.role ?? "—"}
        </OverviewCard>
        <OverviewCard title="Remembered workspace">{wsName}</OverviewCard>
        <OverviewCard title="Backend health">{backendHealth}</OverviewCard>
        <OverviewCard title="Publishing service">{pubHealth}</OverviewCard>
      </div>
      {isAdmin && (
        <Link href="/admin" className="lx-btn-secondary inline-flex">
          Open admin console
        </Link>
      )}
    </div>
  );
}
