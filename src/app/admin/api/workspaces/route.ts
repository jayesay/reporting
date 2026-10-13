import { hasAdminSession, insertWorkspace } from "@/lib/admin-workspaces";

export async function POST(request: Request) {
  if (!(await hasAdminSession())) {
    return Response.json(
      { ok: false, error: "관리자 로그인이 필요합니다." },
      { status: 401 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as Record<
    string,
    unknown
  >;
  const result = await insertWorkspace({
    slug: body.slug,
    name: body.name,
    password: body.password,
    theme: body.theme,
  });
  return Response.json(result, { status: result.ok ? 200 : 400 });
}
