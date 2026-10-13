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
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";

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

function clearAdminCookie(response: NextResponse) {
  response.cookies.set(ADMIN_COOKIE, "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}

/**
 * 관리자 화면에서 보낸 링크 prefetch(fetch 요청)도 이 proxy를 거친다.
 * 그때 쿠키를 지우면 관리자 화면의 다음 요청이 로그인으로 튕기므로,
 * 브라우저가 실제로 다른 페이지 문서를 열 때만 지운다.
 */
function isDocumentNavigation(request: NextRequest) {
  return request.headers.get("sec-fetch-dest") === "document";
}

function withAdminCleared(
  request: NextRequest,
  response: NextResponse,
) {
  if (request.cookies.get(ADMIN_COOKIE)?.value && isDocumentNavigation(request)) {
    return clearAdminCookie(response);
  }
  return response;
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
      return withAdminCleared(request, NextResponse.next());
    }

    const passwordHash = await loadWorkspacePasswordHash(workspaceSlug);
    if (!passwordHash) {
      return withAdminCleared(request, NextResponse.next());
    }

    const raw = request.cookies.get(WORKSPACE_COOKIE)?.value;
    const parsed = decodeWorkspaceCookie(raw);
    if (
      parsed &&
      parsed.slug === workspaceSlug &&
      (await isValidWorkspaceToken(parsed.token, workspaceSlug, passwordHash))
    ) {
      return withAdminCleared(request, NextResponse.next());
    }

    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = `/w/${workspaceSlug}/login`;
    loginUrl.searchParams.set("next", pathname);
    return withAdminCleared(request, NextResponse.redirect(loginUrl));
  }

  // 그 외 경로: 관리자 쿠키 제거 → 다음에 /admin 들어가면 다시 비밀번호 입력
  return withAdminCleared(request, NextResponse.next());
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
