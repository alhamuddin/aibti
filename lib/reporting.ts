import type { CourseEnrollmentStatus } from "@/generated/prisma/enums";

export const reportEnrollmentStatuses = [
  "ASSIGNED",
  "CONFIRMED",
  "COMPLETED",
  "DECLINED",
  "WITHDRAWN",
] as const satisfies readonly CourseEnrollmentStatus[];

export type ParticipationReportFilters = {
  q: string;
  courseId: string;
  branchId: string;
  status: CourseEnrollmentStatus | "";
  from: string;
  to: string;
};

export type ReportSearchParams = Record<string, string | string[] | undefined>;

const datePattern = /^\d{4}-\d{2}-\d{2}$/;

function getSingleValue(value: string | string[] | undefined): string | null {
  if (value === undefined) return "";
  return typeof value === "string" ? value : null;
}

function isValidDateInput(value: string): boolean {
  if (!datePattern.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function parseParticipationReportFilters(params: ReportSearchParams): {
  filters: ParticipationReportFilters;
  errors: string[];
} {
  const errors: string[] = [];
  const values = {
    q: getSingleValue(params.q),
    courseId: getSingleValue(params.courseId),
    branchId: getSingleValue(params.branchId),
    status: getSingleValue(params.status),
    from: getSingleValue(params.from),
    to: getSingleValue(params.to),
  };
  for (const [key, value] of Object.entries(values)) {
    if (value === null) errors.push(`Use one value for the ${key} filter.`);
  }

  const q = values.q ?? "";
  const courseId = values.courseId ?? "";
  const branchId = values.branchId ?? "";
  const statusValue = values.status ?? "";
  const from = values.from ?? "";
  const to = values.to ?? "";
  const status = reportEnrollmentStatuses.find((candidate) => candidate === statusValue) ?? "";

  if (q.length > 100) errors.push("Search must be 100 characters or fewer.");
  if (courseId.length > 100 || branchId.length > 100) {
    errors.push("The selected report filter is invalid.");
  }
  if (statusValue && !status) {
    errors.push("Select a valid enrollment status.");
  }
  if ((from && !isValidDateInput(from)) || (to && !isValidDateInput(to))) {
    errors.push("Enter valid dates for the report range.");
  }
  if (from && to && from > to) {
    errors.push("The start date must be on or before the end date.");
  }

  return {
    filters: {
      q: q.trim(),
      courseId,
      branchId,
      status,
      from,
      to,
    },
    errors,
  };
}

export function getDhakaDateBoundary(date: string): Date {
  return new Date(`${date}T00:00:00.000+06:00`);
}

export function getMonthsSinceInDhaka(date: Date, now = new Date()): number {
  const formatter = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
  });
  const getParts = (value: Date) => {
    const parts = formatter.formatToParts(value);
    const year = Number(parts.find((part) => part.type === "year")?.value);
    const month = Number(parts.find((part) => part.type === "month")?.value);
    return year * 12 + month;
  };

  return Math.max(0, getParts(now) - getParts(date));
}

export function toCsvCell(value: string | number | null): string {
  let text = value === null ? "" : String(value);
  if (/^[\t\r=+\-@]/.test(text.trimStart())) text = `'${text}`;
  return `"${text.replaceAll('"', '""')}"`;
}
