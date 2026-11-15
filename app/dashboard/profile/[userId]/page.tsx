import Link from "next/link";
import { notFound } from "next/navigation";
import {
  BriefcaseBusiness,
  CheckCircle2,
  GraduationCap,
  Mail,
  Medal,
  UserRound,
} from "lucide-react";
import { ProfileEditor } from "@/components/dashboard/profile-editor";
import { prisma } from "@/lib/prisma";
import { getRoleLabel } from "@/lib/roles";
import { requireAuthenticatedUser } from "@/lib/session";

export const instant = false;

function ProfileSection({
  title,
  value,
  icon: Icon,
  description,
}: {
  title: string;
  value: string | null;
  icon: typeof GraduationCap;
  description: string;
}) {
  const hasValue = Boolean(value?.trim());

  return (
    <section className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
      <div className="flex items-start gap-3">
        <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-xl">
          <Icon aria-hidden="true" className="size-5" />
        </span>
        <div className="min-w-0">
          <h2 className="text-card-foreground font-semibold">{title}</h2>
          <p className="text-muted-foreground mt-1 text-xs">{description}</p>
        </div>
      </div>
      <p className="text-foreground mt-5 text-sm leading-7 whitespace-pre-wrap">
        {hasValue ? value : "Add a few details to introduce yourself."}
      </p>
    </section>
  );
}

function getProfileCompletion(profile: {
  name: string;
  image: string | null;
  qualifications: string | null;
  achievements: string | null;
  experience: string | null;
}) {
  const fields = [
    { label: "Display name", complete: Boolean(profile.name.trim()) },
    { label: "Profile photo", complete: Boolean(profile.image?.trim()) },
    { label: "Qualifications", complete: Boolean(profile.qualifications?.trim()) },
    { label: "Achievements", complete: Boolean(profile.achievements?.trim()) },
    { label: "Experience", complete: Boolean(profile.experience?.trim()) },
  ];

  const completed = fields.filter((field) => field.complete).length;
  return {
    fields,
    completed,
    percentage: Math.round((completed / fields.length) * 100),
  };
}

export default async function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
  const session = await requireAuthenticatedUser();
  const { userId } = await params;
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      employeeId: true,
      image: true,
      role: true,
      qualifications: true,
      achievements: true,
      experience: true,
    },
  });
  if (!user) notFound();

  const isOwnProfile = user.id === session.user.id;
  const completion = getProfileCompletion(user);

  return (
    <main className="mx-auto max-w-6xl space-y-7 px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between gap-4">
        <Link
          href="/dashboard"
          className="text-muted-foreground hover:text-foreground text-sm font-medium"
        >
          ← Back to dashboard
        </Link>
        <span className="text-muted-foreground hidden text-xs sm:inline">People / Profile</span>
      </div>

      <header className="border-border bg-card relative overflow-hidden rounded-3xl border shadow-sm">
        <div
          aria-hidden="true"
          className="from-primary/15 via-primary/5 absolute inset-x-0 top-0 h-32 bg-gradient-to-r to-transparent"
        />
        <div className="relative flex flex-col gap-6 p-6 sm:flex-row sm:items-end sm:p-8">
          {user.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={user.image}
              alt={`${user.name}'s profile`}
              width={112}
              height={112}
              referrerPolicy="no-referrer"
              className="border-card bg-card size-28 rounded-2xl border-4 object-cover shadow-md"
            />
          ) : (
            <span
              aria-hidden="true"
              className="bg-primary text-primary-foreground border-card flex size-28 items-center justify-center rounded-2xl border-4 text-4xl font-bold shadow-md"
            >
              {user.name.trim().charAt(0).toUpperCase() || "U"}
            </span>
          )}
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-foreground text-2xl font-bold tracking-tight sm:text-3xl">
                {user.name}
              </h1>
              <span className="bg-primary/10 text-primary rounded-full px-3 py-1 text-xs font-semibold">
                {getRoleLabel(user.role)}
              </span>
            </div>
            <p className="text-muted-foreground mt-2 text-sm">
              {isOwnProfile ? "Your professional profile" : "Team member profile"}
            </p>
            <div className="text-muted-foreground mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
              <span className="inline-flex items-center gap-2">
                <Mail aria-hidden="true" className="size-4" />
                <a className="hover:text-primary hover:underline" href={`mailto:${user.email}`}>
                  {user.email}
                </a>
              </span>
              {user.employeeId ? (
                <span className="inline-flex items-center gap-2">
                  <UserRound aria-hidden="true" className="size-4" />
                  Employee ID: {user.employeeId}
                </span>
              ) : null}
            </div>
          </div>
          {isOwnProfile ? <ProfileEditor profile={user} userId={user.id} /> : null}
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section aria-labelledby="about-heading" className="space-y-4">
          <div>
            <h2 id="about-heading" className="text-foreground text-lg font-semibold">
              Professional profile
            </h2>
            <p className="text-muted-foreground mt-1 text-sm">
              A snapshot of experience, education, and accomplishments.
            </p>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <ProfileSection
              title="Qualifications"
              value={user.qualifications}
              icon={GraduationCap}
              description="Education, certifications, and specialist skills"
            />
            <ProfileSection
              title="Achievements"
              value={user.achievements}
              icon={Medal}
              description="Milestones and professional highlights"
            />
            <div className="md:col-span-2">
              <ProfileSection
                title="Experience"
                value={user.experience}
                icon={BriefcaseBusiness}
                description="Roles, responsibilities, and areas of expertise"
              />
            </div>
          </div>
        </section>

        <aside className="space-y-4">
          <section className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="text-card-foreground font-semibold">Profile completeness</h2>
                <p className="text-muted-foreground mt-1 text-xs">
                  {completion.completed} of {completion.fields.length} details added
                </p>
              </div>
              <span className="text-primary text-2xl font-bold tabular-nums">
                {completion.percentage}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Profile completeness"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={completion.percentage}
              className="bg-muted mt-4 h-2 overflow-hidden rounded-full"
            >
              <div
                className="bg-primary h-full rounded-full transition-[width]"
                style={{ width: `${completion.percentage}%` }}
              />
            </div>
            <ul className="mt-5 space-y-3">
              {completion.fields.map((field) => (
                <li
                  key={field.label}
                  className="text-muted-foreground flex items-center gap-2.5 text-sm"
                >
                  <CheckCircle2
                    aria-hidden="true"
                    className={`size-4 shrink-0 ${field.complete ? "text-emerald-600" : "text-muted-foreground/40"}`}
                  />
                  <span className={field.complete ? "text-foreground" : ""}>{field.label}</span>
                </li>
              ))}
            </ul>
            {isOwnProfile && completion.percentage < 100 ? (
              <span className="text-muted-foreground mt-5 inline-flex text-sm">
                Use Edit profile to add missing details.
              </span>
            ) : null}
          </section>

          <section className="border-border bg-muted/30 rounded-2xl border p-5">
            <p className="text-foreground text-sm font-semibold">Account details</p>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Account type</dt>
                <dd className="text-foreground text-right font-medium">
                  {getRoleLabel(user.role)}
                </dd>
              </div>
              <div className="flex items-start justify-between gap-3">
                <dt className="text-muted-foreground">Employee ID</dt>
                <dd className="text-foreground text-right font-medium">
                  {user.employeeId || "Not assigned"}
                </dd>
              </div>
            </dl>
          </section>
        </aside>
      </div>
    </main>
  );
}
