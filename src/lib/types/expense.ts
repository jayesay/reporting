export type GrantExpense = {
  id: string;
  workspace_id: string;
  spent_on: string;
  amount: number;
  description: string;
  created_at: string;
};

export type GrantExpenseInput = {
  spent_on: string;
  amount: number;
  description: string;
};

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export function normalizeExpenseDate(value: string) {
  const trimmed = value.trim();
  return DATE_RE.test(trimmed) ? trimmed : "";
}

export function parseExpenseAmount(value: string | number) {
  if (typeof value === "number") {
    return Number.isInteger(value) && value > 0 ? value : null;
  }

  const digits = value.replace(/[^\d]/g, "");
  if (!digits) return null;
  const amount = Number(digits);
  if (!Number.isInteger(amount) || amount <= 0 || amount > 1_000_000_000) {
    return null;
  }
  return amount;
}

export function normalizeExpenseDescription(value: string) {
  return value.trim().slice(0, 200);
}

export function expenseMonth(spentOn: string) {
  return spentOn.slice(0, 7);
}
