"use client";

export function ActivityFilters({
  action,
  entityType,
  onAction,
  onEntity,
  page,
  onPage,
}: {
  action: string;
  entityType: string;
  onAction: (v: string) => void;
  onEntity: (v: string) => void;
  page: number;
  onPage: (p: number) => void;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <div>
        <label className="mb-1 block text-xs text-[var(--lx-text-muted)]">
          Action
        </label>
        <input
          className="lx-input w-40"
          placeholder="Filter action"
          value={action}
          onChange={(e) => onAction(e.target.value)}
        />
      </div>
      <div>
        <label className="mb-1 block text-xs text-[var(--lx-text-muted)]">
          Entity type
        </label>
        <input
          className="lx-input w-40"
          placeholder="e.g. NOTE"
          value={entityType}
          onChange={(e) => onEntity(e.target.value)}
        />
      </div>
      <div className="flex items-center gap-2 pb-1">
        <button
          type="button"
          className="lx-btn-secondary !py-1.5 !text-xs"
          disabled={page <= 0}
          onClick={() => onPage(page - 1)}
        >
          Prev page
        </button>
        <span className="text-xs text-[var(--lx-text-muted)]">Page {page + 1}</span>
        <button
          type="button"
          className="lx-btn-secondary !py-1.5 !text-xs"
          onClick={() => onPage(page + 1)}
        >
          Next page
        </button>
      </div>
    </div>
  );
}
