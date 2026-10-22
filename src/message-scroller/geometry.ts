/**
 * The arithmetic behind the message scroller, as pure functions of numbers (a position, a height, a margin), so each rule is testable without
 * a layout engine. A "position" is a distance from the top of the scrollable content, in pixels.
 * @packageDocumentation
 */

/** The measurements of a scroll container. @since 1.0.0 */
export interface MessageScrollMetrics {
  /** How far the content is scrolled from its top. */
  readonly scrollTop: number;
  /** The height of the visible window. */
  readonly clientHeight: number;
  /** The height of everything, including the room kept below the last anchored turn. */
  readonly scrollHeight: number;
  /** The height of the room kept below the last anchored turn (not content). */
  readonly spacer: number;
}

/** Which edges of the content the viewport can still scroll toward. @since 1.0.0 */
export interface MessageScrollEdges {
  /** Content is hidden above the visible window. */
  readonly start: boolean;
  /** Content is hidden below the visible window. */
  readonly end: boolean;
}

/**
 * Which edges still have content beyond them. The bottom edge is the bottom of the real content, not of the room kept under the last turn:
 * a reader who can see all the content is "at the end" even when the window could scroll further into that room.
 *
 * @param metrics - The measurements.
 * @param threshold - How close to an edge still counts as being at it, in pixels.
 * @returns The edges with more to see.
 * @example
 * import { edgesOf } from "@shadow-js/primitives";
 *
 * const edges = edgesOf({ scrollTop: 0, clientHeight: 400, scrollHeight: 1000, spacer: 0 }, 8);
 * // { start: false, end: true }
 * @since 1.0.0
 */
export function edgesOf(metrics: MessageScrollMetrics, threshold: number): MessageScrollEdges {
  const realBottom = metrics.scrollHeight - metrics.spacer;
  return {
    start: metrics.scrollTop > threshold,
    end: realBottom - (metrics.scrollTop + metrics.clientHeight) > threshold,
  };
}

/**
 * The scroll position that puts a turn near the top of the window, with part of the previous turn still showing above it.
 *
 * @param itemTop - The turn's distance from the top of the content.
 * @param margin - The margin kept above the aligned edge.
 * @param peek - How much of the previous turn stays visible.
 * @returns The scroll position, never below zero.
 * @example
 * import { anchorPosition } from "@shadow-js/primitives";
 *
 * anchorPosition(900, 0, 64); // 836
 * @since 1.0.0
 */
export function anchorPosition(itemTop: number, margin: number, peek: number): number {
  return Math.max(0, itemTop - margin - peek);
}

/**
 * The height of the room to keep below the content, so that the last anchored turn can sit near the top of the window before its reply fills it.
 * It is the part of the window the turn and its reply do not cover yet, and zero once they cover all of it.
 *
 * @param clientHeight - The height of the window.
 * @param anchorTop - The last anchored turn's distance from the top of the content.
 * @param contentBottom - The distance of the bottom of the real content from the top of the content.
 * @param margin - The margin kept above the aligned edge.
 * @param peek - How much of the previous turn stays visible.
 * @returns The height of the room, never negative.
 * @example
 * import { spacerHeight } from "@shadow-js/primitives";
 *
 * spacerHeight(600, 900, 1000, 0, 64); // 564
 * @since 1.0.0
 */
export function spacerHeight(
  clientHeight: number,
  anchorTop: number,
  contentBottom: number,
  margin: number,
  peek: number,
): number {
  return Math.max(0, clientHeight - (contentBottom - anchorTop) - margin - peek);
}

/** Where in the window a message is placed by a jump. @since 1.0.0 */
export type MessageAlign = "start" | "center" | "end" | "nearest";

/**
 * The scroll position that brings a message into view.
 *
 * @param align - `"start"` puts its top at the top edge (after the margin), `"end"` its bottom at the bottom edge, `"center"` the middle, and
 * `"nearest"` moves the least, or not at all when it is already fully visible.
 * @param item - The message's top and height, from the top of the content.
 * @param metrics - The window's current scroll position and height.
 * @param margin - The margin kept on the aligned edge.
 * @returns The scroll position, clamped to the content.
 * @example
 * import { alignPosition } from "@shadow-js/primitives";
 *
 * alignPosition("start", { top: 500, height: 80 }, { scrollTop: 0, clientHeight: 400, scrollHeight: 2000 }, 0); // 500
 * @since 1.0.0
 */
export function alignPosition(
  align: MessageAlign,
  item: { readonly top: number; readonly height: number },
  metrics: Pick<MessageScrollMetrics, "scrollTop" | "clientHeight" | "scrollHeight">,
  margin: number,
): number {
  const startPosition = item.top - margin;
  const endPosition = item.top + item.height - metrics.clientHeight + margin;
  let target: number;
  if (align === "start") target = startPosition;
  else if (align === "end") target = endPosition;
  else if (align === "center") target = item.top + item.height / 2 - metrics.clientHeight / 2;
  else if (startPosition < metrics.scrollTop) target = startPosition;
  else if (endPosition > metrics.scrollTop) target = endPosition;
  else target = metrics.scrollTop;
  return clampPosition(target, metrics);
}

/**
 * Keeps a scroll position inside the content: from the top to the furthest the window can go.
 *
 * @param position - The wanted position.
 * @param metrics - The window and content heights.
 * @returns The position, from 0 to `scrollHeight - clientHeight`.
 * @example
 * import { clampPosition } from "@shadow-js/primitives";
 *
 * clampPosition(5000, { clientHeight: 400, scrollHeight: 1000 }); // 600
 * @since 1.0.0
 */
export function clampPosition(
  position: number,
  metrics: Pick<MessageScrollMetrics, "clientHeight" | "scrollHeight">,
): number {
  const furthest = Math.max(0, metrics.scrollHeight - metrics.clientHeight);
  return Math.min(Math.max(0, position), furthest);
}

/**
 * How far the scroll position must move so that a message the reader was looking at stays where it was after rows were added above it.
 *
 * @param before - The message's distance from the top of the window before the change.
 * @param after - Its distance from the top of the window after the change.
 * @returns The amount to add to the scroll position. Zero when nothing moved.
 * @example
 * import { prependCorrection } from "@shadow-js/primitives";
 *
 * prependCorrection(40, 340); // 300
 * @since 1.0.0
 */
export function prependCorrection(before: number, after: number): number {
  const delta = after - before;
  return Math.abs(delta) < 0.5 ? 0 : delta;
}

/** A message's place in a transcript, for deciding which are visible. @since 1.0.0 */
export interface MessageBox {
  readonly id: string;
  readonly anchor: boolean;
  readonly top: number;
  readonly bottom: number;
}

/**
 * Which messages are visible, and which turn the reader is in. The reading line is the top edge of the window; the current anchor is
 * the last anchored message at or above it, and it stays set after the anchor scrolls out of view.
 *
 * @param boxes - The messages in document order, with their places.
 * @param scrollTop - The scroll position.
 * @param clientHeight - The height of the window.
 * @returns The id of the current anchor (or `null` before the first one) and the ids that intersect the window, in order.
 * @example
 * import { visibilityOf } from "@shadow-js/primitives";
 *
 * visibilityOf([{ id: "a", anchor: true, top: 0, bottom: 100 }], 0, 400);
 * // { currentAnchorId: "a", visibleMessageIds: ["a"] }
 * @since 1.0.0
 */
export function visibilityOf(
  boxes: readonly MessageBox[],
  scrollTop: number,
  clientHeight: number,
): { readonly currentAnchorId: string | null; readonly visibleMessageIds: string[] } {
  let currentAnchorId: string | null = null;
  const visibleMessageIds: string[] = [];
  for (const box of boxes) {
    if (box.anchor && box.top <= scrollTop) currentAnchorId = box.id;
    if (box.bottom > scrollTop && box.top < scrollTop + clientHeight)
      visibleMessageIds.push(box.id);
  }
  return { currentAnchorId, visibleMessageIds };
}
