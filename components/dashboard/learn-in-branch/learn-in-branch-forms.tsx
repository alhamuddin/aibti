"use client";

import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  addLearnInBranchQuestionAction,
  approveLearnInBranchReportAction,
  extendLearnInBranchDeadlineAction,
  submitLearnInBranchReportAction,
} from "@/actions/learn-in-branch-actions";

type ClassOption = {
  id: string;
  name: string;
  subjectTitle: string;
};

type BranchMember = {
  id: string;
  name: string;
  employeeId: string | null;
};

type TrainingSession = {
  key: string;
  classId: string;
  sessionAt: string;
  location: string;
  participantIds: string[];
};

function useActionNotice() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  const [isError, setIsError] = useState(false);

  function run(action: (formData: FormData) => Promise<{ success: boolean; message: string }>) {
    return (formData: FormData) => {
      setNotice("");
      startTransition(async () => {
        try {
          const result = await action(formData);
          setNotice(result.message);
          setIsError(!result.success);
          if (result.success) router.refresh();
        } catch {
          setNotice("We could not save this information. Please try again.");
          setIsError(true);
        }
      });
    };
  }

  return { pending, notice, isError, run };
}

function ActionNotice({ notice, isError }: { notice: string; isError: boolean }) {
  if (!notice) return null;
  return (
    <p
      role={isError ? "alert" : "status"}
      className={`text-sm ${isError ? "text-destructive" : "text-primary"}`}
    >
      {notice}
    </p>
  );
}

function inputClassName() {
  return "border-input bg-background text-foreground mt-2 min-h-10 w-full rounded-lg border px-3 text-sm";
}

export function LearnInBranchReportForm({
  enrollmentId,
  branchName,
  classes,
  members,
  completedAtLocal,
  nowLocal,
}: {
  enrollmentId: string;
  branchName: string;
  classes: ClassOption[];
  members: BranchMember[];
  completedAtLocal: string;
  nowLocal: string;
}) {
  const { pending, notice, isError, run } = useActionNotice();
  const [sessions, setSessions] = useState<TrainingSession[]>([
    {
      key: crypto.randomUUID(),
      classId: classes[0]?.id ?? "",
      sessionAt: "",
      location: branchName,
      participantIds: [],
    },
  ]);
  const submit = run(submitLearnInBranchReportAction);

  function updateSession(key: string, updates: Partial<TrainingSession>) {
    setSessions((current) =>
      current.map((item) => (item.key === key ? { ...item, ...updates } : item)),
    );
  }

  function removeSession(key: string) {
    setSessions((current) => current.filter((item) => item.key !== key));
  }

  function submitReport(formData: FormData) {
    formData.set(
      "sessions",
      JSON.stringify(
        sessions.map(({ classId, sessionAt, location, participantIds }) => ({
          classId,
          sessionAt,
          location,
          participantIds,
        })),
      ),
    );
    submit(formData);
  }

  return (
    <form action={submitReport} className="space-y-5">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <div className="space-y-4">
        {sessions.map((item, index) => (
          <fieldset key={item.key} className="border-border rounded-xl border p-4">
            <div className="mb-4 flex items-center justify-between gap-3">
              <legend className="text-card-foreground font-semibold">
                Training session {index + 1}
              </legend>
              {sessions.length > 1 ? (
                <button
                  type="button"
                  aria-label={`Remove training session ${index + 1}`}
                  onClick={() => removeSession(item.key)}
                  className="text-destructive inline-flex min-h-9 items-center gap-1 rounded-lg px-2 text-xs font-semibold"
                >
                  <Trash2 aria-hidden="true" className="size-4" /> Remove
                </button>
              ) : null}
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="text-card-foreground text-sm font-medium">
                Course class / subject
                <select
                  required
                  value={item.classId}
                  onChange={(event) => updateSession(item.key, { classId: event.target.value })}
                  className={inputClassName()}
                >
                  {classes.map((classOption) => (
                    <option key={classOption.id} value={classOption.id}>
                      {classOption.subjectTitle} · {classOption.name}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-card-foreground text-sm font-medium">
                Date and time
                <input
                  required
                  type="datetime-local"
                  min={completedAtLocal}
                  max={nowLocal}
                  value={item.sessionAt}
                  onChange={(event) => updateSession(item.key, { sessionAt: event.target.value })}
                  className={inputClassName()}
                />
              </label>
              <label className="text-card-foreground text-sm font-medium sm:col-span-2">
                Branch / venue
                <input
                  required
                  minLength={2}
                  maxLength={180}
                  value={item.location}
                  onChange={(event) => updateSession(item.key, { location: event.target.value })}
                  className={inputClassName()}
                />
              </label>
            </div>
            <fieldset className="border-border mt-4 rounded-lg border p-3">
              <legend className="text-card-foreground px-1 text-sm font-medium">
                Branch participants
              </legend>
              {members.length ? (
                <div className="grid max-h-56 gap-2 overflow-y-auto sm:grid-cols-2">
                  {members.map((member) => (
                    <label
                      key={member.id}
                      className="text-muted-foreground flex items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={item.participantIds.includes(member.id)}
                        onChange={(event) =>
                          updateSession(item.key, {
                            participantIds: event.target.checked
                              ? [...item.participantIds, member.id]
                              : item.participantIds.filter((id) => id !== member.id),
                          })
                        }
                        className="accent-primary size-4"
                      />
                      <span>
                        {member.name}
                        {member.employeeId ? ` · ${member.employeeId}` : ""}
                      </span>
                    </label>
                  ))}
                </div>
              ) : (
                <p className="text-muted-foreground text-sm">
                  No other active participants are assigned to your branch.
                </p>
              )}
            </fieldset>
          </fieldset>
        ))}
      </div>
      <button
        type="button"
        disabled={pending || sessions.length >= 50 || classes.length === 0}
        onClick={() =>
          setSessions((current) => [
            ...current,
            {
              key: crypto.randomUUID(),
              classId: classes[0]?.id ?? "",
              sessionAt: "",
              location: branchName,
              participantIds: [],
            },
          ])
        }
        className="border-border text-foreground inline-flex min-h-10 items-center gap-2 rounded-lg border px-3 text-sm font-semibold disabled:opacity-50"
      >
        <Plus aria-hidden="true" className="size-4" /> Add another session
      </button>
      <ActionNotice notice={notice} isError={isError} />
      <button
        type="submit"
        disabled={pending || classes.length === 0 || members.length === 0}
        className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center rounded-lg px-5 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Submitting…" : "Submit for branch manager approval"}
      </button>
    </form>
  );
}

export function LearnInBranchReviewForm({
  reportId,
  questions,
}: {
  reportId: string;
  questions: {
    questionId: string;
    prompt: string;
    options: string[];
  }[];
}) {
  const { pending, notice, isError, run } = useActionNotice();
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const submit = run(approveLearnInBranchReportAction);

  function submitReview(formData: FormData) {
    formData.set(
      "answers",
      JSON.stringify(
        questions.map((question) => ({
          questionId: question.questionId,
          answer: answers[question.questionId] ?? "",
        })),
      ),
    );
    submit(formData);
  }

  return (
    <form action={submitReview} className="border-border mt-5 space-y-4 rounded-xl border p-4">
      <input type="hidden" name="reportId" value={reportId} />
      <h3 className="text-card-foreground font-semibold">Branch manager review</h3>
      {questions.map((question) => (
        <fieldset key={question.questionId}>
          <legend className="text-card-foreground text-sm font-medium">{question.prompt}</legend>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {question.options.map((option) => (
              <label key={option} className="text-muted-foreground flex items-center gap-2 text-sm">
                <input
                  required
                  type="radio"
                  name={`answer-${question.questionId}`}
                  value={option}
                  checked={answers[question.questionId] === option}
                  onChange={() =>
                    setAnswers((current) => ({ ...current, [question.questionId]: option }))
                  }
                  className="accent-primary size-4"
                />
                {option}
              </label>
            ))}
          </div>
        </fieldset>
      ))}
      <label className="text-card-foreground block text-sm font-medium">
        Manager comments
        <textarea
          name="managerComment"
          rows={3}
          maxLength={2000}
          className="border-input bg-background text-foreground mt-2 w-full rounded-lg border p-3 text-sm"
        />
      </label>
      <ActionNotice notice={notice} isError={isError} />
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold disabled:opacity-50"
      >
        {pending ? "Approving…" : "Approve report"}
      </button>
    </form>
  );
}

export function LearnInBranchQuestionForm() {
  const { pending, notice, isError, run } = useActionNotice();
  const submit = run(addLearnInBranchQuestionAction);

  return (
    <form action={submit} className="border-border space-y-4 rounded-xl border p-4">
      <label className="text-card-foreground block text-sm font-medium">
        Question
        <textarea
          required
          name="prompt"
          rows={2}
          minLength={10}
          maxLength={500}
          className="border-input bg-background text-foreground mt-2 w-full rounded-lg border p-3 text-sm"
        />
      </label>
      <label className="text-card-foreground block text-sm font-medium">
        Answer choices
        <textarea
          required
          name="options"
          rows={4}
          placeholder={"One answer choice per line"}
          className="border-input bg-background text-foreground mt-2 w-full rounded-lg border p-3 text-sm"
        />
        <span className="text-muted-foreground mt-1 block text-xs font-normal">
          Enter between two and ten choices, one per line.
        </span>
      </label>
      <ActionNotice notice={notice} isError={isError} />
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add review question"}
      </button>
    </form>
  );
}

export function LearnInBranchDeadlineForm({
  enrollmentId,
  minDate,
  currentDate,
}: {
  enrollmentId: string;
  minDate: string;
  currentDate: string;
}) {
  const { pending, notice, isError, run } = useActionNotice();
  const submit = run(extendLearnInBranchDeadlineAction);

  return (
    <form action={submit} className="flex flex-wrap items-end gap-3">
      <input type="hidden" name="enrollmentId" value={enrollmentId} />
      <label className="text-card-foreground text-xs font-medium">
        Extend until
        <input
          required
          type="date"
          name="deadlineDate"
          min={minDate}
          defaultValue={currentDate}
          className="border-input bg-background text-foreground mt-1.5 min-h-9 rounded-lg border px-2 text-xs"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground inline-flex min-h-9 items-center justify-center rounded-lg px-3 text-xs font-semibold disabled:opacity-50"
      >
        {pending ? "Saving…" : "Save extension"}
      </button>
      <ActionNotice notice={notice} isError={isError} />
    </form>
  );
}
