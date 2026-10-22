/**
 * Page scroll locking for modal surfaces (dialogs, drawers, menus). Locks are reference counted per
 * document, so nested modals compose and the page is restored exactly once, by the last unlock.
 * @packageDocumentation
 */

/** Name of the custom property that exposes the compensated scrollbar width, in pixels. */
const SCROLLBAR_SIZE_PROPERTY = "--primitives-scrollbar-size";

/** What the first lock replaced, so the last unlock can put the exact inline values back. */
interface LockState {
  count: number;
  readonly overflow: string;
  readonly paddingRight: string;
  readonly scrollbarSize: string;
}

/** One state per document: an iframe's lock never leaks into the parent page. */
const LOCKS = new WeakMap<Document, LockState>();

/**
 * Options for {@link lockScroll}. The lock sets no ARIA attributes and handles no keys; it only
 * changes inline styles on the body and the `--primitives-scrollbar-size` custom property.
 * @since 1.0.0
 * @see {@link lockScroll}
 */
export interface LockScrollOptions {
  /**
   * The document whose body is locked.
   * @default the global `document`
   */
  readonly document?: Document;
}

/** The width the vertical scrollbar takes from the layout viewport, or 0 when it is overlaid or absent. */
function scrollbarWidth(doc: Document): number {
  const view = doc.defaultView;
  if (view === null) return 0;
  const width = view.innerWidth - doc.documentElement.clientWidth;
  return width > 0 ? width : 0;
}

/**
 * Prevents the page from scrolling (`overflow: hidden` on `<body>`) without shifting the layout:
 * the width of the vanishing scrollbar is added to the body's `padding-right` and published as
 * `--primitives-scrollbar-size`. Calls are reference counted per document; the exact previous
 * inline values (including "no value") come back when the last lock is released. The scroll
 * position is never touched and `position: fixed` is never used, so there is no scroll jump.
 *
 * Without a document body (on the server) nothing is locked and the returned function does nothing.
 *
 * @param options Which document to lock. See {@link LockScrollOptions}.
 * @returns An idempotent function that releases this lock.
 * @example
 * import { lockScroll } from "@shadow-js/primitives";
 *
 * const unlock = lockScroll();
 * // ...later, when the modal closes
 * unlock();
 * @since 1.0.0
 * @see {@link LockScrollOptions}
 */
export function lockScroll(options: LockScrollOptions = {}): () => void {
  const doc = options.document ?? (typeof document === "undefined" ? undefined : document);
  const body = doc?.body;
  // On the server (or before a body exists) there is nothing to lock.
  if (doc === undefined || body === undefined || body === null) return () => undefined;

  let state = LOCKS.get(doc);
  if (state === undefined) {
    // Measure before `overflow: hidden`, which removes the scrollbar and would read as 0.
    const size = scrollbarWidth(doc);
    const style = body.style;
    state = {
      count: 0,
      overflow: style.overflow,
      paddingRight: style.paddingRight,
      scrollbarSize: style.getPropertyValue(SCROLLBAR_SIZE_PROPERTY),
    };
    if (size > 0) {
      const view = doc.defaultView;
      const current =
        view === null ? 0 : Number.parseFloat(view.getComputedStyle(body).paddingRight);
      style.paddingRight = `${(Number.isNaN(current) ? 0 : current) + size}px`;
    }
    style.setProperty(SCROLLBAR_SIZE_PROPERTY, `${size}px`);
    style.overflow = "hidden";
    LOCKS.set(doc, state);
  }
  state.count += 1;

  const held = state;
  let released = false;
  return (): void => {
    if (released) return;
    released = true;
    held.count -= 1;
    if (held.count > 0) return;
    LOCKS.delete(doc);
    const style = body.style;
    style.overflow = held.overflow;
    style.paddingRight = held.paddingRight;
    if (held.scrollbarSize === "") style.removeProperty(SCROLLBAR_SIZE_PROPERTY);
    else style.setProperty(SCROLLBAR_SIZE_PROPERTY, held.scrollbarSize);
  };
}
