const SEOUL = "Asia/Seoul";

export function seoulDate(date = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: SEOUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function seoulYearMonth(date = new Date()) {
  return seoulDate(date).slice(0, 7);
}

export function formatWon(amount: number) {
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatSeoulDateTime(value: string) {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString("ko-KR", {
    timeZone: SEOUL,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}
