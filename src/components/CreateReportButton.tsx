"use client";

import { useRouter } from "next/navigation";

export function CreateReportButton() {
  const router = useRouter();

  return (
    <div className="create-actions">
      <button
        type="button"
        className="btn primary"
        onClick={() => router.push("/r/new")}
      >
        새 보고서 등록
      </button>
    </div>
  );
}
