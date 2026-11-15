import { notFound } from "next/navigation";
import { CourseDetail } from "@/components/dashboard/courses/course-detail";
import { listCoursesForUser } from "@/lib/course-query";
import { getCourseTimeZone, getDateTimeLocalValue } from "@/lib/attendance";
import { canManageUsers, isUserRole } from "@/lib/roles";
import { requireCoursePermission } from "@/lib/session";

export const instant = false;

export default async function CourseDetailPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const session = await requireCoursePermission("read");
  const role = session.user.role ?? "";
  if (!isUserRole(role)) notFound();

  const { courseId } = await params;
  const result = await listCoursesForUser(session.user.id, role, 1, 1, "", courseId);
  const course = result.courses[0];
  if (!course) notFound();

  const firstScheduledAt = course.batches[0]?.subjects
    .flatMap((subject) => subject.classes)
    .flatMap((classSession) => (classSession.scheduledAt ? [classSession.scheduledAt] : []))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
  const initialBatchStartAt = firstScheduledAt
    ? getDateTimeLocalValue(new Date(firstScheduledAt), getCourseTimeZone(course.draftData))
    : "";

  return (
    <CourseDetail
      course={course}
      canManage={canManageUsers(role)}
      initialBatchStartAt={initialBatchStartAt}
    />
  );
}
