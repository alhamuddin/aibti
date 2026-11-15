"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function LearnInBranchApprovalRefresh() {
  const router = useRouter();

  useEffect(() => {
    const intervalId = window.setInterval(() => router.refresh(), 30_000);
    return () => window.clearInterval(intervalId);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="border-border text-foreground min-h-9 rounded-lg border px-3 text-xs font-semibold"
    >
      Refresh approvals
    </button>
  );
}
