import Link from "next/link";
import { Suspense } from "react";
import { listGrantExpenses } from "@/app/actions/expenses";
import { getWorkspacePublicBySlug } from "@/app/actions/workspaces";
import { ExpenseLedger } from "@/components/ExpenseLedger";
import { WorkspaceThemeShell } from "@/components/WorkspaceThemeShell";
import { workspaceHomePath } from "@/lib/paths";

async function ExpensesContent({
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
  const result = await listGrantExpenses(workspace.slug);

  return (
    <WorkspaceThemeShell theme={workspace.theme}>
      <main className="home">
        <Link href={workspaceHomePath(workspace.slug)} className="back-link">
          ← 목록으로
        </Link>
        <header className="home-header">
          <div>
            <p className="brand-mark">INNOSIGHT</p>
            <h1>지원금 지출 내역</h1>
          </div>
        </header>

        {!result.ok ? (
          <p className="error-text">{result.error}</p>
        ) : (
          <ExpenseLedger
            workspaceSlug={workspace.slug}
            initialExpenses={result.expenses}
          />
        )}
      </main>
    </WorkspaceThemeShell>
  );
}

export default function ExpensesPage(
  props: PageProps<"/w/[workspace]/expenses">,
) {
  return (
    <Suspense
      fallback={
        <main className="missing-page">
          <p className="brand-mark">INNOSIGHT</p>
          <h1>지원금 지출 내역 불러오는 중…</h1>
        </main>
      }
    >
      <ExpensesContent params={props.params} />
    </Suspense>
  );
}
