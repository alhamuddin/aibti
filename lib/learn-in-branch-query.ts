import "server-only";

import type { CourseEnrollmentStatus } from "@/generated/prisma/enums";
import { getCourseTimeZone } from "@/lib/attendance";
import { getLearnInBranchDeadline } from "@/lib/learn-in-branch";
import { prisma } from "@/lib/prisma";

const completedEnrollmentStatus: CourseEnrollmentStatus = "COMPLETED";

export async function listLearnInBranchEnrollments(participantId: string) {
  const now = new Date();
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { participantId, status: completedEnrollmentStatus, completedAt: { not: null } },
    orderBy: { completedAt: "desc" },
    select: {
      id: true,
      completedAt: true,
      learnInBranchDeadline: true,
      course: { select: { title: true, draftData: true } },
      batch: { select: { name: true } },
      learnInBranchReport: { select: { id: true, status: true, submittedAt: true } },
    },
  });

  return enrollments.map((enrollment) => ({
    id: enrollment.id,
    courseTitle: enrollment.course.title,
    batchName: enrollment.batch.name,
    timeZone: getCourseTimeZone(enrollment.course.draftData),
    completedAt: enrollment.completedAt!,
    deadline: getLearnInBranchDeadline(enrollment.completedAt!, enrollment.learnInBranchDeadline),
    submissionClosed:
      now > getLearnInBranchDeadline(enrollment.completedAt!, enrollment.learnInBranchDeadline),
    report: enrollment.learnInBranchReport,
  }));
}

export async function getLearnInBranchEnrollment(enrollmentId: string, participantId: string) {
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      id: enrollmentId,
      participantId,
      status: completedEnrollmentStatus,
      completedAt: { not: null },
    },
    select: {
      id: true,
      batchId: true,
      completedAt: true,
      learnInBranchDeadline: true,
      course: { select: { title: true, draftData: true, status: true } },
      batch: {
        select: {
          name: true,
          classes: {
            where: { scheduledAt: { not: null } },
            orderBy: { scheduledAt: "asc" },
            select: {
              id: true,
              name: true,
              durationMinutes: true,
              scheduledAt: true,
              subject: { select: { title: true } },
            },
          },
        },
      },
      participant: {
        select: {
          branchId: true,
          branch: {
            select: {
              id: true,
              name: true,
              managerUserId: true,
              members: {
                where: {
                  role: "participant",
                  banned: false,
                },
                orderBy: { name: "asc" },
                select: { id: true, name: true, employeeId: true },
              },
            },
          },
        },
      },
      learnInBranchReport: {
        select: {
          id: true,
          status: true,
          submittedAt: true,
          approvedAt: true,
        },
      },
    },
  });

  if (!enrollment?.completedAt || !enrollment.participant.branch) return null;

  const classes = enrollment.batch.classes
    .filter(
      (classSession) =>
        classSession.scheduledAt &&
        classSession.scheduledAt.getTime() + classSession.durationMinutes * 60_000 <=
          enrollment.completedAt!.getTime(),
    )
    .map((classSession) => ({
      id: classSession.id,
      name: classSession.name,
      subjectTitle: classSession.subject.title,
    }));

  return {
    id: enrollment.id,
    courseTitle: enrollment.course.title,
    courseStatus: enrollment.course.status,
    draftData: enrollment.course.draftData,
    batchName: enrollment.batch.name,
    completedAt: enrollment.completedAt,
    deadline: getLearnInBranchDeadline(enrollment.completedAt, enrollment.learnInBranchDeadline),
    branch: {
      id: enrollment.participant.branch.id,
      name: enrollment.participant.branch.name,
      managerUserId: enrollment.participant.branch.managerUserId,
      members: enrollment.participant.branch.members.filter(
        (member) => member.id !== participantId,
      ),
    },
    classes,
    report: enrollment.learnInBranchReport,
  };
}

export async function listLearnInBranchReviews(managerId: string) {
  const branch = await prisma.branch.findUnique({
    where: { managerUserId: managerId },
    select: { id: true, name: true },
  });
  if (!branch) return { branchName: null, reports: [] };

  const reports = await prisma.learnInBranchReport.findMany({
    where: { branchId: branch.id },
    orderBy: [{ status: "asc" }, { submittedAt: "desc" }],
    take: 100,
    select: {
      id: true,
      status: true,
      submittedAt: true,
      approvedAt: true,
      managerComment: true,
      answers: {
        orderBy: { position: "asc" },
        select: { questionId: true, prompt: true, options: true, answer: true },
      },
      facilitator: { select: { name: true, employeeId: true } },
      enrollment: {
        select: {
          course: { select: { title: true, draftData: true } },
          batch: { select: { name: true } },
        },
      },
      sessions: {
        orderBy: { sessionAt: "asc" },
        select: {
          id: true,
          sessionAt: true,
          location: true,
          class: {
            select: { name: true, subject: { select: { title: true } } },
          },
          attendees: {
            orderBy: { participant: { name: "asc" } },
            select: {
              participant: { select: { name: true, employeeId: true } },
            },
          },
        },
      },
    },
  });

  return { branchName: branch.name, reports };
}

export async function listLearnInBranchQuestions() {
  return prisma.learnInBranchQuestion.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, prompt: true, options: true },
  });
}

export async function listLearnInBranchDeadlineEnrollments() {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: {
      status: completedEnrollmentStatus,
      completedAt: { not: null },
      course: { isMock: false },
      learnInBranchReport: null,
    },
    orderBy: { completedAt: "desc" },
    take: 200,
    select: {
      id: true,
      completedAt: true,
      learnInBranchDeadline: true,
      course: { select: { title: true, draftData: true } },
      participant: {
        select: {
          name: true,
          employeeId: true,
          branch: { select: { name: true } },
        },
      },
    },
  });

  return enrollments.flatMap((enrollment) => {
    if (!enrollment.completedAt) return [];
    return [
      {
        id: enrollment.id,
        courseTitle: enrollment.course.title,
        draftData: enrollment.course.draftData,
        participantName: enrollment.participant.name,
        employeeId: enrollment.participant.employeeId,
        branchName: enrollment.participant.branch?.name ?? null,
        completedAt: enrollment.completedAt,
        deadline: getLearnInBranchDeadline(
          enrollment.completedAt,
          enrollment.learnInBranchDeadline,
        ),
      },
    ];
  });
}
