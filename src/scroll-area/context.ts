/**
 * The state a scroll area shares with its viewport and scrollbars.
 * @packageDocumentation
 */
import type { Accessor } from "@shadow-js/core";
import {
  createPartContext,
  type Direction,
  type Orientation,
  type PartContext,
} from "../utils/index";
import type { ScrollbarType } from "./logic";

/**
 * The measurements of the viewport and its content, read from the DOM.
 * @see {@link ScrollAreaRoot}
 * @since 1.0.0
 */
export interface ScrollMetrics {
  /** The vertical scroll offset of the viewport, in px. */
  readonly scrollTop: number;
  /** The horizontal scroll offset of the viewport, in px. */
  readonly scrollLeft: number;
  /** The full height of the content, in px, including the part scrolled out of view. */
  readonly scrollHeight: number;
  /** The full width of the content, in px, including the part scrolled out of view. */
  readonly scrollWidth: number;
  /** The visible height of the viewport, in px, without its scrollbar. */
  readonly clientHeight: number;
  /** The visible width of the viewport, in px, without its scrollbar. */
  readonly clientWidth: number;
}

/**
 * No measurements yet (the server render and the first client render). @internal
 * @see {@link ScrollAreaRoot}
 */
export const EMPTY_METRICS: ScrollMetrics = Object.freeze({
  scrollTop: 0,
  scrollLeft: 0,
  scrollHeight: 0,
  scrollWidth: 0,
  clientHeight: 0,
  clientWidth: 0,
});

/**
 * What the root shares. @internal
 * @see {@link ScrollAreaRoot}
 */
export interface ScrollAreaContextValue {
  readonly type: Accessor<ScrollbarType>;
  readonly metrics: Accessor<ScrollMetrics>;
  /** Whether the content overflows vertically. Tracked. */
  readonly overflowY: Accessor<boolean>;
  /** Whether the content overflows horizontally. Tracked. */
  readonly overflowX: Accessor<boolean>;
  /** Whether the content was scrolled within `scrollHideDelay`. Tracked. */
  readonly scrolling: Accessor<boolean>;
  /** Whether the pointer is over the area. Tracked. */
  readonly hovering: Accessor<boolean>;
  /** Re-reads the viewport. Called on scroll, on resize and after a drag. */
  readonly measure: () => void;
  /** Scrolls the viewport along one axis to `position`. */
  readonly scrollTo: (orientation: Orientation, position: number) => void;
  /** The viewport element, if mounted. */
  readonly viewport: () => HTMLElement | undefined;
  readonly setViewport: (element: HTMLElement | undefined) => void;
  /** Called by the viewport on scroll: marks scrolling and restarts the hide timer. */
  readonly noteScroll: () => void;
  readonly setHovering: (value: boolean) => void;
  /** The reading direction the bars follow. Tracked. */
  readonly direction: Accessor<Direction>;
}

/**
 * The context a `ScrollAreaRoot` root provides to its parts. Read it in a custom part rendered inside the
 * root; reading it anywhere else throws. Accessibility: the context carries no ARIA of its own; the
 * built-in parts use it to keep their roles, labels and focus in step.
 *
 * @example
 * import { scrollAreaContext } from "@shadow-js/primitives";
 *
 * export function State() {
 *   const root = scrollAreaContext.use("State");
 *   return <span>{root.overflowY() ? "scrolls" : "fits"}</span>;
 * }
 * @see {@link ScrollAreaRoot}
 * @since 1.0.0
 */
export const scrollAreaContext: PartContext<ScrollAreaContextValue> =
  createPartContext<ScrollAreaContextValue>("ScrollArea");

/** What a scrollbar shares with its thumb. @internal */
export interface ScrollbarContextValue {
  readonly orientation: Orientation;
}

/** @internal */
export const scrollbarContext: PartContext<ScrollbarContextValue> =
  createPartContext<ScrollbarContextValue>("ScrollAreaScrollbar");
