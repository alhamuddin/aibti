import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/roles";
import { listCoursesForUser } from "@/lib/course-query";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ courseId: string }> },
) {
  const session = await getSession();
  const role = session?.user.role ?? "";
  if (!session || !isUserRole(role)) {
    return NextResponse.json({ message: "Sign in to view this course." }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, mustChangePassword: true },
  });
  if (!user || user.banned) {
    return NextResponse.json({ message: "This account cannot access courses." }, { status: 401 });
  }
  if (user.mustChangePassword) {
    return NextResponse.json({ message: "Change your password to continue." }, { status: 403 });
  }

  const { courseId } = await params;
  const result = await listCoursesForUser(session.user.id, role, 1, 1, "", courseId);
  const course = result.courses[0];
  if (!course) return NextResponse.json({ message: "Course not found." }, { status: 404 });

  return NextResponse.json(course, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
