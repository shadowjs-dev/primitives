/**
 * The rules of a questionnaire as pure functions: which items count, how a status is decided, what is valid, where navigation goes and which
 * key picks which answer. No DOM is touched here, so each rule can be tested on its own.
 * @packageDocumentation
 */

/** Whether an item is waiting for an answer, has one, or was skipped on purpose. @since 1.0.0 */
export type QuestionnaireItemStatus = "unanswered" | "answered" | "skipped";

/** What an item is, for the rules below. @since 1.0.0 */
export interface ItemFacts {
  readonly name: string;
  readonly disabled: boolean;
  readonly required: boolean;
}

/** The keys that pick answers: `"letters"` gives A to Z, `"numbers"` gives 1 to 9. @since 1.0.0 */
export type QuestionnaireShortcuts = "letters" | "numbers";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const NUMBERS = "123456789";

/**
 * The shortcut key of each choice of an item, in order. A disabled choice gets none and does not use up a key. A choice past the last key gets none.
 *
 * @param kind - `"letters"` or `"numbers"`.
 * @param disabled - For each choice, whether it is disabled.
 * @returns For each choice, its key or `undefined`.
 * @example
 * import { shortcutKeys } from "@shadow-js/primitives";
 *
 * shortcutKeys("letters", [false, true, false]); // ["A", undefined, "B"]
 * @since 1.0.0
 */
export function shortcutKeys(
  kind: QuestionnaireShortcuts,
  disabled: readonly boolean[],
): (string | undefined)[] {
  const keys = kind === "letters" ? LETTERS : NUMBERS;
  let next = 0;
  return disabled.map((isDisabled) => {
    if (isDisabled) return undefined;
    const key = keys[next];
    if (key === undefined) return undefined;
    next += 1;
    return key;
  });
}

/**
 * Which choice a typed key picks: the index in the same list the keys were given out for. Case does not matter.
 *
 * @param keys - What {@link shortcutKeys} returned.
 * @param typed - The key the reader pressed.
 * @returns The index, or `-1` when no choice has that key.
 * @example
 * import { choiceForKey } from "@shadow-js/primitives";
 *
 * choiceForKey(["A", undefined, "B"], "b"); // 2
 * @since 1.0.0
 */
export function choiceForKey(keys: readonly (string | undefined)[], typed: string): number {
  const wanted = typed.toUpperCase();
  return keys.indexOf(wanted);
}

/**
 * The status of an item from what it holds. A skipped item stays skipped until it is answered; an answer makes it answered; nothing makes it unanswered.
 *
 * @param answered - Whether any answer is given (a checked choice, or text that is not blank).
 * @param skipped - Whether the reader skipped it.
 * @returns The status.
 * @example
 * import { statusOf } from "@shadow-js/primitives";
 *
 * statusOf(false, true); // "skipped"
 * @since 1.0.0
 */
export function statusOf(answered: boolean, skipped: boolean): QuestionnaireItemStatus {
  if (answered) return "answered";
  return skipped ? "skipped" : "unanswered";
}

/**
 * Whether an item may be left behind: a required item needs an answer, an optional one an answer or a skip. A disabled item never blocks.
 *
 * @param facts - The item.
 * @param status - Its status.
 * @returns `true` when the item is valid.
 * @example
 * import { isValid } from "@shadow-js/primitives";
 *
 * isValid({ name: "a", disabled: false, required: false }, "skipped"); // true
 * @since 1.0.0
 */
export function isValid(facts: ItemFacts, status: QuestionnaireItemStatus): boolean {
  if (facts.disabled) return true;
  return facts.required ? status === "answered" : status !== "unanswered";
}

/**
 * The enabled items, in order: the ones that count for progress, navigation, validation and submission.
 *
 * @param items - Every item, in order.
 * @returns The items that are not disabled.
 * @example
 * import { enabledItems } from "@shadow-js/primitives";
 *
 * enabledItems([{ name: "a", disabled: true, required: false }]); // []
 * @since 1.0.0
 */
export function enabledItems<T extends ItemFacts>(items: readonly T[]): T[] {
  return items.filter((item) => !item.disabled);
}

/**
 * The item to move to from the current one, skipping disabled items. Moving past either end stays where it is.
 *
 * @param items - Every item, in order.
 * @param current - The current item's name.
 * @param delta - `1` for the next item, `-1` for the previous.
 * @returns The name of the item to show.
 * @example
 * import { neighbor } from "@shadow-js/primitives";
 *
 * const items = [
 *   { name: "a", disabled: false, required: false },
 *   { name: "b", disabled: true, required: false },
 *   { name: "c", disabled: false, required: false },
 * ];
 * neighbor(items, "a", 1); // "c"
 * @since 1.0.0
 */
export function neighbor(items: readonly ItemFacts[], current: string, delta: 1 | -1): string {
  const enabled = enabledItems(items);
  const index = enabled.findIndex((item) => item.name === current);
  if (index === -1) return enabled[0]?.name ?? current;
  return enabled[Math.min(Math.max(index + delta, 0), enabled.length - 1)]?.name ?? current;
}

/**
 * The first enabled item that is not valid, or `undefined` when all are. Submitting uses it to find the item to show.
 *
 * @param items - Every item, in order.
 * @param statuses - The status of each item by name.
 * @returns The name of the first invalid enabled item.
 * @example
 * import { firstInvalid } from "@shadow-js/primitives";
 *
 * firstInvalid([{ name: "a", disabled: false, required: true }], new Map([["a", "unanswered"]])); // "a"
 * @since 1.0.0
 */
export function firstInvalid(
  items: readonly ItemFacts[],
  statuses: ReadonlyMap<string, QuestionnaireItemStatus>,
): string | undefined {
  return enabledItems(items).find((item) => !isValid(item, statuses.get(item.name) ?? "unanswered"))
    ?.name;
}

/** Where the reader is among the enabled items. @since 1.0.0 */
export interface Position {
  /** The 1-based number of the current item among the enabled ones (0 when there are none). */
  readonly current: number;
  /** How many enabled items there are. */
  readonly total: number;
  readonly first: boolean;
  readonly last: boolean;
}

/**
 * The position of an item among the enabled ones, for the progress and for which actions show.
 *
 * @param items - Every item, in order.
 * @param current - The current item's name.
 * @returns The 1-based position, the total and whether it is the first or the last.
 * @example
 * import { positionOf } from "@shadow-js/primitives";
 *
 * positionOf([{ name: "a", disabled: false, required: false }], "a"); // { current: 1, total: 1, first: true, last: true }
 * @since 1.0.0
 */
export function positionOf(items: readonly ItemFacts[], current: string): Position {
  const enabled = enabledItems(items);
  const index = enabled.findIndex((item) => item.name === current);
  return {
    current: index + 1,
    total: enabled.length,
    first: index <= 0,
    last: index === enabled.length - 1,
  };
}
