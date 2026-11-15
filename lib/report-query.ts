import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { getDhakaDateBoundary, getMonthsSinceInDhaka } from "@/lib/reporting";
import type { UserRole } from "@/lib/roles";
import type { ReportSearchParams } from "@/lib/reporting";

export type ReportFilters = {
  q: string;
  courseId: string;
  batchId: string;
  branchId: string;
  trainerId: string;
  status: string;
  entity: string;
  months: number;
  from: string;
  to: string;
};

export type ReportColumn = { key: string; label: string };
export type ReportValue = string | number | null;
export type ReportRow = Record<string, ReportValue>;

export type GeneratedReport = {
  columns: ReportColumn[];
  rows: ReportRow[];
  total: number;
  page: number;
  pageSize: number;
  summary: { label: string; value: string | number }[];
  note?: string;
};

export type ReportOptions = {
  courses: { id: string; title: string }[];
  branches: { id: string; name: string }[];
  batches: { id: string; name: string; courseTitle: string }[];
  trainers: { id: string; name: string }[];
};

const datePattern = /^\d{4}-\d{2}-\d{2}$/;
const statuses = new Set([
  "ASSIGNED",
  "CONFIRMED",
  "COMPLETED",
  "DECLINED",
  "WITHDRAWN",
  "PRESENT",
  "ABSENT",
  "COMPLIANT",
  "DUE_SOON",
  "OVERDUE",
  "NEVER",
  "PENDING_APPROVAL",
  "APPROVED",
  "NOT_SUBMITTED",
  "ISSUED",
  "NOT_ISSUED",
]);

function single(params: ReportSearchParams, key: string): string | null {
  const value = params[key];
  if (value === undefined) return "";
  return typeof value === "string" ? value : null;
}

export function parseReportFilters(params: ReportSearchParams) {
  const errors: string[] = [];
  const entries = Object.fromEntries(
    [
      "q",
      "courseId",
      "batchId",
      "branchId",
      "trainerId",
      "status",
      "entity",
      "months",
      "from",
      "to",
    ].map((key) => [key, single(params, key)]),
  ) as Record<string, string | null>;
  for (const [key, value] of Object.entries(entries)) {
    if (value === null) errors.push(`Use only one value for the ${key} filter.`);
  }

  const q = (entries.q ?? "").trim();
  const courseId = entries.courseId ?? "";
  const batchId = entries.batchId ?? "";
  const branchId = entries.branchId ?? "";
  const trainerId = entries.trainerId ?? "";
  const status = (entries.status ?? "").toUpperCase();
  const entity = (entries.entity ?? "").toLowerCase();
  const from = entries.from ?? "";
  const to = entries.to ?? "";
  const monthsText = entries.months ?? "12";
  const months = /^\d+$/.test(monthsText) ? Number(monthsText) : 0;

  if (q.length > 100) errors.push("Search must be 100 characters or fewer.");
  if ([courseId, batchId, branchId, trainerId].some((value) => value.length > 180)) {
    errors.push("A selected report filter is invalid.");
  }
  if (status && !statuses.has(status)) errors.push("Select a valid report status.");
  if (entity && !["user", "course"].includes(entity)) errors.push("Select a valid audit entity.");
  if (months < 1 || months > 120) errors.push("Choose a lookback between 1 and 120 months.");
  const validDate = (value: string) => {
    if (!datePattern.test(value)) return false;
    const date = new Date(`${value}T00:00:00.000Z`);
    return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
  };
  if ((from && !validDate(from)) || (to && !validDate(to)))
    errors.push("Enter valid dates for the report range.");
  if (from && to && from > to) errors.push("The start date must be on or before the end date.");

  return {
    filters: { q, courseId, batchId, branchId, trainerId, status, entity, months, from, to },
    errors,
  };
}

export function getRequestedPage(params: ReportSearchParams) {
  const value = params.page;
  const page = typeof value === "string" ? Number(value) : 1;
  return Number.isSafeInteger(page) && page > 0 ? page : 1;
}

function dateRange(from: string, to: string) {
  if (!from && !to) return undefined;
  return {
    ...(from ? { gte: getDhakaDateBoundary(from) } : {}),
    ...(to ? { lt: new Date(getDhakaDateBoundary(to).getTime() + 24 * 60 * 60 * 1000) } : {}),
  };
}

async function getAssignedBranchId(userId: string, role: UserRole) {
  if (role !== "branch_manager") return null;
  const branch = await prisma.branch.findUnique({
    where: { managerUserId: userId },
    select: { id: true },
  });
  return branch?.id ?? "__unassigned_branch__";
}

export async function getReportOptions(userId: string, role: UserRole): Promise<ReportOptions> {
  const branchId = await getAssignedBranchId(userId, role);
  const [courses, branches, batches, trainers] = await Promise.all([
    prisma.course.findMany({
      where: {
        isMock: false,
        ...(role === "participant"
          ? { enrollments: { some: { participantId: userId } } }
          : role === "teacher"
            ? { subjects: { some: { teacherId: userId } } }
            : {}),
      },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    role === "admin" || role === "super_admin" || role === "auditor"
      ? prisma.branch.findMany({
          where: { isMock: false },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : branchId
        ? prisma.branch.findMany({ where: { id: branchId }, select: { id: true, name: true } })
        : Promise.resolve([]),
    prisma.courseBatch.findMany({
      where: {
        course: { isMock: false },
        ...(role === "participant"
          ? { enrollments: { some: { participantId: userId } } }
          : role === "teacher"
            ? { subjects: { some: { teacherId: userId } } }
            : {}),
      },
      orderBy: [{ course: { title: "asc" } }, { name: "asc" }],
      select: { id: true, name: true, course: { select: { title: true } } },
    }),
    role === "admin" || role === "super_admin"
      ? prisma.user.findMany({
          where: { role: "teacher", banned: false, isMock: false },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : role === "teacher"
        ? prisma.user.findMany({ where: { id: userId }, select: { id: true, name: true } })
        : Promise.resolve([]),
  ]);

  return {
    courses,
    branches,
    batches: batches.map((batch) => ({
      id: batch.id,
      name: batch.name,
      courseTitle: batch.course.title,
    })),
    trainers,
  };
}

function reportScope(
  role: UserRole,
  userId: string,
  branchId: string | null,
): Prisma.CourseEnrollmentWhereInput {
  return {
    course: { isMock: false },
    participant: {
      isMock: false,
      banned: false,
      ...(role === "participant" ? { id: userId } : {}),
      ...(role === "branch_manager" ? { branchId: branchId ?? "__unassigned_branch__" } : {}),
    },
    ...(role === "teacher" ? { batch: { subjects: { some: { teacherId: userId } } } } : {}),
  };
}

function withEnrollmentFilters(
  scope: Prisma.CourseEnrollmentWhereInput,
  filters: ReportFilters,
): Prisma.CourseEnrollmentWhereInput {
  const clauses: Prisma.CourseEnrollmentWhereInput[] = [scope];
  if (filters.courseId) clauses.push({ courseId: filters.courseId });
  if (filters.batchId) clauses.push({ batchId: filters.batchId });
  if (filters.branchId) clauses.push({ participant: { branchId: filters.branchId } });
  if (
    filters.status &&
    ["ASSIGNED", "CONFIRMED", "COMPLETED", "DECLINED", "WITHDRAWN"].includes(filters.status)
  ) {
    clauses.push({ status: filters.status as Prisma.EnumCourseEnrollmentStatusFilter["equals"] });
  }
  const assignedAt = dateRange(filters.from, filters.to);
  if (assignedAt) clauses.push({ assignedAt });
  if (filters.q) {
    clauses.push({
      participant: {
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { employeeId: { contains: filters.q, mode: "insensitive" } },
        ],
      },
    });
  }
  return { AND: clauses };
}

function pageSizeValue(value: number | undefined) {
  if (!value || !Number.isFinite(value)) return 50;
  return Math.min(Math.max(1, Math.floor(value)), 5001);
}

function dhakaLookbackBoundary(months: number, now = new Date()) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone: "Asia/Dhaka",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  }).formatToParts(now);
  const year = Number(parts.find((part) => part.type === "year")?.value);
  const month = Number(parts.find((part) => part.type === "month")?.value);
  const day = Number(parts.find((part) => part.type === "day")?.value);
  const target = new Date(Date.UTC(year, month - 1 - months, 1));
  const lastDay = new Date(
    Date.UTC(target.getUTCFullYear(), target.getUTCMonth() + 1, 0),
  ).getUTCDate();
  const date = `${target.getUTCFullYear()}-${String(target.getUTCMonth() + 1).padStart(2, "0")}-${String(Math.min(day, lastDay)).padStart(2, "0")}`;
  return getDhakaDateBoundary(date);
}

function fmt(date: Date | null | undefined) {
  return date?.toISOString() ?? null;
}

const transcriptColumns: ReportColumn[] = [
  { key: "employee", label: "Employee" },
  { key: "employee_id", label: "Employee ID" },
  { key: "branch", label: "Branch" },
  { key: "course", label: "Course" },
  { key: "batch", label: "Batch" },
  { key: "status", label: "Status" },
  { key: "enrolled_at", label: "Enrolled" },
  { key: "completed_at", label: "Completed" },
  { key: "attendance_sessions", label: "Attendance sessions" },
  { key: "certificate", label: "Certificate" },
];

export async function generateReport(
  reportId: string,
  userId: string,
  role: UserRole,
  filters: ReportFilters,
  requestedPage = 1,
  requestedPageSize?: number,
): Promise<GeneratedReport> {
  const branchId = await getAssignedBranchId(userId, role);
  const pageSize = pageSizeValue(requestedPageSize);
  const base = Math.max(1, requestedPage);
  const offset = (base - 1) * pageSize;

  if (reportId === "employee-transcript" || reportId === "participation") {
    const where = withEnrollmentFilters(reportScope(role, userId, branchId), filters);
    const [total, enrollments] = await Promise.all([
      prisma.courseEnrollment.count({ where }),
      prisma.courseEnrollment.findMany({
        where,
        orderBy: [{ assignedAt: "desc" }, { id: "asc" }],
        skip: offset,
        take: pageSize,
        select: {
          id: true,
          status: true,
          assignedAt: true,
          completedAt: true,
          certificateNumber: true,
          participantId: true,
          courseId: true,
          participant: {
            select: { name: true, employeeId: true, branch: { select: { name: true } } },
          },
          course: { select: { title: true } },
          batch: { select: { name: true } },
        },
      }),
    ]);
    const participantIds = [...new Set(enrollments.map((row) => row.participantId))];
    const courseIds = [...new Set(enrollments.map((row) => row.courseId))];
    const records =
      participantIds.length && courseIds.length
        ? await prisma.attendanceRecord.findMany({
            where: {
              participantId: { in: participantIds },
              status: "PRESENT",
              session: { courseId: { in: courseIds } },
            },
            select: { participantId: true, session: { select: { courseId: true } } },
          })
        : [];
    const attendanceCount = new Map<string, number>();
    records.forEach((record) => {
      const key = `${record.participantId}:${record.session.courseId}`;
      attendanceCount.set(key, (attendanceCount.get(key) ?? 0) + 1);
    });
    const rows = enrollments.map((row) => ({
      employee: row.participant.name,
      employee_id: row.participant.employeeId ?? "",
      branch: row.participant.branch?.name ?? "Unassigned",
      course: row.course.title,
      batch: row.batch.name,
      status: row.status,
      enrolled_at: fmt(row.assignedAt),
      completed_at: fmt(row.completedAt),
      attendance_sessions: attendanceCount.get(`${row.participantId}:${row.courseId}`) ?? 0,
      certificate: row.certificateNumber ?? "Not issued",
    }));
    const [completed, active] = await Promise.all([
      prisma.courseEnrollment.count({ where: { AND: [where, { status: "COMPLETED" }] } }),
      prisma.courseEnrollment.count({
        where: { AND: [where, { status: { in: ["ASSIGNED", "CONFIRMED"] } }] },
      }),
    ]);
    return {
      columns: transcriptColumns,
      rows,
      total,
      page: base,
      pageSize,
      summary: [
        { label: "Matching records", value: total },
        { label: "Completed", value: completed },
        { label: "In progress", value: active },
        { label: "Other statuses", value: Math.max(0, total - completed - active) },
      ],
    };
  }

  if (reportId === "not-trained" || reportId === "compliance") {
    if (reportId === "compliance" && !filters.courseId) {
      return {
        columns: [],
        rows: [],
        total: 0,
        page: base,
        pageSize,
        summary: [],
        note: "Select a course to generate a course-specific recency report.",
      };
    }
    const cutoff = dhakaLookbackBoundary(filters.months);
    const dueSoonStart = dhakaLookbackBoundary(Math.max(1, Math.ceil(filters.months * 0.8)));
    const userAnd: Prisma.UserWhereInput[] = [];
    if (role === "branch_manager") userAnd.push({ branchId: branchId ?? "__unassigned_branch__" });
    if (filters.branchId) userAnd.push({ branchId: filters.branchId });
    if (filters.q) {
      userAnd.push({
        OR: [
          { name: { contains: filters.q, mode: "insensitive" } },
          { employeeId: { contains: filters.q, mode: "insensitive" } },
        ],
      });
    }
    const commonUserWhere: Prisma.UserWhereInput = {
      role: "participant",
      banned: false,
      isMock: false,
      ...(userAnd.length ? { AND: userAnd } : {}),
    };
    const completionWhere: Prisma.CourseEnrollmentWhereInput = {
      status: "COMPLETED",
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      course: { isMock: false },
    };
    const where: Prisma.UserWhereInput = { ...commonUserWhere };
    if (reportId === "not-trained") {
      where.courseEnrollments = { none: { ...completionWhere, completedAt: { gte: cutoff } } };
    } else {
      if (filters.status === "NEVER") where.courseEnrollments = { none: completionWhere };
      if (filters.status === "COMPLIANT")
        where.courseEnrollments = {
          some: { ...completionWhere, completedAt: { gte: dueSoonStart } },
        };
      if (filters.status === "DUE_SOON") {
        where.AND = [
          {
            courseEnrollments: {
              some: { ...completionWhere, completedAt: { gte: cutoff, lt: dueSoonStart } },
            },
          },
          {
            courseEnrollments: { none: { ...completionWhere, completedAt: { gte: dueSoonStart } } },
          },
        ];
      }
      if (filters.status === "OVERDUE") {
        where.AND = [
          { courseEnrollments: { some: { ...completionWhere, completedAt: { lt: cutoff } } } },
          { courseEnrollments: { none: { ...completionWhere, completedAt: { gte: cutoff } } } },
        ];
      }
    }
    const [total, people] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: [{ name: "asc" }, { id: "asc" }],
        skip: offset,
        take: pageSize,
        select: {
          name: true,
          employeeId: true,
          branch: { select: { name: true } },
          courseEnrollments: {
            where: completionWhere,
            orderBy: { completedAt: "desc" },
            take: 1,
            select: { completedAt: true, course: { select: { title: true } } },
          },
        },
      }),
    ]);
    const rows = people.map((person) => {
      const completion = person.courseEnrollments[0];
      let status = "OVERDUE";
      if (!completion?.completedAt) status = "NEVER";
      else if (completion.completedAt >= dueSoonStart) status = "COMPLIANT";
      else if (completion.completedAt >= cutoff) status = "DUE_SOON";
      return {
        employee: person.name,
        employee_id: person.employeeId ?? "",
        branch: person.branch?.name ?? "Unassigned",
        course: completion?.course.title ?? (filters.courseId ? "Selected course" : "Any course"),
        last_completed: fmt(completion?.completedAt),
        months_since_completion: completion?.completedAt
          ? getMonthsSinceInDhaka(completion.completedAt)
          : null,
        status: reportId === "not-trained" ? "NOT TRAINED IN LOOKBACK" : status,
      };
    });
    const columns: ReportColumn[] = [
      { key: "employee", label: "Employee" },
      { key: "employee_id", label: "Employee ID" },
      { key: "branch", label: "Branch" },
      { key: "course", label: "Course" },
      { key: "last_completed", label: "Last completed" },
      { key: "months_since_completion", label: "Months since completion" },
      { key: "status", label: "Status" },
    ];
    return {
      columns,
      rows,
      total,
      page: base,
      pageSize,
      summary: [
        {
          label: reportId === "not-trained" ? "People needing refresh" : "Matching people",
          value: total,
        },
        { label: "Lookback", value: `${filters.months} months` },
      ],
      note:
        reportId === "compliance"
          ? `Recency bands use the selected ${filters.months}-month interval: compliant in the most recent 80%, due soon in the final 20%, overdue after the interval, or never trained.`
          : undefined,
    };
  }

  if (reportId === "attendance") {
    const where: Prisma.AttendanceRecordWhereInput = {
      ...(filters.status === "PRESENT" || filters.status === "ABSENT"
        ? { status: filters.status }
        : {}),
      participant: {
        isMock: false,
        banned: false,
        ...(filters.branchId ? { branchId: filters.branchId } : {}),
        ...(role === "branch_manager" ? { branchId: branchId ?? "__unassigned_branch__" } : {}),
      },
      session: {
        course: { isMock: false, ...(filters.courseId ? { id: filters.courseId } : {}) },
        ...(filters.batchId ? { batchId: filters.batchId } : {}),
        ...(filters.from || filters.to
          ? {
              courseDate: {
                ...(filters.from ? { gte: filters.from } : {}),
                ...(filters.to ? { lte: filters.to } : {}),
              },
            }
          : {}),
      },
    };
    const [total, records, summaryGroups] = await Promise.all([
      prisma.attendanceRecord.count({ where }),
      prisma.attendanceRecord.findMany({
        where,
        orderBy: [{ markedAt: "desc" }, { id: "asc" }],
        skip: offset,
        take: pageSize,
        select: {
          status: true,
          method: true,
          markedAt: true,
          employeeId: true,
          participant: { select: { name: true, branch: { select: { name: true } } } },
          session: {
            select: {
              courseDate: true,
              courseName: true,
              batchName: true,
              initiatedBy: { select: { name: true } },
              course: { select: { title: true } },
            },
          },
        },
      }),
      prisma.attendanceRecord.groupBy({ by: ["status"], where, _count: { _all: true } }),
    ]);
    const present = summaryGroups.find((group) => group.status === "PRESENT")?._count._all ?? 0;
    const absent = summaryGroups.find((group) => group.status === "ABSENT")?._count._all ?? 0;
    return {
      columns: [
        { key: "employee", label: "Employee" },
        { key: "employee_id", label: "Employee ID" },
        { key: "branch", label: "Branch" },
        { key: "course", label: "Course" },
        { key: "batch", label: "Batch" },
        { key: "class_date", label: "Class date" },
        { key: "status", label: "Attendance" },
        { key: "method", label: "Marked by" },
        { key: "trainer", label: "Trainer" },
        { key: "marked_at", label: "Marked at" },
      ],
      rows: records.map((record) => ({
        employee: record.participant.name,
        employee_id: record.employeeId,
        branch: record.participant.branch?.name ?? "Unassigned",
        course: record.session.course.title,
        batch: record.session.batchName,
        class_date: record.session.courseDate,
        status: record.status,
        method: record.method,
        trainer: record.session.initiatedBy.name,
        marked_at: fmt(record.markedAt),
      })),
      total,
      page: base,
      pageSize,
      summary: [
        { label: "Attendance records", value: total },
        { label: "Present", value: present },
        { label: "Absent / no-show marks", value: absent },
        {
          label: "Attendance rate",
          value: present + absent ? `${Math.round((present / (present + absent)) * 100)}%` : "—",
        },
      ],
      note: "Absence is based on an explicit ABSENT mark. The current model does not store an independent no-show event.",
    };
  }

  if (reportId === "trainer-scorecard") {
    const where: Prisma.CourseClassWhereInput = {
      scheduledAt: {
        ...(filters.from ? { gte: getDhakaDateBoundary(filters.from) } : {}),
        ...(filters.to
          ? { lt: new Date(getDhakaDateBoundary(filters.to).getTime() + 86400000) }
          : {}),
      },
      subject: {
        teacherId: role === "teacher" ? userId : filters.trainerId || undefined,
        ...(filters.courseId ? { courseId: filters.courseId } : {}),
        course: { isMock: false, status: { in: ["PUBLISHED", "ARCHIVED"] } },
      },
      speakerEvaluations: { some: {} },
    };
    const [total, classes] = await Promise.all([
      prisma.courseClass.count({ where }),
      prisma.courseClass.findMany({
        where,
        orderBy: [{ scheduledAt: "desc" }, { id: "asc" }],
        skip: offset,
        take: pageSize,
        select: {
          id: true,
          name: true,
          scheduledAt: true,
          subject: {
            select: {
              title: true,
              teacher: { select: { name: true } },
              course: { select: { title: true } },
            },
          },
          speakerEvaluations: {
            select: {
              presentationQuality: true,
              experienceSharing: true,
              sessionBenefit: true,
              topicCompleteness: true,
              learningEnvironment: true,
            },
          },
        },
      }),
    ]);
    const criteria = [
      "presentationQuality",
      "experienceSharing",
      "sessionBenefit",
      "topicCompleteness",
      "learningEnvironment",
    ] as const;
    const rows = classes.map((classSession) => {
      const count = classSession.speakerEvaluations.length;
      const row: ReportRow = {
        trainer: classSession.subject.teacher.name,
        course: classSession.subject.course.title,
        subject: classSession.subject.title,
        class: classSession.name,
        scheduled_at: fmt(classSession.scheduledAt),
        response_count: count,
        visibility: count < 5 ? "WITHHELD (<5 responses)" : "VISIBLE",
      };
      criteria.forEach((criterion) => {
        const average = count
          ? classSession.speakerEvaluations.reduce(
              (sum, evaluation) => sum + evaluation[criterion],
              0,
            ) / count
          : null;
        row[criterion] = count < 5 || average === null ? null : Math.round(average * 100) / 100;
      });
      return row;
    });
    const visible = rows.filter((row) => row.visibility === "VISIBLE");
    const overall = visible.flatMap((row) =>
      criteria
        .map((criterion) => row[criterion])
        .filter((value): value is number => typeof value === "number"),
    );
    return {
      columns: [
        { key: "trainer", label: "Trainer" },
        { key: "course", label: "Course" },
        { key: "subject", label: "Subject" },
        { key: "class", label: "Class" },
        { key: "scheduled_at", label: "Scheduled" },
        { key: "response_count", label: "Responses" },
        ...criteria.map((key) => ({
          key,
          label: key.replace(/[A-Z]/g, (letter) => ` ${letter.toLowerCase()}`),
        })),
      ],
      rows,
      total,
      page: base,
      pageSize,
      summary: [
        { label: "Classes with feedback", value: total },
        { label: "Scores visible on page", value: visible.length },
        {
          label: "Page score average",
          value: overall.length
            ? (overall.reduce((a, b) => a + b, 0) / overall.length).toFixed(2)
            : "—",
        },
      ],
      note: "Category scores are hidden for classes with fewer than five respondents to protect anonymous feedback.",
    };
  }

  if (reportId === "cascade-completion") {
    const branchClauses: Prisma.CourseEnrollmentWhereInput[] = [];
    const scopedBranchId = role === "branch_manager" ? branchId : filters.branchId || null;
    if (scopedBranchId) {
      branchClauses.push({
        OR: [
          { participant: { branchId: scopedBranchId } },
          { learnInBranchReport: { is: { branchId: scopedBranchId } } },
        ],
      });
    }
    if (role === "branch_manager" && filters.branchId && filters.branchId !== branchId) {
      branchClauses.push({ id: "__no_matching_branch__" });
    }
    const dateFilter = dateRange(filters.from, filters.to);
    const where: Prisma.CourseEnrollmentWhereInput = {
      status: "COMPLETED",
      learnInBranchDeadline: { not: null },
      course: { isMock: false, ...(filters.courseId ? { id: filters.courseId } : {}) },
      participant: {
        banned: false,
        isMock: false,
        ...(filters.q
          ? {
              OR: [
                { name: { contains: filters.q, mode: "insensitive" } },
                { employeeId: { contains: filters.q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      ...(branchClauses.length ? { AND: branchClauses } : {}),
      ...(filters.status === "APPROVED" || filters.status === "PENDING_APPROVAL"
        ? { learnInBranchReport: { is: { status: filters.status } } }
        : {}),
      ...(filters.status === "NOT_SUBMITTED" ? { learnInBranchReport: { is: null } } : {}),
      ...(filters.status === "OVERDUE"
        ? {
            learnInBranchReport: { is: null },
            learnInBranchDeadline: { lt: new Date() },
          }
        : {}),
      ...(dateFilter
        ? {
            OR: [
              { learnInBranchReport: { is: { submittedAt: dateFilter } } },
              { learnInBranchReport: { is: null }, learnInBranchDeadline: dateFilter },
            ],
          }
        : {}),
    };
    const [total, enrollments, approved, pending, overdue] = await Promise.all([
      prisma.courseEnrollment.count({ where }),
      prisma.courseEnrollment.findMany({
        where,
        orderBy: [{ learnInBranchDeadline: "asc" }, { id: "asc" }],
        skip: offset,
        take: pageSize,
        select: {
          id: true,
          learnInBranchDeadline: true,
          participant: {
            select: { name: true, employeeId: true, branch: { select: { name: true } } },
          },
          course: { select: { title: true } },
          batch: { select: { name: true } },
          learnInBranchReport: {
            select: {
              status: true,
              submittedAt: true,
              approvedAt: true,
              branch: { select: { name: true } },
              facilitator: { select: { name: true, employeeId: true } },
              sessions: { select: { attendees: { select: { participantId: true } } } },
            },
          },
        },
      }),
      prisma.courseEnrollment.count({
        where: { AND: [where, { learnInBranchReport: { is: { status: "APPROVED" } } }] },
      }),
      prisma.courseEnrollment.count({
        where: { AND: [where, { learnInBranchReport: { is: { status: "PENDING_APPROVAL" } } }] },
      }),
      prisma.courseEnrollment.count({
        where: {
          AND: [
            where,
            { learnInBranchReport: { is: null }, learnInBranchDeadline: { lt: new Date() } },
          ],
        },
      }),
    ]);
    const rows = enrollments.map((enrollment) => {
      const report = enrollment.learnInBranchReport;
      const deadline = enrollment.learnInBranchDeadline;
      const status =
        report?.status ?? (deadline && deadline < new Date() ? "OVERDUE" : "NOT_SUBMITTED");
      const attendees =
        report?.sessions.flatMap((session) =>
          session.attendees.map((attendee) => attendee.participantId),
        ) ?? [];
      return {
        branch: report?.branch.name ?? enrollment.participant.branch?.name ?? "Unassigned",
        facilitator: report?.facilitator.name ?? enrollment.participant.name,
        employee_id: report?.facilitator.employeeId ?? enrollment.participant.employeeId ?? "",
        course: enrollment.course.title,
        batch: enrollment.batch.name,
        status,
        submitted_at: fmt(report?.submittedAt),
        approved_at: fmt(report?.approvedAt),
        deadline: fmt(deadline),
        sessions: report?.sessions.length ?? 0,
        colleagues_reached: new Set(attendees).size,
        on_time:
          deadline && report?.submittedAt ? (report.submittedAt <= deadline ? "Yes" : "No") : null,
      };
    });
    return {
      columns: [
        { key: "branch", label: "Branch" },
        { key: "facilitator", label: "Participant / facilitator" },
        { key: "employee_id", label: "Employee ID" },
        { key: "course", label: "Course" },
        { key: "batch", label: "Batch" },
        { key: "status", label: "Status" },
        { key: "submitted_at", label: "Submitted" },
        { key: "approved_at", label: "Approved" },
        { key: "deadline", label: "Deadline" },
        { key: "sessions", label: "Sessions" },
        { key: "colleagues_reached", label: "Colleagues reached" },
        { key: "on_time", label: "On time" },
      ],
      rows,
      total,
      page: base,
      pageSize,
      summary: [
        { label: "Matching cascade tasks", value: total },
        { label: "Approved", value: approved },
        { label: "Pending approval", value: pending },
        { label: "Overdue and not submitted", value: overdue },
      ],
    };
  }

  if (reportId === "batch-utilisation") {
    const scheduled = dateRange(filters.from, filters.to);
    const where: Prisma.CourseBatchWhereInput = {
      course: { isMock: false, ...(filters.courseId ? { id: filters.courseId } : {}) },
      ...(scheduled ? { classes: { some: { scheduledAt: scheduled } } } : {}),
    };
    const [total, batches] = await Promise.all([
      prisma.courseBatch.count({ where }),
      prisma.courseBatch.findMany({
        where,
        orderBy: [{ course: { title: "asc" } }, { name: "asc" }],
        skip: offset,
        take: pageSize,
        select: {
          name: true,
          course: { select: { title: true, capacity: true } },
          enrollments: {
            where: { status: { in: ["ASSIGNED", "CONFIRMED", "COMPLETED"] } },
            select: { status: true },
          },
          classes: {
            where: scheduled ? { scheduledAt: scheduled } : {},
            select: { venue: true, scheduledAt: true },
          },
        },
      }),
    ]);
    const rows = batches.map((batch) => {
      const enrolled = batch.enrollments.length;
      return {
        course: batch.course.title,
        batch: batch.name,
        enrolled,
        course_capacity: batch.course.capacity,
        seat_fill: batch.course.capacity
          ? `${Math.round((enrolled / batch.course.capacity) * 100)}%`
          : "Capacity not set",
        scheduled_sessions: batch.classes.length,
        venues: [
          ...new Set(batch.classes.map((classSession) => classSession.venue).filter(Boolean)),
        ].join("; "),
      };
    });
    const enrolled = rows.reduce((sum, row) => sum + row.enrolled, 0);
    return {
      columns: [
        { key: "course", label: "Course" },
        { key: "batch", label: "Batch" },
        { key: "enrolled", label: "Enrolled" },
        { key: "course_capacity", label: "Course capacity" },
        { key: "seat_fill", label: "Seat fill" },
        { key: "scheduled_sessions", label: "Scheduled sessions" },
        { key: "venues", label: "Venues" },
      ],
      rows,
      total,
      page: base,
      pageSize,
      summary: [
        { label: "Batches", value: total },
        { label: "Enrolled seats on page", value: enrolled },
      ],
      note: "Seat fill compares cohort enrollment to the course capacity configured in the current system.",
    };
  }

  if (reportId === "certificate-register") {
    const where: Prisma.CourseEnrollmentWhereInput = {
      ...reportScope(role, userId, branchId),
      status: "COMPLETED",
      ...(filters.courseId ? { courseId: filters.courseId } : {}),
      ...(filters.branchId ? { participant: { branchId: filters.branchId } } : {}),
      ...(filters.status === "ISSUED"
        ? { certificateNumber: { not: null } }
        : filters.status === "NOT_ISSUED"
          ? { certificateNumber: null }
          : {}),
      ...(filters.q
        ? {
            participant: {
              OR: [
                { name: { contains: filters.q, mode: "insensitive" } },
                { employeeId: { contains: filters.q, mode: "insensitive" } },
              ],
            },
          }
        : {}),
      ...(dateRange(filters.from, filters.to)
        ? { completedAt: dateRange(filters.from, filters.to) }
        : {}),
    };
    const [total, enrollments, issued] = await Promise.all([
      prisma.courseEnrollment.count({ where }),
      prisma.courseEnrollment.findMany({
        where,
        orderBy: [{ completedAt: "desc" }, { id: "asc" }],
        skip: offset,
        take: pageSize,
        select: {
          status: true,
          completedAt: true,
          certificateNumber: true,
          participant: {
            select: { name: true, employeeId: true, branch: { select: { name: true } } },
          },
          course: { select: { title: true } },
          batch: { select: { name: true } },
        },
      }),
      prisma.courseEnrollment.count({
        where: { AND: [where, { certificateNumber: { not: null } }] },
      }),
    ]);
    return {
      columns: [
        { key: "employee", label: "Employee" },
        { key: "employee_id", label: "Employee ID" },
        { key: "branch", label: "Branch" },
        { key: "course", label: "Course" },
        { key: "batch", label: "Batch" },
        { key: "certificate", label: "Certificate number" },
        { key: "status", label: "Enrollment status" },
        { key: "completed_at", label: "Completed" },
      ],
      rows: enrollments.map((row) => ({
        employee: row.participant.name,
        employee_id: row.participant.employeeId ?? "",
        branch: row.participant.branch?.name ?? "Unassigned",
        course: row.course.title,
        batch: row.batch.name,
        certificate: row.certificateNumber ?? "Not issued",
        status: row.status,
        completed_at: fmt(row.completedAt),
      })),
      total,
      page: base,
      pageSize,
      summary: [
        { label: "Matching records", value: total },
        { label: "Certificates issued", value: issued },
        { label: "Not issued", value: total - issued },
      ],
      note: "Expiry and revocation details are not currently stored.",
    };
  }

  if (reportId === "audit-trail") {
    const dateFilter = dateRange(filters.from, filters.to);
    const userWhere: Prisma.UserAuditLogWhereInput = {
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(filters.q
        ? {
            OR: [
              { actor: { name: { contains: filters.q, mode: "insensitive" } } },
              { target: { name: { contains: filters.q, mode: "insensitive" } } },
              { action: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const courseWhere: Prisma.CourseAuditLogWhereInput = {
      ...(dateFilter ? { createdAt: dateFilter } : {}),
      ...(filters.q
        ? {
            OR: [
              { actor: { name: { contains: filters.q, mode: "insensitive" } } },
              { action: { contains: filters.q, mode: "insensitive" } },
              { courseTitle: { contains: filters.q, mode: "insensitive" } },
            ],
          }
        : {}),
    };
    const [userTotal, courseTotal, userLogs, courseLogs] = await Promise.all([
      filters.entity === "course" ? 0 : prisma.userAuditLog.count({ where: userWhere }),
      filters.entity === "user" ? 0 : prisma.courseAuditLog.count({ where: courseWhere }),
      filters.entity === "course"
        ? []
        : prisma.userAuditLog.findMany({
            where: userWhere,
            orderBy: { createdAt: "desc" },
            take: pageSize + offset,
            select: {
              action: true,
              createdAt: true,
              actor: { select: { name: true, employeeId: true } },
              target: { select: { name: true, employeeId: true } },
            },
          }),
      filters.entity === "user"
        ? []
        : prisma.courseAuditLog.findMany({
            where: courseWhere,
            orderBy: { createdAt: "desc" },
            take: pageSize + offset,
            select: {
              action: true,
              courseTitle: true,
              createdAt: true,
              actor: { select: { name: true, employeeId: true } },
            },
          }),
    ]);
    const allLogs: ReportRow[] = [
      ...userLogs.map((log) => ({
        entity: "User",
        action: log.action,
        actor: log.actor.name,
        actor_employee_id: log.actor.employeeId ?? "",
        target: log.target.name,
        target_employee_id: log.target.employeeId ?? "",
        course: "",
        occurred_at: fmt(log.createdAt),
      })),
      ...courseLogs.map((log) => ({
        entity: "Course",
        action: log.action,
        actor: log.actor.name,
        actor_employee_id: log.actor.employeeId ?? "",
        target: log.courseTitle ?? "Course record",
        target_employee_id: "",
        course: log.courseTitle ?? "",
        occurred_at: fmt(log.createdAt),
      })),
    ].sort((a, b) => String(b.occurred_at).localeCompare(String(a.occurred_at)));
    const total = userTotal + courseTotal;
    return {
      columns: [
        { key: "entity", label: "Entity" },
        { key: "action", label: "Action" },
        { key: "actor", label: "Actor" },
        { key: "actor_employee_id", label: "Actor ID" },
        { key: "target", label: "Target" },
        { key: "target_employee_id", label: "Target ID" },
        { key: "course", label: "Course" },
        { key: "occurred_at", label: "Occurred at" },
      ],
      rows: allLogs.slice(offset, offset + pageSize),
      total,
      page: base,
      pageSize,
      summary: [
        { label: "Audit events", value: total },
        { label: "User changes", value: userTotal },
        { label: "Course changes", value: courseTotal },
      ],
      note: "The current audit tables contain user administration and course changes; other entity types are not yet recorded.",
    };
  }

  return { columns: [], rows: [], total: 0, page: base, pageSize, summary: [] };
}
