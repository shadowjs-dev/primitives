import { type Accessor, onMount, useSignal } from "@shadow-js/core";
import { useFirstRenderFlag } from "../collapsible/mount-animation";
import {
  createPartContext,
  type Direction,
  type Orientation,
  type PartContext,
  type RovingFocus,
  useBaseId,
  useControllableState,
} from "../utils/index";
import { useDirectionAround } from "../utils/portal-direction";
import { createIdRegistry, type IdRegistry, tabContentId, tabTriggerId } from "./ids";

/**
 * How selection follows the arrow keys on a `Tabs`: `"automatic"` selects a tab as soon as it
 * receives focus, `"manual"` only moves focus and selects with Enter, Space or a click. Set it with
 * the `activationMode` prop.
 * @since 1.0.0
 * @see {@link TabsOwnProps}
 */
export type TabsActivationMode = "automatic" | "manual";

/**
 * The props {@link createTabsContext} reads to build the state of a tabs root. They mirror the props
 * of {@link TabsOwnProps}, with `id` in place of `baseId`. Each one is read when needed, so pass
 * getters to keep values reactive. The interface sets no ARIA attributes and no data attributes.
 * @since 1.0.0
 * @see {@link createTabsContext}
 */
export interface TabsStateProps {
  /**
   * The controlled selected value. Controlled when not `undefined`: the root then shows this value and
   * reports a selection only through `onValueChange`.
   * @default none (uncontrolled)
   */
  readonly value?: string | undefined;
  /**
   * The selected value when uncontrolled. Without it, and without `value`, no tab is selected.
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
   * Axis of the tab list. It decides which arrow keys move between tabs.
   * @default `"horizontal"`
   */
  readonly orientation?: Orientation | undefined;
  /**
   * Reading direction. `"rtl"` swaps the horizontal arrow keys.
   * @default none (the surrounding direction)
   */
  readonly dir?: Direction | undefined;
  /**
   * An accessor of the root element, so a `dir` attribute on one of its ancestors gives the direction when `dir` is not set.
   * @default none (the direction then comes from a `DirectionProvider` or the document)
   */
  readonly element?: (() => unknown) | undefined;
  /**
   * How selection follows focus. See {@link TabsActivationMode}.
   * @default `"automatic"`
   */
  readonly activationMode?: TabsActivationMode | undefined;
  /**
   * Base id that the generated ids of tabs and panels start with.
   * @default none (generated)
   */
  readonly id?: string | undefined;
}

/**
 * The state every part of a `Tabs` reads from its root: the selected value, the orientation, the
 * reading direction, the activation mode and the ids of the tabs and panels. A custom part reads it
 * with `tabsContext.use`; {@link createTabsContext} builds it.
 * @since 1.0.0
 * @see {@link tabsContext}
 */
export interface TabsContextValue {
  /** The selected value, or undefined when nothing is selected. */
  readonly value: Accessor<string | undefined>;
  /**
   * Requests a new selected value. Uncontrolled, the value is stored and reported. Controlled, it is
   * only reported through `onValueChange`.
   */
  readonly setValue: (value: string) => void;
  /**
   * The axis of the tab list. Tracked.
   */
  readonly orientation: Accessor<Orientation>;
  /**
   * The resolved reading direction. Tracked.
   */
  readonly dir: Accessor<Direction>;
  /**
   * The activation mode, `"automatic"` unless the root sets another. Tracked.
   */
  readonly activationMode: Accessor<TabsActivationMode>;
  /** The id the tab for `value` gets: the id it registered, else the derived default. Tracked. */
  readonly triggerIdFor: (value: string) => string;
  /**
   * The id of the panel for `value` if that panel is mounted, else undefined. Before the root has
   * mounted, the selected tab names its default panel id, which is what the server renders, so
   * hydration matches the server markup. Tracked.
   */
  readonly contentIdFor: (value: string) => string | undefined;
  /** The derived default ids (also what a part uses when the application passes no `id`). */
  readonly defaultTriggerId: (value: string) => string;
  readonly defaultContentId: (value: string) => string;
  /**
   * The ids the mounted tabs registered, keyed by value.
   */
  readonly triggers: IdRegistry;
  /**
   * The ids the mounted panels registered, keyed by value.
   */
  readonly contents: IdRegistry;
  /** False until the root's first render finished. Read once, not tracked. */
  readonly ready: () => boolean;
}

/**
 * The context of a `Tabs` root. Every tabs part reads its state through it. A custom part inside a
 * root reads it with `tabsContext.use("MyPart")`, which throws outside a root.
 *
 * @example
 * import { tabsContext } from "@shadow-js/primitives";
 *
 * export function SelectedTabName() {
 *   const tabs = tabsContext.use("SelectedTabName");
 *   return <span>{tabs.value() ?? "none"}</span>;
 * }
 * @since 1.0.0
 * @see {@link TabsContextValue}
 */
export const tabsContext: PartContext<TabsContextValue> =
  createPartContext<TabsContextValue>("Tabs");

/** What the tab list shares with its tabs. @internal */
export interface TabsListContextValue {
  readonly roving: RovingFocus;
}

/**
 * The context of a `Tabs.List`: the roving focus group that its tabs register with. A custom part
 * inside a list reads it with `tabsListContext.use("MyPart")`, which throws outside a list.
 *
 * @example
 * import { tabsListContext } from "@shadow-js/primitives";
 *
 * export function ListTabStop() {
 *   const list = tabsListContext.use("ListTabStop");
 *   return <span>{list.roving.tabStopId() ?? "none"}</span>;
 * }
 * @since 1.0.0
 * @see {@link TabsList}
 */
export const tabsListContext: PartContext<TabsListContextValue> =
  createPartContext<TabsListContextValue>("Tabs.List");

/**
 * Builds the state that a tabs root shares with its parts: the controllable selected value, the ids
 * of the tabs and panels, the orientation, the direction and the activation mode. The built-in
 * {@link Tabs} calls it; a custom root calls it and provides the result with `tabsContext.Provider`.
 *
 * @param props See {@link TabsStateProps}.
 * @returns The state to provide with `tabsContext.Provider`.
 * @example
 * import { createTabsContext, TabsList, TabsTrigger, tabsContext } from "@shadow-js/primitives";
 *
 * export function AccountTabList() {
 *   const context = createTabsContext({ defaultValue: "account" });
 *   return (
 *     <tabsContext.Provider value={context}>
 *       <TabsList aria-label="Settings">
 *         <TabsTrigger value="account">Account</TabsTrigger>
 *       </TabsList>
 *     </tabsContext.Provider>
 *   );
 * }
 * @since 1.0.0
 * @see {@link TabsContextValue}
 */
export function createTabsContext(props: TabsStateProps): TabsContextValue {
  const [value, setValue] = useControllableState<string | undefined>({
    value: () => props.value,
    defaultValue: () => props.defaultValue,
    onChange: () => {
      const callback = props.onValueChange;
      return callback === undefined
        ? undefined
        : (next) => {
            if (next !== undefined) callback(next);
          };
    },
    name: "Tabs value",
  });
  const base = useBaseId(() => props.id);
  const dir = useDirectionAround(
    () => props.dir,
    () => props.element?.(),
  );
  const triggers = createIdRegistry();
  const contents = createIdRegistry();
  // Set after the root mounts, once every panel that renders on the first pass has registered.
  const [settled, setSettled] = useSignal(false);
  onMount(() => {
    setSettled(true);
  });
  return {
    value,
    setValue: (next) => setValue(next),
    orientation: () => props.orientation ?? "horizontal",
    dir,
    activationMode: () => props.activationMode ?? "automatic",
    triggerIdFor: (tab) => triggers.get(tab) ?? tabTriggerId(base(), tab),
    // The selected panel is referenced before it registers itself: the server renders it, and the
    // client must produce the same attributes while hydrating. A tab with no panel mounted names
    // nothing once the root has mounted, so `aria-controls` never points at a missing element.
    contentIdFor: (tab) =>
      contents.get(tab) ?? (value() === tab && !settled() ? tabContentId(base(), tab) : undefined),
    defaultTriggerId: (tab) => tabTriggerId(base(), tab),
    defaultContentId: (tab) => tabContentId(base(), tab),
    triggers,
    contents,
    ready: useFirstRenderFlag(),
  };
}
