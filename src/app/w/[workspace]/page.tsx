import { Suspense } from "react";
import { listReports } from "@/app/actions/reports";
import { getWorkspacePublicBySlug } from "@/app/actions/workspaces";
import { CreateReportButton } from "@/components/CreateReportButton";
import { ReportList } from "@/components/ReportList";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { WorkspaceThemeShell } from "@/components/WorkspaceThemeShell";

async function WorkspaceHome({
  params,
}: {
  params: Promise<{ workspace: string }>;
}) {
  const { workspace: workspaceSlug } = await params;
  const workspaceResult = await getWorkspacePublicBySlug(workspaceSlug);

  if (!workspaceResult.ok) {
    return (
      <main className="missing-page">
        <p className="brand-mark">INNOSIGHT</p>
        <h1>워크스페이스를 찾을 수 없습니다</h1>
        <p className="lede">{workspaceResult.error}</p>
      </main>
    );
  }

  const { workspace } = workspaceResult;
  const result = await listReports(workspace.slug);

  return (
    <WorkspaceThemeShell theme={workspace.theme}>
      <main className="home">
        <header className="home-header">
          <div>
            <p className="brand-mark">INNOSIGHT</p>
            <h1>활동보고서</h1>
          </div>
          <CreateReportButton workspaceSlug={workspace.slug} />
        </header>

        <section className="home-list-section">
          {!result.ok ? (
            <p className="error-text">{result.error}</p>
          ) : (
            <ReportList
              workspaceSlug={workspace.slug}
              reports={result.reports}
            />
          )}
        </section>
        <ScrollToTopButton />
      </main>
    </WorkspaceThemeShell>
  );
}

export default function WorkspacePage(props: PageProps<"/w/[workspace]">) {
  return (
    <Suspense
      fallback={
        <main className="missing-page">
          <p className="brand-mark">INNOSIGHT</p>
          <h1>목록 불러오는 중…</h1>
        </main>
      }
    >
      <WorkspaceHome params={props.params} />
    </Suspense>
  );
}
