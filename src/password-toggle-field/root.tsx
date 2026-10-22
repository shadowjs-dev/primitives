import { splitProps, useSignal } from "@shadow-js/core";
import type { JsxChild } from "@shadow-js/web/jsx-runtime";
import {
  createPartContext,
  mergeElementProps,
  type PartContext,
  Polymorphic,
  type PolymorphicProps,
  type PolymorphicTarget,
  partId,
  useBaseId,
  useControllableState,
} from "../utils/index";
import { partProps } from "../utils/part-props";

/**
 * What the root shares with its input and toggle. @internal
 * @see {@link PasswordToggleField}
 */
export interface PasswordToggleFieldContextValue {
  readonly visible: () => boolean;
  readonly setVisible: (next: boolean) => void;
  readonly disabled: () => boolean;
  /**
   * The id the rendered input has, which the toggle's `aria-controls` names. `undefined` while no
   * input is rendered, so the toggle never names an id that is not on the page. Tracked: it follows
   * the input's `id` prop and the input's mounting.
   */
  readonly inputId: () => string | undefined;
  /**
   * The input connects a reader of the id it renders with (the application's `id`, or the generated
   * one), or `undefined` when it unmounts. Connecting is a plain assignment, so the input can do it
   * while it renders (the server markup then has the id); `refreshInput` tells the toggle to read again.
   */
  readonly connectInput: (read: (() => string) | undefined) => void;
  /** Tells the toggle to read the connected input again (after mount and unmount). */
  readonly refreshInput: () => void;
  /** The id the input gets when the application gives it none. */
  readonly generatedInputId: () => string;
}

/**
 * The context a `PasswordToggleField` root provides to its parts. Read it in a custom part rendered inside the
 * root; reading it anywhere else throws. Accessibility: the context carries no ARIA of its own; the
 * built-in parts use it to keep their roles, labels and focus in step.
 *
 * @example
 * import { passwordToggleFieldContext } from "@shadow-js/primitives";
 *
 * export function State() {
 *   const root = passwordToggleFieldContext.use("State");
 *   return <span>{root.visible() ? "shown" : "hidden"}</span>;
 * }
 * @see {@link PasswordToggleField}
 * @since 1.0.0
 */
export const passwordToggleFieldContext: PartContext<PasswordToggleFieldContextValue> =
  createPartContext<PasswordToggleFieldContextValue>("PasswordToggleField");

/**
 * Own props of {@link PasswordToggleFieldRoot}, on top of the attributes of the `div` element.
 *
 * Accessibility: the toggle is a `button` with `aria-pressed` (true while the password is shown),
 * `aria-controls` naming the input while one is rendered, and the name "Show password" unless it has its own `aria-label`.
 * Keys: the toggle is a normal tab stop; Enter or Space (a click) flips the visibility.
 *
 * Data attributes: `data-state` (`"visible"` or `"hidden"`) on the root and on the toggle;
 * `data-disabled` (present, value `""`) on the root while disabled.
 * @since 1.0.0
 * @see {@link PasswordToggleFieldRoot}
 */
export interface PasswordToggleFieldOwnProps {
  /**
   * Controlled visibility: `true` shows the password as text. Clicks on the toggle only report the
   * change through `onVisibleChange`.
   * @default none (uncontrolled)
   */
  readonly visible?: boolean | undefined;
  /**
   * Whether the password is shown at first when uncontrolled.
   * @default false
   */
  readonly defaultVisible?: boolean | undefined;
  /**
   * Called when the user shows or hides the password.
   * @default none
   */
  readonly onVisibleChange?: ((visible: boolean) => void) | undefined;
  /**
   * Disables the input and the toggle; a click on a disabled toggle does nothing.
   * @default false
   */
  readonly disabled?: boolean | undefined;
}

/**
 * Props of {@link PasswordToggleFieldRoot}: the own props and the attributes of the chosen element.
 * @since 1.0.0
 * @see {@link PasswordToggleFieldOwnProps}
 */
export type PasswordToggleFieldProps<T extends PolymorphicTarget = "div"> = PolymorphicProps<
  "div",
  PasswordToggleFieldOwnProps,
  T
>;

type Loose = { readonly as?: PolymorphicTarget; readonly [prop: string]: unknown };

/**
 * A password input with a button that shows and hides it. The root owns the visibility; the input
 * is a `password` field until the toggle shows it as `text`. The toggle is a `button`
 * (`type="button"`, so it never submits a form) with `aria-pressed` and `aria-controls` naming the
 * input. Keys: Enter or Space on the toggle flips the visibility; Tab reaches it like any button.
 * Renders a `div`.
 *
 * @param props See {@link PasswordToggleFieldProps}.
 * @returns The `div` element with the input and the toggle inside.
 * @example
 * import { PasswordToggleField } from "@shadow-js/primitives";
 *
 * export function PasswordEntry() {
 *   return (
 *     <PasswordToggleField>
 *       <PasswordToggleField.Input />
 *       <PasswordToggleField.Toggle />
 *     </PasswordToggleField>
 *   );
 * }
 * @since 1.0.0
 * @see {@link PasswordToggleFieldOwnProps}
 */
export function PasswordToggleFieldRoot<T extends PolymorphicTarget = "div">(
  props: PasswordToggleFieldProps<T>,
): JsxChild {
  const [own, rest] = splitProps(partProps<Loose & PasswordToggleFieldOwnProps>(props), [
    "as",
    "visible",
    "defaultVisible",
    "onVisibleChange",
    "disabled",
    "children",
  ]);
  const [visible, setVisible] = useControllableState<boolean>({
    value: () => own.visible as boolean | undefined,
    defaultValue: () => own.defaultVisible === true,
    onChange: () => {
      const callback = own.onVisibleChange as ((visible: boolean) => void) | undefined;
      return callback === undefined
        ? undefined
        : (next) => {
            if (next !== undefined) callback(next);
          };
    },
    name: "PasswordToggleField visible",
  });
  const base = useBaseId(() => undefined);
  // The input's reader is a plain value (the input may render inside a memo, where signals cannot be
  // written); `inputRevision` is what the toggle tracks to read it again after the input mounts.
  let readInput: (() => string) | undefined;
  const [inputRevision, setInputRevision] = useSignal(0);
  const context: PasswordToggleFieldContextValue = {
    visible: () => visible(),
    setVisible: (next) => setVisible(next),
    disabled: () => own.disabled === true,
    inputId: () => {
      inputRevision();
      return readInput?.();
    },
    connectInput: (read) => {
      readInput = read;
    },
    refreshInput: () => setInputRevision((value) => value + 1),
    generatedInputId: () => partId(base(), "password"),
  };
  const merged = mergeElementProps(
    {
      get "data-state"() {
        return visible() ? "visible" : "hidden";
      },
      get "data-disabled"() {
        return own.disabled === true ? "" : undefined;
      },
    },
    rest,
  );
  return (
    <passwordToggleFieldContext.Provider value={context}>
      <Polymorphic as={own.as ?? "div"} {...merged}>
        {own.children as JsxChild}
      </Polymorphic>
    </passwordToggleFieldContext.Provider>
  );
}
