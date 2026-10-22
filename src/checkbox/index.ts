import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTarget } from "../utils/index";
import { CheckboxIndicator } from "./indicator";
import { type CheckboxProps, CheckboxRoot } from "./root";

export type { CheckboxContextValue, CheckedState } from "./context";
export { checkboxContext } from "./context";
export type { CheckboxIndicatorProps } from "./indicator";
export type { CheckboxOwnProps, CheckboxProps } from "./root";
export { CheckboxIndicator, CheckboxRoot };

/**
 * The checkbox primitive: `Checkbox` and `Checkbox.Indicator`. Each part is also exported by name
 * (`CheckboxRoot`, `CheckboxIndicator`) for tree shaking. Keys: Space toggles; Enter does nothing
 * and never submits a form. ARIA: `role="checkbox"` with `aria-checked` (`"true"`, `"false"` or
 * `"mixed"`).
 *
 * @example
 * import { Checkbox } from "@shadow-js/primitives";
 *
 * export function Newsletter() {
 *   return (
 *     <Checkbox name="newsletter" defaultChecked>
 *       <Checkbox.Indicator>x</Checkbox.Indicator>
 *     </Checkbox>
 *   );
 * }
 * @see {@link CheckboxRoot}
 * @since 1.0.0
 */
export const Checkbox: typeof CheckboxRoot & {
  readonly Indicator: typeof CheckboxIndicator;
} = Object.assign(
  <T extends PolymorphicTarget = "button">(props: CheckboxProps<T>): JsxChild =>
    CheckboxRoot(props),
  { Indicator: CheckboxIndicator },
);
