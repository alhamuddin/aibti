import { BookOpenCheck, ClipboardCheck, ShieldCheck } from "lucide-react";
import Link from "next/link";
import {
  LearnInBranchDeadlineForm,
  LearnInBranchQuestionForm,
  LearnInBranchReviewForm,
} from "@/components/dashboard/learn-in-branch/learn-in-branch-forms";
import { LearnInBranchApprovalRefresh } from "@/components/dashboard/learn-in-branch/approval-refresh";
import {
  listLearnInBranchDeadlineEnrollments,
  listLearnInBranchEnrollments,
  listLearnInBranchQuestions,
  listLearnInBranchReviews,
} from "@/lib/learn-in-branch-query";
import { getCourseTimeZone, getDateTimeLocalValue } from "@/lib/attendance";
import { getLearnInBranchDeadline } from "@/lib/learn-in-branch";
import { isUserRole } from "@/lib/roles";
import { roles } from "@/lib/permissions";
import { requireAuthenticatedUser } from "@/lib/session";
import { redirect } from "next/navigation";
import { formatDateTime } from "@/utils/date-time";

export const instant = false;

function BackLink() {
  return (
    <Link href="/dashboard" className="text-primary text-sm font-semibold hover:underline">
      Back to dashboard
    </Link>
  );
}

async function ParticipantPage({ participantId }: { participantId: string }) {
  const enrollments = await listLearnInBranchEnrollments(participantId);

  return (
    <main className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <BackLink />
        <p className="text-primary mt-5 flex items-center gap-2 text-sm font-semibold">
          <BookOpenCheck aria-hidden="true" className="size-4" />
          Branch knowledge sharing
        </p>
        <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
          Learn in the Branch
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Share what you learned with colleagues in your branch. Submit one report for each
          completed course within seven days, unless an administrator extends the deadline.
        </p>
      </header>

      {enrollments.length ? (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            return (
              <article
                key={enrollment.id}
                className="border-border bg-card flex flex-col justify-between gap-4 rounded-xl border p-5 shadow-sm sm:flex-row sm:items-center"
              >
                <div>
                  <h2 className="text-card-foreground font-semibold">{enrollment.courseTitle}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">{enrollment.batchName}</p>
                  <p className="text-muted-foreground mt-2 text-xs">
                    Completed {formatDateTime(enrollment.completedAt, enrollment.timeZone)} · Submit
                    by {formatDateTime(enrollment.deadline, enrollment.timeZone)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {enrollment.report ? (
                    <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-semibold">
                      {enrollment.report.status === "APPROVED" ? "Approved" : "Waiting for manager"}
                    </span>
                  ) : enrollment.submissionClosed ? (
                    <span className="text-muted-foreground text-sm font-medium">
                      Submission closed
                    </span>
                  ) : (
                    <Link
                      href={`/dashboard/learning/learn-in-branch/${enrollment.id}`}
                      className="bg-primary text-primary-foreground inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold"
                    >
                      Submit branch report
                    </Link>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="border-border bg-card rounded-xl border border-dashed px-5 py-12 text-center">
          <h2 className="text-card-foreground font-semibold">No completed courses yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            A report form will appear here after you complete a course.
          </p>
        </div>
      )}
    </main>
  );
}

async function ManagerPage({ managerId }: { managerId: string }) {
  const { branchName, reports } = await listLearnInBranchReviews(managerId);
  const pendingReports = reports.filter((report) => report.status === "PENDING_APPROVAL");

  return (
    <main className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <BackLink />
        <p className="text-primary mt-5 flex items-center gap-2 text-sm font-semibold">
          <ClipboardCheck aria-hidden="true" className="size-4" />
          Branch manager review · {branchName ?? "No branch assigned"}
        </p>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
              Learn in the Branch approvals
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Review each training session and attendee list, answer all required questions, then
              approve the report.
            </p>
          </div>
          <LearnInBranchApprovalRefresh />
        </div>
      </header>

      {pendingReports.length ? (
        <section className="space-y-4" aria-label="Reports awaiting approval">
          <h2 className="text-card-foreground text-lg font-semibold">
            Waiting for your approval · {pendingReports.length}
          </h2>
          {pendingReports.map((report) => (
            <article
              key={report.id}
              className="border-border bg-card rounded-xl border p-5 shadow-sm"
            >
              <p className="text-muted-foreground text-xs">
                {report.enrollment.course.title} · {report.enrollment.batch.name}
              </p>
              <h3 className="text-card-foreground mt-1 text-lg font-semibold">
                {report.facilitator.name}
                {report.facilitator.employeeId ? ` · ${report.facilitator.employeeId}` : ""}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Submitted{" "}
                {formatDateTime(
                  report.submittedAt,
                  getCourseTimeZone(report.enrollment.course.draftData),
                )}
              </p>
              <div className="mt-4 space-y-3">
                {report.sessions.map((session) => (
                  <section key={session.id} className="border-border rounded-lg border p-3">
                    <h4 className="text-card-foreground text-sm font-semibold">
                      {session.class.subject.title} · {session.class.name}
                    </h4>
                    <p className="text-muted-foreground mt-1 text-xs">
                      {formatDateTime(
                        session.sessionAt,
                        getCourseTimeZone(report.enrollment.course.draftData),
                      )}{" "}
                      · {session.location}
                    </p>
                    <p className="text-muted-foreground mt-2 text-xs">
                      Participants ({session.attendees.length}):{" "}
                      {session.attendees
                        .map(({ participant }) =>
                          participant.employeeId
                            ? `${participant.name} (${participant.employeeId})`
                            : participant.name,
                        )
                        .join(", ")}
                    </p>
                  </section>
                ))}
              </div>
              <LearnInBranchReviewForm reportId={report.id} questions={report.answers} />
            </article>
          ))}
        </section>
      ) : (
        <div className="border-border bg-card rounded-xl border border-dashed px-5 py-10 text-center">
          <h2 className="text-card-foreground font-semibold">No reports need your approval</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            New branch learning reports will appear here.
          </p>
        </div>
      )}

      {reports.some((report) => report.status === "APPROVED") ? (
        <section className="space-y-3">
          <h2 className="text-card-foreground text-lg font-semibold">Recently approved</h2>
          {reports
            .filter((report) => report.status === "APPROVED")
            .map((report) => (
              <article key={report.id} className="border-border bg-card rounded-xl border p-4">
                <p className="text-card-foreground font-semibold">
                  {report.enrollment.course.title} · {report.facilitator.name}
                </p>
                <p className="text-muted-foreground mt-1 text-xs">
                  Approved{" "}
                  {report.approvedAt
                    ? formatDateTime(
                        report.approvedAt,
                        getCourseTimeZone(report.enrollment.course.draftData),
                      )
                    : "—"}{" "}
                  · {report.sessions.length} session{report.sessions.length === 1 ? "" : "s"}
                </p>
                <dl className="text-muted-foreground mt-3 space-y-2 text-xs">
                  {report.answers.map((answer) => (
                    <div key={answer.questionId}>
                      <dt className="font-medium">{answer.prompt}</dt>
                      <dd className="mt-0.5">{answer.answer ?? "No answer recorded"}</dd>
                    </div>
                  ))}
                </dl>
                {report.managerComment ? (
                  <p className="text-muted-foreground mt-2 text-sm">{report.managerComment}</p>
                ) : null}
              </article>
            ))}
        </section>
      ) : null}
    </main>
  );
}

async function AdminPage() {
  const [enrollments, questions] = await Promise.all([
    listLearnInBranchDeadlineEnrollments(),
    listLearnInBranchQuestions(),
  ]);

  return (
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <BackLink />
        <p className="text-primary mt-5 flex items-center gap-2 text-sm font-semibold">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Training administration
        </p>
        <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
          Learn in the Branch deadlines
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          Each completed course has a seven-day submission window. Extend a deadline here; the
          participant can submit until the end of the selected date.
        </p>
      </header>
      {enrollments.length ? (
        <div className="space-y-3">
          {enrollments.map((enrollment) => {
            const timeZone = getCourseTimeZone(enrollment.draftData);
            const defaultDeadline = getLearnInBranchDeadline(enrollment.completedAt);
            return (
              <article
                key={enrollment.id}
                className="border-border bg-card grid gap-4 rounded-xl border p-4 shadow-sm md:grid-cols-[1fr_auto]"
              >
                <div>
                  <h2 className="text-card-foreground font-semibold">{enrollment.courseTitle}</h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    {enrollment.participantName}
                    {enrollment.employeeId ? ` · ${enrollment.employeeId}` : ""}
                    {enrollment.branchName ? ` · ${enrollment.branchName}` : ""}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    Completed {formatDateTime(enrollment.completedAt, timeZone)} · Current deadline{" "}
                    {formatDateTime(enrollment.deadline, timeZone)}
                    {enrollment.deadline > defaultDeadline ? " · Extended" : ""}
                  </p>
                </div>
                <LearnInBranchDeadlineForm
                  enrollmentId={enrollment.id}
                  minDate={getDateTimeLocalValue(defaultDeadline, timeZone).slice(0, 10)}
                  currentDate={getDateTimeLocalValue(enrollment.deadline, timeZone).slice(0, 10)}
                />
              </article>
            );
          })}
        </div>
      ) : (
        <div className="border-border bg-card rounded-xl border border-dashed px-5 py-10 text-center">
          <h2 className="text-card-foreground font-semibold">No deadlines can be extended</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Only completed courses without a submitted report are listed.
          </p>
        </div>
      )}
      {enrollments.length === 200 ? (
        <p className="text-muted-foreground text-xs">
          Showing the 200 most recently completed courses that can be extended.
        </p>
      ) : null}
      <section className="border-border bg-card space-y-5 rounded-2xl border p-5 shadow-sm sm:p-6">
        <div>
          <h2 className="text-card-foreground text-lg font-semibold">Manager review questions</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            These questions are copied into reports when participants submit them. New questions
            apply to reports submitted after they are added.
          </p>
        </div>
        <div className="space-y-3">
          {questions.map((question, index) => (
            <article key={question.id} className="border-border rounded-xl border p-4">
              <h3 className="text-card-foreground text-sm font-medium">
                {index + 1}. {question.prompt}
              </h3>
              <p className="text-muted-foreground mt-1 text-xs">
                Choices: {question.options.join(" · ")}
              </p>
            </article>
          ))}
        </div>
        <LearnInBranchQuestionForm />
      </section>
    </main>
  );
}

export default async function LearnInBranchPage() {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!isUserRole(role)) redirect("/dashboard");

  if (roles[role].authorize({ learnInBranch: ["submit.own"] }).success) {
    return <ParticipantPage participantId={session.user.id} />;
  }
  if (roles[role].authorize({ learnInBranch: ["review.branch"] }).success) {
    return <ManagerPage managerId={session.user.id} />;
  }
  if (roles[role].authorize({ learnInBranch: ["manage.deadlines"] }).success) {
    return <AdminPage />;
  }
  redirect("/dashboard");
}
