"use client";

import type { WorkspaceResponse } from "@/types/api";

export function WorkspaceSelector({
  workspaces,
  value,
  onChange,
  loading,
}: {
  workspaces: WorkspaceResponse[];
  value: string;
  onChange: (id: string) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium uppercase tracking-wide text-[var(--lx-text-muted)]">
        Workspace
      </label>
      <select
        className="lx-input max-w-md"
        value={value}
        disabled={loading || workspaces.length === 0}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {workspaces.length === 0 ? "No workspaces" : "Select workspace"}
        </option>
        {workspaces.map((w) => (
          <option key={w.id} value={w.id}>
            {w.name}
          </option>
        ))}
      </select>
    </div>
  );
}
