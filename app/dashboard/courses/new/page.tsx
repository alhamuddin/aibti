import { CourseCreation } from "@/components/dashboard/courses/course-creation";
import { requireCoursePermission } from "@/lib/session";

export const instant = false;

export default async function NewCoursePage() {
  await requireCoursePermission("write");

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <CourseCreation />
    </main>
  );
}
