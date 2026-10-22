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
import { scrollAreaContext } from "./context";

/**
 * Props of {@link ScrollAreaViewport}: the attributes of the scrolling element. Accessibility: no
 * role or label is set, so give the viewport an `aria-label` when its content needs a name. While
 * it overflows it has `tabindex="0"`. Data attributes: none. The element's inline style sets
 * `overflow: scroll` and `scrollbar-width: none`, and an `onScroll` handler of yours runs first.
 * @see {@link ScrollAreaViewport}
 * @since 1.0.0
 */
export type ScrollAreaViewportProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The element that really scrolls. It keeps its native scrolling (wheel, touch, keyboard) and hides
 * the native bars, so the custom scrollbars are the only ones. Keyboard: while the content overflows
 * it is a tab stop (`tabindex="0"`), and the browser's native scroll keys move it; the library adds
 * no key handling. ARIA: none. It re-measures when it or its first child resizes.
 *
 * @param props See {@link ScrollAreaViewportProps}.
 * @returns The scrolling element, with its content inside.
 * @example
 * import { ScrollAreaRoot, ScrollAreaViewport } from "@shadow-js/primitives";
 *
 * export function Notes() {
 *   return (
 *     <ScrollAreaRoot>
 *       <ScrollAreaViewport class="h-72 w-48 rounded-md">long content</ScrollAreaViewport>
 *     </ScrollAreaRoot>
 *   );
 * }
 * @since 1.0.0
 * @see {@link ScrollAreaRoot}
 */
export function ScrollAreaViewport<T extends PolymorphicTarget = "div">(
  props: ScrollAreaViewportProps<T>,
): JsxChild {
  const context = scrollAreaContext.use("ScrollArea.Viewport");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onScroll"]);

  // Re-measure when the viewport or its content changes size. Observers are created after mount,
  // so the server render never touches them.
  useEffect(() => {
    const element = context.viewport();
    if (element === undefined || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => context.measure());
    observer.observe(element);
    const content = element.firstElementChild;
    if (content instanceof HTMLElement) observer.observe(content);
    onCleanup(() => observer.disconnect());
  });
  onCleanup(() => context.setViewport(undefined));

  const merged = mergeElementProps(
    {
      get style() {
        return { overflow: "scroll", scrollbarWidth: "none" };
      },
      get tabindex() {
        return context.overflowY() || context.overflowX() ? 0 : undefined;
      },
      ref: (element: HTMLElement) => {
        context.setViewport(element);
      },
    },
    rest,
    {
      onScroll: composeEventHandlers(
        () => own.onScroll as ((event: Event) => void) | undefined,
        () => {
          context.measure();
          context.noteScroll();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
