"use client";

import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/context/AuthContext";
import { ArrowPathIcon } from "@heroicons/react/24/outline";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace(`/login?next=${encodeURIComponent(pathname ?? "/dashboard")}`);
    }
  }, [user, loading, router, pathname]);

  if (loading || !user) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-[var(--lx-paper)]">
        <ArrowPathIcon className="h-10 w-10 animate-spin text-[var(--lx-primary)]" />
        <p className="mt-4 text-sm text-[var(--lx-text-muted)]">Checking session…</p>
      </div>
    );
  }

  return <AppShell>{children}</AppShell>;
}
