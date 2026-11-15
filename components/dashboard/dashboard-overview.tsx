import {
  Activity,
  ArrowRight,
  Award,
  BookOpen,
  CalendarDays,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  Clock3,
  GraduationCap,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import type { DashboardData } from "@/lib/dashboard-query";
import { getRoleLabel, type UserRole } from "@/lib/roles";
import type { MyLearningCourse } from "@/lib/course-types";
import { formatSessionDate, formatSessionTime } from "@/utils/date-time";

const metricIcons = [BookOpen, Activity, Award, CalendarDays];
const metricTones = [
  "bg-sky-100 text-sky-700 dark:bg-sky-950 dark:text-sky-300",
  "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  "bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300",
  "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
];

function getQuickLinks(role: UserRole) {
  if (role === "participant") {
    return [
      { label: "Browse courses", href: "/dashboard/courses", icon: GraduationCap },
      { label: "My learning", href: "/dashboard/learning", icon: BookOpen },
    ];
  }
  if (role === "teacher") {
    return [
      { label: "Assigned courses", href: "/dashboard/courses", icon: BookOpen },
      { label: "Teaching schedule", href: "/dashboard/calendar", icon: CalendarDays },
    ];
  }
  if (role === "branch_manager") {
    return [
      {
        label: "Branch approvals",
        href: "/dashboard/learning/learn-in-branch",
        icon: ClipboardCheck,
      },
      { label: "Branch courses", href: "/dashboard/courses", icon: BookOpen },
    ];
  }
  if (role === "auditor") {
    return [
      { label: "Course overview", href: "/dashboard/courses", icon: BookOpen },
      { label: "Activity summary", href: "/dashboard/reports", icon: Activity },
    ];
  }
  return [
    { label: "Manage courses", href: "/dashboard/courses", icon: BookOpen },
    { label: "Manage users", href: "/dashboard/users", icon: UsersRound },
  ];
}

function EmptyState({
  icon: Icon,
  title,
  description,
  href,
  action,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="flex min-h-48 flex-col items-center justify-center px-5 py-8 text-center">
      <span className="bg-secondary text-secondary-foreground mb-4 flex size-12 items-center justify-center rounded-2xl">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <h3 className="text-card-foreground font-semibold">{title}</h3>
      <p className="text-muted-foreground mt-1.5 max-w-sm text-sm leading-6">{description}</p>
      {href && action ? (
        <Link
          href={href}
          className="text-primary mt-4 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
        >
          {action}
          <ArrowRight aria-hidden="true" className="size-4" />
        </Link>
      ) : null}
    </div>
  );
}

export function DashboardOverview({
  name,
  role,
  learningCourses,
  data,
}: {
  name: string;
  role: UserRole;
  learningCourses: MyLearningCourse[];
  data: DashboardData;
}) {
  const progressPercent =
    data.progressTotal > 0
      ? Math.min(100, Math.round((data.progressValue / data.progressTotal) * 100))
      : 0;
  const maxActivity = Math.max(...data.weekActivity.map((day) => day.value), 1);
  const quickLinks = getQuickLinks(role);
  const firstName = name.trim().split(/\s+/)[0] || "there";

  return (
    <main id="overview" className="mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <section className="relative isolate overflow-hidden rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-sky-950 px-6 py-7 text-white shadow-lg sm:px-8 sm:py-9">
        <div
          aria-hidden="true"
          className="absolute -top-20 -right-12 -z-10 size-72 rounded-full bg-sky-400/20 blur-3xl"
        />
        <div
          aria-hidden="true"
          className="absolute -right-6 -bottom-36 -z-10 size-72 rounded-full bg-violet-400/15 blur-3xl"
        />
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-end">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold tracking-wide text-sky-200">
              {getRoleLabel(role)} workspace
            </p>
            <h1 className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-300 sm:text-base">
              Your training activity, progress, and next sessions are all in one place.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {quickLinks.map(({ label, href, icon: Icon }) => (
              <Link
                key={label}
                href={href}
                className="inline-flex min-h-11 items-center gap-2 rounded-xl border border-white/20 bg-white/10 px-4 text-sm font-semibold text-white transition-colors hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <Icon aria-hidden="true" className="size-4" />
                {label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section aria-label="Training summary" className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {data.metrics.map(({ label, value, detail }, index) => {
          const Icon = metricIcons[index] ?? Activity;
          const tone = metricTones[index] ?? metricTones[0];
          return (
            <article
              key={label}
              className="border-border bg-card rounded-2xl border p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span className={`flex size-11 items-center justify-center rounded-xl ${tone}`}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span className="text-muted-foreground mt-1 text-xs font-medium">
                  Current snapshot
                </span>
              </div>
              <p className="text-card-foreground mt-5 text-3xl font-bold tracking-tight">
                {value.toLocaleString()}
              </p>
              <p className="text-card-foreground mt-1 text-sm font-semibold">{label}</p>
              <p className="text-muted-foreground mt-1 text-xs">{detail}</p>
            </article>
          );
        })}
      </section>

      <section className="grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1.9fr)]">
        <article className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-card-foreground font-semibold">Progress at a glance</h2>
              <p className="text-muted-foreground mt-1 text-xs">{data.progressLabel}</p>
            </div>
            <span className="bg-secondary text-secondary-foreground flex size-9 items-center justify-center rounded-xl">
              <CheckCircle2 aria-hidden="true" className="size-4" />
            </span>
          </div>
          <div className="mt-5 flex items-center gap-5">
            <div
              className="relative grid size-32 shrink-0 place-items-center"
              role="img"
              aria-label={`${progressPercent}% ${data.progressLabel.toLowerCase()}`}
            >
              <svg viewBox="0 0 100 100" className="size-full -rotate-90">
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  className="text-secondary"
                />
                <circle
                  cx="50"
                  cy="50"
                  r="42"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={`${(progressPercent / 100) * 264} 264`}
                  className="text-primary transition-[stroke-dasharray]"
                />
              </svg>
              <span className="absolute text-2xl font-bold tracking-tight">{progressPercent}%</span>
            </div>
            <div>
              <p className="text-card-foreground text-lg font-semibold">
                {data.progressValue.toLocaleString()} of {data.progressTotal.toLocaleString()}
              </p>
              <p className="text-muted-foreground mt-1 text-sm leading-5">
                {data.progressTotal > 0
                  ? "Keep building momentum with your training."
                  : "Your progress will appear here as training activity is recorded."}
              </p>
            </div>
          </div>
          <div className="border-border mt-5 border-t pt-4">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-card-foreground text-sm font-semibold">Classes this week</h3>
              <span className="text-muted-foreground text-xs">
                {data.weekActivity.reduce((sum, day) => sum + day.value, 0)} scheduled
              </span>
            </div>
            <div className="flex h-16 items-end justify-between gap-2" aria-label="Classes by day">
              {data.weekActivity.map(({ label, value }) => (
                <div
                  key={label}
                  className="flex h-full flex-1 flex-col items-center justify-end gap-1.5"
                >
                  <span className="text-muted-foreground text-[10px]">{value || ""}</span>
                  <div
                    className={`w-full max-w-6 rounded-t-md ${value ? "bg-primary" : "bg-secondary"}`}
                    style={{ height: `${Math.max(8, (value / maxActivity) * 38)}px` }}
                    title={`${label}: ${value} ${value === 1 ? "class" : "classes"}`}
                  />
                  <span className="text-muted-foreground text-[10px]">{label}</span>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article
          id="calendar"
          className="border-border bg-card scroll-mt-24 rounded-2xl border shadow-sm"
        >
          <div className="border-border flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-card-foreground font-semibold">Upcoming sessions</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                {data.metrics[3]?.value ?? 0} scheduled class
                {data.metrics[3]?.value === 1 ? "" : "es"}
              </p>
            </div>
            <span className="bg-secondary text-secondary-foreground flex size-9 items-center justify-center rounded-xl">
              <CalendarDays aria-hidden="true" className="size-4" />
            </span>
          </div>
          {data.upcomingSessions.length ? (
            <ul className="divide-border divide-y">
              {data.upcomingSessions.map((session) => (
                <li key={session.id} className="px-5 py-4 sm:px-6">
                  <div className="flex items-start gap-3">
                    <div className="bg-accent text-accent-foreground flex min-h-14 min-w-14 flex-col items-center justify-center rounded-xl px-2 text-center">
                      <span className="text-[10px] leading-4 font-bold tracking-wide uppercase">
                        {formatSessionDate(session.scheduledAt).split(" ")[0]}
                      </span>
                      <span className="text-sm leading-4 font-bold">
                        {session.scheduledAt.getDate()}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/dashboard/courses/${session.courseId}`}
                        className="text-card-foreground hover:text-primary line-clamp-1 text-sm font-semibold hover:underline"
                      >
                        {session.className}
                      </Link>
                      <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                        {session.courseTitle} · {session.subjectTitle}
                      </p>
                      <div className="text-muted-foreground mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs">
                        <span className="inline-flex items-center gap-1">
                          <Clock3 aria-hidden="true" className="size-3.5" />
                          {formatSessionTime(session.scheduledAt)} · {session.durationMinutes} min
                        </span>
                        <span>{session.venue || session.batchName}</span>
                      </div>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={CalendarDays}
              title="No sessions scheduled"
              description="New classes will appear here as soon as they are scheduled for you."
              href={role === "participant" ? "/dashboard/courses" : undefined}
              action={role === "participant" ? "Explore courses" : undefined}
            />
          )}
        </article>
      </section>

      {role === "participant" ? (
        <section
          id="my-learning"
          className="border-border bg-card scroll-mt-24 overflow-hidden rounded-2xl border shadow-sm"
        >
          <div className="border-border flex items-center justify-between gap-4 border-b px-5 py-4 sm:px-6">
            <div>
              <h2 className="text-card-foreground font-semibold">Continue learning</h2>
              <p className="text-muted-foreground mt-1 text-xs">
                Pick up where you left off or revisit a completed course
              </p>
            </div>
            <Link
              href="/dashboard/learning"
              className="text-primary inline-flex shrink-0 items-center gap-1 text-sm font-semibold hover:underline"
            >
              View all
              <ChevronRight aria-hidden="true" className="size-4" />
            </Link>
          </div>
          {learningCourses.length ? (
            <ul className="divide-border grid divide-y sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-3">
              {learningCourses.slice(0, 3).map((course) => (
                <li key={course.enrollmentId} className="border-border p-5 sm:border-r sm:p-6">
                  <div className="flex items-start justify-between gap-3">
                    <span className="bg-secondary text-secondary-foreground flex size-10 shrink-0 items-center justify-center rounded-xl">
                      <BookOpen aria-hidden="true" className="size-5" />
                    </span>
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        course.enrollmentStatus === "COMPLETED"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {course.enrollmentStatus === "COMPLETED" ? "Completed" : "In progress"}
                    </span>
                  </div>
                  <Link
                    href={`/dashboard/courses/${course.id}`}
                    className="text-card-foreground hover:text-primary mt-4 line-clamp-2 block font-semibold hover:underline"
                  >
                    {course.title}
                  </Link>
                  <p className="text-muted-foreground mt-1 line-clamp-1 text-xs">
                    {course.category || course.batchName}
                  </p>
                  {course.enrollmentStatus === "COMPLETED" ? (
                    <p className="text-muted-foreground mt-3 inline-flex items-center gap-1.5 text-xs">
                      <CheckCircle2 aria-hidden="true" className="size-3.5" />
                      Course completed
                    </p>
                  ) : (
                    <Link
                      href={`/dashboard/courses/${course.id}`}
                      className="text-primary mt-3 inline-flex items-center gap-1.5 text-xs font-semibold hover:underline"
                    >
                      Open course
                      <ArrowRight aria-hidden="true" className="size-3.5" />
                    </Link>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <EmptyState
              icon={BookOpen}
              title="No courses assigned yet"
              description="When a course is assigned to you, it will be ready to open from this dashboard."
              href="/dashboard/courses"
              action="Browse the catalog"
            />
          )}
        </section>
      ) : (
        <section id="reports" className="grid gap-5 sm:grid-cols-2">
          {quickLinks.map(({ label, href, icon: Icon }) => (
            <Link
              key={label}
              href={href}
              className="border-border bg-card group hover:bg-muted/50 flex items-center gap-4 rounded-2xl border p-5 shadow-sm transition-colors sm:p-6"
            >
              <span className="bg-secondary text-secondary-foreground flex size-11 shrink-0 items-center justify-center rounded-xl">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="text-card-foreground block font-semibold">{label}</span>
                <span className="text-muted-foreground mt-1 block text-sm">
                  Open your {label.toLowerCase()} workspace
                </span>
              </span>
              <ArrowRight
                aria-hidden="true"
                className="text-muted-foreground group-hover:text-primary size-4 shrink-0 transition-colors"
              />
            </Link>
          ))}
        </section>
      )}
    </main>
  );
}
