import { createHmac, timingSafeEqual } from "node:crypto";

export const attendanceOpeningLeadTimeMs = 30 * 60 * 1000;
export const attendanceTimeZoneFallback = "Asia/Dhaka";

export type AttendanceClassSchedule = {
  name: string;
  subjectTitle: string;
  scheduledAt: Date | null;
  durationMinutes: number;
};

export function getCourseTimeZone(draftData: unknown): string {
  if (typeof draftData !== "object" || draftData === null || !("values" in draftData)) {
    return attendanceTimeZoneFallback;
  }
  const values = draftData.values;
  if (typeof values !== "object" || values === null || !("timeZone" in values)) {
    return attendanceTimeZoneFallback;
  }
  const timeZone = values.timeZone;
  if (typeof timeZone !== "string" || !timeZone.trim()) {
    return attendanceTimeZoneFallback;
  }
  new Intl.DateTimeFormat("en", { timeZone }).format(new Date());
  return timeZone;
}

export function getAttendanceDateKey(date: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, part.value]));
  const year = values.get("year");
  const month = values.get("month");
  const day = values.get("day");
  if (!year || !month || !day) throw new Error("Could not determine the course attendance date.");
  return `${year}-${month}-${day}`;
}

function getZonedDateTimeParts(date: Date, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const values = new Map(parts.map((part) => [part.type, Number(part.value)]));
  const getPart = (name: "year" | "month" | "day" | "hour" | "minute" | "second") => {
    const value = values.get(name);
    if (value === undefined || !Number.isFinite(value)) {
      throw new Error("Could not determine the course schedule time.");
    }
    return value;
  };
  return {
    year: getPart("year"),
    month: getPart("month"),
    day: getPart("day"),
    hour: getPart("hour"),
    minute: getPart("minute"),
    second: getPart("second"),
  };
}

export function getDateTimeLocalValue(date: Date, timeZone: string): string {
  const { year, month, day, hour, minute } = getZonedDateTimeParts(date, timeZone);
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}T${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

function wallClockTimestamp(value: string): number | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/.exec(value);
  if (!match) return null;
  const [, yearText, monthText, dayText, hourText, minuteText] = match;
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const hour = Number(hourText);
  const minute = Number(minuteText);
  const timestamp = Date.UTC(year, month - 1, day, hour, minute);
  const checked = new Date(timestamp);
  if (
    checked.getUTCFullYear() !== year ||
    checked.getUTCMonth() !== month - 1 ||
    checked.getUTCDate() !== day ||
    checked.getUTCHours() !== hour ||
    checked.getUTCMinutes() !== minute
  ) {
    return null;
  }
  return timestamp;
}

export function parseDateTimeLocalInTimeZone(value: string, timeZone: string): Date | null {
  const timestamp = wallClockTimestamp(value);
  if (timestamp === null) return null;

  let candidate = timestamp;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = getZonedDateTimeParts(new Date(candidate), timeZone);
    const representedTimestamp = Date.UTC(
      local.year,
      local.month - 1,
      local.day,
      local.hour,
      local.minute,
      local.second,
    );
    candidate += timestamp - representedTimestamp;
  }

  const date = new Date(candidate);
  return getDateTimeLocalValue(date, timeZone) === value ? date : null;
}

export function getWallClockShiftMinutes(
  currentDate: Date,
  targetLocalDateTime: string,
  timeZone: string,
): number | null {
  const targetTimestamp = wallClockTimestamp(targetLocalDateTime);
  if (targetTimestamp === null) return null;
  const current = getZonedDateTimeParts(currentDate, timeZone);
  const currentTimestamp = Date.UTC(
    current.year,
    current.month - 1,
    current.day,
    current.hour,
    current.minute,
  );
  return (targetTimestamp - currentTimestamp) / 60_000;
}

export function shiftDateTimeInTimeZone(date: Date, shiftMinutes: number, timeZone: string): Date {
  const current = getZonedDateTimeParts(date, timeZone);
  const targetWallClock = new Date(
    Date.UTC(
      current.year,
      current.month - 1,
      current.day,
      current.hour,
      current.minute + shiftMinutes,
      current.second,
    ),
  );
  const targetTimestamp = targetWallClock.getTime();
  let candidate = targetTimestamp;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const represented = getZonedDateTimeParts(new Date(candidate), timeZone);
    const representedTimestamp = Date.UTC(
      represented.year,
      represented.month - 1,
      represented.day,
      represented.hour,
      represented.minute,
      represented.second,
    );
    const correction = targetTimestamp - representedTimestamp;
    if (correction === 0) return new Date(candidate);
    candidate += correction;
  }
  throw new Error("The new batch schedule contains an invalid local time.");
}

export function getAttendanceWindow(
  classes: AttendanceClassSchedule[],
  courseDate: string,
  timeZone: string,
) {
  const scheduledClasses = classes
    .filter(
      (classSession): classSession is AttendanceClassSchedule & { scheduledAt: Date } =>
        classSession.scheduledAt !== null &&
        getAttendanceDateKey(classSession.scheduledAt, timeZone) === courseDate,
    )
    .sort((left, right) => left.scheduledAt.getTime() - right.scheduledAt.getTime());

  if (!scheduledClasses.length) return null;

  const firstClass = scheduledClasses[0];
  const autoClosesAt = scheduledClasses.reduce(
    (latestEnd, classSession) => {
      const classEndsAt = new Date(
        classSession.scheduledAt.getTime() + classSession.durationMinutes * 60_000,
      );
      return classEndsAt > latestEnd ? classEndsAt : latestEnd;
    },
    new Date(firstClass.scheduledAt.getTime() + firstClass.durationMinutes * 60_000),
  );

  return {
    courseDate,
    opensAt: new Date(firstClass.scheduledAt.getTime() - attendanceOpeningLeadTimeMs),
    autoClosesAt,
    classes: scheduledClasses,
  };
}

function getSigningSecret(secret?: string): string {
  const signingSecret = secret ?? process.env.BETTER_AUTH_SECRET;
  if (!signingSecret || signingSecret.length < 32) {
    throw new Error("BETTER_AUTH_SECRET must be set to sign attendance QR codes.");
  }
  return signingSecret;
}

export function createAttendanceQrSignature(
  sessionId: string,
  nonce: string,
  secret?: string,
): string {
  return createHmac("sha256", getSigningSecret(secret))
    .update(`${sessionId}:${nonce}`)
    .digest("base64url");
}

export function isValidAttendanceQrSignature(
  sessionId: string,
  nonce: string,
  signature: string,
  secret?: string,
): boolean {
  if (!/^[A-Za-z0-9_-]{43}$/.test(signature)) return false;
  const expected = Buffer.from(createAttendanceQrSignature(sessionId, nonce, secret));
  const actual = Buffer.from(signature);
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
