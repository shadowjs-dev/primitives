import {
  type Accessor,
  isServer,
  onMount,
  untrack,
  useEffect,
  useMemo,
  useSignal,
} from "@shadow-js/core";
import { isClaiming } from "@shadow-js/web/extend";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  type Collection,
  type CollectionItem,
  createCollection,
  createPartContext,
  type Direction,
  type PartContext,
  type PartRegistration,
  partId,
  useBaseId,
  useControllableState,
  usePartRegistration,
} from "../utils/index";
import { useDirectionAround } from "../utils/portal-direction";
import { type ComboboxFilter, type ComboboxFilterItem, comboboxDefaultFilter } from "./filter";

/**
 * Why the input text changed, reported as `details.reason` by `onInputValueChange`. Applications
 * that fetch results as the user types should fetch for `"input"` only: the other reasons are the
 * combobox writing text on its own (an item was picked, the field was cleared, ...).
 * @since 1.0.0
 * @see {@link ComboboxInputChangeDetails}
 */
export type ComboboxInputChangeReason = "input" | "select" | "clear" | "reset" | "escape" | "value";

/**
 * Details passed with every `onInputValueChange` call.
 * @since 1.0.0
 * @see {@link ComboboxInputChangeReason}
 */
export interface ComboboxInputChangeDetails {
  /** What changed the input text: `"input"` (typing), `"select"` (an item was chosen), `"clear"`, `"reset"`, `"escape"` or `"value"` (the selected value changed). */
  readonly reason: ComboboxInputChangeReason;
}

/**
 * Props every combobox has, single or multiple. Accessibility and data attributes are those of
 * {@link ComboboxProps}.
 */
interface ComboboxBaseProps {
  /** Controlled text of the input. @default none */
  readonly inputValue?: string | undefined;
  /**
   * Initial text when uncontrolled.
   * @default the `itemToString` label of the initial single selection, else its value; `""` when
   * nothing is selected or the combobox is `multiple`
   */
  readonly defaultInputValue?: string | undefined;
  /** Called when the text changes, with the reason (see {@link ComboboxInputChangeReason}). @default none */
  readonly onInputValueChange?:
    | ((inputValue: string, details: ComboboxInputChangeDetails) => void)
    | undefined;
  /** Controlled open state of the list. @default none */
  readonly open?: boolean | undefined;
  /** Initial open state when uncontrolled. @default `false` */
  readonly defaultOpen?: boolean | undefined;
  /** Called when the list asks to open or close. @default none */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Disables the input, the trigger, the clear button, the chips and the form value.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
  /** Makes the combobox required for native form validation. @default `false` */
  readonly required?: boolean | undefined;
  /** Name under which the value is submitted. Without it no form input is rendered. @default none */
  readonly name?: string | undefined;
  /** Id of the `<form>` the combobox belongs to when it is not a descendant of one. @default none */
  readonly form?: string | undefined;
  /** Reading direction. @default the surrounding direction */
  readonly dir?: Direction | undefined;
  /** Base id; the ids of the parts derive from it. @default generated */
  readonly id?: string | undefined;
  /**
   * Decides which items match the typed text. Not called for a blank query.
   * @default `comboboxDefaultFilter` (case-insensitive "contains" that ignores diacritics)
   */
  readonly filter?: ComboboxFilter | undefined;
  /**
   * Whether the combobox hides the items that do not match. Set `false` when the application owns
   * the list (server-side search): it renders exactly the items it wants shown.
   * @default `true`
   */
  readonly shouldFilter?: boolean | undefined;
  /**
   * Lets the typed text become the value without matching an item: Enter commits it (single:
   * it replaces the value; multiple: it adds a chip). The text is also kept on blur.
   * @default `false`
   */
  readonly allowCustomValue?: boolean | undefined;
  /**
   * Shows the list in place and keeps it open: no popup, no positioning, no portal, no dismissal.
   * For a search field with its results right below it (a command palette). `open` and
   * `onOpenChange` are ignored. Render `Combobox.Content` where the list goes, without a portal.
   * Escape reaches the application through the `onEscapeKeyDown` of `Combobox.Content`.
   * @default `false`
   */
  readonly inline?: boolean | undefined;
  /** Opens the list when the input receives focus. @default `false` */
  readonly openOnFocus?: boolean | undefined;
  /**
   * Highlights the first enabled item whenever the list is open, without arrow keys.
   * @default `false`
   */
  readonly autoHighlight?: boolean | undefined;
  /** Wraps arrow-key navigation from the last item to the first and back. @default `false` */
  readonly loop?: boolean | undefined;
  /**
   * Gives the text of a value, used for the input text and the chip names while the item itself
   * is not known: server rendering, hydration, and items rendered after the fact (async results).
   * While the list is closed its items are still run once without being shown, so a value set
   * before the list was ever opened already has its label.
   * @default the label of the item when it is known, else the value itself
   */
  readonly itemToString?: ((value: string) => string) | undefined;
  /**
   * The polite announcement for the number of results.
   * @default `"No results"`, `"1 result available"` or `"N results available"`
   */
  readonly resultsMessage?: ((count: number) => string) | undefined;
  /** The `Combobox.Input`, `Combobox.Portal` and any other parts. @default none */
  readonly children?: JsxChild | undefined;
}

/**
 * Props of a combobox that selects at most one value. Accessibility and data attributes are those of
 * {@link ComboboxProps}.
 * @since 1.0.0
 * @see {@link ComboboxProps}
 */
export interface ComboboxSingleProps {
  /** Leave unset for a single selection. @default `false` */
  readonly multiple?: false | undefined;
  /** Controlled selection; `null` means nothing is selected. @default none */
  readonly value?: string | null | undefined;
  /** Initial selection when uncontrolled. @default `null` */
  readonly defaultValue?: string | null | undefined;
  /** Called when the selection changes; `null` when it was cleared. @default none */
  readonly onValueChange?: ((value: string | null) => void) | undefined;
}

/**
 * Props of a combobox that selects several values (chips). Accessibility and data attributes are
 * those of {@link ComboboxProps}.
 * @since 1.0.0
 * @see {@link ComboboxProps}
 */
export interface ComboboxMultipleProps {
  /** Allows several selected values. @default none (required) */
  readonly multiple: true;
  /** Controlled selection. @default none */
  readonly value?: readonly string[] | undefined;
  /** Initial selection when uncontrolled. @default `[]` */
  readonly defaultValue?: readonly string[] | undefined;
  /** Called with the new selection. @default none */
  readonly onValueChange?: ((value: string[]) => void) | undefined;
}

/**
 * Props of {@link Combobox}. With `multiple` the value is a `string[]`, otherwise a
 * `string | null`.
 *
 * Accessibility: the input is `role="combobox"` with `aria-autocomplete="list"`, `aria-haspopup`,
 * `aria-expanded`, `aria-controls` (only while open) and `aria-activedescendant` (the highlighted
 * option); the list is `role="listbox"` labeled by `Combobox.Label` or the input. Data attributes:
 * none on the root; `data-state` is set on the input, the trigger and the list.
 * @since 1.0.0
 * @see {@link ComboboxRoot}
 */
export type ComboboxProps = ComboboxBaseProps & (ComboboxSingleProps | ComboboxMultipleProps);

/**
 * The props as the implementation reads them (both selection shapes at once). @internal
 * @since 1.0.0
 * @see {@link ComboboxProps}
 */
export interface ComboboxRootView extends ComboboxBaseProps {
  readonly multiple?: boolean | undefined;
  readonly value?: string | null | readonly string[] | undefined;
  readonly defaultValue?: string | null | readonly string[] | undefined;
  readonly onValueChange?: ((value: never) => void) | undefined;
}

/**
 * What an item tells the root about itself. All accessors, so reactive props stay current. @internal
 * @since 1.0.0
 * @see {@link ComboboxItem}
 */
export interface ComboboxItemEntry {
  readonly value: Accessor<string>;
  readonly label: Accessor<string>;
  readonly disabled: Accessor<boolean>;
  /** Whether the filter lets the item through right now. */
  readonly visible: Accessor<boolean>;
  readonly id: Accessor<string>;
  /**
   * An item of the closed-state registry (the list is closed, so its items only report their value
   * and text): it names selected values but is not an option, is never counted and has no element.
   */
  readonly registry?: boolean | undefined;
}

/**
 * Where a highlight came from: only keyboard highlights scroll the list. @internal
 * @since 1.0.0
 * @see {@link ComboboxContent}
 */
export type HighlightSource = "keyboard" | "pointer";

/**
 * What every combobox part reads from its root. @internal
 * @since 1.0.0
 * @see {@link ComboboxRoot}
 */
export interface ComboboxContextValue {
  readonly multiple: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly required: Accessor<boolean>;
  readonly dir: Accessor<Direction>;
  /** The `dir` prop, only when the application set one. */
  readonly dirProp: Accessor<Direction | undefined>;
  readonly allowCustomValue: Accessor<boolean>;
  readonly openOnFocus: Accessor<boolean>;
  readonly shouldFilter: Accessor<boolean>;
  /** The list is rendered in place and always open (`inline`). */
  readonly inline: Accessor<boolean>;

  readonly inputId: Accessor<string>;
  readonly contentId: Accessor<string>;
  readonly labelId: Accessor<string>;

  readonly open: Accessor<boolean>;
  readonly setOpen: (open: boolean) => void;
  /** Opens the list and, once there are items, highlights the first or the last. */
  readonly openAndHighlight: (target: "first" | "last") => void;

  readonly selected: Accessor<readonly string[]>;
  readonly isSelected: (value: string) => boolean;
  /** An item was activated (click or Enter). */
  readonly activate: (value: string) => void;
  readonly removeValue: (value: string) => void;
  readonly clearAll: () => void;
  /** Restores the defaults (a form reset). */
  readonly reset: () => void;
  /** Commits the typed text as a value (`allowCustomValue`). Returns whether anything was committed. */
  readonly commitCustomValue: () => boolean;
  readonly labelOf: (value: string) => string;

  readonly inputValue: Accessor<string>;
  readonly setInputValue: (text: string, reason: ComboboxInputChangeReason) => void;
  /** The text the filter works with (see the root for the rule). */
  readonly query: Accessor<string>;
  /** Closes the list and, unless custom values are allowed, restores the text of the selection. */
  readonly dismiss: () => void;

  readonly highlighted: Accessor<string | undefined>;
  readonly highlightedId: Accessor<string | undefined>;
  readonly highlight: (value: string | undefined, source: HighlightSource) => void;
  readonly highlightSource: () => HighlightSource;
  readonly move: (target: "next" | "previous" | "first" | "last") => void;

  readonly collection: Collection<ComboboxItemEntry>;
  readonly chips: Collection<{ readonly value: Accessor<string> }>;
  /** Registers an item; returns the function that removes it. Safe on the server (no signals written). */
  readonly registerEntry: (entry: ComboboxItemEntry) => () => void;
  /** Tells trackers that the set of entries changed. Call it from `onMount` / cleanup. */
  readonly touchEntries: () => void;
  readonly matchCount: Accessor<number>;
  /**
   * True once the root has mounted on the client. What depends on the rendered items (the empty
   * state) waits for it, so the server and the first client render agree.
   */
  readonly mounted: Accessor<boolean>;
  /**
   * True once the root has mounted on the client and hydration (if any) has finished. The
   * closed-state registry waits for it: its items must not claim server nodes.
   */
  readonly settled: Accessor<boolean>;
  /**
   * Where an inline list sends Escape (the `onEscapeKeyDown` of the content). Plain holder, read
   * from the input's key handler.
   */
  readonly escapeHandler: { current: ((event: KeyboardEvent) => void) | undefined };
  readonly itemId: (value: string) => string;
  readonly resultsMessage: (count: number) => string;
  /** Whether an item with this value and label passes the filter right now. Tracked. */
  readonly matches: (item: ComboboxFilterItem) => boolean;

  readonly input: Accessor<HTMLElement | undefined>;
  readonly setInput: (element: HTMLElement | undefined) => void;
  readonly trigger: Accessor<HTMLElement | undefined>;
  readonly setTrigger: (element: HTMLElement | undefined) => void;
  readonly clear: Accessor<HTMLElement | undefined>;
  readonly setClear: (element: HTMLElement | undefined) => void;
  readonly content: Accessor<HTMLElement | undefined>;
  readonly setContent: (element: HTMLElement | undefined) => void;
  readonly anchor: Accessor<HTMLElement | undefined>;
  readonly setAnchorElement: (element: HTMLElement | undefined) => void;
  /** Moves focus to the input without triggering `openOnFocus`. */
  readonly focusInput: () => void;
  /** Whether focus may open the list right now (false while the combobox focuses the input itself). */
  readonly focusMayOpen: () => boolean;

  readonly label: PartRegistration;
  readonly loading: PartRegistration;
}

/**
 * The context every combobox part reads from its root. Internal to the primitive: it is not exported
 * from the package entry point. @internal
 * @since 1.0.0
 * @see {@link ComboboxRoot}
 */
export const comboboxContext: PartContext<ComboboxContextValue> =
  createPartContext<ComboboxContextValue>("Combobox");

/** The value prop as a list: `undefined` stays `undefined` (uncontrolled), `null` is empty. */
function toList(
  value: string | null | readonly string[] | undefined,
): readonly string[] | undefined {
  if (value === undefined) return undefined;
  if (value === null) return [];
  if (typeof value === "string") return [value];
  return value;
}

function sameList(a: readonly string[], b: readonly string[]): boolean {
  if (a === b) return true;
  if (a.length !== b.length) return false;
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) return false;
  }
  return true;
}

/** An id-safe form of a value: letters, digits and `-` stay, everything else becomes `_<hex>_`. */
function encodeForId(value: string): string {
  return value.replace(/[^A-Za-z0-9-]/gu, (char) => `_${(char.codePointAt(0) ?? 0).toString(16)}_`);
}

function defaultResultsMessage(count: number): string {
  if (count === 0) return "No results";
  return count === 1 ? "1 result available" : `${count} results available`;
}

/**
 * Builds the state every combobox part shares: selection, input text, open state, highlight and the
 * item registry. @internal
 * @param props The props of the root, read reactively.
 * @returns The shared state, provided by `ComboboxRoot` to its parts.
 * @since 1.0.0
 * @see {@link ComboboxRoot}
 */
export function createComboboxContext(props: ComboboxRootView): ComboboxContextValue {
  const multiple = (): boolean => props.multiple === true;
  const disabled = (): boolean => props.disabled === true;
  const base = useBaseId(() => props.id);
  let triggerElement: (() => HTMLElement | undefined) | undefined;
  const dir = useDirectionAround(
    () => props.dir,
    () => triggerElement?.(),
  );

  // ---- items -------------------------------------------------------------------------------
  // Entries are plain data registered while an item renders (so the server sees them too); the
  // signal only tells trackers that the set changed.
  const entries = new Set<ComboboxItemEntry>();
  const [entriesVersion, setEntriesVersion] = useSignal(0);
  const touchEntries = (): void => {
    setEntriesVersion((count) => count + 1);
  };
  const collection = createCollection<ComboboxItemEntry>();
  const chips = createCollection<{ readonly value: Accessor<string> }>();
  // Labels of selected values whose item is not mounted (the list is closed).
  const remembered = new Map<string, string>();

  const labelOf = (value: string): string => {
    entriesVersion();
    const custom = props.itemToString?.(value);
    if (custom !== undefined) return custom;
    for (const entry of entries) {
      if (entry.value() === value) return entry.label();
    }
    return remembered.get(value) ?? value;
  };

  // ---- selection ---------------------------------------------------------------------------
  const [selected, setSelected] = useControllableState<readonly string[]>({
    value: () => toList(props.value),
    defaultValue: () => toList(props.defaultValue) ?? [],
    onChange: () => (next) => {
      const report = props.onValueChange as ((value: unknown) => void) | undefined;
      report?.(multiple() ? [...next] : (next[0] ?? null));
    },
    equals: sameList,
    name: "Combobox value",
  });
  const isSelected = (value: string): boolean => selected().includes(value);

  // ---- input text --------------------------------------------------------------------------
  const initialSelection = untrack(selected)[0];
  const initialLabel = (): string => {
    if (multiple() || initialSelection === undefined) return "";
    return props.itemToString?.(initialSelection) ?? initialSelection;
  };
  let inputReason: ComboboxInputChangeReason = "input";
  const [inputValue, setInputState] = useControllableState<string>({
    value: () => props.inputValue,
    defaultValue: () => props.defaultInputValue ?? initialLabel(),
    onChange: () => (text) => props.onInputValueChange?.(text, { reason: inputReason }),
    name: "Combobox inputValue",
  });
  const setInputValue = (text: string, reason: ComboboxInputChangeReason): void => {
    inputReason = reason;
    setInputState(text);
  };

  // The text that filters. When the input shows the label of the selection (the user has not typed
  // since picking it) the whole list is shown, otherwise reopening would show a single item.
  const query = useMemo((): string => {
    const text = inputValue();
    if (multiple()) return text;
    const current = selected()[0];
    // The value itself counts too: until the item mounts, the input shows it in place of the label.
    return current !== undefined && (text === current || labelOf(current) === text) ? "" : text;
  });

  // Keep the text of a single selection in step with the selection itself.
  let lastSelection: string | undefined = initialSelection;
  let lastLabel: string | undefined =
    initialSelection === undefined ? undefined : untrack(() => labelOf(initialSelection));
  useEffect(() => {
    if (multiple()) return;
    const current = selected()[0];
    const label = current === undefined ? undefined : labelOf(current);
    const selectionChanged = current !== lastSelection;
    const previous = lastLabel;
    lastSelection = current;
    lastLabel = label;
    if (!selectionChanged && label === previous) return;
    untrack(() => {
      const text = inputValue();
      const next = label ?? "";
      if (text === next) return;
      // A label that arrives late (the item mounted) only replaces text the user did not edit.
      if (selectionChanged || text === (previous ?? "")) setInputValue(next, "value");
    });
  });
  // Remember the labels of the selection so they survive the list closing.
  useEffect(() => {
    entriesVersion();
    const values = selected();
    for (const value of values) {
      for (const entry of entries) {
        if (entry.value() === value) remembered.set(value, entry.label());
      }
    }
    for (const key of [...remembered.keys()]) {
      if (!values.includes(key)) remembered.delete(key);
    }
  });

  // ---- open state --------------------------------------------------------------------------
  const inline = (): boolean => props.inline === true;
  const [openState, setOpenState] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => props.onOpenChange,
    name: "Combobox open",
  });
  // An inline list is part of the page: it does not open or close.
  const open = (): boolean => inline() || openState();
  const [userHighlight, setUserHighlight] = useSignal<string | undefined>(undefined);
  let source: HighlightSource = "keyboard";
  let pending: "first" | "last" | undefined;

  const setOpen = (next: boolean): void => {
    if (untrack(inline)) return;
    if (next && untrack(disabled)) return;
    if (!next) {
      pending = undefined;
      setUserHighlight(undefined);
    }
    setOpenState(next);
  };

  // ---- highlight ---------------------------------------------------------------------------
  // The highlight is derived: the value the user moved to while it still exists, else (with
  // `autoHighlight`) the first enabled item. That is what keeps it stable while the list changes
  // under it (async results): it stays on the same value, and falls back when that value is gone.
  const highlighted = useMemo((): string | undefined => {
    if (!open()) return undefined;
    const items = collection.items();
    const user = userHighlight();
    if (user !== undefined) {
      const hit = items.find((item) => item.data.value() === user && !item.data.disabled());
      if (hit !== undefined) return user;
    }
    if (props.autoHighlight === true) {
      return items.find((item) => !item.data.disabled())?.data.value();
    }
    return undefined;
  });
  const highlightedId = (): string | undefined => {
    const value = highlighted();
    if (value === undefined) return undefined;
    return collection
      .items()
      .find((item) => item.data.value() === value)
      ?.data.id();
  };
  const highlight = (value: string | undefined, from: HighlightSource): void => {
    source = from;
    setUserHighlight(value);
  };
  const enabledItems = (): CollectionItem<ComboboxItemEntry>[] =>
    collection.getItems().filter((item) => !item.data.disabled());
  const move = (target: "next" | "previous" | "first" | "last"): void => {
    const items = enabledItems();
    if (items.length === 0) return;
    const current = untrack(highlighted);
    const index = items.findIndex((item) => item.data.value() === current);
    const last = items.length - 1;
    const wrap = props.loop === true;
    let next: number;
    if (target === "first") next = 0;
    else if (target === "last") next = last;
    else if (target === "next")
      next = index === -1 ? 0 : index >= last ? (wrap ? 0 : last) : index + 1;
    else next = index === -1 ? last : index <= 0 ? (wrap ? last : 0) : index - 1;
    highlight(items[next]?.data.value(), "keyboard");
  };
  const openAndHighlight = (target: "first" | "last"): void => {
    if (untrack(open)) {
      move(target);
      return;
    }
    pending = target;
    setOpen(true);
  };
  // The items of a list that has just opened are not mounted yet when the key is pressed.
  useEffect(() => {
    if (!open()) {
      pending = undefined;
      return;
    }
    const items = collection.items();
    if (pending === undefined) return;
    const enabled = items.filter((item) => !item.data.disabled());
    const target = pending === "first" ? enabled[0] : enabled[enabled.length - 1];
    if (target === undefined) return;
    pending = undefined;
    highlight(target.data.value(), "keyboard");
  });

  // ---- committing --------------------------------------------------------------------------
  const activate = (value: string): void => {
    untrack(() => {
      if (multiple()) {
        const current = selected();
        setSelected(
          current.includes(value) ? current.filter((v) => v !== value) : [...current, value],
        );
        if (inputValue() !== "") setInputValue("", "select");
        return;
      }
      setSelected([value]);
      // A controlled application may have refused the change: show what is selected now.
      const current = selected()[0];
      const text = current === undefined ? "" : labelOf(current);
      if (inputValue() !== text) setInputValue(text, "select");
      setOpen(false);
    });
  };
  const removeValue = (value: string): void => {
    untrack(() => setSelected(selected().filter((v) => v !== value)));
  };
  const clearAll = (): void => {
    untrack(() => {
      if (selected().length > 0) setSelected([]);
      if (inputValue() !== "") setInputValue("", "clear");
      setUserHighlight(undefined);
    });
  };
  const commitCustomValue = (): boolean =>
    untrack(() => {
      const text = inputValue().trim();
      if (text === "") return false;
      if (multiple()) {
        if (!selected().includes(text)) setSelected([...selected(), text]);
        setInputValue("", "select");
        return true;
      }
      setSelected([text]);
      const current = selected()[0];
      const shown = current === undefined ? "" : labelOf(current);
      if (inputValue() !== shown) setInputValue(shown, "select");
      setOpen(false);
      return true;
    });
  const dismiss = (): void => {
    untrack(() => {
      setOpen(false);
      if (props.allowCustomValue === true) return;
      const current = selected()[0];
      const text = multiple() || current === undefined ? "" : labelOf(current);
      if (inputValue() !== text) setInputValue(text, "reset");
    });
  };

  // ---- elements ----------------------------------------------------------------------------
  const element = (): readonly [
    Accessor<HTMLElement | undefined>,
    (e: HTMLElement | undefined) => void,
  ] => {
    const [get, set] = useSignal<HTMLElement | undefined>(undefined);
    return [get, (next) => set(() => next)];
  };
  const [input, setInput] = element();
  const [trigger, setTrigger] = element();
  triggerElement = trigger;
  const [clear, setClear] = element();
  const [content, setContent] = element();
  const [anchor, setAnchorElement] = element();
  let focusing = false;
  const focusInput = (): void => {
    const target = untrack(input);
    if (target === undefined) return;
    focusing = true;
    try {
      target.focus();
    } finally {
      focusing = false;
    }
  };

  const countMatches = (): number => {
    entriesVersion();
    let count = 0;
    for (const entry of entries) {
      if (entry.registry !== true && entry.visible()) count += 1;
    }
    return count;
  };
  // On the server nothing ever writes a signal, so a memo would keep the count it computed before
  // the items rendered; counting afresh is cheap and always current there.
  const [mounted, setMounted] = useSignal(false);
  const [settled, setSettled] = useSignal(false);
  onMount(() => {
    setMounted(true);
    if (!isClaiming()) {
      setSettled(true);
      return;
    }
    // Hydration flushes effects while it is still claiming: continue once it has returned.
    let disposed = false;
    queueMicrotask(() => {
      if (!disposed) setSettled(true);
    });
    return () => {
      disposed = true;
    };
  });
  const matchCount = isServer ? countMatches : useMemo(countMatches);

  // A form reset puts the field back to its defaults, like a native one.
  const reset = (): void => {
    untrack(() => {
      const initial = toList(props.defaultValue) ?? [];
      setSelected(initial);
      const first = initial[0];
      const text =
        props.defaultInputValue ?? (multiple() || first === undefined ? "" : labelOf(first));
      if (inputValue() !== text) setInputValue(text, "reset");
    });
  };

  return {
    multiple,
    disabled,
    required: () => props.required === true,
    dir,
    dirProp: () => props.dir,
    allowCustomValue: () => props.allowCustomValue === true,
    openOnFocus: () => props.openOnFocus === true,
    shouldFilter: () => props.shouldFilter !== false,
    inline,
    inputId: () => partId(base(), "input"),
    contentId: () => partId(base(), "content"),
    labelId: () => partId(base(), "label"),
    open,
    setOpen,
    openAndHighlight,
    selected,
    isSelected,
    activate,
    removeValue,
    clearAll,
    reset,
    commitCustomValue,
    labelOf,
    inputValue,
    setInputValue,
    query,
    dismiss,
    highlighted,
    highlightedId,
    highlight,
    highlightSource: () => source,
    move,
    collection,
    chips,
    registerEntry(entry) {
      entries.add(entry);
      return () => {
        entries.delete(entry);
      };
    },
    touchEntries,
    matchCount,
    mounted,
    settled,
    escapeHandler: { current: undefined },
    itemId: (value) => partId(base(), `item-${encodeForId(value)}`),
    matches(item) {
      if (props.shouldFilter === false) return true;
      const text = query();
      if (text.trim() === "") return true;
      return (props.filter ?? comboboxDefaultFilter)(item, text);
    },
    resultsMessage: (count) => (props.resultsMessage ?? defaultResultsMessage)(count),
    input,
    setInput,
    trigger,
    setTrigger,
    clear,
    setClear,
    content,
    setContent,
    anchor,
    setAnchorElement,
    focusInput,
    focusMayOpen: () => !focusing,
    label: usePartRegistration(),
    loading: usePartRegistration(),
  };
}

/**
 * Provided around the children of a closed `Combobox.Content`, which the content renders without
 * putting anything in the page: its items then only register their value and text (so a selected
 * value can show its label before the list was ever opened) and every other part renders nothing.
 * @internal
 * @since 1.0.0
 * @see {@link ComboboxContent}
 */
export const comboboxRegistryContext: PartContext<true> =
  createPartContext<true>("Combobox.Registry");
