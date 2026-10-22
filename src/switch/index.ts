import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTarget } from "../utils/index";
import { type SwitchProps, SwitchRoot } from "./root";
import { SwitchThumb } from "./thumb";

export type { SwitchContextValue } from "./context";
export { switchContext } from "./context";
export type { SwitchOwnProps, SwitchProps } from "./root";
export type { SwitchThumbProps } from "./thumb";
export { SwitchRoot, SwitchThumb };

/**
 * The switch primitive: `Switch` (a `button` with `role="switch"`) and `Switch.Thumb` (the part that
 * moves). Each part is also exported by name (`SwitchRoot`, `SwitchThumb`) for tree shaking.
 *
 * Keyboard and ARIA: the root has `role="switch"` and `aria-checked`. A click, Space or Enter
 * toggles it. Other elements passed with `as` handle Space and Enter themselves and get
 * `tabindex="0"`. Data attributes: `data-state` (`"checked"` or `"unchecked"`) and `data-disabled`
 * on the root and the thumb. See {@link SwitchRoot} for the details.
 *
 * @example
 * import { Switch } from "@shadow-js/primitives";
 *
 * export function Notifications() {
 *   return (
 *     <Switch name="notifications" defaultChecked>
 *       <Switch.Thumb />
 *     </Switch>
 *   );
 * }
 * @see {@link SwitchRoot}
 * @see {@link SwitchThumb}
 * @since 1.0.0
 */
export const Switch: typeof SwitchRoot & {
  readonly Thumb: typeof SwitchThumb;
} = Object.assign(
  <T extends PolymorphicTarget = "button">(props: SwitchProps<T>): JsxChild => SwitchRoot(props),
  { Thumb: SwitchThumb },
);
