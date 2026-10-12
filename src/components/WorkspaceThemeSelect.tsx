"use client";

import { useEffect, useState, useTransition } from "react";
import { updateWorkspaceTheme } from "@/app/actions/admin";
import {
  WORKSPACE_THEMES,
  type WorkspaceThemeId,
} from "@/lib/workspace-theme";

type WorkspaceThemeSelectProps = {
  workspaceId: string;
  theme: WorkspaceThemeId;
};

export function WorkspaceThemeSelect({
  workspaceId,
  theme,
}: WorkspaceThemeSelectProps) {
  const [pending, startTransition] = useTransition();
  const [value, setValue] = useState(theme);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setValue(theme);
  }, [theme]);

  return (
    <div className="theme-inline-wrap">
      <select
        className="theme-inline-select"
        value={value}
        disabled={pending}
        aria-label="톤 변경"
        onChange={(event) => {
          const previous = value;
          const next = event.target.value as WorkspaceThemeId;
          setValue(next);
          setError(null);
          startTransition(async () => {
            const result = await updateWorkspaceTheme(workspaceId, next);
            if (!result.ok) {
              setValue(previous);
              setError(result.error);
            }
            // router.refresh()는 cacheComponents 환경에서 /admin 재렌더 500을 유발함
          });
        }}
      >
        {WORKSPACE_THEMES.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      {error ? <p className="error-text theme-inline-error">{error}</p> : null}
    </div>
  );
}
