"use client";

import { ArrowLeftIcon, ArrowRightIcon } from "@heroicons/react/24/outline";
import { useCallback, useEffect, useState } from "react";

export function NavButtons() {
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);

  useEffect(() => {
    setCanGoBack(globalThis.history.length > 1);
    setCanGoForward(false);
  }, []);

  const goBack = useCallback(() => globalThis.history.back(), []);
  const goForward = useCallback(() => globalThis.history.forward(), []);

  return (
    <div className="flex items-center gap-2 rounded-2xl border border-[var(--lx-border)] bg-[var(--lx-panel-solid)] p-1 text-[var(--lx-text-muted)] shadow-sm">
      <button
        type="button"
        onClick={goBack}
        disabled={!canGoBack}
        className={`rounded-xl p-2 transition hover:bg-[var(--lx-border)]/60 hover:text-[var(--lx-text)] ${
          canGoBack ? "" : "cursor-not-allowed opacity-50"
        }`}
        aria-label="Go back"
      >
        <ArrowLeftIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={goForward}
        disabled={!canGoForward}
        className={`rounded-xl p-2 transition hover:bg-[var(--lx-border)]/60 hover:text-[var(--lx-text)] ${
          canGoForward ? "" : "cursor-not-allowed opacity-50"
        }`}
        aria-label="Go forward"
      >
        <ArrowRightIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
