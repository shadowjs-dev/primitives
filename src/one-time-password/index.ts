import { OneTimePasswordFieldInput } from "./input";
import { OneTimePasswordFieldRoot } from "./root";

export type { OneTimePasswordContextValue } from "./context";
export { oneTimePasswordContext } from "./context";
export type { OneTimePasswordFieldInputOwnProps, OneTimePasswordFieldInputProps } from "./input";
export type { OneTimePasswordEdit, OneTimePasswordType } from "./logic";
export {
  deleteBackward,
  deleteForward,
  isAcceptedChar,
  pasteAt,
  sanitize,
  typeChar,
} from "./logic";
export type { OneTimePasswordCharacterFilter } from "./pattern";
export { createOneTimePasswordPattern } from "./pattern";
export type { OneTimePasswordFieldOwnProps, OneTimePasswordFieldProps } from "./root";
export { OneTimePasswordFieldInput, OneTimePasswordFieldRoot };

/**
 * The one-time password primitive: `OneTimePasswordField` and `OneTimePasswordField.Input` (one per
 * slot). Each part is also exported by name. Keys: a character fills the focused slot and moves on,
 * Backspace and Delete remove, ArrowLeft and ArrowRight (swapped in RTL) and Home and End move between
 * slots. ARIA: a `role="group"` whose slots are named "Digit n of N" (or "Character n of N"); the first
 * slot has `autocomplete="one-time-code"`.
 *
 * @example
 * import { OneTimePasswordField } from "@shadow-js/primitives";
 *
 * export function FourDigitEntry() {
 *   return (
 *     <OneTimePasswordField length={4} onComplete={(code) => console.info(code)} aria-label="Code">
 *       <OneTimePasswordField.Input index={0} />
 *       <OneTimePasswordField.Input index={1} />
 *       <OneTimePasswordField.Input index={2} />
 *       <OneTimePasswordField.Input index={3} />
 *     </OneTimePasswordField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link OneTimePasswordFieldRoot}
 */
export const OneTimePasswordField: typeof OneTimePasswordFieldRoot & {
  readonly Input: typeof OneTimePasswordFieldInput;
} = Object.assign(OneTimePasswordFieldRoot, { Input: OneTimePasswordFieldInput });
