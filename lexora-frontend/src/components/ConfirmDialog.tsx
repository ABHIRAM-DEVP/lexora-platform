"use client";

type Variant = "danger" | "warning" | "info";

const BTN: Record<Variant, string> = {
  danger: "lx-btn-danger",
  warning: "lx-btn-gold !text-slate-900",
  info: "lx-btn-primary",
};

const ICON: Record<Variant, string> = {
  danger: "🔥",
  warning: "⚠️",
  info: "ℹ️",
};

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel,
  variant = "info",
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  variant?: Variant;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/45 p-4 backdrop-blur-sm">
      <div className="lx-card max-w-md">
        <div className="mb-3 text-center text-4xl">{ICON[variant]}</div>
        <h2 className="text-center text-lg font-semibold text-[var(--lx-text)]">
          {title}
        </h2>
        <p className="mt-2 text-center text-sm text-[var(--lx-text-muted)]">
          {message}
        </p>
        <div className="mt-6 flex gap-3">
          <button type="button" className="lx-btn-secondary flex-1" onClick={onCancel}>
            Cancel
          </button>
          <button
            type="button"
            className={`${BTN[variant]} flex-1`}
            onClick={onConfirm}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
