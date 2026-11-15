"use client";

import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  CalendarCheck,
  ClipboardCheck,
  FileBarChart,
  GraduationCap,
  Handshake,
  LayoutDashboard,
  LogOut,
  Menu,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { signOutAction } from "@/actions/auth-actions";
import {
  NotificationBell,
  type NotificationPreview,
} from "@/components/dashboard/notification-bell";
import { ThemeToggle } from "@/components/theme-toggle";
import { canManageUsers, getRoleLabel } from "@/lib/roles";

const sections = [
  { label: "Dashboard", href: "/dashboard#overview", icon: LayoutDashboard },
  { label: "My learning", href: "/dashboard/learning", icon: BookOpen },
  { label: "My profile", href: "/dashboard/profile", icon: UserRound },
  { label: "Training catalog", href: "/dashboard/courses", icon: GraduationCap },
  { label: "Speaker evaluations", href: "/dashboard/evaluations", icon: ClipboardCheck },
  { label: "Calendar", href: "/dashboard/calendar", icon: CalendarDays },
  { label: "Reports", href: "/dashboard/reports", icon: FileBarChart },
];

function InitialBadge({ name }: { name: string }) {
  return (
    <span className="bg-primary text-primary-foreground flex size-9 shrink-0 items-center justify-center rounded-full text-sm font-bold">
      {name.trim().charAt(0).toUpperCase() || "U"}
    </span>
  );
}

function DashboardSidebar({
  name,
  role,
  pendingLearnInBranchCount,
  mobile = false,
  onNavigate,
}: {
  name: string;
  role: string;
  pendingLearnInBranchCount: number;
  mobile?: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const managementSections = canManageUsers(role)
    ? [
        { label: "Attendance", href: "/dashboard/attendance", icon: CalendarCheck },
        { label: "Users and roles", href: "/dashboard/users", icon: UsersRound },
      ]
    : [];
  const learnInBranchSection =
    role === "participant"
      ? [
          {
            label: "Learn in the Branch",
            href: "/dashboard/learning/learn-in-branch",
            icon: Handshake,
          },
        ]
      : role === "branch_manager"
        ? [
            {
              label: "Branch learning approvals",
              href: "/dashboard/learning/learn-in-branch",
              icon: Handshake,
            },
          ]
        : canManageUsers(role)
          ? [
              {
                label: "Learn in the Branch deadlines",
                href: "/dashboard/learning/learn-in-branch",
                icon: Handshake,
              },
            ]
          : [];
  const visibleSections = [...sections, ...managementSections, ...learnInBranchSection];
  const allowedSections =
    role === "participant" || role === "teacher" || canManageUsers(role)
      ? visibleSections
      : visibleSections.filter((section) => section.href !== "/dashboard/evaluations");

  return (
    <div className="flex h-full flex-col">
      <Link
        href="/"
        className="border-sidebar-border flex h-[4.5rem] items-center gap-3 border-b px-5"
        onClick={onNavigate}
      >
        <span className="bg-sidebar-primary text-sidebar-primary-foreground flex size-9 items-center justify-center rounded-xl">
          <BookOpenCheck aria-hidden="true" className="size-5" />
        </span>
        <span className="leading-tight">
          <span className="text-sidebar-foreground block text-sm font-bold">AIBTI</span>
          <span className="text-muted-foreground text-[11px] font-medium">Training Institute</span>
        </span>
      </Link>

      <nav
        aria-label={mobile ? "Mobile dashboard navigation" : "Dashboard navigation"}
        className="dashboard-sidebar-nav min-h-0 flex-1 space-y-1 overflow-y-auto px-3 py-5"
      >
        <p className="text-muted-foreground px-3 pb-2 text-[10px] font-bold tracking-[0.16em] uppercase">
          Workspace
        </p>
        {allowedSections.map(({ label, href, icon: Icon }) => {
          const route = href.split("#")[0];
          const isActive =
            (href === "/dashboard#overview" && pathname === "/dashboard") ||
            (!href.includes("#") &&
              (pathname === route || (route !== "/dashboard" && pathname.startsWith(`${route}/`))));

          return (
            <Link
              key={href}
              href={href}
              onClick={onNavigate}
              aria-current={isActive ? "page" : undefined}
              className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition-colors ${
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground"
                  : "text-muted-foreground hover:bg-sidebar-accent/70 hover:text-sidebar-foreground"
              }`}
            >
              <Icon aria-hidden="true" className="size-4" />
              {label}
              {href === "/dashboard/learning/learn-in-branch" &&
              role === "branch_manager" &&
              pendingLearnInBranchCount > 0 ? (
                <span className="bg-primary text-primary-foreground ml-auto rounded-full px-2 py-0.5 text-[10px] font-bold">
                  {pendingLearnInBranchCount}
                </span>
              ) : null}
              {isActive ? <span className="bg-brand-600 ml-auto size-1.5 rounded-full" /> : null}
            </Link>
          );
        })}
      </nav>

      <div className="border-sidebar-border border-t p-4">
        <div className="flex min-w-0 items-center gap-3">
          <InitialBadge name={name} />
          <span className="min-w-0 flex-1">
            <span className="text-sidebar-foreground block truncate text-sm font-semibold">
              {name}
            </span>
            <span className="text-muted-foreground block text-xs">{getRoleLabel(role)}</span>
          </span>
          {mobile ? null : (
            <form action={signOutAction}>
              <button
                type="submit"
                aria-label="Sign out"
                title="Sign out"
                className="text-muted-foreground hover:bg-accent hover:text-foreground focus-visible:outline-ring flex size-9 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                <LogOut aria-hidden="true" className="size-4" />
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export function DashboardShell({
  name,
  email,
  role,
  pendingLearnInBranchCount,
  notifications,
  unreadNotificationCount,
  children,
}: {
  name: string;
  email: string;
  role: string;
  pendingLearnInBranchCount: number;
  notifications: NotificationPreview[];
  unreadNotificationCount: number;
  children: ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const pageTitle =
    pathname === "/dashboard/learning"
      ? "My learning"
      : pathname.startsWith("/dashboard/courses")
        ? "Training catalog"
        : pathname.startsWith("/dashboard/evaluations")
          ? "Speaker evaluations"
          : pathname.startsWith("/dashboard/learning/learn-in-branch")
            ? "Learn in the Branch"
            : pathname.startsWith("/dashboard/attendance")
              ? "Attendance"
              : pathname.startsWith("/dashboard/users")
                ? "Users and roles"
                : pathname.startsWith("/dashboard/profile")
                  ? "Profile"
                  : pathname.startsWith("/dashboard/notifications")
                    ? "Notifications"
                    : pathname.startsWith("/dashboard/calendar")
                      ? "Calendar"
                      : pathname.startsWith("/dashboard/reports")
                        ? "Reports"
                        : "Dashboard";

  return (
    <div className="bg-background min-h-screen">
      <aside className="border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-30 hidden w-64 border-r md:block">
        <DashboardSidebar
          name={name}
          role={role}
          pendingLearnInBranchCount={pendingLearnInBranchCount}
        />
      </aside>

      {mobileMenuOpen ? (
        <>
          <button
            type="button"
            aria-label="Close navigation menu"
            className="fixed inset-0 z-40 bg-slate-950/40 md:hidden"
            onClick={() => setMobileMenuOpen(false)}
          />
          <aside className="border-sidebar-border bg-sidebar fixed inset-y-0 left-0 z-50 w-[min(19rem,88vw)] border-r shadow-2xl md:hidden">
            <div className="absolute top-3 right-3">
              <button
                type="button"
                aria-label="Close navigation menu"
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:bg-accent flex size-9 items-center justify-center rounded-lg"
              >
                <X aria-hidden="true" className="size-5" />
              </button>
            </div>
            <DashboardSidebar
              name={name}
              role={role}
              pendingLearnInBranchCount={pendingLearnInBranchCount}
              mobile
              onNavigate={() => setMobileMenuOpen(false)}
            />
            <div className="px-4 pb-4">
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="border-border text-foreground min-h-11 w-full rounded-xl border text-sm font-semibold"
                >
                  Sign out
                </button>
              </form>
            </div>
          </aside>
        </>
      ) : null}

      <div className="min-h-screen md:pl-64">
        <header className="border-border bg-background/90 sticky top-0 z-20 flex h-[4.5rem] items-center justify-between border-b px-4 backdrop-blur-xl sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              aria-label={mobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
              className="text-foreground hover:bg-accent focus-visible:outline-ring flex size-10 shrink-0 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 md:hidden"
            >
              {mobileMenuOpen ? (
                <X aria-hidden="true" className="size-5" />
              ) : (
                <Menu aria-hidden="true" className="size-5" />
              )}
            </button>
            <div className="hidden items-center gap-2 text-sm sm:flex">
              <span className="text-foreground font-semibold">{pageTitle}</span>
              <span className="text-muted-foreground">Learning workspace</span>
            </div>
            <span className="truncate text-sm font-semibold sm:hidden">{pageTitle}</span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <span className="text-muted-foreground hidden max-w-48 truncate text-sm lg:block">
              {email}
            </span>
            <NotificationBell notifications={notifications} unreadCount={unreadNotificationCount} />
            <ThemeToggle />
            <span className="hidden sm:block">
              <InitialBadge name={name} />
            </span>
          </div>
        </header>
        {children}
      </div>
    </div>
  );
}
