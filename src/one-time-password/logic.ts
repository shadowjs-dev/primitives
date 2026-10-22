/**
 * The editing rules of a one-time password field, pure so they are tested without a DOM. The value
 * is one string with no holes: slot `i` shows `value[i]` (or nothing past the end), so typing,
 * deleting and pasting keep the characters contiguous and the slots in step with them.
 * @packageDocumentation
 */

/**
 * Which characters a slot accepts: `"numeric"` digits only, `"alphanumeric"` digits and ASCII letters.
 * @since 1.0.0
 * @see {@link isAcceptedChar}
 */
export type OneTimePasswordType = "numeric" | "alphanumeric";

/** Normalize a digit already accepted from the two supported digit blocks. @internal */
export function normalizeDigit(char: string): string {
  // Both digit blocks start at a multiple of 16, so their low four bits are the Western digit.
  const code = char.charCodeAt(0);
  return code > 127 ? String(code & 15) : char;
}

/**
 * Whether one character is accepted.
 *
 * @param char A single character.
 * @param type `"numeric"` accepts Western, Arabic-Indic and Persian digits; `"alphanumeric"` also accepts ASCII letters.
 * @returns True when the character may be entered.
 * @example
 * import { isAcceptedChar } from "@shadow-js/primitives";
 *
 * export const digit = isAcceptedChar("7", "numeric"); // true
 * export const letterInCode = isAcceptedChar("A", "numeric"); // false
 * export const letterAlpha = isAcceptedChar("A", "alphanumeric"); // true
 * @since 1.0.0
 * @see {@link sanitize}
 */
export function isAcceptedChar(char: string, type: OneTimePasswordType): boolean {
  return (
    char.length === 1 && (type === "alphanumeric" ? /[0-9٠-٩۰-۹A-Za-z]/ : /[0-9٠-٩۰-۹]/).test(char)
  );
}

/**
 * The accepted characters of a text, in order, with Arabic-Indic and Persian digits normalized to Western digits.
 *
 * @param text Any text.
 * @param type See {@link isAcceptedChar}.
 * @returns The accepted characters joined.
 * @example
 * import { sanitize } from "@shadow-js/primitives";
 *
 * export const kept = sanitize("12-34 ab", "numeric"); // "1234"
 * export const keptAlpha = sanitize("12-34 ab", "alphanumeric"); // "1234ab"
 * @since 1.0.0
 * @see {@link pasteAt}
 */
export function sanitize(text: string, type: OneTimePasswordType): string {
  return text
    .replace(type === "alphanumeric" ? /[^0-9٠-٩۰-۹A-Za-z]/g : /[^0-9٠-٩۰-۹]/g, "")
    .replace(/[٠-٩۰-۹]/g, normalizeDigit);
}

/**
 * The result of an edit: the new value and the slot that should have focus.
 * @since 1.0.0
 * @see {@link typeChar}
 */
export interface OneTimePasswordEdit {
  /** The value after the edit. */
  readonly value: string;
  /** The slot that should have focus after the edit. */
  readonly focus: number;
}

/**
 * Types one character into slot `index`. A filled slot is overwritten; a slot past the end appends.
 * The focus moves to the next slot, or stays on the last one.
 *
 * @param value The current value.
 * @param length The number of slots.
 * @param index The focused slot.
 * @param char The character typed, already checked with `isAcceptedChar`.
 * @returns The edit; unchanged when `index` is past the last slot (`index >= length`) and the value
 *   already fills every slot.
 * @example
 * import { typeChar } from "@shadow-js/primitives";
 *
 * export const afterTyping = typeChar("12", 6, 1, "9"); // { value: "19", focus: 2 }
 * @since 1.0.0
 * @see {@link OneTimePasswordEdit}
 */
export function typeChar(
  value: string,
  length: number,
  index: number,
  char: string,
): OneTimePasswordEdit {
  const at = Math.min(index, value.length);
  return {
    value:
      at >= length
        ? value
        : (value.slice(0, at) + normalizeDigit(char) + value.slice(at + 1)).slice(0, length),
    focus: Math.min(at + 1, length - 1),
  };
}

/**
 * Backspace in slot `index`: a filled slot is deleted (the characters after it move left) and the
 * focus stays; an empty slot deletes the character before it and the focus moves there.
 *
 * @param value The current value.
 * @param index The focused slot.
 * @returns The edit.
 * @example
 * import { deleteBackward } from "@shadow-js/primitives";
 *
 * export const filled = deleteBackward("1234", 1); // { value: "134", focus: 1 }
 * export const empty = deleteBackward("12", 2); // { value: "1", focus: 1 }
 * @since 1.0.0
 * @see {@link deleteForward}
 */
export function deleteBackward(value: string, index: number): OneTimePasswordEdit {
  if (index < value.length) {
    return { value: value.slice(0, index) + value.slice(index + 1), focus: index };
  }
  if (index > 0) {
    const at = Math.min(index, value.length) - 1;
    return { value: value.slice(0, at) + value.slice(at + 1), focus: at };
  }
  return { value, focus: index };
}

/**
 * Delete in slot `index`: removes the character in that slot and keeps the focus.
 *
 * @param value The current value.
 * @param index The focused slot.
 * @returns The edit; unchanged when the slot is empty.
 * @example
 * import { deleteForward } from "@shadow-js/primitives";
 *
 * export const removed = deleteForward("1234", 1); // { value: "134", focus: 1 }
 * export const nothingThere = deleteForward("12", 4); // { value: "12", focus: 4 }
 * @since 1.0.0
 * @see {@link deleteBackward}
 */
export function deleteForward(value: string, index: number): OneTimePasswordEdit {
  if (index >= value.length) return { value, focus: index };
  return { value: value.slice(0, index) + value.slice(index + 1), focus: index };
}

/**
 * Pastes (or autofills) text from slot `index`: the accepted characters are written from there on,
 * overwriting, truncated to `length`. The focus goes to the slot after the last one written, or the
 * last slot.
 *
 * @param value The current value.
 * @param length The number of slots.
 * @param index The focused slot.
 * @param text The pasted text.
 * @param type See {@link isAcceptedChar}.
 * @returns The edit; unchanged when the text holds no accepted character.
 * @example
 * import { pasteAt } from "@shadow-js/primitives";
 *
 * export const pasted = pasteAt("", 6, 0, "12 34-56", "numeric"); // { value: "123456", focus: 5 }
 * export const overwritten = pasteAt("9999", 6, 2, "12", "numeric"); // { value: "9912", focus: 4 }
 * @since 1.0.0
 * @see {@link sanitize}
 */
export function pasteAt(
  value: string,
  length: number,
  index: number,
  text: string,
  type: OneTimePasswordType,
): OneTimePasswordEdit {
  const chars = sanitize(text, type);
  const at = Math.min(index, value.length);
  if (chars.length === 0) return { value, focus: Math.min(index, length - 1) };
  // Written over what is there, like typing: the rest of the value keeps its place.
  const end = at + chars.length;
  const next = (value.slice(0, at) + chars + value.slice(end)).slice(0, length);
  return { value: next, focus: Math.min(end, length - 1) };
}
