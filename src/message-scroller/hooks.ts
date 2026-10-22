import { type Accessor, onCleanup } from "@shadow-js/core";
import { type MessageScrollToOptions, messageScrollerContext } from "./context";

/**
 * The commands of a message scroller, for buttons and shortcuts of your own. Each returns `false` when it could not be applied.
 *
 * @since 1.0.0
 */
export interface MessageScrollerCommands {
  /**
   * Scrolls a message into view. A message that has not mounted yet is waited for: the jump is kept (one at a time) and runs when the row
   * appears, and a hand scroll cancels it. Returns `false` only when the viewport itself is not mounted.
   */
  readonly scrollToMessage: (messageId: string, options?: MessageScrollToOptions) => boolean;
  /** Scrolls to the bottom of the transcript. Returns `false` when the viewport is not mounted. */
  readonly scrollToEnd: (options?: MessageScrollToOptions) => boolean;
  /** Scrolls to the top of the transcript. Returns `false` when the viewport is not mounted. */
  readonly scrollToStart: (options?: MessageScrollToOptions) => boolean;
}

/**
 * The imperative commands of the nearest message scroller. Call it while a component sets up, inside the provider.
 *
 * Accessibility: none of its own. A jump moves the viewport, not focus: move focus yourself when the jump is a navigation.
 *
 * @returns {@link MessageScrollerCommands}.
 * @throws Error when called outside a `MessageScroller.Provider`.
 * @example
 * import { useMessageScroller } from "@shadow-js/primitives";
 *
 * export function ToLatest() {
 *   const { scrollToEnd } = useMessageScroller();
 *   return <button onClick={() => scrollToEnd({ behavior: "smooth" })}>Latest</button>;
 * }
 * @see {@link useMessageScrollerScrollable}
 * @since 1.0.0
 */
export function useMessageScroller(): MessageScrollerCommands {
  const scroller = messageScrollerContext.use("useMessageScroller");
  return {
    scrollToMessage: scroller.scrollToMessage,
    scrollToEnd: scroller.scrollToEnd,
    scrollToStart: scroller.scrollToStart,
  };
}

/**
 * Whether content is hidden above and below the window, as accessors, for controls beside the scroller (a "new messages" chip). `end` stays `false`
 * while following the newest text keeps the reader at the live edge. To style the scroller itself, use its `data-scrollable` attribute instead.
 *
 * Accessibility: none of its own.
 *
 * @returns Accessors of `start` (content above) and `end` (content below).
 * @throws Error when called outside a `MessageScroller.Provider`.
 * @example
 * import { useMessageScrollerScrollable } from "@shadow-js/primitives";
 *
 * export function MoreBelow() {
 *   const { end } = useMessageScrollerScrollable();
 *   return <span>{end() ? "More below" : ""}</span>;
 * }
 * @see {@link useMessageScroller}
 * @since 1.0.0
 */
export function useMessageScrollerScrollable(): {
  readonly start: Accessor<boolean>;
  readonly end: Accessor<boolean>;
} {
  const scroller = messageScrollerContext.use("useMessageScrollerScrollable");
  return { start: scroller.start, end: scroller.end };
}

/**
 * Which turn the reader is in and which rows are on screen, as accessors, for an outline or a "now reading" label. The current anchor is the last
 * anchored row at or above the top of the window, and it stays set after that row scrolls away. The visible ids are in document order. The scroller
 * measures this only while a component reads it, so it costs nothing otherwise.
 *
 * Accessibility: none of its own.
 *
 * @returns Accessors of `currentAnchorId` and `visibleMessageIds`.
 * @throws Error when called outside a `MessageScroller.Provider`.
 * @example
 * import { useMessageScrollerVisibility } from "@shadow-js/primitives";
 *
 * export function Reading() {
 *   const { currentAnchorId } = useMessageScrollerVisibility();
 *   return <span>{currentAnchorId() ?? "Start"}</span>;
 * }
 * @see {@link useMessageScroller}
 * @since 1.0.0
 */
export function useMessageScrollerVisibility(): {
  readonly currentAnchorId: Accessor<string | null>;
  readonly visibleMessageIds: Accessor<readonly string[]>;
} {
  const scroller = messageScrollerContext.use("useMessageScrollerVisibility");
  const release = scroller.watchVisibility();
  onCleanup(release);
  return {
    currentAnchorId: scroller.currentAnchorId,
    visibleMessageIds: scroller.visibleMessageIds,
  };
}
