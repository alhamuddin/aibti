import { redirect } from "next/navigation";
import Link from "next/link";
import { submitQrAttendanceAction } from "@/actions/attendance-actions";
import { closeDueAttendanceSessions } from "@/lib/attendance-service";
import { isValidAttendanceQrSignature } from "@/lib/attendance";
import { roles } from "@/lib/permissions";
import { isUserRole } from "@/lib/roles";
import { getSession, requireAuthenticatedUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";

export const instant = false;

function getTicketUrl(sessionId: string, nonce: string, signature: string) {
  const query = new URLSearchParams({ sessionId, nonce, signature });
  return `/dashboard/attendance/check-in?${query.toString()}`;
}

export default async function AttendanceCheckInPage({
  searchParams,
}: {
  searchParams: Promise<{
    sessionId?: string;
    nonce?: string;
    signature?: string;
    notice?: string;
  }>;
}) {
  const params = await searchParams;
  const sessionId = params.sessionId ?? "";
  const nonce = params.nonce ?? "";
  const signature = params.signature ?? "";
  const ticketUrl = getTicketUrl(sessionId, nonce, signature);
  const validTicket =
    sessionId.length > 0 &&
    nonce.length > 0 &&
    isValidAttendanceQrSignature(sessionId, nonce, signature);

  if (!validTicket) {
    return (
      <CheckInMessage title="Invalid attendance QR" message="This attendance link is invalid." />
    );
  }

  const currentSession = await getSession();
  if (!currentSession) {
    return (
      <CheckInMessage
        title="Sign in to check in"
        message="Sign in with the employee account enrolled in this course, then scan the QR code again."
        action={
          <Link
            href={`/login?callbackURL=${encodeURIComponent(ticketUrl)}`}
            className="bg-primary text-primary-foreground inline-flex min-h-11 items-center rounded-xl px-4 text-sm font-semibold"
          >
            Sign in
          </Link>
        }
      />
    );
  }
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (
    !isUserRole(role) ||
    role !== "participant" ||
    !roles[role].authorize({ attendance: ["mark.own"] }).success
  ) {
    redirect("/dashboard");
  }

  const now = new Date();
  await closeDueAttendanceSessions(now);
  const attendanceSession = await prisma.attendanceSession.findUnique({
    where: { id: sessionId },
    select: {
      id: true,
      qrNonce: true,
      batchId: true,
      courseName: true,
      batchName: true,
      courseDate: true,
      opensAt: true,
      autoClosesAt: true,
      closedAt: true,
      records: {
        where: { participantId: session.user.id },
        select: { status: true },
      },
    },
  });
  if (!attendanceSession || attendanceSession.qrNonce !== nonce) {
    return (
      <CheckInMessage title="Invalid attendance QR" message="This attendance link is invalid." />
    );
  }
  const enrollment = await prisma.courseEnrollment.findFirst({
    where: {
      batchId: attendanceSession.batchId,
      participantId: session.user.id,
      status: { in: ["ASSIGNED", "CONFIRMED"] },
      participant: { role: "participant", banned: false },
    },
    select: { id: true },
  });
  if (!enrollment) {
    return (
      <CheckInMessage
        title="Not enrolled"
        message="This attendance QR is only available to participants enrolled in the course."
      />
    );
  }
  const isOpen =
    !attendanceSession.closedAt &&
    now >= attendanceSession.opensAt &&
    now < attendanceSession.autoClosesAt;
  const alreadyPresent = attendanceSession.records[0]?.status === "PRESENT";

  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm sm:p-8">
        <p className="text-primary text-sm font-semibold">
          Course attendance · {attendanceSession.batchName} · {attendanceSession.courseDate}
        </p>
        <h1 className="text-foreground mt-2 text-2xl font-bold">{attendanceSession.courseName}</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">
          Confirm your attendance using your signed-in employee account.
        </p>
        {params.notice ? (
          <p
            role="status"
            className="bg-accent text-accent-foreground mt-4 rounded-lg px-3 py-3 text-sm"
          >
            {params.notice}
          </p>
        ) : null}
        {alreadyPresent ? (
          <p className="bg-accent text-accent-foreground mt-5 rounded-xl px-4 py-4 text-sm font-semibold">
            Your attendance is recorded as present.
          </p>
        ) : isOpen ? (
          <form action={submitQrAttendanceAction} className="mt-5">
            <input type="hidden" name="sessionId" value={sessionId} />
            <input type="hidden" name="nonce" value={nonce} />
            <input type="hidden" name="signature" value={signature} />
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-12 w-full rounded-xl px-4 text-sm font-semibold"
            >
              Confirm attendance
            </button>
          </form>
        ) : (
          <p className="bg-muted/50 text-muted-foreground mt-5 rounded-xl px-4 py-4 text-sm">
            This attendance window is not open or has been closed by the administrator.
          </p>
        )}
        <p className="text-muted-foreground mt-5 text-xs">
          {session.user.name} · {session.user.email}
        </p>
      </section>
    </main>
  );
}

function CheckInMessage({
  title,
  message,
  action,
}: {
  title: string;
  message: string;
  action?: React.ReactNode;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-10 sm:px-6">
      <section className="border-border bg-card rounded-2xl border p-6 shadow-sm sm:p-8">
        <h1 className="text-foreground text-2xl font-bold">{title}</h1>
        <p className="text-muted-foreground mt-3 text-sm leading-6">{message}</p>
        {action ? <div className="mt-5">{action}</div> : null}
      </section>
    </main>
  );
}
