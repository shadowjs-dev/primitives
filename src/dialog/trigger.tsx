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
import { dialogContext } from "./context";

/**
 * Props of {@link DialogTrigger}: the attributes of the chosen element.
 * @see {@link DialogTrigger}
 * @since 1.0.0
 */
export type DialogTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

/** The props as the implementation sees them. */
type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The button that opens the dialog. Keys: Enter and Space activate it (a native button click), and
 * it adds no key handling. ARIA: `aria-haspopup="dialog"`, `aria-expanded`, and `aria-controls`
 * (only while the dialog is open, so it never points at nothing). Renders a `button` with
 * `type="button"`, `id` and `data-state="open" | "closed"`. Pass `as` to render another element.
 *
 * @param props See {@link DialogTriggerProps}.
 * @returns The rendered trigger.
 * @see {@link Dialog}
 * @example
 * import { Dialog } from "@shadow-js/primitives";
 *
 * export function OpenButton() {
 *   return (
 *     <Dialog>
 *       <Dialog.Trigger class="btn">Open</Dialog.Trigger>
 *       <Dialog.Portal>
 *         <Dialog.Content>
 *           <Dialog.Title>Hello</Dialog.Title>
 *         </Dialog.Content>
 *       </Dialog.Portal>
 *     </Dialog>
 *   );
 * }
 * @since 1.0.0
 */
export function DialogTrigger<T extends PolymorphicTarget = "button">(
  props: DialogTriggerProps<T>,
): JsxChild {
  const context = dialogContext.use("Dialog.Trigger");
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
