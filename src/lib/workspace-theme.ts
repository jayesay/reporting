export const WORKSPACE_THEMES = [
  {
    id: "teal",
    label: "틸 그린",
    swatch: "#0f6e6a",
  },
  {
    id: "ocean",
    label: "오션 블루",
    swatch: "#1d4f91",
  },
  {
    id: "forest",
    label: "포레스트",
    swatch: "#2f6b3a",
  },
  {
    id: "slate",
    label: "슬레이트",
    swatch: "#3d4f5f",
  },
  {
    id: "amber",
    label: "앰버",
    swatch: "#9a5b1a",
  },
] as const;

export type WorkspaceThemeId = (typeof WORKSPACE_THEMES)[number]["id"];

export const DEFAULT_WORKSPACE_THEME: WorkspaceThemeId = "teal";

export function isWorkspaceThemeId(value: string): value is WorkspaceThemeId {
  return WORKSPACE_THEMES.some((theme) => theme.id === value);
}

export function normalizeWorkspaceTheme(value: unknown): WorkspaceThemeId {
  if (typeof value === "string" && isWorkspaceThemeId(value)) {
    return value;
  }
  return DEFAULT_WORKSPACE_THEME;
}

/** 조회 화면 인라인 CSS용 변수 */
export function themeCssVars(theme: WorkspaceThemeId): Record<string, string> {
  switch (theme) {
    case "ocean":
      return {
        "--ink": "#122033",
        "--ink-soft": "#4a5d73",
        "--muted": "#4a5d73",
        "--teal": "#1d4f91",
        "--teal-deep": "#143864",
        "--ok": "#143864",
        "--line": "#d5dee8",
        "--mist": "#e8eef6",
        "--heading-bg": "#d5e3f3",
        "--paper": "#ffffff",
        "--theme-glow-a": "rgba(29, 79, 145, 0.14)",
        "--theme-glow-b": "rgba(90, 140, 190, 0.12)",
        "--theme-grad-top": "#eef3f8",
        "--theme-grad-mid": "#d9e4ef",
        "--theme-grad-bottom": "#eef1f4",
      };
    case "forest":
      return {
        "--ink": "#1a261c",
        "--ink-soft": "#4d6352",
        "--muted": "#4d6352",
        "--teal": "#2f6b3a",
        "--teal-deep": "#1f4a28",
        "--ok": "#1f4a28",
        "--line": "#d7e2d8",
        "--mist": "#e8f0e9",
        "--heading-bg": "#d4e8d8",
        "--paper": "#ffffff",
        "--theme-glow-a": "rgba(47, 107, 58, 0.14)",
        "--theme-glow-b": "rgba(120, 150, 90, 0.12)",
        "--theme-grad-top": "#eef5ef",
        "--theme-grad-mid": "#d8e6da",
        "--theme-grad-bottom": "#f0efe8",
      };
    case "slate":
      return {
        "--ink": "#1c242c",
        "--ink-soft": "#546270",
        "--muted": "#546270",
        "--teal": "#3d4f5f",
        "--teal-deep": "#2a3744",
        "--ok": "#2a3744",
        "--line": "#d7dde3",
        "--mist": "#e9edf0",
        "--heading-bg": "#d9e1e8",
        "--paper": "#ffffff",
        "--theme-glow-a": "rgba(61, 79, 95, 0.14)",
        "--theme-glow-b": "rgba(120, 130, 140, 0.12)",
        "--theme-grad-top": "#eef1f3",
        "--theme-grad-mid": "#dce3e8",
        "--theme-grad-bottom": "#eceae6",
      };
    case "amber":
      return {
        "--ink": "#2a2118",
        "--ink-soft": "#6b5a48",
        "--muted": "#6b5a48",
        "--teal": "#9a5b1a",
        "--teal-deep": "#6e4012",
        "--ok": "#6e4012",
        "--line": "#e4d9cb",
        "--mist": "#f3ebe0",
        "--heading-bg": "#ead7bc",
        "--paper": "#ffffff",
        "--theme-glow-a": "rgba(154, 91, 26, 0.14)",
        "--theme-glow-b": "rgba(180, 130, 70, 0.12)",
        "--theme-grad-top": "#f7f1e8",
        "--theme-grad-mid": "#e8dccb",
        "--theme-grad-bottom": "#f3efe8",
      };
    case "teal":
    default:
      return {
        "--ink": "#12262b",
        "--ink-soft": "#4a646b",
        "--muted": "#4a646b",
        "--teal": "#0f6e6a",
        "--teal-deep": "#0a4f4c",
        "--ok": "#0a4f4c",
        "--line": "#d7e3e1",
        "--mist": "#e7f1f0",
        "--heading-bg": "#d4e9e6",
        "--paper": "#ffffff",
        "--theme-glow-a": "rgba(15, 110, 106, 0.16)",
        "--theme-glow-b": "rgba(15, 110, 106, 0.08)",
        "--theme-grad-top": "#edf5f4",
        "--theme-grad-mid": "#d8e8e6",
        "--theme-grad-bottom": "#e8f0ef",
      };
  }
}
