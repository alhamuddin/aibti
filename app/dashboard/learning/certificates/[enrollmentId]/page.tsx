import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/roles";
import { requireAuthenticatedUser } from "@/lib/session";

export const instant = false;

export default async function CertificatePage({
  params,
}: {
  params: Promise<{ enrollmentId: string }>;
}) {
  const session = await requireAuthenticatedUser();
  const { enrollmentId } = await params;
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      participantId: true,
      status: true,
      certificateNumber: true,
      course: { select: { title: true } },
      batch: { select: { name: true } },
    },
  });
  if (
    !enrollment ||
    enrollment.status !== "COMPLETED" ||
    !enrollment.certificateNumber ||
    (enrollment.participantId !== session.user.id && !canManageUsers(session.user.role))
  ) {
    notFound();
  }

  const certificateUrl = `/api/certificates/${enrollmentId}`;
  return (
    <main className="mx-auto max-w-6xl space-y-5 px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/dashboard/learning"
        className="text-primary text-sm font-semibold hover:underline"
      >
        Back to my learning
      </Link>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-primary text-sm font-semibold">Digital certificate</p>
          <h1 className="text-foreground mt-2 text-2xl font-bold">{enrollment.course.title}</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {enrollment.batch.name} · Certificate {enrollment.certificateNumber}
          </p>
        </div>
        <a
          href={`${certificateUrl}?download=1`}
          download={`${enrollment.certificateNumber}.svg`}
          className="bg-primary text-primary-foreground inline-flex min-h-10 items-center rounded-lg px-4 text-sm font-semibold"
        >
          Download certificate
        </a>
      </header>
      <div className="border-border bg-card overflow-hidden rounded-xl border p-2 shadow-sm">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={certificateUrl}
          alt={`Certificate of completion for ${enrollment.course.title}`}
          className="h-auto w-full"
        />
      </div>
    </main>
  );
}
