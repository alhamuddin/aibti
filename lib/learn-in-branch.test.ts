import { describe, expect, it } from "vitest";
import {
  areLearnInBranchAnswersComplete,
  getLearnInBranchDeadline,
  isLearnInBranchSubmissionOpen,
  learnInBranchWindowMs,
  parseLearnInBranchAnswerOptions,
} from "./learn-in-branch";
import { getDateTimeLocalValue, parseDateTimeLocalInTimeZone } from "./attendance";

describe("Learn in the Branch submission window", () => {
  const completedAt = new Date("2026-10-24T05:30:00.000Z");

  it("uses a seven-day default window and includes the deadline", () => {
    const deadline = getLearnInBranchDeadline(completedAt);

    expect(deadline.getTime()).toBe(completedAt.getTime() + learnInBranchWindowMs);
    expect(isLearnInBranchSubmissionOpen(completedAt, null, deadline)).toBe(true);
    expect(isLearnInBranchSubmissionOpen(completedAt, null, new Date(deadline.getTime() + 1))).toBe(
      false,
    );
  });

  it("uses an admin extension in place of the default deadline", () => {
    const extension = new Date("2026-11-10T17:59:59.999Z");

    expect(getLearnInBranchDeadline(completedAt, extension)).toBe(extension);
    expect(isLearnInBranchSubmissionOpen(completedAt, extension, extension)).toBe(true);
  });

  it("parses branch-local date and time values as instants", () => {
    const date = parseDateTimeLocalInTimeZone("2026-10-31T10:30", "Asia/Dhaka");

    expect(date?.toISOString()).toBe("2026-10-31T04:30:00.000Z");
    expect(date && getDateTimeLocalValue(date, "Asia/Dhaka")).toBe("2026-10-31T10:30");
  });

  it("rejects malformed or nonexistent local dates", () => {
    expect(parseDateTimeLocalInTimeZone("2026-02-31T10:30", "Asia/Dhaka")).toBeNull();
    expect(parseDateTimeLocalInTimeZone("not-a-date", "Asia/Dhaka")).toBeNull();
  });

  it("parses unique admin-defined answer choices", () => {
    expect(parseLearnInBranchAnswerOptions("Very effective\nEffective\nNot so effective")).toEqual([
      "Very effective",
      "Effective",
      "Not so effective",
    ]);
    expect(parseLearnInBranchAnswerOptions("Yes\n yes ")).toBeNull();
    expect(parseLearnInBranchAnswerOptions("Only one")).toBeNull();
  });

  it("requires one valid answer for every snapshotted review question", () => {
    const questions = [
      { id: "effectiveness", options: ["Very effective", "Effective", "Not so effective"] },
      { id: "understanding", options: ["Improved", "Unchanged", "Decreased"] },
    ];

    expect(
      areLearnInBranchAnswersComplete(questions, [
        { questionId: "effectiveness", answer: "Effective" },
        { questionId: "understanding", answer: "Improved" },
      ]),
    ).toBe(true);
    expect(
      areLearnInBranchAnswersComplete(questions, [
        { questionId: "effectiveness", answer: "Invalid" },
        { questionId: "understanding", answer: "Improved" },
      ]),
    ).toBe(false);
    expect(
      areLearnInBranchAnswersComplete(questions, [
        { questionId: "effectiveness", answer: "Effective" },
      ]),
    ).toBe(false);
  });
});
