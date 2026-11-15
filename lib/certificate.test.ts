import { describe, expect, it } from "vitest";
import { renderCourseCertificate } from "./certificate";

describe("course certificates", () => {
  it("renders a downloadable certificate with escaped user and course text", () => {
    const svg = renderCourseCertificate({
      participantName: "A & <Employee>",
      courseTitle: "Risk & Compliance",
      batchName: "November 2026",
      certificateNumber: "TMS-ABC123",
      completedAt: new Date("2026-11-02T00:00:00.000Z"),
    });

    expect(svg).toContain("<svg");
    expect(svg).toContain("A &amp; &lt;Employee&gt;");
    expect(svg).toContain("Risk &amp; Compliance");
    expect(svg).toContain("TMS-ABC123");
    expect(svg).not.toContain("<Employee>");
  });
});
