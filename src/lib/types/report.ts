export type ReportStatus = "draft" | "done";

export type AiServiceEntry = {
  id: string;
  serviceName: string;
  users: string;
  usage: string;
  relevance: string;
};

export type JournalEntry = {
  id: string;
  session_no: number | null;
  meeting_start: string;
  meeting_end: string;
  location: string;
  topic: string;
  attendees: string[];
  study_content: string;
  deliverables: string;
};

export type NextPlanEntry = {
  id: string;
  meeting_date: string;
  topic: string;
  goals: string;
};

export type Report = {
  id: string;
  workspace_id: string;
  slug: string;
  status: ReportStatus;
  team_name: string;
  author: string;
  report_month: string;
  attendees: string[];
  journals: JournalEntry[];
  achievements: string;
  learnings: string;
  difficulties: string;
  ai_services: AiServiceEntry[];
  next_plans: NextPlanEntry[];
  created_at: string;
  updated_at: string;
};

export type ReportInput = Omit<
  Report,
  "id" | "slug" | "workspace_id" | "created_at" | "updated_at"
>;

export const MAX_JOURNAL_COUNT = 2;
export const MAX_NEXT_PLAN_COUNT = 2;

let aiServiceSeq = 0;
let journalSeq = 0;
let nextPlanSeq = 0;

export function createEmptyAiService(): AiServiceEntry {
  aiServiceSeq += 1;
  return {
    id: `ai-${aiServiceSeq}`,
    serviceName: "",
    users: "",
    usage: "",
    relevance: "",
  };
}

export function normalizeNameList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createEmptyJournal(teamMembers: string[] = []): JournalEntry {
  journalSeq += 1;
  return {
    id: `journal-${journalSeq}`,
    session_no: null,
    meeting_start: "",
    meeting_end: "",
    location: "",
    topic: "",
    attendees: normalizeNameList(teamMembers),
    study_content: "",
    deliverables: "",
  };
}

export function createEmptyNextPlan(): NextPlanEntry {
  nextPlanSeq += 1;
  return {
    id: `plan-${nextPlanSeq}`,
    meeting_date: "",
    topic: "",
    goals: "",
  };
}

export function normalizeSessionNo(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    return Math.floor(value);
  }
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return Math.floor(parsed);
  }
  return null;
}

function asText(value: unknown) {
  return typeof value === "string" ? value : "";
}

export function normalizeJournal(
  value: unknown,
  fallbackMembers: string[] = [],
): JournalEntry {
  const row =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const hasOwnAttendees =
    value && typeof value === "object" && "attendees" in row;
  return {
    id: asText(row.id) || createEmptyJournal().id,
    session_no: normalizeSessionNo(row.session_no),
    meeting_start: asText(row.meeting_start),
    meeting_end: asText(row.meeting_end),
    location: asText(row.location),
    topic: asText(row.topic),
    attendees: hasOwnAttendees
      ? normalizeNameList(row.attendees)
      : normalizeNameList(fallbackMembers),
    study_content: asText(row.study_content),
    deliverables: asText(row.deliverables),
  };
}

export function normalizeNextPlan(value: unknown): NextPlanEntry {
  const row =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: asText(row.id) || createEmptyNextPlan().id,
    meeting_date: asText(row.meeting_date),
    topic: asText(row.topic),
    goals: asText(row.goals),
  };
}

export function journalHasContent(item: JournalEntry) {
  return Boolean(
    item.session_no ||
      item.meeting_start.trim() ||
      item.meeting_end.trim() ||
      item.location.trim() ||
      item.topic.trim() ||
      item.attendees.length > 0 ||
      item.study_content.trim() ||
      item.deliverables.trim(),
  );
}

export function nextPlanHasContent(item: NextPlanEntry) {
  return Boolean(
    item.meeting_date.trim() || item.topic.trim() || item.goals.trim(),
  );
}

function fallbackJournal(
  row: {
    session_no?: unknown;
    meeting_start?: unknown;
    meeting_end?: unknown;
    location?: unknown;
    topic?: unknown;
    study_content?: unknown;
    deliverables?: unknown;
    attendees?: unknown;
  },
  teamMembers: string[] = [],
): JournalEntry {
  return {
    id: "journal-legacy",
    session_no: normalizeSessionNo(row.session_no),
    meeting_start: asText(row.meeting_start),
    meeting_end: asText(row.meeting_end),
    location: asText(row.location),
    topic: asText(row.topic),
    attendees: normalizeNameList(row.attendees).length
      ? normalizeNameList(row.attendees)
      : normalizeNameList(teamMembers),
    study_content: asText(row.study_content),
    deliverables: asText(row.deliverables),
  };
}

export function normalizeJournals(
  value: unknown,
  legacy?: Parameters<typeof fallbackJournal>[0],
  teamMembers: string[] = [],
): JournalEntry[] {
  const members = normalizeNameList(teamMembers);
  const list = Array.isArray(value)
    ? value.map((item) => normalizeJournal(item, members))
    : [];
  if (list.length > 0) return list.slice(0, MAX_JOURNAL_COUNT);
  if (legacy && journalHasContent(fallbackJournal(legacy, members))) {
    return [fallbackJournal(legacy, members)];
  }
  return [createEmptyJournal(members)];
}

export function normalizeNextPlans(
  value: unknown,
  legacy?: { next_meeting_date?: unknown; next_topic?: unknown; next_goals?: unknown },
): NextPlanEntry[] {
  const list = Array.isArray(value) ? value.map(normalizeNextPlan) : [];
  if (list.length > 0) return list.slice(0, MAX_NEXT_PLAN_COUNT);
  if (legacy) {
    const plan: NextPlanEntry = {
      id: "plan-legacy",
      meeting_date: asText(legacy.next_meeting_date),
      topic: asText(legacy.next_topic),
      goals: asText(legacy.next_goals),
    };
    if (nextPlanHasContent(plan)) return [plan];
  }
  return [createEmptyNextPlan()];
}

export function createEmptyReportInput(): ReportInput {
  return {
    status: "draft",
    team_name: "",
    author: "",
    report_month: "",
    attendees: [],
    journals: [createEmptyJournal()],
    achievements: "",
    learnings: "",
    difficulties: "",
    ai_services: [createEmptyAiService()],
    next_plans: [createEmptyNextPlan()],
  };
}
