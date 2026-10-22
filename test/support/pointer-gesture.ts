/**
 * Gestures for the pointer-type coverage suites: a tap is what a finger or a pen produces on a
 * target (pointerdown, pointerup, then the click the browser synthesizes). A touch that scrolls
 * sends `pointercancel` and no click, which is what `scroll` models.
 */

import { flushSync } from "@shadow-js/core";
import { type PointerInit, pointer } from "./dom";

/** The pointer types a gesture can come from. */
export type GesturePointer = "mouse" | "touch" | "pen";

/** A complete tap: pointerdown, pointerup and the click that follows. Effects are flushed. */
export function tap(target: Element, pointerType: GesturePointer, init: PointerInit = {}): void {
  const full: PointerInit = { pointerType, ...init };
  pointer(target, "pointerdown", full);
  pointer(target, "pointerup", full);
  target.dispatchEvent(
    new MouseEvent("click", {
      bubbles: true,
      cancelable: true,
      composed: true,
      button: init.button ?? 0,
    }),
  );
  flushSync();
}

/** A touch that starts on `target` and is canceled by the browser (a scroll): no click follows. */
export function scrollCancel(target: Element, init: PointerInit = {}): void {
  pointer(target, "pointerdown", { pointerType: "touch", ...init });
  pointer(target, "pointercancel", { pointerType: "touch", ...init });
}
