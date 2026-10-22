import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { CollapsibleContent } from "../collapsible/content";
import { mergeElementProps, type PolymorphicProps, type PolymorphicTarget } from "../utils/index";
import { partProps } from "../utils/part-props";
import { accordionContext, accordionItemContext } from "./context";

/**
 * Own props of {@link AccordionContent}.
 *
 * Accessibility: the panel is a `role="region"` whose `aria-labelledby` names its trigger. A closed
 * force-mounted panel carries the `hidden` attribute, so it is out of the accessibility tree.
 * Data attributes: `data-state` (`"open"` or `"closed"`), `data-disabled` (`""` when the item is
 * disabled) and `data-orientation`.
 * @see {@link AccordionContent}
 * @since 1.0.0
 */
export interface AccordionContentOwnProps {
  /** Keep the content mounted while closed (see `Collapsible.Content`). @default false */
  readonly forceMount?: boolean | undefined;
}

/**
 * Props of {@link AccordionContent}.
 * @see {@link AccordionContent}
 * @since 1.0.0
 */
export type AccordionContentProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  AccordionContentOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The panel of an item: `role="region"` labeled by its trigger (`aria-labelledby`). It has no keys
 * of its own, and arrow keys pressed inside it do not move focus between triggers. It stays mounted
 * until its exit animation ends
 * and publishes its natural size as `--primitives-accordion-content-height` and
 * `--primitives-accordion-content-width` (aliases of the collapsible variables), so a height
 * animation needs no layout shift. Content that is open from the first render does not animate in.
 *
 * @param props See {@link AccordionContentProps}.
 * @returns The rendered panel.
 * @see {@link Accordion}
 * @example
 * import { Accordion } from "@shadow-js/primitives";
 *
 * export function DetailsPanel() {
 *   return (
 *     <Accordion type="single" defaultValue="a">
 *       <Accordion.Item value="a">
 *         <Accordion.Header>
 *           <Accordion.Trigger>Details</Accordion.Trigger>
 *         </Accordion.Header>
 *         <Accordion.Content class="overflow-hidden">Details text.</Accordion.Content>
 *       </Accordion.Item>
 *     </Accordion>
 *   );
 * }
 * @since 1.0.0
 */
export function AccordionContent<T extends PolymorphicTarget = "div">(
  props: AccordionContentProps<T>,
): JsxChild {
  const root = accordionContext.use("Accordion.Content");
  const item = accordionItemContext.use("Accordion.Content");
  const [own, rest] = splitProps(partProps<Loose>(props), ["as"]);
  const merged = mergeElementProps(
    {
      role: "region",
      get "aria-labelledby"() {
        return item.mountedTriggerId() ?? item.defaultTriggerId();
      },
      get "data-orientation"() {
        return root.orientation();
      },
      style: {
        "--primitives-accordion-content-height": "var(--primitives-collapsible-content-height)",
        "--primitives-accordion-content-width": "var(--primitives-collapsible-content-width)",
      },
    },
    rest,
  );
  return <CollapsibleContent as={own.as ?? "div"} {...(merged as object)} />;
}
