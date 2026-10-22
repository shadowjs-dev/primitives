import {
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "./parts";
import { NavigationMenuRoot } from "./root";
import { NavigationMenuIndicator, NavigationMenuViewport } from "./viewport";

export type { NavigationMenuContextValue, NavigationOpenedBy } from "./context";
export { navigationMenuContext, navigationMenuItemContext } from "./context";
export type {
  NavigationMenuContentOwnProps,
  NavigationMenuContentProps,
  NavigationMenuItemOwnProps,
  NavigationMenuItemProps,
  NavigationMenuLinkOwnProps,
  NavigationMenuLinkProps,
  NavigationMenuListProps,
  NavigationMenuTriggerProps,
} from "./parts";
export type { NavigationMenuOwnProps, NavigationMenuProps } from "./root";
export type { NavigationMenuIndicatorProps, NavigationMenuViewportProps } from "./viewport";
export {
  NavigationMenuContent,
  NavigationMenuIndicator,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuRoot,
  NavigationMenuTrigger,
  NavigationMenuViewport,
};

/**
 * The navigation menu primitive: `NavigationMenu`, `NavigationMenu.List`, `NavigationMenu.Item`,
 * `NavigationMenu.Trigger`, `NavigationMenu.Content`, `NavigationMenu.Link`, `NavigationMenu.Viewport` (hosts the open content and publishes its size) and `NavigationMenu.Indicator` (follows the open trigger). Each part is also
 * exported by name. Keys: ArrowDown or Enter/Space opens a trigger's content (ArrowDown moves focus
 * into it), Left and Right move between triggers, Home and End go to the ends, Escape closes and
 * returns focus to the trigger. ARIA: a `nav` landmark; triggers carry `aria-expanded` and
 * `aria-controls` while open; the content is labeled by its trigger.
 *
 * @example
 * import { NavigationMenu } from "@shadow-js/primitives";
 *
 * export function DocsNav() {
 *   return (
 *     <NavigationMenu aria-label="Main">
 *       <NavigationMenu.List>
 *         <NavigationMenu.Item value="docs">
 *           <NavigationMenu.Trigger>Docs</NavigationMenu.Trigger>
 *           <NavigationMenu.Content>
 *             <NavigationMenu.Link href="/docs/start">Get started</NavigationMenu.Link>
 *           </NavigationMenu.Content>
 *         </NavigationMenu.Item>
 *       </NavigationMenu.List>
 *     </NavigationMenu>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NavigationMenuRoot}
 */
export const NavigationMenu: typeof NavigationMenuRoot & {
  readonly List: typeof NavigationMenuList;
  readonly Item: typeof NavigationMenuItem;
  readonly Trigger: typeof NavigationMenuTrigger;
  readonly Content: typeof NavigationMenuContent;
  readonly Link: typeof NavigationMenuLink;
  readonly Viewport: typeof NavigationMenuViewport;
  readonly Indicator: typeof NavigationMenuIndicator;
} = Object.assign(NavigationMenuRoot, {
  List: NavigationMenuList,
  Item: NavigationMenuItem,
  Trigger: NavigationMenuTrigger,
  Content: NavigationMenuContent,
  Link: NavigationMenuLink,
  Viewport: NavigationMenuViewport,
  Indicator: NavigationMenuIndicator,
});
