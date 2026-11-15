import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { isUserRole } from "@/lib/roles";
import { hasCoursePermission } from "@/lib/permissions";
import { listCoursesForUser } from "@/lib/course-query";

const maxPageSize = 50;

export async function GET(request: Request) {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ message: "Sign in to view courses." }, { status: 401 });
  }

  const roleName = session.user.role ?? "";
  if (!isUserRole(roleName) || !hasCoursePermission(roleName, "read")) {
    return NextResponse.json({ message: "You cannot view courses." }, { status: 403 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, mustChangePassword: true },
  });
  if (!user || user.banned) {
    return NextResponse.json({ message: "This account cannot access courses." }, { status: 401 });
  }
  if (user.mustChangePassword) {
    return NextResponse.json(
      { message: "Change your initial password before viewing courses." },
      { status: 403 },
    );
  }

  const url = new URL(request.url);
  const page = Number.parseInt(url.searchParams.get("page") ?? "1", 10);
  const pageSize = Number.parseInt(url.searchParams.get("pageSize") ?? "20", 10);
  const search = (url.searchParams.get("q") ?? "").trim();

  if (
    !Number.isSafeInteger(page) ||
    page < 1 ||
    !Number.isSafeInteger(pageSize) ||
    pageSize < 1 ||
    pageSize > maxPageSize ||
    search.length > 100
  ) {
    return NextResponse.json({ message: "Invalid course list options." }, { status: 400 });
  }

  const result = await listCoursesForUser(session.user.id, roleName, page, pageSize, search);
  return NextResponse.json(result, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
