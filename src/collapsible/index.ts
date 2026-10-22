import { CollapsibleContent } from "./content";
import { CollapsibleRoot } from "./root";
import { CollapsibleTrigger } from "./trigger";

export type { CollapsibleContentOwnProps, CollapsibleContentProps } from "./content";
export type { CollapsibleContextValue, CollapsibleStateProps } from "./context";
export { collapsibleContext, createCollapsibleContext } from "./context";
export type { CollapsibleOwnProps, CollapsibleProps } from "./root";
export type { CollapsibleTriggerProps } from "./trigger";
export { CollapsibleContent, CollapsibleRoot, CollapsibleTrigger };

/**
 * The collapsible primitive (WAI-ARIA disclosure): `Collapsible`, `Collapsible.Trigger` and
 * `Collapsible.Content`. Each part is also exported by name (`CollapsibleTrigger`, ...) for tree
 * shaking. Keys: Enter and Space toggle the trigger (a native button). ARIA: the trigger has
 * `aria-expanded` and `aria-controls`; the root and the content set no role.
 *
 * @example
 * import { Collapsible } from "@shadow-js/primitives";
 *
 * export function Details() {
 *   return (
 *     <Collapsible defaultOpen>
 *       <Collapsible.Trigger>Toggle</Collapsible.Trigger>
 *       <Collapsible.Content>Details</Collapsible.Content>
 *     </Collapsible>
 *   );
 * }
 * @see {@link CollapsibleRoot}
 * @since 1.0.0
 */
export const Collapsible: typeof CollapsibleRoot & {
  readonly Trigger: typeof CollapsibleTrigger;
  readonly Content: typeof CollapsibleContent;
} = Object.assign(CollapsibleRoot, {
  Trigger: CollapsibleTrigger,
  Content: CollapsibleContent,
});
