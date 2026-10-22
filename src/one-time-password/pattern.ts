import { otpPattern } from "../internal/otp-filter";
import { normalizeDigit } from "./logic";

/**
 * A predicate for one normalized, non-control UTF-16 character. Called untracked by the field.
 * @param character One normalized UTF-16 unit.
 * @returns Whether the field accepts the character.
 * @example
 * import type { OneTimePasswordCharacterFilter } from "@shadow-js/primitives";
 * const hex: OneTimePasswordCharacterFilter = (character) => /^[A-F0-9]$/.test(character);
 * @since 1.0.0
 */
export type OneTimePasswordCharacterFilter = (character: string) => boolean;

/**
 * Compiles an OTP character pattern. Only single non-control UTF-16 units are matched; Arabic-Indic
 * and Persian digits normalize before matching. The expression is Unicode-aware and has no mutable
 * global or sticky cursor. Use a reactive memo when its source changes.
 * @param source A regular expression source of at most 256 characters.
 * @returns A character predicate for `OneTimePasswordField.filter`.
 * @throws RangeError when the source exceeds 256 characters.
 * @throws TypeError when the source is not a valid regular expression.
 * @example
 * import { createOneTimePasswordPattern, OneTimePasswordField } from "@shadow-js/primitives";
 * const hex = createOneTimePasswordPattern("^[A-F0-9]+$");
 * export function Code() {
 *   return <OneTimePasswordField filter={hex} length={4} aria-label="Verification code">
 *     {[0, 1, 2, 3].map((index) => <OneTimePasswordField.Input index={index} />)}
 *   </OneTimePasswordField>;
 * }
 * @since 1.0.0
 */
export function createOneTimePasswordPattern(source: string): OneTimePasswordCharacterFilter {
  const expression = otpPattern(source);
  return (character) => {
    if (character.length !== 1) return false;
    const code = character.charCodeAt(0);
    if (code < 32 || code === 127 || (code >= 0xd800 && code <= 0xdfff)) return false;
    const normalized = character.replace(/[٠-٩۰-۹]/g, normalizeDigit);
    return expression.test(normalized);
  };
}
