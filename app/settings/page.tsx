import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { requireAuthenticatedUser } from "@/lib/session";

export const instant = false;

export default async function SettingsPage() {
  await requireAuthenticatedUser();

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <Link href="/dashboard" className="text-primary text-sm font-semibold hover:underline">
        Back to dashboard
      </Link>
      <h1 className="text-foreground mt-6 text-3xl font-bold tracking-tight">Settings</h1>
      <section className="bg-card border-border mt-6 flex items-center justify-between gap-4 rounded-2xl border p-6 shadow-sm">
        <div>
          <h2 className="text-card-foreground font-semibold">Appearance</h2>
          <p className="text-muted-foreground mt-1 text-sm">
            Choose a light or dark theme for the learning portal.
          </p>
        </div>
        <ThemeToggle />
      </section>
    </main>
  );
}
