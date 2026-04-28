import type { WorkspaceMemberSummary, WorkspaceResponse } from "@/types/api";

export function isWorkspaceOwner(userId: string | undefined, workspace: WorkspaceResponse | null): boolean {
  return Boolean(userId && workspace?.ownerId === userId);
}

export function isWorkspaceAdmin(member?: WorkspaceMemberSummary | null): boolean {
  return member?.role === "ADMIN";
}

export function isWorkspaceOwnerOrAdmin(
  userId: string | undefined,
  workspace: WorkspaceResponse | null,
  currentMember?: WorkspaceMemberSummary | null,
): boolean {
  return isWorkspaceOwner(userId, workspace) || isWorkspaceAdmin(currentMember);
}

export function workspaceRoleLabel(
  userId: string | undefined,
  workspace: WorkspaceResponse | null,
  currentMember?: WorkspaceMemberSummary | null,
): string {
  if (isWorkspaceOwner(userId, workspace)) return "Owner workspace";
  if (isWorkspaceAdmin(currentMember)) return "Admin workspace";
  return "Shared workspace";
}
