import Link from "next/link";
import { redirect } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  BookOpenCheck,
  ClipboardList,
  FileBarChart,
  UsersRound,
} from "lucide-react";
import { canAccessReport, reportCatalog } from "@/lib/report-catalog";
import { isUserRole } from "@/lib/roles";
import { requireAuthenticatedUser } from "@/lib/session";

export const instant = false;

const categoryIcons = {
  "People and learning": UsersRound,
  "Compliance and follow-up": BadgeCheck,
  "Delivery and attendance": BookOpenCheck,
  "Planning and capacity": FileBarChart,
  Governance: ClipboardList,
};

export default async function ReportsPage() {
  const session = await requireAuthenticatedUser();
  const role = session.user.role ?? "";
  if (!isUserRole(role)) redirect("/dashboard");

  const reports = reportCatalog.filter((report) => canAccessReport(role, report.id));
  const categories = [...new Set(reports.map((report) => report.category))];

  return (
    <main className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
      <header className="border-border bg-card relative overflow-hidden rounded-3xl border p-6 shadow-sm sm:p-8">
        <div
          aria-hidden="true"
          className="from-primary/15 absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l to-transparent"
        />
        <div className="relative max-w-3xl">
          <p className="text-primary flex items-center gap-2 text-sm font-semibold">
            <FileBarChart aria-hidden="true" className="size-4" /> Reports and analytics
          </p>
          <h1 className="text-foreground mt-3 text-3xl font-bold tracking-tight sm:text-4xl">
            Report catalogue
          </h1>
          <p className="text-muted-foreground mt-3 text-sm leading-6 sm:text-base">
            Choose a report, set the audience and date filters, then review or export the results.
            Report access follows your account role and branch scope.
          </p>
          <div className="text-muted-foreground mt-5 flex flex-wrap gap-x-5 gap-y-2 text-xs">
            <span className="inline-flex items-center gap-2">
              <ClipboardList aria-hidden="true" className="size-4" /> {reports.length} reports
              available
            </span>
            <span className="inline-flex items-center gap-2">
              <BookOpenCheck aria-hidden="true" className="size-4" /> Live data from training
              records
            </span>
          </div>
        </div>
      </header>

      {categories.map((category) => {
        const Icon = categoryIcons[category as keyof typeof categoryIcons];
        const items = reports.filter((report) => report.category === category);
        return (
          <section
            key={category}
            aria-labelledby={`category-${category.replaceAll(" ", "-")}`}
            className="space-y-4"
          >
            <div className="flex items-center gap-3">
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-xl">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <div>
                <h2
                  id={`category-${category.replaceAll(" ", "-")}`}
                  className="text-foreground text-lg font-semibold"
                >
                  {category}
                </h2>
                <p className="text-muted-foreground text-xs">
                  {items.length} {items.length === 1 ? "report" : "reports"}
                </p>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {items.map((report) => (
                <article
                  key={report.id}
                  className="border-border bg-card flex min-h-56 flex-col rounded-2xl border p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
                >
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="text-card-foreground leading-6 font-semibold">{report.name}</h3>
                    <span className="bg-muted text-muted-foreground shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold">
                      {report.filters.length} filters
                    </span>
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-6">
                    {report.description}
                  </p>
                  <p className="text-foreground mt-3 text-xs leading-5">
                    <span className="font-semibold">Answers:</span> {report.answers}
                  </p>
                  <div className="mt-auto flex flex-wrap items-end justify-between gap-3 pt-5">
                    <p className="text-muted-foreground text-[11px] leading-4">
                      For{" "}
                      {report.audiences.map((audience) => audience.replaceAll("_", " ")).join(", ")}
                    </p>
                    <Link
                      href={`/dashboard/reports/${report.id}`}
                      className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg px-3.5 text-xs font-semibold transition-colors"
                    >
                      Generate report <ArrowRight aria-hidden="true" className="size-4" />
                    </Link>
                  </div>
                </article>
              ))}
            </div>
          </section>
        );
      })}
    </main>
  );
}
