"use server";

import { randomUUID } from "node:crypto";
import { realpath, unlink } from "node:fs/promises";
import path from "node:path";
import { revalidatePath } from "next/cache";
import { Prisma } from "@/generated/prisma/client";
import {
  courseDraftProgressSchema,
  courseDraftSchema,
  courseSubjectsSchema,
  courseWizardSnapshotSchema,
} from "@/lib/auth-schema";
import {
  getCourseTimeZone,
  getWallClockShiftMinutes,
  shiftDateTimeInTimeZone,
} from "@/lib/attendance";
import { prisma } from "@/lib/prisma";
import { requireCoursePermission } from "@/lib/session";
import { isCourseMaterialPathInside } from "@/lib/course-material-upload";
import { removeCourseAssets } from "@/lib/course-asset-storage";

type ActionResult =
  | { success: true; message: string; courseId?: string; batchId?: string }
  | { success: false; message: string };

function failure(message: string): ActionResult {
  return { success: false, message };
}

async function createCourseNotifications(
  tx: Prisma.TransactionClient,
  input: {
    participantIds: string[];
    courseId: string;
    title: string;
    message: string;
    href: string;
  },
) {
  const participantIds = [...new Set(input.participantIds)];
  if (!participantIds.length) return;

  await tx.notification.createMany({
    data: participantIds.map((userId) => ({
      id: randomUUID(),
      userId,
      courseId: input.courseId,
      title: input.title,
      message: input.message,
      href: input.href,
    })),
  });
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

function getCourseMaterialId(url: string | null | undefined): string | null {
  return url?.match(/^\/api\/course-materials\/([^/]+)$/)?.[1] ?? null;
}

function parseDraftSnapshot(value: string) {
  try {
    const snapshot: unknown = JSON.parse(value);
    const snapshotRecord =
      snapshot && typeof snapshot === "object" && !Array.isArray(snapshot)
        ? (snapshot as Record<string, unknown>)
        : null;
    const valuesRecord =
      snapshotRecord?.values &&
      typeof snapshotRecord.values === "object" &&
      !Array.isArray(snapshotRecord.values)
        ? (snapshotRecord.values as Record<string, unknown>)
        : null;
    const cleanMediaPath = (value: unknown, kind: "cover" | "promo") =>
      typeof value === "string" &&
      new RegExp(`^/api/course-media/[A-Za-z0-9_-]{1,180}/${kind}$`).test(value)
        ? value
        : "";
    const normalizedSnapshot =
      snapshotRecord && valuesRecord
        ? {
            ...snapshotRecord,
            values: {
              ...valuesRecord,
              coverImageUrl: cleanMediaPath(valuesRecord.coverImageUrl, "cover"),
              promoVideoUrl: cleanMediaPath(valuesRecord.promoVideoUrl, "promo"),
            },
          }
        : snapshot;
    const parsed = courseWizardSnapshotSchema.safeParse(normalizedSnapshot);
    return parsed.success
      ? { json: parsed.data as Prisma.InputJsonValue, values: parsed.data.values }
      : null;
  } catch {
    return null;
  }
}

function courseMediaMatchesCourse(
  values: { coverImageUrl: string; promoVideoUrl: string },
  courseId: string | null,
): boolean {
  const expectedCover = courseId ? `/api/course-media/${courseId}/cover` : "";
  const expectedPromo = courseId ? `/api/course-media/${courseId}/promo` : "";
  return (
    (!values.coverImageUrl || values.coverImageUrl === expectedCover) &&
    (!values.promoVideoUrl || values.promoVideoUrl === expectedPromo)
  );
}

async function removeUnusedStoredFiles(storageKeys: string[]) {
  const keys = [...new Set(storageKeys.filter(Boolean))];
  if (!keys.length) return;

  const referenced = await prisma.courseMaterial.findMany({
    where: { storageKey: { in: keys } },
    select: { storageKey: true },
  });
  const retained = new Set(referenced.map((material) => material.storageKey));
  const storageRoot = path.resolve(process.cwd(), "storage", "course-materials");
  let realStorageRoot: string;
  try {
    realStorageRoot = await realpath(storageRoot);
  } catch (error) {
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") {
      return;
    }
    throw error;
  }
  for (const key of keys) {
    if (retained.has(key)) continue;
    const absolutePath = path.resolve(realStorageRoot, key);
    if (!isCourseMaterialPathInside(realStorageRoot, absolutePath)) {
      throw new Error("Course material cleanup found an invalid storage path.");
    }
    try {
      const realFilePath = await realpath(absolutePath);
      if (!isCourseMaterialPathInside(realStorageRoot, realFilePath)) {
        throw new Error("Course material cleanup found an invalid storage path.");
      }
      await unlink(absolutePath);
    } catch (error) {
      if (!(error instanceof Error) || !("code" in error) || error.code !== "ENOENT") throw error;
    }
  }
}

async function validateDraftForm(formData: FormData) {
  const parsed = courseDraftSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false as const,
      error: "Check the course details, duration, capacity, and learning outcomes.",
    };
  }

  let rawSubjects: unknown;
  let participantIds: unknown;
  try {
    rawSubjects = JSON.parse(parsed.data.subjects);
    participantIds = JSON.parse(parsed.data.participantIds);
  } catch {
    return {
      ok: false as const,
      error: "Review the subjects, classes, materials, and participant selections.",
    };
  }

  const parsedSubjects = courseSubjectsSchema.safeParse(rawSubjects);
  if (!parsedSubjects.success || !Array.isArray(participantIds) || participantIds.length === 0) {
    return {
      ok: false as const,
      error: "Add at least one subject, class, material, and participant.",
    };
  }
  const rawDraftData = formData.get("draftData");
  let draftData: Prisma.InputJsonValue | typeof Prisma.DbNull = Prisma.DbNull;
  let draftValues: { coverImageUrl: string; promoVideoUrl: string } = {
    coverImageUrl: "",
    promoVideoUrl: "",
  };
  let batchName = "Batch 1";
  if (typeof rawDraftData === "string" && rawDraftData) {
    if (rawDraftData.length > 150_000) {
      return { ok: false as const, error: "The course draft is too large to save." };
    }
    const snapshot = parseDraftSnapshot(rawDraftData);
    if (!snapshot) {
      return {
        ok: false as const,
        error: "The course draft could not be saved. Review your form and try again.",
      };
    }
    const courseId = formData.get("courseId");
    if (
      !courseMediaMatchesCourse(
        snapshot.values,
        typeof courseId === "string" && courseId ? courseId : null,
      )
    ) {
      return {
        ok: false as const,
        error: "Upload course media to this course before saving the draft.",
      };
    }
    draftData = snapshot.json;
    draftValues = snapshot.values;
    batchName = snapshot.values.cohortName.trim() || batchName;
  }
  const subjects = parsedSubjects.data;
  const participants = [
    ...new Set(participantIds.filter((id): id is string => typeof id === "string")),
  ];
  if (participants.length !== participantIds.length || participants.length > parsed.data.capacity) {
    return {
      ok: false as const,
      error: "Select unique participants and keep assignments within course capacity.",
    };
  }
  if (
    subjects.some((subject) =>
      subject.classes.some((classSession) =>
        classSession.materials.some((material) => {
          if (!material.url) return material.type === "LINK";
          if (material.type === "FILE") return !getCourseMaterialId(material.url);
          try {
            return new URL(material.url).protocol !== "https:";
          } catch {
            return true;
          }
        }),
      ),
    )
  ) {
    return {
      ok: false as const,
      error: "Materials must be attached files or secure HTTPS links.",
    };
  }

  const teacherIds = [...new Set(subjects.map((subject) => subject.teacherId))];
  const sourceMaterialIds = [
    ...new Set(
      subjects.flatMap((subject) =>
        subject.classes.flatMap((classSession) =>
          classSession.materials
            .filter((material) => material.type === "FILE" && material.url)
            .map((material) => getCourseMaterialId(material.url)!),
        ),
      ),
    ),
  ];
  const [teachers, participantUsers] = await Promise.all([
    prisma.user.findMany({
      where: { id: { in: teacherIds }, role: "teacher", banned: false, isMock: false },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: { id: { in: participants }, role: "participant", banned: false, isMock: false },
      select: { id: true },
    }),
  ]);

  if (teachers.length !== teacherIds.length) {
    return {
      ok: false as const,
      error: "Every subject must be assigned to an active, non-mock teacher account.",
    };
  }
  if (participantUsers.length !== participants.length) {
    return {
      ok: false as const,
      error: "Every participant must have an active, non-mock participant account.",
    };
  }
  const sourceMaterials = sourceMaterialIds.length
    ? await prisma.courseMaterial.findMany({
        where: { id: { in: sourceMaterialIds }, type: "FILE", storageKey: { not: null } },
        select: { id: true, storageKey: true, description: true },
      })
    : [];
  if (sourceMaterials.length !== sourceMaterialIds.length) {
    return {
      ok: false as const,
      error: "One or more attached course materials are no longer available.",
    };
  }

  return {
    ok: true as const,
    data: parsed.data,
    draftData,
    draftValues,
    batchName,
    subjects,
    participants,
    sourceMaterialsById: new Map(sourceMaterials.map((material) => [material.id, material])),
  };
}

export async function saveCourseDraftProgressAction(formData: FormData): Promise<ActionResult> {
  const session = await requireCoursePermission("write");
  const parsed = courseDraftProgressSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return failure("Add a course title with at least 3 characters before saving your draft.");
  }

  const draftData = parseDraftSnapshot(parsed.data.draftData);
  if (!draftData) {
    return failure("The course draft could not be saved. Review your form and try again.");
  }
  const { json, values } = draftData;

  const requestedCourseId = formData.get("courseId");
  if (
    !courseMediaMatchesCourse(
      values,
      typeof requestedCourseId === "string" && requestedCourseId ? requestedCourseId : null,
    )
  ) {
    return failure("Upload course media to this course before saving the draft.");
  }
  if (typeof requestedCourseId === "string" && requestedCourseId) {
    const course = await prisma.course.findUnique({
      where: { id: requestedCourseId },
      select: {
        status: true,
        isMock: true,
        batches: { orderBy: { createdAt: "asc" }, take: 1, select: { id: true } },
      },
    });
    if (!course) return failure("The selected course could not be found.");
    if (course.isMock) {
      return failure("Mock courses cannot be edited.");
    }
    if (!course.batches[0]) return failure("The selected course has no batch.");

    await prisma.course.update({
      where: { id: requestedCourseId },
      data: {
        title: parsed.data.title,
        description: parsed.data.description,
        category: values.category || null,
        prerequisites: values.prerequisites || null,
        learningOutcomes: values.learningOutcomes || null,
        durationDays: values.durationDays || null,
        capacity: values.capacity || null,
        draftData: json,
      },
    });
    revalidatePath("/dashboard/courses");
    return {
      success: true,
      message: "Draft saved.",
      courseId: requestedCourseId,
      batchId: course.batches[0].id,
    };
  }

  const courseId = randomUUID();
  const batchId = randomUUID();
  const slugBase = parsed.data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  await prisma.$transaction(async (tx) => {
    await tx.course.create({
      data: {
        id: courseId,
        slug: `${slugBase || "course"}-${courseId.slice(0, 8)}`,
        title: parsed.data.title,
        description: parsed.data.description,
        category: values.category || null,
        prerequisites: values.prerequisites || null,
        learningOutcomes: values.learningOutcomes || null,
        durationDays: values.durationDays || null,
        capacity: values.capacity || null,
        draftData: json,
        creatorId: session.user.id,
      },
    });
    await tx.courseBatch.create({
      data: { id: batchId, courseId, name: values.cohortName.trim() || "Batch 1" },
    });
    await tx.courseAuditLog.create({
      data: {
        courseId,
        courseTitle: parsed.data.title,
        actorId: session.user.id,
        action: "COURSE_DRAFT_CREATED",
      },
    });
  });

  revalidatePath("/dashboard/courses");
  return { success: true, message: "Draft saved.", courseId, batchId };
}

async function createCourseStructure(
  tx: Prisma.TransactionClient,
  courseId: string,
  batchId: string,
  subjects: typeof courseSubjectsSchema._output,
  sourceMaterialsById: Map<
    string,
    { id: string; storageKey: string | null; description: string | null }
  >,
) {
  let classPosition = 0;
  for (const [subjectIndex, subject] of subjects.entries()) {
    const subjectId = subject.id ?? randomUUID();
    await tx.courseSubject.create({
      data: {
        id: subjectId,
        courseId,
        batchId,
        title: subject.title,
        description: subject.title,
        position: subjectIndex + 1,
        teacherId: subject.teacherId,
      },
    });

    for (const classSession of subject.classes) {
      classPosition += 1;
      const classId = classSession.id ?? randomUUID();
      await tx.courseClass.create({
        data: {
          id: classId,
          courseId,
          batchId,
          subjectId,
          name: classSession.name,
          durationMinutes: classSession.durationMinutes,
          position: classPosition,
          scheduledAt: classSession.scheduledAt ? new Date(classSession.scheduledAt) : null,
          venue: classSession.venue ?? null,
          deliveryMode: classSession.deliveryMode ?? "ONSITE",
        },
      });

      const materials = classSession.materials.flatMap((material, materialIndex) => {
        if (material.type === "FILE" && !material.url) return [];
        const sourceId = material.type === "FILE" ? getCourseMaterialId(material.url) : null;
        const source = sourceId ? sourceMaterialsById.get(sourceId) : undefined;
        const id = material.id ?? randomUUID();
        return [
          {
            id,
            classId,
            title: material.title,
            type: material.type,
            url: material.type === "FILE" ? `/api/course-materials/${id}` : (material.url ?? null),
            storageKey: source?.storageKey ?? null,
            description: source?.description ?? null,
            position: materialIndex + 1,
          },
        ];
      });
      if (materials.length) await tx.courseMaterial.createMany({ data: materials });
    }
  }
}

export async function createCourseDraftAction(formData: FormData): Promise<ActionResult> {
  const session = await requireCoursePermission("write");
  const validated = await validateDraftForm(formData);
  if (!validated.ok) return failure(validated.error);

  const { data, draftData, draftValues, batchName, subjects, participants, sourceMaterialsById } =
    validated;
  if (!courseMediaMatchesCourse(draftValues, null)) {
    return failure("Save this course as a draft before uploading course media.");
  }
  const courseId = randomUUID();
  const batchId = randomUUID();
  const slugBase = data.title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 100);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.course.create({
        data: {
          id: courseId,
          slug: `${slugBase || "course"}-${courseId.slice(0, 8)}`,
          title: data.title,
          description: data.description,
          category: data.category || null,
          prerequisites: data.prerequisites || null,
          learningOutcomes: data.learningOutcomes,
          durationDays: data.durationDays,
          capacity: data.capacity,
          draftData,
          creatorId: session.user.id,
        },
      });
      await tx.courseBatch.create({ data: { id: batchId, courseId, name: batchName } });
      await createCourseStructure(tx, courseId, batchId, subjects, sourceMaterialsById);

      await tx.courseEnrollment.createMany({
        data: participants.map((participantId) => ({
          id: randomUUID(),
          courseId,
          batchId,
          participantId,
          assignedById: session.user.id,
        })),
      });
      await tx.courseAuditLog.create({
        data: {
          courseId,
          courseTitle: data.title,
          actorId: session.user.id,
          action: "COURSE_DRAFT_CREATED",
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return failure("That course could not be saved because a unique value already exists.");
    }
    throw error;
  }

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  return { success: true, message: "Course draft created.", courseId };
}

export async function updateCourseAction(formData: FormData): Promise<ActionResult> {
  const session = await requireCoursePermission("write");
  const courseId = formData.get("courseId");
  const batchId = formData.get("batchId");
  if (typeof courseId !== "string" || !courseId) return failure("Choose a valid course.");
  if (typeof batchId !== "string" || !batchId) return failure("Choose a valid course batch.");

  const validated = await validateDraftForm(formData);
  if (!validated.ok) return failure(validated.error);

  const { data, draftData, draftValues, batchName, subjects, participants, sourceMaterialsById } =
    validated;
  const requestedCourseId = formData.get("courseId");
  if (
    !courseMediaMatchesCourse(
      draftValues,
      typeof requestedCourseId === "string" && requestedCourseId ? requestedCourseId : null,
    )
  ) {
    return failure("Upload course media to this course before saving the draft.");
  }
  const existingFiles = await prisma.courseMaterial.findMany({
    where: { class: { is: { batchId } }, storageKey: { not: null } },
    select: { storageKey: true },
  });

  let result: string;
  try {
    result = await prisma.$transaction(async (tx) => {
      const currentCourse = await tx.course.findUnique({
        where: { id: courseId },
        select: {
          id: true,
          isMock: true,
          batches: { where: { id: batchId }, select: { id: true } },
        },
      });

      if (!currentCourse) return "missing";
      if (currentCourse.isMock) return "mock";
      if (!currentCourse.batches.length) return "missing-batch";

      await tx.courseBatch.update({ where: { id: batchId }, data: { name: batchName } });
      await tx.course.update({
        where: { id: courseId },
        data: {
          title: data.title,
          description: data.description,
          category: data.category || null,
          prerequisites: data.prerequisites || null,
          learningOutcomes: data.learningOutcomes,
          durationDays: data.durationDays,
          capacity: data.capacity,
          draftData,
        },
      });
      await tx.courseSubject.deleteMany({ where: { batchId } });
      await createCourseStructure(tx, courseId, batchId, subjects, sourceMaterialsById);
      const removedEnrollments = await tx.courseEnrollment.findMany({
        where: {
          batchId,
          status: { in: ["ASSIGNED", "CONFIRMED"] },
          participantId: { notIn: participants },
        },
        select: { participantId: true },
      });
      await createCourseNotifications(tx, {
        participantIds: removedEnrollments.map((enrollment) => enrollment.participantId),
        courseId,
        title: "Course assignment changed",
        message: `Your assignment to ${data.title} has changed. Check My learning for your current courses.`,
        href: "/dashboard/learning",
      });
      await tx.courseEnrollment.deleteMany({
        where: {
          batchId,
          status: { in: ["ASSIGNED", "CONFIRMED"] },
          participantId: { notIn: participants },
        },
      });
      await tx.courseEnrollment.createMany({
        data: participants.map((participantId) => ({
          id: randomUUID(),
          courseId,
          batchId,
          participantId,
          assignedById: session.user.id,
        })),
        skipDuplicates: true,
      });
      const [currentEnrollments, assignedTeachers] = await Promise.all([
        tx.courseEnrollment.findMany({
          where: {
            courseId,
            status: { in: ["ASSIGNED", "CONFIRMED", "COMPLETED"] },
          },
          select: { participantId: true },
        }),
        tx.courseSubject.findMany({
          where: { courseId },
          select: { teacherId: true },
        }),
      ]);
      await createCourseNotifications(tx, {
        participantIds: [
          ...currentEnrollments.map((enrollment) => enrollment.participantId),
          ...assignedTeachers.map((subject) => subject.teacherId),
        ],
        courseId,
        title: "Course updated",
        message: `${data.title} details or schedule were updated. Review the latest course information.`,
        href: `/dashboard/courses/${courseId}`,
      });
      await tx.courseAuditLog.create({
        data: {
          courseId,
          courseTitle: data.title,
          actorId: session.user.id,
          action: "COURSE_UPDATED",
        },
      });
      return "updated";
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return failure("A batch with that name already exists for this course.");
    }
    throw error;
  }

  if (result === "missing") return failure("The selected course could not be found.");
  if (result === "mock") return failure("Mock courses cannot be edited.");
  if (result === "missing-batch") return failure("The selected course batch could not be found.");
  await removeUnusedStoredFiles(existingFiles.flatMap((material) => material.storageKey ?? []));

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  return { success: true, message: "Course updated.", courseId };
}

export async function createCourseBatchAction(formData: FormData): Promise<ActionResult> {
  const session = await requireCoursePermission("write");
  const courseId = formData.get("courseId");
  const sourceBatchId = formData.get("sourceBatchId");
  const batchName = formData.get("batchName");
  const targetStartAt = formData.get("targetStartAt");
  const rawParticipantIds = formData.get("participantIds");
  if (
    typeof courseId !== "string" ||
    !courseId ||
    typeof sourceBatchId !== "string" ||
    !sourceBatchId ||
    typeof batchName !== "string" ||
    !batchName.trim() ||
    batchName.trim().length > 180 ||
    typeof targetStartAt !== "string" ||
    typeof rawParticipantIds !== "string"
  ) {
    return failure("Provide a course, batch name, schedule, and participants.");
  }

  let participantIds: unknown;
  try {
    participantIds = JSON.parse(rawParticipantIds);
  } catch {
    return failure("Choose valid participants for this batch.");
  }
  const participants = Array.isArray(participantIds)
    ? participantIds.filter((id): id is string => typeof id === "string")
    : [];
  if (
    !Array.isArray(participantIds) ||
    participants.length !== participantIds.length ||
    participants.length === 0 ||
    participants.length > 10_000 ||
    new Set(participants).size !== participants.length
  ) {
    return failure("Select one or more unique participants.");
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      status: true,
      isMock: true,
      capacity: true,
      draftData: true,
      batches: {
        where: { id: sourceBatchId },
        select: {
          id: true,
          name: true,
          subjects: {
            orderBy: { position: "asc" },
            include: {
              classes: {
                orderBy: { position: "asc" },
                include: { materials: { orderBy: { position: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
  if (!course || course.isMock) return failure("The selected course could not be found.");
  if (course.status !== "PUBLISHED") {
    return failure("Additional batches can be created only for published courses.");
  }
  const sourceBatch = course.batches[0];
  if (!sourceBatch || !sourceBatch.subjects.length) {
    return failure("Choose a batch with a schedule to use as the template.");
  }
  const scheduledClasses = sourceBatch.subjects.flatMap((subject) => subject.classes);
  const firstScheduledClass = scheduledClasses
    .filter(
      (classSession): classSession is typeof classSession & { scheduledAt: Date } =>
        classSession.scheduledAt !== null,
    )
    .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime())[0];
  if (!firstScheduledClass?.scheduledAt) {
    return failure("The source batch has no scheduled class to copy.");
  }

  const timeZone = getCourseTimeZone(course.draftData);
  const shiftMinutes = getWallClockShiftMinutes(
    firstScheduledClass.scheduledAt,
    targetStartAt,
    timeZone,
  );
  if (shiftMinutes === null || shiftMinutes === 0) {
    return failure("Choose a valid new start date and time for this batch.");
  }
  const shiftedFirstClass = shiftDateTimeInTimeZone(
    firstScheduledClass.scheduledAt,
    shiftMinutes,
    timeZone,
  );
  if (shiftedFirstClass <= new Date()) {
    return failure("The first class of a new batch must be scheduled in the future.");
  }

  const [existingBatch, participantUsers] = await Promise.all([
    prisma.courseBatch.findFirst({
      where: { courseId, name: batchName.trim() },
      select: { id: true },
    }),
    prisma.user.findMany({
      where: { id: { in: participants }, role: "participant", banned: false, isMock: false },
      select: { id: true },
    }),
  ]);
  if (existingBatch) return failure("A batch with that name already exists for this course.");
  if (participantUsers.length !== participants.length) {
    return failure("Every selected participant must have an active, non-mock account.");
  }
  if (course.capacity && participants.length > course.capacity) {
    return failure("The selected participants exceed the course capacity.");
  }

  const batchId = randomUUID();
  try {
    await prisma.$transaction(async (tx) => {
      await tx.courseBatch.create({
        data: { id: batchId, courseId, name: batchName.trim() },
      });

      let classPosition = 0;
      for (const subject of sourceBatch.subjects) {
        const subjectId = randomUUID();
        await tx.courseSubject.create({
          data: {
            id: subjectId,
            courseId,
            batchId,
            title: subject.title,
            description: subject.description,
            position: subject.position,
            teacherId: subject.teacherId,
          },
        });

        for (const classSession of subject.classes) {
          classPosition += 1;
          const classId = randomUUID();
          await tx.courseClass.create({
            data: {
              id: classId,
              courseId,
              batchId,
              subjectId,
              name: classSession.name,
              durationMinutes: classSession.durationMinutes,
              position: classPosition,
              scheduledAt: classSession.scheduledAt
                ? shiftDateTimeInTimeZone(classSession.scheduledAt, shiftMinutes, timeZone)
                : null,
              venue: classSession.venue,
              deliveryMode: classSession.deliveryMode,
            },
          });
          if (classSession.materials.length) {
            await tx.courseMaterial.createMany({
              data: classSession.materials.map((material) => {
                const materialId = randomUUID();
                return {
                  id: materialId,
                  classId,
                  title: material.title,
                  type: material.type,
                  description: material.description,
                  url:
                    material.type === "FILE" ? `/api/course-materials/${materialId}` : material.url,
                  storageKey: material.storageKey,
                  position: material.position,
                };
              }),
            });
          }
        }
      }

      await tx.courseEnrollment.createMany({
        data: participants.map((participantId) => ({
          id: randomUUID(),
          courseId,
          batchId,
          participantId,
          assignedById: session.user.id,
        })),
      });
      await createCourseNotifications(tx, {
        participantIds: [
          ...participants,
          ...sourceBatch.subjects.map((subject) => subject.teacherId),
        ],
        courseId,
        title: "New course batch",
        message: `A new batch of ${course.title} has been created for you. Review its schedule and course details.`,
        href: `/dashboard/courses/${courseId}`,
      });
      await tx.courseAuditLog.create({
        data: {
          courseId,
          courseTitle: course.title,
          actorId: session.user.id,
          action: "COURSE_BATCH_CREATED",
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      return failure("A batch with that name already exists for this course.");
    }
    throw error;
  }

  revalidatePath("/dashboard/courses");
  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard/attendance");
  return { success: true, message: "Course batch created.", courseId, batchId };
}

export async function completeCourseEnrollmentAction(formData: FormData): Promise<ActionResult> {
  await requireCoursePermission("write");
  const courseId = formData.get("courseId");
  const batchId = formData.get("batchId");
  const enrollmentId = formData.get("enrollmentId");
  if (
    typeof courseId !== "string" ||
    !courseId ||
    typeof batchId !== "string" ||
    !batchId ||
    typeof enrollmentId !== "string" ||
    !enrollmentId
  ) {
    return failure("Choose a valid course enrollment.");
  }

  const now = new Date();
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: { id: enrollmentId, courseId, batchId },
    select: {
      id: true,
      status: true,
      participantId: true,
      batch: {
        select: {
          classes: { select: { scheduledAt: true, durationMinutes: true } },
        },
      },
      course: { select: { title: true } },
    },
  });
  if (!enrollment) return failure("The selected enrollment could not be found.");
  if (enrollment.status === "COMPLETED") {
    return { success: true, message: "This participant already has a completion certificate." };
  }
  if (enrollment.status !== "ASSIGNED" && enrollment.status !== "CONFIRMED") {
    return failure("Only active course enrollments can be marked complete.");
  }
  if (
    enrollment.batch.classes.length === 0 ||
    enrollment.batch.classes.some(
      (classSession) =>
        !classSession.scheduledAt ||
        classSession.scheduledAt.getTime() + classSession.durationMinutes * 60_000 > now.getTime(),
    )
  ) {
    return failure(
      "All scheduled classes in the batch must end before completion can be recorded.",
    );
  }

  const certificateNumber = `TMS-${randomUUID().replaceAll("-", "").slice(0, 12).toUpperCase()}`;
  const updated = await prisma.$transaction(async (tx) => {
    const result = await tx.courseEnrollment.updateMany({
      where: {
        id: enrollmentId,
        courseId,
        batchId,
        status: { in: ["ASSIGNED", "CONFIRMED"] },
      },
      data: { status: "COMPLETED", completedAt: now, certificateNumber },
    });
    if (result.count) {
      await createCourseNotifications(tx, {
        participantIds: [enrollment.participantId],
        courseId,
        title: "Course completed",
        message: `Your completion of ${enrollment.course.title} is recorded. Your certificate is available in My learning.`,
        href: "/dashboard/learning",
      });
    }
    return result;
  });
  if (!updated.count) return failure("The enrollment changed before completion could be recorded.");

  revalidatePath("/dashboard/courses");
  revalidatePath(`/dashboard/courses/${courseId}`);
  revalidatePath("/dashboard/learning");
  revalidatePath("/dashboard");
  return { success: true, message: "Course completed and certificate issued." };
}

export async function publishCourseAction(formData: FormData): Promise<ActionResult> {
  const session = await requireCoursePermission("publish");
  const courseId = formData.get("courseId");
  if (typeof courseId !== "string" || !courseId) return failure("Choose a valid course.");

  const result = await prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({
      where: { id: courseId },
      include: {
        batches: {
          include: {
            subjects: {
              include: {
                teacher: { select: { role: true, banned: true } },
                classes: { include: { materials: { select: { id: true } } } },
              },
            },
            enrollments: {
              where: { status: { in: ["ASSIGNED", "CONFIRMED"] } },
              select: { id: true, participantId: true },
            },
          },
        },
      },
    });

    if (!course) return "missing";
    if (course.status !== "DRAFT") return "not-draft";
    if (course.isMock) return "mock";
    if (!course.durationDays || course.batches.length === 0) {
      return "incomplete";
    }
    if (course.batches.some((batch) => !batch.subjects.length || !batch.enrollments.length)) {
      return "incomplete";
    }
    if (
      course.batches.some((batch) =>
        batch.subjects.some(
          (subject) =>
            subject.teacher.role !== "teacher" ||
            subject.teacher.banned ||
            subject.classes.length === 0 ||
            subject.classes.some(
              (classSession) =>
                classSession.durationMinutes <= 0 || classSession.materials.length === 0,
            ),
        ),
      )
    ) {
      return "incomplete";
    }
    if (
      course.capacity &&
      course.batches.some((batch) => batch.enrollments.length > course.capacity!)
    ) {
      return "over-capacity";
    }

    await tx.course.update({
      where: { id: courseId },
      data: { status: "PUBLISHED", publishedAt: new Date() },
    });
    await tx.courseAuditLog.create({
      data: {
        courseId,
        courseTitle: course.title,
        actorId: session.user.id,
        action: "COURSE_PUBLISHED",
      },
    });
    await createCourseNotifications(tx, {
      participantIds: course.batches.flatMap((batch) => [
        ...batch.enrollments.map((enrollment) => enrollment.participantId),
        ...batch.subjects.map((subject) => subject.teacherId),
      ]),
      courseId,
      title: "Course published",
      message: `${course.title} is now available. Review your course details and schedule.`,
      href: `/dashboard/courses/${courseId}`,
    });
    return "published";
  });

  const messages: Record<string, string> = {
    missing: "The selected course could not be found.",
    "not-draft": "Only draft courses can be published.",
    mock: "Mock catalogue entries cannot be published.",
    incomplete:
      "Assign participants and ensure every subject has an active teacher, class, duration, and material.",
    "over-capacity": "The number of assigned participants exceeds the course capacity.",
  };
  if (result !== "published")
    return failure(messages[result] ?? "The course could not be published.");

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  return {
    success: true,
    message: "Course published and made available to assigned participants.",
  };
}

export async function deleteCourseAction(formData: FormData): Promise<ActionResult> {
  const session = await requireCoursePermission("write");
  const courseId = formData.get("courseId");
  if (typeof courseId !== "string" || !courseId) return failure("Choose a valid course.");
  const existingFiles = await prisma.courseMaterial.findMany({
    where: { class: { is: { courseId } }, storageKey: { not: null } },
    select: { storageKey: true },
  });

  const result = await prisma.$transaction(async (tx) => {
    const course = await tx.course.findUnique({
      where: { id: courseId },
      select: {
        id: true,
        title: true,
        isMock: true,
        enrollments: {
          where: { status: { in: ["ASSIGNED", "CONFIRMED", "COMPLETED"] } },
          select: { participantId: true },
        },
        subjects: { select: { teacherId: true } },
      },
    });
    if (!course) return "missing";
    if (course.isMock) return "mock";

    await createCourseNotifications(tx, {
      participantIds: [
        ...course.enrollments.map((enrollment) => enrollment.participantId),
        ...course.subjects.map((subject) => subject.teacherId),
      ],
      courseId,
      title: "Course removed",
      message: `${course.title} has been removed from the course catalog.`,
      href: "/dashboard/notifications",
    });
    await tx.courseAuditLog.updateMany({
      where: { courseId },
      data: { courseId: null, courseTitle: course.title },
    });
    await tx.course.delete({ where: { id: courseId } });
    await tx.courseAuditLog.create({
      data: {
        courseTitle: course.title,
        actorId: session.user.id,
        action: "COURSE_DELETED",
      },
    });
    return "deleted";
  });

  if (result === "missing") return failure("The selected course could not be found.");
  if (result === "mock") return failure("Mock courses cannot be deleted.");
  await removeUnusedStoredFiles(existingFiles.flatMap((material) => material.storageKey ?? []));
  await removeCourseAssets(courseId);

  revalidatePath("/dashboard/courses");
  revalidatePath("/dashboard");
  return { success: true, message: "Course and its active assignments were deleted." };
}
