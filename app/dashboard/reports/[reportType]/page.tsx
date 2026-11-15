import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download, FileBarChart, Search } from "lucide-react";
import { canAccessReport, getReportDefinition, type ReportFilter } from "@/lib/report-catalog";
import {
  generateReport,
  getReportOptions,
  getRequestedPage,
  parseReportFilters,
} from "@/lib/report-query";
import type { ReportSearchParams } from "@/lib/reporting";
import { isUserRole } from "@/lib/roles";
import { requireAuthenticatedUser } from "@/lib/session";
import { formatDateTime } from "@/utils/date-time";
import { PrintReportButton } from "@/components/dashboard/reports/print-button";

export const instant = false;

function reportHref(reportId: string, filters: Record<string, string | number>, page: number) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== "" && value !== 0) params.set(key, String(value));
  });
  params.set("run", "1");
  if (page > 1) params.set("page", String(page));
  return `/dashboard/reports/${reportId}?${params.toString()}`;
}

function labelStatus(value: string) {
  return value
    .replaceAll("_", " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatCell(value: string | number | null, key: string) {
  if (value === null || value === "") return "—";
  if (typeof value === "string" && /_at$/.test(key) && !Number.isNaN(Date.parse(value))) {
    return formatDateTime(new Date(value), "Asia/Dhaka");
  }
  return typeof value === "string" && /^[A-Z_]+$/.test(value) ? labelStatus(value) : String(value);
}

function StatusFilter({ reportId, value }: { reportId: string; value: string }) {
  const options =
    reportId === "compliance"
      ? ["COMPLIANT", "DUE_SOON", "OVERDUE", "NEVER"]
      : reportId === "attendance"
        ? ["PRESENT", "ABSENT"]
        : reportId === "cascade-completion"
          ? ["APPROVED", "PENDING_APPROVAL", "NOT_SUBMITTED", "OVERDUE"]
          : reportId === "certificate-register"
            ? ["ISSUED", "NOT_ISSUED", "COMPLETED"]
            : ["ASSIGNED", "CONFIRMED", "COMPLETED", "DECLINED", "WITHDRAWN"];
  return (
    <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
      Status
      <select
        name="status"
        defaultValue={value}
        className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
      >
        <option value="">All statuses</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {labelStatus(option)}
          </option>
        ))}
      </select>
    </label>
  );
}

export default async function ReportGenerationPage({
  params,
  searchParams,
}: {
  params: Promise<{ reportType: string }>;
  searchParams: Promise<ReportSearchParams>;
}) {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!isUserRole(role)) redirect("/dashboard");
  const { reportType } = await params;
  const definition = getReportDefinition(reportType);
  if (!definition) notFound();
  if (!canAccessReport(role, reportType)) redirect("/dashboard/reports");

  const paramsValue = await searchParams;
  const { filters, errors } = parseReportFilters(paramsValue);
  const requestedPage = getRequestedPage(paramsValue);
  const shouldRun = paramsValue.run === "1";
  const options = await getReportOptions(session.user.id, role);
  const report =
    shouldRun && errors.length === 0
      ? await generateReport(reportType, session.user.id, role, filters, requestedPage)
      : null;
  const canExport =
    Boolean(report) &&
    canAccessReport(role, reportType) &&
    (role === "admin" || role === "super_admin") &&
    (report?.total ?? 0) > 0;
  const hrefFilters = { ...filters, months: filters.months };
  const exportParams = new URLSearchParams();
  Object.entries(hrefFilters).forEach(([key, value]) => {
    if (value !== "" && value !== 0) exportParams.set(key, String(value));
  });

  function hasFilter(filter: ReportFilter) {
    return definition?.filters.includes(filter) ?? false;
  }

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/reports"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Report catalogue
      </Link>

      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary flex items-center gap-2 text-sm font-semibold">
            <FileBarChart aria-hidden="true" className="size-4" /> {definition.category}
          </p>
          <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
            {definition.name}
          </h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
            {definition.answers}
          </p>
        </div>
        {report ? (
          <div className="flex flex-wrap gap-2">
            {canExport ? (
              <Link
                href={`/api/reports/${reportType}?${exportParams.toString()}`}
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-10 items-center gap-2 rounded-lg px-3.5 text-sm font-semibold"
              >
                <Download aria-hidden="true" className="size-4" /> Export CSV
              </Link>
            ) : null}
            <PrintReportButton />
          </div>
        ) : null}
      </header>

      <section className="border-border bg-card rounded-2xl border p-4 shadow-sm sm:p-5">
        <form
          method="get"
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 [&_input]:w-full [&_input]:min-w-0 [&_select]:w-full [&_select]:min-w-0 [&>*]:min-w-0"
        >
          <input type="hidden" name="run" value="1" />
          {hasFilter("employee") ? (
            <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
              Employee
              <span className="relative">
                <Search
                  aria-hidden="true"
                  className="text-muted-foreground absolute top-1/2 left-3 size-4 -translate-y-1/2"
                />
                <input
                  name="q"
                  type="search"
                  maxLength={100}
                  defaultValue={filters.q}
                  placeholder="Name or employee ID"
                  className="border-input bg-background text-foreground min-h-10 w-full rounded-lg border pr-3 pl-9 text-sm font-normal"
                />
              </span>
            </label>
          ) : null}
          {hasFilter("course") ? (
            <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
              Course{reportType === "compliance" ? " (required)" : ""}
              <select
                name="courseId"
                required={reportType === "compliance"}
                defaultValue={filters.courseId}
                className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
              >
                <option value="">
                  {reportType === "compliance" ? "Select a course" : "All courses"}
                </option>
                {options.courses.map((course) => (
                  <option key={course.id} value={course.id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {hasFilter("batch") ? (
            <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
              Batch / cohort
              <select
                name="batchId"
                defaultValue={filters.batchId}
                className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
              >
                <option value="">All batches</option>
                {options.batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.courseTitle} · {batch.name}
                  </option>
                ))}
              </select>
            </label>
          ) : null}
          {hasFilter("branch") ? (
            <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
              Branch
              {role === "branch_manager" ? (
                <span className="border-input bg-muted text-foreground flex min-h-10 items-center rounded-lg border px-3 text-sm font-normal">
                  Your assigned branch
                </span>
              ) : (
                <select
                  name="branchId"
                  defaultValue={filters.branchId}
                  className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
                >
                  <option value="">All branches</option>
                  {options.branches.map((branch) => (
                    <option key={branch.id} value={branch.id}>
                      {branch.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ) : null}
          {hasFilter("status") ? (
            <StatusFilter reportId={reportType} value={filters.status} />
          ) : null}
          {hasFilter("trainer") ? (
            <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
              Trainer
              {role === "teacher" ? (
                <span className="border-input bg-muted text-foreground flex min-h-10 items-center rounded-lg border px-3 text-sm font-normal">
                  My scorecard
                </span>
              ) : (
                <select
                  name="trainerId"
                  defaultValue={filters.trainerId}
                  className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
                >
                  <option value="">All trainers</option>
                  {options.trainers.map((trainer) => (
                    <option key={trainer.id} value={trainer.id}>
                      {trainer.name}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ) : null}
          {hasFilter("entity") ? (
            <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
              Entity
              <select
                name="entity"
                defaultValue={filters.entity}
                className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
              >
                <option value="">All recorded entities</option>
                <option value="user">User administration</option>
                <option value="course">Course changes</option>
              </select>
            </label>
          ) : null}
          {hasFilter("lookback") ? (
            <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
              Lookback period (months)
              <input
                name="months"
                type="number"
                min={1}
                max={120}
                required
                defaultValue={filters.months}
                className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
              />
            </label>
          ) : null}
          {hasFilter("dateRange") ? (
            <>
              <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
                From
                <input
                  name="from"
                  type="date"
                  defaultValue={filters.from}
                  className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
                />
              </label>
              <label className="text-muted-foreground grid gap-1.5 text-xs font-semibold">
                To
                <input
                  name="to"
                  type="date"
                  defaultValue={filters.to}
                  className="border-input bg-background text-foreground min-h-10 rounded-lg border px-3 text-sm font-normal"
                />
              </label>
            </>
          ) : null}
          <div className="flex min-w-0 items-end gap-2 sm:col-span-2 xl:col-span-3 2xl:col-span-4">
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-10 rounded-lg px-4 text-sm font-semibold transition-colors"
            >
              Run report
            </button>
            <Link
              href={`/dashboard/reports/${reportType}`}
              className="border-border text-foreground hover:bg-accent inline-flex min-h-10 items-center rounded-lg border px-4 text-sm font-semibold transition-colors"
            >
              Reset
            </Link>
          </div>
        </form>
      </section>

      {definition.caveat ? (
        <p className="border-border bg-muted/40 text-muted-foreground rounded-xl border px-4 py-3 text-xs leading-5">
          {definition.caveat}
        </p>
      ) : null}
      {errors.length ? (
        <div
          role="alert"
          className="border-destructive/30 bg-destructive/5 text-destructive rounded-xl border p-4 text-sm"
        >
          {errors.join(" ")}
        </div>
      ) : null}

      {!report && !errors.length ? (
        <section className="border-border bg-card rounded-2xl border px-5 py-14 text-center shadow-sm">
          <FileBarChart aria-hidden="true" className="text-muted-foreground mx-auto size-9" />
          <h2 className="text-card-foreground mt-3 font-semibold">Ready to generate</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Set any filters you need, then run this report against current training records.
          </p>
        </section>
      ) : null}

      {report ? (
        <>
          <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="Report summary">
            {report.summary.map((item) => (
              <article
                key={item.label}
                className="border-border bg-card rounded-xl border p-4 shadow-sm"
              >
                <p className="text-muted-foreground text-xs">{item.label}</p>
                <p className="text-card-foreground mt-2 text-2xl font-bold tabular-nums">
                  {item.value}
                </p>
              </article>
            ))}
          </section>
          {report.note ? (
            <p className="text-muted-foreground text-xs leading-5">{report.note}</p>
          ) : null}
          <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
            <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b p-4 sm:p-5">
              <div>
                <h2 className="text-card-foreground font-semibold">{definition.name} results</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {report.total.toLocaleString()} matching records · {report.pageSize} per page ·
                  live data
                </p>
              </div>
              <span className="text-muted-foreground text-xs">
                Generated {formatDateTime(new Date(), "Asia/Dhaka")}
              </span>
            </div>
            {report.rows.length ? (
              <div className="overflow-x-auto">
                <table className="w-full min-w-max border-collapse text-left text-sm">
                  <thead className="bg-muted/50 text-muted-foreground text-xs">
                    <tr>
                      {report.columns.map((column) => (
                        <th
                          scope="col"
                          key={column.key}
                          className="px-4 py-3 font-semibold whitespace-nowrap"
                        >
                          {column.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-border divide-y">
                    {report.rows.map((row, index) => (
                      <tr key={`${reportType}-${index}`} className="hover:bg-muted/30">
                        {report.columns.map((column) => (
                          <td
                            key={column.key}
                            className="text-card-foreground px-4 py-3 whitespace-nowrap"
                          >
                            {formatCell(row[column.key] ?? null, column.key)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="px-5 py-12 text-center">
                <h3 className="text-card-foreground font-semibold">No matching records</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  Change the selected filters and run the report again.
                </p>
              </div>
            )}
            <footer className="border-border flex items-center justify-between border-t px-4 py-3">
              <p className="text-muted-foreground text-xs">
                Page {report.page} of {Math.max(1, Math.ceil(report.total / report.pageSize))}
              </p>
              <nav aria-label="Report pages" className="flex gap-2">
                <Link
                  href={reportHref(reportType, hrefFilters, Math.max(1, report.page - 1))}
                  aria-disabled={report.page <= 1}
                  className={`border-border inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-semibold ${report.page <= 1 ? "pointer-events-none opacity-50" : "text-foreground hover:bg-accent"}`}
                >
                  Previous
                </Link>
                <Link
                  href={reportHref(
                    reportType,
                    hrefFilters,
                    Math.min(
                      Math.max(1, Math.ceil(report.total / report.pageSize)),
                      report.page + 1,
                    ),
                  )}
                  aria-disabled={report.page >= Math.ceil(report.total / report.pageSize)}
                  className={`border-border inline-flex min-h-9 items-center rounded-lg border px-3 text-xs font-semibold ${report.page >= Math.ceil(report.total / report.pageSize) ? "pointer-events-none opacity-50" : "text-foreground hover:bg-accent"}`}
                >
                  Next
                </Link>
              </nav>
            </footer>
          </section>
        </>
      ) : null}
    </main>
  );
}
