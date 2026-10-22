/**
 * Locale-aware number text for the number field: `formatNumber` turns a number into the text a
 * user of a locale expects, `parseNumber` turns what the user typed back into a number. Parsing is
 * lenient on purpose: it understands the locale's own digits (Arabic-Indic, Persian, fullwidth...),
 * grouping and decimal separators, minus and plus signs (including the Unicode minus and bidi
 * marks), percent signs, currency symbols, units and accounting parentheses, and accepts "." or ","
 * as the decimal separator when the locale does not use that character for grouping.
 *
 * Pure: no DOM, no state; depends only on `Intl`.
 * @packageDocumentation
 */

/**
 * The locale used when none is given. It is fixed (not the browser's) so the text rendered on the
 * server and the text produced on the client agree and hydration never mismatches; pass `locale`
 * to localize.
 * @since 1.0.0
 * @example
 * import { DEFAULT_LOCALE, formatNumber } from "@shadow-js/primitives";
 *
 * export const shownText = formatNumber(1234.5, DEFAULT_LOCALE); // "1,234.5"
 * @see {@link formatNumber}
 */
export const DEFAULT_LOCALE = "en-US";

/**
 * Formats and parses numbers for one locale and one set of `Intl.NumberFormat` options. Returned by
 * {@link createNumberFormatter}.
 * @since 1.0.0
 * @see {@link createNumberFormatter}
 */
export interface NumberFormatter {
  /** Text for a number; the empty string for `NaN`. */
  format(value: number): string;
  /** The number a text stands for, or `null` when it is empty or not a number. */
  parse(text: string): number | null;
  /** The most fraction digits the formatter shows (the precision a typed value is rounded to). */
  readonly maximumFractionDigits: number;
  /** Whether the formatter shows percentages (the number is a fraction: 0.5 is "50%"). */
  readonly percent: boolean;
}

/** Zero code points of the digit blocks `parse` understands (each block is 10 consecutive digits). */
const DIGIT_ZEROS: readonly number[] = [
  0x0660, 0x06f0, 0x07c0, 0x0966, 0x09e6, 0x0a66, 0x0ae6, 0x0b66, 0x0be6, 0x0c66, 0x0ce6, 0x0d66,
  0x0e50, 0x0ed0, 0x0f20, 0x1040, 0x17e0, 0x1810, 0xff10,
];

/** Bidirectional formatting marks that locales sprinkle around signs and percent symbols. */
const BIDI_MARKS = /[‎‏؜‪-‮⁦-⁩]/gu;
/** Every dash a user or a locale may mean as "minus". */
const MINUS_SIGNS = "-−‐‑‒–—﹣－";
const MINUS_CLASS = new RegExp(`[${MINUS_SIGNS}]`, "u");
/** Characters users type as grouping in many locales. */
const EXTRA_GROUPS: readonly string[] = ["'", "’", "ʼ", "٬"];

/** NFKC, no bidi marks, locale digits turned into ASCII digits. */
function normalize(text: string): string {
  let out = "";
  for (const char of text.normalize("NFKC").replace(BIDI_MARKS, "")) {
    const code = char.codePointAt(0) ?? 0;
    const zero = DIGIT_ZEROS.find((start) => code >= start && code < start + 10);
    out += zero === undefined ? char : String(code - zero);
  }
  return out;
}

function escapeRegExp(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&");
}

/** Moves the decimal point of a plain decimal string `places` to the left (exact, no float math). */
function shiftLeft(decimal: string, places: number): string {
  const [integer = "", fraction = ""] = decimal.split(".");
  const digits = integer.padStart(places + 1, "0") + fraction;
  const cut = digits.length - fraction.length - places;
  return `${digits.slice(0, cut)}.${digits.slice(cut)}`;
}

/** Strings the formatter wraps around the digits (currency, unit, percent sign, literals). */
function collectAffixes(format: Intl.NumberFormat): string[] {
  const found = new Set<string>();
  for (const sample of [0, 1, 2, 5, 0.5, 12345.6, -1, -12345.6]) {
    for (const part of format.formatToParts(sample)) {
      if (
        part.type === "currency" ||
        part.type === "unit" ||
        part.type === "percentSign" ||
        part.type === "literal"
      ) {
        const text = normalize(part.value).replace(/\s+/gu, "");
        if (text !== "" && text !== "(" && text !== ")") found.add(text);
      }
    }
  }
  // Longest first, so "US$" goes before "$".
  return [...found].sort((a, b) => b.length - a.length);
}

/**
 * Creates the formatter and parser of a locale.
 *
 * @param locale A BCP 47 language tag; defaults to {@link DEFAULT_LOCALE}.
 * @param options `Intl.NumberFormat` options (style, currency, unit, fraction digits...).
 * @returns The formatter and parser. Reuse it: building it constructs `Intl` objects.
 * @example
 * import { createNumberFormatter } from "@shadow-js/primitives";
 *
 * const euros = createNumberFormatter("de-DE", { style: "currency", currency: "EUR" });
 * export const text = euros.format(1234.5); // "1.234,50 €"
 * export const amount = euros.parse("1.234,50 €"); // 1234.5
 * @since 1.0.0
 * @see {@link NumberFormatter}
 */
export function createNumberFormatter(
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {},
): NumberFormatter {
  const format = new Intl.NumberFormat(locale, options);
  const resolved = format.resolvedOptions();
  const percent = resolved.style === "percent";
  const maximumFractionDigits = (resolved.maximumFractionDigits ?? 0) + (percent ? 2 : 0);

  // The separators come from a plain probe: a currency like JPY has no decimal part to read them from.
  const probe = new Intl.NumberFormat(locale, {
    numberingSystem: resolved.numberingSystem,
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  }).formatToParts(-1234567.5);
  const symbol = (type: string): string =>
    normalize(probe.find((p) => p.type === type)?.value ?? "");
  const decimal = symbol("decimal") || ".";
  const group = symbol("group").replace(/\s+/gu, "");
  const affixes = collectAffixes(format);
  const affixPattern =
    affixes.length === 0 ? undefined : new RegExp(affixes.map(escapeRegExp).join("|"), "giu");

  const groups = new Set<string>([...EXTRA_GROUPS, ...(group === "" ? [] : [group])]);
  groups.delete(decimal);
  const decimals = new Set<string>([decimal, "٫"]);
  for (const alias of [".", ","]) if (!groups.has(alias)) decimals.add(alias);
  for (const char of decimals) groups.delete(char);

  const parse = (text: string): number | null => {
    let s = normalize(text).trim();
    if (s === "") return null;
    let negative = false;
    // Accounting style: (12.50).
    if (s.startsWith("(") && s.endsWith(")")) {
      negative = true;
      s = s.slice(1, -1);
    }
    if (affixPattern !== undefined) s = s.replace(affixPattern, "");
    s = s.replace(/\s+/gu, "");
    // A sign may lead or trail the digits, nowhere else.
    if (MINUS_CLASS.test(s.charAt(0))) {
      negative = true;
      s = s.slice(1);
    } else if (MINUS_CLASS.test(s.charAt(s.length - 1))) {
      negative = true;
      s = s.slice(0, -1);
    }
    if (s.startsWith("+")) s = s.slice(1);
    else if (s.endsWith("+")) s = s.slice(0, -1);
    let plain = "";
    let dots = 0;
    for (const char of s) {
      if (groups.has(char)) continue;
      if (decimals.has(char)) {
        dots += 1;
        plain += ".";
      } else if (char >= "0" && char <= "9") plain += char;
      else return null;
    }
    if (dots > 1 || !/\d/u.test(plain)) return null;
    const magnitude = Number(percent ? shiftLeft(plain, 2) : plain);
    if (!Number.isFinite(magnitude)) return null;
    // `+ 0` turns -0 into 0.
    return (negative ? -magnitude : magnitude) + 0;
  };

  return {
    format: (value) => (Number.isNaN(value) ? "" : format.format(value)),
    parse,
    maximumFractionDigits,
    percent,
  };
}

/**
 * Formats a number for a locale.
 *
 * @param value The number.
 * @param locale A BCP 47 tag; defaults to {@link DEFAULT_LOCALE}.
 * @param options `Intl.NumberFormat` options.
 * @returns The text, empty for `NaN`.
 * @example
 * import { formatNumber } from "@shadow-js/primitives";
 *
 * export const german = formatNumber(1234.5, "de-DE"); // "1.234,5"
 * @since 1.0.0
 * @see {@link createNumberFormatter}
 */
export function formatNumber(
  value: number,
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {},
): string {
  return createNumberFormatter(locale, options).format(value);
}

/**
 * Parses what a user typed in a locale, leniently (see the module description).
 *
 * @param text The text.
 * @param locale A BCP 47 tag; defaults to {@link DEFAULT_LOCALE}.
 * @param options The `Intl.NumberFormat` options the field formats with (percent, currency...).
 * @returns The number, or `null` for empty or unparseable text.
 * @example
 * import { parseNumber } from "@shadow-js/primitives";
 *
 * export const arabic = parseNumber("١٢٫٥", "ar-EG"); // 12.5
 * export const percent = parseNumber("50 %", "fr-FR", { style: "percent" }); // 0.5
 * @since 1.0.0
 * @see {@link createNumberFormatter}
 */
export function parseNumber(
  text: string,
  locale: string = DEFAULT_LOCALE,
  options: Intl.NumberFormatOptions = {},
): number | null {
  return createNumberFormatter(locale, options).parse(text);
}
