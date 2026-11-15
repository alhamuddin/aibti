export const roleOptions = [
  {
    value: "super_admin",
    label: "Super administrator",
    description: "Manage administrators, all system access, training operations, and reports.",
  },
  {
    value: "admin",
    label: "Training administrator",
    description: "Manage users, training courses, compliance, and reports.",
  },
  {
    value: "participant",
    label: "Participant",
    description: "Access assigned learning, course materials, evaluations, and personal records.",
  },
  {
    value: "teacher",
    label: "Teacher / trainer",
    description: "Manage assigned subjects, classes, attendance, and learning materials.",
  },
  {
    value: "branch_manager",
    label: "Branch manager",
    description: "Review training and compliance information for their assigned branch.",
  },
  {
    value: "auditor",
    label: "Auditor",
    description: "Read-only access to reports and audit records.",
  },
] as const;

export type UserRole = (typeof roleOptions)[number]["value"];

export function isUserRole(value: string): value is UserRole {
  return roleOptions.some((role) => role.value === value);
}

export function getRoleLabel(value: string): string {
  return roleOptions.find((role) => role.value === value)?.label ?? "Unknown role";
}

export function canManageUsers(role: string | null | undefined): boolean {
  return role === "admin" || role === "super_admin";
}

export function isSuperAdmin(role: string | null | undefined): boolean {
  return role === "super_admin";
}
