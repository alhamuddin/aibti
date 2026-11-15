import type { CourseRow } from "@/lib/course-types";

type CourseSchedule = Pick<CourseRow, "status"> & {
  subjects: { classes: { scheduledAt: string | null }[] }[];
};

export function isCourseOngoing(
  course: CourseSchedule,
  today = new Date().toISOString().slice(0, 10),
): boolean {
  if (course.status !== "PUBLISHED") return false;

  const classDates = course.subjects
    .flatMap((subject) => subject.classes.map((classSession) => classSession.scheduledAt))
    .filter((scheduledAt): scheduledAt is string => scheduledAt !== null)
    .map((scheduledAt) => scheduledAt.slice(0, 10))
    .filter((date) => /^\d{4}-\d{2}-\d{2}$/.test(date))
    .sort();

  return classDates.length > 0 && classDates[0] <= today && today <= classDates.at(-1)!;
}
