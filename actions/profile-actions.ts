"use server";

import { revalidatePath } from "next/cache";
import { profileUpdateSchema } from "@/lib/auth-schema";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/session";

export type ProfileActionResult = { success: boolean; message: string };

export async function updateOwnProfileAction(formData: FormData): Promise<ProfileActionResult> {
  const session = await requireAuthenticatedUser();
  const parsed = profileUpdateSchema.safeParse({
    name: formData.get("name"),
    qualifications: formData.get("qualifications"),
    achievements: formData.get("achievements"),
    experience: formData.get("experience"),
  });
  if (!parsed.success) {
    return {
      success: false,
      message: parsed.error.issues[0]?.message ?? "Review the profile fields.",
    };
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: parsed.data.name,
      qualifications: parsed.data.qualifications || null,
      achievements: parsed.data.achievements || null,
      experience: parsed.data.experience || null,
    },
  });

  revalidatePath(`/dashboard/profile/${session.user.id}`);
  revalidatePath("/dashboard/profile");
  revalidatePath("/profile");
  revalidatePath("/dashboard");
  return { success: true, message: "Your profile has been updated." };
}
