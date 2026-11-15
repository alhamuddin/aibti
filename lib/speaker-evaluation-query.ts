import "server-only";

import type { CourseEnrollmentStatus } from "@/generated/prisma/enums";
import type { SpeakerEvaluationAverages, SpeakerEvaluationScores } from "@/lib/speaker-evaluation";
import {
  getSpeakerEvaluationPoints,
  getSpeakerEvaluationWindow,
  canViewSpeakerEvaluationResults,
} from "@/lib/speaker-evaluation";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/roles";

const participantEnrollmentStatuses: CourseEnrollmentStatus[] = [
  "ASSIGNED",
  "CONFIRMED",
  "COMPLETED",
];

export type SpeakerEvaluationAssignment = {
  classId: string;
  className: string;
  courseTitle: string;
  subjectTitle: string;
  teacherName: string;
  scheduledAt: Date;
  classEndsAt: Date;
  expiresAt: Date;
  scores: SpeakerEvaluationScores | null;
};

export type SpeakerEvaluationResult = {
  classId: string;
  className: string;
  courseTitle: string;
  subjectTitle: string;
  teacherName: string;
  scheduledAt: Date;
  averages: SpeakerEvaluationAverages | null;
  resultsWithheld: boolean;
};

export async function listSpeakerEvaluationAssignments(
  participantId: string,
  now = new Date(),
): Promise<SpeakerEvaluationAssignment[]> {
  const classes = await prisma.courseClass.findMany({
    where: {
      scheduledAt: { lte: now },
      subject: {
        course: {
          status: { in: ["PUBLISHED", "ARCHIVED"] },
        },
      },
      batch: {
        enrollments: {
          some: {
            participantId,
            status: { in: participantEnrollmentStatuses },
          },
        },
      },
    },
    orderBy: { scheduledAt: "desc" },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      scheduledAt: true,
      subject: {
        select: {
          title: true,
          teacher: { select: { name: true } },
          course: { select: { title: true } },
        },
      },
      speakerEvaluations: {
        where: { participantId },
        select: {
          presentationQuality: true,
          experienceSharing: true,
          sessionBenefit: true,
          topicCompleteness: true,
          learningEnvironment: true,
        },
      },
    },
  });

  return classes.flatMap((classSession) => {
    if (!classSession.scheduledAt) return [];
    const { classEndsAt, expiresAt } = getSpeakerEvaluationWindow(
      classSession.scheduledAt,
      classSession.durationMinutes,
    );
    if (now < classEndsAt || now > expiresAt) return [];

    return [
      {
        classId: classSession.id,
        className: classSession.name,
        courseTitle: classSession.subject.course.title,
        subjectTitle: classSession.subject.title,
        teacherName: classSession.subject.teacher.name,
        scheduledAt: classSession.scheduledAt,
        classEndsAt,
        expiresAt,
        scores: classSession.speakerEvaluations[0] ?? null,
      },
    ];
  });
}

export async function listSpeakerEvaluationResults(
  role: UserRole,
  userId: string,
): Promise<SpeakerEvaluationResult[]> {
  if (role !== "teacher" && role !== "admin" && role !== "super_admin") return [];
  const now = new Date();
  const classes = await prisma.courseClass.findMany({
    where: {
      scheduledAt: { lte: now },
      subject: {
        course: { status: { in: ["PUBLISHED", "ARCHIVED"] } },
        ...(role === "teacher" ? { teacherId: userId } : {}),
      },
    },
    orderBy: { scheduledAt: "desc" },
    select: {
      id: true,
      name: true,
      durationMinutes: true,
      scheduledAt: true,
      subject: {
        select: {
          title: true,
          teacher: { select: { name: true } },
          course: { select: { title: true } },
        },
      },
    },
  });

  const endedClasses = classes.filter(
    (classSession) =>
      classSession.scheduledAt &&
      getSpeakerEvaluationWindow(classSession.scheduledAt, classSession.durationMinutes)
        .classEndsAt <= now,
  );
  if (!endedClasses.length) return [];

  const aggregates = await prisma.speakerEvaluation.groupBy({
    by: ["classId"],
    where: { classId: { in: endedClasses.map((classSession) => classSession.id) } },
    _avg: {
      presentationQuality: true,
      experienceSharing: true,
      sessionBenefit: true,
      topicCompleteness: true,
      learningEnvironment: true,
    },
    _count: { _all: true },
  });
  const averagesByClass = new Map(aggregates.map((item) => [item.classId, item]));

  return endedClasses.flatMap((classSession) => {
    if (!classSession.scheduledAt) return [];
    const aggregate = averagesByClass.get(classSession.id);
    const resultsWithheld =
      aggregate !== undefined && !canViewSpeakerEvaluationResults(role, aggregate._count._all);
    const averages =
      aggregate && !resultsWithheld
        ? {
            presentationQuality:
              aggregate._avg.presentationQuality === null
                ? null
                : getSpeakerEvaluationPoints(
                    "presentationQuality",
                    aggregate._avg.presentationQuality,
                  ),
            experienceSharing:
              aggregate._avg.experienceSharing === null
                ? null
                : getSpeakerEvaluationPoints("experienceSharing", aggregate._avg.experienceSharing),
            sessionBenefit:
              aggregate._avg.sessionBenefit === null
                ? null
                : getSpeakerEvaluationPoints("sessionBenefit", aggregate._avg.sessionBenefit),
            topicCompleteness:
              aggregate._avg.topicCompleteness === null
                ? null
                : getSpeakerEvaluationPoints("topicCompleteness", aggregate._avg.topicCompleteness),
            learningEnvironment:
              aggregate._avg.learningEnvironment === null
                ? null
                : getSpeakerEvaluationPoints(
                    "learningEnvironment",
                    aggregate._avg.learningEnvironment,
                  ),
          }
        : null;

    return [
      {
        classId: classSession.id,
        className: classSession.name,
        courseTitle: classSession.subject.course.title,
        subjectTitle: classSession.subject.title,
        teacherName: classSession.subject.teacher.name,
        scheduledAt: classSession.scheduledAt,
        averages,
        resultsWithheld,
      },
    ];
  });
}
