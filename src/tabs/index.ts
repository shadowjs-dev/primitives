import { TabsContent } from "./content";
import { TabsList } from "./list";
import { TabsRoot } from "./root";
import { TabsTrigger } from "./trigger";

export type { TabsContentOwnProps, TabsContentProps } from "./content";
export type { TabsActivationMode, TabsContextValue, TabsStateProps } from "./context";
export { createTabsContext, tabsContext, tabsListContext } from "./context";
export { encodeTabValue } from "./encode";
export type { TabsListOwnProps, TabsListProps } from "./list";
export type { TabsOwnProps, TabsProps } from "./root";
export type { TabsTriggerOwnProps, TabsTriggerProps } from "./trigger";
export { TabsContent, TabsList, TabsRoot, TabsTrigger };

/**
 * The tabs primitive (WAI-ARIA tabs): `Tabs`, `Tabs.List`, `Tabs.Trigger` and `Tabs.Content`. Each
 * part is also exported by name (`TabsList`, ...) for tree shaking.
 *
 * Keyboard: the arrow keys for the list's orientation move focus between enabled tabs, and Home, End,
 * PageUp and PageDown jump to the ends. A focused tab is selected when `activationMode` is
 * `"automatic"` (the default); otherwise Enter, Space or a click selects it. ARIA: the list is a `tablist`,
 * each trigger a `tab` with `aria-selected`, and each panel a `tabpanel` labeled by its tab.
 *
 * @example
 * import { Tabs } from "@shadow-js/primitives";
 *
 * export function SettingsTabs() {
 *   return (
 *     <Tabs defaultValue="account">
 *       <Tabs.List aria-label="Sections">
 *         <Tabs.Trigger value="account">Account</Tabs.Trigger>
 *         <Tabs.Trigger value="billing">Billing</Tabs.Trigger>
 *       </Tabs.List>
 *       <Tabs.Content value="account">First</Tabs.Content>
 *       <Tabs.Content value="billing">Second</Tabs.Content>
 *     </Tabs>
 *   );
 * }
 * @since 1.0.0
 * @see {@link TabsRoot}
 * @see {@link TabsList}
 */
export const Tabs: typeof TabsRoot & {
  readonly List: typeof TabsList;
  readonly Trigger: typeof TabsTrigger;
  readonly Content: typeof TabsContent;
} = Object.assign(TabsRoot, {
  List: TabsList,
  Trigger: TabsTrigger,
  Content: TabsContent,
});
