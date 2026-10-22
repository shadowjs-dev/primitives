import type { Accessor } from "@shadow-js/core";
import { createPartContext, type PartContext } from "../utils/index";

/**
 * The state a switch shares with its parts: whether it is on and whether it is disabled. Read by
 * {@link SwitchThumb} to set its `data-state` and `data-disabled`.
 * @since 1.0.0
 * @see {@link switchContext}
 */
export interface SwitchContextValue {
  /** Whether the switch is on. Call it to read the value. */
  readonly checked: Accessor<boolean>;
  /** Whether the switch is disabled. Call it to read the value. */
  readonly disabled: Accessor<boolean>;
}

/**
 * The context of {@link SwitchRoot}. A part reads it with `switchContext.use("Switch.Part")`,
 * which throws `<Switch.Part> must be used within <Switch>.` outside a switch.
 *
 * @example
 * import type { JsxChild } from "@shadow-js/web/jsx-runtime";
 * import { type SwitchContextValue, switchContext } from "@shadow-js/primitives";
 *
 * export function SwitchStatus(): JsxChild {
 *   const state: SwitchContextValue = switchContext.use("Switch.Status");
 *   return <span>{state.checked() ? "On" : "Off"}</span>;
 * }
 * @see {@link SwitchContextValue}
 * @since 1.0.0
 */
export const switchContext: PartContext<SwitchContextValue> =
  createPartContext<SwitchContextValue>("Switch");
