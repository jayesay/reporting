"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  workspaceExpensesPath,
  workspaceNewReportPath,
} from "@/lib/paths";

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
      <Link
        href={workspaceExpensesPath(workspaceSlug)}
        className="btn ghost"
      >
        지원금 지출 내역
      </Link>
    </div>
  );
}
