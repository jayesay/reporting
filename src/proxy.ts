import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  ADMIN_COOKIE,
  getAdminPassword,
  isValidAdminToken,
} from "@/lib/admin-auth";
import {
  decodeWorkspaceCookie,
  isValidWorkspaceToken,
  WORKSPACE_COOKIE,
} from "@/lib/workspace-auth";
import { createSupabaseServerClient, isSupabaseConfigured } from "@/lib/supabase/server";

async function loadWorkspacePasswordHash(slug: string) {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("workspaces")
      .select("password_hash")
      .eq("slug", slug)
      .maybeSingle();
    if (error || !data) return null;
    return String(data.password_hash ?? "");
  } catch {
    return null;
  }
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // 관리자
  if (pathname === "/admin/login") {
    return NextResponse.next();
  }

  if (pathname === "/admin" || pathname.startsWith("/admin/")) {
    if (!getAdminPassword()) {
      return NextResponse.next();
    }
    const adminToken = request.cookies.get(ADMIN_COOKIE)?.value;
    if (await isValidAdminToken(adminToken)) {
      return NextResponse.next();
    }
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/admin/login";
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // 워크스페이스
  const workspaceMatch = pathname.match(/^\/w\/([^/]+)(\/.*)?$/);
  if (workspaceMatch) {
    const workspaceSlug = workspaceMatch[1];
    const rest = workspaceMatch[2] ?? "";

    if (rest === "/login" || rest.startsWith("/login?")) {
      return NextResponse.next();
    }

    const passwordHash = await loadWorkspacePasswordHash(workspaceSlug);
    if (!passwordHash) {
      // 없는 워크스페이스는 페이지에서 처리
      return NextResponse.next();
    }

    const raw = request.cookies.get(WORKSPACE_COOKIE)?.value;
    const parsed = decodeWorkspaceCookie(raw);
    if (
      parsed &&
      parsed.slug === workspaceSlug &&
      (await isValidWorkspaceToken(parsed.token, workspaceSlug, passwordHash))
    ) {
      return NextResponse.next();
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/w/${workspaceSlug}/login`;
    loginUrl.searchParams.set("next", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
