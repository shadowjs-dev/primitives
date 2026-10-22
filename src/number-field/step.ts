/**
 * Decimal-safe step arithmetic for the number field. Floating point cannot add `0.1 + 0.2`
 * exactly, so values are scaled to integers by the larger number of decimals involved, added as
 * integers, and scaled back.
 * @packageDocumentation
 */
import { clamp, getDecimalCount, roundToDecimals } from "../slider/logic";

/**
 * The range and step a typed or stepped value is held to. Passed to {@link settleValue}.
 * @since 1.0.0
 * @see {@link settleValue}
 */
export interface StepConstraints {
  /** The smallest allowed value, or `undefined` for no lower bound. */
  readonly min?: number | undefined;
  /** The largest allowed value, or `undefined` for no upper bound. */
  readonly max?: number | undefined;
  /** The distance between allowed values. */
  readonly step: number;
  /** Whether typed values snap to the step grid (only when the application set `step`). */
  readonly snap: boolean;
  /** Fraction digits the value is rounded to (what the formatter shows). */
  readonly fractionDigits: number;
  /** Whether out-of-range values are pulled back into `[min, max]`. */
  readonly clamp: boolean;
}

/**
 * Adds two numbers without floating point noise.
 *
 * @param a First number.
 * @param b Second number.
 * @returns `a + b` as the decimal sum (`addDecimal(0.1, 0.2) === 0.3`).
 * @example
 * import { addDecimal } from "@shadow-js/primitives";
 *
 * export const sum = addDecimal(0.1, 0.2); // 0.3
 * @since 1.0.0
 * @see {@link stepValue}
 */
export function addDecimal(a: number, b: number): number {
  const scale = 10 ** Math.max(getDecimalCount(a), getDecimalCount(b));
  // `+ 0` turns -0 into 0, so a field never shows or submits "-0".
  return (Math.round(a * scale) + Math.round(b * scale)) / scale + 0;
}

/**
 * Moves a value by `amount` times `direction`, keeping it inside `[min, max]`. An empty field
 * starts like a native number input: Up gives `min` (or one amount), Down gives `max` (or minus
 * one amount).
 *
 * @param base The current value, `null` for empty.
 * @param direction `1` to increase, `-1` to decrease.
 * @param amount The size of the move (a step, a small step or a large step).
 * @param min Lower bound.
 * @param max Upper bound.
 * @returns The new value.
 * @example
 * import { stepValue } from "@shadow-js/primitives";
 *
 * export const next = stepValue(0.2, 1, 0.1, undefined, undefined); // 0.3
 * @since 1.0.0
 * @see {@link addDecimal}
 */
export function stepValue(
  base: number | null,
  direction: 1 | -1,
  amount: number,
  min: number | undefined,
  max: number | undefined,
): number {
  const lower = min ?? Number.NEGATIVE_INFINITY;
  const upper = max ?? Number.POSITIVE_INFINITY;
  if (base === null) {
    if (direction === 1) return clamp(min ?? addDecimal(0, amount), lower, upper);
    return clamp(max ?? addDecimal(0, -amount), lower, upper);
  }
  return clamp(addDecimal(base, direction * amount), lower, upper);
}

/** The grid point nearest to `value`, the grid starting at `origin`. */
function nearestGridPoint(value: number, origin: number, step: number): number {
  const decimals = Math.max(getDecimalCount(step), getDecimalCount(origin));
  return roundToDecimals(origin + Math.round((value - origin) / step) * step, decimals);
}

/** The last grid point not above `limit`. */
function gridPointBelow(limit: number, origin: number, step: number): number {
  const decimals = Math.max(getDecimalCount(step), getDecimalCount(origin));
  return roundToDecimals(origin + Math.floor((limit - origin) / step + 1e-9) * step, decimals);
}

/**
 * Settles a typed value: rounds it to the precision the field shows, snaps it to the step grid
 * (counted from `min`, or 0) when snapping is on, and pulls it into `[min, max]` when clamping is
 * on. With snapping on, a maximum off the grid yields the last grid point below it.
 *
 * @param value The parsed number.
 * @param constraints See {@link StepConstraints}.
 * @returns The value to store.
 * @example
 * import { settleValue } from "@shadow-js/primitives";
 *
 * export const stored = settleValue(7.3, {
 *   min: 0,
 *   max: 10,
 *   step: 5,
 *   snap: true,
 *   fractionDigits: 3,
 *   clamp: true,
 * }); // 5
 * @since 1.0.0
 * @see {@link StepConstraints}
 */
export function settleValue(value: number, constraints: StepConstraints): number {
  const { min, max, step, snap } = constraints;
  let result = roundToDecimals(value, constraints.fractionDigits);
  const usable = snap && step > 0 && Number.isFinite(step);
  if (usable) result = nearestGridPoint(result, min ?? 0, step);
  // `+ 0` turns -0 (a tiny negative rounded away) into 0.
  if (!constraints.clamp) return result + 0;
  if (min !== undefined && result < min) result = min;
  if (max !== undefined && result > max) {
    result = usable ? gridPointBelow(max, min ?? 0, step) : max;
  }
  return result + 0;
}
