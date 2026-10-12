import { Suspense } from "react";
import { redirect } from "next/navigation";
import { findReportWorkspaceSlug } from "@/app/actions/reports";
import { workspaceReportPath } from "@/lib/paths";

async function LegacyRedirect({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const workspaceSlug = await findReportWorkspaceSlug(slug);
  if (workspaceSlug) {
    redirect(workspaceReportPath(workspaceSlug, slug));
  }
  redirect("/");
  return null;
}

export default function LegacyReportPage(props: PageProps<"/r/[slug]">) {
  return (
    <Suspense fallback={null}>
      <LegacyRedirect params={props.params} />
    </Suspense>
  );
}
