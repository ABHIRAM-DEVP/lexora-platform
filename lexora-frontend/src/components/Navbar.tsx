"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { NavButtons } from "@/components/NavButtons";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/context/AuthContext";

export function Navbar() {
  const { user } = useAuth();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 30);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`fixed left-0 right-0 top-0 z-50 transition-all duration-300 ${
        scrolled
          ? "border-b border-[var(--lx-border)] bg-[var(--lx-panel)] shadow-sm backdrop-blur-xl"
          : "border-b border-transparent bg-[var(--lx-panel)]/60 backdrop-blur-md"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <div className="hidden items-center gap-3 md:flex">
          <NavButtons />
          <Link href="/" className="group flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--lx-primary)] to-indigo-950 shadow-md ring-1 ring-white/20" />
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight text-[var(--lx-text)] md:text-base">
                Lexora
              </span>
              <span className="text-[10px] font-medium uppercase tracking-[0.18em] text-[var(--lx-text-muted)]">
                Workspace platform
              </span>
            </div>
          </Link>
        </div>

        <nav className="flex items-center gap-2 md:gap-4">
          <Link
            href="/"
            className="hidden text-sm font-medium text-[var(--lx-text-muted)] hover:text-[var(--lx-primary)] sm:inline"
          >
            Home
          </Link>
          <Link
            href="/publications"
            className="hidden text-sm font-medium text-[var(--lx-text-muted)] hover:text-[var(--lx-primary)] sm:inline"
          >
            Publications
          </Link>
          <Link
            href="/login"
            className="text-sm font-medium text-[var(--lx-text-muted)] hover:text-[var(--lx-primary)]"
          >
            Login
          </Link>
          <ThemeToggle />
          {user ? (
            <Link href="/dashboard" className="lx-btn-primary !py-2 !text-xs md:!text-sm">
              Dashboard
            </Link>
          ) : (
            <Link href="/signup" className="lx-btn-primary !py-2 !text-xs md:!text-sm">
              Get started
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
