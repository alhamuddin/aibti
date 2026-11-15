"use client";

import { Bell, Check, ChevronRight } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { markNotificationReadAction, openNotificationAction } from "@/actions/notification-actions";

export type NotificationPreview = {
  id: string;
  title: string;
  message: string;
  href: string;
  createdAt: string;
  createdAtLabel: string;
  readAt: string | null;
};

export function NotificationBell({
  notifications,
  unreadCount,
}: {
  notifications: NotificationPreview[];
  unreadCount: number;
}) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <button
        type="button"
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        aria-controls="notification-popover"
        onClick={() => setIsOpen((open) => !open)}
        className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-ring relative flex size-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
      >
        <Bell aria-hidden="true" className="size-5" />
        {unreadCount ? (
          <span className="bg-destructive absolute -top-0.5 -right-0.5 min-w-5 rounded-full px-1 text-[10px] leading-5 font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <section
          id="notification-popover"
          aria-label="Recent notifications"
          className="border-border bg-popover absolute top-full right-0 z-50 mt-2 w-[min(24rem,calc(100vw-2rem))] overflow-hidden rounded-xl border shadow-xl"
        >
          <header className="border-border flex items-center justify-between border-b px-4 py-3">
            <h2 className="text-popover-foreground text-sm font-semibold">Notifications</h2>
            {unreadCount ? (
              <span className="text-muted-foreground text-xs">{unreadCount} unread</span>
            ) : null}
          </header>

          {notifications.length ? (
            <ul className="max-h-[min(26rem,65vh)] overflow-y-auto">
              {notifications.map((notification) => (
                <li
                  key={notification.id}
                  className="border-border flex items-center gap-2 border-b px-3 last:border-b-0"
                >
                  <form action={openNotificationAction} className="min-w-0 flex-1">
                    <input type="hidden" name="notificationId" value={notification.id} />
                    <button
                      type="submit"
                      className="hover:bg-accent/70 flex min-h-20 w-full gap-3 rounded-lg px-1 py-3 text-left transition-colors"
                    >
                      <span
                        aria-hidden="true"
                        className={`mt-1.5 size-2 shrink-0 rounded-full ${
                          notification.readAt ? "bg-transparent" : "bg-primary"
                        }`}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="text-popover-foreground block text-sm font-semibold">
                          {notification.title}
                        </span>
                        <span className="text-muted-foreground mt-1 line-clamp-2 block text-xs leading-5">
                          {notification.message}
                        </span>
                        <time
                          className="text-muted-foreground mt-1 block text-[11px]"
                          dateTime={notification.createdAt}
                        >
                          {notification.createdAtLabel}
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
                        className="text-muted-foreground hover:bg-accent hover:text-foreground flex size-9 items-center justify-center rounded-lg transition-colors"
                        title="Mark as read"
                      >
                        <Check aria-hidden="true" className="size-4" />
                      </button>
                    </form>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground px-4 py-8 text-center text-sm">
              You don&apos;t have any notifications yet.
            </p>
          )}

          <Link
            href="/dashboard/notifications"
            onClick={() => setIsOpen(false)}
            className="text-primary hover:bg-accent/70 flex min-h-11 items-center justify-center gap-1 px-4 text-sm font-semibold"
          >
            Show all notifications
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </section>
      ) : null}
    </div>
  );
}
