import "server-only";

import { randomUUID } from "node:crypto";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

const activeEnrollmentStatuses = ["ASSIGNED", "CONFIRMED"] as const;

async function closeAttendanceInTransaction(
  tx: Prisma.TransactionClient,
  sessionId: string,
  reason: "ADMIN" | "AUTO",
  now: Date,
): Promise<boolean> {
  const attendanceSession = await tx.attendanceSession.findUnique({
    where: { id: sessionId },
    select: { autoClosesAt: true, batchId: true },
  });
  if (!attendanceSession) return false;
  const closesAt =
    reason === "AUTO" && attendanceSession.autoClosesAt < now
      ? attendanceSession.autoClosesAt
      : now;
  const closed = await tx.attendanceSession.updateMany({
    where: {
      id: sessionId,
      closedAt: null,
      ...(reason === "AUTO" ? { autoClosesAt: { lte: now } } : {}),
    },
    data: { closedAt: closesAt, closeReason: reason, updatedAt: now },
  });
  if (!closed.count) return false;

  const enrollments = await tx.courseEnrollment.findMany({
    where: {
      batchId: attendanceSession.batchId,
      status: { in: [...activeEnrollmentStatuses] },
      participant: { role: "participant", banned: false },
    },
    select: {
      participantId: true,
      participant: { select: { id: true, employeeId: true } },
    },
  });
  const existingRecords = await tx.attendanceRecord.findMany({
    where: { sessionId },
    select: { participantId: true },
  });
  const existingParticipantIds = new Set(existingRecords.map((record) => record.participantId));
  const absences = enrollments
    .filter((enrollment) => !existingParticipantIds.has(enrollment.participantId))
    .map((enrollment) => ({
      id: randomUUID(),
      sessionId,
      participantId: enrollment.participantId,
      employeeId: enrollment.participant.employeeId ?? enrollment.participant.id,
      status: "ABSENT" as const,
      method: "AUTO" as const,
      markedAt: closesAt,
    }));

  if (absences.length) {
    await tx.attendanceRecord.createMany({ data: absences, skipDuplicates: true });
  }
  return true;
}

export async function closeAttendanceSession(
  sessionId: string,
  reason: "ADMIN" | "AUTO",
  now = new Date(),
): Promise<boolean> {
  return prisma.$transaction((tx) => closeAttendanceInTransaction(tx, sessionId, reason, now));
}

export async function closeDueAttendanceSessions(now = new Date()): Promise<number> {
  const dueSessions = await prisma.attendanceSession.findMany({
    where: { closedAt: null, autoClosesAt: { lte: now } },
    select: { id: true },
  });
  let closedCount = 0;
  for (const attendanceSession of dueSessions) {
    if (await closeAttendanceSession(attendanceSession.id, "AUTO", now)) closedCount += 1;
  }
  return closedCount;
}
