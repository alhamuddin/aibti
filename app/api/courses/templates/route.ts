import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/roles";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ message: "You cannot search course templates." }, { status: 403 });
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

  const searchParams = new URL(request.url).searchParams;
  const query = searchParams.get("q")?.trim() ?? "";
  if (query.length > 100) {
    return NextResponse.json({ message: "Search text is too long." }, { status: 400 });
  }
  if (searchParams.get("categories") === "1") {
    const categories = await prisma.course.findMany({
      where: { category: { not: null } },
      distinct: ["category"],
      orderBy: { category: "asc" },
      select: { category: true },
    });
    return NextResponse.json(
      categories.flatMap(({ category }) => category ?? []),
      {
        headers: { "Cache-Control": "private, no-store" },
      },
    );
  }

  const courses = await prisma.course.findMany({
    where: query ? { title: { contains: query, mode: "insensitive" } } : undefined,
    orderBy: [{ updatedAt: "desc" }],
    select: { id: true, title: true, category: true },
  });
  return NextResponse.json(courses, {
    headers: { "Cache-Control": "private, no-store" },
  });
}
