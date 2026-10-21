"use server";

import { getWorkspaceBySlug } from "@/app/actions/workspaces";
import {
  createSupabaseServerClient,
  isSupabaseConfigured,
} from "@/lib/supabase/server";
import {
  normalizeExpenseDate,
  normalizeExpenseDescription,
  parseExpenseAmount,
  type GrantExpense,
  type GrantExpenseInput,
} from "@/lib/types/expense";

function mapTableError(message: string, fallback: string) {
  const missingTable =
    message.includes("grant_expenses") &&
    (message.includes("does not exist") ||
      message.includes("schema cache") ||
      message.includes("Could not find the table"));
  if (missingTable) {
    return "지원금 지출 테이블이 없습니다. supabase/add_grant_expenses.sql을 실행해 주세요.";
  }
  return message || fallback;
}

function normalizeExpense(row: {
  id: string;
  workspace_id: string;
  spent_on: string;
  amount: number;
  description: string | null;
  created_at: string;
}): GrantExpense {
  return {
    id: row.id,
    workspace_id: row.workspace_id,
    spent_on: String(row.spent_on ?? ""),
    amount: Number(row.amount),
    description: String(row.description ?? ""),
    created_at: row.created_at,
  };
}

export async function listGrantExpenses(
  workspaceSlug: string,
): Promise<
  { ok: true; expenses: GrantExpense[] } | { ok: false; error: string }
> {
  const workspaceResult = await getWorkspaceBySlug(workspaceSlug);
  if (!workspaceResult.ok) {
    return { ok: false, error: workspaceResult.error };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "목록을 불러오지 못했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("grant_expenses")
      .select("id, workspace_id, spent_on, amount, description, created_at")
      .eq("workspace_id", workspaceResult.workspace.id)
      .order("spent_on", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      return { ok: false, error: mapTableError(error.message, "목록을 불러오지 못했습니다.") };
    }

    return {
      ok: true,
      expenses: (data ?? []).map((row) =>
        normalizeExpense(row as Parameters<typeof normalizeExpense>[0]),
      ),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? mapTableError(error.message, "목록을 불러오지 못했습니다.")
          : "목록을 불러오지 못했습니다.",
    };
  }
}

export async function createGrantExpense(
  workspaceSlug: string,
  input: GrantExpenseInput,
): Promise<
  { ok: true; expense: GrantExpense } | { ok: false; error: string }
> {
  const workspaceResult = await getWorkspaceBySlug(workspaceSlug);
  if (!workspaceResult.ok) {
    return { ok: false, error: workspaceResult.error };
  }

  const spentOn = normalizeExpenseDate(input.spent_on);
  const amount = parseExpenseAmount(input.amount);
  const description = normalizeExpenseDescription(input.description);

  if (!spentOn) {
    return { ok: false, error: "날짜를 입력해 주세요." };
  }
  if (amount == null) {
    return { ok: false, error: "금액을 숫자로 입력해 주세요." };
  }
  if (!description) {
    return { ok: false, error: "사용 내역을 입력해 주세요." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "등록에 실패했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { data, error } = await supabase
      .from("grant_expenses")
      .insert({
        workspace_id: workspaceResult.workspace.id,
        spent_on: spentOn,
        amount,
        description,
      })
      .select("id, workspace_id, spent_on, amount, description, created_at")
      .single();

    if (error || !data) {
      return {
        ok: false,
        error: mapTableError(error?.message ?? "", "등록에 실패했습니다."),
      };
    }

    return {
      ok: true,
      expense: normalizeExpense(data as Parameters<typeof normalizeExpense>[0]),
    };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? mapTableError(error.message, "등록에 실패했습니다.")
          : "등록에 실패했습니다.",
    };
  }
}

export async function deleteGrantExpense(
  workspaceSlug: string,
  expenseId: string,
): Promise<{ ok: true } | { ok: false; error: string }> {
  const workspaceResult = await getWorkspaceBySlug(workspaceSlug);
  if (!workspaceResult.ok) {
    return { ok: false, error: workspaceResult.error };
  }

  if (!expenseId.trim()) {
    return { ok: false, error: "삭제할 항목이 없습니다." };
  }

  if (!isSupabaseConfigured()) {
    return { ok: false, error: "삭제에 실패했습니다." };
  }

  try {
    const supabase = createSupabaseServerClient();
    const { error } = await supabase
      .from("grant_expenses")
      .delete()
      .eq("id", expenseId)
      .eq("workspace_id", workspaceResult.workspace.id);

    if (error) {
      return { ok: false, error: mapTableError(error.message, "삭제에 실패했습니다.") };
    }

    return { ok: true };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? mapTableError(error.message, "삭제에 실패했습니다.")
          : "삭제에 실패했습니다.",
    };
  }
}
