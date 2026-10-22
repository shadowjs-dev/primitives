import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import type { PolymorphicTarget } from "../utils/index";
import { NumberFieldInput } from "./input";
import { type NumberFieldProps, NumberFieldRoot } from "./root";
import { NumberFieldDecrement, NumberFieldIncrement } from "./stepper";

export type { NumberFieldContextValue } from "./context";
export { numberFieldContext } from "./context";
export type { NumberFieldInputProps } from "./input";
export type { NumberFormatter } from "./number";
export { createNumberFormatter, DEFAULT_LOCALE, formatNumber, parseNumber } from "./number";
export type { Repeater } from "./repeater";
export { createRepeater, REPEAT_DELAY, REPEAT_INTERVAL } from "./repeater";
export type {
  NumberFieldInputMode,
  NumberFieldMessages,
  NumberFieldOwnProps,
  NumberFieldProps,
} from "./root";
export type { StepConstraints } from "./step";
export { addDecimal, settleValue, stepValue } from "./step";
export type { NumberFieldDecrementProps, NumberFieldIncrementProps } from "./stepper";
export { NumberFieldDecrement, NumberFieldIncrement, NumberFieldInput, NumberFieldRoot };

/**
 * The number field primitive: `NumberField`, `NumberField.Input`, `NumberField.Increment` and
 * `NumberField.Decrement`. Each part is also exported by name (`NumberFieldRoot`,
 * `NumberFieldInput`, ...) for tree shaking. Keys (on the input): ArrowUp and ArrowDown step,
 * Shift or PageUp and PageDown step by `largeStep`, Alt steps by `smallStep`, Home and End jump to
 * the bounds, Enter commits. ARIA: the input is a `role="spinbutton"` with `aria-valuenow`,
 * `aria-valuemin`, `aria-valuemax` and `aria-valuetext`; the steppers are not tab stops.
 *
 * @example
 * import { NumberField } from "@shadow-js/primitives";
 *
 * export function QuantityStepper() {
 *   return (
 *     <NumberField defaultValue={3} min={0} max={10}>
 *       <NumberField.Decrement aria-label="Less">-</NumberField.Decrement>
 *       <NumberField.Input aria-label="Quantity" />
 *       <NumberField.Increment aria-label="More">+</NumberField.Increment>
 *     </NumberField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NumberFieldRoot}
 */
export const NumberField: typeof NumberFieldRoot & {
  readonly Input: typeof NumberFieldInput;
  readonly Increment: typeof NumberFieldIncrement;
  readonly Decrement: typeof NumberFieldDecrement;
} = Object.assign(
  <T extends PolymorphicTarget = "div">(props: NumberFieldProps<T>): JsxChild =>
    NumberFieldRoot(props),
  {
    Input: NumberFieldInput,
    Increment: NumberFieldIncrement,
    Decrement: NumberFieldDecrement,
  },
);
