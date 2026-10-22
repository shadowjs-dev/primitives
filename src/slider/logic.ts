/**
 * The pure math of the slider: clamping, decimal-safe snapping to a step, converting values to
 * percentages and pointer positions to values, choosing the closest thumb, keeping several thumbs
 * ordered, and mapping keys to value changes. Nothing here touches the DOM, so every function is
 * property-tested on its own.
 * @packageDocumentation
 */

/** Reading direction, repeated here so this module has no runtime imports. */
type Dir = "ltr" | "rtl";
/** Slider axis, repeated here so this module has no runtime imports. */
type Axis = "horizontal" | "vertical";

/**
 * Where the minimum sits and which way the value grows. It folds `orientation`, `dir` and
 * `inverted` into one word, because every consumer (pointer math, keyboard, thumb placement) only
 * needs this.
 * @see {@link getSlideDirection}
 * @since 1.0.0
 */
export type SlideDirection = "from-left" | "from-right" | "from-bottom" | "from-top";

/**
 * Clamps `value` into `[min, max]`.
 *
 * @param value The value.
 * @param min Lower bound.
 * @param max Upper bound.
 * @returns `value`, or the nearest bound.
 * @example
 * import { clampSliderValue } from "@shadow-js/primitives";
 *
 * clampSliderValue(120, 0, 100); // 100
 * @see {@link snapToStep}
 * @see {@link clampSliderValue}
 * @since 1.0.0
 */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/** `toFixed` accepts 0..100; floats never need more than 20 here. */
const MAX_DECIMALS = 20;

/**
 * How many digits follow the decimal point when `value` is written the shortest way
 * (`0.25` has 2, `1e-7` has 7, `5` has 0).
 *
 * @param value A finite number.
 * @returns The decimal count, 0 for non-finite input.
 * @example
 * import { getDecimalCount } from "@shadow-js/primitives";
 *
 * getDecimalCount(0.05); // 2
 * @see {@link snapToStep}
 * @since 1.0.0
 */
export function getDecimalCount(value: number): number {
  if (!Number.isFinite(value)) return 0;
  const [mantissa = "", exponent = "0"] = String(Math.abs(value)).split("e");
  const fraction = mantissa.split(".")[1]?.length ?? 0;
  return Math.min(MAX_DECIMALS, Math.max(0, fraction - Number(exponent)));
}

/**
 * Rounds to a number of decimals and returns a number (`0.30000000000000004` with 1 decimal is `0.3`).
 *
 * @param value The value.
 * @param decimals Decimals to keep.
 * @returns The rounded number.
 * @example
 * import { roundToDecimals } from "@shadow-js/primitives";
 *
 * roundToDecimals(0.1 + 0.2, 1); // 0.3
 * @see {@link snapToStep}
 * @since 1.0.0
 */
export function roundToDecimals(value: number, decimals: number): number {
  return Number(value.toFixed(Math.min(MAX_DECIMALS, Math.max(0, decimals))));
}

/**
 * Snaps `value` to the nearest step counted from `min` and keeps it in `[min, max]` (when `max` is
 * not on the step grid the largest allowed value is the last grid point below it). The
 * arithmetic is decimal safe: with `step = 0.1` the result is `0.3`, never `0.30000000000000004`.
 * A non-positive step only clamps; `NaN` becomes `min`.
 *
 * @param value The raw value.
 * @param min Lower bound, also the origin of the step grid.
 * @param max Upper bound.
 * @param step Distance between allowed values.
 * @returns The snapped value.
 * @example
 * import { snapToStep } from "@shadow-js/primitives";
 *
 * snapToStep(0.34, 0, 1, 0.1); // 0.3
 * @see {@link getValueFromPointer}
 * @since 1.0.0
 */
export function snapToStep(value: number, min: number, max: number, step: number): number {
  if (Number.isNaN(value)) return min;
  if (!(step > 0) || !Number.isFinite(step)) return clamp(value, min, max);
  const decimals = Math.max(getDecimalCount(step), getDecimalCount(min));
  // Like a native range input, the largest allowed value is the last grid point not above `max`,
  // so every result is on the grid (and snapping twice changes nothing).
  const lastStep = Math.max(0, Math.floor((max - min) / step + 1e-9));
  const steps = clamp(Math.round((value - min) / step), 0, lastStep);
  return roundToDecimals(min + steps * step, decimals);
}

/**
 * Position of `value` between `min` and `max` as a percentage in `[0, 100]`.
 *
 * @param value The value.
 * @param min Lower bound.
 * @param max Upper bound.
 * @returns The percentage; 0 when the range is empty.
 * @example
 * import { valueToPercent } from "@shadow-js/primitives";
 *
 * valueToPercent(25, 0, 200); // 12.5
 * @see {@link getThumbInBoundsOffset}
 * @since 1.0.0
 */
export function valueToPercent(value: number, min: number, max: number): number {
  if (!(max > min)) return 0;
  return clamp(((value - min) / (max - min)) * 100, 0, 100);
}

/**
 * Folds orientation, reading direction and `inverted` into a {@link SlideDirection}.
 *
 * @param orientation The axis.
 * @param dir The reading direction (only matters horizontally).
 * @param inverted Whether the slider runs the other way.
 * @returns Where the minimum sits.
 * @example
 * import { getSlideDirection } from "@shadow-js/primitives";
 *
 * getSlideDirection("horizontal", "rtl", false); // "from-right"
 * @see {@link getSlideEdges}
 * @since 1.0.0
 */
export function getSlideDirection(orientation: Axis, dir: Dir, inverted: boolean): SlideDirection {
  if (orientation === "vertical") return inverted ? "from-top" : "from-bottom";
  const fromLeft = (dir === "ltr") !== inverted;
  return fromLeft ? "from-left" : "from-right";
}

/**
 * Geometry of a {@link SlideDirection}: the CSS edges to anchor to and the sign of travel. Pure
 * data: it describes no DOM, ARIA or data attributes.
 * @see {@link getSlideEdges}
 * @since 1.0.0
 */
export interface SlideEdges {
  /** The CSS edge the thumb's offset is measured from. */
  readonly start: "left" | "right" | "top" | "bottom";
  /** The CSS edge opposite `start`. */
  readonly end: "left" | "right" | "top" | "bottom";
  /** `1` when the value grows with the CSS offset of `start`, `-1` otherwise. */
  readonly sign: 1 | -1;
  /** Whether the slider runs along the vertical axis. */
  readonly vertical: boolean;
}

/**
 * The CSS edges a thumb and a range are anchored to for a direction.
 *
 * @param direction The slide direction.
 * @returns Start edge, end edge and sign.
 * @example
 * import { getSlideEdges } from "@shadow-js/primitives";
 *
 * getSlideEdges("from-right").start; // "right"
 * @see {@link SlideEdges}
 * @since 1.0.0
 */
export function getSlideEdges(direction: SlideDirection): SlideEdges {
  switch (direction) {
    case "from-left":
      return { start: "left", end: "right", sign: 1, vertical: false };
    case "from-right":
      return { start: "right", end: "left", sign: -1, vertical: false };
    case "from-bottom":
      return { start: "bottom", end: "top", sign: 1, vertical: true };
    case "from-top":
      return { start: "top", end: "bottom", sign: -1, vertical: true };
  }
}

/**
 * The part of a `DOMRect` the pointer math reads. Pure data: it is any object with these four
 * numbers, so tests need no DOM.
 * @see {@link getValueFromPointer}
 * @since 1.0.0
 */
export interface PointerRect {
  /** Left edge in client pixels. */
  readonly left: number;
  /** Top edge in client pixels. */
  readonly top: number;
  /** Width in pixels. */
  readonly width: number;
  /** Height in pixels. */
  readonly height: number;
}

/**
 * Converts a pointer coordinate to a slider value, snapped to the step and clamped.
 *
 * @param clientPos `clientX` for a horizontal slider, `clientY` for a vertical one.
 * @param rect Bounding rectangle of the slider.
 * @param min Minimum value.
 * @param max Maximum value.
 * @param step Step.
 * @param direction Where the minimum sits.
 * @returns The value under the pointer.
 * @example
 * import { getValueFromPointer } from "@shadow-js/primitives";
 *
 * getValueFromPointer(150, { left: 100, top: 0, width: 200, height: 10 }, 0, 100, 1, "from-left"); // 25
 * @see {@link PointerRect}
 * @since 1.0.0
 */
export function getValueFromPointer(
  clientPos: number,
  rect: PointerRect,
  min: number,
  max: number,
  step: number,
  direction: SlideDirection,
): number {
  const edges = getSlideEdges(direction);
  const size = edges.vertical ? rect.height : rect.width;
  if (!(size > 0)) return snapToStep(min, min, max, step);
  let fraction: number;
  switch (direction) {
    case "from-left":
      fraction = (clientPos - rect.left) / size;
      break;
    case "from-right":
      fraction = (rect.left + size - clientPos) / size;
      break;
    case "from-bottom":
      fraction = (rect.top + size - clientPos) / size;
      break;
    case "from-top":
      fraction = (clientPos - rect.top) / size;
      break;
  }
  return snapToStep(min + clamp(fraction, 0, 1) * (max - min), min, max, step);
}

/**
 * Which thumb a pointer press at `target` should move: the nearest one. When several are equally
 * near the one that lies in the pointer's direction wins, so two stacked thumbs can still be pulled
 * apart (press above them moves the upper one, below moves the lower one).
 *
 * @param values Thumb values, one per thumb.
 * @param target The value under the pointer.
 * @returns The thumb index, 0 for an empty list.
 * @example
 * import { getClosestThumbIndex } from "@shadow-js/primitives";
 *
 * getClosestThumbIndex([50, 50], 80); // 1
 * @see {@link getValueFromPointer}
 * @since 1.0.0
 */
export function getClosestThumbIndex(values: readonly number[], target: number): number {
  let best = Number.POSITIVE_INFINITY;
  for (const value of values) best = Math.min(best, Math.abs(value - target));
  const nearest: number[] = [];
  values.forEach((value, index) => {
    if (Math.abs(value - target) === best) nearest.push(index);
  });
  const first = nearest[0];
  const last = nearest[nearest.length - 1];
  if (first === undefined || last === undefined) return 0;
  const firstValue = values[first];
  const lastValue = values[last];
  // Only stacked thumbs are ambiguous in direction; equidistant thumbs on both sides keep the first.
  if (firstValue !== undefined && firstValue === lastValue && target > firstValue) return last;
  return first;
}

/**
 * Options of {@link getNextSortedValues}. Pure math: it sets no ARIA attributes or data attributes.
 * @see {@link getNextSortedValues}
 * @since 1.0.0
 */
export interface NextValuesOptions {
  /**
   * Smallest allowed value.
   * @default none (required)
   */
  readonly min: number;
  /**
   * Largest allowed value.
   * @default none (required)
   */
  readonly max: number;
  /**
   * Distance between allowed values. A non-positive step only clamps.
   * @default none (required)
   */
  readonly step: number;
  /**
   * Minimum distance between neighboring thumbs, in steps.
   * @default none (required)
   */
  readonly minStepsBetweenThumbs: number;
}

/**
 * Moves one thumb to `nextValue` and returns the new list. The value is snapped to the step and
 * held between its neighbors (kept `minStepsBetweenThumbs` steps away), so thumbs keep their
 * index and the list stays sorted. Other thumbs are never touched.
 *
 * @param values Current values, one per thumb.
 * @param nextValue The wanted value of the thumb.
 * @param atIndex Which thumb moves.
 * @param options Range, step and spacing.
 * @returns A new list, or `values` itself when the index is unknown or no room is left.
 * @example
 * import { getNextSortedValues } from "@shadow-js/primitives";
 *
 * getNextSortedValues([10, 50], 70, 0, { min: 0, max: 100, step: 1, minStepsBetweenThumbs: 5 }); // [45, 50]
 * @see {@link NextValuesOptions}
 * @since 1.0.0
 */
export function getNextSortedValues(
  values: readonly number[],
  nextValue: number,
  atIndex: number,
  options: NextValuesOptions,
): readonly number[] {
  const current = values[atIndex];
  if (current === undefined) return values;
  const gap = Math.max(0, options.minStepsBetweenThumbs) * (options.step > 0 ? options.step : 0);
  const before = atIndex > 0 ? values[atIndex - 1] : undefined;
  const after = values[atIndex + 1];
  const lower = before === undefined ? options.min : before + gap;
  const upper = after === undefined ? options.max : after - gap;
  if (lower > upper) return values;
  const snapped = snapToStep(nextValue, options.min, options.max, options.step);
  const decimals = Math.max(getDecimalCount(options.step), getDecimalCount(options.min));
  const next = roundToDecimals(clamp(snapped, lower, upper), decimals);
  if (next === current) return values;
  const copy = [...values];
  copy[atIndex] = next;
  return copy;
}

/**
 * The accessible name a thumb gets when the application gave none: "Minimum" and "Maximum" for a
 * range with two thumbs, "Value i of n" for more, nothing for a single thumb.
 *
 * @param index Thumb index.
 * @param total Number of thumbs.
 * @returns The label, or `undefined`.
 * @example
 * import { getThumbLabel } from "@shadow-js/primitives";
 *
 * getThumbLabel(0, 2); // "Minimum"
 * @see {@link SliderThumb}
 * @since 1.0.0
 */
export function getThumbLabel(index: number, total: number): string | undefined {
  if (total > 2) return `Value ${index + 1} of ${total}`;
  if (total === 2) return index === 0 ? "Minimum" : "Maximum";
  return undefined;
}

/**
 * How far to push a thumb, in pixels, so it stays inside the track at the extremes: at 0% the
 * thumb's start edge sits on the track's start edge, at 100% its end edge on the track's end edge,
 * and the offset fades linearly in between. Combined with a `-50%` translation of the thumb.
 *
 * @param thumbSize Measured size of the thumb along the axis, in pixels.
 * @param percent The thumb's position in `[0, 100]`.
 * @param sign `1` when the value grows with the anchored edge's offset, `-1` otherwise.
 * @returns The offset in pixels to add to the percentage.
 * @example
 * import { getThumbInBoundsOffset } from "@shadow-js/primitives";
 *
 * getThumbInBoundsOffset(20, 0, 1); // 10
 * @see {@link valueToPercent}
 * @since 1.0.0
 */
export function getThumbInBoundsOffset(thumbSize: number, percent: number, sign: 1 | -1): number {
  const half = thumbSize / 2;
  const traveled = (percent / 50) * half;
  return (half - traveled * sign) * sign;
}

/**
 * What a key does to a slider thumb: jump to an end, or step up or down (by one step or by a large
 * step). Pure data.
 * @see {@link getKeyAction}
 * @since 1.0.0
 */
export type KeyAction =
  | { readonly kind: "min" }
  | { readonly kind: "max" }
  | { readonly kind: "step"; readonly direction: 1 | -1; readonly large: boolean };

/** Arrow keys that lower the value for each direction (Radix: the others raise it). */
const DECREASING: Readonly<Record<SlideDirection, readonly string[]>> = {
  "from-left": ["ArrowDown", "ArrowLeft"],
  "from-right": ["ArrowDown", "ArrowRight"],
  "from-bottom": ["ArrowDown", "ArrowLeft"],
  "from-top": ["ArrowUp", "ArrowLeft"],
};

const INCREASING: Readonly<Record<SlideDirection, readonly string[]>> = {
  "from-left": ["ArrowUp", "ArrowRight"],
  "from-right": ["ArrowUp", "ArrowLeft"],
  "from-bottom": ["ArrowUp", "ArrowRight"],
  "from-top": ["ArrowDown", "ArrowRight"],
};

/**
 * What a key does to a slider thumb. Home and End jump to the ends, PageUp and PageDown and
 * Shift+Arrow move by a large step, arrows by one step; which arrow lowers the value follows the
 * slide direction (RTL, inverted and vertical sliders included).
 *
 * @param key `KeyboardEvent.key`.
 * @param shiftKey Whether Shift is held.
 * @param direction Where the minimum sits.
 * @returns The action, or `undefined` for keys the slider ignores.
 * @example
 * import { getKeyAction } from "@shadow-js/primitives";
 *
 * getKeyAction("ArrowLeft", false, "from-right"); // { kind: "step", direction: 1, large: false }
 * @see {@link KeyAction}
 * @since 1.0.0
 */
export function getKeyAction(
  key: string,
  shiftKey: boolean,
  direction: SlideDirection,
): KeyAction | undefined {
  if (key === "Home") return { kind: "min" };
  if (key === "End") return { kind: "max" };
  if (key === "PageUp") return { kind: "step", direction: 1, large: true };
  if (key === "PageDown") return { kind: "step", direction: -1, large: true };
  if (INCREASING[direction].includes(key)) return { kind: "step", direction: 1, large: shiftKey };
  if (DECREASING[direction].includes(key)) return { kind: "step", direction: -1, large: shiftKey };
  return undefined;
}

/**
 * Applies a {@link KeyAction} to a thumb value, before snapping.
 *
 * @param action The action.
 * @param value The thumb's current value.
 * @param min Minimum.
 * @param max Maximum.
 * @param step Step; a large step is ten of them.
 * @returns The wanted value.
 * @example
 * import { getKeyValue } from "@shadow-js/primitives";
 *
 * getKeyValue({ kind: "step", direction: 1, large: true }, 5, 0, 100, 1); // 15
 * @see {@link getKeyAction}
 * @since 1.0.0
 */
export function getKeyValue(
  action: KeyAction,
  value: number,
  min: number,
  max: number,
  step: number,
): number {
  if (action.kind === "min") return min;
  if (action.kind === "max") return max;
  return value + step * (action.large ? 10 : 1) * action.direction;
}
