/**
 * Focus scopes: move focus into a region when it opens, optionally keep it there (trap), and give
 * it back to the previously focused element when the region closes. Scopes are stacked per
 * document: only the topmost one traps, so a menu opened from a modal dialog can take focus
 * without the dialog pulling it back.
 * @packageDocumentation
 */
import { onCleanup, untrack, useEffect } from "@shadow-js/core";
import { focusFirst, getTabbables } from "./tabbable";

/**
 * Options of {@link useFocusScope}. Every function is read reactively. The scope sets no ARIA
 * attributes and no data attributes; it moves focus, traps it when `trapped` is set, and handles
 * Tab and Shift+Tab inside the container when it traps or loops.
 * @see {@link useFocusScope}
 * @since 1.0.0
 */
export interface FocusScopeOptions {
  /**
   * The scope's root. Give it `tabindex="-1"` so it can hold focus when nothing inside can.
   * @default none (required; no container means the scope is inactive)
   */
  readonly container: () => HTMLElement | null | undefined;
  /**
   * Keep focus inside: focus that leaves is pulled back, Tab never reaches the page behind.
   * @default `false`
   */
  readonly trapped?: () => boolean;
  /**
   * Tab at the last element wraps to the first, and Shift+Tab at the first wraps to the last.
   * Without it a trapped scope stops Tab at the edges.
   * @default same as `trapped`
   */
  readonly loop?: () => boolean;
  /**
   * Whether the scope is active. Becoming inactive restores focus.
   * @default `true`
   */
  readonly enabled?: () => boolean;
  /**
   * Called when the scope activates, before focus moves. `event.preventDefault()` keeps focus
   * where it is (move it yourself).
   * @default none
   */
  readonly onMountAutoFocus?: () => ((event: Event) => void) | undefined;
  /**
   * Called when the scope deactivates, before focus is restored. `event.preventDefault()` skips the
   * restore.
   * @default none
   */
  readonly onUnmountAutoFocus?: () => ((event: Event) => void) | undefined;
  /**
   * Called on activation, after focus has moved into the container, with the container. The cleanup
   * it returns runs on deactivation. A modal overlay hides the rest of the page here, because hiding
   * first would leave focus on an element that is already `aria-hidden`.
   * @default none
   */
  readonly onActivated?: (container: HTMLElement) => (() => void) | undefined;
}

interface ScopeEntry {
  paused: boolean;
}

const stacks = new WeakMap<Document, ScopeEntry[]>();

function stackOf(document: Document): ScopeEntry[] {
  let stack = stacks.get(document);
  if (stack === undefined) {
    stack = [];
    stacks.set(document, stack);
  }
  return stack;
}

function activate(document: Document): ScopeEntry {
  const stack = stackOf(document);
  const top = stack.at(-1);
  if (top !== undefined) top.paused = true;
  const entry: ScopeEntry = { paused: false };
  stack.push(entry);
  return entry;
}

function deactivate(document: Document, entry: ScopeEntry): void {
  const stack = stackOf(document);
  const index = stack.indexOf(entry);
  if (index !== -1) stack.splice(index, 1);
  const top = stack.at(-1);
  if (top !== undefined) top.paused = false;
}

/** The first tabbable of `container` receives focus; the container itself when there is none. */
function focusInside(container: HTMLElement): void {
  const tabbables = getTabbables(container);
  focusFirst(tabbables, { preventScroll: true });
  if (
    container.ownerDocument.activeElement === container.ownerDocument.body ||
    tabbables.length === 0
  ) {
    container.focus({ preventScroll: true });
  }
}

/**
 * Manages focus for a region. Activation (container present and `enabled`) remembers the focused
 * element, moves focus to the first tabbable inside (or to the container), and registers the scope;
 * deactivation or disposal restores focus. Focus is restored only when it is still inside the
 * region or has fallen back to `body`, so a region dismissed by clicking another field never steals
 * focus from it. Keyboard: while the scope is trapped or loops, Tab on the last tabbable element
 * wraps to the first (Shift+Tab on the first to the last) when `loop` is set; a trapped scope without
 * `loop` stops Tab at the edges. With no tabbable element, Tab keeps focus on the container. Only the
 * topmost scope on a document traps. ARIA: none; the caller sets roles and labels.
 *
 * @param options See {@link FocusScopeOptions}.
 * @example
 * import { type FocusScopeOptions, useFocusScope, useRefSignal } from "@shadow-js/primitives";
 *
 * export function Modal(props: { open: () => boolean }) {
 *   const [content, setContent] = useRefSignal<HTMLElement>();
 *   const options: FocusScopeOptions = {
 *     container: content,
 *     trapped: () => true,
 *     enabled: () => props.open(),
 *   };
 *   useFocusScope(options);
 *   return (
 *     <div tabindex="-1" ref={(element: HTMLElement) => setContent(element)}>
 *       <button>Close</button>
 *     </div>
 *   );
 * }
 * @see {@link FocusScopeOptions}
 * @see {@link getTabbables}
 * @since 1.0.0
 */
export function useFocusScope(options: FocusScopeOptions): void {
  // Activation: autofocus on enter, restore on leave.
  useEffect(() => {
    const container = options.container();
    if (container === null || container === undefined) return;
    if (options.enabled !== undefined && !options.enabled()) return;
    const document = container.ownerDocument;
    const previouslyFocused = document.activeElement;
    const entry = untrack(() => activate(document));
    untrack(() => {
      const event = new CustomEvent("primitives.focusScope.mount", { cancelable: true });
      options.onMountAutoFocus?.()?.(event);
      if (!event.defaultPrevented) focusInside(container);
    });
    untrack(() => {
      const release = options.onActivated?.(container);
      if (release !== undefined) onCleanup(release);
    });
    onCleanup(() => {
      deactivate(document, entry);
      const event = new CustomEvent("primitives.focusScope.unmount", { cancelable: true });
      options.onUnmountAutoFocus?.()?.(event);
      if (event.defaultPrevented) return;
      const active = document.activeElement;
      const focusIsLost = active === null || active === document.body || container.contains(active);
      if (!focusIsLost) return;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) {
        previouslyFocused.focus();
      } else if (container.contains(active) || active === document.body) {
        document.body.focus();
      }
    });
    // The trap shares the activation's entry so the stack order matches.
    useEffect(() => {
      const trapped = options.trapped?.() ?? false;
      const loop = options.loop?.() ?? trapped;
      if (!trapped && !loop) return;
      let lastFocused: HTMLElement | null =
        document.activeElement instanceof HTMLElement && container.contains(document.activeElement)
          ? document.activeElement
          : null;
      const onFocusIn = (event: FocusEvent): void => {
        if (entry.paused || !trapped) return;
        const target = event.target;
        if (target instanceof Node && container.contains(target)) {
          if (target instanceof HTMLElement) lastFocused = target;
        } else if (lastFocused?.isConnected === true) {
          lastFocused.focus({ preventScroll: true });
        } else {
          focusInside(container);
        }
      };
      const onKeyDown = (event: KeyboardEvent): void => {
        if (entry.paused || event.key !== "Tab" || event.altKey || event.ctrlKey || event.metaKey)
          return;
        const tabbables = getTabbables(container);
        const first = tabbables[0];
        const last = tabbables.at(-1);
        const active = document.activeElement;
        if (first === undefined || last === undefined) {
          if (active === container) event.preventDefault();
          return;
        }
        if (!event.shiftKey && active === last) {
          event.preventDefault();
          if (loop) first.focus({ preventScroll: true });
        } else if (event.shiftKey && (active === first || active === container)) {
          event.preventDefault();
          if (loop) last.focus({ preventScroll: true });
        }
      };
      // If the focused element is removed, focus falls to body; bring it back into the scope.
      const observer =
        typeof MutationObserver === "function"
          ? new MutationObserver(() => {
              if (entry.paused || !trapped) return;
              if (document.activeElement === document.body) focusInside(container);
            })
          : undefined;
      observer?.observe(container, { childList: true, subtree: true });
      document.addEventListener("focusin", onFocusIn);
      container.addEventListener("keydown", onKeyDown);
      onCleanup(() => {
        document.removeEventListener("focusin", onFocusIn);
        container.removeEventListener("keydown", onKeyDown);
        observer?.disconnect();
      });
    });
  });
}
