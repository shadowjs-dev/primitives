/**
 * The filtering rules of the combobox as pure functions, so they can be reused (server-side
 * filtering, custom `filter` props built on top of the default) and tested without a DOM.
 * @packageDocumentation
 */

/**
 * What a filter sees of an item: its value and the label the user reads.
 * @since 1.0.0
 * @see {@link ComboboxFilter}
 */
export interface ComboboxFilterItem {
  /** The value of the item. @default none (required) */
  readonly value: string;
  /** The label of the item; an empty label stands for its value. @default none (required) */
  readonly label: string;
}

/**
 * A filter decides whether an item matches what the user typed. Pass one as the `filter` prop of
 * `Combobox`; the default is {@link comboboxDefaultFilter}.
 * @since 1.0.0
 * @see {@link comboboxDefaultFilter}
 */
export type ComboboxFilter = (item: ComboboxFilterItem, query: string) => boolean;

/** Combining marks (the accents `normalize("NFD")` splits off their base letter). */
const COMBINING_MARKS = /\p{M}/gu;

/**
 * Normalizes text for matching: decomposes it (`é` becomes `e` plus an accent), drops the accents
 * and lower-cases it, so "cafe" finds "Café" and "ISTANBUL" finds "Istanbul".
 *
 * @param text Any text.
 * @returns The text without diacritics, in lower case.
 * @example
 * import { normalizeSearchText } from "@shadow-js/primitives";
 *
 * export const key: string = normalizeSearchText("Crème Brûlée"); // "creme brulee"
 * @since 1.0.0
 * @see {@link comboboxDefaultFilter}
 */
export function normalizeSearchText(text: string): string {
  return text.normalize("NFD").replace(COMBINING_MARKS, "").toLowerCase();
}

/**
 * The default filter: the item matches when its label (its value when the label is empty)
 * contains the query, ignoring case and diacritics. A blank query matches everything.
 *
 * @param item The item to test.
 * @param query What the user typed.
 * @returns Whether the item matches.
 * @example
 * import { comboboxDefaultFilter } from "@shadow-js/primitives";
 *
 * export const matches: boolean = comboboxDefaultFilter({ value: "cafe", label: "Café" }, "caf"); // true
 * @since 1.0.0
 * @see {@link filterComboboxItems}
 */
export const comboboxDefaultFilter: ComboboxFilter = (item, query) => {
  const needle = normalizeSearchText(query).trim();
  if (needle === "") return true;
  const label = item.label === "" ? item.value : item.label;
  return normalizeSearchText(label).includes(needle);
};

/**
 * Keeps the items that match `query`, in their original order. The input is never mutated and a
 * blank query returns every item.
 *
 * @param items The items, in display order.
 * @param query What the user typed.
 * @param filter The matcher; defaults to {@link comboboxDefaultFilter}.
 * @returns A new array with the matching items.
 * @example
 * import { filterComboboxItems } from "@shadow-js/primitives";
 *
 * const fruits = [
 *   { value: "a", label: "Apple" },
 *   { value: "b", label: "Banana" },
 * ];
 * export const bananas = filterComboboxItems(fruits, "an"); // [{ value: "b", label: "Banana" }]
 * @since 1.0.0
 * @see {@link comboboxDefaultFilter}
 */
export function filterComboboxItems<T extends ComboboxFilterItem>(
  items: readonly T[],
  query: string,
  filter: ComboboxFilter = comboboxDefaultFilter,
): T[] {
  // A blank query is "no filter" whatever the matcher, so a custom filter never has to handle it.
  if (query.trim() === "") return [...items];
  return items.filter((item) => filter(item, query));
}
