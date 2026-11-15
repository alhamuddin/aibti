"use server";

import { APIError } from "better-auth/api";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { initialPasswordSchema, managedUserSchema } from "@/lib/auth-schema";
import { prisma } from "@/lib/prisma";
import { isSuperAdmin, isUserRole } from "@/lib/roles";
import { getSession, requireAdmin } from "@/lib/session";

function usersRedirect(message: string): never {
  redirect(`/dashboard/users?notice=${encodeURIComponent(message)}`);
}

function isUniqueConstraintError(error: unknown): boolean {
  return typeof error === "object" && error !== null && "code" in error && error.code === "P2002";
}

export async function createManagedUserAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const parsed = managedUserSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    usersRedirect("Check the account details and use a password with at least 10 characters.");
  }

  if (
    (parsed.data.role === "super_admin" || parsed.data.role === "admin") &&
    !isSuperAdmin(actor.user.role)
  ) {
    usersRedirect("Only a super administrator can create administrator accounts.");
  }

  if (parsed.data.branchId) {
    const branch = await prisma.branch.findUnique({
      where: { id: parsed.data.branchId },
      select: { id: true },
    });

    if (!branch) {
      usersRedirect("Select an existing branch.");
    }
  }

  const userId = randomUUID();
  const passwordHash = await (await auth.$context).password.hash(parsed.data.password);

  try {
    await prisma.$transaction(async (tx) => {
      await tx.user.create({
        data: {
          id: userId,
          name: parsed.data.name,
          email: parsed.data.email,
          employeeId: parsed.data.employeeId,
          phone: parsed.data.phone || null,
          role: parsed.data.role,
          branchId: parsed.data.branchId,
          mustChangePassword: true,
        },
      });
      await tx.account.create({
        data: {
          id: randomUUID(),
          accountId: userId,
          providerId: "credential",
          userId,
          password: passwordHash,
        },
      });

      if (parsed.data.role === "branch_manager" && parsed.data.branchId) {
        const branch = await tx.branch.findUnique({
          where: { id: parsed.data.branchId },
          select: { managerUserId: true },
        });

        if (branch?.managerUserId) {
          throw new Error("Branch already has a manager.");
        }

        await tx.branch.update({
          where: { id: parsed.data.branchId },
          data: { managerUserId: userId },
        });
      }

      await tx.userAuditLog.create({
        data: {
          actorUserId: actor.user.id,
          targetUserId: userId,
          action: "USER_CREATED",
        },
      });
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      usersRedirect(
        "The account could not be created. Check whether the email, employee ID, or branch is already in use.",
      );
    }

    if (error instanceof Error && error.message === "Branch already has a manager.") {
      usersRedirect("That branch already has a manager.");
    }

    throw error;
  }

  revalidatePath("/dashboard/users");
  usersRedirect("Account created. The user must change the initial password at first sign-in.");
}

export async function updateManagedUserEmployeeIdAction(formData: FormData): Promise<void> {
  await requireAdmin();
  const userId = formData.get("userId");
  const employeeId = formData.get("employeeId");
  if (
    typeof userId !== "string" ||
    !userId.trim() ||
    typeof employeeId !== "string" ||
    !employeeId.trim() ||
    employeeId.trim().length > 80
  ) {
    usersRedirect("Enter an employee ID of 1 to 80 characters.");
  }

  try {
    await prisma.user.update({
      where: { id: userId },
      data: { employeeId: employeeId.trim() },
    });
  } catch (error) {
    if (isUniqueConstraintError(error)) {
      usersRedirect("That employee ID is already assigned to another account.");
    }
    throw error;
  }

  revalidatePath("/dashboard/users");
  usersRedirect("Employee ID updated.");
}

export async function changeManagedUserRoleAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const userId = formData.get("userId");
  const role = formData.get("role");

  if (typeof userId !== "string" || !userId || typeof role !== "string" || !isUserRole(role)) {
    usersRedirect("Choose a valid user and role.");
  }

  const isSuperAdminActor = isSuperAdmin(actor.user.role);

  if ((role === "admin" || role === "super_admin") && !isSuperAdminActor) {
    usersRedirect("Only a super administrator can assign administrator roles.");
  }

  if (userId === actor.user.id) {
    usersRedirect("You cannot change your own role.");
  }

  const rawBranchId = formData.get("branchId");
  const branchId = typeof rawBranchId === "string" ? rawBranchId.trim() || null : null;

  if (role === "branch_manager" && !branchId) {
    usersRedirect("Assign branch managers to a branch.");
  }

  const result = await prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true, branchId: true },
      });

      if (!target) {
        return "missing";
      }

      if ((target.role === "super_admin" || target.role === "admin") && !isSuperAdminActor) {
        return "administrator";
      }

      if (target.role === role && target.branchId === branchId) {
        return "unchanged";
      }

      if (target.role === "super_admin" && role !== "super_admin") {
        const activeSuperAdmins = await tx.user.count({
          where: { role: "super_admin", banned: false },
        });

        if (activeSuperAdmins <= 1) {
          return "last-super-admin";
        }
      }

      if (target.role === "admin" && role !== "admin") {
        const activeAdmins = await tx.user.count({
          where: { role: "admin", banned: false },
        });

        if (activeAdmins <= 1) {
          return "last-admin";
        }
      }

      if (branchId) {
        const branch = await tx.branch.findUnique({
          where: { id: branchId },
          select: { managerUserId: true },
        });

        if (!branch) {
          return "branch-missing";
        }

        if (branch.managerUserId && branch.managerUserId !== userId) {
          return "branch-assigned";
        }
      }

      if (target.role === "branch_manager") {
        await tx.branch.updateMany({
          where: { managerUserId: userId },
          data: { managerUserId: null },
        });
      }

      if (role === "branch_manager" && branchId) {
        await tx.branch.update({
          where: { id: branchId },
          data: { managerUserId: userId },
        });
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          role,
          branchId,
        },
      });
      await tx.userAuditLog.create({
        data: {
          actorUserId: actor.user.id,
          targetUserId: userId,
          action:
            target.role === role
              ? `BRANCH_CHANGED:${target.branchId ?? "none"}:${branchId ?? "none"}`
              : `ROLE_CHANGED:${target.role}:${role}`,
        },
      });

      return "updated";
    },
    { isolationLevel: "Serializable" },
  );

  if (result === "missing") {
    usersRedirect("The selected account could not be found.");
  }

  if (result === "administrator") {
    usersRedirect("Only a super administrator can change administrator roles.");
  }

  if (result === "last-super-admin") {
    usersRedirect("At least one active super administrator must remain.");
  }

  if (result === "branch-missing") {
    usersRedirect("Select an existing branch.");
  }

  if (result === "branch-assigned") {
    usersRedirect("That branch already has a manager.");
  }

  if (result === "unchanged") {
    usersRedirect("The account already has that role.");
  }

  if (result === "last-admin") {
    usersRedirect("At least one active administrator must remain.");
  }

  revalidatePath("/dashboard/users");
  usersRedirect("User role updated.");
}

export async function banManagedUserAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const userId = formData.get("userId");

  if (typeof userId !== "string" || !userId) {
    usersRedirect("Choose a valid account.");
  }

  if (userId === actor.user.id) {
    usersRedirect("You cannot suspend your own account.");
  }

  const isSuperAdminActor = isSuperAdmin(actor.user.role);

  const result = await prisma.$transaction(
    async (tx) => {
      const target = await tx.user.findUnique({
        where: { id: userId },
        select: { role: true, banned: true },
      });

      if (!target) {
        return "missing";
      }

      if ((target.role === "super_admin" || target.role === "admin") && !isSuperAdminActor) {
        return "administrator";
      }

      if (target.banned) {
        return "already-suspended";
      }

      if (target.role === "admin") {
        const activeAdmins = await tx.user.count({
          where: { role: "admin", banned: false },
        });

        if (activeAdmins <= 1) {
          return "last-admin";
        }
      }

      if (target.role === "super_admin") {
        const activeSuperAdmins = await tx.user.count({
          where: { role: "super_admin", banned: false },
        });

        if (activeSuperAdmins <= 1) {
          return "last-super-admin";
        }
      }

      await tx.user.update({
        where: { id: userId },
        data: {
          banned: true,
          banReason: "Suspended by a training administrator.",
          banExpires: null,
        },
      });
      await tx.session.deleteMany({ where: { userId } });
      await tx.userAuditLog.create({
        data: {
          actorUserId: actor.user.id,
          targetUserId: userId,
          action: "USER_SUSPENDED",
        },
      });

      return "suspended";
    },
    { isolationLevel: "Serializable" },
  );

  if (result === "missing") {
    usersRedirect("The selected account could not be found.");
  }

  if (result === "already-suspended") {
    usersRedirect("This account is already suspended.");
  }

  if (result === "last-admin") {
    usersRedirect("At least one active administrator must remain.");
  }

  if (result === "last-super-admin") {
    usersRedirect("At least one active super administrator must remain.");
  }

  if (result === "administrator") {
    usersRedirect("Only a super administrator can suspend administrator accounts.");
  }

  revalidatePath("/dashboard/users");
  usersRedirect("Account suspended and active sessions revoked.");
}

export async function restoreManagedUserAction(formData: FormData): Promise<void> {
  const actor = await requireAdmin();
  const userId = formData.get("userId");

  if (typeof userId !== "string" || !userId) {
    usersRedirect("Choose a valid account.");
  }

  const isSuperAdminActor = isSuperAdmin(actor.user.role);

  const result = await prisma.$transaction(async (tx) => {
    const target = await tx.user.findUnique({
      where: { id: userId },
      select: { banned: true, role: true },
    });

    if (!target) {
      return "missing";
    }

    if ((target.role === "super_admin" || target.role === "admin") && !isSuperAdminActor) {
      return "administrator";
    }

    if (!target.banned) {
      return "already-active";
    }

    await tx.user.update({
      where: { id: userId },
      data: { banned: false, banReason: null, banExpires: null },
    });
    await tx.userAuditLog.create({
      data: {
        actorUserId: actor.user.id,
        targetUserId: userId,
        action: "USER_RESTORED",
      },
    });

    return "restored";
  });

  if (result === "missing") {
    usersRedirect("The selected account could not be found.");
  }

  if (result === "already-active") {
    usersRedirect("This account is already active.");
  }

  if (result === "administrator") {
    usersRedirect("Only a super administrator can restore administrator accounts.");
  }

  revalidatePath("/dashboard/users");
  usersRedirect("Account restored.");
}

export async function changeInitialPasswordAction(formData: FormData): Promise<void> {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  if (!user?.mustChangePassword) {
    redirect("/dashboard");
  }

  const parsed = initialPasswordSchema.safeParse(Object.fromEntries(formData));

  if (!parsed.success) {
    redirect("/change-password?error=invalid");
  }

  try {
    await auth.api.changePassword({
      headers: await headers(),
      body: {
        currentPassword: parsed.data.currentPassword,
        newPassword: parsed.data.newPassword,
        revokeOtherSessions: true,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      redirect("/change-password?error=password");
    }

    throw error;
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { mustChangePassword: false },
  });

  redirect("/dashboard");
}
