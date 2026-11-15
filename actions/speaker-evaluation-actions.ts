"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { roles } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/roles";
import { isSpeakerEvaluationOpen, isValidSpeakerEvaluationScore } from "@/lib/speaker-evaluation";
import { requireAuthenticatedUser } from "@/lib/session";

const submissionSchema = z.object({
  classId: z.string().trim().min(1).max(180),
  presentationQuality: z.coerce.number().int(),
  experienceSharing: z.coerce.number().int(),
  sessionBenefit: z.coerce.number().int(),
  topicCompleteness: z.coerce.number().int(),
  learningEnvironment: z.coerce.number().int(),
});

export type SpeakerEvaluationActionResult = {
  success: boolean;
  message: string;
};

export async function submitSpeakerEvaluationAction(
  formData: FormData,
): Promise<SpeakerEvaluationActionResult> {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!isUserRole(role) || !roles[role].authorize({ evaluation: ["submit"] }).success) {
    return { success: false, message: "Only enrolled participants can submit evaluations." };
  }

  const parsed = submissionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { success: false, message: "Choose a rating for every evaluation point." };
  }

  const {
    classId,
    presentationQuality,
    experienceSharing,
    sessionBenefit,
    topicCompleteness,
    learningEnvironment,
  } = parsed.data;
  if (
    !isValidSpeakerEvaluationScore("presentationQuality", presentationQuality) ||
    !isValidSpeakerEvaluationScore("experienceSharing", experienceSharing) ||
    !isValidSpeakerEvaluationScore("sessionBenefit", sessionBenefit) ||
    !isValidSpeakerEvaluationScore("topicCompleteness", topicCompleteness) ||
    !isValidSpeakerEvaluationScore("learningEnvironment", learningEnvironment)
  ) {
    return { success: false, message: "One or more selected ratings are not valid." };
  }

  const classSession = await prisma.courseClass.findUnique({
    where: { id: classId },
    select: {
      durationMinutes: true,
      scheduledAt: true,
      batch: {
        select: {
          enrollments: {
            where: {
              participantId: session.user.id,
              status: { in: ["ASSIGNED", "CONFIRMED", "COMPLETED"] },
            },
            select: { id: true },
          },
        },
      },
      subject: {
        select: {
          course: {
            select: {
              status: true,
            },
          },
        },
      },
    },
  });

  if (
    !classSession?.scheduledAt ||
    !["PUBLISHED", "ARCHIVED"].includes(classSession.subject.course.status) ||
    classSession.batch.enrollments.length === 0
  ) {
    return { success: false, message: "This class is not available for your evaluation." };
  }
  if (!isSpeakerEvaluationOpen(classSession.scheduledAt, classSession.durationMinutes)) {
    return {
      success: false,
      message: "Evaluations can be submitted or edited for one week after the class ends.",
    };
  }

  await prisma.speakerEvaluation.upsert({
    where: {
      classId_participantId: { classId, participantId: session.user.id },
    },
    create: {
      id: randomUUID(),
      classId,
      participantId: session.user.id,
      presentationQuality,
      experienceSharing,
      sessionBenefit,
      topicCompleteness,
      learningEnvironment,
    },
    update: {
      presentationQuality,
      experienceSharing,
      sessionBenefit,
      topicCompleteness,
      learningEnvironment,
    },
  });

  revalidatePath("/dashboard/evaluations");
  return { success: true, message: "Your evaluation has been saved." };
}
