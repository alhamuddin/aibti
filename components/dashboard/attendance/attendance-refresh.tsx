"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

export function AttendanceRefresh() {
  const router = useRouter();

  useEffect(() => {
    const intervalId = window.setInterval(() => router.refresh(), 15_000);
    return () => window.clearInterval(intervalId);
  }, [router]);

  return (
    <button
      type="button"
      onClick={() => router.refresh()}
      className="border-border text-foreground min-h-10 rounded-lg border px-3 text-sm font-semibold"
    >
      Refresh roster
    </button>
  );
}
