import { Suspense } from "react";
import { getNewReportDefaults } from "@/app/actions/reports";
import { ReportForm } from "@/components/ReportForm";

async function NewReportContent() {
  const defaults = await getNewReportDefaults();

  return (
    <main className="report-page">
      <ReportForm
        defaultTeamName={defaults.teamName}
        defaultAttendees={defaults.attendees}
      />
    </main>
  );
}

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
      <NewReportContent />
    </Suspense>
  );
}
