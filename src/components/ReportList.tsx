import Link from "next/link";
import type { ReportListItem } from "@/app/actions/reports";
import { formatSeoulDateTime } from "@/lib/format-datetime";

type ReportListProps = {
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

export function ReportList({ reports }: ReportListProps) {
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
            <th>팀명</th>
            <th>작성자</th>
            <th>활동 주제</th>
            <th>상태</th>
            <th>최근 수정</th>
          </tr>
        </thead>
        <tbody>
          {reports.map((report) => (
            <tr key={report.slug}>
              <td>
                <Link href={`/r/${report.slug}`}>{formatMonth(report.report_month)}</Link>
              </td>
              <td>
                <Link href={`/r/${report.slug}`}>{cell(report.team_name)}</Link>
              </td>
              <td>
                <Link href={`/r/${report.slug}`}>{cell(report.author)}</Link>
              </td>
              <td className="topic-cell">
                <Link href={`/r/${report.slug}`}>{cell(report.topic)}</Link>
              </td>
              <td>
                <Link href={`/r/${report.slug}`}>
                  <span
                    className={`status-badge ${report.status === "done" ? "done" : "draft"}`}
                  >
                    {report.status === "done" ? "작성 완료" : "임시저장"}
                  </span>
                </Link>
              </td>
              <td>
                <Link href={`/r/${report.slug}`}>
                  <time dateTime={report.updated_at}>
                    {formatSeoulDateTime(report.updated_at)}
                  </time>
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
