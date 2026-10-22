/**
 * Input modality: whether the last thing the user did was press a key or use a pointer. A menu
 * opened without an explicit trigger interaction (a context menu raised by the keyboard's menu key,
 * a menu that starts open) uses it to decide whether to highlight the first item.
 * @packageDocumentation
 */

interface Tracker {
  keyboard: boolean;
  count: number;
  stop: () => void;
}

/** One tracker per document, shared by every menu on it and removed with the last one. */
const trackers = new WeakMap<Document, Tracker>();

/**
 * What {@link trackModality} returns.
 * @since 1.0.0
 * @see {@link trackModality}
 */
export interface ModalityHandle {
  /** Whether the keyboard was the last input: true after a `keydown`, false after a pointer press or move. */
  isKeyboard(): boolean;
  /** Stops tracking; the document listeners go away with the last release. Safe to call twice. */
  release(): void;
}

/**
 * Starts tracking the input modality of `document`: a `keydown` marks the keyboard as the last
 * input, and a pointer press or move clears it. Capture listeners see the input before the page can
 * stop it. Call it from `onMount` and release it on cleanup.
 *
 * @param document The document to observe.
 * @returns The handle.
 * @example
 * import { onMount } from "@shadow-js/core";
 * import { trackModality } from "@shadow-js/primitives/menu";
 *
 * function InputWatcher(): void {
 *   onMount(() => {
 *     const modality = trackModality(document);
 *     return modality.release;
 *   });
 * }
 * @see {@link ModalityHandle}
 * @since 1.0.0
 */
export function trackModality(document: Document): ModalityHandle {
  let tracker = trackers.get(document);
  if (tracker === undefined) {
    const created: Tracker = { keyboard: false, count: 0, stop: () => undefined };
    const onKeyDown = (): void => {
      created.keyboard = true;
    };
    const onPointer = (): void => {
      created.keyboard = false;
    };
    document.addEventListener("keydown", onKeyDown, true);
    document.addEventListener("pointerdown", onPointer, true);
    document.addEventListener("pointermove", onPointer, true);
    created.stop = () => {
      document.removeEventListener("keydown", onKeyDown, true);
      document.removeEventListener("pointerdown", onPointer, true);
      document.removeEventListener("pointermove", onPointer, true);
    };
    trackers.set(document, created);
    tracker = created;
  }
  const active = tracker;
  active.count += 1;
  let released = false;
  return {
    isKeyboard: () => active.keyboard,
    release() {
      if (released) return;
      released = true;
      active.count -= 1;
      if (active.count === 0) {
        active.stop();
        trackers.delete(document);
      }
    },
  };
}
