import { NextResponse } from "next/server";
import { canAccessReport, getReportDefinition } from "@/lib/report-catalog";
import { generateReport, parseReportFilters } from "@/lib/report-query";
import { toCsvCell } from "@/lib/reporting";
import { isUserRole } from "@/lib/roles";
import { roles } from "@/lib/permissions";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";

const maxExportRows = 5000;

export async function GET(
  request: Request,
  { params }: { params: Promise<{ reportType: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Sign in to export reports." }, { status: 401 });
  const role = session.user.role ?? "";
  if (!isUserRole(role))
    return NextResponse.json({ message: "You cannot export reports." }, { status: 403 });

  const { reportType } = await params;
  const definition = getReportDefinition(reportType);
  if (!definition) return NextResponse.json({ message: "Report not found." }, { status: 404 });
  if (
    !canAccessReport(role, reportType) ||
    !roles[role].authorize({ report: ["export"] }).success
  ) {
    return NextResponse.json({ message: "You cannot export this report." }, { status: 403 });
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, mustChangePassword: true },
  });
  if (!actor || actor.banned)
    return NextResponse.json({ message: "This account cannot export reports." }, { status: 401 });
  if (actor.mustChangePassword)
    return NextResponse.json(
      { message: "Change your initial password before exporting reports." },
      { status: 403 },
    );

  const searchParams: Record<string, string | string[]> = {};
  new URL(request.url).searchParams.forEach((value, key) => {
    const existing = searchParams[key];
    searchParams[key] =
      existing === undefined
        ? value
        : Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
  });
  const { filters, errors } = parseReportFilters(searchParams);
  if (errors.length) return NextResponse.json({ message: errors.join(" ") }, { status: 400 });
  if (reportType === "compliance" && !filters.courseId) {
    return NextResponse.json(
      { message: "Select a course before exporting the compliance report." },
      { status: 400 },
    );
  }

  const report = await generateReport(
    reportType,
    session.user.id,
    role,
    filters,
    1,
    maxExportRows + 1,
  );
  if (report.total > maxExportRows) {
    return NextResponse.json(
      {
        message: `This report contains ${report.total.toLocaleString()} rows. Add filters to export at most ${maxExportRows.toLocaleString()} rows.`,
      },
      { status: 413 },
    );
  }

  await prisma.reportExportLog.create({
    data: {
      actorUserId: session.user.id,
      reportType,
      filters: {
        q: filters.q || null,
        courseId: filters.courseId || null,
        batchId: filters.batchId || null,
        branchId: filters.branchId || null,
        trainerId: filters.trainerId || null,
        status: filters.status || null,
        entity: filters.entity || null,
        months: filters.months,
        from: filters.from || null,
        to: filters.to || null,
      },
      rowCount: report.rows.length,
    },
  });

  const csv = [
    report.columns.map((column) => toCsvCell(column.label)).join(","),
    ...report.rows.map((row) =>
      report.columns.map((column) => toCsvCell(row[column.key] ?? null)).join(","),
    ),
  ].join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="${reportType}-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
