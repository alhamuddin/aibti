import "server-only";

import type { AttendanceMethod, AttendanceStatus } from "@/generated/prisma/enums";
import { getAttendanceDateKey, getAttendanceWindow, getCourseTimeZone } from "@/lib/attendance";
import { closeDueAttendanceSessions } from "@/lib/attendance-service";
import { prisma } from "@/lib/prisma";

const activeEnrollmentStatuses = ["ASSIGNED", "CONFIRMED"] as const;
const dayMs = 24 * 60 * 60 * 1000;

export type AttendanceAdminDay = {
  courseId: string;
  batchId: string;
  courseName: string;
  batchName: string;
  courseDate: string;
  timeZone: string;
  opensAt: Date;
  autoClosesAt: Date;
  classes: {
    name: string;
    subjectTitle: string;
    scheduledAt: Date;
    durationMinutes: number;
  }[];
  session: {
    id: string;
    qrNonce: string;
    startedAt: Date;
    closedAt: Date | null;
    closeReason: "ADMIN" | "AUTO" | null;
  } | null;
  participants: {
    id: string;
    employeeId: string;
    name: string;
    status: AttendanceStatus | null;
    method: AttendanceMethod | null;
    markedAt: Date | null;
  }[];
};

export async function listAttendanceAdminDays(now = new Date()): Promise<AttendanceAdminDay[]> {
  await closeDueAttendanceSessions(now);
  const from = new Date(now.getTime() - 7 * dayMs);
  const to = new Date(now.getTime() + 8 * dayMs);
  const courses = await prisma.course.findMany({
    where: {
      status: "PUBLISHED",
      isMock: false,
      batches: { some: { classes: { some: { scheduledAt: { gte: from, lte: to } } } } },
    },
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      draftData: true,
      batches: {
        where: { classes: { some: { scheduledAt: { gte: from, lte: to } } } },
        select: {
          id: true,
          name: true,
          classes: {
            where: { scheduledAt: { gte: from, lte: to } },
            orderBy: { scheduledAt: "asc" },
            select: {
              name: true,
              durationMinutes: true,
              scheduledAt: true,
              subject: { select: { title: true } },
            },
          },
          enrollments: {
            where: {
              status: { in: [...activeEnrollmentStatuses] },
              participant: { role: "participant", banned: false },
            },
            select: {
              participant: { select: { id: true, employeeId: true, name: true } },
            },
          },
        },
      },
    },
  });
  if (!courses.length) return [];

  const batchIds = courses.flatMap((course) => course.batches.map((batch) => batch.id));
  const attendanceSessions = await prisma.attendanceSession.findMany({
    where: { batchId: { in: batchIds }, startedAt: { gte: from, lte: to } },
    orderBy: { startedAt: "desc" },
    select: {
      id: true,
      batchId: true,
      courseDate: true,
      qrNonce: true,
      startedAt: true,
      closedAt: true,
      closeReason: true,
      records: {
        select: {
          participantId: true,
          status: true,
          method: true,
          markedAt: true,
        },
      },
    },
  });
  const sessionByCourseDate = new Map(
    attendanceSessions.map((attendanceSession) => [
      `${attendanceSession.batchId}:${attendanceSession.courseDate}`,
      attendanceSession,
    ]),
  );
  const days: AttendanceAdminDay[] = [];

  for (const course of courses) {
    const timeZone = getCourseTimeZone(course.draftData);
    for (const batch of course.batches) {
      const schedules = batch.classes.map((classSession) => ({
        name: classSession.name,
        subjectTitle: classSession.subject.title,
        scheduledAt: classSession.scheduledAt,
        durationMinutes: classSession.durationMinutes,
      }));
      const dateKeys = [
        ...new Set(
          schedules
            .filter(
              (classSession): classSession is typeof classSession & { scheduledAt: Date } =>
                classSession.scheduledAt !== null,
            )
            .map((classSession) => getAttendanceDateKey(classSession.scheduledAt, timeZone)),
        ),
      ];

      for (const courseDate of dateKeys) {
        const window = getAttendanceWindow(schedules, courseDate, timeZone);
        if (!window) continue;
        const attendanceSession = sessionByCourseDate.get(`${batch.id}:${courseDate}`);
        if (!attendanceSession && window.autoClosesAt <= now) continue;
        const records = new Map(
          attendanceSession?.records.map((record) => [record.participantId, record]) ?? [],
        );
        const participants = batch.enrollments
          .map(({ participant }) => {
            const record = records.get(participant.id);
            return {
              id: participant.id,
              employeeId: participant.employeeId ?? participant.id,
              name: participant.name,
              status: record?.status ?? null,
              method: record?.method ?? null,
              markedAt: record?.markedAt ?? null,
            };
          })
          .sort((left, right) => left.name.localeCompare(right.name));

        days.push({
          courseId: course.id,
          batchId: batch.id,
          courseName: course.title,
          batchName: batch.name,
          courseDate,
          timeZone,
          opensAt: window.opensAt,
          autoClosesAt: window.autoClosesAt,
          classes: window.classes,
          session: attendanceSession
            ? {
                id: attendanceSession.id,
                qrNonce: attendanceSession.qrNonce,
                startedAt: attendanceSession.startedAt,
                closedAt: attendanceSession.closedAt,
                closeReason: attendanceSession.closeReason,
              }
            : null,
          participants,
        });
      }
    }
  }

  return days.sort(
    (left, right) =>
      left.opensAt.getTime() - right.opensAt.getTime() ||
      left.courseName.localeCompare(right.courseName) ||
      left.batchName.localeCompare(right.batchName),
  );
}
