import { Bell, BellOff, Check } from "lucide-react";
import { markNotificationReadAction, openNotificationAction } from "@/actions/notification-actions";
import { prisma } from "@/lib/prisma";
import { requireAuthenticatedUser } from "@/lib/session";
import { formatDateWithOptions } from "@/utils/date-time";

export const instant = false;

export default async function NotificationsPage() {
  const session = await requireAuthenticatedUser();
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      title: true,
      message: true,
      createdAt: true,
      readAt: true,
    },
  });

  return (
    <main className="mx-auto max-w-4xl space-y-6 px-4 py-8 sm:px-6 lg:px-8">
      <header>
        <p className="text-primary flex items-center gap-2 text-sm font-semibold">
          <Bell aria-hidden="true" className="size-4" />
          Your updates
        </p>
        <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">Notifications</h1>
        <p className="text-muted-foreground mt-2 text-sm leading-6">
          Course announcements and updates for your learning.
        </p>
      </header>

      {notifications.length ? (
        <ul className="border-border bg-card divide-border divide-y overflow-hidden rounded-xl border">
          {notifications.map((notification) => (
            <li
              key={notification.id}
              className={`flex items-center gap-3 px-5 py-4 ${
                notification.readAt ? "" : "bg-accent/30"
              }`}
            >
              <form action={openNotificationAction} className="min-w-0 flex-1">
                <input type="hidden" name="notificationId" value={notification.id} />
                <button
                  type="submit"
                  className="hover:bg-accent/50 flex w-full items-start gap-4 rounded-lg p-2 text-left transition-colors"
                >
                  <span
                    aria-hidden="true"
                    className={`mt-1.5 size-2 shrink-0 rounded-full ${
                      notification.readAt ? "bg-transparent" : "bg-primary"
                    }`}
                  />
                  <span className="min-w-0 flex-1">
                    <span className="text-card-foreground block font-semibold">
                      {notification.title}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-sm leading-6">
                      {notification.message}
                    </span>
                    <time
                      className="text-muted-foreground mt-2 block text-xs"
                      dateTime={notification.createdAt.toISOString()}
                    >
                      {formatDateWithOptions(
                        notification.createdAt,
                        {
                          dateStyle: "medium",
                          timeStyle: "short",
                        },
                        "en",
                      )}
                    </time>
                  </span>
                </button>
              </form>
              {!notification.readAt ? (
                <form action={markNotificationReadAction} className="shrink-0">
                  <input type="hidden" name="notificationId" value={notification.id} />
                  <button
                    type="submit"
                    aria-label={`Mark ${notification.title} as read`}
                    className="border-border text-muted-foreground hover:bg-accent hover:text-foreground inline-flex min-h-9 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-semibold transition-colors sm:px-3"
                  >
                    <Check aria-hidden="true" className="size-3.5" />
                    <span className="hidden sm:inline">Mark as read</span>
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <div className="border-border bg-card rounded-xl border border-dashed px-5 py-12 text-center">
          <BellOff aria-hidden="true" className="text-muted-foreground mx-auto size-8" />
          <p className="text-card-foreground mt-3 font-semibold">You&apos;re all caught up</p>
          <p className="text-muted-foreground mt-1 text-sm">Course updates will appear here.</p>
        </div>
      )}
    </main>
  );
}
