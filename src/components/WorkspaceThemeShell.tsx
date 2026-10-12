import type { CSSProperties, ReactNode } from "react";
import {
  themeCssVars,
  type WorkspaceThemeId,
} from "@/lib/workspace-theme";

type WorkspaceThemeShellProps = {
  theme: WorkspaceThemeId;
  children: ReactNode;
  className?: string;
};

export function WorkspaceThemeShell({
  theme,
  children,
  className,
}: WorkspaceThemeShellProps) {
  const vars = themeCssVars(theme);
  return (
    <div
      className={["workspace-theme", className].filter(Boolean).join(" ")}
      data-theme={theme}
      style={vars as CSSProperties}
    >
      {children}
    </div>
  );
}
