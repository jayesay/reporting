import { Suspense } from "react";
import { listReports } from "@/app/actions/reports";
import { CreateReportButton } from "@/components/CreateReportButton";
import { ReportList } from "@/components/ReportList";

async function HomeList() {
  const result = await listReports();

  if (!result.ok) {
    return <p className="error-text">{result.error}</p>;
  }

  return <ReportList reports={result.reports} />;
}

export default function HomePage() {
  return (
    <main className="home">
      <header className="home-header">
        <div>
          <p className="brand-mark">INNOSIGHT</p>
          <h1>활동보고서</h1>
        </div>
        <CreateReportButton />
      </header>

      <section className="home-list-section">
        <Suspense fallback={<p className="list-loading">목록 불러오는 중…</p>}>
          <HomeList />
        </Suspense>
      </section>
    </main>
  );
}
