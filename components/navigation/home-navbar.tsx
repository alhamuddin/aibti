"use client";

import { BookOpenCheck, Menu, X } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { UserMenu } from "@/components/navigation/user-menu";
import { ThemeToggle } from "@/components/theme-toggle";

const navigation = [
  { label: "Learning areas", href: "#learning-areas" },
  { label: "Banking impact", href: "#impact" },
  { label: "Our approach", href: "#approach" },
  { label: "For every branch", href: "#teams" },
  { label: "About", href: "#about" },
];

export function HomeNavbar({ userName }: { userName?: string }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="border-border/80 bg-background/90 sticky top-0 z-40 border-b backdrop-blur-xl">
      <div className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="focus-visible:outline-ring flex shrink-0 items-center gap-2.5 rounded-md focus-visible:outline-2 focus-visible:outline-offset-4"
          aria-label="Al-Arafah Islami Bank Training Institute home"
        >
          <span className="bg-primary text-primary-foreground flex size-9 items-center justify-center rounded-xl shadow-sm">
            <BookOpenCheck aria-hidden="true" className="size-5" />
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-foreground text-sm font-bold tracking-tight sm:text-base">
              AIBTI
            </span>
            <span className="text-muted-foreground hidden text-[11px] font-medium sm:block">
              Al-Arafah Islami Bank Training Institute
            </span>
          </span>
        </Link>

        <nav aria-label="Main navigation" className="hidden items-center gap-1 lg:flex">
          {navigation.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="text-muted-foreground hover:bg-accent hover:text-accent-foreground focus-visible:outline-ring rounded-lg px-3 py-2 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <div className="hidden shrink-0 items-center gap-2 lg:flex">
          <ThemeToggle />
          {userName ? (
            <UserMenu userName={userName} />
          ) : (
            <>
              <Link
                href="/login"
                className="text-foreground hover:bg-accent rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/login"
                className="bg-primary text-primary-foreground hover:bg-primary/90 focus-visible:outline-ring inline-flex min-h-10 items-center justify-center rounded-xl px-4 text-sm font-semibold shadow-sm transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
              >
                Learning portal
              </Link>
            </>
          )}
        </div>

        <div className="flex shrink-0 items-center gap-1 lg:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="text-foreground hover:bg-accent focus-visible:outline-ring inline-flex size-10 items-center justify-center rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-offset-2"
            aria-label={menuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-home-navigation"
            onClick={() => setMenuOpen((open) => !open)}
          >
            {menuOpen ? (
              <X aria-hidden="true" className="size-5" />
            ) : (
              <Menu aria-hidden="true" className="size-5" />
            )}
          </button>
        </div>
      </div>

      {menuOpen ? (
        <nav
          id="mobile-home-navigation"
          aria-label="Mobile main navigation"
          className="border-border bg-background border-t px-4 py-4 shadow-lg lg:hidden"
        >
          <div className="mx-auto flex max-w-7xl flex-col gap-1">
            {navigation.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMenuOpen(false)}
                className="text-foreground hover:bg-accent rounded-lg px-3 py-3 text-sm font-medium transition-colors"
              >
                {item.label}
              </a>
            ))}
            <div className="border-border mt-2 grid grid-cols-2 gap-2 border-t pt-3">
              {userName ? (
                <div className="col-span-2">
                  <UserMenu userName={userName} />
                </div>
              ) : (
                <>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="border-border text-foreground inline-flex min-h-11 items-center justify-center rounded-xl border px-4 text-sm font-semibold"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="bg-primary text-primary-foreground inline-flex min-h-11 items-center justify-center rounded-xl px-4 text-sm font-semibold"
                  >
                    Learning portal
                  </Link>
                </>
              )}
            </div>
          </div>
        </nav>
      ) : null}
    </header>
  );
}
