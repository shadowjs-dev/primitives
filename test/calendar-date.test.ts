import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  compareDates,
  dateKey,
  daysInMonth,
  inRange,
  moveGridFocus,
  parseDateInput,
  pickRange,
  startOfWeek,
  todayIn,
  weekdayLabels,
  weekdayOf,
  weekStartFor,
} from "../src/calendar/date";

const SEED = { seed: 42 };
const d = (year: number, month: number, day: number) => ({ year, month, day });

describe("calendar dates", () => {
  it("[CAL-L01] month lengths follow the Gregorian leap rule", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2100, 2)).toBe(28);
    expect(daysInMonth(2000, 2)).toBe(29);
    expect(daysInMonth(2026, 12)).toBe(31);
    expect(daysInMonth(2026, 4)).toBe(30);
  });

  it("[CAL-L02] adding months keeps the day when it exists and clamps it to the month's end", () => {
    expect(addMonths(d(2026, 1, 31), 1)).toEqual(d(2026, 2, 28));
    expect(addMonths(d(2024, 1, 31), 1)).toEqual(d(2024, 2, 29));
    expect(addMonths(d(2026, 11, 15), 3)).toEqual(d(2027, 2, 15));
    expect(addMonths(d(2026, 1, 15), -13)).toEqual(d(2024, 12, 15));
    expect(addDays(d(2026, 12, 31), 1)).toEqual(d(2027, 1, 1));
    expect(addDays(d(2026, 3, 1), -1)).toEqual(d(2026, 2, 28));
  });

  it("[CAL-L03] the week starts on the given day, and weekdays are read in UTC", () => {
    // 2026-03-05 is a Thursday.
    expect(weekdayOf(d(2026, 3, 5))).toBe(4);
    expect(startOfWeek(d(2026, 3, 5), 0)).toEqual(d(2026, 3, 1));
    expect(startOfWeek(d(2026, 3, 5), 1)).toEqual(d(2026, 3, 2));
  });

  it("[CAL-L04] the week start comes from the locale (Sunday in the US, Monday in Germany)", () => {
    expect(weekStartFor("en-US")).toBe(0);
    expect(weekStartFor("de-DE")).toBe(1);
  });

  it("[CAL-L05] the grid is whole weeks that start on the week start and contain the month", () => {
    // February 2026 starts on a Sunday and has 28 days: four rows, no neighbors.
    const feb = buildMonthGrid({ year: 2026, month: 2 }, 0);
    expect(feb.length).toBe(4);
    expect(feb[0]?.[0]).toEqual(d(2026, 2, 1));
    expect(feb[3]?.[6]).toEqual(d(2026, 2, 28));
    // March 2026 with a Monday start: 1 March is a Sunday, so the grid starts on the 23rd of February.
    const march = buildMonthGrid({ year: 2026, month: 3 }, 1);
    expect(march.length).toBe(6);
    expect(march[0]?.[0]).toEqual(d(2026, 2, 23));
  });

  it("[CAL-L06] property: every grid is 4 to 6 rows of 7 consecutive days, starting on the week start, covering the month", () => {
    fc.assert(
      fc.property(
        fc.integer({ min: 1900, max: 2100 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 0, max: 6 }),
        (year, month, weekStart) => {
          const grid = buildMonthGrid({ year, month }, weekStart as 0 | 1 | 2 | 3 | 4 | 5 | 6);
          expect(grid.length).toBeGreaterThanOrEqual(4);
          expect(grid.length).toBeLessThanOrEqual(6);
          const flat = grid.flat();
          expect(flat.length).toBe(grid.length * 7);
          // Consecutive days: each one is the day after the one before it.
          for (const [index, day] of flat.entries()) {
            if (index === 0) continue;
            const previous = flat[index - 1];
            expect(previous).toBeDefined();
            if (previous !== undefined) expect(addDays(previous, 1)).toEqual(day);
          }
          for (const row of grid) expect(weekdayOf(row[0] as never)).toBe(weekStart);
          const first = d(year, month, 1);
          const last = d(year, month, daysInMonth(year, month));
          expect(flat.some((day) => compareDates(day, first) === 0)).toBe(true);
          expect(flat.some((day) => compareDates(day, last) === 0)).toBe(true);
        },
      ),
      SEED,
    );
  });

  it("[CAL-L07] the weekday headers start on the week start and name the seven days", () => {
    const labels = weekdayLabels("en-US", 0);
    expect(labels.map((label) => label.index)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    expect(labels[0]?.long).toBe("Sunday");
    const monday = weekdayLabels("en-US", 1);
    expect(monday[0]?.long).toBe("Monday");
    expect(monday.map((label) => label.index)).toEqual([1, 2, 3, 4, 5, 6, 0]);
  });

  it("[CAL-L08] typed dates: ISO always; otherwise the locale's order (month-day-year in English, day-month-year in German); real days only", () => {
    expect(parseDateInput("2026-03-05", "de-DE")).toEqual(d(2026, 3, 5));
    expect(parseDateInput(" 03/05/2026 ", "en-US")).toEqual(d(2026, 3, 5));
    expect(parseDateInput("05.03.2026", "de-DE")).toEqual(d(2026, 3, 5));
    expect(parseDateInput("03/05/26", "en-US")).toEqual(d(2026, 3, 5));
    expect(parseDateInput("02/30/2026", "en-US")).toBeUndefined();
    expect(parseDateInput("02/29/2025", "en-US")).toBeUndefined();
    expect(parseDateInput("02/29/2024", "en-US")).toEqual(d(2024, 2, 29));
    expect(parseDateInput("13/01/2026", "en-US")).toBeUndefined();
    expect(parseDateInput("hello", "en-US")).toBeUndefined();
    expect(parseDateInput("1/2", "en-US")).toBeUndefined();
  });

  it("[CAL-L09] the keyboard grid moves a day, a week, a month or a year, mirrors in RTL, and stays in the bounds", () => {
    const base = d(2026, 3, 15);
    const ltr = { dir: "ltr" as const, weekStartsOn: 0 as const };
    expect(moveGridFocus(base, "ArrowRight", ltr)).toEqual(d(2026, 3, 16));
    expect(moveGridFocus(base, "ArrowLeft", ltr)).toEqual(d(2026, 3, 14));
    expect(moveGridFocus(base, "ArrowDown", ltr)).toEqual(d(2026, 3, 22));
    expect(moveGridFocus(base, "ArrowUp", ltr)).toEqual(d(2026, 3, 8));
    expect(moveGridFocus(base, "PageDown", ltr)).toEqual(d(2026, 4, 15));
    expect(moveGridFocus(base, "PageUp", { ...ltr, shift: true })).toEqual(d(2025, 3, 15));
    // 15 March 2026 is a Sunday: Home stays on it, End is the Saturday after.
    expect(moveGridFocus(base, "Home", ltr)).toEqual(d(2026, 3, 15));
    expect(moveGridFocus(base, "End", ltr)).toEqual(d(2026, 3, 21));
    expect(moveGridFocus(d(2026, 3, 18), "Home", ltr)).toEqual(d(2026, 3, 15));
    expect(moveGridFocus(base, "ArrowRight", { ...ltr, dir: "rtl" })).toEqual(d(2026, 3, 14));
    expect(moveGridFocus(base, "PageDown", { ...ltr, max: d(2026, 4, 1) })).toEqual(d(2026, 4, 1));
    expect(moveGridFocus(base, "PageUp", { ...ltr, min: d(2026, 3, 10) })).toEqual(d(2026, 3, 10));
  });

  it("[CAL-L10] ranges: the first pick starts, the second ends in order, a third starts again; inRange includes both ends", () => {
    const first = pickRange({ from: undefined, to: undefined }, d(2026, 3, 10));
    expect(first).toEqual({ from: d(2026, 3, 10), to: undefined });
    const later = pickRange(first, d(2026, 3, 5));
    expect(later).toEqual({ from: d(2026, 3, 5), to: d(2026, 3, 10) });
    expect(pickRange(later, d(2026, 4, 1))).toEqual({ from: d(2026, 4, 1), to: undefined });
    expect(inRange(later, d(2026, 3, 5))).toBe(true);
    expect(inRange(later, d(2026, 3, 10))).toBe(true);
    expect(inRange(later, d(2026, 3, 11))).toBe(false);
    expect(inRange({ from: d(2026, 3, 5), to: undefined }, d(2026, 3, 5))).toBe(true);
    expect(inRange({ from: undefined, to: undefined }, d(2026, 3, 5))).toBe(false);
  });

  it("[CAL-L11] day keys are sortable YYYY-MM-DD strings that round-trip through the parser", () => {
    expect(dateKey(d(2026, 3, 5))).toBe("2026-03-05");
    expect(dateKey(d(999, 1, 2))).toBe("0999-01-02");
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 9999 }),
        fc.integer({ min: 1, max: 12 }),
        fc.integer({ min: 1, max: 28 }),
        (year, month, day) => {
          const date = d(year, month, day);
          expect(parseDateInput(dateKey(date), "en-US")).toEqual(date);
        },
      ),
      SEED,
    );
  });
});

describe("calendar time zones", () => {
  const instant = new Date("2026-10-14T23:30:00Z");

  it("[CAL-TZ01] todayIn gives the calendar day in the zone, not in UTC", () => {
    expect(todayIn("UTC", instant)).toEqual(d(2026, 10, 14));
    expect(todayIn("Pacific/Auckland", instant)).toEqual(d(2026, 10, 15));
    expect(todayIn("America/Los_Angeles", instant)).toEqual(d(2026, 10, 14));
    expect(todayIn("Asia/Riyadh", instant)).toEqual(d(2026, 10, 15));
  });

  it("[CAL-TZ02] todayIn crosses a month and a year boundary with the zone", () => {
    expect(todayIn("Asia/Tokyo", new Date("2026-12-31T20:00:00Z"))).toEqual(d(2027, 1, 1));
    expect(todayIn("America/New_York", new Date("2027-01-01T03:00:00Z"))).toEqual(d(2026, 12, 31));
  });

  it("[CAL-TZ03] an unknown zone throws a RangeError, like Intl", () => {
    expect(() => todayIn("Mars/Olympus", instant)).toThrow(RangeError);
  });

  it("[CAL-TZ04] without an instant it reads the clock", () => {
    const now = new Date();
    const utc = todayIn("UTC");
    expect(Math.abs(Date.UTC(utc.year, utc.month - 1, utc.day) - now.getTime())).toBeLessThan(
      2 * 86_400_000,
    );
  });
});
