/**
 * A polite / assertive live-region announcer for status changes that have no visible element to
 * focus (toasts, "3 results", "item moved"). One pair of visually hidden regions per document is
 * created lazily and appended to `<body>`; the regions carry `data-primitives-live`, which
 * `hideOthers` leaves alone so announcements keep working while a modal hides the page.
 * @packageDocumentation
 */

/**
 * How urgently a screen reader reads an announcement. `"polite"` waits until the user is idle;
 * `"assertive"` interrupts. Each value selects its own live region.
 * @see {@link announce}
 * @since 1.0.0
 */
export type AnnouncePoliteness = "polite" | "assertive";

/**
 * Options for {@link announce}. The politeness picks the live region: `"polite"` writes to a
 * `role="status"` region with `aria-live="polite"`, `"assertive"` to a `role="alert"` region with
 * `aria-live="assertive"`. Both regions have `aria-atomic="true"` and carry the attribute
 * `data-primitives-live` (value `""`). The options set no keyboard behavior.
 * @see {@link announce}
 * @since 1.0.0
 */
export interface AnnounceOptions {
  /**
   * `"polite"` waits for the user to be idle (`role="status"`, `aria-live="polite"`); `"assertive"`
   * interrupts (`role="alert"`, `aria-live="assertive"`).
   * @default "polite"
   */
  readonly politeness?: AnnouncePoliteness;
  /**
   * The document to announce in.
   * @default the global `document`
   */
  readonly document?: Document;
}

/** One live region and the write that is waiting for its microtask. */
interface Region {
  readonly element: HTMLElement;
  /** Bumped by every write, clear and dispose, so a stale microtask never writes. */
  generation: number;
}

interface AnnouncerState {
  readonly polite: Region;
  readonly assertive: Region;
}

/** One announcer per document. */
const ANNOUNCERS = new WeakMap<Document, AnnouncerState>();

/** The standard clip-rect pattern, inlined so this module has no component dependency. */
const HIDDEN_STYLE: Readonly<Record<string, string>> = {
  position: "absolute",
  border: "0",
  width: "1px",
  height: "1px",
  padding: "0",
  margin: "-1px",
  overflow: "hidden",
  clip: "rect(0, 0, 0, 0)",
  "white-space": "nowrap",
  "word-wrap": "normal",
};

function resolveDocument(doc: Document | undefined): Document | undefined {
  return doc ?? (typeof document === "undefined" ? undefined : document);
}

function createRegion(doc: Document, role: "status" | "alert", live: AnnouncePoliteness): Region {
  const element = doc.createElement("div");
  element.setAttribute("role", role);
  element.setAttribute("aria-live", live);
  element.setAttribute("aria-atomic", "true");
  element.setAttribute("data-primitives-live", "");
  for (const [name, value] of Object.entries(HIDDEN_STYLE)) element.style.setProperty(name, value);
  doc.body.append(element);
  return { element, generation: 0 };
}

function ensure(doc: Document): AnnouncerState | undefined {
  const known = ANNOUNCERS.get(doc);
  // A host app may have wiped the body (tests, route swaps); rebuild rather than speak into the void.
  if (known?.polite.element.isConnected && known.assertive.element.isConnected) {
    return known;
  }
  if (known !== undefined) removeState(doc, known);
  if (doc.body === null || doc.body === undefined) return undefined;
  const created: AnnouncerState = {
    polite: createRegion(doc, "status", "polite"),
    assertive: createRegion(doc, "alert", "assertive"),
  };
  ANNOUNCERS.set(doc, created);
  return created;
}

function removeState(doc: Document, state: AnnouncerState): void {
  for (const region of [state.polite, state.assertive]) {
    region.generation += 1;
    region.element.remove();
  }
  ANNOUNCERS.delete(doc);
}

/**
 * Announces `message` to screen readers through a visually hidden live region. There are no keys
 * and no focus change: the message is written to a `role="status"` region (`aria-live="polite"`) by
 * default, or to a `role="alert"` region (`aria-live="assertive"`) when `politeness` is
 * `"assertive"`. Announcing the same text twice in a row is read twice: the region is emptied
 * synchronously and the text is written in a microtask, which screen readers treat as a fresh
 * change. Callers need no timers. Without a document (on the server) it does nothing.
 *
 * @param message The text to read out.
 * @param options See {@link AnnounceOptions}.
 * @example
 * import { announce } from "@shadow-js/primitives";
 *
 * export function reportResults(count: number): void {
 *   announce(`${count} results available`);
 *   announce("Upload failed", { politeness: "assertive" });
 * }
 * @see {@link AnnounceOptions}
 * @see {@link clearAnnouncements}
 * @since 1.0.0
 */
export function announce(message: string, options: AnnounceOptions = {}): void {
  const doc = resolveDocument(options.document);
  if (doc === undefined) return;
  const state = ensure(doc);
  if (state === undefined) return;
  const region = options.politeness === "assertive" ? state.assertive : state.polite;
  region.generation += 1;
  const generation = region.generation;
  region.element.textContent = "";
  queueMicrotask((): void => {
    if (region.generation !== generation) return;
    region.element.textContent = message;
  });
}

/**
 * Empties both live regions and cancels announcements that have not been written yet. Use it when
 * a pending message is no longer true. It does nothing when the document has no regions yet. It has
 * no keys and no focus change.
 *
 * @param doc The document. Defaults to the global `document`.
 * @example
 * import { clearAnnouncements } from "@shadow-js/primitives";
 *
 * export function closeToast(): void {
 *   clearAnnouncements();
 * }
 * @see {@link announce}
 * @see {@link disposeAnnouncer}
 * @since 1.0.0
 */
export function clearAnnouncements(doc?: Document): void {
  const target = resolveDocument(doc);
  const state = target === undefined ? undefined : ANNOUNCERS.get(target);
  if (state === undefined) return;
  for (const region of [state.polite, state.assertive]) {
    region.generation += 1;
    region.element.textContent = "";
  }
}

/**
 * Removes the live regions of a document and cancels pending announcements. A later `announce`
 * creates new regions. Call it when the application tears down a document (tests, route swaps).
 *
 * @param doc The document. Defaults to the global `document`.
 * @example
 * import { disposeAnnouncer } from "@shadow-js/primitives";
 *
 * export function teardown(): void {
 *   disposeAnnouncer();
 * }
 * @see {@link announce}
 * @see {@link clearAnnouncements}
 * @since 1.0.0
 */
export function disposeAnnouncer(doc?: Document): void {
  const target = resolveDocument(doc);
  const state = target === undefined ? undefined : ANNOUNCERS.get(target);
  if (target === undefined || state === undefined) return;
  removeState(target, state);
}
