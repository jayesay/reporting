"use client";

import { useMemo, useState, useTransition, type FormEvent } from "react";
import {
  createGrantExpense,
  deleteGrantExpense,
} from "@/app/actions/expenses";
import {
  formatWon,
  seoulDate,
  seoulYearMonth,
} from "@/lib/format-datetime";
import { formatDate, formatYearMonth } from "@/lib/report-format";
import {
  expenseMonth,
  parseExpenseAmount,
  type GrantExpense,
} from "@/lib/types/expense";

type ExpenseLedgerProps = {
  workspaceSlug: string;
  initialExpenses: GrantExpense[];
};

function sortExpenses(items: GrantExpense[]) {
  return [...items].sort((a, b) => {
    if (a.spent_on !== b.spent_on) return b.spent_on.localeCompare(a.spent_on);
    return b.created_at.localeCompare(a.created_at);
  });
}

export function ExpenseLedger({
  workspaceSlug,
  initialExpenses,
}: ExpenseLedgerProps) {
  const [expenses, setExpenses] = useState(initialExpenses);
  const [spentOn, setSpentOn] = useState(seoulDate);
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [month, setMonth] = useState(seoulYearMonth);
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const monthOptions = useMemo(() => {
    const months = new Set(expenses.map((item) => expenseMonth(item.spent_on)));
    months.add(month);
    months.add(seoulYearMonth());
    return [...months].filter(Boolean).sort().reverse();
  }, [expenses, month]);

  const monthExpenses = useMemo(
    () => expenses.filter((item) => expenseMonth(item.spent_on) === month),
    [expenses, month],
  );

  const monthTotal = monthExpenses.reduce((sum, item) => sum + item.amount, 0);

  function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    const parsedAmount = parseExpenseAmount(amount);
    if (!spentOn) {
      setError("날짜를 입력해 주세요.");
      return;
    }
    if (parsedAmount == null) {
      setError("금액을 숫자로 입력해 주세요.");
      return;
    }
    if (!description.trim()) {
      setError("사용 내역을 입력해 주세요.");
      return;
    }

    startTransition(async () => {
      const result = await createGrantExpense(workspaceSlug, {
        spent_on: spentOn,
        amount: parsedAmount,
        description,
      });

      if (!result.ok) {
        setError(result.error);
        return;
      }

      setExpenses((current) => sortExpenses([result.expense, ...current]));
      setMonth(expenseMonth(result.expense.spent_on));
      setAmount("");
      setDescription("");
    });
  }

  function handleDelete(expenseId: string) {
    const ok = window.confirm("이 사용 내역을 삭제할까요?");
    if (!ok) return;

    startTransition(async () => {
      const result = await deleteGrantExpense(workspaceSlug, expenseId);
      if (!result.ok) {
        setError(result.error);
        return;
      }
      setExpenses((current) => current.filter((item) => item.id !== expenseId));
    });
  }

  return (
    <div className="expense-ledger">
      <section className="section">
        <h2>사용 내역 등록</h2>
        <form className="expense-form" onSubmit={handleCreate}>
          <div className="field">
            <label htmlFor="spent_on">날짜</label>
            <input
              id="spent_on"
              type="date"
              value={spentOn}
              onChange={(event) => setSpentOn(event.target.value)}
              required
            />
          </div>
          <div className="field">
            <label htmlFor="amount">금액</label>
            <input
              id="amount"
              inputMode="numeric"
              placeholder="예: 15000"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              required
            />
          </div>
          <div className="field expense-desc-field">
            <label htmlFor="description">사용 내역</label>
            <input
              id="description"
              placeholder="예: 회의 다과"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              maxLength={200}
              required
            />
          </div>
          <button type="submit" className="btn primary expense-submit" disabled={pending}>
            {pending ? "등록 중…" : "등록"}
          </button>
        </form>
        {error ? <p className="error-text">{error}</p> : null}
      </section>

      <section className="section">
        <div className="expense-toolbar">
          <div className="field">
            <label htmlFor="expense_month">조회 월</label>
            <input
              id="expense_month"
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              list="expense-month-options"
            />
            <datalist id="expense-month-options">
              {monthOptions.map((value) => (
                <option key={value} value={value} />
              ))}
            </datalist>
          </div>
          <p className="expense-total">
            <span>{formatYearMonth(month)} 총액</span>
            <strong>{formatWon(monthTotal)}</strong>
          </p>
        </div>

        {monthExpenses.length === 0 ? (
          <div className="list-empty">
            <p>이달에 등록된 사용 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="report-table-wrap">
            <table className="expense-table">
              <thead>
                <tr>
                  <th>날짜</th>
                  <th>금액</th>
                  <th>사용 내역</th>
                  <th>관리</th>
                </tr>
              </thead>
              <tbody>
                {monthExpenses.map((item) => (
                  <tr key={item.id}>
                    <td>{formatDate(item.spent_on)}</td>
                    <td className="amount-cell">{formatWon(item.amount)}</td>
                    <td className="desc-cell">{item.description}</td>
                    <td>
                      <button
                        type="button"
                        className="btn ghost danger compact"
                        onClick={() => handleDelete(item.id)}
                        disabled={pending}
                      >
                        삭제
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
