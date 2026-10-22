import { ScrollAreaRoot } from "./root";
import { ScrollAreaCorner, ScrollAreaScrollbar, ScrollAreaThumb } from "./scrollbar";
import { ScrollAreaViewport } from "./viewport";

export type { ScrollAreaContextValue, ScrollMetrics } from "./context";
export { EMPTY_METRICS, scrollAreaContext } from "./context";
export type { ScrollbarType } from "./logic";
export {
  MIN_THUMB_SIZE,
  maxScroll,
  scrollbarVisible,
  scrollForOffset,
  thumbOffset,
  thumbSize,
} from "./logic";
export type { ScrollAreaOwnProps, ScrollAreaProps } from "./root";
export type {
  ScrollAreaCornerProps,
  ScrollAreaScrollbarOwnProps,
  ScrollAreaScrollbarProps,
  ScrollAreaThumbProps,
} from "./scrollbar";
export type { ScrollAreaViewportProps } from "./viewport";
export {
  ScrollAreaCorner,
  ScrollAreaRoot,
  ScrollAreaScrollbar,
  ScrollAreaThumb,
  ScrollAreaViewport,
};

/**
 * The scroll area primitive: `ScrollArea`, `ScrollArea.Viewport`, `ScrollArea.Scrollbar`,
 * `ScrollArea.Thumb` and `ScrollArea.Corner`. Each part is also exported by name. Keyboard: the
 * viewport is the tab stop while it overflows, and the browser's native scroll keys move it; the
 * bars and thumbs are pointer only. ARIA: none; the bars are `role="presentation"`.
 *
 * @example
 * import { ScrollArea } from "@shadow-js/primitives";
 *
 * export function Feed() {
 *   return (
 *     <ScrollArea type="auto">
 *       <ScrollArea.Viewport class="h-72">content</ScrollArea.Viewport>
 *       <ScrollArea.Scrollbar orientation="vertical">
 *         <ScrollArea.Thumb />
 *       </ScrollArea.Scrollbar>
 *     </ScrollArea>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ScrollAreaRoot}
 */
export const ScrollArea: typeof ScrollAreaRoot & {
  readonly Viewport: typeof ScrollAreaViewport;
  readonly Scrollbar: typeof ScrollAreaScrollbar;
  readonly Thumb: typeof ScrollAreaThumb;
  readonly Corner: typeof ScrollAreaCorner;
} = Object.assign(ScrollAreaRoot, {
  Viewport: ScrollAreaViewport,
  Scrollbar: ScrollAreaScrollbar,
  Thumb: ScrollAreaThumb,
  Corner: ScrollAreaCorner,
});
