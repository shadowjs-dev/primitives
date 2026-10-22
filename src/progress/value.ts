/**
 * The pure rules of a progress bar: which `max` and `value` are valid, and which state they imply.
 * Kept free of DOM and signals so they can be property tested.
 * @packageDocumentation
 */

/**
 * The state a progress bar is in.
 * @see {@link progressState}
 * @since 1.0.0
 */
export type ProgressState = "indeterminate" | "loading" | "complete";

/**
 * The `max` used when the application passes none or an invalid one.
 *
 * @example
 * import { DEFAULT_PROGRESS_MAX, resolveMax } from "@shadow-js/primitives";
 *
 * export const isDefault: boolean = resolveMax(undefined) === DEFAULT_PROGRESS_MAX;
 * @since 1.0.0
 * @see {@link resolveMax}
 */
export const DEFAULT_PROGRESS_MAX = 100;

/**
 * Whether `max` is usable: a finite number greater than 0.
 *
 * @param max Any value.
 * @returns True for a valid `max`.
 * @example
 * import { isValidMax } from "@shadow-js/primitives";
 *
 * export const checks: readonly boolean[] = [isValidMax(100), isValidMax(0), isValidMax(Number.NaN)];
 * @since 1.0.0
 * @see {@link resolveMax}
 */
export function isValidMax(max: unknown): max is number {
  return typeof max === "number" && Number.isFinite(max) && max > 0;
}

/**
 * Whether `value` is usable for a bar that goes up to `max`: a finite number from 0 to `max`.
 *
 * @param value Any value.
 * @param max A valid max.
 * @returns True for a valid value.
 * @example
 * import { isValidValue } from "@shadow-js/primitives";
 *
 * export const checks: readonly boolean[] = [
 *   isValidValue(40, 100),
 *   isValidValue(120, 100),
 *   isValidValue(null, 100),
 * ];
 * @since 1.0.0
 * @see {@link resolveValue}
 */
export function isValidValue(value: unknown, max: number): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 && value <= max;
}

/**
 * The `max` to use: the given one when valid, else {@link DEFAULT_PROGRESS_MAX}.
 *
 * @param max The application's `max`.
 * @returns A valid max.
 * @example
 * import { resolveMax } from "@shadow-js/primitives";
 *
 * export const maxes: readonly number[] = [resolveMax(50), resolveMax(-1)];
 * @since 1.0.0
 * @see {@link DEFAULT_PROGRESS_MAX}
 */
export function resolveMax(max: unknown): number {
  return isValidMax(max) ? max : DEFAULT_PROGRESS_MAX;
}

/**
 * The value to show: the given one when valid, else `null` (indeterminate).
 *
 * @param value The application's `value`.
 * @param max A valid max.
 * @returns A valid value, or `null`.
 * @example
 * import { resolveValue } from "@shadow-js/primitives";
 *
 * export const values: readonly (number | null)[] = [resolveValue(40, 100), resolveValue(150, 100)];
 * @since 1.0.0
 * @see {@link isValidValue}
 */
export function resolveValue(value: unknown, max: number): number | null {
  return isValidValue(value, max) ? value : null;
}

/**
 * The state implied by a resolved value.
 *
 * @param value A resolved value, or `null`.
 * @param max A valid max.
 * @returns `"indeterminate"` without a value, `"complete"` at `max`, else `"loading"`.
 * @example
 * import { progressState } from "@shadow-js/primitives";
 *
 * export const states: readonly string[] = [progressState(null, 100), progressState(100, 100)];
 * @see {@link ProgressRoot}
 * @since 1.0.0
 */
export function progressState(value: number | null, max: number): ProgressState {
  if (value === null) return "indeterminate";
  return value === max ? "complete" : "loading";
}

/**
 * The default text alternative of a value: the rounded percentage. With a `locale` (the bar's
 * `lang`) the percentage is written by `Intl.NumberFormat`, so Arabic and other locales get their
 * own digits. Without one, or with a tag `Intl` rejects, it is ASCII.
 *
 * @param value A valid value.
 * @param max A valid max.
 * @param locale An optional BCP 47 tag, e.g. `"ar"`.
 * @returns For example `"40%"`, or the same percentage in Arabic-Indic digits for `"ar"`.
 * @example
 * import { defaultValueLabel } from "@shadow-js/primitives";
 *
 * export const label: string = defaultValueLabel(40, 100);
 * export const arabic: string = defaultValueLabel(40, 100, "ar");
 * @since 1.0.0
 * @see {@link progressState}
 */
export function defaultValueLabel(value: number, max: number, locale?: string): string {
  if (locale !== undefined && locale !== "") {
    try {
      // Arabic asks for its own digits explicitly: some ICU builds default to Latin ones.
      const tag = /^ar(-|$)/i.test(locale) && !/-u-/i.test(locale) ? `${locale}-u-nu-arab` : locale;
      return new Intl.NumberFormat(tag, { style: "percent", maximumFractionDigits: 0 }).format(
        value / max,
      );
    } catch {
      // A tag Intl rejects falls back to the ASCII form below.
    }
  }
  return `${Math.round((value / max) * 100)}%`;
}
