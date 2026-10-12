import { Suspense } from "react";
import Link from "next/link";
import { getReportBySlug } from "@/app/actions/reports";
import { getWorkspacePublicBySlug } from "@/app/actions/workspaces";
import { ReportView } from "@/components/ReportView";
import { WorkspaceThemeShell } from "@/components/WorkspaceThemeShell";
import { workspaceHomePath } from "@/lib/paths";

async function ViewContent({
  params,
}: {
  params: Promise<{ workspace: string; slug: string }>;
}) {
  const { workspace: workspaceSlug, slug } = await params;
  const workspaceResult = await getWorkspacePublicBySlug(workspaceSlug);

  if (!workspaceResult.ok) {
    return (
      <main className="missing-page">
        <p className="brand-mark">INNOSIGHT</p>
        <h1>워크스페이스를 찾을 수 없습니다</h1>
      </main>
    );
  }

  const { workspace } = workspaceResult;
  const result = await getReportBySlug(workspace.slug, slug);

  if (!result.ok) {
    return (
      <WorkspaceThemeShell theme={workspace.theme}>
        <main className="missing-page">
          <p className="brand-mark">INNOSIGHT</p>
          <h1>보고서를 찾을 수 없습니다</h1>
          <p className="lede">{result.error}</p>
          <Link
            className="btn primary"
            href={workspaceHomePath(workspace.slug)}
          >
            목록으로
          </Link>
        </main>
      </WorkspaceThemeShell>
    );
  }

  return (
    <ReportView
      workspaceSlug={workspace.slug}
      workspaceName={workspace.name}
      theme={workspace.theme}
      report={result.report}
    />
  );
}

export default function ReportViewPage(
  props: PageProps<"/w/[workspace]/r/[slug]/view">,
) {
  return (
    <Suspense
      fallback={
        <main className="missing-page">
          <p className="brand-mark">INNOSIGHT</p>
          <h1>활동보고서 불러오는 중…</h1>
        </main>
      }
    >
      <ViewContent params={props.params} />
    </Suspense>
  );
}
