export const CATEGORIES = [
  "restaurant",
  "cafe",
  "bar",
  "lounge",
  "shop",
  "pharmacy",
  "restroom",
  "charging",
  "prayer_room",
  "other",
] as const;
export type Category = (typeof CATEGORIES)[number];

export const ZONES = ["landside", "airside"] as const;
export type Zone = (typeof ZONES)[number];

export const ISSUE_TYPES = ["closed", "wrong_info", "other"] as const;
export type IssueType = (typeof ISSUE_TYPES)[number];

export const WEEKDAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;
export type Weekday = (typeof WEEKDAYS)[number];

/** "HH:MM" in airport local time. */
export type TimeRange = { open: string; close: string };

/** Per weekday ranges. Missing day = unknown, [] = closed all day. */
export type OpeningHours = Partial<Record<Weekday, TimeRange[]>>;

export type Airport = {
  id: string;
  iata: string;
  name: string;
  city: string;
  country: string;
  timezone: string;
};

export type Terminal = {
  id: string;
  airport_id: string;
  code: string;
  name: string;
  sort_order: number;
};

export type Facility = {
  id: string;
  airport_id: string;
  terminal_id: string;
  name: string;
  category: Category;
  zone: Zone;
  gate_area: string | null;
  description: string | null;
  opening_hours: OpeningHours | null;
  access_info: string | null;
  url: string | null;
  last_verified_at: string | null;
  slug: string;
};

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export function isZone(value: unknown): value is Zone {
  return typeof value === "string" && (ZONES as readonly string[]).includes(value);
}

export function isIssueType(value: unknown): value is IssueType {
  return typeof value === "string" && (ISSUE_TYPES as readonly string[]).includes(value);
}
