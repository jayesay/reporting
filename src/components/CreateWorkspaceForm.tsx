"use client";

import { useActionState, useEffect, useState } from "react";
import { createWorkspace } from "@/app/actions/admin";

export function CreateWorkspaceForm() {
  const [state, formAction, pending] = useActionState(createWorkspace, {
    error: null,
    createdSlug: null,
  });
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    if (!state.createdSlug) return;
    setNotice(
      `워크스페이스가 만들어졌습니다. 팀 링크: /w/${state.createdSlug}`,
    );
  }, [state.createdSlug]);

  return (
    <form className="admin-create-form" action={formAction}>
      <h2>워크스페이스 추가</h2>
      <div className="grid-3">
        <div className="field">
          <label htmlFor="slug">URL slug</label>
          <input
            id="slug"
            name="slug"
            placeholder="innosight"
            required
            pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
            title="소문자, 숫자, 하이픈만"
          />
        </div>
        <div className="field">
          <label htmlFor="name">이름 (팀명)</label>
          <input id="name" name="name" placeholder="INNOSIGHT" required />
        </div>
        <div className="field">
          <label htmlFor="password">비밀번호</label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={4}
            autoComplete="new-password"
          />
        </div>
      </div>
      <p className="hint">
        팀에게 <code>/w/slug</code> 주소와 비밀번호를 전달하세요. 보고서 팀명은
        이 이름과 동일하게 고정됩니다.
      </p>
      {state.error ? <p className="error-text">{state.error}</p> : null}
      {notice ? <p className="success-text">{notice}</p> : null}
      <button type="submit" className="btn primary" disabled={pending}>
        {pending ? "만드는 중…" : "발급하기"}
      </button>
    </form>
  );
}
