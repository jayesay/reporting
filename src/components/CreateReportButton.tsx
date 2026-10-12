"use client";

import { useRouter } from "next/navigation";
import { workspaceNewReportPath } from "@/lib/paths";

type CreateReportButtonProps = {
  workspaceSlug: string;
};

export function CreateReportButton({ workspaceSlug }: CreateReportButtonProps) {
  const router = useRouter();

  return (
    <div className="create-actions">
      <button
        type="button"
        className="btn primary"
        onClick={() => router.push(workspaceNewReportPath(workspaceSlug))}
      >
        새 보고서 등록
      </button>
    </div>
  );
}
