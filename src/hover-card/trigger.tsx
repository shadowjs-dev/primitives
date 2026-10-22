import { splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  composeRefs,
  getTabbables,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { hoverCardContext } from "./context";

/**
 * Props of {@link HoverCardTrigger}: the attributes of the chosen element (`a` by default).
 *
 * Accessibility: no role or ARIA attribute is added. The element is a link in the tab order, and
 * focusing it opens the card. Data attributes: `data-state` is `"open"` or `"closed"`.
 * @since 1.0.0
 * @see {@link HoverCardTrigger}
 */
export type HoverCardTriggerProps<T extends PolymorphicTarget = "a"> = PolymorphicProps<
  "a",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const HANDLERS = [
  "as",
  "onPointerEnter",
  "onPointerLeave",
  "onPointerDown",
  "onPointerCancel",
  "onClick",
  "onKeyDown",
  "onFocus",
  "onBlur",
] as const;

/**
 * The link the card previews, and its anchor. Renders an `a`. The mouse or a pen opens the card
 * after the open delay and closes it after the close delay; keyboard focus does the same. Touch
 * never opens it, not even through the focus a tap can cause. `data-state` is `"open"` or `"closed"`.
 * Keyboard: Tab from the trigger of an open card moves focus to the card's first control; Shift+Tab
 * keeps the browser's own order. Focus moving from the trigger into the card keeps the card open.
 *
 * @param props See {@link HoverCardTriggerProps}.
 * @returns The rendered link.
 * @example
 * import { HoverCard } from "@shadow-js/primitives";
 *
 * export function AuthorLink() {
 *   return (
 *     <HoverCard>
 *       <HoverCard.Trigger href="/users/ada" class="underline">@ada</HoverCard.Trigger>
 *     </HoverCard>
 *   );
 * }
 * @since 1.0.0
 * @see {@link HoverCardRoot}
 */
export function HoverCardTrigger<T extends PolymorphicTarget = "a">(
  props: HoverCardTriggerProps<T>,
): JsxChild {
  const context = hoverCardContext.use("HoverCard.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), HANDLERS);
  // A tap can focus a link on some platforms; that focus is touch's, and touch never opens the card.
  // The tap ends with its click (or a scroll with pointercancel), so the flag cannot outlive it: a
  // tap that focused nothing must not make the next keyboard focus silent.
  let focusFromTouch = false;
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((element) => context.setTrigger(element)),
      onPointerEnter: composeEventHandlers(
        () => own.onPointerEnter,
        (event: PointerEvent) => {
          if (event.pointerType !== "touch") context.onOpen();
        },
      ),
      onPointerLeave: composeEventHandlers(
        () => own.onPointerLeave,
        (event: PointerEvent) => {
          if (event.pointerType !== "touch") context.onClose();
        },
      ),
      onPointerDown: composeEventHandlers(
        () => own.onPointerDown,
        (event: PointerEvent) => {
          focusFromTouch = event.pointerType === "touch";
        },
      ),
      onPointerCancel: composeEventHandlers(
        () => own.onPointerCancel,
        () => {
          focusFromTouch = false;
        },
      ),
      onClick: composeEventHandlers(
        () => own.onClick,
        () => {
          focusFromTouch = false;
        },
      ),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown,
        (event: KeyboardEvent) => {
          focusFromTouch = false;
          // Tab from the trigger of an open card enters the card (its controls are in the tab order).
          if (event.key !== "Tab" || event.shiftKey || !untrack(context.open)) return;
          const card = untrack(context.content);
          const first = card === undefined ? undefined : getTabbables(card)[0];
          if (first === undefined) return;
          event.preventDefault();
          first.focus();
        },
      ),
      onFocus: composeEventHandlers(
        () => own.onFocus,
        () => {
          if (!focusFromTouch) context.onOpen();
        },
      ),
      onBlur: composeEventHandlers(
        () => own.onBlur,
        (event: FocusEvent) => {
          focusFromTouch = false;
          // Focus moving into the card keeps it open; the card closes when focus leaves it.
          const next = event.relatedTarget;
          const card = untrack(context.content);
          if (next instanceof Node && card !== undefined && card.contains(next)) return;
          context.onClose();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "a"} {...merged} />;
}
