import { NextResponse } from "next/server";
import { getParticipationReport } from "@/lib/participation-report-query";
import { prisma } from "@/lib/prisma";
import { roles } from "@/lib/permissions";
import { isUserRole } from "@/lib/roles";
import { parseParticipationReportFilters, toCsvCell } from "@/lib/reporting";
import { getSession } from "@/lib/session";

const maxExportRows = 5000;

export async function GET(request: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ message: "Sign in to export this report." }, { status: 401 });
  }

  const role = session.user.role ?? "";
  if (
    !isUserRole(role) ||
    !roles[role].authorize({ report: ["export"] }).success ||
    role === "teacher"
  ) {
    return NextResponse.json({ message: "You cannot export this report." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, mustChangePassword: true },
  });
  if (!user || user.banned) {
    return NextResponse.json({ message: "This account cannot export reports." }, { status: 401 });
  }
  if (user.mustChangePassword) {
    return NextResponse.json(
      { message: "Change your initial password before exporting reports." },
      { status: 403 },
    );
  }

  const params: Record<string, string | string[]> = {};
  new URL(request.url).searchParams.forEach((value, key) => {
    const existing = params[key];
    params[key] =
      existing === undefined
        ? value
        : Array.isArray(existing)
          ? [...existing, value]
          : [existing, value];
  });
  const { filters, errors } = parseParticipationReportFilters(params);
  if (errors.length) {
    return NextResponse.json({ message: errors.join(" ") }, { status: 400 });
  }

  const report = await getParticipationReport(session.user.id, role, filters, 1, maxExportRows + 1);
  if (report.total > maxExportRows) {
    return NextResponse.json(
      {
        message: `This report contains ${report.total.toLocaleString()} rows. Add filters to export no more than ${maxExportRows.toLocaleString()} rows at a time.`,
      },
      { status: 413 },
    );
  }

  await prisma.reportExportLog.create({
    data: {
      actorUserId: session.user.id,
      reportType: "participation",
      filters: {
        courseId: filters.courseId || null,
        branchId: filters.branchId || null,
        status: filters.status || null,
        from: filters.from || null,
        to: filters.to || null,
        q: filters.q || null,
      },
      rowCount: report.rows.length,
    },
  });

  const header = [
    "Employee",
    "Employee ID",
    "Branch",
    "Course",
    "Batch",
    "Status",
    "Enrolled date",
    "Last attended",
    "Sessions attended",
    "Last completed",
    "Months ago",
    "Times completed",
    "Certificate",
  ];
  const records = report.rows.map((row) => [
    row.employee,
    row.employeeId,
    row.branch,
    row.course,
    row.batch,
    row.status,
    row.assignedAt.toISOString(),
    row.lastAttendedAt?.toISOString() ?? "",
    row.attendanceCount,
    row.lastCompletedAt?.toISOString() ?? "",
    row.monthsAgo ?? "",
    row.timesCompleted,
    row.certificateNumber ? "Issued" : "Not issued",
  ]);
  const csv = [header, ...records].map((record) => record.map(toCsvCell).join(",")).join("\r\n");
  const date = new Date().toISOString().slice(0, 10);

  return new Response(`\uFEFF${csv}\r\n`, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `attachment; filename="participation-report-${date}.csv"`,
      "Content-Type": "text/csv; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
