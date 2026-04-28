"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  ArrowLeftOnRectangleIcon,
  Bars3BottomLeftIcon,
  Cog6ToothIcon,
  DocumentTextIcon,
  HomeModernIcon,
  NewspaperIcon,
  RectangleStackIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/dashboard", label: "Dashboard", icon: HomeModernIcon },
  { href: "/dashboard/workspaces", label: "Workspaces", icon: RectangleStackIcon },
  { href: "/dashboard/notes", label: "Content", icon: DocumentTextIcon },
  { href: "/dashboard/publish", label: "Publish", icon: NewspaperIcon },
  { href: "/dashboard/settings", label: "Settings", icon: Cog6ToothIcon },
];

const SB_KEY = "lexora_sidebar_collapsed";

export function Sidebar() {
  const pathname = usePathname();
  const { isAdmin } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    setCollapsed(localStorage.getItem(SB_KEY) === "1");
  }, []);

  const toggle = () => {
    const next = !collapsed;
    setCollapsed(next);
    localStorage.setItem(SB_KEY, next ? "1" : "0");
  };

  const width = collapsed ? "w-[92px]" : "w-[290px]";

  const linkCls = (href: string) => {
    const active =
      pathname === href || (href !== "/dashboard" && pathname.startsWith(href));
    return `flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium transition ${
      active
        ? "bg-[var(--lx-primary)]/15 text-[var(--lx-primary)] ring-1 ring-[var(--lx-primary)]/25"
        : "text-[var(--lx-text-muted)] hover:bg-[var(--lx-border)]/40 hover:text-[var(--lx-text)]"
    }`;
  };

  return (
    <aside
      className={`sticky top-[73px] hidden h-[calc(100vh-88px)] shrink-0 flex-col border-r border-[var(--lx-border)] bg-[var(--lx-panel)]/80 py-6 backdrop-blur-md md:flex ${width} transition-[width] duration-300`}
    >
      <div className={`mb-4 flex px-3 ${collapsed ? "justify-center" : "justify-end"}`}>
        <button
          type="button"
          onClick={toggle}
          className="flex items-center gap-2 rounded-full border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] px-3 py-1 text-xs font-medium text-[var(--lx-text-muted)] shadow-sm hover:border-[var(--lx-primary)]/30"
        >
          <Bars3BottomLeftIcon className="h-4 w-4" />
          {!collapsed && <span>Open / Fold</span>}
        </button>
      </div>

      <nav className="flex flex-1 flex-col gap-1 px-2">
        {NAV.map(({ href, label, icon: Icon }) => (
          <Link key={href} href={href} className={linkCls(href)} title={label}>
            <Icon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </Link>
        ))}
        {isAdmin && (
          <Link href="/admin" className={linkCls("/admin")} title="Admin">
            <ShieldCheckIcon className="h-5 w-5 shrink-0" />
            {!collapsed && <span>Admin</span>}
          </Link>
        )}
      </nav>

      <div className="mt-auto px-2 pt-4">
        <div className="lx-card !p-4">
          <p className={`text-xs font-semibold text-[var(--lx-text)] ${collapsed ? "sr-only" : ""}`}>
            Public library
          </p>
          {!collapsed && (
            <>
              <p className="mt-1 text-[11px] leading-relaxed text-[var(--lx-text-muted)]">
                Browse published articles. Workspace IDs stay hidden — context is
                auto-managed for readers.
              </p>
              <Link
                href="/publications"
                className="lx-btn-secondary mt-3 w-full !py-2 !text-xs"
              >
                Open publications
              </Link>
            </>
          )}
          {collapsed && (
            <Link
              href="/publications"
              className="mt-2 flex justify-center text-[var(--lx-primary)]"
              title="Publications"
            >
              <ArrowLeftOnRectangleIcon className="h-5 w-5 rotate-180" />
            </Link>
          )}
        </div>
      </div>
    </aside>
  );
}
