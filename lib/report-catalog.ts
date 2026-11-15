import type { UserRole } from "@/lib/roles";

export type ReportFilter =
  | "employee"
  | "course"
  | "batch"
  | "branch"
  | "status"
  | "dateRange"
  | "lookback"
  | "trainer"
  | "entity";

export type ReportDefinition = {
  id: string;
  name: string;
  category: string;
  description: string;
  answers: string;
  audiences: UserRole[];
  filters: ReportFilter[];
  caveat?: string;
};

export const reportCatalog: ReportDefinition[] = [
  {
    id: "employee-transcript",
    name: "Employee transcript",
    category: "People and learning",
    description:
      "A person’s training history, completion dates, attendance, and certificate status.",
    answers: "What has this employee completed, and what is still in progress?",
    audiences: ["participant", "branch_manager", "admin", "super_admin"],
    filters: ["employee", "course", "status", "dateRange"],
    caveat:
      "Assessment scores are not stored in the current training data model. Branch is the employee’s current assignment, not a historical enrollment snapshot.",
  },
  {
    id: "participation",
    name: "Participation by course / batch",
    category: "People and learning",
    description:
      "Enrollment, attendance, completion, and certificate outcomes by course and cohort.",
    answers: "Who attended which training, and how did participation change over time?",
    audiences: ["branch_manager", "admin", "super_admin", "auditor"],
    filters: ["course", "batch", "branch", "status", "dateRange"],
    caveat:
      "Branch is the employee’s current assignment because historical branch-at-enrollment snapshots are not stored yet.",
  },
  {
    id: "not-trained",
    name: "Not trained in N months",
    category: "People and learning",
    description:
      "People with no completed training for the selected course during the lookback period.",
    answers: "Who has never completed this course, or needs a refresher?",
    audiences: ["branch_manager", "admin", "super_admin"],
    filters: ["course", "branch", "lookback"],
  },
  {
    id: "compliance",
    name: "Compliance status",
    category: "Compliance and follow-up",
    description:
      "Training recency for a selected course, grouped into compliant, due soon, overdue, and never trained.",
    answers: "Who is current on the selected training requirement, and who needs follow-up?",
    audiences: ["branch_manager", "admin", "super_admin", "auditor"],
    filters: ["course", "branch", "status", "lookback"],
    caveat:
      "This is a training-recency view. The current database does not yet contain configurable compliance rules, exemptions, or certificate expiry dates.",
  },
  {
    id: "attendance",
    name: "Attendance and no-show",
    category: "Delivery and attendance",
    description: "Present and absent attendance marks by class, cohort, trainer, and branch.",
    answers: "What was the attendance rate, and where were absences recorded?",
    audiences: ["admin", "super_admin"],
    filters: ["course", "batch", "branch", "status", "dateRange"],
  },
  {
    id: "trainer-scorecard",
    name: "Trainer scorecard",
    category: "Delivery and attendance",
    description: "Anonymous aggregate evaluation ratings and response counts by trainer and class.",
    answers: "How are participants rating sessions, and how are scores trending?",
    audiences: ["teacher", "admin", "super_admin"],
    filters: ["trainer", "course", "dateRange"],
    caveat: "Class ratings remain hidden until five or more evaluations are submitted.",
  },
  {
    id: "cascade-completion",
    name: "Cascade completion",
    category: "Compliance and follow-up",
    description: "Branch learning reports, approvals, sessions delivered, and colleagues reached.",
    answers: "Which cascade tasks are complete, on time, pending, or overdue?",
    audiences: ["branch_manager", "admin", "super_admin"],
    filters: ["course", "branch", "status", "dateRange"],
  },
  {
    id: "batch-utilisation",
    name: "Batch utilisation",
    category: "Planning and capacity",
    description: "Enrollment and seat-fill by cohort, with scheduled venues and session counts.",
    answers: "How fully are planned cohorts and available seats being used?",
    audiences: ["admin", "super_admin"],
    filters: ["course", "dateRange"],
    caveat:
      "Seat fill uses the course capacity because the current data model has no batch-specific capacity or cancellation records.",
  },
  {
    id: "certificate-register",
    name: "Certificate register",
    category: "Compliance and follow-up",
    description: "Issued and not-yet-issued certificate records linked to completed training.",
    answers: "Which completions have a certificate number on record?",
    audiences: ["admin", "super_admin", "auditor"],
    filters: ["employee", "course", "status", "dateRange"],
    caveat:
      "The current data model records certificate numbers, but not expiry or revocation events.",
  },
  {
    id: "audit-trail",
    name: "Audit trail",
    category: "Governance",
    description:
      "Recorded user administration and course changes with actor and timestamp details.",
    answers: "Who changed what, and when was the change recorded?",
    audiences: ["admin", "super_admin", "auditor"],
    filters: ["employee", "entity", "dateRange"],
  },
];

export function getReportDefinition(id: string) {
  return reportCatalog.find((report) => report.id === id) ?? null;
}

export function canAccessReport(role: UserRole, id: string) {
  return Boolean(getReportDefinition(id)?.audiences.includes(role));
}
