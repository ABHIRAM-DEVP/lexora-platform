"use client";

import {
  createContext,
  useCallback,
  useContext,
  useState,
} from "react";
import { ToastStack } from "@/components/Toast";

export type ToastKind = "success" | "error" | "warning" | "info";

export type ToastItem = {
  id: string;
  kind: ToastKind;
  message: string;
};

type Ctx = {
  push: (kind: ToastKind, message: string) => void;
};

const ToastCtx = createContext<Ctx | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((kind: ToastKind, message: string) => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, kind, message }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <ToastStack toasts={toasts} onDismiss={dismiss} />
    </ToastCtx.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error("useToast needs ToastProvider");
  return ctx;
}
