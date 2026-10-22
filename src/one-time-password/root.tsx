import { splitProps, untrack } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import { filterOtp, otpIndex } from "../internal/otp-filter";
import {
  composeRefs,
  type Direction,
  HiddenInput,
  type HiddenInputProps,
  mergeElementProps,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  useControllableState,
  useRefSignal,
} from "../utils/index";
import { partProps } from "../utils/part-props";
import { useDirectionAround } from "../utils/portal-direction";
import { type OneTimePasswordContextValue, oneTimePasswordContext } from "./context";
import type { OneTimePasswordType } from "./logic";
import type { OneTimePasswordCharacterFilter } from "./pattern";

/**
 * Own props of {@link OneTimePasswordFieldRoot}, on top of the attributes of the `div` element.
 *
 * Accessibility: the root is a `role="group"`; give it an `aria-label` (for example "Verification
 * code"). Each slot is an `input` named "Digit n of N" (or "Character n of N" when `type` is
 * `"alphanumeric"`) unless the slot has its own `aria-label`; the first slot has `autocomplete`
 * `"one-time-code"`, so the OS can fill the code. Keys: a printable character fills the focused slot
 * and moves on, Backspace clears the slot and steps back from an empty one, Delete clears the slot,
 * ArrowLeft and ArrowRight (swapped when `dir` is `"rtl"`) and Home and End move between slots.
 *
 * Data attributes: `data-disabled` (present, value `""`) on the root. Each slot carries `data-index`
 * (its position, from `0`) and the native `disabled` attribute while the field is disabled.
 * @since 1.0.0
 * @see {@link OneTimePasswordFieldRoot}
 */
export interface OneTimePasswordFieldOwnProps {
  /**
   * The number of slots, an integer from 1 to 64, fixed when the root mounts.
   * @default 6
   */
  readonly length?: number | undefined;
  /**
   * Controlled value. Its length is at most `length`.
   * @default none (uncontrolled)
   */
  readonly value?: string | undefined;
  /**
   * The value when uncontrolled.
   * @default "" (empty)
   */
  readonly defaultValue?: string | undefined;
  /**
   * Called with the value after every change.
   * @default none
   */
  readonly onValueChange?: ((value: string) => void) | undefined;
  /**
   * Called each time the value becomes full (`length` characters), not on every edit of a full value.
   * @default none
   */
  readonly onComplete?: ((value: string) => void) | undefined;
  /**
   * `"numeric"` accepts digits; `"alphanumeric"` also accepts ASCII letters. Numeric slots use
   * `inputmode="numeric"`. Arabic-Indic and Persian digits normalize to Western digits.
   * @default "numeric"
   */
  readonly type?: OneTimePasswordType | undefined;
  /**
   * A character predicate, called untracked after digit normalization. Overrides `type` filtering.
   * Use `createOneTimePasswordPattern` to compile a regular expression source.
   * @default undefined (use `type`)
   */
  readonly filter?: OneTimePasswordCharacterFilter | undefined;
  /**
   * Disables every slot.
   * @default false
   */
  readonly disabled?: boolean | undefined;
  /**
   * Form field name. When set, a hidden input with this name carries the whole value to a form.
   * @default none (nothing is submitted)
   */
  readonly name?: string | undefined;
  /**
   * The `autocomplete` of the first slot. The default lets the OS fill the code from a text message.
   * @default "one-time-code"
   */
  readonly autoComplete?: string | undefined;
  /**
   * Reading direction; `"rtl"` swaps the arrow keys.
   * @default none (inherits the `DirectionProvider`, then the document, then `"ltr"`)
   */
  readonly dir?: Direction | undefined;
}

/**
 * Props of {@link OneTimePasswordFieldRoot}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link OneTimePasswordFieldOwnProps}
 */
export type OneTimePasswordFieldProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  OneTimePasswordFieldOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

const DEFAULT_LENGTH = 6;

/**
 * A one-time code split into slots, one character per {@link OneTimePasswordFieldInput}. Typing
 * fills the slot and moves on, Backspace and Delete remove, the arrow keys (and Home and End) move
 * between slots, and a paste or an OS autofill spreads its characters over the slots. Only the
 * characters the `type` or `filter` accepts are kept. Edits inspect at most 4,096 UTF-16 units;
 * controls and surrogate pairs are refused. Renders a `div` with `role="group"`; name it with
 * `aria-label`. Each slot is named "Digit n of N" (or "Character n of N").
 *
 * @param props See {@link OneTimePasswordFieldProps}.
 * @returns The `div` element with the slots (its children) and the hidden form input when `name` is set.
 * @throws RangeError for a length outside 1 to 64.
 * @example
 * import { OneTimePasswordField } from "@shadow-js/primitives";
 *
 * export function VerificationCode() {
 *   return (
 *     <OneTimePasswordField
 *       length={6}
 *       onComplete={(code) => console.info("complete", code)}
 *       aria-label="Verification code"
 *     >
 *       {[0, 1, 2, 3, 4, 5].map((index) => (
 *         <OneTimePasswordField.Input index={index} />
 *       ))}
 *     </OneTimePasswordField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link OneTimePasswordFieldInput}
 */
export function OneTimePasswordFieldRoot<T extends PolymorphicTarget = "div">(
  props: OneTimePasswordFieldProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & OneTimePasswordFieldOwnProps>(props), [
    "as",
    "length",
    "value",
    "defaultValue",
    "onValueChange",
    "onComplete",
    "type",
    "filter",
    "disabled",
    "name",
    "autoComplete",
    "dir",
    "children",
  ]);
  const length = (own.length as number | undefined) ?? DEFAULT_LENGTH;
  if (!Number.isInteger(length) || length < 1 || length > 64)
    throw new RangeError(
      __DEV__
        ? "OneTimePasswordField length must be an integer from 1 to 64."
        : "PRIMITIVES_OTP_LENGTH",
    );
  const type = (): OneTimePasswordType =>
    (own.type as OneTimePasswordType | undefined) ?? "numeric";
  const defaultValue = (): string => (own.defaultValue as string | undefined) ?? "";
  const [value, setValue] = useControllableState<string>({
    value: () => own.value as string | undefined,
    defaultValue,
    onChange: () => own.onValueChange as ((value: string) => void) | undefined,
    ...(__DEV__ ? { name: "OneTimePasswordField value" } : {}),
  });
  const [root, setRoot] = useRefSignal<HTMLElement>();
  // Direction falls back to the nearest ancestor with a dir attribute, so a wrapper dir="rtl" applies.
  const dir = useDirectionAround(() => own.dir as Direction | undefined, root);
  // Registration validates indices, so only mounted slots allocate storage, bounded by length.
  const slots: (HTMLInputElement | undefined)[] = [];
  const filter = (text: string): string =>
    filterOtp(text, type(), own.filter as OneTimePasswordCharacterFilter | undefined, length);
  const currentValue = (): string => filter(value());

  const commit = (next: string): void => {
    const previous = currentValue();
    if (next === previous) return;
    setValue(next);
    if (next.length === length && previous.length !== length) {
      untrack(() => (own.onComplete as ((value: string) => void) | undefined)?.(next));
    }
  };

  const focusSlot = (index: number): void => {
    const target = Math.min(Math.max(0, index), length - 1);
    slots[target]?.focus();
  };

  const context: OneTimePasswordContextValue = {
    length,
    get type() {
      return type();
    },
    value: currentValue,
    sanitize: filter,
    hasFilter: () => own.filter !== undefined,
    disabled: () => own.disabled === true,
    dir,
    autoComplete: (own.autoComplete as string | undefined) ?? "one-time-code",
    commit,
    focusSlot,
    register(index, element) {
      otpIndex(index, length);
      const existing = slots[index];
      if (existing !== undefined && existing !== element)
        throw new RangeError(
          __DEV__
            ? "OneTimePasswordField index is already registered."
            : "PRIMITIVES_OTP_DUPLICATE",
        );
      slots[index] = element;
    },
    unregister(index, element) {
      if (slots[index] === element) delete slots[index];
    },
  };

  // The hidden input reads its value in an effect: a getter keeps it current.
  const hidden: HiddenInputProps = {
    type: "hidden",
    get disabled() {
      return context.disabled();
    },
    onReset() {
      setValue(filter(defaultValue()));
    },
    get name() {
      return own.name as string | undefined;
    },
    get value() {
      return currentValue();
    },
  };
  const merged = mergeElementProps(
    {
      role: "group",
      get dir() {
        return own.dir as Direction | undefined;
      },
      get "data-disabled"() {
        return context.disabled() ? "" : undefined;
      },
      ref: composeRefs<HTMLElement>((node) => {
        setRoot(node);
      }),
    },
    rest,
  );
  return (
    <oneTimePasswordContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged}>
        {own.children as JsxChild}
        {HiddenInput(hidden)}
      </Polymorphic>
    </oneTimePasswordContext.Provider>
  );
}
