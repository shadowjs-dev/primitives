/**
 * The pure rules of an accordion's value: which items are open after an item is asked to open or
 * close. Both modes work on the list of open item values; a `"single"` accordion keeps at most one
 * entry. Kept free of DOM and signals so the rules can be property tested.
 * @packageDocumentation
 */

/**
 * How many items may be open at once.
 * @see {@link openItem}
 * @since 1.0.0
 */
export type AccordionType = "single" | "multiple";

/**
 * The open items after `item` is asked to open.
 *
 * @param type `"single"` replaces the open item, `"multiple"` adds to the open ones.
 * @param open The open item values before the change.
 * @param item The item that opens.
 * @returns The new list (the same array when nothing changes).
 * @see {@link setItemOpen}
 * @example
 * import { openItem } from "@shadow-js/primitives";
 *
 * const single = openItem("single", ["a"], "b"); // ["b"]
 * const multiple = openItem("multiple", ["a"], "b"); // ["a", "b"]
 * @since 1.0.0
 */
export function openItem(
  type: AccordionType,
  open: readonly string[],
  item: string,
): readonly string[] {
  if (type === "single") return open.length === 1 && open[0] === item ? open : [item];
  return open.includes(item) ? open : [...open, item];
}

/**
 * The open items after `item` is asked to close. A `"single"` accordion that is not `collapsible`
 * keeps its open item open, so there is always one.
 *
 * @param type The accordion type.
 * @param open The open item values before the change.
 * @param item The item that closes.
 * @param collapsible Whether a `"single"` accordion may have no open item.
 * @returns The new list (the same array when nothing changes).
 * @see {@link setItemOpen}
 * @example
 * import { closeItem } from "@shadow-js/primitives";
 *
 * const kept = closeItem("single", ["a"], "a", false); // ["a"]
 * const emptied = closeItem("single", ["a"], "a", true); // []
 * const multiple = closeItem("multiple", ["a", "b"], "a", false); // ["b"]
 * @since 1.0.0
 */
export function closeItem(
  type: AccordionType,
  open: readonly string[],
  item: string,
  collapsible: boolean,
): readonly string[] {
  if (!open.includes(item)) return open;
  if (type === "single" && !collapsible) return open;
  return open.filter((value) => value !== item);
}

/**
 * The open items after `item` is asked to become `open` or closed.
 *
 * @param type The accordion type.
 * @param current The open item values before the change.
 * @param item The item concerned.
 * @param open Whether it should be open afterward.
 * @param collapsible Whether a `"single"` accordion may have no open item.
 * @returns The new list.
 * @see {@link openItem}
 * @see {@link closeItem}
 * @example
 * import { setItemOpen } from "@shadow-js/primitives";
 *
 * const opened = setItemOpen("multiple", ["a"], "b", true, false); // ["a", "b"]
 * const closed = setItemOpen("multiple", ["a", "b"], "a", false, false); // ["b"]
 * @since 1.0.0
 */
export function setItemOpen(
  type: AccordionType,
  current: readonly string[],
  item: string,
  open: boolean,
  collapsible: boolean,
): readonly string[] {
  return open ? openItem(type, current, item) : closeItem(type, current, item, collapsible);
}

/**
 * Whether two lists of open items hold the same values in the same order.
 *
 * @param a One list.
 * @param b The other list.
 * @returns True when they are equal.
 * @see {@link setItemOpen}
 * @example
 * import { sameItems } from "@shadow-js/primitives";
 *
 * const same = sameItems(["a", "b"], ["a", "b"]); // true
 * const reordered = sameItems(["a", "b"], ["b", "a"]); // false
 * @since 1.0.0
 */
export function sameItems(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index]);
}

/**
 * The public value of a `"single"` accordion as the list the rules work on: `""` and `undefined`
 * mean no open item (`undefined` stays `undefined` so "uncontrolled" is preserved).
 *
 * @param value The `value` / `defaultValue` of a single accordion.
 * @returns The open item values, or `undefined`.
 * @see {@link itemsToSingle}
 * @example
 * import { singleToItems } from "@shadow-js/primitives";
 *
 * const none = singleToItems(""); // []
 * const one = singleToItems("a"); // ["a"]
 * const uncontrolled = singleToItems(undefined); // undefined
 * @since 1.0.0
 */
export function singleToItems(value: string | undefined): readonly string[] | undefined {
  if (value === undefined) return undefined;
  return value === "" ? [] : [value];
}

/**
 * The public value of a `"single"` accordion for a list of open items.
 *
 * @param items The open item values (at most one entry for a single accordion).
 * @returns The open item, or `""` when none is open.
 * @see {@link singleToItems}
 * @example
 * import { itemsToSingle } from "@shadow-js/primitives";
 *
 * const one = itemsToSingle(["a"]); // "a"
 * const none = itemsToSingle([]); // ""
 * @since 1.0.0
 */
export function itemsToSingle(items: readonly string[]): string {
  return items[0] ?? "";
}
