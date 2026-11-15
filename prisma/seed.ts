import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { courseCatalog } from "../lib/course-catalog";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL must be set before seeding.");
}

if (
  process.env.TMS_ALLOW_MOCK_SEED !== "true" ||
  process.env.TMS_RESET_DEV_DATABASE !== "true" ||
  process.env.NODE_ENV === "production"
) {
  throw new Error(
    "Database reset is disabled. Set TMS_ALLOW_MOCK_SEED=true and TMS_RESET_DEV_DATABASE=true in a disposable non-production environment.",
  );
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: databaseUrl }),
});

const bootstrapEmail = "alham5376@aibl.com.bd";
const draftCourseCount = 5;
const courseCount = courseCatalog.length;

function courseId(index: number) {
  return `generated-course-${String(index + 1).padStart(3, "0")}`;
}

function courseSlug(index: number) {
  return `generated-course-${String(index + 1).padStart(3, "0")}`;
}

function getCourseCategory(title: string): string {
  if (/risk|control|audit|fraud|compliance|aml|cft|basel|supervision/i.test(title)) {
    return "Risk, compliance, and governance";
  }
  if (/digital|ict|cyber|swift|online|system|technology|ai\b/i.test(title)) {
    return "Digital banking and technology";
  }
  if (/leadership|management|communication|customer|service|human resource/i.test(title)) {
    return "Leadership and professional skills";
  }
  if (/investment|finance|treasury|trade|foreign exchange|banking|credit/i.test(title)) {
    return "Banking operations and finance";
  }
  return "Professional development";
}

function courseDescription(title: string): string {
  return `${title} is a practical, three-day learning program for banking professionals. Participants explore the relevant principles and institutional context, practise day-to-day processes and controls, and apply their learning to realistic workplace scenarios. Facilitated discussions and structured exercises connect each topic to sound decisions, clear documentation, and better service.`;
}

function learningOutcomes(title: string): string {
  return `By the end of this course, participants will be able to explain the core principles of ${title}; apply relevant procedures, controls, and documentation in routine cases; identify common operational risks and choose appropriate escalation steps; and prepare a practical action plan for applying the learning in their role.`;
}

function subjectTitles(title: string) {
  return [
    `Foundations and institutional context: ${title}`,
    `Operational practice, controls, and decision-making: ${title}`,
    `Applied case study and workplace action plan: ${title}`,
  ];
}

function classDate(courseIndex: number, classIndex: number, now: Date): Date {
  const isDraft = courseIndex < draftCourseCount;
  const publishedIndex = courseIndex - draftCourseCount;
  const scheduleGroup = publishedIndex % 3;
  const startOffset = isDraft
    ? 14 + courseIndex * 3
    : scheduleGroup === 0
      ? -3
      : scheduleGroup === 1
        ? 0
        : 7;
  const date = new Date(now);
  date.setUTCDate(date.getUTCDate() + startOffset + classIndex);
  date.setUTCHours(9, 0, 0, 0);
  return date;
}

async function seed() {
  if (courseCount <= draftCourseCount) {
    throw new Error("The generated course catalogue must contain more than five courses.");
  }

  const bootstrap = await prisma.user.findUnique({
    where: { email: bootstrapEmail },
    select: {
      id: true,
      isMock: true,
      accounts: {
        where: { providerId: "credential", password: { not: null } },
        select: { id: true },
      },
    },
  });

  if (!bootstrap || bootstrap.isMock || bootstrap.accounts.length !== 1) {
    throw new Error(
      "The non-mock alham5376@aibl.com.bd account and its credential login must exist before reset.",
    );
  }

  const publishedAt = new Date();
  const scheduleBase = new Date();
  scheduleBase.setUTCHours(0, 0, 0, 0);
  const generatedCourses = courseCatalog.map((title, index) => {
    const isDraft = index < draftCourseCount;
    return {
      id: courseId(index),
      slug: courseSlug(index),
      title,
      description: courseDescription(title),
      category: getCourseCategory(title),
      prerequisites:
        "No formal prerequisite. Participants should be familiar with their day-to-day banking responsibilities.",
      learningOutcomes: learningOutcomes(title),
      durationDays: 3,
      capacity: 30,
      status: isDraft ? ("DRAFT" as const) : ("PUBLISHED" as const),
      isMock: false,
      creatorId: bootstrap.id,
      publishedAt: isDraft ? null : publishedAt,
    };
  });

  const batches = generatedCourses.map((course) => ({
    id: `${course.id}-batch-1`,
    courseId: course.id,
    name: "Batch 1",
  }));

  const subjects = generatedCourses.flatMap((course) =>
    subjectTitles(course.title).map((title, subjectIndex) => ({
      id: `${course.id}-subject-${subjectIndex + 1}`,
      courseId: course.id,
      batchId: `${course.id}-batch-1`,
      title,
      description: `${title} combines concise instruction, guided discussion, and a practical exercise tailored to the course theme.`,
      position: subjectIndex + 1,
      teacherId: bootstrap.id,
    })),
  );

  const classes = subjects.map((subject, subjectIndex) => {
    const courseIndex = Math.floor(subjectIndex / 3);
    const classIndex = subjectIndex % 3;
    const date = classDate(courseIndex, classIndex, scheduleBase);
    return {
      id: `${subject.id}-class`,
      courseId: subject.courseId,
      batchId: subject.batchId,
      subjectId: subject.id,
      name: subject.title,
      durationMinutes: 180,
      position: classIndex + 1,
      scheduledAt: date,
      venue: "Training room or approved virtual classroom",
      deliveryMode: "HYBRID" as const,
    };
  });

  const materials = classes.flatMap((classSession) => [
    {
      id: `${classSession.id}-facilitator-guide`,
      classId: classSession.id,
      title: "Facilitator guide and key concepts",
      type: "TEXT" as const,
      description: `Session guide covering the objectives, core concepts, discussion prompts, and controls for ${classSession.name}.`,
      position: 1,
    },
    {
      id: `${classSession.id}-case-exercise`,
      classId: classSession.id,
      title: "Applied case exercise",
      type: "TEXT" as const,
      description: `A generated practice scenario for ${classSession.name}, with participant tasks for assessing the facts, documenting decisions, and identifying follow-up actions.`,
      position: 2,
    },
  ]);

  const auditEvents = generatedCourses.map((course) => ({
    id: `${course.id}-seed-audit`,
    courseId: course.id,
    courseTitle: course.title,
    actorId: bootstrap.id,
    action: course.status === "DRAFT" ? "COURSE_DRAFT_CREATED" : "COURSE_PUBLISHED",
  }));

  await prisma.$transaction(
    async (tx) => {
      await tx.courseAuditLog.deleteMany();
      await tx.userAuditLog.deleteMany();
      await tx.course.deleteMany();
      await tx.branch.deleteMany();
      await tx.user.deleteMany({ where: { id: { not: bootstrap.id } } });
      await tx.account.deleteMany({
        where: { userId: bootstrap.id, id: { not: bootstrap.accounts[0].id } },
      });
      await tx.session.deleteMany();
      await tx.verification.deleteMany();
      await tx.rateLimit.deleteMany();

      await tx.course.createMany({ data: generatedCourses });
      await tx.courseBatch.createMany({ data: batches });
      await tx.courseSubject.createMany({ data: subjects });
      await tx.courseClass.createMany({ data: classes });
      await tx.courseMaterial.createMany({ data: materials });
      await tx.courseAuditLog.createMany({ data: auditEvents });
    },
    { timeout: 120_000 },
  );

  const [
    userCount,
    accountCount,
    courseCounts,
    subjectCount,
    classCount,
    materialCount,
    enrollmentCount,
    branchCount,
    sessionCount,
    userAuditLogCount,
    verificationCount,
    rateLimitCount,
    courseAuditLogCount,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.account.count(),
    prisma.course.groupBy({
      by: ["status"],
      _count: { _all: true },
      orderBy: { status: "asc" },
    }),
    prisma.courseSubject.count(),
    prisma.courseClass.count(),
    prisma.courseMaterial.count(),
    prisma.courseEnrollment.count(),
    prisma.branch.count(),
    prisma.session.count(),
    prisma.userAuditLog.count(),
    prisma.verification.count(),
    prisma.rateLimit.count(),
    prisma.courseAuditLog.count(),
  ]);

  const statusCounts = Object.fromEntries(
    courseCounts.map(({ status, _count }) => [status.toLowerCase(), _count._all]),
  );

  const publishedCourseCount = courseCount - draftCourseCount;
  const expectedSubjectsAndClasses = courseCount * 3;
  const expectedMaterials = expectedSubjectsAndClasses * 2;
  if (
    userCount !== 1 ||
    accountCount !== 1 ||
    statusCounts.draft !== draftCourseCount ||
    statusCounts.published !== publishedCourseCount ||
    (statusCounts.archived ?? 0) !== 0 ||
    subjectCount !== expectedSubjectsAndClasses ||
    classCount !== expectedSubjectsAndClasses ||
    materialCount !== expectedMaterials ||
    enrollmentCount !== 0 ||
    branchCount !== 0 ||
    sessionCount !== 0 ||
    userAuditLogCount !== 0 ||
    verificationCount !== 0 ||
    rateLimitCount !== 0 ||
    courseAuditLogCount !== courseCount
  ) {
    throw new Error(
      "Post-seed verification failed; expected one login, five drafts, and a clean generated catalogue.",
    );
  }

  console.log(
    JSON.stringify(
      {
        retainedLogin: bootstrapEmail,
        users: userCount,
        loginAccounts: accountCount,
        courses: { total: courseCount, ...statusCounts },
        subjects: subjectCount,
        classes: classCount,
        generatedClassMaterials: materialCount,
        participantEnrollments: enrollmentCount,
        branches: branchCount,
        sessions: sessionCount,
        userAuditLogs: userAuditLogCount,
        verifications: verificationCount,
        rateLimits: rateLimitCount,
        courseAuditLogs: courseAuditLogCount,
      },
      null,
      2,
    ),
  );
}

seed()
  .catch((error: unknown) => {
    console.error("Development database reset and seed failed.", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
