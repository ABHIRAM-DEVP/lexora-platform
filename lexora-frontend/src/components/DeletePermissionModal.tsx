"use client";

import { useState } from "react";

const REASONS = [
  { id: "unused", label: "Workspace is no longer needed" },
  { id: "duplicate", label: "Duplicate or test workspace" },
  { id: "restructure", label: "Reorganizing content elsewhere" },
];

export function DeletePermissionModal({
  open,
  workspaceName,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  workspaceName: string;
  onCancel: () => void;
  onConfirm: (reason: string) => void;
}) {
  const [reason, setReason] = useState(REASONS[0]?.id ?? "");

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="lx-card max-w-lg">
        <h2 className="text-lg font-semibold text-[var(--lx-text)]">
          Delete workspace?
        </h2>
        <p className="mt-2 text-sm text-[var(--lx-text-muted)]">
          <span className="font-medium text-[var(--lx-text)]">{workspaceName}</span>{" "}
          will be hidden from your active list. Members lose access until you
          restore it. This is a soft delete — you can still recover from the
          deleted panel.
        </p>
        <fieldset className="mt-4 space-y-2">
          <legend className="text-xs font-medium uppercase tracking-wide text-[var(--lx-text-muted)]">
            Reason
          </legend>
          {REASONS.map((r) => (
            <label
              key={r.id}
              className="flex cursor-pointer items-center gap-2 rounded-xl border border-[var(--lx-border)] px-3 py-2 text-sm hover:bg-[var(--lx-border)]/30"
            >
              <input
                type="radio"
                name="del-reason"
                checked={reason === r.id}
                onChange={() => setReason(r.id)}
              />
              {r.label}
            </label>
          ))}
        </fieldset>
        <div className="mt-6 flex gap-3">
          <button type="button" className="lx-btn-secondary flex-1" onClick={onCancel}>
            Keep workspace
          </button>
          <button
            type="button"
            className="lx-btn-danger flex-1"
            onClick={() => onConfirm(reason)}
            disabled={!reason}
          >
            Delete workspace
          </button>
        </div>
      </div>
    </div>
  );
}
