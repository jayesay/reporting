"use client";

import { useActionState } from "react";
import { loginWithPassword } from "@/app/actions/auth";

type LoginFormProps = {
  nextPath: string;
};

export function LoginForm({ nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginWithPassword, {
    error: null,
  });

  return (
    <form className="login-form" action={formAction}>
      <input type="hidden" name="next" value={nextPath} />
      <div className="field">
        <label htmlFor="password">비밀번호</label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          placeholder="팀 공통 비밀번호"
        />
      </div>
      {state.error ? <p className="error-text">{state.error}</p> : null}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "확인 중…" : "입장하기"}
      </button>
    </form>
  );
}
