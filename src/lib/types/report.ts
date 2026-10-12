export type ReportStatus = "draft" | "done";

export type AiServiceEntry = {
  id: string;
  serviceName: string;
  users: string;
  usage: string;
  relevance: string;
};

export type Report = {
  id: string;
  workspace_id: string;
  slug: string;
  status: ReportStatus;
  team_name: string;
  author: string;
  report_month: string;
  session_no: number | null;
  attendees: string[];
  meeting_start: string;
  meeting_end: string;
  location: string;
  topic: string;
  study_content: string;
  deliverables: string;
  achievements: string;
  learnings: string;
  difficulties: string;
  ai_services: AiServiceEntry[];
  next_meeting_date: string;
  next_topic: string;
  next_goals: string;
  created_at: string;
  updated_at: string;
};

export type ReportInput = Omit<
  Report,
  "id" | "slug" | "workspace_id" | "created_at" | "updated_at"
>;

let aiServiceSeq = 0;

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

export function createEmptyReportInput(): ReportInput {
  return {
    status: "draft",
    team_name: "",
    author: "",
    report_month: "",
    session_no: null,
    attendees: [],
    meeting_start: "",
    meeting_end: "",
    location: "",
    topic: "",
    study_content: "",
    deliverables: "",
    achievements: "",
    learnings: "",
    difficulties: "",
    ai_services: [createEmptyAiService()],
    next_meeting_date: "",
    next_topic: "",
    next_goals: "",
  };
}
