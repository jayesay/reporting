"use client";

import { useState, useTransition } from "react";
import { postAdminApi } from "@/lib/admin-api";
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
            const result = await postAdminApi("/admin/api/workspaces/theme", {
              workspaceId,
              theme: next,
            });
            if (!result.ok) {
              setValue(previous);
              setError(result.error);
            }
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
