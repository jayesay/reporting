"use client";

import Link from "next/link";
import { useEffect, useState, type CSSProperties } from "react";
import { OrientedImage } from "@/components/OrientedImage";
import {
  filledLines,
  formatDate,
  formatSessionMeetingLine,
  formatYearMonth,
  hasText,
} from "@/lib/report-format";
import { REPORT_VIEW_CSS } from "@/lib/report-view-styles";
import {
  journalHasContent,
  nextPlanHasContent,
  type AiServiceEntry,
  type DeliverableImage,
  type Report,
} from "@/lib/types/report";
import {
  loadPhotosByJournal,
  type PhotosByJournal,
} from "@/lib/view-photos";
import {
  themeCssVars,
  type WorkspaceThemeId,
} from "@/lib/workspace-theme";

type ReportViewProps = {
  workspaceSlug: string;
  workspaceName: string;
  theme: WorkspaceThemeId;
  report: Report;
};

type InfoRow = {
  label: string;
  value: string;
  stacked?: boolean;
  images?: DeliverableImage[];
};

function filledAiServices(items: AiServiceEntry[]) {
  return items.filter(
    (item) =>
      [item.serviceName, item.users, item.usage, item.relevance].some(hasText) ||
      (item.usage_images?.length ?? 0) > 0,
  );
}

function InfoValue({ value }: { value: string }) {
  const lines = filledLines(value);
  if (lines.length <= 1) return value;
  return (
    <>
      {lines.map((line, index) => (
        <span key={`${line}-${index}`}>
          {index > 0 ? <br /> : null}
          {line}
        </span>
      ))}
    </>
  );
}

function InfoList({ rows }: { rows: InfoRow[] }) {
  const visible = rows.filter(
    (row) =>
      (hasText(row.value) && row.value !== "-") ||
      (row.images?.length ?? 0) > 0,
  );
  if (visible.length === 0) return null;
  return (
    <ul>
      {visible.map((row) => {
        const images = row.images ?? [];
        const stacked = row.stacked || images.length > 0;
        if (stacked) {
          return (
            <li key={row.label} className="info-stacked">
              <strong>{row.label}</strong>
              {hasText(row.value) ? (
                <div className="info-stacked-body">
                  <InfoValue value={row.value} />
                </div>
              ) : null}
              {images.length > 0 ? (
                <ul className="deliverable-grid">
                  {images.map((image) => (
                    <li key={image.id}>
                      <OrientedImage
                        src={image.dataUrl}
                        alt={image.name || "결과물 이미지"}
                      />
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          );
        }
        return (
          <li key={row.label}>
            <strong>{row.label}</strong>: <InfoValue value={row.value} />
          </li>
        );
      })}
    </ul>
  );
}

function TextBlock({ title, value }: { title: string; value: string }) {
  const lines = filledLines(value);
  if (lines.length === 0) return null;
  return (
    <div className="text-block">
      <h3>{title}</h3>
      <div className="block">
        {lines.map((line, index) => (
          <p key={`${title}-${index}`}>{line}</p>
        ))}
      </div>
    </div>
  );
}

export function ReportView({
  workspaceSlug,
  workspaceName,
  theme,
  report,
}: ReportViewProps) {
  const [photosByJournal, setPhotosByJournal] = useState<PhotosByJournal>({});

  const teamName = (workspaceName || report.team_name).trim();
  const attendees = report.attendees.filter(Boolean).join(", ");
  const teamRows: InfoRow[] = [
    { label: "팀명", value: teamName },
    { label: "작성자", value: report.author },
    { label: "보고 월", value: hasText(report.report_month) ? formatYearMonth(report.report_month) : "" },
    { label: "팀원", value: attendees },
  ];
  const filledJournals = report.journals.filter(journalHasContent);
  const filledPlans = report.next_plans.filter(nextPlanHasContent);
  const aiItems = filledAiServices(report.ai_services);

  useEffect(() => {
    const firstId =
      report.journals.find(journalHasContent)?.id ?? report.journals[0]?.id;
    setPhotosByJournal(loadPhotosByJournal(report.slug, firstId));
  }, [report.journals, report.slug]);

  const hasTeamInfo = teamRows.some((row) => hasText(row.value) && row.value !== "-");
  const hasResults =
    hasText(report.achievements) ||
    hasText(report.learnings) ||
    hasText(report.difficulties);

  return (
    <div
      className="view-html-root"
      data-theme={theme}
      style={themeCssVars(theme) as CSSProperties}
    >
      <style dangerouslySetInnerHTML={{ __html: REPORT_VIEW_CSS }} />

      <div className="view-topbar no-print">
        <Link href={`/w/${workspaceSlug}/r/${report.slug}`} className="back">
          ← 수정으로
        </Link>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <Link href={`/w/${workspaceSlug}`}>목록</Link>
          <button type="button" onClick={() => window.print()}>
            인쇄
          </button>
        </div>
      </div>

      <article className="page">
        <header className="doc-header">
          <p className="brand">INNOSIGHT</p>
          <h1>활동보고서</h1>
        </header>

        {hasTeamInfo ? (
          <section>
            <h2>팀정보</h2>
            <InfoList rows={teamRows} />
          </section>
        ) : null}

        {filledJournals.length > 0 ? (
          <section>
            <h2>활동일지</h2>
            {filledJournals.map((item) => {
              const photos = photosByJournal[item.id] ?? [];
              return (
                <div key={item.id} className="ai-card">
                  <InfoList
                    rows={[
                      {
                        label: "회차 · 모임일시",
                        value: formatSessionMeetingLine(
                          item.session_no,
                          item.meeting_start,
                          item.meeting_end,
                        ),
                      },
                      { label: "장소", value: item.location },
                      {
                        label: "참석자",
                        value: item.attendees.filter(Boolean).join(", "),
                      },
                      { label: "활동 주제", value: item.topic },
                      {
                        label: "스터디 내용",
                        value: item.study_content,
                        stacked: true,
                      },
                    ]}
                  />
                  {hasText(item.deliverables) ||
                  item.deliverable_images.length > 0 ? (
                    <div className="deliverable-block">
                      <h3>결과물</h3>
                      {hasText(item.deliverables) ? (
                        <div className="deliverable-text">
                          {filledLines(item.deliverables).map((line, index) => (
                            <p key={`deliverable-${item.id}-${index}`}>{line}</p>
                          ))}
                        </div>
                      ) : null}
                      {item.deliverable_images.length > 0 ? (
                        <ul className="deliverable-grid">
                          {item.deliverable_images.map((image) => (
                            <li key={image.id}>
                              <OrientedImage
                                src={image.dataUrl}
                                alt={image.name || "결과물 이미지"}
                              />
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  ) : null}
                  {photos.length > 0 ? (
                    <div className="photo-block">
                      <ul className="photo-grid">
                        {photos.map((photo) => (
                          <li key={photo.id} className="photo-item">
                            <OrientedImage
                              src={photo.dataUrl}
                              alt={photo.name || "사진"}
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </section>
        ) : null}

        {hasResults ? (
          <section>
            <h2>이달 결과와 이슈</h2>
            <TextBlock title="달성한 것" value={report.achievements} />
            <TextBlock title="배운 점" value={report.learnings} />
            <TextBlock title="어려웠던 점" value={report.difficulties} />
          </section>
        ) : null}

        {aiItems.length > 0 ? (
          <section>
            <h2>AI 서비스 사용 현황</h2>
            {aiItems.map((item) => (
              <div key={item.id} className="ai-card">
                <InfoList
                  rows={[
                    { label: "사용자", value: item.users },
                    { label: "사용중인 AI 서비스", value: item.serviceName },
                    {
                      label: "활용사례/결과물",
                      value: item.usage,
                      images: item.usage_images ?? [],
                    },
                    { label: "스터디와의 연관성", value: item.relevance },
                  ]}
                />
              </div>
            ))}
          </section>
        ) : null}

        {filledPlans.length > 0 ? (
          <section>
            <h2>다음 모임 계획</h2>
            {filledPlans.map((item) => (
              <div key={item.id} className="ai-card">
                <InfoList
                  rows={[
                    {
                      label: "모임 예정일",
                      value: hasText(item.meeting_date)
                        ? formatDate(item.meeting_date)
                        : "",
                    },
                    { label: "다음 주제", value: item.topic },
                    { label: "목표", value: item.goals },
                  ]}
                />
              </div>
            ))}
          </section>
        ) : null}
      </article>
    </div>
  );
}
