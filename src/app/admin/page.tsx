import Link from "next/link";
import { Suspense } from "react";
import { adminListWorkspaces, requireAdmin } from "@/app/actions/admin";
import { CreateWorkspaceForm } from "@/components/CreateWorkspaceForm";
import { workspaceHomePath } from "@/lib/paths";

async function AdminContent() {
  await requireAdmin();
  const result = await adminListWorkspaces();

  return (
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
    </main>
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
      <AdminContent />
    </Suspense>
  );
}
