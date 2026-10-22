"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";
import { compressImageForLocalStorage } from "@/lib/compress-image";
import {
  createReport,
  deleteReport,
  saveReport,
} from "@/app/actions/reports";
import { OrientedImage } from "@/components/OrientedImage";
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
  deliverableImagesBytes,
  formatByteSize,
  MAX_DELIVERABLE_IMAGE_BYTES,
  MAX_JOURNAL_COUNT,
  MAX_NEXT_PLAN_COUNT,
  normalizeAiServices,
  normalizeJournals,
  normalizeNextPlans,
  normalizeSessionNo,
  type AiServiceEntry,
  type DeliverableImage,
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

const TIME_HOURS = Array.from({ length: 24 }, (_, hour) =>
  String(hour).padStart(2, "0"),
);
const TIME_MINUTES = ["00", "10", "20", "30", "40", "50"] as const;

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
    snapped = 50;
    nextHour = hour;
  }

  return `${String(nextHour).padStart(2, "0")}:${String(snapped).padStart(2, "0")}`;
}

function splitTimeParts(value: string) {
  const snapped = snapTimeToTenMinutes(value);
  const match = snapped.match(/^(\d{2}):(\d{2})$/);
  if (!match) return { hour: "", minute: "" };
  return { hour: match[1], minute: match[2] };
}

function MeetingTimeSelect({
  value,
  ariaLabel,
  onChange,
}: {
  value: string;
  ariaLabel: string;
  onChange: (next: string) => void;
}) {
  const { hour, minute } = splitTimeParts(value);

  return (
    <div className="meeting-time-select">
      <select
        aria-label={`${ariaLabel} 시`}
        value={hour}
        onChange={(event) => {
          const nextHour = event.target.value;
          if (!nextHour) {
            onChange("");
            return;
          }
          onChange(`${nextHour}:${minute || "00"}`);
        }}
      >
        <option value="">시</option>
        {TIME_HOURS.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
      <span className="meeting-time-colon" aria-hidden>
        :
      </span>
      <select
        aria-label={`${ariaLabel} 분`}
        value={minute}
        onChange={(event) => {
          const nextMinute = event.target.value;
          if (!nextMinute && !hour) {
            onChange("");
            return;
          }
          onChange(`${hour || "00"}:${nextMinute || "00"}`);
        }}
      >
        <option value="">분</option>
        {TIME_MINUTES.map((item) => (
          <option key={item} value={item}>
            {item}
          </option>
        ))}
      </select>
    </div>
  );
}

function DeliverableImagesField({
  images,
  onChange,
}: {
  images: DeliverableImage[];
  onChange: (next: DeliverableImage[]) => void;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [imageError, setImageError] = useState<string | null>(null);
  const usedBytes = deliverableImagesBytes(images);
  const remainingBytes = Math.max(0, MAX_DELIVERABLE_IMAGE_BYTES - usedBytes);
  const usedLabel = usedBytes === 0 ? "0MB" : formatByteSize(usedBytes);
  const limitLabel = formatByteSize(MAX_DELIVERABLE_IMAGE_BYTES);

  async function addImages(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (remainingBytes <= 0) {
      setImageError(
        `이 항목 이미지는 업로드 용량 합쳐서 ${limitLabel}까지입니다.`,
      );
      if (fileRef.current) fileRef.current.value = "";
      return;
    }

    setImageError(null);
    try {
      const next = [...images];
      let skippedForSize = 0;

      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        if (deliverableImagesBytes(next) + file.size > MAX_DELIVERABLE_IMAGE_BYTES) {
          skippedForSize += 1;
          continue;
        }
        const dataUrl = await compressImageForLocalStorage(file);
        next.push({
          id: `img-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          dataUrl,
          bytes: file.size,
        });
      }

      if (next.length > images.length) onChange(next);

      if (skippedForSize > 0) {
        const nextUsed = deliverableImagesBytes(next);
        const nextUsedLabel =
          nextUsed === 0 ? "0MB" : formatByteSize(nextUsed);
        setImageError(
          `업로드 용량이 이 항목 한도(${limitLabel})를 넘습니다. 현재 ${nextUsedLabel} / ${limitLabel}.`,
        );
        return;
      }
      if (next.length === images.length) {
        setImageError("이미지 파일만 추가할 수 있습니다.");
      }
    } catch (error) {
      setImageError(
        error instanceof Error ? error.message : "이미지 추가에 실패했습니다.",
      );
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <>
      <input
        ref={fileRef}
        className="deliverable-file"
        type="file"
        accept="image/*"
        multiple
        onChange={(event) => {
          void addImages(event.target.files);
        }}
      />
      {images.length > 0 ? (
        <ul className="deliverable-thumbs">
          {images.map((image) => (
            <li key={image.id} className="deliverable-thumb">
              <OrientedImage
                src={image.dataUrl}
                alt={image.name || "결과물 이미지"}
              />
              <button
                type="button"
                className="deliverable-thumb-remove"
                onClick={() =>
                  onChange(images.filter((row) => row.id !== image.id))
                }
              >
                삭제
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <button
        type="button"
        className="btn ghost compact"
        onClick={() => fileRef.current?.click()}
        disabled={remainingBytes <= 0}
      >
        이미지 추가
      </button>
      <p className="hint">
        글과 화면 캡처를 함께 넣을 수 있습니다. 이 항목 업로드 용량은 합쳐서{" "}
        {limitLabel}까지입니다. 현재 {usedLabel} / {limitLabel}
      </p>
      {imageError ? <p className="error-text">{imageError}</p> : null}
    </>
  );
}

function JournalCard({
  item,
  canDelete,
  onChange,
  onDelete,
}: {
  item: JournalEntry;
  canDelete: boolean;
  onChange: (next: Partial<JournalEntry>) => void;
  onDelete: () => void;
}) {
  const { date, startTime, endTime } = splitMeetingFields(
    item.meeting_start,
    item.meeting_end,
  );

  function updateMeeting(nextDate: string, nextStart: string, nextEnd: string) {
    onChange({
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
          <MeetingTimeSelect
            value={startTime}
            ariaLabel="시작 시간"
            onChange={(nextStart) => updateMeeting(date, nextStart, endTime)}
          />
          <span className="meeting-datetime-sep" aria-hidden>
            ~
          </span>
          <MeetingTimeSelect
            value={endTime}
            ariaLabel="종료 시간"
            onChange={(nextEnd) => updateMeeting(date, startTime, nextEnd)}
          />
          </div>
        </div>
      </div>
      <div className="grid-2">
        <div className="field">
          <label>장소</label>
          <input
            value={item.location}
            onChange={(e) => onChange({ location: e.target.value })}
          />
        </div>
        <div className="field">
          <label>활동 주제</label>
          <input
            value={item.topic}
            onChange={(e) => onChange({ topic: e.target.value })}
          />
        </div>
      </div>
      <TagListInput
        label="참석자"
        hint="이 모임에 참석한 사람만 남기거나 추가할 수 있습니다."
        values={item.attendees}
        onChange={(values) => onChange({ attendees: values })}
      />
      <div className="field">
        <label>스터디 내용</label>
        <textarea
          rows={6}
          value={item.study_content}
          onChange={(e) =>
            onChange({ study_content: e.target.value })
          }
        />
      </div>
      <div className="field">
        <label>결과물</label>
        <textarea
          rows={4}
          value={item.deliverables}
          onChange={(e) =>
            onChange({ deliverables: e.target.value })
          }
        />
        <DeliverableImagesField
          images={item.deliverable_images ?? []}
          onChange={(deliverable_images) =>
            onChange({ deliverable_images })
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
    ai_services: normalizeAiServices(report.ai_services),
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

  function setFormValue(updater: (prev: ReportInput) => ReportInput) {
    setForm((prev) => {
      const next = { ...updater(prev), team_name: workspaceName };
      formRef.current = next;
      return next;
    });
  }

  function patch<K extends keyof ReportInput>(key: K, value: ReportInput[K]) {
    if (key === "attendees") {
      const attendees = (Array.isArray(value) ? value : []).filter(
        (item): item is string => typeof item === "string",
      );
      storeAttendees(workspaceSlug, attendees);
    }

    setFormValue((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function patchJournal(id: string, next: Partial<JournalEntry>) {
    setFormValue((prev) => ({
      ...prev,
      journals: prev.journals.map((row) =>
        row.id === id ? { ...row, ...next } : row,
      ),
    }));
  }

  function patchPlan(id: string, next: Partial<NextPlanEntry>) {
    setFormValue((prev) => ({
      ...prev,
      next_plans: prev.next_plans.map((row) =>
        row.id === id ? { ...row, ...next } : row,
      ),
    }));
  }

  function patchAiService(id: string, next: Partial<AiServiceEntry>) {
    setFormValue((prev) => ({
      ...prev,
      ai_services: prev.ai_services.map((row) =>
        row.id === id ? { ...row, ...next } : row,
      ),
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
                setFormValue((prev) => ({
                  ...prev,
                  journals: [
                    ...prev.journals,
                    createEmptyJournal(prev.attendees),
                  ],
                }))
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
                  setFormValue((prev) => ({
                    ...prev,
                    journals: prev.journals.filter((row) => row.id !== item.id),
                  }))
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
                setFormValue((prev) => ({
                  ...prev,
                  ai_services: [...prev.ai_services, createEmptyAiService()],
                }))
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
                    setFormValue((prev) => ({
                      ...prev,
                      ai_services: prev.ai_services.filter(
                        (row) => row.id !== item.id,
                      ),
                    }))
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
                        patchAiService(item.id, { users: e.target.value })
                      }
                    />
                  </div>
                  <div className="field">
                    <label>사용중인 AI 서비스</label>
                    <input
                      value={item.serviceName}
                      onChange={(e) =>
                        patchAiService(item.id, {
                          serviceName: e.target.value,
                        })
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
                      patchAiService(item.id, { usage: e.target.value })
                    }
                  />
                  <DeliverableImagesField
                    images={item.usage_images ?? []}
                    onChange={(usage_images) =>
                      patchAiService(item.id, { usage_images })
                    }
                  />
                </div>
                <div className="field">
                  <label>스터디와의 연관성</label>
                  <textarea
                    rows={3}
                    value={item.relevance}
                    onChange={(e) =>
                      patchAiService(item.id, { relevance: e.target.value })
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
                setFormValue((prev) => ({
                  ...prev,
                  next_plans: [...prev.next_plans, createEmptyNextPlan()],
                }))
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
                    setFormValue((prev) => ({
                      ...prev,
                      next_plans: prev.next_plans.filter(
                        (row) => row.id !== item.id,
                      ),
                    }))
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
                        patchPlan(item.id, { topic: e.target.value })
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
                      patchPlan(item.id, { goals: e.target.value })
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
