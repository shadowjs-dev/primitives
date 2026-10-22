/**
 * Press-and-hold auto-repeat for the increment and decrement buttons: one step at once, then a
 * repeat after {@link REPEAT_DELAY}ms and every {@link REPEAT_INTERVAL}ms. It uses a single
 * timer that is replaced on every tick, so `stop` always leaves nothing scheduled.
 * @packageDocumentation
 */

/**
 * Milliseconds between the first step and the first repeat of a held button.
 * @since 1.0.0
 * @example
 * import { REPEAT_DELAY } from "@shadow-js/primitives";
 *
 * export const firstRepeatAfter: number = REPEAT_DELAY; // 400
 * @see {@link REPEAT_INTERVAL}
 */
export const REPEAT_DELAY = 400;
/**
 * Milliseconds between repeats once a held button is repeating.
 * @since 1.0.0
 * @example
 * import { REPEAT_INTERVAL } from "@shadow-js/primitives";
 *
 * export const repeatEvery: number = REPEAT_INTERVAL; // 60
 * @see {@link REPEAT_DELAY}
 */
export const REPEAT_INTERVAL = 60;

/**
 * Controls of a {@link createRepeater}.
 * @since 1.0.0
 * @see {@link createRepeater}
 */
export interface Repeater {
  /** Steps once, then repeats while the button is held and a step still changes something. */
  start(): void;
  /** Cancels any scheduled repeat. Safe to call at any time, any number of times. */
  stop(): void;
}

/**
 * Creates a repeater around a step function. The number field's buttons use it: one step at once,
 * then a repeat after {@link REPEAT_DELAY} and every {@link REPEAT_INTERVAL}, until the step reports
 * that nothing changed or `stop` is called.
 *
 * @param step Performs one step and returns whether it changed anything; the repeat ends when it
 *   returns `false` (the bound was reached).
 * @returns `start` and `stop`.
 * @example
 * import { createRepeater } from "@shadow-js/primitives";
 *
 * let remaining = 3;
 * export const repeater = createRepeater(() => {
 *   // Returns false once nothing is left, which ends the repeat.
 *   if (remaining === 0) return false;
 *   remaining -= 1;
 *   return true;
 * });
 *
 * export function beginHold(): void {
 *   repeater.start();
 * }
 * @since 1.0.0
 * @see {@link Repeater}
 */
export function createRepeater(step: () => boolean): Repeater {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const stop = (): void => {
    if (timer === undefined) return;
    clearTimeout(timer);
    timer = undefined;
  };
  const tick = (): void => {
    timer = undefined;
    if (!step()) return;
    timer = setTimeout(tick, REPEAT_INTERVAL);
  };
  return {
    start() {
      stop();
      if (!step()) return;
      timer = setTimeout(tick, REPEAT_DELAY);
    },
    stop,
  };
}
