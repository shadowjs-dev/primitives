/**
 * Roving tabindex: a group of items of which exactly one is in the tab order, moved with the arrow
 * keys, Home and End (WAI-ARIA authoring practices for tabs, radio groups, toolbars, toggle
 * groups, menus). The decision of where an arrow key goes is a pure function, `getRovingTarget`;
 * `useRovingFocus` wires it to a registry of DOM items.
 * @packageDocumentation
 */
import { type Accessor, onCleanup, untrack, useEffect, useSignal } from "@shadow-js/core";
import { type Collection, createCollection } from "./collection";
import type { Direction } from "./direction";

/**
 * The axis a group moves along. A group without orientation answers all four arrows.
 * @since 1.0.0
 * @see {@link RovingFocusOptions}
 */
export type Orientation = "horizontal" | "vertical";

/**
 * Input of {@link getRovingTarget}.
 * @since 1.0.0
 * @see {@link getRovingTarget}
 */
export interface RovingTargetInput {
  /** `KeyboardEvent.key`. */
  readonly key: string;
  /** Axis of the group; `undefined` answers both. */
  readonly orientation?: Orientation | undefined;
  /** Reading direction: Left and Right swap in `rtl`. */
  readonly dir: Direction;
  /** Wrap from the last item to the first and back. */
  readonly loop: boolean;
  /** One flag per item, in order: `true` for items that cannot take focus. */
  readonly disabled: readonly boolean[];
  /** Index of the focused item, or -1. */
  readonly current: number;
}

/**
 * Where an arrow, Home, End, PageUp or PageDown key moves focus in a roving group. Home and PageUp
 * pick the first enabled item, End and PageDown the last one, whatever the orientation. Other keys
 * return `undefined`, as do arrows that run past an end when `loop` is false and groups without an
 * enabled item. Disabled items are skipped.
 *
 * @param input See {@link RovingTargetInput}.
 * @returns The index of the item to focus, or `undefined` when the key does nothing here.
 * @example
 * import { getRovingTarget } from "@shadow-js/primitives";
 *
 * getRovingTarget({ key: "ArrowRight", dir: "ltr", loop: true, disabled: [false, true, false], current: 0 }); // 2
 * @since 1.0.0
 * @see {@link useRovingFocus}
 */
export function getRovingTarget(input: RovingTargetInput): number | undefined {
  const { key, orientation, dir, loop, disabled, current } = input;
  const enabled = (index: number): boolean => disabled[index] === false;
  const count = disabled.length;
  // The first enabled index, scanning from the start or (when `reverse`) from the end.
  const edge = (reverse: boolean): number | undefined => {
    for (let at = 0; at < count; at += 1) {
      const index = reverse ? count - 1 - at : at;
      if (enabled(index)) return index;
    }
    return undefined;
  };
  if (key === "Home" || key === "PageUp") return edge(false);
  if (key === "End" || key === "PageDown") return edge(true);

  const horizontal = orientation !== "vertical";
  const vertical = orientation !== "horizontal";
  let step: 1 | -1 | 0 = 0;
  if (horizontal && key === "ArrowRight") step = dir === "rtl" ? -1 : 1;
  else if (horizontal && key === "ArrowLeft") step = dir === "rtl" ? 1 : -1;
  else if (vertical && key === "ArrowDown") step = 1;
  else if (vertical && key === "ArrowUp") step = -1;
  if (step === 0) return undefined;

  if (current < 0 || current >= count) return edge(step !== 1);
  for (let taken = 1; taken < count; taken += 1) {
    const raw = current + step * taken;
    if (!loop && (raw < 0 || raw >= count)) return undefined;
    const index = ((raw % count) + count) % count;
    if (enabled(index)) return index;
  }
  return undefined;
}

/**
 * Options of {@link useRovingFocus}. Functions are read reactively. The group sets no ARIA
 * attributes of its own; each item gets `tabindex` (`0` on the tab stop, `-1` elsewhere) and
 * `data-orientation` (when `orientation` is set). See {@link useRovingFocus} for the keys.
 * @since 1.0.0
 * @see {@link useRovingFocus}
 */
export interface RovingFocusOptions {
  /**
   * The axis of the group. Without it the arrow keys answer all four arrows.
   * @default none
   */
  readonly orientation?: () => Orientation | undefined;
  /**
   * Reading direction. In `rtl` Left and Right swap.
   * @default "ltr"
   */
  readonly dir?: () => Direction;
  /**
   * Wrap from the last item to the first and back.
   * @default `true`
   */
  readonly loop?: () => boolean;
  /**
   * The item that is the tab stop, when the group decides it (the selected tab, the checked
   * radio). Ignored while it names no enabled item. Without it the last focused item is the tab
   * stop, then the first `active` one, then the first enabled one.
   * @default none
   */
  readonly currentTabStopId?: () => string | undefined;
  /**
   * Whether the item that had focus last stays the tab stop after focus has left the group. Menus,
   * tabs and toolbars remember it (WAI-ARIA); a radio group does not: it is entered on its checked
   * radio, else its first enabled one.
   * @default true
   */
  readonly rememberFocus?: () => boolean;
}

/**
 * What an item tells the group. The id finds the item again; `disabled` and `active` are read on
 * every decision. The group sets `tabindex` and `data-orientation` on the item's element.
 * @since 1.0.0
 * @see {@link useRovingFocus}
 */
export interface RovingItemOptions {
  /**
   * The item's id, unique within the group.
   * @default none (required)
   */
  readonly id: () => string;
  /**
   * Disabled items are skipped by the arrow keys and are never the tab stop. A click on a disabled
   * item does not move focus (its `mousedown` default is prevented).
   * @default `false`
   */
  readonly disabled?: () => boolean;
  /**
   * The item that should be the tab stop when nothing has been focused yet (selected, checked,
   * pressed).
   * @default `false`
   */
  readonly active?: () => boolean;
}

/** The registered data of one item. @internal */
interface ItemData {
  readonly id: () => string;
  readonly disabled: () => boolean;
  readonly active: () => boolean;
}

/**
 * A roving focus group, as returned by {@link useRovingFocus}.
 * @since 1.0.0
 * @see {@link useRovingFocus}
 */
export interface RovingFocus {
  /** The id of the item that is currently in the tab order. Tracked. */
  readonly tabStopId: Accessor<string | undefined>;
  /** Moves focus to the item with this id. */
  focusItem(id: string): void;
  /** Focuses the first or last enabled item. */
  focusEdge(edge: "first" | "last"): void;
  /**
   * Props for one item's element: `ref`, `tabindex`, `onFocusIn`, `onMouseDown`, `onKeyDown` and
   * `data-orientation`. Merge them into the element with `mergeElementProps`.
   */
  item(options: RovingItemOptions): Record<string, unknown>;
}

/**
 * Creates a roving focus group: exactly one item is in the tab order, and the arrow keys move focus
 * between the items. Left and Right move along a horizontal group (Up and Down along a vertical
 * one; Left and Right swap in `rtl`), Home and PageUp go to the first enabled item, End and PageDown
 * to the last. Keys with Shift, Ctrl, Alt or Meta are left alone, and so are keys whose target is a
 * nested element. A focused item becomes the tab stop. It sets `tabindex` and `data-orientation`
 * on items; it sets no role or other ARIA attribute, so the parts supply those.
 *
 * @param options See {@link RovingFocusOptions}. Omit it for a looping, left-to-right group.
 * @returns The group; call `group.item(...)` once per item part.
 * @example
 * import { useRovingFocus } from "@shadow-js/primitives";
 * import { useSignal } from "@shadow-js/core";
 *
 * export function useTabStops(): Record<string, unknown> {
 *   const [selected] = useSignal<string | undefined>("overview");
 *   const group = useRovingFocus({ orientation: () => "horizontal", currentTabStopId: selected });
 *   // Merge the returned props into the tab's element with mergeElementProps.
 *   return group.item({ id: () => "overview", active: () => selected() === "overview" });
 * }
 * @since 1.0.0
 * @see {@link RovingFocus}
 * @see {@link getRovingTarget}
 */
export function useRovingFocus(options: RovingFocusOptions = {}): RovingFocus {
  const collection: Collection<ItemData> = createCollection<ItemData>();
  const [focusedId, setFocusedId] = useSignal<string | undefined>(undefined);
  const dir = (): Direction => options.dir?.() ?? "ltr";

  const tabStopId = (): string | undefined => {
    const enabled = collection.items().filter((entry) => !entry.data.disabled());
    const controlled = options.currentTabStopId?.();
    if (controlled !== undefined && enabled.some((entry) => entry.data.id() === controlled)) {
      return controlled;
    }
    const focused = options.rememberFocus?.() === false ? undefined : focusedId();
    if (focused !== undefined && enabled.some((entry) => entry.data.id() === focused))
      return focused;
    const active = enabled.find((entry) => entry.data.active());
    return (active ?? enabled[0])?.data.id();
  };

  const focusElement = (element: HTMLElement): void => {
    element.focus({ preventScroll: false });
  };

  return {
    tabStopId,
    focusItem(id: string): void {
      const found = collection.getItems().find((entry) => entry.data.id() === id);
      if (found !== undefined) focusElement(found.element);
    },
    focusEdge(edge: "first" | "last"): void {
      const enabled = collection.getItems().filter((entry) => !entry.data.disabled());
      const target = edge === "first" ? enabled[0] : enabled.at(-1);
      if (target !== undefined) focusElement(target.element);
    },
    item(item: RovingItemOptions): Record<string, unknown> {
      const data: ItemData = {
        id: item.id,
        disabled: item.disabled ?? ((): boolean => false),
        active: item.active ?? ((): boolean => false),
      };
      const [element, setElement] = useSignal<HTMLElement | undefined>(undefined);
      useEffect(() => {
        const node = element();
        if (node === undefined) return;
        const unregister = collection.register(node, data);
        onCleanup(unregister);
      });
      const isTabStop = (): boolean => tabStopId() === item.id() && !data.disabled();
      return {
        ref: (node: HTMLElement): void => {
          setElement(node);
        },
        get tabindex(): number {
          return isTabStop() ? 0 : -1;
        },
        get "data-orientation"(): Orientation | undefined {
          return options.orientation?.();
        },
        onMouseDown: (event: MouseEvent): void => {
          // A disabled item must not take focus from the item that has it.
          if (data.disabled()) event.preventDefault();
        },
        // Delegated (`focusin`), so no native listener is bound per item.
        onFocusIn: (): void => {
          if (!untrack(data.disabled)) setFocusedId(untrack(item.id));
        },
        onKeyDown: (event: KeyboardEvent): void => {
          if (event.target !== event.currentTarget) return;
          if (event.shiftKey || event.ctrlKey || event.altKey || event.metaKey) return;
          const items = collection.getItems();
          const current = items.findIndex((entry) => entry.element === event.currentTarget);
          const target = getRovingTarget({
            key: event.key,
            orientation: options.orientation?.(),
            dir: dir(),
            loop: options.loop?.() ?? true,
            disabled: items.map((entry) => entry.data.disabled()),
            current,
          });
          if (target === undefined) return;
          event.preventDefault();
          const destination = items[target];
          if (destination !== undefined) focusElement(destination.element);
        },
      };
    },
  };
}
