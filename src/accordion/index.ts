import { AccordionContent } from "./content";
import { AccordionHeader } from "./header";
import { AccordionItem } from "./item";
import { AccordionRoot } from "./root";
import { AccordionTrigger } from "./trigger";

export type { AccordionContentOwnProps, AccordionContentProps } from "./content";
export type {
  AccordionContextValue,
  AccordionItemContextValue,
  AccordionTriggerData,
} from "./context";
export { accordionContext, accordionItemContext } from "./context";
export type { AccordionHeaderProps } from "./header";
export type { AccordionItemOwnProps, AccordionItemProps } from "./item";
export type {
  AccordionBaseOwnProps,
  AccordionMultipleOwnProps,
  AccordionProps,
  AccordionSingleOwnProps,
} from "./root";
export type { AccordionTriggerProps } from "./trigger";
export type { AccordionType } from "./value";
export {
  closeItem,
  itemsToSingle,
  openItem,
  sameItems,
  setItemOpen,
  singleToItems,
} from "./value";
export { AccordionContent, AccordionHeader, AccordionItem, AccordionRoot, AccordionTrigger };

/**
 * The accordion primitive (WAI-ARIA accordion): `Accordion`, `Accordion.Item`,
 * `Accordion.Header`, `Accordion.Trigger` and `Accordion.Content`. Each part is also exported by
 * name (`AccordionItem`, ...) for tree shaking. Keys: Enter and Space toggle the focused trigger;
 * Up and Down (or Left and Right when horizontal) move focus between triggers, Home and End go to
 * the first and last. ARIA: `aria-expanded` and `aria-controls` on each trigger; `role="region"`
 * labeled by the trigger on each panel.
 *
 * @example
 * import { Accordion } from "@shadow-js/primitives";
 *
 * export function Sections() {
 *   return (
 *     <Accordion type="multiple" defaultValue={["a"]}>
 *       <Accordion.Item value="a">
 *         <Accordion.Header>
 *           <Accordion.Trigger>One</Accordion.Trigger>
 *         </Accordion.Header>
 *         <Accordion.Content>First</Accordion.Content>
 *       </Accordion.Item>
 *     </Accordion>
 *   );
 * }
 * @see {@link AccordionRoot}
 * @since 1.0.0
 */
export const Accordion: typeof AccordionRoot & {
  readonly Item: typeof AccordionItem;
  readonly Header: typeof AccordionHeader;
  readonly Trigger: typeof AccordionTrigger;
  readonly Content: typeof AccordionContent;
} = Object.assign(AccordionRoot, {
  Item: AccordionItem,
  Header: AccordionHeader,
  Trigger: AccordionTrigger,
  Content: AccordionContent,
});
