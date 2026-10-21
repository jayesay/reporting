"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import {
  createReport,
  deleteReport,
  saveReport,
} from "@/app/actions/reports";
import { ScrollToTopButton } from "@/components/ScrollToTopButton";
import { formatSeoulDateTime } from "@/lib/format-datetime";
import {
  workspaceHomePath,
  workspaceReportPath,
  workspaceReportViewPath,
} from "@/lib/paths";
import { readStoredAttendees, storeAttendees } from "@/lib/report-defaults";
import {
  joinMeetingDateTime,
  splitMeetingFields,
} from "@/lib/report-format";
import {
  createEmptyAiService,
  createEmptyJournal,
  createEmptyNextPlan,
  createEmptyReportInput,
  MAX_JOURNAL_COUNT,
  MAX_NEXT_PLAN_COUNT,
  normalizeJournals,
  normalizeNextPlans,
  normalizeSessionNo,
  type JournalEntry,
  type NextPlanEntry,
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

/** time 값을 10분 단위로 맞춤 (HH:mm) */
function snapTimeToTenMinutes(value: string) {
  const match = value.match(/^(\d{2}):(\d{2})/);
  if (!match) return value;

  const hour = Number(match[1]);
  const minutes = Number(match[2]);
  if (Number.isNaN(hour) || Number.isNaN(minutes)) return value;

  let snapped = Math.round(minutes / 10) * 10;
  let nextHour = hour;
  if (snapped === 60) {
    snapped = 0;
    nextHour = Math.min(23, hour + 1);
  }

  return `${String(nextHour).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

function JournalCard({
  item,
  canDelete,
  onChange,
  onDelete,
}: {
  item: JournalEntry;
  canDelete: boolean;
  onChange: (next: JournalEntry) => void;
  onDelete: () => void;
}) {
  const { date, startTime, endTime } = splitMeetingFields(
    item.meeting_start,
    item.meeting_end,
  );

  function updateMeeting(nextDate: string, nextStart: string, nextEnd: string) {
    onChange({
      ...item,
      meeting_start: joinMeetingDateTime(nextDate, nextStart),
      meeting_end: joinMeetingDateTime(nextDate, nextEnd),
    });
  }

  return (
    <div className="repeat-block relative">
      <button
        type="button"
        className="btn ghost danger compact absolute top-2 right-2 z-10"
        onClick={onDelete}
        disabled={!canDelete}
      >
        삭제
      </button>
      <div className="journal-when-row">
        <div className="field session-field">
          <label>회차</label>
          <input
            type="number"
            min={1}
            step={1}
            inputMode="numeric"
            placeholder="예: 1"
            value={item.session_no ?? ""}
            onChange={(e) =>
              onChange({
                ...item,
                session_no: normalizeSessionNo(e.target.value),
              })
            }
          />
        </div>
        <div className="field meeting-datetime-field">
          <span className="field-label">모임일시</span>
          <div className="meeting-datetime-row">
          <input
            type="date"
            aria-label="모임 날짜"
            value={date}
            onChange={(e) => updateMeeting(e.target.value, startTime, endTime)}
          />
          <input
            type="time"
            step={600}
            aria-label="시작 시간"
            value={startTime}
            onChange={(e) =>
              updateMeeting(date, snapTimeToTenMinutes(e.target.value), endTime)
            }
          />
          <span className="meeting-datetime-sep" aria-hidden>
            ~
          </span>
          <input
            type="time"
            step={600}
            aria-label="종료 시간"
            value={endTime}
            onChange={(e) =>
              updateMeeting(
                date,
                startTime,
                snapTimeToTenMinutes(e.target.value),
              )
            }
          />
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>장소</label>
          <input
            value={item.location}
            onChange={(e) => onChange({ ...item, location: e.target.value })}
          />
        </div>
        <div className="field">
          <label>활동 주제</label>
          <input
            value={item.topic}
            onChange={(e) => onChange({ ...item, topic: e.target.value })}
          />
        </div>
      </div>
      <TagListInput
        label="참석자"
        hint="이 모임에 참석한 사람만 남기거나 추가할 수 있습니다."
        values={item.attendees}
        onChange={(values) => onChange({ ...item, attendees: values })}
      />
      <div className="field">
        <label>스터디 내용</label>
        <textarea
          rows={6}
          value={item.study_content}
          onChange={(e) =>
            onChange({ ...item, study_content: e.target.value })
          }
        />
      </div>
      <div className="field">
        <label>결과물</label>
        <textarea
          rows={4}
          value={item.deliverables}
          onChange={(e) =>
            onChange({ ...item, deliverables: e.target.value })
          }
        />
      </div>
      <div className="field">
        <label>사진</label>
        <div className="photo-placeholder">
          <p>사진은 조회 페이지에서 이 회차별로 추가합니다.</p>
          <p>저장 후 조회하기에서 해당 활동일지의 사진 영역을 클릭하세요.</p>
        </div>
      </div>
    </div>
  );
}

function toInput(
  report: Report | undefined,
  workspaceName: string,
  defaultAttendees: string[] = [],
): ReportInput {
  if (!report) {
    const members = defaultAttendees.map((item) => item.trim()).filter(Boolean);
    return {
      ...createEmptyReportInput(),
      team_name: workspaceName,
      attendees: members,
      journals: [createEmptyJournal(members)],
    };
  }

  return {
    status: report.status,
    team_name: workspaceName,
    author: report.author,
    report_month: report.report_month,
    attendees: report.attendees,
    journals: normalizeJournals(report.journals, undefined, report.attendees),
    achievements: report.achievements,
    learnings: report.learnings,
    difficulties: report.difficulties,
    ai_services:
      report.ai_services.length > 0
        ? report.ai_services
        : [createEmptyAiService()],
    next_plans: normalizeNextPlans(report.next_plans),
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
      const next = {
        ...prev,
        attendees: storedAttendees,
        journals: prev.journals.map((item, index) =>
          index === 0 && item.attendees.length === 0
            ? { ...item, attendees: storedAttendees }
            : item,
        ),
      };
      formRef.current = next;
      return next;
    });
    // 새 보고서 첫 로드에서만 로컬 팀원 보정
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

  function patchJournal(id: string, next: JournalEntry) {
    patch(
      "journals",
      form.journals.map((row) => (row.id === id ? next : row)),
    );
  }

  function patchPlan(id: string, next: NextPlanEntry) {
    patch(
      "next_plans",
      form.next_plans.map((row) => (row.id === id ? next : row)),
    );
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
          <p className="brand-mark">INNOSIGHT</p>
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
          <div className="grid-2">
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
          </div>
          <div className="field">
            <label htmlFor="report_month">보고 월</label>
            <input
              id="report_month"
              type="month"
              value={form.report_month}
              onChange={(e) => patch("report_month", e.target.value)}
            />
            <p className="hint">이 보고서는 선택한 달의 월별 활동보고서입니다.</p>
          </div>
          <TagListInput
            label="팀원"
            hint="쉼표로 여러 명을 한 번에 입력할 수 있습니다. 한 번 저장하면 새 보고서와 새 활동일지 참석자에 기본으로 채워집니다."
            values={form.attendees}
            onChange={(values) => patch("attendees", values)}
          />
        </section>

        <section className="section">
          <div className="section-head">
            <h2>2. 활동일지</h2>
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                patch("journals", [
                  ...form.journals,
                  createEmptyJournal(form.attendees),
                ])
              }
              disabled={form.journals.length >= MAX_JOURNAL_COUNT}
            >
              추가
            </button>
          </div>
          <div className="stack">
            {form.journals.map((item) => (
              <JournalCard
                key={item.id}
                item={item}
                canDelete={form.journals.length > 1}
                onChange={(next) => patchJournal(item.id, next)}
                onDelete={() =>
                  patch(
                    "journals",
                    form.journals.filter((row) => row.id !== item.id),
                  )
                }
              />
            ))}
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
            <h2>4. AI 서비스 사용 현황</h2>
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                patch("ai_services", [...form.ai_services, createEmptyAiService()])
              }
            >
              추가
            </button>
          </div>
          <div className="stack">
            {form.ai_services.map((item) => (
              <div key={item.id} className="repeat-block relative">
                <button
                  type="button"
                  className="btn ghost danger compact absolute top-2 right-2 z-10"
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
                <div className="grid-2">
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
                  <div className="field">
                    <label>사용중인 AI 서비스</label>
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
          <div className="section-head">
            <h2>5. 다음 모임 계획</h2>
            <button
              type="button"
              className="btn ghost"
              onClick={() =>
                patch("next_plans", [...form.next_plans, createEmptyNextPlan()])
              }
              disabled={form.next_plans.length >= MAX_NEXT_PLAN_COUNT}
            >
              추가
            </button>
          </div>
          <div className="stack">
            {form.next_plans.map((item) => (
              <div key={item.id} className="repeat-block relative">
                <button
                  type="button"
                  className="btn ghost danger compact absolute top-2 right-2 z-10"
                  onClick={() =>
                    patch(
                      "next_plans",
                      form.next_plans.filter((row) => row.id !== item.id),
                    )
                  }
                  disabled={form.next_plans.length === 1}
                >
                  삭제
                </button>
                <div className="grid-2">
                  <div className="field">
                    <label>모임 예정일</label>
                    <input
                      type="date"
                      value={item.meeting_date}
                      onChange={(e) =>
                        patchPlan(item.id, {
                          ...item,
                          meeting_date: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>다음 주제</label>
                    <input
                      value={item.topic}
                      onChange={(e) =>
                        patchPlan(item.id, { ...item, topic: e.target.value })
                      }
                    />
                  </div>
                </div>
                <div className="field">
                  <label>목표</label>
                  <textarea
                    rows={4}
                    value={item.goals}
                    onChange={(e) =>
                      patchPlan(item.id, { ...item, goals: e.target.value })
                    }
                  />
                </div>
              </div>
            ))}
          </div>
        </section>
      </form>
      <ScrollToTopButton />
    </div>
  );
}
