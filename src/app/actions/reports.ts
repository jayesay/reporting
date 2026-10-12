"use server";

import { customAlphabet } from "nanoid";
import {
  createEmptyReportInput,
  type AiServiceEntry,
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

type DbReport = Omit<Report, "ai_services" | "attendees"> & {
  attendees: string[] | null;
  ai_services: AiServiceEntry[] | null;
  workspace_id: string;
};

function normalizeReport(row: DbReport): Report {
  return {
    id: row.id,
    slug: row.slug,
    status: row.status,
    team_name: row.team_name,
    author: row.author,
    report_month: row.report_month,
    attendees: row.attendees ?? [],
    meeting_start: row.meeting_start,
    meeting_end: row.meeting_end,
    location: row.location,
    topic: row.topic,
    study_content: row.study_content,
    deliverables: row.deliverables,
    achievements: row.achievements,
    learnings: row.learnings,
    difficulties: row.difficulties,
    ai_services: row.ai_services ?? [],
    next_meeting_date: row.next_meeting_date,
    next_topic: row.next_topic,
    next_goals: row.next_goals,
    created_at: row.created_at,
    updated_at: row.updated_at,
    workspace_id: row.workspace_id,
  };
}

function toPayload(input: ReportInput, teamName: string) {
  return {
    status: input.status,
    team_name: teamName,
    author: input.author,
    report_month: input.report_month,
    attendees: input.attendees.filter((name) => name.trim().length > 0),
    meeting_start: input.meeting_start,
    meeting_end: input.meeting_end,
    location: input.location,
    topic: input.topic,
    study_content: input.study_content,
    deliverables: input.deliverables,
    achievements: input.achievements,
    learnings: input.learnings,
    difficulties: input.difficulties,
    ai_services: input.ai_services,
    next_meeting_date: input.next_meeting_date,
    next_topic: input.next_topic,
    next_goals: input.next_goals,
  };
}

export type ReportListItem = {
  slug: string;
  status: Report["status"];
  team_name: string;
  author: string;
  report_month: string;
  topic: string;
  updated_at: string;
};

export type NewReportDefaults = {
  attendees: string[];
};

async function resolveWorkspace(workspaceSlug: string) {
  return getWorkspaceBySlug(workspaceSlug);
}

/** 가장 최근 보고서의 참석 인원 (새 보고서 기본값) */
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
    const { data, error } = await supabase
      .from("reports")
      .select("slug, status, team_name, author, report_month, topic, updated_at")
      .eq("workspace_id", workspaceResult.workspace.id)
      .order("updated_at", { ascending: false });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, reports: (data ?? []) as ReportListItem[] };
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
      return { ok: false, error: error.message };
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
      return { ok: false, error: error.message };
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
