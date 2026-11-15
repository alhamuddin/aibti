import "server-only";

import type { Prisma } from "@/generated/prisma/client";
import type { CourseEnrollmentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/prisma";
import { roles } from "@/lib/permissions";
import type { UserRole } from "@/lib/roles";
import type { CourseListResponse, CourseRow, MyLearningCourse } from "@/lib/course-types";

const activeEnrollmentStatuses: CourseEnrollmentStatus[] = ["ASSIGNED", "CONFIRMED"];
const participantLearningStatuses: CourseEnrollmentStatus[] = [
  ...activeEnrollmentStatuses,
  "COMPLETED",
];

function getParticipantCoursesWhere(userId: string): Prisma.CourseWhereInput {
  return {
    OR: [
      {
        status: "PUBLISHED",
        enrollments: {
          some: { participantId: userId, status: { in: activeEnrollmentStatuses } },
        },
      },
      {
        status: { in: ["PUBLISHED", "ARCHIVED"] },
        enrollments: {
          some: { participantId: userId, status: "COMPLETED" },
        },
      },
    ],
  };
}

function getCourseBatchWhere(
  userId: string,
  role: UserRole,
  branchId: string | null,
): Prisma.CourseBatchWhereInput {
  if (role === "participant") {
    return {
      enrollments: {
        some: { participantId: userId, status: { in: participantLearningStatuses } },
      },
    };
  }
  if (role === "teacher") return { subjects: { some: { teacherId: userId } } };
  if (role === "branch_manager") {
    return {
      enrollments: {
        some: {
          status: { in: activeEnrollmentStatuses },
          participant: { branchId: branchId ?? "__unassigned_branch__" },
        },
      },
    };
  }
  return {};
}

export async function listMyLearningForUser(userId: string): Promise<MyLearningCourse[]> {
  const courses = await prisma.course.findMany({
    where: getParticipantCoursesWhere(userId),
    orderBy: { title: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      category: true,
      enrollments: {
        where: { participantId: userId, status: { in: participantLearningStatuses } },
        select: {
          id: true,
          status: true,
          completedAt: true,
          certificateNumber: true,
          batch: { select: { id: true, name: true } },
        },
      },
    },
  });

  return courses.flatMap((course) =>
    course.enrollments.map((enrollment) => ({
      id: course.id,
      enrollmentId: enrollment.id,
      batchId: enrollment.batch.id,
      batchName: enrollment.batch.name,
      title: course.title,
      description: course.description,
      category: course.category,
      enrollmentStatus: enrollment.status,
      certificateNumber: enrollment.certificateNumber,
      completedAt: enrollment.completedAt?.toISOString() ?? null,
    })),
  );
}

export async function listCoursesForUser(
  userId: string,
  role: UserRole,
  page: number,
  pageSize: number,
  search: string,
  courseId?: string,
): Promise<CourseListResponse> {
  let where: Prisma.CourseWhereInput = {};
  let branchId: string | null = null;
  const enrollmentWhere: Prisma.CourseEnrollmentWhereInput = {
    status: {
      in:
        role === "admin" || role === "super_admin"
          ? [...activeEnrollmentStatuses, "COMPLETED"]
          : activeEnrollmentStatuses,
    },
  };

  if (role === "participant") {
    where = getParticipantCoursesWhere(userId);
    enrollmentWhere.participantId = userId;
    enrollmentWhere.status = { in: participantLearningStatuses };
  } else if (role === "teacher") {
    where = { subjects: { some: { teacherId: userId } } };
  } else if (role === "branch_manager") {
    const branch = await prisma.branch.findUnique({
      where: { managerUserId: userId },
      select: { id: true },
    });
    branchId = branch?.id ?? "__unassigned_branch__";
    where = {
      status: "PUBLISHED",
      enrollments: {
        some: {
          status: { in: activeEnrollmentStatuses },
          participant: { branchId },
        },
      },
    };
    enrollmentWhere.participant = { branchId };
  } else if (role === "auditor") {
    where = { status: "PUBLISHED" };
  }

  if (search) {
    where = {
      ...where,
      AND: [
        {
          OR: [
            { title: { contains: search, mode: "insensitive" } },
            { description: { contains: search, mode: "insensitive" } },
            { category: { contains: search, mode: "insensitive" } },
          ],
        },
      ],
    };
  }
  if (courseId) {
    where = { ...where, id: courseId };
  }
  const canReadEnrollments =
    roles[role].authorize({ enrollment: ["read.own"] }).success ||
    roles[role].authorize({ enrollment: ["read.branch"] }).success ||
    roles[role].authorize({ enrollment: ["read.all"] }).success;
  const batchWhere = getCourseBatchWhere(userId, role, branchId);

  const [total, courses] = await Promise.all([
    prisma.course.count({ where }),
    prisma.course.findMany({
      where,
      orderBy: [{ status: "asc" }, { updatedAt: "desc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
      include: {
        creator: { select: { name: true } },
        batches: {
          where: batchWhere,
          orderBy: { createdAt: "asc" },
          include: {
            subjects: {
              where: role === "teacher" ? { teacherId: userId } : {},
              orderBy: { position: "asc" },
              include: {
                teacher: { select: { name: true, email: true, isMock: true } },
                classes: {
                  orderBy: { position: "asc" },
                  include: {
                    materials: roles[role].authorize({ material: ["read"] }).success
                      ? { orderBy: { position: "asc" } }
                      : { where: { id: { in: [] } } },
                  },
                },
              },
            },
            enrollments: {
              where: canReadEnrollments ? enrollmentWhere : { id: { in: [] } },
              select: {
                id: true,
                participantId: true,
                status: true,
                participant: {
                  select: {
                    name: true,
                    email: true,
                    phone: true,
                    isMock: true,
                    branch: { select: { name: true } },
                  },
                },
              },
            },
          },
        },
      },
    }),
  ]);

  const rows: CourseRow[] = courses.map((course) => {
    const batches = course.batches.map((batch) => ({
      id: batch.id,
      name: batch.name,
      subjects: batch.subjects.map((subject) => ({
        id: subject.id,
        title: subject.title,
        teacherId: subject.teacherId,
        teacherIsMock: subject.teacher.isMock,
        teacherName: subject.teacher.name,
        teacherEmail: subject.teacher.email,
        classes: subject.classes.map((classSession) => ({
          id: classSession.id,
          name: classSession.name,
          durationMinutes: classSession.durationMinutes,
          scheduledAt: classSession.scheduledAt?.toISOString() ?? null,
          venue: classSession.venue,
          deliveryMode: classSession.deliveryMode,
          materials: classSession.materials.map((material) => ({
            id: material.id,
            title: material.title,
            type: material.type,
            url: material.url,
          })),
        })),
      })),
      enrollments: batch.enrollments.map((enrollment) => ({
        id: enrollment.id,
        participantId: enrollment.participantId,
        status: enrollment.status,
        name: enrollment.participant.name,
        email: enrollment.participant.email,
        phone: role === "admin" || role === "super_admin" ? enrollment.participant.phone : null,
        branchName:
          role === "admin" || role === "super_admin" || role === "branch_manager"
            ? (enrollment.participant.branch?.name ?? null)
            : null,
        isMock: enrollment.participant.isMock,
      })),
    }));
    const primaryBatch = batches[0];
    if (!primaryBatch) throw new Error(`Course ${course.id} has no batch.`);

    return {
      id: course.id,
      draftData: course.draftData,
      title: course.title,
      description: course.description,
      category: course.category,
      prerequisites: course.prerequisites,
      learningOutcomes: course.learningOutcomes,
      durationDays: course.durationDays,
      capacity: course.capacity,
      status: course.status,
      isMock: course.isMock,
      publishedAt: course.publishedAt?.toISOString() ?? null,
      creatorName: course.creator.name,
      batchId: primaryBatch.id,
      batchName: primaryBatch.name,
      batches,
      subjects: primaryBatch.subjects,
      enrollments: primaryBatch.enrollments,
    };
  });

  return { courses: rows, total, page, pageSize };
}
