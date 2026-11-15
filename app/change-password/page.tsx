import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { changeInitialPasswordAction } from "@/actions/user-admin-actions";

export const instant = false;

export default async function ChangePasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    select: { mustChangePassword: true },
  });

  if (!user.mustChangePassword) {
    redirect("/dashboard");
  }

  const { error } = await searchParams;

  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section
        aria-labelledby="change-password-heading"
        className="bg-card/95 text-card-foreground w-full max-w-md rounded-3xl border border-white/35 p-7 shadow-[0_24px_80px_rgba(4,32,34,0.2)] backdrop-blur-sm sm:p-10"
      >
        <p className="text-primary mb-3 text-center text-xs font-semibold tracking-[0.24em] uppercase">
          AIBTI · Account security
        </p>
        <h1
          id="change-password-heading"
          className="text-card-foreground text-center text-3xl font-semibold tracking-tight"
        >
          Set your password
        </h1>
        <p className="text-muted-foreground mt-3 text-center text-sm leading-6">
          For your security, replace the initial password before continuing to the learning portal.
          Use at least 10 characters.
        </p>

        {error ? (
          <p
            role="alert"
            className="bg-destructive/10 text-destructive mt-6 rounded-xl px-4 py-3 text-sm"
          >
            {error === "password"
              ? "The initial password could not be verified. Check it and try again."
              : "Enter a matching new password with at least 10 characters."}
          </p>
        ) : null}

        <form action={changeInitialPasswordAction} className="mt-7 space-y-4">
          <label className="text-foreground block text-sm font-medium">
            Initial password
            <input
              name="currentPassword"
              type="password"
              autoComplete="current-password"
              required
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="text-foreground block text-sm font-medium">
            New password
            <input
              name="newPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <label className="text-foreground block text-sm font-medium">
            Confirm new password
            <input
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              minLength={10}
              maxLength={128}
              required
              className="border-input bg-background text-foreground focus-visible:ring-ring mt-2 min-h-11 w-full rounded-xl border px-3 text-sm outline-none focus-visible:ring-2"
            />
          </label>
          <button
            type="submit"
            className="bg-primary text-primary-foreground hover:bg-primary/90 min-h-11 w-full rounded-xl px-4 text-sm font-semibold"
          >
            Change password and continue
          </button>
        </form>
      </section>
    </main>
  );
}
