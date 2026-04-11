"use client";

import Link from "next/link";
import { Sidebar } from "@/components/Sidebar";
import { useAuth } from "@/context/AuthContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { NavButtons } from "@/components/NavButtons";
import { useTheme } from "@/context/ThemeContext";
import { ChevronDownIcon } from "@heroicons/react/24/outline";
import { useEffect, useRef, useState } from "react";

function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = globalThis.setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return now;
}

export function AppShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, logout } = useAuth();
  const { setTheme } = useTheme();
  const now = useClock();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("click", close);
    return () => document.removeEventListener("click", close);
  }, []);

  const initials =
    user?.username
      ?.split(/\s+/)
      .map((s) => s[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() ?? "?";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_rgba(30,79,216,0.14),transparent_55%),radial-gradient(ellipse_at_bottom,_rgba(201,162,39,0.08),transparent_50%)]">
      <header className="sticky top-0 z-40 border-b border-[var(--lx-border)] bg-[var(--lx-panel)]/85 px-4 py-3 backdrop-blur-xl md:px-8">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <NavButtons />
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[var(--lx-text-muted)]">
                Lexora command centre
              </p>
              <h1 className="text-lg font-semibold text-[var(--lx-text)]">
                Console
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] px-3 py-1.5 text-xs text-[var(--lx-text-muted)]">
              <span className="font-medium text-[var(--lx-text)]">Local time</span>
              <span className="ml-2 tabular-nums text-[var(--lx-text-muted)]">
                {now.toLocaleTimeString(undefined, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </span>
            </div>
            <Link
              href="/dashboard"
              className="lx-btn-secondary !border-[var(--lx-border)] !py-2 !text-xs"
            >
              Overview
            </Link>

            <div className="relative" ref={ref}>
              <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-2 rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] py-1.5 pl-1.5 pr-3 shadow-sm"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--lx-primary)] to-indigo-900 text-xs font-bold text-white">
                  {initials}
                </span>
                <div className="hidden text-left sm:block">
                  <p className="max-w-[140px] truncate text-sm font-medium text-[var(--lx-text)]">
                    {user?.username}
                  </p>
                  <p className="text-[10px] uppercase tracking-wider text-[var(--lx-text-muted)]">
                    {user?.role ?? "Member"}
                  </p>
                </div>
                <ChevronDownIcon className="h-4 w-4 text-[var(--lx-text-muted)]" />
              </button>

              {open && (
                <div className="absolute right-0 mt-2 w-64 overflow-hidden rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel)]/95 p-3 shadow-glass backdrop-blur-xl">
                  <p className="border-b border-[var(--lx-border)] pb-2 text-xs text-[var(--lx-text-muted)]">
                    Signed in as{" "}
                    <span className="font-medium text-[var(--lx-text)]">
                      {user?.username}
                    </span>
                  </p>
                  <Link
                    href="/dashboard/settings"
                    className="mt-2 block rounded-xl px-2 py-2 text-sm hover:bg-[var(--lx-border)]/50"
                    onClick={() => setOpen(false)}
                  >
                    Settings
                  </Link>
                  <div className="mt-2 flex items-center justify-between rounded-xl px-2 py-2">
                    <span className="text-sm text-[var(--lx-text)]">Theme</span>
                    <ThemeToggle />
                  </div>
                  <div className="mt-1 flex gap-2 text-[10px]">
                    <button
                      type="button"
                      className="lx-btn-secondary flex-1 !py-1"
                      onClick={() => setTheme("light")}
                    >
                      Light
                    </button>
                    <button
                      type="button"
                      className="lx-btn-secondary flex-1 !py-1"
                      onClick={() => setTheme("dark")}
                    >
                      Dark
                    </button>
                  </div>
                  <button
                    type="button"
                    className="lx-btn-danger mt-3 w-full !justify-center"
                    onClick={() => {
                      setOpen(false);
                      logout();
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1400px] gap-0 md:gap-2">
        <Sidebar />
        <main className="min-h-[calc(100vh-88px)] flex-1 px-4 py-8 md:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
