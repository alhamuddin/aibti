import { DashboardOverview } from "@/components/dashboard/dashboard-overview";
import { listMyLearningForUser } from "@/lib/course-query";
import { getDashboardData } from "@/lib/dashboard-query";
import { isUserRole } from "@/lib/roles";
import { requireAuthenticatedUser } from "@/lib/session";
import { redirect } from "next/navigation";

export const instant = false;

export default async function DashboardPage() {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";

  if (!isUserRole(role)) {
    redirect("/login");
  }

  const learningCourses =
    role === "participant" ? await listMyLearningForUser(session.user.id) : [];
  const learningCourseCounts = {
    active: learningCourses.filter((course) => course.enrollmentStatus !== "COMPLETED").length,
    completed: learningCourses.filter((course) => course.enrollmentStatus === "COMPLETED").length,
  };
  const data = await getDashboardData(session.user.id, role, learningCourseCounts);

  return (
    <DashboardOverview
      name={session.user.name}
      role={role}
      learningCourses={learningCourses}
      data={data}
    />
  );
}
