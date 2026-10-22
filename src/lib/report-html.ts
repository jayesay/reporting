import { displayWidthForDataUrl } from "@/lib/image-orientation";
import { formatSessionMeetingLine } from "@/lib/report-format";
import {
  journalHasContent,
  nextPlanHasContent,
  type ReportInput,
} from "@/lib/types/report";

const font =
  "font-family:'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif;";

const styles = {
  wrap: `${font}color:#222;font-size:14px;line-height:1.7;`,
  h1: `${font}margin:0 0 20px;padding-bottom:10px;border-bottom:2px solid #0f6e6a;color:#0a4f4c;font-size:22px;font-weight:700;line-height:1.3;`,
  h2: `${font}margin:28px 0 12px;padding:8px 12px;background:#e7f1f0;border-left:4px solid #0f6e6a;color:#0a4f4c;font-size:16px;font-weight:700;line-height:1.4;`,
  h3: `${font}margin:16px 0 8px;color:#12262b;font-size:14px;font-weight:700;line-height:1.4;`,
  subhead: `${font}margin:16px 0 8px;color:#0a4f4c;font-size:14px;font-weight:700;line-height:1.4;`,
  ul: `${font}margin:0 0 12px;padding:12px 12px 12px 28px;background:#f7faf9;border:1px solid #d7e3e1;list-style:disc;`,
  ulInner: `${font}margin:0;padding:0 0 0 22px;background:transparent;border:none;list-style:disc;`,
  li: `${font}margin:0 0 6px;color:#222;font-size:14px;line-height:1.6;`,
  p: `${font}margin:0 0 8px;padding:0;color:#222;font-size:14px;line-height:1.7;`,
  block: `${font}margin:0 0 12px;padding:12px 14px;background:#f7faf9;border:1px solid #d7e3e1;`,
  strong: `${font}color:#0a4f4c;font-weight:700;`,
  aiCard: `${font}margin:0 0 12px;padding:12px 14px;background:#f7faf9;border:1px solid #d7e3e1;`,
  photo: `${font}margin:0 0 12px;padding:18px 14px;background:#fafafa;border:1px dashed #9aa8a6;color:#5a6b6f;font-size:13px;text-align:center;line-height:1.6;`,
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function textOrDash(value: string) {
  const trimmed = value.trim();
  return trimmed ? escapeHtml(trimmed) : "-";
}

function multilineInline(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `<div style="${styles.block}"><p style="${styles.p}">-</p></div>`;
  }

  const paragraphs = trimmed
    .split(/\n+/)
    .map((line) => `<p style="${styles.p}">${escapeHtml(line)}</p>`)
    .join("");

  return `<div style="${styles.block}">${paragraphs}</div>`;
}

function formatYearMonth(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const match = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (!match) return escapeHtml(trimmed);
  return `${match[1]}년 ${match[2]}월`;
}

function formatDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return escapeHtml(trimmed);
  return `${match[1]}년 ${match[2]}월 ${match[3]}일`;
}

function rowInline(label: string, valueHtml: string) {
  return `<li style="${styles.li}"><strong style="${styles.strong}">${label}</strong>: ${valueHtml}</li>`;
}

function rowStacked(label: string, valueHtml: string) {
  return `<li style="${styles.li}"><strong style="${styles.strong}">${label}</strong><div style="margin-top:4px;">${valueHtml}</div></li>`;
}

function multilineValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  return escapeHtml(trimmed).replaceAll("\n", "<br>");
}

function imageTags(images: { dataUrl: string }[] | undefined) {
  return (images ?? [])
    .map((image) => {
      const width = displayWidthForDataUrl(image.dataUrl);
      return `<img src="${escapeHtml(image.dataUrl)}" alt="" style="display:block;width:${width};max-width:100%;height:auto;margin:8px 0 0;border:1px solid #d7e3e1;border-radius:10px;" />`;
    })
    .join("");
}


function buildAiSection(report: ReportInput) {
  if (report.ai_services.length === 0) {
    return `<div style="${styles.block}"><p style="${styles.p}">-</p></div>`;
  }

  return report.ai_services
    .map((item) => {
      return [
        `<div style="${styles.aiCard}">`,
        `<ul style="${styles.ulInner}">`,
        rowInline("사용자", textOrDash(item.users)),
        rowInline("사용중인 AI 서비스", textOrDash(item.serviceName)),
        (item.usage_images?.length ?? 0) > 0
          ? rowStacked(
              "활용사례/결과물",
              `${item.usage.trim() ? multilineValue(item.usage) : ""}${imageTags(item.usage_images)}`,
            )
          : rowInline("활용사례/결과물", textOrDash(item.usage)),
        rowInline("스터디와의 연관성", textOrDash(item.relevance)),
        `</ul>`,
        `</div>`,
      ].join("");
    })
    .join("");
}

/** DEXT5 붙여넣기용 (인라인 스타일) */
export function reportToHtml(report: ReportInput) {
  const attendees =
    report.attendees.filter(Boolean).map(escapeHtml).join(", ") || "-";
  const aiSection = buildAiSection(report);

  const journalHtml = report.journals
    .filter(journalHasContent)
    .map((item) =>
      [
        `<div style="${styles.aiCard}">`,
        `<ul style="${styles.ulInner}">`,
        rowInline(
          "회차 · 모임일시",
          textOrDash(
            formatSessionMeetingLine(
              item.session_no,
              item.meeting_start,
              item.meeting_end,
            ),
          ),
        ),
        rowInline("장소", textOrDash(item.location)),
        rowInline(
          "참석자",
          item.attendees.filter(Boolean).map(escapeHtml).join(", ") || "-",
        ),
        rowInline("활동 주제", textOrDash(item.topic)),
        rowStacked("스터디 내용", multilineValue(item.study_content)),
        `</ul>`,
        item.deliverables.trim() || item.deliverable_images.length > 0
          ? `<h3 style="${styles.subhead}">결과물</h3>`
          : "",
        item.deliverables.trim()
          ? multilineInline(item.deliverables)
          : "",
        imageTags(item.deliverable_images),
        `<div style="${styles.photo}">이 회차 활동 사진 첨부 영역<br>(게시판 업로드 시 직접 첨부)</div>`,
        `</div>`,
      ].join(""),
    )
    .join("");

  const planHtml = report.next_plans
    .filter(nextPlanHasContent)
    .map((item) =>
      [
        `<div style="${styles.aiCard}">`,
        `<ul style="${styles.ulInner}">`,
        rowInline("모임 예정일", formatDate(item.meeting_date)),
        rowInline("다음 주제", textOrDash(item.topic)),
        rowInline("목표", multilineValue(item.goals)),
        `</ul>`,
        `</div>`,
      ].join(""),
    )
    .join("");

  return [
    `<div style="${styles.wrap}">`,
    `<h1 style="${styles.h1}">INNOSIGHT 활동보고서</h1>`,
    `<h2 style="${styles.h2}">1. 팀정보</h2>`,
    `<ul style="${styles.ul}">`,
    rowInline("팀명", textOrDash(report.team_name)),
    rowInline("작성자", textOrDash(report.author)),
    rowInline("보고 월", formatYearMonth(report.report_month)),
    rowInline("팀원", attendees),
    `</ul>`,
    `<h2 style="${styles.h2}">2. 활동일지</h2>`,
    journalHtml || `<div style="${styles.block}"><p style="${styles.p}">-</p></div>`,
    `<h2 style="${styles.h2}">3. 이달 결과와 이슈</h2>`,
    `<h3 style="${styles.h3}">달성한 것</h3>`,
    multilineInline(report.achievements),
    `<h3 style="${styles.h3}">배운 점</h3>`,
    multilineInline(report.learnings),
    `<h3 style="${styles.h3}">어려웠던 점</h3>`,
    multilineInline(report.difficulties),
    `<h2 style="${styles.h2}">4. AI 서비스 사용 현황</h2>`,
    aiSection,
    `<h2 style="${styles.h2}">5. 다음 모임 계획</h2>`,
    planHtml || `<div style="${styles.block}"><p style="${styles.p}">-</p></div>`,
    `</div>`,
  ].join("");
}
