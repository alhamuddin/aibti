"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createCourseBatchAction } from "@/actions/course-actions";
import { AccountPicker, type AccountOption } from "@/components/dashboard/courses/course-editor";

export function CourseBatchForm({
  courseId,
  sourceBatchId,
  sourceBatchName,
  initialStartAt,
  initialParticipants,
}: {
  courseId: string;
  sourceBatchId: string;
  sourceBatchName: string;
  initialStartAt: string;
  initialParticipants: AccountOption[];
}) {
  const router = useRouter();
  const [participants, setParticipants] = useState(initialParticipants);
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setNotice("");
    const formData = new FormData(event.currentTarget);
    formData.set("courseId", courseId);
    formData.set("sourceBatchId", sourceBatchId);
    formData.set("participantIds", JSON.stringify(participants.map((user) => user.id)));
    try {
      const result = await createCourseBatchAction(formData);
      setNotice(result.message);
      if (result.success) router.refresh();
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "The new batch could not be created.");
    } finally {
      setPending(false);
    }
  }

  return (
    <section className="border-border bg-card rounded-xl border p-4 shadow-sm">
      <h2 className="text-card-foreground text-base font-semibold">Create another batch</h2>
      <p className="text-muted-foreground mt-1 text-sm leading-6">
        Copy {sourceBatchName}&apos;s teachers, classes, and materials, then shift its schedule to
        the new local start date and time.
      </p>
      <form onSubmit={submit} className="mt-4 grid gap-4 md:grid-cols-2">
        <label className="text-foreground block text-xs font-medium">
          Batch name
          <input
            name="batchName"
            required
            maxLength={180}
            placeholder="e.g. November 2026"
            className="border-input bg-background text-foreground mt-1.5 min-h-10 w-full rounded-md border px-3 text-sm"
          />
        </label>
        <label className="text-foreground block text-xs font-medium">
          New batch first class date and time
          <input
            name="targetStartAt"
            type="datetime-local"
            required
            defaultValue={initialStartAt}
            className="border-input bg-background text-foreground mt-1.5 min-h-10 w-full rounded-md border px-3 text-sm"
          />
        </label>
        <div className="md:col-span-2">
          <AccountPicker
            role="participant"
            multiple
            selected={participants}
            onChange={setParticipants}
          />
          <p className="text-muted-foreground mt-2 text-xs">
            {participants.length} participant(s) selected
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 md:col-span-2">
          <button
            type="submit"
            disabled={pending || !participants.length}
            className="bg-primary text-primary-foreground min-h-10 rounded-lg px-4 text-sm font-semibold disabled:opacity-50"
          >
            {pending ? "Creating batch…" : "Create batch"}
          </button>
          {notice ? (
            <p role="status" className="text-muted-foreground text-sm">
              {notice}
            </p>
          ) : null}
        </div>
      </form>
    </section>
  );
}
