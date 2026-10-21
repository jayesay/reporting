export function formatYearMonth(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const match = trimmed.match(/^(\d{4})-(\d{2})$/);
  if (!match) return trimmed;
  return `${match[1]}년 ${match[2]}월`;
}

export function formatDate(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return trimmed;
  return `${match[1]}년 ${match[2]}월 ${match[3]}일`;
}

export function formatDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const match = trimmed.match(
    /^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/,
  );
  if (!match) {
    const asDate = formatDate(trimmed);
    return asDate === "-" ? trimmed : asDate;
  }
  const [, year, month, day, hour, minute] = match;
  return `${year}년 ${month}월 ${day}일 ${hour}시 ${minute}분`;
}

export function formatTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return "-";
  const match = trimmed.match(/(?:^|[T\s])(\d{2}):(\d{2})/);
  if (!match) return trimmed;
  return `${match[1]}시 ${match[2]}분`;
}

function matchMeetingDate(value: string) {
  return value.trim().match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ?? "";
}

function matchMeetingTime(value: string) {
  const trimmed = value.trim();
  return (
    trimmed.match(/T(\d{2}:\d{2})/)?.[1] ??
    trimmed.match(/^(\d{2}:\d{2})$/)?.[1] ??
    ""
  );
}

/** 조회용: 2026년 10월 12일 14시 00분 ~ 16시 00분 */
export function formatMeetingRange(start: string, end: string) {
  const { date, startTime, endTime } = splitMeetingFields(start, end);
  const dateText = date ? formatDate(date) : "";
  const startText = startTime ? formatTime(startTime) : "";
  const endText = endTime ? formatTime(endTime) : "";

  if (dateText && startText && endText) {
    return `${dateText} ${startText} ~ ${endText}`;
  }
  if (dateText && startText) return `${dateText} ${startText}`;
  if (dateText && endText) return `${dateText} ~ ${endText}`;
  if (startText && endText) return `${startText} ~ ${endText}`;
  return dateText || startText || endText || "-";
}

export function splitMeetingFields(start: string, end: string) {
  return {
    date: matchMeetingDate(start) || matchMeetingDate(end),
    startTime: matchMeetingTime(start),
    endTime: matchMeetingTime(end),
  };
}

export function joinMeetingDateTime(date: string, time: string) {
  const d = date.trim();
  const t = time.trim();
  if (d && t) return `${d}T${t}`;
  if (d) return d;
  if (t) return `T${t}`;
  return "";
}

export function formatSessionNo(value: number | null | undefined) {
  if (value == null || !Number.isFinite(value) || value <= 0) return "";
  return `${Math.floor(value)}회`;
}

/** 조회용: 1회 · 2026년 10월 12일 14시 00분 ~ 16시 00분 */
export function formatSessionMeetingLine(
  sessionNo: number | null | undefined,
  meetingStart: string,
  meetingEnd = "",
) {
  const session = formatSessionNo(sessionNo);
  const meeting = formatMeetingRange(meetingStart, meetingEnd);
  const meetingText = meeting === "-" ? "" : meeting;
  if (session && meetingText) return `${session} · ${meetingText}`;
  return session || meetingText;
}

export function textOrDash(value: string) {
  const trimmed = value.trim();
  return trimmed || "-";
}

export function hasText(value: string) {
  return value.trim().length > 0;
}

export function multilineLines(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return ["-"];
  return trimmed.split(/\n+/);
}

export function filledLines(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return [];
  return trimmed.split(/\n+/);
}
