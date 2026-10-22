/** 예전 열람용 HTML 문서 스타일 그대로 */
export const REPORT_VIEW_CSS = `
.view-html-root {
  --ink: #12262b;
  --muted: #4a646b;
  --teal: #0f6e6a;
  --teal-deep: #0a4f4c;
  --line: #d7e3e1;
  --paper: #ffffff;
  --mist: #e7f1f0;
  --heading-bg: #d4e9e6;
  --theme-glow-a: rgba(15,110,106,.12);
  --theme-grad-top: #edf5f4;
  --theme-grad-bottom: #e7eeec;
  position: relative;
  z-index: 2;
  min-height: 100vh;
  margin: 0;
  padding: 32px 20px 48px;
  background:
    radial-gradient(circle at 10% 0%, var(--theme-glow-a), transparent 36%),
    linear-gradient(180deg, var(--theme-grad-top) 0%, var(--theme-grad-bottom) 100%);
  color: var(--ink);
  font-family: "Noto Sans KR", "Apple SD Gothic Neo", "Malgun Gothic", sans-serif;
  font-size: 15px;
  line-height: 1.7;
  box-sizing: border-box;
}
.view-html-root *,
.view-html-root *::before,
.view-html-root *::after {
  box-sizing: border-box;
}
.view-html-root .page {
  width: min(860px, 100%);
  margin: 0 auto;
  padding: 36px 40px 40px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 16px;
  box-shadow: 0 18px 40px rgba(18, 38, 43, 0.08);
}
.view-html-root .doc-header {
  margin-bottom: 28px;
  padding-bottom: 18px;
  border-bottom: 2px solid var(--teal);
}
.view-html-root .brand {
  margin: 0 0 6px;
  color: var(--teal-deep);
  font-size: 1.15rem;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.25;
}
.view-html-root h1 {
  margin: 0;
  color: var(--ink);
  font-size: 28px;
  font-weight: 700;
  line-height: 1.25;
  letter-spacing: -0.03em;
}
.view-html-root .meta {
  margin: 10px 0 0;
  color: var(--muted);
  font-size: 14px;
}
.view-html-root section {
  margin-top: 28px;
}
.view-html-root h2 {
  margin: 0 0 12px;
  padding: 10px 12px;
  background: var(--heading-bg, var(--mist));
  border-left: 4px solid var(--teal);
  color: var(--teal-deep);
  font-size: 17px;
  font-weight: 700;
  line-height: 1.35;
}
.view-html-root h3 {
  margin: 18px 0 8px;
  color: var(--ink);
  font-size: 15px;
  font-weight: 700;
}
.view-html-root ul {
  margin: 0 0 12px;
  padding: 12px 12px 12px 28px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
  list-style: disc;
}
.view-html-root li {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 15px;
  line-height: 1.7;
}
.view-html-root li:last-child {
  margin-bottom: 0;
}
.view-html-root strong {
  color: var(--teal-deep);
  font-weight: 700;
}
.view-html-root .block,
.view-html-root .ai-card {
  margin: 0 0 12px;
  padding: 12px 14px;
  background: var(--paper);
  border: 1px solid var(--line);
  border-radius: 10px;
}
.view-html-root .ai-card {
  margin-bottom: 16px;
}
.view-html-root .ai-card:last-child {
  margin-bottom: 0;
}
.view-html-root .ai-card ul {
  margin: 0;
  padding: 0 0 0 1.15rem;
  background: transparent;
  border: none;
  border-radius: 0;
}
.view-html-root .info-stacked {
  display: list-item;
}
.view-html-root .info-stacked-body {
  margin-top: 4px;
}
.view-html-root .text-block h3 {
  margin: 18px 0 8px;
}
.view-html-root .ai-card .text-block {
  margin-top: 16px;
}
.view-html-root .ai-card .text-block h3 {
  margin: 0 0 8px;
  color: var(--teal-deep);
}
.view-html-root .ai-card .text-block .block {
  margin-bottom: 0;
}
.view-html-root .deliverable-block {
  margin-top: 16px;
}
.view-html-root .deliverable-block h3 {
  margin: 0 0 8px;
  color: var(--teal-deep);
}
.view-html-root .deliverable-text p {
  margin: 0 0 8px;
}
.view-html-root .deliverable-text p:last-child {
  margin-bottom: 0;
}
.view-html-root .ai-card .deliverable-grid {
  display: flex;
  flex-direction: column;
  gap: 12px;
  list-style: none;
  margin: 10px 0 0;
  padding: 0;
  background: transparent;
  border: none;
}
.view-html-root .deliverable-grid li {
  margin: 0;
  width: 100%;
  list-style: none;
}
.view-html-root .deliverable-grid li:has(img.is-portrait),
.view-html-root .deliverable-grid li.is-portrait {
  width: 50%;
  max-width: 50%;
  align-self: center;
  margin-inline: auto;
}
.view-html-root .deliverable-grid img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border: 1px solid var(--line);
  border-radius: 10px;
}
.view-html-root .block p,
.view-html-root .ai-card p {
  margin: 0 0 8px;
  color: var(--ink);
  font-size: 15px;
  line-height: 1.7;
}
.view-html-root .block p:last-child,
.view-html-root .ai-card p:last-child {
  margin-bottom: 0;
}
.view-html-root .photo-block {
  margin-top: 12px;
}
.view-html-root .ai-card .photo-grid {
  margin: 0;
  padding: 0;
  width: 100%;
}
.view-html-root .photo-grid {
  display: flex;
  flex-direction: column;
  gap: 16px;
  list-style: none;
  margin: 0;
  padding: 0;
  background: transparent;
  border: none;
  border-radius: 0;
}
.view-html-root .photo-item {
  margin: 0;
  position: relative;
  list-style: none;
  width: 100%;
}
.view-html-root .photo-item:has(img.is-portrait),
.view-html-root .photo-item.is-portrait {
  width: 50%;
  max-width: 50%;
  align-self: center;
  margin-inline: auto;
}
.view-html-root .photo-item img {
  display: block;
  width: 100%;
  max-width: 100%;
  height: auto;
  border: 1px solid var(--line);
  border-radius: 10px;
  object-fit: contain;
}
.view-html-root .view-topbar {
  width: min(860px, 100%);
  margin: 0 auto 14px;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}
.view-html-root .view-topbar a,
.view-html-root .view-topbar button {
  appearance: none;
  display: inline-flex;
  align-items: center;
  border: 1px solid var(--line);
  border-radius: 8px;
  padding: 8px 12px;
  background: rgba(255,255,255,0.75);
  color: var(--ink);
  font: inherit;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  cursor: pointer;
}
.view-html-root .view-topbar .back {
  border: none;
  background: transparent;
  color: var(--muted);
  padding-left: 0;
}
@media (max-width: 720px) {
  .view-html-root {
    padding: 20px 12px 32px;
  }
  .view-html-root .page {
    padding: 20px 16px 24px;
  }
  .view-html-root h1 {
    font-size: 24px;
  }
}
@media print {
  .view-html-root {
    padding: 0;
    background: #fff;
  }
  .view-html-root .page {
    width: 100%;
    border: none;
    border-radius: 0;
    box-shadow: none;
    padding: 0;
  }
  .view-html-root .no-print {
    display: none !important;
  }
}
`;
