/**
 * The dismissable layer stack: one per document, shared by every primitive on it. Layers are
 * dismissed with Escape (topmost only), by a pointer press outside, or by focus moving outside.
 * A layer opened from inside another one (its `parent`) counts as part of it, so interacting with
 * a nested menu never dismisses the menu that opened it. A layer can also disable pointer events
 * outside itself, which is how modal content blocks the page behind it.
 *
 * The document listeners exist only while at least one layer is registered.
 * @packageDocumentation
 */

/**
 * A pointer press outside a layer. `detail.originalEvent` is the browser `pointerdown` event. The
 * event is cancelable; calling `preventDefault()` on it keeps the layer open.
 * @see {@link LayerHandlers}
 * @see {@link registerLayer}
 * @since 1.0.0
 */
export type PointerDownOutsideEvent = CustomEvent<{ originalEvent: PointerEvent }>;

/**
 * Focus moving outside a layer. `detail.originalEvent` is the browser `focusin` event. The event is
 * cancelable; calling `preventDefault()` on it keeps the layer open.
 * @see {@link LayerHandlers}
 * @see {@link registerLayer}
 * @since 1.0.0
 */
export type FocusOutsideEvent = CustomEvent<{ originalEvent: FocusEvent }>;

/**
 * What a layer wants to know about, read at event time so reactive props stay current. Call
 * `event.preventDefault()` in an `onInteractOutside` / `onPointerDownOutside` / `onFocusOutside` /
 * `onEscapeKeyDown` handler to keep the layer open. The interface sets no ARIA attributes and no data
 * attributes.
 * @see {@link registerLayer}
 * @see {@link LayerRegistration}
 * @since 1.0.0
 */
export interface LayerHandlers {
  /** Escape was pressed while the layer was topmost. Its `preventDefault()` keeps the layer open. */
  onEscapeKeyDown?: ((event: KeyboardEvent) => void) | undefined;
  /** A pointer press outside. Runs before `onInteractOutside`. */
  onPointerDownOutside?: ((event: PointerDownOutsideEvent) => void) | undefined;
  /** Focus moved outside. Runs before `onInteractOutside`. */
  onFocusOutside?: ((event: FocusOutsideEvent) => void) | undefined;
  /** Either kind of outside interaction, after the specific handler. */
  onInteractOutside?: ((event: PointerDownOutsideEvent | FocusOutsideEvent) => void) | undefined;
  /** The layer asks to be dismissed; runs unless an outside handler prevented the default. */
  onDismiss?: (() => void) | undefined;
}

/**
 * A layer to register with {@link registerLayer}.
 * @see {@link registerLayer}
 * @see {@link LayerHandlers}
 * @since 1.0.0
 */
export interface LayerRegistration {
  /** The layer's root element. Events inside it never dismiss it. */
  readonly element: HTMLElement;
  /** The layer this one was opened from; interacting with this layer is interacting with the parent. */
  readonly parent?: LayerHandle | undefined;
  /** Block pointer events everywhere except this layer (and layers above it). Read once. */
  readonly disableOutsidePointerEvents?: boolean | undefined;
  /** Extra elements that count as inside (a trigger, an anchor). Read at event time. */
  readonly branches?: (() => readonly (Element | null | undefined)[]) | undefined;
  /** Handlers, read at event time. */
  readonly handlers: () => LayerHandlers;
}

/**
 * The handle of a registered layer, returned by {@link registerLayer}.
 * @see {@link registerLayer}
 * @see {@link LayerRegistration}
 * @since 1.0.0
 */
export interface LayerHandle {
  /** The registered layer element. */
  readonly element: HTMLElement;
  /** Whether this layer is currently the topmost registered layer. */
  isTopmost(): boolean;
  /** Unregisters the layer; safe to call more than once. */
  remove(): void;
}

interface Entry {
  readonly registration: LayerRegistration;
  readonly handle: LayerHandle;
  readonly parent: Entry | undefined;
  removed: boolean;
  touchPending: PointerEvent | undefined;
  savedPointerEvents: string | undefined;
}

interface Stack {
  readonly layers: Entry[];
  readonly document: Document;
  bodyPointerEvents: string | undefined;
  listening: boolean;
}

const stacks = new WeakMap<Document, Stack>();
const entries = new WeakMap<LayerHandle, Entry>();

function stackFor(document: Document): Stack {
  let stack = stacks.get(document);
  if (stack === undefined) {
    stack = { layers: [], document, bodyPointerEvents: undefined, listening: false };
    stacks.set(document, stack);
  }
  return stack;
}

/** Whether `candidate` is `entry` or was opened from inside it. */
function isSameOrDescendant(candidate: Entry, entry: Entry): boolean {
  for (
    let current: Entry | undefined = candidate;
    current !== undefined;
    current = current.parent
  ) {
    if (current === entry) return true;
  }
  return false;
}

/**
 * The attribute name that marks a branch: an element carrying it (`data-primitives-layer-branch`)
 * is part of the inside of every layer, so pressing it or moving focus into it never dismisses
 * anything. Set the attribute yourself (value `""`) on persistent surfaces that must stay usable
 * while a layer is open, such as the toast viewport. The layer code only reads it.
 * @example
 * import { LAYER_BRANCH_ATTRIBUTE } from "@shadow-js/primitives";
 *
 * export function markViewport(viewport: HTMLElement): void {
 *   viewport.setAttribute(LAYER_BRANCH_ATTRIBUTE, "");
 * }
 * @see {@link registerLayer}
 * @see {@link LayerRegistration}
 * @since 1.0.0
 */
export const LAYER_BRANCH_ATTRIBUTE = "data-primitives-layer-branch";

/** Whether the event path touches the layer, one of its branches, or a layer opened from it. */
function isInside(stack: Stack, entry: Entry, path: readonly EventTarget[]): boolean {
  for (const target of path) {
    if (target instanceof Element && target.hasAttribute(LAYER_BRANCH_ATTRIBUTE)) return true;
  }
  for (const candidate of stack.layers) {
    if (!isSameOrDescendant(candidate, entry)) continue;
    if (path.includes(candidate.registration.element)) return true;
    for (const branch of candidate.registration.branches?.() ?? []) {
      if (branch !== null && branch !== undefined && path.includes(branch)) return true;
    }
  }
  return false;
}

function highestPointerBlocker(stack: Stack): number {
  for (let index = stack.layers.length - 1; index >= 0; index -= 1) {
    if (stack.layers[index]?.registration.disableOutsidePointerEvents === true) return index;
  }
  return -1;
}

/** Applies `pointer-events` to the body and to the layer roots according to the stack. */
function applyPointerEvents(stack: Stack): void {
  const body = stack.document.body;
  const blocker = highestPointerBlocker(stack);
  if (blocker === -1) {
    if (stack.bodyPointerEvents !== undefined) {
      body.style.pointerEvents = stack.bodyPointerEvents;
      stack.bodyPointerEvents = undefined;
    }
  } else if (stack.bodyPointerEvents === undefined) {
    stack.bodyPointerEvents = body.style.pointerEvents;
    body.style.pointerEvents = "none";
  }
  stack.layers.forEach((entry, index) => {
    const element = entry.registration.element;
    if (blocker === -1) {
      if (entry.savedPointerEvents !== undefined) {
        element.style.pointerEvents = entry.savedPointerEvents;
        entry.savedPointerEvents = undefined;
      }
      return;
    }
    if (entry.savedPointerEvents === undefined)
      entry.savedPointerEvents = element.style.pointerEvents;
    element.style.pointerEvents = index >= blocker ? "auto" : "none";
  });
}

function outsideEvent<E extends Event>(
  name: string,
  originalEvent: E,
): CustomEvent<{ originalEvent: E }> {
  return new CustomEvent(name, { cancelable: true, detail: { originalEvent } });
}

/** Runs the outside handlers of one layer and dismisses it unless a handler prevented that. */
function fireOutside(
  entry: Entry,
  kind: "pointer" | "focus",
  original: PointerEvent | FocusEvent,
): void {
  if (entry.removed) return;
  const handlers = entry.registration.handlers();
  if (kind === "pointer") {
    const event = outsideEvent("primitives.pointerDownOutside", original as PointerEvent);
    handlers.onPointerDownOutside?.(event);
    handlers.onInteractOutside?.(event);
    if (!event.defaultPrevented) handlers.onDismiss?.();
  } else {
    const event = outsideEvent("primitives.focusOutside", original as FocusEvent);
    handlers.onFocusOutside?.(event);
    handlers.onInteractOutside?.(event);
    if (!event.defaultPrevented) handlers.onDismiss?.();
  }
}

/** Calls `fn` for every layer, topmost first, collecting errors so one failing layer cannot hide the rest. */
function eachTopDown(stack: Stack, fn: (entry: Entry, index: number) => void): void {
  const snapshot = [...stack.layers];
  const errors: unknown[] = [];
  for (let index = snapshot.length - 1; index >= 0; index -= 1) {
    const entry = snapshot[index];
    if (entry === undefined) continue;
    try {
      fn(entry, index);
    } catch (error) {
      errors.push(error);
    }
  }
  if (errors.length === 1) throw errors[0];
  if (errors.length > 1) throw new AggregateError(errors, "Several layer handlers threw.");
}

function listeners(stack: Stack): {
  keydown: (event: Event) => void;
  pointerdown: (event: Event) => void;
  pointercancel: () => void;
  click: () => void;
  focusin: (event: Event) => void;
} {
  const onKeyDown = (event: Event): void => {
    if (!(event instanceof KeyboardEvent) || event.key !== "Escape" || event.isComposing) return;
    const top = stack.layers.at(-1);
    if (top === undefined) return;
    const handlers = top.registration.handlers();
    handlers.onEscapeKeyDown?.(event);
    if (!event.defaultPrevented && handlers.onDismiss !== undefined) {
      event.preventDefault();
      handlers.onDismiss();
    }
  };
  const onPointerDown = (event: Event): void => {
    if (!(event instanceof PointerEvent)) return;
    const path = event.composedPath();
    const blocker = highestPointerBlocker(stack);
    eachTopDown(stack, (entry, index) => {
      if (index < blocker || isInside(stack, entry, path)) return;
      if (event.pointerType === "touch") {
        // A touch that scrolls must not dismiss: wait for the click that follows a real tap.
        entry.touchPending = event;
        return;
      }
      fireOutside(entry, "pointer", event);
    });
  };
  const onPointerCancel = (): void => {
    for (const entry of stack.layers) entry.touchPending = undefined;
  };
  const onClick = (): void => {
    eachTopDown(stack, (entry) => {
      const pending = entry.touchPending;
      entry.touchPending = undefined;
      if (pending !== undefined) fireOutside(entry, "pointer", pending);
    });
  };
  const onFocusIn = (event: Event): void => {
    const path = event.composedPath();
    eachTopDown(stack, (entry) => {
      if (isInside(stack, entry, path)) return;
      fireOutside(entry, "focus", event as FocusEvent);
    });
  };
  return {
    keydown: onKeyDown,
    pointerdown: onPointerDown,
    pointercancel: onPointerCancel,
    click: onClick,
    focusin: onFocusIn,
  };
}

const installed = new WeakMap<Stack, ReturnType<typeof listeners>>();

function listen(stack: Stack): void {
  if (stack.listening) return;
  stack.listening = true;
  const handlers = listeners(stack);
  installed.set(stack, handlers);
  const document = stack.document;
  // Capture phase: runs before application handlers, so `stopPropagation()` inside the page cannot hide an outside press.
  document.addEventListener("keydown", handlers.keydown, true);
  document.addEventListener("pointerdown", handlers.pointerdown, true);
  document.addEventListener("pointercancel", handlers.pointercancel, true);
  document.addEventListener("click", handlers.click, true);
  document.addEventListener("focusin", handlers.focusin, true);
}

function unlisten(stack: Stack): void {
  const handlers = installed.get(stack);
  if (!stack.listening || handlers === undefined) return;
  stack.listening = false;
  installed.delete(stack);
  const document = stack.document;
  document.removeEventListener("keydown", handlers.keydown, true);
  document.removeEventListener("pointerdown", handlers.pointerdown, true);
  document.removeEventListener("pointercancel", handlers.pointercancel, true);
  document.removeEventListener("click", handlers.click, true);
  document.removeEventListener("focusin", handlers.focusin, true);
}

/**
 * Registers a layer on the document of its element and returns its handle. The newest layer is the
 * topmost: Escape goes to it alone, and the document listeners exist only while a layer is
 * registered. Keyboard: Escape (not during IME composition) reaches the topmost layer only. ARIA:
 * none; the layer element keeps whatever roles the caller set. For outside presses and outside focus
 * moves, a handler that throws does not stop the other layers; the errors are rethrown afterward
 * (several errors as an `AggregateError`). Unregister the layer when it closes (the handle's
 * `remove`).
 *
 * @param registration See {@link LayerRegistration}.
 * @returns The layer's handle.
 * @example
 * import { registerLayer } from "@shadow-js/primitives";
 *
 * export function openPanel(panel: HTMLElement, close: () => void): () => void {
 *   const layer = registerLayer({ element: panel, handlers: () => ({ onDismiss: close }) });
 *   return () => layer.remove();
 * }
 * @see {@link LayerRegistration}
 * @see {@link LayerHandle}
 * @see {@link getLayerCount}
 * @since 1.0.0
 */
export function registerLayer(registration: LayerRegistration): LayerHandle {
  const document = registration.element.ownerDocument;
  const stack = stackFor(document);
  const parent = registration.parent === undefined ? undefined : entries.get(registration.parent);
  const handle: LayerHandle = {
    element: registration.element,
    isTopmost: () => stack.layers.at(-1)?.handle === handle,
    remove(): void {
      const entry = entries.get(handle);
      if (entry === undefined || entry.removed) return;
      entry.removed = true;
      const index = stack.layers.indexOf(entry);
      if (index !== -1) stack.layers.splice(index, 1);
      if (entry.savedPointerEvents !== undefined) {
        entry.registration.element.style.pointerEvents = entry.savedPointerEvents;
        entry.savedPointerEvents = undefined;
      }
      applyPointerEvents(stack);
      if (stack.layers.length === 0) unlisten(stack);
    },
  };
  const entry: Entry = {
    registration,
    handle,
    parent,
    removed: false,
    touchPending: undefined,
    savedPointerEvents: undefined,
  };
  entries.set(handle, entry);
  stack.layers.push(entry);
  listen(stack);
  applyPointerEvents(stack);
  return handle;
}

/**
 * How many layers are registered on `document`. It does not change the stack and throws nothing.
 *
 * @param document The document. Default: the global one.
 * @returns The number of layers.
 * @example
 * import { getLayerCount } from "@shadow-js/primitives";
 *
 * export function hasOpenLayers(): boolean {
 *   return getLayerCount() > 0;
 * }
 * @see {@link registerLayer}
 * @since 1.0.0
 */
export function getLayerCount(document: Document = globalThis.document): number {
  return stacks.get(document)?.layers.length ?? 0;
}
