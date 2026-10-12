export function workspaceHomePath(workspaceSlug: string) {
  return `/w/${workspaceSlug}`;
}

export function workspaceLoginPath(workspaceSlug: string, next?: string) {
  const base = `/w/${workspaceSlug}/login`;
  if (!next) return base;
  return `${base}?next=${encodeURIComponent(next)}`;
}

export function workspaceNewReportPath(workspaceSlug: string) {
  return `/w/${workspaceSlug}/r/new`;
}

export function workspaceReportPath(workspaceSlug: string, reportSlug: string) {
  return `/w/${workspaceSlug}/r/${reportSlug}`;
}

export function workspaceReportViewPath(
  workspaceSlug: string,
  reportSlug: string,
) {
  return `/w/${workspaceSlug}/r/${reportSlug}/view`;
}
