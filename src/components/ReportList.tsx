import Link from "next/link";
import type { ReportListItem } from "@/app/actions/reports";
import { formatSeoulDateTime } from "@/lib/format-datetime";
import { workspaceReportPath } from "@/lib/paths";

type ReportListProps = {
  workspaceSlug: string;
  reports: ReportListItem[];
};

function formatMonth(value: string) {
  if (!value) return "-";
  const [year, month] = value.split("-");
  if (!year || !month) return value;
  return `${year}.${month}`;
}

function cell(value: string, fallback = "-") {
  const text = value.trim();
  return text || fallback;
}

function topicSummary(report: ReportListItem) {
  const topics = report.journals
    .map((item) => item.topic.trim())
    .filter(Boolean);
  return topics.length > 0 ? topics.join(" · ") : "-";
}

export function ReportList({ workspaceSlug, reports }: ReportListProps) {
  if (reports.length === 0) {
    return (
      <div className="list-empty">
        <p>등록된 활동보고서가 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="report-table-wrap">
      <table className="report-table">
        <thead>
          <tr>
            <th>보고 월</th>
            <th>작성자</th>
            <th>활동 주제</th>
            <th>상태</th>
            <th>최근 수정</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => {
            const href = workspaceReportPath(workspaceSlug, report.slug);
            return (
              <tr key={report.slug}>
                <td>
                  <Link href={href}>{formatMonth(report.report_month)}</Link>
                </td>
                <td>
                  <Link href={href}>{cell(report.author)}</Link>
                </td>
                <td className="topic-cell">
                  <Link href={href}>{topicSummary(report)}</Link>
                </td>
                <td>
                  <Link href={href}>
                    <span
                      className={`status-badge ${report.status === "done" ? "done" : "draft"}`}
                    >
                      {report.status === "done" ? "작성 완료" : "임시저장"}
                    </span>
                  </Link>
                </td>
                <td className="updated-cell min-w-[13.5rem]">
                  <Link href={href} className="!overflow-visible whitespace-nowrap">
                    <time dateTime={report.updated_at}>
                      {formatSeoulDateTime(report.updated_at)}
                    </time>
                  </Link>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
