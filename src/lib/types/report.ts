export type ReportStatus = "draft" | "done";

export type DeliverableImage = {
  id: string;
  name: string;
  dataUrl: string;
  bytes: number;
};

export type AiServiceEntry = {
  id: string;
  serviceName: string;
  users: string;
  usage: string;
  relevance: string;
  usage_images: DeliverableImage[];
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
  deliverable_images: DeliverableImage[];
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
/** 항목당 결과물 이미지 업로드 원본 합계. 저장 시 압축하므로 압축 후 용량보다 크게 둔다. */
export const MAX_DELIVERABLE_IMAGE_BYTES = 10 * 1024 * 1024;

function createEntryId(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function withUniqueIds<T extends { id: string }>(items: T[], prefix: string) {
  const seen = new Set<string>();
  return items.map((item) => {
    if (!item.id || seen.has(item.id)) {
      const id = createEntryId(prefix);
      seen.add(id);
      return { ...item, id };
    }
    seen.add(item.id);
    return item;
  });
}

export function createEmptyAiService(): AiServiceEntry {
  return {
    id: createEntryId("ai"),
    serviceName: "",
    users: "",
    usage: "",
    relevance: "",
    usage_images: [],
  };
}

export function normalizeAiService(value: unknown): AiServiceEntry {
  const row =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: asText(row.id) || createEntryId("ai"),
    serviceName: asText(row.serviceName),
    users: asText(row.users),
    usage: asText(row.usage),
    relevance: asText(row.relevance),
    usage_images: normalizeDeliverableImages(row.usage_images),
  };
}

export function normalizeAiServices(value: unknown): AiServiceEntry[] {
  const list = Array.isArray(value) ? value.map(normalizeAiService) : [];
  return list.length > 0 ? withUniqueIds(list, "ai") : [createEmptyAiService()];
}

export function normalizeNameList(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value
    .filter((item): item is string => typeof item === "string")
    .map((item) => item.trim())
    .filter(Boolean);
}

export function createEmptyJournal(teamMembers: string[] = []): JournalEntry {
  return {
    id: createEntryId("journal"),
    session_no: null,
    meeting_start: "",
    meeting_end: "",
    location: "",
    topic: "",
    attendees: normalizeNameList(teamMembers),
    study_content: "",
    deliverables: "",
    deliverable_images: [],
  };
}

export function createEmptyNextPlan(): NextPlanEntry {
  return {
    id: createEntryId("plan"),
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

export function deliverableImagesBytes(images: DeliverableImage[]) {
  return images.reduce((sum, image) => sum + image.bytes, 0);
}

export function formatByteSize(bytes: number) {
  const mb = 1024 * 1024;
  const kb = 1024;
  if (bytes >= mb) {
    const value = bytes / mb;
    const text =
      value >= 10 || Number.isInteger(value)
        ? String(Math.round(value))
        : value.toFixed(1).replace(/\.0$/, "");
    return `${text}MB`;
  }
  if (bytes >= kb) return `${Math.max(1, Math.round(bytes / kb))}KB`;
  return `${bytes}B`;
}

export function normalizeDeliverableImages(value: unknown): DeliverableImage[] {
  if (!Array.isArray(value)) return [];
  const images = value
    .filter(
      (item): item is Record<string, unknown> =>
        Boolean(item) && typeof item === "object",
    )
    .map((item) => {
      const dataUrl = asText(item.dataUrl);
      const storedBytes =
        typeof item.bytes === "number" &&
        Number.isFinite(item.bytes) &&
        item.bytes > 0
          ? Math.floor(item.bytes)
          : dataUrl.length;
      return {
        id: asText(item.id) || `img-${Math.random().toString(36).slice(2, 8)}`,
        name: asText(item.name),
        dataUrl,
        bytes: storedBytes,
      };
    })
    .filter((item) => item.dataUrl.startsWith("data:image/"));

  const kept: DeliverableImage[] = [];
  for (const image of images) {
    if (deliverableImagesBytes(kept) + image.bytes > MAX_DELIVERABLE_IMAGE_BYTES) {
      continue;
    }
    kept.push(image);
  }
  return kept;
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
    id: asText(row.id) || createEntryId("journal"),
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
    deliverable_images: normalizeDeliverableImages(row.deliverable_images),
  };
}

export function normalizeNextPlan(value: unknown): NextPlanEntry {
  const row =
    value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  return {
    id: asText(row.id) || createEntryId("plan"),
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
      item.deliverables.trim() ||
      item.deliverable_images.length > 0,
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
    deliverable_images: [],
  };
}

export function normalizeJournals(
  value: unknown,
  legacy?: Parameters<typeof fallbackJournal>[0],
  teamMembers: string[] = [],
): JournalEntry[] {
  const members = normalizeNameList(teamMembers);
  const list = Array.isArray(value)
    ? withUniqueIds(
        value.map((item) => normalizeJournal(item, members)),
        "journal",
      )
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
  const list = Array.isArray(value)
    ? withUniqueIds(value.map(normalizeNextPlan), "plan")
    : [];
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
