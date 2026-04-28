"use client";

import { ToastItem, ToastKind } from "@/context/ToastContext";
import { useEffect } from "react";

const ICON: Record<ToastKind, string> = {
  success: "✅",
  error: "⛔",
  warning: "⚠️",
  info: "ℹ️",
};

const STYLE: Record<ToastKind, string> = {
  success: "border-emerald-500/40 bg-emerald-500/10",
  error: "border-red-500/50 bg-red-500/10",
  warning: "border-amber-500/50 bg-amber-500/10",
  info: "border-sky-500/50 bg-sky-500/10",
};

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[200] flex max-w-sm flex-col gap-2">
      {toasts.map((t) => (
        <ToastRow key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastRow({
  toast,
  onDismiss,
}: {
  toast: ToastItem;
  onDismiss: (id: string) => void;
}) {
  useEffect(() => {
    const id = window.setTimeout(() => onDismiss(toast.id), 5000);
    return () => clearTimeout(id);
  }, [toast.id, onDismiss]);

  return (
    <div
      className={`pointer-events-auto flex items-start gap-3 rounded-xl border px-4 py-3 text-sm shadow-glass backdrop-blur-md ${STYLE[toast.kind]}`}
    >
      <span className="text-lg leading-none">{ICON[toast.kind]}</span>
      <p className="flex-1 text-slate-800 dark:text-slate-100">{toast.message}</p>
      <button
        type="button"
        className="text-slate-500 hover:text-slate-800 dark:hover:text-white"
        onClick={() => onDismiss(toast.id)}
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
