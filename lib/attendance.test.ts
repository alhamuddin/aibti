import { afterEach, describe, expect, it } from "vitest";
import {
  attendanceOpeningLeadTimeMs,
  createAttendanceQrSignature,
  getAttendanceDateKey,
  getDateTimeLocalValue,
  getAttendanceWindow,
  getCourseTimeZone,
  getWallClockShiftMinutes,
  isValidAttendanceQrSignature,
  shiftDateTimeInTimeZone,
} from "./attendance";

describe("course attendance schedule", () => {
  it("uses the course timezone and opens attendance thirty minutes before its first class", () => {
    const dateKey = getAttendanceDateKey(new Date("2026-10-31T02:30:00.000Z"), "Asia/Dhaka");
    const window = getAttendanceWindow(
      [
        {
          name: "Second class",
          subjectTitle: "Compliance",
          scheduledAt: new Date("2026-10-31T05:00:00.000Z"),
          durationMinutes: 60,
        },
        {
          name: "First class",
          subjectTitle: "Risk",
          scheduledAt: new Date("2026-10-31T03:00:00.000Z"),
          durationMinutes: 90,
        },
      ],
      dateKey,
      "Asia/Dhaka",
    );

    expect(window?.opensAt).toEqual(
      new Date(new Date("2026-10-31T03:00:00.000Z").getTime() - attendanceOpeningLeadTimeMs),
    );
    expect(window?.autoClosesAt).toEqual(new Date("2026-10-31T06:00:00.000Z"));
    expect(window?.classes.map((classSession) => classSession.name)).toEqual([
      "First class",
      "Second class",
    ]);
  });

  it("uses Asia/Dhaka when an older course has no saved timezone", () => {
    expect(getCourseTimeZone(null)).toBe("Asia/Dhaka");
  });

  it("shifts a batch schedule using course-local calendar time", () => {
    const firstClass = new Date("2026-10-31T03:00:00.000Z");
    const newStartAt = "2026-11-02T10:30";
    const shiftMinutes = getWallClockShiftMinutes(firstClass, newStartAt, "Asia/Dhaka");

    expect(getDateTimeLocalValue(firstClass, "Asia/Dhaka")).toBe("2026-10-31T09:00");
    expect(shiftMinutes).toBe(2970);
    expect(shiftDateTimeInTimeZone(firstClass, shiftMinutes ?? 0, "Asia/Dhaka")).toEqual(
      new Date("2026-11-02T04:30:00.000Z"),
    );
    expect(getWallClockShiftMinutes(firstClass, "2026-02-31T10:30", "Asia/Dhaka")).toBeNull();
  });
});

describe("attendance QR signing", () => {
  const originalSecret = process.env.BETTER_AUTH_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.BETTER_AUTH_SECRET;
    else process.env.BETTER_AUTH_SECRET = originalSecret;
  });

  it("signs a session nonce and rejects changed values", () => {
    process.env.BETTER_AUTH_SECRET = "test-secret-with-more-than-thirty-two-characters";
    const signature = createAttendanceQrSignature("session-1", "nonce-1");

    expect(isValidAttendanceQrSignature("session-1", "nonce-1", signature)).toBe(true);
    expect(isValidAttendanceQrSignature("session-2", "nonce-1", signature)).toBe(false);
    expect(isValidAttendanceQrSignature("session-1", "nonce-2", signature)).toBe(false);
    expect(isValidAttendanceQrSignature("session-1", "nonce-1", "invalid")).toBe(false);
  });
});
