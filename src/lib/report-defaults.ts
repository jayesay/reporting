const ATTENDEES_KEY = "innosight-attendees";

function attendeesKey(workspaceSlug: string) {
  return `${ATTENDEES_KEY}:${workspaceSlug}`;
}

export function readStoredAttendees(workspaceSlug: string): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(attendeesKey(workspaceSlug));
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

export function storeAttendees(workspaceSlug: string, values: string[]) {
  if (typeof window === "undefined") return;
  const cleaned = values.map((item) => item.trim()).filter(Boolean);
  if (cleaned.length === 0) return;
  try {
    window.localStorage.setItem(
      attendeesKey(workspaceSlug),
      JSON.stringify(cleaned),
    );
  } catch {
    // ignore quota / private mode
  }
}
