/**
 * Typeahead for lists, menus and listboxes, following the WAI-ARIA Authoring Practices and Radix:
 * typing characters moves to the next item whose text starts with them, repeating one character
 * cycles through the items that start with it, and the typed text is forgotten after a pause.
 * @packageDocumentation
 */

/**
 * An item a {@link Typeahead} can land on.
 * @since 1.0.0
 * @see {@link createTypeahead}
 */
export interface TypeaheadItem {
  /** The text matched against what was typed. */
  readonly value: string;
  /** Disabled items are skipped. */
  readonly disabled?: boolean;
}

/**
 * A stateful typeahead matcher, as returned by {@link createTypeahead}. It sets no ARIA attributes
 * and handles no keys itself: the caller passes each key press in and moves focus to the index it
 * returns.
 * @since 1.0.0
 * @see {@link createTypeahead}
 */
export interface Typeahead {
  /**
   * Feeds one key press. Returns the index of the item to move to, or `undefined` when the key is
   * not part of a search or nothing matches.
   */
  handleKey(key: string, items: readonly TypeaheadItem[], currentIndex: number): number | undefined;
  /** Forgets the text typed so far. */
  reset(): void;
  /** The text typed so far, or an empty string once the pause has elapsed. */
  search(): string;
}

/**
 * Options for {@link createTypeahead}. The matcher sets no ARIA attributes and handles no keys; it
 * only reads the keys the caller passes in.
 * @since 1.0.0
 * @see {@link createTypeahead}
 */
export interface TypeaheadOptions {
  /**
   * Milliseconds of inactivity after which the search starts over.
   * @default `1000`
   */
  readonly timeout?: number;
  /**
   * A clock in milliseconds. Injected by tests; no timers are used.
   * @default `performance.now`
   */
  readonly now?: () => number;
}

/** `"aaa"` is the same request as `"a"`: cycle through the items starting with `a`. */
function normalize(search: string): string {
  const characters = Array.from(search);
  const first = characters[0];
  if (first !== undefined && characters.length > 1 && characters.every((c) => c === first)) {
    return first;
  }
  return search;
}

/**
 * The first index, scanning from `currentIndex` forward and wrapping, whose value starts with the
 * search. A single-character search starts after the current item and never lands on it.
 */
function findIndex(
  values: readonly string[],
  isEnabled: (index: number) => boolean,
  search: string,
  currentIndex: number,
): number | undefined {
  const count = values.length;
  if (count === 0 || search === "") return undefined;
  const needle = normalize(search).toLocaleLowerCase();
  const single = Array.from(needle).length === 1;
  const start = currentIndex >= 0 && currentIndex < count ? currentIndex : 0;
  // With no current item there is nothing to exclude, so a lone character may land on item 0.
  const hasCurrent = currentIndex >= 0 && currentIndex < count;
  for (let offset = 0; offset < count; offset += 1) {
    const index = (start + offset) % count;
    if (single && hasCurrent && index === currentIndex) continue;
    if (!isEnabled(index)) continue;
    const value = values[index];
    if (value?.toLocaleLowerCase().startsWith(needle)) return index;
  }
  return undefined;
}

/**
 * Radix's `getNextMatch`: the value to move to for the text typed so far. Repeating one character
 * cycles through the values starting with it (never the current one); otherwise it is the first
 * value, from the current one forward and wrapping, that starts with the text. Case-insensitive.
 *
 * @param values The candidate values, in display order.
 * @param search The text typed so far.
 * @param current The currently active value, if any.
 * @returns The matching value, or `undefined` when none matches or the match is the current value.
 * @example
 * import { getNextMatch } from "@shadow-js/primitives";
 *
 * const names = ["Apple", "Avocado", "Banana"];
 * getNextMatch(names, "a", "Apple"); // "Avocado"
 * getNextMatch(names, "ban"); // "Banana"
 * @since 1.0.0
 * @see {@link createTypeahead}
 */
export function getNextMatch(
  values: readonly string[],
  search: string,
  current?: string,
): string | undefined {
  const currentIndex = current === undefined ? -1 : values.indexOf(current);
  const index = findIndex(values, () => true, search, currentIndex);
  const match = index === undefined ? undefined : values[index];
  // A repeated value is "no movement", as in Radix.
  return match !== current ? match : undefined;
}

/**
 * Creates a typeahead that accumulates single characters until `timeout` milliseconds pass
 * without a key. Only single characters count; multi-character keys (`Enter`, `ArrowDown`, ...)
 * are ignored, and a space is ignored while nothing has been typed so it can still activate the
 * focused item. Backspace is not handled.
 *
 * @param options Timeout and clock.
 * @returns The matcher.
 * @example
 * import { createTypeahead, type TypeaheadItem } from "@shadow-js/primitives";
 *
 * const items: readonly TypeaheadItem[] = [
 *   { value: "Apple" },
 *   { value: "Banana", disabled: true },
 *   { value: "Cherry" },
 * ];
 * const typeahead = createTypeahead({ timeout: 800 });
 * const next = typeahead.handleKey("c", items, 0); // 2
 * if (next !== undefined) console.log(items[next]?.value);
 * @since 1.0.0
 * @see {@link Typeahead}
 * @see {@link getNextMatch}
 */
export function createTypeahead(options: TypeaheadOptions = {}): Typeahead {
  const timeout = options.timeout ?? 1000;
  const now = options.now ?? ((): number => performance.now());
  let text = "";
  let last = 0;

  const expired = (time: number): boolean => text !== "" && time - last > timeout;

  return {
    handleKey(key, items, currentIndex) {
      if (Array.from(key).length !== 1) return undefined;
      const time = now();
      if (expired(time)) text = "";
      // A leading space is the "activate" key, not the start of a search.
      if (key === " " && text === "") return undefined;
      text += key;
      last = time;
      return findIndex(
        items.map((item) => item.value),
        (index) => items[index]?.disabled !== true,
        text,
        currentIndex,
      );
    },
    reset() {
      text = "";
    },
    search() {
      return expired(now()) ? "" : text;
    },
  };
}
