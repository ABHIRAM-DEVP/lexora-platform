import type { ComponentType, SVGProps } from "react";

export type WorkspaceIcon = ComponentType<SVGProps<SVGSVGElement>>;

export type WorkspaceStyle = {
  iconId: string;
  color: string;
  label: string;
};

const STORAGE_KEY = "lexora_workspace_styles";

export function loadWorkspaceStyles(): Record<string, WorkspaceStyle> {
  if (typeof window === "undefined") return {};
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "{}") as Record<
      string,
      WorkspaceStyle
    >;
  } catch {
    return {};
  }
}

export function saveWorkspaceStyle(workspaceId: string, style: WorkspaceStyle) {
  if (typeof window === "undefined") return;
  const current = loadWorkspaceStyles();
  current[workspaceId] = style;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
}

export function getWorkspaceStyle(workspaceId: string): WorkspaceStyle | undefined {
  const current = loadWorkspaceStyles();
  return current[workspaceId];
}
