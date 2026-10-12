"use server";

import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  isValidWorkspaceSlug,
  normalizeWorkspaceSlug,
  withWorkspaceTheme,
  type Workspace,
  type WorkspacePublic,
} from "@/lib/types/workspace";

function toPublic(row: Workspace): WorkspacePublic {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    theme: row.theme,
  };
}

export async function getWorkspaceBySlug(
  rawSlug: string,
): Promise<
  { ok: true; workspace: Workspace } | { ok: false; error: string }
> {
  const slug = normalizeWorkspaceSlug(rawSlug);
  if (!isValidWorkspaceSlug(slug)) {
    return { ok: false, error: "워크스페이스를 찾을 수 없습니다." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "워크스페이스를 불러오지 못했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("workspaces")
      .select("*")
      .eq("slug", slug)
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }
    if (!data) {
      return { ok: false, error: "워크스페이스를 찾을 수 없습니다." };
    }

    return {
      ok: true,
      workspace: withWorkspaceTheme(data as Omit<Workspace, "theme"> & { theme?: string }),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "워크스페이스를 불러오지 못했습니다.",
    };
  }
}

export async function getWorkspacePublicBySlug(
  rawSlug: string,
): Promise<
  { ok: true; workspace: WorkspacePublic } | { ok: false; error: string }
> {
  const result = await getWorkspaceBySlug(rawSlug);
  if (!result.ok) return result;
  return { ok: true, workspace: toPublic(result.workspace) };
}

export async function listWorkspaces(): Promise<
  { ok: true; workspaces: WorkspacePublic[] } | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "목록을 불러오지 못했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("workspaces")
      .select("id, slug, name, theme, created_at")
      .order("created_at", { ascending: true });

    if (error) {
      return { ok: false, error: error.message };
    }

    return {
      ok: true,
      workspaces: (data ?? []).map((row) =>
        toPublic(
          withWorkspaceTheme({
            id: row.id as string,
            slug: row.slug as string,
            name: row.name as string,
            password_hash: "",
            theme: row.theme,
            created_at: String(row.created_at ?? ""),
          }),
        ),
      ),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "목록을 불러오지 못했습니다.",
    };
  }
}
