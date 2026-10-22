import type { Accessor } from "@shadow-js/core";
import { createPartContext, type PartContext, type RovingFocus } from "../utils/index";

/**
 * What `RadioGroup.Item` reads from its group. @internal
 * @see {@link RadioGroupRoot}
 */
export interface RadioGroupContextValue {
  /** The checked item's value, `""` when none. */
  readonly value: Accessor<string>;
  /** Checks the item with this value (selecting is the only thing a radio does). */
  readonly check: (value: string) => void;
  /** Restores the default value after a native form reset (idempotent within one reset). */
  readonly reset: () => void;
  readonly defaultValue: Accessor<string | undefined>;
  readonly name: Accessor<string | undefined>;
  readonly form: Accessor<string | undefined>;
  readonly required: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly roving: RovingFocus;
  /**
   * Whether the last key pressed was an arrow key. Arrow keys move focus, and focus lands on a
   * radio that then checks itself: selection follows focus, but only for the keyboard.
   */
  readonly arrow: {
    readonly active: () => boolean;
    readonly set: (active: boolean) => void;
  };
}

/**
 * The context a `RadioGroup` root shares with its items. Read it with `use()` from a custom part
 * that sits inside a `RadioGroup`; it throws outside one.
 *
 * @example
 * import { radioGroupContext } from "@shadow-js/primitives";
 *
 * export function SelectedValue() {
 *   const group = radioGroupContext.use("SelectedValue");
 *   return <span>{group.value()}</span>;
 * }
 * @since 1.0.0
 * @see {@link RadioGroupRoot}
 */
export const radioGroupContext: PartContext<RadioGroupContextValue> =
  createPartContext<RadioGroupContextValue>("RadioGroup");

/**
 * What `RadioGroup.Indicator` reads from its item. @internal
 * @see {@link RadioGroupItem}
 */
export interface RadioItemContextValue {
  readonly checked: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
}

/**
 * The context a `RadioGroup.Item` shares with its `RadioGroup.Indicator`. Read it with `use()` from
 * a custom part that sits inside an item; it throws outside one.
 *
 * @example
 * import { radioItemContext } from "@shadow-js/primitives";
 *
 * export function ItemState() {
 *   const item = radioItemContext.use("ItemState");
 *   return <span>{item.checked() ? "on" : "off"}</span>;
 * }
 * @since 1.0.0
 * @see {@link RadioGroupItem}
 */
export const radioItemContext: PartContext<RadioItemContextValue> =
  createPartContext<RadioItemContextValue>("RadioGroup.Item");
