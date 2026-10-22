import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createMessageScrollerContext,
  type MessageScrollPosition,
  messageScrollerContext,
} from "./context";

/**
 * Props of {@link MessageScrollerProvider}: the behavior of the scroller and the subtree.
 *
 * Accessibility: the provider renders no element and sets no ARIA attribute, role or key.
 * @see {@link MessageScrollerProvider}
 * @since 1.0.0
 */
export interface MessageScrollerProviderProps {
  /**
   * Follows new content only while the reader is at the live edge (the bottom of the transcript). A wheel, touch or keyboard scroll, or a
   * jump to a message, stops the following until the reader comes back to the live edge.
   * @default false
   */
  readonly autoScroll?: boolean | undefined;
  /**
   * Where the transcript opens, applied once when it first has rows. `"last-anchor"` opens at the last anchored turn, or at the end when that turn
   * fits in the window or there is no anchor. While `"end"` or `"last-anchor"` is still being applied the viewport carries
   * `data-pending-scroll`, so a stylesheet can hide it and the reader never sees the jump.
   * @default "end"
   */
  readonly defaultScrollPosition?: MessageScrollPosition | undefined;
  /**
   * How close to an edge still counts as being at it, in pixels. It decides `data-scrollable`, the button's state and the live edge.
   * @default 8
   */
  readonly scrollEdgeThreshold?: number | undefined;
  /**
   * A margin kept on the aligned edge by jumps, visibility and the placement of anchored turns, in pixels.
   * @default 0
   */
  readonly scrollMargin?: number | undefined;
  /**
   * How much of the previous row stays visible above a new anchored turn, in pixels. It is added to `scrollMargin`.
   * @default 64
   */
  readonly scrollPreviousItemPeek?: number | undefined;
  /**
   * The scroller: a root, a viewport, a content and the rows.
   * @default none
   */
  readonly children?: JsxChild;
}

/**
 * The state of a message scroller, for the parts below it. It renders no element. It owns the scroll position logic: it keeps the reader's place
 * while a reply streams in, puts a new turn near the top of the window, follows the newest text while the reader stays at the bottom, keeps what the
 * reader is looking at still when older rows are added above it, and opens the transcript where `defaultScrollPosition` says.
 *
 * Accessibility: none of its own; see {@link MessageScrollerViewport} and {@link MessageScrollerContent}.
 *
 * @param props See {@link MessageScrollerProviderProps}.
 * @returns The subtree.
 * @example
 * import { MessageScroller } from "@shadow-js/primitives";
 *
 * export function Thread(props: { readonly ids: readonly string[] }) {
 *   return (
 *     <MessageScroller.Provider autoScroll>
 *       <MessageScroller.Root class="h-96">
 *         <MessageScroller.Viewport class="h-full overflow-y-auto">
 *           <MessageScroller.Content>
 *             {props.ids.map((id) => (
 *               <MessageScroller.Item messageId={id}>{id}</MessageScroller.Item>
 *             ))}
 *           </MessageScroller.Content>
 *         </MessageScroller.Viewport>
 *       </MessageScroller.Root>
 *     </MessageScroller.Provider>
 *   );
 * }
 * @see {@link MessageScrollerProviderProps}
 * @since 1.0.0
 */
export function MessageScrollerProvider(props: MessageScrollerProviderProps): JsxChild {
  const [own, rest] = splitProps(props, [
    "autoScroll",
    "defaultScrollPosition",
    "scrollEdgeThreshold",
    "scrollMargin",
    "scrollPreviousItemPeek",
    "children",
  ]);
  void rest;
  const context = createMessageScrollerContext(own);
  return (
    <messageScrollerContext.Provider value={context}>
      {own.children}
    </messageScrollerContext.Provider>
  );
}
