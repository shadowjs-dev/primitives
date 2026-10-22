import { splitProps, useEffect, useMemo, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  type Direction,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  partId,
  useBaseId,
  useControllableState,
  useRefSignal,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import {
  type CalendarContextValue,
  type CalendarMode,
  type CalendarValue,
  calendarContext,
} from "./context";
import {
  addDays,
  addMonths,
  buildMonthGrid,
  type CalendarDate,
  type CalendarMonth,
  type CalendarRange,
  compareDates,
  dateKey,
  dateLabel,
  inRange,
  isSameDate,
  monthCaption,
  moveGridFocus,
  pickRange,
  todayIn,
  type WeekStart,
  weekdayLabels,
  weekStartFor,
} from "./date";

/**
 * Own props of {@link Calendar}.
 *
 * Accessibility: the root is a plain `div` with no role; the grid is written by the application
 * (see {@link useCalendar}). Each day is a `role="gridcell"` with `aria-selected`, `aria-disabled`,
 * a full `aria-label` and `aria-current="date"` for today. Only the focused day is in the tab
 * order. Keys on a day: Enter and Space select it; Left and Right move a day (swapped in RTL); Up
 * and Down move a week; PageUp and PageDown move a month, with Shift a year; Home and End go to the
 * first and last day of the week. The caption is `aria-live="polite"`. Data attributes: `data-mode`
 * (`"single"`, `"multiple"` or `"range"`) on the root; `dir` is written only when set explicitly.
 * @see {@link CalendarRoot}
 * @since 1.0.0
 */
export interface CalendarOwnProps {
  /** What can be selected: one day, several days, or a range. @default "single" */
  readonly mode?: CalendarMode | undefined;
  /** The selection (controlled). A day, a list of days, or a range, as `mode` says. `undefined` keeps it uncontrolled. @default none */
  readonly value?: CalendarValue | undefined;
  /** The selection when uncontrolled. @default none (nothing is selected) */
  readonly defaultValue?: CalendarValue | undefined;
  /** Called with the new selection whenever the user selects a day. @default none */
  readonly onValueChange?: ((value: CalendarValue) => void) | undefined;
  /** The month shown (controlled). Only the year and the month matter. `undefined` keeps it uncontrolled. @default none */
  readonly month?: CalendarMonth | undefined;
  /** The month shown when uncontrolled: the month of the selection, else of `today`, else of the current UTC date. Set it on server-rendered pages. @default none */
  readonly defaultMonth?: CalendarMonth | undefined;
  /** Called with the new shown month when it changes. @default none */
  readonly onMonthChange?: ((month: CalendarMonth) => void) | undefined;
  /** The earliest day that can be selected; earlier days are disabled, and `Calendar.Previous` is disabled once the month before has no day on or after it. @default none (no lower bound) */
  readonly min?: CalendarDate | undefined;
  /** The latest day that can be selected; later days are disabled. @default none (no upper bound) */
  readonly max?: CalendarDate | undefined;
  /** Days that can not be selected: a list of days, or a predicate. @default none (no day is disabled) */
  readonly disabled?: readonly CalendarDate[] | ((date: CalendarDate) => boolean) | undefined;
  /** A BCP 47 tag for the names and the week start. @default "en-US" */
  readonly locale?: string | undefined;
  /** The first day of a week (`0` Sunday to `6` Saturday). @default the locale's first day of the week (from `Intl`) */
  readonly weekStartsOn?: WeekStart | undefined;
  /** An IANA time zone (`"Asia/Riyadh"`). When `today` is not given, today is the current day in this zone, and an uncontrolled calendar opens on its month. An unknown zone throws a `RangeError`. @default none (UTC for the opening month; no day is marked today) */
  readonly timeZone?: string | undefined;
  /** Today, highlighted in the grid (`data-today`, `aria-current="date"`). Pass it so server and client agree. @default none (no day is marked today) */
  readonly today?: CalendarDate | undefined;
  /** Reading direction; `"rtl"` swaps the horizontal arrow keys. @default none (inherited from `DirectionProvider`, then the document, then `"ltr"`) */
  readonly dir?: Direction | undefined;
}

/**
 * Props of {@link Calendar}.
 * @see {@link CalendarRoot}
 * @since 1.0.0
 */
export type CalendarProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  CalendarOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/** Whether a selection is one day. @internal */
function isDay(value: CalendarValue | undefined): value is CalendarDate {
  return typeof value === "object" && value !== null && "day" in value;
}

/** Whether a selection is a range. @internal */
function isRange(value: CalendarValue | undefined): value is CalendarRange {
  return typeof value === "object" && value !== null && "from" in value;
}

/** Whether a selection is a list of days. @internal */
function isList(value: CalendarValue | undefined): value is readonly CalendarDate[] {
  return Array.isArray(value);
}

const EMPTY_RANGE: CalendarRange = { from: undefined, to: undefined };
const GRID_KEYS = new Set([
  "ArrowLeft",
  "ArrowRight",
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
]);

/**
 * A month of days to pick from, with a keyboard grid (WAI-ARIA date picker pattern). Selects one
 * day, several days or a range, controlled or not. Dates can be limited by `min`, `max` and
 * `disabled`. Locale names and the week start come from `Intl`; no date library is needed.
 *
 * Renders a `div`. The grid itself is markup the application writes: `useCalendar()` gives the
 * weeks, the labels and the day behavior to {@link CalendarDay}. Keys and ARIA: arrows, Page keys,
 * Home and End move the focused day; Enter and Space select it; days are `gridcell`s with
 * `aria-selected`, `aria-disabled` and `aria-current` (see {@link CalendarOwnProps}).
 *
 * @param props See {@link CalendarProps}.
 * @returns The rendered root.
 * @see {@link Calendar}
 * @example
 * import { Calendar } from "@shadow-js/primitives";
 *
 * export function MonthHeader() {
 *   return (
 *     <Calendar mode="range" defaultMonth={{ year: 2026, month: 3 }}>
 *       <Calendar.Previous />
 *       <Calendar.Caption />
 *       <Calendar.Next />
 *     </Calendar>
 *   );
 * }
 * @since 1.0.0
 */
export function CalendarRoot<T extends PolymorphicTarget = "div">(
  props: CalendarProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & CalendarOwnProps>(props), [
    "as",
    "mode",
    "value",
    "defaultValue",
    "onValueChange",
    "month",
    "defaultMonth",
    "onMonthChange",
    "min",
    "max",
    "disabled",
    "locale",
    "weekStartsOn",
    "today",
    "timeZone",
    "dir",
    "children",
  ]);
  const mode = (): CalendarMode => (own.mode as CalendarMode | undefined) ?? "single";
  const locale = (own.locale as string | undefined) ?? "en-US";
  const weekStartsOn = (own.weekStartsOn as WeekStart | undefined) ?? weekStartFor(locale);
  const timeZone = own.timeZone as string | undefined;
  const today =
    (own.today as CalendarDate | undefined) ??
    (timeZone === undefined ? undefined : todayIn(timeZone));
  const min = own.min as CalendarDate | undefined;
  const max = own.max as CalendarDate | undefined;
  const [root, setRoot] = useRefSignal<HTMLElement>();
  // Direction falls back to the nearest ancestor with a dir attribute, so a wrapper dir="rtl" applies.
  const dir = useDirectionAround(() => own.dir as Direction | undefined, root);

  const [value, setValue] = useControllableState<CalendarValue | undefined>({
    value: () => own.value as CalendarValue | undefined,
    defaultValue: () => own.defaultValue as CalendarValue | undefined,
    onChange: () => {
      const callback = own.onValueChange as ((value: CalendarValue) => void) | undefined;
      return callback === undefined
        ? undefined
        : (next) => {
            if (next !== undefined) callback(next);
          };
    },
    name: "Calendar value",
  });
  const single = (): CalendarDate | undefined => {
    const current = value();
    return isDay(current) ? current : undefined;
  };
  const many = (): readonly CalendarDate[] => {
    const current = value();
    return isList(current) ? current : [];
  };
  const range = (): CalendarRange => {
    const current = value();
    return isRange(current) ? current : EMPTY_RANGE;
  };

  // The first thing to show: the selection, else today, else the first day of the month.
  const firstShown = (): CalendarDate | undefined =>
    single() ?? many()[0] ?? range().from ?? undefined;
  const initialDay: CalendarDate = firstShown() ??
    today ?? {
      year: new Date().getUTCFullYear(),
      month: new Date().getUTCMonth() + 1,
      day: new Date().getUTCDate(),
    };
  const initialMonth: CalendarMonth = (own.defaultMonth as CalendarMonth | undefined) ?? {
    year: initialDay.year,
    month: initialDay.month,
  };
  const [month, setMonthState] = useControllableState<CalendarMonth>({
    value: () => own.month as CalendarMonth | undefined,
    defaultValue: () => initialMonth,
    onChange: () => {
      const callback = own.onMonthChange as ((month: CalendarMonth) => void) | undefined;
      return callback === undefined
        ? undefined
        : (next) => {
            if (next !== undefined) callback(next);
          };
    },
    name: "Calendar month",
  });
  const [focused, setFocused] = useSignal<CalendarDate>(
    firstShown() ?? { year: initialMonth.year, month: initialMonth.month, day: 1 },
  );
  const [pending, setPending] = useSignal(false);
  const elements = new Map<string, HTMLElement>();
  const base = useBaseId(() => (rest as { id?: string }).id);
  const captionId = (): string => partId(base(), "caption");

  const isDisabled = (date: CalendarDate): boolean => {
    if (min !== undefined && compareDates(date, min) < 0) return true;
    if (max !== undefined && compareDates(date, max) > 0) return true;
    const disabled = own.disabled as
      | readonly CalendarDate[]
      | ((date: CalendarDate) => boolean)
      | undefined;
    if (typeof disabled === "function") return disabled(date);
    if (Array.isArray(disabled)) return disabled.some((entry) => isSameDate(entry, date));
    return false;
  };

  const navigate = (months: number): void => {
    const current = month();
    const next = addMonths({ year: current.year, month: current.month, day: 1 }, months);
    setMonthState({ year: next.year, month: next.month });
  };

  const showDay = (date: CalendarDate): void => {
    const current = month();
    if (current.year !== date.year || current.month !== date.month) {
      setMonthState({ year: date.year, month: date.month });
    }
  };

  const select = (date: CalendarDate): void => {
    if (isDisabled(date)) return;
    setFocused(date);
    showDay(date);
    switch (mode()) {
      case "single":
        setValue(date);
        return;
      case "multiple": {
        const list = many();
        const exists = list.some((entry) => isSameDate(entry, date));
        setValue(exists ? list.filter((entry) => !isSameDate(entry, date)) : [...list, date]);
        return;
      }
      case "range":
        setValue(pickRange(range(), date));
        return;
      default:
        return;
    }
  };

  const focusDate = (date: CalendarDate): void => {
    setFocused(date);
    showDay(date);
    setPending(true);
  };

  // The grid the tab stop belongs to: the focused day when it is shown, else the first of the month.
  const effectiveFocus = (): CalendarDate => {
    const current = month();
    const day = focused();
    if (day.year === current.year && day.month === current.month) return day;
    return { year: current.year, month: current.month, day: 1 };
  };

  const weeks = useMemo(() => {
    const current = month();
    return buildMonthGrid(current, weekStartsOn);
  });

  // Moves DOM focus after a keyboard move, once the grid has rendered the day's element.
  useEffect(() => {
    const requested = pending();
    const target = effectiveFocus();
    if (!requested) return;
    elements.get(dateKey(target))?.focus();
    setPending(false);
  });

  const keyDown = (event: KeyboardEvent, date: CalendarDate): void => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      select(date);
      return;
    }
    if (!GRID_KEYS.has(event.key)) return;
    event.preventDefault();
    const next = moveGridFocus(date, event.key as Parameters<typeof moveGridFocus>[1], {
      dir: dir(),
      weekStartsOn,
      shift: event.shiftKey,
      min,
      max,
    });
    focusDate(next);
  };

  const context: CalendarContextValue = {
    mode: mode(),
    locale,
    weekStartsOn,
    dir,
    month: () => month(),
    focused,
    weeks,
    weekdays: useMemo(() => weekdayLabels(locale, weekStartsOn)),
    caption: useMemo(() => monthCaption(locale, month())),
    captionId,
    today,
    canGoPrevious: () => {
      const current = month();
      const lastOfPrevious = addDays({ year: current.year, month: current.month, day: 1 }, -1);
      return min === undefined || compareDates(lastOfPrevious, min) >= 0;
    },
    canGoNext: () => {
      const current = month();
      const firstOfNext = addMonths({ year: current.year, month: current.month, day: 1 }, 1);
      return max === undefined || compareDates(firstOfNext, max) <= 0;
    },
    value: () => value(),
    isSelected(date) {
      switch (mode()) {
        case "single":
          return single() !== undefined && isSameDate(single() as CalendarDate, date);
        case "multiple":
          return many().some((entry) => isSameDate(entry, date));
        case "range":
          return inRange(range(), date);
        default:
          return false;
      }
    },
    isDisabled,
    isOutside(date) {
      const current = month();
      return date.year !== current.year || date.month !== current.month;
    },
    isToday: (date) => today !== undefined && isSameDate(today, date),
    rangePosition(date) {
      if (mode() !== "range") return undefined;
      const current = range();
      if (current.from === undefined || !inRange(current, date)) return undefined;
      if (isSameDate(current.from, date)) return "start";
      if (current.to !== undefined && isSameDate(current.to, date)) return "end";
      return current.to === undefined ? "start" : "middle";
    },
    dateLabel: (date) => dateLabel(locale, date),
    navigate,
    select,
    focusDate,
    keyDown,
    register(date, element) {
      const key = dateKey(date);
      if (element === undefined) elements.delete(key);
      else elements.set(key, element);
    },
    isTabStop: (date) => isSameDate(effectiveFocus(), date),
  };

  const merged = mergeElementProps(
    {
      get "data-mode"() {
        return mode();
      },
      get dir() {
        return own.dir;
      },
      ref: composeRefs<HTMLElement>((node) => {
        setRoot(node);
      }),
    },
    rest,
  );
  return (
    <calendarContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged}>
        {own.children as JsxChild}
      </Polymorphic>
    </calendarContext.Provider>
  );
}
