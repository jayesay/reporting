import { Suspense } from "react";
import Link from "next/link";
import { getReportBySlug } from "@/app/actions/reports";
import { getWorkspacePublicBySlug } from "@/app/actions/workspaces";
import { ReportForm } from "@/components/ReportForm";
import { workspaceHomePath } from "@/lib/paths";

async function ReportContent({
  params,
}: {
  params: Promise<{ workspace: string; slug: string }>;
}) {
  const { workspace: workspaceSlug, slug } = await params;
  const workspaceResult = await getWorkspacePublicBySlug(workspaceSlug);

  if (!workspaceResult.ok) {
    return (
      <main className="missing-page">
        <p className="brand-mark">REPORTING</p>
        <h1>워크스페이스를 찾을 수 없습니다</h1>
      </main>
    );
  }

  const { workspace } = workspaceResult;
  const result = await getReportBySlug(workspace.slug, slug);

  if (!result.ok) {
    return (
      <main className="missing-page">
        <p className="brand-mark">{workspace.name}</p>
        <h1>보고서를 찾을 수 없습니다</h1>
        <p className="lede">{result.error}</p>
        <Link className="btn primary" href={workspaceHomePath(workspace.slug)}>
          목록으로
        </Link>
      </main>
    );
  }

  return (
    <main className="report-page">
      <ReportForm
        workspaceSlug={workspace.slug}
        workspaceName={workspace.name}
        report={result.report}
      />
    </main>
  );
}

export default function ReportPage(
  props: PageProps<"/w/[workspace]/r/[slug]">,
) {
  return (
    <Suspense
      fallback={
        <main className="missing-page">
          <p className="brand-mark">REPORTING</p>
          <h1>활동보고서 불러오는 중…</h1>
        </main>
      }
    >
      <ReportContent params={props.params} />
    </Suspense>
  );
}
