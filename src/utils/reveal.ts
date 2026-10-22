/**
 * Scrolls `scroller` vertically just enough for `item` to be fully inside it, and touches nothing
 * else: `scrollIntoView` would also move the page. Horizontal scrolling is not adjusted. The
 * rectangles are in screen pixels and `scrollTop` is in the scroller's own; they differ while an
 * entrance animation scales the scroller, so the distance is converted. Does nothing when the item
 * is already visible or `scroller` does not scroll vertically.
 *
 * @param scroller The element that scrolls (an ancestor of `item`, or `item`'s container).
 * @param item The element to bring into view.
 * @example
 * import { scrollIntoScroller } from "@shadow-js/primitives";
 *
 * const list = document.querySelector<HTMLElement>("#list");
 * const item = document.querySelector<HTMLElement>("#item-3");
 * if (list !== null && item !== null) {
 *   item.focus({ preventScroll: true });
 *   scrollIntoScroller(list, item);
 * }
 * @since 1.0.0
 * @see {@link createRevealer}
 */
export function scrollIntoScroller(scroller: HTMLElement, item: HTMLElement): void {
  if (scroller.scrollHeight <= scroller.clientHeight) return;
  const box = scroller.getBoundingClientRect();
  const row = item.getBoundingClientRect();
  // The drawn border box over the layout border box (`offsetHeight`, unaffected by transforms).
  const scale =
    scroller.offsetHeight > 0 && box.height > 0 ? box.height / scroller.offsetHeight : 1;
  // What is visible is the padding box: inside the borders.
  const borderTop = scroller.clientTop * scale;
  const borderBottom =
    Math.max(0, scroller.offsetHeight - scroller.clientHeight - scroller.clientTop) * scale;
  const top = box.top + borderTop;
  const bottom = box.bottom - borderBottom;
  if (row.top < top) scroller.scrollTop -= (top - row.top) / scale;
  else if (row.bottom > bottom) scroller.scrollTop += (row.bottom - bottom) / scale;
}

/**
 * What {@link createRevealer} brings into view: a scrolling element and an item inside it.
 * @since 1.0.0
 * @see {@link createRevealer}
 */
export interface RevealTarget {
  /** The scrolling element that contains the item. */
  readonly scroller: HTMLElement;
  /** The item to bring into view inside the scroller. */
  readonly item: HTMLElement;
}

/**
 * Brings what `find` returns into view now and once more on the next frame, and cancels the pending
 * frame on `cancel`. A popup is only as tall as its scroll area once it has been placed, and
 * scrolling can change what is measured (scroll buttons appear, the list resizes), so one pass is
 * not always enough. `find` is called once per pass (now, and again on the next frame), and each
 * pass acts on what that call returned. `find` may return `undefined`, which does nothing.
 *
 * The helper does not untrack `find`: its reads are tracked by whatever effect calls `reveal`.
 * Wrap the reads in `untrack` when `reveal` runs inside an effect, as the menu and combobox do.
 *
 * @param find Looks up the scroller and the item at the moment of the pass.
 * @returns `reveal` (now and next frame) and `cancel` (drops the pending frame).
 * @example
 * import { createRevealer } from "@shadow-js/primitives";
 *
 * export function revealHighlighted(list: HTMLElement, highlighted: HTMLElement): () => void {
 *   const revealer = createRevealer(() => ({ scroller: list, item: highlighted }));
 *   revealer.reveal();
 *   return revealer.cancel;
 * }
 * @since 1.0.0
 * @see {@link scrollIntoScroller}
 * @see {@link RevealTarget}
 */
export function createRevealer(find: () => RevealTarget | undefined): {
  readonly reveal: () => void;
  readonly cancel: () => void;
} {
  let frame: { readonly view: Window; readonly id: number } | undefined;
  const pass = (target: RevealTarget | undefined): void => {
    if (target !== undefined) scrollIntoScroller(target.scroller, target.item);
  };
  const cancel = (): void => {
    frame?.view.cancelAnimationFrame(frame.id);
    frame = undefined;
  };
  return {
    reveal() {
      // One lookup per pass: the frame is requested for the same scroller the pass acted on.
      const target = find();
      pass(target);
      const view = target?.scroller.ownerDocument.defaultView;
      if (view === null || view === undefined || typeof view.requestAnimationFrame !== "function") {
        return;
      }
      cancel();
      frame = { view, id: view.requestAnimationFrame(() => pass(find())) };
    },
    cancel,
  };
}
