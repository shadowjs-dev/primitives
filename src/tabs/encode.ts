/**
 * Encoding of tab values for use inside ids. A value can be any string, but an id must be safe in
 * `aria-controls` / `aria-labelledby` (space separated) and in a CSS selector, so values are
 * encoded: `[A-Za-z0-9-]` stay as they are, every other code point (underscore included) becomes
 * `_<hex>_`. The encoding is injective (two values never share an id) and depends on nothing but
 * the value, so server and client agree.
 * @packageDocumentation
 */

/**
 * Encodes a tab value for use inside an id. ASCII letters, digits and hyphens stay as they are; every
 * other code point, underscore included, becomes `_<hex>_`, so two values never share an id.
 *
 * @param value Any string.
 * @returns A string of `[A-Za-z0-9_-]` that identifies `value` uniquely.
 * @example
 * import { encodeTabValue } from "@shadow-js/primitives";
 *
 * encodeTabValue("a b"); // "a_20_b"
 * @since 1.0.0
 * @see {@link TabsTrigger}
 */
export function encodeTabValue(value: string): string {
  let out = "";
  for (const char of value) {
    if (/^[A-Za-z0-9-]$/.test(char)) out += char;
    else out += `_${(char.codePointAt(0) ?? 0).toString(16)}_`;
  }
  return out;
}
