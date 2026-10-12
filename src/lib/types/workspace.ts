import {
  DEFAULT_WORKSPACE_THEME,
  normalizeWorkspaceTheme,
  type WorkspaceThemeId,
} from "@/lib/workspace-theme";

export type Workspace = {
  id: string;
  slug: string;
  name: string;
  password_hash: string;
  theme: WorkspaceThemeId;
  created_at: string;
};

export type WorkspacePublic = {
  id: string;
  slug: string;
  name: string;
  theme: WorkspaceThemeId;
};

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function normalizeWorkspaceSlug(value: string) {
  return value.trim().toLowerCase();
}

export function isValidWorkspaceSlug(value: string) {
  const slug = normalizeWorkspaceSlug(value);
  return slug.length >= 2 && slug.length <= 32 && SLUG_RE.test(slug);
}

export function withWorkspaceTheme<T extends { theme?: unknown }>(
  row: T,
): T & { theme: WorkspaceThemeId } {
  return {
    ...row,
    theme: normalizeWorkspaceTheme(row.theme ?? DEFAULT_WORKSPACE_THEME),
  };
}
