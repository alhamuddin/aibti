import { describe, expect, it } from "vitest";
import { isCourseOngoing } from "./course-status";

function course(status: "DRAFT" | "PUBLISHED" | "ARCHIVED", dates: (string | null)[]) {
  return {
    status,
    subjects: [
      {
        classes: dates.map((scheduledAt) => ({ scheduledAt })),
      },
    ],
  };
}

describe("isCourseOngoing", () => {
  it("includes the first and last scheduled dates", () => {
    expect(
      isCourseOngoing(
        course("PUBLISHED", ["2026-10-29T04:00:00.000Z", "2026-11-02T04:00:00.000Z"]),
        "2026-10-29",
      ),
    ).toBe(true);
    expect(
      isCourseOngoing(
        course("PUBLISHED", ["2026-10-29T04:00:00.000Z", "2026-11-02T04:00:00.000Z"]),
        "2026-11-02",
      ),
    ).toBe(true);
  });

  it("classifies dates between the first and last class as ongoing", () => {
    expect(
      isCourseOngoing(
        course("PUBLISHED", ["2026-10-29T04:00:00.000Z", "2026-11-02T04:00:00.000Z"]),
        "2026-10-31",
      ),
    ).toBe(true);
  });

  it("does not classify future, past, draft, or unscheduled courses as ongoing", () => {
    expect(isCourseOngoing(course("PUBLISHED", ["2026-11-02T04:00:00.000Z"]), "2026-10-31")).toBe(
      false,
    );
    expect(isCourseOngoing(course("PUBLISHED", ["2026-10-29T04:00:00.000Z"]), "2026-10-31")).toBe(
      false,
    );
    expect(isCourseOngoing(course("DRAFT", ["2026-10-29T04:00:00.000Z"]), "2026-10-31")).toBe(
      false,
    );
    expect(isCourseOngoing(course("PUBLISHED", [null]), "2026-10-31")).toBe(false);
  });
});
