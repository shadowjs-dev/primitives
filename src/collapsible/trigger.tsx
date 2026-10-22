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
import { collapsibleContext } from "./context";

/**
 * Props of {@link CollapsibleTrigger}: the attributes of the chosen element.
 * @see {@link CollapsibleTrigger}
 * @since 1.0.0
 */
export type CollapsibleTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The button that toggles the collapsible. Keys: Enter and Space toggle it (a native button click),
 * and it adds no key handling of its own. ARIA: `aria-expanded`, and `aria-controls` that names the
 * content only while that content exists, so it never points at nothing. Renders a `button` with
 * `type="button"`, `data-state="open" | "closed"` and `data-disabled`; when disabled it is also
 * natively `disabled`.
 *
 * @param props See {@link CollapsibleTriggerProps}.
 * @returns The rendered trigger button.
 * @see {@link Collapsible}
 * @example
 * import { Collapsible } from "@shadow-js/primitives";
 *
 * export function ToggleButton() {
 *   return (
 *     <Collapsible>
 *       <Collapsible.Trigger class="btn">Toggle</Collapsible.Trigger>
 *       <Collapsible.Content>Details</Collapsible.Content>
 *     </Collapsible>
 *   );
 * }
 * @since 1.0.0
 */
export function CollapsibleTrigger<T extends PolymorphicTarget = "button">(
  props: CollapsibleTriggerProps<T>,
): JsxChild {
  const context = collapsibleContext.use("Collapsible.Trigger");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as", "onClick"]);
  const merged = mergeElementProps(
    {
      type: "button",
      get "aria-expanded"() {
        return context.open();
      },
      get "aria-controls"() {
        // The server cannot know whether content exists yet, so an open collapsible points at the
        // default id until the root has mounted (hydration matches the server). After that only
        // content that is really mounted is named, so an open collapsible with no content names none.
        return (
          context.mountedContentId() ??
          (context.open() && !context.settled() ? context.contentId() : undefined)
        );
      },
      get "data-state"() {
        return context.open() ? "open" : "closed";
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      get disabled() {
        return context.disabled() ? true : undefined;
      },
    },
    rest,
    {
      onClick: composeEventHandlers(
        () => own.onClick,
        () => context.setOpen(!context.open()),
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
