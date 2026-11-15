import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import type { DashboardSession } from "@/lib/dashboard-query";
import type { UserRole } from "@/lib/roles";

const activeEnrollmentStatuses = ["ASSIGNED", "CONFIRMED"] as const;

export function getScheduledClassesWhere(
  userId: string,
  role: UserRole,
  branchId: string | null,
  scheduledAt: NonNullable<Prisma.CourseClassWhereInput["scheduledAt"]>,
): Prisma.CourseClassWhereInput {
  const where: Prisma.CourseClassWhereInput = {
    scheduledAt,
    course: { is: { status: "PUBLISHED", isMock: false } },
  };

  if (role === "participant") {
    where.batch = {
      is: {
        enrollments: {
          some: {
            participantId: userId,
            status: { in: [...activeEnrollmentStatuses] },
          },
        },
      },
    };
  } else if (role === "teacher") {
    where.subject = { is: { teacherId: userId } };
  } else if (role === "branch_manager") {
    where.batch = {
      is: {
        enrollments: {
          some: {
            status: { in: [...activeEnrollmentStatuses] },
            participant: {
              branchId: branchId ?? "__unassigned_branch__",
              banned: false,
              isMock: false,
            },
          },
        },
      },
    };
  }

  return where;
}

export async function getCalendarSessions(
  userId: string,
  role: UserRole,
  startDate: Date,
  endDate: Date,
): Promise<DashboardSession[]> {
  const branch =
    role === "branch_manager"
      ? await prisma.branch.findUnique({
          where: { managerUserId: userId },
          select: { id: true },
        })
      : null;
  const sessions = await prisma.courseClass.findMany({
    where: getScheduledClassesWhere(userId, role, branch?.id ?? null, {
      gte: startDate,
      lt: endDate,
    }),
    orderBy: { scheduledAt: "asc" },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      scheduledAt: true,
      venue: true,
      courseId: true,
      course: { select: { title: true } },
      batch: { select: { name: true } },
      subject: { select: { title: true } },
    },
  });

  return sessions.flatMap((session) =>
    session.scheduledAt
      ? [
          {
            id: session.id,
            courseId: session.courseId,
            courseTitle: session.course.title,
            batchName: session.batch.name,
            className: session.name,
            subjectTitle: session.subject.title,
            scheduledAt: session.scheduledAt,
            durationMinutes: session.durationMinutes,
            venue: session.venue,
          },
        ]
      : [],
  );
}
