import { PasswordToggleFieldInput, PasswordToggleFieldToggle } from "./parts";
import { PasswordToggleFieldRoot } from "./root";

export type {
  PasswordToggleFieldInputProps,
  PasswordToggleFieldToggleProps,
} from "./parts";
export type {
  PasswordToggleFieldContextValue,
  PasswordToggleFieldOwnProps,
  PasswordToggleFieldProps,
} from "./root";
export { passwordToggleFieldContext } from "./root";
export { PasswordToggleFieldInput, PasswordToggleFieldRoot, PasswordToggleFieldToggle };

/**
 * The password toggle field primitive: `PasswordToggleField`, `PasswordToggleField.Input` and
 * `PasswordToggleField.Toggle`. Each part is also exported by name. Keys: Enter or Space on the
 * toggle shows or hides the password. ARIA: the toggle is a `button` with `aria-pressed` and
 * `aria-controls` naming the input; the input is `type="password"` or `type="text"` while shown.
 *
 * @example
 * import { PasswordToggleField } from "@shadow-js/primitives";
 *
 * export function SignInPassword() {
 *   return (
 *     <PasswordToggleField>
 *       <PasswordToggleField.Input />
 *       <PasswordToggleField.Toggle aria-label="Show password" />
 *     </PasswordToggleField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PasswordToggleFieldRoot}
 */
export const PasswordToggleField: typeof PasswordToggleFieldRoot & {
  readonly Input: typeof PasswordToggleFieldInput;
  readonly Toggle: typeof PasswordToggleFieldToggle;
} = Object.assign(PasswordToggleFieldRoot, {
  Input: PasswordToggleFieldInput,
  Toggle: PasswordToggleFieldToggle,
});
