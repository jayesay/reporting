"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  AUTH_COOKIE,
  createAuthToken,
  getSitePassword,
  verifySitePassword,
} from "@/lib/site-auth";

export async function loginWithPassword(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  if (!getSitePassword()) {
    return { error: "사이트 비밀번호가 설정되지 않았습니다." };
  }

  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "/");
  const safeNext =
    nextPath.startsWith("/") && !nextPath.startsWith("//") ? nextPath : "/";

  const ok = await verifySitePassword(password);
  if (!ok) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  const token = await createAuthToken();
  const cookieStore = await cookies();
  cookieStore.set(AUTH_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  redirect(safeNext);
}
