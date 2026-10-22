import type { Accessor } from "@shadow-js/core";
import { createPartContext, type PartContext } from "../utils/index";

/**
 * The state of a checkbox: checked, unchecked or `"indeterminate"` (the WAI-ARIA "mixed" state).
 * @see {@link Checkbox}
 * @since 1.0.0
 */
export type CheckedState = boolean | "indeterminate";

/**
 * What `Checkbox.Indicator` reads from its checkbox. @internal
 * @see {@link CheckboxRoot}
 */
export interface CheckboxContextValue {
  readonly checked: Accessor<CheckedState>;
  readonly disabled: Accessor<boolean>;
}

/**
 * The context a `Checkbox` root provides to its indicator. Read it in a custom part rendered inside
 * the root; reading it anywhere else throws. Accessibility: the context carries no ARIA of its own;
 * the root sets `aria-checked` from the same state.
 *
 * @example
 * import { checkboxContext } from "@shadow-js/primitives";
 *
 * export function CheckedLabel() {
 *   const root = checkboxContext.use("CheckedLabel");
 *   return <span>{root.checked() === true ? "on" : "off"}</span>;
 * }
 * @see {@link Checkbox}
 * @since 1.0.0
 */
export const checkboxContext: PartContext<CheckboxContextValue> =
  createPartContext<CheckboxContextValue>("Checkbox");

/** The `data-state` value for a checked state. @internal */
export function stateOf(checked: CheckedState): "checked" | "unchecked" | "indeterminate" {
  return checked === "indeterminate" ? "indeterminate" : checked ? "checked" : "unchecked";
}
