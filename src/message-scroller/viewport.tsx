import { onCleanup, splitProps, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { messageScrollerContext } from "./context";

/**
 * Own props of {@link MessageScrollerViewport}.
 * @see {@link MessageScrollerViewport}
 * @since 1.0.0
 */
export interface MessageScrollerViewportOwnProps {
  /**
   * Keeps the row the reader is looking at where it is when older rows are added above it.
   * @default true
   */
  readonly preserveScrollOnPrepend?: boolean | undefined;
}

/**
 * Props of {@link MessageScrollerViewport}: the own props and the attributes of the chosen element.
 *
 * Accessibility: `role="region"`, `aria-label="Messages"` and `tabindex="0"` unless you pass your own, so a keyboard user can scroll it and it is a named
 * landmark. Data attributes: `data-scrollable`, `data-autoscrolling` and `data-pending-scroll` as on the root. The viewport does not set `overflow` itself:
 * give it a height and `overflow-y: auto`. Hide it while `data-pending-scroll` is present with `visibility: hidden` (not `display: none`, which has no layout to scroll).
 * @see {@link MessageScrollerViewport}
 * @since 1.0.0
 */
export type MessageScrollerViewportProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MessageScrollerViewportOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const SCROLL_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "PageUp",
  "PageDown",
  "Home",
  "End",
  " ",
  "Spacebar",
]);

/**
 * The scrollable element. It reports its size and its scroll position to the provider, notices when the reader scrolls by hand (wheel, touch,
 * the scrollbar or a scroll key), and applies the scroll rules: anchoring, following, the opening position and keeping the reader's place when rows are
 * added above. It scrolls natively, so touch, the wheel and the keyboard keep working.
 *
 * Keyboard and ARIA: a focusable `region` named "Messages"; the browser's own scroll keys move it. Pass `aria-label` to name it for your app.
 *
 * @param props See {@link MessageScrollerViewportProps}.
 * @returns The viewport.
 * @example
 * import { MessageScroller } from "@shadow-js/primitives";
 *
 * export function Scroller() {
 *   return (
 *     <MessageScroller.Provider>
 *       <MessageScroller.Root>
 *         <MessageScroller.Viewport aria-label="Conversation" class="h-80 overflow-y-auto">
 *           <MessageScroller.Content />
 *         </MessageScroller.Viewport>
 *       </MessageScroller.Root>
 *     </MessageScroller.Provider>
 *   );
 * }
 * @see {@link MessageScrollerContent}
 * @since 1.0.0
 */
export function MessageScrollerViewport<T extends PolymorphicTarget = "div">(
  props: MessageScrollerViewportProps<T>,
): JsxChild {
  const scroller = messageScrollerContext.use("MessageScroller.Viewport");
  const [own, rest] = splitProps(partProps<Loose & MessageScrollerViewportOwnProps>(props), [
    "as",
    "preserveScrollOnPrepend",
    "onScroll",
    "onWheel",
    "onTouchMove",
    "onPointerDown",
    "onKeyDown",
  ]);
  onCleanup(() => scroller.setViewport(undefined));
  useEffect(() => {
    scroller.setPreserveOnPrepend(own.preserveScrollOnPrepend !== false);
  });
  // Observers are made after mount, so the server render never touches them. The window resizing changes the room kept under the last turn.
  useEffect(() => {
    const element = scroller.viewport();
    if (element === undefined || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => scroller.noteContentChange());
    observer.observe(element);
    onCleanup(() => observer.disconnect());
  });
  const merged = mergeElementProps(
    {
      role: "region",
      "aria-label": "Messages",
      tabindex: 0,
      get "data-scrollable"() {
        return scroller.scrollable();
      },
      get "data-autoscrolling"() {
        return scroller.autoscrolling() ? "" : undefined;
      },
      get "data-pending-scroll"() {
        return scroller.pending() ? "" : undefined;
      },
      ref: (element: HTMLElement) => {
        scroller.setViewport(element);
      },
    },
    rest,
    {
      onScroll: composeEventHandlers(
        () => own.onScroll as ((event: Event) => void) | undefined,
        () => scroller.noteScroll(),
      ),
      onWheel: composeEventHandlers(
        () => own.onWheel as ((event: Event) => void) | undefined,
        () => scroller.noteUserInput(),
      ),
      onTouchMove: composeEventHandlers(
        () => own.onTouchMove as ((event: Event) => void) | undefined,
        () => scroller.noteUserInput(),
      ),
      onPointerDown: composeEventHandlers(
        () => own.onPointerDown as ((event: Event) => void) | undefined,
        () => scroller.noteUserInput(),
      ),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown as ((event: KeyboardEvent) => void) | undefined,
        (event: KeyboardEvent) => {
          if (SCROLL_KEYS.has(event.key) && event.target === event.currentTarget)
            scroller.noteUserInput();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
