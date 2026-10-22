import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { collapsibleContext } from "../collapsible/context";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { accordionContext } from "./context";

/**
 * Props of {@link AccordionHeader}.
 * @see {@link AccordionHeader}
 * @since 1.0.0
 */
export type AccordionHeaderProps<T extends PolymorphicTarget = "h3"> = PolymorphicProps<
  "h3",
  object,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The heading that wraps an item's trigger, so the accordion shows up in the document outline.
 * Accessibility: a heading element (`h3` by default) with no keys and no ARIA attributes of its
 * own; the trigger inside it carries the keyboard and ARIA behavior. Renders an `h3`; pass
 * `as="h2"` (or another level) to fit the page. Carries `data-state`, `data-disabled` and
 * `data-orientation`.
 *
 * @param props See {@link AccordionHeaderProps}.
 * @returns The rendered heading.
 * @see {@link Accordion}
 * @example
 * import { Accordion } from "@shadow-js/primitives";
 *
 * export function ShippingHeading() {
 *   return (
 *     <Accordion type="single">
 *       <Accordion.Item value="shipping">
 *         <Accordion.Header as="h2">
 *           <Accordion.Trigger>Shipping</Accordion.Trigger>
 *         </Accordion.Header>
 *         <Accordion.Content>Ships in two days.</Accordion.Content>
 *       </Accordion.Item>
 *     </Accordion>
 *   );
 * }
 * @since 1.0.0
 */
export function AccordionHeader<T extends PolymorphicTarget = "h3">(
  props: AccordionHeaderProps<T>,
): JsxChild {
  const root = accordionContext.use("Accordion.Header");
  const collapsible = collapsibleContext.use("Accordion.Header");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return root.orientation();
      },
      get "data-state"() {
        return collapsible.open() ? "open" : "closed";
      },
      get "data-disabled"() {
        return collapsible.disabled() ? "" : undefined;
      },
    },
    rest,
  );
  return <Polymorphic as={own.as ?? "h3"} {...merged} />;
}
