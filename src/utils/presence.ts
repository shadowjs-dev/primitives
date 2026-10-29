/**
 * Presence: keeps content mounted while its exit animation or transition runs, then unmounts it.
 * Enter is immediate; exit waits for `animationend` / `transitionend` (or their `cancel`
 * counterparts) when the element actually has one running, and unmounts at once when it does not,
 * so content never stays in the DOM just because a stylesheet declares a duration.
 * @packageDocumentation
 */
import { type Accessor, onCleanup, untrack, useEffect, useSignal } from "@shadow-js/core";

/**
 * What {@link usePresence} returns. It sets no ARIA attributes, no data attributes and no keys; the
 * caller renders the content (and its `data-state`, if any) while `mounted` is true.
 * @see {@link usePresence}
 * @since 1.0.0
 */
export interface Presence {
  /** Whether the content should be in the DOM. Tracked. */
  readonly mounted: Accessor<boolean>;
  /** Pass to the animated element's `ref`. */
  readonly ref: (element: HTMLElement) => void;
}

/** The longest time, in milliseconds, among the comma separated CSS durations plus their delays. */
function longestTiming(durations: string, delays: string): number {
  const toMs = (value: string): number => {
    const text = value.trim();
    if (text === "") return 0;
    const number = Number.parseFloat(text);
    if (Number.isNaN(number)) return 0;
    return text.endsWith("ms") ? number : number * 1000;
  };
  const durationList = durations.split(",");
  const delayList = delays.split(",");
  let longest = 0;
  for (let index = 0; index < durationList.length; index += 1) {
    const duration = toMs(durationList[index] ?? "");
    const total = duration + toMs(delayList[index % delayList.length] ?? "");
    if (duration > 0 && total > longest) longest = total;
  }
  return longest;
}

/** How long the exit of `element` can take in milliseconds, from its computed style. 0 = none. */
function exitDuration(element: HTMLElement): number {
  const style = (element.ownerDocument.defaultView ?? globalThis).getComputedStyle(element);
  const animation =
    style.animationName === "none" || style.animationName === ""
      ? 0
      : longestTiming(style.animationDuration, style.animationDelay);
  const transition =
    style.transitionProperty === "none"
      ? 0
      : longestTiming(style.transitionDuration, style.transitionDelay);
  return Math.max(animation, transition);
}

/** Whether the browser reports a running animation or transition on `element` (true when unknown). */
function hasRunningAnimation(element: HTMLElement): boolean {
  if (typeof element.getAnimations !== "function") return true;
  return element.getAnimations().length > 0;
}

/**
 * Tracks the presence of content that can animate out. Showing is immediate. Hiding keeps the
 * content mounted while its exit runs: if the element has an animation or transition that the browser
 * reports as running, the content unmounts when that ends (`animationend`, `transitionend` or their
 * `cancel` events, after every running animation has finished) or after a safety timer of its
 * duration plus 50 ms. Otherwise, or when the element is not connected, it unmounts at once. The
 * hook sets no ARIA attributes, data attributes or keys.
 *
 * @param present Whether the content should be shown. Tracked.
 * @returns `mounted` (render the content while it is true) and `ref` (attach to the content's
 *   root element so its animations can be observed). See {@link Presence}.
 * @example
 * import { usePresence } from "@shadow-js/primitives";
 * import { useSignal } from "@shadow-js/core";
 * import { Show } from "@shadow-js/web";
 *
 * export function Panel() {
 *   const [open, setOpen] = useSignal(false);
 *   const presence = usePresence(() => open());
 *   return (
 *     <Show when={presence.mounted()}>
 *       <div ref={presence.ref} data-state={open() ? "open" : "closed"}>
 *         <button onClick={() => setOpen(false)}>Close</button>
 *       </div>
 *     </Show>
 *   );
 * }
 * @see {@link Presence}
 * @since 1.0.0
 */
export function usePresence(present: () => boolean): Presence {
  const [mounted, setMounted] = useSignal<boolean>(untrack(present));
  let node: HTMLElement | undefined;
  let stopWaiting: (() => void) | undefined;

  const cancelExit = (): void => {
    stopWaiting?.();
    stopWaiting = undefined;
  };

  const startExit = (): void => {
    const element = node;
    if (element === undefined || !element.isConnected) {
      setMounted(false);
      return;
    }
    const duration = exitDuration(element);
    if (duration === 0 || !hasRunningAnimation(element)) {
      setMounted(false);
      return;
    }
    const finish = (): void => {
      cancelExit();
      setMounted(false);
    };
    const onEnd = (event: Event): void => {
      if (event.target !== element) return;
      // Several properties can transition: wait until the browser reports none left.
      if (typeof element.getAnimations === "function" && element.getAnimations().length > 0) return;
      finish();
    };
    const events = ["animationend", "animationcancel", "transitionend", "transitioncancel"];
    for (const name of events) element.addEventListener(name, onEnd);
    // Safety net: an event that never arrives (display:none mid-flight, interrupted transition)
    // must not leave the content mounted forever.
    const timer = setTimeout(finish, duration + 50);
    stopWaiting = () => {
      clearTimeout(timer);
      for (const name of events) element.removeEventListener(name, onEnd);
    };
  };

  useEffect(() => {
    if (present()) {
      cancelExit();
      setMounted(true);
      return;
    }
    if (untrack(mounted)) {
      cancelExit();
      startExit();
    }
  });
  onCleanup(cancelExit);

  return {
    mounted,
    ref(element: HTMLElement): void {
      node = element;
    },
  };
}
