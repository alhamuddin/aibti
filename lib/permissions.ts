import { createAccessControl } from "better-auth/plugins/access";
import { adminAc, defaultStatements } from "better-auth/plugins/admin/access";

const statement = {
  ...defaultStatements,
  employee: ["read", "write", "import"],
  course: ["read", "write"],
  batch: ["read", "write", "publish"],
  enrollment: ["read.own", "read.branch", "read.all", "write.own", "write.all"],
  attendance: ["read", "mark", "mark.own", "override"],
  material: ["read", "write"],
  compliance: ["read", "manage", "exempt"],
  evaluation: ["submit", "read.own", "read.all"],
  cascade: ["submit", "review"],
  learnInBranch: ["submit.own", "review.branch", "manage.deadlines"],
  report: ["read.own", "read.branch", "read.all", "export"],
  audit: ["read"],
} as const;

export const ac = createAccessControl(statement);

export const roles = {
  super_admin: ac.newRole(statement),
  admin: ac.newRole({
    ...adminAc.statements,
    employee: ["read", "write", "import"],
    course: ["read", "write"],
    batch: ["read", "write", "publish"],
    enrollment: ["read.all", "write.all"],
    attendance: ["read", "mark", "override"],
    material: ["read", "write"],
    compliance: ["read", "manage", "exempt"],
    evaluation: ["read.all"],
    cascade: ["review"],
    learnInBranch: ["manage.deadlines"],
    report: ["read.all", "export"],
    audit: ["read"],
  }),
  teacher: ac.newRole({
    batch: ["read"],
    attendance: ["read", "mark"],
    material: ["read", "write"],
    evaluation: ["read.own"],
    report: ["read.own"],
  }),
  participant: ac.newRole({
    batch: ["read"],
    enrollment: ["read.own", "write.own"],
    attendance: ["mark.own"],
    material: ["read"],
    evaluation: ["submit"],
    cascade: ["submit"],
    learnInBranch: ["submit.own"],
    report: ["read.own"],
  }),
  branch_manager: ac.newRole({
    report: ["read.branch"],
    compliance: ["read"],
    cascade: ["review"],
    learnInBranch: ["review.branch"],
    batch: ["read"],
  }),
  auditor: ac.newRole({
    batch: ["read"],
    material: ["read"],
    report: ["read.all"],
    audit: ["read"],
  }),
};

export function hasCoursePermission(
  role: keyof typeof roles,
  permission: "read" | "write" | "publish",
): boolean {
  switch (permission) {
    case "read":
      return roles[role].authorize({ batch: ["read"] }).success;
    case "write":
      return roles[role].authorize({ course: ["write"] }).success;
    case "publish":
      return roles[role].authorize({ batch: ["publish"] }).success;
  }
}
