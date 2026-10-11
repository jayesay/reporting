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

const createSlug = customAlphabet(
  "0123456789abcdefghijklmnopqrstuvwxyz",
  12,
);

type DbReport = Omit<Report, "ai_services" | "attendees"> & {
  attendees: string[] | null;
  ai_services: AiServiceEntry[] | null;
};

function normalizeReport(row: DbReport): Report {
  return {
    ...row,
    attendees: row.attendees ?? [],
    ai_services: row.ai_services ?? [],
  };
}

function toPayload(input: ReportInput) {
  return {
    status: input.status,
    team_name: input.team_name,
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

export async function listReports(): Promise<
  { ok: true; reports: ReportListItem[] } | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "목록을 불러오지 못했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .select("slug, status, team_name, author, report_month, topic, updated_at")
      .order("updated_at", { ascending: false });

    if (error) {
      return { ok: false, error: error.message };
    }

    return { ok: true, reports: (data ?? []) as ReportListItem[] };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "목록을 불러오지 못했습니다.",
    };
  }
}

export async function createReport(
  input: ReportInput = createEmptyReportInput(),
): Promise<
  { ok: true; slug: string; updatedAt: string } | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "보고서 생성에 실패했습니다. 잠시 후 다시 시도하세요.",
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const slug = createSlug();

    const { data, error } = await supabase
      .from("reports")
      .insert({
        slug,
        ...toPayload(input),
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
      error: error instanceof Error ? error.message : "보고서 생성에 실패했습니다.",
    };
  }
}

export async function getReportBySlug(
  slug: string,
): Promise<{ ok: true; report: Report } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "보고서를 불러오지 못했습니다.",
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .select("*")
      .eq("slug", slug)
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
      error: error instanceof Error ? error.message : "보고서를 불러오지 못했습니다.",
    };
  }
}

export async function saveReport(
  slug: string,
  input: ReportInput,
): Promise<
  { ok: true; updatedAt: string } | { ok: false; error: string }
> {
  if (!isSupabaseConfigured()) {
    return {
      ok: false,
      error: "저장에 실패했습니다.",
    };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("reports")
      .update(toPayload(input))
      .eq("slug", slug)
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
  slug: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isSupabaseConfigured()) {
    return { ok: false, error: "삭제에 실패했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase.from("reports").delete().eq("slug", slug);

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
