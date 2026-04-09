import { apiFetch, parseJson } from "@/lib/api";
import type { WorkspaceResponse } from "@/types/api";

export async function fetchActiveWorkspaces(): Promise<WorkspaceResponse[]> {
  const res = await apiFetch("/api/workspaces");
  if (res.status === 404) return [];
  if (!res.ok) {
    const err = await parseJson<{ error?: string; message?: string }>(res);
    throw new Error(err?.error ?? err?.message ?? "Could not load workspaces");
  }
  return (await res.json()) as WorkspaceResponse[];
}

export async function fetchDeletedWorkspaces(): Promise<WorkspaceResponse[]> {
  const res = await apiFetch("/api/workspaces/deleted");
  if (!res.ok) {
    const err = await parseJson<{ error?: string }>(res);
    throw new Error(err?.error ?? "Could not load deleted workspaces");
  }
  return res.json();
}
