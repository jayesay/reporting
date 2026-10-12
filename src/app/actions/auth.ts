"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  createWorkspaceToken,
  encodeWorkspaceCookie,
  verifyWorkspacePassword,
  WORKSPACE_COOKIE,
} from "@/lib/workspace-auth";
import { workspaceHomePath } from "@/lib/paths";
import { getWorkspaceBySlug } from "@/app/actions/workspaces";

export async function loginWithPassword(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const workspaceSlug = String(formData.get("workspace") ?? "");
  const password = String(formData.get("password") ?? "");
  const nextPath = String(formData.get("next") ?? "");

  const workspaceResult = await getWorkspaceBySlug(workspaceSlug);
  if (!workspaceResult.ok) {
    return { error: workspaceResult.error };
  }

  const { workspace } = workspaceResult;
  const ok = await verifyWorkspacePassword(password, workspace.password_hash);
  if (!ok) {
    return { error: "비밀번호가 올바르지 않습니다." };
  }

  const token = await createWorkspaceToken(workspace.slug, workspace.password_hash);
  const cookieStore = await cookies();
  cookieStore.set(WORKSPACE_COOKIE, encodeWorkspaceCookie(workspace.slug, token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });

  const fallback = workspaceHomePath(workspace.slug);
  const safeNext =
    nextPath.startsWith(`/w/${workspace.slug}`) && !nextPath.startsWith("//")
      ? nextPath
      : fallback;

  redirect(safeNext);
}
