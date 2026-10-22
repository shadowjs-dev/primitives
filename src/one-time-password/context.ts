/**
 * What the one-time password root shares with its slots. @internal
 */
import type { Accessor } from "@shadow-js/core";
import { createPartContext, type Direction, type PartContext } from "../utils/index";
import type { OneTimePasswordType } from "./logic";

/**
 * What a one-time password slot reads and does: the length, the value, the sanitizer, and how to commit, focus and register a slot.
 * @see {@link OneTimePasswordField}
 * @since 1.0.0
 */
export interface OneTimePasswordContextValue {
  readonly length: number;
  readonly type: OneTimePasswordType;
  readonly value: Accessor<string>;
  readonly sanitize: (text: string) => string;
  readonly hasFilter: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly dir: Accessor<Direction>;
  readonly autoComplete: string;
  /** Writes a new value; reports completion once when the value becomes full. */
  readonly commit: (next: string) => void;
  /** Moves focus to slot `index` (clamped to the slots). */
  readonly focusSlot: (index: number) => void;
  /** Register a unique slot while it is mounted; the root rejects indices outside its length. */
  readonly register: (index: number, element: HTMLInputElement) => void;
  /** Remove only the element this slot owned, so a stale cleanup cannot remove its replacement. */
  readonly unregister: (index: number, element: HTMLInputElement | undefined) => void;
}

/**
 * The context a `OneTimePasswordField` root provides to its parts. Read it in a custom part rendered inside the
 * root; reading it anywhere else throws. Accessibility: the context carries no ARIA of its own; the
 * built-in parts use it to keep their roles, labels and focus in step.
 *
 * @example
 * import { oneTimePasswordContext } from "@shadow-js/primitives";
 *
 * export function State() {
 *   const root = oneTimePasswordContext.use("State");
 *   return <span>{root.value()}</span>;
 * }
 * @see {@link OneTimePasswordField}
 * @since 1.0.0
 */
export const oneTimePasswordContext: PartContext<OneTimePasswordContextValue> =
  createPartContext<OneTimePasswordContextValue>("OneTimePasswordField");
