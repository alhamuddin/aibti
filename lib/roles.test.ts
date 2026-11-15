import { describe, expect, it } from "vitest";
import { roles } from "./permissions";
import { getRoleLabel, isUserRole, roleOptions } from "./roles";

describe("user roles", () => {
  it("defines the roadmap roles", () => {
    expect(roleOptions.map((role) => role.value)).toEqual([
      "super_admin",
      "admin",
      "participant",
      "teacher",
      "branch_manager",
      "auditor",
    ]);
  });

  it("recognizes supported roles and rejects unknown values", () => {
    expect(isUserRole("branch_manager")).toBe(true);
    expect(isUserRole("superuser")).toBe(false);
  });

  it("provides a safe label for unknown stored roles", () => {
    expect(getRoleLabel("branch_manager")).toBe("Branch manager");
    expect(getRoleLabel("unknown")).toBe("Unknown role");
  });

  it("applies the roadmap permission matrix", () => {
    expect(
      roles.participant.authorize({
        batch: ["read"],
        enrollment: ["read.own", "write.own"],
        attendance: ["mark.own"],
        material: ["read"],
        evaluation: ["submit"],
        learnInBranch: ["submit.own"],
        report: ["read.own"],
      }).success,
    ).toBe(true);
    expect(roles.participant.authorize({ attendance: ["mark"] }).success).toBe(false);
    expect(
      roles.participant.authorize({ batch: ["publish"], material: ["write"], audit: ["read"] })
        .success,
    ).toBe(false);

    expect(
      roles.teacher.authorize({
        batch: ["read"],
        attendance: ["mark"],
        material: ["write"],
        evaluation: ["read.own"],
        report: ["read.own"],
      }).success,
    ).toBe(true);
    expect(
      roles.teacher.authorize({
        enrollment: ["read.own", "read.all", "write.all"],
      }).success,
    ).toBe(false);
    expect(
      roles.teacher.authorize({
        attendance: ["override"],
        evaluation: ["read.all"],
        report: ["export"],
      }).success,
    ).toBe(false);

    expect(
      roles.branch_manager.authorize({
        batch: ["read"],
        compliance: ["read"],
        cascade: ["review"],
        learnInBranch: ["review.branch"],
        report: ["read.branch"],
      }).success,
    ).toBe(true);
    expect(
      roles.branch_manager.authorize({
        compliance: ["manage"],
        enrollment: ["read.own", "write.own"],
        material: ["read"],
        evaluation: ["read.all"],
        learnInBranch: ["manage.deadlines"],
      }).success,
    ).toBe(false);
    expect(roles.admin.authorize({ learnInBranch: ["review.branch"] }).success).toBe(false);

    expect(
      roles.admin.authorize({
        employee: ["read", "write", "import"],
        batch: ["publish"],
        enrollment: ["read.all", "write.all"],
        attendance: ["read", "mark", "override"],
        evaluation: ["read.all"],
        cascade: ["review"],
        learnInBranch: ["manage.deadlines"],
        report: ["export"],
        audit: ["read"],
      }).success,
    ).toBe(true);
    expect(roles.admin.authorize({ user: ["impersonate-admins"] }).success).toBe(false);
  });

  it("grants the super administrator every declared permission", () => {
    expect(
      roles.super_admin.authorize({
        user: ["impersonate-admins"],
        session: ["delete"],
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
      }).success,
    ).toBe(true);
  });

  it("maps course operations to the roadmap batch permissions", async () => {
    const { hasCoursePermission } = await import("./permissions");

    expect(hasCoursePermission("teacher", "read")).toBe(true);
    expect(hasCoursePermission("participant", "read")).toBe(true);
    expect(hasCoursePermission("branch_manager", "read")).toBe(true);
    expect(hasCoursePermission("admin", "write")).toBe(true);
    expect(hasCoursePermission("admin", "publish")).toBe(true);
    expect(hasCoursePermission("teacher", "write")).toBe(false);
    expect(hasCoursePermission("teacher", "publish")).toBe(false);
    expect(roles.auditor.authorize({ material: ["read"] }).success).toBe(true);
  });
});
