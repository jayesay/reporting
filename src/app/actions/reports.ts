"use server";

import { customAlphabet } from "nanoid";
import {
  createEmptyReportInput,
  normalizeJournals,
  normalizeNextPlans,
  type AiServiceEntry,
  type JournalEntry,
  type Report,
  type ReportInput,
} from "@/lib/types/report";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import { getWorkspaceBySlug } from "@/app/actions/workspaces";

const createSlug = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  12,
);

function mapSchemaError(message: string, fallback: string) {
  const missingColumn =
    (message.includes("journals") || message.includes("next_plans")) &&
    (message.includes("schema cache") ||
      message.includes("does not exist") ||
      message.includes("Could not find"));
  if (missingColumn) {
    return "보고서 양식 테이블이 아직 반영되지 않았습니다. supabase/add_journals_and_next_plans.sql을 실행해 주세요.";
  }
  return message || fallback;
}

type DbReport = {
  id: string;
  slug: string;
  status: Report["status"];
  team_name: string;
  author: string;
  report_month: string;
  attendees: string[] | null;
  journals: unknown;
  session_no?: unknown;
  meeting_start?: unknown;
  meeting_end?: unknown;
  location?: unknown;
  topic?: unknown;
  study_content?: unknown;
  deliverables?: unknown;
  achievements: string;
  learnings: string;
  difficulties: string;
  ai_services: AiServiceEntry[] | null;
  next_plans: unknown;
  next_meeting_date?: unknown;
  next_topic?: unknown;
  next_goals?: unknown;
  created_at: string;
  updated_at: string;
  workspace_id: string;
};

function journalsOf(row: {
  journals?: unknown;
  attendees?: unknown;
  session_no?: unknown;
  meeting_start?: unknown;
  meeting_end?: unknown;
  location?: unknown;
  topic?: unknown;
  study_content?: unknown;
  deliverables?: unknown;
}) {
  return normalizeJournals(
    row.journals,
    row,
    Array.isArray(row.attendees) ? row.attendees : [],
  );
}

function firstJournal(journals: JournalEntry[]): JournalEntry | undefined {
  return journals[0];
}

function normalizeReport(row: DbReport): Report {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    team_name: row.team_name,
    author: row.author,
    report_month: row.report_month,
    attendees: row.attendees ?? [],
    journals: journalsOf(row),
    achievements: row.achievements,
    learnings: row.learnings,
    difficulties: row.difficulties,
    ai_services: row.ai_services ?? [],
    next_plans: normalizeNextPlans(row.next_plans, row),
    created_at: row.created_at,
    updated_at: row.updated_at,
    workspace_id: row.workspace_id,
  };
}

function toPayload(input: ReportInput, teamName: string) {
  const journals = normalizeJournals(input.journals).slice(0, 2);
  const nextPlans = normalizeNextPlans(input.next_plans).slice(0, 2);
  const first = firstJournal(journals);
  const firstPlan = nextPlans[0];

  return {
    status: input.status,
    team_name: teamName,
    author: input.author,
    report_month: input.report_month,
    session_no: first?.session_no ?? null,
    attendees: input.attendees.filter((name) => name.trim().length > 0),
    meeting_start: first?.meeting_start ?? "",
    meeting_end: first?.meeting_end ?? "",
    location: first?.location ?? "",
    topic: first?.topic ?? "",
    study_content: first?.study_content ?? "",
    deliverables: first?.deliverables ?? "",
    journals,
    achievements: input.achievements,
    learnings: input.learnings,
    difficulties: input.difficulties,
    ai_services: input.ai_services,
    next_plans: nextPlans,
    next_meeting_date: firstPlan?.meeting_date ?? "",
    next_topic: firstPlan?.topic ?? "",
    next_goals: firstPlan?.goals ?? "",
  };
}

export type ReportListItem = {
  slug: string;
  status: Report["status"];
  team_name: string;
  author: string;
  report_month: string;
  journals: JournalEntry[];
  updated_at: string;
};

export type NewReportDefaults = {
  attendees: string[];
};

async function resolveWorkspace(workspaceSlug: string) {
  return getWorkspaceBySlug(workspaceSlug);
}

/** 가장 최근 보고서의 팀원 (새 보고서 기본값) */
export async function getNewReportDefaults(
  workspaceSlug: string,
): Promise<NewReportDefaults> {
  const empty: NewReportDefaults = { attendees: [] };
  const workspaceResult = await resolveWorkspace(workspaceSlug);
  if (!workspaceResult.ok) return empty;

  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .select("attendees")
      .eq("workspace_id", workspaceResult.workspace.id)
      .order("updated_at", { ascending: false })
      .limit(20);

    if (error || !data) return empty;

    for (const row of data) {
      const list = Array.isArray(row.attendees)
        ? row.attendees
            .filter((item): item is string => typeof item === "string")
            .map((item) => item.trim())
            .filter(Boolean)
        : [];
      if (list.length > 0) return { attendees: list };
    }
    return empty;
  } catch {
    return empty;
  }
}

export async function listReports(
  workspaceSlug: string,
): Promise<
  { ok: true; reports: ReportListItem[] } | { ok: false; error: string }
> {
  const workspaceResult = await resolveWorkspace(workspaceSlug);
  if (!workspaceResult.ok) {
    return { ok: false, error: workspaceResult.error };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "목록을 불러오지 못했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const fullSelect =
      "slug, status, team_name, author, report_month, journals, topic, session_no, meeting_start, meeting_end, study_content, deliverables, location, updated_at";
    const legacySelect =
      "slug, status, team_name, author, report_month, topic, session_no, meeting_start, meeting_end, study_content, deliverables, location, updated_at";

    const primary = await supabase
      .from("reports")
      .select(fullSelect)
      .eq("workspace_id", workspaceResult.workspace.id)
      .order("updated_at", { ascending: false });

    const result =
      primary.error && primary.error.message.includes("journals")
        ? await supabase
            .from("reports")
            .select(legacySelect)
            .eq("workspace_id", workspaceResult.workspace.id)
            .order("updated_at", { ascending: false })
        : primary;

    if (result.error) {
      return {
        ok: false,
        error: mapSchemaError(result.error.message, "목록을 불러오지 못했습니다."),
      };
    }

    const reports: ReportListItem[] = (result.data ?? []).map((row) => ({
      slug: row.slug as string,
      status: row.status as Report["status"],
      team_name: String(row.team_name ?? ""),
      author: String(row.author ?? ""),
      report_month: String(row.report_month ?? ""),
      journals: journalsOf(row),
      updated_at: row.updated_at as string,
    }));

    return { ok: true, reports };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "목록을 불러오지 못했습니다.",
    };
  }
}

export async function createReport(
  workspaceSlug: string,
  input: ReportInput = createEmptyReportInput(),
): Promise<
  { ok: true; slug: string; updatedAt: string } | { ok: false; error: string }
> {
  const workspaceResult = await resolveWorkspace(workspaceSlug);
  if (!workspaceResult.ok) {
    return { ok: false, error: workspaceResult.error };
  }

  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "보고서 생성에 실패했습니다. 잠시 후 다시 시도하세요.",
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const slug = createSlug();
    const { workspace } = workspaceResult;

    const { data, error } = await supabase
      .from("reports")
      .insert({
        slug,
        workspace_id: workspace.id,
        ...toPayload(input, workspace.name),
      })
      .select("updated_at")
      .single();

    if (error) {
      return { ok: false, error: mapSchemaError(error.message, "보고서 생성에 실패했습니다.") };
    }

    return { ok: true, slug, updatedAt: data.updated_at as string };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error ? error.message : "보고서 생성에 실패했습니다.",
    };
  }
}

export async function getReportBySlug(
  workspaceSlug: string,
  reportSlug: string,
): Promise<{ ok: true; report: Report } | { ok: false; error: string }> {
  const workspaceResult = await resolveWorkspace(workspaceSlug);
  if (!workspaceResult.ok) {
    return { ok: false, error: workspaceResult.error };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "보고서를 불러오지 못했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("slug", reportSlug)
      .eq("workspace_id", workspaceResult.workspace.id)
      .maybeSingle();

    if (error) {
      return { ok: false, error: error.message };
    }

    if (!data) {
      return { ok: false, error: "보고서를 찾을 수 없습니다." };
    }

    return { ok: true, report: normalizeReport(data as DbReport) };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "보고서를 불러오지 못했습니다.",
    };
  }
}

/** 구 URL(/r/slug) 리다이렉트용 */
export async function findReportWorkspaceSlug(
  reportSlug: string,
): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  try {
    const supabase = createSupabaseServerClient();
    const { data: report } = await supabase
      .from("reports")
      .select("workspace_id")
      .eq("slug", reportSlug)
      .maybeSingle();

    if (!report?.workspace_id) return null;

    const { data: workspace } = await supabase
      .from("workspaces")
      .select("slug")
      .eq("id", report.workspace_id)
      .maybeSingle();

    return workspace?.slug ?? null;
  } catch {
    return null;
  }
}

export async function saveReport(
  workspaceSlug: string,
  reportSlug: string,
  input: ReportInput,
): Promise<{ ok: true; updatedAt: string } | { ok: false; error: string }> {
  const workspaceResult = await resolveWorkspace(workspaceSlug);
  if (!workspaceResult.ok) {
    return { ok: false, error: workspaceResult.error };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "저장에 실패했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .update(toPayload(input, workspaceResult.workspace.name))
      .eq("slug", reportSlug)
      .eq("workspace_id", workspaceResult.workspace.id)
      .select("updated_at")
      .maybeSingle();

    if (error) {
      return {
        ok: false,
        error: mapSchemaError(error.message, "저장에 실패했습니다."),
      };
    }

    if (!data) {
      return { ok: false, error: "보고서를 찾을 수 없습니다." };
    }

    return { ok: true, updatedAt: data.updated_at as string };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "저장에 실패했습니다.",
    };
  }
}

export async function deleteReport(
  workspaceSlug: string,
  reportSlug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const workspaceResult = await resolveWorkspace(workspaceSlug);
  if (!workspaceResult.ok) {
    return { ok: false, error: workspaceResult.error };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "삭제에 실패했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("reports")
      .delete()
      .eq("slug", reportSlug)
      .eq("workspace_id", workspaceResult.workspace.id);

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "삭제에 실패했습니다.",
    };
  }
}
