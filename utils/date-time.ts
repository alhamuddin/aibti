export function formatDateWithOptions(
  date: Date,
  options: Intl.DateTimeFormatOptions,
  locale = "en-BD",
): string {
  return new Intl.DateTimeFormat(locale, options).format(date);
}

export function formatDateTime(date: Date, timeZone?: string): string {
  return formatDateWithOptions(date, {
    dateStyle: "medium",
    timeStyle: "short",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatDate(date: Date, timeZone?: string): string {
  return formatDateWithOptions(date, {
    dateStyle: "medium",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatTime(date: Date, timeZone?: string): string {
  return formatDateWithOptions(date, {
    timeStyle: "short",
    ...(timeZone ? { timeZone } : {}),
  });
}

export function formatSessionDate(date: Date): string {
  return formatDateWithOptions(date, {
    weekday: "short",
    day: "numeric",
    month: "short",
  });
}

export function formatSessionTime(date: Date): string {
  return formatDateWithOptions(date, { hour: "numeric", minute: "2-digit" });
}
