import { splitProps } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeRefs,
  type Direction,
  mergeElementProps,
  type Orientation,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useRefSignal,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { createTabsContext, type TabsActivationMode, tabsContext } from "./context";

/**
 * Own props of {@link Tabs}.
 *
 * Accessibility: the root sets no role. Its list is the `tablist`, its triggers are the `tab`s and
 * its panels the `tabpanel`s, and those parts handle the keys (see {@link TabsList} and
 * {@link TabsTrigger}). The root handles no keys of its own.
 *
 * Data attributes: `data-orientation` (`"horizontal"` or `"vertical"`) on the root, always set; `dir`
 * on the root, only when the `dir` prop is passed.
 * @since 1.0.0
 * @see {@link Tabs}
 */
export interface TabsOwnProps {
  /**
   * Controlled selected tab: the value of the tab that is selected. Controlled when not `undefined`;
   * the root then shows this value and reports a selection only through `onValueChange`.
   * @default none (uncontrolled)
   */
  readonly value?: string | undefined;
  /**
   * Initially selected tab when uncontrolled. Without it, and without `value`, no tab is selected.
   * @default none
   */
  readonly defaultValue?: string | undefined;
  /**
   * Called with the new value when the user selects another tab. Pressing the selected tab again does
   * not call it.
   * @default none
   */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /**
   * Axis of the tab list. Vertical tabs are moved with Up and Down, and the list gets
   * `aria-orientation="vertical"`. Left and Right do nothing on a vertical list.
   * @default `"horizontal"`
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Reading direction. `"rtl"` swaps the horizontal arrow keys and sets `dir` on the root.
   * @default none (the surrounding direction: the nearest direction provider, else the document's
   * `dir`, else `"ltr"`)
   */
  readonly dir?: Direction | undefined;
  /**
   * `"automatic"` selects a tab as soon as it receives focus. `"manual"` only moves focus, and Enter,
   * Space or a click selects.
   * @default `"automatic"`
   */
  readonly activationMode?: TabsActivationMode | undefined;
  /**
   * Base id that the generated ids of tabs and panels start with. It is not written to the DOM.
   * @default none (generated)
   */
  readonly baseId?: string | undefined;
}

/**
 * Props of {@link Tabs}: the own props and the attributes of the chosen element (a `div` by default).
 * @since 1.0.0
 * @see {@link TabsOwnProps}
 */
export type TabsProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  TabsOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const OWN_KEYS = [
  "as",
  "value",
  "defaultValue",
  "onValueChange",
  "orientation",
  "dir",
  "activationMode",
  "baseId",
] as const;

/**
 * Layered sections of content, one visible at a time (the WAI-ARIA tabs pattern). Renders a `div` by
 * default, carrying `data-orientation` and `dir` when given. Controlled with `value` /
 * `onValueChange`, or uncontrolled with `defaultValue`.
 *
 * Keyboard and ARIA: the root sets no role and handles no keys. Its list, tabs and panels provide the
 * `tablist`, `tab` and `tabpanel` roles and handle the keys (see {@link TabsList} and
 * {@link TabsTrigger}).
 *
 * @param props See {@link TabsProps}.
 * @returns The rendered tabs root.
 * @example
 * import { Tabs } from "@shadow-js/primitives";
 *
 * export function SettingsTabs() {
 *   return (
 *     <Tabs defaultValue="account">
 *       <Tabs.List aria-label="Settings">
 *         <Tabs.Trigger value="account">Account</Tabs.Trigger>
 *         <Tabs.Trigger value="password">Password</Tabs.Trigger>
 *       </Tabs.List>
 *       <Tabs.Content value="account">Account settings</Tabs.Content>
 *       <Tabs.Content value="password">Password settings</Tabs.Content>
 *     </Tabs>
 *   );
 * }
 * @since 1.0.0
 * @see {@link Tabs}
 */
export function TabsRoot<T extends PolymorphicTarget = "div">(props: TabsProps<T>): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & TabsOwnProps>(props), OWN_KEYS);
  const [root, setRoot] = useRefSignal<HTMLElement>();
  const context = createTabsContext({
    get value() {
      return own.value;
    },
    get defaultValue() {
      return own.defaultValue;
    },
    get onValueChange() {
      return own.onValueChange;
    },
    get orientation() {
      return own.orientation;
    },
    get dir() {
      return own.dir;
    },
    get activationMode() {
      return own.activationMode;
    },
    get id() {
      return own.baseId;
    },
    element: root,
  });
  const merged = mergeElementProps(
    {
      get "data-orientation"() {
        return context.orientation();
      },
      // Only an explicit `dir` is written: the inherited one is resolved on the client alone, and
      // markup must not differ between the server and the first client render.
      get dir() {
        return own.dir;
      },
      ref: composeRefs<HTMLElement>(setRoot),
    },
    rest,
  );
  return (
    <tabsContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
    </tabsContext.Provider>
  );
}
