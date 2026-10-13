import { WEEKDAYS, type OpeningHours, type TimeRange, type Weekday } from "./types";

const DAY_MINUTES = 24 * 60;
const CLOSING_SOON_MINUTES = 30;

export type OpenStatus =
  | { state: "unknown" }
  | { state: "open"; is24h: boolean; closesAt: string | null; closingSoon: boolean }
  | { state: "closed"; opensAt: string | null };

type LocalTime = { weekday: Weekday; minutes: number };

/** Weekday and minutes since midnight at `date` in the given IANA timezone. */
export function getLocalTime(date: Date, timeZone: string): LocalTime {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) => parts.find((p) => p.type === type)?.value ?? "";
  const weekday = WEEKDAYS.find((d) => d === get("weekday").toLowerCase());
  if (!weekday) throw new Error(`Could not resolve weekday for ${timeZone}`);
  return { weekday, minutes: Number(get("hour")) * 60 + Number(get("minute")) };
}

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

function previousDay(day: Weekday): Weekday {
  return WEEKDAYS[(WEEKDAYS.indexOf(day) + 6) % 7];
}

/** A range where close <= open runs past midnight; 00:00–24:00 (or equal open/close) is all day. */
function is24h(range: TimeRange): boolean {
  return toMinutes(range.close) - toMinutes(range.open) === DAY_MINUTES || range.open === range.close;
}

function isOvernight(range: TimeRange): boolean {
  return !is24h(range) && toMinutes(range.close) <= toMinutes(range.open);
}

function openStatus(range: TimeRange, minutesUntilClose: number): OpenStatus {
  if (is24h(range)) return { state: "open", is24h: true, closesAt: null, closingSoon: false };
  return {
    state: "open",
    is24h: false,
    closesAt: range.close,
    closingSoon: minutesUntilClose <= CLOSING_SOON_MINUTES,
  };
}

/**
 * Open/closed status for `hours` (airport local time) at instant `now`.
 * Null hours or no entry for today => unknown. [] for a day => closed that day.
 */
export function getOpenStatus(
  hours: OpeningHours | null,
  timeZone: string,
  now: Date = new Date(),
): OpenStatus {
  if (!hours) return { state: "unknown" };
  const { weekday, minutes } = getLocalTime(now, timeZone);

  // Yesterday's overnight ranges spill into the early hours of today.
  for (const range of hours[previousDay(weekday)] ?? []) {
    if (isOvernight(range) && minutes < toMinutes(range.close)) {
      return openStatus(range, toMinutes(range.close) - minutes);
    }
  }

  const today = hours[weekday];
  if (!today) return { state: "unknown" };

  for (const range of today) {
    const open = toMinutes(range.open);
    const close = isOvernight(range) ? toMinutes(range.close) + DAY_MINUTES : toMinutes(range.close);
    if (is24h(range) || (minutes >= open && minutes < close)) {
      return openStatus(range, close - minutes);
    }
  }

  const next = today
    .map((r) => r.open)
    .filter((open) => toMinutes(open) > minutes)
    .sort()[0];
  return { state: "closed", opensAt: next ?? null };
}

/** Human-readable label for a status, e.g. "Open · closes 22:00". */
export function describeStatus(status: OpenStatus): string {
  switch (status.state) {
    case "unknown":
      return "Hours unknown";
    case "open":
      if (status.is24h) return "Open 24h";
      if (status.closingSoon) return `Closing soon · ${status.closesAt}`;
      return `Open · until ${status.closesAt}`;
    case "closed":
      return status.opensAt ? `Closed · opens ${status.opensAt}` : "Closed now";
  }
}

export function formatWeeklyHours(hours: OpeningHours): { day: Weekday; text: string }[] {
  // Monday-first for display.
  const order: Weekday[] = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"];
  return order.map((day) => {
    const ranges = hours[day];
    let text: string;
    if (!ranges) text = "Unknown";
    else if (ranges.length === 0) text = "Closed";
    else if (ranges.some(is24h)) text = "24 hours";
    else text = ranges.map((r) => `${r.open}–${r.close}`).join(", ");
    return { day, text };
  });
}
