import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock3, UsersRound } from "lucide-react";
import { listAttendanceAdminDays } from "@/lib/attendance-query";
import { requireAdmin } from "@/lib/session";
import { formatDateTime, formatTime } from "@/utils/date-time";

export const instant = false;

function ParticipantList({
  participants,
  emptyMessage,
  timeZone,
}: {
  participants: {
    id: string;
    name: string;
    employeeId: string;
    markedAt: Date | null;
    method: string | null;
  }[];
  emptyMessage: string;
  timeZone: string;
}) {
  return participants.length ? (
    <ul className="divide-border divide-y">
      {participants.map((participant) => (
        <li
          key={participant.id}
          className="flex flex-wrap items-center justify-between gap-3 px-4 py-3"
        >
          <div>
            <p className="text-card-foreground text-sm font-medium">{participant.name}</p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              Employee ID: {participant.employeeId}
            </p>
          </div>
          <span className="text-muted-foreground text-xs">
            {participant.markedAt
              ? `${participant.method === "QR" ? "QR check-in" : participant.method === "AUTO" ? "Automatic mark" : "Manual mark"} · ${formatTime(participant.markedAt, timeZone)}`
              : "Not marked yet"}
          </span>
        </li>
      ))}
    </ul>
  ) : (
    <p className="text-muted-foreground px-4 py-6 text-sm">{emptyMessage}</p>
  );
}

export default async function AttendanceCoursePage({
  params,
}: {
  params: Promise<{ batchId: string; courseDate: string }>;
}) {
  await requireAdmin();
  const { batchId, courseDate } = await params;
  const days = await listAttendanceAdminDays();
  const day = days.find((item) => item.batchId === batchId && item.courseDate === courseDate);
  if (!day) notFound();

  const present = day.participants.filter((participant) => participant.status === "PRESENT");
  const absent = day.participants.filter((participant) => participant.status === "ABSENT");
  const unmarked = day.participants.filter((participant) => participant.status === null);

  return (
    <main className="mx-auto max-w-5xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/attendance"
        className="text-muted-foreground hover:text-foreground inline-flex items-center gap-2 text-sm font-medium"
      >
        <ArrowLeft aria-hidden="true" className="size-4" /> Attendance
      </Link>

      <header className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-7">
        <p className="text-primary text-sm font-semibold">Attendance details</p>
        <h1 className="text-foreground mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          {day.courseName}
        </h1>
        <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <span>{day.batchName}</span>
          <span className="inline-flex items-center gap-1.5">
            <CalendarDays aria-hidden="true" className="size-4" /> {day.courseDate}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Clock3 aria-hidden="true" className="size-4" />
            {day.classes
              .map((classSession) => formatTime(classSession.scheduledAt, day.timeZone))
              .join(", ")}{" "}
            {day.timeZone}
          </span>
        </div>
      </header>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Attendance summary">
        {[
          { label: "Present", value: present.length, className: "text-emerald-700" },
          { label: "Absent", value: absent.length, className: "text-destructive" },
          { label: "Not marked", value: unmarked.length, className: "text-muted-foreground" },
        ].map((item) => (
          <article
            key={item.label}
            className="border-border bg-card rounded-xl border p-4 shadow-sm"
          >
            <p className="text-muted-foreground text-xs">{item.label}</p>
            <p className={`mt-2 text-2xl font-bold tabular-nums ${item.className}`}>{item.value}</p>
          </article>
        ))}
      </section>

      <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border flex items-center gap-2 border-b px-4 py-4 sm:px-5">
          <UsersRound aria-hidden="true" className="text-primary size-4" />
          <h2 className="text-card-foreground font-semibold">Present participants</h2>
          <span className="text-muted-foreground text-xs">({present.length})</span>
        </div>
        <ParticipantList
          participants={present}
          emptyMessage="No participants are marked present."
          timeZone={day.timeZone}
        />
      </section>

      <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border flex items-center gap-2 border-b px-4 py-4 sm:px-5">
          <UsersRound aria-hidden="true" className="text-destructive size-4" />
          <h2 className="text-card-foreground font-semibold">Absent participants</h2>
          <span className="text-muted-foreground text-xs">({absent.length})</span>
        </div>
        <ParticipantList
          participants={absent}
          emptyMessage="No participants are marked absent."
          timeZone={day.timeZone}
        />
      </section>

      {unmarked.length ? (
        <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
          <div className="border-border flex items-center gap-2 border-b px-4 py-4 sm:px-5">
            <UsersRound aria-hidden="true" className="text-muted-foreground size-4" />
            <h2 className="text-card-foreground font-semibold">Not marked yet</h2>
            <span className="text-muted-foreground text-xs">({unmarked.length})</span>
          </div>
          <ParticipantList
            participants={unmarked}
            emptyMessage="Everyone has an attendance mark."
            timeZone={day.timeZone}
          />
        </section>
      ) : null}

      <p className="text-muted-foreground text-xs">
        Attendance window: {formatDateTime(day.opensAt, day.timeZone)} to{" "}
        {formatDateTime(day.autoClosesAt, day.timeZone)}.
      </p>
    </main>
  );
}
