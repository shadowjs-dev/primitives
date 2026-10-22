import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useRovingFocus,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { tabsContext, tabsListContext } from "./context";

/**
 * Own props of {@link TabsList}, on top of the attributes of the chosen element (a `div` by default).
 *
 * Accessibility: the list is a `role="tablist"`, with `aria-orientation="vertical"` when vertical and
 * no `aria-orientation` when horizontal. The arrow keys for its axis move focus between enabled tabs,
 * and Home, End, PageUp and PageDown jump to the ends (see {@link TabsList}).
 *
 * Data attributes: `data-orientation` (`"horizontal"` or `"vertical"`) on the list, always set.
 * @since 1.0.0
 * @see {@link TabsList}
 */
export interface TabsListOwnProps {
  /**
   * Wraps focus from the last tab to the first and back with the arrow keys. With `false` the arrows
   * stop at the ends. Home and End are not affected.
   * @default `true`
   */
  readonly loop?: boolean | undefined;
}

/**
 * Props of {@link TabsList}: the own props and the attributes of the chosen element (a `div` by
 * default).
 * @since 1.0.0
 * @see {@link TabsListOwnProps}
 */
export type TabsListProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  TabsListOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * The row (or column) of tabs: `role="tablist"`, with `aria-orientation="vertical"` when the tabs are
 * stacked, and `data-orientation` always set. Owns the roving focus of its tabs: the selected tab is
 * the one tab stop, or the first enabled tab when the selected tab is missing or disabled. Left and Right move focus along a
 * horizontal list, Up and Down along a vertical one (Left and Right swap in `rtl`), wrapping unless
 * `loop` is `false`. Home and PageUp go to the first enabled tab, End and PageDown to the last.
 * Give the list an `aria-label` or `aria-labelledby`.
 *
 * @param props See {@link TabsListProps}.
 * @returns The rendered tab list.
 * @throws Error when rendered outside {@link Tabs}, with the message `[primitives] <Tabs.List> must be used within <Tabs>.`
 * @example
 * import { Tabs } from "@shadow-js/primitives";
 *
 * export function AccountTabs() {
 *   return (
 *     <Tabs defaultValue="profile">
 *       <Tabs.List aria-label="Account" loop={false}>
 *         <Tabs.Trigger value="profile">Profile</Tabs.Trigger>
 *         <Tabs.Trigger value="security">Security</Tabs.Trigger>
 *       </Tabs.List>
 *       <Tabs.Content value="profile">Profile settings</Tabs.Content>
 *       <Tabs.Content value="security">Security settings</Tabs.Content>
 *     </Tabs>
 *   );
 * }
 * @since 1.0.0
 * @see {@link Tabs}
 * @see {@link TabsListOwnProps}
 */
export function TabsList<T extends PolymorphicTarget = "div">(props: TabsListProps<T>): JsxChild {
  const context = tabsContext.use("Tabs.List");
  const [own, rest] = splitProps(partProps<Loose & TabsListOwnProps>(props), ["as", "loop"]);
  const roving = useRovingFocus({
    orientation: context.orientation,
    dir: context.dir,
    loop: () => own.loop !== false,
    currentTabStopId: context.value,
  });
  const merged = mergeElementProps(
    {
      role: "tablist",
      get "aria-orientation"() {
        return context.orientation() === "vertical" ? "vertical" : undefined;
      },
      get "data-orientation"() {
        return context.orientation();
      },
    },
    rest,
  );
  return (
    <tabsListContext.Provider value={{ roving }}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </tabsListContext.Provider>
  );
}
