import { NextResponse } from "next/server";
import { renderCourseCertificate } from "@/lib/certificate";
import { prisma } from "@/lib/prisma";
import { canManageUsers, isUserRole } from "@/lib/roles";
import { getSession } from "@/lib/session";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ enrollmentId: string }> },
) {
  const session = await getSession();
  if (!session)
    return NextResponse.json({ message: "Sign in to view certificates." }, { status: 401 });

  const role = session.user.role ?? "";
  const account = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, mustChangePassword: true },
  });
  if (!account || account.banned) {
    return NextResponse.json(
      { message: "This account cannot view certificates." },
      { status: 401 },
    );
  }
  if (account.mustChangePassword) {
    return NextResponse.json({ message: "Change your password to continue." }, { status: 403 });
  }

  const { enrollmentId } = await params;
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { id: enrollmentId },
    select: {
      participantId: true,
      status: true,
      completedAt: true,
      certificateNumber: true,
      participant: { select: { name: true } },
      course: { select: { title: true } },
      batch: { select: { name: true } },
    },
  });
  if (!enrollment) return NextResponse.json({ message: "Certificate not found." }, { status: 404 });
  if (
    enrollment.participantId !== session.user.id &&
    (!isUserRole(role) || !canManageUsers(role))
  ) {
    return NextResponse.json({ message: "You cannot view this certificate." }, { status: 403 });
  }
  if (
    enrollment.status !== "COMPLETED" ||
    !enrollment.completedAt ||
    !enrollment.certificateNumber
  ) {
    return NextResponse.json({ message: "Certificate not found." }, { status: 404 });
  }

  const certificate = renderCourseCertificate({
    participantName: enrollment.participant.name,
    courseTitle: enrollment.course.title,
    batchName: enrollment.batch.name,
    certificateNumber: enrollment.certificateNumber,
    completedAt: enrollment.completedAt,
  });
  const isDownload = new URL(request.url).searchParams.get("download") === "1";
  return new Response(certificate, {
    headers: {
      "Cache-Control": "private, no-store",
      "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${enrollment.certificateNumber}.svg"`,
      "Content-Security-Policy": "default-src 'none'; style-src 'unsafe-inline'",
      "Content-Type": "image/svg+xml; charset=utf-8",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
