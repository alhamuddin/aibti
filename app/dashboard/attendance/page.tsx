import QRCode from "qrcode";
import Image from "next/image";
import Link from "next/link";
import {
  closeAttendanceAction,
  markManualAttendanceAction,
  startAttendanceAction,
} from "@/actions/attendance-actions";
import { AttendanceRefresh } from "@/components/dashboard/attendance/attendance-refresh";
import {
  AttendanceTable,
  type AttendanceTableRow,
} from "@/components/dashboard/attendance/attendance-table";
import { createAttendanceQrSignature } from "@/lib/attendance";
import { listAttendanceAdminDays } from "@/lib/attendance-query";
import { requireAdmin } from "@/lib/session";
import { formatDateTime, formatTime } from "@/utils/date-time";

export const instant = false;

function getApplicationBaseUrl() {
  const configuredUrl = process.env.BETTER_AUTH_URL;
  if (configuredUrl) return new URL(configuredUrl);
  if (process.env.NODE_ENV === "production") {
    throw new Error("BETTER_AUTH_URL must be set to create attendance QR codes.");
  }
  return new URL("http://localhost:3000");
}

export default async function AttendancePage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  await requireAdmin();
  const [days, params] = await Promise.all([listAttendanceAdminDays(), searchParams]);
  const now = new Date();
  const baseUrl = getApplicationBaseUrl();

  const rows: AttendanceTableRow[] = await Promise.all(
    days.map(async (day) => {
      const windowIsAvailable = now >= day.opensAt && now < day.autoClosesAt;
      const sessionIsOpen = Boolean(day.session && !day.session.closedAt && windowIsAvailable);
      const qrDataUrl =
        day.session && sessionIsOpen
          ? await QRCode.toDataURL(
              (() => {
                const url = new URL("/dashboard/attendance/check-in", baseUrl);
                url.searchParams.set("sessionId", day.session.id);
                url.searchParams.set("nonce", day.session.qrNonce);
                url.searchParams.set(
                  "signature",
                  createAttendanceQrSignature(day.session.id, day.session.qrNonce),
                );
                return url.toString();
              })(),
              { errorCorrectionLevel: "M", margin: 2, width: 280 },
            )
          : null;
      const presentCount = day.participants.filter(
        (participant) => participant.status === "PRESENT",
      ).length;
      const absentCount = day.participants.filter(
        (participant) => participant.status === "ABSENT",
      ).length;
      const status = !day.session
        ? windowIsAvailable
          ? "Ready to open"
          : now < day.opensAt
            ? "Scheduled"
            : "Window ended"
        : day.session.closedAt
          ? `Closed ${day.session.closeReason === "AUTO" ? "automatically" : "by admin"}`
          : sessionIsOpen
            ? "Open"
            : "Unavailable";
      const firstClass = day.classes[0];

      return {
        id: `${day.batchId}:${day.courseDate}`,
        href: `/dashboard/attendance/${encodeURIComponent(day.batchId)}/${day.courseDate}`,
        courseName: day.courseName,
        batchName: day.batchName,
        courseDate: day.courseDate,
        timeZone: day.timeZone,
        firstClassTime: firstClass ? formatTime(firstClass.scheduledAt, day.timeZone) : "—",
        classCount: day.classes.length,
        presentCount,
        absentCount,
        enrolledCount: day.participants.length,
        status,
        details: (
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_18rem]">
            <div>
              <div className="mb-4">
                <p className="text-muted-foreground text-xs">
                  Attendance opens {formatDateTime(day.opensAt, day.timeZone)} and auto-closes{" "}
                  {formatDateTime(day.autoClosesAt, day.timeZone)}.
                </p>
                <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                  {day.classes.map((classSession) => (
                    <span
                      key={`${classSession.name}:${classSession.scheduledAt.toISOString()}`}
                      className="text-muted-foreground text-xs"
                    >
                      {classSession.name} · {classSession.subjectTitle} ·{" "}
                      {formatTime(classSession.scheduledAt, day.timeZone)} ·{" "}
                      {classSession.durationMinutes} min
                    </span>
                  ))}
                </div>
              </div>

              {!day.session && windowIsAvailable && day.participants.length ? (
                <form action={startAttendanceAction} className="mb-4">
                  <input type="hidden" name="courseId" value={day.courseId} />
                  <input type="hidden" name="batchId" value={day.batchId} />
                  <input type="hidden" name="courseDate" value={day.courseDate} />
                  <button
                    type="submit"
                    className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-10 rounded-lg px-4 text-sm font-semibold"
                  >
                    Open attendance and generate QR
                  </button>
                </form>
              ) : null}

              {day.session ? (
                <>
                  <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                    <h3 className="text-card-foreground font-semibold">Manual attendance</h3>
                    {sessionIsOpen ? (
                      <form action={closeAttendanceAction}>
                        <input type="hidden" name="sessionId" value={day.session.id} />
                        <button
                          type="submit"
                          className="border-destructive/40 text-destructive hover:bg-destructive/10 min-h-9 rounded-lg border px-3 text-xs font-semibold"
                        >
                          Close and mark remaining absent
                        </button>
                      </form>
                    ) : null}
                  </div>
                  {day.participants.length ? (
                    <div className="divide-border divide-y rounded-xl border">
                      {day.participants.map((participant) => (
                        <div
                          key={participant.id}
                          className="flex flex-wrap items-center justify-between gap-3 px-3 py-3"
                        >
                          <div>
                            <p className="text-card-foreground text-sm font-medium">
                              {participant.name}
                            </p>
                            <p className="text-muted-foreground mt-0.5 text-xs">
                              Employee ID: {participant.employeeId}
                              {participant.markedAt
                                ? ` · ${participant.method === "QR" ? "QR" : participant.method === "AUTO" ? "Automatic" : "Manual"} · ${formatTime(participant.markedAt, day.timeZone)}`
                                : " · Not marked"}
                            </p>
                          </div>
                          {sessionIsOpen ? (
                            <form
                              action={markManualAttendanceAction}
                              className="flex items-center gap-2"
                            >
                              <input type="hidden" name="sessionId" value={day.session?.id ?? ""} />
                              <input type="hidden" name="participantId" value={participant.id} />
                              <button
                                name="status"
                                value="PRESENT"
                                type="submit"
                                className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
                                  participant.status === "PRESENT"
                                    ? "bg-primary text-primary-foreground"
                                    : "border-border text-foreground hover:bg-accent border"
                                }`}
                              >
                                Present
                              </button>
                              <button
                                name="status"
                                value="ABSENT"
                                type="submit"
                                className={`min-h-9 rounded-lg px-3 text-xs font-semibold ${
                                  participant.status === "ABSENT"
                                    ? "bg-destructive text-destructive-foreground"
                                    : "border-border text-foreground hover:bg-accent border"
                                }`}
                              >
                                Absent
                              </button>
                            </form>
                          ) : (
                            <span className="text-muted-foreground text-xs font-semibold">
                              {participant.status ?? "Not marked"}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-muted-foreground rounded-xl border border-dashed p-5 text-sm">
                      No active participants are enrolled in this course.
                    </p>
                  )}
                </>
              ) : (
                <p className="text-muted-foreground text-sm">
                  {now < day.opensAt
                    ? `Attendance can be opened at ${formatDateTime(day.opensAt, day.timeZone)}.`
                    : day.participants.length
                      ? "Attendance can be opened now."
                      : "No active participants are enrolled in this course."}
                </p>
              )}
            </div>

            {qrDataUrl ? (
              <aside className="bg-muted/40 flex flex-col items-center rounded-xl p-4 text-center">
                <Image
                  src={qrDataUrl}
                  alt={`Attendance QR code for ${day.courseName}`}
                  width={224}
                  height={224}
                  unoptimized
                  className="size-56 rounded-lg bg-white p-2"
                />
                <p className="text-card-foreground mt-3 text-sm font-semibold">
                  Share this QR code
                </p>
                <p className="text-muted-foreground mt-1 text-xs leading-5">
                  Participants must sign in with their enrolled account to check in.
                </p>
              </aside>
            ) : null}
          </div>
        ),
      };
    }),
  );

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-semibold">Training operations</p>
          <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">Attendance</h1>
          <p className="text-muted-foreground mt-2 max-w-3xl text-sm leading-6">
            Open attendance from 30 minutes before the first scheduled class. Participants can scan
            the shared QR code, or administrators can record attendance manually. Any unmarked
            participants are marked absent when the session closes.
          </p>
        </div>
        <AttendanceRefresh />
      </header>

      {params.notice ? (
        <p
          role="status"
          className="border-primary/20 bg-accent text-accent-foreground rounded-xl border px-4 py-3 text-sm"
        >
          {params.notice}
        </p>
      ) : null}

      {rows.length ? (
        <AttendanceTable rows={rows} />
      ) : (
        <div className="border-border bg-card rounded-2xl border border-dashed px-5 py-12 text-center">
          <h2 className="text-card-foreground font-semibold">No scheduled course days found</h2>
          <p className="text-muted-foreground mt-2 text-sm">
            Published courses with classes scheduled within the next week will appear here.
          </p>
          <Link
            href="/dashboard/courses"
            className="text-primary mt-4 inline-flex text-sm font-semibold hover:underline"
          >
            View the training catalogue
          </Link>
        </div>
      )}
    </main>
  );
}
