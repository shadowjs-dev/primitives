import { CalendarCaption, CalendarDay, CalendarNext, CalendarPrevious, useCalendar } from "./parts";
import { CalendarRoot } from "./root";

export type { CalendarContextValue, CalendarMode, CalendarValue } from "./context";
export { calendarContext } from "./context";
export type {
  CalendarDate,
  CalendarGridKey,
  CalendarMonth,
  CalendarRange,
  WeekdayLabel,
  WeekStart,
} from "./date";
export {
  addDays,
  addMonths,
  buildMonthGrid,
  compareDates,
  dateKey,
  dateLabel,
  daysInMonth,
  formatDate,
  inRange,
  isSameDate,
  monthCaption,
  moveGridFocus,
  parseDateInput,
  pickRange,
  startOfWeek,
  todayIn,
  weekdayLabels,
  weekdayOf,
  weekStartFor,
} from "./date";
export type {
  CalendarCaptionProps,
  CalendarDayOwnProps,
  CalendarDayProps,
  CalendarNavigationProps,
} from "./parts";
export type { CalendarOwnProps, CalendarProps } from "./root";
export { CalendarCaption, CalendarDay, CalendarNext, CalendarPrevious, CalendarRoot, useCalendar };

/**
 * The calendar primitive: `Calendar`, `Calendar.Caption`, `Calendar.Previous`, `Calendar.Next` and
 * `Calendar.Day`. Each part is also exported by name. The grid (rows and header) is written by the
 * application from {@link useCalendar}. Keys: arrows, PageUp and PageDown (with Shift for a year),
 * Home and End move the focused day; Enter and Space select it. ARIA: days are `gridcell`s with
 * `aria-selected`, `aria-disabled` and `aria-current="date"`; the caption is `aria-live="polite"`.
 *
 * @example
 * import { Calendar } from "@shadow-js/primitives";
 *
 * export function MarchNavigation() {
 *   return (
 *     <Calendar defaultMonth={{ year: 2026, month: 3 }}>
 *       <Calendar.Previous />
 *       <Calendar.Caption />
 *       <Calendar.Next />
 *     </Calendar>
 *   );
 * }
 * @see {@link CalendarRoot}
 * @since 1.0.0
 */
export const Calendar: typeof CalendarRoot & {
  readonly Caption: typeof CalendarCaption;
  readonly Previous: typeof CalendarPrevious;
  readonly Next: typeof CalendarNext;
  readonly Day: typeof CalendarDay;
} = Object.assign(CalendarRoot, {
  Caption: CalendarCaption,
  Previous: CalendarPrevious,
  Next: CalendarNext,
  Day: CalendarDay,
});
