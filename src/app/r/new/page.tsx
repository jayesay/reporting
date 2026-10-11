import { Suspense } from "react";
import { ReportForm } from "@/components/ReportForm";

export default function NewReportPage() {
  return (
    <Suspense
      fallback={
        <main className="missing-page">
          <p className="brand-mark">INNOSIGHT</p>
          <h1>새 보고서 준비 중…</h1>
        </main>
      }
    >
      <main className="report-page">
        <ReportForm />
      </main>
    </Suspense>
  );
}
