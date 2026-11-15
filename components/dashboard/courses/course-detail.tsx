"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ArrowLeft, Pencil, Send, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  completeCourseEnrollmentAction,
  deleteCourseAction,
  publishCourseAction,
} from "@/actions/course-actions";
import { CourseBatchForm } from "@/components/dashboard/courses/course-batch-form";
import { CourseEditor } from "@/components/dashboard/courses/course-editor";
import type { CourseBatchRow, CourseRow } from "@/lib/course-types";
import { formatDateTime } from "@/utils/date-time";

function BatchSubjects({ batch }: { batch: CourseBatchRow }) {
  return batch.subjects.length ? (
    <div className="mt-3 space-y-3">
      {batch.subjects.map((subject) => (
        <article key={subject.id} className="border-border rounded-lg border p-3">
          <h4 className="text-card-foreground text-sm font-semibold">{subject.title}</h4>
          <p className="text-muted-foreground mt-1 text-xs">
            Teacher:{" "}
            <Link
              href={`/dashboard/profile/${subject.teacherId}`}
              className="text-primary font-medium hover:underline"
            >
              {subject.teacherName}
            </Link>{" "}
            · {subject.teacherEmail}
          </p>
          <div className="mt-3 space-y-3">
            {subject.classes.map((classSession) => (
              <div key={classSession.id} className="border-border border-t pt-3">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h5 className="text-card-foreground text-sm font-medium">{classSession.name}</h5>
                  <span className="text-muted-foreground text-xs">
                    {classSession.durationMinutes} min · {classSession.deliveryMode.toLowerCase()}
                  </span>
                </div>
                {classSession.scheduledAt || classSession.venue ? (
                  <p className="text-muted-foreground mt-1 text-xs">
                    {classSession.scheduledAt
                      ? formatDateTime(new Date(classSession.scheduledAt))
                      : ""}
                    {classSession.venue
                      ? `${classSession.scheduledAt ? " · " : ""}${classSession.venue}`
                      : ""}
                  </p>
                ) : null}
                {classSession.materials.length ? (
                  <ul className="mt-2 space-y-1">
                    {classSession.materials.map((material) => (
                      <li key={material.id}>
                        {material.type === "FILE" && material.url ? (
                          <a
                            href={material.url}
                            className="text-primary text-xs font-medium hover:underline"
                          >
                            {material.title}{" "}
                            <span className="text-muted-foreground">(download)</span>
                          </a>
                        ) : material.type === "LINK" && material.url ? (
                          <a
                            href={material.url}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary text-xs font-medium hover:underline"
                          >
                            {material.title} <span aria-hidden="true">↗</span>
                          </a>
                        ) : (
                          <span className="text-muted-foreground text-xs">{material.title}</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-muted-foreground mt-2 text-xs">No materials attached.</p>
                )}
              </div>
            ))}
          </div>
        </article>
      ))}
    </div>
  ) : (
    <p className="text-muted-foreground mt-2 text-sm">No subjects have been added.</p>
  );
}

function CourseDetailContent({
  course,
  canManage,
  initialBatchStartAt,
}: {
  course: CourseRow;
  canManage: boolean;
  initialBatchStartAt: string;
}) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState("");

  async function runAction(action: typeof publishCourseAction): Promise<boolean> {
    const formData = new FormData();
    formData.set("courseId", course.id);
    setPending(true);
    setNotice("");
    try {
      const result = await action(formData);
      setNotice(result.message);
      if (result.success) {
        router.refresh();
        return true;
      }
      return false;
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The course action failed.");
      return false;
    } finally {
      setPending(false);
    }
  }

  async function deleteCourse() {
    if (
      !window.confirm(
        `Permanently delete "${course.title}" and its related classes, materials, and assignments?`,
      )
    ) {
      return;
    }
    if (await runAction(deleteCourseAction)) router.replace("/dashboard/courses");
  }

  async function completeEnrollment(batchId: string, enrollmentId: string) {
    const formData = new FormData();
    formData.set("courseId", course.id);
    formData.set("batchId", batchId);
    formData.set("enrollmentId", enrollmentId);
    setPending(true);
    setNotice("");
    try {
      const result = await completeCourseEnrollmentAction(formData);
      setNotice(result.message);
      if (result.success) router.refresh();
    } catch (error) {
      setNotice(
        error instanceof Error ? error.message : "Course completion could not be recorded.",
      );
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/courses"
        className="text-primary inline-flex items-center gap-2 text-sm font-semibold hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Course catalogue
      </Link>
      <header className="border-border bg-card rounded-xl border p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="bg-secondary text-secondary-foreground rounded-full px-2.5 py-1 text-[11px] font-semibold">
                {course.status.toLowerCase()}
              </span>
              {course.category ? (
                <span className="text-muted-foreground text-xs">{course.category}</span>
              ) : null}
              {course.isMock ? (
                <span className="text-muted-foreground text-xs">Mock course</span>
              ) : null}
            </div>
            <h1 className="text-foreground mt-3 text-2xl font-bold tracking-tight sm:text-3xl">
              {course.title}
            </h1>
            <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
              {course.description}
            </p>
            <p className="text-muted-foreground mt-3 text-xs">
              {course.durationDays ? `${course.durationDays} days` : "Duration not set"}
              {course.capacity ? ` · Capacity ${course.capacity}` : ""}
              {` · ${course.batches.reduce((total, batch) => total + batch.enrollments.length, 0)} participant(s)`}
              {` · ${course.batches.length} batch(es)`}
              {` · Created by ${course.creatorName}`}
            </p>
          </div>
          {canManage && !course.isMock ? (
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setEditing((current) => !current)}
                className="border-border text-foreground inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold"
              >
                <Pencil aria-hidden="true" className="size-3.5" />{" "}
                {editing ? "Close editor" : "Edit"}
              </button>
              {course.status === "DRAFT" ? (
                <button
                  type="button"
                  disabled={pending}
                  onClick={() => void runAction(publishCourseAction)}
                  className="bg-primary text-primary-foreground inline-flex min-h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-semibold disabled:opacity-60"
                >
                  <Send aria-hidden="true" className="size-3.5" /> Publish
                </button>
              ) : null}
              <button
                type="button"
                disabled={pending}
                onClick={() => void deleteCourse()}
                className="text-destructive border-destructive/30 inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-3 text-xs font-semibold disabled:opacity-60"
              >
                <Trash2 aria-hidden="true" className="size-3.5" /> Delete
              </button>
            </div>
          ) : null}
        </div>
      </header>

      {notice ? (
        <p role="status" className="border-border bg-muted rounded-lg border px-3 py-2 text-sm">
          {notice}
        </p>
      ) : null}
      {editing && canManage ? (
        <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
          <h2 className="text-card-foreground mb-3 text-sm font-semibold">Edit course</h2>
          <CourseEditor
            initialCourse={{
              ...course,
              batchId: course.batchId,
              batchName: course.batchName,
              subjects: course.batches[0]?.subjects ?? [],
              enrollments: course.batches[0]?.enrollments ?? [],
            }}
            onCancel={() => setEditing(false)}
          />
        </section>
      ) : null}
      {canManage && !course.isMock && course.status === "PUBLISHED" && initialBatchStartAt ? (
        <CourseBatchForm
          courseId={course.id}
          sourceBatchId={course.batchId}
          sourceBatchName={course.batchName}
          initialStartAt={initialBatchStartAt}
          initialParticipants={course.enrollments.map((participant) => ({
            id: participant.participantId,
            name: participant.name,
            email: participant.email,
            phone: participant.phone,
            branchName: participant.branchName,
            isMock: participant.isMock,
          }))}
        />
      ) : null}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
          <h2 className="text-card-foreground text-base font-semibold">Course batches</h2>
          <div className="mt-4 space-y-4">
            {course.batches.map((batch) => (
              <article key={batch.id} className="border-border rounded-lg border p-3">
                <h3 className="text-card-foreground text-sm font-semibold">{batch.name}</h3>
                <BatchSubjects batch={batch} />
              </article>
            ))}
          </div>
        </section>
        <div className="space-y-5">
          <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
            <h2 className="text-card-foreground text-base font-semibold">Learning outcomes</h2>
            <p className="text-muted-foreground mt-2 text-sm leading-6 whitespace-pre-wrap">
              {course.learningOutcomes || "Not specified."}
            </p>
            <h3 className="text-card-foreground mt-4 text-sm font-semibold">Prerequisites</h3>
            <p className="text-muted-foreground mt-1 text-sm leading-6 whitespace-pre-wrap">
              {course.prerequisites || "None specified."}
            </p>
          </section>
          {course.batches.map((batch) => (
            <section
              key={batch.id}
              className="border-border bg-card rounded-xl border p-4 shadow-sm"
            >
              <h2 className="text-card-foreground text-base font-semibold">
                Participants · {batch.name} ({batch.enrollments.length})
              </h2>
              {batch.enrollments.length ? (
                <ul className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                  {batch.enrollments.map((participant) => (
                    <li
                      key={participant.id}
                      className="border-border rounded-md border px-2.5 py-2"
                    >
                      <Link
                        href={`/dashboard/profile/${participant.participantId}`}
                        className="text-card-foreground text-xs font-medium hover:underline"
                      >
                        {participant.name}
                      </Link>
                      <p className="text-muted-foreground text-[11px]">{participant.email}</p>
                      {canManage && (participant.phone || participant.branchName) ? (
                        <p className="text-muted-foreground mt-0.5 text-[10px]">
                          {[participant.phone, participant.branchName].filter(Boolean).join(" · ")}
                        </p>
                      ) : null}
                      <div className="mt-2 flex flex-wrap items-center gap-3">
                        <span className="text-muted-foreground text-[11px]">
                          {participant.status.toLowerCase()}
                        </span>
                        {canManage && participant.status !== "COMPLETED" ? (
                          <button
                            type="button"
                            disabled={pending}
                            onClick={() => void completeEnrollment(batch.id, participant.id)}
                            className="text-primary text-[11px] font-semibold hover:underline disabled:opacity-50"
                          >
                            Mark completed
                          </button>
                        ) : null}
                        {canManage && participant.status === "COMPLETED" ? (
                          <Link
                            href={`/dashboard/learning/certificates/${participant.id}`}
                            className="text-primary text-[11px] font-semibold hover:underline"
                          >
                            View certificate
                          </Link>
                        ) : null}
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-muted-foreground mt-2 text-sm">No participants are assigned.</p>
              )}
            </section>
          ))}
        </div>
      </div>
    </main>
  );
}

export function CourseDetail({
  course,
  canManage,
  initialBatchStartAt,
}: {
  course: CourseRow;
  canManage: boolean;
  initialBatchStartAt: string;
}) {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { refetchOnWindowFocus: false } } }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <CourseDetailContent
        course={course}
        canManage={canManage}
        initialBatchStartAt={initialBatchStartAt}
      />
    </QueryClientProvider>
  );
}
