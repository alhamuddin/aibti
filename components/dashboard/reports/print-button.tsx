"use client";

import { Printer } from "lucide-react";

export function PrintReportButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="border-border text-foreground hover:bg-accent inline-flex min-h-10 items-center gap-2 rounded-lg border px-3.5 text-sm font-semibold print:hidden"
    >
      <Printer aria-hidden="true" className="size-4" /> Print
    </button>
  );
}
