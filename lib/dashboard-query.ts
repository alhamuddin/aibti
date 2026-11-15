import "server-only";

import { getScheduledClassesWhere } from "@/lib/course-schedule-query";
import { prisma } from "@/lib/prisma";
import type { UserRole } from "@/lib/roles";
import { formatDateWithOptions } from "@/utils/date-time";

const activeEnrollmentStatuses = ["ASSIGNED", "CONFIRMED"] as const;

export type DashboardMetric = {
  label: string;
  value: number;
  detail: string;
};

export type DashboardSession = {
  id: string;
  courseId: string;
  courseTitle: string;
  batchName: string;
  className: string;
  subjectTitle: string;
  scheduledAt: Date;
  durationMinutes: number;
  venue: string | null;
};

export type DashboardData = {
  metrics: DashboardMetric[];
  progressLabel: string;
  progressValue: number;
  progressTotal: number;
  upcomingSessions: DashboardSession[];
  weekActivity: { label: string; value: number }[];
};

export async function getDashboardData(
  userId: string,
  role: UserRole,
  learningCourseCounts: { active: number; completed: number },
  now = new Date(),
): Promise<DashboardData> {
  const branch =
    role === "branch_manager"
      ? await prisma.branch.findUnique({
          where: { managerUserId: userId },
          select: { id: true },
        })
      : null;
  const upcomingWhere = getScheduledClassesWhere(userId, role, branch?.id ?? null, {
    gte: now,
  });
  const sessionsWhere = {
    ...upcomingWhere,
    scheduledAt: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
  };

  const [upcomingCount, upcomingSessions, weekSessions] = await Promise.all([
    prisma.courseClass.count({ where: upcomingWhere }),
    prisma.courseClass.findMany({
      where: upcomingWhere,
      orderBy: { scheduledAt: "asc" },
      take: 5,
      select: {
        id: true,
        name: true,
        durationMinutes: true,
        scheduledAt: true,
        venue: true,
        courseId: true,
        course: { select: { title: true } },
        batch: { select: { name: true } },
        subject: { select: { title: true } },
      },
    }),
    prisma.courseClass.findMany({
      where: sessionsWhere,
      select: { scheduledAt: true },
    }),
  ]);
  const weekActivity = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(now);
    date.setHours(0, 0, 0, 0);
    date.setDate(date.getDate() + index);
    const nextDate = new Date(date);
    nextDate.setDate(nextDate.getDate() + 1);
    return {
      label: formatDateWithOptions(date, { weekday: "short" }, "en"),
      value: weekSessions.filter(
        (session) =>
          session.scheduledAt !== null &&
          session.scheduledAt >= date &&
          session.scheduledAt < nextDate,
      ).length,
    };
  });

  const sessions = upcomingSessions.flatMap((session) =>
    session.scheduledAt
      ? [
          {
            id: session.id,
            courseId: session.courseId,
            courseTitle: session.course.title,
            batchName: session.batch.name,
            className: session.name,
            subjectTitle: session.subject.title,
            scheduledAt: session.scheduledAt,
            durationMinutes: session.durationMinutes,
            venue: session.venue,
          },
        ]
      : [],
  );

  if (role === "participant") {
    const active = learningCourseCounts.active;
    const completed = learningCourseCounts.completed;
    const total = active + completed;
    return {
      metrics: [
        { label: "My courses", value: total, detail: "Assigned and completed" },
        { label: "In progress", value: active, detail: "Ready when you are" },
        { label: "Completed", value: completed, detail: "Learning achievements" },
        { label: "Upcoming classes", value: upcomingCount, detail: "Across your active courses" },
      ],
      progressLabel: "Course completion",
      progressValue: completed,
      progressTotal: total,
      upcomingSessions: sessions,
      weekActivity,
    };
  }

  if (role === "teacher") {
    const [subjectCount, feedbackCount] = await Promise.all([
      prisma.courseSubject.count({ where: { teacherId: userId } }),
      prisma.speakerEvaluation.count({ where: { class: { subject: { teacherId: userId } } } }),
    ]);
    return {
      metrics: [
        { label: "My subjects", value: subjectCount, detail: "Assigned teaching subjects" },
        { label: "Upcoming classes", value: upcomingCount, detail: "On your teaching schedule" },
        { label: "Feedback received", value: feedbackCount, detail: "Participant evaluations" },
        {
          label: "Classes this week",
          value: weekSessions.length,
          detail: "Scheduled over the next seven days",
        },
      ],
      progressLabel: "Upcoming classes",
      progressValue: weekSessions.length,
      progressTotal: upcomingCount,
      upcomingSessions: sessions,
      weekActivity,
    };
  }

  if (role === "branch_manager") {
    const branchId = branch?.id;
    const [memberCount, activeEnrollments, completedEnrollments, pendingReports] = branchId
      ? await Promise.all([
          prisma.user.count({
            where: { branchId, role: "participant", banned: false, isMock: false },
          }),
          prisma.courseEnrollment.count({
            where: {
              status: { in: [...activeEnrollmentStatuses] },
              participant: { branchId, banned: false, isMock: false },
              course: { isMock: false },
            },
          }),
          prisma.courseEnrollment.count({
            where: {
              status: "COMPLETED",
              participant: { branchId, banned: false, isMock: false },
              course: { isMock: false },
            },
          }),
          prisma.learnInBranchReport.count({
            where: { branchId, status: "PENDING_APPROVAL" },
          }),
        ])
      : [0, 0, 0, 0];
    return {
      metrics: [
        { label: "Branch learners", value: memberCount, detail: "Active participant accounts" },
        { label: "Active assignments", value: activeEnrollments, detail: "Courses in progress" },
        { label: "Pending approvals", value: pendingReports, detail: "Branch learning reports" },
        { label: "Upcoming classes", value: upcomingCount, detail: "For branch learners" },
      ],
      progressLabel: "Course completions",
      progressValue: completedEnrollments,
      progressTotal: activeEnrollments + completedEnrollments,
      upcomingSessions: sessions,
      weekActivity,
    };
  }

  const [publishedCourses, activeLearners, activeEnrollments, completedEnrollments] =
    await Promise.all([
      prisma.course.count({ where: { status: "PUBLISHED", isMock: false } }),
      prisma.user.count({
        where: { role: "participant", banned: false, isMock: false },
      }),
      prisma.courseEnrollment.count({
        where: {
          status: { in: [...activeEnrollmentStatuses] },
          course: { isMock: false, status: "PUBLISHED" },
        },
      }),
      prisma.courseEnrollment.count({
        where: { status: "COMPLETED", course: { isMock: false } },
      }),
    ]);

  return {
    metrics: [
      { label: "Published courses", value: publishedCourses, detail: "Available in the catalog" },
      { label: "Active learners", value: activeLearners, detail: "Participant accounts" },
      { label: "Active enrollments", value: activeEnrollments, detail: "Courses in progress" },
      { label: "Upcoming classes", value: upcomingCount, detail: "Across published courses" },
    ],
    progressLabel: "Course completions",
    progressValue: completedEnrollments,
    progressTotal: activeEnrollments + completedEnrollments,
    upcomingSessions: sessions,
    weekActivity,
  };
}
