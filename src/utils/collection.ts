/**
 * An ordered registry of DOM items (tabs, menu items, options) for roving focus and typeahead.
 * Items register themselves when they mount, in any order; the collection hands them back in
 * document order, so keyboard navigation follows what the user sees even when items live in
 * portals or were reordered after registration.
 * @packageDocumentation
 */
import { useSignal } from "@shadow-js/core";

/**
 * An element registered in a {@link Collection} and the data it was registered with. It sets no
 * ARIA attributes and no data attributes; the primitive that registers the element owns those.
 * @typeParam T The data type.
 * @see {@link Collection}
 * @since 1.0.0
 */
export interface CollectionItem<T> {
  /** The registered element. */
  readonly element: HTMLElement;
  /** The data passed to `register` or `update`. */
  readonly data: T;
}

/**
 * A registry of DOM items (tabs, menu items, options) kept in document order, used by roving focus
 * and typeahead. It handles no keys itself; the parts that own the collection read it to move focus.
 * Create it with {@link createCollection}.
 * @typeParam T The data type.
 * @see {@link createCollection}
 * @see {@link CollectionItem}
 * @since 1.0.0
 */
export interface Collection<T> {
  /**
   * Registers `element` with `data` (registering it again replaces the data) and returns an
   * idempotent function that removes it.
   */
  register(element: HTMLElement, data: T): () => void;
  /**
   * The items in document order. A tracked read: an effect or memo that calls it re-runs when an
   * item is registered, unregistered or updated. The result is cached until then, so it does not
   * notice DOM reordering; use {@link Collection.getItems} in event handlers for that.
   */
  items(): readonly CollectionItem<T>[];
  /** Untracked variant of `items` that re-sorts on every call, for use in event handlers. */
  getItems(): readonly CollectionItem<T>[];
  /** The position of `element` in document order (untracked, fresh), or -1 when not registered. */
  indexOf(element: Element): number;
  /** Whether `element` is registered (untracked). */
  has(element: Element): boolean;
  /** Replaces the data of a registered element and notifies trackers. Ignored for unknown elements. */
  update(element: HTMLElement, data: T): void;
}

const DOCUMENT_POSITION_DISCONNECTED = 1;
const DOCUMENT_POSITION_FOLLOWING = 4;

/** The parent in the composed tree: a shadow root hands over to its host. */
function composedParent(node: Node): Node | null {
  if (node.parentNode !== null) return node.parentNode;
  const host = (node as Partial<ShadowRoot>).host;
  return node.nodeType === 11 && host !== undefined ? host : null;
}

/** The nodes from the top of the composed tree down to `node`. */
function pathTo(node: Node): Node[] {
  const path: Node[] = [];
  for (let current: Node | null = node; current !== null; current = composedParent(current)) {
    path.push(current);
  }
  return path.reverse();
}

/**
 * Document order of two elements: negative when `a` comes first. Across a shadow boundary the
 * browser reports "disconnected" with an arbitrary answer, so the composed tree is walked to the
 * point where the two paths split. Elements that cannot be ordered at all compare equal, which
 * keeps the (stable) sort in registration order.
 */
function compareDocumentOrder(a: Element, b: Element): number {
  if (a === b) return 0;
  const position = a.compareDocumentPosition(b);
  if ((position & DOCUMENT_POSITION_DISCONNECTED) === 0) {
    return (position & DOCUMENT_POSITION_FOLLOWING) !== 0 ? -1 : 1;
  }
  const first = pathTo(a);
  const second = pathTo(b);
  if (first[0] !== second[0]) return 0;
  let depth = 0;
  while (depth < first.length && depth < second.length && first[depth] === second[depth])
    depth += 1;
  const left = first[depth];
  const right = second[depth];
  // One contains the other (the path of one is a prefix of the other's): the outer one first.
  if (left === undefined) return -1;
  if (right === undefined) return 1;
  const split = left.compareDocumentPosition(right);
  if ((split & DOCUMENT_POSITION_DISCONNECTED) !== 0) return 0;
  return (split & DOCUMENT_POSITION_FOLLOWING) !== 0 ? -1 : 1;
}

/** A registration. A new object per `register` call so a stale unregister cannot remove a newer one. */
interface Entry<T> {
  readonly element: HTMLElement;
  data: T;
}

/**
 * Creates an empty {@link Collection}. Create it once per primitive root and share it through
 * context. It has no keys and sets no ARIA attributes; ordering uses `compareDocumentPosition`, so it
 * also works across portals and shadow roots. It throws nothing.
 *
 * @returns A new collection.
 * @example
 * import { createCollection } from "@shadow-js/primitives";
 *
 * export function enabledElements(elements: HTMLElement[]): HTMLElement[] {
 *   const collection = createCollection<{ disabled: boolean }>();
 *   for (const element of elements) collection.register(element, { disabled: false });
 *   return collection
 *     .getItems()
 *     .filter((item) => !item.data.disabled)
 *     .map((item) => item.element);
 * }
 * @see {@link Collection}
 * @since 1.0.0
 */
export function createCollection<T>(): Collection<T> {
  // A Map keeps registration order, which is the tie-breaker for items that cannot be ordered.
  const entries = new Map<HTMLElement, Entry<T>>();
  const [version, setVersion] = useSignal(0);
  let revision = 0;
  let cache: readonly CollectionItem<T>[] = [];
  let cachedRevision = -1;

  const bump = (): void => {
    revision += 1;
    setVersion(revision);
  };

  const sorted = (): readonly CollectionItem<T>[] =>
    [...entries.values()]
      .sort((a, b) => compareDocumentOrder(a.element, b.element))
      .map((entry): CollectionItem<T> => ({ element: entry.element, data: entry.data }));

  return {
    register(element, data) {
      const entry: Entry<T> = { element, data };
      entries.set(element, entry);
      bump();
      return (): void => {
        if (entries.get(element) !== entry) return;
        entries.delete(element);
        bump();
      };
    },
    items() {
      version();
      if (cachedRevision !== revision) {
        cache = sorted();
        cachedRevision = revision;
      }
      return cache;
    },
    getItems() {
      return sorted();
    },
    indexOf(element) {
      return sorted().findIndex((item) => item.element === element);
    },
    has(element) {
      return element instanceof HTMLElement && entries.has(element);
    },
    update(element, data) {
      const entry = entries.get(element);
      if (entry === undefined) return;
      entry.data = data;
      bump();
    },
  };
}
