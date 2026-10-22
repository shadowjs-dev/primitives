import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { type CalendarContextValue, calendarContext } from "./context";
import { type CalendarDate, dateKey } from "./date";

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The calendar context, for a grid the application writes. Gives the weeks, the weekday labels,
 * and the day behavior that {@link CalendarDay} uses. Throws outside a `Calendar`. Accessibility:
 * the hook sets no ARIA itself; the grid the application writes names itself with the caption id.
 *
 * @param part The calling part's name, for the error message. @default "useCalendar"
 * @returns The context.
 * @see {@link Calendar}
 * @example
 * import { useCalendar } from "@shadow-js/primitives";
 *
 * export function MyGrid() {
 *   const calendar = useCalendar("MyGrid");
 *   return <span>{calendar.weeks().length}</span>;
 * }
 * @since 1.0.0
 */
export function useCalendar(part = "useCalendar"): CalendarContextValue {
  return calendarContext.use(part);
}

/**
 * Props of {@link CalendarCaption}.
 * @see {@link CalendarCaption}
 * @since 1.0.0
 */
export type CalendarCaptionProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * The name of the shown month, e.g. "March 2026". Accessibility: a `div` with an id and
 * `aria-live="polite"`, so a change of month is announced; the application's grid can name itself
 * with that id through `aria-labelledby`. It has no keys.
 *
 * @param props See {@link CalendarCaptionProps}.
 * @returns The rendered caption.
 * @see {@link Calendar}
 * @example
 * import { Calendar } from "@shadow-js/primitives";
 *
 * export function ShownMonth() {
 *   return (
 *     <Calendar defaultMonth={{ year: 2026, month: 3 }}>
 *       <Calendar.Caption class="text-sm font-medium" />
 *     </Calendar>
 *   );
 * }
 * @since 1.0.0
 */
export function CalendarCaption<T extends PolymorphicTarget = "div">(
  props: CalendarCaptionProps<T>,
): JsxChild {
  const context = calendarContext.use("Calendar.Caption");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get id() {
        return context.captionId();
      },
      "aria-live": "polite",
    },
    rest,
  );
  return (
    <Polymorphic as={own.as ?? "div"} {...merged}>
      {() => context.caption()}
    </Polymorphic>
  );
}

/**
 * Props of {@link CalendarPrevious} and {@link CalendarNext}.
 * @see {@link CalendarPrevious}
 * @since 1.0.0
 */
export type CalendarNavigationProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/**
 * Shows the previous month. Keys: Enter and Space activate it (a native button click). Renders a
 * `button` with `type="button"` named "Previous month" unless it has its own `aria-label`; it is
 * disabled once the month before has no day on or after `min`.
 *
 * @param props See {@link CalendarNavigationProps}.
 * @returns The rendered button.
 * @see {@link Calendar}
 * @example
 * import { Calendar } from "@shadow-js/primitives";
 *
 * export function Navigation() {
 *   return (
 *     <Calendar defaultMonth={{ year: 2026, month: 3 }}>
 *       <Calendar.Previous aria-label="Previous" />
 *       <Calendar.Next />
 *     </Calendar>
 *   );
 * }
 * @since 1.0.0
 */
export function CalendarPrevious<T extends PolymorphicTarget = "button">(
  props: CalendarNavigationProps<T>,
): JsxChild {
  const context = calendarContext.use("Calendar.Previous");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const merged = mergeElementProps(
    {
      type: "button",
      "aria-label": "Previous month",
      get disabled() {
        return context.canGoPrevious() ? undefined : true;
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          if (context.canGoPrevious()) context.navigate(-1);
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * Shows the next month. Keys: Enter and Space activate it (a native button click). Renders a
 * `button` with `type="button"` named "Next month" unless it has its own `aria-label`; it is
 * disabled once the month after has no day on or before `max`.
 *
 * @param props See {@link CalendarNavigationProps}.
 * @returns The rendered button.
 * @see {@link Calendar}
 * @example
 * import { Calendar } from "@shadow-js/primitives";
 *
 * export function NextMonth() {
 *   return (
 *     <Calendar defaultMonth={{ year: 2026, month: 3 }}>
 *       <Calendar.Next />
 *     </Calendar>
 *   );
 * }
 * @since 1.0.0
 */
export function CalendarNext<T extends PolymorphicTarget = "button">(
  props: CalendarNavigationProps<T>,
): JsxChild {
  const context = calendarContext.use("Calendar.Next");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const merged = mergeElementProps(
    {
      type: "button",
      "aria-label": "Next month",
      get disabled() {
        return context.canGoNext() ? undefined : true;
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          if (context.canGoNext()) context.navigate(1);
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}

/**
 * Own props of {@link CalendarDay}. Accessibility: `role="gridcell"` with `tabindex` 0 on the
 * focused day and -1 on the others, `aria-selected` (`"true"` or `"false"`), `aria-disabled="true"`
 * when the day can not be selected, `aria-current="date"` for today, and an `aria-label` that spells
 * the day out. Data attributes: `data-date`, `data-selected`, `data-disabled`, `data-outside`,
 * `data-today` and `data-range` (`"start"`, `"middle"` or `"end"`).
 * @see {@link CalendarDay}
 * @since 1.0.0
 */
export interface CalendarDayOwnProps {
  /** The day this cell shows. @default none (required) */
  readonly date: CalendarDate;
}

/**
 * Props of {@link CalendarDay}.
 * @see {@link CalendarDay}
 * @since 1.0.0
 */
export type CalendarDayProps<T extends PolymorphicTarget = "td"> = PolymorphicProps<
  "td",
  CalendarDayOwnProps,
  T
>;

/**
 * One day of the grid: a `td` with `role="gridcell"`, which is the roving tab stop (the focused
 * day), with `aria-selected`, `aria-disabled`, `aria-current` for today and a full `aria-label`.
 * Keys: click, Enter or Space select it; the arrow keys, PageUp and PageDown (Shift for a year),
 * Home and End move the focus (see `moveGridFocus`).
 *
 * Styling hooks: `data-selected`, `data-disabled`, `data-outside` (a day of another month),
 * `data-today`, `data-range` (`start`, `middle`, `end`) and `data-date` (`YYYY-MM-DD`).
 *
 * @param props See {@link CalendarDayProps}.
 * @returns The rendered cell.
 * @see {@link Calendar}
 * @example
 * import { Calendar, CalendarDay, useCalendar } from "@shadow-js/primitives";
 *
 * function DayRow() {
 *   const calendar = useCalendar("DayRow");
 *   return (
 *     <tr>
 *       {(calendar.weeks()[0] ?? []).map((day) => (
 *         <CalendarDay date={day}>{day.day}</CalendarDay>
 *       ))}
 *     </tr>
 *   );
 * }
 *
 * export function FirstWeek() {
 *   return (
 *     <Calendar defaultMonth={{ year: 2026, month: 3 }}>
 *       <table>
 *         <tbody>
 *           <DayRow />
 *         </tbody>
 *       </table>
 *     </Calendar>
 *   );
 * }
 * @since 1.0.0
 */
export function CalendarDay<T extends PolymorphicTarget = "td">(
  props: CalendarDayProps<T>,
): JsxChild {
  const context = calendarContext.use("Calendar.Day");
  const [own, rest] = splitProps(partProps<Loose & CalendarDayOwnProps>(props), [
    "as",
    "date",
    "onClick",
    "onKeyDown",
  ]);
  const day = own.date;
  const merged = mergeElementProps(
    {
      role: "gridcell",
      get tabindex() {
        return context.isTabStop(day) ? 0 : -1;
      },
      get "aria-selected"() {
        return context.isSelected(day) ? "true" : "false";
      },
      get "aria-disabled"() {
        return context.isDisabled(day) ? "true" : undefined;
      },
      get "aria-label"() {
        return context.dateLabel(day);
      },
      get "aria-current"() {
        return context.isToday(day) ? "date" : undefined;
      },
      get "data-date"() {
        return dateKey(day);
      },
      get "data-selected"() {
        return context.isSelected(day) ? "" : undefined;
      },
      get "data-disabled"() {
        return context.isDisabled(day) ? "" : undefined;
      },
      get "data-outside"() {
        return context.isOutside(day) ? "" : undefined;
      },
      get "data-today"() {
        return context.isToday(day) ? "" : undefined;
      },
      get "data-range"() {
        return context.rangePosition(day);
      },
      ref: (element: HTMLElement) => {
        context.register(day, element);
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick as ((event: MouseEvent) => void) | undefined,
        () => context.select(day),
      ),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event: KeyboardEvent) => context.keyDown(event, day),
      ),
    },
  );
  return <Polymorphic as={own.as ?? "td"} {...merged} />;
}
