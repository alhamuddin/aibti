import { Award, BookOpenCheck, ChevronRight } from "lucide-react";
import Link from "next/link";
import { listMyLearningForUser } from "@/lib/course-query";
import type { MyLearningCourse } from "@/lib/course-types";
import { requireAuthenticatedUser } from "@/lib/session";

export const instant = false;

function LearningCourseCard({ course }: { course: MyLearningCourse }) {
  const isCompleted = course.enrollmentStatus === "COMPLETED";
  const statusLabel =
    course.enrollmentStatus === "COMPLETED"
      ? "Completed"
      : course.enrollmentStatus === "CONFIRMED"
        ? "Confirmed"
        : "Assigned";

  return (
    <article className="border-border bg-card flex flex-col justify-between gap-5 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center">
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-card-foreground font-semibold">{course.title}</h3>
          <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
              isCompleted
                ? "bg-secondary text-secondary-foreground"
                : "bg-accent text-accent-foreground"
            }`}
          >
            {statusLabel}
          </span>
        </div>
        <p className="text-muted-foreground mt-2 text-xs font-medium">Batch: {course.batchName}</p>
        <p className="text-muted-foreground mt-2 text-sm leading-6">{course.description}</p>
        {course.category ? (
          <p className="text-muted-foreground mt-3 text-xs font-medium">{course.category}</p>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap items-center gap-4">
        <Link
          href={`/dashboard/courses/${course.id}`}
          className="text-primary inline-flex min-h-10 items-center gap-1 text-sm font-semibold hover:underline"
        >
          View course
          <ChevronRight aria-hidden="true" className="size-4" />
        </Link>
        {isCompleted && course.certificateNumber ? (
          <Link
            href={`/dashboard/learning/certificates/${course.enrollmentId}`}
            className="text-primary inline-flex min-h-10 items-center gap-1 text-sm font-semibold hover:underline"
          >
            View certificate
            <Award aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
        {isCompleted ? (
          <Link
            href={`/dashboard/learning/learn-in-branch/${course.enrollmentId}`}
            className="text-primary inline-flex min-h-10 items-center gap-1 text-sm font-semibold hover:underline"
          >
            Share learning in your branch
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        ) : null}
      </div>
    </article>
  );
}

function CourseSection({
  title,
  description,
  courses,
}: {
  title: string;
  description: string;
  courses: MyLearningCourse[];
}) {
  return (
    <section aria-labelledby={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}>
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <h2
            id={`${title.toLowerCase().replaceAll(" ", "-")}-heading`}
            className="text-foreground text-xl font-semibold"
          >
            {title}
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">{description}</p>
        </div>
        <span className="text-muted-foreground text-sm">
          {courses.length} {courses.length === 1 ? "course" : "courses"}
        </span>
      </div>
      {courses.length ? (
        <div className="space-y-3">
          {courses.map((course) => (
            <LearningCourseCard key={course.enrollmentId} course={course} />
          ))}
        </div>
      ) : (
        <div className="border-border bg-card rounded-xl border border-dashed px-5 py-8 text-center">
          <p className="text-card-foreground font-medium">No courses here yet</p>
          <p className="text-muted-foreground mt-1 text-sm">
            {title === "Completed courses"
              ? "Courses you complete will appear here."
              : "Courses assigned to you will appear here."}
          </p>
        </div>
      )}
    </section>
  );
}

export default async function LearningPage() {
  const session = await requireAuthenticatedUser();
  const courses = await listMyLearningForUser(session.user.id);
  const assignedCourses = courses.filter((course) => course.enrollmentStatus !== "COMPLETED");
  const completedCourses = courses.filter((course) => course.enrollmentStatus === "COMPLETED");

  return (
    <main className="mx-auto max-w-5xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <Link href="/dashboard" className="text-primary text-sm font-semibold hover:underline">
          Back to dashboard
        </Link>
        <p className="text-primary mt-5 flex items-center gap-2 text-sm font-semibold">
          <BookOpenCheck aria-hidden="true" className="size-4" />
          Learning workspace
        </p>
        <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">My learning</h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Review courses you are assigned to attend and your completed learning.
        </p>
      </header>

      <div className="bg-accent text-accent-foreground flex items-center gap-4 rounded-xl p-5">
        <span className="bg-background/70 flex size-11 shrink-0 items-center justify-center rounded-xl">
          <Award aria-hidden="true" className="size-5" />
        </span>
        <div>
          <p className="font-semibold">
            {assignedCourses.length} assigned · {completedCourses.length} completed
          </p>
          <p className="mt-1 text-sm opacity-80">Your learning record, all in one place.</p>
        </div>
      </div>

      <CourseSection
        title="Assigned courses"
        description="Courses you have been assigned or confirmed to attend."
        courses={assignedCourses}
      />
      <CourseSection
        title="Completed courses"
        description="Courses marked as completed in your learning record."
        courses={completedCourses}
      />
    </main>
  );
}
