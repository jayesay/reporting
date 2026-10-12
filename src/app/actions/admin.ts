"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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
  cookieStore.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect("/admin");
}

export async function createWorkspace(
  _prev: { error: string | null; createdSlug: string | null },
  formData: FormData,
): Promise<{ error: string | null; createdSlug: string | null }> {
  await requireAdmin();

  if (!isSupabaseConfigured()) {
    return {
      error: "워크스페이스를 만들지 못했습니다.",
      createdSlug: null,
    };
  }

  const slug = normalizeWorkspaceSlug(String(formData.get("slug") ?? ""));
  const name = String(formData.get("name") ?? "").trim();
  const password = String(formData.get("password") ?? "");

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

    revalidatePath("/admin");
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
  await requireAdmin();
  return listWorkspaces();
}
