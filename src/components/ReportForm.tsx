"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  createReport,
  deleteReport,
  saveReport,
} from "@/app/actions/reports";
import { formatSeoulDateTime } from "@/lib/format-datetime";
import {
  workspaceHomePath,
  workspaceReportPath,
  workspaceReportViewPath,
} from "@/lib/paths";
import { readStoredAttendees, storeAttendees } from "@/lib/report-defaults";
import {
  createEmptyAiService,
  createEmptyReportInput,
  type Report,
  type ReportInput,
} from "@/lib/types/report";
import { TagListInput } from "@/components/TagListInput";

type ReportFormProps = {
  workspaceSlug: string;
  workspaceName: string;
  report?: Report;
  defaultAttendees?: string[];
};

type SaveState = "idle" | "saving" | "saved" | "error";

/** datetime-local 값을 10분 단위로 맞춤 (YYYY-MM-DDTHH:mm) */
function snapToTenMinutes(value: string) {
  const match = value.match(/^(\d{4}-\d{2}-\d{2}T\d{2}):(\d{2})/);
  if (!match) return value;

  const hourPart = match[1];
  const minutes = Number(match[2]);
  if (Number.isNaN(minutes)) return value;

  const snapped = Math.round(minutes / 10) * 10;
  if (snapped === 60) {
    const date = new Date(`${hourPart}:00`);
    if (Number.isNaN(date.getTime())) {
      return `${hourPart}:50`;
    }
    date.setHours(date.getHours() + 1, 0, 0, 0);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    const hour = String(date.getHours()).padStart(2, "0");
    return `${year}-${month}-${day}T${hour}:00`;
  }

  return `${hourPart}:${String(snapped).padStart(2, "0")}`;
}

function toInput(
  report: Report | undefined,
  workspaceName: string,
  defaultAttendees: string[] = [],
): ReportInput {
  if (!report) {
    return {
      ...createEmptyReportInput(),
      team_name: workspaceName,
      attendees: defaultAttendees
        .map((item) => item.trim())
        .filter(Boolean),
    };
  }

  return {
    status: report.status,
    team_name: workspaceName,
    author: report.author,
    report_month: report.report_month,
    attendees: report.attendees,
    meeting_start: report.meeting_start,
    meeting_end: report.meeting_end,
    location: report.location,
    topic: report.topic,
    study_content: report.study_content,
    deliverables: report.deliverables,
    achievements: report.achievements,
    learnings: report.learnings,
    difficulties: report.difficulties,
    ai_services:
      report.ai_services.length > 0
        ? report.ai_services
        : [createEmptyAiService()],
    next_meeting_date: report.next_meeting_date,
    next_topic: report.next_topic,
    next_goals: report.next_goals,
  };
}

export function ReportForm({
  workspaceSlug,
  workspaceName,
  report,
  defaultAttendees = [],
}: ReportFormProps) {
  const router = useRouter();
  const homePath = workspaceHomePath(workspaceSlug);
  const [slug, setSlug] = useState<string | null>(report?.slug ?? null);
  const [form, setForm] = useState<ReportInput>(() =>
    toInput(report, workspaceName, defaultAttendees),
  );
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState(report?.updated_at ?? "");
  const [shareState, setShareState] = useState<"idle" | "copied">("idle");
  const [pending, startTransition] = useTransition();
  const creatingRef = useRef(false);
  const slugRef = useRef(slug);
  const formRef = useRef(form);
  slugRef.current = slug;
  formRef.current = form;

  useEffect(() => {
    if (report) return;
    if (form.attendees.length > 0) {
      storeAttendees(workspaceSlug, form.attendees);
      return;
    }
    const storedAttendees = readStoredAttendees(workspaceSlug);
    if (storedAttendees.length === 0) return;

    setForm((prev) => {
      if (prev.attendees.length > 0) return prev;
      const next = { ...prev, attendees: storedAttendees };
      formRef.current = next;
      return next;
    });
    // 새 보고서 첫 로드에서만 로컬 참석자 보정
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [report, workspaceSlug]);

  function patch<K extends keyof ReportInput>(key: K, value: ReportInput[K]) {
    if (key === "attendees") {
      const attendees = (Array.isArray(value) ? value : []).filter(
        (item): item is string => typeof item === "string",
      );
      storeAttendees(workspaceSlug, attendees);
    }

    setForm((prev) => ({
      ...prev,
      [key]: value,
      team_name: workspaceName,
    }));
  }

  async function persist(next: ReportInput = formRef.current) {
    if (creatingRef.current) {
      return false;
    }

    const payload = { ...next, team_name: workspaceName };
    setSaveState("saving");
    setSaveError(null);

    const currentSlug = slugRef.current;

    if (!currentSlug) {
      creatingRef.current = true;
      const result = await createReport(workspaceSlug, payload);
      creatingRef.current = false;

      if (!result.ok) {
        setSaveState("error");
        setSaveError(result.error);
        return false;
      }

      storeAttendees(workspaceSlug, payload.attendees);
      setSlug(result.slug);
      slugRef.current = result.slug;
      setUpdatedAt(result.updatedAt);
      setSaveState("saved");
      router.replace(workspaceReportPath(workspaceSlug, result.slug));
      return true;
    }

    const result = await saveReport(workspaceSlug, currentSlug, payload);
    if (!result.ok) {
      setSaveState("error");
      setSaveError(result.error);
      return false;
    }
    storeAttendees(workspaceSlug, payload.attendees);
    setUpdatedAt(result.updatedAt);
    setSaveState("saved");
    return true;
  }

  function handleManualSave() {
    startTransition(async () => {
      await persist();
    });
  }

  function handleDelete() {
    if (!slug) {
      router.push(homePath);
      return;
    }

    const ok = window.confirm("이 활동보고서를 삭제할까요?");
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteReport(workspaceSlug, slug);
      if (!result.ok) {
        setSaveError(result.error);
        return;
      }
      router.push(homePath);
      router.refresh();
    });
  }

  async function copyShareLink() {
    if (!slug) return;
    const url = `${window.location.origin}${workspaceReportPath(workspaceSlug, slug)}`;
    await navigator.clipboard.writeText(url);
    setShareState("copied");
    window.setTimeout(() => setShareState("idle"), 1600);
  }

  const savedLabel = updatedAt ? formatSeoulDateTime(updatedAt) : "-";

  return (
    <div className="report-shell">
      <Link href={homePath} className="back-link">
        ← 목록으로
      </Link>
      <header className="report-top">
        <div>
          <p className="brand-mark">{workspaceName}</p>
          <h1>활동보고서</h1>
        </div>
        <div className="report-actions">
          <div className={`save-pill ${saveState}`} aria-live="polite">
            {saveState === "saving" || pending
              ? "저장 중…"
              : saveState === "error"
                ? "저장 실패"
                : !slug
                  ? "아직 저장되지 않음"
                  : saveState === "saved"
                    ? `저장됨 · ${savedLabel}`
                    : `최근 저장 · ${savedLabel}`}
          </div>
          {slug ? (
            <>
              <Link
                href={workspaceReportViewPath(workspaceSlug, slug)}
                className="btn ghost"
              >
                조회하기
              </Link>
              <button type="button" className="btn ghost" onClick={copyShareLink}>
                {shareState === "copied" ? "링크 복사됨" : "비밀 링크 복사"}
              </button>
            </>
          ) : null}
          <label className="status-select">
            <span>상태</span>
            <select
              value={form.status}
              onChange={(e) =>
                patch(
                  "status",
                  e.target.value === "done" ? "done" : "draft",
                )
              }
            >
              <option value="draft">임시저장</option>
              <option value="done">작성 완료</option>
            </select>
          </label>
          <button
            type="button"
            className="btn primary"
            onClick={handleManualSave}
            disabled={pending}
          >
            저장
          </button>
          <button
            type="button"
            className="btn ghost danger"
            onClick={handleDelete}
            disabled={pending}
          >
            {slug ? "삭제" : "작성 취소"}
          </button>
        </div>
      </header>

      {saveError ? <p className="error-text">{saveError}</p> : null}

      <form
        className="report-form"
        onSubmit={(event) => {
          event.preventDefault();
          handleManualSave();
        }}
      >
        <section className="section">
          <h2>1. 팀정보</h2>
          <div className="grid-3">
            <div className="field">
              <label htmlFor="team_name">팀명</label>
              <p id="team_name" className="readonly-chip">
                {workspaceName}
              </p>
              <p className="hint">워크스페이스 이름과 동일합니다.</p>
            </div>
            <div className="field">
              <label htmlFor="author">작성자</label>
              <input
                id="author"
                value={form.author}
                onChange={(e) => patch("author", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="report_month">보고 월</label>
              <input
                id="report_month"
                type="month"
                value={form.report_month}
                onChange={(e) => patch("report_month", e.target.value)}
              />
            </div>
          </div>
          <TagListInput
            label="참석 인원"
            hint="쉼표로 여러 명을 한 번에 입력할 수 있습니다. 한 번 저장하면 새 보고서에 자동으로 채워집니다."
            values={form.attendees}
            onChange={(values) => patch("attendees", values)}
          />
        </section>

        <section className="section">
          <h2>2. 활동일지</h2>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="meeting_start">모임 시작</label>
              <input
                id="meeting_start"
                type="datetime-local"
                step={600}
                value={form.meeting_start}
                onChange={(e) =>
                  patch("meeting_start", snapToTenMinutes(e.target.value))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="meeting_end">모임 종료</label>
              <input
                id="meeting_end"
                type="datetime-local"
                step={600}
                value={form.meeting_end}
                onChange={(e) =>
                  patch("meeting_end", snapToTenMinutes(e.target.value))
                }
              />
            </div>
            <div className="field">
              <label htmlFor="location">장소</label>
              <input
                id="location"
                value={form.location}
                onChange={(e) => patch("location", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="topic">활동 주제</label>
              <input
                id="topic"
                value={form.topic}
                onChange={(e) => patch("topic", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>참석자</label>
            <p className="readonly-chip">
              {form.attendees.length > 0
                ? form.attendees.join(", ")
                : "팀정보에서 참석 인원을 추가하세요."}
            </p>
          </div>
          <div className="field">
            <label htmlFor="study_content">스터디 내용</label>
            <textarea
              id="study_content"
              rows={6}
              value={form.study_content}
              onChange={(e) => patch("study_content", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="deliverables">결과물</label>
            <textarea
              id="deliverables"
              rows={4}
              value={form.deliverables}
              onChange={(e) => patch("deliverables", e.target.value)}
            />
          </div>
          <div className="field">
            <label>사진</label>
            <div className="photo-placeholder">
              <p>사진은 작성 화면이 아니라 조회 페이지에서 추가합니다.</p>
              <p>저장 후 상단의 조회하기에서 로컬로 넣을 수 있습니다.</p>
            </div>
          </div>
        </section>

        <section className="section">
          <h2>3. 이달 결과와 이슈</h2>
          <div className="field">
            <label htmlFor="achievements">달성한 것</label>
            <textarea
              id="achievements"
              rows={4}
              value={form.achievements}
              onChange={(e) => patch("achievements", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="learnings">배운 점</label>
            <textarea
              id="learnings"
              rows={4}
              value={form.learnings}
              onChange={(e) => patch("learnings", e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor="difficulties">어려웠던 점</label>
            <textarea
              id="difficulties"
              rows={4}
              value={form.difficulties}
              onChange={(e) => patch("difficulties", e.target.value)}
            />
          </div>
        </section>

        <section className="section">
          <div className="section-head">
            <h2>4. AI 서비스 관련</h2>
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                patch("ai_services", [...form.ai_services, createEmptyAiService()])
              }
            >
              서비스 추가
            </button>
          </div>
          <div className="stack">
            {form.ai_services.map((item, index) => (
              <div key={item.id} className="repeat-block">
                <div className="repeat-head">
                  <h3>서비스 {index + 1}</h3>
                  <button
                    type="button"
                    className="btn ghost danger"
                    onClick={() =>
                      patch(
                        "ai_services",
                        form.ai_services.filter((row) => row.id !== item.id),
                      )
                    }
                    disabled={form.ai_services.length === 1}
                  >
                    삭제
                  </button>
                </div>
                <div className="grid-2">
                  <div className="field">
                    <label>서비스명</label>
                    <input
                      value={item.serviceName}
                      onChange={(e) =>
                        patch(
                          "ai_services",
                          form.ai_services.map((row) =>
                            row.id === item.id
                              ? { ...row, serviceName: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                  </div>
                  <div className="field">
                    <label>사용자</label>
                    <input
                      value={item.users}
                      onChange={(e) =>
                        patch(
                          "ai_services",
                          form.ai_services.map((row) =>
                            row.id === item.id
                              ? { ...row, users: e.target.value }
                              : row,
                          ),
                        )
                      }
                    />
                  </div>
                </div>
                <div className="field">
                  <label>스터디에서 사용된 결과물 / 활용사례</label>
                  <textarea
                    rows={3}
                    value={item.usage}
                    onChange={(e) =>
                      patch(
                        "ai_services",
                        form.ai_services.map((row) =>
                          row.id === item.id
                            ? { ...row, usage: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
                <div className="field">
                  <label>스터디와의 연관성</label>
                  <textarea
                    rows={3}
                    value={item.relevance}
                    onChange={(e) =>
                      patch(
                        "ai_services",
                        form.ai_services.map((row) =>
                          row.id === item.id
                            ? { ...row, relevance: e.target.value }
                            : row,
                        ),
                      )
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="section">
          <h2>5. 다음 모임 계획</h2>
          <div className="grid-2">
            <div className="field">
              <label htmlFor="next_meeting_date">모임 예정일</label>
              <input
                id="next_meeting_date"
                type="date"
                value={form.next_meeting_date}
                onChange={(e) => patch("next_meeting_date", e.target.value)}
              />
            </div>
            <div className="field">
              <label htmlFor="next_topic">다음 주제</label>
              <input
                id="next_topic"
                value={form.next_topic}
                onChange={(e) => patch("next_topic", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="next_goals">목표</label>
            <textarea
              id="next_goals"
              rows={4}
              value={form.next_goals}
              onChange={(e) => patch("next_goals", e.target.value)}
            />
          </div>
        </section>
      </form>
    </div>
  );
}
