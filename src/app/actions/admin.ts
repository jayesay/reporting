"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  ADMIN_COOKIE,
  createAdminToken,
  getAdminPassword,
  verifyAdminPassword,
} from "@/lib/admin-auth";
import { hasAdminSession } from "@/lib/admin-workspaces";
import { listWorkspaces } from "@/app/actions/workspaces";

export async function requireAdmin() {
  if (!(await hasAdminSession())) {
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

export async function adminListWorkspaces() {
  if (!(await hasAdminSession())) {
    return { ok: false as const, error: "관리자 로그인이 필요합니다." };
  }
  return listWorkspaces();
}
