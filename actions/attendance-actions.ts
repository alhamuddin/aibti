"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { closeAttendanceSession, closeDueAttendanceSessions } from "@/lib/attendance-service";
import {
  getAttendanceWindow,
  getCourseTimeZone,
  isValidAttendanceQrSignature,
} from "@/lib/attendance";
import { roles } from "@/lib/permissions";
import { canManageUsers, isUserRole } from "@/lib/roles";
import { requireAuthenticatedUser } from "@/lib/session";
import { formatDateTime } from "@/utils/date-time";

const activeEnrollmentStatuses = ["ASSIGNED", "CONFIRMED"] as const;

function attendanceRedirect(message: string, search: Record<string, string> = {}): never {
  const query = new URLSearchParams({ notice: message, ...search });
  redirect(`/dashboard/attendance?${query.toString()}`);
}

async function requireAttendanceAdmin() {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (
    !isUserRole(role) ||
    !canManageUsers(role) ||
    !roles[role].authorize({ attendance: ["mark"] }).success
  ) {
    redirect("/dashboard");
  }
  return session;
}

export async function startAttendanceAction(formData: FormData): Promise<void> {
  const session = await requireAttendanceAdmin();
  const courseId = formData.get("courseId");
  const batchId = formData.get("batchId");
  const courseDate = formData.get("courseDate");
  if (
    typeof courseId !== "string" ||
    !courseId.trim() ||
    typeof batchId !== "string" ||
    !batchId.trim() ||
    typeof courseDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(courseDate)
  ) {
    attendanceRedirect("Choose a valid course day.");
  }

  const now = new Date();
  await closeDueAttendanceSessions(now);
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      status: true,
      isMock: true,
      draftData: true,
      batches: {
        where: { id: batchId },
        select: {
          id: true,
          name: true,
          classes: {
            where: { scheduledAt: { not: null } },
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
            select: { id: true },
          },
        },
      },
    },
  });
  if (!course || course.status !== "PUBLISHED" || course.isMock) {
    attendanceRedirect("Attendance is available only for published courses.");
  }
  const batch = course.batches[0];
  if (!batch) attendanceRedirect("The selected course batch could not be found.");
  if (!batch.enrollments.length) {
    attendanceRedirect("This course has no active participants to take attendance for.");
  }

  const timeZone = getCourseTimeZone(course.draftData);
  const window = getAttendanceWindow(
    batch.classes.map((classSession) => ({
      name: classSession.name,
      subjectTitle: classSession.subject.title,
      scheduledAt: classSession.scheduledAt,
      durationMinutes: classSession.durationMinutes,
    })),
    courseDate,
    timeZone,
  );
  if (!window) attendanceRedirect("No scheduled classes were found for that course day.");
  if (now < window.opensAt) {
    attendanceRedirect(`Attendance opens ${formatDateTime(window.opensAt, timeZone)}.`);
  }
  if (now >= window.autoClosesAt) {
    attendanceRedirect("The attendance window for this course day has ended.");
  }

  const existing = await prisma.attendanceSession.upsert({
    where: { batchId_courseDate: { batchId: batch.id, courseDate } },
    create: {
      id: randomUUID(),
      courseId: course.id,
      batchId: batch.id,
      courseDate,
      courseName: course.title,
      batchName: batch.name,
      opensAt: window.opensAt,
      autoClosesAt: window.autoClosesAt,
      qrNonce: randomUUID(),
      initiatedById: session.user.id,
    },
    update: {},
    select: { closedAt: true },
  });
  if (existing.closedAt) {
    attendanceRedirect("Attendance has already been closed for this course day.");
  }

  revalidatePath("/dashboard/attendance");
  attendanceRedirect("Attendance is open. Share the QR code with enrolled participants.");
}

export async function closeAttendanceAction(formData: FormData): Promise<void> {
  await requireAttendanceAdmin();
  const sessionId = formData.get("sessionId");
  if (typeof sessionId !== "string" || !sessionId.trim()) {
    attendanceRedirect("Choose a valid attendance session.");
  }
  await closeDueAttendanceSessions();
  const closed = await closeAttendanceSession(sessionId, "ADMIN");
  if (!closed) attendanceRedirect("This attendance session is already closed.");
  revalidatePath("/dashboard/attendance");
  attendanceRedirect("Attendance closed. Remaining enrolled participants were marked absent.");
}

export async function markManualAttendanceAction(formData: FormData): Promise<void> {
  await requireAttendanceAdmin();
  const sessionId = formData.get("sessionId");
  const participantId = formData.get("participantId");
  const status = formData.get("status");
  if (
    typeof sessionId !== "string" ||
    !sessionId.trim() ||
    typeof participantId !== "string" ||
    !participantId.trim() ||
    (status !== "PRESENT" && status !== "ABSENT")
  ) {
    attendanceRedirect("Choose a participant and a valid attendance status.");
  }

  const now = new Date();
  await closeDueAttendanceSessions(now);
  const result = await prisma.$transaction(async (tx) => {
    const attendanceSession = await tx.attendanceSession.findUnique({
      where: { id: sessionId },
      select: { id: true, batchId: true, closedAt: true },
    });
    if (!attendanceSession || attendanceSession.closedAt) return "closed" as const;
    const lock = await tx.attendanceSession.updateMany({
      where: {
        id: sessionId,
        closedAt: null,
        opensAt: { lte: now },
        autoClosesAt: { gt: now },
      },
      data: { updatedAt: now },
    });
    if (!lock.count) return "closed" as const;

    const enrollment = await tx.courseEnrollment.findFirst({
      where: {
        batchId: attendanceSession.batchId,
        participantId,
        status: { in: [...activeEnrollmentStatuses] },
        participant: { role: "participant", banned: false },
      },
      select: { participant: { select: { id: true, employeeId: true } } },
    });
    if (!enrollment) return "not-enrolled" as const;
    await tx.attendanceRecord.upsert({
      where: { sessionId_participantId: { sessionId, participantId } },
      create: {
        id: randomUUID(),
        sessionId,
        participantId,
        employeeId: enrollment.participant.employeeId ?? enrollment.participant.id,
        status,
        method: "MANUAL",
        markedAt: now,
      },
      update: {
        employeeId: enrollment.participant.employeeId ?? enrollment.participant.id,
        status,
        method: "MANUAL",
        markedAt: now,
      },
    });
    return "saved" as const;
  });

  if (result === "closed") attendanceRedirect("This attendance window is not open.");
  if (result === "not-enrolled") {
    attendanceRedirect("That participant is not actively enrolled in this course.");
  }
  revalidatePath("/dashboard/attendance");
  attendanceRedirect("Attendance updated.");
}

export async function submitQrAttendanceAction(formData: FormData): Promise<void> {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (
    !isUserRole(role) ||
    !roles[role].authorize({ attendance: ["mark.own"] }).success ||
    role !== "participant"
  ) {
    redirect("/dashboard");
  }

  const sessionId = formData.get("sessionId");
  const nonce = formData.get("nonce");
  const signature = formData.get("signature");
  if (
    typeof sessionId !== "string" ||
    !sessionId.trim() ||
    typeof nonce !== "string" ||
    !nonce.trim() ||
    typeof signature !== "string"
  ) {
    redirect("/dashboard/attendance");
  }
  const returnTo = new URLSearchParams({ sessionId, nonce, signature });
  const ticketUrl = `/dashboard/attendance/check-in?${returnTo.toString()}`;
  if (!isValidAttendanceQrSignature(sessionId, nonce, signature)) {
    redirect(`${ticketUrl}&notice=${encodeURIComponent("This QR code is invalid or expired.")}`);
  }

  const now = new Date();
  await closeDueAttendanceSessions(now);
  const result = await prisma.$transaction(async (tx) => {
    const attendanceSession = await tx.attendanceSession.findUnique({
      where: { id: sessionId },
      select: { id: true, batchId: true, qrNonce: true },
    });
    if (!attendanceSession || attendanceSession.qrNonce !== nonce) return "invalid" as const;
    const lock = await tx.attendanceSession.updateMany({
      where: {
        id: sessionId,
        qrNonce: nonce,
        closedAt: null,
        opensAt: { lte: now },
        autoClosesAt: { gt: now },
      },
      data: { updatedAt: now },
    });
    if (!lock.count) return "closed" as const;

    const enrollment = await tx.courseEnrollment.findFirst({
      where: {
        batchId: attendanceSession.batchId,
        participantId: session.user.id,
        status: { in: [...activeEnrollmentStatuses] },
        participant: { role: "participant", banned: false },
      },
      select: { participant: { select: { id: true, employeeId: true } } },
    });
    if (!enrollment) return "not-enrolled" as const;
    await tx.attendanceRecord.upsert({
      where: {
        sessionId_participantId: { sessionId, participantId: session.user.id },
      },
      create: {
        id: randomUUID(),
        sessionId,
        participantId: session.user.id,
        employeeId: enrollment.participant.employeeId ?? enrollment.participant.id,
        status: "PRESENT",
        method: "QR",
        markedAt: now,
      },
      update: {
        employeeId: enrollment.participant.employeeId ?? enrollment.participant.id,
        status: "PRESENT",
        method: "QR",
        markedAt: now,
      },
    });
    return "saved" as const;
  });

  const notice =
    result === "saved"
      ? "Your attendance has been recorded."
      : result === "not-enrolled"
        ? "You are not actively enrolled in this course."
        : result === "closed"
          ? "This attendance window is closed."
          : "This QR code is invalid or expired.";
  if (result === "saved") revalidatePath("/dashboard/attendance");
  redirect(`${ticketUrl}&notice=${encodeURIComponent(notice)}`);
}
