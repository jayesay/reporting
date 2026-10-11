import type { ReportInput } from "@/lib/types/report";

const font =
  "font-family:'Noto Sans KR','Malgun Gothic','Apple SD Gothic Neo',sans-serif;";

const styles = {
  wrap: `${font}color:#222;font-size:14px;line-height:1.7;`,
  h1: `${font}margin:0 0 20px;padding-bottom:10px;border-bottom:2px solid #0f6e6a;color:#0a4f4c;font-size:22px;font-weight:700;line-height:1.3;`,
  h2: `${font}margin:28px 0 12px;padding:8px 12px;background:#e7f1f0;border-left:4px solid #0f6e6a;color:#0a4f4c;font-size:16px;font-weight:700;line-height:1.4;`,
  h3: `${font}margin:16px 0 8px;color:#12262b;font-size:14px;font-weight:700;line-height:1.4;`,
  ul: `${font}margin:0 0 12px;padding:12px 12px 12px 28px;background:#f7faf9;border:1px solid #d7e3e1;list-style:disc;`,
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

function multilineClass(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return `<div class="block"><p>-</p></div>`;
  }

  const paragraphs = trimmed
    .split(/\n+/)
    .map((line) => `<p>${escapeHtml(line)}</p>`)
    .join("");

  return `<div class="block">${paragraphs}</div>`;
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

function formatDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/,
  );
  if (!match) {
    const asDate = formatDate(trimmed);
    return asDate === "-" ? escapeHtml(trimmed) : asDate;
  }
  const [, year, month, day, hour, minute] = match;
  return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
}

function rowInline(label: string, valueHtml: string) {
  return `<li style="${styles.li}"><strong style="${styles.strong}">${label}</strong>: ${valueHtml}</li>`;
}

function rowClass(label: string, valueHtml: string) {
  return `<li><strong>${label}</strong>: ${valueHtml}</li>`;
}

function multilineValue(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  return escapeHtml(trimmed).replaceAll("\n", "<br>");
}

function buildAiSection(
  report: ReportInput,
  mode: "inline" | "class",
) {
  if (report.ai_services.length === 0) {
    return mode === "inline"
      ? `<div style="${styles.block}"><p style="${styles.p}">-</p></div>`
      : `<div class="block"><p>-</p></div>`;
  }

  return report.ai_services
    .map((item, index) => {
      const title = textOrDash(item.serviceName);
      const heading = `${index + 1}. ${title === "-" ? "서비스명 미입력" : title}`;

      if (mode === "inline") {
        return [
          `<div style="${styles.aiCard}">`,
          `<h3 style="${styles.h3}">${heading}</h3>`,
          `<ul style="${styles.ul}">`,
          rowInline("사용자", textOrDash(item.users)),
          rowInline("활용사례/결과물", textOrDash(item.usage)),
          rowInline("스터디와의 연관성", textOrDash(item.relevance)),
          `</ul>`,
          `</div>`,
        ].join("");
      }

      return [
        `<div class="ai-card">`,
        `<h3>${heading}</h3>`,
        `<ul>`,
        rowClass("사용자", textOrDash(item.users)),
        rowClass("활용사례/결과물", textOrDash(item.usage)),
        rowClass("스터디와의 연관성", textOrDash(item.relevance)),
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
  const aiSection = buildAiSection(report, "inline");

  return [
    `<div style="${styles.wrap}">`,
    `<h1 style="${styles.h1}">INNOSIGHT 활동보고서</h1>`,
    `<h2 style="${styles.h2}">1. 팀정보</h2>`,
    `<ul style="${styles.ul}">`,
    rowInline("팀명", textOrDash(report.team_name)),
    rowInline("작성자", textOrDash(report.author)),
    rowInline("보고 월", formatYearMonth(report.report_month)),
    rowInline("참석 인원", attendees),
    `</ul>`,
    `<h2 style="${styles.h2}">2. 활동일지</h2>`,
    `<ul style="${styles.ul}">`,
    rowInline("모임 시작", formatDateTime(report.meeting_start)),
    rowInline("모임 종료", formatDateTime(report.meeting_end)),
    rowInline("장소", textOrDash(report.location)),
    rowInline("참석자", attendees),
    rowInline("활동 주제", textOrDash(report.topic)),
    `</ul>`,
    `<h3 style="${styles.h3}">스터디 내용</h3>`,
    multilineInline(report.study_content),
    `<h3 style="${styles.h3}">결과물</h3>`,
    multilineInline(report.deliverables),
    `<h3 style="${styles.h3}">사진</h3>`,
    `<div style="${styles.photo}">활동 사진 첨부 영역<br>(게시판 업로드 시 직접 첨부)</div>`,
    `<h2 style="${styles.h2}">3. 이달 결과와 이슈</h2>`,
    `<h3 style="${styles.h3}">달성한 것</h3>`,
    multilineInline(report.achievements),
    `<h3 style="${styles.h3}">배운 점</h3>`,
    multilineInline(report.learnings),
    `<h3 style="${styles.h3}">어려웠던 점</h3>`,
    multilineInline(report.difficulties),
    `<h2 style="${styles.h2}">4. AI 서비스 관련</h2>`,
    aiSection,
    `<h2 style="${styles.h2}">5. 다음 모임 계획</h2>`,
    `<ul style="${styles.ul}">`,
    rowInline("모임 예정일", formatDate(report.next_meeting_date)),
    rowInline("다음 주제", textOrDash(report.next_topic)),
    rowInline("목표", multilineValue(report.next_goals)),
    `</ul>`,
    `</div>`,
  ].join("");
}

/** 내부 열람용 완성형 HTML 문서 */
export function reportToViewDocument(report: ReportInput) {
  const attendees =
    report.attendees.filter(Boolean).map(escapeHtml).join(", ") || "-";
  const aiSection = buildAiSection(report, "class");
  const titleMonth = formatYearMonth(report.report_month);
  const titleTeam = textOrDash(report.team_name);
  const docTitle =
    titleTeam !== "-" || titleMonth !== "-"
      ? `INNOSIGHT 활동보고서 · ${titleTeam !== "-" ? titleTeam : "팀미입력"} · ${titleMonth !== "-" ? titleMonth : "월미입력"}`
      : "INNOSIGHT 활동보고서";

  const body = [
    `<header class="doc-header">`,
    `<p class="brand">INNOSIGHT</p>`,
    `<h1>활동보고서</h1>`,
    `<p class="meta">${titleTeam} · ${titleMonth} · 작성자 ${textOrDash(report.author)}</p>`,
    `</header>`,
    `<section>`,
    `<h2>1. 팀정보</h2>`,
    `<ul>`,
    rowClass("팀명", textOrDash(report.team_name)),
    rowClass("작성자", textOrDash(report.author)),
    rowClass("보고 월", titleMonth),
    rowClass("참석 인원", attendees),
    `</ul>`,
    `</section>`,
    `<section>`,
    `<h2>2. 활동일지</h2>`,
    `<ul>`,
    rowClass("모임 시작", formatDateTime(report.meeting_start)),
    rowClass("모임 종료", formatDateTime(report.meeting_end)),
    rowClass("장소", textOrDash(report.location)),
    rowClass("참석자", attendees),
    rowClass("활동 주제", textOrDash(report.topic)),
    `</ul>`,
    `<h3>스터디 내용</h3>`,
    multilineClass(report.study_content),
    `<h3>결과물</h3>`,
    multilineClass(report.deliverables),
    `<h3>사진</h3>`,
    `<div class="photo-section">`,
    `<div class="photo-toolbar no-print">`,
    `<label class="photo-add-btn">사진 추가`,
    `<input id="photoInput" type="file" accept="image/*" multiple />`,
    `</label>`,
    `<button type="button" id="saveHtmlBtn" class="photo-save-btn">사진 포함해서 저장</button>`,
    `<p class="photo-help">이 HTML 파일에서 로컬로만 추가됩니다. 추가 후 저장을 누르면 사진이 포함된 파일로 다시 내려받습니다.</p>`,
    `</div>`,
    `<div id="photoEmpty" class="photo">아직 추가된 사진이 없습니다.<br><span>위에서 사진을 선택하세요</span></div>`,
    `<div id="photoGrid" class="photo-grid" hidden></div>`,
    `</div>`,
    `</section>`,
    `<section>`,
    `<h2>3. 이달 결과와 이슈</h2>`,
    `<h3>달성한 것</h3>`,
    multilineClass(report.achievements),
    `<h3>배운 점</h3>`,
    multilineClass(report.learnings),
    `<h3>어려웠던 점</h3>`,
    multilineClass(report.difficulties),
    `</section>`,
    `<section>`,
    `<h2>4. AI 서비스 관련</h2>`,
    aiSection,
    `</section>`,
    `<section>`,
    `<h2>5. 다음 모임 계획</h2>`,
    `<ul>`,
    rowClass("모임 예정일", formatDate(report.next_meeting_date)),
    rowClass("다음 주제", textOrDash(report.next_topic)),
    rowClass("목표", multilineValue(report.next_goals)),
    `</ul>`,
    `</section>`,
  ].join("");

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(docTitle)}</title>
  <style>
    :root {
      --ink: #12262b;
      --muted: #4a646b;
      --teal: #0f6e6a;
      --teal-deep: #0a4f4c;
      --line: #d7e3e1;
      --paper: #ffffff;
    }
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 32px 20px 48px;
      background:
        radial-gradient(circle at 10% 0%, rgba(15,110,106,.12), transparent 36%),
        linear-gradient(180deg, #edf5f4 0%, #e7eeec 100%);
      color: var(--ink);
      font-family: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
      font-size: 15px;
      line-height: 1.7;
    }
    .page {
      width: min(860px, 100%);
      margin: 0 auto;
      padding: 36px 40px 40px;
      background: var(--paper);
      border: 1px solid var(--line);
      border-radius: 16px;
      box-shadow: 0 18px 40px rgba(18, 38, 43, 0.08);
    }
    .doc-header {
      margin-bottom: 28px;
      padding-bottom: 18px;
      border-bottom: 2px solid var(--teal);
    }
    .brand {
      margin: 0 0 6px;
      color: var(--teal-deep);
      font-size: 12px;
      font-weight: 700;
      letter-spacing: 0.14em;
    }
    h1 {
      margin: 0;
      color: var(--ink);
      font-size: 28px;
      line-height: 1.25;
      letter-spacing: -0.03em;
    }
    .meta {
      margin: 10px 0 0;
      color: var(--muted);
      font-size: 14px;
    }
    section { margin-top: 28px; }
    h2 {
      margin: 0 0 12px;
      padding: 10px 12px;
      background: #e7f1f0;
      border-left: 4px solid var(--teal);
      color: var(--teal-deep);
      font-size: 17px;
      line-height: 1.35;
    }
    h3 {
      margin: 18px 0 8px;
      color: var(--ink);
      font-size: 15px;
    }
    ul {
      margin: 0;
      padding-left: 1.25rem;
      background: transparent;
      border: none;
    }
    li { margin: 0 0 8px; }
    li:last-child { margin-bottom: 0; }
    strong { color: var(--teal-deep); }
    .block, .ai-card {
      margin: 0;
      padding: 0;
      background: transparent;
      border: none;
    }
    .ai-card { margin-bottom: 16px; }
    .ai-card:last-child { margin-bottom: 0; }
    .ai-card h3 { margin-top: 0; }
    .ai-card ul { margin-top: 6px; }
    .block p, .ai-card p { margin: 0 0 8px; }
    .block p:last-child, .ai-card p:last-child { margin-bottom: 0; }
    .photo-section { margin-top: 4px; }
    .photo-toolbar {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      margin-bottom: 12px;
    }
    .photo-add-btn,
    .photo-save-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 8px 12px;
      background: #e7f1f0;
      color: var(--teal-deep);
      font: inherit;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
    }
    .photo-add-btn input {
      max-width: 220px;
      font-size: 13px;
      font-weight: 400;
      color: var(--ink);
    }
    .photo-save-btn {
      background: var(--teal);
      border-color: var(--teal);
      color: #fff;
    }
    .photo-help {
      flex: 1 1 100%;
      margin: 0;
      color: var(--muted);
      font-size: 13px;
    }
    .photo {
      padding: 28px 16px;
      border: 1px dashed #9aa8a6;
      border-radius: 10px;
      background: transparent;
      color: var(--muted);
      text-align: center;
      font-size: 14px;
    }
    .photo span {
      display: inline-block;
      margin-top: 4px;
      font-size: 12px;
    }
    .photo-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 14px;
    }
    .photo-item {
      margin: 0;
      position: relative;
    }
    .photo-item img {
      display: block;
      width: 100%;
      height: auto;
      border: 1px solid var(--line);
      border-radius: 10px;
      object-fit: cover;
    }
    .photo-item figcaption {
      margin-top: 6px;
      color: var(--muted);
      font-size: 12px;
      word-break: break-all;
    }
    .photo-remove {
      margin-top: 6px;
      border: 1px solid var(--line);
      border-radius: 8px;
      padding: 4px 8px;
      background: #fff;
      color: #b42318;
      font: inherit;
      font-size: 12px;
      cursor: pointer;
    }
    @media print {
      body {
        padding: 0;
        background: #fff;
      }
      .page {
        width: 100%;
        border: none;
        border-radius: 0;
        box-shadow: none;
        padding: 0;
      }
      .no-print { display: none !important; }
    }
  </style>
</head>
<body>
  <article class="page">
    ${body}
  </article>
  <script>
    (function () {
      var input = document.getElementById("photoInput");
      var grid = document.getElementById("photoGrid");
      var empty = document.getElementById("photoEmpty");
      var saveBtn = document.getElementById("saveHtmlBtn");
      if (!input || !grid || !empty || !saveBtn) return;

      function syncEmpty() {
        var hasPhotos = grid.children.length > 0;
        empty.hidden = hasPhotos;
        grid.hidden = !hasPhotos;
      }

      function addPhoto(file) {
        if (!file || !file.type || file.type.indexOf("image/") !== 0) return;
        var reader = new FileReader();
        reader.onload = function () {
          var figure = document.createElement("figure");
          figure.className = "photo-item";

          var img = document.createElement("img");
          img.src = String(reader.result || "");
          img.alt = file.name;

          var caption = document.createElement("figcaption");
          caption.textContent = file.name;

          var removeBtn = document.createElement("button");
          removeBtn.type = "button";
          removeBtn.className = "photo-remove no-print";
          removeBtn.textContent = "제거";
          removeBtn.addEventListener("click", function () {
            figure.remove();
            syncEmpty();
          });

          figure.appendChild(img);
          figure.appendChild(caption);
          figure.appendChild(removeBtn);
          grid.appendChild(figure);
          syncEmpty();
        };
        reader.readAsDataURL(file);
      }

      input.addEventListener("change", function () {
        var files = input.files ? Array.prototype.slice.call(input.files) : [];
        files.forEach(addPhoto);
        input.value = "";
      });

      saveBtn.addEventListener("click", function () {
        var html = "<!DOCTYPE html>\\n" + document.documentElement.outerHTML;
        var blob = new Blob([html], { type: "text/html;charset=utf-8" });
        var url = URL.createObjectURL(blob);
        var a = document.createElement("a");
        a.href = url;
        a.download = document.title.replace(/[\\\\/:*?"<>|]/g, "-") + ".html";
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });

      syncEmpty();
    })();
  </script>
</body>
</html>`;
}
