import { redirect } from "next/navigation";
import { EvaluationResultsRefresh } from "@/components/dashboard/evaluations/evaluation-results-refresh";
import { SpeakerEvaluationForm } from "@/components/dashboard/evaluations/speaker-evaluation-form";
import {
  listSpeakerEvaluationAssignments,
  listSpeakerEvaluationResults,
} from "@/lib/speaker-evaluation-query";
import { getSpeakerEvaluationMaximum, speakerEvaluationCriteria } from "@/lib/speaker-evaluation";
import { roles } from "@/lib/permissions";
import { isUserRole } from "@/lib/roles";
import { requireAuthenticatedUser } from "@/lib/session";
import { formatDateTime } from "@/utils/date-time";

export const instant = false;

function ParticipantEvaluationPage({
  assignments,
}: {
  assignments: Awaited<ReturnType<typeof listSpeakerEvaluationAssignments>>;
}) {
  return (
    <main className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-primary text-sm font-semibold">Learning feedback</p>
        <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
          Speaker evaluations
        </h1>
        <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
          After each class, rate your speaker on the five points from the institute evaluation form.
          You can edit your response for one week after the class ends.
        </p>
      </header>

      {assignments.length ? (
        <div className="space-y-4">
          {assignments.map((assignment) => (
            <article
              key={assignment.classId}
              className="border-border bg-card rounded-xl border p-5 shadow-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-muted-foreground text-xs">
                    {assignment.courseTitle} · {assignment.subjectTitle}
                  </p>
                  <h2 className="text-card-foreground mt-1 text-lg font-semibold">
                    {assignment.className}
                  </h2>
                  <p className="text-muted-foreground mt-1 text-sm">
                    Speaker: {assignment.teacherName}
                  </p>
                </div>
                <span className="bg-secondary text-secondary-foreground rounded-full px-3 py-1 text-xs font-semibold">
                  {assignment.scores ? "Submitted · editable" : "Evaluation open"}
                </span>
              </div>
              <p className="text-muted-foreground mt-3 text-xs">
                Class ended {formatDateTime(assignment.classEndsAt)} · Closes{" "}
                {formatDateTime(assignment.expiresAt)}
              </p>
              <SpeakerEvaluationForm
                key={
                  assignment.scores ? Object.values(assignment.scores).join("-") : "not-submitted"
                }
                classId={assignment.classId}
                scores={assignment.scores}
              />
            </article>
          ))}
        </div>
      ) : (
        <div className="border-border bg-card rounded-xl border border-dashed px-5 py-12 text-center">
          <h2 className="text-card-foreground font-semibold">No evaluations are open</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Evaluations appear here after an assigned class ends and remain open for one week.
          </p>
        </div>
      )}
    </main>
  );
}

function EvaluationResultCard({
  result,
}: {
  result: Awaited<ReturnType<typeof listSpeakerEvaluationResults>>[number];
}) {
  return (
    <article className="border-border bg-card rounded-xl border p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-muted-foreground text-xs">
            {result.courseTitle} · {result.subjectTitle}
          </p>
          <h2 className="text-card-foreground mt-1 text-lg font-semibold">{result.className}</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Speaker: {result.teacherName} · {formatDateTime(result.scheduledAt)}
          </p>
        </div>
      </div>

      {result.averages ? (
        <dl className="mt-5 grid gap-3 sm:grid-cols-2">
          {speakerEvaluationCriteria.map((criterion) => {
            const score = result.averages?.[criterion.key];
            return (
              <div key={criterion.key} className="bg-muted/50 rounded-lg px-3 py-3">
                <dt className="text-muted-foreground text-xs">{criterion.label}</dt>
                <dd className="text-card-foreground mt-1 text-lg font-semibold tabular-nums">
                  {score?.toFixed(2) ?? "—"}
                  <span className="text-muted-foreground text-xs font-normal">
                    {" "}
                    / {getSpeakerEvaluationMaximum(criterion.key)}
                  </span>
                </dd>
              </div>
            );
          })}
        </dl>
      ) : result.resultsWithheld ? (
        <p className="text-muted-foreground bg-muted/50 mt-4 rounded-lg px-3 py-4 text-sm">
          Aggregate scores appear after at least five participants have submitted an evaluation.
        </p>
      ) : (
        <p className="text-muted-foreground bg-muted/50 mt-4 rounded-lg px-3 py-4 text-sm">
          Results will appear here after the first evaluation is submitted.
        </p>
      )}
    </article>
  );
}

async function ResultsPage({
  userId,
  role,
}: {
  userId: string;
  role: "teacher" | "admin" | "super_admin";
}) {
  const results = await listSpeakerEvaluationResults(role, userId);

  return (
    <main className="mx-auto max-w-5xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-semibold">Class feedback</p>
          <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
            Speaker evaluation results
          </h1>
          <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
            Live average scores for each evaluation point. Individual responses and identities are
            never shown.
          </p>
        </div>
        <EvaluationResultsRefresh />
      </header>
      {results.length ? (
        <div className="space-y-4">
          {results.map((result) => (
            <EvaluationResultCard key={result.classId} result={result} />
          ))}
        </div>
      ) : (
        <div className="border-border bg-card rounded-xl border border-dashed px-5 py-12 text-center">
          <h2 className="text-card-foreground font-semibold">No conducted classes yet</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Evaluation results will appear here after your classes have ended.
          </p>
        </div>
      )}
    </main>
  );
}

export default async function SpeakerEvaluationsPage() {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!isUserRole(role)) redirect("/dashboard");

  if (roles[role].authorize({ evaluation: ["submit"] }).success) {
    const assignments = await listSpeakerEvaluationAssignments(session.user.id);
    return <ParticipantEvaluationPage assignments={assignments} />;
  }
  if (
    roles[role].authorize({ evaluation: ["read.own"] }).success ||
    roles[role].authorize({ evaluation: ["read.all"] }).success
  ) {
    if (role !== "teacher" && role !== "admin" && role !== "super_admin") redirect("/dashboard");
    return <ResultsPage userId={session.user.id} role={role} />;
  }

  redirect("/dashboard");
}
