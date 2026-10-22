/**
 * Calendar dates without a date library: a plain `{ year, month, day }` value, UTC arithmetic (so no
 * daylight saving shift can move a day), the month grid, locale names through `Intl`, the first day
 * of the week from the locale's week information, and the parsing of typed dates.
 * @packageDocumentation
 */

/**
 * A calendar day. `month` is 1 to 12.
 * @see {@link addDays}
 * @since 1.0.0
 */
export interface CalendarDate {
  /** The four-digit year. */
  readonly year: number;
  /** The month, from 1 (January) to 12 (December). */
  readonly month: number;
  /** The day of the month, from 1 to the length of the month. */
  readonly day: number;
}

/**
 * A calendar month: the month a calendar shows.
 * @see {@link buildMonthGrid}
 * @since 1.0.0
 */
export interface CalendarMonth {
  /** The four-digit year. */
  readonly year: number;
  /** The month, from 1 (January) to 12 (December). */
  readonly month: number;
}

/**
 * A closed range of days; either end may be missing while the range is being picked.
 * @see {@link pickRange}
 * @since 1.0.0
 */
export interface CalendarRange {
  /** The first day of the range, or `undefined` until one is picked. */
  readonly from: CalendarDate | undefined;
  /** The last day of the range, or `undefined` until one is picked. */
  readonly to: CalendarDate | undefined;
}

/**
 * A weekday as the calendar header shows it.
 * @see {@link weekdayLabels}
 * @since 1.0.0
 */
export interface WeekdayLabel {
  /** The weekday index, `0` (Sunday) to `6` (Saturday), as `Date#getUTCDay` counts. */
  readonly index: number;
  /** A short name, e.g. "Mo". */
  readonly short: string;
  /** The full name, e.g. "Monday". */
  readonly long: string;
}

/**
 * A week start: `0` Sunday ... `6` Saturday.
 * @see {@link startOfWeek}
 * @since 1.0.0
 */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;

/** A Sunday, the reference for weekday names: 2024-01-07 (UTC). */
const REFERENCE_SUNDAY: CalendarDate = { year: 2024, month: 1, day: 7 };

/**
 * The UTC instant at midnight of a calendar day. Years below 100 are kept as given (`setUTCFullYear`).
 * @internal
 */
function toUtc(date: CalendarDate): Date {
  const instant = new Date(0);
  instant.setUTCFullYear(date.year, date.month - 1, date.day);
  return instant;
}

/** The calendar day of a UTC instant. @internal */
function fromUtc(instant: Date): CalendarDate {
  return {
    year: instant.getUTCFullYear(),
    month: instant.getUTCMonth() + 1,
    day: instant.getUTCDate(),
  };
}

/**
 * Whether two days are the same day: the same year, month and day.
 *
 * @param a One day.
 * @param b The other day.
 * @returns True when they are the same day.
 * @see {@link compareDates}
 * @example
 * import { isSameDate } from "@shadow-js/primitives";
 *
 * const same = isSameDate({ year: 2026, month: 3, day: 5 }, { year: 2026, month: 3, day: 5 }); // true
 * @since 1.0.0
 */
export function isSameDate(a: CalendarDate, b: CalendarDate): boolean {
  return a.year === b.year && a.month === b.month && a.day === b.day;
}

/**
 * The calendar day it is now in an IANA time zone. A calendar marks "today" with a plain day, so pass
 * the result as `today`: `today={todayIn("Asia/Riyadh")}`. Near midnight UTC the day differs from the
 * UTC day by up to one day either way.
 *
 * @param timeZone An IANA zone name such as `"Asia/Riyadh"` or `"UTC"`.
 * @param now The instant to read. @default the current time
 * @returns The day in that zone.
 * @throws RangeError when the zone is not known to `Intl`.
 * @example
 * import { todayIn } from "@shadow-js/primitives";
 *
 * const riyadh = todayIn("Asia/Riyadh"); // { year, month, day }
 * @since 1.0.0
 * @see {@link isSameDate}
 */
export function todayIn(timeZone: string, now: Date = new Date()): CalendarDate {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const part = (type: string): number => Number(parts.find((p) => p.type === type)?.value);
  return { year: part("year"), month: part("month"), day: part("day") };
}

/**
 * Orders two days: negative when `a` is first, positive when `b` is first, `0` when the same.
 *
 * @param a One day.
 * @param b The other day.
 * @returns A negative number, `0`, or a positive number.
 * @see {@link isSameDate}
 * @example
 * import { compareDates } from "@shadow-js/primitives";
 *
 * const order = compareDates({ year: 2026, month: 3, day: 5 }, { year: 2026, month: 3, day: 9 }); // < 0
 * @since 1.0.0
 */
export function compareDates(a: CalendarDate, b: CalendarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/**
 * The number of days in a month, leap years included.
 *
 * @param year The full year, e.g. `2026`.
 * @param month The month, `1` to `12`.
 * @returns The number of days, `28` to `31`.
 * @see {@link addMonths}
 * @example
 * import { daysInMonth } from "@shadow-js/primitives";
 *
 * const leap = daysInMonth(2024, 2); // 29
 * @since 1.0.0
 */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month is the last day of this one (`month` is 1 to 12, the next index).
  const last = new Date(0);
  last.setUTCFullYear(year, month, 0);
  return last.getUTCDate();
}

/**
 * The weekday of a day: `0` for Sunday to `6` for Saturday.
 *
 * @param date The day.
 * @returns The weekday index.
 * @see {@link startOfWeek}
 * @example
 * import { weekdayOf } from "@shadow-js/primitives";
 *
 * const sunday = weekdayOf({ year: 2024, month: 1, day: 7 }); // 0
 * @since 1.0.0
 */
export function weekdayOf(date: CalendarDate): number {
  return toUtc(date).getUTCDay();
}

/**
 * Adds days (negative to go back). Arithmetic is in UTC, so a daylight saving change never moves
 * the result by a day.
 *
 * @param date The starting day.
 * @param days The number of days to add; negative goes back.
 * @returns The day that many days later or earlier.
 * @see {@link addMonths}
 * @example
 * import { addDays } from "@shadow-js/primitives";
 *
 * const weekBefore = addDays({ year: 2026, month: 3, day: 5 }, -7); // { year: 2026, month: 2, day: 26 }
 * @since 1.0.0
 */
export function addDays(date: CalendarDate, days: number): CalendarDate {
  const instant = toUtc(date);
  instant.setUTCDate(instant.getUTCDate() + days);
  return fromUtc(instant);
}

/**
 * Adds months. The day is kept if the month has it, else it becomes the month's last day.
 *
 * @param date The starting day.
 * @param months The number of months to add; negative goes back.
 * @returns The day in the month that many months later or earlier.
 * @see {@link addDays}
 * @example
 * import { addMonths } from "@shadow-js/primitives";
 *
 * const february = addMonths({ year: 2026, month: 1, day: 31 }, 1); // { year: 2026, month: 2, day: 28 }
 * @since 1.0.0
 */
export function addMonths(date: CalendarDate, months: number): CalendarDate {
  const total = date.year * 12 + (date.month - 1) + months;
  const year = Math.floor(total / 12);
  const month = total - year * 12 + 1;
  return { year, month, day: Math.min(date.day, daysInMonth(year, month)) };
}

/**
 * The first day of the week that contains `date`.
 *
 * @param date A day in the week.
 * @param weekStartsOn The first day of a week, `0` (Sunday) to `6` (Saturday).
 * @returns The first day of that week.
 * @see {@link weekStartFor}
 * @example
 * import { startOfWeek } from "@shadow-js/primitives";
 *
 * const monday = startOfWeek({ year: 2026, month: 3, day: 5 }, 1); // { year: 2026, month: 3, day: 2 }
 * @since 1.0.0
 */
export function startOfWeek(date: CalendarDate, weekStartsOn: WeekStart): CalendarDate {
  const offset = (weekdayOf(date) - weekStartsOn + 7) % 7;
  return addDays(date, -offset);
}

/**
 * The first day of the week that a locale starts its weeks on, from `Intl.Locale#getWeekInfo`, or the older
 * `Intl.Locale#weekInfo` accessor that Node 22 and earlier Chromium versions have (`firstDay` 1 is Monday, 7 is Sunday).
 * Falls back to Monday where the runtime has no week data.
 *
 * @param locale A BCP 47 tag, e.g. `"en-US"`.
 * @returns `0` (Sunday) to `6` (Saturday).
 * @see {@link startOfWeek}
 * @example
 * import { weekStartFor } from "@shadow-js/primitives";
 *
 * const us = weekStartFor("en-US"); // 0
 * const germany = weekStartFor("de-DE"); // 1
 * @since 1.0.0
 */
export function weekStartFor(locale: string): WeekStart {
  // Both forms are newer than the TypeScript lib: they are described here and checked at runtime.
  const withWeekInfo = new Intl.Locale(locale) as Intl.Locale & {
    getWeekInfo?: () => { readonly firstDay: number };
    weekInfo?: { readonly firstDay: number };
  };
  const info = withWeekInfo.getWeekInfo?.() ?? withWeekInfo.weekInfo;
  if (info === undefined) return 1;
  return info.firstDay === 7 ? 0 : (info.firstDay as WeekStart);
}

/**
 * The month as weeks of seven days, starting on `weekStartsOn`. The first and last weeks include the
 * days of the neighboring months that the grid needs (the grid has 4 to 6 weeks).
 *
 * @param month The month to lay out.
 * @param weekStartsOn The first day of a week.
 * @returns The rows of the grid.
 * @see {@link weekdayLabels}
 * @example
 * import { buildMonthGrid } from "@shadow-js/primitives";
 *
 * const rows = buildMonthGrid({ year: 2026, month: 3 }, 0); // 5 rows of 7 days, Sunday first
 * @since 1.0.0
 */
export function buildMonthGrid(month: CalendarMonth, weekStartsOn: WeekStart): CalendarDate[][] {
  const first: CalendarDate = { year: month.year, month: month.month, day: 1 };
  const start = startOfWeek(first, weekStartsOn);
  const offset = (weekdayOf(first) - weekStartsOn + 7) % 7;
  const weeks = Math.ceil((offset + daysInMonth(month.year, month.month)) / 7);
  const grid: CalendarDate[][] = [];
  for (let week = 0; week < weeks; week += 1) {
    const row: CalendarDate[] = [];
    for (let column = 0; column < 7; column += 1) {
      row.push(addDays(start, week * 7 + column));
    }
    grid.push(row);
  }
  return grid;
}

/**
 * The weekday headers in the order the grid shows them, named by the locale.
 *
 * @param locale A BCP 47 tag.
 * @param weekStartsOn The first day of a week.
 * @returns Seven labels.
 * @see {@link buildMonthGrid}
 * @example
 * import { weekdayLabels } from "@shadow-js/primitives";
 *
 * const labels = weekdayLabels("en-US", 1); // Monday first: "Mon" ... "Sun"
 * @since 1.0.0
 */
export function weekdayLabels(locale: string, weekStartsOn: WeekStart): WeekdayLabel[] {
  const short = new Intl.DateTimeFormat(locale, { weekday: "short", timeZone: "UTC" });
  const long = new Intl.DateTimeFormat(locale, { weekday: "long", timeZone: "UTC" });
  const labels: WeekdayLabel[] = [];
  for (let column = 0; column < 7; column += 1) {
    const index = (weekStartsOn + column) % 7;
    const day = addDays(REFERENCE_SUNDAY, index);
    labels.push({ index, short: short.format(toUtc(day)), long: long.format(toUtc(day)) });
  }
  return labels;
}

/**
 * The name of a month and year, e.g. "March 2026" in English.
 *
 * @param locale A BCP 47 tag.
 * @param month The month.
 * @returns The formatted caption.
 * @see {@link dateLabel}
 * @example
 * import { monthCaption } from "@shadow-js/primitives";
 *
 * const caption = monthCaption("en-US", { year: 2026, month: 3 }); // "March 2026"
 * @since 1.0.0
 */
export function monthCaption(locale: string, month: CalendarMonth): string {
  return new Intl.DateTimeFormat(locale, {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(toUtc({ year: month.year, month: month.month, day: 1 }));
}

/**
 * A day spelled out for a screen reader, e.g. "Thursday, March 5, 2026".
 *
 * @param locale A BCP 47 tag.
 * @param date The day.
 * @returns The label.
 * @see {@link monthCaption}
 * @example
 * import { dateLabel } from "@shadow-js/primitives";
 *
 * const label = dateLabel("en-US", { year: 2026, month: 3, day: 5 }); // "Thursday, March 5, 2026"
 * @since 1.0.0
 */
export function dateLabel(locale: string, date: CalendarDate): string {
  return new Intl.DateTimeFormat(locale, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(toUtc(date));
}

/**
 * A day as the locale writes a numeric date, e.g. "03/05/2026" in English.
 *
 * @param locale A BCP 47 tag.
 * @param date The day.
 * @returns The formatted date.
 * @see {@link dateKey}
 * @example
 * import { formatDate } from "@shadow-js/primitives";
 *
 * const text = formatDate("en-US", { year: 2026, month: 3, day: 5 }); // "03/05/2026"
 * @since 1.0.0
 */
export function formatDate(locale: string, date: CalendarDate): string {
  return new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).format(toUtc(date));
}

/**
 * The key a day is stored and compared by: `YYYY-MM-DD`, zero-padded, so keys sort in date order.
 *
 * @param date The day.
 * @returns The key, e.g. `"2026-03-05"`.
 * @see {@link formatDate}
 * @example
 * import { dateKey } from "@shadow-js/primitives";
 *
 * const key = dateKey({ year: 2026, month: 3, day: 5 }); // "2026-03-05"
 * @since 1.0.0
 */
export function dateKey(date: CalendarDate): string {
  const year = String(date.year).padStart(4, "0");
  const month = String(date.month).padStart(2, "0");
  const day = String(date.day).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/** Whether a day exists (a real month and a real day in it). @internal */
function isValid(date: CalendarDate): boolean {
  return (
    Number.isInteger(date.year) &&
    date.year >= 1 &&
    date.year <= 9999 &&
    Number.isInteger(date.month) &&
    date.month >= 1 &&
    date.month <= 12 &&
    Number.isInteger(date.day) &&
    date.day >= 1 &&
    date.day <= daysInMonth(date.year, date.month)
  );
}

/**
 * Reads a typed date. ISO (`2026-03-05`) is always understood; otherwise the numbers are read in the
 * order the locale writes its numeric dates (month-day-year in English, day-month-year in German).
 * Two-digit years mean 2000 onwards. Returns `undefined` for anything that is not a real day.
 *
 * @param text What the user typed.
 * @param locale A BCP 47 tag.
 * @returns The day, or `undefined`.
 * @see {@link formatDate}
 * @example
 * import { parseDateInput } from "@shadow-js/primitives";
 *
 * const us = parseDateInput("03/05/2026", "en-US"); // { year: 2026, month: 3, day: 5 }
 * const german = parseDateInput("05.03.2026", "de-DE"); // { year: 2026, month: 3, day: 5 }
 * const impossible = parseDateInput("02/30/2026", "en-US"); // undefined
 * @since 1.0.0
 */
export function parseDateInput(text: string, locale: string): CalendarDate | undefined {
  const trimmed = text.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(trimmed);
  if (iso !== null) {
    const date = { year: Number(iso[1]), month: Number(iso[2]), day: Number(iso[3]) };
    return isValid(date) ? date : undefined;
  }
  const groups = trimmed.match(/\d+/g);
  if (groups === null || groups.length !== 3) return undefined;
  const order = numericOrder(locale);
  const parts: Record<"year" | "month" | "day", number> = { year: 0, month: 0, day: 0 };
  order.forEach((field, index) => {
    const raw = groups[index] ?? "";
    parts[field] = Number(raw);
    if (field === "year" && raw.length <= 2) parts.year = 2000 + Number(raw);
  });
  return isValid(parts) ? parts : undefined;
}

/**
 * The order of year, month and day in the locale's numeric dates. @internal
 */
function numericOrder(locale: string): Array<"year" | "month" | "day"> {
  const sample = new Intl.DateTimeFormat(locale, {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "UTC",
  }).formatToParts(toUtc({ year: 2001, month: 3, day: 14 }));
  const order: Array<"year" | "month" | "day"> = [];
  for (const part of sample) {
    if (part.type === "year" || part.type === "month" || part.type === "day") {
      order.push(part.type);
    }
  }
  return order.length === 3 ? order : ["month", "day", "year"];
}

/**
 * The keys the date grid answers.
 * @see {@link moveGridFocus}
 * @since 1.0.0
 */
export type CalendarGridKey =
  | "ArrowLeft"
  | "ArrowRight"
  | "ArrowUp"
  | "ArrowDown"
  | "PageUp"
  | "PageDown"
  | "Home"
  | "End";

/**
 * The day that a key moves the focus to (WAI-ARIA date picker pattern): arrows move a day (left and
 * right swap in `rtl`) or a week, PageUp and PageDown a month (a year with Shift), Home and End the
 * first and last day of the week. The result stays inside `[min, max]`.
 *
 * @param focused The focused day.
 * @param key The key.
 * @param options `dir`, `weekStartsOn`, `shift` (for years), and the bounds.
 * @returns The new focused day.
 * @see {@link CalendarGridKey}
 * @example
 * import { moveGridFocus } from "@shadow-js/primitives";
 *
 * const below = moveGridFocus({ year: 2026, month: 3, day: 5 }, "ArrowDown", {
 *   dir: "ltr",
 *   weekStartsOn: 1,
 * }); // { year: 2026, month: 3, day: 12 }
 * const monday = moveGridFocus({ year: 2026, month: 3, day: 5 }, "Home", {
 *   dir: "ltr",
 *   weekStartsOn: 1,
 * }); // { year: 2026, month: 3, day: 2 }
 * @since 1.0.0
 */
export function moveGridFocus(
  focused: CalendarDate,
  key: CalendarGridKey,
  options: {
    readonly dir: "ltr" | "rtl";
    readonly weekStartsOn: WeekStart;
    readonly shift?: boolean | undefined;
    readonly min?: CalendarDate | undefined;
    readonly max?: CalendarDate | undefined;
  },
): CalendarDate {
  const side = options.dir === "rtl" ? -1 : 1;
  const years = options.shift === true ? 12 : 1;
  let next: CalendarDate;
  switch (key) {
    case "ArrowLeft":
      next = addDays(focused, -side);
      break;
    case "ArrowRight":
      next = addDays(focused, side);
      break;
    case "ArrowUp":
      next = addDays(focused, -7);
      break;
    case "ArrowDown":
      next = addDays(focused, 7);
      break;
    case "PageUp":
      next = addMonths(focused, -years);
      break;
    case "PageDown":
      next = addMonths(focused, years);
      break;
    case "Home":
      next = startOfWeek(focused, options.weekStartsOn);
      break;
    case "End":
      next = addDays(startOfWeek(focused, options.weekStartsOn), 6);
      break;
    default:
      next = focused;
  }
  if (options.min !== undefined && compareDates(next, options.min) < 0) next = options.min;
  if (options.max !== undefined && compareDates(next, options.max) > 0) next = options.max;
  return next;
}

/**
 * Whether a day is in a range, both ends included. A range without an end contains only its start.
 *
 * @param range The range; either end may be `undefined`.
 * @param date The day to test.
 * @returns True when the day is inside the range.
 * @see {@link pickRange}
 * @example
 * import { inRange } from "@shadow-js/primitives";
 *
 * const inside = inRange(
 *   { from: { year: 2026, month: 3, day: 5 }, to: { year: 2026, month: 3, day: 9 } },
 *   { year: 2026, month: 3, day: 7 },
 * ); // true
 * const openEnded = inRange(
 *   { from: { year: 2026, month: 3, day: 5 }, to: undefined },
 *   { year: 2026, month: 3, day: 9 },
 * ); // false
 * @since 1.0.0
 */
export function inRange(range: CalendarRange, date: CalendarDate): boolean {
  if (range.from === undefined) return false;
  const end = range.to ?? range.from;
  const first = compareDates(range.from, end) <= 0 ? range.from : end;
  const last = first === range.from ? end : range.from;
  return compareDates(date, first) >= 0 && compareDates(date, last) <= 0;
}

/**
 * The range after a day is picked: the first pick starts a range, the second ends it (ordered, so
 * the earlier day comes first), and a third pick starts a new one.
 *
 * @param range The range so far.
 * @param date The picked day.
 * @returns The new range.
 * @see {@link inRange}
 * @example
 * import { pickRange } from "@shadow-js/primitives";
 *
 * const started = pickRange({ from: undefined, to: undefined }, { year: 2026, month: 3, day: 9 });
 * const ended = pickRange(started, { year: 2026, month: 3, day: 5 });
 * // ended: { from: { year: 2026, month: 3, day: 5 }, to: { year: 2026, month: 3, day: 9 } }
 * @since 1.0.0
 */
export function pickRange(range: CalendarRange, date: CalendarDate): CalendarRange {
  if (range.from === undefined || range.to !== undefined) return { from: date, to: undefined };
  if (compareDates(date, range.from) < 0) return { from: date, to: range.from };
  return { from: range.from, to: date };
}
