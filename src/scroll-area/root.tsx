import { onCleanup, splitProps, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  type Direction,
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import {
  EMPTY_METRICS,
  type ScrollAreaContextValue,
  type ScrollMetrics,
  scrollAreaContext,
} from "./context";
import type { ScrollbarType } from "./logic";

/**
 * Own props of {@link ScrollArea}.
 *
 * Accessibility: none. The root and the scrollbars set no label, and the scrollbars are
 * `role="presentation"`; the viewport is the element a keyboard user reaches (see
 * {@link ScrollAreaViewport}). Data attributes: none on the root; the `dir` attribute when `dir` is
 * set. The scrollbars carry `data-state` (`"visible"` or `"hidden"`).
 * @see {@link ScrollAreaRoot}
 * @since 1.0.0
 */
export interface ScrollAreaOwnProps {
  /**
   * When the scrollbars show: `"hover"` while the pointer is over the area, `"scroll"` after
   * scrolling, `"auto"` whenever the content overflows on that axis, `"always"` regardless.
   * @default "hover"
   */
  readonly type?: ScrollbarType | undefined;
  /**
   * Milliseconds after the last scroll before a `"scroll"` scrollbar hides.
   * @default 600
   */
  readonly scrollHideDelay?: number | undefined;
  /**
   * Reading direction. In `"rtl"` the horizontal scroll origin is on the right.
   * @default inherited: the nearest `DirectionProvider`, else the `dir` attribute of `<html>`, else `"ltr"`
   */
  readonly dir?: Direction | undefined;
}

/**
 * Props of {@link ScrollArea}.
 * @see {@link ScrollAreaRoot}
 * @since 1.0.0
 */
export type ScrollAreaProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  ScrollAreaOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const DEFAULT_HIDE_DELAY = 600;

/** Reads the measurements of a viewport. @internal */
function readMetrics(element: HTMLElement): ScrollMetrics {
  return {
    scrollTop: element.scrollTop,
    scrollLeft: element.scrollLeft,
    scrollHeight: element.scrollHeight,
    scrollWidth: element.scrollWidth,
    clientHeight: element.clientHeight,
    clientWidth: element.clientWidth,
  };
}

/**
 * A scrollable region with custom scrollbars. The root owns the measurements of its viewport and
 * decides when the scrollbars show; the viewport scrolls natively (wheel, touch, keyboard), and the
 * scrollbar thumbs follow it and can be dragged.
 *
 * Renders a `div`. Put a {@link ScrollAreaViewport} inside it, then the scrollbars and an optional
 * corner. Keyboard: none of its own. The viewport is the tab stop while it overflows, and the
 * browser's native scroll keys move it; the bars and thumbs take no focus. ARIA: none; the bars are
 * `role="presentation"`.
 *
 * @param props See {@link ScrollAreaProps}.
 * @returns The root `div` with its parts inside.
 * @example
 * import { ScrollAreaCorner, ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb, ScrollAreaViewport } from "@shadow-js/primitives";
 *
 * export function Feed() {
 *   return (
 *     <ScrollAreaRoot type="auto">
 *       <ScrollAreaViewport class="h-72">content</ScrollAreaViewport>
 *       <ScrollAreaScrollbar orientation="vertical">
 *         <ScrollAreaThumb />
 *       </ScrollAreaScrollbar>
 *       <ScrollAreaCorner />
 *     </ScrollAreaRoot>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ScrollAreaViewport}
 * @see {@link ScrollAreaScrollbar}
 */
export function ScrollAreaRoot<T extends PolymorphicTarget = "div">(
  props: ScrollAreaProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & ScrollAreaOwnProps>(props), [
    "as",
    "type",
    "scrollHideDelay",
    "dir",
    "onPointerEnter",
    "onPointerLeave",
  ]);
  const [metrics, setMetrics] = useSignal<ScrollMetrics>(EMPTY_METRICS);
  const [viewport, setViewportElement] = useSignal<HTMLElement | undefined>(undefined);
  const [scrolling, setScrolling] = useSignal(false);
  const [hovering, setHovering] = useSignal(false);
  const direction = useDirectionAround(() => own.dir as Direction | undefined, viewport);
  const type = (): ScrollbarType => (own.type as ScrollbarType | undefined) ?? "hover";
  let hideTimer: ReturnType<typeof setTimeout> | undefined;
  onCleanup(() => {
    if (hideTimer !== undefined) clearTimeout(hideTimer);
  });

  const measure = (): void => {
    const element = viewport();
    if (element !== undefined) setMetrics(readMetrics(element));
  };

  const overflowY = (): boolean => metrics().scrollHeight > metrics().clientHeight;
  const overflowX = (): boolean => metrics().scrollWidth > metrics().clientWidth;

  const context: ScrollAreaContextValue = {
    type,
    metrics,
    overflowY,
    overflowX,
    scrolling,
    hovering,
    measure,
    scrollTo(orientation: Orientation, position: number): void {
      const element = viewport();
      if (element === undefined) return;
      if (orientation === "vertical") element.scrollTop = position;
      else element.scrollLeft = direction() === "rtl" ? -position : position;
      measure();
    },
    viewport,
    setViewport(element: HTMLElement | undefined): void {
      setViewportElement(element);
      if (element !== undefined) setMetrics(readMetrics(element));
    },
    noteScroll(): void {
      setScrolling(true);
      if (hideTimer !== undefined) clearTimeout(hideTimer);
      const delay = (own.scrollHideDelay as number | undefined) ?? DEFAULT_HIDE_DELAY;
      hideTimer = setTimeout(() => {
        hideTimer = undefined;
        setScrolling(false);
      }, delay);
    },
    setHovering,
    direction: () => direction(),
  };

  const merged = mergeElementProps(
    {
      get dir() {
        return own.dir;
      },
    },
    rest,
    {
      onPointerEnter: composeEventHandlers(
        () => own.onPointerEnter as ((event: PointerEvent) => void) | undefined,
        () => setHovering(true),
      ),
      onPointerLeave: composeEventHandlers(
        () => own.onPointerLeave as ((event: PointerEvent) => void) | undefined,
        () => setHovering(false),
      ),
    },
  );
  return (
    <scrollAreaContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </scrollAreaContext.Provider>
  );
}
