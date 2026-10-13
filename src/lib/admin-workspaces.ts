import { cookies } from "next/headers";
import { ADMIN_COOKIE, isValidAdminToken } from "@/lib/admin-auth";
import { hashSecret } from "@/lib/crypto-hash";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  isValidWorkspaceSlug,
  normalizeWorkspaceSlug,
} from "@/lib/types/workspace";
import {
  DEFAULT_WORKSPACE_THEME,
  isWorkspaceThemeId,
} from "@/lib/workspace-theme";

export async function hasAdminSession() {
  const cookieStore = await cookies();
  return isValidAdminToken(cookieStore.get(ADMIN_COOKIE)?.value);
}

function toTheme(value: unknown) {
  const raw = typeof value === "string" ? value : "";
  return isWorkspaceThemeId(raw) ? raw : DEFAULT_WORKSPACE_THEME;
}

export async function insertWorkspace(input: {
  slug: unknown;
  name: unknown;
  password: unknown;
  theme: unknown;
}): Promise<{ ok: true; slug: string } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "워크스페이스를 만들지 못했습니다." };
  }

  const slug = normalizeWorkspaceSlug(String(input.slug ?? ""));
  const name = String(input.name ?? "").trim();
  const password = String(input.password ?? "");
  const theme = toTheme(input.theme);

  if (!isValidWorkspaceSlug(slug)) {
    return {
      ok: false,
      error: "slug는 소문자·숫자·하이픈만, 2~32자로 입력하세요.",
    };
  }
  if (!name) {
    return { ok: false, error: "워크스페이스 이름을 입력하세요." };
  }
  if (password.length < 4) {
    return { ok: false, error: "비밀번호는 4자 이상으로 설정하세요." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("workspaces").insert({
      slug,
      name,
      password_hash: await hashSecret(password),
      theme,
    });

    if (error) {
      if (error.code === "23505") {
        return { ok: false, error: "이미 사용 중인 slug입니다." };
      }
      return { ok: false, error: error.message };
    }
    return { ok: true, slug };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "워크스페이스를 만들지 못했습니다.",
    };
  }
}

export async function setWorkspaceTheme(input: {
  workspaceId: unknown;
  theme: unknown;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "톤을 바꾸지 못했습니다." };
  }

  const workspaceId = String(input.workspaceId ?? "");
  if (!workspaceId) {
    return { ok: false, error: "워크스페이스를 찾을 수 없습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("workspaces")
      .update({ theme: toTheme(input.theme) })
      .eq("id", workspaceId);

    if (error) {
      return { ok: false, error: error.message };
    }
    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "톤을 바꾸지 못했습니다.",
    };
  }
}
