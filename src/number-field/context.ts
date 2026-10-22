import type { Accessor } from "@shadow-js/core";
import { createPartContext, type PartContext } from "../utils/index";

/**
 * What every number field part reads from its root. @internal
 * @see {@link NumberFieldRoot}
 */
export interface NumberFieldContextValue {
  /** The committed value, `null` when empty. Tracked. */
  readonly value: Accessor<number | null>;
  /** The text the input shows: the typed draft while editing, else the formatted value. Tracked. */
  readonly display: Accessor<string>;
  /** Replaces the draft with what the input holds. */
  readonly setDraft: (text: string) => void;
  /** Parses the draft, settles it and stores it (blur and Enter). */
  readonly commit: () => void;
  /** Drops the draft and shows the formatted value again. */
  readonly revert: () => void;
  /** Steps the value; returns whether it changed. */
  readonly step: (direction: 1 | -1, size: "small" | "normal" | "large") => boolean;
  /** Jumps to the minimum or maximum when defined; returns whether the key was used. */
  readonly jump: (to: "min" | "max") => boolean;
  readonly min: Accessor<number | undefined>;
  readonly max: Accessor<number | undefined>;
  readonly formatValue: (value: number) => string;
  readonly inputMode: Accessor<string>;
  readonly allowMouseWheel: Accessor<boolean>;
  readonly disabled: Accessor<boolean>;
  readonly readOnly: Accessor<boolean>;
  readonly required: Accessor<boolean>;
  /** Whether the user can change the value (not disabled, not read-only). */
  readonly interactive: Accessor<boolean>;
  readonly canIncrement: Accessor<boolean>;
  readonly canDecrement: Accessor<boolean>;
  /** The names of the steppers when they have no aria-label of their own. */
  readonly labels: Accessor<{ readonly increment: string; readonly decrement: string }>;
  /** The id of the input; the buttons point `aria-controls` at it. */
  readonly inputId: Accessor<string>;
  /** Tells the root the input's own `id` prop (an override of the generated id). */
  readonly setInputId: (id: string | undefined) => void;
  readonly setInput: (element: HTMLInputElement | undefined) => void;
  readonly focusInput: () => void;
  /** Whether the input has focus (the mouse wheel only acts then). */
  readonly isInputFocused: () => boolean;
}

/**
 * The context the number field root provides to its input and steppers. Read it only to build a
 * custom part of a number field; `use` throws when the part is outside a `NumberField`.
 * @since 1.0.0
 * @example
 * import { numberFieldContext } from "@shadow-js/primitives";
 *
 * export function FieldStatus() {
 *   const field = numberFieldContext.use("FieldStatus");
 *   return <output>{field.display()}</output>;
 * }
 * @see {@link NumberFieldContextValue}
 */
export const numberFieldContext: PartContext<NumberFieldContextValue> =
  createPartContext<NumberFieldContextValue>("NumberField");
