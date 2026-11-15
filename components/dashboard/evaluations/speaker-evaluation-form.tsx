"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { submitSpeakerEvaluationAction } from "@/actions/speaker-evaluation-actions";
import type {
  SpeakerEvaluationCriterionKey,
  SpeakerEvaluationScores,
} from "@/lib/speaker-evaluation";
import { getSpeakerEvaluationOptions, speakerEvaluationCriteria } from "@/lib/speaker-evaluation";

export function SpeakerEvaluationForm({
  classId,
  scores,
}: {
  classId: string;
  scores: SpeakerEvaluationScores | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notice, setNotice] = useState("");
  const [noticeIsError, setNoticeIsError] = useState(false);

  function submit(formData: FormData) {
    setNotice("");
    startTransition(async () => {
      try {
        const result = await submitSpeakerEvaluationAction(formData);
        setNotice(result.message);
        setNoticeIsError(!result.success);
        if (result.success) router.refresh();
      } catch {
        setNotice("We could not save your evaluation. Please try again.");
        setNoticeIsError(true);
      }
    });
  }

  return (
    <form action={submit} className="border-border bg-card mt-4 space-y-4 rounded-xl border p-4">
      <input type="hidden" name="classId" value={classId} />
      <div>
        <h3 className="text-card-foreground font-semibold">
          {scores ? "Edit your evaluation" : "Evaluate this speaker"}
        </h3>
        <p className="text-muted-foreground mt-1 text-xs leading-5">
          Your response is anonymous. The teacher sees only the average score for each point.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {speakerEvaluationCriteria.map((criterion) => (
          <RatingField
            key={criterion.key}
            criterionKey={criterion.key}
            label={criterion.label}
            score={scores?.[criterion.key] ?? null}
          />
        ))}
      </div>
      {notice ? (
        <p
          role={noticeIsError ? "alert" : "status"}
          className={`text-sm ${noticeIsError ? "text-destructive" : "text-primary"}`}
        >
          {notice}
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="bg-primary text-primary-foreground inline-flex min-h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-60"
      >
        {pending ? "Saving…" : scores ? "Update evaluation" : "Submit evaluation"}
      </button>
    </form>
  );
}

function RatingField({
  criterionKey,
  label,
  score,
}: {
  criterionKey: SpeakerEvaluationCriterionKey;
  label: string;
  score: number | null;
}) {
  return (
    <label className="text-card-foreground space-y-1.5 text-sm">
      <span className="block font-medium">{label}</span>
      <select
        name={criterionKey}
        required
        defaultValue={score === null ? "" : String(score)}
        className="border-input bg-background text-foreground min-h-10 w-full rounded-md border px-3 text-sm"
      >
        <option value="" disabled>
          Select a rating
        </option>
        {getSpeakerEvaluationOptions(criterionKey).map((option) => (
          <option key={option.label} value={String(option.points * 2)}>
            {option.label} · {option.points} {option.points === 1 ? "point" : "points"}
          </option>
        ))}
      </select>
    </label>
  );
}
