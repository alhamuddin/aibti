import type { ReactNode } from "react";

type AuthCardProps = {
  children: ReactNode;
};

export function AuthCard({ children }: AuthCardProps) {
  return (
    <main className="auth-page flex min-h-screen items-center justify-center px-4 py-10 sm:px-6">
      <section
        aria-labelledby="auth-heading"
        className="bg-card/95 text-card-foreground w-full max-w-md rounded-3xl border border-white/35 p-7 shadow-[0_24px_80px_rgba(4,32,34,0.2)] backdrop-blur-sm sm:p-10"
      >
        <div className="mb-8 text-center">
          <p className="text-primary mb-3 text-xs font-semibold tracking-[0.24em] uppercase">
            AIBTI · Al-Arafah Islami Bank Training Institute
          </p>
          <h1
            id="auth-heading"
            className="text-card-foreground text-3xl font-semibold tracking-tight"
          >
            Welcome back
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-6">
            Sign in to manage your learning and training.
          </p>
        </div>

        {children}

        <p className="text-muted-foreground mt-7 text-center text-sm">
          Need access? Contact your AIBTI training administrator.
        </p>

        <p className="border-border text-muted-foreground mt-6 border-t pt-5 text-center text-xs leading-5">
          Use your work email address. Access is protected by secure, password-based sign-in.
        </p>
      </section>
    </main>
  );
}
