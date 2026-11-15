import { ArrowLeft, BookOpenCheck } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { LearnInBranchReportForm } from "@/components/dashboard/learn-in-branch/learn-in-branch-forms";
import { getLearnInBranchEnrollment } from "@/lib/learn-in-branch-query";
import { getCourseTimeZone, getDateTimeLocalValue } from "@/lib/attendance";
import { isLearnInBranchSubmissionOpen } from "@/lib/learn-in-branch";
import { isUserRole } from "@/lib/roles";
import { roles } from "@/lib/permissions";
import { requireAuthenticatedUser } from "@/lib/session";
import { formatDateTime } from "@/utils/date-time";

export const instant = false;

export default async function LearnInBranchEnrollmentPage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!isUserRole(role) || !roles[role].authorize({ learnInBranch: ["submit.own"] }).success) {
    redirect("/dashboard");
  }

  const { enrollmentId } = await params;
  const enrollment = await getLearnInBranchEnrollment(enrollmentId, session.user.id);
  if (!enrollment) notFound();

  const timeZone = getCourseTimeZone(enrollment.draftData);
  const submissionOpen = isLearnInBranchSubmissionOpen(enrollment.completedAt, enrollment.deadline);

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/learning/learn-in-branch"
        className="text-primary inline-flex items-center gap-2 text-sm font-semibold hover:underline"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Learn in the Branch
      </Link>
      <header className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-7">
        <p className="text-primary flex items-center gap-2 text-sm font-semibold">
          <BookOpenCheck aria-hidden="true" className="size-4" />
          {enrollment.batchName}
        </p>
        <h1 className="text-foreground mt-2 text-2xl font-bold tracking-tight">
          {enrollment.courseTitle}
        </h1>
        <p className="text-muted-foreground mt-2 text-sm">
          Completed {formatDateTime(enrollment.completedAt, timeZone)} · Submit by{" "}
          {formatDateTime(enrollment.deadline, timeZone)}
        </p>
      </header>

      {enrollment.report ? (
        <div className="border-border bg-card rounded-xl border p-5">
          <h2 className="text-card-foreground font-semibold">
            {enrollment.report.status === "APPROVED"
              ? "Your branch report has been approved"
              : "Your report is waiting for branch manager approval"}
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Submitted {formatDateTime(enrollment.report.submittedAt, timeZone)}
          </p>
        </div>
      ) : !submissionOpen ? (
        <div className="border-border bg-card rounded-xl border p-5">
          <h2 className="text-card-foreground font-semibold">The submission window is closed</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Contact an administrator if you need an extension.
          </p>
        </div>
      ) : !enrollment.branch.managerUserId ? (
        <div className="border-border bg-card rounded-xl border p-5">
          <h2 className="text-card-foreground font-semibold">
            Branch manager approval is unavailable
          </h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Ask your administrator to assign a branch manager before submitting your report.
          </p>
        </div>
      ) : enrollment.classes.length === 0 ? (
        <div className="border-border bg-card rounded-xl border p-5">
          <h2 className="text-card-foreground font-semibold">No completed classes are available</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            This course does not have a scheduled class that can be selected for branch training.
          </p>
        </div>
      ) : enrollment.branch.members.length === 0 ? (
        <div className="border-border bg-card rounded-xl border p-5">
          <h2 className="text-card-foreground font-semibold">No branch colleagues are available</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Your branch needs another active participant before a session report can be submitted.
          </p>
        </div>
      ) : (
        <section className="border-border bg-card space-y-5 rounded-2xl border p-5 shadow-sm sm:p-7">
          <div>
            <h2 className="text-card-foreground text-lg font-semibold">Training sessions</h2>
            <p className="text-muted-foreground mt-1 text-sm leading-6">
              Add one row for each class you shared. Sessions may be held on the same day or on
              different days. Select only colleagues from {enrollment.branch.name}.
            </p>
          </div>
          <LearnInBranchReportForm
            enrollmentId={enrollment.id}
            branchName={enrollment.branch.name}
            classes={enrollment.classes}
            members={enrollment.branch.members}
            completedAtLocal={getDateTimeLocalValue(enrollment.completedAt, timeZone)}
            nowLocal={getDateTimeLocalValue(new Date(), timeZone)}
          />
        </section>
      )}
    </main>
  );
}
