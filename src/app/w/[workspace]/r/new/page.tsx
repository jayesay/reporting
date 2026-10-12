import { Suspense } from "react";
import { getNewReportDefaults } from "@/app/actions/reports";
import { getWorkspacePublicBySlug } from "@/app/actions/workspaces";
import { ReportForm } from "@/components/ReportForm";

async function NewReportContent({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceSlug } = await params;
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
  const defaults = await getNewReportDefaults(workspace.slug);

  return (
    <main className="report-page">
      <ReportForm
        workspaceSlug={workspace.slug}
        workspaceName={workspace.name}
        defaultAttendees={defaults.attendees}
      />
    </main>
  );
}

export default function NewReportPage(
  props: PageProps<"/w/[workspace]/r/new">,
) {
  return (
    <Suspense
      fallback={
        <main className="missing-page">
          <p className="brand-mark">REPORTING</p>
          <h1>새 보고서 준비 중…</h1>
        </main>
      }
    >
      <NewReportContent params={props.params} />
    </Suspense>
  );
}
