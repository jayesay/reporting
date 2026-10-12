"use client";

import { useActionState } from "react";
import { loginWithPassword } from "@/app/actions/auth";

type LoginFormProps = {
  workspaceSlug: string;
  nextPath: string;
};

export function LoginForm({ workspaceSlug, nextPath }: LoginFormProps) {
  const [state, formAction, pending] = useActionState(loginWithPassword, {
    error: null,
  });

  return (
    <form className="login-form" action={formAction}>
      <input type="hidden" name="workspace" value={workspaceSlug} />
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
          placeholder="워크스페이스 비밀번호"
        />
      </div>
      {state.error ? <p className="error-text">{state.error}</p> : null}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "확인 중…" : "입장하기"}
      </button>
    </form>
  );
}
