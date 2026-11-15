"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/session";

export async function markNotificationReadAction(formData: FormData) {
  const session = await requireAuthenticatedUser();
  const notificationId = formData.get("notificationId");

  if (typeof notificationId !== "string" || !notificationId) {
    redirect("/dashboard/notifications");
  }

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  revalidatePath("/dashboard");
  revalidatePath("/dashboard/notifications");
}

export async function openNotificationAction(formData: FormData) {
  const session = await requireAuthenticatedUser();
  const notificationId = formData.get("notificationId");

  if (typeof notificationId !== "string" || !notificationId) {
    redirect("/dashboard/notifications");
  }

  const notification = await prisma.notification.findFirst({
    where: { id: notificationId, userId: session.user.id },
    select: { id: true, href: true },
  });

  if (!notification) redirect("/dashboard/notifications");

  await prisma.notification.updateMany({
    where: { id: notification.id, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  });

  const href =
    notification.href.startsWith("/dashboard/") && !notification.href.startsWith("//")
      ? notification.href
      : "/dashboard/notifications";
  redirect(href);
}
