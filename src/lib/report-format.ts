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

/** 조회용: 2026년 10월 12일 14시 00분 ~ 16시 00분 */
export function formatMeetingRange(start: string, end: string) {
  const startMatch = start
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);
  const endMatch = end
    .trim()
    .match(/^(\d{4})-(\d{2})-(\d{2})[T\s](\d{2}):(\d{2})/);

  if (!startMatch && !endMatch) return "-";

  if (startMatch && endMatch) {
    const [, y, m, d, sh, sm] = startMatch;
    const [, ey, em, ed, eh, emin] = endMatch;
    const sameDay = y === ey && m === em && d === ed;
    if (sameDay) {
      return `${y}년 ${m}월 ${d}일 ${sh}시 ${sm}분 ~ ${eh}시 ${emin}분`;
    }
    return `${formatDateTime(start)} ~ ${formatDateTime(end)}`;
  }

  return formatDateTime(startMatch ? start : end);
}

export function splitMeetingFields(start: string, end: string) {
  const startMatch = start.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  const endMatch = end.trim().match(/^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/);
  return {
    date: startMatch?.[1] ?? endMatch?.[1] ?? "",
    startTime: startMatch?.[2] ?? "",
    endTime: endMatch?.[2] ?? "",
  };
}

export function joinMeetingDateTime(date: string, time: string) {
  const d = date.trim();
  const t = time.trim();
  if (!d || !t) return "";
  return `${d}T${t}`;
}

/** 목록용: 10.12 */
export function formatShortDate(value: string) {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return "";
  return `${match[2]}.${match[3]}`;
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

/** 목록용: 1회 10.12 */
export function formatSessionListSummary(
  sessionNo: number | null | undefined,
  meetingStart: string,
  meetingEnd = "",
) {
  const session = formatSessionNo(sessionNo);
  const date =
    formatShortDate(meetingStart) || formatShortDate(meetingEnd);
  if (session && date) return `${session} ${date}`;
  if (session) return session;
  if (date) return date;
  return "-";
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
