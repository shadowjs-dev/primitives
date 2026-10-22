import { onCleanup, splitProps, useEffect } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  composeEventHandlers,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { tabsContext, tabsListContext } from "./context";

/**
 * Own props of {@link TabsTrigger}, on top of the attributes of the chosen element (a `button` by
 * default).
 *
 * Accessibility: the tab is a `role="tab"` with `aria-selected` (`"true"` or `"false"`), and
 * `aria-controls` while its panel is mounted. Enter and Space select it; the arrow keys, Home and End
 * move focus between tabs (see {@link TabsTrigger}).
 *
 * Data attributes: `data-state` (`"active"` or `"inactive"`), `data-disabled` (present, value `""`)
 * while disabled, and `data-orientation` (`"horizontal"` or `"vertical"`), always set.
 * @since 1.0.0
 * @see {@link TabsTrigger}
 */
export interface TabsTriggerOwnProps {
  /**
   * The value that identifies this tab and its panel. Any string.
   * @default none (required)
   */
  readonly value: string;
  /**
   * A disabled tab cannot be selected and is skipped by the arrow keys. A disabled `button` gets the
   * `disabled` attribute; any other element gets `aria-disabled="true"` instead.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link TabsTrigger}: the own props and the attributes of the chosen element (a `button` by
 * default).
 * @since 1.0.0
 * @see {@link TabsTriggerOwnProps}
 */
export type TabsTriggerProps<T extends PolymorphicTarget = "button"> = PolymorphicProps<
  "button",
  TabsTriggerOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

type Own = Loose & TabsTriggerOwnProps;

/**
 * One tab: a `button` with `role="tab"`, `aria-selected`, `aria-controls` (its panel, while that
 * exists), `data-state="active" | "inactive"`, `data-disabled` and `data-orientation`. The selected
 * tab is the tab stop (roving tabindex), or the first enabled tab when the selected one is missing or disabled.
 *
 * Keyboard and ARIA: with `activationMode="automatic"` (the default) focusing a tab selects it; with
 * `"manual"`, Enter, Space or a click does. Enter and Space select in both modes. The arrow keys, Home
 * and End move focus between enabled tabs (see {@link TabsList}). A handler that calls `preventDefault`
 * on mousedown, click or keydown cancels the selection, and a keydown handler that does so also
 * cancels the arrow move.
 *
 * @param props See {@link TabsTriggerProps}.
 * @returns The rendered tab.
 * @throws Error when rendered outside {@link Tabs}, with the message `[primitives] <Tabs.Trigger> must be used within <Tabs>.`, or outside {@link TabsList}, with the message `[primitives] <Tabs.Trigger> must be used within <Tabs.List>.`
 * @example
 * import { Tabs } from "@shadow-js/primitives";
 *
 * export function BillingTabs(props: { readonly allowed: boolean }) {
 *   return (
 *     <Tabs defaultValue="account">
 *       <Tabs.List aria-label="Settings">
 *         <Tabs.Trigger value="account">Account</Tabs.Trigger>
 *         <Tabs.Trigger value="billing" disabled={!props.allowed}>
 *           Billing
 *         </Tabs.Trigger>
 *       </Tabs.List>
 *       <Tabs.Content value="account">Account settings</Tabs.Content>
 *       <Tabs.Content value="billing">Billing settings</Tabs.Content>
 *     </Tabs>
 *   );
 * }
 * @since 1.0.0
 * @see {@link TabsList}
 * @see {@link TabsTriggerOwnProps}
 */
export function TabsTrigger<T extends PolymorphicTarget = "button">(
  props: TabsTriggerProps<T>,
): JsxChild {
  const context = tabsContext.use("Tabs.Trigger");
  const list = tabsListContext.use("Tabs.Trigger");
  const [own, rest] = splitProps(partProps<Own>(props), [
    "as",
    "value",
    "disabled",
    "onMouseDown",
    "onClick",
    "onKeyDown",
    "onFocusIn",
  ]);
  const selected = (): boolean => context.value() === own.value;
  const disabled = (): boolean => own.disabled === true;
  const native = (): boolean => (own.as ?? "button") === "button";
  const idProp = (): string | undefined => (rest as { id?: string }).id;
  const triggerId = (): string => idProp() ?? context.defaultTriggerId(own.value);

  // The panel's aria-labelledby follows an application id once this tab is mounted.
  useEffect(() => {
    onCleanup(context.triggers.register(own.value, triggerId()));
  });

  const select = (): void => {
    if (!disabled()) context.setValue(own.value);
  };

  const roving = list.roving.item({
    id: () => own.value,
    disabled,
    active: selected,
  });

  // The group's own `onFocusIn` only remembers the last focused tab, which a group with a selected
  // tab never needs; dropping it keeps this part free of a per-element native listener.
  const [, rovingProps] = splitProps(roving, ["onFocusIn"]);
  const merged = mergeElementProps(
    rovingProps,
    {
      type: "button",
      role: "tab",
      get id() {
        return triggerId();
      },
      get "aria-selected"() {
        return selected();
      },
      get "aria-controls"() {
        return context.contentIdFor(own.value);
      },
      get "data-state"() {
        return selected() ? "active" : "inactive";
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      get disabled() {
        return native() && disabled() ? true : undefined;
      },
      // Another element has no disabled state of its own, so assistive technology is told by aria.
      get "aria-disabled"() {
        return !native() && disabled() ? true : undefined;
      },
    },
    rest,
    {
      onMouseDown: composeEventHandlers(
        () => own.onMouseDown,
        (event: MouseEvent) => {
          // Only the main button selects; ctrl+click is a context menu on macOS.
          if (event.button === 0 && !event.ctrlKey) select();
        },
      ),
      // A click without a mousedown (assistive technology, `element.click()`) must select too.
      onClick: composeEventHandlers(() => own.onClick, select),
      onKeyDown: composeEventHandlers(
        () => own.onKeyDown,
        (event: KeyboardEvent) => {
          if (event.key === "Enter" || event.key === " ") select();
        },
      ),
      // `focusin` is delegated by the runtime, `focus` would need a listener on every tab.
      onFocusIn: composeEventHandlers(
        () => own.onFocusIn,
        () => {
          if (!selected() && !disabled() && context.activationMode() === "automatic") select();
        },
      ),
    },
  );
  return <Polymorphic as={own.as ?? "button"} {...merged} />;
}
