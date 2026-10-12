"use client";

import { useActionState } from "react";
import { loginAdmin } from "@/app/actions/admin";

export function AdminLoginForm() {
  const [state, formAction, pending] = useActionState(loginAdmin, {
    error: null,
  });

  return (
    <form className="login-form" action={formAction}>
      <div className="field">
        <label htmlFor="password">관리자 비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
        />
      </div>
      {state.error ? <p className="error-text">{state.error}</p> : null}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "확인 중…" : "관리자 입장"}
      </button>
    </form>
  );
}
