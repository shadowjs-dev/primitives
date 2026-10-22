import { onCleanup, splitProps, useSignal } from "@shadow-js/core";
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
 * Own props of {@link MessageScrollerItem}.
 * @see {@link MessageScrollerItem}
 * @since 1.0.0
 */
export interface MessageScrollerItemOwnProps {
  /**
   * A stable id for the row. `scrollToMessage`, the visibility hook and the keeping of the reader's place use it, so it must not change when the row moves.
   * @default none
   */
  readonly messageId?: string | undefined;
  /**
   * Marks the row as the start of a turn. When a new anchored row is added the viewport moves it near the top of the window, and the last anchor is the current turn.
   * @default false
   */
  readonly scrollAnchor?: boolean | undefined;
}

/**
 * Props of {@link MessageScrollerItem}: the own props and the attributes of the chosen element.
 *
 * Accessibility: no role and no keys. Data attributes: `data-message-id` and `data-scroll-anchor` (`"true"` or `"false"`) mirror the props.
 * @see {@link MessageScrollerItem}
 * @since 1.0.0
 */
export type MessageScrollerItemProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  MessageScrollerItemOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * One row of the transcript: a message, a marker, a typing row, a date or a "load older" row. Wrap each direct child of the content in one. The row registers with
 * the provider while it is mounted.
 *
 * Keyboard and ARIA: a plain `div`; none of its own.
 *
 * @param props See {@link MessageScrollerItemProps}.
 * @returns The row.
 * @example
 * import { MessageScroller } from "@shadow-js/primitives";
 *
 * export function Turn(props: { readonly id: string; readonly mine: boolean }) {
 *   return (
 *     <MessageScroller.Item messageId={props.id} scrollAnchor={props.mine}>
 *       A message
 *     </MessageScroller.Item>
 *   );
 * }
 * @see {@link MessageScrollerContent}
 * @since 1.0.0
 */
export function MessageScrollerItem<T extends PolymorphicTarget = "div">(
  props: MessageScrollerItemProps<T>,
): JsxChild {
  const scroller = messageScrollerContext.use("MessageScroller.Item");
  const [own, rest] = splitProps(partProps<Loose & MessageScrollerItemOwnProps>(props), [
    "as",
    "messageId",
    "scrollAnchor",
  ]);
  const [element, setElement] = useSignal<HTMLElement | undefined>(undefined);
  let release: (() => void) | undefined;
  onCleanup(() => release?.());
  const merged = mergeElementProps(
    {
      get "data-message-id"() {
        return own.messageId;
      },
      get "data-scroll-anchor"() {
        return own.scrollAnchor === true ? "true" : "false";
      },
      ref: (node: HTMLElement) => {
        if (element() === node) return;
        release?.();
        setElement(() => node);
        release = scroller.registerItem({
          element: node,
          id: () => own.messageId,
          anchor: () => own.scrollAnchor === true,
          fresh: true,
        });
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "div"} {...merged} />;
}
