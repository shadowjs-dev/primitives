/**
 * What the calendar root shares with its parts. @internal
 * @see {@link Calendar}
 */
import type { Accessor } from "@shadow-js/core";
import { createPartContext, type Direction, type PartContext } from "../utils/index";
import type { CalendarDate, CalendarMonth, CalendarRange, WeekdayLabel, WeekStart } from "./date";

/**
 * How many days a calendar can select.
 * @see {@link Calendar}
 * @since 1.0.0
 */
export type CalendarMode = "single" | "multiple" | "range";

/**
 * A calendar selection: one day, a list of days, or a range.
 * @see {@link CalendarMode}
 * @since 1.0.0
 */
export type CalendarValue = CalendarDate | readonly CalendarDate[] | CalendarRange;

/**
 * What a calendar part reads and does: the mode, the locale, the shown month, the focused day and the grid.
 * @see {@link Calendar}
 * @since 1.0.0
 */
export interface CalendarContextValue {
  readonly mode: CalendarMode;
  readonly locale: string;
  readonly weekStartsOn: WeekStart;
  readonly dir: Accessor<Direction>;
  /** The month shown. Tracked. */
  readonly month: Accessor<CalendarMonth>;
  /** The day the keyboard is on. Tracked. */
  readonly focused: Accessor<CalendarDate>;
  /** The rows of the shown grid (weeks of seven days). Tracked. */
  readonly weeks: Accessor<CalendarDate[][]>;
  readonly weekdays: Accessor<WeekdayLabel[]>;
  /** The caption of the shown month, e.g. "March 2026". Tracked. */
  readonly caption: Accessor<string>;
  /** The id of the caption, which the grid names itself with. */
  readonly captionId: Accessor<string>;
  readonly today: CalendarDate | undefined;
  readonly canGoPrevious: Accessor<boolean>;
  readonly canGoNext: Accessor<boolean>;
  /** The selection. Tracked. */
  readonly value: Accessor<CalendarValue | undefined>;
  /** Whether the day is selected. Tracked. */
  readonly isSelected: (date: CalendarDate) => boolean;
  /** Whether the day can not be selected (outside `min`/`max`, or disabled). Tracked. */
  readonly isDisabled: (date: CalendarDate) => boolean;
  /** Whether the day belongs to the month before or after the shown one. */
  readonly isOutside: (date: CalendarDate) => boolean;
  readonly isToday: (date: CalendarDate) => boolean;
  /** Where the day sits in a range: `start`, `middle`, `end`, or undefined. Tracked. */
  readonly rangePosition: (date: CalendarDate) => "start" | "middle" | "end" | undefined;
  /** The spelled-out label of a day, for a screen reader. */
  readonly dateLabel: (date: CalendarDate) => string;
  /** Shows the month `months` after (negative: before) the shown one. */
  readonly navigate: (months: number) => void;
  /** Selects a day as the mode says (ignored when the day is disabled). */
  readonly select: (date: CalendarDate) => void;
  /** Moves the keyboard focus to a day, showing its month if needed. */
  readonly focusDate: (date: CalendarDate) => void;
  /** The grid keys: arrows, Page keys, Home and End move; Enter and Space select. */
  readonly keyDown: (event: KeyboardEvent, date: CalendarDate) => void;
  /** A day element registers while mounted (`undefined` on removal). */
  readonly register: (date: CalendarDate, element: HTMLElement | undefined) => void;
  /** Whether a day is the tab stop of the grid. Tracked. */
  readonly isTabStop: (date: CalendarDate) => boolean;
}

/**
 * The context a `Calendar` root provides to its parts. Read it in a custom part rendered inside the
 * root; reading it anywhere else throws. Accessibility: the context carries no ARIA of its own; the
 * built-in parts use it to keep their roles, labels and focus in step.
 *
 * @example
 * import { calendarContext } from "@shadow-js/primitives";
 *
 * export function State() {
 *   const root = calendarContext.use("State");
 *   return <span>{root.caption()}</span>;
 * }
 * @see {@link Calendar}
 * @since 1.0.0
 */
export const calendarContext: PartContext<CalendarContextValue> =
  createPartContext<CalendarContextValue>("Calendar");
