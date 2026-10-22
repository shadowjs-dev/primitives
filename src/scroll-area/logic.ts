/**
 * The arithmetic of a custom scrollbar, kept pure so it is tested without a layout engine:
 * how long the thumb is, where it sits for a scroll position, and the scroll position a pointer
 * position means while the thumb is dragged.
 * @packageDocumentation
 */

/**
 * The shortest thumb, in pixels, so a very long content still shows a grabbable thumb.
 *
 * @example
 * import { MIN_THUMB_SIZE, thumbSize } from "@shadow-js/primitives";
 *
 * export const isFloor: boolean = thumbSize(100, 10, 100_000) === MIN_THUMB_SIZE;
 * @since 1.0.0
 * @see {@link thumbSize}
 */
export const MIN_THUMB_SIZE = 18;

/** Clamps `value` into `[low, high]`. */
function clamp(value: number, low: number, high: number): number {
  return Math.min(high, Math.max(low, value));
}

/**
 * The largest scroll position: how far the content can move past the viewport.
 *
 * @param content The content length along the axis.
 * @param viewport The visible length along the axis.
 * @returns A number `>= 0`.
 * @example
 * import { maxScroll } from "@shadow-js/primitives";
 *
 * export const ranges: readonly number[] = [maxScroll(400, 100), maxScroll(80, 100)];
 * @since 1.0.0
 * @see {@link thumbOffset}
 */
export function maxScroll(content: number, viewport: number): number {
  return Math.max(0, content - viewport);
}

/**
 * The length of the thumb. The thumb is the track scaled by the visible share of the content, never
 * shorter than {@link MIN_THUMB_SIZE} and never longer than the track. Without overflow the thumb
 * fills the track.
 *
 * @param track The track length.
 * @param viewport The visible length.
 * @param content The content length.
 * @returns The thumb length in pixels, `<= track`.
 * @example
 * import { thumbSize } from "@shadow-js/primitives";
 *
 * export const length: number = thumbSize(200, 100, 400); // 50
 * @see {@link ScrollAreaScrollbar}
 * @since 1.0.0
 */
export function thumbSize(track: number, viewport: number, content: number): number {
  if (track <= 0) return 0;
  if (content <= viewport || content <= 0) return track;
  return Math.min(track, Math.max(MIN_THUMB_SIZE, (track * viewport) / content));
}

/**
 * The offset of the thumb for a scroll position.
 *
 * @param track The track length.
 * @param thumb The thumb length from {@link thumbSize}.
 * @param scroll The scroll position. A negative value (RTL horizontal scrolling) is read by its
 *   magnitude: the distance from the scroll origin.
 * @param max The largest scroll position from {@link maxScroll}.
 * @param reversed True for a bar whose scroll origin is its far end (RTL horizontal). The thumb then
 *   starts at the far end and moves toward the start as the content scrolls toward its end.
 * @returns The thumb offset, in `[0, track - thumb]`, measured from the near (left or top) end.
 * @example
 * import { thumbOffset } from "@shadow-js/primitives";
 *
 * export const offset: number = thumbOffset(100, 25, 150, 300); // 37.5
 * @since 1.0.0
 * @see {@link scrollForOffset}
 */
export function thumbOffset(
  track: number,
  thumb: number,
  scroll: number,
  max: number,
  reversed = false,
): number {
  if (max <= 0) return 0;
  const travel = Math.max(0, track - thumb);
  const distance = clamp(Math.abs(scroll), 0, max);
  return reversed ? (travel * (max - distance)) / max : (travel * distance) / max;
}

/**
 * The scroll position for a thumb offset: the inverse of {@link thumbOffset}.
 *
 * @param offset The thumb offset, measured from the near (left or top) end.
 * @param track The track length.
 * @param thumb The thumb length.
 * @param max The largest scroll position.
 * @param reversed The same flag as {@link thumbOffset}.
 * @returns A scroll position magnitude in `[0, max]`.
 * @example
 * import { scrollForOffset } from "@shadow-js/primitives";
 *
 * export const scroll: number = scrollForOffset(37.5, 100, 25, 300); // 150
 * @since 1.0.0
 * @see {@link thumbOffset}
 */
export function scrollForOffset(
  offset: number,
  track: number,
  thumb: number,
  max: number,
  reversed = false,
): number {
  const travel = track - thumb;
  if (travel <= 0 || max <= 0) return 0;
  const distance = reversed ? ((travel - offset) * max) / travel : (offset * max) / travel;
  return clamp(distance, 0, max);
}

/**
 * Whether a scrollbar is shown, by its `type`:
 * `always` shows it, `auto` while the content overflows, `hover` while overflowing and the pointer is
 * over the area, `scroll` while overflowing and the content was scrolled recently.
 *
 * @see {@link ScrollAreaRoot}
 * @since 1.0.0
 */
export type ScrollbarType = "always" | "auto" | "hover" | "scroll";

/**
 * Whether a scrollbar is visible.
 *
 * @param input The type, whether the content overflows, whether it was scrolled recently and
 *   whether the pointer is over the area.
 * @returns True when the scrollbar is shown.
 * @example
 * import { scrollbarVisible } from "@shadow-js/primitives";
 *
 * export const shown: boolean = scrollbarVisible({
 *   type: "hover",
 *   overflowing: true,
 *   scrolling: false,
 *   hovering: true,
 * });
 * @since 1.0.0
 * @see {@link ScrollbarType}
 */
export function scrollbarVisible(input: {
  readonly type: ScrollbarType;
  readonly overflowing: boolean;
  readonly scrolling: boolean;
  readonly hovering: boolean;
}): boolean {
  switch (input.type) {
    case "always":
      return true;
    case "auto":
      return input.overflowing;
    case "hover":
      return input.overflowing && input.hovering;
    case "scroll":
      return input.overflowing && input.scrolling;
    default:
      return false;
  }
}
