/**
 * The pure math behind swipe-to-dismiss: how far a pointer has traveled along the swipe axis,
 * whether that travel counts as a swipe, and how much slack a gesture gets before it commits.
 * Kept free of DOM and framework code so it can be property-tested.
 * @packageDocumentation
 */

/**
 * The side a toast is swiped toward to dismiss it: `"right"` (the default), `"left"`, `"up"` or `"down"`. Its axis decides which travel counts as a swipe.
 * @since 1.0.0
 * @see {@link ToastProviderProps}
 */
export type SwipeDirection = "right" | "left" | "up" | "down";

/**
 * A displacement in px along each axis, or a pointer position in client coordinates. `x` grows to the right and `y` grows downward.
 * @since 1.0.0
 * @see {@link getSwipeDelta}
 */
export interface SwipePoint {
  /** The horizontal component, in px. Grows to the right. */
  readonly x: number;
  /** The vertical component, in px. Grows downward. */
  readonly y: number;
}

/**
 * Whether a swipe direction moves along the horizontal axis. The axis decides which travel {@link getSwipeDelta} and {@link isDeltaInDirection} use.
 *
 * @param direction The swipe direction.
 * @returns `true` for `"left"` and `"right"`, `false` for `"up"` and `"down"`.
 * @example
 * import { isHorizontalSwipe } from "@shadow-js/primitives";
 *
 * isHorizontalSwipe("left"); // true
 * isHorizontalSwipe("down"); // false
 * @see {@link SwipeDirection}
 * @since 1.0.0
 */
export function isHorizontalSwipe(direction: SwipeDirection): boolean {
  return direction === "left" || direction === "right";
}

/** A finite number, so a NaN or infinite pointer coordinate can never poison the math. */
function finite(value: number): number {
  return Number.isFinite(value) ? value : 0;
}

/**
 * The displacement of a swipe: the travel from `start` to `current`, kept on the swipe axis and clamped so the toast can only follow the pointer toward `direction`, never away from it and never sideways. The other axis is always `0`.
 *
 * @param start Where the pointer went down.
 * @param current Where the pointer is now.
 * @param direction The side the toast is dismissed toward.
 * @returns The clamped displacement.
 * @example
 * import { getSwipeDelta } from "@shadow-js/primitives";
 *
 * getSwipeDelta({ x: 100, y: 40 }, { x: 160, y: 90 }, "right"); // { x: 60, y: 0 }
 * getSwipeDelta({ x: 100, y: 40 }, { x: 60, y: 90 }, "right"); // { x: 0, y: 0 }
 * @see {@link SwipePoint}
 * @see {@link SwipeDirection}
 * @since 1.0.0
 */
export function getSwipeDelta(
  start: SwipePoint,
  current: SwipePoint,
  direction: SwipeDirection,
): SwipePoint {
  const x = finite(current.x - start.x);
  const y = finite(current.y - start.y);
  const towardNegative = direction === "left" || direction === "up";
  const clamp = towardNegative ? Math.min : Math.max;
  if (isHorizontalSwipe(direction)) return { x: clamp(0, x) + 0, y: 0 };
  return { x: 0, y: clamp(0, y) + 0 };
}

/**
 * Whether a displacement is a swipe in `direction` that traveled farther than `threshold`. The travel must lie on the swipe axis and be larger than the travel on the other axis, so a mostly perpendicular drag is not a swipe however far it goes. For vertical directions a tie counts; for horizontal directions it does not. The sign is ignored: pass a delta already clamped by {@link getSwipeDelta} to make the direction matter.
 *
 * @param delta The displacement.
 * @param direction The swipe direction. Only its axis matters for the test; the sign is ignored.
 * @param threshold The distance, in px, the travel must exceed. Default `0`.
 * @returns `true` when the gesture is on the swipe axis and past the threshold.
 * @example
 * import { isDeltaInDirection } from "@shadow-js/primitives";
 *
 * isDeltaInDirection({ x: 80, y: 10 }, "right", 50); // true
 * isDeltaInDirection({ x: 30, y: 10 }, "right", 50); // false
 * @see {@link getSwipeDelta}
 * @see {@link SwipeDirection}
 * @since 1.0.0
 */
export function isDeltaInDirection(
  delta: SwipePoint,
  direction: SwipeDirection,
  threshold = 0,
): boolean {
  const deltaX = Math.abs(finite(delta.x));
  const deltaY = Math.abs(finite(delta.y));
  const dominatesX = deltaX > deltaY;
  if (isHorizontalSwipe(direction)) return dominatesX && deltaX > threshold;
  return !dominatesX && deltaY > threshold;
}

/**
 * The slack, in px, a pointer may travel before the gesture is classified as a swipe or as something else (a scroll, a tap). Fingers are less precise than mice, so touch gets more.
 *
 * @param pointerType The `pointerType` of the pointer event, such as `"touch"`, `"mouse"` or `"pen"`.
 * @returns `10` for touch, `2` otherwise.
 * @example
 * import { getSwipeMoveBuffer } from "@shadow-js/primitives";
 *
 * getSwipeMoveBuffer("touch"); // 10
 * getSwipeMoveBuffer("mouse"); // 2
 * @see {@link hasLeftDeadZone}
 * @see {@link isDeltaInDirection}
 * @since 1.0.0
 */
export function getSwipeMoveBuffer(pointerType: string): number {
  return pointerType === "touch" ? 10 : 2;
}

/**
 * Whether the raw, unclamped travel has left the dead zone on either axis. For a gesture that has not started a swipe, leaving it means the user is doing something else and the swipe is abandoned.
 *
 * @param start Where the pointer went down.
 * @param current Where the pointer is now.
 * @param buffer The slack, see {@link getSwipeMoveBuffer}.
 * @returns `true` when the pointer moved farther than `buffer` on either axis.
 * @example
 * import { hasLeftDeadZone } from "@shadow-js/primitives";
 *
 * hasLeftDeadZone({ x: 0, y: 0 }, { x: 0, y: 5 }, 2); // true
 * @see {@link getSwipeMoveBuffer}
 * @see {@link isDeltaInDirection}
 * @since 1.0.0
 */
export function hasLeftDeadZone(start: SwipePoint, current: SwipePoint, buffer: number): boolean {
  return (
    Math.abs(finite(current.x - start.x)) > buffer || Math.abs(finite(current.y - start.y)) > buffer
  );
}
