import { CalendarDays, ChevronLeft, ChevronRight, Clock3, MapPin } from "lucide-react";
import Link from "next/link";
import { getCalendarSessions } from "@/lib/course-schedule-query";
import { isUserRole } from "@/lib/roles";
import { requireAuthenticatedUser } from "@/lib/session";
import { formatDateWithOptions } from "@/utils/date-time";
import { redirect } from "next/navigation";

export const instant = false;

const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthFromQuery(value: string | string[] | undefined, now: Date) {
  if (typeof value !== "string" || !/^\d{4}-(0[1-9]|1[0-2])$/.test(value)) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  const [year, month] = value.split("-").map(Number);
  if (year < 1000 || year > 9998) {
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }

  return new Date(year, month - 1, 1);
}

function getDateKey(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function getMonthHref(date: Date) {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `/dashboard/calendar?month=${date.getFullYear()}-${month}`;
}

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string | string[] }>;
}) {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!isUserRole(role)) redirect("/dashboard");

  const query = await searchParams;
  const now = new Date();
  const monthStart = getMonthFromQuery(query.month, now);
  const monthEnd = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const gridStart = new Date(monthStart);
  gridStart.setDate(gridStart.getDate() - gridStart.getDay());
  const gridEnd = new Date(gridStart);
  gridEnd.setDate(gridEnd.getDate() + 42);
  const sessions = await getCalendarSessions(session.user.id, role, gridStart, gridEnd);
  const sessionsByDate = new Map<string, typeof sessions>();

  for (const scheduledSession of sessions) {
    const key = getDateKey(scheduledSession.scheduledAt);
    const daySessions = sessionsByDate.get(key);
    if (daySessions) daySessions.push(scheduledSession);
    else sessionsByDate.set(key, [scheduledSession]);
  }

  const days = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setDate(gridStart.getDate() + index);
    return date;
  });
  const previousMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
  const nextMonth = new Date(monthStart.getFullYear(), monthStart.getMonth() + 1, 1);
  const monthLabel = formatDateWithOptions(
    monthStart,
    {
      month: "long",
      year: "numeric",
    },
    "en",
  );
  const todayKey = getDateKey(now);
  const monthSessions = sessions.filter(
    (classSession) => classSession.scheduledAt >= monthStart && classSession.scheduledAt < monthEnd,
  );

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary flex items-center gap-2 text-sm font-semibold">
            <CalendarDays aria-hidden="true" className="size-4" />
            Training schedule
          </p>
          <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">Calendar</h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Browse scheduled course classes and open a course for more details.
          </p>
        </div>
        <Link href="/dashboard" className="text-primary text-sm font-semibold hover:underline">
          Back to dashboard
        </Link>
      </header>

      <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border flex flex-wrap items-center justify-between gap-4 border-b px-4 py-4 sm:px-6">
          <div>
            <h2 className="text-card-foreground text-lg font-semibold">{monthLabel}</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              {monthSessions.length} scheduled {monthSessions.length === 1 ? "class" : "classes"}
            </p>
          </div>
          <nav aria-label="Calendar month navigation" className="flex items-center gap-2">
            <Link
              href={getMonthHref(previousMonth)}
              aria-label="Previous month"
              className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-lg border transition-colors"
            >
              <ChevronLeft aria-hidden="true" className="size-4" />
            </Link>
            <Link
              href="/dashboard/calendar"
              className="border-border text-foreground hover:bg-accent flex min-h-9 items-center rounded-lg border px-3 text-xs font-semibold transition-colors"
            >
              Today
            </Link>
            <Link
              href={getMonthHref(nextMonth)}
              aria-label="Next month"
              className="border-border text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-lg border transition-colors"
            >
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </nav>
        </div>

        <div className="overflow-x-auto p-3 sm:p-5">
          <div className="min-w-[760px]">
            <div className="grid grid-cols-7">
              {weekDays.map((day) => (
                <div
                  key={day}
                  className="text-muted-foreground px-2 py-3 text-center text-xs font-semibold"
                >
                  {day}
                </div>
              ))}
            </div>
            <div className="border-border grid grid-cols-7 overflow-hidden rounded-xl border">
              {days.map((date, index) => {
                const dateKey = getDateKey(date);
                const daySessions = sessionsByDate.get(dateKey) ?? [];
                const isCurrentMonth = date.getMonth() === monthStart.getMonth();
                const isToday = dateKey === todayKey;

                return (
                  <div
                    key={dateKey}
                    className={`border-border min-h-32 border-b p-2 ${
                      index % 7 === 6 ? "" : "border-r"
                    } ${isCurrentMonth ? "bg-card" : "bg-muted/30"}`}
                  >
                    <div className="mb-2 flex items-center justify-between">
                      <time
                        dateTime={dateKey}
                        aria-label={formatDateWithOptions(
                          date,
                          {
                            dateStyle: "full",
                          },
                          "en",
                        )}
                        className={`flex size-7 items-center justify-center rounded-full text-xs font-semibold ${
                          isToday
                            ? "bg-primary text-primary-foreground"
                            : isCurrentMonth
                              ? "text-card-foreground"
                              : "text-muted-foreground"
                        }`}
                      >
                        {date.getDate()}
                      </time>
                      {daySessions.length ? (
                        <span className="text-muted-foreground text-[10px]">
                          {daySessions.length} {daySessions.length === 1 ? "class" : "classes"}
                        </span>
                      ) : null}
                    </div>
                    <ul className="space-y-1">
                      {daySessions.slice(0, 3).map((classSession) => (
                        <li key={classSession.id}>
                          <Link
                            href={`/dashboard/courses/${classSession.courseId}`}
                            title={`${classSession.className} · ${classSession.courseTitle}`}
                            className="bg-primary/10 text-primary hover:bg-primary/20 block rounded-md px-1.5 py-1 text-[10px] leading-4 transition-colors"
                          >
                            <span className="block truncate font-semibold">
                              {formatDateWithOptions(
                                classSession.scheduledAt,
                                {
                                  hour: "numeric",
                                  minute: "2-digit",
                                },
                                "en",
                              )}{" "}
                              · {classSession.className}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                    {daySessions.length > 3 ? (
                      <p className="text-muted-foreground mt-1 px-1 text-[10px]">
                        +{daySessions.length - 3} more
                      </p>
                    ) : null}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      <section aria-labelledby="calendar-agenda-title" className="space-y-3">
        <div>
          <h2 id="calendar-agenda-title" className="text-foreground text-lg font-semibold">
            Scheduled classes
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">
            All classes in {monthLabel}, ordered by start time.
          </p>
        </div>
        {monthSessions.length ? (
          <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
            {monthSessions.map((classSession) => (
              <li key={classSession.id} className="flex flex-wrap items-center gap-3 p-4 sm:p-5">
                <div className="bg-accent text-accent-foreground flex size-12 shrink-0 flex-col items-center justify-center rounded-xl">
                  <span className="text-[9px] font-bold tracking-wide uppercase">
                    {formatDateWithOptions(classSession.scheduledAt, { month: "short" }, "en")}
                  </span>
                  <span className="text-sm leading-4 font-bold">
                    {classSession.scheduledAt.getDate()}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/dashboard/courses/${classSession.courseId}`}
                    className="text-card-foreground hover:text-primary text-sm font-semibold hover:underline"
                  >
                    {classSession.className}
                  </Link>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {classSession.courseTitle} · {classSession.subjectTitle} ·{" "}
                    {classSession.batchName}
                  </p>
                </div>
                <div className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Clock3 aria-hidden="true" className="size-3.5" />
                    {formatDateWithOptions(
                      classSession.scheduledAt,
                      {
                        dateStyle: "medium",
                        timeStyle: "short",
                      },
                      "en",
                    )}
                  </span>
                  {classSession.venue ? (
                    <span className="inline-flex items-center gap-1">
                      <MapPin aria-hidden="true" className="size-3.5" />
                      {classSession.venue}
                    </span>
                  ) : null}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="border-border bg-card rounded-xl border border-dashed px-5 py-10 text-center">
            <p className="text-card-foreground font-semibold">No classes scheduled this month</p>
            <p className="text-muted-foreground mt-1 text-sm">
              Scheduled course classes will appear here.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
