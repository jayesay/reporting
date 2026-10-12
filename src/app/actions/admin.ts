"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  createAdminToken,
  getAdminPassword,
  isValidAdminToken,
  verifyAdminPassword,
} from "@/lib/admin-auth";
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
  isWorkspaceThemeId,
  DEFAULT_WORKSPACE_THEME,
} from "@/lib/workspace-theme";
import { listWorkspaces } from "@/app/actions/workspaces";

export async function requireAdmin() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!(await isValidAdminToken(token))) {
    redirect("/admin/login");
  }
}

export async function loginAdmin(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  if (!getAdminPassword()) {
    return {
      error: "ADMIN_PASSWORD가 설정되지 않았습니다.",
    };
  }

  const password = String(formData.get("password") ?? "");
  const ok = await verifyAdminPassword(password);
  if (!ok) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  const token = await createAdminToken();
  const cookieStore = await cookies();
  // 세션 쿠키만 사용 (브라우저 종료 시 만료). 관리자 영역을 벗어나면 proxy에서 삭제.
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });

  redirect("/admin");
}

async function ensureAdminSession(): Promise<
  { ok: true } | { ok: false; error: string }
> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!(await isValidAdminToken(token))) {
    return { ok: false, error: "관리자 로그인이 필요합니다." };
  }
  return { ok: true };
}

export async function createWorkspace(
  _prev: { error: string | null; createdSlug: string | null },
  formData: FormData,
): Promise<{ error: string | null; createdSlug: string | null }> {
  const auth = await ensureAdminSession();
  if (!auth.ok) {
    return { error: auth.error, createdSlug: null };
  }

  if (!isSupabaseConfigured()) {
    return {
      error: "워크스페이스를 만들지 못했습니다.",
      createdSlug: null,
    };
  }

  const slug = normalizeWorkspaceSlug(String(formData.get("slug") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const themeRaw = String(formData.get("theme") ?? DEFAULT_WORKSPACE_THEME);
  const theme = isWorkspaceThemeId(themeRaw)
    ? themeRaw
    : DEFAULT_WORKSPACE_THEME;

  if (!isValidWorkspaceSlug(slug)) {
    return {
      error: "slug는 소문자·숫자·하이픈만, 2~32자로 입력하세요.",
      createdSlug: null,
    };
  }
  if (!name) {
    return { error: "워크스페이스 이름을 입력하세요.", createdSlug: null };
  }
  if (password.length < 4) {
    return {
      error: "비밀번호는 4자 이상으로 설정하세요.",
      createdSlug: null,
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const passwordHash = await hashSecret(password);
    const { error } = await supabase.from("workspaces").insert({
      slug,
      name,
      password_hash: passwordHash,
      theme,
    });

    if (error) {
      if (error.code === "23505") {
        return {
          error: "이미 사용 중인 slug입니다.",
          createdSlug: null,
        };
      }
      return { error: error.message, createdSlug: null };
    }

    return { error: null, createdSlug: slug };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "워크스페이스를 만들지 못했습니다.",
      createdSlug: null,
    };
  }
}

export async function adminListWorkspaces() {
  // 페이지 AdminGate에서 이미 인증함. 여기서 redirect 하면 soft refresh 시 500 가능.
  const auth = await ensureAdminSession();
  if (!auth.ok) {
    return { ok: false as const, error: auth.error };
  }
  return listWorkspaces();
}

export async function updateWorkspaceTheme(
  workspaceId: string,
  themeRaw: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const auth = await ensureAdminSession();
  if (!auth.ok) {
    return { ok: false, error: auth.error };
  }

  const theme = isWorkspaceThemeId(themeRaw)
    ? themeRaw
    : DEFAULT_WORKSPACE_THEME;

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "톤을 바꾸지 못했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("workspaces")
      .update({ theme })
      .eq("id", workspaceId);

    if (error) {
      if (
        error.message.includes("theme") ||
        error.code === "PGRST204" ||
        error.code === "42703"
      ) {
        return {
          ok: false,
          error:
            "theme 컬럼이 없습니다. Supabase에서 add_workspace_theme.sql을 실행하세요.",
        };
      }
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
