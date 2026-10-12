"use client";

import { useTransition } from "react";
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

  return (
    <select
      className="theme-inline-select"
      value={theme}
      disabled={pending}
      aria-label="톤 변경"
      onChange={(event) => {
        const next = event.target.value as WorkspaceThemeId;
        startTransition(async () => {
          await updateWorkspaceTheme(workspaceId, next);
        });
      }}
    >
      {WORKSPACE_THEMES.map((item) => (
        <option key={item.id} value={item.id}>
          {item.label}
        </option>
      ))}
    </select>
  );
}
