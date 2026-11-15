"use server";

import { APIError } from "better-auth/api";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { signInSchema, type AuthActionResult } from "@/lib/auth-schema";
import { prisma } from "@/lib/prisma";

function getSafeLoginRedirect(value?: string): string {
  if (!value) return "/dashboard";
  try {
    const url = new URL(value, "http://localhost");
    if (url.origin === "http://localhost" && url.pathname === "/dashboard/attendance/check-in") {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    return "/dashboard";
  }
  return "/dashboard";
}

export async function signInAction(input: unknown, redirectTo?: string): Promise<AuthActionResult> {
  const parsed = signInSchema.safeParse(input);

  if (!parsed.success) {
    return { success: false, message: "Check your email and password, then try again." };
  }
  const callbackURL = getSafeLoginRedirect(redirectTo);

  try {
    await auth.api.signInEmail({
      body: {
        email: parsed.data.email,
        password: parsed.data.password,
        callbackURL,
      },
    });
  } catch (error) {
    if (error instanceof APIError) {
      return { success: false, message: "Email or password is incorrect." };
    }

    throw error;
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { email: parsed.data.email },
    select: { mustChangePassword: true },
  });

  redirect(user.mustChangePassword ? "/change-password" : callbackURL);
}

export async function signUpAction(_input: unknown): Promise<AuthActionResult> {
  void _input;
  return {
    success: false,
    message: "Accounts are created by AIBTI administrators. Contact your training administrator.",
  };
}

export async function signOutAction(): Promise<void> {
  await auth.api.signOut({
    headers: await headers(),
  });

  redirect("/login");
}
