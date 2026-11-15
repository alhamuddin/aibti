import { describe, expect, it } from "vitest";
import {
  getSpeakerEvaluationOptions,
  getSpeakerEvaluationWindow,
  getStoredSpeakerEvaluationScore,
  canViewSpeakerEvaluationResults,
  isSpeakerEvaluationOpen,
} from "./speaker-evaluation";

describe("speaker evaluation scoring", () => {
  it("uses the point values from the speaker evaluation form", () => {
    expect(
      getSpeakerEvaluationOptions("presentationQuality").map((option) => option.points),
    ).toEqual([4, 3, 2, 1]);
    expect(getSpeakerEvaluationOptions("experienceSharing").map((option) => option.points)).toEqual(
      [3, 2.5, 2, 1.5],
    );
    expect(getSpeakerEvaluationOptions("sessionBenefit").map((option) => option.points)).toEqual([
      5, 4, 3, 1.5,
    ]);
    expect(getSpeakerEvaluationOptions("topicCompleteness").map((option) => option.points)).toEqual(
      [5, 4, 3, 1.5],
    );
    expect(
      getSpeakerEvaluationOptions("learningEnvironment").map((option) => option.points),
    ).toEqual([3, 2.5, 2, 1]);
  });

  it("stores half-point ratings without floating point values", () => {
    expect(getStoredSpeakerEvaluationScore("experienceSharing", 2.5)).toBe(5);
    expect(getStoredSpeakerEvaluationScore("sessionBenefit", 1.5)).toBe(3);
    expect(getStoredSpeakerEvaluationScore("presentationQuality", 2.5)).toBeNull();
  });
});

describe("speaker evaluation availability", () => {
  const scheduledAt = new Date("2026-10-20T10:00:00.000Z");
  const durationMinutes = 90;

  it("opens only after class end and closes one week after class end", () => {
    const { classEndsAt, expiresAt } = getSpeakerEvaluationWindow(scheduledAt, durationMinutes);

    expect(isSpeakerEvaluationOpen(scheduledAt, durationMinutes, classEndsAt)).toBe(true);
    expect(isSpeakerEvaluationOpen(scheduledAt, durationMinutes, expiresAt)).toBe(true);
    expect(
      isSpeakerEvaluationOpen(scheduledAt, durationMinutes, new Date(classEndsAt.getTime() - 1)),
    ).toBe(false);
    expect(
      isSpeakerEvaluationOpen(scheduledAt, durationMinutes, new Date(expiresAt.getTime() + 1)),
    ).toBe(false);
  });
});

describe("speaker evaluation result privacy", () => {
  it("withholds teacher aggregates until five responses are available", () => {
    expect(canViewSpeakerEvaluationResults("teacher", 4)).toBe(false);
    expect(canViewSpeakerEvaluationResults("teacher", 5)).toBe(true);
    expect(canViewSpeakerEvaluationResults("admin", 1)).toBe(true);
    expect(canViewSpeakerEvaluationResults("super_admin", 0)).toBe(true);
  });
});
