import { onCleanup, splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  composeRefs,
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { type ScrollMetrics, scrollAreaContext, scrollbarContext } from "./context";
import { maxScroll, scrollbarVisible, scrollForOffset, thumbOffset, thumbSize } from "./logic";

/**
 * Own props of {@link ScrollAreaScrollbar}.
 *
 * Accessibility: `role="presentation"`; a hidden bar gets the `hidden` attribute. Keys: none; the
 * track is pointer only. Data attributes: `data-orientation` (`"vertical"` or `"horizontal"`) and
 * `data-state` (`"visible"` or `"hidden"`).
 * @see {@link ScrollAreaScrollbar}
 * @since 1.0.0
 */
export interface ScrollAreaScrollbarOwnProps {
  /**
   * The axis of the bar.
   * @default "vertical"
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Keep the bar mounted and shown whatever the root's `type` says.
   * @default false
   */
  readonly forceMount?: boolean | undefined;
}

/**
 * Props of {@link ScrollAreaScrollbar}.
 * @see {@link ScrollAreaScrollbar}
 * @since 1.0.0
 */
export type ScrollAreaScrollbarProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  ScrollAreaScrollbarOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The attribute that marks a thumb, so the track does not page when a thumb is pressed. The
 * `ScrollAreaThumb` part renders it as an empty attribute; a custom thumb needs it to get the same
 * behavior. It is internal to the package, so application code writes the name itself.
 *
 * @example
 * export const thumbAttribute: string = "data-scroll-area-thumb";
 * @internal
 * @since 1.0.0
 * @see {@link ScrollAreaThumb}
 */
export const THUMB_ATTRIBUTE = "data-scroll-area-thumb";

/** The geometry of one axis, from the measurements. @internal */
export interface AxisGeometry {
  readonly track: number;
  readonly thumb: number;
  readonly max: number;
  readonly offset: number;
}

/**
 * The thumb geometry along an axis. The track is the viewport's visible length: the bar sits along
 * the viewport's edge. `reversed` is the RTL horizontal case, where scroll position 0 is the far end.
 * @internal
 */
export function axisGeometry(
  metrics: ScrollMetrics,
  orientation: Orientation,
  reversed = false,
): AxisGeometry {
  const vertical = orientation === "vertical";
  const track = vertical ? metrics.clientHeight : metrics.clientWidth;
  const content = vertical ? metrics.scrollHeight : metrics.scrollWidth;
  const scroll = vertical ? metrics.scrollTop : metrics.scrollLeft;
  const thumb = thumbSize(track, track, content);
  const max = maxScroll(content, track);
  return { track, thumb, max, offset: thumbOffset(track, thumb, scroll, max, reversed) };
}

/**
 * A track along one edge of the viewport. It is shown according to the root's `type` (or always
 * with `forceMount`), and a press on the track outside the thumb scrolls one viewport toward it.
 * Keyboard: none; the track is pointer only. ARIA: `role="presentation"`, and `hidden` while not
 * shown.
 *
 * @param props See {@link ScrollAreaScrollbarProps}.
 * @returns The track element, with its thumb inside.
 * @example
 * import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb } from "@shadow-js/primitives";
 *
 * export function Horizontal() {
 *   return (
 *     <ScrollAreaRoot>
 *       <ScrollAreaScrollbar orientation="horizontal">
 *         <ScrollAreaThumb />
 *       </ScrollAreaScrollbar>
 *     </ScrollAreaRoot>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ScrollAreaThumb}
 */
export function ScrollAreaScrollbar<T extends PolymorphicTarget = "div">(
  props: ScrollAreaScrollbarProps<T>,
): JsxChild {
  const context = scrollAreaContext.use("ScrollArea.Scrollbar");
  const [own, rest] = splitProps(partProps<Loose & ScrollAreaScrollbarOwnProps>(props), [
    "as",
    "orientation",
    "forceMount",
    "onPointerDown",
  ]);
  const orientation = (): Orientation => (own.orientation as Orientation | undefined) ?? "vertical";
  const overflowing = (): boolean =>
    orientation() === "vertical" ? context.overflowY() : context.overflowX();
  // A horizontal bar in RTL has its scroll origin at the right: position 0 is the far end.
  const reversed = (): boolean => orientation() === "horizontal" && context.direction() === "rtl";
  const visible = (): boolean =>
    own.forceMount === true ||
    scrollbarVisible({
      type: context.type(),
      overflowing: overflowing(),
      scrolling: context.scrolling(),
      hovering: context.hovering(),
    });

  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return orientation();
      },
      get "data-state"() {
        return visible() ? "visible" : "hidden";
      },
      get hidden() {
        return visible() ? undefined : true;
      },
      role: "presentation",
    },
    rest,
    {
      onPointerDown: composeEventHandlers(
        () => own.onPointerDown as ((event: PointerEvent) => void) | undefined,
        (event: PointerEvent) => {
          const target = event.target;
          if (event.button !== 0 || !(target instanceof Element)) return;
          if (target.closest(`[${THUMB_ATTRIBUTE}]`) !== null) return;
          const element = context.viewport();
          if (element === undefined) return;
          const vertical = orientation() === "vertical";
          const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
          const pointer = vertical ? event.clientY - rect.top : event.clientX - rect.left;
          const geometry = axisGeometry(context.metrics(), orientation(), reversed());
          const page = geometry.track;
          const current = vertical ? element.scrollTop : Math.abs(element.scrollLeft);
          // Before the thumb (above or left of it) pages toward the scroll origin, after it away
          // from it. The origin is the far end in a reversed bar, so the two sides swap there.
          const before = pointer < geometry.offset;
          const towardOrigin = before !== reversed();
          const wanted = towardOrigin ? current - page : current + page;
          // Clamped to the scroll range: a negative magnitude would be flipped by `scrollTo` in RTL.
          context.scrollTo(orientation(), Math.min(geometry.max, Math.max(0, wanted)));
        },
      ),
    },
  );
  return (
    <scrollbarContext.Provider value={{ orientation: orientation() }}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </scrollbarContext.Provider>
  );
}

/**
 * Props of {@link ScrollAreaThumb}: the attributes of the thumb element. Accessibility: none; the
 * thumb is pointer only and takes no focus. Data attributes: `data-scroll-area-thumb` (empty), and
 * inline `width` or `height` (its length) and `transform` (its position).
 * @see {@link ScrollAreaThumb}
 * @since 1.0.0
 */
export type ScrollAreaThumbProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * The draggable part of a scrollbar. Its length and position follow the scroll position; dragging
 * it scrolls the viewport in proportion to the track. While a drag is in progress it listens for
 * `pointermove`, `pointerup` and `pointercancel` on the window of the thumb's own document (so a thumb in an iframe follows the frame's pointer), and removes those listeners on pointer
 * up, cancel or disposal. Keyboard: none. ARIA: none.
 *
 * @param props See {@link ScrollAreaThumbProps}.
 * @returns The thumb element.
 * @example
 * import { ScrollAreaRoot, ScrollAreaScrollbar, ScrollAreaThumb } from "@shadow-js/primitives";
 *
 * export function Thumb() {
 *   return (
 *     <ScrollAreaRoot>
 *       <ScrollAreaScrollbar orientation="vertical">
 *         <ScrollAreaThumb class="rounded-full bg-border" />
 *       </ScrollAreaScrollbar>
 *     </ScrollAreaRoot>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ScrollAreaScrollbar}
 */
export function ScrollAreaThumb<T extends PolymorphicTarget = "div">(
  props: ScrollAreaThumbProps<T>,
): JsxChild {
  const context = scrollAreaContext.use("ScrollArea.Thumb");
  const bar = scrollbarContext.use("ScrollArea.Thumb");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onPointerDown"]);
  let stopDrag: (() => void) | undefined;
  let thumbElement: HTMLElement | undefined;
  onCleanup(() => stopDrag?.());

  const reversed = (): boolean => bar.orientation === "horizontal" && context.direction() === "rtl";
  const geometry = (): AxisGeometry => axisGeometry(context.metrics(), bar.orientation, reversed());
  const vertical = (): boolean => bar.orientation === "vertical";

  const startDrag = (event: PointerEvent): void => {
    const element = context.viewport();
    if (element === undefined) return;
    stopDrag?.();
    event.preventDefault();
    const axis = vertical() ? "clientY" : "clientX";
    const start = event[axis];
    const pointerId = event.pointerId;
    const first = geometry();
    const startOffset = first.offset;
    // Only the pointer that pressed the thumb moves it: another finger scrolling or lifting is not part of the drag.
    const move = (moveEvent: PointerEvent): void => {
      if (moveEvent.pointerId !== pointerId) return;
      const current = geometry();
      const next = scrollForOffset(
        startOffset + (moveEvent[axis] - start),
        current.track,
        current.thumb,
        current.max,
        reversed(),
      );
      context.scrollTo(bar.orientation, next);
    };
    const end = (endEvent: PointerEvent): void => {
      if (endEvent.pointerId === pointerId) stopDrag?.();
    };
    // The window of the thumb's own document: inside an iframe the pointer events go to the frame's window, never to the global one.
    const target: Window = thumbElement?.ownerDocument.defaultView ?? window;
    target.addEventListener("pointermove", move);
    target.addEventListener("pointerup", end);
    target.addEventListener("pointercancel", end);
    stopDrag = () => {
      target.removeEventListener("pointermove", move);
      target.removeEventListener("pointerup", end);
      target.removeEventListener("pointercancel", end);
      stopDrag = undefined;
    };
  };

  const merged = mergeElementProps(
    {
      [THUMB_ATTRIBUTE]: "",
      get style() {
        const { thumb, offset } = geometry();
        // Without it the browser claims a touch drag for panning and the thumb never follows the finger.
        return vertical()
          ? {
              height: `${thumb}px`,
              transform: `translate3d(0, ${offset}px, 0)`,
              touchAction: "none",
            }
          : {
              width: `${thumb}px`,
              transform: `translate3d(${offset}px, 0, 0)`,
              touchAction: "none",
            };
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((node) => {
        thumbElement = node;
      }),
      onPointerDown: composeEventHandlers(
        () => own.onPointerDown as ((event: PointerEvent) => void) | undefined,
        startDrag,
      ),
    },
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}

/**
 * Props of {@link ScrollAreaCorner}: the attributes of the corner element. Accessibility:
 * `role="presentation"`, and `hidden` unless the content overflows on both axes. Data attributes:
 * none.
 * @see {@link ScrollAreaCorner}
 * @since 1.0.0
 */
export type ScrollAreaCornerProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

/**
 * The square where two scrollbars meet. Shown only when the content overflows on both axes.
 * Keyboard: none. ARIA: `role="presentation"`.
 *
 * @param props See {@link ScrollAreaCornerProps}.
 * @returns The corner element.
 * @example
 * import { ScrollAreaCorner, ScrollAreaRoot } from "@shadow-js/primitives";
 *
 * export function Corner() {
 *   return (
 *     <ScrollAreaRoot>
 *       <ScrollAreaCorner class="bg-muted" />
 *     </ScrollAreaRoot>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ScrollAreaRoot}
 */
export function ScrollAreaCorner<T extends PolymorphicTarget = "div">(
  props: ScrollAreaCornerProps<T>,
): JsxChild {
  const context = scrollAreaContext.use("ScrollArea.Corner");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const both = (): boolean => context.overflowY() && context.overflowX();
  const merged = mergeElementProps(
    {
      role: "presentation",
      get hidden() {
        return both() ? undefined : true;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
