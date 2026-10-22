import { splitProps } from "@shadow-js/core";
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
 * Own props of {@link MessageScrollerButton}.
 * @see {@link MessageScrollerButton}
 * @since 1.0.0
 */
export interface MessageScrollerButtonOwnProps {
  /**
   * The edge the button scrolls toward.
   * @default "end"
   */
  readonly direction?: "start" | "end" | undefined;
  /**
   * The native scroll behavior.
   * @default "smooth"
   */
  readonly behavior?: ScrollBehavior | undefined;
}

/**
 * Props of {@link MessageScrollerButton}: the own props and the attributes of the chosen element.
 *
 * Accessibility: a native button. When there is nothing to scroll toward it is inert and out of the tab order. Data attributes: `data-direction`
 * (`"start"` or `"end"`) and `data-active` (`"true"` when it can scroll, `"false"` otherwise). Give it an accessible name: it has no text of its own.
 * @see {@link MessageScrollerButton}
 * @since 1.0.0
 */
export type MessageScrollerButtonProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  MessageScrollerButtonOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * A button that scrolls to the start or the end of the transcript. While there is nothing to scroll toward (the content fits, or the reader is already there) it is
 * inert and leaves the tab order, so a keyboard user does not land on a dead control. It scrolls with the browser's own behavior, smoothly unless you say otherwise.
 *
 * Keyboard and ARIA: a native `button` (Enter and Space). It sets `type="button"`, `data-active` and `data-direction`; inactive, it also has `inert` and `tabindex="-1"`.
 *
 * @param props See {@link MessageScrollerButtonProps}.
 * @returns The button.
 * @example
 * import { MessageScroller } from "@shadow-js/primitives";
 *
 * export function JumpToLatest() {
 *   return (
 *     <MessageScroller.Button aria-label="Scroll to the latest message">Latest</MessageScroller.Button>
 *   );
 * }
 * @see {@link MessageScrollerProvider}
 * @since 1.0.0
 */
export function MessageScrollerButton<T extends PolymorphicTarget = "button">(
  props: MessageScrollerButtonProps<T>,
): JsxChild {
  const scroller = messageScrollerContext.use("MessageScroller.Button");
  const [own, rest] = splitProps(partProps<Loose & MessageScrollerButtonOwnProps>(props), [
    "as",
    "direction",
    "behavior",
    "onClick",
  ]);
  const direction = (): "start" | "end" => own.direction ?? "end";
  const active = (): boolean => (direction() === "end" ? scroller.end() : scroller.start());
  const merged = mergeElementProps(
    {
      type: "button",
      get "data-direction"() {
        return direction();
      },
      get "data-active"() {
        return active() ? "true" : "false";
      },
      get inert() {
        return active() ? undefined : true;
      },
      get tabindex() {
        return active() ? undefined : -1;
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick as ((event: MouseEvent) => void) | undefined,
        () => {
          const options = { behavior: own.behavior ?? "smooth" } as const;
          if (direction() === "end") scroller.scrollToEnd(options);
          else scroller.scrollToStart(options);
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
