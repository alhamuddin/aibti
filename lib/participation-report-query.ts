import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { CourseEnrollmentStatus } from "@/generated/prisma/enums";
import {
  getDhakaDateBoundary,
  getMonthsSinceInDhaka,
  type ParticipationReportFilters,
} from "@/lib/reporting";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/roles";

const pageSize = 25;

export type ParticipationReportRow = {
  id: string;
  employee: string;
  employeeId: string;
  branch: string;
  course: string;
  batch: string;
  status: CourseEnrollmentStatus;
  assignedAt: Date;
  completedAt: Date | null;
  lastCompletedAt: Date | null;
  monthsAgo: number | null;
  timesCompleted: number;
  attendanceCount: number;
  lastAttendedAt: Date | null;
  certificateNumber: string | null;
};

export type ParticipationReportData = {
  rows: ParticipationReportRow[];
  courses: { id: string; title: string }[];
  branches: { id: string; name: string }[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
  completed: number;
  active: number;
  other: number;
  completionRate: number;
};

type ReportRole = Exclude<UserRole, "teacher">;

function getEnrollmentScope(
  userId: string,
  role: ReportRole,
  branchId: string | null,
): Prisma.CourseEnrollmentWhereInput {
  return {
    course: { isMock: false },
    participant: {
      isMock: false,
      banned: false,
      ...(role === "branch_manager" ? { branchId: branchId ?? "__unassigned_branch__" } : {}),
    },
    ...(role === "participant" ? { participantId: userId } : {}),
  };
}

function getFilteredWhere(
  scope: Prisma.CourseEnrollmentWhereInput,
  filters: ParticipationReportFilters,
  includeStatus = true,
): Prisma.CourseEnrollmentWhereInput {
  const and: Prisma.CourseEnrollmentWhereInput[] = [scope];

  if (filters.courseId) and.push({ courseId: filters.courseId });
  if (filters.branchId) and.push({ participant: { branchId: filters.branchId } });
  if (includeStatus && filters.status) and.push({ status: filters.status });
  if (filters.from || filters.to) {
    and.push({
      assignedAt: {
        ...(filters.from ? { gte: getDhakaDateBoundary(filters.from) } : {}),
        ...(filters.to
          ? {
              lt: new Date(getDhakaDateBoundary(filters.to).getTime() + 24 * 60 * 60 * 1000),
            }
          : {}),
      },
    });
  }
  if (filters.q) {
    and.push({
      OR: [
        { participant: { name: { contains: filters.q, mode: "insensitive" } } },
        { participant: { employeeId: { contains: filters.q, mode: "insensitive" } } },
      ],
    });
  }

  return { AND: and };
}

export async function getParticipationReport(
  userId: string,
  role: ReportRole,
  filters: ParticipationReportFilters,
  requestedPage = 1,
  requestedPageSize = pageSize,
): Promise<ParticipationReportData> {
  const branch =
    role === "branch_manager"
      ? await prisma.branch.findUnique({
          where: { managerUserId: userId },
          select: { id: true },
        })
      : null;
  const scope = getEnrollmentScope(userId, role, branch?.id ?? null);
  const where = getFilteredWhere(scope, filters);
  const [total, statusGroups, courses, branches] = await Promise.all([
    prisma.courseEnrollment.count({ where }),
    prisma.courseEnrollment.groupBy({
      by: ["status"],
      where,
      _count: { _all: true },
    }),
    prisma.course.findMany({
      where: { isMock: false, enrollments: { some: scope } },
      orderBy: { title: "asc" },
      select: { id: true, title: true },
    }),
    role === "admin" || role === "super_admin" || role === "auditor"
      ? prisma.branch.findMany({
          where: {
            isMock: false,
            members: { some: { role: "participant", banned: false, isMock: false } },
          },
          orderBy: { name: "asc" },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);
  const totalPages = Math.max(1, Math.ceil(total / requestedPageSize));
  const page = Math.min(Math.max(1, requestedPage), totalPages);
  const enrollments = await prisma.courseEnrollment.findMany({
    where,
    orderBy: [{ assignedAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * requestedPageSize,
    take: requestedPageSize,
    select: {
      id: true,
      status: true,
      assignedAt: true,
      completedAt: true,
      certificateNumber: true,
      participantId: true,
      courseId: true,
      participant: {
        select: {
          name: true,
          employeeId: true,
          branch: { select: { name: true } },
        },
      },
      course: { select: { title: true } },
      batch: { select: { name: true } },
    },
  });
  const participantIds = [...new Set(enrollments.map((enrollment) => enrollment.participantId))];
  const courseIds = [...new Set(enrollments.map((enrollment) => enrollment.courseId))];
  const branchFilter = filters.branchId ? { participant: { branchId: filters.branchId } } : {};
  const [completionGroups, attendanceGroups] =
    participantIds.length && courseIds.length
      ? await Promise.all([
          prisma.courseEnrollment.groupBy({
            by: ["participantId", "courseId"],
            where: {
              AND: [
                scope,
                branchFilter,
                { participantId: { in: participantIds } },
                { courseId: { in: courseIds } },
                { status: "COMPLETED" },
              ],
            },
            _max: { completedAt: true },
            _count: { _all: true },
          }),
          prisma.attendanceRecord.groupBy({
            by: ["participantId", "sessionId"],
            where: {
              status: "PRESENT",
              participantId: { in: participantIds },
              session: { courseId: { in: courseIds } },
            },
            _max: { markedAt: true },
          }),
        ])
      : [[], []];
  const attendanceSessions = attendanceGroups.length
    ? await prisma.attendanceSession.findMany({
        where: { id: { in: attendanceGroups.map((record) => record.sessionId) } },
        select: { id: true, courseId: true },
      })
    : [];
  const attendanceCourseBySession = new Map(
    attendanceSessions.map((attendanceSession) => [
      attendanceSession.id,
      attendanceSession.courseId,
    ]),
  );
  const completionByParticipantCourse = new Map(
    completionGroups.map((group) => [
      `${group.participantId}:${group.courseId}`,
      { completedAt: group._max.completedAt, count: group._count._all },
    ]),
  );
  const attendanceByParticipantCourse = new Map<
    string,
    { count: number; lastAttendedAt: Date | null }
  >();

  for (const record of attendanceGroups) {
    const courseId = attendanceCourseBySession.get(record.sessionId);
    if (!courseId) continue;
    const key = `${record.participantId}:${courseId}`;
    const attendance = attendanceByParticipantCourse.get(key) ?? {
      count: 0,
      lastAttendedAt: null,
    };
    attendance.count += 1;
    if (
      record._max.markedAt &&
      (!attendance.lastAttendedAt || record._max.markedAt > attendance.lastAttendedAt)
    ) {
      attendance.lastAttendedAt = record._max.markedAt;
    }
    attendanceByParticipantCourse.set(key, attendance);
  }

  const now = new Date();
  const rows = enrollments.map((enrollment) => {
    const key = `${enrollment.participantId}:${enrollment.courseId}`;
    const completion = completionByParticipantCourse.get(key);
    const attendance = attendanceByParticipantCourse.get(key);
    return {
      id: enrollment.id,
      employee: enrollment.participant.name,
      employeeId: enrollment.participant.employeeId ?? "—",
      branch: enrollment.participant.branch?.name ?? "Unassigned",
      course: enrollment.course.title,
      batch: enrollment.batch.name,
      status: enrollment.status,
      assignedAt: enrollment.assignedAt,
      completedAt: enrollment.completedAt,
      lastCompletedAt: completion?.completedAt ?? null,
      monthsAgo: completion?.completedAt
        ? getMonthsSinceInDhaka(completion.completedAt, now)
        : null,
      timesCompleted: completion?.count ?? 0,
      attendanceCount: attendance?.count ?? 0,
      lastAttendedAt: attendance?.lastAttendedAt ?? null,
      certificateNumber: enrollment.certificateNumber,
    };
  });
  const completed = statusGroups.find((group) => group.status === "COMPLETED")?._count._all ?? 0;
  const active = statusGroups
    .filter((group) => group.status === "ASSIGNED" || group.status === "CONFIRMED")
    .reduce((sum, group) => sum + group._count._all, 0);
  const other = statusGroups
    .filter((group) => group.status === "DECLINED" || group.status === "WITHDRAWN")
    .reduce((sum, group) => sum + group._count._all, 0);

  return {
    rows,
    courses,
    branches,
    page,
    pageSize: requestedPageSize,
    total,
    totalPages,
    completed,
    active,
    other,
    completionRate: completed + active ? Math.round((completed / (completed + active)) * 100) : 0,
  };
}
