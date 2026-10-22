import { type Accessor, onMount, useSignal } from "@shadow-js/core";
import { isClaiming } from "@shadow-js/web/extend";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  type Collection,
  createCollection,
  createPartContext,
  type Direction,
  type PartContext,
  type PartRegistration,
  partId,
  useBaseId,
  useControllableState,
} from "../utils/index";
import { useDirectionAround } from "../utils/portal-direction";

/**
 * Props of {@link Select}.
 *
 * Accessibility: the trigger is a `button` with `role="combobox"`, `aria-haspopup="listbox"` and
 * `aria-expanded`, and the listbox is a `role="listbox"` whose items are `role="option"` elements with
 * `aria-selected`. `required` sets `aria-required` on the trigger. `disabled` blocks opening and sets
 * `aria-disabled` on a custom trigger (or `disabled` on a native one).
 *
 * Data attributes: the trigger and the listbox carry `data-state` (`open` | `closed`) and `dir`; the
 * trigger and `Select.Value` carry `data-placeholder` (value `""`) while no value is selected; the
 * trigger carries `data-disabled` (value `""`) while disabled.
 * @see {@link Select}
 * @since 1.0.0
 */
export interface SelectProps {
  /**
   * Controlled value. The empty string means "no value" and shows the placeholder.
   * @default none (uncontrolled when omitted)
   */
  readonly value?: string | undefined;
  /**
   * Initial value when uncontrolled.
   * @default `""` (nothing selected)
   */
  readonly defaultValue?: string | undefined;
  /**
   * Called when the user picks another item, or when typeahead on the closed trigger does.
   * @default none
   */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /**
   * Controlled open state.
   * @default none (uncontrolled when omitted)
   */
  readonly open?: boolean | undefined;
  /**
   * Initial open state when uncontrolled.
   * @default `false`
   */
  readonly defaultOpen?: boolean | undefined;
  /**
   * Called when the listbox asks to open or close.
   * @default none
   */
  readonly onOpenChange?: ((open: boolean) => void) | undefined;
  /**
   * Name under which the value is submitted with a native form. Without it no form control is rendered.
   * @default none
   */
  readonly name?: string | undefined;
  /**
   * Id of the `<form>` the select belongs to when it is not a descendant of one.
   * @default none
   */
  readonly form?: string | undefined;
  /**
   * Makes a value required for native form validation and sets `aria-required` on the trigger.
   * @default `false`
   */
  readonly required?: boolean | undefined;
  /**
   * Disables the trigger and the form control.
   * @default `false`
   */
  readonly disabled?: boolean | undefined;
  /**
   * Reading direction. Sets `dir` on the trigger and the listbox and flips the listbox alignment.
   * @default the surrounding direction (the nearest direction provider, else the document's `dir`, else `"ltr"`)
   */
  readonly dir?: Direction | undefined;
  /**
   * Forwarded to the native form control (`autocomplete`).
   * @default none
   */
  readonly autoComplete?: string | undefined;
  /**
   * Base id; the ids of the parts derive from it.
   * @default none (a generated id)
   */
  readonly id?: string | undefined;
  /**
   * The parts of the select: `Select.Trigger`, `Select.Portal` and the rest.
   * @default none
   */
  readonly children?: JsxChild | undefined;
}

/**
 * What the collection knows about one item.
 * @see {@link SelectItem}
 * @since 1.0.0
 */
export interface SelectItemData {
  /** The value the item submits and selects. */
  readonly value: string;
  /** The text the item shows, which typeahead matches against. */
  readonly textValue: string;
  /** Whether the item cannot be selected or focused. */
  readonly disabled: boolean;
}

/** Where the pointer was when a mouse press on the trigger opened the listbox. @internal */
export interface PointerOrigin {
  x: number;
  y: number;
}

/**
 * What every select part reads from its root.
 * @see {@link selectContext}
 * @since 1.0.0
 */
export interface SelectContextValue {
  /** The selected value (empty when nothing is selected). Call it to read the value. */
  readonly value: Accessor<string>;
  /** Whether a value is selected (the value is not empty). Call it to read the value. */
  readonly hasValue: Accessor<boolean>;
  readonly setValue: (value: string) => void;
  readonly open: Accessor<boolean>;
  readonly setOpen: (open: boolean) => void;
  readonly disabled: Accessor<boolean>;
  readonly required: Accessor<boolean>;
  readonly dir: Accessor<Direction>;
  readonly triggerId: Accessor<string>;
  readonly contentId: Accessor<string>;
  readonly trigger: Accessor<HTMLElement | undefined>;
  readonly setTrigger: (element: HTMLElement | undefined) => void;
  /** Set by `SelectItemAlignedContent`: called once the listbox has been placed. @internal */
  afterPlaced?: (() => void) | undefined;
  /** Every item of the select, whether it lives in the open listbox or in the closed-state registry. */
  readonly collection: Collection<SelectItemData>;
  /**
   * The text of the selected item. Tracked. Falls back to the last text seen for that value, so the
   * trigger keeps its text while items are re-mounting (or after the item is gone).
   */
  readonly selectedText: Accessor<string | undefined>;
  /**
   * A fresh id for an item or group, derived from the root's id by a counter. Parts are created in
   * document order on the server and during hydration, so both sides count the same; `useId`
   * would not, because it follows the owner tree, which has client-only nodes.
   */
  readonly generateId: (kind: string) => string;
  /**
   * True once the client has taken over: after mount, and after hydration has finished claiming
   * server nodes. Parts that build client-only DOM (the closed listbox's items, the native
   * control's options) wait for it, because nodes created while claiming look for server elements
   * that were never rendered. Tracked.
   */
  readonly settled: Accessor<boolean>;
  /** Written by the trigger on a mouse press, read (and cleared) by the content that opens. */
  readonly pointerOrigin: { current: PointerOrigin | undefined };
}

/**
 * The context every select part reads its root from. Exposed for building custom parts on top of
 * the select; use the parts themselves otherwise. Reading it outside a `Select` throws.
 *
 * @example
 * import { selectContext } from "@shadow-js/primitives";
 *
 * export function SelectedText() {
 *   const select = selectContext.use("SelectedText");
 *   return <span>{select.selectedText() ?? "Nothing selected"}</span>;
 * }
 * @see {@link Select}
 * @since 1.0.0
 */
export const selectContext: PartContext<SelectContextValue> =
  createPartContext<SelectContextValue>("Select");

/**
 * Builds the state every select part shares (value, open state, ids, item registry). Call it in
 * a custom root and provide the result through {@link selectContext}.
 *
 * @param props See {@link SelectProps}.
 * @returns The shared state.
 * @example
 * import { createSelectContext, PopperProvider, type SelectProps, selectContext } from "@shadow-js/primitives";
 *
 * export function FruitSelect(props: SelectProps) {
 *   const context = createSelectContext(props);
 *   return (
 *     <selectContext.Provider value={context}>
 *       <PopperProvider anchor={context.trigger} setAnchor={() => undefined}>
 *         {props.children}
 *       </PopperProvider>
 *     </selectContext.Provider>
 *   );
 * }
 * @see {@link selectContext}
 * @since 1.0.0
 */
export function createSelectContext(props: SelectProps): SelectContextValue {
  const [value, setValue] = useControllableState<string>({
    value: () => props.value,
    defaultValue: () => props.defaultValue ?? "",
    onChange: () => props.onValueChange,
    name: "Select value",
  });
  const [open, setOpen] = useControllableState<boolean>({
    value: () => props.open,
    defaultValue: () => props.defaultOpen === true,
    onChange: () => props.onOpenChange,
    name: "Select open",
  });
  const base = useBaseId(() => props.id);
  const [trigger, setTrigger] = useSignal<HTMLElement | undefined>(undefined);
  // The trigger carries the resolved dir attribute itself, so the search starts above it.
  const dir = useDirectionAround(
    () => props.dir,
    () => trigger()?.parentElement,
  );
  const collection = createCollection<SelectItemData>();
  // Text is remembered per value so it survives the moment between the listbox unmounting and the
  // closed-state registry mounting (and items that never come back).
  const remembered = new Map<string, string>();
  let counter = 0;
  const [settled, setSettled] = useSignal(false);
  onMount(() => {
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
  return {
    generateId(kind) {
      counter += 1;
      return partId(base(), `${kind}-${counter}`);
    },
    settled,
    value,
    hasValue: () => value() !== "",
    setValue: (next) => setValue(next),
    open,
    setOpen: (next) => setOpen(next),
    disabled: () => props.disabled === true,
    required: () => props.required === true,
    dir,
    triggerId: () => partId(base(), "trigger"),
    contentId: () => partId(base(), "content"),
    trigger,
    setTrigger: (element) => setTrigger(() => element),
    collection,
    selectedText() {
      const current = value();
      if (current === "") return undefined;
      const item = collection.items().find((candidate) => candidate.data.value === current);
      if (item !== undefined) {
        remembered.set(current, item.data.textValue);
        return item.data.textValue;
      }
      return remembered.get(current);
    },
    pointerOrigin: { current: undefined },
  };
}

/** What the open listbox offers to its items and scroll buttons. @internal */
export interface SelectContentContextValue {
  readonly content: Accessor<HTMLElement | undefined>;
  readonly viewport: Accessor<HTMLElement | undefined>;
  readonly setViewport: (element: HTMLElement | undefined) => void;
  /** The pointer left the highlighted item: focus returns to the listbox. */
  readonly onItemLeave: () => void;
  /** Whether a typeahead search is in progress (Space then belongs to the search). */
  readonly isTypingAhead: () => boolean;
  /** Moves focus to an item and reveals it inside the scroll container without scrolling the page. */
  readonly focusItem: (item: HTMLElement) => void;
}

/**
 * The context the open listbox provides to its items and scroll buttons. Internal: only the select's
 * own parts read it.
 * @internal
 * @since 1.0.0
 */
export const selectContentContext: PartContext<SelectContentContextValue> =
  createPartContext<SelectContentContextValue>("Select.Content");

/** What an item offers to its text and indicator. @internal */
export interface SelectItemContextValue {
  readonly textId: Accessor<string>;
  readonly selected: Accessor<boolean>;
  readonly setTextElement: (element: HTMLElement | undefined) => void;
}

/**
 * The context a `Select.Item` provides to its text and indicator. Internal: read by
 * `Select.ItemText` and `Select.ItemIndicator`.
 * @internal
 * @since 1.0.0
 */
export const selectItemContext: PartContext<SelectItemContextValue> =
  createPartContext<SelectItemContextValue>("Select.Item");

/** What a group offers to its label. @internal */
export interface SelectGroupContextValue {
  readonly labelId: Accessor<string>;
  readonly label: PartRegistration;
}

/**
 * The context a `Select.Group` provides to its label. Internal: read by `Select.Label`.
 * @internal
 * @since 1.0.0
 */
export const selectGroupContext: PartContext<SelectGroupContextValue> =
  createPartContext<SelectGroupContextValue>("Select.Group");
