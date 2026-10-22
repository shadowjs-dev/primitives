/**
 * `hideOthers`: makes everything outside a modal surface unreachable for assistive technology
 * (`aria-hidden`) and/or for focus and pointer input (`inert`), like Radix's `aria-hidden` helper.
 * Marks are reference counted per element and per attribute, so a menu opened inside a dialog
 * restores the page correctly whichever closes first.
 * @packageDocumentation
 */

/**
 * How outside content is hidden: `"aria-hidden"` hides it from assistive technology only, `"inert"`
 * blocks focus and pointer input only, and `"both"` applies both.
 * @see {@link hideOthers}
 * @since 1.0.0
 */
export type HideOthersMode = "aria-hidden" | "inert" | "both";

/**
 * Options for {@link hideOthers}. The options set no keys; the attributes they select are
 * `aria-hidden="true"` and `inert` (empty value) on the marked outside elements, and an element that
 * already had the attribute gets its previous value back.
 * @see {@link hideOthers}
 * @since 1.0.0
 */
export interface HideOthersOptions {
  /**
   * `"aria-hidden"` hides from assistive technology only (focus still reaches the content),
   * `"inert"` blocks focus and pointer, `"both"` applies both.
   * @default `"aria-hidden"`
   */
  readonly mode?: HideOthersMode;
  /**
   * The document to work in.
   * @default the global `document`
   */
  readonly document?: Document;
}

/** The attributes this module manages. */
type Attribute = "aria-hidden" | "inert";

/** Count of live marks for one attribute on one element, and the value to restore. */
interface Mark {
  count: number;
  /** The attribute value before the first mark, or `null` when it was absent. */
  readonly previous: string | null;
}

/** Per element and attribute, so unrelated callers (and documents) never share bookkeeping. */
const MARKS = new WeakMap<Element, Map<Attribute, Mark>>();

/** Tags whose content is never exposed to assistive technology, so marking them is noise. */
const SKIPPED_TAGS: ReadonlySet<string> = new Set(["script", "style", "template", "noscript"]);

const LIVE_SELECTOR = "[aria-live],[data-primitives-live]";

function mark(element: Element, attribute: Attribute): void {
  let marks = MARKS.get(element);
  if (marks === undefined) {
    marks = new Map();
    MARKS.set(element, marks);
  }
  const existing = marks.get(attribute);
  if (existing !== undefined) {
    existing.count += 1;
    return;
  }
  marks.set(attribute, { count: 1, previous: element.getAttribute(attribute) });
  element.setAttribute(attribute, attribute === "inert" ? "" : "true");
}

function unmark(element: Element, attribute: Attribute): void {
  const marks = MARKS.get(element);
  const existing = marks?.get(attribute);
  if (marks === undefined || existing === undefined) return;
  existing.count -= 1;
  if (existing.count > 0) return;
  marks.delete(attribute);
  if (marks.size === 0) MARKS.delete(element);
  if (existing.previous === null) element.removeAttribute(attribute);
  else element.setAttribute(attribute, existing.previous);
}

/** The parent in the composed tree: a shadow root hands over to its host. */
function composedParent(node: Node): Node | null {
  if (node.parentNode !== null) return node.parentNode;
  // Compared by node type, not `instanceof`, so nodes from an iframe's realm work too.
  const host = (node as Partial<ShadowRoot>).host;
  return node.nodeType === 11 && host !== undefined ? host : null;
}

/** Whether `element` must never be marked. */
function isSkipped(element: Element): boolean {
  return SKIPPED_TAGS.has(element.localName) || element.matches(LIVE_SELECTOR);
}

/**
 * Hides everything that is not a target, an ancestor of one, or a descendant of one. Starting at
 * `<body>`, every sibling off the path to a target is marked with `aria-hidden="true"`, `inert`
 * (empty value) or both, depending on `mode`. `script`, `style`, `template`, `noscript`,
 * `[aria-live]` regions and `[data-primitives-live]` regions (the announcer) are skipped, and
 * targets are never marked. If no target lies inside `<body>`, nothing is hidden. The function
 * sets no keys; it only changes which content is reachable.
 *
 * @param targets The element(s) that stay available.
 * @param options See {@link HideOthersOptions}.
 * @returns An idempotent function that removes this call's marks; each element returns to its
 * previous attribute value once the last caller releases it.
 * @example
 * import { hideOthers } from "@shadow-js/primitives";
 *
 * export function openModal(dialog: HTMLElement): () => void {
 *   return hideOthers(dialog, { mode: "both" });
 * }
 * @see {@link HideOthersOptions}
 * @see {@link HideOthersMode}
 * @since 1.0.0
 */
export function hideOthers(
  targets: Element | readonly Element[],
  options: HideOthersOptions = {},
): () => void {
  const doc = options.document ?? (typeof document === "undefined" ? undefined : document);
  const body = doc?.body;
  if (doc === undefined || body === undefined || body === null) return () => undefined;
  const mode = options.mode ?? "aria-hidden";
  const attributes: readonly Attribute[] = mode === "both" ? ["aria-hidden", "inert"] : [mode];

  const list: readonly Element[] = Array.isArray(targets)
    ? (targets as readonly Element[])
    : [targets as Element];
  // Live regions stay readable, so they (and their ancestors) are kept like targets.
  const keep: Element[] = [...list, ...doc.body.querySelectorAll(LIVE_SELECTOR)];

  // Every node on a path to a kept element, and the kept elements themselves.
  const onPath = new Set<Node>();
  const targetSet = new Set<Node>(keep);
  let reached = false;
  for (const [index, target] of keep.entries()) {
    // Walk iteratively; a target outside <body> has no siblings worth hiding.
    const chain: Node[] = [];
    let node: Node | null = target;
    while (node !== null && node !== body) {
      chain.push(node);
      node = composedParent(node);
    }
    if (node !== body) continue;
    for (const item of chain) onPath.add(item);
    if (index < list.length) reached = true;
  }
  // Nothing inside <body> to keep: hiding the whole page would be a trap, not a modal.
  if (!reached) return () => undefined;
  onPath.add(body);

  const marked: Element[] = [];
  for (const node of onPath) {
    // Descendants of a target stay untouched.
    if (targetSet.has(node)) continue;
    const parent = node as ParentNode;
    for (const child of parent.children) {
      if (onPath.has(child) || isSkipped(child)) continue;
      marked.push(child);
    }
  }
  for (const element of marked) for (const attribute of attributes) mark(element, attribute);

  let released = false;
  return (): void => {
    if (released) return;
    released = true;
    for (const element of marked) for (const attribute of attributes) unmark(element, attribute);
  };
}
