import { onCleanup, splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  composeRefs,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { tooltipContext } from "./context";

/**
 * Props of {@link TooltipTrigger}: the attributes of the chosen element (a `button` by default).
 * @since 1.0.0
 * @see {@link TooltipTrigger}
 */
export type TooltipTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const HANDLERS = [
  "as",
  "onPointerMove",
  "onPointerLeave",
  "onPointerDown",
  "onFocus",
  "onBlur",
  "onClick",
] as const;

/**
 * The element a tooltip describes, and its anchor. It renders a `button` with `type="button"`, or the
 * element named by `as`.
 *
 * Keyboard and ARIA: while the tooltip is open, `aria-describedby` names the content. Keyboard focus
 * opens it at once. A click closes it, and so does a press; the click that Enter or Space produces on
 * a focused button closes it too. Escape closes it while the content is open (see {@link TooltipContent}).
 * Data attributes: `data-state` is `"closed"`, `"delayed-open"` (the pointer waited for the delay) or
 * `"instant-open"` (focus, or the skip window). The mouse opens it after the delay; touch never opens
 * it. Leaving the trigger closes it, unless the pointer travels toward the content.
 *
 * @param props See {@link TooltipTriggerProps}.
 * @returns The `button` element (or the element named by `as`).
 * @throws Error when rendered outside {@link TooltipRoot}: `[primitives] <Tooltip.Trigger> must be used within <Tooltip>.`
 * @example
 * import { Tooltip } from "@shadow-js/primitives";
 *
 * export function BoldTip() {
 *   return (
 *     <Tooltip>
 *       <Tooltip.Trigger aria-label="Bold">B</Tooltip.Trigger>
 *       <Tooltip.Portal>
 *         <Tooltip.Content>Bold (Ctrl+B)</Tooltip.Content>
 *       </Tooltip.Portal>
 *     </Tooltip>
 *   );
 * }
 * @see {@link TooltipTriggerProps}
 * @see {@link TooltipContent}
 * @since 1.0.0
 */
export function TooltipTrigger<T extends PolymorphicTarget = "button">(
  props: TooltipTriggerProps<T>,
): JsxChild {
  const context = tooltipContext.use("Tooltip.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), HANDLERS);
  // A pointer press focuses the trigger; that focus must not open the tooltip the press just closed.
  let isPointerDown = false;
  // The pointer already asked to open during this visit: every further move would only restart the timer.
  let hasPointerMoveOpened = false;
  const onPointerUp = (): void => {
    isPointerDown = false;
  };
  onCleanup(() => document.removeEventListener("pointerup", onPointerUp));

  const merged = mergeElementProps(
    {
      type: "button",
      get "aria-describedby"() {
        return context.open() ? context.contentId() : undefined;
      },
      get "data-state"() {
        return context.stateAttribute();
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((element) => context.setTrigger(element)),
      onPointerMove: composeEventHandlers(
        () => own.onPointerMove,
        (event: PointerEvent) => {
          if (event.pointerType === "touch") return;
          if (!hasPointerMoveOpened && !context.group.isPointerInTransit()) {
            context.onTriggerEnter();
            hasPointerMoveOpened = true;
          }
        },
      ),
      onPointerLeave: composeEventHandlers(
        () => own.onPointerLeave,
        () => {
          context.onTriggerLeave();
          hasPointerMoveOpened = false;
        },
      ),
      onPointerDown: composeEventHandlers(
        () => own.onPointerDown,
        () => {
          if (context.open()) context.onClose();
          isPointerDown = true;
          document.addEventListener("pointerup", onPointerUp, { once: true });
        },
      ),
      onFocus: composeEventHandlers(
        () => own.onFocus,
        () => {
          if (!isPointerDown) context.onOpen();
        },
      ),
      onBlur: composeEventHandlers(() => own.onBlur, context.onClose),
      onClick: composeEventHandlers(() => own.onClick, context.onClose),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
