"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getCourseTimeZone, parseDateTimeLocalInTimeZone } from "@/lib/attendance";
import {
  areLearnInBranchAnswersComplete,
  learnInBranchWindowMs,
  parseLearnInBranchAnswerOptions,
} from "@/lib/learn-in-branch";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/roles";
import { roles } from "@/lib/permissions";
import { requireAuthenticatedUser } from "@/lib/session";

const sessionSchema = z.object({
  classId: z.string().trim().min(1).max(180),
  sessionAt: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/),
  location: z.string().trim().min(2).max(180),
  participantIds: z.array(z.string().trim().min(1).max(180)).min(1).max(200),
});

const reviewSchema = z.object({
  reportId: z.string().trim().min(1).max(180),
  answers: z.string().min(1).max(30_000),
  managerComment: z.string().trim().max(2000),
});

const reviewAnswerSchema = z.object({
  questionId: z.string().trim().min(1).max(180),
  answer: z.string().trim().min(1).max(180),
});

export type LearnInBranchActionResult = {
  success: boolean;
  message: string;
};

function failure(message: string): LearnInBranchActionResult {
  return { success: false, message };
}

function hasPermission(
  role: string,
  permission: "submit.own" | "review.branch" | "manage.deadlines",
) {
  return isUserRole(role) && roles[role].authorize({ learnInBranch: [permission] }).success;
}

export async function submitLearnInBranchReportAction(
  formData: FormData,
): Promise<LearnInBranchActionResult> {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!hasPermission(role, "submit.own")) {
    return failure("Only course participants can submit branch learning reports.");
  }

  const enrollmentId = formData.get("enrollmentId");
  const rawSessions = formData.get("sessions");
  if (typeof enrollmentId !== "string" || typeof rawSessions !== "string") {
    return failure("Choose a completed course and add at least one training session.");
  }

  let sessionValues: unknown;
  try {
    sessionValues = JSON.parse(rawSessions);
  } catch {
    return failure("The training sessions could not be read. Please review the form.");
  }
  const parsedSessions = z.array(sessionSchema).min(1).max(50).safeParse(sessionValues);
  if (!parsedSessions.success) {
    return failure("Complete each session, select its class, and add at least one participant.");
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      id: enrollmentId,
      participantId: session.user.id,
      status: "COMPLETED",
      completedAt: { not: null },
    },
    select: {
      id: true,
      batchId: true,
      completedAt: true,
      learnInBranchDeadline: true,
      course: { select: { status: true, draftData: true } },
      batch: {
        select: {
          classes: {
            where: { scheduledAt: { not: null } },
            select: { id: true, scheduledAt: true, durationMinutes: true },
          },
        },
      },
      participant: {
        select: {
          role: true,
          banned: true,
          branch: {
            select: {
              id: true,
              managerUserId: true,
              manager: { select: { role: true, banned: true } },
            },
          },
        },
      },
      learnInBranchReport: { select: { id: true } },
    },
  });

  if (!enrollment?.completedAt || enrollment.participant.role !== "participant") {
    return failure("This completed course is not available for a branch learning report.");
  }
  if (enrollment.participant.banned || !enrollment.participant.branch) {
    return failure("Your account must be active and assigned to a branch to submit this report.");
  }
  const branch = enrollment.participant.branch;
  if (!branch.managerUserId || branch.manager?.role !== "branch_manager" || branch.manager.banned) {
    return failure("Your branch does not currently have an active branch manager for approval.");
  }
  if (!["PUBLISHED", "ARCHIVED"].includes(enrollment.course.status)) {
    return failure("Branch learning reports are available only for completed published courses.");
  }
  if (enrollment.learnInBranchReport) {
    return failure("A branch learning report has already been submitted for this course.");
  }

  const now = new Date();
  const deadline =
    enrollment.learnInBranchDeadline ??
    new Date(enrollment.completedAt.getTime() + learnInBranchWindowMs);
  if (now < enrollment.completedAt || now > deadline) {
    return failure("The submission window for this completed course has closed.");
  }

  const classById = new Map(
    enrollment.batch.classes.flatMap((classSession) =>
      classSession.scheduledAt &&
      classSession.scheduledAt.getTime() + classSession.durationMinutes * 60_000 <=
        enrollment.completedAt!.getTime()
        ? [[classSession.id, classSession.scheduledAt] as const]
        : [],
    ),
  );
  const classIds = parsedSessions.data.map((item) => item.classId);
  if (
    new Set(classIds).size !== classIds.length ||
    classIds.some((classId) => !classById.has(classId))
  ) {
    return failure("Choose each class from the completed course only once.");
  }

  const timeZone = getCourseTimeZone(enrollment.course.draftData);
  const submittedSessions = parsedSessions.data.map((item) => ({
    ...item,
    sessionAt: parseDateTimeLocalInTimeZone(item.sessionAt, timeZone),
  }));
  if (
    submittedSessions.some(
      (item) => !item.sessionAt || item.sessionAt < enrollment.completedAt! || item.sessionAt > now,
    )
  ) {
    return failure("Session dates must be after course completion and cannot be in the future.");
  }

  const participantIds = [...new Set(parsedSessions.data.flatMap((item) => item.participantIds))];
  if (
    parsedSessions.data.some(
      (item) => new Set(item.participantIds).size !== item.participantIds.length,
    )
  ) {
    return failure("A participant can be listed only once for each training session.");
  }
  const branchParticipants = await prisma.user.findMany({
    where: {
      id: { in: participantIds },
      branchId: branch.id,
      role: "participant",
      banned: false,
    },
    select: { id: true },
  });
  if (branchParticipants.length !== participantIds.length) {
    return failure("Select only active participants from your own branch.");
  }
  const reviewQuestions = await prisma.learnInBranchQuestion.findMany({
    orderBy: [{ position: "asc" }, { createdAt: "asc" }],
    select: { id: true, prompt: true, options: true, position: true },
  });
  if (!reviewQuestions.length) {
    return failure("Branch manager review questions are not configured. Contact an administrator.");
  }

  try {
    await prisma.learnInBranchReport.create({
      data: {
        id: randomUUID(),
        enrollmentId: enrollment.id,
        branchId: branch.id,
        facilitatorId: session.user.id,
        answers: {
          create: reviewQuestions.map((question) => ({
            questionId: question.id,
            prompt: question.prompt,
            options: question.options,
            position: question.position,
          })),
        },
        sessions: {
          create: submittedSessions.map((item) => ({
            id: randomUUID(),
            classId: item.classId,
            sessionAt: item.sessionAt!,
            location: item.location,
            attendees: {
              create: item.participantIds.map((participantId) => ({ participantId })),
            },
          })),
        },
      },
    });
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "P2002") {
      return failure("A branch learning report has already been submitted for this course.");
    }
    throw error;
  }

  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard/learning/learn-in-branch");
  revalidatePath("/dashboard");
  return { success: true, message: "Your report was sent to your branch manager for approval." };
}

export async function approveLearnInBranchReportAction(
  formData: FormData,
): Promise<LearnInBranchActionResult> {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!hasPermission(role, "review.branch")) {
    return failure("Only your assigned branch manager can review this report.");
  }

  const parsed = reviewSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return failure("Answer all review questions before approving this report.");
  }
  let answerValues: unknown;
  try {
    answerValues = JSON.parse(parsed.data.answers);
  } catch {
    return failure("The review answers could not be read. Please answer the questions again.");
  }
  const parsedAnswers = z.array(reviewAnswerSchema).min(1).max(100).safeParse(answerValues);
  if (!parsedAnswers.success) {
    return failure("Answer every review question before approving this report.");
  }
  const branch = await prisma.branch.findUnique({
    where: { managerUserId: session.user.id },
    select: { id: true },
  });
  if (!branch) return failure("No branch is assigned to your manager account.");

  const report = await prisma.learnInBranchReport.findFirst({
    where: {
      id: parsed.data.reportId,
      branchId: branch.id,
      status: "PENDING_APPROVAL",
    },
    select: {
      answers: { select: { questionId: true, options: true } },
    },
  });
  if (!report || report.answers.length !== parsedAnswers.data.length) {
    return failure("Answer all review questions for this report before approving it.");
  }
  if (
    !areLearnInBranchAnswersComplete(
      report.answers.map((answer) => ({ id: answer.questionId, options: answer.options })),
      parsedAnswers.data,
    )
  ) {
    return failure("Select a valid answer for every review question.");
  }
  const answerByQuestionId = new Map(
    parsedAnswers.data.map((answer) => [answer.questionId, answer.answer]),
  );

  const approvedAt = new Date();
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.learnInBranchReport.updateMany({
      where: {
        id: parsed.data.reportId,
        branchId: branch.id,
        status: "PENDING_APPROVAL",
      },
      data: {
        status: "APPROVED",
        managerId: session.user.id,
        approvedAt,
        managerComment: parsed.data.managerComment || null,
      },
    });
    if (!result.count) return result;

    for (const [questionId, answer] of answerByQuestionId) {
      await tx.learnInBranchReportAnswer.updateMany({
        where: { reportId: parsed.data.reportId, questionId },
        data: { answer },
      });
    }
    return result;
  });
  if (!updated.count) return failure("This report is no longer waiting for your approval.");

  revalidatePath("/dashboard/learning/learn-in-branch");
  revalidatePath("/dashboard");
  return { success: true, message: "The branch learning report has been approved." };
}

export async function addLearnInBranchQuestionAction(
  formData: FormData,
): Promise<LearnInBranchActionResult> {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!hasPermission(role, "manage.deadlines")) {
    return failure("Only an administrator can add branch manager review questions.");
  }

  const prompt = formData.get("prompt");
  const rawOptions = formData.get("options");
  if (typeof prompt !== "string" || typeof rawOptions !== "string") {
    return failure("Enter a question and its answer choices.");
  }
  const parsedPrompt = z.string().trim().min(10).max(500).safeParse(prompt);
  const options = parseLearnInBranchAnswerOptions(rawOptions);
  if (!parsedPrompt.success || !options) {
    return failure("Enter a question and between two and ten answer choices.");
  }
  const questionCount = await prisma.learnInBranchQuestion.count();
  if (questionCount >= 100) {
    return failure("The review question bank cannot contain more than 100 questions.");
  }

  const latest = await prisma.learnInBranchQuestion.aggregate({ _max: { position: true } });
  await prisma.learnInBranchQuestion.create({
    data: {
      id: randomUUID(),
      prompt: parsedPrompt.data,
      options,
      position: (latest._max.position ?? 0) + 1,
    },
  });

  revalidatePath("/dashboard/learning/learn-in-branch");
  return { success: true, message: "The manager review question was added." };
}

export async function extendLearnInBranchDeadlineAction(
  formData: FormData,
): Promise<LearnInBranchActionResult> {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!hasPermission(role, "manage.deadlines")) {
    return failure("Only an administrator can extend a submission deadline.");
  }

  const enrollmentId = formData.get("enrollmentId");
  const deadlineDate = formData.get("deadlineDate");
  if (
    typeof enrollmentId !== "string" ||
    !enrollmentId.trim() ||
    typeof deadlineDate !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(deadlineDate)
  ) {
    return failure("Choose a valid extension date.");
  }

  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      id: enrollmentId,
      status: "COMPLETED",
      completedAt: { not: null },
      learnInBranchReport: null,
    },
    select: {
      id: true,
      completedAt: true,
      learnInBranchDeadline: true,
      course: { select: { id: true, title: true, draftData: true } },
    },
  });
  if (!enrollment?.completedAt) {
    return failure("Only completed courses without a submitted report can have an extension.");
  }

  const timeZone = getCourseTimeZone(enrollment.course.draftData);
  const parsedDeadline = parseDateTimeLocalInTimeZone(`${deadlineDate}T23:59`, timeZone);
  if (!parsedDeadline) return failure("Choose a valid calendar date.");
  const extendedDeadline = new Date(parsedDeadline.getTime() + 59_999);
  const defaultDeadline = new Date(enrollment.completedAt.getTime() + learnInBranchWindowMs);
  const currentDeadline = enrollment.learnInBranchDeadline ?? defaultDeadline;
  if (extendedDeadline <= defaultDeadline || extendedDeadline <= currentDeadline) {
    return failure("An extension must be later than both the default and current deadline.");
  }

  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.courseEnrollment.updateMany({
      where: {
        id: enrollment.id,
        status: "COMPLETED",
        learnInBranchReport: null,
      },
      data: { learnInBranchDeadline: extendedDeadline },
    });
    if (result.count) {
      await tx.courseAuditLog.create({
        data: {
          id: randomUUID(),
          courseId: enrollment.course.id,
          courseTitle: enrollment.course.title,
          actorId: session.user.id,
          action: `LEARN_IN_BRANCH_DEADLINE_EXTENDED:${enrollment.id}:${extendedDeadline.toISOString()}`,
        },
      });
    }
    return result;
  });
  if (!updated.count) return failure("This course completion changed before the extension saved.");

  revalidatePath("/dashboard/learning/learn-in-branch");
  revalidatePath("/dashboard/learning");
  return { success: true, message: "The Learn in the Branch deadline was extended." };
}
