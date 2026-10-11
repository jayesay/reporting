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

export function textOrDash(value: string) {
  const trimmed = value.trim();
  return trimmed || "-";
}

export function multilineLines(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return ["-"];
  return trimmed.split(/\n+/);
}
