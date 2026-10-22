/**
 * The pure decisions behind the select listbox: where a key moves the highlight, which item
 * receives focus when the list opens, and how far a scroll container must move to reveal an
 * item. They take plain values and return plain values, so they can be tested without a DOM.
 * @packageDocumentation
 */
import { getRovingTarget } from "../utils/roving-focus";

/**
 * How many enabled items PageUp and PageDown move when no `pageSize` is given. The open listbox
 * uses this value.
 * @example
 * import { getSelectTarget, SELECT_PAGE_SIZE } from "@shadow-js/primitives";
 *
 * const disabled = new Array<boolean>(20).fill(false);
 * getSelectTarget({ key: "PageDown", disabled, current: 0 }) === SELECT_PAGE_SIZE; // true
 * @see {@link getSelectTarget}
 * @since 1.0.0
 */
export const SELECT_PAGE_SIZE = 10;

/**
 * Input of {@link getSelectTarget}. Pure data: it describes no DOM, ARIA or data attributes.
 * @see {@link getSelectTarget}
 * @since 1.0.0
 */
export interface SelectTargetInput {
  /**
   * `KeyboardEvent.key`.
   * @default none (required)
   */
  readonly key: string;
  /**
   * One flag per item in document order: `true` for items that cannot take focus.
   * @default none (required)
   */
  readonly disabled: readonly boolean[];
  /**
   * Index of the focused item, or -1 when the listbox itself (or nothing) has focus.
   * @default none (required)
   */
  readonly current: number;
  /**
   * Wrap from the last item to the first and back.
   * @default `false`
   */
  readonly loop?: boolean | undefined;
  /**
   * How many enabled items PageUp and PageDown move.
   * @default {@link SELECT_PAGE_SIZE} (10)
   */
  readonly pageSize?: number | undefined;
}

/** The first enabled index at or after `from` going in `step` direction, or `undefined`. */
function firstEnabled(
  disabled: readonly boolean[],
  from: number,
  step: 1 | -1,
): number | undefined {
  for (let index = from; index >= 0 && index < disabled.length; index += step) {
    if (disabled[index] === false) return index;
  }
  return undefined;
}

/**
 * Where a navigation key moves the highlight in the open listbox. ArrowDown / ArrowUp move to the
 * next / previous enabled item (no wrapping unless `loop`), Home / End go to the first / last
 * enabled item, and PageDown / PageUp move `pageSize` enabled items, stopping at the end of the
 * list; when there is no enabled item that way they do nothing. From "nothing highlighted" (`current` -1) ArrowDown / PageDown start at the first item and
 * ArrowUp starts at the last. Disabled items are never returned.
 *
 * @param input See {@link SelectTargetInput}.
 * @returns The index to focus, or `undefined` when the key does nothing here.
 * @example
 * import { getSelectTarget } from "@shadow-js/primitives";
 *
 * getSelectTarget({ key: "ArrowDown", disabled: [false, true, false], current: 0 }); // 2
 * getSelectTarget({ key: "ArrowDown", disabled: [false, false], current: 1 }); // undefined
 * @see {@link SelectTargetInput}
 * @since 1.0.0
 */
export function getSelectTarget(input: SelectTargetInput): number | undefined {
  const { key, disabled, current } = input;
  const count = disabled.length;
  if (count === 0) return undefined;
  if (key === "Home") return firstEnabled(disabled, 0, 1);
  if (key === "End") return firstEnabled(disabled, count - 1, -1);
  if (key === "PageDown" || key === "PageUp") {
    const step = key === "PageDown" ? 1 : -1;
    const size = Math.max(1, Math.floor(input.pageSize ?? SELECT_PAGE_SIZE));
    let target: number | undefined;
    let moved = 0;
    // Walk enabled items one at a time so a disabled run never counts toward the page.
    const hasCurrent = current >= 0 && current < count;
    if (!hasCurrent && step === -1) return firstEnabled(disabled, 0, 1);
    let cursor = hasCurrent ? current + step : 0;
    while (moved < size && cursor >= 0 && cursor < count) {
      if (disabled[cursor] === false) {
        target = cursor;
        moved += 1;
      }
      cursor += step;
    }
    return target;
  }
  if (key !== "ArrowDown" && key !== "ArrowUp") return undefined;
  return getRovingTarget({
    key,
    orientation: "vertical",
    dir: "ltr",
    loop: input.loop === true,
    disabled,
    current,
  });
}

/**
 * The index that receives focus when the listbox opens: the selected item, or the first enabled
 * item when nothing is selected or the selected item is disabled.
 *
 * @param disabled One flag per item in document order.
 * @param selected Index of the selected item, or -1.
 * @returns The index to focus, or `undefined` when every item is disabled (or there are none).
 * @example
 * import { getInitialSelectIndex } from "@shadow-js/primitives";
 *
 * getInitialSelectIndex([true, false, false], 2); // 2
 * getInitialSelectIndex([true, false, false], -1); // 1
 * @see {@link getSelectTarget}
 * @since 1.0.0
 */
export function getInitialSelectIndex(
  disabled: readonly boolean[],
  selected: number,
): number | undefined {
  if (selected >= 0 && selected < disabled.length && disabled[selected] === false) return selected;
  return firstEnabled(disabled, 0, 1);
}

/**
 * How far a scroll container must scroll (positive = down) to bring an item fully into view with
 * the least movement. Items taller than the container align their top edge. All values are in the
 * same coordinate space (viewport pixels).
 *
 * @param itemTop Top edge of the item.
 * @param itemBottom Bottom edge of the item.
 * @param viewTop Top edge of the visible part of the container.
 * @param viewBottom Bottom edge of the visible part of the container.
 * @returns The scroll delta; 0 when the item is already visible.
 * @example
 * import { getSelectScrollDelta } from "@shadow-js/primitives";
 *
 * getSelectScrollDelta(120, 150, 0, 100); // 50
 * getSelectScrollDelta(-20, 10, 0, 100); // -20
 * @see {@link getSelectTarget}
 * @since 1.0.0
 */
export function getSelectScrollDelta(
  itemTop: number,
  itemBottom: number,
  viewTop: number,
  viewBottom: number,
): number {
  if (itemTop < viewTop) return itemTop - viewTop;
  if (itemBottom > viewBottom) {
    // An item taller than the view cannot fit: show its start, not its end.
    return Math.min(itemBottom - viewBottom, itemTop - viewTop);
  }
  return 0;
}
