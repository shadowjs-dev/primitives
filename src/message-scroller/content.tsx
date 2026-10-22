import { onCleanup, onMount, splitProps, useEffect } from "@shadow-js/core";
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
 * Own props of {@link MessageScrollerContent}.
 * @see {@link MessageScrollerContent}
 * @since 1.0.0
 */
export interface MessageScrollerContentOwnProps {
  /**
   * A class for the room kept at the end of the content, which lets a new turn sit near the top of the window before its reply fills it.
   * @default none
   */
  readonly spacerClassName?: string | undefined;
}

/**
 * Props of {@link MessageScrollerContent}: the own props and the attributes of the chosen element.
 *
 * Accessibility: `role="log"` and `aria-relevant="additions"`, so a screen reader announces each new row once (a `log` is a polite live region). Pass `aria-busy` while a
 * reply streams so the announcement waits until the message is complete.
 * @see {@link MessageScrollerContent}
 * @since 1.0.0
 */
export type MessageScrollerContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MessageScrollerContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The transcript: the list of rows. Its direct children should be {@link MessageScrollerItem}s. It also holds the spacer, a hidden block at its
 * end whose height the scroller sets, and it tells the provider when rows are added, removed or resized.
 *
 * Keyboard and ARIA: a `log` live region (polite); no keys. The spacer is `aria-hidden`.
 *
 * @param props See {@link MessageScrollerContentProps}.
 * @returns The content, with the spacer after the rows.
 * @example
 * import { MessageScroller } from "@shadow-js/primitives";
 *
 * export function Rows(props: { readonly streaming: boolean }) {
 *   return (
 *     <MessageScroller.Content aria-busy={props.streaming}>
 *       <MessageScroller.Item messageId="a">Hello</MessageScroller.Item>
 *     </MessageScroller.Content>
 *   );
 * }
 * @see {@link MessageScrollerItem}
 * @since 1.0.0
 */
export function MessageScrollerContent<T extends PolymorphicTarget = "div">(
  props: MessageScrollerContentProps<T>,
): JsxChild {
  const scroller = messageScrollerContext.use("MessageScroller.Content");
  const [own, rest] = splitProps(partProps<Loose & MessageScrollerContentOwnProps>(props), [
    "as",
    "spacerClassName",
    "children",
  ]);
  onCleanup(() => {
    scroller.setContent(undefined);
    scroller.setSpacerElement(undefined);
  });
  // The opening position is applied once the first rows have registered; the microtask lets them.
  onMount(() => {
    queueMicrotask(() => scroller.initialize());
  });
  useEffect(() => {
    const element = scroller.content();
    if (element === undefined || typeof ResizeObserver === "undefined") return;
    const observer = new ResizeObserver(() => scroller.noteContentChange());
    observer.observe(element);
    onCleanup(() => observer.disconnect());
  });
  const merged = mergeElementProps(
    {
      role: "log",
      "aria-relevant": "additions",
      ref: (element: HTMLElement) => {
        scroller.setContent(element);
      },
    },
    rest,
  );
  return (
    <Polymorphic as={own.as ?? "div"} {...merged}>
      {own["children"] as JsxChild}
      <div
        data-message-scroller-spacer=""
        aria-hidden="true"
        class={own.spacerClassName}
        style={{ "block-size": "0px", "flex-shrink": "0" }}
        ref={(element: HTMLElement) => scroller.setSpacerElement(element)}
      />
    </Polymorphic>
  );
}
