import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/session";
import { formatDateWithOptions } from "@/utils/date-time";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "participant";
  const [branch, unreadNotificationCount, recentNotifications] = await Promise.all([
    role === "branch_manager"
      ? prisma.branch.findUnique({
          where: { managerUserId: session.user.id },
          select: {
            _count: {
              select: {
                learnInBranchReports: { where: { status: "PENDING_APPROVAL" } },
              },
            },
          },
        })
      : Promise.resolve(null),
    prisma.notification.count({
      where: { userId: session.user.id, readAt: null },
    }),
    prisma.notification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 7,
      select: {
        id: true,
        title: true,
        message: true,
        href: true,
        createdAt: true,
        readAt: true,
      },
    }),
  ]);
  const notifications = recentNotifications.map((notification) => ({
    ...notification,
    createdAt: notification.createdAt.toISOString(),
    createdAtLabel: formatDateWithOptions(
      notification.createdAt,
      {
        dateStyle: "medium",
        timeStyle: "short",
      },
      "en",
    ),
    readAt: notification.readAt?.toISOString() ?? null,
  }));

  return (
    <DashboardShell
      name={session.user.name}
      email={session.user.email}
      role={role}
      pendingLearnInBranchCount={branch?._count.learnInBranchReports ?? 0}
      notifications={notifications}
      unreadNotificationCount={unreadNotificationCount}
    >
      {children}
    </DashboardShell>
  );
}
