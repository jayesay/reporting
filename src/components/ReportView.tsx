"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import {
  formatDate,
  formatDateTime,
  formatYearMonth,
  multilineLines,
  textOrDash,
} from "@/lib/report-format";
import { REPORT_VIEW_CSS } from "@/lib/report-view-styles";
import type { Report } from "@/lib/types/report";

type LocalPhoto = {
  id: string;
  name: string;
  dataUrl: string;
};

type ReportViewProps = {
  workspaceSlug: string;
  workspaceName: string;
  report: Report;
};

function photoStorageKey(slug: string) {
  return `innosight-view-photos:${slug}`;
}

function readFileAsDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
        return;
      }
      reject(new Error("파일을 읽지 못했습니다."));
    };
    reader.onerror = () => reject(new Error("파일을 읽지 못했습니다."));
    reader.readAsDataURL(file);
  });
}

export function ReportView({
  workspaceSlug,
  workspaceName,
  report,
}: ReportViewProps) {
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const titleMonth = formatYearMonth(report.report_month);
  const titleTeam = textOrDash(workspaceName || report.team_name);
  const attendees = report.attendees.filter(Boolean).join(", ") || "-";

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(photoStorageKey(report.slug));
      if (raw) {
        const parsed = JSON.parse(raw) as LocalPhoto[];
        if (Array.isArray(parsed)) {
          setPhotos(parsed);
        }
      }
    } catch {
      // ignore
    } finally {
      setReady(true);
    }
  }, [report.slug]);

  useEffect(() => {
    if (!ready) return;
    try {
      window.localStorage.setItem(
        photoStorageKey(report.slug),
        JSON.stringify(photos),
      );
    } catch {
      setPhotoError("사진 로컬 저장 공간이 부족합니다. 일부 사진을 제거해 주세요.");
    }
  }, [photos, ready, report.slug]);

  async function handlePhotoSelect(files: FileList | null) {
    if (!files || files.length === 0) return;
    setPhotoError(null);

    try {
      const next: LocalPhoto[] = [];
      for (const file of Array.from(files)) {
        if (!file.type.startsWith("image/")) continue;
        const dataUrl = await readFileAsDataUrl(file);
        next.push({
          id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          name: file.name,
          dataUrl,
        });
      }
      if (next.length === 0) {
        setPhotoError("이미지 파일만 추가할 수 있습니다.");
        return;
      }
      setPhotos((prev) => [...prev, ...next]);
    } catch (error) {
      setPhotoError(
        error instanceof Error ? error.message : "사진 추가에 실패했습니다.",
      );
    } finally {
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="view-html-root">
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
          <p className="brand">{workspaceName}</p>
          <h1>활동보고서</h1>
        </header>

        <section>
          <h2>1. 팀정보</h2>
          <ul>
            <li>
              <strong>팀명</strong>: {titleTeam}
            </li>
            <li>
              <strong>작성자</strong>: {textOrDash(report.author)}
            </li>
            <li>
              <strong>보고 월</strong>: {titleMonth}
            </li>
            <li>
              <strong>참석 인원</strong>: {attendees}
            </li>
          </ul>
        </section>

        <section>
          <h2>2. 활동일지</h2>
          <ul>
            <li>
              <strong>모임 시작</strong>: {formatDateTime(report.meeting_start)}
            </li>
            <li>
              <strong>모임 종료</strong>: {formatDateTime(report.meeting_end)}
            </li>
            <li>
              <strong>장소</strong>: {textOrDash(report.location)}
            </li>
            <li>
              <strong>참석자</strong>: {attendees}
            </li>
            <li>
              <strong>활동 주제</strong>: {textOrDash(report.topic)}
            </li>
          </ul>

          <h3>스터디 내용</h3>
          <div className="block">
            {multilineLines(report.study_content).map((line, index) => (
              <p key={`study-${index}`}>{line}</p>
            ))}
          </div>

          <h3>결과물</h3>
          <div className="block">
            {multilineLines(report.deliverables).map((line, index) => (
              <p key={`deliverable-${index}`}>{line}</p>
            ))}
          </div>

          <h3>사진</h3>
          <div className="photo-toolbar no-print">
            <label className="photo-add-btn">
              사진 추가
              <input
                ref={inputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(event) => {
                  void handlePhotoSelect(event.target.files);
                }}
              />
            </label>
            {photos.length > 0 ? (
              <button
                type="button"
                className="photo-remove"
                onClick={() => setPhotos([])}
              >
                전체 제거
              </button>
            ) : null}
          </div>
          {photoError ? (
            <p className="photo-help" style={{ color: "#b42318" }}>
              {photoError}
            </p>
          ) : null}
          {photos.length === 0 ? (
            <div className="photo">
              아직 추가된 사진이 없습니다.
              <br />
              <span>위에서 사진을 선택하세요</span>
              <p className="photo-help">
                이 브라우저에만 로컬 저장됩니다. 서버에는 올라가지 않습니다.
              </p>
            </div>
          ) : (
            <ul className="photo-grid">
              {photos.map((photo) => (
                <li key={photo.id} className="photo-item">
                  <img src={photo.dataUrl} alt={photo.name} />
                  <div className="caption">{photo.name}</div>
                  <button
                    type="button"
                    className="photo-remove no-print"
                    onClick={() =>
                      setPhotos((prev) =>
                        prev.filter((item) => item.id !== photo.id),
                      )
                    }
                  >
                    제거
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section>
          <h2>3. 이달 결과와 이슈</h2>
          <h3>달성한 것</h3>
          <div className="block">
            {multilineLines(report.achievements).map((line, index) => (
              <p key={`ach-${index}`}>{line}</p>
            ))}
          </div>
          <h3>배운 점</h3>
          <div className="block">
            {multilineLines(report.learnings).map((line, index) => (
              <p key={`learn-${index}`}>{line}</p>
            ))}
          </div>
          <h3>어려웠던 점</h3>
          <div className="block">
            {multilineLines(report.difficulties).map((line, index) => (
              <p key={`diff-${index}`}>{line}</p>
            ))}
          </div>
        </section>

        <section>
          <h2>4. AI 서비스 관련</h2>
          {report.ai_services.length === 0 ? (
            <div className="block">
              <p>-</p>
            </div>
          ) : (
            report.ai_services.map((item, index) => (
              <div key={item.id} className="ai-card">
                <h3>
                  {index + 1}. {textOrDash(item.serviceName)}
                </h3>
                <ul>
                  <li>
                    <strong>사용자</strong>: {textOrDash(item.users)}
                  </li>
                  <li>
                    <strong>활용사례/결과물</strong>: {textOrDash(item.usage)}
                  </li>
                  <li>
                    <strong>스터디와의 연관성</strong>:{" "}
                    {textOrDash(item.relevance)}
                  </li>
                </ul>
              </div>
            ))
          )}
        </section>

        <section>
          <h2>5. 다음 모임 계획</h2>
          <ul>
            <li>
              <strong>모임 예정일</strong>: {formatDate(report.next_meeting_date)}
            </li>
            <li>
              <strong>다음 주제</strong>: {textOrDash(report.next_topic)}
            </li>
            <li>
              <strong>목표</strong>:{" "}
              {multilineLines(report.next_goals).map((line, index) => (
                <span key={`goal-${index}`}>
                  {index > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </li>
          </ul>
        </section>
      </article>
    </div>
  );
}
