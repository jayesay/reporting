import { Suspense } from "react";
import { getWorkspacePublicBySlug } from "@/app/actions/workspaces";
import { LoginForm } from "@/components/LoginForm";
import { WorkspaceThemeShell } from "@/components/WorkspaceThemeShell";
import { workspaceHomePath } from "@/lib/paths";

async function LoginContent({
  params,
  searchParams,
}: {
  params: Promise<{ workspace: string }>;
  searchParams: Promise<{ next?: string }>;
}) {
  const { workspace: workspaceSlug } = await params;
  const query = await searchParams;
  const workspaceResult = await getWorkspacePublicBySlug(workspaceSlug);

  if (!workspaceResult.ok) {
    return (
      <main className="login-page">
        <div className="login-card">
          <p className="brand-mark">REPORTING</p>
          <h1>워크스페이스 없음</h1>
          <p className="lede tight">{workspaceResult.error}</p>
        </div>
      </main>
    );
  }

  const { workspace } = workspaceResult;
  const fallback = workspaceHomePath(workspace.slug);
  const nextPath =
    query.next &&
    query.next.startsWith(`/w/${workspace.slug}`) &&
    !query.next.startsWith("//")
      ? query.next
      : fallback;

  return (
    <WorkspaceThemeShell theme={workspace.theme}>
      <main className="login-page">
        <div className="login-card">
          <p className="brand-mark">{workspace.name}</p>
          <h1>활동보고서</h1>
          <p className="lede tight">워크스페이스 비밀번호를 입력해 주세요.</p>
          <LoginForm workspaceSlug={workspace.slug} nextPath={nextPath} />
        </div>
      </main>
    </WorkspaceThemeShell>
  );
}

export default function WorkspaceLoginPage(
  props: PageProps<"/w/[workspace]/login">,
) {
  return (
    <Suspense
      fallback={
        <main className="login-page">
          <div className="login-card">
            <p className="brand-mark">REPORTING</p>
            <h1>활동보고서</h1>
          </div>
        </main>
      }
    >
      <LoginContent params={props.params} searchParams={props.searchParams} />
    </Suspense>
  );
}
