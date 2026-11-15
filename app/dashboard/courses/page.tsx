import { BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { CourseManager } from "@/components/dashboard/courses/course-manager";
import { canManageUsers, getRoleLabel } from "@/lib/roles";
import { requireCoursePermission } from "@/lib/session";

export const instant = false;

export default async function CoursesPage() {
  const session = await requireCoursePermission("read");
  const role = session.user.role ?? "participant";
  const canWrite = canManageUsers(role);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link href="/dashboard" className="text-primary text-sm font-semibold hover:underline">
            Back to dashboard
          </Link>
          <p className="text-primary mt-5 flex items-center gap-2 text-sm font-semibold">
            <BookOpenCheck aria-hidden="true" className="size-4" />
            Training catalogue
          </p>
          <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
            Courses and classes
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Manage course drafts and publication, or view the learning assigned to your role.
          </p>
        </div>
        <span className="text-muted-foreground text-sm">{getRoleLabel(role)}</span>
      </header>
      <CourseManager canManage={canWrite} />
    </main>
  );
}
