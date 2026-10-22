/**
 * Focusable and tabbable element discovery. Walks the composed tree (open shadow roots, assigned
 * slot content), honors `tabindex` order, skips disabled, hidden and inert content, and treats a
 * radio group as one tab stop. Used by focus scopes, menus and anything else that has to answer
 * "what can the user reach with Tab here?".
 * @packageDocumentation
 */

/** Native elements and attribute patterns that can take focus. */
const FOCUSABLE_SELECTOR = [
  "a[href]",
  "area[href]",
  "button",
  "input:not([type='hidden'])",
  "select",
  "textarea",
  "summary",
  "iframe",
  "audio[controls]",
  "video[controls]",
  "[contenteditable]:not([contenteditable='false'])",
  "[tabindex]",
].join(",");

/**
 * Options for {@link getFocusables} and {@link getTabbables}. They decide which elements are
 * returned; they set no ARIA attributes, handle no keys and set no data attributes.
 * @since 1.0.0
 * @see {@link getTabbables}
 */
export interface TabbableOptions {
  /**
   * Also return `root` itself when it is an element that matches.
   * @default `false`
   */
  readonly includeContainer?: boolean;
  /**
   * Look inside open shadow roots and slotted content. `false` only walks the light DOM.
   * @default `true`
   */
  readonly shadow?: boolean;
}

/** The computed style of an element, from the window that owns it (it can be an iframe's). */
function computedStyle(element: Element): CSSStyleDeclaration {
  return (element.ownerDocument.defaultView ?? globalThis).getComputedStyle(element);
}

/** The `tabindex` attribute as a number, or `undefined` when it is absent or invalid. */
function tabIndexOf(element: Element): number | undefined {
  const raw = element.getAttribute("tabindex");
  if (raw === null) return undefined;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? undefined : parsed;
}

/**
 * Whether `element` or an ancestor up to `root` is hidden by CSS, `hidden` or `inert`. Iterative
 * (DOM depth is user controlled) and memoized in `cache`, which maps a node to its answer.
 */
function isUnreachable(element: Element, root: Node, cache: Map<Element, boolean>): boolean {
  const path: Element[] = [];
  let result = false;
  let current: Element | null = element;
  while (current !== null) {
    const known = cache.get(current);
    if (known !== undefined) {
      result = known;
      break;
    }
    path.push(current);
    if (
      current.hasAttribute("inert") ||
      current.hasAttribute("hidden") ||
      computedStyle(current).display === "none"
    ) {
      result = true;
      break;
    }
    if (current === root) break;
    const parent: ParentNode | null = current.assignedSlot ?? current.parentNode;
    if (parent instanceof ShadowRoot) current = parent.host;
    else current = parent instanceof Element ? parent : null;
  }
  for (const node of path) cache.set(node, result);
  return result;
}

/** Whether the element itself is `visibility: hidden` (inherited, so the computed value is enough). */
function isVisibilityHidden(element: Element): boolean {
  const visibility = computedStyle(element).visibility;
  return visibility === "hidden" || visibility === "collapse";
}

/** Whether `element` is disabled natively or through a disabled fieldset. */
function isDisabled(element: Element): boolean {
  if ("disabled" in element && (element as HTMLButtonElement).disabled === true) return true;
  const fieldset = element.closest("fieldset[disabled]");
  if (fieldset === null) return false;
  const legend = fieldset.querySelector(":scope > legend");
  return legend === null || !legend.contains(element);
}

/** The elements below `root` in composed-tree document order (shadow content replaces light children of a host). */
function composedElements(root: Element | ShadowRoot | Document, shadow: boolean): Element[] {
  const out: Element[] = [];
  const stack: Node[] = [];
  const pushChildren = (parent: Node): void => {
    const children = parent.childNodes;
    for (let index = children.length - 1; index >= 0; index -= 1) {
      const child = children[index];
      if (child !== undefined) stack.push(child);
    }
  };
  pushChildren(root);
  while (stack.length > 0) {
    const node = stack.pop();
    if (!(node instanceof Element)) continue;
    out.push(node);
    if (shadow && node instanceof HTMLSlotElement) {
      const assigned = node.assignedNodes({ flatten: true });
      if (assigned.length > 0) {
        for (let index = assigned.length - 1; index >= 0; index -= 1) {
          const item = assigned[index];
          if (item !== undefined) stack.push(item);
        }
        continue;
      }
    }
    if (shadow && node.shadowRoot !== null) {
      pushChildren(node.shadowRoot);
      continue;
    }
    pushChildren(node);
  }
  return out;
}

/**
 * Whether `element` can take programmatic focus: it matches the focusable patterns, is not
 * disabled, hidden, inert or `visibility: hidden`.
 *
 * @param element The candidate.
 * @param root Ancestors beyond this node are not inspected. Default: the document.
 * @returns `true` when the element is focusable.
 * @example
 * import { isFocusable } from "@shadow-js/primitives";
 *
 * const button = document.createElement("button");
 * document.body.append(button);
 * if (isFocusable(button)) button.focus();
 * @since 1.0.0
 * @see {@link getFocusables}
 */
export function isFocusable(element: Element, root: Node = element.ownerDocument): boolean {
  if (!element.matches(FOCUSABLE_SELECTOR)) return false;
  if (isDisabled(element)) return false;
  if (isVisibilityHidden(element)) return false;
  return !isUnreachable(element, root, new Map());
}

/** The radio buttons that share a group with `radio` inside `scope`. */
function radioGroupOf(radio: HTMLInputElement, scope: readonly Element[]): HTMLInputElement[] {
  return scope.filter(
    (element): element is HTMLInputElement =>
      element instanceof HTMLInputElement &&
      element.type === "radio" &&
      element.name === radio.name &&
      element.form === radio.form,
  );
}

/**
 * Every focusable element below `root` in the order the browser would reach them, tabindex
 * included, without removing the ones with a negative `tabindex`.
 *
 * @param root Where to search.
 * @param options See {@link TabbableOptions}.
 * @returns The focusable elements in document order.
 * @example
 * import { getFocusables } from "@shadow-js/primitives";
 *
 * const menu = document.querySelector<HTMLElement>("[role='menu']");
 * const focusables = menu === null ? [] : getFocusables(menu);
 * const items = focusables.filter((el) => el.matches("[role=menuitem]"));
 * @since 1.0.0
 * @see {@link getTabbables}
 * @see {@link isFocusable}
 */
export function getFocusables(
  root: Element | ShadowRoot | Document,
  options: TabbableOptions = {},
): HTMLElement[] {
  const shadow = options.shadow !== false;
  const candidates = composedElements(root, shadow);
  if (options.includeContainer === true && root instanceof Element) candidates.unshift(root);
  const cache = new Map<Element, boolean>();
  return candidates.filter(
    (element): element is HTMLElement =>
      element instanceof HTMLElement &&
      element.matches(FOCUSABLE_SELECTOR) &&
      !isDisabled(element) &&
      !isVisibilityHidden(element) &&
      !isUnreachable(element, root, cache),
  );
}

/**
 * The elements Tab would stop at below `root`, in tab order: positive `tabindex` values first
 * (ascending), then `tabindex="0"` and natively focusable elements in document order. A named
 * radio group (same `name`, same form) counts once: its checked radio, or the first one when none
 * is checked. Elements with a negative `tabindex` are left out.
 *
 * @param root Where to search.
 * @param options See {@link TabbableOptions}.
 * @returns The tabbable elements in tab order.
 * @example
 * import { getTabbables } from "@shadow-js/primitives";
 *
 * const dialog = document.querySelector<HTMLElement>("[role='dialog']");
 * const [first] = dialog === null ? [] : getTabbables(dialog);
 * first?.focus();
 * @since 1.0.0
 * @see {@link getFocusables}
 * @see {@link focusFirst}
 */
export function getTabbables(
  root: Element | ShadowRoot | Document,
  options: TabbableOptions = {},
): HTMLElement[] {
  const focusables = getFocusables(root, options);
  const tabbable = focusables.filter((element) => {
    const index = tabIndexOf(element);
    if (index !== undefined && index < 0) return false;
    if (element instanceof HTMLInputElement && element.type === "radio" && element.name !== "") {
      const group = radioGroupOf(element, focusables);
      const checked = group.find((radio) => radio.checked);
      return checked !== undefined ? checked === element : group[0] === element;
    }
    return true;
  });
  const positive = tabbable
    .map((element, order) => ({ element, order, index: tabIndexOf(element) ?? 0 }))
    .filter((entry) => entry.index > 0)
    .sort((a, b) => a.index - b.index || a.order - b.order)
    .map((entry) => entry.element);
  const rest = tabbable.filter((element) => (tabIndexOf(element) ?? 0) <= 0);
  return [...positive, ...rest];
}

/**
 * Focuses the first candidate that accepts focus.
 *
 * @param candidates Elements in priority order.
 * @param options `preventScroll` avoids scrolling the page; `select` selects the text of an input.
 * @returns The candidate that took focus (or the one already focused), or `undefined` when none can
 * take focus.
 * @example
 * import { focusFirst, getTabbables } from "@shadow-js/primitives";
 *
 * const dialog = document.querySelector<HTMLElement>("[role='dialog']");
 * if (dialog !== null) focusFirst(getTabbables(dialog), { preventScroll: true });
 * @since 1.0.0
 * @see {@link getTabbables}
 */
export function focusFirst(
  candidates: readonly HTMLElement[],
  options: { readonly preventScroll?: boolean; readonly select?: boolean } = {},
): HTMLElement | undefined {
  const previous = candidates[0]?.ownerDocument.activeElement ?? null;
  for (const candidate of candidates) {
    if (candidate === previous) return candidate;
    candidate.focus({ preventScroll: options.preventScroll === true });
    if (candidate.ownerDocument.activeElement !== previous) {
      if (options.select === true && candidate instanceof HTMLInputElement) candidate.select();
      return candidate;
    }
  }
  return undefined;
}

/**
 * The deepest active element, looking through open shadow roots.
 *
 * @param document The document to inspect. Default: the global one.
 * @returns The focused element or `null`.
 * @example
 * import { getDeepActiveElement } from "@shadow-js/primitives";
 *
 * const focused = getDeepActiveElement();
 * console.log(focused?.tagName ?? "nothing is focused");
 * @since 1.0.0
 * @see {@link focusFirst}
 */
export function getDeepActiveElement(document: Document = globalThis.document): Element | null {
  let active: Element | null = document.activeElement;
  for (;;) {
    const inner: Element | null | undefined = active?.shadowRoot?.activeElement;
    if (inner === null || inner === undefined) return active;
    active = inner;
  }
}
