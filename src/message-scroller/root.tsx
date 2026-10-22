import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { messageScrollerContext } from "./context";

/**
 * Props of {@link MessageScrollerRoot}: the attributes of the chosen element.
 *
 * Accessibility: no role and no keys. Data attributes: `data-scrollable` (`"start"`, `"end"` or `"start end"`, absent when the content fits),
 * `data-autoscrolling` (present while the scroller moves itself) and `data-pending-scroll` (present until the opening position is applied).
 * @see {@link MessageScrollerRoot}
 * @since 1.0.0
 */
export type MessageScrollerRootProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The frame that holds the viewport and the controls. It fills its parent, so put it in a layout with a height. It mirrors the scroll state as
 * data attributes, so the frame and its button can be styled from the state alone.
 *
 * Keyboard and ARIA: a plain `div`; none of its own.
 *
 * @param props See {@link MessageScrollerRootProps}.
 * @returns The frame.
 * @example
 * import { MessageScroller } from "@shadow-js/primitives";
 *
 * export function Frame() {
 *   return (
 *     <MessageScroller.Provider>
 *       <MessageScroller.Root class="relative h-96 data-[scrollable~=end]:pb-2">
 *         <MessageScroller.Viewport class="h-full overflow-y-auto">
 *           <MessageScroller.Content />
 *         </MessageScroller.Viewport>
 *       </MessageScroller.Root>
 *     </MessageScroller.Provider>
 *   );
 * }
 * @see {@link MessageScrollerProvider}
 * @since 1.0.0
 */
export function MessageScrollerRoot<T extends PolymorphicTarget = "div">(
  props: MessageScrollerRootProps<T>,
): JsxChild {
  const scroller = messageScrollerContext.use("MessageScroller.Root");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get "data-scrollable"() {
        return scroller.scrollable();
      },
      get "data-autoscrolling"() {
        return scroller.autoscrolling() ? "" : undefined;
      },
      get "data-pending-scroll"() {
        return scroller.pending() ? "" : undefined;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
