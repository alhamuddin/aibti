import { CalendarDays, ChevronLeft, ChevronRight, Shield, UserRound } from "lucide-react";
import Link from "next/link";
import {
  banManagedUserAction,
  changeManagedUserRoleAction,
  createManagedUserAction,
  restoreManagedUserAction,
  updateManagedUserEmployeeIdAction,
} from "@/actions/user-admin-actions";
import { prisma } from "@/lib/prisma";
import { getRoleLabel, isSuperAdmin, roleOptions } from "@/lib/roles";
import { requireAdmin } from "@/lib/session";
import { formatDate } from "@/utils/date-time";

export const instant = false;

const pageSize = 25;

export default async function UserManagementPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; notice?: string }>;
}) {
  const session = await requireAdmin();
  const superAdmin = isSuperAdmin(session.user.role);
  const availableRoles = superAdmin
    ? roleOptions
    : roleOptions.filter((role) => role.value !== "admin" && role.value !== "super_admin");
  const params = await searchParams;
  const query = params.q?.trim().slice(0, 100) ?? "";
  const requestedPage = Number.parseInt(params.page ?? "1", 10);
  const currentPage = Number.isSafeInteger(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const where = query
    ? {
        OR: [
          { name: { contains: query, mode: "insensitive" as const } },
          { email: { contains: query, mode: "insensitive" as const } },
          { employeeId: { contains: query, mode: "insensitive" as const } },
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

  const [totalUsers, users, auditLogs, branches] = await Promise.all([
    prisma.user.count({ where }),
    prisma.user.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (currentPage - 1) * pageSize,
      take: pageSize,
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        phone: true,
        role: true,
        banned: true,
        mustChangePassword: true,
        createdAt: true,
        isMock: true,
        branch: { select: { id: true, code: true, name: true } },
        _count: { select: { accounts: true } },
      },
    }),
    prisma.userAuditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
      include: {
        actor: { select: { name: true } },
        target: { select: { name: true, email: true } },
      },
    }),
    prisma.branch.findMany({
      orderBy: { code: "asc" },
      select: { id: true, code: true, name: true, managerUserId: true },
    }),
  ]);
  const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
  const previousPage = Math.max(1, currentPage - 1);
  const nextPage = Math.min(totalPages, currentPage + 1);

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <div>
        <Link href="/dashboard" className="text-primary text-sm font-semibold hover:underline">
          Back to dashboard
        </Link>
        <div className="mt-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-primary flex items-center gap-2 text-sm font-semibold">
              <Shield aria-hidden="true" className="size-4" />
              Identity and access
            </p>
            <h1 className="text-foreground mt-2 text-3xl font-bold tracking-tight">
              Users and roles
            </h1>
            <p className="text-muted-foreground mt-2 max-w-2xl text-sm leading-6">
              Create institute-managed accounts, assign least-privilege roles, and suspend access
              without deleting training history.
            </p>
          </div>
          <p className="text-muted-foreground text-sm">
            {totalUsers.toLocaleString()} account{totalUsers === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      {params.notice ? (
        <p
          role="status"
          className="border-primary/20 bg-accent text-accent-foreground rounded-xl border px-4 py-3 text-sm"
        >
          {params.notice}
        </p>
      ) : null}

      <section className="border-border bg-card rounded-2xl border p-5 shadow-sm sm:p-6">
        <div className="mb-5">
          <h2 className="text-card-foreground text-lg font-semibold">Create a user account</h2>
          <p className="text-muted-foreground mt-1 text-sm leading-6">
            Set an initial password and share it with the employee through an approved channel. They
            must replace it at first sign-in.
          </p>
        </div>
        <form action={createManagedUserAction} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-8">
          <label className="text-foreground text-sm font-medium">
            Full name
            <input
              required
              name="name"
              minLength={2}
              maxLength={80}
              autoComplete="name"
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="text-foreground text-sm font-medium">
            Work email
            <input
              required
              name="email"
              type="email"
              autoComplete="email"
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="text-foreground text-sm font-medium">
            Employee ID
            <input
              required
              name="employeeId"
              maxLength={80}
              autoComplete="off"
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="text-foreground text-sm font-medium">
            Phone number
            <input
              name="phone"
              type="tel"
              maxLength={30}
              autoComplete="tel"
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="text-foreground text-sm font-medium">
            Initial password
            <input
              required
              name="password"
              type="password"
              minLength={10}
              maxLength={128}
              autoComplete="new-password"
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="text-foreground text-sm font-medium">
            Role
            <select
              name="role"
              defaultValue="participant"
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            >
              {availableRoles.map((role) => (
                <option key={role.value} value={role.value}>
                  {role.label}
                </option>
              ))}
            </select>
          </label>
          <label className="text-foreground text-sm font-medium">
            Branch assignment
            <select
              name="branchId"
              defaultValue=""
              className="border-input bg-background text-foreground mt-2 min-h-11 w-full rounded-xl border px-3 text-sm"
            >
              <option value="">No branch</option>
              {branches.map((branch) => (
                <option key={branch.id} value={branch.id}>
                  {branch.code} · {branch.name}
                  {branch.managerUserId ? " (manager assigned)" : ""}
                </option>
              ))}
            </select>
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 w-full rounded-xl px-4 text-sm font-semibold"
            >
              Create account
            </button>
          </div>
        </form>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {roleOptions.map((role) => (
          <article
            key={role.value}
            className="border-border bg-card rounded-2xl border p-4 shadow-sm"
          >
            <h2 className="text-card-foreground text-sm font-semibold">{role.label}</h2>
            <p className="text-muted-foreground mt-1.5 text-xs leading-5">{role.description}</p>
          </article>
        ))}
      </section>

      <section className="border-border bg-card overflow-hidden rounded-2xl border shadow-sm">
        <div className="border-border flex flex-wrap items-center justify-between gap-3 border-b px-5 py-4">
          <div>
            <h2 className="text-card-foreground font-semibold">Accounts</h2>
            <p className="text-muted-foreground mt-1 text-xs">
              Showing page {currentPage} of {totalPages}
            </p>
          </div>
          <form action="/dashboard/users" className="flex gap-2">
            <input
              name="q"
              type="search"
              defaultValue={query}
              placeholder="Search name or email"
              aria-label="Search users by name or email"
              className="border-input bg-background text-foreground min-h-10 w-56 rounded-lg border px-3 text-sm"
            />
            <button
              type="submit"
              className="border-border text-foreground hover:bg-accent min-h-10 rounded-lg border px-3 text-sm font-medium"
            >
              Search
            </button>
          </form>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-sm">
            <thead className="bg-muted/70 text-muted-foreground text-xs uppercase">
              <tr>
                <th scope="col" className="px-5 py-3 font-semibold">
                  User
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Employee ID
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Role
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Branch
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Status
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Created
                </th>
                <th scope="col" className="px-5 py-3 font-semibold">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-border divide-y">
              {users.map((user) => (
                <tr key={user.id} className="align-top">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <span className="bg-secondary text-secondary-foreground flex size-9 shrink-0 items-center justify-center rounded-full">
                        <UserRound aria-hidden="true" className="size-4" />
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/dashboard/profile/${user.id}`}
                          className="text-card-foreground block font-semibold hover:underline"
                        >
                          {user.name}
                        </Link>
                        <span className="text-muted-foreground mt-0.5 block">{user.email}</span>
                      </span>
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <form
                      action={updateManagedUserEmployeeIdAction}
                      className="flex items-center gap-2"
                    >
                      <input type="hidden" name="userId" value={user.id} />
                      <input
                        required
                        name="employeeId"
                        defaultValue={user.employeeId ?? ""}
                        maxLength={80}
                        aria-label={`Employee ID for ${user.name}`}
                        className="border-input bg-background text-foreground min-h-9 w-36 rounded-lg border px-2 text-xs"
                      />
                      <button
                        type="submit"
                        className="text-primary text-xs font-semibold hover:underline"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="px-5 py-4">
                    <form action={changeManagedUserRoleAction} className="flex items-center gap-2">
                      <input type="hidden" name="userId" value={user.id} />
                      <select
                        name="role"
                        defaultValue={user.role}
                        aria-label={`Role for ${user.name}`}
                        className="border-input bg-background text-foreground min-h-9 rounded-lg border px-2 text-xs"
                        disabled={
                          !superAdmin && (user.role === "admin" || user.role === "super_admin")
                        }
                      >
                        {availableRoles.map((role) => (
                          <option key={role.value} value={role.value}>
                            {role.label}
                          </option>
                        ))}
                      </select>
                      <select
                        name="branchId"
                        defaultValue={user.branch?.id ?? ""}
                        aria-label={`Branch for ${user.name}`}
                        className="border-input bg-background text-foreground min-h-9 max-w-24 rounded-lg border px-2 text-xs"
                      >
                        <option value="">No branch</option>
                        {branches.map((branch) => (
                          <option key={branch.id} value={branch.id}>
                            {branch.code}
                          </option>
                        ))}
                      </select>
                      <button
                        type="submit"
                        disabled={
                          !superAdmin && (user.role === "admin" || user.role === "super_admin")
                        }
                        className="text-primary disabled:text-muted-foreground text-xs font-semibold hover:underline"
                      >
                        Save
                      </button>
                    </form>
                  </td>
                  <td className="text-muted-foreground px-5 py-4">
                    {user.branch ? `${user.branch.code} · ${user.branch.name}` : "—"}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                        user.banned
                          ? "bg-destructive/10 text-destructive"
                          : "bg-accent text-accent-foreground"
                      }`}
                    >
                      {user.banned ? "Suspended" : "Active"}
                    </span>
                    {user.mustChangePassword ? (
                      <span className="text-muted-foreground mt-1 block text-xs">
                        Password change required
                      </span>
                    ) : null}
                    {user.isMock && user._count.accounts === 0 ? (
                      <span className="text-muted-foreground mt-1 block text-xs">
                        Mock profile · no sign-in credentials
                      </span>
                    ) : null}
                  </td>
                  <td className="text-muted-foreground px-5 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays aria-hidden="true" className="size-3.5" />
                      {formatDate(user.createdAt)}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <form action={user.banned ? restoreManagedUserAction : banManagedUserAction}>
                      <input type="hidden" name="userId" value={user.id} />
                      <button
                        type="submit"
                        className={`text-xs font-semibold hover:underline ${
                          user.banned ? "text-primary" : "text-destructive"
                        }`}
                      >
                        {user.banned ? "Restore access" : "Suspend"}
                      </button>
                    </form>
                  </td>
                </tr>
              ))}
              {users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-muted-foreground px-5 py-12 text-center">
                    No user accounts match this search.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>

        <div className="border-border flex items-center justify-between border-t px-5 py-4">
          <Link
            aria-disabled={currentPage === 1}
            className={`inline-flex items-center gap-1 text-sm font-medium ${
              currentPage === 1 ? "text-muted-foreground pointer-events-none" : "text-primary"
            }`}
            href={`/dashboard/users?page=${previousPage}&q=${encodeURIComponent(query)}`}
          >
            <ChevronLeft aria-hidden="true" className="size-4" />
            Previous
          </Link>
          <span className="text-muted-foreground text-xs">
            {users.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}–
            {Math.min(currentPage * pageSize, totalUsers)} of {totalUsers}
          </span>
          <Link
            aria-disabled={currentPage >= totalPages}
            className={`inline-flex items-center gap-1 text-sm font-medium ${
              currentPage >= totalPages
                ? "text-muted-foreground pointer-events-none"
                : "text-primary"
            }`}
            href={`/dashboard/users?page=${nextPage}&q=${encodeURIComponent(query)}`}
          >
            Next
            <ChevronRight aria-hidden="true" className="size-4" />
          </Link>
        </div>
      </section>

      <section className="border-border bg-card rounded-2xl border shadow-sm">
        <div className="border-border border-b px-5 py-4">
          <h2 className="text-card-foreground font-semibold">Recent account activity</h2>
          <p className="text-muted-foreground mt-1 text-xs">
            Account creation, role changes, and access suspensions are retained for audit.
          </p>
        </div>
        {auditLogs.length > 0 ? (
          <ul className="divide-border divide-y">
            {auditLogs.map((entry) => (
              <li
                key={entry.id}
                className="flex flex-wrap items-center justify-between gap-2 px-5 py-3 text-sm"
              >
                <span className="text-card-foreground">
                  <span className="font-semibold">{entry.actor.name}</span>{" "}
                  {entry.action.replaceAll("_", " ").toLowerCase()}{" "}
                  <span className="font-semibold">{entry.target.name}</span>
                  <span className="text-muted-foreground ml-1">({entry.target.email})</span>
                </span>
                <time
                  dateTime={entry.createdAt.toISOString()}
                  className="text-muted-foreground text-xs"
                >
                  {formatDate(entry.createdAt)}
                </time>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-muted-foreground px-5 py-8 text-sm">
            No user administration activity yet.
          </p>
        )}
      </section>

      <p className="text-muted-foreground text-xs leading-5">
        Your current administrator: {session.user.name} · Role:{" "}
        {getRoleLabel(session.user.role ?? "")}
      </p>
    </main>
  );
}
