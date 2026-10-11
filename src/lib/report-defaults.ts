const TEAM_NAME_KEY = "innosight-team-name";
const ATTENDEES_KEY = "innosight-attendees";

export type StoredReportDefaults = {
  teamName: string;
  attendees: string[];
};

export function readStoredTeamName() {
  if (typeof window === "undefined") return "";
  try {
    return window.localStorage.getItem(TEAM_NAME_KEY)?.trim() ?? "";
  } catch {
    return "";
  }
}

export function storeTeamName(value: string) {
  if (typeof window === "undefined") return;
  const trimmed = value.trim();
  if (!trimmed) return;
  try {
    window.localStorage.setItem(TEAM_NAME_KEY, trimmed);
  } catch {
    // ignore quota / private mode
  }
}

export function readStoredAttendees(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(ATTENDEES_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item): item is string => typeof item === "string")
      .map((item) => item.trim())
      .filter(Boolean);
  } catch {
    return [];
  }
}

export function storeAttendees(values: string[]) {
  if (typeof window === "undefined") return;
  const cleaned = values.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  try {
    window.localStorage.setItem(ATTENDEES_KEY, JSON.stringify(cleaned));
  } catch {
    // ignore quota / private mode
  }
}

export function storeReportDefaults(input: {
  team_name: string;
  attendees: string[];
}) {
  storeTeamName(input.team_name);
  storeAttendees(input.attendees);
}
