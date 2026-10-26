const DAY_MS = 86_400_000;

export function parseDateOnly(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) {
    return new Date(Number.NaN);
  }
  const date = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  return date;
}

export function isValidDateOnly(value: string): boolean {
  const date = parseDateOnly(value);
  if (Number.isNaN(date.getTime())) return false;
  return formatDateOnly(date) === value;
}

export function formatDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function localToday(now: Date = new Date()): string {
  return formatDateOnly(now);
}

export function addDays(dateOnly: string, days: number): string {
  const date = parseDateOnly(dateOnly);
  date.setDate(date.getDate() + days);
  return formatDateOnly(date);
}

export function dayNumber(dateOnly: string): number {
  const date = parseDateOnly(dateOnly);
  return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()) / DAY_MS;
}

export function daysLeft(deadline: string, today: string): number {
  return dayNumber(deadline) - dayNumber(today);
}

export function urgencyFor(deadline: string | null, today: string): number {
  if (!deadline) return 1;
  const days = daysLeft(deadline, today);
  if (days <= 7) return 3;
  if (days <= 21) return 2;
  return 1;
}

export function seedTimestamp(seededAtIso: string, daysAgo: number): string {
  return new Date(Date.parse(seededAtIso) - daysAgo * DAY_MS).toISOString();
}

export function formatDisplayDate(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(parseDateOnly(value));
}

export function formatDisplayDateTime(value: string): string {
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

export function isValidIsoTimestamp(value: string): boolean {
  return typeof value === "string" && Number.isFinite(Date.parse(value));
}

export function nowIso(): string {
  return new Date().toISOString();
}

export function nextMidnightDelay(now: Date = new Date()): number {
  const next = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1, 0);
  return Math.max(1_000, next.getTime() - now.getTime());
}
