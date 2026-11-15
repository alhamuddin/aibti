import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { canManageUsers } from "@/lib/roles";

export async function GET(request: Request) {
  const session = await getSession();
  if (!session || !canManageUsers(session.user.role)) {
    return NextResponse.json({ message: "You cannot search course accounts." }, { status: 403 });
  }

  const actor = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true, mustChangePassword: true },
  });
  if (!actor || actor.banned) {
    return NextResponse.json({ message: "This account cannot access courses." }, { status: 401 });
  }
  if (actor.mustChangePassword) {
    return NextResponse.json({ message: "Change your password to continue." }, { status: 403 });
  }

  const url = new URL(request.url);
  const role = url.searchParams.get("role");
  const query = url.searchParams.get("q")?.trim() ?? "";
  if ((role !== "teacher" && role !== "participant") || query.length > 100) {
    return NextResponse.json({ message: "Invalid account search options." }, { status: 400 });
  }

  const search = query
    ? {
        OR: [
          { id: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { name: { contains: query, mode: "insensitive" as const } },
          { phone: { contains: query, mode: "insensitive" as const } },
          {
            branch: {
              is: {
                OR: [
                  { name: { contains: query, mode: "insensitive" as const } },
                  { code: { contains: query, mode: "insensitive" as const } },
                ],
              },
            },
          },
        ],
      }
    : {};

  const users = await prisma.user.findMany({
    where: { role, banned: false, isMock: false, ...search },
    orderBy: [{ name: "asc" }, { email: "asc" }],
    take: 50,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      isMock: true,
      branch: { select: { name: true, code: true } },
    },
  });
  return NextResponse.json(
    users.map((user) => ({
      ...user,
      branchName: user.branch ? `${user.branch.code} · ${user.branch.name}` : null,
    })),
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
