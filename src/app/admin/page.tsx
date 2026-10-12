import Link from "next/link";
import { Suspense, type ReactNode } from "react";
import { adminListWorkspaces, requireAdmin } from "@/app/actions/admin";
import { CreateWorkspaceForm } from "@/components/CreateWorkspaceForm";
import { WorkspaceThemeSelect } from "@/components/WorkspaceThemeSelect";
import { workspaceHomePath } from "@/lib/paths";

async function AdminGate({ children }: { children: ReactNode }) {
  await requireAdmin();
  return children;
}

async function AdminWorkspaceList() {
  const result = await adminListWorkspaces();

  return (
    <section className="section">
      <h2>발급된 워크스페이스</h2>
      {!result.ok ? (
        <p className="error-text">{result.error}</p>
      ) : result.workspaces.length === 0 ? (
        <p className="list-empty">아직 없습니다. 위에서 추가하세요.</p>
      ) : (
        <div className="report-table-wrap">
          <table className="report-table">
            <thead>
              <tr>
                <th>이름</th>
                <th>slug</th>
                <th>톤</th>
                <th>링크</th>
              </tr>
            </thead>
            <tbody>
              {result.workspaces.map((workspace) => (
                <tr key={workspace.id}>
                  <td>{workspace.name}</td>
                  <td>
                    <code>{workspace.slug}</code>
                  </td>
                  <td>
                    <WorkspaceThemeSelect
                      workspaceId={workspace.id}
                      theme={workspace.theme}
                    />
                  </td>
                  <td>
                    <Link href={workspaceHomePath(workspace.slug)}>
                      /w/{workspace.slug}
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default function AdminPage() {
  return (
    <Suspense
      fallback={
        <main className="missing-page">
          <p className="brand-mark">ADMIN</p>
          <h1>불러오는 중…</h1>
        </main>
      }
    >
      <AdminGate>
        <main className="home admin-page">
          <header className="home-header">
            <div>
              <p className="brand-mark">ADMIN</p>
              <h1>워크스페이스 관리</h1>
            </div>
            <Link href="/" className="btn ghost">
              사이트 홈
            </Link>
          </header>

          <section className="section admin-create-section">
            <CreateWorkspaceForm />
          </section>

          <Suspense
            fallback={<p className="list-empty">목록을 불러오는 중…</p>}
          >
            <AdminWorkspaceList />
          </Suspense>
        </main>
      </AdminGate>
    </Suspense>
  );
}
