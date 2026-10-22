import { splitProps } from "@shadow-js/core";
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
import { popoverContext } from "./context";

/**
 * Props of {@link PopoverTrigger}: the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link PopoverTrigger}
 */
export type PopoverTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The button that toggles the popover, and its anchor unless a `Popover.Anchor` is rendered.
 * Renders a `button` with `aria-haspopup="dialog"`, `aria-expanded`, `aria-controls` (only while
 * the popover is open, so it never points at nothing) and `data-state="open" | "closed"`.
 * Keys: Enter or Space (a click) toggles it. Must be rendered inside {@link PopoverRoot}.
 *
 * @param props See {@link PopoverTriggerProps}.
 * @returns The `button` element.
 * @throws Error when rendered outside {@link PopoverRoot}.
 * @example
 * import { Popover } from "@shadow-js/primitives";
 *
 * export function OpenPopover() {
 *   return (
 *     <Popover>
 *       <Popover.Trigger class="btn">Open</Popover.Trigger>
 *       <Popover.Portal>
 *         <Popover.Content aria-label="Message">Hello</Popover.Content>
 *       </Popover.Portal>
 *     </Popover>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PopoverContent}
 */
export function PopoverTrigger<T extends PolymorphicTarget = "button">(
  props: PopoverTriggerProps<T>,
): JsxChild {
  const context = popoverContext.use("Popover.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const merged = mergeElementProps(
    {
      type: "button",
      "aria-haspopup": "dialog",
      get "aria-expanded"() {
        return context.open();
      },
      get "aria-controls"() {
        return context.open() ? context.contentId() : undefined;
      },
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      get id() {
        return context.triggerId();
      },
    },
    rest,
    {
      ref: composeRefs<HTMLElement>((element) => context.setTrigger(element)),
      onClick: composeEventHandlers(
        () => own.onClick,
        () => context.setOpen(!context.open()),
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
