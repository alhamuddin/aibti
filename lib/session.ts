import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canManageUsers, isSuperAdmin, isUserRole } from "@/lib/roles";
import { hasCoursePermission } from "@/lib/permissions";

export async function getSession() {
  return auth.api.getSession({
    headers: await headers(),
  });
}

export async function requireAdmin() {
  const session = await requireAuthenticatedUser();

  if (!canManageUsers(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireSuperAdmin() {
  const session = await requireAuthenticatedUser();

  if (!isSuperAdmin(session.user.role)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireCoursePermission(permission: "read" | "write" | "publish") {
  const session = await requireAuthenticatedUser();
  const roleName = session.user.role ?? "";

  if (!isUserRole(roleName)) {
    redirect("/dashboard");
  }

  if (!hasCoursePermission(roleName, permission)) {
    redirect("/dashboard");
  }

  return session;
}

export async function requireAuthenticatedUser() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  if (user.mustChangePassword) {
    redirect("/change-password");
  }

  return session;
}
