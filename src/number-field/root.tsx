import { splitProps, untrack, useMemo, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { getDecimalCount } from "../slider/logic";
import {
  type Direction,
  HiddenInput,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  partId,
  useBaseId,
  useControllableState,
  useDirection,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { type NumberFieldContextValue, numberFieldContext } from "./context";
import { createNumberFormatter, DEFAULT_LOCALE } from "./number";
import { settleValue, stepValue } from "./step";

/**
 * The `inputmode` values the field can ask the virtual keyboard for.
 * @since 1.0.0
 * @see {@link NumberFieldOwnProps}
 */
export type NumberFieldInputMode =
  | "numeric"
  | "decimal"
  | "text"
  | "tel"
  | "search"
  | "email"
  | "url"
  | "none";

/**
 * Own props of {@link NumberFieldRoot}, on top of the attributes of the wrapper `div`.
 *
 * Accessibility: the value lives on the input, which has `role="spinbutton"` (see
 * {@link NumberFieldInput}); the steppers are named "Increment" and "Decrement" unless they have an
 * `aria-label` or `messages` names them. The steppers are not tab stops. Keys: ArrowUp and
 * ArrowDown step, Shift or PageUp and PageDown step by `largeStep`, Alt steps by `smallStep`, Home and
 * End jump to `min` and `max`, Enter commits the typed text.
 *
 * Data attributes: `data-disabled` (present, value `""`) and `data-readonly` (present, value `""`) on
 * the wrapper, and `dir` with the resolved direction. The steppers carry `data-disabled` when they
 * cannot step, and the input carries `data-disabled` and `data-readonly` in the same way.
 * @since 1.0.0
 * @see {@link NumberFieldRoot}
 */
export interface NumberFieldOwnProps {
  /**
   * Controlled value; `null` is a controlled empty field. A controlled field shows what the
   * application stores here.
   * @default none (uncontrolled)
   */
  readonly value?: number | null | undefined;
  /**
   * Initial value when uncontrolled.
   * @default null (empty)
   */
  readonly defaultValue?: number | null | undefined;
  /**
   * Called with the new value, or `null` when the field was emptied.
   * @default none
   */
  readonly onValueChange?: ((value: number | null) => void) | undefined;
  /**
   * Smallest value. The ArrowDown key and the decrement button stop here; typed values are pulled
   * up to it on blur when `clampValueOnBlur` is on.
   * @default none (no lower bound)
   */
  readonly min?: number | undefined;
  /**
   * Largest value. The ArrowUp key and the increment button stop here; typed values are pulled
   * down to it on blur when `clampValueOnBlur` is on.
   * @default none (no upper bound)
   */
  readonly max?: number | undefined;
  /**
   * Amount of the Arrow keys and the buttons. When given, typed values also snap to the step grid
   * (counted from `min`, or 0); without it any decimal can be typed. A value that is not a positive
   * finite number counts as `1`.
   * @default 1
   */
  readonly step?: number | undefined;
  /**
   * Amount of Alt+Arrow.
   * @default step
   */
  readonly smallStep?: number | undefined;
  /**
   * Amount of PageUp, PageDown and Shift+Arrow.
   * @default 10 * step
   */
  readonly largeStep?: number | undefined;
  /**
   * BCP 47 tag used to format and parse. Fixed (not the browser's) so server and client agree.
   * @default "en-US"
   */
  readonly locale?: string | undefined;
  /**
   * `Intl.NumberFormat` options: currency, percent, unit, fraction digits...
   * @default none (the locale's decimal style)
   */
  readonly formatOptions?: Intl.NumberFormatOptions | undefined;
  /**
   * Whether the mouse wheel changes the value while the input is focused.
   * @default false
   */
  readonly allowMouseWheel?: boolean | undefined;
  /**
   * Whether typed values are pulled into `[min, max]` on blur and Enter. With `false` an
   * out-of-range value is kept and the input gets `aria-invalid="true"`.
   * @default true
   */
  readonly clampValueOnBlur?: boolean | undefined;
  /**
   * Disables the field, its steppers and its form value.
   * @default false
   */
  readonly disabled?: boolean | undefined;
  /**
   * The value can be read and copied but not changed; the steppers stay disabled.
   * @default false
   */
  readonly readOnly?: boolean | undefined;
  /**
   * Sets `required` on the input, so an empty field fails native form validation.
   * @default false
   */
  readonly required?: boolean | undefined;
  /**
   * Form field name. When given, a hidden input submits the plain number (not the formatted text).
   * @default none (nothing is submitted)
   */
  readonly name?: string | undefined;
  /**
   * Id of the `<form>` the field belongs to when it is not a descendant of one.
   * @default none
   */
  readonly form?: string | undefined;
  /**
   * Reading direction of the root.
   * @default none (inherits the `DirectionProvider`, then the document, then `"ltr"`)
   */
  readonly dir?: Direction | undefined;
  /**
   * Virtual keyboard hint on the input. Without it the input is `"numeric"` when the format has no
   * fraction digits and the steps are whole numbers, `"decimal"` otherwise.
   * @default none (computed from the format and the steps)
   */
  readonly inputMode?: NumberFieldInputMode | undefined;
  /**
   * Names of the steppers when they have no `aria-label` of their own. Pass translated words here to
   * localize them.
   * @default { increment: "Increment", decrement: "Decrement" }
   */
  readonly messages?: NumberFieldMessages | undefined;
}

/**
 * The default names of the steppers, overridable for localization.
 * @since 1.0.0
 * @see {@link NumberFieldOwnProps}
 */
export interface NumberFieldMessages {
  /**
   * Name of the increment button.
   * @default "Increment"
   */
  readonly increment?: string | undefined;
  /**
   * Name of the decrement button.
   * @default "Decrement"
   */
  readonly decrement?: string | undefined;
}

/**
 * Props of {@link NumberFieldRoot}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link NumberFieldOwnProps}
 */
export type NumberFieldProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  NumberFieldOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * A text field for numbers that follows the WAI-ARIA spinbutton pattern. The input
 * (`NumberField.Input`) shows the value formatted for the `locale` and the `formatOptions`
 * (currency, percent, unit...); while the user types, the raw text is kept, and on blur or Enter
 * it is parsed leniently (locale digits, separators, signs, symbols), rounded to the displayed
 * precision, clamped, snapped to `step` when one was given, and shown formatted again.
 *
 * Keys (on the input): ArrowUp and ArrowDown step by `step`, Shift or PageUp and PageDown by
 * `largeStep`, Alt by `smallStep`, Home and End jump to `min` and `max`, Enter commits. ARIA: the
 * input has `role="spinbutton"` with `aria-valuenow` (absent when empty), `aria-valuemin`,
 * `aria-valuemax` and `aria-valuetext`; the steppers are named and point `aria-controls` at it.
 *
 * Controlled with `value` / `onValueChange`, or uncontrolled with `defaultValue`. With a `name`
 * the plain number goes into a hidden input, so `FormData` receives `1234.5`, not `1.234,5`.
 *
 * @param props See {@link NumberFieldProps}.
 * @returns The wrapper element, with the hidden form input after it when `name` is set.
 * @example
 * import { NumberField } from "@shadow-js/primitives";
 *
 * export function BudgetField() {
 *   return (
 *     <NumberField
 *       defaultValue={1200}
 *       min={0}
 *       max={5000}
 *       step={50}
 *       formatOptions={{ style: "currency", currency: "USD" }}
 *     >
 *       <NumberField.Decrement aria-label="Decrease budget">-</NumberField.Decrement>
 *       <NumberField.Input aria-label="Budget" />
 *       <NumberField.Increment aria-label="Increase budget">+</NumberField.Increment>
 *     </NumberField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link NumberFieldInput}
 */
export function NumberFieldRoot<T extends PolymorphicTarget = "div">(
  props: NumberFieldProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose>(props), [
    "as",
    "value",
    "defaultValue",
    "onValueChange",
    "min",
    "max",
    "messages",
    "step",
    "smallStep",
    "largeStep",
    "locale",
    "formatOptions",
    "allowMouseWheel",
    "clampValueOnBlur",
    "disabled",
    "readOnly",
    "required",
    "name",
    "form",
    "dir",
    "inputMode",
  ]);
  const min = (): number | undefined => own.min as number | undefined;
  const max = (): number | undefined => own.max as number | undefined;
  const step = (): number => {
    const given = own.step as number | undefined;
    return given !== undefined && given > 0 && Number.isFinite(given) ? given : 1;
  };
  const smallStep = (): number => (own.smallStep as number | undefined) ?? step();
  const largeStep = (): number =>
    (own.largeStep as number | undefined) ??
    // Ten steps without floating point noise: 10 * 0.1 is 1, but 10 * 0.07 is 0.7000000000000001.
    Number((step() * 10).toFixed(getDecimalCount(step())));
  const disabled = (): boolean => own.disabled === true;
  const readOnly = (): boolean => own.readOnly === true;
  const interactive = (): boolean => !disabled() && !readOnly();
  const dir = useDirection(() => own.dir as Direction | undefined);

  const formatter = useMemo(() =>
    createNumberFormatter(
      (own.locale as string | undefined) ?? DEFAULT_LOCALE,
      own.formatOptions as Intl.NumberFormatOptions | undefined,
    ),
  );

  const [value, setValue] = useControllableState<number | null>({
    value: () => {
      const given = own.value as number | null | undefined;
      return given === undefined ? undefined : given === null || Number.isNaN(given) ? null : given;
    },
    defaultValue: () => {
      const given = own.defaultValue as number | null | undefined;
      return given === undefined || given === null || Number.isNaN(given) ? null : given;
    },
    onChange: () => own.onValueChange as ((value: number | null) => void) | undefined,
    name: "NumberField value",
  });

  const [draft, setDraftSignal] = useSignal<string | undefined>(undefined);
  const display = (): string => {
    const typed = draft();
    if (typed !== undefined) return typed;
    const current = value();
    return current === null ? "" : formatter().format(current);
  };

  const constraints = () => ({
    min: min(),
    max: max(),
    step: step(),
    snap: own.step !== undefined,
    fractionDigits: formatter().maximumFractionDigits,
    clamp: own.clampValueOnBlur !== false,
  });

  /** The number the draft stands for; `undefined` when there is no draft or it is not a number. */
  const draftNumber = (): number | null | undefined => {
    const typed = untrack(draft);
    if (typed === undefined) return undefined;
    return typed.trim() === "" ? null : (untrack(formatter).parse(typed) ?? undefined);
  };

  const commit = (): void => {
    if (untrack(draft) === undefined) return;
    // Read the text before dropping it: the parse happens against the draft.
    const parsed = draftNumber();
    setDraftSignal(undefined);
    if (!interactive()) return;
    // Text that is not a number is dropped: the field shows the last good value again.
    if (parsed === undefined) return;
    setValue(parsed === null ? null : settleValue(parsed, constraints()));
  };

  const stepBy = (direction: 1 | -1, size: "small" | "normal" | "large"): boolean => {
    if (!interactive()) return false;
    const typed = draftNumber();
    const current = untrack(value);
    const base = typed === undefined ? current : typed;
    const amount = size === "large" ? largeStep() : size === "small" ? smallStep() : step();
    const next = stepValue(base, direction, amount, min(), max());
    setDraftSignal(undefined);
    setValue(next);
    return next !== current;
  };

  const jump = (to: "min" | "max"): boolean => {
    const target = to === "min" ? min() : max();
    if (!interactive() || target === undefined) return false;
    setDraftSignal(undefined);
    setValue(target);
    return true;
  };

  const above = (): boolean => {
    const current = value();
    return current === null || max() === undefined || current < (max() ?? current);
  };
  const below = (): boolean => {
    const current = value();
    return current === null || min() === undefined || current > (min() ?? current);
  };

  /** What a form receives: the plain number, never the formatted text. */
  const submitted = (): string => {
    const current = value();
    return current === null ? "" : String(current);
  };

  const base = useBaseId();
  const [inputIdOverride, setInputIdOverride] = useSignal<string | undefined>(undefined);
  let input: HTMLInputElement | undefined;

  const context: NumberFieldContextValue = {
    value,
    display,
    labels: () => {
      const messages = own["messages"] as NumberFieldMessages | undefined;
      return {
        increment: messages?.increment ?? "Increment",
        decrement: messages?.decrement ?? "Decrement",
      };
    },
    setDraft: (text) => setDraftSignal(text),
    commit,
    revert: () => setDraftSignal(undefined),
    step: stepBy,
    jump,
    min,
    max,
    formatValue: (number) => formatter().format(number),
    inputMode: () => {
      const given = own.inputMode as NumberFieldInputMode | undefined;
      if (given !== undefined) return given;
      const whole =
        formatter().maximumFractionDigits === 0 &&
        [step(), smallStep(), largeStep()].every((amount) => getDecimalCount(amount) === 0);
      return whole ? "numeric" : "decimal";
    },
    allowMouseWheel: () => own.allowMouseWheel === true,
    disabled,
    readOnly,
    required: () => own.required === true,
    interactive,
    canIncrement: () => interactive() && above(),
    canDecrement: () => interactive() && below(),
    inputId: () => inputIdOverride() ?? partId(base(), "input"),
    setInputId: (id) => setInputIdOverride(id),
    setInput: (element) => {
      input = element;
    },
    focusInput: () => input?.focus({ preventScroll: true }),
    isInputFocused: () => input !== undefined && input.ownerDocument.activeElement === input,
  };

  const merged = mergeElementProps(
    {
      get dir() {
        return dir();
      },
      get "data-disabled"() {
        return disabled() ? "" : undefined;
      },
      get "data-readonly"() {
        return readOnly() ? "" : undefined;
      },
    },
    rest,
  );

  return (
    <numberFieldContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged} />
      <HiddenInput
        type="hidden"
        name={own.name as string | undefined}
        value={submitted()}
        disabled={disabled()}
        form={own.form as string | undefined}
        onReset={() => {
          setDraftSignal(undefined);
          const given = own.defaultValue as number | null | undefined;
          setValue(given === undefined || Number.isNaN(given) ? null : given);
        }}
      />
    </numberFieldContext.Provider>
  );
}
