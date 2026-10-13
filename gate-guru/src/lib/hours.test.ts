import { describe, expect, it } from "vitest";
import { describeStatus, formatWeeklyHours, getLocalTime, getOpenStatus } from "./hours";
import type { OpeningHours } from "./types";

const NY = "America/New_York";
const day = (open: string, close: string) => [{ open, close }];
const everyDay = (open: string, close: string): OpeningHours => ({
  sun: day(open, close),
  mon: day(open, close),
  tue: day(open, close),
  wed: day(open, close),
  thu: day(open, close),
  fri: day(open, close),
  sat: day(open, close),
});

describe("getLocalTime", () => {
  it("converts an instant to local weekday and minutes", () => {
    // 2026-10-14 02:30 UTC = Tue 22:30 in New York (EDT, UTC-4) and Wed 11:30 in Tokyo.
    const instant = new Date("2026-10-14T02:30:00Z");
    expect(getLocalTime(instant, NY)).toEqual({ weekday: "tue", minutes: 22 * 60 + 30 });
    expect(getLocalTime(instant, "Asia/Tokyo")).toEqual({ weekday: "wed", minutes: 11 * 60 + 30 });
  });

  it("reports midnight as 0 minutes, not 24:00", () => {
    expect(getLocalTime(new Date("2026-10-14T04:00:00Z"), NY)).toEqual({ weekday: "wed", minutes: 0 });
  });
});

describe("getOpenStatus", () => {
  it("returns unknown when hours are null", () => {
    expect(getOpenStatus(null, NY)).toEqual({ state: "unknown" });
  });

  it("returns unknown when today has no entry", () => {
    const hours: OpeningHours = { mon: day("06:00", "22:00") };
    // Tue 12:00 in New York
    expect(getOpenStatus(hours, NY, new Date("2026-10-13T16:00:00Z")).state).toBe("unknown");
  });

  it("is open inside a same-day range and closed outside it", () => {
    const hours = everyDay("06:00", "22:00");
    expect(getOpenStatus(hours, NY, new Date("2026-10-13T16:00:00Z"))).toEqual({
      state: "open",
      is24h: false,
      closesAt: "22:00",
      closingSoon: false,
    });
    // 05:00 local: closed, opens 06:00
    expect(getOpenStatus(hours, NY, new Date("2026-10-13T09:00:00Z"))).toEqual({
      state: "closed",
      opensAt: "06:00",
    });
    // 22:00 local exactly: closed (close is exclusive), nothing later today
    expect(getOpenStatus(hours, NY, new Date("2026-10-14T02:00:00Z"))).toEqual({
      state: "closed",
      opensAt: null,
    });
  });

  it("uses the airport timezone, not the server's", () => {
    const hours = everyDay("06:00", "22:00");
    const instant = new Date("2026-10-13T23:00:00Z"); // 19:00 NY, 00:00 London (BST)
    expect(getOpenStatus(hours, NY, instant).state).toBe("open");
    expect(getOpenStatus(hours, "Europe/London", instant).state).toBe("closed");
  });

  it("flags closing soon within 30 minutes", () => {
    const hours = everyDay("06:00", "22:00");
    const status = getOpenStatus(hours, NY, new Date("2026-10-14T01:40:00Z")); // 21:40 local
    expect(status).toMatchObject({ state: "open", closingSoon: true });
    expect(describeStatus(status)).toBe("Closing soon · 22:00");
  });

  describe("overnight ranges", () => {
    const hours: OpeningHours = { fri: day("18:00", "02:00"), sat: [] };

    it("is open before midnight on the opening day", () => {
      // Fri 2026-10-16 23:00 NY = Sat 03:00 UTC
      expect(getOpenStatus(hours, NY, new Date("2026-10-17T03:00:00Z"))).toMatchObject({
        state: "open",
        closesAt: "02:00",
      });
    });

    it("stays open after midnight via the previous day's range, even if today is closed", () => {
      // Sat 01:30 NY = Sat 05:30 UTC
      expect(getOpenStatus(hours, NY, new Date("2026-10-17T05:30:00Z"))).toMatchObject({
        state: "open",
        closesAt: "02:00",
        closingSoon: true,
      });
    });

    it("is closed once the overnight range ends", () => {
      // Sat 02:00 NY
      expect(getOpenStatus(hours, NY, new Date("2026-10-17T06:00:00Z"))).toEqual({
        state: "closed",
        opensAt: null,
      });
    });

    it("spills into the next day when today is unknown", () => {
      const fridayOnly: OpeningHours = { fri: day("20:00", "03:00") };
      expect(getOpenStatus(fridayOnly, NY, new Date("2026-10-17T05:00:00Z")).state).toBe("open");
      expect(getOpenStatus(fridayOnly, NY, new Date("2026-10-17T08:00:00Z")).state).toBe("unknown");
    });

    it("handles the week boundary (Saturday night into Sunday)", () => {
      const sat: OpeningHours = { sat: day("22:00", "04:00"), sun: [] };
      // Sun 2026-10-18 01:00 NY = 05:00 UTC
      expect(getOpenStatus(sat, NY, new Date("2026-10-18T05:00:00Z")).state).toBe("open");
    });
  });

  it("treats 00:00–24:00 as open 24h", () => {
    const status = getOpenStatus(everyDay("00:00", "24:00"), NY, new Date("2026-10-14T03:59:00Z"));
    expect(status).toEqual({ state: "open", is24h: true, closesAt: null, closingSoon: false });
    expect(describeStatus(status)).toBe("Open 24h");
  });

  it("handles split ranges and reports the next opening", () => {
    const hours: OpeningHours = { tue: [{ open: "06:00", close: "10:00" }, { open: "16:00", close: "21:00" }] };
    expect(getOpenStatus(hours, NY, new Date("2026-10-13T16:00:00Z"))).toEqual({
      state: "closed",
      opensAt: "16:00",
    });
    expect(getOpenStatus(hours, NY, new Date("2026-10-13T21:00:00Z")).state).toBe("open");
  });

  it("follows DST changes in the airport timezone", () => {
    const hours = everyDay("06:00", "22:00");
    // US DST starts 2026-03-08. 10:30 UTC is 05:30 EST the day before, 06:30 EDT on the day.
    expect(getOpenStatus(hours, NY, new Date("2026-03-07T10:30:00Z")).state).toBe("closed");
    expect(getOpenStatus(hours, NY, new Date("2026-03-08T10:30:00Z")).state).toBe("open");
  });
});

describe("formatWeeklyHours", () => {
  it("lists Monday first with unknown, closed and 24h days", () => {
    const rows = formatWeeklyHours({ mon: day("06:00", "22:00"), tue: [], wed: day("00:00", "24:00") });
    expect(rows.slice(0, 4)).toEqual([
      { day: "mon", text: "06:00–22:00" },
      { day: "tue", text: "Closed" },
      { day: "wed", text: "24 hours" },
      { day: "thu", text: "Unknown" },
    ]);
  });
});
