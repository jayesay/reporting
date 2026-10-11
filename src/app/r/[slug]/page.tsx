import { Suspense } from "react";
import Link from "next/link";
import { getReportBySlug } from "@/app/actions/reports";
import { ReportForm } from "@/components/ReportForm";

async function ReportContent({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const result = await getReportBySlug(slug);

  if (!result.ok) {
    return (
      <main className="missing-page">
        <p className="brand-mark">INNOSIGHT</p>
        <h1>보고서를 찾을 수 없습니다</h1>
        <p className="lede">{result.error}</p>
        <Link className="btn primary" href="/">
          홈으로
        </Link>
      </main>
    );
  }

  return (
    <main className="report-page">
      <ReportForm report={result.report} />
    </main>
  );
}

export default function ReportPage(props: PageProps<"/r/[slug]">) {
  return (
    <Suspense
      fallback={
        <main className="missing-page">
          <p className="brand-mark">INNOSIGHT</p>
          <h1>활동보고서 불러오는 중…</h1>
        </main>
      }
    >
      <ReportContent params={props.params} />
    </Suspense>
  );
}
