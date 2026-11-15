import { redirect } from "next/navigation";
import { AuthCard } from "@/components/auth/auth-card";
import { LoginForm } from "@/components/auth/auth-fields";
import { getSession } from "@/lib/session";

export const instant = false;

function getSafeLoginRedirect(value?: string) {
  if (!value) return undefined;
  try {
    const url = new URL(value, "http://localhost");
    if (url.origin === "http://localhost" && url.pathname === "/dashboard/attendance/check-in") {
      return `${url.pathname}${url.search}`;
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackURL?: string }>;
}) {
  const params = await searchParams;
  const session = await getSession();

  if (session) {
    redirect(session.user.mustChangePassword === true ? "/change-password" : "/dashboard");
  }

  return (
    <AuthCard>
      <LoginForm redirectTo={getSafeLoginRedirect(params.callbackURL)} />
    </AuthCard>
  );
}
