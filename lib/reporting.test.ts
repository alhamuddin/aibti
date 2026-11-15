import { describe, expect, it } from "vitest";
import {
  getDhakaDateBoundary,
  getMonthsSinceInDhaka,
  parseParticipationReportFilters,
  toCsvCell,
} from "./reporting";

describe("participation report filters", () => {
  it("parses supported filters and trims employee search", () => {
    const result = parseParticipationReportFilters({
      q: "  employee  ",
      courseId: "course-1",
      branchId: "branch-1",
      status: "COMPLETED",
      from: "2026-01-01",
      to: "2026-01-31",
    });

    expect(result.errors).toEqual([]);
    expect(result.filters).toEqual({
      q: "employee",
      courseId: "course-1",
      branchId: "branch-1",
      status: "COMPLETED",
      from: "2026-01-01",
      to: "2026-01-31",
    });
  });

  it("rejects invalid dates, reversed ranges, and unsupported statuses", () => {
    const result = parseParticipationReportFilters({
      from: "2026-02-29",
      to: "2026-01-01",
      status: "PENDING",
    });

    expect(result.errors).toContain("Enter valid dates for the report range.");
    expect(result.errors).toContain("The start date must be on or before the end date.");
    expect(result.errors).toContain("Select a valid enrollment status.");
  });

  it("rejects repeated values and oversized searches", () => {
    const result = parseParticipationReportFilters({
      q: "x".repeat(101),
      courseId: ["course-1", "course-2"],
    });

    expect(result.errors).toContain("Use one value for the courseId filter.");
    expect(result.errors).toContain("Search must be 100 characters or fewer.");
  });
});

describe("participation report date and CSV helpers", () => {
  it("uses Dhaka-local date boundaries", () => {
    expect(getDhakaDateBoundary("2026-01-01").toISOString()).toBe("2025-12-31T18:00:00.000Z");
  });

  it("calculates elapsed calendar months in Asia/Dhaka", () => {
    expect(
      getMonthsSinceInDhaka(
        new Date("2025-12-31T18:30:00.000Z"),
        new Date("2026-02-28T18:00:00.000Z"),
      ),
    ).toBe(2);
  });

  it("quotes CSV fields and prevents spreadsheet formula execution", () => {
    expect(toCsvCell('A "quoted" name')).toBe('"A ""quoted"" name"');
    expect(toCsvCell('=HYPERLINK("https://example.test")')).toBe(
      `"'\u003dHYPERLINK(""https://example.test"")"`,
    );
    expect(toCsvCell("  @SUM(1,2)")).toBe('"\'  @SUM(1,2)"');
    expect(toCsvCell("\t+1")).toBe('"\'\t+1"');
    expect(toCsvCell(null)).toBe('""');
  });
});
