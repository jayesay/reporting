import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import {
  AUTH_COOKIE,
  getSitePassword,
  isValidAuthToken,
} from "@/lib/site-auth";

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  if (pathname === "/login") {
    return NextResponse.next();
  }

  if (!getSitePassword()) {
    return NextResponse.next();
  }

  const token = request.cookies.get(AUTH_COOKIE)?.value;
  if (await isValidAuthToken(token)) {
    return NextResponse.next();
  }

  const loginUrl = request.nextUrl.clone();
  loginUrl.pathname = "/login";
  loginUrl.searchParams.set("next", pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
